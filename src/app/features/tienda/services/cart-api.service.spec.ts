import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { CartApiService } from './cart-api.service';
import { CartTokenStorageService } from '../../../core/auth/services/cart-token-storage.service';

describe('CartApiService', () => {
  let service: CartApiService;
  let httpMock: HttpTestingController;
  let tokenStorage: CartTokenStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), CartApiService, CartTokenStorageService],
    });
    service = TestBed.inject(CartApiService);
    httpMock = TestBed.inject(HttpTestingController);
    tokenStorage = TestBed.inject(CartTokenStorageService);
  });

  afterEach(() => httpMock.verify());

  const cart = { id:'c1', user_id:null, guest_cart_token:'g1', items:[], subtotal_cop:'0', total_cop:'0', currency:'COP', created_at:'', updated_at:'' };

  it('should send X-Cart-Token for guest cart and persist returned token', () => {
    tokenStorage.setGuestCartToken('g-old');
    service.getCart().subscribe((res) => expect(res.guest_cart_token).toBe('g1'));
    const req = httpMock.expectOne('http://localhost:8000/cart');
    expect(req.request.headers.get('X-Cart-Token')).toBe('g-old');
    req.flush(cart);
    expect(tokenStorage.getGuestCartToken()).toBe('g1');
  });

  it('should add, update, remove and clear cart items using backend contract', () => {
    service.addItem({ product_id: '11111111-1111-4111-8111-111111111111', quantity: 1 }, 'g1').subscribe();
    httpMock.expectOne('http://localhost:8000/cart/items').flush(cart);

    service.updateItem('11111111-1111-4111-8111-111111111111', { quantity: 2 }, 'g1').subscribe();
    const patch = httpMock.expectOne('http://localhost:8000/cart/items/11111111-1111-4111-8111-111111111111');
    expect(patch.request.method).toBe('PATCH');
    patch.flush(cart);

    service.removeItem('11111111-1111-4111-8111-111111111111', 'g1').subscribe();
    httpMock.expectOne('http://localhost:8000/cart/items/11111111-1111-4111-8111-111111111111').flush(cart);

    service.clearCart('g1').subscribe();
    const del = httpMock.expectOne('http://localhost:8000/cart');
    expect(del.request.method).toBe('DELETE');
    del.flush(cart);
  });

  it('should propagate HTTP errors', () => {
    let err: any;
    service.getCart().subscribe({ error: (e) => err = e });
    httpMock.expectOne('http://localhost:8000/cart').flush({ detail: 'fail' }, { status: 500, statusText: 'Server Error' });
    expect(err.status).toBe(500);
  });
});
