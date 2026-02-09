import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ChartService, CHART_FONT } from '../../../core/services/chart.service';

interface GroupedProcess {
  processId: number | null;
  processName: string;
  operations: any[];
}

@Component({
  selector: 'app-order-detail',
  templateUrl: './order-detail.component.html',
  styleUrls: ['./order-detail.component.css']
})
export class OrderDetailComponent implements OnInit, OnDestroy {
  @ViewChild('processFlowChart') processFlowChartRef!: ElementRef<HTMLDivElement>;

  order: any = null;
  loading = true;
  orderId!: number;

  // Grouped operations by process for each line item
  lineItemProcesses: Map<number, GroupedProcess[]> = new Map();

  // UI state
  flowChartCollapsed = false;
  collapsedLineItems: Set<number> = new Set();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private chartService: ChartService
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
        this.groupOperationsByProcess();
        this.loading = false;
        setTimeout(() => this.buildProcessFlowChart(), 0);
      },
      error: (err) => {
        console.error('Error loading order:', err);
        this.loading = false;
      }
    });
  }

  /**
   * Group operations by their processId/processName for display.
   * The backend returns operations directly on lineItem, but we want to display
   * them grouped by process for better UX.
   */
  private groupOperationsByProcess(): void {
    this.lineItemProcesses.clear();

    if (!this.order?.lineItems) return;

    for (const lineItem of this.order.lineItems) {
      const operations = lineItem.operations || [];
      const processMap = new Map<string, GroupedProcess>();

      for (const op of operations) {
        const key = op.processId ? `${op.processId}` : 'default';
        const processName = op.processName || 'Production';

        if (!processMap.has(key)) {
          processMap.set(key, {
            processId: op.processId || null,
            processName: processName,
            operations: []
          });
        }
        processMap.get(key)!.operations.push(op);
      }

      // Sort operations within each process by sequence number
      for (const process of processMap.values()) {
        process.operations.sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));
      }

      // Convert to array and store
      const processes = Array.from(processMap.values());
      this.lineItemProcesses.set(lineItem.orderLineId, processes);
    }
  }

  /**
   * Get grouped processes for a line item
   */
  getProcessesForLineItem(lineItem: any): GroupedProcess[] {
    return this.lineItemProcesses.get(lineItem.orderLineId) || [];
  }

  // ==================== Statistics Methods ====================

  private getAllOperations(): any[] {
    if (!this.order?.lineItems) return [];
    return this.order.lineItems.flatMap((li: any) => li.operations || []);
  }

  getTotalOperations(): number {
    return this.getAllOperations().length;
  }

  getCompletedOperations(): number {
    return this.getAllOperations().filter((op: any) =>
      op.status === 'CONFIRMED' || op.status === 'COMPLETED'
    ).length;
  }

  getInProgressOperations(): number {
    return this.getAllOperations().filter((op: any) =>
      op.status === 'IN_PROGRESS' || op.status === 'PARTIALLY_CONFIRMED'
    ).length;
  }

  getReadyOperations(): number {
    return this.getAllOperations().filter((op: any) => op.status === 'READY').length;
  }

  getPendingOperations(): number {
    return this.getAllOperations().filter((op: any) =>
      op.status === 'NOT_STARTED' || op.status === 'ON_HOLD' || op.status === 'BLOCKED'
    ).length;
  }

  getCompletionPercentage(): number {
    const total = this.getTotalOperations();
    if (total === 0) return 0;
    return Math.round((this.getCompletedOperations() / total) * 100);
  }

  getLineItemProgress(lineItem: any): number {
    const operations = lineItem.operations || [];
    if (operations.length === 0) return 0;
    const completed = operations.filter((op: any) =>
      op.status === 'CONFIRMED' || op.status === 'COMPLETED'
    ).length;
    return Math.round((completed / operations.length) * 100);
  }

  // ==================== UI State Methods ====================

  toggleFlowChart(): void {
    this.flowChartCollapsed = !this.flowChartCollapsed;
  }

  toggleLineItem(lineItemId: number): void {
    if (this.collapsedLineItems.has(lineItemId)) {
      this.collapsedLineItems.delete(lineItemId);
    } else {
      this.collapsedLineItems.add(lineItemId);
    }
  }

  isLineItemCollapsed(lineItemId: number): boolean {
    return this.collapsedLineItems.has(lineItemId);
  }

  getOperationIcon(status: string): string {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'fa-check';
      case 'IN_PROGRESS':
      case 'PARTIALLY_CONFIRMED':
        return 'fa-spinner fa-spin';
      case 'READY':
        return 'fa-play';
      case 'ON_HOLD':
        return 'fa-pause';
      case 'BLOCKED':
        return 'fa-ban';
      case 'NOT_STARTED':
      default:
        return 'fa-circle';
    }
  }

  goBack(): void {
    this.router.navigate(['/orders']);
  }

  editOrder(): void {
    this.router.navigate(['/orders', this.orderId, 'edit']);
  }

  startProduction(operationId: number): void {
    this.router.navigate(['/production/confirm', operationId]);
  }

  canStartOperation(operation: any): boolean {
    // Operations with READY or IN_PROGRESS status can be confirmed
    return operation.status === 'READY' || operation.status === 'IN_PROGRESS';
  }

  getOperationStatusClass(status: string): string {
    switch (status) {
      case 'CONFIRMED':
      case 'COMPLETED':
        return 'step-completed';
      case 'IN_PROGRESS':
      case 'PARTIALLY_CONFIRMED':
        return 'step-active';
      case 'READY':
        return 'step-ready';
      case 'ON_HOLD':
        return 'step-on-hold';
      case 'BLOCKED':
        return 'step-blocked';
      case 'NOT_STARTED':
      default:
        return 'step-pending';
    }
  }

  ngOnDestroy(): void {
    this.chartService.disposeAll();
  }

  private getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'NOT_STARTED': '#9e9e9e',
      'PENDING': '#9e9e9e',
      'READY': '#4caf50',
      'IN_PROGRESS': '#1976d2',
      'COMPLETED': '#388e3c',
      'CONFIRMED': '#388e3c',
      'ON_HOLD': '#f44336',
      'BLOCKED': '#d32f2f'
    };
    return colors[status] || '#9e9e9e';
  }

  private buildProcessFlowChart(): void {
    if (!this.processFlowChartRef || !this.order?.lineItems?.length) return;

    const nodes: any[] = [];
    const edges: any[] = [];
    const rowHeight = 100;
    const operationSpacingX = 130;
    let currentRow = 0;

    this.order.lineItems.forEach((lineItem: any) => {
      const processes = this.getProcessesForLineItem(lineItem);

      processes.forEach((process: GroupedProcess) => {
        const processNodeId = `process-${process.processId || 'default'}-${lineItem.orderLineId}`;
        const rowY = 50 + currentRow * rowHeight;

        // Process header node - left-aligned
        nodes.push({
          id: processNodeId,
          name: process.processName,
          x: 60,
          y: rowY,
          symbolSize: [140, 36],
          symbol: 'roundRect',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 1, y2: 0,
              colorStops: [
                { offset: 0, color: '#667eea' },
                { offset: 1, color: '#764ba2' }
              ]
            },
            borderRadius: 8,
            shadowColor: 'rgba(102, 126, 234, 0.4)',
            shadowBlur: 10,
            shadowOffsetY: 4
          },
          label: {
            show: true,
            fontSize: 12,
            fontWeight: 'bold',
            color: '#fff',
            overflow: 'truncate',
            ellipsis: '..',
            width: 120,
            formatter: (params: any) => params.name
          }
        });

        let prevOpId: string | null = null;
        (process.operations || []).forEach((op: any, i: number) => {
          const opNodeId = `op-${op.operationId}`;
          const { bgColor, borderColor, shadowColor } = this.getStatusStyles(op.status);

          nodes.push({
            id: opNodeId,
            name: op.operationName,
            value: op.status,
            x: 200 + i * operationSpacingX,
            y: rowY,
            symbolSize: [100, 50],
            symbol: 'roundRect',
            itemStyle: {
              color: bgColor,
              borderColor: borderColor,
              borderWidth: 2,
              borderRadius: 8,
              shadowColor: shadowColor,
              shadowBlur: 8,
              shadowOffsetY: 3
            },
            label: {
              show: true,
              fontSize: 10,
              color: '#333',
              overflow: 'truncate',
              ellipsis: '..',
              width: 85,
              formatter: (params: any) => `{name|${params.name}}\n{status|${params.value}}`,
              rich: {
                name: { fontSize: 10, fontWeight: 'bold', color: '#1e293b', lineHeight: 15 },
                status: { fontSize: 9, color: '#64748b', lineHeight: 13 }
              }
            }
          });

          // Link process to first operation
          if (i === 0) {
            edges.push({
              source: processNodeId,
              target: opNodeId,
              lineStyle: { color: '#94a3b8', width: 2, type: [5, 3] }
            });
          }

          // Sequential operation links with arrow
          if (prevOpId) {
            const edgeColor = this.getEdgeColor(op.status);
            edges.push({
              source: prevOpId,
              target: opNodeId,
              lineStyle: { color: edgeColor, width: 3, curveness: 0 },
              symbol: ['none', 'arrow'],
              symbolSize: 10
            });
          }
          prevOpId = opNodeId;
        });

        currentRow++;
      });
    });

    // Dynamic chart height based on number of rows
    const chartHeight = Math.max(300, currentRow * rowHeight + 80);
    this.processFlowChartRef.nativeElement.style.height = chartHeight + 'px';

    const chart = this.chartService.initChart(this.processFlowChartRef.nativeElement, 'process-flow');
    this.chartService.setOption('process-flow', {
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { fontSize: 12, color: '#1e293b' },
        formatter: (params: any) => {
          if (params.dataType === 'node' && params.value) {
            return `<strong>${params.name}</strong><br/>Status: ${params.value}`;
          }
          return params.name;
        }
      },
      series: [{
        type: 'graph',
        layout: 'none',
        roam: true,
        zoom: 0.85,
        center: ['50%', '50%'],
        data: nodes,
        links: edges,
        lineStyle: { curveness: 0 },
        emphasis: {
          focus: 'adjacency',
          itemStyle: { shadowBlur: 15, shadowColor: 'rgba(0, 0, 0, 0.3)' },
          lineStyle: { width: 4 }
        }
      }]
    });
  }

  private getStatusStyles(status: string): { bgColor: string; borderColor: string; shadowColor: string } {
    const styles: Record<string, { bgColor: string; borderColor: string; shadowColor: string }> = {
      'CONFIRMED': { bgColor: '#dcfce7', borderColor: '#22c55e', shadowColor: 'rgba(34, 197, 94, 0.3)' },
      'COMPLETED': { bgColor: '#dcfce7', borderColor: '#22c55e', shadowColor: 'rgba(34, 197, 94, 0.3)' },
      'IN_PROGRESS': { bgColor: '#dbeafe', borderColor: '#3b82f6', shadowColor: 'rgba(59, 130, 246, 0.3)' },
      'PARTIALLY_CONFIRMED': { bgColor: '#dbeafe', borderColor: '#3b82f6', shadowColor: 'rgba(59, 130, 246, 0.3)' },
      'READY': { bgColor: '#fef3c7', borderColor: '#f59e0b', shadowColor: 'rgba(245, 158, 11, 0.3)' },
      'ON_HOLD': { bgColor: '#ffedd5', borderColor: '#f97316', shadowColor: 'rgba(249, 115, 22, 0.3)' },
      'BLOCKED': { bgColor: '#fee2e2', borderColor: '#ef4444', shadowColor: 'rgba(239, 68, 68, 0.3)' },
      'NOT_STARTED': { bgColor: '#f1f5f9', borderColor: '#94a3b8', shadowColor: 'rgba(148, 163, 184, 0.2)' }
    };
    return styles[status] || styles['NOT_STARTED'];
  }

  private getEdgeColor(status: string): string {
    const colors: Record<string, string> = {
      'CONFIRMED': '#22c55e',
      'COMPLETED': '#22c55e',
      'IN_PROGRESS': '#3b82f6',
      'READY': '#f59e0b',
      'NOT_STARTED': '#cbd5e1'
    };
    return colors[status] || '#cbd5e1';
  }
}
