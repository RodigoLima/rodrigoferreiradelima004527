import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { PetDetail } from '../../models/pet.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';

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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroy$ = new Subject<void>();

  pet = signal<PetDetail | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.petsFacade.petDetail$.pipe(takeUntil(this.destroy$)).subscribe(pet => this.pet.set(pet));
    this.petsFacade.petDetailLoading$.pipe(takeUntil(this.destroy$)).subscribe(v => this.loading.set(v));
    this.petsFacade.petDetailError$.pipe(takeUntil(this.destroy$)).subscribe(v => this.error.set(v));

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
}
