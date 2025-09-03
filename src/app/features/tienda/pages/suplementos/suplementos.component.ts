import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-suplementos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './suplementos.component.html',
})
export class SuplementosComponent implements OnInit {
  private cartService = inject(CartService);
  private productService = inject(ProductService);

  products: Product[] = [];

  ngOnInit(): void {
    this.products = this.productService.getSuplementosProducts();
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    alert(`${product.name} ha sido añadido al carrito.`);
  }
}

