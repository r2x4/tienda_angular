import { Injectable } from '@angular/core';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private suplementosProducts: Product[] = [
    {
      id: 1,
      name: 'Aminoácidos',
      price: 40.00,
      imageUrl: 'assets/suplementos_Aminoacidos.jpg',
      colors: ['blue', 'white'],
      category: 'suplementos',
      stock: 3
    },
    {
      id: 2,
      name: 'Creatina',
      price: 35.00,
      imageUrl: 'assets/suplementos_Creatina.jpg',
      colors: ['white', 'black'],
      category: 'suplementos',
      stock: 3
    },
    {
      id: 3,
      name: 'Proteína Whey',
      price: 60.00,
      imageUrl: 'assets/suplementos_Proteina_Whey.jpg',
      colors: ['chocolate', 'vanilla'],
      category: 'suplementos',
      stock: 3
    },
    {
      id: 4,
      name: 'Suplementos Varios',
      price: 50.00,
      imageUrl: 'assets/suplementos_Suplementos.jpg',
      colors: ['gray', 'orange'],
      category: 'suplementos',
      stock: 3
    }
  ];

  private ropaProducts: Product[] = [
    {
      id: 101,
      name: 'Buzo Deportivo 1',
      price: 45.00,
      imageUrl: 'assets/ropa_Buzo1.jpg',
      colors: ['black', 'gray'],
      category: 'ropa',
      stock: 3
    },
    {
      id: 102,
      name: 'Buzo Deportivo 2',
      price: 50.00,
      imageUrl: 'assets/ropa_Buzo2.jpg',
      colors: ['blue', 'white'],
      category: 'ropa',
      stock: 3
    },
    {
      id: 103,
      name: 'Pantaloneta Deportiva',
      price: 25.00,
      imageUrl: 'assets/ropa_Pantaloneta1.jpg',
      colors: ['black', 'red'],
      category: 'ropa',
      stock: 3
    },
    {
      id: 104,
      name: 'Ropa Deportiva General',
      price: 60.00,
      imageUrl: 'assets/ropa_ropaDeportiva.jpg',
      colors: ['gray', 'white'],
      category: 'ropa',
      stock: 3
    },
    {
      id: 105,
      name: 'Sudadera Deportiva',
      price: 35.00,
      imageUrl: 'assets/ropa_Sudadera1.jpg',
      colors: ['black', 'green'],
      category: 'ropa',
      stock: 3
    }
  ];

  private calzadoProducts: Product[] = [
    {
      id: 201,
      name: 'Tennis Adidas',
      price: 75.00,
      imageUrl: 'assets/calzado_TennisAdidas1.jpg',
      colors: ['black', 'white', 'blue'],
      category: 'calzado',
      stock: 3
    },
    {
      id: 202,
      name: 'Tennis Dama 1',
      price: 60.00,
      imageUrl: 'assets/calzado_TennisDama1.jpg',
      colors: ['white', 'red'],
      category: 'calzado',
      stock: 3
    },
    {
      id: 203,
      name: 'Tennis Dama 2',
      price: 65.00,
      imageUrl: 'assets/calzado_TennisDama2.jpg',
      colors: ['black', 'green'],
      category: 'calzado',
      stock: 3
    },
    {
      id: 204,
      name: 'Tennis Blanco',
      price: 55.00,
      imageUrl: 'assets/calzado_tennis1.jpg',
      colors: ['white'],
      category: 'calzado',
      stock: 3
    },
    {
      id: 205,
      name: 'Tennis Azul',
      price: 70.00,
      imageUrl: 'assets/calzado_tennis2.jpg',
      colors: ['blue', 'white'],
      category: 'calzado',
      stock: 3
    },
    {
      id: 206,
      name: 'Tennis Negro',
      price: 80.00,
      imageUrl: 'assets/calzado_tennis3.jpg',
      colors: ['black', 'red'],
      category: 'calzado',
      stock: 3
    }
  ];

  private implementosProducts: Product[] = [
    {
      id: 301,
      name: 'Balón de Baloncesto',
      price: 29.99,
      imageUrl: 'assets/implementos_Balon_Baloncesto.jpg',
      colors: [],
      category: 'implementos',
      stock: 3
    },
    {
      id: 302,
      name: 'Balón de Fútbol',
      price: 24.99,
      imageUrl: 'assets/implementos_Balon_Futbol.jpg',
      colors: [],
      category: 'implementos',
      stock: 3
    },
    {
      id: 303,
      name: 'Pera de Boxeo',
      price: 34.99,
      imageUrl: 'assets/implementos_Pera_Boxeo.jpg',
      colors: [],
      category: 'implementos',
      stock: 3
    },
    {
      id: 304,
      name: 'Saco de Boxeo',
      price: 89.99,
      imageUrl: 'assets/implementos_Saco_Boxeo.jpg',
      colors: [],
      category: 'implementos',
      stock: 3
    }
  ];

  getSuplementosProducts(): Product[] {
    return this.suplementosProducts;
  }

  getRopaProducts(): Product[] {
    return this.ropaProducts;
  }

  getCalzadoProducts(): Product[] {
    return this.calzadoProducts;
  }

  getImplementosProducts(): Product[] {
    return this.implementosProducts;
  }
}