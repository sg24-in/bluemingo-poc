import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { QualityPendingComponent } from './quality-pending.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('QualityPendingComponent', () => {
  let component: QualityPendingComponent;
  let fixture: ComponentFixture<QualityPendingComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockQualityPendingProcesses: any[] = [
    {
      processId: 1,
      orderLineId: 1,
      stageName: 'Melting',
      stageSequence: 1,
      status: 'QUALITY_PENDING',
      usageDecision: 'PENDING',
      createdOn: '2024-01-01T00:00:00',
      updatedOn: '2024-01-01T00:00:00',
      operations: [
        { operationId: 1, operationName: 'Melt Iron', operationCode: 'MLT-001', status: 'CONFIRMED', sequenceNumber: 1 }
      ]
    }
  ];

  const mockRejectedProcesses: any[] = [
    {
      processId: 2,
      orderLineId: 1,
      stageName: 'Casting',
      stageSequence: 2,
      status: 'REJECTED',
      usageDecision: 'REJECT',
      createdOn: '2024-01-01T00:00:00',
      updatedOn: '2024-01-02T00:00:00',
      operations: []
    }
  ];

  beforeEach(async () => {
    const apiSpy = jasmine.createSpyObj('ApiService', [
      'getQualityPendingProcesses',
      'getProcessesByStatus',
      'acceptProcess',
      'rejectProcess',
      'updateProcessStatus'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [QualityPendingComponent],
      providers: [
        { provide: ApiService, useValue: apiSpy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getQualityPendingProcesses.and.returnValue(of(mockQualityPendingProcesses));
    apiServiceSpy.getProcessesByStatus.and.returnValue(of(mockRejectedProcesses));

    fixture = TestBed.createComponent(QualityPendingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load quality pending processes on init', () => {
    expect(apiServiceSpy.getQualityPendingProcesses).toHaveBeenCalled();
    expect(component.qualityPendingProcesses.length).toBe(1);
  });

  it('should load rejected processes on init', () => {
    expect(apiServiceSpy.getProcessesByStatus).toHaveBeenCalledWith('REJECTED');
    expect(component.rejectedProcesses.length).toBe(1);
  });

  it('should switch tabs', () => {
    expect(component.activeTab).toBe('pending');
    component.setActiveTab('rejected');
    expect(component.activeTab).toBe('rejected');
  });

  describe('Quality Decisions', () => {
    it('should open accept decision modal', () => {
      component.openDecisionModal(mockQualityPendingProcesses[0], 'accept');
      expect(component.showDecisionModal).toBeTrue();
      expect(component.selectedProcess).toEqual(mockQualityPendingProcesses[0]);
      expect(component.decisionType).toBe('accept');
    });

    it('should open reject decision modal', () => {
      component.openDecisionModal(mockQualityPendingProcesses[0], 'reject');
      expect(component.showDecisionModal).toBeTrue();
      expect(component.selectedProcess).toEqual(mockQualityPendingProcesses[0]);
      expect(component.decisionType).toBe('reject');
    });

    it('should close decision modal', () => {
      component.showDecisionModal = true;
      component.selectedProcess = mockQualityPendingProcesses[0];
      component.closeDecisionModal();
      expect(component.showDecisionModal).toBeFalse();
      expect(component.selectedProcess).toBeNull();
    });

    it('should accept process', () => {
      apiServiceSpy.acceptProcess.and.returnValue(of({ success: true } as any));

      component.selectedProcess = mockQualityPendingProcesses[0];
      component.decisionType = 'accept';
      component.notes = 'Quality approved';
      component.submitDecision();

      expect(apiServiceSpy.acceptProcess).toHaveBeenCalledWith(1, 'Quality approved');
    });

    it('should reject process with reason', () => {
      apiServiceSpy.rejectProcess.and.returnValue(of({ success: true } as any));

      component.selectedProcess = mockQualityPendingProcesses[0];
      component.decisionType = 'reject';
      component.rejectReason = 'Quality defects found';
      component.notes = 'Additional notes';
      component.submitDecision();

      expect(apiServiceSpy.rejectProcess).toHaveBeenCalledWith(
        1,
        'Quality defects found',
        'Additional notes'
      );
    });

    it('should not reject without reason', () => {
      component.selectedProcess = mockQualityPendingProcesses[0];
      component.decisionType = 'reject';
      component.rejectReason = '';
      component.submitDecision();

      expect(component.error).toBe('Rejection reason is required');
      expect(apiServiceSpy.rejectProcess).not.toHaveBeenCalled();
    });

    it('should handle accept error', () => {
      apiServiceSpy.acceptProcess.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

      component.selectedProcess = mockQualityPendingProcesses[0];
      component.decisionType = 'accept';
      component.submitDecision();

      expect(component.error).toBeTruthy();
    });
  });

  describe('Retry Process', () => {
    it('should retry rejected process', () => {
      apiServiceSpy.updateProcessStatus.and.returnValue(of({ success: true } as any));

      component.retryProcess(mockRejectedProcesses[0]);

      expect(apiServiceSpy.updateProcessStatus).toHaveBeenCalledWith({
        processId: 2,
        newStatus: 'QUALITY_PENDING'
      });
    });

    it('should handle retry error', () => {
      apiServiceSpy.updateProcessStatus.and.returnValue(throwError(() => ({ error: { message: 'Error' } })));

      component.retryProcess(mockRejectedProcesses[0]);

      expect(component.error).toBeTruthy();
    });
  });

  describe('Utility functions', () => {
    it('should get operations summary', () => {
      const summary = component.getOperationsSummary(mockQualityPendingProcesses[0]);
      expect(summary).toBe('1/1 confirmed');
    });

    it('should return no operations for empty list', () => {
      const process = { ...mockQualityPendingProcesses[0], operations: [] };
      const summary = component.getOperationsSummary(process);
      expect(summary).toBe('No operations');
    });

    it('should clear messages', () => {
      component.error = 'Test error';
      component.success = 'Test success';
      component.clearMessages();
      expect(component.error).toBe('');
      expect(component.success).toBe('');
    });
  });
});
