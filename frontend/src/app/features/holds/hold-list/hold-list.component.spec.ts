import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { HoldListComponent } from './hold-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { Hold } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('HoldListComponent', () => {
  let component: HoldListComponent;
  let fixture: ComponentFixture<HoldListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockHolds: Hold[] = [
    {
      holdId: 1,
      entityType: 'OPERATION',
      entityId: 1,
      entityName: 'Test Operation',
      reason: 'Equipment Breakdown',
      appliedBy: 'admin',
      appliedOn: new Date().toISOString(),
      status: 'ACTIVE',
      durationMinutes: 30
    }
  ];

  const mockPagedResponse: PagedResponse<Hold> = {
    content: mockHolds,
    page: 0,
    size: 20,
    totalElements: 1,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  const mockHoldReasons = [
    { reasonCode: 'EQUIPMENT', reasonDescription: 'Equipment Breakdown' },
    { reasonCode: 'QUALITY', reasonDescription: 'Quality Issue' }
  ];

  const mockOrders = [
    {
      orderId: 1,
      processes: [
        {
          processId: 1,
          stageName: 'Stage 1',
          status: 'IN_PROGRESS',
          operations: [
            { operationId: 1, operationName: 'Op 1', status: 'READY' }
          ]
        }
      ]
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getHoldsPaged',
      'getHoldReasons',
      'getAvailableOrders',
      'getAllInventory',
      'getAllBatches',
      'applyHold',
      'releaseHold'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule,
        SharedModule
      ],
      declarations: [HoldListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getHoldsPaged.and.returnValue(of(mockPagedResponse));
    apiServiceSpy.getHoldReasons.and.returnValue(of(mockHoldReasons as any));
    apiServiceSpy.getAvailableOrders.and.returnValue(of(mockOrders as any));
    apiServiceSpy.getAllInventory.and.returnValue(of([] as any));
    apiServiceSpy.getAllBatches.and.returnValue(of([] as any));

    fixture = TestBed.createComponent(HoldListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load holds on init', () => {
    expect(apiServiceSpy.getHoldsPaged).toHaveBeenCalled();
    expect(component.holds.length).toBe(1);
  });

  it('should load hold reasons on init', () => {
    expect(apiServiceSpy.getHoldReasons).toHaveBeenCalled();
    expect(component.holdReasons.length).toBe(2);
  });

  it('should display holds in table', () => {
    expect(component.holds[0].entityType).toBe('OPERATION');
    expect(component.holds[0].reason).toBe('Equipment Breakdown');
  });

  it('should set pagination state from response', () => {
    expect(component.page).toBe(0);
    expect(component.totalElements).toBe(1);
    expect(component.totalPages).toBe(1);
  });

  describe('Apply Hold', () => {
    it('should open apply hold modal', () => {
      component.openApplyHoldModal();
      expect(component.showApplyHoldModal).toBe(true);
    });

    it('should close apply hold modal', () => {
      component.showApplyHoldModal = true;
      component.closeApplyHoldModal();
      expect(component.showApplyHoldModal).toBe(false);
    });

    it('should apply hold successfully', () => {
      const mockResponse = { holdId: 2, status: 'ACTIVE' } as any;
      apiServiceSpy.applyHold.and.returnValue(of(mockResponse));

      component.applyHoldForm.patchValue({
        entityType: 'OPERATION',
        entityId: 1,
        reason: 'EQUIPMENT'
      });

      component.applyHold();

      expect(apiServiceSpy.applyHold).toHaveBeenCalled();
      expect(component.success).toBe('Hold applied successfully');
    });

    it('should handle apply hold error', () => {
      apiServiceSpy.applyHold.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

      component.applyHoldForm.patchValue({
        entityType: 'OPERATION',
        entityId: 1,
        reason: 'EQUIPMENT'
      });

      component.applyHold();

      expect(component.error).toBeTruthy();
    });

    it('should not apply hold with invalid form', () => {
      component.applyHoldForm.patchValue({
        entityType: '',
        entityId: '',
        reason: ''
      });

      component.applyHold();

      expect(apiServiceSpy.applyHold).not.toHaveBeenCalled();
    });
  });

  describe('Release Hold', () => {
    it('should open release hold modal', () => {
      const hold = mockHolds[0];
      component.openReleaseHoldModal(hold);
      expect(component.showReleaseHoldModal).toBe(true);
      expect(component.selectedHold).toEqual(hold);
    });

    it('should close release hold modal', () => {
      component.showReleaseHoldModal = true;
      component.selectedHold = mockHolds[0];
      component.closeReleaseHoldModal();
      expect(component.showReleaseHoldModal).toBe(false);
      expect(component.selectedHold).toBeNull();
    });

    it('should release hold successfully', () => {
      const mockResponse = { holdId: 1, status: 'RELEASED' } as any;
      apiServiceSpy.releaseHold.and.returnValue(of(mockResponse));

      component.selectedHold = mockHolds[0];
      component.releaseComments = 'Issue resolved';

      component.releaseHold();

      expect(apiServiceSpy.releaseHold).toHaveBeenCalledWith(1, 'Issue resolved');
      expect(component.success).toBe('Hold released successfully');
    });

    it('should handle release hold error', () => {
      apiServiceSpy.releaseHold.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

      component.selectedHold = mockHolds[0];
      component.releaseHold();

      expect(component.error).toBeTruthy();
    });

    it('should not release hold without selected hold', () => {
      component.selectedHold = null;
      component.releaseHold();
      expect(apiServiceSpy.releaseHold).not.toHaveBeenCalled();
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Reset call counts
      apiServiceSpy.getHoldsPaged.calls.reset();
    });

    it('should change page', () => {
      // Mock response with new page
      const page1Response: PagedResponse<Hold> = {
        ...mockPagedResponse,
        page: 1
      };
      apiServiceSpy.getHoldsPaged.and.returnValue(of(page1Response));

      component.onPageChange(1);
      expect(component.page).toBe(1);
      expect(apiServiceSpy.getHoldsPaged).toHaveBeenCalledTimes(1);
    });

    it('should change page size and reset to first page', () => {
      // Mock response with new size
      const size50Response: PagedResponse<Hold> = {
        ...mockPagedResponse,
        size: 50,
        page: 0
      };
      apiServiceSpy.getHoldsPaged.and.returnValue(of(size50Response));

      component.page = 2;
      component.onSizeChange(50);
      expect(component.size).toBe(50);
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getHoldsPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by status', () => {
      component.onFilterStatusChange('ACTIVE');
      expect(component.filterStatus).toBe('ACTIVE');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getHoldsPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by entity type', () => {
      component.onFilterEntityTypeChange('OPERATION');
      expect(component.filterEntityType).toBe('OPERATION');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getHoldsPaged).toHaveBeenCalledTimes(1);
    });

    it('should search', () => {
      component.onSearchChange('test');
      expect(component.searchTerm).toBe('test');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getHoldsPaged).toHaveBeenCalledTimes(1);
    });
  });

  describe('Utility functions', () => {
    it('should format duration correctly', () => {
      expect(component.formatDuration(30)).toBe('30m');
      expect(component.formatDuration(90)).toBe('1h 30m');
      expect(component.formatDuration(0)).toBe('-');
      expect(component.formatDuration(undefined as any)).toBe('-');
    });

    it('should get entity options based on selected type', () => {
      component.applyHoldForm.patchValue({ entityType: 'OPERATION' });
      const options = component.getEntityOptions();
      expect(options).toEqual(component.operations);
    });

    it('should return empty array for no entity type', () => {
      component.applyHoldForm.patchValue({ entityType: '' });
      const options = component.getEntityOptions();
      expect(options).toEqual([]);
    });
  });
});
