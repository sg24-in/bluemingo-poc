import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of } from 'rxjs';

import { DashboardComponent } from './dashboard.component';
import { ApiService } from '../../../core/services/api.service';
import { ChartService } from '../../../core/services/chart.service';
import { SharedModule } from '../../../shared/shared.module';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockSummary = {
    totalOrders: 10,
    ordersInProgress: 5,
    operationsReady: 3,
    operationsInProgress: 2,
    todayConfirmations: 4,
    batchesPendingApproval: 2,
    recentActivity: [
      { confirmationId: 1, operationName: 'Melting', productSku: 'STEEL-001', producedQty: 100 }
    ]
  };

  const mockOrders = [
    { orderId: 1, orderNumber: 'ORD-001', status: 'IN_PROGRESS', lineItems: [{ productName: 'Steel' }] }
  ];

  const mockBatches = [
    { batchId: 1, batchNumber: 'BATCH-001', materialId: 'RM-001', status: 'AVAILABLE' }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getDashboardSummary',
      'getAvailableOrders',
      'getAllBatches',
      'getOrders',
      'getAllOperations',
      'getBatchesByStatus'
    ]);

    const chartSpy = jasmine.createSpyObj('ChartService', [
      'initChart',
      'setOption',
      'disposeChart',
      'disposeAll'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [DashboardComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ChartService, useValue: chartSpy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getDashboardSummary.and.returnValue(of(mockSummary as any));
    apiServiceSpy.getAvailableOrders.and.returnValue(of(mockOrders as any));
    apiServiceSpy.getAllBatches.and.returnValue(of(mockBatches as any));
    apiServiceSpy.getBatchesByStatus.and.returnValue(of([]));
    apiServiceSpy.getOrders.and.returnValue(of(mockOrders as any));
    apiServiceSpy.getAllOperations.and.returnValue(of([
      { operationId: 1, operationName: 'Melting', status: 'CONFIRMED' },
      { operationId: 2, operationName: 'Casting', status: 'IN_PROGRESS' }
    ] as any));

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load dashboard data on init', () => {
    expect(apiServiceSpy.getDashboardSummary).toHaveBeenCalled();
    expect(apiServiceSpy.getAvailableOrders).toHaveBeenCalled();
    expect(apiServiceSpy.getAllBatches).toHaveBeenCalled();
  });

  it('should display summary data', () => {
    expect(component.summary.totalOrders).toBe(10);
    expect(component.summary.operationsReady).toBe(3);
    expect(component.summary.todayConfirmations).toBe(4);
  });

  it('should limit available orders to 5', () => {
    expect(component.availableOrders.length).toBeLessThanOrEqual(5);
  });

  it('should limit recent batches to 5', () => {
    expect(component.recentBatches.length).toBeLessThanOrEqual(5);
  });

  it('should set loading to false after data loads', () => {
    expect(component.loading).toBe(false);
  });

  it('should have recent activity from summary', () => {
    expect(component.summary.recentActivity.length).toBe(1);
    expect(component.summary.recentActivity[0].operationName).toBe('Melting');
  });

  it('should load batches pending approval', () => {
    expect(apiServiceSpy.getBatchesByStatus).toHaveBeenCalledWith('QUALITY_PENDING');
  });

  describe('navigation', () => {
    it('should navigate to orders', () => {
      spyOn(component['router'], 'navigate');

      component.navigateToOrders();

      expect(component['router'].navigate).toHaveBeenCalledWith(['/orders']);
    });

    it('should navigate to batches', () => {
      spyOn(component['router'], 'navigate');

      component.navigateToBatches();

      expect(component['router'].navigate).toHaveBeenCalledWith(['/batches']);
    });

    it('should navigate to specific order', () => {
      spyOn(component['router'], 'navigate');

      component.navigateToOrder(1);

      expect(component['router'].navigate).toHaveBeenCalledWith(['/orders', 1]);
    });

    it('should navigate to specific batch', () => {
      spyOn(component['router'], 'navigate');

      component.navigateToBatch(1);

      expect(component['router'].navigate).toHaveBeenCalledWith(['/batches', 1]);
    });

    it('should navigate to operations by status (goes to orders)', () => {
      spyOn(component['router'], 'navigate');

      component.navigateToOperationsByStatus('READY');

      // Note: In the component, this navigates to /orders (operations are shown in order detail)
      expect(component['router'].navigate).toHaveBeenCalledWith(['/orders']);
    });

    it('should navigate to batch approval (QUALITY_PENDING)', () => {
      spyOn(component['router'], 'navigate');

      component.navigateToBatchApproval();

      expect(component['router'].navigate).toHaveBeenCalledWith(['/batches'], { queryParams: { status: 'QUALITY_PENDING' } });
    });
  });
});
