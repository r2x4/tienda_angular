export interface SaleItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
}

export interface Sale {
  id?: number;
  date: number; // Timestamp
  items: SaleItem[];
  total: number;
}
