import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { CategoryCreate, CategoryRead, CategoryUpdate } from '../../tienda/models/catalog.models';

@Injectable({ providedIn: 'root' })
export class AdminCategoriesApiService {
  private readonly api = inject(ApiClientService);

  list(): Observable<CategoryRead[]> {
    return this.api.get<CategoryRead[]>('/admin/catalog/categories').pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar las categorías.')))
    );
  }

  getById(id: string): Observable<CategoryRead> {
    return this.api.get<CategoryRead>(`/admin/catalog/categories/${id}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar la categoría.')))
    );
  }

  create(payload: CategoryCreate): Observable<CategoryRead> {
    return this.api.post<CategoryRead>('/admin/catalog/categories', payload).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo crear la categoría.')))
    );
  }

  update(id: string, payload: CategoryUpdate): Observable<CategoryRead> {
    return this.api.put<CategoryRead>(`/admin/catalog/categories/${id}`, payload).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo actualizar la categoría.')))
    );
  }

  deactivate(id: string): Observable<CategoryRead> {
    return this.api.patch<CategoryRead>(`/admin/catalog/categories/${id}/deactivate`, {}).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo desactivar la categoría.')))
    );
  }
}
