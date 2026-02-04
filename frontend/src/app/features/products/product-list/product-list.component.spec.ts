import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { ProductListComponent } from './product-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { Product } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('ProductListComponent', () => {
  let component: ProductListComponent;
  let fixture: ComponentFixture<ProductListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProducts: Product[] = [
    {
      productId: 1,
      productSku: 'SKU-001',
      productName: 'Steel Rod 10mm',
      unit: 'MTR',
      description: 'Steel rod 10mm diameter',
      status: 'ACTIVE'
    },
    {
      productId: 2,
      productSku: 'SKU-002',
      productName: 'Steel Plate 5mm',
      unit: 'KG',
      status: 'ACTIVE'
    },
    {
      productId: 3,
      productSku: 'SKU-003',
      productName: 'Old Product',
      unit: 'PCS',
      status: 'INACTIVE'
    }
  ];

  const mockPagedResponse: PagedResponse<Product> = {
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
    const spy = jasmine.createSpyObj('ApiService', [
      'getProductsPaged',
      'deleteProduct'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      declarations: [ProductListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getProductsPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(ProductListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(apiServiceSpy.getProductsPaged).toHaveBeenCalled();
    expect(component.products.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should set pagination state from response', () => {
    expect(component.page).toBe(0);
    expect(component.totalElements).toBe(3);
    expect(component.totalPages).toBe(1);
  });

  describe('Filtering', () => {
    beforeEach(() => {
      apiServiceSpy.getProductsPaged.calls.reset();
    });

    it('should filter by status', () => {
      component.onFilterStatusChange('ACTIVE');
      expect(component.filterStatus).toBe('ACTIVE');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getProductsPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by search term', () => {
      component.onSearchChange('Steel');
      expect(component.searchTerm).toBe('Steel');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getProductsPaged).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      apiServiceSpy.getProductsPaged.calls.reset();
    });

    it('should change page', () => {
      component.onPageChange(1);
      expect(component.page).toBe(1);
      expect(apiServiceSpy.getProductsPaged).toHaveBeenCalledTimes(1);
    });

    it('should change page size', () => {
      component.onSizeChange(50);
      expect(component.size).toBe(50);
      expect(component.page).toBe(0);
    });
  });

  describe('Delete Operations', () => {
    it('should open delete modal', () => {
      component.openDeleteModal(mockProducts[0]);
      expect(component.showDeleteModal).toBeTrue();
      expect(component.productToDelete).toBe(mockProducts[0]);
    });

    it('should close delete modal', () => {
      component.openDeleteModal(mockProducts[0]);
      component.closeDeleteModal();
      expect(component.showDeleteModal).toBeFalse();
      expect(component.productToDelete).toBeNull();
    });

    it('should delete product successfully', () => {
      apiServiceSpy.deleteProduct.and.returnValue(of(void 0));

      component.openDeleteModal(mockProducts[0]);
      component.confirmDelete();

      expect(apiServiceSpy.deleteProduct).toHaveBeenCalledWith(1);
    });
  });

  it('should handle error loading products', () => {
    apiServiceSpy.getProductsPaged.and.returnValue(throwError(() => new Error('Error')));
    component.loadProducts();
    expect(component.loading).toBeFalse();
  });
});
