import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of, throwError } from 'rxjs';

import { BomListComponent } from './bom-list.component';
import { ApiService } from '../../../core/services/api.service';
import { BomProductSummary } from '../../../shared/models';

describe('BomListComponent', () => {
  let component: BomListComponent;
  let fixture: ComponentFixture<BomListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

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

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getBomProducts']);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule
      ],
      declarations: [BomListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getBomProducts.and.returnValue(of(mockProducts));
    fixture = TestBed.createComponent(BomListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load products on init', () => {
    expect(apiServiceSpy.getBomProducts).toHaveBeenCalled();
    expect(component.products.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

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
  });

  describe('Error Handling', () => {
    it('should handle error loading products', () => {
      apiServiceSpy.getBomProducts.and.returnValue(
        throwError(() => new Error('Failed to load'))
      );

      component.loadProducts();

      expect(component.loading).toBeFalse();
      expect(component.error).toBe('Failed to load BOM products');
    });

    it('should clear error on retry', () => {
      component.error = 'Previous error';
      apiServiceSpy.getBomProducts.and.returnValue(of(mockProducts));

      component.loadProducts();

      expect(component.error).toBeNull();
    });
  });

  describe('Empty State', () => {
    it('should show empty state when no products', () => {
      apiServiceSpy.getBomProducts.and.returnValue(of([]));
      component.loadProducts();

      expect(component.products.length).toBe(0);
    });
  });
});
