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

  describe('Edit Button Visibility - BF-12', () => {
    it('should show edit button when order is IN_PROGRESS', () => {
      // Default mockOrder has status IN_PROGRESS
      const editBtn = fixture.nativeElement.querySelector('.btn-primary');
      expect(editBtn).toBeTruthy();
      expect(editBtn.textContent).toContain('Edit Order');
    });

    it('should hide edit button when order is COMPLETED', () => {
      const completedOrder = { ...mockOrder, status: 'COMPLETED' };
      apiServiceSpy.getOrderById.and.returnValue(of(completedOrder as any));
      component.loadOrder();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.btn-primary');
      const editBtn = Array.from(buttons).find((btn: any) => btn.textContent.includes('Edit Order'));
      expect(editBtn).toBeFalsy();
    });

    it('should hide edit button when order is CANCELLED', () => {
      const cancelledOrder = { ...mockOrder, status: 'CANCELLED' };
      apiServiceSpy.getOrderById.and.returnValue(of(cancelledOrder as any));
      component.loadOrder();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.btn-primary');
      const editBtn = Array.from(buttons).find((btn: any) => btn.textContent.includes('Edit Order'));
      expect(editBtn).toBeFalsy();
    });

    it('should show edit button when order is CREATED', () => {
      const createdOrder = { ...mockOrder, status: 'CREATED' };
      apiServiceSpy.getOrderById.and.returnValue(of(createdOrder as any));
      component.loadOrder();
      fixture.detectChanges();

      const buttons = fixture.nativeElement.querySelectorAll('.btn-primary');
      const editBtn = Array.from(buttons).find((btn: any) => btn.textContent.includes('Edit Order'));
      expect(editBtn).toBeTruthy();
    });
  });

  describe('Flow Chart Layout - BF-11', () => {
    it('should calculate correct statistics for multi-process orders', () => {
      // mockOrder has 2 operations: READY and NOT_STARTED
      expect(component.getTotalOperations()).toBe(2);
      expect(component.getCompletedOperations()).toBe(0);
      expect(component.getReadyOperations()).toBe(1);
    });

    it('should return correct completion percentage', () => {
      // 0 completed out of 2 operations = 0%
      expect(component.getCompletionPercentage()).toBe(0);
    });
  });

  // ===== Phase 2: Additional coverage tests =====

  it('should navigate to edit page when editOrder called', () => {
    spyOn(router, 'navigate');
    component.editOrder();
    expect(router.navigate).toHaveBeenCalledWith(['/orders', 1, 'edit']);
  });

  describe('Statistics with mixed statuses', () => {
    const mixedOrder = {
      orderId: 2,
      orderNumber: 'ORD-002',
      status: 'IN_PROGRESS',
      customerName: 'Test',
      lineItems: [{
        orderLineId: 10,
        productSku: 'P-001',
        productName: 'Product',
        quantity: 100,
        unit: 'T',
        operations: [
          { operationId: 10, operationName: 'Op1', operationCode: 'O1', sequenceNumber: 1, status: 'CONFIRMED', processId: 1, processName: 'P' },
          { operationId: 11, operationName: 'Op2', operationCode: 'O2', sequenceNumber: 2, status: 'COMPLETED', processId: 1, processName: 'P' },
          { operationId: 12, operationName: 'Op3', operationCode: 'O3', sequenceNumber: 3, status: 'IN_PROGRESS', processId: 1, processName: 'P' },
          { operationId: 13, operationName: 'Op4', operationCode: 'O4', sequenceNumber: 4, status: 'PARTIALLY_CONFIRMED', processId: 1, processName: 'P' },
          { operationId: 14, operationName: 'Op5', operationCode: 'O5', sequenceNumber: 5, status: 'NOT_STARTED', processId: 1, processName: 'P' },
          { operationId: 15, operationName: 'Op6', operationCode: 'O6', sequenceNumber: 6, status: 'ON_HOLD', processId: 1, processName: 'P' },
          { operationId: 16, operationName: 'Op7', operationCode: 'O7', sequenceNumber: 7, status: 'BLOCKED', processId: 1, processName: 'P' },
          { operationId: 17, operationName: 'Op8', operationCode: 'O8', sequenceNumber: 8, status: 'READY', processId: 1, processName: 'P' }
        ]
      }]
    };

    beforeEach(() => {
      apiServiceSpy.getOrderById.and.returnValue(of(mixedOrder as any));
      component.loadOrder();
      fixture.detectChanges();
    });

    it('should count in-progress operations including PARTIALLY_CONFIRMED', () => {
      // IN_PROGRESS + PARTIALLY_CONFIRMED = 2
      expect(component.getInProgressOperations()).toBe(2);
    });

    it('should count pending operations including ON_HOLD and BLOCKED', () => {
      // NOT_STARTED + ON_HOLD + BLOCKED = 3
      expect(component.getPendingOperations()).toBe(3);
    });

    it('should count completed operations including CONFIRMED', () => {
      // CONFIRMED + COMPLETED = 2
      expect(component.getCompletedOperations()).toBe(2);
    });

    it('should calculate completion percentage from completed operations', () => {
      // 2 completed out of 8 total = 25%
      expect(component.getCompletionPercentage()).toBe(25);
    });

    it('should calculate line item progress as percentage of completed operations', () => {
      // 2 completed out of 8 = 25%
      expect(component.getLineItemProgress(mixedOrder.lineItems[0])).toBe(25);
    });
  });

  describe('getOperationIcon', () => {
    it('should return check icon for COMPLETED status', () => {
      expect(component.getOperationIcon('COMPLETED')).toBe('fa-check');
    });

    it('should return check icon for CONFIRMED status', () => {
      expect(component.getOperationIcon('CONFIRMED')).toBe('fa-check');
    });

    it('should return spinner icon for IN_PROGRESS status', () => {
      expect(component.getOperationIcon('IN_PROGRESS')).toBe('fa-spinner fa-spin');
    });

    it('should return play icon for READY status', () => {
      expect(component.getOperationIcon('READY')).toBe('fa-play');
    });

    it('should return pause icon for ON_HOLD status', () => {
      expect(component.getOperationIcon('ON_HOLD')).toBe('fa-pause');
    });

    it('should return ban icon for BLOCKED status', () => {
      expect(component.getOperationIcon('BLOCKED')).toBe('fa-ban');
    });

    it('should return circle icon for NOT_STARTED status', () => {
      expect(component.getOperationIcon('NOT_STARTED')).toBe('fa-circle');
    });

    it('should return circle icon for unknown status', () => {
      expect(component.getOperationIcon('UNKNOWN')).toBe('fa-circle');
    });
  });

  describe('UI state toggles', () => {
    it('should toggle flow chart collapsed state', () => {
      expect(component.flowChartCollapsed).toBeFalse();
      component.toggleFlowChart();
      expect(component.flowChartCollapsed).toBeTrue();
      component.toggleFlowChart();
      expect(component.flowChartCollapsed).toBeFalse();
    });

    it('should toggle line item collapsed state', () => {
      expect(component.isLineItemCollapsed(1)).toBeFalse();
      component.toggleLineItem(1);
      expect(component.isLineItemCollapsed(1)).toBeTrue();
      component.toggleLineItem(1);
      expect(component.isLineItemCollapsed(1)).toBeFalse();
    });
  });

  it('should dispose all charts on destroy', () => {
    const chartSpy = TestBed.inject(ChartService) as jasmine.SpyObj<ChartService>;
    component.ngOnDestroy();
    expect(chartSpy.disposeAll).toHaveBeenCalled();
  });
});
