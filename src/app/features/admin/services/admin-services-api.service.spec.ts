import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminServicesApiService } from './admin-services-api.service';

describe('AdminServicesApiService', () => {
  let service: AdminServicesApiService;
  let httpMock: HttpTestingController;
  const base = 'http://localhost:8000/admin/services';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), AdminServicesApiService] });
    service = TestBed.inject(AdminServicesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('updates service via PATCH with contract payload', () => {
    const payload = { name: 'N', slug: 'n', description: null, price_cop: '1000', duration_minutes: 30, image_url: null, is_active: true };
    service.update('id-1', payload).subscribe(r => expect(r.id).toBe('id-1'));
    const req = httpMock.expectOne(`${base}/id-1`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'id-1', ...payload, created_at: '', updated_at: '' });
  });

  it('activates and deactivates service', () => {
    service.activate('id-1').subscribe(r => expect(r.is_active).toBeTrue());
    const a = httpMock.expectOne(`${base}/id-1/activate`);
    expect(a.request.method).toBe('PATCH');
    expect(a.request.body).toEqual({});
    a.flush({ id: 'id-1', is_active: true });

    service.deactivate('id-1').subscribe(r => expect(r.is_active).toBeFalse());
    const d = httpMock.expectOne(`${base}/id-1/deactivate`);
    expect(d.request.method).toBe('PATCH');
    expect(d.request.body).toEqual({});
    d.flush({ id: 'id-1', is_active: false });
  });

  it('handles 401, 403, 422 errors', () => {
    [401, 403, 422].forEach(status => {
      let err: any;
      service.list().subscribe({ error: e => err = e });
      httpMock.expectOne(r => r.url === base).flush({ detail: 'e' }, { status, statusText: 'E' });
      expect(err.status).toBe(status);
    });
  });
});
