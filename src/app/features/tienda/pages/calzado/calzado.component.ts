import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Product } from '../../interfaces/product.interface';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-calzado',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './calzado.component.html',
})
export class CalzadoComponent implements OnInit {
  private cartService = inject(CartService);
  private productService = inject(ProductService);

  products: Product[] = [];

  ngOnInit(): void {
    this.products = this.productService.getCalzadoProducts();
  }

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

