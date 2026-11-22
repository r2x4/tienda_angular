import { Injectable, inject } from '@angular/core';
import { Observable, map, of, shareReplay } from 'rxjs';
import { CatalogCategoryService } from './catalog-category.service';
import { CatalogProductService } from './catalog-product.service';
import { CategoryRead } from '../models/catalog.models';
import { CatalogDisplayProduct, mapProductReadToDisplay } from '../models/catalog-view.models';

/**
 * Catalog facade backed by real FastAPI catalog endpoints.
 * No hardcoded product/category fallback is used when API fails.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly categoriesApi = inject(CatalogCategoryService);
  private readonly productsApi = inject(CatalogProductService);
  private categoriesCache$?: Observable<CategoryRead[]>;

  getCategories(): Observable<CategoryRead[]> {
    if (!this.categoriesCache$) {
      this.categoriesCache$ = this.categoriesApi.list().pipe(shareReplay(1));
    }
    return this.categoriesCache$;
  }

  // kept for compatibility; prefer getProductsByCategory
  getProductsByCategorySlug(slug: string): Observable<CatalogDisplayProduct[]> {
    return this.getProductsByCategory(slug);
  }

  getProductsByCategory(slug: string): Observable<CatalogDisplayProduct[]> {
    return new Observable<CatalogDisplayProduct[]>((subscriber) => {
      const sub = this.getCategories().subscribe({
        next: (categories) => {
          const category = categories.find((c) => c.slug === slug && c.is_active);
          if (!category) {
            subscriber.next([]);
            subscriber.complete();
            return;
          }
          this.productsApi.list({ category_id: category.id }).subscribe({
            next: (products) => {
              subscriber.next(products.filter((p) => p.is_active).map(mapProductReadToDisplay));
              subscriber.complete();
            },
            error: (err) => subscriber.error(err),
          });
        },
        error: (err) => subscriber.error(err),
      });
      return () => sub.unsubscribe();
    });
  }

  getSuplementosProducts(): Observable<CatalogDisplayProduct[]> { return this.getProductsByCategory('suplementos'); }
  getRopaProducts(): Observable<CatalogDisplayProduct[]> { return this.getProductsByCategory('ropa'); }
  getCalzadoProducts(): Observable<CatalogDisplayProduct[]> { return this.getProductsByCategory('calzado'); }
  getImplementosProducts(): Observable<CatalogDisplayProduct[]> { return this.getProductsByCategory('implementos'); }

  getProductById(productId: string) {
    return this.productsApi.getById(productId).pipe(map(mapProductReadToDisplay));
  }

  getAvailability(productId: string) {
    return this.productsApi.getAvailability(productId);
  }

  clearCategoryCache(): void {
    this.categoriesCache$ = undefined;
  }
}