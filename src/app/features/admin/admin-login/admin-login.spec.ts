import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AdminLoginComponent } from './admin-login';
import { AuthService } from '../../../core/services/auth.service';
import { AuthSessionService } from '../../../core/auth/services/auth-session.service';

describe('AdminLoginComponent', () => {
  let component: AdminLoginComponent;
  let fixture: ComponentFixture<AdminLoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let sessionSpy: jasmine.SpyObj<AuthSessionService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['loginAdmin']);
    sessionSpy = jasmine.createSpyObj<AuthSessionService>('AuthSessionService', ['logout']);
    authServiceSpy.loginAdmin.and.returnValue(of(false));
    sessionSpy.logout.and.returnValue(of(void 0));
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigateByUrl']);
    routerSpy.navigateByUrl.and.resolveTo(true);

    await TestBed.configureTestingModule({
      imports: [AdminLoginComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: AuthSessionService, useValue: sessionSpy },
        { provide: Router, useValue: routerSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: { get: () => null } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should set error message when user is not admin', () => {
    component.username.set('user');
    component.password.set('pass12345');

    component.login();

    expect(authServiceSpy.loginAdmin).toHaveBeenCalledWith('user', 'pass12345');
    expect(component.errorMessage()).toContain('ADMIN');
    expect(sessionSpy.logout).toHaveBeenCalledWith(false);
    expect(routerSpy.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should show backend error message on login failure', () => {
    authServiceSpy.loginAdmin.and.returnValue(throwError(() => ({ status: 400, message: 'Credenciales inválidas' })));
    component.username.set('admin');
    component.password.set('bad');

    component.login();

    expect(component.errorMessage()).toBeTruthy();
  });
});
