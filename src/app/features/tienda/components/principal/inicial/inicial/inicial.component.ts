import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { INICIAL_IMAGES } from '../../../../constants/image-data';
import { ProductService } from '../../../../services/product.service';
import { PublicServicesApiService } from '../../../../services/public-services-api.service';
import { CatalogDisplayProduct, formatCop } from '../../../../models/catalog-view.models';
import { ServiceRead } from '../../../../models/service.models';
import { ProductCardComponent } from '../../../../components/product-card/product-card.component';

@Component({
  selector: 'app-inicial',
  standalone: true,
  imports: [CommonModule, RouterLink, ProductCardComponent],
  templateUrl: './inicial.component.html',
  styleUrls: ['./inicial.component.css']
})
export default class InicialComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly servicesApi = inject(PublicServicesApiService);

  readonly images = INICIAL_IMAGES;
  readonly currentIndex = signal(0);
  readonly featured = signal<CatalogDisplayProduct[]>([]);
  readonly services = signal<ServiceRead[]>([]);
  readonly loadingFeatured = signal(false);
  readonly loadingServices = signal(false);
  readonly featuredError = signal('');
  readonly servicesError = signal('');
  readonly formatCop = formatCop;

  readonly categories = [
    { title: 'Calzado', route: '/calzado', description: 'Modelos deportivos y casuales.', image: 'assets/images/public/category-calzado.jpg', alt: 'Zapatillas deportivas' },
    { title: 'Implementos', route: '/implementos', description: 'Equipamiento para tu rutina.', image: 'assets/images/public/category-implementos.jpg', alt: 'Implementos de entrenamiento' },
    { title: 'Ropa', route: '/ropa', description: 'Prendas activas y cómodas.', image: 'assets/images/public/category-ropa.jpg', alt: 'Ropa deportiva' },
    { title: 'Suplementos', route: '/suplementos', description: 'Opciones del catálogo real.', image: 'assets/images/public/category-suplementos.jpg', alt: 'Suplementos deportivos' },
  ];

  readonly capabilities = [
    { title: 'Catálogo real', text: 'Productos y servicios conectados a los endpoints actuales.', icon: 'fa-store' },
    { title: 'Carrito funcional', text: 'Agrega productos disponibles usando el flujo existente.', icon: 'fa-cart-shopping' },
    { title: 'Cuenta y pedidos', text: 'Accede con tu cuenta para continuar el proceso de compra.', icon: 'fa-user-shield' },
  ];

  ngOnInit(): void { this.loadFeatured(); this.loadServices(); }

  loadFeatured(): void {
    this.loadingFeatured.set(true); this.featuredError.set('');
    forkJoin({
      suplementos: this.productService.getSuplementosProducts().pipe(catchError(() => of([]))),
      ropa: this.productService.getRopaProducts().pipe(catchError(() => of([]))),
      calzado: this.productService.getCalzadoProducts().pipe(catchError(() => of([]))),
      implementos: this.productService.getImplementosProducts().pipe(catchError(() => of([]))),
    }).pipe(finalize(() => this.loadingFeatured.set(false))).subscribe({
      next: ({ suplementos, ropa, calzado, implementos }) => {
        const all = [...suplementos, ...ropa, ...calzado, ...implementos].filter(p => p.is_active !== false);
        this.featured.set(all.slice(0, 8));
        if (all.length === 0) this.featuredError.set('No hay productos destacados disponibles en este momento.');
      },
      error: () => this.featuredError.set('No se pudieron cargar productos destacados.')
    });
  }

  loadServices(): void {
    this.loadingServices.set(true); this.servicesError.set('');
    this.servicesApi.list({ skip: 0, limit: 3 }).pipe(finalize(() => this.loadingServices.set(false))).subscribe({
      next: (res) => this.services.set((res.items ?? []).filter(s => s.is_active === true).slice(0, 3)),
      error: () => this.servicesError.set('No se pudieron cargar servicios.')
    });
  }

  prev(): void { const len = this.images.length || 1; this.currentIndex.set((this.currentIndex() - 1 + len) % len); }
  next(): void { const len = this.images.length || 1; this.currentIndex.set((this.currentIndex() + 1) % len); }
  goTo(i: number): void { this.currentIndex.set(i); }
}
