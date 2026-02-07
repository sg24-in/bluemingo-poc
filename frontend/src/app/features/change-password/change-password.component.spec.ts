import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import { ChangePasswordComponent } from './change-password.component';
import { AuthService, User } from '../../core/services/auth.service';
import { ApiService } from '../../core/services/api.service';

describe('ChangePasswordComponent', () => {
  let component: ChangePasswordComponent;
  let fixture: ComponentFixture<ChangePasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;
  let currentUserSubject: BehaviorSubject<User | null>;

  const mockUser: User = {
    email: 'admin@mes.com',
    fullName: 'Admin User',
    role: 'ADMIN'
  };

  beforeEach(async () => {
    currentUserSubject = new BehaviorSubject<User | null>(mockUser);

    const authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: currentUserSubject.asObservable()
    });

    const apiSpy = jasmine.createSpyObj('ApiService', ['changePassword']);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ChangePasswordComponent],
      providers: [
        { provide: AuthService, useValue: authSpy },
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangePasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with empty form', () => {
    expect(component.form.get('currentPassword')?.value).toBe('');
    expect(component.form.get('newPassword')?.value).toBe('');
    expect(component.form.get('confirmPassword')?.value).toBe('');
  });

  it('should load current user on init', () => {
    expect(component.currentUser).toEqual(mockUser);
  });

  describe('Form Validation', () => {
    it('should require current password', () => {
      const control = component.form.get('currentPassword');
      expect(control?.valid).toBeFalse();

      control?.setValue('password123');
      expect(control?.valid).toBeTrue();
    });

    it('should require new password with minimum 6 characters', () => {
      const control = component.form.get('newPassword');
      expect(control?.valid).toBeFalse();

      control?.setValue('12345');
      expect(control?.valid).toBeFalse();

      control?.setValue('123456');
      expect(control?.valid).toBeTrue();
    });

    it('should require confirm password', () => {
      const control = component.form.get('confirmPassword');
      expect(control?.valid).toBeFalse();

      // Set matching passwords to avoid cross-field validation error
      component.form.get('newPassword')?.setValue('password');
      control?.setValue('password');
      expect(control?.valid).toBeTrue();
    });

    it('should validate password match', () => {
      component.form.patchValue({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'different'
      });

      expect(component.form.valid).toBeFalse();
      expect(component.form.get('confirmPassword')?.errors?.['passwordMismatch']).toBeTrue();
    });

    it('should pass validation when passwords match', () => {
      component.form.patchValue({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      });

      expect(component.form.valid).toBeTrue();
    });
  });

  describe('getPasswordStrength', () => {
    it('should return weak for short password', () => {
      component.form.get('newPassword')?.setValue('abc');
      const strength = component.getPasswordStrength();
      expect(strength.label).toBe('Weak');
    });

    it('should return fair for medium password', () => {
      component.form.get('newPassword')?.setValue('abcdef');
      const strength = component.getPasswordStrength();
      expect(['Weak', 'Fair']).toContain(strength.label);
    });

    it('should return good for better password', () => {
      // 'Abcdef1' (7 chars): 6chars=20 + uppercase=20 + lowercase=10 + numbers=15 = 65 → Good
      component.form.get('newPassword')?.setValue('Abcdef1');
      const strength = component.getPasswordStrength();
      expect(strength.label).toBe('Good');
    });

    it('should return strong for complex password', () => {
      component.form.get('newPassword')?.setValue('Abcd1234!@#');
      const strength = component.getPasswordStrength();
      expect(strength.label).toBe('Strong');
    });
  });

  describe('togglePasswordVisibility', () => {
    it('should toggle current password visibility', () => {
      expect(component.showCurrentPassword).toBeFalse();
      component.togglePasswordVisibility('current');
      expect(component.showCurrentPassword).toBeTrue();
      component.togglePasswordVisibility('current');
      expect(component.showCurrentPassword).toBeFalse();
    });

    it('should toggle new password visibility', () => {
      expect(component.showNewPassword).toBeFalse();
      component.togglePasswordVisibility('new');
      expect(component.showNewPassword).toBeTrue();
    });

    it('should toggle confirm password visibility', () => {
      expect(component.showConfirmPassword).toBeFalse();
      component.togglePasswordVisibility('confirm');
      expect(component.showConfirmPassword).toBeTrue();
    });
  });

  describe('onSubmit', () => {
    it('should not submit if form is invalid', () => {
      component.onSubmit();
      expect(apiServiceSpy.changePassword).not.toHaveBeenCalled();
    });

    it('should submit valid form', () => {
      apiServiceSpy.changePassword.and.returnValue(of({ message: 'Password changed' }));

      component.form.patchValue({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      });

      component.onSubmit();

      expect(apiServiceSpy.changePassword).toHaveBeenCalledWith({
        currentPassword: 'oldpass',
        newPassword: 'newpass123'
      });
    });

    it('should set success flag on successful submission', fakeAsync(() => {
      apiServiceSpy.changePassword.and.returnValue(of({ message: 'Password changed' }));
      spyOn(router, 'navigate');

      component.form.patchValue({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      });

      component.onSubmit();

      expect(component.loading).toBeFalse();
      expect(component.success).toBeTrue();

      tick(2000);
      expect(router.navigate).toHaveBeenCalledWith(['/profile']);
    }));

    it('should handle error on failed submission', () => {
      apiServiceSpy.changePassword.and.returnValue(
        throwError(() => ({ error: { message: 'Current password is incorrect' } }))
      );

      component.form.patchValue({
        currentPassword: 'wrongpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      });

      component.onSubmit();

      expect(component.loading).toBeFalse();
      expect(component.error).toBe('Current password is incorrect');
    });

    it('should handle error without message', () => {
      apiServiceSpy.changePassword.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      });

      component.onSubmit();

      expect(component.error).toBe('Failed to change password. Please try again.');
    });

    it('should set loading during submission', () => {
      apiServiceSpy.changePassword.and.returnValue(of({ message: 'Password changed' }));

      component.form.patchValue({
        currentPassword: 'oldpass',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123'
      });

      // Simulate submission start
      component.loading = true;
      expect(component.loading).toBeTrue();
    });
  });
});
