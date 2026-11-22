import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-skeleton',
  standalone: true,
  imports: [CommonModule],
  template: `<div class="ui-skeleton" [ngStyle]="{ width, height, borderRadius: radius }" aria-hidden="true"></div>`,
  styles: [`
    .ui-skeleton{background:linear-gradient(90deg,#ece7df 25%,#f7f5f1 37%,#ece7df 63%);background-size:400% 100%;animation:ui-shimmer 1.4s ease infinite}
    @keyframes ui-shimmer{0%{background-position:100% 0}100%{background-position:0 0}}
  `]
})
export class UiSkeletonComponent {
  @Input() width = '100%';
  @Input() height = '1rem';
  @Input() radius = '0.5rem';
}
