import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ChartService, CHART_FONT } from '../../../core/services/chart.service';

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
        this.loading = false;
        setTimeout(() => this.buildProcessFlowChart(), 0);
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

  editOrder(): void {
    this.router.navigate(['/orders', this.orderId, 'edit']);
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
    let xOffset = 0;
    const processY = 30;
    const operationY = 130;
    const nodeSpacingX = 160;

    this.order.lineItems.forEach((lineItem: any) => {
      (lineItem.processes || []).forEach((process: any) => {
        const processNodeId = `process-${process.processId}`;
        const opsCount = process.operations?.length || 1;
        const processX = xOffset + ((opsCount - 1) * nodeSpacingX) / 2;

        // Process header node
        nodes.push({
          id: processNodeId,
          name: process.processName,
          x: processX,
          y: processY,
          symbolSize: [120, 36],
          symbol: 'roundRect',
          itemStyle: { color: '#f5f5f5', borderColor: '#1976d2', borderWidth: 2 },
          label: { show: true, fontSize: CHART_FONT.labelBold, fontWeight: 'bold', color: '#1976d2' }
        });

        let prevOpId: string | null = null;
        (process.operations || []).forEach((op: any, i: number) => {
          const opNodeId = `op-${op.operationId}`;
          const color = this.getStatusColor(op.status);

          nodes.push({
            id: opNodeId,
            name: `${op.operationName}\n[${op.status}]`,
            x: xOffset + i * nodeSpacingX,
            y: operationY,
            symbolSize: 50,
            itemStyle: { color: color, borderColor: color, borderWidth: 2 },
            label: { show: true, fontSize: CHART_FONT.label, color: '#333', position: 'bottom', distance: 8 }
          });

          // Link process to first operation
          if (i === 0) {
            edges.push({
              source: processNodeId,
              target: opNodeId,
              lineStyle: { color: '#bbb', width: 1.5, type: 'dashed' }
            });
          }

          // Sequential operation links
          if (prevOpId) {
            edges.push({
              source: prevOpId,
              target: opNodeId,
              lineStyle: { color: '#666', width: 2 },
              symbol: ['none', 'arrow'],
              symbolSize: 8
            });
          }
          prevOpId = opNodeId;
        });

        xOffset += opsCount * nodeSpacingX + 80;
      });
    });

    const chart = this.chartService.initChart(this.processFlowChartRef.nativeElement, 'process-flow');
    this.chartService.setOption('process-flow', {
      tooltip: {
        trigger: 'item',
        textStyle: { fontSize: CHART_FONT.tooltip },
        formatter: (params: any) => {
          if (params.dataType === 'node') return params.name.replace('\n', '<br/>');
          return '';
        }
      },
      series: [{
        type: 'graph',
        layout: 'none',
        roam: true,
        data: nodes,
        links: edges,
        lineStyle: { curveness: 0 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 3 } }
      }]
    });
  }
}
