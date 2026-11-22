import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthSessionService } from '../services/auth-session.service';

export const authGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  if (auth.isAuthenticated()) {
    if (auth.user()) return true;
    return auth.refreshProfile().pipe(
      map((user) => !!user || router.createUrlTree(['/inicial'], { queryParams: { auth: 'required', returnUrl: state.url } })),
      catchError(() => of(router.createUrlTree(['/inicial'], { queryParams: { auth: 'required', returnUrl: state.url } })))
    );
  }

  return router.createUrlTree(['/inicial'], { queryParams: { auth: 'required', returnUrl: state.url } });
};

export const adminGuard: CanActivateFn = (_route, state) => {
  const auth = inject(AuthSessionService);
  const router = inject(Router);

  if (!auth.isAuthenticated()) {
    return router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } });
  }

  const ensureUser$ = auth.user() ? of(auth.user()) : auth.refreshProfile();
  return ensureUser$.pipe(
    map((user) => {
      const isAdmin = !!user?.roles?.some((r) => r.code === 'ADMIN');
      return isAdmin ? true : router.createUrlTree(['/inicial'], { queryParams: { auth: 'forbidden' } });
    }),
    catchError(() => of(router.createUrlTree(['/admin/login'], { queryParams: { returnUrl: state.url } })))
  );
};
