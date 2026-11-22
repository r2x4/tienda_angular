import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminOrdersApiService } from './admin-orders-api.service';

describe('AdminOrdersApiService', () => {
  let service: AdminOrdersApiService; let httpMock: HttpTestingController;
  const base = 'http://localhost:8000/admin/orders';
  beforeEach(() => { TestBed.configureTestingModule({ providers:[provideHttpClient(), provideHttpClientTesting(), AdminOrdersApiService] }); service = TestBed.inject(AdminOrdersApiService); httpMock = TestBed.inject(HttpTestingController); });
  afterEach(() => httpMock.verify());

  it('lists and gets order by UUID', () => {
    service.list().subscribe(r => expect(r.length).toBe(1));
    const l = httpMock.expectOne(base); expect(l.request.method).toBe('GET'); l.flush([{ id:'o1' }]);
    service.getById('o1').subscribe(r => expect(r.id).toBe('o1'));
    const d = httpMock.expectOne(`${base}/o1`); expect(d.request.method).toBe('GET'); d.flush({ id:'o1' });
  });

  it('handles 401/403/404/422', () => {
    [401,403,404,422].forEach(status => {
      let err: any; service.getById('o1').subscribe({ error: e => err = e });
      httpMock.expectOne(`${base}/o1`).flush({detail:'e'}, {status, statusText:'E'}); expect(err.status).toBe(status);
    });
  });
});
