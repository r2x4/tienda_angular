import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { CatalogProductsQuery, ProductAvailabilityRead, ProductRead } from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogProductService {
  private readonly api = inject(ApiClientService);

  list(query?: CatalogProductsQuery): Observable<ProductRead[]> {
    let params = new HttpParams();
    if (query?.category_id) params = params.set('category_id', query.category_id);
    return this.api.get<ProductRead[]>('/catalog/products', { params }).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar los productos.')))
    );
  }

  getById(productId: string): Observable<ProductRead> {
    return this.api.get<ProductRead>(`/catalog/products/${productId}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el producto.')))
    );
  }

  getAvailability(productId: string): Observable<ProductAvailabilityRead> {
    return this.api.get<ProductAvailabilityRead>(`/catalog/products/${productId}/availability`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo consultar la disponibilidad del producto.')))
    );
  }
}
