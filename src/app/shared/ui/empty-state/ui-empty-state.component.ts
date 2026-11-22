import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-empty-state',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="ui-empty" role="status" aria-live="polite">
      <div class="ui-empty__icon" aria-hidden="true">{{ icon }}</div>
      <h3 class="ui-empty__title">{{ title }}</h3>
      <p *ngIf="description" class="ui-empty__desc">{{ description }}</p>
      <div class="ui-empty__actions"><ng-content></ng-content></div>
    </section>
  `,
  styles: [`
    .ui-empty{padding:2rem 1rem;text-align:center;border:1px dashed var(--color-line-200);border-radius:var(--radius-lg);background:var(--color-surface);font-family:var(--font-ui)}
    .ui-empty__icon{font-size:1.75rem;margin-bottom:.5rem}
    .ui-empty__title{margin:0;font-family:var(--font-display);font-size:1.15rem;color:var(--color-ink-900)}
    .ui-empty__desc{margin:.5rem auto 0;max-width:42ch;color:var(--color-ink-600);font-size:.95rem}
    .ui-empty__actions{margin-top:1rem;display:flex;justify-content:center;gap:.5rem;flex-wrap:wrap}
  `]
})
export class UiEmptyStateComponent {
  @Input() title = 'No hay información para mostrar';
  @Input() description = '';
  @Input() icon = '□';
}
