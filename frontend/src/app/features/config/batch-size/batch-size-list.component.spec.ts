import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchSizeListComponent } from './batch-size-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

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

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getBatchSizeConfigs',
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
    apiServiceSpy.getBatchSizeConfigs.and.returnValue(of(mockConfigs));
    fixture = TestBed.createComponent(BatchSizeListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load configs on init', () => {
    expect(apiServiceSpy.getBatchSizeConfigs).toHaveBeenCalled();
    expect(component.configs.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should display all configs by default', () => {
    expect(component.filteredConfigs.length).toBe(3);
  });

  describe('Filtering', () => {
    it('should filter by active status', () => {
      component.statusFilter = 'active';
      component.applyFilters();
      expect(component.filteredConfigs.length).toBe(2);
    });

    it('should filter by inactive status', () => {
      component.statusFilter = 'inactive';
      component.applyFilters();
      expect(component.filteredConfigs.length).toBe(1);
      expect(component.filteredConfigs[0].isActive).toBeFalse();
    });

    it('should filter by search term on operation type', () => {
      component.searchTerm = 'MELTING';
      component.applyFilters();
      expect(component.filteredConfigs.length).toBe(1);
      expect(component.filteredConfigs[0].operationType).toBe('MELTING');
    });

    it('should filter by search term on material ID', () => {
      component.searchTerm = 'RM-001';
      component.applyFilters();
      expect(component.filteredConfigs.length).toBe(1);
      expect(component.filteredConfigs[0].materialId).toBe('RM-001');
    });

    it('should filter by search term on product SKU', () => {
      component.searchTerm = 'STL-ROD';
      component.applyFilters();
      expect(component.filteredConfigs.length).toBe(1);
      expect(component.filteredConfigs[0].productSku).toBe('STL-ROD');
    });

    it('should combine status and search filters', () => {
      component.statusFilter = 'active';
      component.searchTerm = 'CASTING';
      component.applyFilters();
      expect(component.filteredConfigs.length).toBe(1);
      expect(component.filteredConfigs[0].operationType).toBe('CASTING');
    });

    it('should show all when filters are cleared', () => {
      component.statusFilter = 'active';
      component.applyFilters();
      expect(component.filteredConfigs.length).toBe(2);

      component.statusFilter = '';
      component.applyFilters();
      expect(component.filteredConfigs.length).toBe(3);
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
      expect(apiServiceSpy.getBatchSizeConfigs).toHaveBeenCalledTimes(2);
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
      apiServiceSpy.getBatchSizeConfigs.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));

      component.loadConfigs();

      expect(component.error).toBe('Load failed');
      expect(component.loading).toBeFalse();
    });
  });

  describe('Filter Highlighting', () => {
    it('should apply filter-active class when status filter is set', () => {
      component.statusFilter = 'active';
      component.applyFilters();
      fixture.detectChanges();

      const filterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(filterGroup.classList.contains('filter-active')).toBeTrue();
    });

    it('should not apply filter-active class when status filter is empty', () => {
      component.statusFilter = '';
      component.applyFilters();
      fixture.detectChanges();

      const filterGroup = fixture.nativeElement.querySelector('.filter-group');
      expect(filterGroup.classList.contains('filter-active')).toBeFalse();
    });
  });
});
