import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { ProductionHistoryComponent } from './production-history.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('ProductionHistoryComponent', () => {
  let component: ProductionHistoryComponent;
  let fixture: ComponentFixture<ProductionHistoryComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockConfirmations: any[] = [
    {
      confirmationId: 1,
      operationId: 10,
      operationName: 'Melt Iron',
      producedQty: 100,
      scrapQty: 5,
      startTime: '2024-01-15T08:00:00',
      endTime: '2024-01-15T10:30:00',
      status: 'CONFIRMED',
      createdOn: '2024-01-15T10:30:00',
      outputBatch: { batchId: 1, batchNumber: 'BATCH-001', materialId: 'RM-001', materialName: 'Iron', quantity: 100, unit: 'KG' },
      equipment: [{ equipmentId: 1, equipmentCode: 'EQ-001', name: 'Furnace 1' }],
      operators: [{ operatorId: 1, operatorCode: 'OP-001', name: 'John' }]
    },
    {
      confirmationId: 2,
      operationId: 11,
      operationName: 'Cast Steel',
      producedQty: 50,
      scrapQty: 0,
      startTime: '2024-01-15T11:00:00',
      endTime: '2024-01-15T12:00:00',
      status: 'REJECTED',
      createdOn: '2024-01-15T12:00:00',
      rejectionReason: 'Quality defect',
      rejectedBy: 'admin',
      rejectedOn: '2024-01-15T13:00:00'
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getConfirmationsByStatus',
      'canReverseConfirmation',
      'reverseConfirmation'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [ProductionHistoryComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getConfirmationsByStatus.and.callFake((status: string) => {
      const filtered = mockConfirmations.filter(c => c.status === status);
      return of(filtered);
    });

    fixture = TestBed.createComponent(ProductionHistoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load confirmations on init', () => {
    expect(apiServiceSpy.getConfirmationsByStatus).toHaveBeenCalled();
    expect(component.allConfirmations.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should fetch all statuses', () => {
    expect(apiServiceSpy.getConfirmationsByStatus).toHaveBeenCalledWith('CONFIRMED');
    expect(apiServiceSpy.getConfirmationsByStatus).toHaveBeenCalledWith('REJECTED');
    expect(apiServiceSpy.getConfirmationsByStatus).toHaveBeenCalledWith('PENDING_REVIEW');
    expect(apiServiceSpy.getConfirmationsByStatus).toHaveBeenCalledWith('PARTIALLY_CONFIRMED');
    expect(apiServiceSpy.getConfirmationsByStatus).toHaveBeenCalledWith('REVERSED');
  });

  it('should sort by confirmationId descending', () => {
    expect(component.allConfirmations[0].confirmationId).toBe(2);
    expect(component.allConfirmations[1].confirmationId).toBe(1);
  });

  it('should filter by status', () => {
    component.onFilterStatusChange('CONFIRMED');
    expect(component.confirmations.length).toBe(1);
    expect(component.confirmations[0].status).toBe('CONFIRMED');
  });

  it('should filter by search term', () => {
    component.onSearchChange('Cast');
    expect(component.confirmations.length).toBe(1);
    expect(component.confirmations[0].operationName).toBe('Cast Steel');
  });

  it('should search by batch number', () => {
    component.onSearchChange('BATCH-001');
    expect(component.confirmations.length).toBe(1);
  });

  it('should show all when filter is all', () => {
    component.onFilterStatusChange('all');
    expect(component.confirmations.length).toBe(2);
  });

  it('should count by status', () => {
    expect(component.countByStatus('CONFIRMED')).toBe(1);
    expect(component.countByStatus('REJECTED')).toBe(1);
    expect(component.countByStatus('PENDING_REVIEW')).toBe(0);
  });

  it('should return correct status class', () => {
    expect(component.getStatusClass('PENDING_REVIEW')).toBe('pending-review');
    expect(component.getStatusClass('CONFIRMED')).toBe('confirmed');
  });

  it('should calculate duration', () => {
    expect(component.getDuration('2024-01-15T08:00:00', '2024-01-15T10:30:00')).toBe('2h 30m');
    expect(component.getDuration('2024-01-15T11:00:00', '2024-01-15T11:45:00')).toBe('45m');
    expect(component.getDuration('', '')).toBe('-');
  });

  it('should toggle detail panel', () => {
    component.toggleDetail(mockConfirmations[0]);
    expect(component.selectedConfirmation).toEqual(mockConfirmations[0]);

    component.toggleDetail(mockConfirmations[0]);
    expect(component.selectedConfirmation).toBeNull();
  });

  it('should handle API errors gracefully', () => {
    apiServiceSpy.getConfirmationsByStatus.and.returnValue(throwError(() => new Error('Error')));
    component.loadConfirmations();
    expect(component.loading).toBeFalse();
  });

  it('should identify reversible confirmations', () => {
    expect(component.canReverse({ status: 'CONFIRMED' } as any)).toBeTrue();
    expect(component.canReverse({ status: 'PARTIALLY_CONFIRMED' } as any)).toBeTrue();
    expect(component.canReverse({ status: 'REJECTED' } as any)).toBeFalse();
    expect(component.canReverse({ status: 'REVERSED' } as any)).toBeFalse();
  });

  it('should open and close reversal dialog', () => {
    apiServiceSpy.canReverseConfirmation.and.returnValue(of({
      confirmationId: 1, currentStatus: 'CONFIRMED', canReverse: true,
      statusAllowsReversal: true, outputBatchCount: 1
    }));

    component.openReverseDialog(mockConfirmations[0]);
    expect(component.showReversalDialog).toBeTrue();
    expect(component.reversalConfirmation).toBe(mockConfirmations[0]);

    component.closeReverseDialog();
    expect(component.showReversalDialog).toBeFalse();
    expect(component.reversalConfirmation).toBeNull();
  });

  it('should call canReverseConfirmation when opening dialog', () => {
    apiServiceSpy.canReverseConfirmation.and.returnValue(of({
      confirmationId: 1, currentStatus: 'CONFIRMED', canReverse: true,
      statusAllowsReversal: true, outputBatchCount: 1
    }));

    component.openReverseDialog(mockConfirmations[0]);
    expect(apiServiceSpy.canReverseConfirmation).toHaveBeenCalledWith(1);
  });

  it('should call reverseConfirmation API on confirm', () => {
    apiServiceSpy.canReverseConfirmation.and.returnValue(of({
      confirmationId: 1, currentStatus: 'CONFIRMED', canReverse: true,
      statusAllowsReversal: true, outputBatchCount: 1
    }));
    apiServiceSpy.reverseConfirmation.and.returnValue(of({
      confirmationId: 1, previousStatus: 'CONFIRMED', newStatus: 'REVERSED',
      message: 'Reversed', reversedBy: 'admin', reversedOn: '2024-01-15T14:00:00',
      restoredInventoryIds: [1], restoredBatchIds: [1], scrappedOutputBatchIds: [2],
      operationId: 10, operationNewStatus: 'READY'
    }));

    component.openReverseDialog(mockConfirmations[0]);
    component.reversalReason = 'Wrong materials used';
    component.confirmReversal();
    expect(apiServiceSpy.reverseConfirmation).toHaveBeenCalledWith(1, 'Wrong materials used', undefined);
  });

  it('should not call reverseConfirmation without reason', () => {
    component.reversalConfirmation = mockConfirmations[0];
    component.reversalReason = '  ';
    component.confirmReversal();
    expect(apiServiceSpy.reverseConfirmation).not.toHaveBeenCalled();
  });
});
