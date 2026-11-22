import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

type AlertVariant = 'success' | 'error' | 'warning' | 'info';

@Component({
  selector: 'app-ui-alert',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="ui-alert" [ngClass]="'ui-alert--' + variant" [attr.role]="role" [attr.aria-live]="ariaLive">
      <div class="ui-alert__content">
        <strong *ngIf="title" class="ui-alert__title">{{ title }}</strong>
        <div class="ui-alert__message"><ng-content></ng-content></div>
      </div>
      <button *ngIf="dismissible" type="button" class="ui-alert__close" aria-label="Cerrar alerta" (click)="closed.emit()">×</button>
    </div>
  `,
  styles: [`
    .ui-alert{display:flex;gap:.75rem;align-items:flex-start;padding:.875rem 1rem;border-radius:var(--radius-md);border:1px solid transparent;font-family:var(--font-ui)}
    .ui-alert__content{flex:1}
    .ui-alert__title{display:block;margin-bottom:.15rem;font-size:.9rem}
    .ui-alert__message{font-size:.9rem;line-height:1.4}
    .ui-alert__close{background:none;border:none;font-size:1.25rem;line-height:1;cursor:pointer;color:inherit;padding:0 .25rem;min-width:44px;min-height:44px;margin:-.5rem -.5rem -.5rem 0}
    .ui-alert--success{background:rgba(47,133,90,.1);color:#1f6a45;border-color:rgba(47,133,90,.2)}
    .ui-alert--error{background:rgba(194,65,65,.1);color:var(--color-danger-600);border-color:rgba(194,65,65,.2)}
    .ui-alert--warning{background:rgba(180,83,9,.1);color:var(--color-warning-600);border-color:rgba(180,83,9,.2)}
    .ui-alert--info{background:rgba(31,122,119,.1);color:var(--color-teal-700);border-color:rgba(31,122,119,.2)}
  `]
})
export class UiAlertComponent {
  @Input() variant: AlertVariant = 'info';
  @Input() title = '';
  @Input() dismissible = false;
  @Output() closed = new EventEmitter<void>();

  get role(): string { return this.variant === 'error' || this.variant === 'warning' ? 'alert' : 'status'; }
  get ariaLive(): 'assertive' | 'polite' { return this.variant === 'error' || this.variant === 'warning' ? 'assertive' : 'polite'; }
}
