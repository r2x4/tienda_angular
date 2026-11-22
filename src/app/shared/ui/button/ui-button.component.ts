import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-ui-button',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      [attr.type]="type"
      [disabled]="disabled || loading"
      [attr.aria-busy]="loading ? 'true' : null"
      [ngClass]="classes"
    >
      <span *ngIf="loading" class="ui-btn__spinner" aria-hidden="true"></span>
      <span class="ui-btn__label"><ng-content></ng-content></span>
    </button>
  `,
  styles: [`
    :host{display:inline-block}
    .ui-btn{display:inline-flex;align-items:center;justify-content:center;gap:.5rem;border-radius:var(--radius-md);font-family:var(--font-ui);font-weight:600;border:1px solid transparent;cursor:pointer;transition:all var(--transition-fast);min-height:44px}
    .ui-btn:disabled{opacity:.55;cursor:not-allowed}
    .ui-btn--sm{padding:.5rem .875rem;font-size:.875rem}
    .ui-btn--md{padding:.75rem 1rem;font-size:.95rem}
    .ui-btn--lg{padding:.875rem 1.25rem;font-size:1rem}
    .ui-btn--primary{background:var(--color-ink-900);color:#fff}
    .ui-btn--primary:hover:not(:disabled){background:#0f1722}
    .ui-btn--secondary{background:#fff;color:var(--color-ink-900);border-color:var(--color-line-200)}
    .ui-btn--secondary:hover:not(:disabled){background:var(--color-sand-50);border-color:var(--color-ink-600)}
    .ui-btn--ghost{background:transparent;color:var(--color-teal-700)}
    .ui-btn--ghost:hover:not(:disabled){background:rgba(31,122,119,.08)}
    .ui-btn--danger{background:var(--color-danger-600);color:#fff}
    .ui-btn--danger:hover:not(:disabled){filter:brightness(.95)}
    .ui-btn--full{width:100%}
    .ui-btn__spinner{width:1rem;height:1rem;border:2px solid rgba(255,255,255,.4);border-top-color:currentColor;border-radius:50%;animation:spin .8s linear infinite}
    .ui-btn--secondary .ui-btn__spinner,.ui-btn--ghost .ui-btn__spinner{border-color:rgba(28,36,48,.2);border-top-color:currentColor}
    @keyframes spin{to{transform:rotate(360deg)}}
  `]
})
export class UiButtonComponent {
  @Input() variant: ButtonVariant = 'primary';
  @Input() size: ButtonSize = 'md';
  @Input() type: 'button' | 'submit' | 'reset' = 'button';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() fullWidth = false;

  get classes(): Record<string, boolean> {
    return {
      'ui-btn': true,
      [`ui-btn--${this.variant}`]: true,
      [`ui-btn--${this.size}`]: true,
      'ui-btn--full': this.fullWidth,
    };
  }
}
