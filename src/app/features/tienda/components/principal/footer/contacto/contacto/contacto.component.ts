// components/footer/contacto/contacto.component.ts
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [],
  templateUrl: './contacto.component.html',
})
export class ContactoComponent {
  phoneNumber = '573195059272';
  message = 'Hola, me interesa conocer más sobre sus productos.';
  whatsappLink = `https://wa.me/${this.phoneNumber}?text=${encodeURIComponent(this.message)}`;

  private router = inject(Router);

  goBack() {
    this.router.navigate(['/inicial']);
  }
}