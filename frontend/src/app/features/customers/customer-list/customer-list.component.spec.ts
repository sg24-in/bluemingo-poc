import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { CustomerListComponent } from './customer-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { Customer } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockCustomers: Customer[] = [
    {
      customerId: 1,
      customerCode: 'CUST-001',
      customerName: 'Acme Corporation',
      contactPerson: 'John Doe',
      email: 'john@acme.com',
      phone: '+1234567890',
      city: 'New York',
      country: 'USA',
      status: 'ACTIVE'
    },
    {
      customerId: 2,
      customerCode: 'CUST-002',
      customerName: 'Tech Industries',
      contactPerson: 'Jane Smith',
      email: 'jane@tech.com',
      status: 'ACTIVE'
    },
    {
      customerId: 3,
      customerCode: 'CUST-003',
      customerName: 'Old Customer',
      status: 'INACTIVE'
    }
  ];

  const mockPagedResponse: PagedResponse<Customer> = {
    content: mockCustomers,
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
    const spy = jasmine.createSpyObj('ApiService', [
      'getCustomersPaged',
      'deleteCustomer'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      declarations: [CustomerListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getCustomersPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load customers on init', () => {
    expect(apiServiceSpy.getCustomersPaged).toHaveBeenCalled();
    expect(component.customers.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should set pagination state from response', () => {
    expect(component.page).toBe(0);
    expect(component.totalElements).toBe(3);
    expect(component.totalPages).toBe(1);
  });

  describe('Filtering', () => {
    beforeEach(() => {
      apiServiceSpy.getCustomersPaged.calls.reset();
    });

    it('should filter by status', () => {
      component.onFilterStatusChange('ACTIVE');
      expect(component.filterStatus).toBe('ACTIVE');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getCustomersPaged).toHaveBeenCalledTimes(1);
    });

    it('should clear filter when selecting all', () => {
      component.onFilterStatusChange('all');
      expect(component.filterStatus).toBe('');
      expect(apiServiceSpy.getCustomersPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by search term', () => {
      component.onSearchChange('Acme');
      expect(component.searchTerm).toBe('Acme');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getCustomersPaged).toHaveBeenCalledTimes(1);
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      apiServiceSpy.getCustomersPaged.calls.reset();
    });

    it('should change page', () => {
      const page1Response: PagedResponse<Customer> = {
        ...mockPagedResponse,
        page: 1
      };
      apiServiceSpy.getCustomersPaged.and.returnValue(of(page1Response));

      component.onPageChange(1);
      expect(component.page).toBe(1);
      expect(apiServiceSpy.getCustomersPaged).toHaveBeenCalledTimes(1);
    });

    it('should change page size and reset to first page', () => {
      const size50Response: PagedResponse<Customer> = {
        ...mockPagedResponse,
        size: 50,
        page: 0
      };
      apiServiceSpy.getCustomersPaged.and.returnValue(of(size50Response));

      component.page = 2;
      component.onSizeChange(50);
      expect(component.size).toBe(50);
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getCustomersPaged).toHaveBeenCalledTimes(1);
    });
  });

  describe('Delete Operations', () => {
    it('should open delete modal', () => {
      component.openDeleteModal(mockCustomers[0]);
      expect(component.showDeleteModal).toBeTrue();
      expect(component.customerToDelete).toBe(mockCustomers[0]);
    });

    it('should close delete modal', () => {
      component.openDeleteModal(mockCustomers[0]);
      component.closeDeleteModal();
      expect(component.showDeleteModal).toBeFalse();
      expect(component.customerToDelete).toBeNull();
    });

    it('should delete customer successfully', () => {
      apiServiceSpy.deleteCustomer.and.returnValue(of(void 0));

      component.openDeleteModal(mockCustomers[0]);
      component.confirmDelete();

      expect(apiServiceSpy.deleteCustomer).toHaveBeenCalledWith(1);
      expect(component.showDeleteModal).toBeFalse();
    });

    it('should handle delete error', () => {
      apiServiceSpy.deleteCustomer.and.returnValue(
        throwError(() => ({ error: { message: 'Cannot delete' } }))
      );

      component.openDeleteModal(mockCustomers[0]);
      component.confirmDelete();

      expect(component.deleteError).toBe('Cannot delete');
      expect(component.deleteLoading).toBeFalse();
    });
  });

  it('should handle error loading customers', () => {
    apiServiceSpy.getCustomersPaged.and.returnValue(throwError(() => new Error('Error')));
    component.loadCustomers();
    expect(component.loading).toBeFalse();
  });
});
