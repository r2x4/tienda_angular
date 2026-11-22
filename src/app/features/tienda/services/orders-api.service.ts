import { Injectable, inject } from '@angular/core';
import { HttpHeaders } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { CheckoutRequest, OrderCreateResponse, OrderRead } from '../models/cart.models';

const GUEST_ORDER_TOKEN_KEY = 'app_guest_order_tokens_v1';

@Injectable({ providedIn: 'root' })
export class OrdersApiService {
  private readonly api = inject(ApiClientService);

  checkout(payload: CheckoutRequest, guestCartToken?: string | null, idempotencyKey?: string): Observable<OrderCreateResponse> {
    let headers = new HttpHeaders();
    if (guestCartToken) headers = headers.set('X-Cart-Token', guestCartToken);
    if (idempotencyKey) headers = headers.set('Idempotency-Key', idempotencyKey);
    return this.api.post<OrderCreateResponse>('/orders/checkout', payload, { headers }).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo completar el checkout.')))
    );
  }

  getMyOrders(): Observable<OrderRead[]> {
    return this.api.get<OrderRead[]>('/orders/my').pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el historial de pedidos.')))
    );
  }

  getMyOrder(orderId: string): Observable<OrderRead> {
    return this.api.get<OrderRead>(`/orders/my/${orderId}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el pedido.')))
    );
  }

  getGuestOrder(orderId: string, accessToken: string): Observable<OrderRead> {
    const headers = new HttpHeaders({ 'X-Order-Access-Token': accessToken });
    return this.api.get<OrderRead>(`/orders/guest/${orderId}`, { headers }).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el pedido de invitado.')))
    );
  }

  saveGuestOrderAccessToken(orderId: string, token: string): void {
    if (!this.isBrowser() || !token) return;
    const map = this.readGuestOrderTokens();
    map[orderId] = token;
    localStorage.setItem(GUEST_ORDER_TOKEN_KEY, JSON.stringify(map));
  }

  getGuestOrderAccessToken(orderId: string): string | null {
    if (!this.isBrowser()) return null;
    return this.readGuestOrderTokens()[orderId] ?? null;
  }

  private readGuestOrderTokens(): Record<string, string> {
    try {
      const raw = localStorage.getItem(GUEST_ORDER_TOKEN_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch { return {}; }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }
}
