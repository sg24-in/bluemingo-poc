import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { QuantityTypeConfig } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';
import { QuantityTypeListComponent } from './quantity-type-list.component';

describe('QuantityTypeListComponent', () => {
  let component: QuantityTypeListComponent;
  let fixture: ComponentFixture<QuantityTypeListComponent>;
  let apiService: jasmine.SpyObj<ApiService>;
  let router: jasmine.SpyObj<Router>;

  const mockQuantityTypeConfigs: QuantityTypeConfig[] = [
    {
      configId: 1,
      configName: 'DEFAULT_DECIMAL',
      quantityType: 'DECIMAL',
      decimalPrecision: 4,
      roundingRule: 'HALF_UP',
      status: 'ACTIVE',
      createdOn: '2026-01-01T10:00:00',
      createdBy: 'admin'
    },
    {
      configId: 2,
      configName: 'FURNACE_WEIGHT',
      materialCode: 'COPPER',
      operationType: 'MELTING',
      equipmentType: 'FURNACE',
      quantityType: 'DECIMAL',
      decimalPrecision: 2,
      roundingRule: 'HALF_UP',
      minQuantity: 10,
      maxQuantity: 1000,
      unit: 'KG',
      status: 'ACTIVE',
      createdOn: '2026-01-02T10:00:00',
      createdBy: 'admin'
    },
    {
      configId: 3,
      configName: 'OLD_CONFIG',
      quantityType: 'DECIMAL',
      decimalPrecision: 3,
      roundingRule: 'DOWN',
      status: 'INACTIVE',
      createdOn: '2025-12-01T10:00:00',
      createdBy: 'admin'
    }
  ];

  const mockPagedResponse: PagedResponse<QuantityTypeConfig> = {
    content: mockQuantityTypeConfigs,
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
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getQuantityTypeConfigsPaged',
      'deleteQuantityTypeConfig'
    ]);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [QuantityTypeListComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    apiService.getQuantityTypeConfigsPaged.and.returnValue(of(mockPagedResponse));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(QuantityTypeListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    fixture.detectChanges();

    expect(apiService.getQuantityTypeConfigsPaged).toHaveBeenCalled();
    expect(component.items).toEqual(mockQuantityTypeConfigs);
    expect(component.loading).toBe(false);
    expect(component.totalElements).toBe(3);
    expect(component.totalPages).toBe(1);
  });

  it('should set pagination state correctly', () => {
    fixture.detectChanges();

    expect(component.page).toBe(0);
    expect(component.size).toBe(20);
    expect(component.hasNext).toBe(false);
    expect(component.hasPrevious).toBe(false);
  });

  it('should filter by status', () => {
    fixture.detectChanges();
    apiService.getQuantityTypeConfigsPaged.calls.reset();

    const activeConfigs = mockQuantityTypeConfigs.filter(c => c.status === 'ACTIVE');
    apiService.getQuantityTypeConfigsPaged.and.returnValue(of({
      content: activeConfigs,
      page: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
      hasNext: false,
      hasPrevious: false
    }));

    component.onFilterStatusChange('ACTIVE');

    expect(component.filterStatus).toBe('ACTIVE');
    expect(component.page).toBe(0);
    expect(apiService.getQuantityTypeConfigsPaged).toHaveBeenCalled();
    expect(component.items.length).toBe(2);
  });

  it('should clear filter when empty status selected', () => {
    component.filterStatus = 'ACTIVE';
    fixture.detectChanges();
    apiService.getQuantityTypeConfigsPaged.calls.reset();

    component.onFilterStatusChange('');

    expect(component.filterStatus).toBe('');
    expect(component.page).toBe(0);
    expect(apiService.getQuantityTypeConfigsPaged).toHaveBeenCalled();
  });

  it('should filter by search term', () => {
    fixture.detectChanges();
    apiService.getQuantityTypeConfigsPaged.calls.reset();

    const searchResults = [mockQuantityTypeConfigs[1]];
    apiService.getQuantityTypeConfigsPaged.and.returnValue(of({
      content: searchResults,
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      hasNext: false,
      hasPrevious: false
    }));

    component.onSearchChange('FURNACE');

    expect(component.searchTerm).toBe('FURNACE');
    expect(component.page).toBe(0);
    expect(apiService.getQuantityTypeConfigsPaged).toHaveBeenCalled();
    expect(component.items.length).toBe(1);
  });

  it('should change page', () => {
    fixture.detectChanges();
    apiService.getQuantityTypeConfigsPaged.calls.reset();

    const page2Response: PagedResponse<QuantityTypeConfig> = {
      content: [mockQuantityTypeConfigs[2]],
      page: 1,
      size: 20,
      totalElements: 3,
      totalPages: 2,
      first: false,
      last: true,
      hasNext: false,
      hasPrevious: true
    };
    apiService.getQuantityTypeConfigsPaged.and.returnValue(of(page2Response));

    component.onPageChange(1);

    expect(component.page).toBe(1);
    expect(apiService.getQuantityTypeConfigsPaged).toHaveBeenCalled();
  });

  it('should change page size', () => {
    fixture.detectChanges();
    apiService.getQuantityTypeConfigsPaged.calls.reset();

    const newSizeResponse: PagedResponse<QuantityTypeConfig> = {
      content: mockQuantityTypeConfigs,
      page: 0,
      size: 50,
      totalElements: 3,
      totalPages: 1,
      first: true,
      last: true,
      hasNext: false,
      hasPrevious: false
    };
    apiService.getQuantityTypeConfigsPaged.and.returnValue(of(newSizeResponse));

    component.onSizeChange(50);

    expect(component.size).toBe(50);
    expect(component.page).toBe(0);
    expect(apiService.getQuantityTypeConfigsPaged).toHaveBeenCalled();
  });

  it('should navigate to create page', () => {
    component.create();

    expect(router.navigate).toHaveBeenCalledWith(['/manage/config/quantity-type/new']);
  });

  it('should navigate to edit page', () => {
    component.edit(mockQuantityTypeConfigs[0]);

    expect(router.navigate).toHaveBeenCalledWith(['/manage/config/quantity-type', 1, 'edit']);
  });

  it('should open delete modal', () => {
    component.openDeleteModal(mockQuantityTypeConfigs[0]);

    expect(component.showDeleteModal).toBe(true);
    expect(component.itemToDelete).toEqual(mockQuantityTypeConfigs[0]);
  });

  it('should close delete modal', () => {
    component.showDeleteModal = true;
    component.itemToDelete = mockQuantityTypeConfigs[0];

    component.closeDeleteModal();

    expect(component.showDeleteModal).toBe(false);
    expect(component.itemToDelete).toBeNull();
    expect(component.deleteError).toBe('');
  });

  it('should delete item successfully', () => {
    fixture.detectChanges();
    component.itemToDelete = mockQuantityTypeConfigs[0];
    apiService.deleteQuantityTypeConfig.and.returnValue(of(void 0));
    apiService.getQuantityTypeConfigsPaged.calls.reset();

    component.confirmDelete();

    expect(component.deleteLoading).toBe(false);
    expect(apiService.deleteQuantityTypeConfig).toHaveBeenCalledWith(1);
    expect(component.showDeleteModal).toBe(false);
    expect(apiService.getQuantityTypeConfigsPaged).toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    component.itemToDelete = mockQuantityTypeConfigs[0];
    component.showDeleteModal = true;
    const errorResponse = { error: { message: 'Cannot delete config in use' } };
    apiService.deleteQuantityTypeConfig.and.returnValue(throwError(() => errorResponse));

    component.confirmDelete();

    expect(component.deleteLoading).toBe(false);
    expect(component.deleteError).toBe('Cannot delete config in use');
    expect(component.showDeleteModal).toBe(true);
  });

  it('should handle error loading items', () => {
    apiService.getQuantityTypeConfigsPaged.and.returnValue(
      throwError(() => new Error('Network error'))
    );

    fixture.detectChanges();

    expect(component.loading).toBe(false);
  });
});
