import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { CategoryRead } from '../models/catalog.models';

@Injectable({ providedIn: 'root' })
export class CatalogCategoryService {
  private readonly api = inject(ApiClientService);

  list(): Observable<CategoryRead[]> {
    return this.api.get<CategoryRead[]>('/catalog/categories').pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar las categorías.')))
    );
  }

  getById(categoryId: string): Observable<CategoryRead> {
    return this.api.get<CategoryRead>(`/catalog/categories/${categoryId}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar la categoría.')))
    );
  }
}
