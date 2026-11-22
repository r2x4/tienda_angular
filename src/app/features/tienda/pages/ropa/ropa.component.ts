import { Component } from '@angular/core';
import { CategoryProductsPageComponent } from '../category-products-page.component';

@Component({
  selector: 'app-ropa',
  standalone: true,
  imports: [CategoryProductsPageComponent],
  template: `<app-category-products-page slug="ropa" title="Ropa" subtitle="Prendas deportivas y activas con precios y stock reales." heroImage="assets/images/public/category-ropa.jpg" heroAlt="Ropa deportiva moderna"></app-category-products-page>`
})
export class RopaComponent {}
