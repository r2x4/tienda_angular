import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { AdminUsersApiService } from './admin-users-api.service';

describe('AdminUsersApiService', () => {
  let service: AdminUsersApiService; let httpMock: HttpTestingController;
  const base = 'http://localhost:8000/admin/users';
  beforeEach(() => { TestBed.configureTestingModule({ providers:[provideHttpClient(), provideHttpClientTesting(), AdminUsersApiService] }); service = TestBed.inject(AdminUsersApiService); httpMock = TestBed.inject(HttpTestingController); });
  afterEach(() => httpMock.verify());

  it('lists users with supported filters and pagination', () => {
    service.list({ skip:10, limit:20, is_active:true, role:'ADMIN', q:'ana' }).subscribe(r => expect(r.total).toBe(1));
    const req = httpMock.expectOne(r => r.url === base);
    expect(req.request.params.get('skip')).toBe('10');
    expect(req.request.params.get('limit')).toBe('20');
    expect(req.request.params.get('is_active')).toBe('true');
    expect(req.request.params.get('role')).toBe('ADMIN');
    expect(req.request.params.get('q')).toBe('ana');
    req.flush({ items: [], total: 1, skip: 10, limit: 20 });
  });

  it('gets user, activates, deactivates and replaces roles with contract payload', () => {
    service.getById('u1').subscribe(r => expect(r.id).toBe('u1'));
    httpMock.expectOne(`${base}/u1`).flush({ id:'u1', email:'a@a.com', is_active:true, created_at:'', updated_at:'', roles:[] });

    service.activate('u1').subscribe(r => expect(r.is_active).toBeTrue());
    const a = httpMock.expectOne(`${base}/u1/activate`); expect(a.request.method).toBe('PATCH'); expect(a.request.body).toEqual({}); a.flush({ id:'u1', is_active:true });

    service.deactivate('u1').subscribe(r => expect(r.is_active).toBeFalse());
    const d = httpMock.expectOne(`${base}/u1/deactivate`); expect(d.request.method).toBe('PATCH'); expect(d.request.body).toEqual({}); d.flush({ id:'u1', is_active:false });

    service.replaceRoles('u1', { roles:['ADMIN','USER'] }).subscribe();
    const r = httpMock.expectOne(`${base}/u1/roles`); expect(r.request.method).toBe('PUT'); expect(r.request.body).toEqual({ roles:['ADMIN','USER'] }); r.flush({ id:'u1' });
  });

  it('lists roles and handles 401/403/404/409/422', () => {
    service.listRoles().subscribe(rs => expect(rs.length).toBe(1));
    httpMock.expectOne('http://localhost:8000/admin/roles').flush([{id:'r1',code:'ADMIN',name:'Admin'}]);

    [401,403,404,409,422].forEach(status => {
      let err: any; service.deactivate('u1').subscribe({ error:e => err=e });
      httpMock.expectOne(`${base}/u1/deactivate`).flush({detail:'e'}, {status, statusText:'E'}); expect(err.status).toBe(status);
    });
  });
});
