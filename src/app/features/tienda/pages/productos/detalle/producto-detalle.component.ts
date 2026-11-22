import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';
import { CatalogDisplayProduct, formatCop, mapProductReadToDisplay } from '../../../models/catalog-view.models';
import { normalizeApiError } from '../../../../../core/api/api-error';

@Component({
  selector: 'app-producto-detalle',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './producto-detalle.component.html',
})
export class ProductoDetalleComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly productService = inject(ProductService);
  private readonly cartService = inject(CartService);

  readonly loading = signal(false);
  readonly error = signal('');
  readonly notFound = signal(false);
  readonly product = signal<CatalogDisplayProduct | null>(null);
  readonly selectedImage = signal('');
  readonly adding = signal(false);
  readonly feedback = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  readonly formatCop = formatCop;

  readonly images = computed(() => {
    const p = this.product();
    if (!p) return [] as { url: string; alt: string }[];
    const imgs = [...(p.images ?? [])]
      .sort((a, b) => (a.is_primary !== b.is_primary ? (a.is_primary ? -1 : 1) : (a.sort_order ?? 0) - (b.sort_order ?? 0)))
      .map(img => ({ url: img.url, alt: img.alt_text || p.name }))
      .filter(img => !!img.url);
    return imgs.length ? imgs : [{ url: p.imageUrl, alt: p.name }];
  });

  readonly activeImage = computed(() => this.selectedImage() || this.images()[0]?.url || this.product()?.imageUrl || 'assets/ropa_ropaDeportiva.jpg');

  readonly available = computed(() => {
    const p = this.product();
    return !!p && !!p.is_active && (p.stock_quantity ?? 0) > 0;
  });

  readonly stockLabel = computed(() => {
    const p = this.product();
    if (!p) return '';
    if (!p.is_active) return 'No disponible';
    return (p.stock_quantity ?? 0) > 0 ? `Disponible (${p.stock_quantity} en stock)` : 'Agotado';
  });

  readonly categoryRoute = computed(() => {
    const slug = this.product()?.category?.slug;
    return slug ? ['/', slug] : ['/inicial'];
  });

  readonly categoryLabel = computed(() => this.product()?.category?.name || 'Catálogo');

  ngOnInit(): void { this.load(); }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) { this.notFound.set(true); return; }
    this.loading.set(true); this.error.set(''); this.notFound.set(false); this.product.set(null); this.feedback.set(null); this.selectedImage.set('');
    this.productService.getProductById(id).pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (p) => {
        const mapped = mapProductReadToDisplay(p);
        if (!mapped.is_active) { this.product.set(mapped); this.notFound.set(true); return; }
        this.product.set(mapped);
        this.selectedImage.set(this.images()[0]?.url || mapped.imageUrl);
      },
      error: (err) => {
        const e = normalizeApiError(err, 'No se pudo cargar el producto.');
        if (e.status === 404) this.notFound.set(true); else this.error.set(e.message);
      }
    });
  }

  selectImage(url: string): void { this.selectedImage.set(url); }

  addToCart(): void {
    const p = this.product();
    this.feedback.set(null);
    if (!p || !p.is_active || (p.stock_quantity ?? 0) <= 0) {
      this.feedback.set({ type: 'error', text: 'Este producto no está disponible actualmente.' });
      return;
    }
    this.adding.set(true);
    this.cartService.addToCart(p).subscribe({
      next: () => {
        this.adding.set(false);
        this.feedback.set({ type: 'success', text: `${p.name} añadido al carrito.` });
      },
      error: (err) => {
        this.adding.set(false);
        this.feedback.set({ type: 'error', text: normalizeApiError(err, 'No se pudo agregar el producto al carrito.').message });
      }
    });
  }
}
