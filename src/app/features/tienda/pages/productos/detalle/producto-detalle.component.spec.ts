import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProductoDetalleComponent } from './producto-detalle.component';
import { ProductService } from '../../../services/product.service';
import { CartService } from '../../../services/cart.service';

describe('ProductoDetalleComponent', () => {
  let productService: jasmine.SpyObj<ProductService>;
  let cartService: jasmine.SpyObj<CartService>;

  const baseProduct = {
    id: '11111111-1111-4111-8111-111111111111',
    category_id: 'cat-1',
    name: 'Zapatilla Test',
    slug: 'zapatilla-test',
    description: 'Descripción completa',
    price_cop: '120000',
    stock_quantity: 5,
    is_active: true,
    created_at: '',
    updated_at: '',
    category: { id: 'cat-1', name: 'Calzado', slug: 'calzado', is_active: true },
    images: [
      { id: 'i1', product_id: 'p1', url: '/img1.webp', alt_text: 'img1', is_primary: true, sort_order: 0, created_at: '' },
      { id: 'i2', product_id: 'p1', url: '/img2.webp', alt_text: 'img2', is_primary: false, sort_order: 1, created_at: '' },
    ],
  } as any;

  async function setup(id = baseProduct.id) {
    await TestBed.configureTestingModule({
      imports: [ProductoDetalleComponent],
      providers: [
        provideRouter([]),
        { provide: ProductService, useValue: productService },
        { provide: CartService, useValue: cartService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id }) } } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(ProductoDetalleComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => {
    productService = jasmine.createSpyObj<ProductService>('ProductService', ['getProductById']);
    cartService = jasmine.createSpyObj<CartService>('CartService', ['addToCart']);
  });

  it('loads product and renders details', async () => {
    productService.getProductById.and.returnValue(of(baseProduct));
    const fixture = await setup();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Zapatilla Test');
    expect(text).toContain('Calzado');
    expect(text).toContain('Descripción completa');
    expect(fixture.componentInstance.notFound()).toBeFalse();
  });

  it('handles loading/error/retry', async () => {
    productService.getProductById.and.returnValue(throwError(() => ({ status: 500, message: 'fail' })));
    const fixture = await setup();
    expect(fixture.componentInstance.error()).toContain('fail');
    productService.getProductById.and.returnValue(of(baseProduct));
    fixture.componentInstance.load();
    fixture.detectChanges();
    expect(productService.getProductById.calls.count()).toBe(2);
    expect(fixture.nativeElement.textContent).toContain('Zapatilla Test');
  });

  it('marks 404 as not found', async () => {
    productService.getProductById.and.returnValue(throwError(() => ({ status: 404, message: 'not found' })));
    const fixture = await setup();
    expect(fixture.componentInstance.notFound()).toBeTrue();
  });

  it('marks inactive product as not available', async () => {
    productService.getProductById.and.returnValue(of({ ...baseProduct, is_active: false }));
    const fixture = await setup();
    expect(fixture.componentInstance.notFound()).toBeTrue();
  });

  it('handles product without images/description', async () => {
    productService.getProductById.and.returnValue(of({ ...baseProduct, description: null, images: [] }));
    const fixture = await setup();
    expect(fixture.nativeElement.textContent).toContain('no tiene descripción adicional');
    expect(fixture.componentInstance.activeImage()).toContain('assets/ropa_ropaDeportiva.jpg');
  });

  it('supports gallery selection with multiple images', async () => {
    productService.getProductById.and.returnValue(of(baseProduct));
    const fixture = await setup();
    expect(fixture.componentInstance.images().length).toBe(2);
    fixture.componentInstance.selectImage('/img2.webp');
    fixture.detectChanges();
    expect(fixture.componentInstance.activeImage()).toContain('/img2.webp');
  });

  it('adds to cart when product is available', async () => {
    cartService.addToCart.and.returnValue(of({} as any));
    productService.getProductById.and.returnValue(of(baseProduct));
    const fixture = await setup();
    fixture.componentInstance.addToCart();
    expect(cartService.addToCart).toHaveBeenCalled();
    fixture.detectChanges(); expect(fixture.componentInstance.feedback()?.type).toBe('success'); expect(fixture.componentInstance.feedback()?.text).toContain('añadido al carrito');
  });

  it('disables add to cart when unavailable', async () => {
    productService.getProductById.and.returnValue(of({ ...baseProduct, stock_quantity: 0, is_active: true }));
    const fixture = await setup();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button.w-full.min-h-12');
    expect(btn.disabled).toBeTrue();
  });
});


