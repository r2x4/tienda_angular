import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { CatalogDisplayProduct } from '../models/catalog-view.models';
import { ProductService } from '../services/product.service';
import { normalizeApiError } from '../../../core/api/api-error';
import { ProductCardComponent } from '../components/product-card/product-card.component';

@Component({
  selector: 'app-category-products-page',
  standalone: true,
  imports: [CommonModule, ProductCardComponent],
  template: `
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
      <header class="mb-8 overflow-hidden rounded-3xl border border-line-200 bg-white shadow-sm">
        <div class="grid md:grid-cols-[1.1fr_.9fr] items-stretch">
          <div class="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <p class="text-sm font-semibold text-teal-700 uppercase tracking-wide">Categoría</p>
            <h1 class="font-display text-3xl sm:text-4xl font-bold text-ink-900 mt-2">{{ title }}</h1>
            <p *ngIf="subtitle" class="text-ink-600 mt-3 max-w-2xl">{{ subtitle }}</p>
          </div>
          <div *ngIf="heroImage" class="min-h-48 sm:min-h-56 md:min-h-full bg-sand-50 border-t md:border-t-0 md:border-l border-line-200">
            <img [src]="heroImage" [alt]="heroAlt || title" loading="lazy" class="w-full h-full object-cover min-h-48 sm:min-h-56 md:min-h-[220px]">
          </div>
        </div>
      </header>

      <div *ngIf="loading()" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
        <div *ngFor="let i of skeletons" class="bg-white rounded-2xl border border-line-200 overflow-hidden">
          <div class="aspect-[4/3] skeleton"></div>
          <div class="p-5 space-y-3"><div class="h-5 skeleton w-3/4"></div><div class="h-4 skeleton w-1/2"></div><div class="h-11 skeleton w-full mt-6"></div></div>
        </div>
      </div>

      <div *ngIf="!loading() && error()" class="bg-white border border-red-200 rounded-2xl p-8 text-center">
        <p class="text-danger-600 font-medium">{{ error() }}</p>
        <button type="button" (click)="load()" class="mt-4 min-h-11 px-5 rounded-xl bg-ink-900 text-white font-semibold hover:bg-black/90">Reintentar</button>
      </div>

      <div *ngIf="!loading() && !error() && products().length === 0" class="bg-white border border-line-200 rounded-2xl p-10 text-center">
        <div class="mx-auto w-14 h-14 rounded-full bg-sand-50 text-teal-700 flex items-center justify-center mb-4"><i class="fas fa-box-open text-xl" aria-hidden="true"></i></div>
        <h2 class="font-display text-xl font-bold text-ink-900">No hay productos disponibles</h2>
        <p class="text-ink-600 mt-2">Esta categoría no tiene productos activos por ahora.</p>
      </div>

      <div *ngIf="!loading() && !error() && products().length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <app-product-card *ngFor="let product of products()" [product]="product"></app-product-card>
      </div>
    </div>
  `
})
export class CategoryProductsPageComponent implements OnInit {
  @Input({ required: true }) slug!: string;
  @Input({ required: true }) title!: string;
  @Input() subtitle = '';
  @Input() heroImage = '';
  @Input() heroAlt = '';
  private readonly productService: ProductService = inject(ProductService);

  readonly products = signal<CatalogDisplayProduct[]>([]);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly skeletons = [1, 2, 3, 4, 5, 6];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true); this.error.set('');
    this.productService.getProductsByCategory(this.slug).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (products: CatalogDisplayProduct[]) => this.products.set(products),
      error: (err: unknown) => this.error.set(normalizeApiError(err, 'No se pudieron cargar los productos.').message),
    });
  }
}
