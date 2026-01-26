import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, switchMap } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { PetDetail } from '../../models/pet.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-pet-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule
  ],
  templateUrl: './pet-form.component.html',
  styleUrl: './pet-form.component.scss'
})
export class PetFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private petsFacade = inject(PetsFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  @ViewChild('fotoInput') fotoInput?: ElementRef<HTMLInputElement>;

  petForm!: FormGroup;
  isLoading = signal(false);
  isUploading = signal(false);
  petId = signal<number | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  currentPhotoId = signal<number | null>(null);
  currentPhotoUrl = signal<string | null>(null);
  removeCurrentPhotoOnSave = signal(false);

  ngOnInit(): void {
    this.petForm = this.fb.group({
      nome: ['', [Validators.required]],
      raca: ['', [Validators.required]],
      idade: [null, [Validators.min(0)]]
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.petId.set(parseInt(id, 10));
      this.loadPet();
    }
  }

  loadPet(): void {
    const id = this.petId();
    if (!id) return;

    this.isLoading.set(true);
    this.petsFacade.fetchPetDetail(id).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (pet: PetDetail) => {
        this.petForm.patchValue({
          nome: pet.nome,
          raca: pet.raca,
          idade: pet.idade ?? null
        });
        this.currentPhotoId.set(pet.foto?.id ?? null);
        if (pet.foto?.url) {
          this.currentPhotoUrl.set(pet.foto.url);
          this.previewUrl.set(pet.foto.url);
        } else {
          this.currentPhotoUrl.set(null);
        }
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do pet'
        });
      }
    });
  }

  clearSelectedPhoto(): void {
    if (!this.selectedFile()) return;

    this.selectedFile.set(null);
    if (this.fotoInput?.nativeElement) {
      this.fotoInput.nativeElement.value = '';
    }
    if (this.removeCurrentPhotoOnSave()) {
      this.previewUrl.set(null);
      return;
    }
    this.previewUrl.set(this.currentPhotoUrl());
  }

  toggleRemoveCurrentPhoto(): void {
    const petId = this.petId();
    const fotoId = this.currentPhotoId();
    if (!petId || !fotoId || this.isLoading() || this.isUploading() || this.selectedFile()) return;

    if (this.removeCurrentPhotoOnSave()) {
      this.removeCurrentPhotoOnSave.set(false);
      this.previewUrl.set(this.currentPhotoUrl());
      return;
    }

    this.confirmationService.confirm({
      header: 'Remover foto',
      message: 'A foto será removida após salvar. Deseja continuar?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Confirmar',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.removeCurrentPhotoOnSave.set(true);
        this.previewUrl.set(null);
      }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];
      this.selectedFile.set(file);

      const reader = new FileReader();
      reader.onload = (e) => {
        this.previewUrl.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.petForm.invalid) {
      this.markFormGroupTouched(this.petForm);
      return;
    }

    this.isLoading.set(true);

    const formValue = this.petForm.value;
    const petData = {
      nome: formValue.nome,
      raca: formValue.raca,
      idade: formValue.idade !== null && formValue.idade !== '' ? Number(formValue.idade) : undefined
    };
    const id = this.petId();

    const operation = id
      ? this.petsFacade.updatePet(id, petData)
      : this.petsFacade.createPet(petData);

    operation.pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (pet) => {
        const petIdToUse = id || pet.id;
        if (this.selectedFile()) {
          if (id && this.removeCurrentPhotoOnSave() && this.currentPhotoId()) {
            this.replacePhotoAfterSave(petIdToUse, this.currentPhotoId()!);
          } else {
            this.uploadPhoto(petIdToUse);
          }
        } else if (id && this.removeCurrentPhotoOnSave() && this.currentPhotoId()) {
          this.deleteCurrentPhotoAfterSave(petIdToUse, this.currentPhotoId()!);
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Pet salvo com sucesso!'
          });
          this.router.navigate(['/pets', petIdToUse]);
        }
      },
      error: (error: unknown) => {
        const detail =
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Erro ao salvar pet. Verifique os dados e tente novamente.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
      }
    });
  }

  replacePhotoAfterSave(petId: number, oldFotoId: number): void {
    const file = this.selectedFile();
    if (!file) {
      this.router.navigate(['/pets', petId]);
      return;
    }

    this.isUploading.set(true);
    this.petsFacade.deletePetPhoto(petId, oldFotoId).pipe(
      switchMap(() => this.petsFacade.uploadPetPhoto(petId, file)),
      finalize(() => this.isUploading.set(false))
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Pet salvo com sucesso!'
        });
        this.router.navigate(['/pets', petId]);
      },
      error: (error: unknown) => {
        const detail =
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Pet salvo, mas houve erro ao atualizar a foto.';
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail });
        setTimeout(() => {
          this.router.navigate(['/pets', petId]);
        }, 2000);
      }
    });
  }

  deleteCurrentPhotoAfterSave(petId: number, fotoId: number): void {
    this.isUploading.set(true);
    this.petsFacade.deletePetPhoto(petId, fotoId).pipe(
      finalize(() => this.isUploading.set(false))
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Pet salvo com sucesso!'
        });
        this.router.navigate(['/pets', petId]);
      },
      error: (error: unknown) => {
        const detail =
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Pet salvo, mas houve erro ao remover a foto.';
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail });
        setTimeout(() => {
          this.router.navigate(['/pets', petId]);
        }, 2000);
      }
    });
  }

  uploadPhoto(petId: number): void {
    const file = this.selectedFile();
    if (!file) {
      this.router.navigate(['/pets', petId]);
      return;
    }

    this.isUploading.set(true);
    this.petsFacade.uploadPetPhoto(petId, file).pipe(
      finalize(() => this.isUploading.set(false))
    ).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Pet salvo com sucesso!'
        });
        this.router.navigate(['/pets', petId]);
      },
      error: (error: unknown) => {
        const detail =
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Pet salvo, mas houve erro ao fazer upload da foto.';
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail });
        setTimeout(() => {
          this.router.navigate(['/pets', petId]);
        }, 2000);
      }
    });
  }

  cancel(): void {
    const id = this.petId();
    if (id) {
      this.router.navigate(['/pets', id]);
    } else {
      this.router.navigate(['/pets']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }
}
