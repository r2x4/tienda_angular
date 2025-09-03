import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-calzado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calzado.component.html',
})
export class CalzadoComponent {
  private cartService = inject(CartService);

  products: Product[] = [
    {
      id: 1,
      name: 'Tennis Adidas',
      price: 75.00,
      imageUrl: 'assets/calzado_TennisAdidas1.jpg',
      colors: ['black', 'white', 'blue'],
      selectedColor: 'black'
    },
    {
      id: 2,
      name: 'Tennis Dama 1',
      price: 60.00,
      imageUrl: 'assets/calzado_TennisDama1.jpg',
      colors: ['white', 'red'],
      selectedColor: 'white'
    },
    {
      id: 3,
      name: 'Tennis Dama 2',
      price: 65.00,
      imageUrl: 'assets/calzado_TennisDama2.jpg',
      colors: ['black', 'green'],
      selectedColor: 'black'
    },
    {
      id: 4,
      name: 'Tennis Blanco',
      price: 55.00,
      imageUrl: 'assets/calzado_tennis1.jpg',
      colors: ['white'],
      selectedColor: 'white'
    },
    {
      id: 5,
      name: 'Tennis Azul',
      price: 70.00,
      imageUrl: 'assets/calzado_tennis2.jpg',
      colors: ['blue', 'white'],
      selectedColor: 'blue'
    },
    {
      id: 6,
      name: 'Tennis Negro',
      price: 80.00,
      imageUrl: 'assets/calzado_tennis3.jpg',
      colors: ['black', 'red'],
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
