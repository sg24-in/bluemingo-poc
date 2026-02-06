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
    activeHolds: 1,
    todayConfirmations: 4,
    recentActivity: [
      { confirmationId: 1, operationName: 'Melting', productSku: 'STEEL-001', producedQty: 100 }
    ],
    auditActivity: [
      { auditId: 1, entityType: 'BATCH', entityId: 1, action: 'CREATE', description: 'Created batch #1', changedBy: 'admin', timestamp: '2024-01-01T10:00:00' },
      { auditId: 2, entityType: 'OPERATION', entityId: 1, action: 'STATUS_CHANGE', description: 'Operation #1 status: READY → CONFIRMED', changedBy: 'admin', timestamp: '2024-01-01T10:05:00' }
    ]
  };

  const mockOrders = [
    { orderId: 1, orderNumber: 'ORD-001', status: 'IN_PROGRESS', lineItems: [{ productName: 'Steel' }] }
  ];

  const mockBatches = [
    { batchId: 1, batchNumber: 'BATCH-001', materialId: 'RM-001', status: 'AVAILABLE' }
  ];

  const mockInventory = [
    { inventoryId: 1, state: 'AVAILABLE' },
    { inventoryId: 2, state: 'CONSUMED' },
    { inventoryId: 3, state: 'ON_HOLD' }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getDashboardSummary',
      'getAvailableOrders',
      'getAllBatches',
      'getAllInventory',
      'getOrders',
      'getQualityPendingProcesses'
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
    apiServiceSpy.getAllInventory.and.returnValue(of(mockInventory as any));
    apiServiceSpy.getQualityPendingProcesses.and.returnValue(of([]));
    apiServiceSpy.getOrders.and.returnValue(of(mockOrders as any));

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
    expect(apiServiceSpy.getAllInventory).toHaveBeenCalled();
  });

  it('should display summary data', () => {
    expect(component.summary.totalOrders).toBe(10);
    expect(component.summary.operationsReady).toBe(3);
    expect(component.summary.activeHolds).toBe(1);
    expect(component.summary.todayConfirmations).toBe(4);
  });

  it('should calculate inventory summary', () => {
    expect(component.inventorySummary.total).toBe(3);
    expect(component.inventorySummary.available).toBe(1);
    expect(component.inventorySummary.consumed).toBe(1);
    expect(component.inventorySummary.onHold).toBe(1);
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

  describe('navigation', () => {
    it('should navigate to orders', () => {
      const router = TestBed.inject(RouterTestingModule);
      spyOn(component['router'], 'navigate');

      component.navigateToOrders();

      expect(component['router'].navigate).toHaveBeenCalledWith(['/orders']);
    });

    it('should navigate to holds', () => {
      spyOn(component['router'], 'navigate');

      component.navigateToHolds();

      expect(component['router'].navigate).toHaveBeenCalledWith(['/holds']);
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
  });

  describe('audit trail', () => {
    it('should have audit activity from summary', () => {
      expect(component.summary.auditActivity.length).toBe(2);
      expect(component.summary.auditActivity[0].action).toBe('CREATE');
    });

    it('should return correct icon for CREATE action', () => {
      expect(component.getAuditIcon('CREATE')).toBe('fa-plus');
    });

    it('should return correct icon for STATUS_CHANGE action', () => {
      expect(component.getAuditIcon('STATUS_CHANGE')).toBe('fa-arrows-left-right');
    });

    it('should return correct icon for CONSUME action', () => {
      expect(component.getAuditIcon('CONSUME')).toBe('fa-minus');
    });

    it('should return correct icon for PRODUCE action', () => {
      expect(component.getAuditIcon('PRODUCE')).toBe('fa-gear');
    });

    it('should return correct icon for HOLD action', () => {
      expect(component.getAuditIcon('HOLD')).toBe('fa-pause');
    });

    it('should return correct icon for RELEASE action', () => {
      expect(component.getAuditIcon('RELEASE')).toBe('fa-play');
    });

    it('should return default icon for unknown action', () => {
      expect(component.getAuditIcon('UNKNOWN')).toBe('fa-circle-dot');
    });

    it('should return correct icon class for CREATE action', () => {
      expect(component.getAuditIconClass('CREATE')).toBe('audit-icon-create');
    });

    it('should return correct icon class for STATUS_CHANGE action', () => {
      expect(component.getAuditIconClass('STATUS_CHANGE')).toBe('audit-icon-status');
    });

    it('should return correct icon class for CONSUME action', () => {
      expect(component.getAuditIconClass('CONSUME')).toBe('audit-icon-consume');
    });

    it('should return correct icon class for PRODUCE action', () => {
      expect(component.getAuditIconClass('PRODUCE')).toBe('audit-icon-produce');
    });

    it('should return correct icon class for HOLD action', () => {
      expect(component.getAuditIconClass('HOLD')).toBe('audit-icon-hold');
    });

    it('should return correct icon class for RELEASE action', () => {
      expect(component.getAuditIconClass('RELEASE')).toBe('audit-icon-release');
    });

    it('should return default icon class for unknown action', () => {
      expect(component.getAuditIconClass('UNKNOWN')).toBe('audit-icon-default');
    });
  });
});
