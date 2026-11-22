import { Injectable, computed, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthSessionService } from '../auth/services/auth-session.service';
import { LoginRequest, RegisterRequest, UserRead } from '../auth/models/auth.models';

/**
 * Compatibility facade during auth integration.
 * Real authentication is delegated to AuthSessionService (backend JWT + roles).
 * No local/IndexedDB credential validation is used.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly session = inject(AuthSessionService);

  readonly currentUser = computed(() => this.session.user());
  readonly isAuthenticated = this.session.isAuthenticated;
  readonly isAdminAuthenticated = this.session.isAdmin;

  login(identifier: string, password: string): Observable<UserRead> {
    const payload: LoginRequest = { identifier, password };
    return this.session.login(payload);
  }

  register(payload: RegisterRequest): Observable<UserRead> {
    return this.session.register(payload);
  }

  loginAdmin(identifier: string, password: string): Observable<boolean> {
    return this.session.login({ identifier, password }).pipe(
      map((user) => !!user.roles?.some((r) => r.code === 'ADMIN'))
    );
  }

  logout(): Observable<void> {
    return this.session.logout(true);
  }

  logoutAdmin(): Observable<void> {
    return this.session.logout(true);
  }

  getToken(): string | null {
    return this.session.getAccessToken();
  }

  hasAdminRole(user?: UserRead | null): boolean {
    const candidate = user ?? this.session.user();
    return !!candidate?.roles?.some((r) => r.code === 'ADMIN');
  }
}
