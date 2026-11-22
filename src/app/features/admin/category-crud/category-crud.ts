import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminCategoriesApiService } from '../services/admin-categories-api.service';
import { CategoryCreate, CategoryRead, CategoryUpdate } from '../../tienda/models/catalog.models';
import { normalizeApiError } from '../../../core/api/api-error';

interface CategoryForm { id?: string; name: string; slug: string; description: string; is_active: boolean; }

@Component({
  selector: 'app-category-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './category-crud.html',
  styleUrl: './category-crud.css'
})
export class CategoryCrudComponent implements OnInit {
  private readonly api = inject(AdminCategoriesApiService);
  readonly categories = signal<CategoryRead[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly legacyNotice = signal('Las categorías públicas y administrativas usan ahora el backend como fuente de verdad. No se eliminan datos locales de IndexedDB; no hay migración automática.');
  readonly current = signal<CategoryForm>(this.empty());

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.api.list().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (cats) => this.categories.set(cats ?? []),
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudieron cargar las categorías.').message),
    });
  }
  edit(cat: CategoryRead): void { this.success.set(''); this.error.set(''); this.current.set({ id:cat.id, name:cat.name, slug:cat.slug, description:cat.description ?? '', is_active:cat.is_active }); }
  newCategory(): void { this.success.set(''); this.error.set(''); this.current.set(this.empty()); }
  save(): void {
    if (this.saving()) return;
    this.success.set(''); this.error.set('');
    const f = this.current();
    const name = f.name.trim(); const slug = f.slug.trim();
    if (!name) { this.error.set('El nombre es obligatorio.'); return; }
    const payload: CategoryCreate | CategoryUpdate = { name, slug: slug || undefined, description: f.description.trim() || null, is_active: f.is_active };
    this.saving.set(true);
    const req$ = f.id ? this.api.update(f.id, payload) : this.api.create(payload as CategoryCreate);
    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.success.set(f.id ? 'Categoría actualizada.' : 'Categoría creada.'); this.current.set(this.empty()); this.load(); },
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudo guardar la categoría.').message),
    });
  }
  deactivate(cat: CategoryRead): void {
    if (!cat.is_active || this.saving()) return;
    if (!confirm(`¿Desactivar categoría "${cat.name}"? El backend puede rechazarla si tiene restricciones.`)) return;
    this.success.set(''); this.error.set('');
    this.saving.set(true);
    this.api.deactivate(cat.id).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.success.set('Categoría desactivada.'); this.load(); },
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudo desactivar la categoría.').message),
    });
  }
  clear(): void { this.current.set(this.empty()); }
  private empty(): CategoryForm { return { name:'', slug:'', description:'', is_active:true }; }
}
