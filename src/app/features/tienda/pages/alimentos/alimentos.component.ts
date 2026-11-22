import { Component } from '@angular/core';
import { CategoryProductsPageComponent } from '../category-products-page.component';

@Component({
  selector: 'app-alimentos',
  standalone: true,
  imports: [CategoryProductsPageComponent],
  template: `<app-category-products-page slug="alimentos" title="Alimentos" subtitle="Productos alimenticios disponibles en el catálogo."></app-category-products-page>`
})
export class AlimentosComponent {}
