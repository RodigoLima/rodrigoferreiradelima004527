import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Subject, debounce, timer, distinctUntilChanged, takeUntil, forkJoin, map, of, switchMap } from 'rxjs';
import { TutoresFacade } from '../../services/tutores.facade';
import { TutorDetail } from '../../models/tutor.models';
import { PetsFacade } from '../../../pets/services/pets.facade';
import { Pet } from '../../../pets/models/pet.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { DialogModule } from 'primeng/dialog';
import { ConfirmationService, MessageService } from 'primeng/api';
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
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  tutorForm!: FormGroup;
  isLoading = signal(false);
  isUploading = signal(false);
  tutorId = signal<number | null>(null);
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  tutorDetail = signal<TutorDetail | null>(null);

  initialLinkedPetIds = signal<number[]>([]);
  linkedPets = signal<Pet[]>([]);
  availablePets = signal<Pet[]>([]);
  petsLoading = signal(false);
  showLinkDialog = false;
  searchTermValue = '';
  selectedPets = signal<Pet[]>([]);

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
    }

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
        this.linkedPets.set(tutor.pets ?? []);
        this.initialLinkedPetIds.set((tutor.pets ?? []).map(p => p.id));
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
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar dados do tutor'
        });
      }
    });
  }

  openLinkDialog(): void {
    this.showLinkDialog = true;
    this.searchTermValue = '';
    this.selectedPets.set([]);
    this.petsFacade.fetchPets({ size: 50 });
  }

  closeLinkDialog(): void {
    this.showLinkDialog = false;
    this.searchTermValue = '';
    this.selectedPets.set([]);
  }

  onSearchChange(value: string): void {
    this.searchTermValue = value;
    this.searchSubject.next(value);
  }

  getAvailablePetsForLinking(): Pet[] {
    const linkedPetIds = new Set(this.linkedPets().map(p => p.id));
    return this.availablePets().filter(pet => !linkedPetIds.has(pet.id));
  }

  isPetSelected(petId: number): boolean {
    return this.selectedPets().some(p => p.id === petId);
  }

  togglePetSelection(pet: Pet): void {
    const selected = this.selectedPets();
    if (selected.some(p => p.id === pet.id)) {
      this.selectedPets.set(selected.filter(p => p.id !== pet.id));
      return;
    }
    this.selectedPets.set([...selected, pet]);
  }

  linkSelectedPets(): void {
    const selected = this.selectedPets();
    if (selected.length === 0) return;

    const current = this.linkedPets();
    const currentIds = new Set(current.map(p => p.id));

    const toAdd: Pet[] = [];
    for (const pet of selected) {
      if (currentIds.has(pet.id)) continue;
      toAdd.push(pet);
      currentIds.add(pet.id);
    }

    if (toAdd.length === 0) {
      this.closeLinkDialog();
      return;
    }

    this.linkedPets.set([...current, ...toAdd]);
    this.messageService.add({
      severity: 'info',
      summary: 'Atenção',
      detail: `${toAdd.length} ${toAdd.length === 1 ? 'pet marcado' : 'pets marcados'} para vincular. Salve o tutor para persistir a alteração.`
    });
    this.closeLinkDialog();
  }

  unlinkPet(petId: number): void {
    this.confirmationService.confirm({
      header: 'Confirmar desvinculação',
      message: 'Deseja realmente desvincular este pet?',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Desvincular',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.linkedPets.set(this.linkedPets().filter(p => p.id !== petId));
        this.messageService.add({
          severity: 'info',
          summary: 'Atenção',
          detail: 'Pet marcado para desvincular. Salve o tutor para persistir a alteração.'
        });
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
      switchMap(tutor => {
        const tutorIdToUse = id || tutor.id;
        return this.persistPetsChangesIfNeeded(tutorIdToUse).pipe(
          map(() => ({ tutor, tutorIdToUse }))
        );
      }),
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: ({ tutor, tutorIdToUse }) => {
        this.initialLinkedPetIds.set(this.linkedPets().map(p => p.id));
        if (this.selectedFile()) {
          this.uploadPhoto(tutorIdToUse);
        } else {
          this.messageService.add({
            severity: 'success',
            summary: 'Sucesso',
            detail: 'Tutor salvo com sucesso!'
          });
          this.router.navigate(['/tutores', tutorIdToUse]);
        }
      },
      error: (error: unknown) => {
        const detail =
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Erro ao salvar tutor. Verifique os dados e tente novamente.';
        this.messageService.add({ severity: 'error', summary: 'Erro', detail });
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
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Tutor salvo com sucesso!'
        });
        this.router.navigate(['/tutores', tutorId]);
      },
      error: (error: unknown) => {
        const detail =
          typeof error === 'string' && error.trim().length > 0
            ? error
            : 'Tutor salvo, mas houve erro ao fazer upload da foto.';
        this.messageService.add({ severity: 'warn', summary: 'Atenção', detail });
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

  private persistPetsChangesIfNeeded(tutorId: number) {
    const initial = new Set(this.initialLinkedPetIds());
    const current = new Set(this.linkedPets().map(p => p.id));

    const toLink = [...current].filter(id => !initial.has(id));
    const toUnlink = [...initial].filter(id => !current.has(id));

    if (toLink.length === 0 && toUnlink.length === 0) {
      return of(void 0);
    }

    const operations = [
      ...toLink.map(petId => this.tutoresFacade.linkPet(tutorId, petId)),
      ...toUnlink.map(petId => this.tutoresFacade.unlinkPet(tutorId, petId))
    ];

    return forkJoin(operations).pipe(map(() => void 0));
  }
}
