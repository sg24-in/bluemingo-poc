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

  const mockOrder = {
    orderId: 1,
    orderNumber: 'ORD-001',
    status: 'IN_PROGRESS',
    customerName: 'Test Customer',
    lineItems: [{
      lineItemId: 1,
      productSku: 'STEEL-001',
      productName: 'Steel Rod',
      quantity: 100,
      processes: [{
        processId: 1,
        stageName: 'Melting',
        status: 'IN_PROGRESS',
        operations: [{
          operationId: 1,
          operationName: 'Melt Iron',
          status: 'PENDING'
        }]
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
    it('should return true for PENDING status', () => {
      expect(component.canStartOperation({ status: 'PENDING' })).toBeTrue();
    });

    it('should return true for IN_PROGRESS status', () => {
      expect(component.canStartOperation({ status: 'IN_PROGRESS' })).toBeTrue();
    });

    it('should return false for COMPLETED status', () => {
      expect(component.canStartOperation({ status: 'COMPLETED' })).toBeFalse();
    });
  });

  describe('getOperationStatusClass', () => {
    it('should return step-completed for COMPLETED', () => {
      expect(component.getOperationStatusClass('COMPLETED')).toBe('step-completed');
    });

    it('should return step-active for IN_PROGRESS', () => {
      expect(component.getOperationStatusClass('IN_PROGRESS')).toBe('step-active');
    });

    it('should return step-pending for other statuses', () => {
      expect(component.getOperationStatusClass('PENDING')).toBe('step-pending');
      expect(component.getOperationStatusClass('NOT_STARTED')).toBe('step-pending');
    });
  });

  it('should handle error loading order', () => {
    apiServiceSpy.getOrderById.and.returnValue(throwError(() => new Error('Error')));

    component.loadOrder();

    expect(component.loading).toBeFalse();
  });
});
