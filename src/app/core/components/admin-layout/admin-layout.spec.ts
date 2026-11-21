import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AdminLayoutComponent } from './admin-layout';
import { AuthService } from '../../services/auth.service';
import { IndexedDbService } from '../../services/indexed-db.service';

describe('AdminLayoutComponent', () => {
  let component: AdminLayoutComponent;
  let fixture: ComponentFixture<AdminLayoutComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let indexedDbServiceSpy: jasmine.SpyObj<IndexedDbService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logoutAdmin']);
    indexedDbServiceSpy = jasmine.createSpyObj<IndexedDbService>('IndexedDbService', [
      'getSales',
      'getProducts',
    ]);
    indexedDbServiceSpy.getSales.and.resolveTo([]);
    indexedDbServiceSpy.getProducts.and.resolveTo([]);

    await TestBed.configureTestingModule({
      imports: [AdminLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: IndexedDbService, useValue: indexedDbServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLayoutComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should call logoutAdmin when logout is invoked', () => {
    component.logout();
    expect(authServiceSpy.logoutAdmin).toHaveBeenCalled();
  });
});
