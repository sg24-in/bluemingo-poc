import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ProcessListComponent } from './process-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse } from '../../../shared/models/pagination.model';
import { Process } from '../../../shared/models';

describe('ProcessListComponent', () => {
  let component: ProcessListComponent;
  let fixture: ComponentFixture<ProcessListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  // Process is now design-time only with DRAFT/ACTIVE/INACTIVE statuses
  const mockProcesses: Process[] = [
    {
      processId: 1,
      processName: 'Melting Process',
      status: 'DRAFT',
      createdOn: '2024-01-01T00:00:00',
      createdBy: 'admin'
    } as Process,
    {
      processId: 2,
      processName: 'Casting Process',
      status: 'ACTIVE',
      createdOn: '2024-01-02T00:00:00',
      createdBy: 'admin'
    } as Process,
    {
      processId: 3,
      processName: 'Rolling Process',
      status: 'INACTIVE',
      createdOn: '2024-01-03T00:00:00',
      createdBy: 'admin'
    } as Process
  ];

  const mockPagedResponse: PagedResponse<Process> = {
    content: mockProcesses,
    page: 0,
    size: 10,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getProcessesPaged',
      'getProcessesByStatus',
      'activateProcess',
      'deactivateProcess',
      'deleteProcess'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [ProcessListComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    // Set up paged response
    apiServiceSpy.getProcessesPaged.and.returnValue(of(mockPagedResponse));

    // Each status call returns a subset of mock processes
    apiServiceSpy.getProcessesByStatus.and.callFake((status: string) => {
      const filtered = mockProcesses.filter(p => p.status === status);
      return of(filtered);
    });

    fixture = TestBed.createComponent(ProcessListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load processes on init', () => {
    expect(apiServiceSpy.getProcessesPaged).toHaveBeenCalled();
    expect(component.processes.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should call getProcessesByStatus for each design-time status', () => {
    // Design-time statuses only: DRAFT, ACTIVE, INACTIVE
    const statuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];
    statuses.forEach(s => {
      expect(apiServiceSpy.getProcessesByStatus).toHaveBeenCalledWith(s);
    });
  });

  it('should load processes in paged response', () => {
    expect(component.processes[0].processId).toBe(1);
    expect(component.processes[1].processId).toBe(2);
    expect(component.processes[2].processId).toBe(3);
  });

  it('should apply status filter', () => {
    // Set up filtered response
    const filteredResponse: PagedResponse<Process> = {
      ...mockPagedResponse,
      content: mockProcesses.filter(p => p.status === 'DRAFT'),
      totalElements: 1
    };
    apiServiceSpy.getProcessesPaged.and.returnValue(of(filteredResponse));

    component.onFilterStatusChange('DRAFT');

    expect(component.filterStatus).toBe('DRAFT');
    expect(apiServiceSpy.getProcessesPaged).toHaveBeenCalled();
  });

  it('should apply search filter', () => {
    const filteredResponse: PagedResponse<Process> = {
      ...mockPagedResponse,
      content: mockProcesses.filter(p => p.processName.includes('Casting')),
      totalElements: 1
    };
    apiServiceSpy.getProcessesPaged.and.returnValue(of(filteredResponse));

    component.onSearchChange('Casting');

    expect(component.searchTerm).toBe('Casting');
    expect(apiServiceSpy.getProcessesPaged).toHaveBeenCalled();
  });

  it('should reset filter when all is selected', () => {
    component.filterStatus = 'DRAFT';
    component.onFilterStatusChange('all');
    expect(component.filterStatus).toBe('');
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('DRAFT')).toBe('draft');
    expect(component.getStatusClass('ACTIVE')).toBe('active');
    expect(component.getStatusClass('INACTIVE')).toBe('inactive');
  });

  it('should count by status', () => {
    expect(component.countByStatus('DRAFT')).toBe(1);
    expect(component.countByStatus('ACTIVE')).toBe(1);
    expect(component.countByStatus('INACTIVE')).toBe(1);
  });

  it('should handle API errors gracefully', () => {
    apiServiceSpy.getProcessesPaged.and.returnValue(throwError(() => new Error('API error')));
    component.loadProcesses();

    expect(component.loading).toBeFalse();
    expect(component.error).toBe('Failed to load processes.');
  });

  it('should handle page change', () => {
    // Set up a new response for the page change
    const page2Response: PagedResponse<Process> = {
      ...mockPagedResponse,
      page: 2
    };
    apiServiceSpy.getProcessesPaged.and.returnValue(of(page2Response));

    component.onPageChange(2);

    expect(apiServiceSpy.getProcessesPaged).toHaveBeenCalled();
    expect(component.page).toBe(2);
  });

  it('should handle size change', () => {
    // Set up a new response with different size
    const size20Response: PagedResponse<Process> = {
      ...mockPagedResponse,
      size: 20,
      page: 0
    };
    apiServiceSpy.getProcessesPaged.and.returnValue(of(size20Response));

    component.onSizeChange(20);

    expect(apiServiceSpy.getProcessesPaged).toHaveBeenCalled();
    expect(component.size).toBe(20);
    expect(component.page).toBe(0);
  });

  describe('activate/deactivate', () => {
    it('should activate a process', () => {
      apiServiceSpy.activateProcess.and.returnValue(of({ processId: 1, status: 'ACTIVE' } as Process));

      component.activateProcess(mockProcesses[0]);

      expect(apiServiceSpy.activateProcess).toHaveBeenCalledWith(1);
    });

    it('should handle activate error', () => {
      apiServiceSpy.activateProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot activate' } }))
      );

      component.activateProcess(mockProcesses[0]);

      expect(component.error).toBe('Cannot activate');
      expect(component.processing).toBeFalse();
    });

    it('should deactivate a process', () => {
      apiServiceSpy.deactivateProcess.and.returnValue(of({ processId: 2, status: 'INACTIVE' } as Process));

      component.deactivateProcess(mockProcesses[1]);

      expect(apiServiceSpy.deactivateProcess).toHaveBeenCalledWith(2);
    });

    it('should handle deactivate error', () => {
      apiServiceSpy.deactivateProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot deactivate' } }))
      );

      component.deactivateProcess(mockProcesses[1]);

      expect(component.error).toBe('Cannot deactivate');
      expect(component.processing).toBeFalse();
    });
  });

  describe('delete', () => {
    it('should open delete confirmation modal', () => {
      component.confirmDelete(mockProcesses[0]);
      expect(component.showDeleteModal).toBeTrue();
      expect(component.processToDelete).toEqual(mockProcesses[0]);
    });

    it('should cancel delete', () => {
      component.confirmDelete(mockProcesses[0]);
      component.cancelDelete();
      expect(component.showDeleteModal).toBeFalse();
      expect(component.processToDelete).toBeNull();
    });

    it('should delete a process', () => {
      apiServiceSpy.deleteProcess.and.returnValue(of(void 0));

      component.processToDelete = mockProcesses[0];
      component.deleteProcess();

      expect(apiServiceSpy.deleteProcess).toHaveBeenCalledWith(1);
      expect(component.showDeleteModal).toBeFalse();
    });

    it('should handle delete error', () => {
      apiServiceSpy.deleteProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } }))
      );

      component.processToDelete = mockProcesses[0];
      component.deleteProcess();

      expect(component.error).toBe('Cannot delete');
      expect(component.deleting).toBeFalse();
    });

    it('should not delete without selected process', () => {
      component.processToDelete = null;
      component.deleteProcess();
      expect(apiServiceSpy.deleteProcess).not.toHaveBeenCalled();
    });
  });
});
