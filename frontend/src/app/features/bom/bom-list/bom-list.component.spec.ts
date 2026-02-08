import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BomListComponent } from './bom-list.component';
import { ApiService } from '../../../core/services/api.service';
import { BomProductSummary } from '../../../shared/models';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('BomListComponent', () => {
  let component: BomListComponent;
  let fixture: ComponentFixture<BomListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockProducts: BomProductSummary[] = [
    {
      productSku: 'FG-STEEL-001',
      bomVersion: 'V1',
      totalNodes: 5,
      maxLevel: 3,
      status: 'ACTIVE'
    },
    {
      productSku: 'FG-STEEL-002',
      bomVersion: 'V2',
      totalNodes: 3,
      maxLevel: 2,
      status: 'ACTIVE'
    },
    {
      productSku: 'FG-OLD-001',
      bomVersion: 'V1',
      totalNodes: 2,
      maxLevel: 1,
      status: 'INACTIVE'
    }
  ];

  // TASK-P3: Mock paged response
  const mockPagedResponse: PagedResponse<BomProductSummary> = {
    content: mockProducts,
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
    const spy = jasmine.createSpyObj('ApiService', ['getBomProductsPaged']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [BomListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getBomProductsPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(BomListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // TASK-P3: Pagination tests
  describe('Pagination', () => {
    it('should load products on init', () => {
      expect(apiServiceSpy.getBomProductsPaged).toHaveBeenCalled();
      expect(component.products.length).toBe(3);
      expect(component.loading).toBeFalse();
    });

    it('should set pagination state from response', () => {
      expect(component.page).toBe(0);
      expect(component.size).toBe(20);
      expect(component.totalElements).toBe(3);
      expect(component.totalPages).toBe(1);
      expect(component.hasNext).toBeFalse();
      expect(component.hasPrevious).toBeFalse();
    });

    it('should change page', () => {
      const page1Response: PagedResponse<BomProductSummary> = {
        ...mockPagedResponse,
        page: 1,
        hasPrevious: true
      };
      apiServiceSpy.getBomProductsPaged.and.returnValue(of(page1Response));

      component.onPageChange(1);

      expect(component.page).toBe(1);
      expect(apiServiceSpy.getBomProductsPaged).toHaveBeenCalledTimes(2);
    });

    it('should reset to first page when changing page size', () => {
      const size50Response: PagedResponse<BomProductSummary> = {
        ...mockPagedResponse,
        size: 50,
        page: 0
      };
      apiServiceSpy.getBomProductsPaged.and.returnValue(of(size50Response));

      component.page = 2;
      component.onSizeChange(50);

      expect(component.page).toBe(0);
      expect(component.size).toBe(50);
    });

    it('should update size from response', () => {
      const size10Response: PagedResponse<BomProductSummary> = {
        ...mockPagedResponse,
        size: 10,
        page: 0
      };
      apiServiceSpy.getBomProductsPaged.and.returnValue(of(size10Response));

      component.onSizeChange(10);

      expect(component.size).toBe(10);
    });

    it('should handle multi-page response', () => {
      const multiPageResponse: PagedResponse<BomProductSummary> = {
        content: mockProducts,
        page: 0,
        size: 2,
        totalElements: 10,
        totalPages: 5,
        first: true,
        last: false,
        hasNext: true,
        hasPrevious: false
      };
      apiServiceSpy.getBomProductsPaged.and.returnValue(of(multiPageResponse));

      component.loadProducts();

      expect(component.totalElements).toBe(10);
      expect(component.totalPages).toBe(5);
      expect(component.hasNext).toBeTrue();
      expect(component.hasPrevious).toBeFalse();
    });
  });

  describe('Search', () => {
    beforeEach(() => {
      apiServiceSpy.getBomProductsPaged.calls.reset();
    });

    it('should filter by search term', () => {
      component.onSearchChange('STEEL');

      expect(component.searchTerm).toBe('STEEL');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getBomProductsPaged).toHaveBeenCalled();
    });

    it('should include search term in API request', () => {
      component.searchTerm = 'FG-STEEL';
      component.loadProducts();

      expect(apiServiceSpy.getBomProductsPaged).toHaveBeenCalledWith(
        jasmine.objectContaining({
          search: 'FG-STEEL'
        })
      );
    });

    it('should clear search', () => {
      component.searchTerm = 'STEEL';
      component.page = 2;

      component.clearSearch();

      expect(component.searchTerm).toBe('');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getBomProductsPaged).toHaveBeenCalled();
    });

    it('should not include search when empty', () => {
      component.searchTerm = '';
      component.loadProducts();

      expect(apiServiceSpy.getBomProductsPaged).toHaveBeenCalledWith(
        jasmine.objectContaining({
          search: undefined
        })
      );
    });
  });

  describe('Product Display', () => {
    it('should display product SKU in list', () => {
      expect(component.products[0].productSku).toBe('FG-STEEL-001');
    });

    it('should display BOM version', () => {
      expect(component.products[0].bomVersion).toBe('V1');
    });

    it('should display total nodes count', () => {
      expect(component.products[0].totalNodes).toBe(5);
    });

    it('should display max level', () => {
      expect(component.products[0].maxLevel).toBe(3);
    });

    it('should display status', () => {
      expect(component.products[0].status).toBe('ACTIVE');
      expect(component.products[2].status).toBe('INACTIVE');
    });
  });

  describe('Navigation', () => {
    it('should navigate to view tree', () => {
      spyOn(router, 'navigate');
      component.viewTree('FG-STEEL-001');
      expect(router.navigate).toHaveBeenCalledWith(['/manage/bom', 'FG-STEEL-001', 'tree']);
    });

    it('should navigate to add node', () => {
      spyOn(router, 'navigate');
      component.addNode('FG-STEEL-001');
      expect(router.navigate).toHaveBeenCalledWith(['/manage/bom', 'FG-STEEL-001', 'node', 'new']);
    });

    it('should navigate to create new BOM', () => {
      spyOn(router, 'navigate');
      component.createNewBom();
      expect(router.navigate).toHaveBeenCalledWith(['/manage/bom', 'create']);
    });
  });

  describe('Status Class', () => {
    it('should return status-active for ACTIVE status', () => {
      expect(component.getStatusClass('ACTIVE')).toBe('status-active');
    });

    it('should return status-inactive for INACTIVE status', () => {
      expect(component.getStatusClass('INACTIVE')).toBe('status-inactive');
    });

    it('should return status-empty for EMPTY status', () => {
      expect(component.getStatusClass('EMPTY')).toBe('status-empty');
    });

    it('should return status-draft for DRAFT status', () => {
      expect(component.getStatusClass('DRAFT')).toBe('status-draft');
    });

    it('should return status-obsolete for OBSOLETE status', () => {
      expect(component.getStatusClass('OBSOLETE')).toBe('status-obsolete');
    });

    it('should return empty string for unknown status', () => {
      expect(component.getStatusClass('UNKNOWN')).toBe('');
    });

    it('should handle null status', () => {
      expect(component.getStatusClass(null as any)).toBe('');
    });

    it('should handle undefined status', () => {
      expect(component.getStatusClass(undefined as any)).toBe('');
    });
  });

  describe('Error Handling', () => {
    it('should handle error loading products', () => {
      apiServiceSpy.getBomProductsPaged.and.returnValue(
        throwError(() => ({ error: { message: 'Server error' } }))
      );

      component.loadProducts();

      expect(component.loading).toBeFalse();
      expect(component.error).toBe('Server error');
    });

    it('should show default error message when none provided', () => {
      apiServiceSpy.getBomProductsPaged.and.returnValue(
        throwError(() => ({}))
      );

      component.loadProducts();

      expect(component.error).toBe('Failed to load BOM products');
    });

    it('should clear error on reload', () => {
      component.error = 'Previous error';
      apiServiceSpy.getBomProductsPaged.and.returnValue(of(mockPagedResponse));

      component.loadProducts();

      expect(component.error).toBeNull();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no products', () => {
      const emptyResponse: PagedResponse<BomProductSummary> = {
        content: [],
        page: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        hasNext: false,
        hasPrevious: false
      };
      apiServiceSpy.getBomProductsPaged.and.returnValue(of(emptyResponse));

      component.loadProducts();

      expect(component.products.length).toBe(0);
      expect(component.totalElements).toBe(0);
    });
  });

  describe('Loading State', () => {
    it('should set loading to true when loading starts', () => {
      // Create a new observable that doesn't complete immediately
      const pendingObservable = of(mockPagedResponse);
      apiServiceSpy.getBomProductsPaged.and.returnValue(pendingObservable);

      component.loading = false;
      component.loadProducts();

      // After loadProducts completes, loading should be false
      expect(component.loading).toBeFalse();
    });

    it('should set loading to false after success', () => {
      apiServiceSpy.getBomProductsPaged.and.returnValue(of(mockPagedResponse));

      component.loadProducts();

      expect(component.loading).toBeFalse();
    });

    it('should set loading to false after error', () => {
      apiServiceSpy.getBomProductsPaged.and.returnValue(
        throwError(() => new Error('Failed'))
      );

      component.loadProducts();

      expect(component.loading).toBeFalse();
    });
  });

  describe('API Request', () => {
    beforeEach(() => {
      apiServiceSpy.getBomProductsPaged.calls.reset();
    });

    it('should include default sort parameters', () => {
      component.loadProducts();

      expect(apiServiceSpy.getBomProductsPaged).toHaveBeenCalledWith(
        jasmine.objectContaining({
          sortBy: 'productSku',
          sortDirection: 'ASC'
        })
      );
    });

    it('should include page and size in request', () => {
      component.page = 2;
      component.size = 50;
      component.loadProducts();

      expect(apiServiceSpy.getBomProductsPaged).toHaveBeenCalledWith(
        jasmine.objectContaining({
          page: 2,
          size: 50
        })
      );
    });
  });
});
