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

  const mockProcesses: any[] = [
    {
      processId: 1,
      orderLineId: 1,
      stageName: 'Melting',
      stageSequence: 1,
      status: 'READY',
      usageDecision: null,
      operations: [
        { operationId: 1, operationName: 'Melt Iron', operationCode: 'MLT-001', status: 'READY', sequenceNumber: 1 }
      ]
    },
    {
      processId: 2,
      orderLineId: 1,
      stageName: 'Casting',
      stageSequence: 2,
      status: 'IN_PROGRESS',
      usageDecision: null,
      operations: [
        { operationId: 2, operationName: 'Cast Steel', operationCode: 'CST-001', status: 'CONFIRMED', sequenceNumber: 1 },
        { operationId: 3, operationName: 'Cool Down', operationCode: 'CST-002', status: 'IN_PROGRESS', sequenceNumber: 2 }
      ]
    },
    {
      processId: 3,
      orderLineId: 2,
      stageName: 'Rolling',
      stageSequence: 3,
      status: 'COMPLETED',
      usageDecision: 'ACCEPT',
      operations: []
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['getProcessesByStatus']);

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

  it('should call getProcessesByStatus for each status', () => {
    const statuses = ['READY', 'IN_PROGRESS', 'QUALITY_PENDING', 'COMPLETED', 'REJECTED', 'ON_HOLD'];
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
    component.onFilterStatusChange('READY');
    expect(component.processes.length).toBe(1);
    expect(component.processes[0].stageName).toBe('Melting');
  });

  it('should apply search filter', () => {
    component.onSearchChange('Casting');
    expect(component.processes.length).toBe(1);
    expect(component.processes[0].stageName).toBe('Casting');
  });

  it('should search by process ID', () => {
    component.onSearchChange('3');
    expect(component.processes.length).toBe(1);
    expect(component.processes[0].processId).toBe(3);
  });

  it('should combine status and search filters', () => {
    component.filterStatus = 'IN_PROGRESS';
    component.searchTerm = 'Cast';
    component.applyFilters();
    expect(component.processes.length).toBe(1);
    expect(component.processes[0].stageName).toBe('Casting');
  });

  it('should show all when filter is all', () => {
    component.onFilterStatusChange('all');
    expect(component.processes.length).toBe(3);
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('IN_PROGRESS')).toBe('in-progress');
    expect(component.getStatusClass('QUALITY_PENDING')).toBe('quality-pending');
    expect(component.getStatusClass('READY')).toBe('ready');
  });

  it('should count operations', () => {
    expect(component.getOperationCount(mockProcesses[0])).toBe(1);
    expect(component.getOperationCount(mockProcesses[1])).toBe(2);
    expect(component.getOperationCount(mockProcesses[2])).toBe(0);
  });

  it('should count confirmed operations', () => {
    expect(component.getConfirmedCount(mockProcesses[1])).toBe(1);
    expect(component.getConfirmedCount(mockProcesses[0])).toBe(0);
  });

  it('should count by status', () => {
    expect(component.countByStatus('READY')).toBe(1);
    expect(component.countByStatus('IN_PROGRESS')).toBe(1);
    expect(component.countByStatus('COMPLETED')).toBe(1);
    expect(component.countByStatus('QUALITY_PENDING')).toBe(0);
  });

  it('should handle API errors gracefully', () => {
    apiServiceSpy.getProcessesByStatus.and.returnValue(throwError(() => new Error('API error')));
    component.loadProcesses();

    // After all status calls error, should still finish loading
    expect(component.loading).toBeFalse();
  });

  it('should show empty state when no processes match filter', () => {
    component.onFilterStatusChange('ON_HOLD');
    expect(component.processes.length).toBe(0);
  });
});
