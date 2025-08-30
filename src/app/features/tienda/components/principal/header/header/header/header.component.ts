import { Component, Input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './header.component.html',
})
export default class HeaderComponent {
  @Input() pageTitle: string = 'SPORT-FIVE';
  @Input() showHomeButton: boolean = false;
}
