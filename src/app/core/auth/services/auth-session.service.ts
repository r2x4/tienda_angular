import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, catchError, finalize, map, of, shareReplay, tap, throwError } from 'rxjs';
import {
  AccessTokenResponse,
  AuthSession,
  AuthTokensResponse,
  ChangePasswordRequest,
  LoginRequest,
  RegisterRequest,
  UserRead,
} from '../models/auth.models';
import { AuthApiService } from './auth-api.service';
import { TokenStorageService } from './token-storage.service';
import { isApiError, normalizeApiError } from '../../api/api-error';

@Injectable({ providedIn: 'root' })
export class AuthSessionService {
  private readonly api = inject(AuthApiService);
  private readonly storage = inject(TokenStorageService);
  private readonly router = inject(Router);

  private readonly sessionSignal = signal<AuthSession | null>(this.storage.load());
  private refreshRequest$: Observable<AccessTokenResponse> | null = null;

  readonly session = this.sessionSignal.asReadonly();
  readonly user = computed(() => this.sessionSignal()?.user ?? null);
  readonly isAuthenticated = computed(() => !!this.sessionSignal()?.accessToken);
  readonly isAdmin = computed(() => this.hasRole('ADMIN'));

  constructor() {
    // Session recovery after reload: if tokens exist, validate/profile with /auth/me.
    const existing = this.sessionSignal();
    if (existing?.accessToken) {
      this.refreshProfile().subscribe({ error: () => undefined });
    }
  }

  register(payload: RegisterRequest): Observable<UserRead> {
    return this.api.register(payload).pipe(
      tap((res) => this.setSessionFromAuth(res)),
      map((res) => res.user)
    );
  }

  login(payload: LoginRequest): Observable<UserRead> {
    return this.api.login(payload).pipe(
      tap((res) => this.setSessionFromAuth(res)),
      map((res) => res.user)
    );
  }

  refreshProfile(): Observable<UserRead | null> {
    const token = this.storage.getAccessToken();
    if (!token) {
      this.clearSession();
      return of(null);
    }
    return this.api.me().pipe(
      tap((user) => {
        this.storage.updateUser(user);
        const current = this.sessionSignal();
        if (current) this.sessionSignal.set({ ...current, user });
      }),
      catchError((error) => {
        const apiErr = normalizeApiError(error);
        // 401 is handled by interceptor/refresh flow where applicable.
        // 403 means authenticated but not authorized; do not destroy session globally.
        if (apiErr.status === 403) {
          return throwError(() => apiErr);
        }
        if (apiErr.status === 401) {
          this.clearSession();
        }
        return throwError(() => apiErr);
      })
    );
  }

  refreshTokens(): Observable<AccessTokenResponse> {
    if (this.refreshRequest$) return this.refreshRequest$;

    const refreshToken = this.storage.getRefreshToken();
    if (!refreshToken) {
      this.clearSession();
      return throwError(() => normalizeApiError(new Error('No hay refresh token disponible.'), 'Tu sesión ha expirado.'));
    }

    this.refreshRequest$ = this.api.refresh({ refresh_token: refreshToken }).pipe(
      tap((res) => {
        this.storage.updateTokens(res.access_token, res.refresh_token, res.token_type ?? 'bearer');
        const current = this.sessionSignal();
        this.sessionSignal.set({
          accessToken: res.access_token,
          refreshToken: res.refresh_token,
          tokenType: res.token_type ?? 'bearer',
          user: current?.user ?? null,
        });
      }),
      catchError((error) => {
        const apiErr = normalizeApiError(error);
        // Only clear session on definitive auth invalidation.
        if (apiErr.status === 401 || apiErr.status === 403) {
          this.clearSession();
        }
        return throwError(() => apiErr);
      }),
      finalize(() => {
        this.refreshRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshRequest$;
  }

  logout(navigate = true): Observable<void> {
    const refreshToken = this.storage.getRefreshToken();
    const clearLocal = () => {
      this.clearSession();
      if (navigate) {
        this.router.navigate(['/inicial']);
      }
    };

    // Always clear local session to avoid "apparently active" local state on network errors.
    if (!refreshToken) {
      clearLocal();
      return of(void 0);
    }

    this.clearSession();
    if (navigate) {
      this.router.navigate(['/inicial']);
    }

    return this.api.logout({ refresh_token: refreshToken }).pipe(
      map(() => void 0),
      catchError(() => of(void 0))
    );
  }

  changePassword(payload: ChangePasswordRequest): Observable<void> {
    return this.api.changePassword(payload).pipe(
      tap(() => {
        // Backend revokes tokens / bumps token_version; local session must be cleared.
        this.clearSession();
      }),
      map(() => void 0),
      catchError((error) => throwError(() => normalizeApiError(error, 'No se pudo cambiar la contraseña.')))
    );
  }

  isSessionInvalidationError(error: unknown): boolean {
    const apiErr = isApiError(error) ? error : normalizeApiError(error);
    return apiErr.status === 401 || apiErr.status === 403;
  }

  getAccessToken(): string | null {
    return this.storage.getAccessToken();
  }

  getRefreshToken(): string | null {
    return this.storage.getRefreshToken();
  }

  hasRole(role: string): boolean {
    const user = this.sessionSignal()?.user;
    return !!user?.roles?.some((r) => r.code === role);
  }

  private setSessionFromAuth(res: AuthTokensResponse): void {
    const session: AuthSession = {
      accessToken: res.access_token,
      refreshToken: res.refresh_token,
      tokenType: res.token_type ?? 'bearer',
      user: res.user,
    };
    this.storage.save(session);
    this.sessionSignal.set(session);
  }

  private clearSession(): void {
    this.storage.clear();
    this.sessionSignal.set(null);
  }
}
