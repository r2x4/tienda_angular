export interface CartProductRead {
  id: string;
  name: string;
  slug: string;
  price_cop: string;
  is_active: boolean;
  stock_quantity: number;
}

export interface CartItemRead {
  id: string;
  product_id: string;
  quantity: number;
  unit_price_cop: string;
  line_total_cop: string;
  created_at: string;
  updated_at: string;
  product: CartProductRead;
}

export interface CartRead {
  id: string;
  user_id: string | null;
  guest_cart_token?: string | null;
  items: CartItemRead[];
  subtotal_cop: string;
  total_cop: string;
  currency: string;
  created_at: string;
  updated_at: string;
}

export interface CartItemAddRequest {
  product_id: string;
  quantity: number;
}

export interface CartItemUpdateRequest {
  quantity: number;
}

export interface BuyerInfo {
  full_name: string;
  email: string;
  phone?: string | null;
  address: string;
}

export interface CheckoutRequest {
  buyer?: BuyerInfo | null;
  idempotency_key?: string | null;
}

export interface OrderItemRead {
  id: string;
  product_id: string | null;
  product_name: string;
  product_slug: string;
  unit_price_cop: string;
  quantity: number;
  line_total_cop: string;
}

export interface OrderRead {
  id: string;
  order_number: string;
  user_id: string | null;
  status: string;
  currency: string;
  subtotal: string;
  total: string;
  created_at: string;
  items: OrderItemRead[];
}

export interface OrderCreateResponse {
  order: OrderRead;
  guest_order_access_token?: string | null;
}
