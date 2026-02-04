import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Customer } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-customer-list',
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  loading = true;

  // Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filter state
  filterStatus = '';
  searchTerm = '';

  // Delete modal
  showDeleteModal = false;
  customerToDelete: Customer | null = null;
  deleteLoading = false;
  deleteError = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'customerName',
      sortDirection: 'ASC',
      status: this.filterStatus || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getCustomersPaged(request).subscribe({
      next: (response: PagedResponse<Customer>) => {
        this.customers = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading customers:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadCustomers();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadCustomers();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadCustomers();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadCustomers();
  }

  createCustomer(): void {
    this.router.navigate(['/manage/customers/new']);
  }

  editCustomer(customer: Customer): void {
    this.router.navigate(['/manage/customers', customer.customerId, 'edit']);
  }

  openDeleteModal(customer: Customer): void {
    this.customerToDelete = customer;
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.customerToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.customerToDelete) return;

    this.deleteLoading = true;
    this.deleteError = '';

    this.apiService.deleteCustomer(this.customerToDelete.customerId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.loadCustomers();
      },
      error: (err) => {
        this.deleteLoading = false;
        this.deleteError = err.error?.message || 'Failed to delete customer.';
      }
    });
  }
}
