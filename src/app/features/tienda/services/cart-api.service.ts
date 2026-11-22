import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, catchError, tap, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { CartTokenStorageService } from '../../../core/auth/services/cart-token-storage.service';
import { CartItemAddRequest, CartItemUpdateRequest, CartRead } from '../models/cart.models';

@Injectable({ providedIn: 'root' })
export class CartApiService {
  private readonly api = inject(ApiClientService);
  private readonly tokenStorage = inject(CartTokenStorageService);

  getCart(guestToken?: string | null): Observable<CartRead> {
    return this.api.get<CartRead>('/cart', { headers: this.headers(guestToken) }).pipe(
      tap((cart) => this.persistGuestToken(cart)),
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el carrito.')))
    );
  }

  addItem(payload: CartItemAddRequest, guestToken?: string | null): Observable<CartRead> {
    return this.api.post<CartRead>('/cart/items', payload, { headers: this.headers(guestToken) }).pipe(
      tap((cart) => this.persistGuestToken(cart)),
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo agregar el producto al carrito.')))
    );
  }

  updateItem(productId: string, payload: CartItemUpdateRequest, guestToken?: string | null): Observable<CartRead> {
    return this.api.patch<CartRead>(`/cart/items/${productId}`, payload, { headers: this.headers(guestToken) }).pipe(
      tap((cart) => this.persistGuestToken(cart)),
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo actualizar la cantidad.')))
    );
  }

  removeItem(productId: string, guestToken?: string | null): Observable<CartRead> {
    return this.api.delete<CartRead>(`/cart/items/${productId}`, { headers: this.headers(guestToken) }).pipe(
      tap((cart) => this.persistGuestToken(cart)),
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo eliminar el producto del carrito.')))
    );
  }

  clearCart(guestToken?: string | null): Observable<CartRead> {
    return this.api.delete<CartRead>('/cart', { headers: this.headers(guestToken) }).pipe(
      tap((cart) => this.persistGuestToken(cart)),
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo vaciar el carrito.')))
    );
  }

  private headers(guestToken?: string | null): HttpHeaders | undefined {
    const token = guestToken ?? this.tokenStorage.getGuestCartToken();
    return token ? new HttpHeaders({ 'X-Cart-Token': token }) : undefined;
  }

  private persistGuestToken(cart: CartRead): void {
    if (cart.guest_cart_token) this.tokenStorage.setGuestCartToken(cart.guest_cart_token);
  }
}
