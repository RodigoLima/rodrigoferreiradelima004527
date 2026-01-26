import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { debounce, distinctUntilChanged, Subject, takeUntil, timer } from 'rxjs';
import { TutoresFacade } from '../../services/tutores.facade';
import { Tutor } from '../../models/tutor.models';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PaginatorModule, PaginatorState } from 'primeng/paginator';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-list-tutores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    CardModule,
    ButtonModule,
    InputTextModule,
    PaginatorModule
  ],
  templateUrl: './list-tutores.component.html',
  styleUrl: './list-tutores.component.scss'
})
export class ListTutoresComponent implements OnInit, OnDestroy {
  private tutoresFacade = inject(TutoresFacade);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private confirmationService = inject(ConfirmationService);
  private messageService = inject(MessageService);
  private destroy$ = new Subject<void>();
  private searchSubject = new Subject<string>();

  tutores = signal<Tutor[]>([]);
  loading = signal(false);
  deletingId = signal<number | null>(null);
  totalPages = signal(0);
  currentPage = signal(0);
  totalElements = signal(0);

  searchTerm = signal('');

  ngOnInit(): void {
    this.tutoresFacade.tutores$.pipe(takeUntil(this.destroy$)).subscribe(tutores => this.tutores.set(tutores));
    this.tutoresFacade.loading$.pipe(takeUntil(this.destroy$)).subscribe(v => this.loading.set(v));
    this.tutoresFacade.error$
      .pipe(distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(v => {
        if (!v) return;
        this.messageService.add({ severity: 'error', summary: 'Erro', detail: v });
      });
    this.tutoresFacade.pageCount$.pipe(takeUntil(this.destroy$)).subscribe(v => this.totalPages.set(v));
    this.tutoresFacade.currentPage$.pipe(takeUntil(this.destroy$)).subscribe(v => this.currentPage.set(v));
    this.tutoresFacade.total$.pipe(takeUntil(this.destroy$)).subscribe(v => this.totalElements.set(v));

    const nome = this.route.snapshot.queryParams['nome'] || '';
    const page = parseInt(this.route.snapshot.queryParams['page'] || '0', 10);

    if (nome) {
      this.searchTerm.set(nome);
    }

    this.tutoresFacade.fetchTutores({ nome: nome || undefined, page, size: 10 });

    this.searchSubject
      .pipe(
        debounce(value => timer(value.trim() ? 500 : 0)),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe(searchValue => {
        this.updateQueryParams({ nome: searchValue, page: 0 });
        this.tutoresFacade.searchByName(searchValue);
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
    this.tutoresFacade.goToPage(page);
  }

  onPaginatorChange(event: PaginatorState): void {
    this.onPageChange(event.page ?? 0);
  }

  viewTutorDetail(id: number): void {
    this.router.navigate(['/tutores', id]);
  }

  editTutor(id: number): void {
    this.router.navigate(['/tutores/editar', id]);
  }

  deleteTutor(tutor: Tutor): void {
    if (this.deletingId() === tutor.id) return;

    this.confirmationService.confirm({
      header: 'Confirmar exclusão',
      message: `Tem certeza que deseja excluir o tutor "${tutor.nome}"? Esta ação não pode ser desfeita.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Excluir',
      rejectLabel: 'Cancelar',
      acceptButtonStyleClass: 'p-button-danger',
      rejectButtonStyleClass: 'p-button-text',
      accept: () => {
        this.deletingId.set(tutor.id);

        this.tutoresFacade.deleteTutor(tutor.id).subscribe({
          next: () => {
            this.messageService.add({
              severity: 'success',
              summary: 'Sucesso',
              detail: 'Tutor excluído com sucesso!'
            });
            this.deletingId.set(null);
          },
          error: (err) => {
            this.messageService.add({
              severity: 'error',
              summary: 'Erro',
              detail: typeof err === 'string' ? err : 'Erro ao excluir tutor'
            });
            this.deletingId.set(null);
          }
        });
      }
    });
  }

  createNewTutor(): void {
    this.router.navigate(['/tutores/novo']);
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
