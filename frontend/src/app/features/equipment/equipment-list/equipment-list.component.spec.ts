import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { EquipmentListComponent } from './equipment-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('EquipmentListComponent', () => {
  let component: EquipmentListComponent;
  let fixture: ComponentFixture<EquipmentListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockEquipment = [
    {
      equipmentId: 1,
      equipmentCode: 'EQ-001',
      name: 'Furnace 1',
      equipmentType: 'FURNACE',
      capacity: 100,
      capacityUnit: 'T',
      location: 'Plant A',
      status: 'AVAILABLE'
    },
    {
      equipmentId: 2,
      equipmentCode: 'EQ-002',
      name: 'Caster 1',
      equipmentType: 'CASTER',
      capacity: 50,
      capacityUnit: 'T',
      location: 'Plant A',
      status: 'MAINTENANCE',
      maintenanceReason: 'Scheduled maintenance'
    },
    {
      equipmentId: 3,
      equipmentCode: 'EQ-003',
      name: 'Mill 1',
      equipmentType: 'ROLLING_MILL',
      capacity: 200,
      capacityUnit: 'T',
      location: 'Plant B',
      status: 'ON_HOLD',
      holdReason: 'Pending inspection'
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getAllEquipment',
      'startEquipmentMaintenance',
      'endEquipmentMaintenance',
      'putEquipmentOnHold',
      'releaseEquipmentFromHold'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      declarations: [EquipmentListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getAllEquipment.and.returnValue(of(mockEquipment as any));
    fixture = TestBed.createComponent(EquipmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load equipment on init', () => {
    expect(apiServiceSpy.getAllEquipment).toHaveBeenCalled();
    expect(component.equipment.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  describe('Filtering', () => {
    it('should filter by status', () => {
      component.onFilterStatusChange('AVAILABLE');
      expect(component.filteredEquipment.length).toBe(1);
      expect(component.filteredEquipment[0].status).toBe('AVAILABLE');
    });

    it('should filter by type', () => {
      component.onFilterTypeChange('FURNACE');
      expect(component.filteredEquipment.length).toBe(1);
      expect(component.filteredEquipment[0].equipmentType).toBe('FURNACE');
    });

    it('should filter by search term', () => {
      component.onSearchChange('EQ-001');
      expect(component.filteredEquipment.length).toBe(1);
      expect(component.filteredEquipment[0].equipmentCode).toBe('EQ-001');
    });
  });

  describe('Maintenance Operations', () => {
    it('should open maintenance modal', () => {
      component.openMaintenanceModal(mockEquipment[0]);
      expect(component.showMaintenanceModal).toBeTrue();
      expect(component.selectedEquipment).toBe(mockEquipment[0]);
    });

    it('should close maintenance modal', () => {
      component.openMaintenanceModal(mockEquipment[0]);
      component.closeMaintenanceModal();
      expect(component.showMaintenanceModal).toBeFalse();
      expect(component.selectedEquipment).toBeNull();
    });

    it('should show error when starting maintenance without reason', () => {
      component.openMaintenanceModal(mockEquipment[0]);
      component.actionReason = '';
      component.confirmStartMaintenance();
      expect(component.actionError).toBe('Please provide a reason for maintenance.');
    });

    it('should start maintenance successfully', () => {
      const mockResponse = { equipmentId: 1, newStatus: 'MAINTENANCE' } as any;
      apiServiceSpy.startEquipmentMaintenance.and.returnValue(of(mockResponse));

      component.openMaintenanceModal(mockEquipment[0]);
      component.actionReason = 'Scheduled maintenance';
      component.confirmStartMaintenance();

      expect(apiServiceSpy.startEquipmentMaintenance).toHaveBeenCalledWith(1, 'Scheduled maintenance', undefined);
      expect(component.showMaintenanceModal).toBeFalse();
    });

    it('should determine if maintenance can be started', () => {
      expect(component.canStartMaintenance({ status: 'AVAILABLE' })).toBeTrue();
      expect(component.canStartMaintenance({ status: 'ON_HOLD' })).toBeTrue();
      expect(component.canStartMaintenance({ status: 'MAINTENANCE' })).toBeFalse();
      expect(component.canStartMaintenance({ status: 'IN_USE' })).toBeFalse();
    });

    it('should determine if maintenance can be ended', () => {
      expect(component.canEndMaintenance({ status: 'MAINTENANCE' })).toBeTrue();
      expect(component.canEndMaintenance({ status: 'AVAILABLE' })).toBeFalse();
    });
  });

  describe('Hold Operations', () => {
    it('should open hold modal', () => {
      component.openHoldModal(mockEquipment[0]);
      expect(component.showHoldModal).toBeTrue();
      expect(component.selectedEquipment).toBe(mockEquipment[0]);
    });

    it('should close hold modal', () => {
      component.openHoldModal(mockEquipment[0]);
      component.closeHoldModal();
      expect(component.showHoldModal).toBeFalse();
      expect(component.selectedEquipment).toBeNull();
    });

    it('should show error when putting on hold without reason', () => {
      component.openHoldModal(mockEquipment[0]);
      component.actionReason = '';
      component.confirmPutOnHold();
      expect(component.actionError).toBe('Please provide a reason for putting on hold.');
    });

    it('should put on hold successfully', () => {
      const mockResponse = { equipmentId: 1, newStatus: 'ON_HOLD' } as any;
      apiServiceSpy.putEquipmentOnHold.and.returnValue(of(mockResponse));

      component.openHoldModal(mockEquipment[0]);
      component.actionReason = 'Pending inspection';
      component.confirmPutOnHold();

      expect(apiServiceSpy.putEquipmentOnHold).toHaveBeenCalledWith(1, 'Pending inspection');
      expect(component.showHoldModal).toBeFalse();
    });

    it('should determine if equipment can be put on hold', () => {
      expect(component.canPutOnHold({ status: 'AVAILABLE' })).toBeTrue();
      expect(component.canPutOnHold({ status: 'MAINTENANCE' })).toBeTrue();
      expect(component.canPutOnHold({ status: 'ON_HOLD' })).toBeFalse();
      expect(component.canPutOnHold({ status: 'IN_USE' })).toBeFalse();
    });

    it('should determine if equipment can be released from hold', () => {
      expect(component.canReleaseFromHold({ status: 'ON_HOLD' })).toBeTrue();
      expect(component.canReleaseFromHold({ status: 'AVAILABLE' })).toBeFalse();
    });
  });

  it('should get status summary', () => {
    const summary = component.getStatusSummary();
    expect(summary.length).toBe(3);

    const available = summary.find(s => s.status === 'AVAILABLE');
    expect(available?.count).toBe(1);

    const maintenance = summary.find(s => s.status === 'MAINTENANCE');
    expect(maintenance?.count).toBe(1);
  });

  it('should handle error loading equipment', () => {
    apiServiceSpy.getAllEquipment.and.returnValue(throwError(() => new Error('Error')));
    component.loadEquipment();
    expect(component.loading).toBeFalse();
  });
});
