import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { EquipmentListComponent } from './equipment-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { Equipment } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('EquipmentListComponent', () => {
  let component: EquipmentListComponent;
  let fixture: ComponentFixture<EquipmentListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockEquipment: Equipment[] = [
    {
      equipmentId: 1,
      equipmentCode: 'EQ-001',
      name: 'Furnace 1',
      equipmentType: 'FURNACE',
      equipmentCategory: 'MELTING',  // GAP-021
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
      equipmentCategory: 'CASTING',  // GAP-021
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
      equipmentCategory: 'ROLLING',  // GAP-021
      capacity: 200,
      capacityUnit: 'T',
      location: 'Plant B',
      status: 'ON_HOLD',
      holdReason: 'Pending inspection'
    }
  ];

  const mockPagedResponse: PagedResponse<Equipment> = {
    content: mockEquipment,
    page: 0,
    size: 20,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getEquipmentPaged',
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
    apiServiceSpy.getEquipmentPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(EquipmentListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load equipment on init', () => {
    expect(apiServiceSpy.getEquipmentPaged).toHaveBeenCalled();
    expect(component.equipment.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should set pagination state from response', () => {
    expect(component.page).toBe(0);
    expect(component.totalElements).toBe(3);
    expect(component.totalPages).toBe(1);
  });

  describe('Filtering', () => {
    beforeEach(() => {
      // Reset call counts
      apiServiceSpy.getEquipmentPaged.calls.reset();
    });

    it('should filter by status', () => {
      component.onFilterStatusChange('AVAILABLE');
      expect(component.filterStatus).toBe('AVAILABLE');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getEquipmentPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by type', () => {
      component.onFilterTypeChange('FURNACE');
      expect(component.filterType).toBe('FURNACE');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getEquipmentPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by search term', () => {
      component.onSearchChange('EQ-001');
      expect(component.searchTerm).toBe('EQ-001');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getEquipmentPaged).toHaveBeenCalledTimes(1);
    });

    // GAP-021: Category filter tests
    it('should filter by category', () => {
      component.onFilterCategoryChange('MELTING');
      expect(component.filterCategory).toBe('MELTING');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getEquipmentPaged).toHaveBeenCalledTimes(1);
    });

    it('should clear category filter when "all" is selected', () => {
      component.filterCategory = 'MELTING';
      component.onFilterCategoryChange('all');
      expect(component.filterCategory).toBe('');
      expect(apiServiceSpy.getEquipmentPaged).toHaveBeenCalledTimes(1);
    });
  });

  // GAP-021: Category helper tests
  describe('Category Helpers', () => {
    it('should return label for valid category', () => {
      expect(component.getCategoryLabel('MELTING')).toBe('Melting');
      expect(component.getCategoryLabel('CASTING')).toBe('Casting');
      expect(component.getCategoryLabel('ROLLING')).toBe('Rolling');
      expect(component.getCategoryLabel('FINISHING')).toBe('Finishing');
      expect(component.getCategoryLabel('COATING')).toBe('Coating');
      expect(component.getCategoryLabel('WIRE_ROLLING')).toBe('Wire Rolling');
      expect(component.getCategoryLabel('PACKAGING')).toBe('Packaging');
      expect(component.getCategoryLabel('QUALITY')).toBe('Quality');
      expect(component.getCategoryLabel('UTILITY')).toBe('Utility');
      expect(component.getCategoryLabel('OTHER')).toBe('Other');
    });

    it('should return dash for undefined category', () => {
      expect(component.getCategoryLabel(undefined)).toBe('-');
    });

    it('should return original value for unknown category', () => {
      expect(component.getCategoryLabel('UNKNOWN' as any)).toBe('UNKNOWN');
    });

    it('should return CSS class for valid category', () => {
      expect(component.getCategoryClass('MELTING')).toBe('category-melting');
      expect(component.getCategoryClass('CASTING')).toBe('category-casting');
      expect(component.getCategoryClass('WIRE_ROLLING')).toBe('category-wire-rolling');
    });

    it('should return empty string for undefined category', () => {
      expect(component.getCategoryClass(undefined)).toBe('');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      // Reset call counts
      apiServiceSpy.getEquipmentPaged.calls.reset();
    });

    it('should change page', () => {
      // Mock response with new page
      const page1Response: PagedResponse<Equipment> = {
        ...mockPagedResponse,
        page: 1
      };
      apiServiceSpy.getEquipmentPaged.and.returnValue(of(page1Response));

      component.onPageChange(1);
      expect(component.page).toBe(1);
      expect(apiServiceSpy.getEquipmentPaged).toHaveBeenCalledTimes(1);
    });

    it('should change page size and reset to first page', () => {
      // Mock response with new size
      const size50Response: PagedResponse<Equipment> = {
        ...mockPagedResponse,
        size: 50,
        page: 0
      };
      apiServiceSpy.getEquipmentPaged.and.returnValue(of(size50Response));

      component.page = 2;
      component.onSizeChange(50);
      expect(component.size).toBe(50);
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getEquipmentPaged).toHaveBeenCalledTimes(1);
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
      expect(component.canStartMaintenance({ status: 'AVAILABLE' } as Equipment)).toBeTrue();
      expect(component.canStartMaintenance({ status: 'ON_HOLD' } as Equipment)).toBeTrue();
      expect(component.canStartMaintenance({ status: 'MAINTENANCE' } as Equipment)).toBeFalse();
      expect(component.canStartMaintenance({ status: 'IN_USE' } as Equipment)).toBeFalse();
    });

    it('should determine if maintenance can be ended', () => {
      expect(component.canEndMaintenance({ status: 'MAINTENANCE' } as Equipment)).toBeTrue();
      expect(component.canEndMaintenance({ status: 'AVAILABLE' } as Equipment)).toBeFalse();
    });
  });

  describe('Hold Operations', () => {
    it('should open hold modal', () => {
      component.openHoldModal(mockEquipment[0]);
      expect(component.showHoldModal).toBeTrue();
      expect(component.selectedEquipment).toEqual(mockEquipment[0]);
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
      expect(component.canPutOnHold({ status: 'AVAILABLE' } as Equipment)).toBeTrue();
      expect(component.canPutOnHold({ status: 'MAINTENANCE' } as Equipment)).toBeTrue();
      expect(component.canPutOnHold({ status: 'ON_HOLD' } as Equipment)).toBeFalse();
      expect(component.canPutOnHold({ status: 'IN_USE' } as Equipment)).toBeFalse();
    });

    it('should determine if equipment can be released from hold', () => {
      expect(component.canReleaseFromHold({ status: 'ON_HOLD' } as Equipment)).toBeTrue();
      expect(component.canReleaseFromHold({ status: 'AVAILABLE' } as Equipment)).toBeFalse();
    });
  });

  it('should handle error loading equipment', () => {
    apiServiceSpy.getEquipmentPaged.and.returnValue(throwError(() => new Error('Error')));
    component.loadEquipment();
    expect(component.loading).toBeFalse();
  });
});
