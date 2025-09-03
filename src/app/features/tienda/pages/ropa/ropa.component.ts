import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-ropa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ropa.component.html',
})
export class RopaComponent {
  private cartService = inject(CartService);

  products: Product[] = [
    {
      id: 1,
      name: 'Buzo Deportivo 1',
      price: 45.00,
      imageUrl: 'assets/ropa_Buzo1.jpg',
      colors: ['black', 'gray'],
      selectedColor: 'black'
    },
    {
      id: 2,
      name: 'Buzo Deportivo 2',
      price: 50.00,
      imageUrl: 'assets/ropa_Buzo2.jpg',
      colors: ['blue', 'white'],
      selectedColor: 'blue'
    },
    {
      id: 3,
      name: 'Pantaloneta Deportiva',
      price: 25.00,
      imageUrl: 'assets/ropa_Pantaloneta1.jpg',
      colors: ['black', 'red'],
      selectedColor: 'black'
    },
    {
      id: 4,
      name: 'Ropa Deportiva General',
      price: 60.00,
      imageUrl: 'assets/ropa_ropaDeportiva.jpg',
      colors: ['gray', 'white'],
      selectedColor: 'gray'
    },
    {
      id: 5,
      name: 'Sudadera Deportiva',
      price: 35.00,
      imageUrl: 'assets/ropa_Sudadera1.jpg',
      colors: ['black', 'green'],
      selectedColor: 'black'
    }
  ];

  selectColor(product: Product, color: string) {
    product.selectedColor = color;
  }

  addToCart(product: Product) {
    if (!product.selectedColor) {
      alert('Por favor, selecciona un color antes de añadir al carrito.');
      return;
    }
    this.cartService.addToCart(product);
    alert(`${product.name} (${product.selectedColor}) ha sido añadido al carrito.`);
  }
}
