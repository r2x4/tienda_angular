import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ProductCrudComponent } from './product-crud';
import { IndexedDbService } from '../../../core/services/indexed-db.service';

describe('ProductCrudComponent', () => {
  let component: ProductCrudComponent;
  let fixture: ComponentFixture<ProductCrudComponent>;
  let indexedDbServiceSpy: jasmine.SpyObj<IndexedDbService>;

  beforeEach(async () => {
    indexedDbServiceSpy = jasmine.createSpyObj<IndexedDbService>('IndexedDbService', [
      'getProducts',
      'addProduct',
      'updateProduct',
      'deleteProduct',
    ]);
    indexedDbServiceSpy.getProducts.and.resolveTo([]);
    indexedDbServiceSpy.addProduct.and.resolveTo({} as any);
    indexedDbServiceSpy.updateProduct.and.resolveTo({} as any);
    indexedDbServiceSpy.deleteProduct.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ProductCrudComponent],
      providers: [{ provide: IndexedDbService, useValue: indexedDbServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ProductCrudComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(indexedDbServiceSpy.getProducts).toHaveBeenCalled();
    expect(component.products()).toEqual([]);
  });
});
