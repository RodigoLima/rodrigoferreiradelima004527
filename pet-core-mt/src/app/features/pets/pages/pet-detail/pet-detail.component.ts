import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, catchError, forkJoin, of, takeUntil } from 'rxjs';
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
  private lastTutorIds: number[] = [];

  pet = signal<PetDetail | null>(null);
  tutores = signal<TutorDetail[]>([]);
  tutoresLoading = signal(false);
  loading = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    this.petsFacade.petDetail$
      .pipe(
        takeUntil(this.destroy$)
      )
      .subscribe((pet) => {
        this.pet.set(pet);
        const tutorIds = pet
          ? Array.from(new Set((pet.tutores ?? []).map(t => t.id).filter(id => typeof id === 'number')))
          : [];

        if (!pet || tutorIds.length === 0) {
          this.lastTutorIds = [];
          this.tutores.set([]);
          this.tutoresLoading.set(false);
          return;
        }

        if (this.areIdsEqual(this.lastTutorIds, tutorIds)) {
          return;
        }
        this.lastTutorIds = tutorIds;

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
      .pipe(takeUntil(this.destroy$))
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

  private areIdsEqual(a: number[], b: number[]): boolean {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }
}
