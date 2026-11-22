import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { UserAdminComponent } from './user-admin';
import { AdminUsersApiService } from '../services/admin-users-api.service';

describe('UserAdminComponent', () => {
  let api: jasmine.SpyObj<AdminUsersApiService>;
  const role = { id:'r1', code:'ADMIN', name:'Admin' } as any;
  const user = { id:'u1', email:'a@a.com', username:'a', first_name:'A', last_name:'B', phone:null, city:null, is_active:true, created_at:'', updated_at:'', roles:[role] } as any;

  beforeEach(async () => {
    api = jasmine.createSpyObj('AdminUsersApiService', ['list','getById','activate','deactivate','listRoles','replaceRoles']);
    api.list.and.returnValue(of({ items:[user], total:1, skip:0, limit:20 }));
    api.listRoles.and.returnValue(of([role, {id:'r2',code:'USER',name:'User'}]));
    api.replaceRoles.and.returnValue(of({ ...user, roles:[role, {id:'r2',code:'USER',name:'User'}] }));
    api.deactivate.and.returnValue(of({ ...user, is_active:false }));
    api.activate.and.returnValue(of({ ...user, is_active:true }));
    spyOn(window, 'confirm').and.returnValue(true);
    await TestBed.configureTestingModule({ imports:[UserAdminComponent], providers:[{provide:AdminUsersApiService, useValue:api}] }).compileComponents();
  });

  it('loads users and roles', () => {
    const fixture = TestBed.createComponent(UserAdminComponent);
    fixture.detectChanges();
    expect(api.list).toHaveBeenCalled();
    expect(api.listRoles).toHaveBeenCalled();
  });

  it('searches with filters and resets skip', () => {
    const c = TestBed.createComponent(UserAdminComponent).componentInstance;
    c.q='ana'; c.role='ADMIN'; c.is_active='true'; c.skip=20;
    c.search();
    expect(api.list).toHaveBeenCalledWith(jasmine.objectContaining({ skip:0, q:'ana', role:'ADMIN', is_active:true }));
  });

  it('selects user and replaces roles with contract payload', () => {
    const c = TestBed.createComponent(UserAdminComponent).componentInstance;
    c.select(user);
    c.toggleRole('USER', true);
    c.saveRoles();
    expect(api.replaceRoles).toHaveBeenCalledWith('u1', { roles: jasmine.arrayContaining(['ADMIN','USER']) });
  });

  it('handles 409 on deactivate as backend protection', () => {
    api.deactivate.and.returnValue(throwError(() => ({ status:409, message:'last admin' })));
    const c = TestBed.createComponent(UserAdminComponent).componentInstance;
    c.toggleActive(user);
    expect(c.error()).toContain('last admin');
    expect(c.success()).toBe('');
  });

  it('prevents duplicate save while request in progress', () => {
    const pending = new Subject<any>();
    api.replaceRoles.and.returnValue(pending.asObservable());
    const c = TestBed.createComponent(UserAdminComponent).componentInstance;
    c.select(user); c.toggleRole('USER', true);
    c.saveRoles(); c.saveRoles();
    expect(api.replaceRoles).toHaveBeenCalledTimes(1);
    pending.next(user); pending.complete();
  });
});
