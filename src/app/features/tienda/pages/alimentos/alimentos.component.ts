import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-alimentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alimentos.component.html',
})
export class AlimentosComponent implements OnInit {
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

