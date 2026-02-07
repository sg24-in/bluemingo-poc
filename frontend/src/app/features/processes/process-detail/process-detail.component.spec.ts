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

  // Process is now design-time only with DRAFT/ACTIVE/INACTIVE statuses
  const mockProcess = {
    processId: 1,
    processName: 'Melting Process',
    status: 'ACTIVE',
    createdOn: new Date().toISOString(),
    createdBy: 'admin',
    routings: [
      {
        routingId: 1,
        routingName: 'Standard Melting',
        routingType: 'SEQUENTIAL',
        status: 'ACTIVE'
      }
    ]
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getProcessById',
      'activateProcess',
      'deactivateProcess'
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
    apiServiceSpy.getProcessById.and.returnValue(of(mockProcess as any));
    fixture = TestBed.createComponent(ProcessDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load process on init', () => {
    expect(apiServiceSpy.getProcessById).toHaveBeenCalledWith(1);
    expect(component.process).toBeTruthy();
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

  // Design-time status classes for Process templates
  describe('getStatusClass', () => {
    it('should return correct status class for DRAFT', () => {
      expect(component.getStatusClass('DRAFT')).toBe('draft');
    });

    it('should return correct status class for ACTIVE', () => {
      expect(component.getStatusClass('ACTIVE')).toBe('active');
    });

    it('should return correct status class for INACTIVE', () => {
      expect(component.getStatusClass('INACTIVE')).toBe('inactive');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusClass('UNKNOWN')).toBe('');
    });
  });

  // Operation status classes (runtime)
  describe('getOperationStatusClass', () => {
    it('should return correct operation status class for NOT_STARTED', () => {
      expect(component.getOperationStatusClass('NOT_STARTED')).toBe('op-not-started');
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

    it('should return correct operation status class for ON_HOLD', () => {
      expect(component.getOperationStatusClass('ON_HOLD')).toBe('op-on-hold');
    });

    it('should return correct operation status class for BLOCKED', () => {
      expect(component.getOperationStatusClass('BLOCKED')).toBe('op-blocked');
    });
  });

  // Activate/Deactivate functionality
  describe('activateProcess', () => {
    it('should activate process successfully', () => {
      const activatedProcess = { ...mockProcess, status: 'ACTIVE' };
      apiServiceSpy.activateProcess.and.returnValue(of(activatedProcess as any));

      component.process = { ...mockProcess, status: 'DRAFT' } as any;
      component.activateProcess();

      expect(apiServiceSpy.activateProcess).toHaveBeenCalledWith(1);
      expect(component.processing).toBeFalse();
    });

    it('should handle activate error', () => {
      apiServiceSpy.activateProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot activate' } }))
      );

      component.process = mockProcess as any;
      component.activateProcess();

      expect(component.error).toBe('Cannot activate');
      expect(component.processing).toBeFalse();
    });

    it('should not activate if no process', () => {
      component.process = null;
      component.activateProcess();
      expect(apiServiceSpy.activateProcess).not.toHaveBeenCalled();
    });
  });

  describe('deactivateProcess', () => {
    it('should deactivate process successfully', () => {
      const deactivatedProcess = { ...mockProcess, status: 'INACTIVE' };
      apiServiceSpy.deactivateProcess.and.returnValue(of(deactivatedProcess as any));

      component.process = mockProcess as any;
      component.deactivateProcess();

      expect(apiServiceSpy.deactivateProcess).toHaveBeenCalledWith(1);
      expect(component.processing).toBeFalse();
    });

    it('should handle deactivate error', () => {
      apiServiceSpy.deactivateProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot deactivate' } }))
      );

      component.process = mockProcess as any;
      component.deactivateProcess();

      expect(component.error).toBe('Cannot deactivate');
      expect(component.processing).toBeFalse();
    });

    it('should not deactivate if no process', () => {
      component.process = null;
      component.deactivateProcess();
      expect(apiServiceSpy.deactivateProcess).not.toHaveBeenCalled();
    });
  });
});
