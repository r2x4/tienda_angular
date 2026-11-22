import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { finalize, forkJoin, of, switchMap, map } from 'rxjs';
import { AdminProductsApiService } from '../services/admin-products-api.service';
import { AdminCategoriesApiService } from '../services/admin-categories-api.service';
import { AdminMediaApiService } from '../services/admin-media-api.service';
import { CategoryRead, ProductCreate, ProductImageCreate, ProductRead, ProductUpdate } from '../../tienda/models/catalog.models';
import { normalizeApiError } from '../../../core/api/api-error';
import { environment } from '../../../../environments/environment';

interface ImageForm { url: string; alt_text: string; is_primary: boolean; sort_order: number; file?: File | null; previewUrl?: string | null; uploading?: boolean; uploadError?: string; isExisting?: boolean; }
interface ProductForm { id?: string; name: string; slug: string; description: string; price_cop: string; stock_quantity: string; category_id: string; is_active: boolean; images: ImageForm[]; }

@Component({ selector: 'app-product-crud', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './product-crud.html', styleUrl: './product-crud.css' })
export class ProductCrudComponent implements OnInit {
  private readonly productsApi = inject(AdminProductsApiService);
  private readonly categoriesApi = inject(AdminCategoriesApiService);
  private readonly mediaApi = inject(AdminMediaApiService);
  private readonly apiBase = environment.apiBaseUrl.replace(/\/$/, '');

