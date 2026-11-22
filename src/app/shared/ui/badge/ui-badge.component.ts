import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

type BadgeVariant = 'neutral' | 'teal' | 'amber' | 'success' | 'danger' | 'warning';

@Component({
  selector: 'app-ui-badge',
  standalone: true,
  imports: [CommonModule],
  template: `<span class="ui-badge" [ngClass]="'ui-badge--' + variant"><ng-content></ng-content></span>`,
  styles: [`
    .ui-badge{display:inline-flex;align-items:center;padding:.2rem .6rem;border-radius:var(--radius-pill);font-size:.75rem;font-weight:700;font-family:var(--font-ui);line-height:1.2}
    .ui-badge--neutral{background:#ECE7DF;color:var(--color-ink-900)}
    .ui-badge--teal{background:rgba(31,122,119,.12);color:var(--color-teal-700)}
    .ui-badge--amber{background:rgba(231,163,62,.18);color:#7A4B00}
    .ui-badge--success{background:rgba(47,133,90,.12);color:var(--color-success-600)}
    .ui-badge--danger{background:rgba(194,65,65,.12);color:var(--color-danger-600)}
    .ui-badge--warning{background:rgba(180,83,9,.12);color:var(--color-warning-600)}
  `]
})
export class UiBadgeComponent {
  @Input() variant: BadgeVariant = 'neutral';
}
