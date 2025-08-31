import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-ropa',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ropa.component.html',
})
export class RopaComponent {
  products: Product[] = [
    {
      id: 1,
      name: 'Buzo Deportivo 1',
      price: 45.00,
      imageUrl: 'assets/ropa_Buzo1.jpg',
      colors: ['black', 'gray']
    },
    {
      id: 2,
      name: 'Buzo Deportivo 2',
      price: 50.00,
      imageUrl: 'assets/ropa_Buzo2.jpg',
      colors: ['blue', 'white']
    },
    {
      id: 3,
      name: 'Pantaloneta Deportiva',
      price: 25.00,
      imageUrl: 'assets/ropa_Pantaloneta1.jpg',
      colors: ['black', 'red']
    },
    {
      id: 4,
      name: 'Ropa Deportiva General',
      price: 60.00,
      imageUrl: 'assets/ropa_ropaDeportiva.jpg',
      colors: ['gray', 'white']
    },
    {
      id: 5,
      name: 'Sudadera Deportiva',
      price: 35.00,
      imageUrl: 'assets/ropa_Sudadera1.jpg',
      colors: ['black', 'green']
    }
  ];
}
