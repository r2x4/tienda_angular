import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { CatalogDisplayProduct, formatCop } from '../../models/catalog-view.models';
import { CartService } from '../../services/cart.service';
import { ProductService } from '../../services/product.service';
import { normalizeApiError } from '../../../../core/api/api-error';

@Component({
  selector: 'app-alimentos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './alimentos.component.html',
})
export class AlimentosComponent implements OnInit {
  private cartService = inject(CartService);
  private productService = inject(ProductService);
  products = signal<CatalogDisplayProduct[]>([]);
  loading = signal(false);
  error = signal('');
  readonly formatCop = formatCop;

  ngOnInit(): void { this.load(); }
  load(): void {
    this.loading.set(true); this.error.set('');
    this.productService.getSuplementosProducts().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: (products) => this.products.set(products),
      error: (err) => this.error.set(normalizeApiError(err, 'No se pudieron cargar los productos.').message),
    });
  }

  addToCart(product: CatalogDisplayProduct) {
    if (!product.is_active || (product.stock_quantity ?? 0) <= 0) { alert('Este producto no está disponible actualmente.'); return; }
    if (product.colors?.length > 0 && !product.selectedColor) { alert('Por favor, selecciona un color antes de añadir al carrito.'); return; }
    this.cartService.addToCart(product).subscribe({
      next: () => alert(`${product.name}${product.selectedColor ? ` (${product.selectedColor})` : ''} ha sido añadido al carrito.`),
      error: (err) => alert(normalizeApiError(err, 'No se pudo agregar el producto al carrito.').message),
    });
  }
}



