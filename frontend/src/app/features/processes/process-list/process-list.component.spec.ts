import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ProcessListComponent } from './process-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('ProcessListComponent', () => {
  let component: ProcessListComponent;
  let fixture: ComponentFixture<ProcessListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  // Process is now design-time only with DRAFT/ACTIVE/INACTIVE statuses
  const mockProcesses: any[] = [
    {
      processId: 1,
      processName: 'Melting Process',
      status: 'DRAFT',
      createdOn: '2024-01-01T00:00:00',
      createdBy: 'admin'
    },
    {
      processId: 2,
      processName: 'Casting Process',
      status: 'ACTIVE',
      createdOn: '2024-01-02T00:00:00',
      createdBy: 'admin'
    },
    {
      processId: 3,
      processName: 'Rolling Process',
      status: 'INACTIVE',
      createdOn: '2024-01-03T00:00:00',
      createdBy: 'admin'
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
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
    expect(apiServiceSpy.getProcessesByStatus).toHaveBeenCalled();
    expect(component.allProcesses.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should call getProcessesByStatus for each design-time status', () => {
    // Design-time statuses only: DRAFT, ACTIVE, INACTIVE
    const statuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];
    statuses.forEach(s => {
      expect(apiServiceSpy.getProcessesByStatus).toHaveBeenCalledWith(s);
    });
  });

  it('should sort processes by processId descending', () => {
    expect(component.allProcesses[0].processId).toBe(3);
    expect(component.allProcesses[1].processId).toBe(2);
    expect(component.allProcesses[2].processId).toBe(1);
  });

  it('should apply status filter', () => {
    component.onFilterStatusChange('DRAFT');
    expect(component.processes.length).toBe(1);
    expect(component.processes[0].processName).toBe('Melting Process');
  });

  it('should apply search filter', () => {
    component.onSearchChange('Casting');
    expect(component.processes.length).toBe(1);
    expect(component.processes[0].processName).toBe('Casting Process');
  });

  it('should search by process ID', () => {
    component.onSearchChange('3');
    expect(component.processes.length).toBe(1);
    expect(component.processes[0].processId).toBe(3);
  });

  it('should combine status and search filters', () => {
    component.filterStatus = 'ACTIVE';
    component.searchTerm = 'Cast';
    component.applyFilters();
    expect(component.processes.length).toBe(1);
    expect(component.processes[0].processName).toBe('Casting Process');
  });

  it('should show all when filter is all', () => {
    component.onFilterStatusChange('all');
    expect(component.processes.length).toBe(3);
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
    apiServiceSpy.getProcessesByStatus.and.returnValue(throwError(() => new Error('API error')));
    component.loadProcesses();

    // After all status calls error, should still finish loading
    expect(component.loading).toBeFalse();
  });

  it('should show empty state when no processes match filter', () => {
    component.onFilterStatusChange('NONEXISTENT');
    expect(component.processes.length).toBe(0);
  });

  describe('activate/deactivate', () => {
    it('should activate a process', () => {
      apiServiceSpy.activateProcess.and.returnValue(of({ processId: 1, status: 'ACTIVE' } as any));
      apiServiceSpy.getProcessesByStatus.and.returnValue(of([]));

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
      apiServiceSpy.deactivateProcess.and.returnValue(of({ processId: 2, status: 'INACTIVE' } as any));
      apiServiceSpy.getProcessesByStatus.and.returnValue(of([]));

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
      apiServiceSpy.getProcessesByStatus.and.returnValue(of([]));

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
