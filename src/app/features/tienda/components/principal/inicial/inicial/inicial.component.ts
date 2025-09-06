import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { INICIAL_IMAGES } from '../../../../constants/image-data';
import { ProductService } from '../../../../services/product.service';
import { Product } from '../../../../interfaces/product.interface';

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
  bestSellers: Product[] = [];

  ngOnInit(): void {
    this.startSlider();
    this.loadBestSellers();
  }

  ngOnDestroy(): void {
    this.stopSlider();
  }

  loadBestSellers(): void {
    const allProducts = [
      ...this.productService.getSuplementosProducts(),
      ...this.productService.getRopaProducts(),
      ...this.productService.getCalzadoProducts(),
      ...this.productService.getImplementosProducts()
    ];
    // Select 12 products for the 3x4 grid
    this.bestSellers = allProducts.slice(0, 12);
  }

  startSlider(): void {
    this.intervalId = setInterval(() => {
      this.next();
    }, 5000); // Change image every 5 seconds
  }

  stopSlider(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  prev(): void {
    this.stopSlider();
    this.currentIndex = (this.currentIndex > 0) ? this.currentIndex - 1 : this.images.length - 1;
    this.startSlider();
  }

  next(): void {
    this.stopSlider();
    this.currentIndex = (this.currentIndex < this.images.length - 1) ? this.currentIndex + 1 : 0;
    this.startSlider();
  }
}

