import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  orders: Order[] = [];
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

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'orderDate',
      sortDirection: 'DESC',
      status: this.filterStatus || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getOrdersPaged(request).subscribe({
      next: (response: PagedResponse<Order>) => {
        this.orders = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadOrders();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0; // Reset to first page when page size changes
    this.loadOrders();
  }

  onFilterChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0; // Reset to first page when filter changes
    this.loadOrders();
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.page = 0; // Reset to first page when search changes
    this.loadOrders();
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  createOrder(): void {
    this.router.navigate(['/orders/new']);
  }

  editOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId, 'edit']);
  }

  getProductInfo(order: Order): string {
    if (order.lineItems && order.lineItems.length > 0) {
      return order.lineItems[0].productName;
    }
    return 'N/A';
  }

  getTotalQuantity(order: Order): number {
    if (order.lineItems && order.lineItems.length > 0) {
      return order.lineItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    }
    return 0;
  }
}
