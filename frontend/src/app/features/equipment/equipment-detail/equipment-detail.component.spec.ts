import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EquipmentDetailComponent } from './equipment-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('EquipmentDetailComponent', () => {
  let component: EquipmentDetailComponent;
  let fixture: ComponentFixture<EquipmentDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockEquipment = {
    equipmentId: 1,
    equipmentCode: 'EQ-001',
    name: 'Test Equipment',
    equipmentType: 'FURNACE',
    status: 'AVAILABLE' as const,
    capacity: 1000,
    location: 'Plant A'
  };

  const mockStatusResponse = {
    equipmentId: 1,
    equipmentCode: 'EQ-001',
    previousStatus: 'AVAILABLE',
    newStatus: 'MAINTENANCE',
    message: 'Status updated successfully',
    updatedBy: 'admin',
    updatedOn: new Date().toISOString()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getEquipmentById',
      'startEquipmentMaintenance',
      'endEquipmentMaintenance',
      'putEquipmentOnHold',
      'releaseEquipmentFromHold'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [EquipmentDetailComponent],
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
    apiServiceSpy.getEquipmentById.and.returnValue(of(mockEquipment));
    fixture = TestBed.createComponent(EquipmentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load equipment on init', () => {
    expect(apiServiceSpy.getEquipmentById).toHaveBeenCalledWith(1);
    expect(component.equipment).toEqual(mockEquipment);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing equipment ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getEquipmentById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [EquipmentDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EquipmentDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No equipment ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading equipment', () => {
    apiServiceSpy.getEquipmentById.and.returnValue(throwError(() => new Error('Error')));

    component.loadEquipment(1);

    expect(component.error).toBe('Failed to load equipment');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit equipment', () => {
    spyOn(router, 'navigate');
    component.editEquipment();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/equipment', 1, 'edit']);
  });

  it('should navigate back to equipment list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/equipment']);
  });

  it('should return correct status class for AVAILABLE', () => {
    expect(component.getStatusClass('AVAILABLE')).toBe('status-available');
  });

  it('should return correct status class for IN_USE', () => {
    expect(component.getStatusClass('IN_USE')).toBe('status-in-use');
  });

  it('should return correct status class for MAINTENANCE', () => {
    expect(component.getStatusClass('MAINTENANCE')).toBe('status-maintenance');
  });

  it('should return correct status class for ON_HOLD', () => {
    expect(component.getStatusClass('ON_HOLD')).toBe('status-on-hold');
  });

  it('should start maintenance', () => {
    spyOn(window, 'prompt').and.returnValue('Scheduled maintenance');
    apiServiceSpy.startEquipmentMaintenance.and.returnValue(of(mockStatusResponse));
    apiServiceSpy.getEquipmentById.and.returnValue(of({ ...mockEquipment, status: 'MAINTENANCE' as const }));

    component.startMaintenance();

    expect(apiServiceSpy.startEquipmentMaintenance).toHaveBeenCalledWith(1, 'Scheduled maintenance');
  });

  it('should not start maintenance if no reason provided', () => {
    spyOn(window, 'prompt').and.returnValue(null);

    component.startMaintenance();

    expect(apiServiceSpy.startEquipmentMaintenance).not.toHaveBeenCalled();
  });

  it('should end maintenance', () => {
    component.equipment = { ...mockEquipment, status: 'MAINTENANCE' as const } as any;
    apiServiceSpy.endEquipmentMaintenance.and.returnValue(of({ ...mockStatusResponse, newStatus: 'AVAILABLE' }));

    component.endMaintenance();

    expect(apiServiceSpy.endEquipmentMaintenance).toHaveBeenCalledWith(1);
  });

  it('should put on hold', () => {
    spyOn(window, 'prompt').and.returnValue('Quality issue');
    apiServiceSpy.putEquipmentOnHold.and.returnValue(of({ ...mockStatusResponse, newStatus: 'ON_HOLD' }));
    apiServiceSpy.getEquipmentById.and.returnValue(of({ ...mockEquipment, status: 'ON_HOLD' as const }));

    component.putOnHold();

    expect(apiServiceSpy.putEquipmentOnHold).toHaveBeenCalledWith(1, 'Quality issue');
  });

  it('should release from hold', () => {
    component.equipment = { ...mockEquipment, status: 'ON_HOLD' as const } as any;
    apiServiceSpy.releaseEquipmentFromHold.and.returnValue(of({ ...mockStatusResponse, newStatus: 'AVAILABLE' }));

    component.releaseFromHold();

    expect(apiServiceSpy.releaseEquipmentFromHold).toHaveBeenCalledWith(1);
  });

  it('should handle error starting maintenance', () => {
    spyOn(window, 'prompt').and.returnValue('Maintenance');
    apiServiceSpy.startEquipmentMaintenance.and.returnValue(throwError(() => new Error('Error')));

    component.startMaintenance();

    expect(component.error).toBe('Failed to start maintenance');
  });

  it('should handle error ending maintenance', () => {
    apiServiceSpy.endEquipmentMaintenance.and.returnValue(throwError(() => new Error('Error')));

    component.endMaintenance();

    expect(component.error).toBe('Failed to end maintenance');
  });

  it('should handle error putting on hold', () => {
    spyOn(window, 'prompt').and.returnValue('Hold reason');
    apiServiceSpy.putEquipmentOnHold.and.returnValue(throwError(() => new Error('Error')));

    component.putOnHold();

    expect(component.error).toBe('Failed to put on hold');
  });

  it('should handle error releasing from hold', () => {
    apiServiceSpy.releaseEquipmentFromHold.and.returnValue(throwError(() => new Error('Error')));

    component.releaseFromHold();

    expect(component.error).toBe('Failed to release from hold');
  });
});
