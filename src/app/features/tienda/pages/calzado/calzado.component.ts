import { Component } from '@angular/core';
import { CategoryProductsPageComponent } from '../category-products-page.component';

@Component({
  selector: 'app-calzado',
  standalone: true,
  imports: [CategoryProductsPageComponent],
  template: `<app-category-products-page slug="calzado" title="Calzado" subtitle="Encuentra calzado deportivo y casual con información real de disponibilidad." heroImage="assets/images/public/category-calzado.jpg" heroAlt="Calzado deportivo en exhibición"></app-category-products-page>`
})
export class CalzadoComponent {}
