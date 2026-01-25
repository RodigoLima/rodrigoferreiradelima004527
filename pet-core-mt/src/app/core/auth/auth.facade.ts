import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthApiService } from './auth-api.service';
import { AuthStorageService } from './auth-storage.service';
import { AuthState, LoginRequest, RefreshTokenResponse } from './models/auth.models';

const INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null
};

@Injectable({
  providedIn: 'root'
})
export class AuthFacade {
  private authApi = inject(AuthApiService);
  private storage = inject(AuthStorageService);
  private router = inject(Router);

  private stateSubject = new BehaviorSubject<AuthState>(this.loadInitialState());
  state$ = this.stateSubject.asObservable();

  isAuthenticated$ = this.state$.pipe(map(state => state.isAuthenticated));
  accessToken$ = this.state$.pipe(map(state => state.accessToken));

  get currentState(): AuthState {
    return this.stateSubject.value;
  }

  get isAuthenticated(): boolean {
    return this.currentState.isAuthenticated;
  }

  get accessToken(): string | null {
    return this.currentState.accessToken;
  }

  private loadInitialState(): AuthState {
    const stored = this.storage.load();
    if (!stored) {
      return INITIAL_STATE;
    }

    if (stored.expiresAt && stored.expiresAt < Date.now()) {
      this.storage.clear();
      return INITIAL_STATE;
    }

    return stored;
  }

  login(credentials: LoginRequest): Observable<boolean> {
    return this.authApi.login(credentials).pipe(
      tap(response => {
        const expiresAt = Date.now() + (response.expiresIn * 1000);
        const newState: AuthState = {
          isAuthenticated: true,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt
        };
        this.updateState(newState);
      }),
      map(() => true),
      catchError(error => {
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<boolean> {
    const currentState = this.currentState;
    if (!currentState.refreshToken) {
      return of(false);
    }

    return this.authApi.refreshToken({ refreshToken: currentState.refreshToken }).pipe(
      tap(response => {
        const expiresAt = Date.now() + (response.expiresIn * 1000);
        const newState: AuthState = {
          isAuthenticated: true,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          expiresAt
        };
        this.updateState(newState);
      }),
      map(() => true),
      catchError(error => {
        this.logout();
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    this.updateState(INITIAL_STATE);
    this.router.navigate(['/login']);
  }

  private updateState(newState: AuthState): void {
    this.stateSubject.next(newState);
    this.storage.save(newState);
  }
}
