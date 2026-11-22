import { ProductImageRead, ProductRead } from '../models/catalog.models';

export interface CatalogDisplayProduct extends ProductRead {
  price: number; // derived from price_cop for existing UI/cart compatibility
  imageUrl: string;
  stock: number;
  colors: string[];
  categorySlug: string;
  selectedColor?: string;
  quantity?: number;
}

export function mapProductReadToDisplay(product: ProductRead): CatalogDisplayProduct {
  const images = [...(product.images ?? [])].sort((a, b) => {
    if (a.is_primary !== b.is_primary) return a.is_primary ? -1 : 1;
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
  const primary = images[0];
  const price = Number(product.price_cop);
  return {
    ...product,
    price: Number.isFinite(price) ? price : 0,
    imageUrl: primary?.url || 'assets/ropa_ropaDeportiva.jpg',
    stock: product.stock_quantity,
    colors: [],
    categorySlug: product.category?.slug || '',
  };
}

export function formatCop(value: string | number | null | undefined): string {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 'COP 0';
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
}
