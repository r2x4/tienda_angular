import { Injectable } from '@angular/core';
import { AuthSession, UserRead } from '../models/auth.models';

/**
 * Session persistence.
 * WARNING (XSS): access/refresh tokens are stored in localStorage for this phase
 * because backend cookie/CSRF changes are out of scope. Any XSS can exfiltrate tokens.
 * Do not store passwords. Keep CSP/sanitization strict and migrate to HttpOnly cookies in a future phase.
 */
const STORAGE_KEY = 'app_auth_session_v1';

@Injectable({ providedIn: 'root' })
export class TokenStorageService {
  private memorySession: AuthSession | null = null;

  load(): AuthSession | null {
    if (this.memorySession) return this.memorySession;
    if (!this.isBrowser()) return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    try {
      const parsed = JSON.parse(raw) as Partial<AuthSession> | null;
      if (!this.isValidSession(parsed)) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      this.memorySession = parsed;
      return parsed;
    } catch {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
  }

  save(session: AuthSession): void {
    if (!this.isValidSession(session)) {
      this.clear();
      return;
    }
    this.memorySession = { ...session };
    if (this.isBrowser()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memorySession));
    }
  }

  clear(): void {
    this.memorySession = null;
    if (this.isBrowser()) {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  getAccessToken(): string | null {
    return this.load()?.accessToken ?? null;
  }

  getRefreshToken(): string | null {
    return this.load()?.refreshToken ?? null;
  }

  updateUser(user: UserRead | null): void {
    const current = this.load();
    if (!current) return;
    this.save({ ...current, user });
  }

  updateTokens(accessToken: string, refreshToken: string, tokenType = 'bearer'): void {
    const current = this.load();
    this.save({
      accessToken,
      refreshToken,
      tokenType,
      user: current?.user ?? null,
    });
  }

  private isValidSession(value: unknown): value is AuthSession {
    if (!value || typeof value !== 'object') return false;
    const s = value as Record<string, unknown>;
    return typeof s['accessToken'] === 'string'
      && s['accessToken'].length > 0
      && typeof s['refreshToken'] === 'string'
      && s['refreshToken'].length > 0
      && typeof s['tokenType'] === 'string';
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
