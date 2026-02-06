import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { DelayReasonsListComponent } from './delay-reasons-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { DelayReason } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('DelayReasonsListComponent', () => {
  let component: DelayReasonsListComponent;
  let fixture: ComponentFixture<DelayReasonsListComponent>;
  let apiService: jasmine.SpyObj<ApiService>;

  const mockItems: DelayReason[] = [
    {
      reasonId: 1,
      reasonCode: 'MAINT',
      reasonDescription: 'Equipment Maintenance',
      status: 'ACTIVE',
      createdOn: '2024-01-01T00:00:00',
      createdBy: 'admin'
    },
    {
      reasonId: 2,
      reasonCode: 'MAT',
      reasonDescription: 'Material Shortage',
      status: 'ACTIVE',
      createdOn: '2024-01-02T00:00:00',
      createdBy: 'admin'
    },
    {
      reasonId: 3,
      reasonCode: 'OLD',
      reasonDescription: 'Obsolete Reason',
      status: 'INACTIVE',
      createdOn: '2024-01-03T00:00:00',
      createdBy: 'admin'
    }
  ];

  const mockPagedResponse: PagedResponse<DelayReason> = {
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
    const apiServiceSpy = jasmine.createSpyObj('ApiService', [
      'getDelayReasonsPaged',
      'deleteDelayReason'
    ]);

    await TestBed.configureTestingModule({
      declarations: [DelayReasonsListComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      providers: [
        { provide: ApiService, useValue: apiServiceSpy }
      ]
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    apiService.getDelayReasonsPaged.and.returnValue(of(mockPagedResponse));
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DelayReasonsListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    fixture.detectChanges();

    expect(apiService.getDelayReasonsPaged).toHaveBeenCalled();
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

    component.filterStatus = 'ACTIVE';
    component.loadItems();

    expect(apiService.getDelayReasonsPaged).toHaveBeenCalled();
  });

  it('should clear filter', () => {
    fixture.detectChanges();

    component.filterStatus = 'ACTIVE';
    component.onFilterStatusChange('all');

    expect(component.filterStatus).toBe('');
    expect(apiService.getDelayReasonsPaged).toHaveBeenCalled();
  });

  it('should search items', () => {
    fixture.detectChanges();

    component.searchTerm = 'MAINT';
    component.loadItems();

    expect(apiService.getDelayReasonsPaged).toHaveBeenCalled();
  });

  it('should change page', () => {
    fixture.detectChanges();
    apiService.getDelayReasonsPaged.calls.reset();
    const page1Response: PagedResponse<DelayReason> = { ...mockPagedResponse, page: 1, first: false, hasPrevious: true };
    apiService.getDelayReasonsPaged.and.returnValue(of(page1Response));

    component.onPageChange(1);

    expect(component.page).toBe(1);
    expect(apiService.getDelayReasonsPaged).toHaveBeenCalled();
  });

  it('should change page size', () => {
    fixture.detectChanges();

    component.onSizeChange(50);

    expect(component.size).toBe(50);
    expect(component.page).toBe(0);
    expect(apiService.getDelayReasonsPaged).toHaveBeenCalled();
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
    expect(component.deleteError).toBe('');
  });

  it('should delete item successfully', () => {
    fixture.detectChanges();
    apiService.deleteDelayReason.and.returnValue(of(void 0));
    component.itemToDelete = mockItems[0];

    component.confirmDelete();

    expect(apiService.deleteDelayReason).toHaveBeenCalledWith(1);
    expect(component.showDeleteModal).toBe(false);
    expect(apiService.getDelayReasonsPaged).toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    fixture.detectChanges();
    apiService.deleteDelayReason.and.returnValue(
      throwError(() => ({ error: { message: 'Delete failed' } }))
    );
    component.itemToDelete = mockItems[0];

    component.confirmDelete();

    expect(apiService.deleteDelayReason).toHaveBeenCalledWith(1);
    expect(component.deleteError).toBe('Delete failed');
    expect(component.deleteLoading).toBe(false);
  });

  it('should handle loading error', () => {
    apiService.getDelayReasonsPaged.and.returnValue(
      throwError(() => ({ error: { message: 'Load failed' } }))
    );

    fixture.detectChanges();

    expect(component.loading).toBe(false);
    expect(component.items).toEqual([]);
  });

  it('should navigate to edit page', () => {
    spyOn(component['router'], 'navigate');

    component.edit(mockItems[0]);

    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/delay-reasons', 1, 'edit']);
  });

  it('should navigate to create page', () => {
    spyOn(component['router'], 'navigate');

    component.create();

    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/delay-reasons/new']);
  });
});
