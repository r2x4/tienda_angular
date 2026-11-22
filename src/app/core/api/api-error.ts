import { HttpErrorResponse } from '@angular/common/http';

export interface ApiError {
  status: number;
  message: string;
  details?: unknown;
  raw?: unknown;
}

export function isApiError(error: unknown): error is ApiError {
  if (!error || typeof error !== 'object') return false;
  const e = error as Record<string, unknown>;
  return typeof e['status'] === 'number' && typeof e['message'] === 'string';
}

export function normalizeApiError(error: unknown, fallback = 'Ocurrió un error inesperado.'): ApiError {
  if (isApiError(error) && !(error instanceof HttpErrorResponse)) {
    return error;
  }

  if (error instanceof HttpErrorResponse) {
    const detail = (error.error as any)?.detail;
    let message = fallback;

    if (typeof detail === 'string' && detail.trim()) {
      message = detail;
    } else if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first?.msg === 'string') {
        message = first.msg;
      }
    } else if (typeof (error.error as any)?.message === 'string') {
      message = (error.error as any).message;
    } else if (error.status === 0) {
      message = 'No se pudo conectar con el servidor. Verifica que el backend esté disponible.';
    } else if (error.status === 401) {
      message = 'Tu sesión no es válida o ha expirado.';
    } else if (error.status === 403) {
      message = 'No tienes permisos para realizar esta acción.';
    }

    return { status: error.status, message, details: detail ?? error.error, raw: error };
  }

  if (error instanceof Error) {
    return { status: 0, message: error.message || fallback, raw: error };
  }

  return { status: 0, message: fallback, raw: error };
}
