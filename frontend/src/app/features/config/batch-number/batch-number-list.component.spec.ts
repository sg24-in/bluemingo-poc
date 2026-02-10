import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { BatchNumberListComponent } from './batch-number-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { BatchNumberConfig } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';
import { Router } from '@angular/router';

describe('BatchNumberListComponent', () => {
  let component: BatchNumberListComponent;
  let fixture: ComponentFixture<BatchNumberListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockItems: BatchNumberConfig[] = [
    {
      configId: 1,
      configName: 'Default Batch Config',
      prefix: 'BATCH',
      includeOperationCode: false,
      operationCodeLength: 3,
      separator: '-',
      dateFormat: 'yyyyMMdd',
      includeDate: true,
      sequenceLength: 4,
      sequenceReset: 'DAILY',
      priority: 100,
      status: 'ACTIVE',
      createdOn: '2026-02-01T10:00:00',
      createdBy: 'admin'
    },
    {
      configId: 2,
      configName: 'Furnace Config',
      operationType: 'FURNACE',
      prefix: 'FUR',
      includeOperationCode: true,
      operationCodeLength: 3,
      separator: '-',
      dateFormat: 'yyyyMMdd',
      includeDate: true,
      sequenceLength: 3,
      sequenceReset: 'MONTHLY',
      priority: 200,
      status: 'ACTIVE',
      createdOn: '2026-02-02T11:00:00',
      createdBy: 'admin'
    },
    {
      configId: 3,
      configName: 'Product Specific Config',
      productSku: 'PROD-001',
      prefix: 'P001',
      includeOperationCode: false,
      operationCodeLength: 3,
      separator: '_',


      includeDate: false,
      sequenceLength: 5,
      sequenceReset: 'NEVER',
      priority: 300,
      status: 'INACTIVE',
      createdOn: '2026-02-03T12:00:00',
      createdBy: 'admin'
    }
  ];

  const mockPagedResponse: PagedResponse<BatchNumberConfig> = {
    content: mockItems,
    page: 0,
    size: 10,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getBatchNumberConfigsPaged', 'deleteBatchNumberConfig', 'previewBatchNumber']);

    await TestBed.configureTestingModule({
      declarations: [BatchNumberListComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BatchNumberListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));

    fixture.detectChanges();

    expect(apiServiceSpy.getBatchNumberConfigsPaged).toHaveBeenCalled();
    expect(component.items).toEqual(mockItems);
    expect(component.loading).toBe(false);
    expect(component.totalElements).toBe(3);
    expect(component.totalPages).toBe(1);
  });

  it('should set pagination state correctly', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));

    fixture.detectChanges();

    expect(component.page).toBe(0);
    expect(component.size).toBe(20);
    expect(component.hasNext).toBe(false);
    expect(component.hasPrevious).toBe(false);
  });

  it('should filter by status', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));

    fixture.detectChanges();
    component.filterStatus = 'ACTIVE';
    component.loadItems();

    expect(apiServiceSpy.getBatchNumberConfigsPaged).toHaveBeenCalled();
  });

  it('should search by term', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));

    fixture.detectChanges();
    component.searchTerm = 'Furnace';
    component.loadItems();

    expect(apiServiceSpy.getBatchNumberConfigsPaged).toHaveBeenCalled();
  });

  it('should change page', () => {
    const page1Response: PagedResponse<BatchNumberConfig> = { ...mockPagedResponse, page: 1, first: false, hasPrevious: true };
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(page1Response));

    fixture.detectChanges();
    component.onPageChange(1);

    expect(component.page).toBe(1);
    expect(apiServiceSpy.getBatchNumberConfigsPaged).toHaveBeenCalled();
  });

  it('should change page size', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));

    fixture.detectChanges();
    component.onSizeChange(20);

    expect(component.size).toBe(20);
    expect(component.page).toBe(0);
    expect(apiServiceSpy.getBatchNumberConfigsPaged).toHaveBeenCalled();
  });

  it('should navigate to create form', () => {
    spyOn(router, 'navigate');

    component.create();

    expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-number/new']);
  });

  it('should navigate to edit form with item', () => {
    spyOn(router, 'navigate');
    const item = mockItems[0];

    component.edit(item);

    expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-number', item.configId, 'edit']);
  });

  it('should show delete modal', () => {
    const item = mockItems[0];

    component.openDeleteModal(item);

    expect(component.showDeleteModal).toBe(true);
    expect(component.itemToDelete).toEqual(item);
  });

  it('should close delete modal', () => {
    component.showDeleteModal = true;
    component.itemToDelete = mockItems[0];

    component.closeDeleteModal();

    expect(component.showDeleteModal).toBe(false);
    expect(component.itemToDelete).toBeNull();
  });

  it('should delete item successfully', () => {
    apiServiceSpy.deleteBatchNumberConfig.and.returnValue(of(void 0));
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));

    component.itemToDelete = mockItems[0];
    component.showDeleteModal = true;

    component.confirmDelete();

    expect(apiServiceSpy.deleteBatchNumberConfig).toHaveBeenCalledWith(1);
    expect(component.showDeleteModal).toBe(false);
    expect(component.itemToDelete).toBeNull();
    expect(apiServiceSpy.getBatchNumberConfigsPaged).toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    const errorMessage = 'Delete failed';
    apiServiceSpy.deleteBatchNumberConfig.and.returnValue(
      throwError(() => ({ error: { message: errorMessage } }))
    );

    component.itemToDelete = mockItems[0];
    component.showDeleteModal = true;

    component.confirmDelete();

    expect(apiServiceSpy.deleteBatchNumberConfig).toHaveBeenCalledWith(1);
    expect(component.deleteError).toBe(errorMessage);
    expect(component.deleteLoading).toBe(false);
  });

  it('should handle loading error', () => {
    const errorMessage = 'Load failed';
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(
      throwError(() => ({ error: { message: errorMessage } }))
    );

    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.items).toEqual([]);
  });

  it('should preview batch number for item', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));
    apiServiceSpy.previewBatchNumber.and.returnValue(of({ previewBatchNumber: 'FUR-20260210-001', operationType: 'FURNACE' }));

    fixture.detectChanges();

    const item = mockItems[1]; // Furnace Config with operationType
    component.previewNumber(item);

    expect(apiServiceSpy.previewBatchNumber).toHaveBeenCalledWith('FURNACE', undefined);
    expect(component.previewResults[item.configId]).toBe('FUR-20260210-001');
    expect(component.previewLoading[item.configId]).toBe(false);
  });

  it('should handle preview error', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));
    apiServiceSpy.previewBatchNumber.and.returnValue(
      throwError(() => ({ error: { message: 'Preview failed' } }))
    );

    fixture.detectChanges();

    const item = mockItems[0];
    component.previewNumber(item);

    expect(component.previewResults[item.configId]).toBe('Error');
    expect(component.previewLoading[item.configId]).toBe(false);
  });

  it('should preview batch number with productSku', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));
    apiServiceSpy.previewBatchNumber.and.returnValue(of({ previewBatchNumber: 'P001_00001', productSku: 'PROD-001' }));

    fixture.detectChanges();

    const item = mockItems[2]; // Product Specific Config with productSku
    component.previewNumber(item);

    expect(apiServiceSpy.previewBatchNumber).toHaveBeenCalledWith(undefined, 'PROD-001');
    expect(component.previewResults[item.configId]).toBe('P001_00001');
  });

  it('should render app-pagination when data is present', () => {
    apiServiceSpy.getBatchNumberConfigsPaged.and.returnValue(of(mockPagedResponse));
    fixture.detectChanges();

    component.items = [
      { configName: 'Test', operationType: 'FURNACE', prefix: 'B', dateFormat: 'yyyyMMdd', sequenceLength: 4, sequenceReset: 'DAILY', priority: 1, status: 'ACTIVE' } as any
    ];
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
