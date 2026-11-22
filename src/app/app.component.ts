import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationService } from './core/services/navigation.service';
import { UiToastContainerComponent } from './shared/ui/toast/ui-toast-container.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, UiToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  private navigationService = inject(NavigationService);

  title = 'tienda_angular';
  activeComponent: any;

  constructor() {
    this.activeComponent = this.navigationService.activeComponent;
  }
}

