import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ProductCrudComponent } from './product-crud';
import { AdminProductsApiService } from '../services/admin-products-api.service';
import { AdminCategoriesApiService } from '../services/admin-categories-api.service';
import { AdminMediaApiService } from '../services/admin-media-api.service';

describe('ProductCrudComponent (Fase 10.3)', () => {
  let productsApi: jasmine.SpyObj<AdminProductsApiService>;
  let categoriesApi: jasmine.SpyObj<AdminCategoriesApiService>;
  let mediaApi: jasmine.SpyObj<AdminMediaApiService>;

  const cat = { id: 'c1', name: 'Ropa', slug: 'ropa', description: null, is_active: true, created_at: '', updated_at: '' } as any;
  const prod = { id: 'p1', category_id: 'c1', name: 'P', slug: 'p', description: 'd', price_cop: '1000', stock_quantity: 2, is_active: true, created_at: '', updated_at: '', category: { id:'c1', name:'Ropa', slug:'ropa', is_active:true }, images: [{ id:'i1', product_id:'p1', url:'/media/images/a.webp', alt_text:'a', is_primary:true, sort_order:0, created_at:'' }] } as any;

  beforeEach(async () => {
    productsApi = jasmine.createSpyObj('AdminProductsApiService', ['list','getById','create','update','deactivate']);
    categoriesApi = jasmine.createSpyObj('AdminCategoriesApiService', ['list']);
    mediaApi = jasmine.createSpyObj('AdminMediaApiService', ['uploadImage']);
    productsApi.list.and.returnValue(of([prod]));
    categoriesApi.list.and.returnValue(of([cat]));
    spyOn(window, 'confirm').and.returnValue(true);
    await TestBed.configureTestingModule({
      imports: [ProductCrudComponent],
      providers: [
        { provide: AdminProductsApiService, useValue: productsApi },
        { provide: AdminCategoriesApiService, useValue: categoriesApi },
        { provide: AdminMediaApiService, useValue: mediaApi },
      ],
    }).compileComponents();
  });

  it('loads products and categories from backend', () => {
    const fixture = TestBed.createComponent(ProductCrudComponent);
    fixture.detectChanges();
    expect(productsApi.list).toHaveBeenCalled();
    expect(categoriesApi.list).toHaveBeenCalled();
    expect(fixture.componentInstance.products().length).toBe(1);
  });

  it('creates product with backend payload', () => {
    productsApi.create.and.returnValue(of(prod));
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    c.form = { name:'N', slug:'n', description:'', price_cop:'1500', stock_quantity:'3', category_id:'c1', is_active:true, images: [] };
    c.save();
    expect(productsApi.create).toHaveBeenCalledWith(jasmine.objectContaining({ name:'N', slug:'n', price_cop:'1500', stock_quantity:3, category_id:'c1', is_active:true, images:[] }));
  });

  it('uploads new image file and sends returned URL in payload', () => {
    mediaApi.uploadImage.and.returnValue(of({ url:'/media/images/new.webp', filename:'new.webp', content_type:'image/webp', size_bytes:10 }));
    productsApi.create.and.returnValue(of(prod));
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    const file = new File(['x'], 'a.webp', { type: 'image/webp' });
    c.form = { name:'N', slug:'n', description:'', price_cop:'1500', stock_quantity:'3', category_id:'c1', is_active:true, images: [{ url:'', alt_text:'alt', is_primary:true, sort_order:0, file, isExisting:false }] };
    c.save();
    expect(mediaApi.uploadImage).toHaveBeenCalledWith(file);
    expect(productsApi.create).toHaveBeenCalledWith(jasmine.objectContaining({ images: [jasmine.objectContaining({ url:'/media/images/new.webp', alt_text:'alt', is_primary:true, sort_order:0 })] }));
  });

  it('does not reupload existing image URL on edit', () => {
    productsApi.update.and.returnValue(of(prod));
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    c.edit(prod);
    c.form.name = 'Edited';
    c.save();
    expect(mediaApi.uploadImage).not.toHaveBeenCalled();
    expect(productsApi.update).toHaveBeenCalledWith('p1', jasmine.objectContaining({ images: [jasmine.objectContaining({ url:'/media/images/a.webp' })] }));
  });

  it('validates file type and size', () => {
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    c.form.images = [{ url:'', alt_text:'', is_primary:true, sort_order:0 }];
    c.onFileSelected({ target: { files: [new File(['x'], 'a.txt', { type:'text/plain' })] } } as any, 0);
    expect(c.form.images[0].uploadError).toContain('Formato');
    c.onFileSelected({ target: { files: [new File([new Uint8Array(6*1024*1024)], 'a.png', { type:'image/png' })] } } as any, 0);
    expect(c.form.images[0].uploadError).toContain('5 MB');
  });

  it('handles 401/403/404/409/422 on save and keeps form', () => {
    [401,403,404,409,422].forEach(status => {
      productsApi.update.calls.reset();
      productsApi.update.and.returnValue(throwError(() => ({ status, message: `e${status}` })));
      const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
      c.form = { id:'p1', name:'N', slug:'n', description:'', price_cop:'1000', stock_quantity:'1', category_id:'c1', is_active:true, images:[] };
      c.save();
      expect(c.error()).toContain(`e${status}`);
      expect(c.form.id).toBe('p1');
    });
  });

  it('prevents duplicate save while in progress', () => {
    const pending = new Subject<any>();
    productsApi.create.and.returnValue(pending.asObservable());
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    c.form = { name:'N', slug:'n', description:'', price_cop:'1000', stock_quantity:'1', category_id:'c1', is_active:true, images:[] };
    c.save(); c.save();
    expect(productsApi.create).toHaveBeenCalledTimes(1);
    pending.next(prod); pending.complete();
  });

  it('selects primary image and changes image order in payload', () => {
    productsApi.create.and.returnValue(of(prod));
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    c.form = { name:'N', slug:'n', description:'', price_cop:'1000', stock_quantity:'1', category_id:'c1', is_active:true,
      images: [
        { url:'/media/images/a.webp', alt_text:'a', is_primary:true, sort_order:0, isExisting:true },
        { url:'/media/images/b.webp', alt_text:'b', is_primary:false, sort_order:1, isExisting:true },
      ] };
    c.setPrimary(1);
    c.form.images[0].sort_order = 5;
    c.form.images[1].sort_order = 1;
    c.save();
    expect(productsApi.create).toHaveBeenCalledWith(jasmine.objectContaining({
      images: [
        jasmine.objectContaining({ url:'/media/images/a.webp', is_primary:false, sort_order:5 }),
        jasmine.objectContaining({ url:'/media/images/b.webp', is_primary:true, sort_order:1 }),
      ]
    }));
  });

  it('edits product conserving existing images and allows unlink without physical delete call', () => {
    productsApi.update.and.returnValue(of(prod));
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    c.edit({ ...prod, images: [
      { id:'i1', product_id:'p1', url:'/media/images/a.webp', alt_text:'a', is_primary:true, sort_order:0, created_at:'' },
      { id:'i2', product_id:'p1', url:'https://cdn.example.com/b.png', alt_text:'b', is_primary:false, sort_order:1, created_at:'' },
    ] } as any);
    c.removeImage(1);
    c.save();
    expect(mediaApi.uploadImage).not.toHaveBeenCalled();
    expect(productsApi.update).toHaveBeenCalledWith('p1', jasmine.objectContaining({
      images: [jasmine.objectContaining({ url:'/media/images/a.webp' })]
    }));
  });

  it('resolves relative and keeps absolute URLs', () => {
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    expect(c.resolveImageUrl('/media/images/a.webp')).toBe('http://localhost:8000/media/images/a.webp');
    expect(c.resolveImageUrl('https://cdn.example.com/a.png')).toBe('https://cdn.example.com/a.png');
  });

  it('handles image upload failure without losing form data', () => {
    mediaApi.uploadImage.and.returnValue(throwError(() => ({ status: 500, message: 'upload fail' })));
    const c = TestBed.createComponent(ProductCrudComponent).componentInstance;
    const file = new File(['x'], 'a.webp', { type:'image/webp' });
    c.form = { name:'N', slug:'n', description:'desc', price_cop:'1000', stock_quantity:'1', category_id:'c1', is_active:true, images:[{ url:'', alt_text:'', is_primary:true, sort_order:0, file }] };
    c.save();
    expect(c.error()).toContain('upload fail');
    expect(c.form.name).toBe('N');
    expect(c.form.images.length).toBe(1);
    expect(productsApi.create).not.toHaveBeenCalled();
  });
});
