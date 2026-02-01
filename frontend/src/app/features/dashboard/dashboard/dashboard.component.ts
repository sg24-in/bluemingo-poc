import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  availableOrders: any[] = [];
  recentBatches: any[] = [];
  inventorySummary = {
    total: 0,
    available: 0,
    consumed: 0,
    onHold: 0
  };
  loading = true;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  loadDashboardData(): void {
    this.loading = true;

    // Load available orders
    this.apiService.getAvailableOrders().subscribe({
      next: (orders) => {
        this.availableOrders = orders.slice(0, 5); // Show top 5
      },
      error: (err) => console.error('Error loading orders:', err)
    });

    // Load recent batches
    this.apiService.getAllBatches().subscribe({
      next: (batches) => {
        this.recentBatches = batches.slice(0, 5); // Show top 5
      },
      error: (err) => console.error('Error loading batches:', err)
    });

    // Load inventory summary
    this.apiService.getAllInventory().subscribe({
      next: (inventory) => {
        this.inventorySummary.total = inventory.length;
        this.inventorySummary.available = inventory.filter(i => i.state === 'AVAILABLE').length;
        this.inventorySummary.consumed = inventory.filter(i => i.state === 'CONSUMED').length;
        this.inventorySummary.onHold = inventory.filter(i => i.state === 'ON_HOLD').length;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.loading = false;
      }
    });
  }

  navigateToOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  navigateToBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }
}
