import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, distinctUntilChanged, forkJoin, map, of, takeUntil } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { PetDetail } from '../../models/pet.models';
import { TutoresApiService } from '../../../tutores/services/tutores-api.service';
import { TutorDetail } from '../../../tutores/models/tutor.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-pet-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule
  ],
  templateUrl: './pet-detail.component.html',
  styleUrl: './pet-detail.component.scss'
})
export class PetDetailComponent implements OnInit, OnDestroy {
  private petsFacade = inject(PetsFacade);
  private tutoresApi = inject(TutoresApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();

  pet = signal<PetDetail | null>(null);
  tutores = signal<TutorDetail[]>([]);
  tutoresLoading = signal(false);
  loading = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    this.petsFacade.petDetail$
      .pipe(
        takeUntil(this.destroy$),
        map(pet => {
          if (!pet) {
            return { pet: null, tutorIds: [] as number[] };
          }

          const tutorIds = Array.from(new Set((pet.tutores ?? []).map(t => t.id).filter(id => typeof id === 'number')));
          return { pet, tutorIds };
        }),
        distinctUntilChanged((a, b) => JSON.stringify(a.tutorIds) === JSON.stringify(b.tutorIds) && a.pet?.id === b.pet?.id)
      )
      .subscribe(({ pet, tutorIds }) => {
        this.pet.set(pet);
        if (!pet || tutorIds.length === 0) {
          this.tutores.set([]);
          this.tutoresLoading.set(false);
          return;
        }

        this.tutoresLoading.set(true);
        forkJoin(
          tutorIds.map(id =>
            this.tutoresApi.getTutorById(id).pipe(
              catchError(() => of(null))
            )
          )
        )
          .pipe(takeUntil(this.destroy$))
          .subscribe(tutores => {
            this.tutores.set((tutores.filter(Boolean) as TutorDetail[]));
            this.tutoresLoading.set(false);
          });
      });
    this.petsFacade.petDetailLoading$.pipe(takeUntil(this.destroy$)).subscribe(v => this.loading.set(v));
    this.petsFacade.petDetailError$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(v => {
        if (!v) return;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: v });
      });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.petsFacade.fetchPetDetail(parseInt(id, 10)).subscribe({
        error: () => {}
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  goBack(): void {
    this.router.navigate(['/pets']);
  }

  editPet(): void {
    const pet = this.pet();
    if (pet) {
      this.router.navigate(['/pets/editar', pet.id]);
    }
  }

  deletePet(): void {
    const pet = this.pet();
    if (!pet || this.deleting()) return;

    this.confirmationService.confirm({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o pet "${pet.nome}"? Esta ação não pode ser desfeita.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.deleting.set(true);

        this.petsFacade.deletePet(pet.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Pet excluído com sucesso!'
            });
            setTimeout(() => {
              this.router.navigate(['/pets']);
            }, 800);
          },
          error: (err) => {
            this.deleting.set(false);
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: typeof err === 'string' ? err : 'Erro ao excluir pet'
            });
          }
        });
      }
    });
  }
}
