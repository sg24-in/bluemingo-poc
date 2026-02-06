import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { CustomerFormComponent } from './customer-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Customer } from '../../../shared/models';

describe('CustomerFormComponent', () => {
  let component: CustomerFormComponent;
  let fixture: ComponentFixture<CustomerFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockCustomer: Customer = {
    customerId: 1,
    customerCode: 'CUST-001',
    customerName: 'Acme Corporation',
    contactPerson: 'John Doe',
    email: 'john@acme.com',
    phone: '+1234567890',
    address: '123 Main St',
    city: 'New York',
    country: 'USA',
    taxId: 'TAX123',
    status: 'ACTIVE'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getCustomerById',
      'createCustomer',
      'updateCustomer'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [CustomerFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => routeParams[key] || null
              }
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  };

  const createComponent = () => {
    fixture = TestBed.createComponent(CustomerFormComponent);
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

    it('should be in create mode when no id param', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.customerId).toBeNull();
    });

    it('should have empty form for create', () => {
      expect(component.form.get('customerCode')?.value).toBe('');
      expect(component.form.get('customerName')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        customerCode: '',
        customerName: ''
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create customer successfully', () => {
      apiServiceSpy.createCustomer.and.returnValue(of(mockCustomer));

      component.form.patchValue({
        customerCode: 'CUST-001',
        customerName: 'Acme Corporation',
        email: 'test@example.com'
      });

      component.onSubmit();

      expect(apiServiceSpy.createCustomer).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createCustomer.and.returnValue(
        throwError(() => ({ error: { message: 'Code already exists' } }))
      );

      component.form.patchValue({
        customerCode: 'CUST-001',
        customerName: 'Test'
      });

      component.onSubmit();

      expect(component.error).toBe('Code already exists');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getCustomerById.and.returnValue(of(mockCustomer));
      createComponent();
    });

    it('should be in edit mode when id param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.customerId).toBe(1);
    });

    it('should load customer data', () => {
      expect(apiServiceSpy.getCustomerById).toHaveBeenCalledWith(1);
      expect(component.form.get('customerName')?.value).toBe('Acme Corporation');
    });

    it('should disable customerCode in edit mode', () => {
      expect(component.form.get('customerCode')?.disabled).toBeTrue();
    });

    it('should update customer successfully', () => {
      apiServiceSpy.updateCustomer.and.returnValue(of(mockCustomer));

      component.form.patchValue({
        customerName: 'Updated Name'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateCustomer).toHaveBeenCalledWith(1, jasmine.any(Object));
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should validate email format', () => {
      component.form.patchValue({ email: 'invalid-email' });
      expect(component.form.get('email')?.valid).toBeFalse();

      component.form.patchValue({ email: 'valid@email.com' });
      expect(component.form.get('email')?.valid).toBeTrue();
    });

    it('should validate max length', () => {
      const longString = 'a'.repeat(201);
      component.form.patchValue({ customerName: longString });
      expect(component.form.get('customerName')?.valid).toBeFalse();
    });

    it('should report field errors', () => {
      component.form.get('customerCode')?.markAsTouched();
      expect(component.hasError('customerCode')).toBeTrue();
    });
  });
});
