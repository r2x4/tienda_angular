import { TestBed } from '@angular/core/testing';
import { provideHttpClient, withInterceptors, HttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionService } from './auth-session.service';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { TokenStorageService } from './token-storage.service';
import { environment } from '../../../../environments/environment';

describe('AuthSessionService + interceptor', () => {
  let service: AuthSessionService;
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let storage: TokenStorageService;
  let router: jasmine.SpyObj<Router>;
  const base = environment.apiBaseUrl.replace(/\/$/, '');

  beforeEach(() => {
    localStorage.clear();
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    router.navigate.and.resolveTo(true);
    TestBed.configureTestingModule({
      providers: [
        { provide: Router, useValue: router },
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(AuthSessionService);
    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    storage = TestBed.inject(TokenStorageService);
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  function seedSession(access = 'a1', refresh = 'r1') {
    storage.save({ accessToken: access, refreshToken: refresh, tokenType: 'bearer', user: null });
  }

  it('login stores session and user', () => {
    let userEmail = '';
    service.login({ identifier: 'u@example.com', password: 'Pass1234!' }).subscribe(u => (userEmail = u.email));
    const req = httpMock.expectOne(`${base}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ access_token: 'access-1', refresh_token: 'refresh-1', token_type: 'bearer', user: { id: '1', email: 'u@example.com', is_active: true, created_at: '2026-01-01T00:00:00Z', roles: [] } });
    expect(userEmail).toBe('u@example.com');
    expect(storage.getAccessToken()).toBe('access-1');
    expect(storage.getRefreshToken()).toBe('refresh-1');
  });

  it('recovers session after reload and fetches /auth/me', () => {
    localStorage.setItem('app_auth_session_v1', JSON.stringify({ accessToken: 'a1', refreshToken: 'r1', tokenType: 'bearer', user: null }));
    // Simulate reload: new service instance should load from storage and profile itself.
    const storage2 = new TokenStorageService();
    expect(storage2.getAccessToken()).toBe('a1');
    seedSession('a1', 'r1');
    service.refreshProfile().subscribe();
    const me = httpMock.expectOne(`${base}/auth/me`);
    expect(me.request.headers.get('Authorization')).toBe('Bearer a1');
    me.flush({ id: '1', email: 'u@example.com', is_active: true, created_at: '2026-01-01T00:00:00Z', roles: [{ id: 'r', code: 'CUSTOMER', name: 'Customer' }] });
    expect(storage.load()?.user?.email).toBe('u@example.com');
  });

  it('single refresh for multiple simultaneous 401s and rotated refresh token is stored', () => {
    seedSession('old-access', 'old-refresh');
    let v1: any; let v2: any;
    http.get(`${base}/protected/1`).subscribe(v => (v1 = v));
    http.get(`${base}/protected/2`).subscribe(v => (v2 = v));

    const p1 = httpMock.expectOne(`${base}/protected/1`);
    const p2 = httpMock.expectOne(`${base}/protected/2`);
    p1.flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });
    p2.flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });

    const refreshReqs = httpMock.match(`${base}/auth/refresh`);
    expect(refreshReqs.length).toBe(1);
    expect(refreshReqs[0].request.body).toEqual({ refresh_token: 'old-refresh' });
    refreshReqs[0].flush({ access_token: 'new-access', refresh_token: 'new-refresh', token_type: 'bearer' });

    const r1 = httpMock.expectOne(`${base}/protected/1`);
    const r2 = httpMock.expectOne(`${base}/protected/2`);
    expect(r1.request.headers.get('Authorization')).toBe('Bearer new-access');
    expect(r2.request.headers.get('Authorization')).toBe('Bearer new-access');
    r1.flush({ ok: 1 });
    r2.flush({ ok: 2 });

    expect(v1).toEqual({ ok: 1 });
    expect(v2).toEqual({ ok: 2 });
    expect(storage.getAccessToken()).toBe('new-access');
    expect(storage.getRefreshToken()).toBe('new-refresh');
  });

  it('failed refresh rejects and clears session', () => {
    seedSession('old-access', 'bad-refresh');
    let errStatus = 0;
    http.get(`${base}/protected`).subscribe({ error: (e) => (errStatus = e.status) });

    httpMock.expectOne(`${base}/protected`).flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${base}/auth/refresh`).flush({ detail: 'Invalid refresh token' }, { status: 401, statusText: 'Unauthorized' });

    expect(errStatus).toBe(401);
    expect(storage.load()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
  });

  it('does not infinitely retry after refresh: retried request 401 is returned', () => {
    seedSession('a1', 'r1');
    let errStatus = 0;
    http.get(`${base}/protected`).subscribe({ error: (e) => (errStatus = e.status) });
    httpMock.expectOne(`${base}/protected`).flush({ detail: 'expired' }, { status: 401, statusText: 'Unauthorized' });
    httpMock.expectOne(`${base}/auth/refresh`).flush({ access_token: 'a2', refresh_token: 'r2', token_type: 'bearer' });
    httpMock.expectOne(`${base}/protected`).flush({ detail: 'still unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    expect(errStatus).toBe(401);
  });

  it('logout calls backend, clears session, and clears even on network failure', () => {
    seedSession('a1', 'r1');
    service.logout(true).subscribe();
    const req = httpMock.expectOne(`${base}/auth/logout`);
    expect(req.request.body).toEqual({ refresh_token: 'r1' });
    req.error(new ProgressEvent('network'));
    expect(storage.load()).toBeNull();
    expect(service.isAuthenticated()).toBeFalse();
    expect(router.navigate).toHaveBeenCalled();
  });

  it('does not attach bearer token to public/auth endpoints', () => {
    seedSession('a1', 'r1');
    service.login({ identifier: 'x', password: 'p' }).subscribe();
    const req = httpMock.expectOne(`${base}/auth/login`);
    expect(req.request.headers.has('Authorization')).toBeFalse();
    req.flush({ access_token: 'a2', refresh_token: 'r2', token_type: 'bearer', user: { id: '1', email: 'x@x.com', is_active: true, created_at: '2026-01-01T00:00:00Z', roles: [] } });
  });

  it('403 on protected request does not trigger refresh', () => {
    seedSession('a1', 'r1');
    let errStatus = 0;
    http.get(`${base}/admin/users`).subscribe({ error: (e) => (errStatus = e.status) });
    httpMock.expectOne(`${base}/admin/users`).flush({ detail: 'forbidden' }, { status: 403, statusText: 'Forbidden' });
    httpMock.expectNone(`${base}/auth/refresh`);
    expect(errStatus).toBe(403);
    expect(storage.getAccessToken()).toBe('a1');
  });

  it('protected request with valid token gets bearer and succeeds', () => {
    seedSession('valid-access', 'r1');
    let ok: any;
    http.get(`${base}/auth/me`).subscribe(v => (ok = v));
    const req = httpMock.expectOne(`${base}/auth/me`);
    expect(req.request.headers.get('Authorization')).toBe('Bearer valid-access');
    req.flush({ id: '1', email: 'u@e.com', is_active: true, created_at: '2026-01-01T00:00:00Z', roles: [] });
    expect(ok.email).toBe('u@e.com');
  });
});
