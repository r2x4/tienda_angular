export interface SaleItem {
  productId: string | number;
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
