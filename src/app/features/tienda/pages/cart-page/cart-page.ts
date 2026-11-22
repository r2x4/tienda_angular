import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { CartService } from '../../services/cart.service';
import { AuthSessionService } from '../../../../core/auth/services/auth-session.service';
import { normalizeApiError } from '../../../../core/api/api-error';
import { BuyerInfo, OrderRead } from '../../models/cart.models';
import { formatCop } from '../../models/catalog-view.models';

@Component({
  selector: 'app-cart-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './cart-page.html',
  styleUrls: ['./cart-page.css']
})
export class CartPageComponent {
  readonly cartService = inject(CartService);
  readonly auth = inject(AuthSessionService);
  readonly formatCop = formatCop;

  readonly cartItems = computed(() => this.cartService.cartItems());
  readonly total = computed(() => this.cartService.getTotal());
  readonly loading = this.cartService.loading;
  readonly error = this.cartService.error;
  readonly transitionMessage = this.cartService.legacyTransitionMessage;

  buyer: BuyerInfo = { full_name: '', email: '', phone: '', address: '' };
  checkoutLoading = signal(false);
  checkoutError = signal('');
  checkoutSuccess = signal<OrderRead | null>(null);
  guestOrderLookupId = signal('');
  guestOrderLookupToken = signal('');
  guestLookupLoading = signal(false);
  guestLookupError = signal('');
  guestLookupOrder = signal<OrderRead | null>(null);
  myOrders = signal<OrderRead[]>([]);
  myOrdersLoading = signal(false);
  myOrdersError = signal('');

  ngOnInit(): void {
    this.cartService.loadCart().subscribe();
    if (this.auth.isAuthenticated()) this.loadMyOrders();
  }

  loadCart(): void { this.cartService.loadCart().subscribe(); }

  removeFromCart(productId: string): void {
    this.cartService.removeFromCart(productId).subscribe({ error: (e) => this.error.set?.(normalizeApiError(e).message) });
  }

  updateQuantity(productId: string, quantity: number): void {
    const q = Number(quantity);
    if (!Number.isFinite(q) || q < 1) return;
    this.cartService.updateQuantity(productId, q).subscribe({ error: () => undefined });
  }

  clearCart(): void { this.cartService.clearCart().subscribe({ error: () => undefined }); }

  checkout(): void {
    this.checkoutError.set('');
    this.checkoutSuccess.set(null);
    if (this.cartItems().length === 0) { this.checkoutError.set('Tu carrito está vacío.'); return; }
    if (!this.buyer.full_name?.trim() || !this.buyer.email?.trim() || !this.buyer.address?.trim()) {
      this.checkoutError.set('Completa nombre, email y dirección para continuar.');
      return;
    }
    const buyer = { ...this.buyer, phone: this.buyer.phone?.trim() || null };
    const key = this.cartService.getCheckoutIdempotencyKey(buyer);
    this.checkoutLoading.set(true);
    this.cartService.checkout(buyer, key)
      .pipe(finalize(() => this.checkoutLoading.set(false)))
      .subscribe({
        next: (res) => {
          this.checkoutSuccess.set(res.order);
          if (res.guest_order_access_token) this.guestOrderLookupToken.set(res.guest_order_access_token);
          this.guestOrderLookupId.set(res.order.id);
          if (this.auth.isAuthenticated()) this.loadMyOrders();
        },
        error: (err) => this.checkoutError.set(normalizeApiError(err, 'No se pudo completar la compra.').message)
      });
  }

  loadMyOrders(): void {
    if (!this.auth.isAuthenticated()) return;
    this.myOrdersLoading.set(true); this.myOrdersError.set('');
    this.cartService.getMyOrders().pipe(finalize(() => this.myOrdersLoading.set(false))).subscribe({
      next: (orders) => this.myOrders.set(orders),
      error: (err) => this.myOrdersError.set(normalizeApiError(err).message)
    });
  }

  lookupGuestOrder(): void {
    this.guestLookupError.set(''); this.guestLookupOrder.set(null);
    const id = this.guestOrderLookupId().trim();
    const token = this.guestOrderLookupToken().trim() || this.cartService.getSavedGuestOrderToken(id) || '';
    if (!id || !token) { this.guestLookupError.set('Debes indicar ID de pedido y token de acceso de invitado.'); return; }
    this.guestLookupLoading.set(true);
    this.cartService.getGuestOrder(id, token).pipe(finalize(() => this.guestLookupLoading.set(false))).subscribe({
      next: (order) => this.guestLookupOrder.set(order),
      error: (err) => this.guestLookupError.set(normalizeApiError(err).message)
    });
  }


}
