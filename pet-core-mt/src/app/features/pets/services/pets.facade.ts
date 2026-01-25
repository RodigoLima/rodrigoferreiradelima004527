import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap } from 'rxjs';
import { PetsApiService } from './pets-api.service';
import { Pet, PetQuery, PetResponse } from '../models/pet.models';

interface PetsState {
  pets: Pet[];
  loading: boolean;
  error: string | null;
  query: PetQuery;
  total: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

const INITIAL_STATE: PetsState = {
  pets: [],
  loading: false,
  error: null,
  query: { page: 0, size: 10 },
  total: 0,
  pageCount: 0,
  currentPage: 0,
  pageSize: 10
};

@Injectable({
  providedIn: 'root'
})
export class PetsFacade {
  private petsApi = inject(PetsApiService);

  private stateSubject = new BehaviorSubject<PetsState>(INITIAL_STATE);
  state$ = this.stateSubject.asObservable();

  private activeRequest?: Subscription;

  pets$ = this.state$.pipe(map(state => state.pets));
  loading$ = this.state$.pipe(map(state => state.loading));
  error$ = this.state$.pipe(map(state => state.error));
  total$ = this.state$.pipe(map(state => state.total));
  pageCount$ = this.state$.pipe(map(state => state.pageCount));
  currentPage$ = this.state$.pipe(map(state => state.currentPage));
  pageSize$ = this.state$.pipe(map(state => state.pageSize));

  get currentState(): PetsState {
    return this.stateSubject.value;
  }

  fetchPets(query: PetQuery = {}): void {
    this.activeRequest?.unsubscribe();
    this.activeRequest = this.loadPets(query).subscribe();
  }

  loadPets(query: PetQuery = {}): Observable<PetResponse> {
    const currentQuery: PetQuery = { page: 0, size: 10, ...query };

    this.updateState({ loading: true, error: null, query: currentQuery });

    return this.petsApi.getPets(currentQuery).pipe(
      tap(response => {
        this.updateState({
          loading: false,
          pets: response.content,
          total: response.total,
          pageCount: response.pageCount,
          currentPage: response.page,
          pageSize: response.size
        });
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao carregar pets';
        this.updateState({ loading: false, error: errorMessage });
        return of({
          page: currentQuery.page ?? 0,
          size: currentQuery.size ?? 10,
          total: 0,
          pageCount: 0,
          content: []
        } as PetResponse);
      })
    );
  }

  searchByName(nome: string): void {
    const trimmed = nome.trim();
    const query: PetQuery = { nome: trimmed, page: 0, size: 10 };
    this.fetchPets(query);
  }

  goToPage(page: number): void {
    const query = { ...this.currentState.query, page };
    this.fetchPets(query);
  }

  private updateState(partial: Partial<PetsState>): void {
    this.stateSubject.next({ ...this.currentState, ...partial });
  }
}
