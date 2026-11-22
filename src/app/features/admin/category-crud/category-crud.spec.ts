import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { CategoryCrudComponent } from './category-crud';
import { AdminCategoriesApiService } from '../services/admin-categories-api.service';
import { CategoryRead } from '../../tienda/models/catalog.models';

function cat(overrides: Partial<CategoryRead> = {}): CategoryRead {
  return { id:'c1', name:'Cat', slug:'cat', description:null, is_active:true, created_at:'', updated_at:'', ...overrides };
}

describe('CategoryCrudComponent', () => {
  let api: jasmine.SpyObj<AdminCategoriesApiService>;

  beforeEach(async () => {
    api = jasmine.createSpyObj<AdminCategoriesApiService>('AdminCategoriesApiService', ['list','create','update','deactivate','getById']);
    api.list.and.returnValue(of([cat()]));
    spyOn(window, 'confirm').and.returnValue(true);
    await TestBed.configureTestingModule({ imports:[CategoryCrudComponent], providers:[{provide:AdminCategoriesApiService, useValue:api}] }).compileComponents();
  });

  it('loads categories on init and renders list', () => {
    const fixture = TestBed.createComponent(CategoryCrudComponent);
    fixture.detectChanges();
    expect(api.list).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Lista de Categorías');
    expect(fixture.nativeElement.textContent).toContain('Cat');
  });

  it('creates categories via backend', () => {
    api.create.and.returnValue(of(cat({ id:'c2' })));
    const c = TestBed.createComponent(CategoryCrudComponent).componentInstance;
    c.current.set({ name:'C', slug:'c', description:'', is_active:true });
    c.save();
    expect(api.create).toHaveBeenCalledWith(jasmine.objectContaining({ name:'C', slug:'c', description:null, is_active:true }));
  });

  it('shows "Nueva categoría" action and resets to create mode', () => {
    const fixture = TestBed.createComponent(CategoryCrudComponent);
    fixture.detectChanges();
    const c = fixture.componentInstance;
    c.edit(cat());
    expect(c.current().id).toBe('c1');
    c.newCategory();
    expect(c.current().id).toBeUndefined();
    expect(c.current().name).toBe('');
    expect(fixture.nativeElement.textContent).toContain('Nueva categoría');
  });

  it('edits category via PUT with contract payload', () => {
    api.update.and.returnValue(of(cat({ name:'N' })));
    const c = TestBed.createComponent(CategoryCrudComponent).componentInstance;
    c.current.set({ id:'c1', name:'N', slug:'n', description:'d', is_active:true });
    c.save();
    expect(api.update).toHaveBeenCalledWith('c1', jasmine.objectContaining({ name:'N', slug:'n', description:'d', is_active:true }));
    expect(api.list).toHaveBeenCalled();
  });

  it('deactivates category and reloads', () => {
    api.deactivate.and.returnValue(of(cat({ is_active:false })));
    const c = TestBed.createComponent(CategoryCrudComponent).componentInstance;
    c.deactivate(cat());
    expect(api.deactivate).toHaveBeenCalledWith('c1');
    expect(api.list).toHaveBeenCalled();
  });

  it('handles 401/403/422 on save without clearing form', () => {
    [401,403,422].forEach(status => {
      api.update.calls.reset();
      api.update.and.returnValue(throwError(() => ({ status, message: `e${status}` })));
      const c = TestBed.createComponent(CategoryCrudComponent).componentInstance;
      c.current.set({ id:'c1', name:'N', slug:'n', description:'', is_active:true });
      c.save();
      expect(c.error()).toContain(`e${status}`);
      expect(c.current().id).toBe('c1');
    });
  });

  it('handles backend restriction on deactivate', () => {
    api.deactivate.and.returnValue(throwError(() => ({ status: 409, message: 'restriction' })));
    const c = TestBed.createComponent(CategoryCrudComponent).componentInstance;
    c.deactivate(cat());
    expect(c.error()).toContain('restriction');
  });

  it('prevents duplicate save while request in progress', () => {
    const pending = new Subject<CategoryRead>();
    api.create.and.returnValue(pending.asObservable());
    const c = TestBed.createComponent(CategoryCrudComponent).componentInstance;
    c.current.set({ name:'C', slug:'c', description:'', is_active:true });
    c.save();
    c.save();
    expect(api.create).toHaveBeenCalledTimes(1);
    expect(c.saving()).toBeTrue();
    pending.next(cat({ id:'c2' })); pending.complete();
    expect(c.saving()).toBeFalse();
  });
});
