import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AuthSessionService } from '../../../../../core/auth/services/auth-session.service';
import { normalizeApiError } from '../../../../../core/api/api-error';

@Component({
  selector: 'app-user-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-auth-modal.component.html',
  styleUrls: ['./user-auth-modal.component.css']
})
export class UserAuthModalComponent {
  @Output() closeModal = new EventEmitter<void>();
  private readonly auth = inject(AuthSessionService);

  showLogin = true; // true for login, false for register
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  loginData = { identifier: '', password: '' };
  registerData = { name: '', lastName: '', email: '', username: '', phone: '', city: '', password: '' };

  toggleForm() {
    this.showLogin = !this.showLogin;
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  onLogin() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const identifier = this.loginData.identifier.trim();
    const password = this.loginData.password;
    if (!identifier || !password) {
      this.errorMessage.set('Email/usuario y contraseña son obligatorios.');
      return;
    }

    this.loading.set(true);
    this.auth.login({ identifier, password })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Sesión iniciada correctamente.');
          this.closeModal.emit();
        },
        error: (err) => this.errorMessage.set(normalizeApiError(err, 'No se pudo iniciar sesión.').message),
      });
  }

  onRegister() {
    this.errorMessage.set('');
    this.successMessage.set('');

    const email = this.registerData.email.trim().toLowerCase();
    const password = this.registerData.password;
    if (!email || !password) {
      this.errorMessage.set('Email y contraseña son obligatorios.');
      return;
    }

    this.loading.set(true);
    this.auth.register({
      email,
      username: this.registerData.username.trim() || null,
      password,
      first_name: this.registerData.name.trim() || null,
      last_name: this.registerData.lastName.trim() || null,
      phone: this.registerData.phone.trim() || null,
      city: this.registerData.city.trim() || null,
    }).pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: () => {
          this.successMessage.set('Registro exitoso. Sesión iniciada.');
          this.closeModal.emit();
        },
        error: (err) => this.errorMessage.set(normalizeApiError(err, 'No se pudo completar el registro.').message),
      });
  }

  onClose() {
    this.closeModal.emit();
  }
}
