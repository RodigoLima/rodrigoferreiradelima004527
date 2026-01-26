import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { AuthFacade } from './auth.facade';
import { authGuard } from './auth.guard';

function resolveGuardResult<T>(value: unknown): Promise<T> {
  if (isObservable(value)) {
    return firstValueFrom(value) as Promise<T>;
  }
  return Promise.resolve(value as T);
}

describe('authGuard', () => {
  it('deve permitir acesso quando autenticado', async () => {
    const routerNavigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: routerNavigate } },
        { provide: AuthFacade, useValue: { isAuthenticated$: of(true) } }
      ]
    });

    const result$ = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/pets' } as never)
    );

    await expect(resolveGuardResult<boolean>(result$)).resolves.toBe(true);
    expect(routerNavigate).not.toHaveBeenCalled();
  });

  it('deve redirecionar para login quando não autenticado', async () => {
    const routerNavigate = vi.fn();

    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: { navigate: routerNavigate } },
        { provide: AuthFacade, useValue: { isAuthenticated$: of(false) } }
      ]
    });

    const result$ = TestBed.runInInjectionContext(() =>
      authGuard({} as never, { url: '/tutores' } as never)
    );

    await expect(resolveGuardResult<boolean>(result$)).resolves.toBe(false);
    expect(routerNavigate).toHaveBeenCalledWith(['/login'], { queryParams: { returnUrl: '/tutores' } });
  });
});

