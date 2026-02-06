import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Order } from '../../../shared/models';

interface OperationSummary {
  operationId: number;
  operationName: string;
  operationCode?: string;
  operationType?: string;
  sequenceNumber: number;
  status: string;
}

@Component({
  selector: 'app-production-landing',
  templateUrl: './production-landing.component.html',
  styleUrls: ['./production-landing.component.css']
})
export class ProductionLandingComponent implements OnInit {
  availableOrders: Order[] = [];
  selectedOrder: Order | null = null;
  readyOperations: OperationSummary[] = [];
  selectedOperationId: number | null = null;

  loading = true;
  error = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAvailableOrders();
  }

  loadAvailableOrders(): void {
    this.loading = true;
    this.apiService.getAvailableOrders().subscribe({
      next: (orders) => {
        this.availableOrders = orders;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load available orders';
        this.loading = false;
        console.error('Error loading orders:', err);
      }
    });
  }

  onOrderSelect(event: Event): void {
    const orderId = (event.target as HTMLSelectElement).value;
    this.selectedOperationId = null;
    this.readyOperations = [];

    if (!orderId) {
      this.selectedOrder = null;
      return;
    }

    // Find the selected order
    this.selectedOrder = this.availableOrders.find(o => o.orderId === +orderId) || null;

    if (this.selectedOrder) {
      // Extract all READY operations from all processes
      this.readyOperations = this.extractReadyOperations(this.selectedOrder);
    }
  }

  private extractReadyOperations(order: Order): OperationSummary[] {
    const operations: OperationSummary[] = [];

    for (const lineItem of order.lineItems || []) {
      for (const process of lineItem.processes || []) {
        for (const op of process.operations || []) {
          if (op.status === 'READY') {
            operations.push({
              operationId: op.operationId,
              operationName: `${process.stageName} - ${op.operationName}`,
              operationCode: op.operationCode,
              operationType: op.operationType,
              sequenceNumber: op.sequenceNumber,
              status: op.status
            });
          }
        }
      }
    }

    return operations;
  }

  onOperationSelect(event: Event): void {
    const operationId = (event.target as HTMLSelectElement).value;
    this.selectedOperationId = operationId ? +operationId : null;
  }

  startConfirmation(): void {
    if (this.selectedOperationId) {
      this.router.navigate(['/production/confirm', this.selectedOperationId]);
    }
  }

  goToHistory(): void {
    this.router.navigate(['/production/history']);
  }

  // Helper getters for order context display
  get orderContext(): { label: string; value: string }[] {
    if (!this.selectedOrder) return [];

    const context: { label: string; value: string }[] = [
      { label: 'Customer', value: this.selectedOrder.customerName || this.selectedOrder.customerId || 'N/A' },
      { label: 'Order Date', value: this.selectedOrder.orderDate ? new Date(this.selectedOrder.orderDate).toLocaleDateString() : 'N/A' },
      { label: 'Status', value: this.selectedOrder.status || 'N/A' }
    ];

    // Add product info from first line item
    const lineItems = this.selectedOrder.lineItems || [];
    if (lineItems.length > 0) {
      const firstLineItem = lineItems[0];
      context.push(
        { label: 'Product', value: firstLineItem.productName || firstLineItem.productSku || 'N/A' },
        { label: 'Quantity', value: `${firstLineItem.quantity || 0} ${firstLineItem.unit || ''}` }
      );
      if (firstLineItem.deliveryDate) {
        context.push({ label: 'Due Date', value: new Date(firstLineItem.deliveryDate).toLocaleDateString() });
      }
    }

    return context;
  }

  get selectedOperationDetails(): OperationSummary | null {
    if (!this.selectedOperationId) return null;
    return this.readyOperations.find(op => op.operationId === this.selectedOperationId) || null;
  }

  getTotalReadyOperations(): number {
    let count = 0;
    for (const order of this.availableOrders) {
      count += this.extractReadyOperations(order).length;
    }
    return count;
  }
}
