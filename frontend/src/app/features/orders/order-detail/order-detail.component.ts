import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit {
  order: any = null;
  loading = true;
  orderId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.paramMap.get('orderId'));
    this.loadOrder();
  }

  loadOrder(): void {
    this.loading = true;
    this.apiService.getOrderById(this.orderId).subscribe({
      next: (order) => {
        this.order = order;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading order:', err);
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  startProduction(operationId: number): void {
    this.router.navigate(['/production/confirm', operationId]);
  }

  canStartOperation(operation: any): boolean {
    return operation.status === 'PENDING' || operation.status === 'IN_PROGRESS';
  }

  getOperationStatusClass(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'step-completed';
      case 'IN_PROGRESS':
        return 'step-active';
      default:
        return 'step-pending';
    }
  }
}
