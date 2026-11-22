export interface RoleRead {
  id: string;
  code: string;
  name: string;
  description?: string | null;
}

export interface UserRead {
  id: string;
  email: string;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
  is_active: boolean;
  created_at: string;
  roles?: RoleRead[];
}

export interface RegisterRequest {
  email: string;
  username?: string | null;
  password: string;
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  city?: string | null;
}

export interface LoginRequest {
  identifier: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface LogoutRequest {
  refresh_token: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface AuthTokensResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: UserRead;
}

export interface AccessTokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface MessageResponse {
  message: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  user: UserRead | null;
}
