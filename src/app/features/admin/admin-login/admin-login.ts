import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { normalizeApiError } from '../../../core/api/api-error';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './admin-login.html',
  styleUrl: './admin-login.css'
})
export class AdminLoginComponent {
  username = signal<string>('');
  password = signal<string>('');
  errorMessage = signal<string>('');
  loading = signal<boolean>(false);

  private authService = inject(AuthService);
  private session = inject(AuthSessionService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  login(): void {
    this.errorMessage.set('');
    const identifier = this.username().trim();
    const password = this.password();

    if (!identifier || !password) {
      this.errorMessage.set('Usuario y contraseña son obligatorios.');
      return;
    }

    this.loading.set(true);
    this.authService.loginAdmin(identifier, password)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (isAdmin) => {
          if (isAdmin) {
            const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl') || '/admin/services';
            this.router.navigateByUrl(returnUrl);
            return;
          }

          this.errorMessage.set('Tu cuenta no tiene rol ADMIN.');
          this.session.logout(false).subscribe();
        },
        error: (err) => {
          const apiErr = normalizeApiError(err, 'No se pudo iniciar sesión.');
          this.errorMessage.set(apiErr.message);
        }
      });
  }
}

