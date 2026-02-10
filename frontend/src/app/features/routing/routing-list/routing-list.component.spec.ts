import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RoutingListComponent } from './routing-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('RoutingListComponent', () => {
  let component: RoutingListComponent;
  let fixture: ComponentFixture<RoutingListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockRoutings: any[] = [
    {
      routingId: 1,
      processId: 1,
      processName: 'Melting Process',
      routingName: 'Standard Melting',
      routingType: 'SEQUENTIAL',
      status: 'ACTIVE',
      createdOn: '2024-01-01T00:00:00',
      createdBy: 'admin',
      steps: [
        { routingStepId: 1, sequenceNumber: 1, operationName: 'Melt', operationType: 'MELTING', isParallel: false, mandatoryFlag: true, producesOutputBatch: true, allowsSplit: false, allowsMerge: false, status: 'ACTIVE' }
      ]
    },
    {
      routingId: 2,
      processId: 2,
      processName: 'Casting Process',
      routingName: 'Fast Casting',
      routingType: 'PARALLEL',
      status: 'DRAFT',
      createdOn: '2024-01-02T00:00:00',
      createdBy: 'admin',
      steps: []
    },
    {
      routingId: 3,
      processId: 1,
      processName: 'Melting Process',
      routingName: 'Alternate Melting',
      routingType: 'SEQUENTIAL',
      status: 'INACTIVE',
      createdOn: '2024-01-03T00:00:00',
      createdBy: 'admin',
      steps: []
    },
    {
      routingId: 4,
      processId: 3,
      processName: 'Rolling Process',
      routingName: 'On Hold Routing',
      routingType: 'SEQUENTIAL',
      status: 'ON_HOLD',
      createdOn: '2024-01-04T00:00:00',
      createdBy: 'admin',
      steps: []
    }
  ];

  // TASK-P2: Mock paged response
  const mockPagedResponse: PagedResponse<any> = {
    content: mockRoutings,
    page: 0,
    size: 20,
    totalElements: 4,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getRoutingsPaged',
      'activateRouting',
      'deactivateRouting',
      'putRoutingOnHold',
      'releaseRoutingFromHold',
      'deleteRouting'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [RoutingListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getRoutingsPaged.and.returnValue(of(mockPagedResponse));

    fixture = TestBed.createComponent(RoutingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TASK-P2: Pagination tests
  describe('Pagination', () => {
    it('should load routings on init', () => {
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalled();
      expect(component.routings.length).toBe(4);
      expect(component.loading).toBeFalse();
    });

    it('should set pagination state from response', () => {
      expect(component.page).toBe(0);
      expect(component.totalElements).toBe(4);
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
      apiServiceSpy.getRoutingsPaged.and.returnValue(of(page1Response));

      component.onPageChange(1);

      expect(component.page).toBe(1);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalledTimes(2);
    });

    it('should reset to first page when changing page size', () => {
      const size50Response: PagedResponse<any> = {
        ...mockPagedResponse,
        size: 50,
        page: 0
      };
      apiServiceSpy.getRoutingsPaged.and.returnValue(of(size50Response));

      component.page = 2;
      component.onSizeChange(50);

      expect(component.page).toBe(0);
      expect(component.size).toBe(50);
    });
  });

  describe('Filtering', () => {
    beforeEach(() => {
      apiServiceSpy.getRoutingsPaged.calls.reset();
    });

    it('should filter by status', () => {
      component.onFilterStatusChange('ACTIVE');

      expect(component.filterStatus).toBe('ACTIVE');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalled();
    });

    it('should clear status filter when "all" is selected', () => {
      component.filterStatus = 'ACTIVE';
      component.onFilterStatusChange('all');

      expect(component.filterStatus).toBe('');
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalled();
    });

    it('should filter by type', () => {
      component.onFilterTypeChange('SEQUENTIAL');

      expect(component.filterType).toBe('SEQUENTIAL');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalled();
    });

    it('should filter by search term', () => {
      component.onSearchChange('Melting');

      expect(component.searchTerm).toBe('Melting');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalled();
    });

    it('should include filters in API request', () => {
      component.filterStatus = 'ACTIVE';
      component.filterType = 'SEQUENTIAL';
      component.searchTerm = 'test';
      component.loadRoutings();

      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalledWith(
        jasmine.objectContaining({
          status: 'ACTIVE',
          type: 'SEQUENTIAL',
          search: 'test'
        })
      );
    });

    it('should clear all filters', () => {
      component.filterStatus = 'ACTIVE';
      component.filterType = 'PARALLEL';
      component.searchTerm = 'test';
      component.page = 2;

      component.clearFilters();

      expect(component.filterStatus).toBe('');
      expect(component.filterType).toBe('');
      expect(component.searchTerm).toBe('');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalled();
    });
  });

  describe('Navigation', () => {
    it('should navigate to create routing page', () => {
      spyOn(router, 'navigate');
      component.createRouting();
      expect(router.navigate).toHaveBeenCalledWith(['/manage/routing/new']);
    });

    it('should navigate to edit routing page', () => {
      spyOn(router, 'navigate');
      component.editRouting(mockRoutings[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/manage/routing', 1, 'edit']);
    });

    it('should navigate to view routing page', () => {
      spyOn(router, 'navigate');
      component.viewRouting(mockRoutings[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/manage/routing', 1]);
    });
  });

  describe('Activate Routing', () => {
    it('should activate routing when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.activateRouting.and.returnValue(of({ routingId: 2, status: 'ACTIVE' }));

      component.activateRouting(mockRoutings[1]);

      expect(apiServiceSpy.activateRouting).toHaveBeenCalledWith(2, true);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalledTimes(2);
    });

    it('should not activate routing when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.activateRouting(mockRoutings[1]);

      expect(apiServiceSpy.activateRouting).not.toHaveBeenCalled();
    });

    it('should handle activate error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      apiServiceSpy.activateRouting.and.returnValue(throwError(() => ({ error: { message: 'Activation failed' } })));

      component.activateRouting(mockRoutings[1]);

      expect(window.alert).toHaveBeenCalledWith('Activation failed');
    });
  });

  describe('Deactivate Routing', () => {
    it('should deactivate routing when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.deactivateRouting.and.returnValue(of({ routingId: 1, status: 'INACTIVE' }));

      component.deactivateRouting(mockRoutings[0]);

      expect(apiServiceSpy.deactivateRouting).toHaveBeenCalledWith(1);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalledTimes(2);
    });

    it('should not deactivate routing when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deactivateRouting(mockRoutings[0]);

      expect(apiServiceSpy.deactivateRouting).not.toHaveBeenCalled();
    });

    it('should handle deactivate error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      apiServiceSpy.deactivateRouting.and.returnValue(throwError(() => ({ error: { message: 'Deactivation failed' } })));

      component.deactivateRouting(mockRoutings[0]);

      expect(window.alert).toHaveBeenCalledWith('Deactivation failed');
    });
  });

  describe('Put On Hold', () => {
    it('should put routing on hold with reason', () => {
      spyOn(window, 'prompt').and.returnValue('Equipment issue');
      apiServiceSpy.putRoutingOnHold.and.returnValue(of({ routingId: 1, status: 'ON_HOLD' }));

      component.putOnHold(mockRoutings[0]);

      expect(apiServiceSpy.putRoutingOnHold).toHaveBeenCalledWith(1, 'Equipment issue');
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalledTimes(2);
    });

    it('should put routing on hold with empty reason', () => {
      spyOn(window, 'prompt').and.returnValue('');
      apiServiceSpy.putRoutingOnHold.and.returnValue(of({ routingId: 1, status: 'ON_HOLD' }));

      component.putOnHold(mockRoutings[0]);

      expect(apiServiceSpy.putRoutingOnHold).toHaveBeenCalledWith(1, '');
    });

    it('should not put on hold when cancelled', () => {
      spyOn(window, 'prompt').and.returnValue(null);

      component.putOnHold(mockRoutings[0]);

      expect(apiServiceSpy.putRoutingOnHold).not.toHaveBeenCalled();
    });

    it('should handle put on hold error', () => {
      spyOn(window, 'prompt').and.returnValue('reason');
      spyOn(window, 'alert');
      apiServiceSpy.putRoutingOnHold.and.returnValue(throwError(() => ({ error: { message: 'Hold failed' } })));

      component.putOnHold(mockRoutings[0]);

      expect(window.alert).toHaveBeenCalledWith('Hold failed');
    });
  });

  describe('Release From Hold', () => {
    it('should release routing from hold when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.releaseRoutingFromHold.and.returnValue(of({ routingId: 4, status: 'ACTIVE' }));

      component.releaseFromHold(mockRoutings[3]);

      expect(apiServiceSpy.releaseRoutingFromHold).toHaveBeenCalledWith(4);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalledTimes(2);
    });

    it('should not release from hold when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.releaseFromHold(mockRoutings[3]);

      expect(apiServiceSpy.releaseRoutingFromHold).not.toHaveBeenCalled();
    });

    it('should handle release error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      apiServiceSpy.releaseRoutingFromHold.and.returnValue(throwError(() => ({ error: { message: 'Release failed' } })));

      component.releaseFromHold(mockRoutings[3]);

      expect(window.alert).toHaveBeenCalledWith('Release failed');
    });
  });

  describe('Delete Routing', () => {
    it('should delete routing when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.deleteRouting.and.returnValue(of(void 0));

      component.deleteRouting(mockRoutings[1]); // DRAFT routing

      expect(apiServiceSpy.deleteRouting).toHaveBeenCalledWith(2);
      expect(apiServiceSpy.getRoutingsPaged).toHaveBeenCalledTimes(2);
    });

    it('should not delete routing when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.deleteRouting(mockRoutings[1]);

      expect(apiServiceSpy.deleteRouting).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      apiServiceSpy.deleteRouting.and.returnValue(throwError(() => ({ error: { message: 'Cannot delete' } })));

      component.deleteRouting(mockRoutings[1]);

      expect(window.alert).toHaveBeenCalledWith('Cannot delete');
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      apiServiceSpy.getRoutingsPaged.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));

      component.loadRoutings();

      expect(component.error).toBe('Load failed');
      expect(component.loading).toBeFalse();
    });

    it('should show default error message when none provided', () => {
      apiServiceSpy.getRoutingsPaged.and.returnValue(throwError(() => ({})));

      component.loadRoutings();

      expect(component.error).toBe('Failed to load routings');
    });
  });

  describe('Utility Functions', () => {
    it('should return correct status class for DRAFT', () => {
      expect(component.getStatusClass('DRAFT')).toBe('status-draft');
    });

    it('should return correct status class for ACTIVE', () => {
      expect(component.getStatusClass('ACTIVE')).toBe('status-active');
    });

    it('should return correct status class for INACTIVE', () => {
      expect(component.getStatusClass('INACTIVE')).toBe('status-inactive');
    });

    it('should return correct status class for ON_HOLD', () => {
      expect(component.getStatusClass('ON_HOLD')).toBe('status-on-hold');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusClass('UNKNOWN')).toBe('');
    });

    it('should return correct type label for SEQUENTIAL', () => {
      expect(component.getTypeLabel('SEQUENTIAL')).toBe('Sequential');
    });

    it('should return correct type label for PARALLEL', () => {
      expect(component.getTypeLabel('PARALLEL')).toBe('Parallel');
    });
  });

  describe('Routing Types', () => {
    it('should have routing type options', () => {
      expect(component.routingTypes.length).toBe(2);
      expect(component.routingTypes).toContain('SEQUENTIAL');
      expect(component.routingTypes).toContain('PARALLEL');
    });
  });
});
