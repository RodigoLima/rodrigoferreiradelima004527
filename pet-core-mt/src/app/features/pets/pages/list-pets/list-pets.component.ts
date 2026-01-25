import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounceTime, distinctUntilChanged, Subject, takeUntil } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';

@Component({
  selector: 'app-list-pets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-pets.component.html',
  styleUrl: './list-pets.component.scss'
})
export class ListPetsComponent implements OnInit, OnDestroy {
  private petsFacade = inject(PetsFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  pets$ = this.petsFacade.pets$;
  loading$ = this.petsFacade.loading$;
  error$ = this.petsFacade.error$;
  totalPages$ = this.petsFacade.pageCount$;
  currentPage$ = this.petsFacade.currentPage$;
  totalElements$ = this.petsFacade.total$;

  searchTerm = signal('');

  ngOnInit(): void {
    const nome = this.route.snapshot.queryParams['nome'] || '';
    const page = parseInt(this.route.snapshot.queryParams['page'] || '0', 10);

    if (nome) {
      this.searchTerm.set(nome);
    }

    this.petsFacade.loadPets({ nome: nome || undefined, page, size: 10 }).subscribe();

    this.searchSubject
      .pipe(
        debounceTime(500),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        this.updateQueryParams({ nome: searchValue || undefined, page: 0 });
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
