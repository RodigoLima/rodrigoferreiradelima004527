import { HttpErrorResponse, HttpEvent, HttpHandlerFn, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Observable, firstValueFrom, of, throwError } from 'rxjs';
import { AuthFacade } from './auth.facade';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  it('deve adicionar Authorization quando existir token e não for /autenticacao', async () => {
    const seen: HttpRequest<unknown>[] = [];
    const authFacadeStub = { accessToken: 'token-123' };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthFacade, useValue: authFacadeStub }]
    });

    const req = new HttpRequest('GET', '/v1/pets');
    const next: HttpHandlerFn = (r): Observable<HttpEvent<unknown>> => {
      seen.push(r);
      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(TestBed.runInInjectionContext(() => authInterceptor(req, next)));

    expect(seen).toHaveLength(1);
    expect(seen[0].headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('deve tentar refresh e repetir requisição no 401', async () => {
    const seen: HttpRequest<unknown>[] = [];
    let token = 'old';

    const authFacadeStub = {
      get accessToken() {
        return token;
      },
      refreshToken: vi.fn(() => {
        token = 'new';
        return of(true);
      }),
      logout: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [{ provide: AuthFacade, useValue: authFacadeStub }]
    });

    const req = new HttpRequest('GET', '/v1/pets');
    const next: HttpHandlerFn = (r) => {
      seen.push(r);
      if (seen.length === 1) {
        return throwError(() => new HttpErrorResponse({ status: 401, url: r.url }));
      }
      return of(new HttpResponse({ status: 200 }));
    };

    await firstValueFrom(TestBed.runInInjectionContext(() => authInterceptor(req, next)));

    expect(authFacadeStub.refreshToken).toHaveBeenCalledTimes(1);
    expect(authFacadeStub.logout).not.toHaveBeenCalled();
    expect(seen).toHaveLength(2);
    expect(seen[0].headers.get('Authorization')).toBe('Bearer old');
    expect(seen[1].headers.get('Authorization')).toBe('Bearer new');
  });
});

