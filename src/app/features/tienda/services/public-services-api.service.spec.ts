import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { PublicServicesApiService } from './public-services-api.service';

describe('PublicServicesApiService', () => {
  let service: PublicServicesApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), PublicServicesApiService] });
    service = TestBed.inject(PublicServicesApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('lists services with skip/limit params', () => {
    service.list({ skip: 10, limit: 20 }).subscribe(r => expect(r.total).toBe(1));
    const req = httpMock.expectOne(r => r.url === 'http://localhost:8000/services');
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('skip')).toBe('10');
    expect(req.request.params.get('limit')).toBe('20');
    req.flush({ items: [], total: 1, skip: 10, limit: 20 });
  });

  it('gets service by UUID', () => {
    const id = '11111111-1111-4111-8111-111111111111';
    service.getById(id).subscribe(r => expect(r.id).toBe(id));
    const req = httpMock.expectOne(`http://localhost:8000/services/${id}`);
    expect(req.request.method).toBe('GET');
    req.flush({ id, name:'S', slug:'s', description:null, price_cop:'1000', duration_minutes:null, image_url:null, is_active:true, created_at:'', updated_at:'' });
  });

  it('handles 422/404/500 errors', () => {
    const statuses = [422,404,500];
    statuses.forEach(status => {
      let err: any;
      service.list().subscribe({ error: e => err = e });
      httpMock.expectOne('http://localhost:8000/services').flush({ detail: 'e' }, { status, statusText: 'E' });
      expect(err.status).toBe(status);
    });
  });
});
