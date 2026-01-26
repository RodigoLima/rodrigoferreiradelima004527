import { TestBed } from '@angular/core/testing';
import { AuthStorageService } from './auth-storage.service';
import { AuthState } from './models/auth.models';

describe('AuthStorageService', () => {
  beforeEach(() => {
    try {
      sessionStorage.clear();
    } catch {
    }
  });

  it('save/load/clear deve persistir e limpar estado', () => {
    TestBed.configureTestingModule({
      providers: [AuthStorageService]
    });

    const service = TestBed.inject(AuthStorageService);
    const state: AuthState = {
      isAuthenticated: true,
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: Date.now() + 10_000,
      refreshExpiresAt: Date.now() + 20_000
    };

    service.save(state);
    expect(service.load()).toEqual(state);

    service.clear();
    expect(service.load()).toBeNull();
  });

  it('isValid deve validar refresh token e expiração', () => {
    TestBed.configureTestingModule({
      providers: [AuthStorageService]
    });

    const service = TestBed.inject(AuthStorageService);
    const now = Date.now();

    expect(service.isValid(null)).toBe(false);
    expect(
      service.isValid({
        isAuthenticated: true,
        accessToken: null,
        refreshToken: null,
        expiresAt: null,
        refreshExpiresAt: now + 10_000
      })
    ).toBe(false);
    expect(
      service.isValid({
        isAuthenticated: true,
        accessToken: null,
        refreshToken: 'r',
        expiresAt: null,
        refreshExpiresAt: now - 1
      })
    ).toBe(false);
    expect(
      service.isValid({
        isAuthenticated: true,
        accessToken: null,
        refreshToken: 'r',
        expiresAt: null,
        refreshExpiresAt: now + 10_000
      })
    ).toBe(true);
  });

  it('watchChanges deve emitir quando o storage mudar (polling)', async () => {
    vi.useFakeTimers();
    try {
      TestBed.configureTestingModule({
        providers: [AuthStorageService]
      });

      const service = TestBed.inject(AuthStorageService);
      const emissions: Array<AuthState | null> = [];
      const sub = service.watchChanges().subscribe(value => emissions.push(value));

      const state: AuthState = {
        isAuthenticated: true,
        accessToken: 'a',
        refreshToken: 'r',
        expiresAt: Date.now() + 10_000,
        refreshExpiresAt: Date.now() + 20_000
      };

      sessionStorage.setItem('pet_auth_state', JSON.stringify(state));
      await vi.advanceTimersByTimeAsync(1000);

      expect(emissions.length).toBeGreaterThan(0);
      expect(emissions.at(-1)).toEqual(state);

      sub.unsubscribe();
    } finally {
      vi.useRealTimers();
    }
  });
});

