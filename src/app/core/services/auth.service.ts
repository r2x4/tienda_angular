import { Injectable, signal, inject } from '@angular/core';
import { Router } from '@angular/router';
import { IndexedDbService, User } from './indexed-db.service'; // Import User interface and IndexedDbService

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly USER_STORAGE_KEY = 'current_user';
  private readonly TOKEN_STORAGE_KEY = 'auth_token';

  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);
  isAdminAuthenticated = signal<boolean>(false);

  private router = inject(Router);
  private indexedDbService = inject(IndexedDbService);

  constructor() {
    this.loadUserFromLocalStorage();
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  private loadUserFromLocalStorage(): void {
    if (this.isBrowser()) {
      const storedUser = localStorage.getItem(this.USER_STORAGE_KEY);
      const storedToken = localStorage.getItem(this.TOKEN_STORAGE_KEY);

      if (storedUser && storedToken) {
        try {
          const user: User = JSON.parse(storedUser);
          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          this.isAdminAuthenticated.set(user.isAdmin || false); // Set admin status based on user data
        } catch (e) {
          console.error('Error parsing user data from localStorage', e);
          this.logout(); // Limpiar datos corruptos
        }
      }
    }
  }

  async login(username: string, password: string): Promise<boolean> {
    const user = await this.indexedDbService.getUserByUsername(username);

    if (user && user.password === password) { // In a real app, hash and compare passwords
      if (this.isBrowser()) {
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
        // For simplicity, not generating a token here. In a real app, a token would be generated.
        localStorage.setItem(this.TOKEN_STORAGE_KEY, 'dummy_token');
      }
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      this.isAdminAuthenticated.set(user.isAdmin || false);
      this.router.navigate(['/']); // Redirigir a la página principal o dashboard
      return true;
    }
    this.isAuthenticated.set(false);
    this.isAdminAuthenticated.set(false);
    return false;
  }

  logout(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.USER_STORAGE_KEY);
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isAdminAuthenticated.set(false);
    this.router.navigate(['/login']); // Redirigir a la página de login
  }

  async loginAdmin(username: string, password: string): Promise<boolean> {
    const user = await this.indexedDbService.getUserByUsername(username);

    if (user && user.isAdmin && user.password === password) { // In a real app, hash and compare passwords
      if (this.isBrowser()) {
        localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem(this.TOKEN_STORAGE_KEY, 'dummy_admin_token');
      }
      this.currentUser.set(user);
      this.isAuthenticated.set(true);
      this.isAdminAuthenticated.set(true);
      return true;
    }
    this.isAdminAuthenticated.set(false);
    return false;
  }

  logoutAdmin(): void {
    if (this.isBrowser()) {
      localStorage.removeItem(this.USER_STORAGE_KEY);
      localStorage.removeItem(this.TOKEN_STORAGE_KEY);
    }
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.isAdminAuthenticated.set(false);
    this.router.navigate(['/admin/login']); // Redirect to admin login
  }

  getToken(): string | null {
    return this.isBrowser() ? localStorage.getItem(this.TOKEN_STORAGE_KEY) : null;
  }

  // Ejemplo de cómo podrías usarlo en un guard o interceptor
  // checkAuth(): boolean {
  //   return this.isAuthenticated();
  // }
}
