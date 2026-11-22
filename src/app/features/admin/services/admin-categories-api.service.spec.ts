import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminCategoriesApiService } from './admin-categories-api.service';

describe('AdminCategoriesApiService', () => {
  let service: AdminCategoriesApiService;
  let httpMock: HttpTestingController;
  const base = 'http://localhost:8000/admin/catalog/categories';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), AdminCategoriesApiService] });
    service = TestBed.inject(AdminCategoriesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('updates category via PUT with contract payload', () => {
    const payload = { name: 'Cat', slug: 'cat', description: 'd', is_active: true };
    service.update('c1', payload).subscribe(r => expect(r.id).toBe('c1'));
    const req = httpMock.expectOne(`${base}/c1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(payload);
    req.flush({ id: 'c1', ...payload, created_at: '', updated_at: '' });
  });

  it('deactivates category', () => {
    service.deactivate('c1').subscribe(r => expect(r.is_active).toBeFalse());
    const req = httpMock.expectOne(`${base}/c1/deactivate`);
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body).toEqual({});
    req.flush({ id: 'c1', name:'C', slug:'c', description:null, is_active:false, created_at:'', updated_at:'' });
  });

  it('handles 401, 403, 422 and deactivation restriction errors', () => {
    [401, 403, 422, 409].forEach(status => {
      let err: any;
      service.deactivate('c1').subscribe({ error: e => err = e });
      httpMock.expectOne(`${base}/c1/deactivate`).flush({ detail: 'restricted' }, { status, statusText: 'E' });
      expect(err.status).toBe(status);
    });
  });
});
