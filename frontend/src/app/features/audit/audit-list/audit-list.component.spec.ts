import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { AuditListComponent } from './audit-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse, AuditEntry } from '../../../shared/models';

describe('AuditListComponent', () => {
  let component: AuditListComponent;
  let fixture: ComponentFixture<AuditListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockEntries: AuditEntry[] = [
    {
      auditId: 1,
      entityType: 'ORDER',
      entityId: 10,
      fieldName: 'status',
      oldValue: 'CREATED',
      newValue: 'IN_PROGRESS',
      action: 'STATUS_CHANGE',
      changedBy: 'admin',
      timestamp: '2024-01-15T10:30:00'
    },
    {
      auditId: 2,
      entityType: 'BATCH',
      entityId: 20,
      fieldName: undefined,
      oldValue: undefined,
      newValue: 'BATCH-001',
      action: 'CREATE',
      changedBy: 'admin',
      timestamp: '2024-01-15T11:00:00'
    },
    {
      auditId: 3,
      entityType: 'INVENTORY',
      entityId: 30,
      fieldName: 'state',
      oldValue: 'AVAILABLE',
      newValue: 'BLOCKED',
      action: 'HOLD',
      changedBy: 'operator1',
      timestamp: '2024-01-15T12:00:00'
    }
  ];

  const mockPagedResponse: PagedResponse<AuditEntry> = {
    content: mockEntries,
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
      'getAuditPaged',
      'getAuditEntityTypes',
      'getAuditActionTypes',
      'getAuditSummary'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [AuditListComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getAuditPaged.and.returnValue(of(mockPagedResponse));
    apiServiceSpy.getAuditEntityTypes.and.returnValue(of(['ORDER', 'BATCH', 'INVENTORY', 'OPERATION']));
    apiServiceSpy.getAuditActionTypes.and.returnValue(of(['CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'HOLD', 'RELEASE']));
    apiServiceSpy.getAuditSummary.and.returnValue(of({ todaysActivityCount: 42, recentActivity: [] }));

    fixture = TestBed.createComponent(AuditListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load paginated audit entries on init', () => {
      expect(apiServiceSpy.getAuditPaged).toHaveBeenCalled();
      expect(component.entries.length).toBe(3);
      expect(component.loading).toBeFalse();
    });

    it('should load entity types and action types', () => {
      expect(component.entityTypes.length).toBe(4);
      expect(component.actionTypes.length).toBe(6);
    });

    it('should load todays count from summary', () => {
      expect(component.todaysCount).toBe(42);
    });

    it('should set pagination defaults', () => {
      expect(component.currentPage).toBe(0);
      expect(component.pageSize).toBe(20);
      expect(component.totalElements).toBe(3);
      expect(component.totalPages).toBe(1);
    });
  });

  describe('Pagination', () => {
    it('should call API with page parameters', () => {
      component.loadPaged();
      const callArgs = apiServiceSpy.getAuditPaged.calls.mostRecent().args[0] as any;
      expect(callArgs?.page).toBe(0);
      expect(callArgs?.size).toBe(20);
    });

    it('should navigate to next page', () => {
      const multiPageResponse: PagedResponse<AuditEntry> = {
        ...mockPagedResponse,
        totalElements: 50,
        totalPages: 3,
        hasNext: true,
        last: false
      };
      apiServiceSpy.getAuditPaged.and.returnValue(of(multiPageResponse));
      component.loadPaged();

      component.onPageChange(1);
      expect(component.currentPage).toBe(1);
      expect(apiServiceSpy.getAuditPaged).toHaveBeenCalled();
    });

    it('should go to first page', () => {
      component.currentPage = 2;
      component.onPageChange(0);
      expect(component.currentPage).toBe(0);
    });

    it('should change page size and reset to first page', () => {
      component.currentPage = 2;
      component.pageSize = 50;
      component.onPageSizeChange();
      expect(component.currentPage).toBe(0);
      expect(apiServiceSpy.getAuditPaged).toHaveBeenCalled();
    });

    it('should calculate start index correctly', () => {
      component.currentPage = 0;
      component.pageSize = 20;
      component.totalElements = 50;
      expect(component.startIndex).toBe(1);

      component.currentPage = 1;
      expect(component.startIndex).toBe(21);
    });

    it('should calculate end index correctly', () => {
      component.currentPage = 0;
      component.pageSize = 20;
      component.totalElements = 50;
      expect(component.endIndex).toBe(20);

      component.currentPage = 2;
      expect(component.endIndex).toBe(50);
    });

    it('should generate page numbers around current page', () => {
      component.totalPages = 10;
      component.currentPage = 5;
      expect(component.pages).toEqual([3, 4, 5, 6, 7]);
    });

    it('should handle pages at start', () => {
      component.totalPages = 10;
      component.currentPage = 0;
      expect(component.pages).toEqual([0, 1, 2, 3, 4]);
    });

    it('should handle pages at end', () => {
      component.totalPages = 10;
      component.currentPage = 9;
      // Pages are calculated as: start = max(0, currentPage - 2) = 7, end = min(10, 7 + 5) = 10
      expect(component.pages).toEqual([7, 8, 9]);
    });
  });

  describe('Filtering', () => {
    it('should include entityType filter in request', () => {
      component.filterEntityType = 'ORDER';
      component.onFilterChange();
      const callArgs = apiServiceSpy.getAuditPaged.calls.mostRecent().args[0] as any;
      expect(callArgs?.entityType).toBe('ORDER');
    });

    it('should include action filter in request', () => {
      component.filterAction = 'CREATE';
      component.onFilterChange();
      const callArgs = apiServiceSpy.getAuditPaged.calls.mostRecent().args[0] as any;
      expect(callArgs?.action).toBe('CREATE');
    });

    it('should include search filter in request', () => {
      component.filterUser = 'admin';
      component.onFilterChange();
      const callArgs = apiServiceSpy.getAuditPaged.calls.mostRecent().args[0] as any;
      expect(callArgs?.search).toBe('admin');
    });

    it('should reset to first page when filter changes', () => {
      component.currentPage = 3;
      component.filterEntityType = 'BATCH';
      component.onFilterChange();
      expect(component.currentPage).toBe(0);
    });

    it('should not include filter when set to all', () => {
      component.filterEntityType = 'all';
      component.filterAction = 'all';
      component.onFilterChange();
      const callArgs = apiServiceSpy.getAuditPaged.calls.mostRecent().args[0] as any;
      expect(callArgs?.entityType).toBeUndefined();
      expect(callArgs?.action).toBeUndefined();
    });

    it('should clear all filters and reload', () => {
      component.filterEntityType = 'ORDER';
      component.filterAction = 'CREATE';
      component.filterUser = 'test';
      component.currentPage = 2;

      component.clearFilters();

      expect(component.filterEntityType).toBe('all');
      expect(component.filterAction).toBe('all');
      expect(component.filterUser).toBe('');
      expect(component.currentPage).toBe(0);
      expect(apiServiceSpy.getAuditPaged).toHaveBeenCalled();
    });
  });

  describe('Action Styling', () => {
    it('should return correct action class', () => {
      expect(component.getActionClass('CREATE')).toBe('action-create');
      expect(component.getActionClass('UPDATE')).toBe('action-update');
      expect(component.getActionClass('DELETE')).toBe('action-delete');
      expect(component.getActionClass('STATUS_CHANGE')).toBe('action-status');
      expect(component.getActionClass('HOLD')).toBe('action-hold');
      expect(component.getActionClass('RELEASE')).toBe('action-release');
      expect(component.getActionClass('CONSUME')).toBe('action-consume');
      expect(component.getActionClass('PRODUCE')).toBe('action-produce');
      expect(component.getActionClass('UNKNOWN')).toBe('');
    });

    it('should return correct action icon', () => {
      expect(component.getActionIcon('CREATE')).toBe('circle-plus');
      expect(component.getActionIcon('UPDATE')).toBe('pencil');
      expect(component.getActionIcon('DELETE')).toBe('trash');
      expect(component.getActionIcon('STATUS_CHANGE')).toBe('arrows-rotate');
      expect(component.getActionIcon('HOLD')).toBe('circle-pause');
      expect(component.getActionIcon('RELEASE')).toBe('circle-play');
      expect(component.getActionIcon('CONSUME')).toBe('download');
      expect(component.getActionIcon('PRODUCE')).toBe('upload');
      expect(component.getActionIcon('UNKNOWN')).toBe('clock-rotate-left');
    });
  });

  describe('Formatting', () => {
    it('should format entity type', () => {
      expect(component.formatEntityType('ORDER_LINE')).toBe('ORDER LINE');
      expect(component.formatEntityType('PRODUCTION_CONFIRMATION')).toBe('PRODUCTION CONFIRMATION');
      expect(component.formatEntityType('ORDER')).toBe('ORDER');
    });

    it('should format timestamp', () => {
      const result = component.formatTimestamp('2024-01-15T10:30:00');
      expect(result).toContain('2024');
    });

    it('should handle null timestamp', () => {
      expect(component.formatTimestamp(null as any)).toBe('-');
      expect(component.formatTimestamp('')).toBe('-');
    });
  });

  describe('Entry Selection', () => {
    it('should toggle selected entry', () => {
      component.selectEntry(mockEntries[0]);
      expect(component.selectedEntry).toEqual(mockEntries[0]);

      component.selectEntry(mockEntries[0]);
      expect(component.selectedEntry).toBeNull();
    });

    it('should select different entry', () => {
      component.selectEntry(mockEntries[0]);
      component.selectEntry(mockEntries[1]);
      expect(component.selectedEntry).toEqual(mockEntries[1]);
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      apiServiceSpy.getAuditPaged.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));
      component.loadPaged();
      expect(component.error).toBe('Load failed');
      expect(component.loading).toBeFalse();
    });

    it('should show default error message', () => {
      apiServiceSpy.getAuditPaged.and.returnValue(throwError(() => ({})));
      component.loadPaged();
      expect(component.error).toBe('Failed to load audit trail.');
    });
  });
});
