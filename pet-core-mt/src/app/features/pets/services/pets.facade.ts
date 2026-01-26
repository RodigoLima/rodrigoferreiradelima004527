import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap } from 'rxjs';
import { PetsApiService } from './pets-api.service';
import { Pet, PetQuery, PetResponse, PetDetail, PetRequest, PetFoto } from '../models/pet.models';

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

interface PetDetailState {
  pet: PetDetail | null;
  loading: boolean;
  error: string | null;
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

const INITIAL_DETAIL_STATE: PetDetailState = {
  pet: null,
  loading: false,
  error: null
};

@Injectable({
  providedIn: 'root'
})
export class PetsFacade {
  private petsApi = inject(PetsApiService);

  private stateSubject = new BehaviorSubject<PetsState>(INITIAL_STATE);
  state$ = this.stateSubject.asObservable();

  private detailStateSubject = new BehaviorSubject<PetDetailState>(INITIAL_DETAIL_STATE);
  detailState$ = this.detailStateSubject.asObservable();

  private activeRequest?: Subscription;

  pets$ = this.state$.pipe(map(state => state.pets));
  loading$ = this.state$.pipe(map(state => state.loading));
  error$ = this.state$.pipe(map(state => state.error));
  total$ = this.state$.pipe(map(state => state.total));
  pageCount$ = this.state$.pipe(map(state => state.pageCount));
  currentPage$ = this.state$.pipe(map(state => state.currentPage));
  pageSize$ = this.state$.pipe(map(state => state.pageSize));

  petDetail$ = this.detailState$.pipe(map(state => state.pet));
  petDetailLoading$ = this.detailState$.pipe(map(state => state.loading));
  petDetailError$ = this.detailState$.pipe(map(state => state.error));

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

  fetchPetDetail(id: number): Observable<PetDetail> {
    this.updateDetailState({ loading: true, error: null });

    return this.petsApi.getPetById(id).pipe(
      tap(pet => {
        this.updateDetailState({ loading: false, pet });
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao carregar detalhes do pet';
        this.updateDetailState({ loading: false, error: errorMessage });
        throw error;
      })
    );
  }

  search(filters: { nome: string; raca: string }): void {
    const nome = filters.nome.trim();
    const raca = filters.raca.trim();
    const query: PetQuery = { page: 0, size: 10 };

    if (nome) {
      query.nome = nome;
    }
    if (raca) {
      query.raca = raca;
    }

    this.fetchPets(query);
  }

  searchByName(nome: string): void {
    const trimmed = nome.trim();
    this.search({ nome: trimmed, raca: '' });
  }

  goToPage(page: number): void {
    const query = { ...this.currentState.query, page };
    this.fetchPets(query);
  }

  createPet(pet: PetRequest): Observable<Pet> {
    return this.petsApi.createPet(pet).pipe(
      tap(() => {
        this.fetchPets(this.currentState.query);
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao criar pet';
        throw errorMessage;
      })
    );
  }

  updatePet(id: number, pet: PetRequest): Observable<Pet> {
    return this.petsApi.updatePet(id, pet).pipe(
      tap(() => {
        this.fetchPets(this.currentState.query);
        if (this.detailStateSubject.value.pet?.id === id) {
          this.fetchPetDetail(id).subscribe();
        }
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao atualizar pet';
        throw errorMessage;
      })
    );
  }

  uploadPetPhoto(id: number, file: File): Observable<PetFoto> {
    return this.petsApi.uploadPetPhoto(id, file).pipe(
      tap(() => {
        if (this.detailStateSubject.value.pet?.id === id) {
          this.fetchPetDetail(id).subscribe();
        }
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao fazer upload da foto';
        throw errorMessage;
      })
    );
  }

  deletePetPhoto(petId: number, fotoId: number): Observable<void> {
    return this.petsApi.deletePetPhoto(petId, fotoId).pipe(
      tap(() => {
        this.fetchPets(this.currentState.query);
        if (this.detailStateSubject.value.pet?.id === petId) {
          this.fetchPetDetail(petId).subscribe();
        }
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao remover foto do pet';
        throw errorMessage;
      })
    );
  }

  deletePet(id: number): Observable<void> {
    return this.petsApi.deletePet(id).pipe(
      tap(() => {
        this.fetchPets(this.currentState.query);
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao excluir pet';
        throw errorMessage;
      })
    );
  }

  private updateState(partial: Partial<PetsState>): void {
    this.stateSubject.next({ ...this.currentState, ...partial });
  }

  private updateDetailState(partial: Partial<PetDetailState>): void {
    this.detailStateSubject.next({ ...this.detailStateSubject.value, ...partial });
  }
}
