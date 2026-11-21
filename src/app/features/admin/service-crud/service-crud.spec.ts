import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ServiceCrudComponent } from './service-crud';
import { IndexedDbService } from '../../../core/services/indexed-db.service';

describe('ServiceCrudComponent', () => {
  let component: ServiceCrudComponent;
  let fixture: ComponentFixture<ServiceCrudComponent>;
  let indexedDbServiceSpy: jasmine.SpyObj<IndexedDbService>;

  beforeEach(async () => {
    indexedDbServiceSpy = jasmine.createSpyObj<IndexedDbService>('IndexedDbService', [
      'getServices',
      'addService',
      'updateService',
      'deleteService',
    ]);
    indexedDbServiceSpy.getServices.and.resolveTo([]);
    indexedDbServiceSpy.addService.and.resolveTo({} as any);
    indexedDbServiceSpy.updateService.and.resolveTo({} as any);
    indexedDbServiceSpy.deleteService.and.resolveTo();

    await TestBed.configureTestingModule({
      imports: [ServiceCrudComponent],
      providers: [{ provide: IndexedDbService, useValue: indexedDbServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(ServiceCrudComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load services on init', () => {
    expect(indexedDbServiceSpy.getServices).toHaveBeenCalled();
    expect(component.services()).toEqual([]);
  });
});
