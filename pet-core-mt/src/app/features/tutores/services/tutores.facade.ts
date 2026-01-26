import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, Subscription, catchError, map, of, tap, throwError } from 'rxjs';
import { TutoresApiService } from './tutores-api.service';
import { Tutor, TutorDetail, TutorRequest, TutorFoto, TutorResponse, TutorQuery } from '../models/tutor.models';

interface TutoresState {
  tutores: Tutor[];
  loading: boolean;
  error: string | null;
  query: TutorQuery;
  total: number;
  pageCount: number;
  currentPage: number;
  pageSize: number;
}

const INITIAL_STATE: TutoresState = {
  tutores: [],
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
export class TutoresFacade {
  private tutoresApi = inject(TutoresApiService);

  private stateSubject = new BehaviorSubject<TutoresState>(INITIAL_STATE);
  state$ = this.stateSubject.asObservable();

  private activeRequest?: Subscription;

  tutores$ = this.state$.pipe(map(state => state.tutores));
  loading$ = this.state$.pipe(map(state => state.loading));
  error$ = this.state$.pipe(map(state => state.error));
  total$ = this.state$.pipe(map(state => state.total));
  pageCount$ = this.state$.pipe(map(state => state.pageCount));
  currentPage$ = this.state$.pipe(map(state => state.currentPage));
  pageSize$ = this.state$.pipe(map(state => state.pageSize));

  get currentState(): TutoresState {
    return this.stateSubject.value;
  }

  fetchTutores(query: TutorQuery = {}): void {
    this.activeRequest?.unsubscribe();
    this.activeRequest = this.loadTutores(query).subscribe();
  }

  loadTutores(query: TutorQuery = {}): Observable<TutorResponse> {
    const currentQuery: TutorQuery = { page: 0, size: 10, ...query };

    this.updateState({ loading: true, error: null, query: currentQuery });

    return this.tutoresApi.getTutores(currentQuery).pipe(
      tap(response => {
        this.updateState({
          loading: false,
          tutores: response.content,
          total: response.total,
          pageCount: response.pageCount,
          currentPage: response.page,
          pageSize: response.size
        });
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao carregar tutores';
        this.updateState({ loading: false, error: errorMessage });
        return of({
          page: currentQuery.page ?? 0,
          size: currentQuery.size ?? 10,
          total: 0,
          pageCount: 0,
          content: []
        } as TutorResponse);
      })
    );
  }

  searchByName(nome: string): void {
    const trimmed = nome.trim();
    const query: TutorQuery = { nome: trimmed, page: 0, size: 10 };
    this.fetchTutores(query);
  }

  goToPage(page: number): void {
    const query = { ...this.currentState.query, page };
    this.fetchTutores(query);
  }

  fetchTutorDetail(id: number): Observable<TutorDetail> {
    return this.tutoresApi.getTutorById(id).pipe(
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao carregar detalhes do tutor';
        return throwError(() => errorMessage);
      })
    );
  }

  createTutor(tutor: TutorRequest): Observable<Tutor> {
    return this.tutoresApi.createTutor(tutor).pipe(
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao criar tutor';
        return throwError(() => errorMessage);
      })
    );
  }

  updateTutor(id: number, tutor: TutorRequest): Observable<Tutor> {
    return this.tutoresApi.updateTutor(id, tutor).pipe(
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao atualizar tutor';
        return throwError(() => errorMessage);
      })
    );
  }

  uploadTutorPhoto(id: number, file: File): Observable<TutorFoto> {
    return this.tutoresApi.uploadTutorPhoto(id, file).pipe(
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao fazer upload da foto';
        return throwError(() => errorMessage);
      })
    );
  }

  deleteTutorPhoto(tutorId: number, fotoId: number): Observable<void> {
    return this.tutoresApi.deleteTutorPhoto(tutorId, fotoId).pipe(
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao remover foto do tutor';
        return throwError(() => errorMessage);
      })
    );
  }

  linkPet(tutorId: number, petId: number): Observable<void> {
    return this.tutoresApi.linkPet(tutorId, petId).pipe(
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao vincular pet';
        return throwError(() => errorMessage);
      })
    );
  }

  unlinkPet(tutorId: number, petId: number): Observable<void> {
    return this.tutoresApi.unlinkPet(tutorId, petId).pipe(
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao desvincular pet';
        return throwError(() => errorMessage);
      })
    );
  }

  deleteTutor(id: number): Observable<void> {
    return this.tutoresApi.deleteTutor(id).pipe(
      tap(() => {
        this.fetchTutores(this.currentState.query);
      }),
      catchError(error => {
        const errorMessage = typeof error === 'string' ? error : 'Erro ao excluir tutor';
        return throwError(() => errorMessage);
      })
    );
  }

  private updateState(partial: Partial<TutoresState>): void {
    this.stateSubject.next({ ...this.currentState, ...partial });
  }
}
