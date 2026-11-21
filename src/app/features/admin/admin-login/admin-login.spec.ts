import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { AdminLoginComponent } from './admin-login';
import { AuthService } from '../../../core/services/auth.service';

describe('AdminLoginComponent', () => {
  let component: AdminLoginComponent;
  let fixture: ComponentFixture<AdminLoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['loginAdmin']);
    authServiceSpy.loginAdmin.and.resolveTo(false);
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']);
    routerSpy.navigate.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set error message when login fails', async () => {
    component.username.set('admin');
    component.password.set('wrong');

    await component.login();

    expect(authServiceSpy.loginAdmin).toHaveBeenCalledWith('admin', 'wrong');
    expect(component.errorMessage()).toBe('Nombre de usuario o contraseña incorrectos.');
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });
});
