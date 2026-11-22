import { CategorySummary, ProductImageRead } from '../models/catalog.models';

// Legacy-compatible shape used by cart/admin/local flows; extended with backend fields.
export interface Product {
  id: string | number;
  name: string;
  price: number;
  imageUrl: string;
  colors: string[];
  category: string;
  stock: number;
  selectedColor?: string;
  quantity?: number;

  // Backend catalog fields (optional for compatibility)
  category_id?: string;
  slug?: string;
  description?: string | null;
  price_cop?: string;
  stock_quantity?: number;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
  categoryRef?: CategorySummary | null;
  categorySlug?: string;
  images?: ProductImageRead[];
}
