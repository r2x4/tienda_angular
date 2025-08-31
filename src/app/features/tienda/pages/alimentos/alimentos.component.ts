import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-alimentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alimentos.component.html',
})
export class AlimentosComponent {
  private cartService = inject(CartService);

  products: Product[] = [
    {
      id: 1,
      name: 'Balón de Baloncesto',
      price: 30.00,
      imageUrl: 'assets/implementos_Balon_Baloncesto.jpg',
      colors: ['orange', 'black']
    },
    {
      id: 2,
      name: 'Balón de Fútbol',
      price: 25.00,
      imageUrl: 'assets/implementos_Balon_Futbol.jpg',
      colors: ['white', 'black']
    },
    {
      id: 3,
      name: 'Pera de Boxeo',
      price: 40.00,
      imageUrl: 'assets/implementos_Pera_Boxeo.jpg',
      colors: ['red', 'black']
    },
    {
      id: 4,
      name: 'Saco de Boxeo',
      price: 80.00,
      imageUrl: 'assets/implementos_Saco_Boxeo.jpg',
      colors: ['black']
    }
  ];

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    alert(`${product.name} ha sido añadido al carrito.`);
  }
}
