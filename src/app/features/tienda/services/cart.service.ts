import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, tap, throwError } from 'rxjs';
import { normalizeApiError } from '../../../core/api/api-error';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';
import { CartTokenStorageService } from '../../../core/auth/services/cart-token-storage.service';
import { BuyerInfo, CartItemRead, CartRead, CheckoutRequest, OrderCreateResponse, OrderRead } from '../models/cart.models';
import { CartApiService } from './cart-api.service';
import { OrdersApiService } from './orders-api.service';

export interface CartViewItem {
  id: string; // product_id
  itemId: string;
  name: string;
  price: number;
  price_cop: string;
  imageUrl: string;
  quantity: number;
  stock: number;
  stock_quantity: number;
  is_active: boolean;
  slug: string;
  line_total_cop: string;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly api = inject(CartApiService);
  private readonly ordersApi = inject(OrdersApiService);
  private readonly cartTokenStorage = inject(CartTokenStorageService);
  private readonly auth = inject(AuthSessionService);

  readonly cart = signal<CartRead | null>(null);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly legacyTransitionMessage = signal('');
  readonly cartItems = computed<CartViewItem[]>(() => (this.cart()?.items ?? []).map((i) => this.mapItem(i)));

  private checkoutIdempotencyKey: string | null = null;
  private checkoutFingerprint: string | null = null;
  private lastAuthState: boolean | null = null;
  private loadSeq = 0;

  constructor() {
    this.loadCart().subscribe({ error: () => undefined });
    // Keep cart state aligned with auth transitions without merging carts client-side.
    effect(() => {
      const isAuth = this.auth.isAuthenticated();
      if (this.lastAuthState === null) { this.lastAuthState = isAuth; return; }
      if (this.lastAuthState !== isAuth) {
        this.lastAuthState = isAuth;
        this.cart.set(null);
        this.checkoutIdempotencyKey = null;
        this.checkoutFingerprint = null;
        this.loadCart().subscribe({ error: () => undefined });
      }
    });
  }

  loadCart(): Observable<CartRead | null> {
    const seq = ++this.loadSeq;
    this.loading.set(true);
    this.error.set('');
    return this.api.getCart(this.guestTokenForRequest()).pipe(
      tap((cart) => {
        if (seq !== this.loadSeq) return; // stale response guard
        this.cart.set(cart);
        this.handleLegacyLocalCart(cart);
      }),
      catchError((err) => {
        if (seq !== this.loadSeq) return of(null);
        this.error.set(normalizeApiError(err, 'No se pudo cargar el carrito.').message);
        return of(null);
      }),
      finalize(() => { if (seq === this.loadSeq) this.loading.set(false); })
    );
  }

