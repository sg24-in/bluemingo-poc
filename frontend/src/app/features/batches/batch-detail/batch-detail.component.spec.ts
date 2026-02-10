import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchDetailComponent } from './batch-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('BatchDetailComponent', () => {
  let component: BatchDetailComponent;
  let fixture: ComponentFixture<BatchDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockBatch = {
    batchId: 1,
    batchNumber: 'BATCH-001',
    materialId: 'IM-001',
    materialName: 'Steel Billet',
    quantity: 500,
    unit: 'KG',
    status: 'AVAILABLE',
    createdOn: new Date().toISOString()
  };

  const mockProducedBatch = {
    ...mockBatch,
    batchId: 10,
    batchNumber: 'BATCH-010',
    status: 'PRODUCED'
  };

  const mockConsumedBatch = {
    ...mockBatch,
    batchId: 20,
    batchNumber: 'BATCH-020',
    status: 'CONSUMED'
  };

  const mockGenealogy = {
    batch: mockBatch,
    parentBatches: [
      {
        batchId: 2,
        batchNumber: 'BATCH-002',
        materialName: 'Iron Ore',
        quantityConsumed: 100,
        unit: 'KG',
        relationType: 'TRANSFORM'
      }
    ],
    childBatches: [
      {
        batchId: 3,
        batchNumber: 'BATCH-003',
        materialName: 'Steel Rod',
        quantity: 450,
        unit: 'KG',
        relationType: 'TRANSFORM'
      }
    ],
    productionInfo: {
      operationId: 1,
      operationName: 'Melting',
      processName: 'Melting Stage',
      orderId: '1',
      productionDate: new Date().toISOString()
    }
  };

  const mockAllocations: any[] = [];
  const mockAvailability = {
    batchId: 1,
    batchNumber: 'BATCH-001',
    totalQuantity: 500,
    allocatedQuantity: 0,
    availableQuantity: 500,
    fullyAllocated: false
  };

  const mockSplitResponse = {
    sourceBatchId: 1,
    sourceBatchNumber: 'BATCH-001',
    originalQuantity: 500,
    remainingQuantity: 0,
    newBatches: [
      { batchId: 100, batchNumber: 'BATCH-001-A', materialId: 'IM-001', materialName: 'Steel Billet', quantity: 200, unit: 'KG', status: 'AVAILABLE', createdOn: new Date().toISOString() },
      { batchId: 101, batchNumber: 'BATCH-001-B', materialId: 'IM-001', materialName: 'Steel Billet', quantity: 300, unit: 'KG', status: 'AVAILABLE', createdOn: new Date().toISOString() }
    ],
    status: 'SUCCESS'
  };

  const mockMergeResponse = {
    sourceBatches: [mockBatch],
    mergedBatch: { batchId: 200, batchNumber: 'MRG-001', materialId: 'IM-001', materialName: 'Steel Billet', quantity: 1000, unit: 'KG', status: 'AVAILABLE', createdOn: new Date().toISOString() },
    totalQuantity: 1000,
    status: 'SUCCESS'
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getBatchById',
      'getBatchGenealogy',
      'getBatchAllocations',
      'getBatchAvailability',
      'allocateBatchToOrder',
      'releaseAllocation',
      'getAvailableOrders',
      'splitBatch',
      'getAvailableBatches',
      'mergeBatches'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [BatchDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getBatchById.and.returnValue(of(mockBatch));
    apiServiceSpy.getBatchGenealogy.and.returnValue(of(mockGenealogy));
    apiServiceSpy.getBatchAllocations.and.returnValue(of(mockAllocations));
    apiServiceSpy.getBatchAvailability.and.returnValue(of(mockAvailability));
    apiServiceSpy.getAvailableOrders.and.returnValue(of([]));
    apiServiceSpy.getAvailableBatches.and.returnValue(of([]));
    fixture = TestBed.createComponent(BatchDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load batch on init', () => {
    expect(apiServiceSpy.getBatchById).toHaveBeenCalledWith(1);
    expect(component.batch).toEqual(mockBatch);
    expect(component.loading).toBeFalse();
  });

  it('should load genealogy on init', () => {
    expect(apiServiceSpy.getBatchGenealogy).toHaveBeenCalledWith(1);
    expect(component.genealogy).toEqual(mockGenealogy);
    expect(component.loadingGenealogy).toBeFalse();
  });

  it('should set batch ID from route params', () => {
    expect(component.batchId).toBe(1);
  });

  it('should display parent batches in genealogy', () => {
    expect(component.genealogy.parentBatches.length).toBe(1);
    expect(component.genealogy.parentBatches[0].batchNumber).toBe('BATCH-002');
  });

  it('should display child batches in genealogy', () => {
    expect(component.genealogy.childBatches.length).toBe(1);
    expect(component.genealogy.childBatches[0].batchNumber).toBe('BATCH-003');
  });

  it('should display production info', () => {
    expect(component.genealogy.productionInfo).toBeTruthy();
    expect(component.genealogy.productionInfo.operationName).toBe('Melting');
  });

  it('should navigate back to batch list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/batches']);
  });

  it('should navigate to another batch', () => {
    spyOn(router, 'navigate');
    component.navigateToBatch(2);
    expect(router.navigate).toHaveBeenCalledWith(['/batches', 2]);
  });

  it('should handle error loading batch', () => {
    apiServiceSpy.getBatchById.and.returnValue(throwError(() => new Error('Error')));

    component.loadBatch();

    expect(component.loading).toBeFalse();
  });

  it('should handle error loading genealogy', () => {
    apiServiceSpy.getBatchGenealogy.and.returnValue(throwError(() => new Error('Error')));

    component.loadGenealogy();

    expect(component.loadingGenealogy).toBeFalse();
  });

  it('should set loading state correctly during batch load', () => {
    apiServiceSpy.getBatchById.and.returnValue(of(mockBatch));

    component.loadBatch();

    expect(component.loading).toBeFalse();
  });

  it('should set loading state correctly during genealogy load', () => {
    apiServiceSpy.getBatchGenealogy.and.returnValue(of(mockGenealogy));

    component.loadGenealogy();

    expect(component.loadingGenealogy).toBeFalse();
  });

  // ============================================================
  // R-06: Split/Merge UI Tests
  // ============================================================

  describe('Split/Merge button visibility', () => {
    it('should show split button for available batches', () => {
      component.batch = { ...mockBatch, status: 'AVAILABLE' };
      fixture.detectChanges();

      expect(component.canShowSplitMerge()).toBeTrue();

      const compiled = fixture.nativeElement;
      const splitBtn = compiled.querySelector('.header-actions button');
      expect(splitBtn).toBeTruthy();
      expect(splitBtn.textContent).toContain('Split Batch');
    });

    it('should show split button for produced batches', () => {
      component.batch = mockProducedBatch;
      fixture.detectChanges();

      expect(component.canShowSplitMerge()).toBeTrue();
    });

    it('should show merge button for available batches', () => {
      component.batch = { ...mockBatch, status: 'AVAILABLE' };
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const buttons = compiled.querySelectorAll('.header-actions button');
      const mergeBtn = buttons.length > 1 ? buttons[1] : null;
      expect(mergeBtn).toBeTruthy();
      expect(mergeBtn.textContent).toContain('Merge Batches');
    });

    it('should not show split/merge buttons for consumed batches', () => {
      component.batch = mockConsumedBatch;
      fixture.detectChanges();

      expect(component.canShowSplitMerge()).toBeFalse();

      const compiled = fixture.nativeElement;
      const headerActions = compiled.querySelector('.header-actions');
      expect(headerActions).toBeFalsy();
    });

    it('should not show split/merge buttons for blocked batches', () => {
      component.batch = { ...mockBatch, status: 'BLOCKED' };
      fixture.detectChanges();

      expect(component.canShowSplitMerge()).toBeFalse();
    });
  });

  describe('Split functionality', () => {
    it('should toggle split section open with default two portions', () => {
      component.toggleSplitSection();

      expect(component.showSplitSection).toBeTrue();
      expect(component.showMergeSection).toBeFalse();
      expect(component.splitPortions.length).toBe(2);
      expect(component.splitPortions[0].suffix).toBe('A');
      expect(component.splitPortions[1].suffix).toBe('B');
    });

    it('should close merge section when split is opened', () => {
      component.showMergeSection = true;
      component.toggleSplitSection();

      expect(component.showSplitSection).toBeTrue();
      expect(component.showMergeSection).toBeFalse();
    });

    it('should toggle split section closed', () => {
      component.showSplitSection = true;
      component.toggleSplitSection();

      expect(component.showSplitSection).toBeFalse();
    });

    it('should add split portion with correct suffix', () => {
      component.toggleSplitSection();
      expect(component.splitPortions.length).toBe(2);

      component.addSplitPortion();
      expect(component.splitPortions.length).toBe(3);
      expect(component.splitPortions[2].suffix).toBe('C');
    });

    it('should remove split portion but keep at least one', () => {
      component.toggleSplitSection();
      component.removeSplitPortion(0);
      expect(component.splitPortions.length).toBe(1);

      // Should not go below 1
      component.removeSplitPortion(0);
      expect(component.splitPortions.length).toBe(1);
    });

    it('should calculate total split quantity', () => {
      component.splitPortions = [
        { quantity: 200, suffix: 'A' },
        { quantity: 300, suffix: 'B' }
      ];

      expect(component.getTotalSplitQuantity()).toBe(500);
    });

    it('should calculate remaining after split', () => {
      component.batch = { ...mockBatch, quantity: 500 };
      component.splitPortions = [
        { quantity: 200, suffix: 'A' },
        { quantity: 100, suffix: 'B' }
      ];

      expect(component.getRemainingAfterSplit()).toBe(200);
    });

    it('should validate canSplit correctly', () => {
      component.batch = { ...mockBatch, status: 'AVAILABLE', quantity: 500 };
      component.splitPortions = [
        { quantity: 200, suffix: 'A' },
        { quantity: 300, suffix: 'B' }
      ];

      expect(component.canSplit()).toBeTrue();
    });

    it('should reject split when total exceeds batch quantity', () => {
      component.batch = { ...mockBatch, status: 'AVAILABLE', quantity: 500 };
      component.splitPortions = [
        { quantity: 300, suffix: 'A' },
        { quantity: 300, suffix: 'B' }
      ];

      expect(component.canSplit()).toBeFalse();
    });

    it('should reject split when any portion has zero quantity', () => {
      component.batch = { ...mockBatch, status: 'AVAILABLE', quantity: 500 };
      component.splitPortions = [
        { quantity: 200, suffix: 'A' },
        { quantity: 0, suffix: 'B' }
      ];

      expect(component.canSplit()).toBeFalse();
    });

    it('should call splitBatch API on submit', () => {
      apiServiceSpy.splitBatch.and.returnValue(of(mockSplitResponse));
      component.batch = { ...mockBatch, status: 'AVAILABLE', quantity: 500 };
      component.splitPortions = [
        { quantity: 200, suffix: 'A' },
        { quantity: 300, suffix: 'B' }
      ];

      component.submitSplit();

      expect(apiServiceSpy.splitBatch).toHaveBeenCalledWith(1, jasmine.objectContaining({
        sourceBatchId: 1,
        portions: [
          { quantity: 200, batchNumberSuffix: 'A' },
          { quantity: 300, batchNumberSuffix: 'B' }
        ]
      }));
    });

    it('should show split result after successful split', () => {
      apiServiceSpy.splitBatch.and.returnValue(of(mockSplitResponse));
      component.batch = { ...mockBatch, status: 'AVAILABLE', quantity: 500 };
      component.splitPortions = [
        { quantity: 200, suffix: 'A' },
        { quantity: 300, suffix: 'B' }
      ];

      component.submitSplit();

      expect(component.splitResult).toBeTruthy();
      expect(component.splitResult!.newBatches.length).toBe(2);
      expect(component.success).toContain('2 new batches');
    });

    it('should handle split error', () => {
      apiServiceSpy.splitBatch.and.returnValue(throwError(() => ({
        error: { message: 'Cannot split' }
      })));
      component.batch = { ...mockBatch, status: 'AVAILABLE', quantity: 500 };
      component.splitPortions = [
        { quantity: 200, suffix: 'A' },
        { quantity: 300, suffix: 'B' }
      ];

      component.submitSplit();

      expect(component.error).toBe('Cannot split');
      expect(component.submitting).toBeFalse();
    });
  });

  describe('Merge functionality', () => {
    it('should toggle merge section open', () => {
      component.toggleMergeSection();

      expect(component.showMergeSection).toBeTrue();
      expect(component.showSplitSection).toBeFalse();
      expect(component.mergeSelectedBatches.length).toBe(0);
    });

    it('should close split section when merge is opened', () => {
      component.showSplitSection = true;
      component.toggleMergeSection();

      expect(component.showMergeSection).toBeTrue();
      expect(component.showSplitSection).toBeFalse();
    });

    it('should toggle batch selection for merge', () => {
      const otherBatch = { batchId: 5, batchNumber: 'BATCH-005', quantity: 200, unit: 'KG' };

      component.toggleBatchForMerge(otherBatch);
      expect(component.mergeSelectedBatches.length).toBe(1);

      component.toggleBatchForMerge(otherBatch);
      expect(component.mergeSelectedBatches.length).toBe(0);
    });

    it('should check if batch is selected for merge', () => {
      const otherBatch = { batchId: 5, batchNumber: 'BATCH-005', quantity: 200, unit: 'KG' };
      component.mergeSelectedBatches = [otherBatch];

      expect(component.isBatchSelectedForMerge(otherBatch)).toBeTrue();
      expect(component.isBatchSelectedForMerge({ batchId: 99 })).toBeFalse();
    });

    it('should calculate total merge quantity', () => {
      component.batch = { ...mockBatch, quantity: 500 };
      component.mergeSelectedBatches = [
        { batchId: 5, quantity: 200 },
        { batchId: 6, quantity: 300 }
      ];

      expect(component.getTotalMergeQuantity()).toBe(1000);
    });

    it('should parse batch IDs from text input', () => {
      component.batchId = 1;
      component.mergeBatchIdsInput = '5, 12, 23';

      const ids = component.getMergeBatchIdsFromInput();
      expect(ids).toEqual([5, 12, 23]);
    });

    it('should filter out current batch ID from text input', () => {
      component.batchId = 5;
      component.mergeBatchIdsInput = '5, 12, 23';

      const ids = component.getMergeBatchIdsFromInput();
      expect(ids).toEqual([12, 23]);
    });

    it('should validate canMerge requires at least one source', () => {
      component.batch = { ...mockBatch, status: 'AVAILABLE' };
      component.mergeSelectedBatches = [];
      component.mergeBatchIdsInput = '';

      expect(component.canMerge()).toBeFalse();
    });

    it('should validate canMerge with selected batches', () => {
      component.batch = { ...mockBatch, status: 'AVAILABLE' };
      component.mergeSelectedBatches = [{ batchId: 5 }];

      expect(component.canMerge()).toBeTrue();
    });

    it('should validate canMerge with batch ID input', () => {
      component.batch = { ...mockBatch, status: 'AVAILABLE' };
      component.mergeSelectedBatches = [];
      component.mergeBatchIdsInput = '5, 12';

      expect(component.canMerge()).toBeTrue();
    });

    it('should call mergeBatches API on submit', () => {
      apiServiceSpy.mergeBatches.and.returnValue(of(mockMergeResponse));
      component.batch = { ...mockBatch, status: 'AVAILABLE' };
      component.mergeSelectedBatches = [{ batchId: 5, quantity: 500 }];
      component.mergeReason = 'Consolidation';

      component.submitMerge();

      expect(apiServiceSpy.mergeBatches).toHaveBeenCalledWith(jasmine.objectContaining({
        sourceBatchIds: [1, 5],
        reason: 'Consolidation'
      }));
    });

    it('should show merge result after successful merge', () => {
      apiServiceSpy.mergeBatches.and.returnValue(of(mockMergeResponse));
      component.batch = { ...mockBatch, status: 'AVAILABLE' };
      component.mergeSelectedBatches = [{ batchId: 5, quantity: 500 }];

      component.submitMerge();

      expect(component.mergeResult).toBeTruthy();
      expect(component.mergeResult!.mergedBatch.batchNumber).toBe('MRG-001');
      expect(component.success).toContain('MRG-001');
    });

    it('should navigate to merged batch on button click', () => {
      spyOn(router, 'navigate');
      component.mergeResult = mockMergeResponse as any;

      component.navigateToMergedBatch();

      expect(router.navigate).toHaveBeenCalledWith(['/batches', 200]);
    });

    it('should handle merge error', () => {
      apiServiceSpy.mergeBatches.and.returnValue(throwError(() => ({
        error: { message: 'Material mismatch' }
      })));
      component.batch = { ...mockBatch, status: 'AVAILABLE' };
      component.mergeSelectedBatches = [{ batchId: 5 }];

      component.submitMerge();

      expect(component.error).toBe('Material mismatch');
      expect(component.submitting).toBeFalse();
    });
  });
});
