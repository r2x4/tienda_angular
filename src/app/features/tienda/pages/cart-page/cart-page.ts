import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './cart-page.html',
  styleUrls: ['./cart-page.css']
})
export class CartPageComponent {
  public cartService = inject(CartService);

  // Usamos computed para derivar valores del signal del servicio
  public cartItems = computed(() => this.cartService.cartItems());
  public total = computed(() => this.cartService.getTotal());

  public removeFromCart(productId: number): void {
    this.cartService.removeFromCart(productId);
  }

  public clearCart(): void {
    this.cartService.clearCart();
  }

  // Simula el proceso de pago
  public checkout(): void {
    if (this.cartItems().length > 0) {
      alert('¡Gracias por tu compra! (Esto es una simulación)');
      this.cartService.clearCart();
    } else {
      alert('Tu carrito está vacío.');
    }
  }
}