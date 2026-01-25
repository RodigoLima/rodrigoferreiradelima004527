import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject, debounce, timer, distinctUntilChanged, takeUntil } from 'rxjs';
import { TutoresFacade } from '../../services/tutores.facade';
import { TutorDetail } from '../../models/tutor.models';
import { PetsFacade } from '../../../pets/services/pets.facade';
import { Pet } from '../../../pets/models/pet.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { PhoneMaskDirective } from '../../../../shared/forms/phone-mask.directive';
import { CpfMaskDirective } from '../../../../shared/forms/cpf-mask.directive';

@Component({
  selector: 'app-tutor-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    DialogModule,
    PhoneMaskDirective,
    CpfMaskDirective
  ],
  templateUrl: './tutor-form.component.html',
  styleUrl: './tutor-form.component.scss'
})
export class TutorFormComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private tutoresFacade = inject(TutoresFacade);
  private petsFacade = inject(PetsFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  tutorForm!: FormGroup;
  isLoading = signal(false);
  isUploading = signal(false);
  errorMessage = signal<string | null>(null);
  tutorId = signal<number | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  tutorDetail = signal<TutorDetail | null>(null);

  availablePets = signal<Pet[]>([]);
  petsLoading = signal(false);
  showLinkDialog = false;
  searchTermValue = '';
  linkingPetId = signal<number | null>(null);

  ngOnInit(): void {
    this.tutorForm = this.fb.group({
      nome: ['', [Validators.required]],
      telefone: ['', [Validators.required]],
      email: ['', [Validators.email]],
      endereco: [''],
      cpf: ['']
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.tutorId.set(parseInt(id, 10));
      this.loadTutor();

      this.petsFacade.pets$.pipe(takeUntil(this.destroy$)).subscribe(pets => {
        this.availablePets.set(pets);
      });

      this.petsFacade.loading$.pipe(takeUntil(this.destroy$)).subscribe(loading => {
        this.petsLoading.set(loading);
      });

      this.searchSubject
        .pipe(
          debounce(value => timer(value.trim() ? 500 : 0)),
          distinctUntilChanged(),
          takeUntil(this.destroy$)
        )
        .subscribe(searchValue => {
          this.petsFacade.searchByName(searchValue);
        });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadTutor(): void {
    const id = this.tutorId();
    if (!id) return;

    this.isLoading.set(true);
    this.tutoresFacade.fetchTutorDetail(id).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (tutor: TutorDetail) => {
        this.tutorDetail.set(tutor);
        this.tutorForm.patchValue({
          nome: tutor.nome,
          telefone: tutor.telefone || '',
          email: tutor.email || '',
          endereco: tutor.endereco || '',
          cpf: tutor.cpf ? this.formatCpf(tutor.cpf) : ''
        });
        if (tutor.foto?.url) {
          this.previewUrl.set(tutor.foto.url);
        }
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar dados do tutor');
      }
    });
  }

  openLinkDialog(): void {
    if (!this.tutorId()) return;
    this.showLinkDialog = true;
    this.searchTermValue = '';
    this.petsFacade.fetchPets({ size: 50 });
  }

  closeLinkDialog(): void {
    this.showLinkDialog = false;
    this.searchTermValue = '';
  }

  onSearchChange(value: string): void {
    this.searchTermValue = value;
    this.searchSubject.next(value);
  }

  getAvailablePetsForLinking(): Pet[] {
    const tutor = this.tutorDetail();
    if (!tutor) return this.availablePets();

    const linkedPetIds = new Set((tutor.pets ?? []).map(p => p.id));
    return this.availablePets().filter(pet => !linkedPetIds.has(pet.id));
  }

  linkPet(petId: number): void {
    const tutorId = this.tutorId();
    if (!tutorId) return;

    this.linkingPetId.set(petId);
    this.tutoresFacade.linkPet(tutorId, petId).pipe(
      finalize(() => {
        this.linkingPetId.set(null);
        this.loadTutor();
      })
    ).subscribe({
      next: () => {
        this.closeLinkDialog();
      },
      error: () => {
        this.errorMessage.set('Erro ao vincular pet');
      }
    });
  }

  unlinkPet(petId: number): void {
    const tutorId = this.tutorId();
    if (!tutorId) return;

    if (!confirm('Deseja realmente desvincular este pet?')) {
      return;
    }

    this.linkingPetId.set(petId);
    this.tutoresFacade.unlinkPet(tutorId, petId).pipe(
      finalize(() => {
        this.linkingPetId.set(null);
        this.loadTutor();
      })
    ).subscribe({
      error: () => {
        this.errorMessage.set('Erro ao desvincular pet');
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
    if (this.tutorForm.invalid) {
      this.markFormGroupTouched(this.tutorForm);
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    const formValue = this.tutorForm.value;
    const cpfDigits = String(formValue.cpf ?? '').replace(/\D/g, '');
    const tutorData = {
      nome: formValue.nome.trim(),
      telefone: formValue.telefone.replace(/\D/g, ''),
      email: formValue.email?.trim() || undefined,
      endereco: formValue.endereco?.trim() || undefined,
      cpf: cpfDigits.length > 0 ? Number(cpfDigits) : undefined
    };
    const id = this.tutorId();

    const operation = id
      ? this.tutoresFacade.updateTutor(id, tutorData)
      : this.tutoresFacade.createTutor(tutorData);

    operation.pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (tutor) => {
        const tutorIdToUse = id || tutor.id;
        if (this.selectedFile()) {
          this.uploadPhoto(tutorIdToUse);
        } else {
          this.router.navigate(['/tutores', tutorIdToUse]);
        }
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Erro ao salvar tutor. Verifique os dados e tente novamente.'
        );
      }
    });
  }

  uploadPhoto(tutorId: number): void {
    const file = this.selectedFile();
    if (!file) {
      this.router.navigate(['/tutores', tutorId]);
      return;
    }

    this.isUploading.set(true);
    this.tutoresFacade.uploadTutorPhoto(tutorId, file).pipe(
      finalize(() => this.isUploading.set(false))
    ).subscribe({
      next: () => {
        this.router.navigate(['/tutores', tutorId]);
      },
      error: (error: unknown) => {
        this.errorMessage.set(
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Tutor salvo, mas houve erro ao fazer upload da foto.'
        );
        setTimeout(() => {
          this.router.navigate(['/tutores', tutorId]);
        }, 2000);
      }
    });
  }

  cancel(): void {
    const id = this.tutorId();
    if (id) {
      this.router.navigate(['/tutores', id]);
    } else {
      this.router.navigate(['/tutores']);
    }
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private formatCpf(value: number | string): string {
    const digits = String(value).replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
    if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`;
  }
}
