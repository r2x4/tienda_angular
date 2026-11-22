export interface CategoryRead {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CategorySummary {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
}

export interface ProductImageRead {
  url: string;
  alt_text?: string | null;
  is_primary: boolean;
  sort_order: number;
  id: string;
  product_id: string;
  created_at: string;
}

export interface ProductRead {
  id: string;
  category_id: string;
  name: string;
  slug: string;
  description?: string | null;
  price_cop: string;
  stock_quantity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  category?: CategorySummary | null;
  images?: ProductImageRead[];
}

export interface ProductAvailabilityRead {
  product_id: string;
  stock_quantity: number;
  is_active: boolean;
  available: boolean;
}

export interface CatalogProductsQuery {
  category_id?: string;
}

export interface CategoryCreate {
  name: string;
  slug?: string | null;
  description?: string | null;
  is_active?: boolean;
}

export interface CategoryUpdate {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  is_active?: boolean | null;
}

export interface ProductImageCreate {
  url: string;
  alt_text?: string | null;
  is_primary?: boolean;
  sort_order?: number;
}

export interface ProductCreate {
  category_id: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  price_cop: number | string;
  stock_quantity: number;
  is_active?: boolean;
  images?: ProductImageCreate[];
}

export interface ProductUpdate {
  category_id?: string | null;
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  price_cop?: number | string | null;
  stock_quantity?: number | null;
  is_active?: boolean | null;
  images?: ProductImageCreate[] | null;
}
