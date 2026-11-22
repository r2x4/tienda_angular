import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { ProductCreate, ProductRead, ProductUpdate } from '../../tienda/models/catalog.models';

@Injectable({ providedIn: 'root' })
export class AdminProductsApiService {
  private readonly api = inject(ApiClientService);

  list(params: { category_id?: string } = {}): Observable<ProductRead[]> {
    let httpParams = new HttpParams();
    if (params.category_id) httpParams = httpParams.set('category_id', params.category_id);
    return this.api.get<ProductRead[]>('/admin/catalog/products', { params: httpParams }).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar los productos.')))
    );
  }

  getById(id: string): Observable<ProductRead> {
    return this.api.get<ProductRead>(`/admin/catalog/products/${id}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el producto.')))
    );
  }

  create(payload: ProductCreate): Observable<ProductRead> {
    return this.api.post<ProductRead>('/admin/catalog/products', payload).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo crear el producto.')))
    );
  }

  update(id: string, payload: ProductUpdate): Observable<ProductRead> {
    return this.api.put<ProductRead>(`/admin/catalog/products/${id}`, payload).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo actualizar el producto.')))
    );
  }

  deactivate(id: string): Observable<ProductRead> {
    return this.api.patch<ProductRead>(`/admin/catalog/products/${id}/deactivate`, {}).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo desactivar el producto.')))
    );
  }
}
