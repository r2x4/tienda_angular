import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminServicesApiService } from '../services/admin-services-api.service';
import { ServiceCreate, ServiceRead, ServiceUpdate } from '../../tienda/models/service.models';
import { normalizeApiError } from '../../../core/api/api-error';

interface ServiceForm {
  id?: string;
  name: string;
  slug: string;
  description: string;
  price_cop: string;
  duration_minutes: string;
  image_url: string;
  is_active: boolean;
}

@Component({
  selector: 'app-service-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './service-crud.html',
  styleUrl: './service-crud.css'
})
export class ServiceCrudComponent implements OnInit {
  private readonly api = inject(AdminServicesApiService);
  readonly services = signal<ServiceRead[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly legacyNotice = signal('');
  readonly currentService = signal<ServiceForm>(this.emptyForm());

  ngOnInit(): void {
    this.checkLegacyLocalServices();
    this.loadServices();
  }

  loadServices(): void {
    this.loading.set(true); this.error.set('');
    this.api.list({ skip: 0, limit: 100 }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (res) => this.services.set(res.items ?? []),
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudieron cargar los servicios.').message),
    });
  }

  editService(service: ServiceRead): void {
    this.success.set(''); this.error.set('');
    this.currentService.set({
      id: service.id,
      name: service.name ?? '',
      slug: service.slug ?? '',
      description: service.description ?? '',
      price_cop: String(service.price_cop ?? ''),
      duration_minutes: service.duration_minutes == null ? '' : String(service.duration_minutes),
      image_url: service.image_url ?? '',
      is_active: !!service.is_active,
    });
  }

  save(): void {
    if (this.saving()) return;
    const form = this.currentService();
    this.success.set(''); this.error.set('');
    const payload = this.toPayload(form);
    if (!payload) return;
    this.saving.set(true);
    const req$ = form.id
      ? this.api.update(form.id, payload as ServiceUpdate)
      : this.api.create(payload as ServiceCreate);
    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => {
        this.success.set(form.id ? 'Servicio actualizado correctamente.' : 'Servicio creado correctamente.');
        this.clearForm();
        this.loadServices();
      },
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudo guardar el servicio.').message),
    });
  }

  toggleActive(service: ServiceRead): void {
    if (this.saving()) return;
    this.success.set(''); this.error.set('');
    this.saving.set(true);
    const req$ = service.is_active ? this.api.deactivate(service.id) : this.api.activate(service.id);
    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.success.set(service.is_active ? 'Servicio desactivado.' : 'Servicio activado.'); this.loadServices(); },
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudo cambiar el estado del servicio.').message),
    });
  }

  clearForm(): void { this.currentService.set(this.emptyForm()); }

  private toPayload(form: ServiceForm): ServiceCreate | ServiceUpdate | null {
    const name = form.name.trim();
    const slug = form.slug.trim();
    const price = Number(form.price_cop);
    if (!name || !slug || !form.price_cop.trim() || !Number.isFinite(price) || price < 0) {
      this.error.set('Nombre, slug y precio COP válido son obligatorios.');
      return null;
    }
    const durationRaw = form.duration_minutes.trim();
    const duration = durationRaw === '' ? null : Number(durationRaw);
    if (durationRaw !== '' && (!Number.isInteger(duration) || (duration as number) <= 0)) {
      this.error.set('La duración debe ser un entero mayor a 0 o quedar vacía.');
      return null;
    }
    return {
      name,
      slug,
      description: form.description.trim() || null,
      price_cop: form.price_cop.trim(),
      duration_minutes: duration,
      image_url: form.image_url.trim() || null,
      is_active: form.is_active,
    };
  }

  private emptyForm(): ServiceForm {
    return { name: '', slug: '', description: '', price_cop: '', duration_minutes: '', image_url: '', is_active: true };
  }

  private checkLegacyLocalServices(): void {
    try {
      const rawDb = localStorage.getItem('TiendaDB'); // not used, but keep safe; real check below via indexedDB open is async in service
    } catch {}
    // Non-destructive notice: legacy local services may exist in IndexedDB; we do not read/delete them here.
    this.legacyNotice.set('Los servicios administrativos ahora usan el backend como fuente de verdad. Los registros locales antiguos de IndexedDB no se eliminan ni se migran automáticamente.');
  }
}
