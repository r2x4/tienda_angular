import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PublicServicesApiService } from '../../../services/public-services-api.service';
import { ServiceRead } from '../../../models/service.models';
import { formatCop } from '../../../models/catalog-view.models';
import { normalizeApiError } from '../../../../../core/api/api-error';

@Component({
  selector: 'app-servicio-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './servicio-detalle.component.html',
})
export class ServicioDetalleComponent implements OnInit {
  private readonly api = inject(PublicServicesApiService);
  private readonly route = inject(ActivatedRoute);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly notFound = signal(false);
  readonly service = signal<ServiceRead | null>(null);
  readonly formatCop = formatCop;

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); return; }
    this.loading.set(true); this.error.set(''); this.notFound.set(false); this.service.set(null);
    this.api.getById(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (svc) => {
        if (!svc || svc.is_active !== true) { this.notFound.set(true); return; }
        this.service.set(svc);
      },
      error: (err) => {
        const e = normalizeApiError(err, 'No se pudo cargar el servicio.');
        if (e.status === 404) this.notFound.set(true); else this.error.set(e.message);
      }
    });
  }
}
