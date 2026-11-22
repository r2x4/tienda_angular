import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpContext, HttpContextToken, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { normalizeApiError } from './api-error';

export const SKIP_AUTH = new HttpContextToken<boolean>(() => false);
export const RETRY_AUTH_REFRESH = new HttpContextToken<boolean>(() => true);

export interface ApiRequestOptions {
  headers?: HttpHeaders | Record<string, string | string[]>;
  params?: HttpParams | Record<string, string | number | boolean | ReadonlyArray<string | number | boolean>>;
  context?: HttpContext;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl.replace(/\/$/, '');

  get<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.get<T>(this.url(path), options).pipe(catchError((e) => throwError(() => normalizeApiError(e))));
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.post<T>(this.url(path), body, options).pipe(catchError((e) => throwError(() => normalizeApiError(e))));
  }

  put<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.put<T>(this.url(path), body, options).pipe(catchError((e) => throwError(() => normalizeApiError(e))));
  }

  patch<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<T> {
    return this.http.patch<T>(this.url(path), body, options).pipe(catchError((e) => throwError(() => normalizeApiError(e))));
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<T> {
    return this.http.delete<T>(this.url(path), options).pipe(catchError((e) => throwError(() => normalizeApiError(e))));
  }

  private url(path: string): string {
    const clean = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${clean}`;
  }
}
