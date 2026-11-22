import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from './toast.service';

@Component({
  selector: 'app-ui-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ui-toast-region" aria-label="Notificaciones" aria-live="polite" aria-relevant="additions text">
      <div *ngFor="let toast of toastService.toasts()" class="ui-toast" [ngClass]="'ui-toast--' + toast.variant" [attr.role]="toast.variant === 'error' ? 'alert' : 'status'">
        <div class="ui-toast__body">
          <strong *ngIf="toast.title" class="ui-toast__title">{{ toast.title }}</strong>
          <div class="ui-toast__message">{{ toast.message }}</div>
        </div>
        <button *ngIf="toast.dismissible" type="button" class="ui-toast__close" aria-label="Cerrar notificación" (click)="toastService.dismiss(toast.id)">×</button>
      </div>
    </section>
  `,
  styles: [`
    .ui-toast-region{position:fixed;top:1rem;right:1rem;z-index:2000;display:flex;flex-direction:column;gap:.75rem;width:min(24rem,calc(100vw - 2rem))}
    .ui-toast{display:flex;align-items:flex-start;gap:.75rem;padding:.875rem 1rem;border-radius:var(--radius-md);box-shadow:var(--shadow-lg);border:1px solid transparent;font-family:var(--font-ui);animation:toast-in var(--transition-base)}
    .ui-toast__body{flex:1}
    .ui-toast__title{display:block;font-size:.9rem;margin-bottom:.15rem}
    .ui-toast__message{font-size:.875rem;line-height:1.4}
    .ui-toast__close{background:none;border:none;color:inherit;font-size:1.25rem;cursor:pointer;min-width:44px;min-height:44px;margin:-.5rem -.5rem -.5rem 0}
    .ui-toast--success{background:#edf7f1;color:#1f6a45;border-color:rgba(47,133,90,.2)}
    .ui-toast--error{background:#fdecec;color:var(--color-danger-600);border-color:rgba(194,65,65,.2)}
    .ui-toast--warning{background:#fff8e8;color:var(--color-warning-600);border-color:rgba(180,83,9,.2)}
    .ui-toast--info{background:#eef7f6;color:var(--color-teal-700);border-color:rgba(31,122,119,.2)}
    @keyframes toast-in{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
    @media (max-width:640px){.ui-toast-region{left:1rem;right:1rem;width:auto}}
  `]
})
export class UiToastContainerComponent {
  readonly toastService = inject(ToastService);
}
