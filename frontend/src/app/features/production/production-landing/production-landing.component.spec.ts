import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProductionLandingComponent } from './production-landing.component';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../shared/models';

describe('ProductionLandingComponent', () => {
  let component: ProductionLandingComponent;
  let fixture: ComponentFixture<ProductionLandingComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockOrders: Order[] = [
    {
      orderId: 1,
      orderNumber: 'ORD-001',
      customerId: 'CUST-001',
      customerName: 'Test Customer',
      orderDate: '2026-02-01',
      status: 'IN_PROGRESS',
      lineItems: [
        {
          orderLineId: 1,
          productSku: 'PROD-001',
          productName: 'Steel Rod',
          quantity: 100,
          unit: 'KG',
          deliveryDate: '2026-02-15',
          status: 'IN_PROGRESS',
          // Operations are directly on lineItem (backend DTO structure)
          operations: [
            {
              operationId: 101,
              operationName: 'Scrap Charging',
              operationCode: 'MELT-10',
              operationType: 'FURNACE',
              processName: 'Melting',
              sequenceNumber: 1,
              status: 'READY'
            }
          ]
        }
      ]
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getAvailableOrders']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule],
      declarations: [ProductionLandingComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getAvailableOrders.and.returnValue(of(mockOrders));
    fixture = TestBed.createComponent(ProductionLandingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load available orders on init', () => {
    expect(apiServiceSpy.getAvailableOrders).toHaveBeenCalled();
    expect(component.availableOrders.length).toBe(1);
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading orders', () => {
    apiServiceSpy.getAvailableOrders.and.returnValue(
      throwError(() => new Error('Failed'))
    );

    component.loadAvailableOrders();

    expect(component.error).toBe('Failed to load available orders');
    expect(component.loading).toBeFalse();
  });

  describe('onOrderSelect', () => {
    it('should set selected order when valid orderId', () => {
      const event = { target: { value: '1' } } as unknown as Event;
      component.onOrderSelect(event);

      expect(component.selectedOrder).toBeTruthy();
      expect(component.selectedOrder?.orderId).toBe(1);
    });

    it('should reset selection when empty value', () => {
      component.selectedOrder = mockOrders[0];
      const event = { target: { value: '' } } as unknown as Event;

      component.onOrderSelect(event);

      expect(component.selectedOrder).toBeNull();
    });

    it('should extract ready operations from selected order', () => {
      const event = { target: { value: '1' } } as unknown as Event;
      component.onOrderSelect(event);

      expect(component.readyOperations.length).toBe(1);
      expect(component.readyOperations[0].operationId).toBe(101);
      expect(component.readyOperations[0].status).toBe('READY');
    });
  });

  describe('onOperationSelect', () => {
    it('should set selected operation id', () => {
      const event = { target: { value: '101' } } as unknown as Event;
      component.onOperationSelect(event);

      expect(component.selectedOperationId).toBe(101);
    });

    it('should clear selection when empty value', () => {
      component.selectedOperationId = 101;
      const event = { target: { value: '' } } as unknown as Event;

      component.onOperationSelect(event);

      expect(component.selectedOperationId).toBeNull();
    });
  });

  describe('startConfirmation', () => {
    it('should navigate to confirmation page', () => {
      spyOn(router, 'navigate');
      component.selectedOperationId = 101;

      component.startConfirmation();

      expect(router.navigate).toHaveBeenCalledWith(['/production/confirm', 101]);
    });

    it('should not navigate without selected operation', () => {
      spyOn(router, 'navigate');
      component.selectedOperationId = null;

      component.startConfirmation();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('goToHistory', () => {
    it('should navigate to history page', () => {
      spyOn(router, 'navigate');

      component.goToHistory();

      expect(router.navigate).toHaveBeenCalledWith(['/production/history']);
    });
  });

  describe('orderContext', () => {
    it('should return empty array when no order selected', () => {
      component.selectedOrder = null;
      expect(component.orderContext).toEqual([]);
    });

    it('should return context items for selected order', () => {
      component.selectedOrder = mockOrders[0];
      const context = component.orderContext;

      expect(context.length).toBeGreaterThan(0);
      expect(context.find(c => c.label === 'Customer')?.value).toBe('Test Customer');
    });
  });

  describe('selectedOperationDetails', () => {
    it('should return null when no operation selected', () => {
      component.selectedOperationId = null;
      expect(component.selectedOperationDetails).toBeNull();
    });

    it('should return operation details when selected', () => {
      const event = { target: { value: '1' } } as unknown as Event;
      component.onOrderSelect(event);
      component.selectedOperationId = 101;

      const details = component.selectedOperationDetails;
      expect(details).toBeTruthy();
      expect(details?.operationId).toBe(101);
    });
  });

  describe('getTotalReadyOperations', () => {
    it('should count all ready operations', () => {
      expect(component.getTotalReadyOperations()).toBe(1);
    });

    it('should return 0 when no orders', () => {
      component.availableOrders = [];
      expect(component.getTotalReadyOperations()).toBe(0);
    });
  });
});
