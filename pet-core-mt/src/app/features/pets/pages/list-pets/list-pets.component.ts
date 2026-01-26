import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounce, distinctUntilChanged, map, Subject, takeUntil, timer } from 'rxjs';
import { PetsFacade } from '../../services/pets.facade';
import { Pet, PetQuery } from '../../models/pet.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-list-pets',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
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
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<{ nome: string; raca: string }>();

  pets = signal<Pet[]>([]);
  loading = signal(false);
  deletingId = signal<number | null>(null);
  totalPages = signal(0);
  currentPage = signal(0);
  totalElements = signal(0);

  searchNome = signal('');
  searchRaca = signal('');

  ngOnInit(): void {
    this.petsFacade.pets$.pipe(takeUntil(this.destroy$)).subscribe(pets => this.pets.set(pets));
    this.petsFacade.loading$.pipe(takeUntil(this.destroy$)).subscribe(v => this.loading.set(v));
    this.petsFacade.error$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(v => {
        if (!v) return;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: v });
      });
    this.petsFacade.pageCount$.pipe(takeUntil(this.destroy$)).subscribe(v => this.totalPages.set(v));
    this.petsFacade.currentPage$.pipe(takeUntil(this.destroy$)).subscribe(v => this.currentPage.set(v));
    this.petsFacade.total$.pipe(takeUntil(this.destroy$)).subscribe(v => this.totalElements.set(v));

    const nome = this.route.snapshot.queryParams['nome'] || '';
    const raca = this.route.snapshot.queryParams['raca'] || '';
    const page = parseInt(this.route.snapshot.queryParams['page'] || '0', 10);

    if (nome) {
      this.searchNome.set(nome);
    }
    if (raca) {
      this.searchRaca.set(raca);
    }

    const query: PetQuery = { page, size: 10 };
    if (nome) {
      query.nome = nome;
    }
    if (raca) {
      query.raca = raca;
    }

    this.petsFacade.fetchPets(query);

    this.searchSubject
      .pipe(
        map(v => ({ nome: v.nome.trim(), raca: v.raca.trim() })),
        debounce(value => timer(value.nome || value.raca ? 500 : 0)),
        distinctUntilChanged((a, b) => a.nome === b.nome && a.raca === b.raca),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        this.updateQueryParams({ nome: searchValue.nome, raca: searchValue.raca, page: 0 });
        this.petsFacade.search(searchValue);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSearchNomeChange(value: string): void {
    this.searchNome.set(value);
    this.searchSubject.next({ nome: value, raca: this.searchRaca() });
  }

  onSearchRacaChange(value: string): void {
    this.searchRaca.set(value);
    this.searchSubject.next({ nome: this.searchNome(), raca: value });
  }

  onPageChange(page: number): void {
    this.updateQueryParams({ page });
    this.petsFacade.goToPage(page);
  }

  onPaginatorChange(event: PaginatorState): void {
    this.onPageChange(event.page ?? 0);
  }

  viewPetDetail(id: number): void {
    this.router.navigate(['/pets', id]);
  }

  editPet(id: number): void {
    this.router.navigate(['/pets/editar', id]);
  }

  deletePet(pet: Pet): void {
    if (this.deletingId() === pet.id) return;

    this.confirmationService.confirm({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o pet "${pet.nome}"? Esta ação não pode ser desfeita.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.deletingId.set(pet.id);

        this.petsFacade.deletePet(pet.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Pet excluído com sucesso!'
            });
            this.deletingId.set(null);
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: typeof err === 'string' ? err : 'Erro ao excluir pet'
            });
            this.deletingId.set(null);
          }
        });
      }
    });
  }

  createNewPet(): void {
    this.router.navigate(['/pets/novo']);
  }

  private updateQueryParams(params: { nome?: string; raca?: string; page?: number }): void {
    const queryParams: Record<string, string | number | null> = {};

    if (params.nome !== undefined) {
      queryParams['nome'] = params.nome || null;
    }
    if (params.raca !== undefined) {
      queryParams['raca'] = params.raca || null;
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
