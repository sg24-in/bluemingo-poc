import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ChartService, CHART_FONT } from '../../../core/services/chart.service';

interface DashboardSummary {
  totalOrders: number;
  ordersInProgress: number;
  operationsReady: number;
  operationsInProgress: number;
  todayConfirmations: number;
  batchesPendingApproval: number;
  recentActivity: any[];
}

interface OperationSummary {
  status: string;
  count: number;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('orderStatusChart') orderStatusChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('batchStatusChart') batchStatusChartRef!: ElementRef<HTMLDivElement>;

  chartsReady = false;
  dataLoaded = {
    orders: false,
    summary: false,
    batches: false
  };

  lastUpdated = new Date();
  allOrders: any[] = [];
  allBatches: any[] = [];

  summary: DashboardSummary = {
    totalOrders: 0,
    ordersInProgress: 0,
    operationsReady: 0,
    operationsInProgress: 0,
    todayConfirmations: 0,
    batchesPendingApproval: 0,
    recentActivity: []
  };

  // Operations by status
  operationsSummary: OperationSummary[] = [];
  activeOperations: any[] = [];

  availableOrders: any[] = [];
  recentBatches: any[] = [];

  activeBatchCount = 0;
  loading = true;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private chartService: ChartService
  ) {}

  ngOnInit(): void {
    this.loadDashboardData();
  }

  ngAfterViewInit(): void {
    this.chartsReady = true;
    this.tryBuildCharts();
  }

  ngOnDestroy(): void {
    this.chartService.disposeAll();
  }

  loadDashboardData(): void {
    this.loading = true;
    this.lastUpdated = new Date();
    this.dataLoaded = { orders: false, summary: false, batches: false };

    // Load dashboard summary
    this.apiService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary = {
          ...this.summary,
          totalOrders: data.totalOrders || 0,
          ordersInProgress: data.ordersInProgress || 0,
          operationsReady: data.operationsReady || 0,
          operationsInProgress: data.operationsInProgress || 0,
          todayConfirmations: data.todayConfirmations || 0,
          batchesPendingApproval: data.batchesPendingApproval || 0,
          recentActivity: data.recentActivity || []
        };
        this.dataLoaded.summary = true;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading dashboard summary:', err);
        this.dataLoaded.summary = true;
        this.checkLoadingComplete();
      }
    });

    // Load available orders
    this.apiService.getAvailableOrders().subscribe({
      next: (orders) => {
        this.availableOrders = orders.slice(0, 5);
      },
      error: (err) => console.error('Error loading orders:', err)
    });

    // Load all batches for chart and recent list
    this.apiService.getAllBatches().subscribe({
      next: (batches) => {
        this.allBatches = batches;
        this.recentBatches = batches.slice(0, 5);
        this.activeBatchCount = batches.filter(b =>
          b.status === 'AVAILABLE' || b.status === 'QUALITY_PENDING' || b.status === 'PRODUCED'
        ).length;
        this.dataLoaded.batches = true;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading batches:', err);
        this.dataLoaded.batches = true;
        this.checkLoadingComplete();
      }
    });

    // Load all orders for status chart
    this.apiService.getOrders().subscribe({
      next: (orders) => {
        this.allOrders = orders;
        this.dataLoaded.orders = true;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading all orders:', err);
        this.dataLoaded.orders = true;
        this.checkLoadingComplete();
      }
    });

    // Load batches pending approval (QUALITY_PENDING status)
    this.apiService.getBatchesByStatus('QUALITY_PENDING').subscribe({
      next: (batches) => {
        this.summary.batchesPendingApproval = batches.length;
      },
      error: (err) => console.error('Error loading batches pending approval:', err)
    });

    // Load all operations to build operations summary by status
    this.apiService.getAllOperations().subscribe({
      next: (operations) => {
        // Count operations by status
        const statusCounts: Record<string, number> = {};
        operations.forEach(op => {
          statusCounts[op.status] = (statusCounts[op.status] || 0) + 1;
        });

        // Build operations summary
        const statusColors: Record<string, string> = {
          'NOT_STARTED': '#9e9e9e',
          'READY': '#4caf50',
          'IN_PROGRESS': '#1976d2',
          'CONFIRMED': '#388e3c',
          'ON_HOLD': '#f44336',
          'BLOCKED': '#d32f2f'
        };

        this.operationsSummary = Object.keys(statusCounts).map(status => ({
          status,
          count: statusCounts[status],
          color: statusColors[status] || '#666'
        })).sort((a, b) => {
          const order = ['NOT_STARTED', 'READY', 'IN_PROGRESS', 'CONFIRMED', 'ON_HOLD', 'BLOCKED'];
          return order.indexOf(a.status) - order.indexOf(b.status);
        });

        // Get active operations (IN_PROGRESS) for display
        this.activeOperations = operations
          .filter(op => op.status === 'IN_PROGRESS')
          .slice(0, 5);
      },
      error: () => {}
    });
  }

  private checkLoadingComplete(): void {
    if (this.dataLoaded.orders && this.dataLoaded.summary && this.dataLoaded.batches) {
      this.loading = false;
      this.tryBuildCharts();
    }
  }

  navigateToOrder(orderId: number): void {
    this.router.navigate(['/orders', orderId]);
  }

  navigateToBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }

  navigateToOrders(): void {
    this.router.navigate(['/orders']);
  }

  navigateToBatches(): void {
    this.router.navigate(['/batches']);
  }

  navigateToBatchApproval(): void {
    this.router.navigate(['/batches'], { queryParams: { status: 'QUALITY_PENDING' } });
  }

  navigateToOperationsByStatus(status: string): void {
    // For POC, just navigate to orders (operations are shown in order detail)
    this.router.navigate(['/orders']);
  }

  private tryBuildCharts(): void {
    if (!this.chartsReady || this.loading) return;
    setTimeout(() => {
      this.buildOrderStatusChart();
      this.buildBatchStatusChart();
    }, 0);
  }

  private buildOrderStatusChart(): void {
    if (!this.orderStatusChartRef || this.allOrders.length === 0) return;
    const statusCounts: Record<string, number> = {};
    this.allOrders.forEach(o => {
      statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
    });
    const statusColors: Record<string, string> = {
      'DRAFT': '#9e9e9e',
      'PENDING': '#ff9800',
      'READY': '#4caf50',
      'IN_PROGRESS': '#1976d2',
      'COMPLETED': '#388e3c',
      'CANCELLED': '#d32f2f',
      'ON_HOLD': '#f44336'
    };
    const statuses = Object.keys(statusCounts);
    this.chartService.initChart(this.orderStatusChartRef.nativeElement, 'dashboard-orders');
    this.chartService.setOption('dashboard-orders', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontSize: CHART_FONT.tooltip } },
      grid: { left: 40, right: 20, bottom: 30, top: 20 },
      xAxis: { type: 'category', data: statuses, axisLabel: { fontSize: CHART_FONT.axisLabel, rotate: 30 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar',
        data: statuses.map(s => ({
          value: statusCounts[s],
          itemStyle: { color: statusColors[s] || '#1976d2' }
        })),
        barMaxWidth: 40,
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }]
    });
  }

  private buildBatchStatusChart(): void {
    if (!this.batchStatusChartRef || this.allBatches.length === 0) return;
    const statusCounts: Record<string, number> = {};
    this.allBatches.forEach(b => {
      statusCounts[b.status] = (statusCounts[b.status] || 0) + 1;
    });
    const statusColors: Record<string, string> = {
      'QUALITY_PENDING': '#ff9800',
      'AVAILABLE': '#4caf50',
      'PRODUCED': '#1976d2',
      'CONSUMED': '#9e9e9e',
      'BLOCKED': '#f44336',
      'SCRAPPED': '#795548',
      'ON_HOLD': '#e91e63'
    };
    const statuses = Object.keys(statusCounts);
    this.chartService.initChart(this.batchStatusChartRef.nativeElement, 'dashboard-batches');
    this.chartService.setOption('dashboard-batches', {
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontSize: CHART_FONT.tooltip } },
      grid: { left: 40, right: 20, bottom: 30, top: 20 },
      xAxis: { type: 'category', data: statuses, axisLabel: { fontSize: CHART_FONT.axisLabel, rotate: 30 } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar',
        data: statuses.map(s => ({
          value: statusCounts[s],
          itemStyle: { color: statusColors[s] || '#1976d2' }
        })),
        barMaxWidth: 40,
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }]
    });
  }
}
