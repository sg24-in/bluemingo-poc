import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { OperationListComponent } from './operation-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('OperationListComponent', () => {
  let component: OperationListComponent;
  let fixture: ComponentFixture<OperationListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockOperations: any[] = [
    {
      operationId: 1,
      processId: 1,
      operationName: 'Melt Iron',
      operationCode: 'MLT-001',
      operationType: 'BATCH',
      sequenceNumber: 1,
      status: 'READY',
      targetQty: 100,
      confirmedQty: 0,
      processName: 'Melting',
      orderNumber: 'ORD-001'
    },
    {
      operationId: 2,
      processId: 1,
      operationName: 'Cast Steel',
      operationCode: 'CST-001',
      operationType: 'CONTINUOUS',
      sequenceNumber: 2,
      status: 'IN_PROGRESS',
      targetQty: 100,
      confirmedQty: 50,
      processName: 'Casting',
      orderNumber: 'ORD-001'
    },
    {
      operationId: 3,
      processId: 2,
      operationName: 'Roll Sheet',
      operationCode: 'RLL-001',
      operationType: 'CONTINUOUS',
      sequenceNumber: 1,
      status: 'BLOCKED',
      targetQty: 200,
      confirmedQty: 0,
      blockReason: 'Equipment maintenance',
      processName: 'Rolling',
      orderNumber: 'ORD-002'
    }
  ];

  // TASK-P1: Mock paged response
  const mockPagedResponse: PagedResponse<any> = {
    content: mockOperations,
    page: 0,
    size: 20,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getOperationsPaged',
      'blockOperation',
      'unblockOperation'
    ]);

    queryParamsSubject = new BehaviorSubject<any>({});

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [OperationListComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getOperationsPaged.and.returnValue(of(mockPagedResponse));

    fixture = TestBed.createComponent(OperationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TASK-P1: Pagination tests
  describe('Pagination', () => {
    it('should load operations on init', () => {
      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalled();
      expect(component.operations.length).toBe(3);
      expect(component.loading).toBeFalse();
    });

    it('should set pagination state from response', () => {
      expect(component.page).toBe(0);
      expect(component.totalElements).toBe(3);
      expect(component.totalPages).toBe(1);
      expect(component.hasNext).toBeFalse();
      expect(component.hasPrevious).toBeFalse();
    });

    it('should change page', () => {
      const page1Response: PagedResponse<any> = {
        ...mockPagedResponse,
        page: 1,
        hasPrevious: true
      };
      apiServiceSpy.getOperationsPaged.and.returnValue(of(page1Response));

      component.onPageChange(1);

      expect(component.page).toBe(1);
      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalledTimes(2);
    });

    it('should reset to first page when changing page size', () => {
      const size50Response: PagedResponse<any> = {
        ...mockPagedResponse,
        size: 50,
        page: 0
      };
      apiServiceSpy.getOperationsPaged.and.returnValue(of(size50Response));

      component.page = 2;
      component.onSizeChange(50);

      expect(component.page).toBe(0);
      expect(component.size).toBe(50);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      apiServiceSpy.getOperationsPaged.calls.reset();
    });

    it('should filter by status', () => {
      component.onFilterStatusChange('READY');

      expect(component.filterStatus).toBe('READY');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalled();
    });

    it('should clear status filter when "all" is selected', () => {
      component.filterStatus = 'READY';
      component.onFilterStatusChange('all');

      expect(component.filterStatus).toBe('');
      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalled();
    });

    it('should filter by type', () => {
      component.onFilterTypeChange('BATCH');

      expect(component.filterType).toBe('BATCH');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalled();
    });

    it('should filter by search term', () => {
      component.onSearchChange('Melt');

      expect(component.searchTerm).toBe('Melt');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalled();
    });

    it('should include filters in API request', () => {
      component.filterStatus = 'READY';
      component.filterType = 'BATCH';
      component.searchTerm = 'test';
      component.loadOperations();

      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalledWith(
        jasmine.objectContaining({
          status: 'READY',
          type: 'BATCH',
          search: 'test'
        })
      );
    });
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('IN_PROGRESS')).toBe('in-progress');
    expect(component.getStatusClass('NOT_STARTED')).toBe('not-started');
    expect(component.getStatusClass('BLOCKED')).toBe('blocked');
  });

  describe('Block Modal', () => {
    it('should open block modal', () => {
      component.openBlockModal(mockOperations[0]);
      expect(component.showBlockModal).toBeTrue();
      expect(component.operationToBlock).toEqual(mockOperations[0]);
      expect(component.blockReason).toBe('');
    });

    it('should close block modal', () => {
      component.openBlockModal(mockOperations[0]);
      component.closeBlockModal();
      expect(component.showBlockModal).toBeFalse();
      expect(component.operationToBlock).toBeNull();
      expect(component.blockReason).toBe('');
    });

    it('should not confirm block without reason', () => {
      component.operationToBlock = mockOperations[0];
      component.blockReason = '  ';
      component.confirmBlock();
      expect(apiServiceSpy.blockOperation).not.toHaveBeenCalled();
    });

    it('should confirm block with reason', () => {
      apiServiceSpy.blockOperation.and.returnValue(of({
        operationId: 1,
        previousStatus: 'READY',
        newStatus: 'BLOCKED',
        message: 'Blocked',
        updatedBy: 'admin',
        updatedOn: '2024-01-01T00:00:00'
      }));

      component.openBlockModal(mockOperations[0]);
      component.blockReason = 'Equipment issue';
      component.confirmBlock();

      expect(apiServiceSpy.blockOperation).toHaveBeenCalledWith(1, 'Equipment issue');
    });

    it('should reload operations after successful block', () => {
      apiServiceSpy.blockOperation.and.returnValue(of({
        operationId: 1,
        previousStatus: 'READY',
        newStatus: 'BLOCKED',
        message: 'Blocked',
        updatedBy: 'admin',
        updatedOn: '2024-01-01T00:00:00'
      }));

      component.openBlockModal(mockOperations[0]);
      component.blockReason = 'Equipment issue';
      apiServiceSpy.getOperationsPaged.calls.reset();
      component.confirmBlock();

      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalledTimes(1);
    });

    it('should handle block error', () => {
      apiServiceSpy.blockOperation.and.returnValue(throwError(() => ({ error: { message: 'Block failed' } })));

      component.openBlockModal(mockOperations[0]);
      component.blockReason = 'Equipment issue';
      component.confirmBlock();

      expect(component.actionError).toBe('Block failed');
      expect(component.blockLoading).toBeFalse();
    });
  });

  describe('Unblock', () => {
    it('should unblock operation', () => {
      apiServiceSpy.unblockOperation.and.returnValue(of({
        operationId: 3,
        previousStatus: 'BLOCKED',
        newStatus: 'READY',
        message: 'Unblocked',
        updatedBy: 'admin',
        updatedOn: '2024-01-01T00:00:00'
      }));

      component.unblockOperation(mockOperations[2]);

      expect(apiServiceSpy.unblockOperation).toHaveBeenCalledWith(3);
    });

    it('should reload operations after successful unblock', () => {
      apiServiceSpy.unblockOperation.and.returnValue(of({
        operationId: 3,
        previousStatus: 'BLOCKED',
        newStatus: 'READY',
        message: 'Unblocked',
        updatedBy: 'admin',
        updatedOn: '2024-01-01T00:00:00'
      }));

      apiServiceSpy.getOperationsPaged.calls.reset();
      component.unblockOperation(mockOperations[2]);

      expect(apiServiceSpy.getOperationsPaged).toHaveBeenCalledTimes(1);
    });

    it('should handle unblock error', () => {
      apiServiceSpy.unblockOperation.and.returnValue(throwError(() => ({ error: { message: 'Unblock failed' } })));

      component.unblockOperation(mockOperations[2]);

      expect(component.actionError).toBe('Unblock failed');
    });
  });

  it('should handle load error', () => {
    apiServiceSpy.getOperationsPaged.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));
    component.loadOperations();
    expect(component.error).toBe('Load failed');
    expect(component.loading).toBeFalse();
  });

  describe('Query Params', () => {
    it('should set filter from query params', () => {
      queryParamsSubject.next({ status: 'READY' });
      fixture.detectChanges();

      expect(component.filterStatus).toBe('READY');
    });

    it('should ignore invalid status from query params', () => {
      apiServiceSpy.getOperationsPaged.calls.reset();
      queryParamsSubject.next({ status: 'INVALID_STATUS' });
      fixture.detectChanges();

      // Should not set invalid status
      expect(component.filterStatus).toBe('');
    });
  });

  describe('Operation Types', () => {
    it('should have operation type options', () => {
      expect(component.operationTypes.length).toBeGreaterThan(0);
      expect(component.operationTypes).toContain('BATCH');
      expect(component.operationTypes).toContain('CONTINUOUS');
    });
  });
});
