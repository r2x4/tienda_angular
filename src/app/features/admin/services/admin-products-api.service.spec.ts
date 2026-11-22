import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminProductsApiService } from './admin-products-api.service';

describe('AdminProductsApiService', () => {
  let service: AdminProductsApiService; let httpMock: HttpTestingController;
  const base = 'http://localhost:8000/admin/catalog/products';
  beforeEach(() => { TestBed.configureTestingModule({ providers:[provideHttpClient(), provideHttpClientTesting(), AdminProductsApiService] }); service = TestBed.inject(AdminProductsApiService); httpMock = TestBed.inject(HttpTestingController); });
  afterEach(() => httpMock.verify());

  it('lists, creates, updates and deactivates with contract payloads', () => {
    service.list({ category_id:'c1' }).subscribe();
    const l = httpMock.expectOne(r => r.url===base); expect(l.request.params.get('category_id')).toBe('c1'); l.flush([]);

    const create = { category_id:'c1', name:'N', slug:'n', description:null, price_cop:'1000', stock_quantity:1, is_active:true, images:[{url:'/media/images/a.webp', alt_text:'a', is_primary:true, sort_order:0}] };
    service.create(create).subscribe(r => expect(r.id).toBe('p1'));
    const c = httpMock.expectOne(base); expect(c.request.method).toBe('POST'); expect(c.request.body).toEqual(create); c.flush({ id:'p1' });

    const update = { name:'N2', images: create.images };
    service.update('p1', update).subscribe();
    const u = httpMock.expectOne(`${base}/p1`); expect(u.request.method).toBe('PUT'); expect(u.request.body).toEqual(update); u.flush({ id:'p1' });

    service.deactivate('p1').subscribe();
    const d = httpMock.expectOne(`${base}/p1/deactivate`); expect(d.request.method).toBe('PATCH'); expect(d.request.body).toEqual({}); d.flush({ id:'p1', is_active:false });
  });

  it('handles 401/403/404/409/422', () => {
    [401,403,404,409,422].forEach(status => {
      let err: any; service.getById('p1').subscribe({ error: e => err = e });
      httpMock.expectOne(`${base}/p1`).flush({detail:'e'}, {status, statusText:'E'});
      expect(err.status).toBe(status);
    });
  });
});
