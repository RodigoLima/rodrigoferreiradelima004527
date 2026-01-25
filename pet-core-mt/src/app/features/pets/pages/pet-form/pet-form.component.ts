import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { PetDetail } from '../../models/pet.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';

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

  petForm!: FormGroup;
  isLoading = signal(false);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);
  petId = signal<number | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);

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
        if (pet.foto?.url) {
          this.previewUrl.set(pet.foto.url);
        }
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar dados do pet');
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
    this.errorMessage.set(null);

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
          this.uploadPhoto(petIdToUse);
        } else {
          this.router.navigate(['/pets', petIdToUse]);
        }
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Erro ao salvar pet. Verifique os dados e tente novamente.'
        );
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
        this.router.navigate(['/pets', petId]);
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Pet salvo, mas houve erro ao fazer upload da foto.'
        );
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
