import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { ServiceListParams, ServiceListResponse, ServiceRead } from '../models/service.models';

@Injectable({ providedIn: 'root' })
export class PublicServicesApiService {
  private readonly api = inject(ApiClientService);

  list(params: ServiceListParams = {}): Observable<ServiceListResponse> {
    let httpParams = new HttpParams();
    if (params.skip !== undefined) httpParams = httpParams.set('skip', String(params.skip));
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    return this.api.get<ServiceListResponse>('/services', { params: httpParams }).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar los servicios.')))
    );
  }

  getById(serviceId: string): Observable<ServiceRead> {
    return this.api.get<ServiceRead>(`/services/${serviceId}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el servicio.')))
    );
  }
}
