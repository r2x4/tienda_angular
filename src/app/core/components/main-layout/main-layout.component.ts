import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import HeaderComponent from '../../../features/tienda/components/principal/header/header/header/header.component';
import FooterComponent from '../../../features/tienda/components/principal/footer/footer/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="min-h-screen flex flex-col bg-sand-50 text-ink-900">
      <app-header></app-header>
      <main class="flex-1 w-full">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `
})
export class MainLayoutComponent {}