  addToCart(product: { id: string | number; name?: string }): Observable<CartRead | null> {
    const productId = String(product.id);
    if (!UUID_RE.test(productId)) {
      const msg = 'Este producto no tiene un identificador backend válido para carrito.';
      this.error.set(msg);
      return throwError(() => normalizeApiError(new Error(msg), msg));
    }
    this.loading.set(true); this.error.set('');
    return this.api.addItem({ product_id: productId, quantity: 1 }, this.guestTokenForRequest()).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError((err) => { this.error.set(normalizeApiError(err).message); return throwError(() => err); }),
      finalize(() => this.loading.set(false))
    );
  }

  updateQuantity(productId: string, quantity: number): Observable<CartRead | null> {
    this.loading.set(true); this.error.set('');
    return this.api.updateItem(productId, { quantity }, this.guestTokenForRequest()).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError((err) => { this.error.set(normalizeApiError(err).message); return throwError(() => err); }),
      finalize(() => this.loading.set(false))
    );
  }

  removeFromCart(productId: string | number): Observable<CartRead | null> {
    const id = String(productId);
    if (!UUID_RE.test(id)) { this.error.set('ID de producto inválido para carrito backend.'); return of(null); }
    this.loading.set(true); this.error.set('');
    return this.api.removeItem(id, this.guestTokenForRequest()).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError((err) => { this.error.set(normalizeApiError(err).message); return throwError(() => err); }),
      finalize(() => this.loading.set(false))
    );
  }

  clearCart(): Observable<CartRead | null> {
    this.loading.set(true); this.error.set('');
    return this.api.clearCart(this.guestTokenForRequest()).pipe(
      tap((cart) => this.cart.set(cart)),
      catchError((err) => { this.error.set(normalizeApiError(err).message); return throwError(() => err); }),
      finalize(() => this.loading.set(false))
    );
  }

  getTotal(): number {
    const raw = this.cart()?.total_cop ?? '0';
    const n = Number(raw);
    return Number.isFinite(n) ? n : 0;
  }

  checkout(buyer: BuyerInfo, idempotencyKey?: string): Observable<OrderCreateResponse> {
    const fingerprint = this.buildCheckoutFingerprint(buyer);
    const key = idempotencyKey ?? this.getOrCreateCheckoutIdempotencyKey(fingerprint);
    this.loading.set(true); this.error.set('');
    const payload: CheckoutRequest = { buyer, idempotency_key: key };
    return this.ordersApi.checkout(payload, this.guestTokenForRequest(), key).pipe(
      tap((res) => {
        if (res.guest_order_access_token) {
          this.ordersApi.saveGuestOrderAccessToken(res.order.id, res.guest_order_access_token);
        }
        // New operation after successful checkout.
        this.checkoutIdempotencyKey = null;
        this.checkoutFingerprint = null;
        this.loadCart().subscribe({ error: () => undefined });
      }),
      catchError((err) => {
        // Keep same key for retry of same operation (timeout/connection/server errors).
        this.error.set(normalizeApiError(err).message);
        return throwError(() => err);
      }),
      finalize(() => this.loading.set(false))
    );
  }

  getCheckoutIdempotencyKey(buyer: BuyerInfo): string {
    return this.getOrCreateCheckoutIdempotencyKey(this.buildCheckoutFingerprint(buyer));
  }

  resetCheckoutIdempotencyKey(): void {
    this.checkoutIdempotencyKey = null;
    this.checkoutFingerprint = null;
  }

  getMyOrders(): Observable<OrderRead[]> { return this.ordersApi.getMyOrders(); }
  getMyOrder(id: string): Observable<OrderRead> { return this.ordersApi.getMyOrder(id); }
  getGuestOrder(orderId: string, token: string): Observable<OrderRead> { return this.ordersApi.getGuestOrder(orderId, token); }
  getSavedGuestOrderToken(orderId: string): string | null { return this.ordersApi.getGuestOrderAccessToken(orderId); }

  private guestTokenForRequest(): string | null {
    if (this.auth.isAuthenticated()) return null;
    return this.cartTokenStorage.getGuestCartToken();
  }

  private mapItem(item: CartItemRead): CartViewItem {
    const price = Number(item.unit_price_cop);
    return {
      id: item.product_id,
      itemId: item.id,
      name: item.product?.name ?? 'Producto',
      price: Number.isFinite(price) ? price : 0,
      price_cop: item.unit_price_cop,
      imageUrl: 'assets/ropa_ropaDeportiva.jpg',
      quantity: item.quantity,
      stock: item.product?.stock_quantity ?? 0,
      stock_quantity: item.product?.stock_quantity ?? 0,
      is_active: item.product?.is_active ?? true,
      slug: item.product?.slug ?? '',
      line_total_cop: item.line_total_cop,
    };
  }

  private handleLegacyLocalCart(currentCart: CartRead): void {
    const raw = this.cartTokenStorage.getLegacyCartRaw();
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || parsed.length === 0) { this.cartTokenStorage.clearLegacyCart(); return; }

      const normalized = parsed
        .filter((p: any) => p && typeof p === 'object')
        .map((p: any) => ({ id: String(p.id ?? ''), quantity: Math.min(100, Math.max(1, Number(p.quantity ?? 1))), name: String(p.name ?? 'Producto') }));

      const uuidItems = normalized.filter((p) => UUID_RE.test(p.id));
      const nonUuidItems = normalized.filter((p) => !UUID_RE.test(p.id));

      if (nonUuidItems.length > 0) {
        // Do not discard unrecoverable legacy data silently: keep backup key and clear active key to avoid loops.
        this.cartTokenStorage.backupLegacyCart(raw);
        this.cartTokenStorage.clearLegacyCart();
        this.legacyTransitionMessage.set(
          `Se detectó un carrito local antiguo con ${nonUuidItems.length} producto(s) sin UUID compatible. No se migraron automáticamente. Se conservó una copia en localStorage (${this.cartTokenStorage.getLegacyBackupKey()}) para revisión/recuperación manual; vuelve a agregar esos productos desde el catálogo.`
        );
        // Continue only with UUID-compatible items if any and backend cart is empty.
        if (uuidItems.length === 0) return;
      }

      if ((currentCart.items?.length ?? 0) > 0) {
        if (uuidItems.length > 0) this.cartTokenStorage.backupLegacyCart(raw);
        this.cartTokenStorage.clearLegacyCart();
        this.legacyTransitionMessage.set('Existe un carrito local antiguo. El carrito backend ya tiene productos y no se sobrescribió ni fusionó automáticamente. Se conservó copia de respaldo local si había items migrables.');
        return;
      }

      if (uuidItems.length === 0) { this.cartTokenStorage.clearLegacyCart(); return; }

      import('rxjs').then(({ concat, defer, last }) => {
        concat(...uuidItems.map((p) => defer(() => this.api.addItem({ product_id: p.id, quantity: p.quantity }, this.guestTokenForRequest()))))
          .pipe(last())
          .subscribe({
            next: (cart) => this.cart.set(cart),
            complete: () => {
              this.cartTokenStorage.clearLegacyCart();
              if (nonUuidItems.length > 0) {
                this.legacyTransitionMessage.set('Se migraron al backend los items antiguos con UUID compatible. Los items sin UUID no se migraron y quedaron respaldados en localStorage para recuperación manual.');
              } else {
                this.legacyTransitionMessage.set('Se migró el carrito local antiguo al carrito backend. Verifica cantidades y disponibilidad.');
              }
            },
            error: () => {
              this.cartTokenStorage.backupLegacyCart(raw);
              this.legacyTransitionMessage.set('No se pudo migrar completamente el carrito local antiguo. Se conservó copia de respaldo en localStorage; revisa tu carrito y reintenta/agrega manualmente.');
            }
          });
      });
    } catch {
      this.cartTokenStorage.backupLegacyCart(raw);
      this.cartTokenStorage.clearLegacyCart();
      this.legacyTransitionMessage.set('El carrito local antiguo tenía formato inválido. Se conservó copia de respaldo en localStorage para revisión manual.');
    }
  }

  private getOrCreateCheckoutIdempotencyKey(fingerprint: string): string {
    if (this.checkoutIdempotencyKey && this.checkoutFingerprint === fingerprint) {
      return this.checkoutIdempotencyKey;
    }
    this.checkoutFingerprint = fingerprint;
    this.checkoutIdempotencyKey = this.makeIdempotencyKey();
    return this.checkoutIdempotencyKey;
  }

  private buildCheckoutFingerprint(buyer: BuyerInfo): string {
    const cart = this.cart();
    const items = [...(cart?.items ?? [])]
      .map((i) => `${i.product_id}:${i.quantity}`)
      .sort()
      .join('|');
    const buyerFp = [buyer.full_name ?? '', buyer.email ?? '', buyer.phone ?? '', buyer.address ?? ''].map((v) => v.trim().toLowerCase()).join('|');
    return `${cart?.id ?? 'no-cart'}::${items}::${buyerFp}::${this.auth.isAuthenticated() ? 'auth' : 'guest'}`;
  }

  private makeIdempotencyKey(): string {
    const rnd = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    return `chk-${rnd}`;
  }
}
