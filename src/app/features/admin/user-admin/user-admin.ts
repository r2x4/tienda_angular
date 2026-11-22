import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { AdminUsersApiService } from '../services/admin-users-api.service';
import { AdminUserRead, RoleRead } from '../models/admin-user.models';
import { normalizeApiError } from '../../../core/api/api-error';

@Component({
  selector: 'app-user-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-admin.html',
  styleUrl: './user-admin.css'
})
export class UserAdminComponent implements OnInit {
  private readonly api = inject(AdminUsersApiService);
  readonly users = signal<AdminUserRead[]>([]);
  readonly roles = signal<RoleRead[]>([]);
  readonly selected = signal<AdminUserRead | null>(null);
  readonly selectedRoleCodes = signal<string[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly detailError = signal('');
  readonly legacyNotice = signal('Usuarios administrados desde backend como fuente de verdad. Los usuarios locales antiguos de IndexedDB no se eliminan, no se migran ni se mezclan automáticamente.');

  q = ''; role = ''; is_active: '' | 'true' | 'false' = ''; skip = 0; limit = 20; total = 0;

  ngOnInit(): void { this.loadRoles(); this.load(); }

  loadRoles(): void {
    this.api.listRoles().subscribe({ next: rs => this.roles.set(rs ?? []), error: err => this.error.set(normalizeApiError(err).message) });
  }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true); this.error.set('');
    this.api.list({ skip:this.skip, limit:this.limit, q:this.q || undefined, role:this.role || undefined, is_active: this.is_active === '' ? undefined : this.is_active === 'true' })
      .pipe(finalize(() => this.loading.set(false))).subscribe({
        next: (res) => { this.users.set(res.items ?? []); this.total = res.total; this.skip = res.skip; this.limit = res.limit; },
        error: (err) => this.error.set(normalizeApiError(err, 'No se pudieron cargar los usuarios.').message),
      });
  }

  search(): void { this.skip = 0; this.load(); }
  nextPage(): void { if (this.skip + this.limit < this.total) { this.skip += this.limit; this.load(); } }
  prevPage(): void { if (this.skip > 0) { this.skip = Math.max(0, this.skip - this.limit); this.load(); } }

  select(user: AdminUserRead): void {
    this.selected.set(user);
    this.selectedRoleCodes.set((user.roles ?? []).map(r => r.code));
    this.detailError.set(''); this.success.set('');
  }

  toggleRole(code: string, checked: boolean): void {
    const set = new Set(this.selectedRoleCodes());
    if (checked) set.add(code); else set.delete(code);
    this.selectedRoleCodes.set(Array.from(set));
  }

  saveRoles(): void {
    const u = this.selected(); if (!u || this.saving()) return;
    const roles = this.selectedRoleCodes();
    if (roles.length < 1) { this.detailError.set('Debe seleccionar al menos un rol.'); return; }
    if (!confirm(`¿Reemplazar roles de ${u.email}?`)) return;
    this.saving.set(true); this.detailError.set(''); this.success.set('');
    this.api.replaceRoles(u.id, { roles }).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (updated) => { this.success.set('Roles actualizados.'); this.selected.set(updated); this.selectedRoleCodes.set((updated.roles ?? []).map(r=>r.code)); this.load(); },
      error: (err) => this.detailError.set(this.formatErr(err, 'No se pudieron actualizar los roles.')),
    });
  }

  toggleActive(user: AdminUserRead): void {
    if (this.saving()) return;
    const action = user.is_active ? 'desactivar' : 'activar';
    if (!confirm(`¿Confirma ${action} la cuenta ${user.email}?`)) return;
    this.saving.set(true); this.error.set(''); this.success.set('');
    const req$ = user.is_active ? this.api.deactivate(user.id) : this.api.activate(user.id);
    req$.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: (updated) => { this.success.set(user.is_active ? 'Usuario desactivado.' : 'Usuario activado.'); if (this.selected()?.id === updated.id) this.selected.set(updated); this.load(); },
      error: (err) => this.error.set(this.formatErr(err, `No se pudo ${action} el usuario.`)),
    });
  }

  roleCodes(user: AdminUserRead): string {
    return (user.roles ?? []).map(r => r.code).join(', ') || '-';
  }

  endIndex(): number {
    return Math.min(this.skip + this.limit, this.total);
  }

  private formatErr(err: any, fallback: string): string {
    const e = normalizeApiError(err, fallback);
    if (e.status === 409) return e.message || 'Operación rechazada por protección del backend (posible último ADMIN u otra restricción).';
    return e.message;
  }
}
