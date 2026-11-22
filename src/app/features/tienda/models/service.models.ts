export interface ServiceRead {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price_cop: string;
  duration_minutes: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ServiceListResponse {
  items: ServiceRead[];
  total: number;
  skip: number;
  limit: number;
}

export interface ServiceListParams {
  skip?: number;
  limit?: number;
}

export interface ServiceCreate {
  name: string;
  slug: string;
  description?: string | null;
  price_cop: number | string;
  duration_minutes?: number | null;
  image_url?: string | null;
  is_active?: boolean;
}

export interface ServiceUpdate {
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  price_cop?: number | string | null;
  duration_minutes?: number | null;
  image_url?: string | null;
  is_active?: boolean | null;
}
