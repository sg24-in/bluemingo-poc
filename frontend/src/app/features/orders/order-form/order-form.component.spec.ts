import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OrderFormComponent } from './order-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Order, Customer, Product } from '../../../shared/models';

describe('OrderFormComponent', () => {
  let component: OrderFormComponent;
  let fixture: ComponentFixture<OrderFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockCustomers: Customer[] = [
    { customerId: 1, customerCode: 'CUST-001', customerName: 'Acme Corp', status: 'ACTIVE' },
    { customerId: 2, customerCode: 'CUST-002', customerName: 'Tech Industries', status: 'ACTIVE' }
  ];

  const mockProducts: Product[] = [
    { productId: 1, sku: 'SKU-001', productName: 'Steel Rod', baseUnit: 'MTR', status: 'ACTIVE' },
    { productId: 2, sku: 'SKU-002', productName: 'Steel Plate', baseUnit: 'KG', status: 'ACTIVE' }
  ];

  const mockOrder: Order = {
    orderId: 1,
    orderNumber: 'ORD-00001',
    customerId: '1',
    customerName: 'Acme Corp',
    orderDate: '2026-02-04',
    status: 'CREATED',
    lineItems: [
      {
        orderLineId: 1,
        productSku: 'SKU-001',
        productName: 'Steel Rod',
        quantity: 100,
        unit: 'MTR',
        status: 'CREATED'
      }
    ]
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getOrderById',
      'createOrder',
      'updateOrder',
      'getActiveCustomers',
      'getActiveProducts'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [OrderFormComponent],
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
    apiServiceSpy.getActiveCustomers.and.returnValue(of(mockCustomers));
    apiServiceSpy.getActiveProducts.and.returnValue(of(mockProducts));
  };

  const createComponent = () => {
    fixture = TestBed.createComponent(OrderFormComponent);
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
      expect(component.orderId).toBeNull();
    });

    it('should load customers and products on init', () => {
      expect(apiServiceSpy.getActiveCustomers).toHaveBeenCalled();
      expect(apiServiceSpy.getActiveProducts).toHaveBeenCalled();
    });

    it('should have one line item by default', () => {
      expect(component.lineItems.length).toBe(1);
    });

    it('should have today as default order date', () => {
      const today = component.getTodayDate();
      expect(component.form.get('orderDate')?.value).toBe(today);
    });

    it('should add line item', () => {
      component.addLineItem();
      expect(component.lineItems.length).toBe(2);
    });

    it('should remove line item', () => {
      component.addLineItem();
      expect(component.lineItems.length).toBe(2);
      component.removeLineItem(1);
      expect(component.lineItems.length).toBe(1);
    });

    it('should not remove last line item', () => {
      expect(component.lineItems.length).toBe(1);
      component.removeLineItem(0);
      expect(component.lineItems.length).toBe(1);
    });

    it('should update customer name when customer selected', () => {
      const event = { target: { value: 'CUST-001' } } as unknown as Event;
      component.onCustomerChange(event);
      expect(component.form.get('customerName')?.value).toBe('Acme Corp');
    });

    it('should update line item when product selected', () => {
      const event = { target: { value: 'SKU-001' } } as unknown as Event;
      component.onProductChange(0, event);
      expect(component.lineItems.at(0).get('productName')?.value).toBe('Steel Rod');
      expect(component.lineItems.at(0).get('unit')?.value).toBe('MTR');
    });

    it('should create order successfully', () => {
      apiServiceSpy.createOrder.and.returnValue(of(mockOrder));

      component.form.patchValue({
        customerId: '1',
        customerName: 'Acme Corp',
        orderDate: '2026-02-04'
      });
      component.lineItems.at(0).patchValue({
        productSku: 'SKU-001',
        productName: 'Steel Rod',
        quantity: 100,
        unit: 'MTR'
      });

      component.onSubmit();

      expect(apiServiceSpy.createOrder).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ orderId: '1' });
      apiServiceSpy.getOrderById.and.returnValue(of(mockOrder));
      createComponent();
    });

    it('should be in edit mode when id param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.orderId).toBe(1);
    });

    it('should load order data', () => {
      expect(apiServiceSpy.getOrderById).toHaveBeenCalledWith(1);
      expect(component.form.get('customerName')?.value).toBe('Acme Corp');
    });

    it('should populate line items from order', () => {
      expect(component.lineItems.length).toBe(1);
      expect(component.lineItems.at(0).get('productSku')?.value).toBe('SKU-001');
    });

    it('should update order successfully', () => {
      apiServiceSpy.updateOrder.and.returnValue(of(mockOrder));

      component.form.patchValue({
        customerName: 'Updated Name'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateOrder).toHaveBeenCalledWith(1, jasmine.any(Object));
    });

    it('should allow line item edits for CREATED status', () => {
      component.form.patchValue({ status: 'CREATED' });
      expect(component.canEditLineItems()).toBeTrue();
    });

    it('should not allow line item edits for IN_PROGRESS status', () => {
      component.form.patchValue({ status: 'IN_PROGRESS' });
      expect(component.canEditLineItems()).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should require customer', () => {
      component.form.patchValue({ customerId: '' });
      expect(component.form.get('customerId')?.valid).toBeFalse();
    });

    it('should require customer name', () => {
      component.form.patchValue({ customerName: '' });
      expect(component.form.get('customerName')?.valid).toBeFalse();
    });

    it('should require order date', () => {
      component.form.patchValue({ orderDate: '' });
      expect(component.form.get('orderDate')?.valid).toBeFalse();
    });

    it('should validate line item required fields', () => {
      const lineItem = component.lineItems.at(0);
      lineItem.patchValue({
        productSku: '',
        productName: '',
        quantity: null,
        unit: ''
      });
      expect(lineItem.valid).toBeFalse();
    });

    it('should validate line item quantity minimum', () => {
      const lineItem = component.lineItems.at(0);
      lineItem.patchValue({ quantity: 0 });
      expect(lineItem.get('quantity')?.valid).toBeFalse();
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should handle create error', () => {
      apiServiceSpy.createOrder.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to create' } }))
      );

      component.form.patchValue({
        customerId: '1',
        customerName: 'Test',
        orderDate: '2026-02-04'
      });
      component.lineItems.at(0).patchValue({
        productSku: 'SKU-001',
        productName: 'Test',
        quantity: 1,
        unit: 'PCS'
      });

      component.onSubmit();

      expect(component.error).toBe('Failed to create');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Edit Mode - BF-06 Dropdown Fix', () => {
    describe('when in edit mode', () => {
      beforeEach(async () => {
        await configureTestBed({ orderId: '1' });
        apiServiceSpy.getOrderById.and.returnValue(of(mockOrder));
        createComponent();
      });

      it('should show readonly customer text when in edit mode', () => {
        const el = fixture.nativeElement;
        const customerSelect = el.querySelector('select#customerId');
        const readonlyInput = el.querySelector('input.readonly-field');

        expect(customerSelect).toBeNull();
        expect(readonlyInput).toBeTruthy();
      });

      it('should display customer code and name in readonly field when editing', () => {
        const el = fixture.nativeElement;
        const readonlyInput = el.querySelector('input.readonly-field') as HTMLInputElement;

        expect(readonlyInput).toBeTruthy();
        const value = readonlyInput.value;
        expect(value).toContain(component.form.get('customerId')?.value);
        expect(value).toContain(component.form.get('customerName')?.value);
      });

      it('should show readonly product text in line items when in edit mode', () => {
        const el = fixture.nativeElement;
        const productSelect = el.querySelector('select[formControlName="productSku"]');
        const readonlyInputs = el.querySelectorAll('input.readonly-field');

        expect(productSelect).toBeNull();
        // At least 2 readonly inputs: one for customer, one for product in line item
        expect(readonlyInputs.length).toBeGreaterThanOrEqual(2);
      });
    });

    describe('when in create mode', () => {
      beforeEach(async () => {
        await configureTestBed();
        createComponent();
      });

      it('should show customer dropdown when in create mode', () => {
        const el = fixture.nativeElement;
        const customerSelect = el.querySelector('select#customerId');
        const readonlyInput = el.querySelector('input.readonly-field');

        expect(customerSelect).toBeTruthy();
        expect(readonlyInput).toBeNull();
      });
    });
  });

  // ===== Phase 3: Additional coverage tests =====

  describe('cancel navigation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should navigate to orders list when cancel clicked', () => {
      const router = TestBed.inject(Router);
      spyOn(router, 'navigate');
      component.cancel();
      expect(router.navigate).toHaveBeenCalledWith(['/orders']);
    });
  });

  describe('API error handling', () => {
    it('should set loadingCustomers false when customer load fails', async () => {
      await configureTestBed();
      apiServiceSpy.getActiveCustomers.and.returnValue(throwError(() => new Error('Network error')));
      createComponent();

      expect(component.loadingCustomers).toBeFalse();
      expect(component.customers).toEqual([]);
    });

    it('should set loadingProducts false when product load fails', async () => {
      await configureTestBed();
      apiServiceSpy.getActiveProducts.and.returnValue(throwError(() => new Error('Network error')));
      createComponent();

      expect(component.loadingProducts).toBeFalse();
      expect(component.products).toEqual([]);
    });
  });

  describe('Form submission guard', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should not submit when form is invalid', () => {
      // Leave required fields empty
      component.form.patchValue({ customerId: '', customerName: '' });

      component.onSubmit();

      expect(apiServiceSpy.createOrder).not.toHaveBeenCalled();
      expect(component.saving).toBeFalse();
      // All fields should be marked as touched for validation display
      expect(component.form.get('customerId')?.touched).toBeTrue();
    });
  });

  describe('Validation helpers', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should return true from hasError when field is invalid and touched', () => {
      component.form.get('customerId')?.setValue('');
      component.form.get('customerId')?.markAsTouched();

      expect(component.hasError('customerId')).toBeTrue();
    });

    it('should return false from hasError when field is valid', () => {
      component.form.get('customerId')?.setValue('CUST-001');
      component.form.get('customerId')?.markAsTouched();

      expect(component.hasError('customerId')).toBeFalse();
    });

    it('should return required message from getError for empty required field', () => {
      component.form.get('customerId')?.setValue('');

      const msg = component.getError('customerId');
      expect(msg).toContain('required');
    });
  });
});
