import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
    { productId: 1, productSku: 'SKU-001', productName: 'Steel Rod', unit: 'MTR', status: 'ACTIVE' },
    { productId: 2, productSku: 'SKU-002', productName: 'Steel Plate', unit: 'KG', status: 'ACTIVE' }
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

  const createComponent = (routeParams: any = {}) => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          paramMap: {
            get: (key: string) => routeParams[key] || null
          }
        }
      }
    });

    fixture = TestBed.createComponent(OrderFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
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
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    apiServiceSpy.getActiveCustomers.and.returnValue(of(mockCustomers));
    apiServiceSpy.getActiveProducts.and.returnValue(of(mockProducts));
  });

  describe('Create Mode', () => {
    beforeEach(() => {
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
      const event = { target: { value: '1' } } as unknown as Event;
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
    beforeEach(() => {
      apiServiceSpy.getOrderById.and.returnValue(of(mockOrder));
      createComponent({ orderId: '1' });
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
    beforeEach(() => {
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
    beforeEach(() => {
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
});
