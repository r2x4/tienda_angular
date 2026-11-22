import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ServiceCrudComponent } from './service-crud';
import { AdminServicesApiService } from '../services/admin-services-api.service';
import { ServiceRead } from '../../tienda/models/service.models';

function svc(overrides: Partial<ServiceRead> = {}): ServiceRead {
  return { id: 's1', name: 'Svc', slug: 'svc', description: null, price_cop: '1000', duration_minutes: 30, image_url: null, is_active: true, created_at: '', updated_at: '', ...overrides };
}

describe('ServiceCrudComponent', () => {
  let api: jasmine.SpyObj<AdminServicesApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AdminServicesApiService>('AdminServicesApiService', ['list','create','update','activate','deactivate','getById']);
    api.list.and.returnValue(of({ items: [svc()], total: 1, skip: 0, limit: 100 } as any));
    await TestBed.configureTestingModule({ imports: [ServiceCrudComponent], providers: [{ provide: AdminServicesApiService, useValue: api }] }).compileComponents();
  });

  it('loads services from backend', () => {
    const fixture = TestBed.createComponent(ServiceCrudComponent);
    fixture.detectChanges();
    expect(api.list).toHaveBeenCalled();
    expect(fixture.componentInstance.services().length).toBe(1);
  });

  it('creates service and reloads list', () => {
    api.create.and.returnValue(of(svc({ id: 's2' })));
    const fixture = TestBed.createComponent(ServiceCrudComponent);
    const c = fixture.componentInstance;
    c.currentService.set({ name:'A', slug:'a', description:'', price_cop:'1000', duration_minutes:'', image_url:'', is_active:true });
    c.save();
    expect(api.create).toHaveBeenCalledWith(jasmine.objectContaining({ name:'A', slug:'a', price_cop:'1000', duration_minutes:null, image_url:null, is_active:true }));
    expect(api.list).toHaveBeenCalled();
    expect(c.success()).toContain('creado');
  });

  it('edits service via PATCH keeping form contract', () => {
    api.update.and.returnValue(of(svc({ name: 'N' })));
    const fixture = TestBed.createComponent(ServiceCrudComponent);
    const c = fixture.componentInstance;
    c.currentService.set({ id:'s1', name:'N', slug:'n', description:'d', price_cop:'2000', duration_minutes:'15', image_url:'http://img', is_active:false });
    c.save();
    expect(api.update).toHaveBeenCalledWith('s1', jasmine.objectContaining({ name:'N', slug:'n', description:'d', price_cop:'2000', duration_minutes:15, image_url:'http://img', is_active:false }));
  });

  it('activates and deactivates service', () => {
    api.activate.and.returnValue(of(svc({ is_active: true })));
    api.deactivate.and.returnValue(of(svc({ is_active: false })));
    const c = TestBed.createComponent(ServiceCrudComponent).componentInstance;
    c.toggleActive(svc({ is_active: false }));
    expect(api.activate).toHaveBeenCalledWith('s1');
    c.toggleActive(svc({ is_active: true }));
    expect(api.deactivate).toHaveBeenCalledWith('s1');
  });

  it('handles 401/403/422 on save without clearing form', () => {
    [401,403,422].forEach(status => {
      api.update.calls.reset();
      api.update.and.returnValue(throwError(() => ({ status, message: `e${status}` })));
      const c = TestBed.createComponent(ServiceCrudComponent).componentInstance;
      c.currentService.set({ id:'s1', name:'N', slug:'n', description:'', price_cop:'1000', duration_minutes:'', image_url:'', is_active:true });
      c.save();
      expect(c.error()).toContain(`e${status}`);
      expect(c.currentService().id).toBe('s1');
      expect(c.currentService().name).toBe('N');
    });
  });

  it('prevents duplicate save while request in progress', () => {
    const pending = new Subject<ServiceRead>();
    api.create.and.returnValue(pending.asObservable());
    const c = TestBed.createComponent(ServiceCrudComponent).componentInstance;
    c.currentService.set({ name:'A', slug:'a', description:'', price_cop:'1000', duration_minutes:'', image_url:'', is_active:true });
    c.save();
    c.save();
    expect(api.create).toHaveBeenCalledTimes(1);
    expect(c.saving()).toBeTrue();
    pending.next(svc({ id: 's2' })); pending.complete();
    expect(c.saving()).toBeFalse();
  });

  it('handles load error', () => {
    api.list.and.returnValue(throwError(() => ({ status: 500, message: 'err' })));
    const fixture = TestBed.createComponent(ServiceCrudComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toContain('err');
  });
});
