import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { NavigationService } from './core/services/navigation.service';
import { IndexedDbService } from './core/services/indexed-db.service';
import { ProductService } from './features/tienda/services/product.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  private navigationService = inject(NavigationService);
  private indexedDbService = inject(IndexedDbService);
  private productService = inject(ProductService);

  title = 'tienda_angular';
  activeComponent: any;

  constructor() {
    this.activeComponent = this.navigationService.activeComponent;
  }

  async ngOnInit(): Promise<void> {
    await this.populateIndexedDB();
  }

  private async populateIndexedDB(): Promise<void> {
    const productsInDb = await this.indexedDbService.getProducts();

    if (productsInDb.length === 0) {
      const allProducts = [
        ...this.productService.getSuplementosProducts(),
        ...this.productService.getRopaProducts(),
        ...this.productService.getCalzadoProducts(),
        ...this.productService.getImplementosProducts()
      ];

      for (const product of allProducts) {
        await this.indexedDbService.updateProduct(product);
      }
      console.log('IndexedDB poblada con productos iniciales.');

      // Add a small delay to allow IndexedDB operations to finalize
      await new Promise(resolve => setTimeout(resolve, 500)); // 500ms delay
    }
  }
}

