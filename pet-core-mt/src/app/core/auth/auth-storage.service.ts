import { Injectable } from '@angular/core';
import { Observable, fromEvent, filter, map, interval, startWith, merge } from 'rxjs';
import { AuthState } from './models/auth.models';

const STORAGE_KEY = 'pet_auth_state';

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService {
  private storage: Storage | null = null;
  private lastStoredValue: string | null = null;

  constructor() {
    try {
      this.storage = sessionStorage;
      this.lastStoredValue = this.storage.getItem(STORAGE_KEY);
    } catch {
      this.storage = null;
    }
  }

  save(state: AuthState): void {
    if (this.storage) {
      try {
        const serialized = JSON.stringify(state);
        this.storage.setItem(STORAGE_KEY, serialized);
        this.lastStoredValue = serialized;
      } catch {
      }
    }
  }

  load(): AuthState | null {
    if (!this.storage) {
      return null;
    }

    try {
      const stored = this.storage.getItem(STORAGE_KEY);
      if (!stored) {
        return null;
      }
      return JSON.parse(stored) as AuthState;
    } catch {
      return null;
    }
  }

  clear(): void {
    if (this.storage) {
      try {
        this.storage.removeItem(STORAGE_KEY);
        this.lastStoredValue = null;
      } catch {
      }
    }
  }

  watchChanges(): Observable<AuthState | null> {
    if (typeof window === 'undefined' || !this.storage) {
      return new Observable(subscriber => {
        subscriber.next(this.load());
        subscriber.complete();
      });
    }

    const storageEvents$ = fromEvent<StorageEvent>(window, 'storage').pipe(
      filter(event => event.key === STORAGE_KEY && event.storageArea === this.storage),
      map(() => this.load())
    );

    const polling$ = interval(1000).pipe(
      startWith(0),
      map(() => {
        const current = this.storage?.getItem(STORAGE_KEY) ?? null;
        if (current !== this.lastStoredValue) {
          this.lastStoredValue = current;
          return this.load();
        }
        return null;
      }),
      filter(value => value !== null)
    );

    return merge(storageEvents$, polling$);
  }

  isValid(state: AuthState | null): boolean {
    if (!state) {
      return false;
    }

    const now = Date.now();

    if (state.refreshExpiresAt && state.refreshExpiresAt < now) {
      return false;
    }

    return !!state.refreshToken;
  }
}
