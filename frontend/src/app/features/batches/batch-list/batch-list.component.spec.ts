import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchListComponent } from './batch-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('BatchListComponent', () => {
  let component: BatchListComponent;
  let fixture: ComponentFixture<BatchListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockBatches = [
    {
      batchId: 1,
      batchNumber: 'BATCH-001',
      materialId: 'RM-001',
      materialName: 'Iron Ore',
      quantity: 100,
      unit: 'KG',
      state: 'AVAILABLE',
      status: 'AVAILABLE'
    },
    {
      batchId: 2,
      batchNumber: 'BATCH-002',
      materialId: 'IM-001',
      materialName: 'Steel Billet',
      quantity: 500,
      unit: 'KG',
      state: 'CONSUMED',
      status: 'CONSUMED'
    },
    {
      batchId: 3,
      batchNumber: 'BATCH-003',
      materialId: 'FG-001',
      materialName: 'Steel Rod',
      quantity: 450,
      unit: 'KG',
      state: 'AVAILABLE',
      status: 'AVAILABLE'
    }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getAllBatches']);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [BatchListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getAllBatches.and.returnValue(of(mockBatches as any));
    fixture = TestBed.createComponent(BatchListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load batches on init', () => {
    expect(apiServiceSpy.getAllBatches).toHaveBeenCalled();
    expect(component.batches.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  describe('Filtering', () => {
    it('should show all batches when filter is all', () => {
      component.filterState = 'all';
      component.searchTerm = '';
      component.applyFilters();
      expect(component.filteredBatches.length).toBe(3);
    });

    it('should filter by state', () => {
      component.onFilterStateChange('AVAILABLE');
      expect(component.filteredBatches.length).toBe(2);
      expect(component.filteredBatches.every(b => b.state === 'AVAILABLE')).toBeTrue();
    });

    it('should filter by search term (batch number)', () => {
      component.onSearchChange('BATCH-001');
      expect(component.filteredBatches.length).toBe(1);
      expect(component.filteredBatches[0].batchNumber).toBe('BATCH-001');
    });

    it('should filter by search term (material ID)', () => {
      component.onSearchChange('IM-001');
      expect(component.filteredBatches.length).toBe(1);
      expect(component.filteredBatches[0].materialId).toBe('IM-001');
    });

    it('should combine state filter and search', () => {
      component.filterState = 'AVAILABLE';
      component.searchTerm = 'RM';
      component.applyFilters();
      expect(component.filteredBatches.length).toBe(1);
      expect(component.filteredBatches[0].batchNumber).toBe('BATCH-001');
    });

    it('should handle case-insensitive search', () => {
      component.onSearchChange('batch-002');
      expect(component.filteredBatches.length).toBe(1);
    });

    it('should return empty when no matches', () => {
      component.onSearchChange('NONEXISTENT');
      expect(component.filteredBatches.length).toBe(0);
    });
  });

  it('should navigate to batch detail', () => {
    spyOn(router, 'navigate');
    component.viewBatch(1);
    expect(router.navigate).toHaveBeenCalledWith(['/batches', 1]);
  });

  it('should handle error loading batches', () => {
    apiServiceSpy.getAllBatches.and.returnValue(throwError(() => new Error('Error')));

    component.loadBatches();

    expect(component.loading).toBeFalse();
  });

  it('should set loading false after successful load', () => {
    expect(component.loading).toBeFalse();
  });
});
