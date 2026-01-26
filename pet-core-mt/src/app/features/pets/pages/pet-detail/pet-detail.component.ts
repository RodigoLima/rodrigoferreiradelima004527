import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, finalize, forkJoin, of } from 'rxjs';
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
export class PetDetailComponent implements OnInit {
  private petsFacade = inject(PetsFacade);
  private tutoresApi = inject(TutoresApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);

  pet = signal<PetDetail | null>(null);
  tutores = signal<TutorDetail[]>([]);
  tutoresLoading = signal(false);
  isLoading = signal(false);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadPet(parseInt(id, 10));
    }
  }

  loadPet(id: number): void {
    this.isLoading.set(true);
    this.petsFacade.fetchPetDetail(id).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (pet) => {
        this.pet.set(pet);
        const tutorIds = Array.from(new Set((pet.tutores ?? []).map(t => t.id).filter(v => typeof v === 'number')));
        this.loadTutores(tutorIds);
      },
      error: (err: unknown) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: typeof err === 'string' ? err : 'Erro ao carregar dados do pet'
        });
      }
    });
  }

  loadTutores(ids: number[]): void {
    if (!ids.length) {
      this.tutores.set([]);
      this.tutoresLoading.set(false);
      return;
    }

    this.tutoresLoading.set(true);
    forkJoin(
      ids.map(id =>
        this.tutoresApi.getTutorById(id).pipe(
          catchError(() => of(null))
        )
      )
    ).pipe(
      finalize(() => this.tutoresLoading.set(false))
    ).subscribe(tutores => {
      this.tutores.set((tutores.filter(Boolean) as TutorDetail[]));
    });
  }

  goBack(): void {
    this.router.navigate(['/pets']);
  }

  editPet(): void {
    const id = this.pet()?.id;
    if (id) {
      this.router.navigate(['/pets/editar', id]);
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
