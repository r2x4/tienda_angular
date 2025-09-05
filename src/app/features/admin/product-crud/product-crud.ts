import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IndexedDbService } from '../../../core/services/indexed-db.service';
import { Product } from '../../tienda/interfaces/product.interface';

// Use a partial type for the form model to avoid issues with the full Product interface
// and to add a temporary property for the colors string.
interface ProductForm extends Partial<Product> {
  colorsString?: string;
  category?: string; // Add category to the form interface
  stock?: number; // Add stock to the form interface
}

@Component({
  selector: 'app-product-crud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-crud.html',
  styleUrl: './product-crud.css'
})
export class ProductCrudComponent implements OnInit {
  products = signal<Product[]>([]);
  currentProduct = signal<ProductForm>({ name: '', price: 0, imageUrl: '', colorsString: '', category: '', stock: 0 });

  categories = ['calzado', 'implementos', 'ropa', 'suplementos']; // Define categories

  private indexedDbService = inject(IndexedDbService);

  ngOnInit(): void {
    this.loadProducts();
  }

  async loadProducts(): Promise<void> {
    this.products.set(await this.indexedDbService.getProducts());
  }

  private prepareProduct(productForm: ProductForm): Product {
    const colors = productForm.colorsString?.split(',').map(s => s.trim()).filter(s => s) || [];
    // Create a new object that matches the Product interface, excluding temporary form fields.
    const product: Omit<Product, 'id'> & { id?: number } = {
      id: productForm.id,
      name: productForm.name!,
      price: productForm.price!,
      imageUrl: productForm.imageUrl!,
      colors: colors,
      category: productForm.category!,
      stock: productForm.stock! // Include stock
    };
    return product as Product;
  }

  async addProduct(): Promise<void> {
    if (this.currentProduct().name && this.currentProduct().price! > 0 && this.currentProduct().imageUrl && this.currentProduct().category && this.currentProduct().stock! >= 0) {
      const newProduct = this.prepareProduct(this.currentProduct());
      await this.indexedDbService.addProduct(newProduct);
      this.clearForm();
      this.loadProducts();
    } else {
      alert('Por favor, rellena todos los campos requeridos.');
    }
  }

  editProduct(product: Product): void {
    const colorsString = product.colors.join(', ');
    this.currentProduct.set({ ...product, colorsString, category: product.category, stock: product.stock }); // Include stock
  }

  async updateProduct(): Promise<void> {
    if (this.currentProduct().id && this.currentProduct().category && this.currentProduct().stock! >= 0) {
      const updatedProduct = this.prepareProduct(this.currentProduct());
      await this.indexedDbService.updateProduct(updatedProduct);
      this.clearForm();
      this.loadProducts();
    } else {
      alert('Por favor, selecciona un producto para actualizar y rellena todos los campos.');
    }
  }

  async deleteProduct(id: number | undefined): Promise<void> {
    if (id) {
      await this.indexedDbService.deleteProduct(id);
      this.loadProducts();
    }
  }

  clearForm(): void {
    this.currentProduct.set({ name: '', price: 0, imageUrl: '', colorsString: '', category: '', stock: 0 });
  }
}