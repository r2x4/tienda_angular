import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminMediaApiService } from './admin-media-api.service';

describe('AdminMediaApiService', () => {
  let service: AdminMediaApiService; let httpMock: HttpTestingController;
  beforeEach(() => { TestBed.configureTestingModule({ providers:[provideHttpClient(), provideHttpClientTesting(), AdminMediaApiService] }); service = TestBed.inject(AdminMediaApiService); httpMock = TestBed.inject(HttpTestingController); });
  afterEach(() => httpMock.verify());

  it('uploads image as multipart/form-data file', () => {
    const file = new File(['x'], 'a.png', { type:'image/png' });
    service.uploadImage(file).subscribe(r => expect(r.url).toBe('/media/images/a.png'));
    const req = httpMock.expectOne('http://localhost:8000/admin/media/images');
    expect(req.request.method).toBe('POST');
    expect(req.request.body instanceof FormData).toBeTrue();
    expect((req.request.body as FormData).get('file')).toEqual(file);
    req.flush({ url:'/media/images/a.png', filename:'a.png', content_type:'image/png', size_bytes:1 });
  });

  it('handles 401/403/422', () => {
    [401,403,422].forEach(status => {
      let err: any; service.uploadImage(new File(['x'],'a.webp',{type:'image/webp'})).subscribe({ error:e=>err=e });
      httpMock.expectOne('http://localhost:8000/admin/media/images').flush({detail:'e'}, {status, statusText:'E'});
      expect(err.status).toBe(status);
    });
  });
});
