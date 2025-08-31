import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-suplementos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suplementos.component.html',
})
export class SuplementosComponent {
  products: Product[] = [
    {
      id: 1,
      name: 'Aminoácidos',
      price: 40.00,
      imageUrl: 'assets/suplementos_Aminoacidos.jpg',
      colors: ['blue', 'white']
    },
    {
      id: 2,
      name: 'Creatina',
      price: 35.00,
      imageUrl: 'assets/suplementos_Creatina.jpg',
      colors: ['white', 'black']
    },
    {
      id: 3,
      name: 'Proteína Whey',
      price: 60.00,
      imageUrl: 'assets/suplementos_Proteina_Whey.jpg',
      colors: ['chocolate', 'vanilla']
    },
    {
      id: 4,
      name: 'Suplementos Varios',
      price: 50.00,
      imageUrl: 'assets/suplementos_Suplementos.jpg',
      colors: ['gray', 'orange']
    }
  ];
}
