import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { OrdersApiService } from './orders-api.service';

describe('OrdersApiService', () => {
  let service: OrdersApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting(), OrdersApiService] });
    service = TestBed.inject(OrdersApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });
  afterEach(() => httpMock.verify());

  it('checkout sends X-Cart-Token and Idempotency-Key and stores guest order token', () => {
    const payload = { buyer: { full_name:'A', email:'a@a.com', address:'Addr 1' }, idempotency_key:'chk-1' };
    let resp: any;
    service.checkout(payload, 'guest-cart', 'chk-1').subscribe(r => resp = r);
    const req = httpMock.expectOne('http://localhost:8000/orders/checkout');
    expect(req.request.method).toBe('POST');
    expect(req.request.headers.get('X-Cart-Token')).toBe('guest-cart');
    expect(req.request.headers.get('Idempotency-Key')).toBe('chk-1');
    req.flush({ order: { id:'o1', order_number:'ORD-1', user_id:null, status:'created', currency:'COP', subtotal:'10', total:'10', created_at:'', items:[] }, guest_order_access_token:'gat-1' });
    service.saveGuestOrderAccessToken(resp.order.id, resp.guest_order_access_token);
    expect(service.getGuestOrderAccessToken('o1')).toBe('gat-1');
  });

  it('gets authenticated order history and detail', () => {
    service.getMyOrders().subscribe(r => expect(r.length).toBe(1));
    httpMock.expectOne('http://localhost:8000/orders/my').flush([{ id:'o1', order_number:'ORD-1', user_id:'u1', status:'created', currency:'COP', subtotal:'10', total:'10', created_at:'', items:[] }]);
    service.getMyOrder('o1').subscribe(r => expect(r.id).toBe('o1'));
    httpMock.expectOne('http://localhost:8000/orders/my/o1').flush({ id:'o1', order_number:'ORD-1', user_id:'u1', status:'created', currency:'COP', subtotal:'10', total:'10', created_at:'', items:[] });
  });

  it('gets guest order with X-Order-Access-Token and handles HTTP error', () => {
    service.getGuestOrder('o1', 'tok').subscribe(r => expect(r.id).toBe('o1'));
    const req = httpMock.expectOne('http://localhost:8000/orders/guest/o1');
    expect(req.request.headers.get('X-Order-Access-Token')).toBe('tok');
    req.flush({ id:'o1', order_number:'ORD-1', user_id:null, status:'created', currency:'COP', subtotal:'10', total:'10', created_at:'', items:[] });

    let err: any;
    service.getGuestOrder('o2', 'bad').subscribe({ error: e => err = e });
    httpMock.expectOne('http://localhost:8000/orders/guest/o2').flush({ detail: 'no' }, { status: 404, statusText: 'Not Found' });
    expect(err.status).toBe(404);
  });
});
