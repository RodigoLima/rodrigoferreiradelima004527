import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { map, take } from 'rxjs/operators';
import { AuthFacade } from './auth.facade';
import { AuthStorageService } from './auth-storage.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authFacade = inject(AuthFacade);
  const router = inject(Router);
  const storage = inject(AuthStorageService);

  const stored = storage.load();
  if (!storage.isValid(stored)) {
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
  }

  return authFacade.isAuthenticated$.pipe(
    take(1),
    map(isAuthenticated => {
      if (isAuthenticated) {
        return true;
      }
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};
