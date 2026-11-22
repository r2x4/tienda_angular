import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CatalogDisplayProduct, formatCop } from '../../models/catalog-view.models';
import { CartService } from '../../services/cart.service';
import { normalizeApiError } from '../../../../core/api/api-error';

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './product-card.component.html',
})
export class ProductCardComponent {
  private readonly cartService = inject(CartService);
  readonly product = input.required<CatalogDisplayProduct>();
  readonly adding = signal(false);
  readonly feedback = signal<{ type: 'success' | 'error'; text: string } | null>(null);
  readonly formatCop = formatCop;

  get available(): boolean {
    const p = this.product();
    return !!p.is_active && (p.stock_quantity ?? 0) > 0;
  }

  get stockLabel(): string {
    const p = this.product();
    if (!p.is_active) return 'No disponible';
    return (p.stock_quantity ?? 0) > 0 ? 'Disponible' : 'Agotado';
  }

  get detailRoute(): any[] {
    return ['/productos', this.product().id];
  }

  selectColor(color: string): void {
    this.product().selectedColor = color;
    this.feedback.set(null);
  }

  addToCart(): void {
    const p = this.product();
    this.feedback.set(null);
    if (!p.is_active || (p.stock_quantity ?? 0) <= 0) {
      this.feedback.set({ type: 'error', text: 'Este producto no está disponible actualmente.' });
      return;
    }
    if ((p.colors?.length ?? 0) > 0 && !p.selectedColor) {
      this.feedback.set({ type: 'error', text: 'Selecciona un color antes de añadir al carrito.' });
      return;
    }
    this.adding.set(true);
    this.cartService.addToCart(p).subscribe({
      next: () => {
        this.adding.set(false);
        this.feedback.set({ type: 'success', text: `${p.name}${p.selectedColor ? ` (${p.selectedColor})` : ''} añadido al carrito.` });
      },
      error: (err) => {
        this.adding.set(false);
        this.feedback.set({ type: 'error', text: normalizeApiError(err, 'No se pudo agregar el producto al carrito.').message });
      },
    });
  }

  colorClass(color: string): string {
    const map: Record<string, string> = {
      red: 'bg-red-500', green: 'bg-green-500', black: 'bg-black', white: 'bg-white',
      blue: 'bg-blue-500', gray: 'bg-gray-500', grey: 'bg-gray-500', yellow: 'bg-yellow-500',
      chocolate: 'bg-yellow-800', vanilla: 'bg-purple-200', purple: 'bg-purple-500', orange: 'bg-orange-500',
    };
    return map[color.toLowerCase()] || 'bg-slate-300';
  }
}
