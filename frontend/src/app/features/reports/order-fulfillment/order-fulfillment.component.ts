import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { OrderFulfillment } from '../../../shared/models';

@Component({
  selector: 'app-order-fulfillment',
  templateUrl: './order-fulfillment.component.html',
  styleUrls: ['./order-fulfillment.component.css']
})
export class OrderFulfillmentComponent implements OnInit {
  loading = true;
  error = '';
  fulfillmentData: OrderFulfillment | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getOrderFulfillment().subscribe({
      next: (data) => {
        this.fulfillmentData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load order fulfillment data';
        this.loading = false;
      }
    });
  }

  getCompletionClass(pct: number): string {
    if (pct >= 90) return 'completion-good';
    if (pct >= 70) return 'completion-warning';
    return 'completion-danger';
  }

  get pendingOrders(): number {
    if (!this.fulfillmentData) return 0;
    return this.fulfillmentData.totalOrders
      - this.fulfillmentData.completedOrders
      - this.fulfillmentData.inProgressOrders
      - this.fulfillmentData.overdueOrders;
  }
}
