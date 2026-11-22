export interface RoleRead {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface AdminUserRead {
  id: string;
  email: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  roles?: RoleRead[];
}

export interface AdminUserListResponse {
  items: AdminUserRead[];
  total: number;
  skip: number;
  limit: number;
}

export interface AdminUserListParams {
  skip?: number;
  limit?: number;
  is_active?: boolean;
  role?: string;
  q?: string;
}

export interface AdminUserRolesReplaceRequest {
  roles: string[];
}
