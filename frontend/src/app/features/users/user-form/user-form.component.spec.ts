import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { UserFormComponent } from './user-form.component';
import { ApiService } from '../../../core/services/api.service';

describe('UserFormComponent', () => {
  let component: UserFormComponent;
  let fixture: ComponentFixture<UserFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockUser = {
    userId: 1,
    email: 'test@mes.com',
    name: 'Test User',
    role: 'OPERATOR',
    status: 'ACTIVE'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => routeParams[key] || null
        }
      }
    };

    const spy = jasmine.createSpyObj('ApiService', [
      'getUserById',
      'createUser',
      'updateUser'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        ReactiveFormsModule
      ],
      declarations: [UserFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  };

  const createComponent = () => {
    fixture = TestBed.createComponent(UserFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Create Mode', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be in create mode when no userId param', () => {
      expect(component.isEditMode).toBeFalse();
    });

    it('should have empty form for create', () => {
      expect(component.form.get('email')?.value).toBe('');
      expect(component.form.get('name')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        email: '',
        name: '',
        password: ''
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should validate email format', () => {
      const emailControl = component.form.get('email');
      emailControl?.setValue('invalid-email');
      expect(emailControl?.valid).toBeFalse();

      emailControl?.setValue('valid@example.com');
      expect(emailControl?.valid).toBeTrue();
    });

    it('should validate password minimum length', () => {
      const passwordControl = component.form.get('password');
      passwordControl?.setValue('12345');
      expect(passwordControl?.valid).toBeFalse();

      passwordControl?.setValue('123456');
      expect(passwordControl?.valid).toBeTrue();
    });

    it('should create user successfully', () => {
      apiServiceSpy.createUser.and.returnValue(of(mockUser));
      spyOn(router, 'navigate');

      component.form.patchValue({
        email: 'new@mes.com',
        name: 'New User',
        password: 'password123',
        role: 'OPERATOR'
      });

      component.onSubmit();

      expect(apiServiceSpy.createUser).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createUser.and.returnValue(
        throwError(() => ({ error: { message: 'Email already exists' } }))
      );

      component.form.patchValue({
        email: 'existing@mes.com',
        name: 'Test',
        password: 'password123',
        role: 'OPERATOR'
      });

      component.onSubmit();

      expect(component.error).toBe('Email already exists');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ userId: '1' });
      apiServiceSpy.getUserById.and.returnValue(of(mockUser));
      createComponent();
    });

    it('should be in edit mode when userId param exists', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should load user data', () => {
      expect(apiServiceSpy.getUserById).toHaveBeenCalledWith(1);
      expect(component.form.get('email')?.value).toBe('test@mes.com');
      expect(component.form.get('name')?.value).toBe('Test User');
    });

    it('should update user successfully', () => {
      apiServiceSpy.updateUser.and.returnValue(of(mockUser));
      spyOn(router, 'navigate');

      component.form.patchValue({
        name: 'Updated Name'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateUser).toHaveBeenCalledWith(1, jasmine.any(Object));
    });

  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should validate email and name required', () => {
      component.form.patchValue({ email: '', name: '' });
      expect(component.form.invalid).toBeTrue();
    });
  });

  describe('navigation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should navigate back on cancel', () => {
      spyOn(router, 'navigate');

      component.cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/manage/users']);
    });
  });
});
