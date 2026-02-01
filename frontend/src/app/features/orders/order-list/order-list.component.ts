import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-order-list',
  templateUrl: './order-list.component.html',
  styleUrls: ['./order-list.component.css']
})
export class OrderListComponent implements OnInit {
  orders: any[] = [];
  filteredOrders: any[] = [];
  loading = true;
  filterStatus = 'all';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading = true;
    this.apiService.getOrders().subscribe({
      next: (orders) => {
        this.orders = orders;
        this.applyFilter();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading orders:', err);
        this.loading = false;
      }
    });
  }

  applyFilter(): void {
    if (this.filterStatus === 'all') {
      this.filteredOrders = this.orders;
    } else {
      this.filteredOrders = this.orders.filter(o => o.status === this.filterStatus);
    }
  }

  onFilterChange(status: string): void {
    this.filterStatus = status;
    this.applyFilter();
  }

  viewOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  getProductInfo(order: any): string {
    if (order.lineItems && order.lineItems.length > 0) {
      return order.lineItems[0].productName;
    }
    return 'N/A';
  }

  getTotalQuantity(order: any): number {
    if (order.lineItems && order.lineItems.length > 0) {
      return order.lineItems.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0);
    }
    return 0;
  }
}
