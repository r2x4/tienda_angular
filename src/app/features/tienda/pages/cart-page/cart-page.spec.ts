import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { provideRouter } from '@angular/router';
import { CartPageComponent } from './cart-page';
import { CartService } from '../../services/cart.service';
import { AuthSessionService } from '../../../../core/auth/services/auth-session.service';

describe('CartPageComponent', () => {
  let component: CartPageComponent;
  let fixture: ComponentFixture<CartPageComponent>;
  let cartServiceMock: any;
  let authMock: any;

  const item = { id: 'p1', itemId: 'i1', name: 'Prod', price: 1000, price_cop: '1000', imageUrl: 'assets/ropa_ropaDeportiva.jpg', quantity: 2, stock: 5, stock_quantity: 5, is_active: true, slug: 'prod', line_total_cop: '2000' };

  beforeEach(async () => {
    cartServiceMock = {
      cartItems: signal<any[]>([]),
      loading: signal(false),
      error: signal(''),
      legacyTransitionMessage: signal(''),
      getTotal: jasmine.createSpy('getTotal').and.returnValue(0),
      loadCart: jasmine.createSpy('loadCart').and.returnValue(of(null)),
      removeFromCart: jasmine.createSpy('removeFromCart').and.returnValue(of(null)),
      clearCart: jasmine.createSpy('clearCart').and.returnValue(of(null)),
      updateQuantity: jasmine.createSpy('updateQuantity').and.returnValue(of(null)),
      checkout: jasmine.createSpy('checkout').and.returnValue(of({ order: { id: '1', order_number: 'ORD-1', status: 'created', total: '1000', currency: 'COP', subtotal: '1000', created_at: '', user_id: null, items: [] } })),
      getCheckoutIdempotencyKey: jasmine.createSpy('getCheckoutIdempotencyKey').and.returnValue('key-1'),
      getMyOrders: jasmine.createSpy('getMyOrders').and.returnValue(of([])),
      getGuestOrder: jasmine.createSpy('getGuestOrder').and.returnValue(of({ id: 'g1', order_number: 'ORD-G', status: 'created', total: '1000', currency: 'COP', subtotal: '1000', created_at: '', user_id: null, items: [] })),
      getSavedGuestOrderToken: jasmine.createSpy('getSavedGuestOrderToken').and.returnValue(null),
    };
    authMock = { isAuthenticated: jasmine.createSpy('isAuthenticated').and.returnValue(false) };

    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [provideRouter([]), { provide: CartService, useValue: cartServiceMock }, { provide: AuthSessionService, useValue: authMock }],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and load cart', () => {
    expect(component).toBeTruthy();
    expect(cartServiceMock.loadCart).toHaveBeenCalled();
  });

  it('shows empty state', () => {
    expect(fixture.nativeElement.textContent).toContain('Tu carrito está vacío');
  });

  it('shows cart items and total', () => {
    cartServiceMock.cartItems.set([item]);
    cartServiceMock.getTotal.and.returnValue(2000);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Prod');
    expect(component.total()).toBe(2000);
  });

  it('updates quantity and removes item', () => {
    cartServiceMock.cartItems.set([item]);
    fixture.detectChanges();
    component.updateQuantity('p1', 3);
    expect(cartServiceMock.updateQuantity).toHaveBeenCalledWith('p1', 3);
    component.removeFromCart('p1');
    expect(cartServiceMock.removeFromCart).toHaveBeenCalledWith('p1');
  });

  it('clears cart', () => {
    component.clearCart();
    expect(cartServiceMock.clearCart).toHaveBeenCalled();
  });

  it('shows loading and error states', () => {
    cartServiceMock.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.skeleton')).toBeTruthy();
    cartServiceMock.loading.set(false);
    cartServiceMock.error.set('Fallo');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Fallo');
  });

  it('validates checkout required fields', () => {
    cartServiceMock.cartItems.set([item]);
    component.checkout();
    expect(component.checkoutError()).toContain('Completa nombre, email y dirección');
    expect(cartServiceMock.checkout).not.toHaveBeenCalled();
  });

  it('confirms checkout and shows confirmation', () => {
    cartServiceMock.cartItems.set([item]);
    component.buyer = { full_name: 'A', email: 'a@a.com', phone: '', address: 'Dir' };
    component.checkout();
    expect(cartServiceMock.checkout).toHaveBeenCalled();
    expect(component.checkoutSuccess()?.order_number).toBe('ORD-1');
  });

  it('looks up guest order', () => {
    component.guestOrderLookupId.set('g1');
    component.guestOrderLookupToken.set('tok');
    component.lookupGuestOrder();
    expect(cartServiceMock.getGuestOrder).toHaveBeenCalledWith('g1', 'tok');
    expect(component.guestLookupOrder()?.order_number).toBe('ORD-G');
  });

  it('loads authenticated order history', () => {
    authMock.isAuthenticated.and.returnValue(true);
    cartServiceMock.getMyOrders.and.returnValue(of([{ id: 'o1', order_number: 'ORD-1', status: 'created', total: '1000', currency: 'COP', subtotal: '1000', created_at: '', user_id: 'u1', items: [] }]));
    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    expect(cartServiceMock.getMyOrders).toHaveBeenCalled();
    expect(component.myOrders().length).toBe(1);
  });
});
