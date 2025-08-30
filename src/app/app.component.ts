import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationService } from './core/services/navigation.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class App {
  title = 'tienda_angular';
  activeComponent: any;

  constructor(private navigationService: NavigationService) {
    this.activeComponent = this.navigationService.activeComponent;
  }
}
