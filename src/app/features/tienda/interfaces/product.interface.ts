export interface Product {
  id: number;
  name: string;
  price: number;
  imageUrl: string;
  colors: string[];
  quantity?: number; // Añadido para el carrito
}