  readonly products = signal<ProductRead[]>([]);
  readonly categories = signal<CategoryRead[]>([]);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  readonly legacyNotice = signal('Los productos administrativos usan ahora el backend como fuente de verdad. Los registros locales antiguos de IndexedDB no se eliminan ni se migran automáticamente.');
  form: ProductForm = this.emptyForm();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set('');
    forkJoin({ products: this.productsApi.list(), categories: this.categoriesApi.list() }).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: ({ products, categories }) => { this.products.set(products ?? []); this.categories.set(categories ?? []); },
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudieron cargar productos/categorías.').message),
    });
  }

  edit(product: ProductRead): void {
    this.success.set(''); this.error.set('');
    this.form = {
      id: product.id, name: product.name ?? '', slug: product.slug ?? '', description: product.description ?? '',
      price_cop: String(product.price_cop ?? ''), stock_quantity: String(product.stock_quantity ?? 0),
      category_id: product.category_id ?? '', is_active: !!product.is_active,
      images: (product.images ?? []).slice().sort((a,b)=> (a.sort_order-b.sort_order) || (a.is_primary===b.is_primary?0:a.is_primary?-1:1)).map(img => ({
        url: img.url, alt_text: img.alt_text ?? '', is_primary: !!img.is_primary, sort_order: img.sort_order ?? 0, isExisting: true, previewUrl: this.resolveImageUrl(img.url)
      })),
    };
  }

  addImage(): void {
    const nextOrder = this.form.images.length ? Math.max(...this.form.images.map(i => +i.sort_order || 0)) + 1 : 0;
    this.form.images.push({ url: '', alt_text: '', is_primary: this.form.images.length === 0, sort_order: nextOrder, file: null, previewUrl: null, isExisting: false });
  }
  removeImage(index: number): void { this.form.images.splice(index, 1); if (this.form.images.length && !this.form.images.some(i => i.is_primary)) this.form.images[0].is_primary = true; }
  setPrimary(index: number): void { this.form.images.forEach((img, i) => img.is_primary = i === index); }
  onFileSelected(event: Event, index: number): void {
    const input = event.target as HTMLInputElement; const file = input.files?.[0]; if (!file) return;
    const img = this.form.images[index]; const allowed = ['image/jpeg','image/png','image/webp'];
    if (!allowed.includes(file.type)) { img.uploadError = 'Formato no permitido. Usa JPEG, PNG o WebP.'; return; }
    if (file.size > 5 * 1024 * 1024) { img.uploadError = 'La imagen supera el límite de 5 MB.'; return; }
    img.file = file; img.uploadError = ''; img.previewUrl = URL.createObjectURL(file); img.url = ''; img.isExisting = false;
  }

  save(): void {
    if (this.saving()) return;
    this.success.set(''); this.error.set('');
    const validation = this.validate(this.form);
    if (validation) { this.error.set(validation); return; }
    this.saving.set(true);
    this.uploadPendingImages(this.form).pipe(
      switchMap((images) => {
        const payloadBase = { category_id: this.form.category_id, name: this.form.name.trim(), slug: this.form.slug.trim() || undefined, description: this.form.description.trim() || null, price_cop: this.form.price_cop.trim(), stock_quantity: Number(this.form.stock_quantity), is_active: this.form.is_active, images };
        return this.form.id ? this.productsApi.update(this.form.id, payloadBase as ProductUpdate) : this.productsApi.create(payloadBase as ProductCreate);
      }),
      finalize(() => this.saving.set(false))
    ).subscribe({
      next: () => { this.success.set(this.form.id ? 'Producto actualizado correctamente.' : 'Producto creado correctamente.'); this.clearForm(); this.load(); },
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudo guardar el producto.').message),
    });
  }

  deactivate(product: ProductRead): void {
    if (!product.is_active || this.saving()) return;
    if (!confirm(`¿Desactivar producto "${product.name}"?`)) return;
    this.success.set(''); this.error.set(''); this.saving.set(true);
    this.productsApi.deactivate(product.id).pipe(finalize(() => this.saving.set(false))).subscribe({
      next: () => { this.success.set('Producto desactivado.'); this.load(); },
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudo desactivar el producto.').message),
    });
  }

  clearForm(): void { this.form = this.emptyForm(); }

  resolveImageUrl(url: string | null | undefined): string {
    if (!url) return '';
    if (/^https?:\/\//i.test(url)) return url;
    return `${this.apiBase}${url.startsWith('/') ? '' : '/'}${url}`;
  }

  private uploadPendingImages(form: ProductForm) {
    const ops = form.images.map((img) => {
      if (img.url && !img.file) return of({ url: img.url, alt_text: img.alt_text?.trim() || null, is_primary: !!img.is_primary, sort_order: Number(img.sort_order) || 0 } as ProductImageCreate);
      if (!img.file) return of(null);
      img.uploading = true; img.uploadError = '';
      return this.mediaApi.uploadImage(img.file).pipe(
        map(res => { img.uploading = false; img.url = res.url; img.file = null; img.isExisting = true; img.previewUrl = this.resolveImageUrl(res.url); return { url: res.url, alt_text: img.alt_text?.trim() || null, is_primary: !!img.is_primary, sort_order: Number(img.sort_order) || 0 } as ProductImageCreate; }),
        finalize(() => { img.uploading = false; })
      );
    }).filter(Boolean);
    if (ops.length === 0) return of([] as ProductImageCreate[]);
    return forkJoin(ops).pipe(map(arr => arr.filter(Boolean) as ProductImageCreate[]));
  }

  private validate(form: ProductForm): string | null {
    if (!form.name.trim()) return 'El nombre es obligatorio.';
    if (!form.category_id) return 'La categoría es obligatoria.';
    if (!form.price_cop.trim() || !Number.isFinite(Number(form.price_cop)) || Number(form.price_cop) < 0) return 'Precio COP inválido.';
    if (!form.stock_quantity.trim() || !Number.isInteger(Number(form.stock_quantity)) || Number(form.stock_quantity) < 0) return 'Stock inválido.';
    if (form.images.length && !form.images.some(i => i.is_primary)) return 'Selecciona una imagen principal.';
    if (form.images.some(i => !i.url && !i.file)) return 'Cada imagen debe tener archivo o URL válida.';
    return null;
  }
  private emptyForm(): ProductForm { return { name:'', slug:'', description:'', price_cop:'', stock_quantity:'0', category_id:'', is_active:true, images:[] }; }
}
