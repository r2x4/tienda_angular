import { Injectable, inject } from '@angular/core';
import { HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiClientService, RETRY_AUTH_REFRESH, SKIP_AUTH } from '../../api/api-client.service';
import {
  AccessTokenResponse,
  AuthTokensResponse,
  ChangePasswordRequest,
  LoginRequest,
  LogoutRequest,
  MessageResponse,
  RefreshRequest,
  RegisterRequest,
  UserRead,
} from '../models/auth.models';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly api = inject(ApiClientService);

  register(payload: RegisterRequest): Observable<AuthTokensResponse> {
    return this.api.post<AuthTokensResponse>('/auth/register', payload, {
      context: new HttpContext().set(SKIP_AUTH, true).set(RETRY_AUTH_REFRESH, false),
    });
  }

  login(payload: LoginRequest): Observable<AuthTokensResponse> {
    return this.api.post<AuthTokensResponse>('/auth/login', payload, {
      context: new HttpContext().set(SKIP_AUTH, true).set(RETRY_AUTH_REFRESH, false),
    });
  }

  refresh(payload: RefreshRequest): Observable<AccessTokenResponse> {
    return this.api.post<AccessTokenResponse>('/auth/refresh', payload, {
      context: new HttpContext().set(SKIP_AUTH, true).set(RETRY_AUTH_REFRESH, false),
    });
  }

  logout(payload: LogoutRequest): Observable<MessageResponse> {
    return this.api.post<MessageResponse>('/auth/logout', payload, {
      context: new HttpContext().set(SKIP_AUTH, true).set(RETRY_AUTH_REFRESH, false),
    });
  }

  me(): Observable<UserRead> {
    // /auth/me is a protected endpoint; interceptor handles bearer/retry policy.
    return this.api.get<UserRead>('/auth/me');
  }

  changePassword(payload: ChangePasswordRequest): Observable<MessageResponse> {
    return this.api.post<MessageResponse>('/auth/change-password', payload);
  }
}
