import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProcessDetailComponent } from './process-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('ProcessDetailComponent', () => {
  let component: ProcessDetailComponent;
  let fixture: ComponentFixture<ProcessDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockProcess = {
    processId: 1,
    stageName: 'Melting Process',
    stageSequence: 1,
    orderLineId: 100,
    status: 'IN_PROGRESS' as const,
    usageDecision: 'PENDING' as const,
    createdOn: new Date().toISOString(),
    operations: [
      {
        operationId: 1,
        operationName: 'Heat Treatment',
        operationCode: 'OP-001',
        status: 'READY' as const,
        sequenceNumber: 1
      },
      {
        operationId: 2,
        operationName: 'Cooling',
        operationCode: 'OP-002',
        status: 'NOT_STARTED' as const,
        sequenceNumber: 2
      }
    ]
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getProcessById'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [ProcessDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getProcessById.and.returnValue(of(mockProcess));
    fixture = TestBed.createComponent(ProcessDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load process on init', () => {
    expect(apiServiceSpy.getProcessById).toHaveBeenCalledWith(1);
    expect(component.process).toEqual(mockProcess);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing process ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getProcessById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [ProcessDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProcessDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No process ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading process', () => {
    apiServiceSpy.getProcessById.and.returnValue(throwError(() => new Error('Error')));

    component.loadProcess(1);

    expect(component.error).toBe('Failed to load process');
    expect(component.loading).toBeFalse();
  });

  it('should navigate back to processes list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/processes']);
  });

  it('should navigate to operation detail', () => {
    spyOn(router, 'navigate');
    component.viewOperation(1);
    expect(router.navigate).toHaveBeenCalledWith(['/operations', 1]);
  });

  it('should return correct status class for NOT_STARTED', () => {
    expect(component.getStatusClass('NOT_STARTED')).toBe('status-not-started');
  });

  it('should return correct status class for IN_PROGRESS', () => {
    expect(component.getStatusClass('IN_PROGRESS')).toBe('status-in-progress');
  });

  it('should return correct status class for COMPLETED', () => {
    expect(component.getStatusClass('COMPLETED')).toBe('status-completed');
  });

  it('should return correct status class for ON_HOLD', () => {
    expect(component.getStatusClass('ON_HOLD')).toBe('status-on-hold');
  });

  it('should return correct operation status class for READY', () => {
    expect(component.getOperationStatusClass('READY')).toBe('op-ready');
  });

  it('should return correct operation status class for IN_PROGRESS', () => {
    expect(component.getOperationStatusClass('IN_PROGRESS')).toBe('op-in-progress');
  });

  it('should return correct operation status class for CONFIRMED', () => {
    expect(component.getOperationStatusClass('CONFIRMED')).toBe('op-confirmed');
  });

  it('should return correct operation status class for BLOCKED', () => {
    expect(component.getOperationStatusClass('BLOCKED')).toBe('op-blocked');
  });

  it('should return correct decision class for APPROVED', () => {
    expect(component.getDecisionClass('APPROVED')).toBe('decision-approved');
  });

  it('should return correct decision class for REJECTED', () => {
    expect(component.getDecisionClass('REJECTED')).toBe('decision-rejected');
  });

  it('should return correct decision class for PENDING', () => {
    expect(component.getDecisionClass('PENDING')).toBe('decision-pending');
  });

  it('should return empty string for undefined decision', () => {
    expect(component.getDecisionClass(undefined)).toBe('');
  });
});
