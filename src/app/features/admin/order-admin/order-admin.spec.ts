import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { OrderAdminComponent } from './order-admin';
import { AdminOrdersApiService } from '../services/admin-orders-api.service';

describe('OrderAdminComponent', () => {
  let api: jasmine.SpyObj<AdminOrdersApiService>;
  const order = { id:'o1', order_number:'ORD-1', user_id:null, status:'created', currency:'COP', subtotal:'1000', total:'1000', created_at:'2026-01-01T00:00:00Z', items:[{id:'i1',product_id:'p1',product_name:'P',product_slug:'p',unit_price_cop:'1000',quantity:1,line_total_cop:'1000'}] } as any;

  beforeEach(async () => {
    api = jasmine.createSpyObj('AdminOrdersApiService', ['list','getById']);
    api.list.and.returnValue(of([order]));
    api.getById.and.returnValue(of(order));
    await TestBed.configureTestingModule({ imports:[OrderAdminComponent], providers:[{provide:AdminOrdersApiService, useValue:api}] }).compileComponents();
  });

  it('loads orders on init', () => {
    const fixture = TestBed.createComponent(OrderAdminComponent);
    fixture.detectChanges();
    expect(api.list).toHaveBeenCalled();
    expect(fixture.componentInstance.orders().length).toBe(1);
  });

  it('opens detail', () => {
    const c = TestBed.createComponent(OrderAdminComponent).componentInstance;
    c.viewDetail(order);
    expect(api.getById).toHaveBeenCalledWith('o1');
    expect(c.selected()?.id).toBe('o1');
  });

  it('handles list error and retry state', () => {
    api.list.and.returnValue(throwError(() => ({ status:500, message:'err' })));
    const fixture = TestBed.createComponent(OrderAdminComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.error()).toContain('err');
  });

  it('handles empty state', () => {
    api.list.and.returnValue(of([]));
    const fixture = TestBed.createComponent(OrderAdminComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance.orders().length).toBe(0);
  });

  it('retries loading orders', () => {
    api.list.and.returnValue(throwError(() => ({ status: 500, message: 'err' })));
    const fixture = TestBed.createComponent(OrderAdminComponent);
    fixture.detectChanges();
    api.list.and.returnValue(of([order]));
    fixture.componentInstance.load();
    expect(api.list).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.orders().length).toBe(1);
  });

  it('prevents duplicate detail requests while loading', () => {
    const pending = new Subject<any>();
    api.getById.and.returnValue(pending.asObservable());
    const c = TestBed.createComponent(OrderAdminComponent).componentInstance;
    c.viewDetail(order);
    c.viewDetail(order);
    expect(api.getById).toHaveBeenCalledTimes(1);
    pending.next(order); pending.complete();
  });
});
