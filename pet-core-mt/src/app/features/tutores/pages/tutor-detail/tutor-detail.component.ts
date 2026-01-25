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
}
