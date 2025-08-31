import { Injectable, signal } from '@angular/core';
import { Product } from '../interfaces/product.interface';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  // Usamos un signal para que los cambios se reflejen automáticamente donde se use.
  cartItems = signal<Product[]>([]);

  constructor() {
    // Al iniciar el servicio, intentamos cargar el carrito desde localStorage.
    if (this.isBrowser()) {
      const storedCart = localStorage.getItem('shopping_cart');
      if (storedCart) {
        this.cartItems.set(JSON.parse(storedCart));
      }
    }
  }

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof localStorage !== 'undefined';
  }

  // Añade un producto al carrito. Si ya existe, incrementa la cantidad.
  addToCart(product: Product) {
    this.cartItems.update(items => {
      const itemInCart = items.find(item => item.id === product.id);
      if (itemInCart) {
        // Si el producto ya está en el carrito, incrementamos su cantidad
        return items.map(item =>
          item.id === product.id
            ? { ...item, quantity: (item.quantity || 1) + 1 }
            : item
        );
      } else {
        // Si es un producto nuevo, lo añadimos con cantidad 1
        return [...items, { ...product, quantity: 1 }];
      }
    });
    this.saveCartToLocalStorage();
  }

  // Elimina un producto del carrito
  removeFromCart(productId: number) {
    this.cartItems.update(items => items.filter(item => item.id !== productId));
    this.saveCartToLocalStorage();
  }

  // Limpia todo el carrito
  clearCart() {
    this.cartItems.set([]);
    this.saveCartToLocalStorage();
  }

  // Guarda el estado actual del carrito en localStorage
  private saveCartToLocalStorage() {
    if (this.isBrowser()) {
      localStorage.setItem('shopping_cart', JSON.stringify(this.cartItems()));
    }
  }

  // Calcula el total de la compra
  getTotal() {
    return this.cartItems().reduce((total, item) => total + item.price * (item.quantity || 1), 0);
  }
}
