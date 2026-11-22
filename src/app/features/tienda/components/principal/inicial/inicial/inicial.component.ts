import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { INICIAL_IMAGES } from '../../../../constants/image-data';
import { ProductService } from '../../../../services/product.service';
import { CatalogDisplayProduct } from '../../../../models/catalog-view.models';
import { formatCop } from '../../../../models/catalog-view.models';

@Component({
  selector: 'app-inicial',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './inicial.component.html',
  styleUrls: ['./inicial.component.css']
})
export default class InicialComponent implements OnInit, OnDestroy {
  images = INICIAL_IMAGES;
  currentIndex = 0;
  private intervalId: any;
  private productService = inject(ProductService);
  bestSellers = signal<CatalogDisplayProduct[]>([]);
  loading = signal(false);
  error = signal('');
  readonly formatCop = formatCop;

  ngOnInit(): void { this.startSlider(); this.loadBestSellers(); }
  ngOnDestroy(): void { this.stopSlider(); }

  loadBestSellers(): void {
    this.loading.set(true); this.error.set('');
    forkJoin({
      suplementos: this.productService.getSuplementosProducts(),
      ropa: this.productService.getRopaProducts(),
      calzado: this.productService.getCalzadoProducts(),
      implementos: this.productService.getImplementosProducts(),
    }).subscribe({
      next: ({ suplementos, ropa, calzado, implementos }) => {
        this.bestSellers.set([...suplementos, ...ropa, ...calzado, ...implementos].filter(p => p.is_active !== false).slice(0, 12));
        this.loading.set(false);
      },
      error: () => { this.error.set('No se pudieron cargar productos destacados.'); this.loading.set(false); }
    });
  }

  startSlider(): void { this.intervalId = setInterval(() => { this.next(); }, 5000); }
  stopSlider(): void { if (this.intervalId) clearInterval(this.intervalId); }
  prev(): void { this.stopSlider(); this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : this.images.length - 1; this.startSlider(); }
  next(): void { this.stopSlider(); this.currentIndex = (this.currentIndex < this.images.length - 1) ? this.currentIndex + 1 : 0; this.startSlider(); }
}
