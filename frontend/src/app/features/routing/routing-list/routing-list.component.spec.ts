import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RoutingListComponent } from './routing-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('RoutingListComponent', () => {
  let component: RoutingListComponent;
  let fixture: ComponentFixture<RoutingListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockRoutings = [
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

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getAllRoutings',
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
    apiServiceSpy.getAllRoutings.and.returnValue(of(mockRoutings));

    fixture = TestBed.createComponent(RoutingListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load routings on init', () => {
    expect(apiServiceSpy.getAllRoutings).toHaveBeenCalled();
    expect(component.routings.length).toBe(4);
    expect(component.loading).toBeFalse();
  });

  it('should display all routings by default', () => {
    expect(component.filteredRoutings.length).toBe(4);
  });

  describe('Summary Calculation', () => {
    it('should calculate summary counts correctly', () => {
      expect(component.summary.total).toBe(4);
      expect(component.summary.active).toBe(1);
      expect(component.summary.draft).toBe(1);
      expect(component.summary.inactive).toBe(1);
      expect(component.summary.onHold).toBe(1);
    });
  });

  describe('Filtering', () => {
    it('should filter by status', () => {
      component.statusFilter = 'ACTIVE';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(1);
      expect(component.filteredRoutings[0].routingName).toBe('Standard Melting');
    });

    it('should filter by DRAFT status', () => {
      component.statusFilter = 'DRAFT';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(1);
      expect(component.filteredRoutings[0].routingName).toBe('Fast Casting');
    });

    it('should filter by search term on routing name', () => {
      component.searchTerm = 'Standard';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(1);
      expect(component.filteredRoutings[0].routingName).toBe('Standard Melting');
    });

    it('should filter by search term on process name', () => {
      component.searchTerm = 'Rolling';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(1);
      expect(component.filteredRoutings[0].processName).toBe('Rolling Process');
    });

    it('should filter by search term on routing type', () => {
      component.searchTerm = 'parallel';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(1);
      expect(component.filteredRoutings[0].routingType).toBe('PARALLEL');
    });

    it('should combine status and search filters', () => {
      component.statusFilter = 'ACTIVE';
      component.searchTerm = 'Melting';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(1);
      expect(component.filteredRoutings[0].routingName).toBe('Standard Melting');
    });

    it('should show all when filter is cleared', () => {
      component.statusFilter = 'DRAFT';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(1);

      component.statusFilter = '';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(4);
    });

    it('should clear filters', () => {
      component.statusFilter = 'ACTIVE';
      component.searchTerm = 'test';
      component.clearFilters();
      expect(component.statusFilter).toBe('');
      expect(component.searchTerm).toBe('');
      expect(component.filteredRoutings.length).toBe(4);
    });

    it('should call applyFilters on status change', () => {
      spyOn(component, 'applyFilters');
      component.onStatusChange();
      expect(component.applyFilters).toHaveBeenCalled();
    });

    it('should call applyFilters on search', () => {
      spyOn(component, 'applyFilters');
      component.onSearch();
      expect(component.applyFilters).toHaveBeenCalled();
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
      expect(router.navigate).toHaveBeenCalledWith(['/manage/routing', 1, 'edit']);
    });
  });

  describe('Activate Routing', () => {
    it('should activate routing when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.activateRouting.and.returnValue(of({ routingId: 2, status: 'ACTIVE' }));

      component.activateRouting(mockRoutings[1]);

      expect(apiServiceSpy.activateRouting).toHaveBeenCalledWith(2, true);
      expect(apiServiceSpy.getAllRoutings).toHaveBeenCalledTimes(2); // Once on init, once after activate
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
      expect(apiServiceSpy.getAllRoutings).toHaveBeenCalledTimes(2);
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
      expect(apiServiceSpy.getAllRoutings).toHaveBeenCalledTimes(2);
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
      expect(apiServiceSpy.getAllRoutings).toHaveBeenCalledTimes(2);
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
      expect(apiServiceSpy.getAllRoutings).toHaveBeenCalledTimes(2);
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
      apiServiceSpy.getAllRoutings.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));

      component.loadRoutings();

      expect(component.error).toBe('Load failed');
      expect(component.loading).toBeFalse();
    });

    it('should show default error message when none provided', () => {
      apiServiceSpy.getAllRoutings.and.returnValue(throwError(() => ({})));

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

  describe('Empty State', () => {
    it('should show empty state when no routings match', () => {
      component.statusFilter = 'UNKNOWN_STATUS';
      component.applyFilters();
      expect(component.filteredRoutings.length).toBe(0);
    });
  });

  describe('Filter Highlighting', () => {
    it('should apply filter-active class when status filter is set', () => {
      component.statusFilter = 'ACTIVE';
      component.applyFilters();
      fixture.detectChanges();

      const filterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(filterGroup.classList.contains('filter-active')).toBeTrue();
    });

    it('should not apply filter-active class when status filter is empty', () => {
      component.statusFilter = '';
      component.applyFilters();
      fixture.detectChanges();

      const filterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(filterGroup.classList.contains('filter-active')).toBeFalse();
    });
  });
});
