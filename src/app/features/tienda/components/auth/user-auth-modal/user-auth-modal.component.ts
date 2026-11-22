import { Component, ElementRef, EventEmitter, HostListener, OnDestroy, OnInit, Output, ViewChild, inject, signal } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
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
export class UserAuthModalComponent implements OnInit, OnDestroy {
  @Output() closeModal = new EventEmitter<void>();
  @ViewChild('dialogPanel') dialogPanel?: ElementRef<HTMLElement>;
  private readonly auth = inject(AuthSessionService);
  private readonly doc = inject(DOCUMENT);
  private lastFocus: HTMLElement | null = null;

  showLogin = true;
  loading = signal(false);
  errorMessage = signal('');
  successMessage = signal('');

  loginData = { identifier: '', password: '' };
  registerData = { name: '', lastName: '', email: '', username: '', phone: '', city: '', password: '' };

  ngOnInit(): void {
    this.lastFocus = this.doc.activeElement as HTMLElement;
    this.doc.body.style.overflow = 'hidden';
    setTimeout(() => this.dialogPanel?.nativeElement.querySelector<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')?.focus(), 0);
  }

  ngOnDestroy(): void { this.doc.body.style.overflow = ''; this.lastFocus?.focus(); }

  toggleForm(login: boolean): void { this.showLogin = login; this.errorMessage.set(''); this.successMessage.set(''); }

  @HostListener('document:keydown.escape')
  onEsc(): void { this.onClose(); }

  @HostListener('document:keydown', ['$event'])
  trapFocus(event: KeyboardEvent): void {
    if (event.key !== 'Tab') return;
    const panel = this.dialogPanel?.nativeElement;
    if (!panel) return;
    const focusable = panel.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
    if (!focusable.length) return;
    const first = focusable[0]; const last = focusable[focusable.length - 1];
    const active = this.doc.activeElement;
    if (event.shiftKey && active === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first.focus(); }
  }

  onLogin() {
    this.errorMessage.set(''); this.successMessage.set('');
    const identifier = this.loginData.identifier.trim();
    const password = this.loginData.password;
    if (!identifier || !password) { this.errorMessage.set('Email/usuario y contraseña son obligatorios.'); return; }
    this.loading.set(true);
    this.auth.login({ identifier, password }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => { this.successMessage.set('Sesión iniciada correctamente.'); this.closeModal.emit(); },
      error: (err) => this.errorMessage.set(normalizeApiError(err, 'No se pudo iniciar sesión.').message),
    });
  }

  onRegister() {
    this.errorMessage.set(''); this.successMessage.set('');
    const email = this.registerData.email.trim().toLowerCase();
    const password = this.registerData.password;
    if (!email || !password) { this.errorMessage.set('Email y contraseña son obligatorios.'); return; }
    this.loading.set(true);
    this.auth.register({
      email,
      username: this.registerData.username.trim() || null,
      password,
      first_name: this.registerData.name.trim() || null,
      last_name: this.registerData.lastName.trim() || null,
      phone: this.registerData.phone.trim() || null,
      city: this.registerData.city.trim() || null,
    }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: () => { this.successMessage.set('Registro exitoso. Sesión iniciada.'); this.closeModal.emit(); },
      error: (err) => this.errorMessage.set(normalizeApiError(err, 'No se pudo completar el registro.').message),
    });
  }

  onClose() { this.closeModal.emit(); }
}
