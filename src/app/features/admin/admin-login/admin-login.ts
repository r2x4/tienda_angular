import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

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

  private authService = inject(AuthService);
  private router = inject(Router);

  async login(): Promise<void> {
    this.errorMessage.set(''); // Clear previous errors
    const loggedIn = await this.authService.loginAdmin(this.username(), this.password());
    if (loggedIn) {
      setTimeout(() => {
        this.router.navigate(['/admin/services']); // Redirect to admin services CRUD
      }, 50); // Small delay to allow signal to propagate
    } else {
      this.errorMessage.set('Nombre de usuario o contraseña incorrectos.');
    }
  }
}

