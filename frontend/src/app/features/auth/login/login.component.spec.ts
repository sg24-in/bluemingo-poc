import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { LoginComponent } from './login.component';
import { AuthService, LoginRequest, LoginResponse } from '../../../core/services/auth.service';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    const authSpy = jasmine.createSpyObj('AuthService', ['login', 'isAuthenticated']);
    const routerMock = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule
      ],
      declarations: [LoginComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerMock }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize login form', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')).toBeTruthy();
    expect(component.loginForm.get('password')).toBeTruthy();
  });

  it('should redirect to dashboard if already authenticated', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    component.ngOnInit();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
  });

  describe('Form Validation', () => {
    it('should be invalid when empty', () => {
      expect(component.loginForm.valid).toBeFalse();
    });

    it('should be invalid with invalid email', () => {
      component.loginForm.patchValue({
        email: 'invalid-email',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBeFalse();
    });

    it('should be invalid with short password', () => {
      component.loginForm.patchValue({
        email: 'test@test.com',
        password: '123'
      });
      expect(component.loginForm.valid).toBeFalse();
    });

    it('should be valid with correct inputs', () => {
      component.loginForm.patchValue({
        email: 'test@test.com',
        password: 'password123'
      });
      expect(component.loginForm.valid).toBeTrue();
    });
  });

  describe('Form Submission', () => {
    it('should not submit if form is invalid', () => {
      component.loginForm.patchValue({
        email: '',
        password: ''
      });

      component.onSubmit();

      expect(authServiceSpy.login).not.toHaveBeenCalled();
    });

    it('should call login and navigate on success', () => {
      const mockResponse: LoginResponse = {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { userId: 1, email: 'admin@mes.com', name: 'Admin User', employeeId: 'EMP001' }
      };
      authServiceSpy.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'admin@mes.com',
        password: 'admin123'
      });

      component.onSubmit();

      expect(authServiceSpy.login).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should set loading state during submission', () => {
      const mockResponse: LoginResponse = {
        accessToken: 'test-token',
        refreshToken: 'refresh-token',
        tokenType: 'Bearer',
        expiresIn: 3600,
        user: { userId: 1, email: 'test@test.com', name: 'Test', employeeId: 'EMP001' }
      };
      authServiceSpy.login.and.returnValue(of(mockResponse));

      component.loginForm.patchValue({
        email: 'admin@mes.com',
        password: 'admin123'
      });

      component.onSubmit();

      expect(component.loading).toBeFalse(); // After success
    });

    it('should handle login error', () => {
      authServiceSpy.login.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid credentials' } }))
      );

      component.loginForm.patchValue({
        email: 'admin@mes.com',
        password: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.loading).toBeFalse();
      expect(component.error).toBe('Invalid credentials');
    });

    it('should show default error message when no message provided', () => {
      authServiceSpy.login.and.returnValue(throwError(() => ({})));

      component.loginForm.patchValue({
        email: 'admin@mes.com',
        password: 'wrongpassword'
      });

      component.onSubmit();

      expect(component.error).toBe('Invalid email or password');
    });
  });

  describe('Getter', () => {
    it('should return form controls', () => {
      expect(component.f).toBe(component.loginForm.controls);
    });
  });
});
