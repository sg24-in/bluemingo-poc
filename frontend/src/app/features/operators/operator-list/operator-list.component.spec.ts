import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { OperatorListComponent } from './operator-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('OperatorListComponent', () => {
  let component: OperatorListComponent;
  let fixture: ComponentFixture<OperatorListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockPagedResponse = {
    content: [
      { operatorId: 1, operatorCode: 'OP-001', name: 'John Doe', department: 'Production', shift: 'Morning', status: 'ACTIVE' },
      { operatorId: 2, operatorCode: 'OP-002', name: 'Jane Smith', department: 'Quality', shift: 'Night', status: 'ACTIVE' }
    ],
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getOperatorsPaged', 'deleteOperator'
    ]);
    spy.getOperatorsPaged.and.returnValue(of(mockPagedResponse));

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, FormsModule, SharedModule],
      declarations: [OperatorListComponent],
      providers: [{ provide: ApiService, useValue: spy }]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture = TestBed.createComponent(OperatorListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load operators on init', () => {
    expect(apiServiceSpy.getOperatorsPaged).toHaveBeenCalled();
    expect(component.operators.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should update pagination state from response', () => {
    expect(component.totalElements).toBe(2);
    expect(component.totalPages).toBe(1);
    expect(component.hasNext).toBeFalse();
    expect(component.hasPrevious).toBeFalse();
  });

  it('should handle page change', () => {
    const pagedResponse2 = { ...mockPagedResponse, page: 1 };
    apiServiceSpy.getOperatorsPaged.and.returnValue(of(pagedResponse2));
    component.onPageChange(1);
    expect(component.page).toBe(1);
    expect(apiServiceSpy.getOperatorsPaged).toHaveBeenCalledTimes(2);
  });

  it('should handle size change', () => {
    const pagedResponse50 = { ...mockPagedResponse, size: 50 };
    apiServiceSpy.getOperatorsPaged.and.returnValue(of(pagedResponse50));
    component.onSizeChange(50);
    expect(component.size).toBe(50);
    expect(component.page).toBe(0);
  });

  it('should handle status filter change', () => {
    component.onFilterStatusChange('ACTIVE');
    expect(component.filterStatus).toBe('ACTIVE');
    expect(component.page).toBe(0);
  });

  it('should reset filter when all selected', () => {
    component.onFilterStatusChange('all');
    expect(component.filterStatus).toBe('');
  });

  it('should handle search change', () => {
    component.onSearchChange('John');
    expect(component.searchTerm).toBe('John');
    expect(component.page).toBe(0);
  });

  it('should handle load error', () => {
    apiServiceSpy.getOperatorsPaged.and.returnValue(throwError(() => ({ error: { message: 'Failed' } })));
    component.loadOperators();
    expect(component.loading).toBeFalse();
  });

  it('should open and close delete modal', () => {
    const operator = mockPagedResponse.content[0] as any;
    component.openDeleteModal(operator);
    expect(component.showDeleteModal).toBeTrue();
    expect(component.operatorToDelete).toBe(operator);

    component.closeDeleteModal();
    expect(component.showDeleteModal).toBeFalse();
    expect(component.operatorToDelete).toBeNull();
  });

  it('should delete operator successfully', () => {
    apiServiceSpy.deleteOperator.and.returnValue(of({ message: 'Deleted' }));
    const operator = mockPagedResponse.content[0] as any;
    component.openDeleteModal(operator);
    component.confirmDelete();

    expect(apiServiceSpy.deleteOperator).toHaveBeenCalledWith(1);
    expect(component.showDeleteModal).toBeFalse();
  });

  it('should handle delete error', () => {
    apiServiceSpy.deleteOperator.and.returnValue(throwError(() => ({ error: { message: 'Cannot delete' } })));
    const operator = mockPagedResponse.content[0] as any;
    component.openDeleteModal(operator);
    component.confirmDelete();

    expect(component.deleteError).toBe('Cannot delete');
    expect(component.deleteLoading).toBeFalse();
  });

  it('should render app-pagination when data is present', () => {
    component.operators = [
      { operatorCode: 'OP1', name: 'Test', department: 'Dept', shift: 'A', status: 'ACTIVE' }
    ] as any[];
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
