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
  batchesPendingApproval: number;
  recentActivity: any[];
  auditActivity: any[];
}

interface InventoryFlowStage {
  type: string;
  label: string;
  icon: string;
  count: number;
  status: 'active' | 'idle' | 'warning';
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
  @ViewChild('inventoryChart') inventoryChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('orderStatusChart') orderStatusChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('batchStatusChart') batchStatusChartRef!: ElementRef<HTMLDivElement>;

  chartsReady = false;
  dataLoaded = {
    inventory: false,
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
    activeHolds: 0,
    todayConfirmations: 0,
    qualityPendingProcesses: 0,
    batchesPendingApproval: 0,
    recentActivity: [],
    auditActivity: []
  };

  // Inventory flow stages (generic: RM → WIP → FG)
  inventoryFlowStages: InventoryFlowStage[] = [
    { type: 'RM', label: 'Raw Materials', icon: 'fa-cubes', count: 0, status: 'idle' },
    { type: 'WIP', label: 'Work in Progress', icon: 'fa-gear', count: 0, status: 'idle' },
    { type: 'IM', label: 'Intermediates', icon: 'fa-box', count: 0, status: 'idle' },
    { type: 'FG', label: 'Finished Goods', icon: 'fa-box-check', count: 0, status: 'idle' }
  ];

  // Operations by status
  operationsSummary: OperationSummary[] = [];
  activeOperations: any[] = [];

  availableOrders: any[] = [];
  recentBatches: any[] = [];
  inventorySummary = {
    total: 0,
    available: 0,
    consumed: 0,
    onHold: 0,
    blocked: 0
  };

  blockedInventoryCount = 0;
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
    this.dataLoaded = { inventory: false, orders: false, summary: false, batches: false };

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

    // Load inventory summary
    this.apiService.getAllInventory().subscribe({
      next: (inventory) => {
        this.inventorySummary.total = inventory.length;
        this.inventorySummary.available = inventory.filter(i => i.state === 'AVAILABLE').length;
        this.inventorySummary.consumed = inventory.filter(i => i.state === 'CONSUMED').length;
        this.inventorySummary.onHold = inventory.filter(i => i.state === 'ON_HOLD').length;
        this.inventorySummary.blocked = inventory.filter(i => i.state === 'BLOCKED').length;
        this.blockedInventoryCount = this.inventorySummary.blocked;

        // Update inventory flow stages (generic pipeline)
        const rmCount = inventory.filter(i => i.inventoryType === 'RM' && i.state === 'AVAILABLE').length;
        const wipCount = inventory.filter(i => i.inventoryType === 'WIP' && i.state === 'AVAILABLE').length;
        const imCount = inventory.filter(i => i.inventoryType === 'IM' && i.state === 'AVAILABLE').length;
        const fgCount = inventory.filter(i => i.inventoryType === 'FG' && i.state === 'AVAILABLE').length;

        this.inventoryFlowStages[0].count = rmCount;
        this.inventoryFlowStages[0].status = rmCount > 0 ? 'active' : 'idle';
        this.inventoryFlowStages[1].count = wipCount;
        this.inventoryFlowStages[1].status = wipCount > 0 ? 'active' : 'idle';
        this.inventoryFlowStages[2].count = imCount;
        this.inventoryFlowStages[2].status = imCount > 0 ? 'active' : 'idle';
        this.inventoryFlowStages[3].count = fgCount;
        this.inventoryFlowStages[3].status = fgCount > 0 ? 'active' : 'idle';

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
        this.summary.qualityPendingProcesses = processes.length;
      },
      error: (err) => console.error('Error loading quality pending processes:', err)
    });

    // Load batches pending approval (QUALITY_PENDING status)
    // Per MES Batch Management Specification: batches require approval before becoming AVAILABLE
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
    if (this.dataLoaded.inventory && this.dataLoaded.orders && this.dataLoaded.summary && this.dataLoaded.batches) {
      this.loading = false;
      this.tryBuildCharts();
    }
  }

  hasAlerts(): boolean {
    return this.summary.activeHolds > 0 ||
           this.summary.batchesPendingApproval > 0 ||
           this.summary.qualityPendingProcesses > 0 ||
           this.blockedInventoryCount > 0;
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

  navigateToInventory(): void {
    this.router.navigate(['/inventory']);
  }

  navigateToBatches(): void {
    this.router.navigate(['/batches']);
  }

  navigateToBatchApproval(): void {
    this.router.navigate(['/batches'], { queryParams: { status: 'QUALITY_PENDING' } });
  }

  navigateToBlockedInventory(): void {
    this.router.navigate(['/inventory'], { queryParams: { state: 'BLOCKED' } });
  }

  navigateToInventoryType(type: string): void {
    this.router.navigate(['/inventory'], { queryParams: { type } });
  }

  navigateToOperationsByStatus(status: string): void {
    // Route based on operation status to appropriate page
    if (status === 'READY') {
      // Production landing shows READY operations
      this.router.navigate(['/production']);
    } else if (status === 'IN_PROGRESS' || status === 'CONFIRMED') {
      // Production history shows completed/in-progress confirmations
      this.router.navigate(['/production/history'], { queryParams: { status } });
    } else {
      // For other statuses, go to orders page (operations are within orders)
      this.router.navigate(['/orders']);
    }
  }

  private tryBuildCharts(): void {
    if (!this.chartsReady || this.loading) return;
    setTimeout(() => {
      this.buildInventoryChart();
      this.buildOrderStatusChart();
      this.buildBatchStatusChart();
    }, 0);
  }

  private buildInventoryChart(): void {
    if (!this.inventoryChartRef) return;
    this.chartService.initChart(this.inventoryChartRef.nativeElement, 'dashboard-inventory');
    this.chartService.setOption('dashboard-inventory', {
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
          { value: this.inventorySummary.onHold, name: 'On Hold', itemStyle: { color: '#ff9800' } },
          { value: this.inventorySummary.blocked, name: 'Blocked', itemStyle: { color: '#f44336' } }
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
