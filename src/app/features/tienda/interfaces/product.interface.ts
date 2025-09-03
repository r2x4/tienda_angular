export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  colors: string[];
  selectedColor?: string; // Color seleccionado actualmente
  quantity?: number; // Añadido para el carrito
}
