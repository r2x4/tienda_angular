import { Injectable, inject } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { AdminUserListParams, AdminUserListResponse, AdminUserRead, AdminUserRolesReplaceRequest, RoleRead } from '../models/admin-user.models';

@Injectable({ providedIn: 'root' })
export class AdminUsersApiService {
  private readonly api = inject(ApiClientService);

  list(params: AdminUserListParams = {}): Observable<AdminUserListResponse> {
    let httpParams = new HttpParams();
    if (params.skip !== undefined) httpParams = httpParams.set('skip', String(params.skip));
    if (params.limit !== undefined) httpParams = httpParams.set('limit', String(params.limit));
    if (params.is_active !== undefined) httpParams = httpParams.set('is_active', String(params.is_active));
    if (params.role) httpParams = httpParams.set('role', params.role);
    if (params.q) httpParams = httpParams.set('q', params.q);
    return this.api.get<AdminUserListResponse>('/admin/users', { params: httpParams }).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar los usuarios.')))
    );
  }

  getById(userId: string): Observable<AdminUserRead> {
    return this.api.get<AdminUserRead>(`/admin/users/${userId}`).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar el usuario.')))
    );
  }

  activate(userId: string): Observable<AdminUserRead> {
    return this.api.patch<AdminUserRead>(`/admin/users/${userId}/activate`, {}).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo activar el usuario.')))
    );
  }

  deactivate(userId: string): Observable<AdminUserRead> {
    return this.api.patch<AdminUserRead>(`/admin/users/${userId}/deactivate`, {}).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo desactivar el usuario.')))
    );
  }

  listRoles(): Observable<RoleRead[]> {
    return this.api.get<RoleRead[]>('/admin/roles').pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron cargar los roles.')))
    );
  }

  replaceRoles(userId: string, payload: AdminUserRolesReplaceRequest): Observable<AdminUserRead> {
    return this.api.put<AdminUserRead>(`/admin/users/${userId}/roles`, payload).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudieron actualizar los roles.')))
    );
  }
}
