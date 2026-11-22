import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { TokenStorageService } from './token-storage.service';

describe('TokenStorageService', () => {
  let service: TokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([]), TokenStorageService],
    });
    service = TestBed.inject(TokenStorageService);
  });

  it('loads valid session from localStorage', () => {
    localStorage.setItem('app_auth_session_v1', JSON.stringify({
      accessToken: 'a', refreshToken: 'r', tokenType: 'bearer', user: null
    }));
    expect(service.load()?.accessToken).toBe('a');
  });

  it('clears invalid session shape', () => {
    localStorage.setItem('app_auth_session_v1', JSON.stringify({ accessToken: 'a' }));
    expect(service.load()).toBeNull();
    expect(localStorage.getItem('app_auth_session_v1')).toBeNull();
  });

  it('updates tokens and preserves user', () => {
    service.save({ accessToken: 'a1', refreshToken: 'r1', tokenType: 'bearer', user: { id: 'u1', email: 'e@e.com', is_active: true, created_at: '2026-01-01T00:00:00Z', roles: [] } });
    service.updateTokens('a2', 'r2');
    const s = service.load();
    expect(s?.accessToken).toBe('a2');
    expect(s?.refreshToken).toBe('r2');
    expect(s?.user?.id).toBe('u1');
  });
});
