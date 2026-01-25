import { Injectable } from '@angular/core';
import { AuthState } from './models/auth.models';

const STORAGE_KEY = 'pet_auth_state';

@Injectable({
  providedIn: 'root'
})
export class AuthStorageService {
  private storage: Storage | null = null;

  constructor() {
    try {
      this.storage = sessionStorage;
    } catch {
      this.storage = null;
    }
  }

  save(state: AuthState): void {
    if (this.storage) {
      try {
        this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
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
      } catch {
      }
    }
  }
}
