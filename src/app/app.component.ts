import { Component, signal, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationService } from './core/services/navigation.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
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
