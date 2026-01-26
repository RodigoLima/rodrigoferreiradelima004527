import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { EMPTY, firstValueFrom, of } from 'rxjs';
import { AuthApiService } from './auth-api.service';
import { AuthFacade } from './auth.facade';
import { AuthStorageService } from './auth-storage.service';
import { AuthState } from './models/auth.models';

describe('AuthFacade', () => {
  it('login deve persistir tokens e autenticar', async () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(1_000);
    let storedState: AuthState | null = null;

    const storageSave = vi.fn((state: AuthState) => {
      storedState = state;
    });
    const storageLoad = vi.fn(() => storedState);
    const storageClear = vi.fn(() => {
      storedState = null;
    });
    const storageWatchChanges = vi.fn(() => EMPTY);
    const storageIsValid = vi.fn((state: AuthState | null) => {
      if (!state) {
        return false;
      }
      const now = Date.now();
      if (state.refreshExpiresAt && state.refreshExpiresAt < now) {
        return false;
      }
      return !!state.refreshToken;
    });

    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        {
          provide: AuthApiService,
          useValue: {
            login: vi.fn(() =>
              of({
                access_token: 'a',
                refresh_token: 'r',
                expires_in: 10,
                refresh_expires_in: 20
              })
            ),
            refreshToken: vi.fn()
          }
        },
        {
          provide: AuthStorageService,
          useValue: {
            load: storageLoad,
            save: storageSave,
            clear: storageClear,
            watchChanges: storageWatchChanges,
            isValid: storageIsValid
          }
        },
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    });

    const facade = TestBed.inject(AuthFacade);
    const ok = await firstValueFrom(facade.login({ username: 'u', password: 'p' }));

    expect(ok).toBe(true);
    expect(facade.isAuthenticated).toBe(true);
    expect(facade.accessToken).toBe('a');
    expect(storageSave).toHaveBeenCalledTimes(1);

    const saved = storageSave.mock.calls[0][0] as AuthState;
    expect(saved.isAuthenticated).toBe(true);
    expect(saved.accessToken).toBe('a');
    expect(saved.refreshToken).toBe('r');
    expect(saved.expiresAt).toBe(1_000 + 10_000);
    expect(saved.refreshExpiresAt).toBe(1_000 + 20_000);

    nowSpy.mockRestore();
  });

  it('deve iniciar deslogado quando refresh token estiver expirado no storage', () => {
    const nowSpy = vi.spyOn(Date, 'now').mockReturnValue(10_000);
    let storedState: AuthState | null = {
      isAuthenticated: true,
      accessToken: 'a',
      refreshToken: 'r',
      expiresAt: 9_000,
      refreshExpiresAt: 9_000
    };

    const storageLoad = vi.fn(() => storedState);
    const storageSave = vi.fn((state: AuthState) => {
      storedState = state;
    });
    const storageClear = vi.fn(() => {
      storedState = null;
    });
    const storageWatchChanges = vi.fn(() => EMPTY);
    const storageIsValid = vi.fn((state: AuthState | null) => {
      if (!state) {
        return false;
      }
      const now = Date.now();
      if (state.refreshExpiresAt && state.refreshExpiresAt < now) {
        return false;
      }
      return !!state.refreshToken;
    });

    TestBed.configureTestingModule({
      providers: [
        AuthFacade,
        { provide: AuthApiService, useValue: { login: vi.fn(), refreshToken: vi.fn() } },
        {
          provide: AuthStorageService,
          useValue: {
            load: storageLoad,
            save: storageSave,
            clear: storageClear,
            watchChanges: storageWatchChanges,
            isValid: storageIsValid
          }
        },
        { provide: Router, useValue: { navigate: vi.fn() } }
      ]
    });

    const facade = TestBed.inject(AuthFacade);
    expect(storageClear).toHaveBeenCalledTimes(1);
    expect(facade.isAuthenticated).toBe(false);
    expect(facade.accessToken).toBeNull();

    nowSpy.mockRestore();
  });
});

