import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { HoldReasonsListComponent } from './hold-reasons-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { HoldReason } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('HoldReasonsListComponent', () => {
  let component: HoldReasonsListComponent;
  let fixture: ComponentFixture<HoldReasonsListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockItems: HoldReason[] = [
    { reasonId: 1, reasonCode: 'QUALITY', reasonDescription: 'Quality Issue', applicableTo: 'BATCH', status: 'ACTIVE' },
    { reasonId: 2, reasonCode: 'MAINT', reasonDescription: 'Maintenance Required', applicableTo: 'EQUIPMENT', status: 'ACTIVE' },
    { reasonId: 3, reasonCode: 'OLD', reasonDescription: 'Old Reason', status: 'INACTIVE' }
  ];

  const mockPagedResponse: PagedResponse<HoldReason> = {
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
    const spy = jasmine.createSpyObj('ApiService', ['getHoldReasonsPaged', 'deleteHoldReason']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, SharedModule],
      declarations: [HoldReasonsListComponent],
      providers: [{ provide: ApiService, useValue: spy }]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getHoldReasonsPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(HoldReasonsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load items on init', () => {
    expect(apiServiceSpy.getHoldReasonsPaged).toHaveBeenCalled();
    expect(component.items).toEqual(mockItems);
    expect(component.loading).toBe(false);
  });

  it('should set pagination state correctly', () => {
    expect(component.page).toBe(0);
    expect(component.size).toBe(20);
    expect(component.totalElements).toBe(3);
    expect(component.totalPages).toBe(1);
    expect(component.hasNext).toBe(false);
    expect(component.hasPrevious).toBe(false);
  });

  it('should filter by status', () => {
    component.filterStatus = 'ACTIVE';
    component.loadItems();
    expect(apiServiceSpy.getHoldReasonsPaged).toHaveBeenCalled();
  });

  it('should clear filter', () => {
    component.filterStatus = 'ACTIVE';
    component.filterStatus = '';
    component.loadItems();
    expect(apiServiceSpy.getHoldReasonsPaged).toHaveBeenCalled();
  });

  it('should search items', () => {
    component.searchTerm = 'quality';
    component.loadItems();
    expect(apiServiceSpy.getHoldReasonsPaged).toHaveBeenCalled();
  });

  it('should change page', () => {
    apiServiceSpy.getHoldReasonsPaged.calls.reset();
    const page1Response: PagedResponse<HoldReason> = { ...mockPagedResponse, page: 1, first: false, hasPrevious: true };
    apiServiceSpy.getHoldReasonsPaged.and.returnValue(of(page1Response));
    component.onPageChange(1);
    expect(component.page).toBe(1);
    expect(apiServiceSpy.getHoldReasonsPaged).toHaveBeenCalled();
  });

  it('should change page size', () => {
    component.onSizeChange(50);
    expect(component.size).toBe(50);
    expect(component.page).toBe(0);
    expect(apiServiceSpy.getHoldReasonsPaged).toHaveBeenCalled();
  });

  it('should open delete modal', () => {
    component.openDeleteModal(mockItems[0]);
    expect(component.showDeleteModal).toBe(true);
    expect(component.itemToDelete).toEqual(mockItems[0]);
  });

  it('should close delete modal', () => {
    component.showDeleteModal = true;
    component.itemToDelete = mockItems[0];
    component.closeDeleteModal();
    expect(component.showDeleteModal).toBe(false);
    expect(component.itemToDelete).toBeNull();
  });

  it('should delete item successfully', () => {
    apiServiceSpy.deleteHoldReason.and.returnValue(of(void 0));
    component.itemToDelete = mockItems[0];
    component.confirmDelete();
    expect(apiServiceSpy.deleteHoldReason).toHaveBeenCalledWith(1);
    expect(component.showDeleteModal).toBe(false);
    expect(apiServiceSpy.getHoldReasonsPaged).toHaveBeenCalled();
  });

  it('should handle delete error', () => {
    apiServiceSpy.deleteHoldReason.and.returnValue(throwError(() => ({ error: { message: 'Delete failed' } })));
    component.itemToDelete = mockItems[0];
    component.confirmDelete();
    expect(apiServiceSpy.deleteHoldReason).toHaveBeenCalledWith(1);
    expect(component.deleteError).toBe('Delete failed');
    expect(component.deleteLoading).toBe(false);
  });

  it('should handle error loading items', () => {
    apiServiceSpy.getHoldReasonsPaged.and.returnValue(throwError(() => new Error('Load failed')));
    component.loadItems();
    expect(component.loading).toBe(false);
  });

  it('should navigate to edit page', () => {
    spyOn(component['router'], 'navigate');
    component.edit(mockItems[0]);
    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/hold-reasons', 1, 'edit']);
  });

  it('should navigate to create page', () => {
    spyOn(component['router'], 'navigate');
    component.create();
    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/hold-reasons/new']);
  });
});
