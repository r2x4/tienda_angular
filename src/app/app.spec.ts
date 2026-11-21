import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { AppComponent } from './app.component';
import { NavigationService } from './core/services/navigation.service';
import { IndexedDbService } from './core/services/indexed-db.service';
import { ProductService } from './features/tienda/services/product.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    const navigationServiceStub = {
      activeComponent: signal<'contacto' | null>(null),
    };

    const indexedDbServiceSpy = jasmine.createSpyObj<IndexedDbService>('IndexedDbService', [
      'getProducts',
      'updateProduct',
    ]);
    indexedDbServiceSpy.getProducts.and.resolveTo([
      { id: 1, name: 'Producto', price: 10, imageUrl: 'img.jpg', colors: [], category: 'ropa', stock: 1 },
    ]);

    const productServiceStub = {
      getSuplementosProducts: () => [],
      getRopaProducts: () => [],
      getCalzadoProducts: () => [],
      getImplementosProducts: () => [],
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: NavigationService, useValue: navigationServiceStub },
        { provide: IndexedDbService, useValue: indexedDbServiceSpy },
        { provide: ProductService, useValue: productServiceStub },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the expected title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toBe('tienda_angular');
  });

  it('should render the router outlet', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
