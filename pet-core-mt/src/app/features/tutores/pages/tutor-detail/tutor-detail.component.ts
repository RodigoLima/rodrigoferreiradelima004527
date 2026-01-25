import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TutoresFacade } from '../../services/tutores.facade';
import { TutorDetail } from '../../models/tutor.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-tutor-detail',
  standalone: true,
  imports: [
    CommonModule,
    CardModule,
    ButtonModule
  ],
  templateUrl: './tutor-detail.component.html',
  styleUrl: './tutor-detail.component.scss'
})
export class TutorDetailComponent implements OnInit {
  private tutoresFacade = inject(TutoresFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tutor = signal<TutorDetail | null>(null);
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  deleting = signal(false);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTutor(parseInt(id, 10));
    }
  }

  loadTutor(id: number): void {
    this.isLoading.set(true);
    this.tutoresFacade.fetchTutorDetail(id).pipe(
      finalize(() => this.isLoading.set(false))
    ).subscribe({
      next: (tutor) => {
        this.tutor.set(tutor);
      },
      error: () => {
        this.errorMessage.set('Erro ao carregar dados do tutor');
      }
    });
  }

  editTutor(): void {
    const id = this.tutor()?.id;
    if (id) {
      this.router.navigate(['/tutores', 'editar', id]);
    }
  }

  goBack(): void {
    this.router.navigate(['/tutores']);
  }

  deleteTutor(): void {
    const tutor = this.tutor();
    if (!tutor || this.deleting()) return;

    const confirmed = confirm(`Tem certeza que deseja excluir o tutor "${tutor.nome}"? Esta ação não pode ser desfeita.`);
    if (!confirmed) return;

    this.deleting.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.tutoresFacade.deleteTutor(tutor.id).subscribe({
      next: () => {
        this.successMessage.set('Tutor excluído com sucesso!');
        setTimeout(() => {
          this.router.navigate(['/tutores']);
        }, 800);
      },
      error: (err) => {
        this.deleting.set(false);
        this.errorMessage.set(typeof err === 'string' ? err : 'Erro ao excluir tutor');
      }
    });
  }
}
