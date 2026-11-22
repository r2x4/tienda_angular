import { Injectable, inject } from '@angular/core';
import { Observable, catchError, throwError } from 'rxjs';
import { ApiClientService } from '../../../core/api/api-client.service';
import { normalizeApiError } from '../../../core/api/api-error';

export interface MediaImageUploadResponse {
  url: string;
  filename: string;
  content_type: string;
  size_bytes: number;
}

@Injectable({ providedIn: 'root' })
export class AdminMediaApiService {
  private readonly api = inject(ApiClientService);

  uploadImage(file: File): Observable<MediaImageUploadResponse> {
    const fd = new FormData();
    fd.append('file', file, file.name);
    return this.api.post<MediaImageUploadResponse>('/admin/media/images', fd).pipe(
      catchError((e) => throwError(() => normalizeApiError(e, 'No se pudo cargar la imagen.')))
    );
  }
}
