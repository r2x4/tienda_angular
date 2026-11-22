import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { CartPageComponent } from './cart-page';
import { CartService } from '../../services/cart.service';
import { AuthSessionService } from '../../../../core/auth/services/auth-session.service';

describe('CartPageComponent', () => {
  let component: CartPageComponent;
  let fixture: ComponentFixture<CartPageComponent>;
  let cartServiceMock: any;

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
      checkout: jasmine.createSpy('checkout').and.returnValue(of({ order: { id:'1', order_number:'ORD-1', status:'created', total:'0', currency:'COP', subtotal:'0', created_at:'', user_id:null, items:[] } })),
      getMyOrders: jasmine.createSpy('getMyOrders').and.returnValue(of([])),
      getGuestOrder: jasmine.createSpy('getGuestOrder').and.returnValue(of(null)),
      getSavedGuestOrderToken: jasmine.createSpy('getSavedGuestOrderToken').and.returnValue(null),
    };

    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [
        { provide: CartService, useValue: cartServiceMock },
        { provide: AuthSessionService, useValue: { isAuthenticated: () => false } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CartPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should expose cart total from the cart service', () => {
    cartServiceMock.getTotal.and.returnValue(120);
    expect(component.total()).toBe(120);
    expect(cartServiceMock.getTotal).toHaveBeenCalled();
  });
});
