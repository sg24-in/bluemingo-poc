import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchListComponent } from './batch-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { PagedResponse } from '../../../shared/models/pagination.model';
import { Batch } from '../../../shared/models';

describe('BatchListComponent', () => {
  let component: BatchListComponent;
  let fixture: ComponentFixture<BatchListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockBatches: Batch[] = [
    {
      batchId: 1,
      batchNumber: 'BATCH-001',
      materialId: 'RM-001',
      materialName: 'Iron Ore',
      quantity: 100,
      unit: 'KG',
      state: 'AVAILABLE',
      status: 'AVAILABLE',
      createdOn: '2026-01-15T10:00:00'
    },
    {
      batchId: 2,
      batchNumber: 'BATCH-002',
      materialId: 'IM-001',
      materialName: 'Steel Billet',
      quantity: 500,
      unit: 'KG',
      state: 'CONSUMED',
      status: 'CONSUMED',
      createdOn: '2026-01-16T10:00:00'
    },
    {
      batchId: 3,
      batchNumber: 'BATCH-003',
      materialId: 'FG-001',
      materialName: 'Steel Rod',
      quantity: 450,
      unit: 'KG',
      state: 'AVAILABLE',
      status: 'AVAILABLE',
      createdOn: '2026-01-17T10:00:00'
    }
  ];

  const mockPagedResponse: PagedResponse<Batch> = {
    content: mockBatches,
    page: 0,
    size: 20,
    totalElements: 3,
    totalPages: 1,
    hasNext: false,
    hasPrevious: false,
    first: true,
    last: true
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getBatchesPaged']);

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
    apiServiceSpy.getBatchesPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(BatchListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load batches on init', () => {
    expect(apiServiceSpy.getBatchesPaged).toHaveBeenCalled();
    expect(component.batches.length).toBe(3);
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

  describe('Filtering', () => {
    it('should reload batches when state filter changes', () => {
      apiServiceSpy.getBatchesPaged.calls.reset();
      component.onFilterStateChange('AVAILABLE');
      expect(apiServiceSpy.getBatchesPaged).toHaveBeenCalled();
      expect(component.filterStatus).toBe('AVAILABLE');
      expect(component.page).toBe(0);
    });

    it('should clear filter when selecting all', () => {
      component.onFilterStateChange('all');
      expect(component.filterStatus).toBe('');
    });

    it('should reload batches when search changes', () => {
      apiServiceSpy.getBatchesPaged.calls.reset();
      component.onSearchChange('BATCH-001');
      expect(apiServiceSpy.getBatchesPaged).toHaveBeenCalled();
      expect(component.searchTerm).toBe('BATCH-001');
      expect(component.page).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should reload batches when page changes', () => {
      apiServiceSpy.getBatchesPaged.calls.reset();
      component.onPageChange(1);
      expect(apiServiceSpy.getBatchesPaged).toHaveBeenCalled();
      expect(component.page).toBe(1);
    });

    it('should reload batches and reset page when size changes', () => {
      component.page = 2;
      apiServiceSpy.getBatchesPaged.calls.reset();
      component.onSizeChange(50);
      expect(apiServiceSpy.getBatchesPaged).toHaveBeenCalled();
      expect(component.size).toBe(50);
      expect(component.page).toBe(0);
    });
  });

  it('should navigate to batch detail', () => {
    spyOn(router, 'navigate');
    component.viewBatch(1);
    expect(router.navigate).toHaveBeenCalledWith(['/batches', 1]);
  });

  it('should handle error loading batches', () => {
    apiServiceSpy.getBatchesPaged.and.returnValue(throwError(() => new Error('Error')));

    component.loadBatches();

    expect(component.loading).toBeFalse();
  });

  it('should set loading false after successful load', () => {
    expect(component.loading).toBeFalse();
  });
});
