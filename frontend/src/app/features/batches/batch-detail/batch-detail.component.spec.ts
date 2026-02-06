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
});
