export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  colors: string[];
  category: string; // New property for product category
  stock: number; // New property for product stock
  selectedColor?: string; // Color seleccionado actualmente
  quantity?: number; // Añadido para el carrito
}
