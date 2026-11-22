import { Component } from '@angular/core';
import { CategoryProductsPageComponent } from '../category-products-page.component';

@Component({
  selector: 'app-implementos',
  standalone: true,
  imports: [CategoryProductsPageComponent],
  template: `<app-category-products-page slug="implementos" title="Implementos" subtitle="Equipamiento y accesorios deportivos disponibles en el catálogo." heroImage="assets/images/public/category-implementos.jpg" heroAlt="Implementos deportivos para entrenamiento"></app-category-products-page>`
})
export class ImplementosComponent {}
