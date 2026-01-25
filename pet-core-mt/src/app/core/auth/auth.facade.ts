import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, catchError, map, of, tap, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { AuthApiService } from './auth-api.service';
import { AuthStorageService } from './auth-storage.service';
import { AuthState, LoginRequest } from './models/auth.models';

const INITIAL_STATE: AuthState = {
  isAuthenticated: false,
  accessToken: null,
  refreshToken: null,
  expiresAt: null,
  refreshExpiresAt: null
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
    const now = Date.now();
    const stored = this.storage.load();
    if (!stored) {
      return INITIAL_STATE;
    }

    if (stored.refreshExpiresAt && stored.refreshExpiresAt < now) {
      this.storage.clear();
      return INITIAL_STATE;
    }

    const accessTokenValid = !!stored.accessToken && !!stored.expiresAt && stored.expiresAt > now;
    const refreshTokenValid =
      !!stored.refreshToken && (!stored.refreshExpiresAt || stored.refreshExpiresAt > now);

    return {
      isAuthenticated: refreshTokenValid,
      accessToken: accessTokenValid ? stored.accessToken : null,
      refreshToken: stored.refreshToken ?? null,
      expiresAt: accessTokenValid ? stored.expiresAt ?? null : null,
      refreshExpiresAt: stored.refreshExpiresAt ?? null
    };
  }

  login(credentials: LoginRequest): Observable<boolean> {
    return this.authApi.login(credentials).pipe(
      tap(response => {
        const expiresAt = Date.now() + (response.expires_in * 1000);
        const refreshExpiresAt = Date.now() + (response.refresh_expires_in * 1000);
        const newState: AuthState = {
          isAuthenticated: true,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt,
          refreshExpiresAt
        };
        this.updateState(newState);
      }),
      map(() => true),
      catchError(error => {
        if (
          typeof error === 'string' &&
          (error.toLowerCase().includes('não autorizado') || error.toLowerCase().includes('credenciais'))
        ) {
          return throwError(() => 'Usuário ou senha incorretos.');
        }
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<boolean> {
    const currentState = this.currentState;
    if (!currentState.refreshToken) {
      return of(false);
    }
    if (currentState.refreshExpiresAt && currentState.refreshExpiresAt < Date.now()) {
      this.logout();
      return of(false);
    }

    return this.authApi.refreshToken(currentState.refreshToken).pipe(
      tap(response => {
        const expiresAt = Date.now() + (response.expires_in * 1000);
        const refreshExpiresAt = Date.now() + (response.refresh_expires_in * 1000);
        const newState: AuthState = {
          isAuthenticated: true,
          accessToken: response.access_token,
          refreshToken: response.refresh_token,
          expiresAt,
          refreshExpiresAt
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
