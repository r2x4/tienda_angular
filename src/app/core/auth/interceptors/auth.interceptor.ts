import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { RETRY_AUTH_REFRESH, SKIP_AUTH } from '../../api/api-client.service';
import { AuthSessionService } from '../services/auth-session.service';

const AUTH_ENDPOINTS_NO_REFRESH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

function isAuthEndpoint(url: string): boolean {
  return AUTH_ENDPOINTS_NO_REFRESH.some((p) => url.includes(p));
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_AUTH)) {
    return next(req);
  }

  const auth = inject(AuthSessionService);
  const token = auth.getAccessToken();
  const authReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authReq).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse)) {
        return throwError(() => error);
      }

      // 403 and non-auth errors must not trigger refresh/logout here.
      if (error.status !== 401) {
        return throwError(() => error);
      }

      // Do not refresh for auth endpoints or retried requests.
      if (!req.context.get(RETRY_AUTH_REFRESH) || isAuthEndpoint(req.url)) {
        return throwError(() => error);
      }

      const refreshToken = auth.getRefreshToken();
      if (!refreshToken) {
        return throwError(() => error);
      }

      return auth.refreshTokens().pipe(
        switchMap((res) => {
          const retried = req.clone({
            setHeaders: { Authorization: `Bearer ${res.access_token}` },
            context: req.context.set(RETRY_AUTH_REFRESH, false),
          });
          return next(retried);
        }),
        catchError((refreshErr) => throwError(() => refreshErr))
      );
    })
  );
};
