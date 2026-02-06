import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OperationDetailComponent } from './operation-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('OperationDetailComponent', () => {
  let component: OperationDetailComponent;
  let fixture: ComponentFixture<OperationDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockOperation = {
    operationId: 1,
    operationName: 'Heat Treatment',
    operationCode: 'OP-001',
    operationType: 'FURNACE',
    processId: 10,
    processName: 'Melting Process',
    status: 'READY' as const,
    sequenceNumber: 1,
    targetQty: 100,
    confirmedQty: 50
  };

  const mockStatusResponse = {
    operationId: 1,
    previousStatus: 'READY',
    newStatus: 'BLOCKED',
    message: 'Operation blocked successfully',
    updatedBy: 'admin',
    updatedOn: new Date().toISOString()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getOperationById',
      'blockOperation',
      'unblockOperation'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [OperationDetailComponent],
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
    apiServiceSpy.getOperationById.and.returnValue(of(mockOperation));
    fixture = TestBed.createComponent(OperationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load operation on init', () => {
    expect(apiServiceSpy.getOperationById).toHaveBeenCalledWith(1);
    expect(component.operation).toEqual(mockOperation);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing operation ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getOperationById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [OperationDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No operation ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading operation', () => {
    apiServiceSpy.getOperationById.and.returnValue(throwError(() => new Error('Error')));

    component.loadOperation(1);

    expect(component.error).toBe('Failed to load operation');
    expect(component.loading).toBeFalse();
  });

  it('should navigate back to operations list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/operations']);
  });

  it('should navigate to process detail', () => {
    spyOn(router, 'navigate');
    component.viewProcess();
    expect(router.navigate).toHaveBeenCalledWith(['/processes', 10]);
  });

  it('should navigate to production with operation ID', () => {
    spyOn(router, 'navigate');
    component.startProduction();
    expect(router.navigate).toHaveBeenCalledWith(['/production'], {
      queryParams: { operationId: 1 }
    });
  });

  it('should return correct status class for NOT_STARTED', () => {
    expect(component.getStatusClass('NOT_STARTED')).toBe('status-not-started');
  });

  it('should return correct status class for READY', () => {
    expect(component.getStatusClass('READY')).toBe('status-ready');
  });

  it('should return correct status class for IN_PROGRESS', () => {
    expect(component.getStatusClass('IN_PROGRESS')).toBe('status-in-progress');
  });

  it('should return correct status class for CONFIRMED', () => {
    expect(component.getStatusClass('CONFIRMED')).toBe('status-confirmed');
  });

  it('should return correct status class for ON_HOLD', () => {
    expect(component.getStatusClass('ON_HOLD')).toBe('status-on-hold');
  });

  it('should return correct status class for BLOCKED', () => {
    expect(component.getStatusClass('BLOCKED')).toBe('status-blocked');
  });

  it('should calculate progress correctly', () => {
    expect(component.getProgress()).toBe(50);
  });

  it('should return 0 progress for zero target', () => {
    component.operation = { ...mockOperation, targetQty: 0 } as any;
    expect(component.getProgress()).toBe(0);
  });

  it('should cap progress at 100', () => {
    component.operation = { ...mockOperation, confirmedQty: 150 } as any;
    expect(component.getProgress()).toBe(100);
  });

  it('should block operation', () => {
    spyOn(window, 'prompt').and.returnValue('Quality issue');
    apiServiceSpy.blockOperation.and.returnValue(of(mockStatusResponse));
    apiServiceSpy.getOperationById.and.returnValue(of({ ...mockOperation, status: 'BLOCKED' as const }));

    component.blockOperation();

    expect(apiServiceSpy.blockOperation).toHaveBeenCalledWith(1, 'Quality issue');
  });

  it('should not block if no reason provided', () => {
    spyOn(window, 'prompt').and.returnValue(null);

    component.blockOperation();

    expect(apiServiceSpy.blockOperation).not.toHaveBeenCalled();
  });

  it('should unblock operation', () => {
    component.operation = { ...mockOperation, status: 'BLOCKED' as const } as any;
    apiServiceSpy.unblockOperation.and.returnValue(of({ ...mockStatusResponse, newStatus: 'READY' }));

    component.unblockOperation();

    expect(apiServiceSpy.unblockOperation).toHaveBeenCalledWith(1);
  });

  it('should handle block error', () => {
    spyOn(window, 'prompt').and.returnValue('Reason');
    apiServiceSpy.blockOperation.and.returnValue(throwError(() => new Error('Error')));

    component.blockOperation();

    expect(component.error).toBe('Failed to block operation');
  });

  it('should handle unblock error', () => {
    apiServiceSpy.unblockOperation.and.returnValue(throwError(() => new Error('Error')));

    component.unblockOperation();

    expect(component.error).toBe('Failed to unblock operation');
  });

  it('should not navigate to process if processId is missing', () => {
    component.operation = { ...mockOperation, processId: undefined } as any;
    spyOn(router, 'navigate');

    component.viewProcess();

    expect(router.navigate).not.toHaveBeenCalled();
  });
});
