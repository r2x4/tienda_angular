import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { AdminOrdersApiService } from '../services/admin-orders-api.service';
import { OrderRead } from '../../tienda/models/cart.models';
import { normalizeApiError } from '../../../core/api/api-error';

@Component({
  selector: 'app-order-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-admin.html',
  styleUrl: './order-admin.css'
})
export class OrderAdminComponent implements OnInit {
  private readonly api = inject(AdminOrdersApiService);
  readonly orders = signal<OrderRead[]>([]);
  readonly selected = signal<OrderRead | null>(null);
  readonly loading = signal(false);
  readonly detailLoading = signal(false);
  readonly error = signal('');
  readonly detailError = signal('');
  readonly legacyNotice = signal('Los pedidos administrativos se consultan desde el backend como fuente de verdad. Las ventas locales antiguas de IndexedDB no se eliminan, no se migran ni se mezclan con estos pedidos.');

  ngOnInit(): void { this.load(); }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true); this.error.set('');
    this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (orders) => this.orders.set(orders ?? []),
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudieron cargar los pedidos.').message),
    });
  }

  viewDetail(order: OrderRead): void {
    if (this.detailLoading()) return;
    this.detailLoading.set(true); this.detailError.set('');
    this.api.getById(order.id).pipe(finalize(() => this.detailLoading.set(false))).subscribe({
      next: (detail) => this.selected.set(detail),
      error: (err) => this.detailError.set(normalizeApiError(err, 'No se pudo cargar el detalle del pedido.').message),
    });
  }

  closeDetail(): void { this.selected.set(null); this.detailError.set(''); }
}
