import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { PublicServicesApiService } from '../../services/public-services-api.service';
import { ServiceRead } from '../../models/service.models';
import { formatCop } from '../../models/catalog-view.models';
import { normalizeApiError } from '../../../../core/api/api-error';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './servicios.component.html',
})
export class ServiciosComponent implements OnInit {
  private readonly api = inject(PublicServicesApiService);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly services = signal<ServiceRead[]>([]);
  readonly formatCop = formatCop;

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set('');
    this.api.list({ skip: 0, limit: 100 }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => this.services.set((res.items ?? []).filter(s => s.is_active === true)),
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudieron cargar los servicios.').message),
    });
  }
}
