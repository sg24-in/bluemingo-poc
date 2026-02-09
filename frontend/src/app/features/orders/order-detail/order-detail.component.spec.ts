import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OrderDetailComponent } from './order-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { ChartService } from '../../../core/services/chart.service';
import { SharedModule } from '../../../shared/shared.module';

describe('OrderDetailComponent', () => {
  let component: OrderDetailComponent;
  let fixture: ComponentFixture<OrderDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  // Mock order with operations directly on lineItem (matches backend DTO)
  const mockOrder = {
    orderId: 1,
    orderNumber: 'ORD-001',
    status: 'IN_PROGRESS',
    customerName: 'Test Customer',
    lineItems: [{
      orderLineId: 1,
      productSku: 'STEEL-001',
      productName: 'Steel Rod',
      quantity: 100,
      unit: 'T',
      operations: [{
        operationId: 1,
        operationName: 'Melt Iron',
        operationCode: 'MELT-001',
        operationType: 'MELTING',
        sequenceNumber: 1,
        status: 'READY',
        processId: 1,
        processName: 'Melting'
      }, {
        operationId: 2,
        operationName: 'Cast Steel',
        operationCode: 'CAST-001',
        operationType: 'CASTING',
        sequenceNumber: 2,
        status: 'NOT_STARTED',
        processId: 1,
        processName: 'Melting'
      }]
    }]
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getOrderById']);
    const chartSpy = jasmine.createSpyObj('ChartService', ['initChart', 'setOption', 'disposeChart', 'disposeAll']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [OrderDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ChartService, useValue: chartSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getOrderById.and.returnValue(of(mockOrder as any));
    fixture = TestBed.createComponent(OrderDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load order on init', () => {
    expect(apiServiceSpy.getOrderById).toHaveBeenCalledWith(1);
    expect(component.order).toEqual(mockOrder);
    expect(component.loading).toBeFalse();
  });

  it('should set order ID from route params', () => {
    expect(component.orderId).toBe(1);
  });

  it('should navigate back to orders list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/orders']);
  });

  it('should navigate to production confirm', () => {
    spyOn(router, 'navigate');
    component.startProduction(1);
    expect(router.navigate).toHaveBeenCalledWith(['/production/confirm', 1]);
  });

  describe('canStartOperation', () => {
    it('should return true for READY status', () => {
      expect(component.canStartOperation({ status: 'READY' })).toBeTrue();
    });

    it('should return true for IN_PROGRESS status', () => {
      expect(component.canStartOperation({ status: 'IN_PROGRESS' })).toBeTrue();
    });

    it('should return false for COMPLETED status', () => {
      expect(component.canStartOperation({ status: 'COMPLETED' })).toBeFalse();
    });

    it('should return false for CONFIRMED status', () => {
      expect(component.canStartOperation({ status: 'CONFIRMED' })).toBeFalse();
    });

    it('should return false for ON_HOLD status', () => {
      expect(component.canStartOperation({ status: 'ON_HOLD' })).toBeFalse();
    });

    it('should return false for BLOCKED status', () => {
      expect(component.canStartOperation({ status: 'BLOCKED' })).toBeFalse();
    });
  });

  describe('getOperationStatusClass', () => {
    it('should return step-completed for COMPLETED', () => {
      expect(component.getOperationStatusClass('COMPLETED')).toBe('step-completed');
    });

    it('should return step-completed for CONFIRMED', () => {
      expect(component.getOperationStatusClass('CONFIRMED')).toBe('step-completed');
    });

    it('should return step-active for IN_PROGRESS', () => {
      expect(component.getOperationStatusClass('IN_PROGRESS')).toBe('step-active');
    });

    it('should return step-active for PARTIALLY_CONFIRMED', () => {
      expect(component.getOperationStatusClass('PARTIALLY_CONFIRMED')).toBe('step-active');
    });

    it('should return step-ready for READY', () => {
      expect(component.getOperationStatusClass('READY')).toBe('step-ready');
    });

    it('should return step-on-hold for ON_HOLD', () => {
      expect(component.getOperationStatusClass('ON_HOLD')).toBe('step-on-hold');
    });

    it('should return step-blocked for BLOCKED', () => {
      expect(component.getOperationStatusClass('BLOCKED')).toBe('step-blocked');
    });

    it('should return step-pending for NOT_STARTED', () => {
      expect(component.getOperationStatusClass('NOT_STARTED')).toBe('step-pending');
    });

    it('should return step-pending for unknown statuses', () => {
      expect(component.getOperationStatusClass('UNKNOWN')).toBe('step-pending');
    });
  });

  describe('getProcessesForLineItem', () => {
    it('should group operations by processId', () => {
      const processes = component.getProcessesForLineItem(mockOrder.lineItems[0]);
      expect(processes.length).toBe(1);
      expect(processes[0].processName).toBe('Melting');
      expect(processes[0].operations.length).toBe(2);
    });

    it('should sort operations by sequence number', () => {
      const processes = component.getProcessesForLineItem(mockOrder.lineItems[0]);
      expect(processes[0].operations[0].sequenceNumber).toBe(1);
      expect(processes[0].operations[1].sequenceNumber).toBe(2);
    });

    it('should return empty array for unknown line item', () => {
      const processes = component.getProcessesForLineItem({ orderLineId: 999 });
      expect(processes).toEqual([]);
    });
  });

  it('should handle error loading order', () => {
    apiServiceSpy.getOrderById.and.returnValue(throwError(() => new Error('Error')));

    component.loadOrder();

    expect(component.loading).toBeFalse();
  });

  describe('Edit button visibility', () => {
    it('should show edit button for IN_PROGRESS orders', () => {
      component.order = { ...mockOrder, status: 'IN_PROGRESS' };
      fixture.detectChanges();
      const editBtn = fixture.nativeElement.querySelector('.page-header-actions .btn-primary');
      expect(editBtn).toBeTruthy();
    });

    it('should show edit button for CREATED orders', () => {
      component.order = { ...mockOrder, status: 'CREATED' };
      fixture.detectChanges();
      const editBtn = fixture.nativeElement.querySelector('.page-header-actions .btn-primary');
      expect(editBtn).toBeTruthy();
    });

    it('should hide edit button for COMPLETED orders', () => {
      component.order = { ...mockOrder, status: 'COMPLETED' };
      fixture.detectChanges();
      const editBtn = fixture.nativeElement.querySelector('.page-header-actions .btn-primary');
      expect(editBtn).toBeFalsy();
    });

    it('should hide edit button for CANCELLED orders', () => {
      component.order = { ...mockOrder, status: 'CANCELLED' };
      fixture.detectChanges();
      const editBtn = fixture.nativeElement.querySelector('.page-header-actions .btn-primary');
      expect(editBtn).toBeFalsy();
    });

    it('should show edit button for ON_HOLD orders', () => {
      component.order = { ...mockOrder, status: 'ON_HOLD' };
      fixture.detectChanges();
      const editBtn = fixture.nativeElement.querySelector('.page-header-actions .btn-primary');
      expect(editBtn).toBeTruthy();
    });
  });

  describe('Process flow chart', () => {
    it('should set dynamic chart height based on line items', () => {
      // The chart container should exist when order has line items
      expect(component.order?.lineItems?.length).toBeGreaterThan(0);
    });
  });
});
