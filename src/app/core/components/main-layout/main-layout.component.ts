import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, map } from 'rxjs/operators';
import HeaderComponent from '../../../features/tienda/components/principal/header/header/header/header.component';
import FooterComponent from '../../../features/tienda/components/principal/footer/footer/footer/footer.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent],
  template: `
    <div class="flex flex-col min-h-screen">
      <app-header [pageTitle]="pageTitle" [showHomeButton]="showHomeButton"></app-header>
      <main class="flex-grow">
        <router-outlet></router-outlet>
      </main>
      <app-footer></app-footer>
    </div>
  `,
  styles: [`
    /* You can add global styles here if needed, or rely on Tailwind */
  `]
})
export class MainLayoutComponent implements OnInit {
  private router = inject(Router);
  private activatedRoute = inject(ActivatedRoute);

  pageTitle: string = 'SPORT-FIVE';
  showHomeButton: boolean = false;

  ngOnInit() {
    // Set initial title based on current route snapshot
    this.updateTitleAndButton(this.activatedRoute);

    // Subscribe to router events for subsequent navigations
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd),
      map(() => this.activatedRoute) // Pass the activatedRoute to the next map
    ).subscribe((route: ActivatedRoute) => {
      this.updateTitleAndButton(route);
    });
  }

  private updateTitleAndButton(route: ActivatedRoute) {
    let child = route.firstChild;
    let currentTitle = 'SPORT-FIVE';
    let currentPath = '';

    while (child) {
      if (child.firstChild) {
        child = child.firstChild;
      } else {
        if (child.snapshot.data && child.snapshot.data['title']) {
          currentTitle = child.snapshot.data['title'];
        }
        currentPath = child.snapshot.url.map(segment => segment.path).join('/');
        break;
      }
    }

    this.showHomeButton = ['alimentos', 'calzado', 'ropa', 'suplementos'].includes(currentPath);
    if (currentTitle === 'Inicio') {
      this.pageTitle = 'SPORT-FIVE';
    } else {
      this.pageTitle = `SPORT-FIVE - ${currentTitle}`;
    }
  }
}