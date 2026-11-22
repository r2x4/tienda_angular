import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { ServiceCreate, ServiceListResponse, ServiceRead, ServiceUpdate } from '../../tienda/models/service.models';

@Injectable({ providedIn: 'root' })
export class AdminServicesApiService {
  private readonly api = inject(ApiClientService);

  list(params: { is_active?: boolean; skip?: number; limit?: number } = {}): Observable<ServiceListResponse> {
    let httpParams = new HttpParams();
    if (params.is_active !== undefined) httpParams = httpParams.set('is_active', String(params.is_active));
    if (params.skip !== undefined) httpParams = httpParams.set('skip', String(params.skip));
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.api.get<ServiceListResponse>('/admin/services', { params: httpParams }).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar los servicios administrativos.')))
    );
  }

  getById(id: string): Observable<ServiceRead> {
    return this.api.get<ServiceRead>(`/admin/services/${id}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el servicio.')))
    );
  }

  create(payload: ServiceCreate): Observable<ServiceRead> {
    return this.api.post<ServiceRead>('/admin/services', payload).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo crear el servicio.')))
    );
  }

  update(id: string, payload: ServiceUpdate): Observable<ServiceRead> {
    return this.api.patch<ServiceRead>(`/admin/services/${id}`, payload).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo actualizar el servicio.')))
    );
  }

  activate(id: string): Observable<ServiceRead> {
    return this.api.patch<ServiceRead>(`/admin/services/${id}/activate`, {}).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo activar el servicio.')))
    );
  }

  deactivate(id: string): Observable<ServiceRead> {
    return this.api.patch<ServiceRead>(`/admin/services/${id}/deactivate`, {}).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo desactivar el servicio.')))
    );
  }
}
