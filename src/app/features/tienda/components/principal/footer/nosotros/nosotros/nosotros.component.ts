import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-nosotros',
  standalone: true,
  imports: [],
  templateUrl: './nosotros.component.html',
})
export class NosotrosComponent {
  private router = inject(Router);

  goBack() {
    this.router.navigate(['/inicial']);
  }
}