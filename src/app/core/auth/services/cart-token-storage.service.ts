import { Injectable } from '@angular/core';

const GUEST_CART_TOKEN_KEY = 'app_guest_cart_token_v1';
const LEGACY_CART_KEY = 'shopping_cart';
const LEGACY_CART_BACKUP_KEY = 'shopping_cart_backup_f8';

@Injectable({ providedIn: 'root' })
export class CartTokenStorageService {
  getGuestCartToken(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(GUEST_CART_TOKEN_KEY);
  }

  setGuestCartToken(token: string): void {
    if (!this.isBrowser() || !token) return;
    localStorage.setItem(GUEST_CART_TOKEN_KEY, token);
  }

  clearGuestCartToken(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(GUEST_CART_TOKEN_KEY);
  }

  getLegacyCartRaw(): string | null {
    if (!this.isBrowser()) return null;
    return localStorage.getItem(LEGACY_CART_KEY);
  }

  clearLegacyCart(): void {
    if (!this.isBrowser()) return;
    localStorage.removeItem(LEGACY_CART_KEY);
  }

  backupLegacyCart(raw: string): void {
    if (!this.isBrowser() || !raw) return;
    localStorage.setItem(LEGACY_CART_BACKUP_KEY, raw);
  }

  getLegacyBackupKey(): string {
    return LEGACY_CART_BACKUP_KEY;
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
