import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchSizeListComponent } from './batch-size-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('BatchSizeListComponent', () => {
  let component: BatchSizeListComponent;
  let fixture: ComponentFixture<BatchSizeListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockConfigs: any[] = [
    {
      configId: 1,
      operationType: 'MELTING',
      materialId: null,
      productSku: null,
      equipmentType: null,
      minBatchSize: 0,
      maxBatchSize: 50,
      preferredBatchSize: 45,
      unit: 'T',
      allowPartialBatch: true,
      isActive: true,
      priority: 10,
      createdOn: '2024-01-01T00:00:00',
      createdBy: 'SYSTEM'
    },
    {
      configId: 2,
      operationType: 'CASTING',
      materialId: 'RM-001',
      productSku: null,
      equipmentType: null,
      minBatchSize: 5,
      maxBatchSize: 25,
      preferredBatchSize: 20,
      unit: 'T',
      allowPartialBatch: true,
      isActive: true,
      priority: 20,
      createdOn: '2024-01-02T00:00:00',
      createdBy: 'admin'
    },
    {
      configId: 3,
      operationType: 'ROLLING',
      materialId: null,
      productSku: 'STL-ROD',
      equipmentType: null,
      minBatchSize: 0,
      maxBatchSize: 15,
      preferredBatchSize: null,
      unit: 'T',
      allowPartialBatch: false,
      isActive: false,
      priority: 5,
      createdOn: '2024-01-03T00:00:00',
      createdBy: 'admin'
    }
  ];

  const mockPagedResponse: PagedResponse<any> = {
    content: mockConfigs,
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
      'getBatchSizeConfigsPaged',
      'deleteBatchSizeConfig'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [BatchSizeListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getBatchSizeConfigsPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(BatchSizeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load configs on init', () => {
    expect(apiServiceSpy.getBatchSizeConfigsPaged).toHaveBeenCalled();
    expect(component.configs.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  describe('Filtering', () => {
    beforeEach(() => {
      apiServiceSpy.getBatchSizeConfigsPaged.calls.reset();
    });

    it('should filter by active status', () => {
      component.onFilterStatusChange('active');
      expect(component.filterStatus).toBe('active');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getBatchSizeConfigsPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by inactive status', () => {
      component.onFilterStatusChange('inactive');
      expect(component.filterStatus).toBe('inactive');
      expect(apiServiceSpy.getBatchSizeConfigsPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by search term', () => {
      component.onSearchChange('MELTING');
      expect(component.searchTerm).toBe('MELTING');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getBatchSizeConfigsPaged).toHaveBeenCalledTimes(1);
    });

    it('should reset to first page when filter changes', () => {
      component.page = 2;
      component.onFilterStatusChange('active');
      expect(component.page).toBe(0);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      apiServiceSpy.getBatchSizeConfigsPaged.calls.reset();
    });

    it('should change page', () => {
      component.onPageChange(1);
      expect(apiServiceSpy.getBatchSizeConfigsPaged).toHaveBeenCalledTimes(1);
    });

    it('should change page size', () => {
      component.onSizeChange(50);
      expect(component.size).toBe(50);
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getBatchSizeConfigsPaged).toHaveBeenCalledTimes(1);
    });
  });

  describe('Navigation', () => {
    it('should navigate to create page', () => {
      spyOn(router, 'navigate');
      component.create();
      expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-size/new']);
    });

    it('should navigate to edit page', () => {
      spyOn(router, 'navigate');
      component.edit(mockConfigs[0]);
      expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-size', 1, 'edit']);
    });
  });

  describe('Delete', () => {
    it('should delete config when confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      apiServiceSpy.deleteBatchSizeConfig.and.returnValue(of(void 0));

      component.delete(mockConfigs[0]);

      expect(apiServiceSpy.deleteBatchSizeConfig).toHaveBeenCalledWith(1);
    });

    it('should not delete when not confirmed', () => {
      spyOn(window, 'confirm').and.returnValue(false);

      component.delete(mockConfigs[0]);

      expect(apiServiceSpy.deleteBatchSizeConfig).not.toHaveBeenCalled();
    });

    it('should handle delete error', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(window, 'alert');
      apiServiceSpy.deleteBatchSizeConfig.and.returnValue(throwError(() => ({ error: { message: 'Delete failed' } })));

      component.delete(mockConfigs[0]);

      expect(window.alert).toHaveBeenCalledWith('Delete failed');
    });
  });

  describe('Utility Functions', () => {
    it('should format scope with operation type', () => {
      const config = { ...mockConfigs[0], materialId: null, productSku: null, equipmentType: null };
      expect(component.formatScope(config)).toBe('Op: MELTING');
    });

    it('should format scope with multiple fields', () => {
      const config = { ...mockConfigs[1], productSku: 'SKU-001' };
      expect(component.formatScope(config)).toContain('Material: RM-001');
      expect(component.formatScope(config)).toContain('Product: SKU-001');
    });

    it('should show generic default when no scope fields', () => {
      const config = { ...mockConfigs[0], operationType: null, materialId: null, productSku: null, equipmentType: null };
      expect(component.formatScope(config)).toBe('Generic (Default)');
    });
  });

  describe('Error Handling', () => {
    it('should handle load error', () => {
      apiServiceSpy.getBatchSizeConfigsPaged.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));

      component.loadPaged();

      expect(component.error).toBe('Load failed');
      expect(component.loading).toBeFalse();
    });
  });

  it('should render app-pagination when there is data', () => {
    component.configs = [{ configId: 1, maxBatchSize: 100, minBatchSize: 10, unit: 'T', allowPartialBatch: true, isActive: true, priority: 1 } as any];
    component.loading = false;
    component.totalElements = 1;
    component.totalPages = 1;
    component.hasNext = false;
    component.hasPrevious = false;
    component.page = 0;
    component.size = 20;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-pagination')).toBeTruthy();
  });
});
