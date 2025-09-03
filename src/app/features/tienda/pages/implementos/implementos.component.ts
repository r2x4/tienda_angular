import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-implementos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './implementos.component.html',
})
export class ImplementosComponent {
  private cartService = inject(CartService);

  products: Product[] = [
    {
      id: 1,
      name: 'Balón de Baloncesto',
      price: 29.99,
      imageUrl: 'assets/implementos_Balon_Baloncesto.jpg',
      colors: []
    },
    {
      id: 2,
      name: 'Balón de Fútbol',
      price: 24.99,
      imageUrl: 'assets/implementos_Balon_Futbol.jpg',
      colors: []
    },
    {
      id: 3,
      name: 'Pera de Boxeo',
      price: 34.99,
      imageUrl: 'assets/implementos_Pera_Boxeo.jpg',
      colors: []
    },
    {
      id: 4,
      name: 'Saco de Boxeo',
      price: 89.99,
      imageUrl: 'assets/implementos_Saco_Boxeo.jpg',
      colors: []
    }
  ];

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    alert(`${product.name} ha sido añadido al carrito.`);
  }
}
