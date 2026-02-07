import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { OperationListComponent } from './operation-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

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
      operationType: 'FURNACE',
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
      operationType: 'CASTER',
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
      operationType: 'ROLLING',
      sequenceNumber: 1,
      status: 'BLOCKED',
      targetQty: 200,
      confirmedQty: 0,
      blockReason: 'Equipment maintenance',
      processName: 'Rolling',
      orderNumber: 'ORD-002'
    },
    {
      operationId: 4,
      processId: 2,
      operationName: 'Quality Check',
      operationCode: 'QC-001',
      operationType: 'INSPECTION',
      sequenceNumber: 2,
      status: 'CONFIRMED',
      targetQty: 50,
      confirmedQty: 50,
      processName: 'Inspection',
      orderNumber: 'ORD-002'
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getAllOperations',
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
    apiServiceSpy.getAllOperations.and.returnValue(of(mockOperations));

    fixture = TestBed.createComponent(OperationListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load operations on init', () => {
    expect(apiServiceSpy.getAllOperations).toHaveBeenCalled();
    expect(component.allOperations.length).toBe(4);
    expect(component.loading).toBeFalse();
  });

  it('should display all operations by default', () => {
    expect(component.operations.length).toBe(4);
  });

  it('should filter by status', () => {
    component.onFilterStatusChange('READY');
    expect(component.operations.length).toBe(1);
    expect(component.operations[0].operationCode).toBe('MLT-001');
  });

  it('should filter by search term on name', () => {
    component.onSearchChange('Cast');
    expect(component.operations.length).toBe(1);
    expect(component.operations[0].operationName).toBe('Cast Steel');
  });

  it('should filter by search term on code', () => {
    component.onSearchChange('RLL');
    expect(component.operations.length).toBe(1);
    expect(component.operations[0].operationCode).toBe('RLL-001');
  });

  it('should filter by search term on order number', () => {
    component.onSearchChange('ORD-002');
    expect(component.operations.length).toBe(2);
  });

  it('should filter by search term on process name', () => {
    component.onSearchChange('Melting');
    expect(component.operations.length).toBe(1);
    expect(component.operations[0].processName).toBe('Melting');
  });

  it('should combine status and search filters', () => {
    component.filterStatus = 'BLOCKED';
    component.searchTerm = 'Roll';
    component.applyFilters();
    expect(component.operations.length).toBe(1);
    expect(component.operations[0].operationCode).toBe('RLL-001');
  });

  it('should show all when filter is all', () => {
    component.onFilterStatusChange('BLOCKED');
    expect(component.operations.length).toBe(1);

    component.onFilterStatusChange('all');
    expect(component.operations.length).toBe(4);
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('IN_PROGRESS')).toBe('in-progress');
    expect(component.getStatusClass('NOT_STARTED')).toBe('not-started');
    expect(component.getStatusClass('BLOCKED')).toBe('blocked');
  });

  it('should count by status', () => {
    expect(component.countByStatus('READY')).toBe(1);
    expect(component.countByStatus('IN_PROGRESS')).toBe(1);
    expect(component.countByStatus('BLOCKED')).toBe(1);
    expect(component.countByStatus('CONFIRMED')).toBe(1);
    expect(component.countByStatus('NOT_STARTED')).toBe(0);
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
      component.confirmBlock();

      // getAllOperations called once on init, once after block
      expect(apiServiceSpy.getAllOperations).toHaveBeenCalledTimes(2);
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

      component.unblockOperation(mockOperations[2]);

      // getAllOperations called once on init, once after unblock
      expect(apiServiceSpy.getAllOperations).toHaveBeenCalledTimes(2);
    });

    it('should handle unblock error', () => {
      apiServiceSpy.unblockOperation.and.returnValue(throwError(() => ({ error: { message: 'Unblock failed' } })));

      component.unblockOperation(mockOperations[2]);

      expect(component.actionError).toBe('Unblock failed');
    });
  });

  it('should handle load error', () => {
    apiServiceSpy.getAllOperations.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));
    component.loadOperations();
    expect(component.error).toBe('Load failed');
    expect(component.loading).toBeFalse();
  });

  it('should show empty state when no operations match', () => {
    component.onFilterStatusChange('ON_HOLD');
    expect(component.operations.length).toBe(0);
  });

  describe('Query Params', () => {
    it('should set filter from query params', () => {
      queryParamsSubject.next({ status: 'READY' });
      fixture.detectChanges();

      expect(component.filterStatus).toBe('READY');
    });

    it('should ignore invalid status from query params', () => {
      queryParamsSubject.next({ status: 'INVALID_STATUS' });
      fixture.detectChanges();

      // Should keep default 'all' filter
      expect(component.filterStatus).toBe('all');
    });

    it('should filter operations based on query param status', () => {
      queryParamsSubject.next({ status: 'BLOCKED' });
      fixture.detectChanges();

      expect(component.filterStatus).toBe('BLOCKED');
      expect(component.operations.length).toBe(1);
      expect(component.operations[0].status).toBe('BLOCKED');
    });
  });

  describe('Filter Highlighting', () => {
    it('should apply filter-active class when status filter is set', () => {
      component.onFilterStatusChange('READY');
      fixture.detectChanges();

      const filterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(filterGroup.classList.contains('filter-active')).toBeTrue();
    });

    it('should not apply filter-active class when status filter is all', () => {
      component.onFilterStatusChange('all');
      fixture.detectChanges();

      const filterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(filterGroup.classList.contains('filter-active')).toBeFalse();
    });

    it('should apply filter-active class to select element when filter is set', () => {
      component.onFilterStatusChange('BLOCKED');
      fixture.detectChanges();

      const select = fixture.nativeElement.querySelector('.filter-group select');
      expect(select.classList.contains('filter-active')).toBeTrue();
    });

    it('should apply filter-active via query params', () => {
      queryParamsSubject.next({ status: 'IN_PROGRESS' });
      fixture.detectChanges();

      const filterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(filterGroup.classList.contains('filter-active')).toBeTrue();
    });
  });
});
