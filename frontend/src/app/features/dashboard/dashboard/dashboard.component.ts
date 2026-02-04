import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface DashboardSummary {
  totalOrders: number;
  ordersInProgress: number;
  operationsReady: number;
  operationsInProgress: number;
  activeHolds: number;
  todayConfirmations: number;
  qualityPendingProcesses: number;
  recentActivity: any[];
  auditActivity: AuditActivity[];
}

interface AuditActivity {
  auditId: number;
  entityType: string;
  entityId: number;
  action: string;
  description: string;
  changedBy: string;
  timestamp: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  summary: DashboardSummary = {
    totalOrders: 0,
    ordersInProgress: 0,
    operationsReady: 0,
    operationsInProgress: 0,
    activeHolds: 0,
    todayConfirmations: 0,
    qualityPendingProcesses: 0,
    recentActivity: [],
    auditActivity: []
  };

  qualityPendingProcesses: any[] = [];

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

    // Load dashboard summary
    this.apiService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary = data;
      },
      error: (err) => console.error('Error loading dashboard summary:', err)
    });

    // Load available orders
    this.apiService.getAvailableOrders().subscribe({
      next: (orders) => {
        this.availableOrders = orders.slice(0, 5);
      },
      error: (err) => console.error('Error loading orders:', err)
    });

    // Load recent batches
    this.apiService.getAllBatches().subscribe({
      next: (batches) => {
        this.recentBatches = batches.slice(0, 5);
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

    // Load quality pending processes
    this.apiService.getQualityPendingProcesses().subscribe({
      next: (processes) => {
        this.qualityPendingProcesses = processes;
        this.summary.qualityPendingProcesses = processes.length;
      },
      error: (err) => console.error('Error loading quality pending processes:', err)
    });
  }

  navigateToQualityPending(): void {
    this.router.navigate(['/processes/quality-pending']);
  }

  navigateToOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  navigateToBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }

  navigateToHolds(): void {
    this.router.navigate(['/holds']);
  }

  navigateToOrders(): void {
    this.router.navigate(['/orders']);
  }

  getAuditIcon(action: string): string {
    switch (action) {
      case 'CREATE':
        return '+';
      case 'STATUS_CHANGE':
        return '↔';
      case 'CONSUME':
        return '−';
      case 'PRODUCE':
        return '⚙';
      case 'HOLD':
        return '⏸';
      case 'RELEASE':
        return '▶';
      case 'UPDATE':
        return '✎';
      default:
        return '•';
    }
  }

  getAuditIconClass(action: string): string {
    switch (action) {
      case 'CREATE':
        return 'audit-icon-create';
      case 'STATUS_CHANGE':
        return 'audit-icon-status';
      case 'CONSUME':
        return 'audit-icon-consume';
      case 'PRODUCE':
        return 'audit-icon-produce';
      case 'HOLD':
        return 'audit-icon-hold';
      case 'RELEASE':
        return 'audit-icon-release';
      case 'UPDATE':
        return 'audit-icon-update';
      default:
        return 'audit-icon-default';
    }
  }
}
