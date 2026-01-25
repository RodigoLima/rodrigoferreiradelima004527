import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpEvent, HttpHandlerFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { BehaviorSubject, catchError, filter, switchMap, take, throwError, Observable } from 'rxjs';
import { AuthFacade } from './auth.facade';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export const authInterceptor: HttpInterceptorFn = (req, next): Observable<HttpEvent<unknown>> => {
  const authFacade = inject(AuthFacade);
  const token = authFacade.accessToken;

  if (token && !req.url.includes('/autenticacao/')) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401 && !req.url.includes('/autenticacao/')) {
        return handle401Error(req, next, authFacade);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(req: HttpRequest<unknown>, next: HttpHandlerFn, authFacade: AuthFacade): Observable<HttpEvent<unknown>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authFacade.refreshToken().pipe(
      switchMap((success) => {
        isRefreshing = false;
        if (success) {
          const newToken = authFacade.accessToken;
          if (newToken) {
            refreshTokenSubject.next(newToken);
            return retryRequest(req, next, newToken);
          }
        }
        authFacade.logout();
        return throwError(() => new Error('Token refresh failed'));
      }),
      catchError((error) => {
        isRefreshing = false;
        authFacade.logout();
        return throwError(() => error);
      })
    );
  }

  return refreshTokenSubject.pipe(
    filter(token => token !== null),
    take(1),
    switchMap(token => retryRequest(req, next, token!))
  );
}

function retryRequest(req: HttpRequest<unknown>, next: HttpHandlerFn, token: string): Observable<HttpEvent<unknown>> {
  const clonedReq = req.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
  return next(clonedReq);
}
