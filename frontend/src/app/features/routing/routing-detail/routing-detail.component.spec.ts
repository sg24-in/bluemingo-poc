import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RoutingDetailComponent } from './routing-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('RoutingDetailComponent', () => {
  let component: RoutingDetailComponent;
  let fixture: ComponentFixture<RoutingDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockRouting = {
    routingId: 1,
    routingName: 'Steel Melting Route',
    routingType: 'SEQUENTIAL',
    status: 'ACTIVE',
    processId: 10,
    processName: 'Melting Process',
    createdBy: 'admin',
    createdOn: '2026-01-15T10:00:00',
    updatedBy: 'admin',
    updatedOn: '2026-01-20T14:30:00',
    steps: [
      {
        routingStepId: 1,
        operationName: 'Furnace Loading',
        operationType: 'MELTING',
        operationCode: 'ML-001',
        sequenceNumber: 1,
        isParallel: false,
        mandatoryFlag: true,
        producesOutputBatch: false,
        allowsSplit: false,
        allowsMerge: false,
        estimatedDurationMinutes: 60,
        status: 'ACTIVE'
      },
      {
        routingStepId: 2,
        operationName: 'Casting',
        operationType: 'CASTING',
        operationCode: 'CS-001',
        sequenceNumber: 2,
        isParallel: false,
        mandatoryFlag: true,
        producesOutputBatch: true,
        allowsSplit: true,
        allowsMerge: false,
        estimatedDurationMinutes: 45,
        status: 'ACTIVE'
      }
    ]
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getRoutingById',
      'activateRouting',
      'deactivateRouting',
      'putRoutingOnHold',
      'releaseRoutingFromHold'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [RoutingDetailComponent],
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
    apiServiceSpy.getRoutingById.and.returnValue(of(mockRouting));
    fixture = TestBed.createComponent(RoutingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load routing on init', () => {
    expect(apiServiceSpy.getRoutingById).toHaveBeenCalledWith(1);
    expect(component.routing).toEqual(mockRouting);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing routing ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getRoutingById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [RoutingDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RoutingDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No routing ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading routing', () => {
    apiServiceSpy.getRoutingById.and.returnValue(throwError(() => new Error('Error')));

    component.loadRouting(1);

    expect(component.error).toBe('Failed to load routing');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit routing', () => {
    spyOn(router, 'navigate');
    component.editRouting();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/routing', 1, 'edit']);
  });

  it('should navigate back to routing list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/routing']);
  });

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

  it('should return correct type label for SEQUENTIAL', () => {
    expect(component.getTypeLabel('SEQUENTIAL')).toBe('Sequential');
  });

  it('should return correct type label for PARALLEL', () => {
    expect(component.getTypeLabel('PARALLEL')).toBe('Parallel');
  });

  it('should sort steps by sequence number', () => {
    const unsortedRouting = {
      ...mockRouting,
      steps: [
        { ...mockRouting.steps[1], sequenceNumber: 2 },
        { ...mockRouting.steps[0], sequenceNumber: 1 }
      ]
    };
    apiServiceSpy.getRoutingById.and.returnValue(of(unsortedRouting));

    component.loadRouting(1);

    expect(component.routing?.steps?.[0].sequenceNumber).toBe(1);
    expect(component.routing?.steps?.[1].sequenceNumber).toBe(2);
  });

  it('should activate routing', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.activateRouting.and.returnValue(of({}));
    apiServiceSpy.getRoutingById.and.returnValue(of({ ...mockRouting, status: 'ACTIVE' }));

    component.activateRouting();

    expect(apiServiceSpy.activateRouting).toHaveBeenCalledWith(1, true);
  });

  it('should not activate routing if not confirmed', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.activateRouting();

    expect(apiServiceSpy.activateRouting).not.toHaveBeenCalled();
  });

  it('should deactivate routing', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deactivateRouting.and.returnValue(of({}));
    apiServiceSpy.getRoutingById.and.returnValue(of({ ...mockRouting, status: 'INACTIVE' }));

    component.deactivateRouting();

    expect(apiServiceSpy.deactivateRouting).toHaveBeenCalledWith(1);
  });

  it('should put routing on hold', () => {
    spyOn(window, 'prompt').and.returnValue('Quality issue');
    apiServiceSpy.putRoutingOnHold.and.returnValue(of({}));
    apiServiceSpy.getRoutingById.and.returnValue(of({ ...mockRouting, status: 'ON_HOLD' }));

    component.putOnHold();

    expect(apiServiceSpy.putRoutingOnHold).toHaveBeenCalledWith(1, 'Quality issue');
  });

  it('should not put on hold if prompt cancelled', () => {
    spyOn(window, 'prompt').and.returnValue(null);

    component.putOnHold();

    expect(apiServiceSpy.putRoutingOnHold).not.toHaveBeenCalled();
  });

  it('should release routing from hold', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.releaseRoutingFromHold.and.returnValue(of({}));
    apiServiceSpy.getRoutingById.and.returnValue(of({ ...mockRouting, status: 'DRAFT' }));

    component.releaseFromHold();

    expect(apiServiceSpy.releaseRoutingFromHold).toHaveBeenCalledWith(1);
  });

  it('should handle error activating routing', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.activateRouting.and.returnValue(
      throwError(() => ({ error: { message: 'Activation failed' } }))
    );

    component.activateRouting();

    expect(component.error).toBe('Activation failed');
  });

  it('should handle error deactivating routing', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deactivateRouting.and.returnValue(
      throwError(() => ({ error: { message: 'Deactivation failed' } }))
    );

    component.deactivateRouting();

    expect(component.error).toBe('Deactivation failed');
  });

  it('should handle error putting on hold', () => {
    spyOn(window, 'prompt').and.returnValue('Reason');
    apiServiceSpy.putRoutingOnHold.and.returnValue(
      throwError(() => ({ error: { message: 'Hold failed' } }))
    );

    component.putOnHold();

    expect(component.error).toBe('Hold failed');
  });

  it('should handle error releasing from hold', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.releaseRoutingFromHold.and.returnValue(
      throwError(() => ({ error: { message: 'Release failed' } }))
    );

    component.releaseFromHold();

    expect(component.error).toBe('Release failed');
  });

  it('should return correct step status class for IN_PROGRESS', () => {
    expect(component.getStepStatusClass('IN_PROGRESS')).toBe('status-in-progress');
  });

  it('should return correct step status class for CONFIRMED', () => {
    expect(component.getStepStatusClass('CONFIRMED')).toBe('status-confirmed');
  });
});
