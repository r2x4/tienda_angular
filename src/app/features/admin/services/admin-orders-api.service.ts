import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { OrderRead } from '../../tienda/models/cart.models';

@Injectable({ providedIn: 'root' })
export class AdminOrdersApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<OrderRead[]> {
    return this.api.get<OrderRead[]>('/admin/orders').pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar los pedidos.')))
    );
  }

  getById(orderId: string): Observable<OrderRead> {
    return this.api.get<OrderRead>(`/admin/orders/${orderId}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el pedido.')))
    );
  }
}
