import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ChartService, CHART_FONT } from '../../../core/services/chart.service';

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
export class DashboardComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('inventoryChart') inventoryChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('orderStatusChart') orderStatusChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('operationsChart') operationsChartRef!: ElementRef<HTMLDivElement>;

  chartsReady = false;
  dataLoaded = {
    inventory: false,
    orders: false,
    summary: false
  };
  allOrders: any[] = [];
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
    this.dataLoaded = { inventory: false, orders: false, summary: false };

    // Load dashboard summary
    this.apiService.getDashboardSummary().subscribe({
      next: (data) => {
        this.summary = data;
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
        this.dataLoaded.inventory = true;
        this.checkLoadingComplete();
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.dataLoaded.inventory = true;
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

    // Load quality pending processes
    this.apiService.getQualityPendingProcesses().subscribe({
      next: (processes) => {
        this.qualityPendingProcesses = processes;
        this.summary.qualityPendingProcesses = processes.length;
      },
      error: (err) => console.error('Error loading quality pending processes:', err)
    });
  }

  private checkLoadingComplete(): void {
    if (this.dataLoaded.inventory && this.dataLoaded.orders && this.dataLoaded.summary) {
      this.loading = false;
      this.tryBuildCharts();
    }
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

  private tryBuildCharts(): void {
    if (!this.chartsReady || this.loading) return;
    // Use setTimeout to ensure DOM is stable after Angular change detection
    setTimeout(() => {
      this.buildInventoryChart();
      this.buildOrderStatusChart();
      this.buildOperationsChart();
    }, 0);
  }

  private buildInventoryChart(): void {
    if (!this.inventoryChartRef) return;
    const chart = this.chartService.initChart(this.inventoryChartRef.nativeElement, 'dashboard-inventory');
    this.chartService.setOption('dashboard-inventory', {
      title: { text: 'Inventory Distribution', left: 'center', textStyle: { fontSize: CHART_FONT.title, fontWeight: 500 } },
      tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)', textStyle: { fontSize: CHART_FONT.tooltip } },
      legend: { bottom: 0, left: 'center', textStyle: { fontSize: CHART_FONT.label } },
      series: [{
        type: 'pie',
        radius: ['40%', '70%'],
        center: ['50%', '45%'],
        avoidLabelOverlap: true,
        itemStyle: { borderRadius: 4, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: CHART_FONT.emphasis, fontWeight: 'bold' } },
        data: [
          { value: this.inventorySummary.available, name: 'Available', itemStyle: { color: '#4caf50' } },
          { value: this.inventorySummary.consumed, name: 'Consumed', itemStyle: { color: '#9e9e9e' } },
          { value: this.inventorySummary.onHold, name: 'On Hold', itemStyle: { color: '#ff9800' } }
        ].filter(d => d.value > 0)
      }]
    });
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
    const chart = this.chartService.initChart(this.orderStatusChartRef.nativeElement, 'dashboard-orders');
    this.chartService.setOption('dashboard-orders', {
      title: { text: 'Order Status Breakdown', left: 'center', textStyle: { fontSize: CHART_FONT.title, fontWeight: 500 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontSize: CHART_FONT.tooltip } },
      grid: { left: 40, right: 20, bottom: 30, top: 40 },
      xAxis: { type: 'category', data: statuses, axisLabel: { fontSize: CHART_FONT.axisLabel } },
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

  private buildOperationsChart(): void {
    if (!this.operationsChartRef) return;
    const chart = this.chartService.initChart(this.operationsChartRef.nativeElement, 'dashboard-operations');
    this.chartService.setOption('dashboard-operations', {
      title: { text: 'Operations Overview', left: 'center', textStyle: { fontSize: CHART_FONT.title, fontWeight: 500 } },
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, textStyle: { fontSize: CHART_FONT.tooltip } },
      grid: { left: 40, right: 20, bottom: 30, top: 40 },
      xAxis: { type: 'category', data: ['Ready', 'In Progress'], axisLabel: { fontSize: CHART_FONT.axisLabel } },
      yAxis: { type: 'value', minInterval: 1 },
      series: [{
        type: 'bar',
        data: [
          { value: this.summary.operationsReady, itemStyle: { color: '#4caf50' } },
          { value: this.summary.operationsInProgress, itemStyle: { color: '#1976d2' } }
        ],
        barMaxWidth: 60,
        itemStyle: { borderRadius: [4, 4, 0, 0] }
      }]
    });
  }

  getAuditIcon(action: string): string {
    switch (action) {
      case 'CREATE':
        return 'fa-plus';
      case 'STATUS_CHANGE':
        return 'fa-arrows-left-right';
      case 'CONSUME':
        return 'fa-minus';
      case 'PRODUCE':
        return 'fa-gear';
      case 'HOLD':
        return 'fa-pause';
      case 'RELEASE':
        return 'fa-play';
      case 'UPDATE':
        return 'fa-pencil';
      default:
        return 'fa-circle-dot';
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
