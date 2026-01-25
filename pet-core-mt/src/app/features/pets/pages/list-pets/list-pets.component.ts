import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounce, distinctUntilChanged, Subject, takeUntil, timer } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { Pet } from '../../models/pet.models';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';

@Component({
  selector: 'app-list-pets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    InputTextModule,
    PaginatorModule
  ],
  templateUrl: './list-pets.component.html',
  styleUrl: './list-pets.component.scss'
})
export class ListPetsComponent implements OnInit, OnDestroy {
  private petsFacade = inject(PetsFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  pets = signal<Pet[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  totalPages = signal(0);
  currentPage = signal(0);
  totalElements = signal(0);

  searchTerm = signal('');

  ngOnInit(): void {
    this.petsFacade.pets$.pipe(takeUntil(this.destroy$)).subscribe(pets => this.pets.set(pets));
    this.petsFacade.loading$.pipe(takeUntil(this.destroy$)).subscribe(v => this.loading.set(v));
    this.petsFacade.error$.pipe(takeUntil(this.destroy$)).subscribe(v => this.error.set(v));
    this.petsFacade.pageCount$.pipe(takeUntil(this.destroy$)).subscribe(v => this.totalPages.set(v));
    this.petsFacade.currentPage$.pipe(takeUntil(this.destroy$)).subscribe(v => this.currentPage.set(v));
    this.petsFacade.total$.pipe(takeUntil(this.destroy$)).subscribe(v => this.totalElements.set(v));

    const nome = this.route.snapshot.queryParams['nome'] || '';
    const page = parseInt(this.route.snapshot.queryParams['page'] || '0', 10);

    if (nome) {
      this.searchTerm.set(nome);
    }

    this.petsFacade.fetchPets({ nome: nome || undefined, page, size: 10 });

    this.searchSubject
      .pipe(
        debounce(value => timer(value.trim() ? 500 : 0)),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        this.updateQueryParams({ nome: searchValue, page: 0 });
        this.petsFacade.searchByName(searchValue);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchChange(value: string): void {
    this.searchTerm.set(value);
    this.searchSubject.next(value);
  }

  onPageChange(page: number): void {
    this.updateQueryParams({ page });
    this.petsFacade.goToPage(page);
  }

  onPaginatorChange(event: PaginatorState): void {
    this.onPageChange(event.page ?? 0);
  }

  private updateQueryParams(params: { nome?: string; page?: number }): void {
    const queryParams: Record<string, string | number | null> = {};

    if (params.nome !== undefined) {
      queryParams['nome'] = params.nome || null;
    }
    if (params.page !== undefined) {
      queryParams['page'] = params.page;
    }

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams,
      queryParamsHandling: 'merge'
    });
  }
}
