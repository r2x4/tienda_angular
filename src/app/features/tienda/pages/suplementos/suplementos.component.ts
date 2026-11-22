import { Component } from '@angular/core';
import { CategoryProductsPageComponent } from '../category-products-page.component';

@Component({
  selector: 'app-suplementos',
  standalone: true,
  imports: [CategoryProductsPageComponent],
  template: `<app-category-products-page slug="suplementos" title="Suplementos" subtitle="Suplementos del catálogo con disponibilidad y precio actualizados." heroImage="assets/images/public/category-suplementos.jpg" heroAlt="Suplementos deportivos en un entorno limpio"></app-category-products-page>`
})
export class SuplementosComponent {}
