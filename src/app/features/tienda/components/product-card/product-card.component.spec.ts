import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { ProductCardComponent } from './product-card.component';
import { CartService } from '../../services/cart.service';
import { CatalogDisplayProduct } from '../../models/catalog-view.models';

describe('ProductCardComponent', () => {
  let cartService: jasmine.SpyObj<CartService>;
  const product: CatalogDisplayProduct = {
    id: '11111111-1111-4111-8111-111111111111', category_id: 'c1', name: 'Producto Demo', slug: 'producto-demo', description: 'Desc',
    price_cop: '10000', stock_quantity: 3, is_active: true, created_at: '', updated_at: '', category: { id: 'c1', name: 'Calzado', slug: 'calzado', is_active: true } as any,
    images: [], price: 10000, imageUrl: 'assets/ropa_ropaDeportiva.jpg', stock: 3, colors: [], categorySlug: 'calzado'
  } as any;

  async function setup(p = product) {
    await TestBed.configureTestingModule({ imports: [ProductCardComponent], providers: [provideRouter([]), { provide: CartService, useValue: cartService }] }).compileComponents();
    const fixture = TestBed.createComponent(ProductCardComponent);
    fixture.componentRef.setInput('product', p);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => { cartService = jasmine.createSpyObj<CartService>('CartService', ['addToCart']); cartService.addToCart.and.returnValue(of({} as any)); });

  it('navigates to product detail from image/name links', async () => {
    const fixture = await setup();
    const links = Array.from(fixture.nativeElement.querySelectorAll('a')) as HTMLAnchorElement[];
    expect(links.some(a => a.getAttribute('href')?.includes('/productos/11111111-1111-4111-8111-111111111111'))).toBeTrue();
  });

  it('add to cart remains independent and does not require navigation', async () => {
    const fixture = await setup();
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.w-full');
    button.click();
    fixture.detectChanges();
    expect(cartService.addToCart).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('añadido al carrito');
  });

  it('disables add to cart when unavailable', async () => {
    const fixture = await setup({ ...product, is_active: false, stock_quantity: 0, stock: 0 });
    const button: HTMLButtonElement = fixture.nativeElement.querySelector('button.w-full');
    expect(button.disabled).toBeTrue();
  });
});
