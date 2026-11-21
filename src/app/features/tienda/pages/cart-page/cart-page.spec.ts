import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { CartPageComponent } from './cart-page';
import { CartService } from '../../services/cart.service';
import { Product } from '../../interfaces/product.interface';

describe('CartPageComponent', () => {
  let component: CartPageComponent;
  let fixture: ComponentFixture<CartPageComponent>;
  let cartServiceMock: {
    cartItems: ReturnType<typeof signal<Product[]>>;
    getTotal: jasmine.Spy;
    removeFromCart: jasmine.Spy;
    clearCart: jasmine.Spy;
    processPurchase: jasmine.Spy;
  };

  beforeEach(async () => {
    cartServiceMock = {
      cartItems: signal<Product[]>([]),
      getTotal: jasmine.createSpy('getTotal').and.returnValue(0),
      removeFromCart: jasmine.createSpy('removeFromCart'),
      clearCart: jasmine.createSpy('clearCart'),
      processPurchase: jasmine.createSpy('processPurchase').and.resolveTo(),
    };

    await TestBed.configureTestingModule({
      imports: [CartPageComponent],
      providers: [{ provide: CartService, useValue: cartServiceMock }],
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
