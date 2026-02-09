import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ProcessParamsListComponent } from './process-params-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { ProcessParametersConfig } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('ProcessParamsListComponent', () => {
  let component: ProcessParamsListComponent;
  let fixture: ComponentFixture<ProcessParamsListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockItems: ProcessParametersConfig[] = [
    {
      configId: 1,
      operationType: 'FURNACE',
      productSku: 'SKU-001',
      parameterName: 'Temperature',
      parameterType: 'DECIMAL',
      unit: 'C',
      minValue: 100,
      maxValue: 200,
      defaultValue: 150,
      isRequired: true,
      displayOrder: 1,
      status: 'ACTIVE',
      createdOn: '2026-01-01T10:00:00',
      createdBy: 'admin'
    },
    {
      configId: 2,
      operationType: 'CASTER',
      parameterName: 'Speed',
      parameterType: 'DECIMAL',
      unit: 'm/min',
      minValue: 0.5,
      maxValue: 2.0,
      defaultValue: 1.0,
      isRequired: true,
      displayOrder: 2,
      status: 'ACTIVE',
      createdOn: '2026-01-02T11:00:00',
      createdBy: 'admin'
    },
    {
      configId: 3,
      operationType: 'ROLLING',
      parameterName: 'Pressure',
      parameterType: 'DECIMAL',
      unit: 'bar',
      minValue: 50,
      maxValue: 150,
      isRequired: false,
      displayOrder: 3,
      status: 'INACTIVE',
      createdOn: '2026-01-03T12:00:00',
      createdBy: 'admin'
    }
  ];

  const mockPagedResponse: PagedResponse<ProcessParametersConfig> = {
    content: mockItems,
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
    const spy = jasmine.createSpyObj('ApiService', ['getProcessParamsPaged', 'deleteProcessParam']);

    await TestBed.configureTestingModule({
      declarations: [ProcessParamsListComponent],
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
    apiServiceSpy.getProcessParamsPaged.and.returnValue(of(mockPagedResponse));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProcessParamsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    fixture.detectChanges();

    expect(apiServiceSpy.getProcessParamsPaged).toHaveBeenCalled();
    expect(component.items).toEqual(mockItems);
    expect(component.loading).toBe(false);
  });

  it('should set pagination state correctly', () => {
    fixture.detectChanges();

    expect(component.page).toBe(0);
    expect(component.size).toBe(20);
    expect(component.totalElements).toBe(3);
    expect(component.totalPages).toBe(1);
    expect(component.hasNext).toBe(false);
    expect(component.hasPrevious).toBe(false);
  });

  it('should filter by status', () => {
    fixture.detectChanges();
    apiServiceSpy.getProcessParamsPaged.calls.reset();

    const activeResponse: PagedResponse<ProcessParametersConfig> = {
      content: [mockItems[0], mockItems[1]],
      page: 0,
      size: 20,
      totalElements: 2,
      totalPages: 1,
      first: true,
      last: true,
      hasNext: false,
      hasPrevious: false
    };
    apiServiceSpy.getProcessParamsPaged.and.returnValue(of(activeResponse));

    component.filterStatus = 'ACTIVE';
    component.loadItems();

    expect(apiServiceSpy.getProcessParamsPaged).toHaveBeenCalled();
    expect(component.items.length).toBe(2);
  });

  it('should search by term', () => {
    fixture.detectChanges();
    apiServiceSpy.getProcessParamsPaged.calls.reset();

    const searchResponse: PagedResponse<ProcessParametersConfig> = {
      content: [mockItems[0]],
      page: 0,
      size: 20,
      totalElements: 1,
      totalPages: 1,
      first: true,
      last: true,
      hasNext: false,
      hasPrevious: false
    };
    apiServiceSpy.getProcessParamsPaged.and.returnValue(of(searchResponse));

    component.searchTerm = 'Temperature';
    component.loadItems();

    expect(apiServiceSpy.getProcessParamsPaged).toHaveBeenCalled();
    expect(component.items.length).toBe(1);
  });

  it('should handle page change', () => {
    fixture.detectChanges();
    apiServiceSpy.getProcessParamsPaged.calls.reset();

    const page2Response: PagedResponse<ProcessParametersConfig> = {
      content: [],
      page: 1,
      size: 20,
      totalElements: 3,
      totalPages: 1,
      first: false,
      last: true,
      hasNext: false,
      hasPrevious: true
    };
    apiServiceSpy.getProcessParamsPaged.and.returnValue(of(page2Response));

    component.onPageChange(1);

    expect(component.page).toBe(1);
    expect(apiServiceSpy.getProcessParamsPaged).toHaveBeenCalled();
  });

  it('should handle page size change', () => {
    fixture.detectChanges();
    apiServiceSpy.getProcessParamsPaged.calls.reset();

    const size50Response: PagedResponse<ProcessParametersConfig> = {
      content: mockItems,
      page: 0,
      size: 50,
      totalElements: 3,
      totalPages: 1,
      first: true,
      last: true,
      hasNext: false,
      hasPrevious: false
    };
    apiServiceSpy.getProcessParamsPaged.and.returnValue(of(size50Response));

    component.onSizeChange(50);

    expect(component.size).toBe(50);
    expect(component.page).toBe(0);
    expect(apiServiceSpy.getProcessParamsPaged).toHaveBeenCalled();
  });

  it('should navigate to create page', () => {
    spyOn(component['router'], 'navigate');

    component.create();

    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/process-params/new']);
  });

  it('should navigate to edit page with item object', () => {
    spyOn(component['router'], 'navigate');

    component.edit(mockItems[0]);

    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/process-params', 1, 'edit']);
  });

  it('should open delete modal', () => {
    component.openDeleteModal(mockItems[0]);

    expect(component.showDeleteModal).toBe(true);
    expect(component.itemToDelete).toEqual(mockItems[0]);
  });

  it('should close delete modal', () => {
    component.itemToDelete = mockItems[0];
    component.showDeleteModal = true;

    component.closeDeleteModal();

    expect(component.showDeleteModal).toBe(false);
    expect(component.itemToDelete).toBeNull();
  });

  it('should delete item successfully', () => {
    fixture.detectChanges();
    component.itemToDelete = mockItems[0];
    component.showDeleteModal = true;

    apiServiceSpy.deleteProcessParam.and.returnValue(of(void 0));
    apiServiceSpy.getProcessParamsPaged.calls.reset();
    apiServiceSpy.getProcessParamsPaged.and.returnValue(of(mockPagedResponse));

    component.confirmDelete();

    expect(apiServiceSpy.deleteProcessParam).toHaveBeenCalledWith(1);
    expect(component.showDeleteModal).toBe(false);
    expect(component.itemToDelete).toBeNull();
    expect(apiServiceSpy.getProcessParamsPaged).toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    component.itemToDelete = mockItems[0];
    component.showDeleteModal = true;

    const errorMsg = 'Delete failed';
    apiServiceSpy.deleteProcessParam.and.returnValue(throwError(() => ({ error: { message: errorMsg } })));

    component.confirmDelete();

    expect(apiServiceSpy.deleteProcessParam).toHaveBeenCalledWith(1);
    expect(component.deleteError).toBe(errorMsg);
    expect(component.deleteLoading).toBe(false);
  });

  it('should handle loading error', () => {
    apiServiceSpy.getProcessParamsPaged.and.returnValue(throwError(() => new Error('Load failed')));

    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.items).toEqual([]);
  });

  it('should render app-pagination when there is data', () => {
    component.items = [{ operationType: 'FURNACE', parameterName: 'Temp', parameterType: 'NUMBER', status: 'ACTIVE', isRequired: true } as any];
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
