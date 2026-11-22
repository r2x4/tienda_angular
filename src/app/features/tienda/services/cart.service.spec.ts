import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { CartService } from './cart.service';
import { CartApiService } from './cart-api.service';
import { OrdersApiService } from './orders-api.service';
import { CartTokenStorageService } from '../../../core/auth/services/cart-token-storage.service';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';

function cart(items: any[] = [], userId: string | null = null) {
  return { id:'c1', user_id:userId, guest_cart_token: userId ? null : 'g1', items, subtotal_cop:'0', total_cop:'0', currency:'COP', created_at:'', updated_at:'' };
}
function item(pid='11111111-1111-4111-8111-111111111111', qty=1, stock=5, active=true) {
  return { id:'i1', product_id:pid, quantity:qty, unit_price_cop:'10000', line_total_cop:String(10000*qty), created_at:'', updated_at:'', product:{ id:pid, name:'P', slug:'p', price_cop:'10000', is_active:active, stock_quantity:stock } };
}

describe('CartService (Fase 8)', () => {
  let service: CartService;
  let api: jasmine.SpyObj<CartApiService>;
  let orders: jasmine.SpyObj<OrdersApiService>;
  let tokenStorage: CartTokenStorageService;
  let isAuth = false;

  beforeEach(() => {
    localStorage.clear();
    api = jasmine.createSpyObj<CartApiService>('CartApiService', ['getCart','addItem','updateItem','removeItem','clearCart']);
    orders = jasmine.createSpyObj<OrdersApiService>('OrdersApiService', ['checkout','getMyOrders','getMyOrder','getGuestOrder','saveGuestOrderAccessToken','getGuestOrderAccessToken']);
    api.getCart.and.returnValue(of(cart()));
    api.addItem.and.returnValue(of(cart([item()])));
    api.updateItem.and.returnValue(of(cart([item('11111111-1111-4111-8111-111111111111',2)])));
    api.removeItem.and.returnValue(of(cart()));
    api.clearCart.and.returnValue(of(cart()));
    orders.getMyOrders.and.returnValue(of([]));
    orders.getGuestOrder.and.returnValue(of({ id:'o1', order_number:'ORD-1', user_id:null, status:'created', currency:'COP', subtotal:'10', total:'10', created_at:'', items:[] } as any));
    orders.getGuestOrderAccessToken.and.returnValue('gat');

    TestBed.configureTestingModule({ providers: [
      CartService,
      { provide: CartApiService, useValue: api },
      { provide: OrdersApiService, useValue: orders },
      CartTokenStorageService,
      { provide: AuthSessionService, useValue: { isAuthenticated: () => isAuth } },
    ]});
    tokenStorage = TestBed.inject(CartTokenStorageService);
    service = TestBed.inject(CartService);
  });

  it('loads guest cart and persists guest cart token', () => {
    expect(api.getCart).toHaveBeenCalled();
    expect(service.cart()?.guest_cart_token).toBe('g1');
  });

  it('loads authenticated cart without sending guest token', () => {
    isAuth = true;
    tokenStorage.setGuestCartToken('g1');
    service.loadCart().subscribe();
    expect(api.getCart).toHaveBeenCalledWith(null);
  });

  it('adds, updates quantity, removes and clears cart', (done) => {
    service.addToCart({ id: '11111111-1111-4111-8111-111111111111' }).subscribe(() => {
      expect(api.addItem).toHaveBeenCalled();
      service.updateQuantity('11111111-1111-4111-8111-111111111111', 2).subscribe(() => {
        expect(api.updateItem).toHaveBeenCalled();
        service.removeFromCart('11111111-1111-4111-8111-111111111111').subscribe(() => {
          expect(api.removeItem).toHaveBeenCalled();
          service.clearCart().subscribe(() => { expect(api.clearCart).toHaveBeenCalled(); done(); });
        });
      });
    });
  });

  it('rejects non-UUID product IDs', (done) => {
    service.addToCart({ id: 123 }).subscribe({ error: (e) => { expect(String(e.message || e)).toContain('identificador backend válido'); done(); } });
  });

  it('handles insufficient availability/HTTP error on add', (done) => {
    api.addItem.and.returnValue(throwError(() => ({ status: 409, message: 'Insufficient stock' })));
    service.addToCart({ id: '11111111-1111-4111-8111-111111111111' }).subscribe({ error: (e) => { expect(e).toBeTruthy(); expect(service.error()).toBeTruthy(); done(); } });
  });

  it('checkout success stores guest order token and refreshes cart', (done) => {
    orders.checkout.and.returnValue(of({ order: { id:'o1', order_number:'ORD-1', user_id:null, status:'created', currency:'COP', subtotal:'10', total:'10', created_at:'', items:[] }, guest_order_access_token:'gat-1' } as any));
    api.getCart.calls.reset(); api.getCart.and.returnValue(of(cart()));
    service.checkout({ full_name:'A', email:'a@a.com', address:'Addr' } as any).subscribe((res) => {
      expect(res.order.id).toBe('o1');
      expect(orders.saveGuestOrderAccessToken).toHaveBeenCalledWith('o1','gat-1');
      expect(api.getCart).toHaveBeenCalled();
      done();
    });
  });

  it('checkout inventory rejection keeps idempotency key for retry, new key for different operation', (done) => {
    const buyer = { full_name:'A', email:'a@a.com', address:'Addr', phone:null } as any;
    orders.checkout.and.returnValues(
      throwError(() => ({ status: 409, message: 'Insufficient stock' })),
      of({ order: { id:'o1', order_number:'ORD-1', user_id:null, status:'created', currency:'COP', subtotal:'10', total:'10', created_at:'', items:[] } } as any)
    );
    const key1 = service.getCheckoutIdempotencyKey(buyer);
    service.checkout(buyer, key1).subscribe({ error: () => {
      const keyRetry = service.getCheckoutIdempotencyKey(buyer);
      expect(keyRetry).toBe(key1);
      service.checkout(buyer, keyRetry).subscribe(() => {
        expect(orders.checkout.calls.argsFor(0)[2]).toBe(key1);
        expect(orders.checkout.calls.argsFor(1)[2]).toBe(key1);
        const keyNew = service.getCheckoutIdempotencyKey({ ...buyer, address:'Other address' } as any);
        expect(keyNew).not.toBe(key1);
        done();
      });
    }});
  });

  it('consults guest order and authenticated history', (done) => {
    service.getGuestOrder('o1','tok').subscribe(r => {
      expect(orders.getGuestOrder).toHaveBeenCalledWith('o1','tok');
      service.getMyOrders().subscribe(() => { expect(orders.getMyOrders).toHaveBeenCalled(); done(); });
    });
  });

  it('legacy cart with non-UUID IDs is backed up, not silently discarded', () => {
    localStorage.setItem('shopping_cart', JSON.stringify([{ id: 1, quantity: 1, name:'Legacy' }]));
    api.getCart.and.returnValue(of(cart()));
    service.loadCart().subscribe();
    expect(localStorage.getItem('shopping_cart')).toBeNull();
    expect(localStorage.getItem(tokenStorage.getLegacyBackupKey())).toContain('Legacy');
    expect(service.legacyTransitionMessage()).toContain('UUID compatible');
  });
});
