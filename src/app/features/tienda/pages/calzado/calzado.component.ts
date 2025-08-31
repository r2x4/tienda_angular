import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';

@Component({
  selector: 'app-calzado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calzado.component.html',
})
export class CalzadoComponent {
  products: Product[] = [
    {
      id: 1,
      name: 'Tennis Adidas',
      price: 75.00,
      imageUrl: 'assets/calzado_TennisAdidas1.jpg',
      colors: ['black', 'white', 'blue']
    },
    {
      id: 2,
      name: 'Tennis Dama 1',
      price: 60.00,
      imageUrl: 'assets/calzado_TennisDama1.jpg',
      colors: ['white', 'red']
    },
    {
      id: 3,
      name: 'Tennis Dama 2',
      price: 65.00,
      imageUrl: 'assets/calzado_TennisDama2.jpg',
      colors: ['black', 'green']
    },
    {
      id: 4,
      name: 'Tennis Blanco',
      price: 55.00,
      imageUrl: 'assets/calzado_tennis1.jpg',
      colors: ['white']
    },
    {
      id: 5,
      name: 'Tennis Azul',
      price: 70.00,
      imageUrl: 'assets/calzado_tennis2.jpg',
      colors: ['blue', 'white']
    },
    {
      id: 6,
      name: 'Tennis Negro',
      price: 80.00,
      imageUrl: 'assets/calzado_tennis3.jpg',
      colors: ['black', 'red']
    }
  ];
}
