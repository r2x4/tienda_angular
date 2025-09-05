import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-resenas',
  standalone: true,
  imports: [],
  templateUrl: './reseñas.component.html',
})
export class ReseñasComponent {
  private router = inject(Router);

  goBack() {
    this.router.navigate(['/inicial']);
  }
}