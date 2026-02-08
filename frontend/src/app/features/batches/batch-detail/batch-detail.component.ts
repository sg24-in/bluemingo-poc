import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { ChartService, CHART_FONT } from '../../../core/services/chart.service';
import { AllocationInfo, BatchAvailability } from '../../../shared/models';

interface SplitPortion {
  quantity: number;
  suffix: string;
}

@Component({
  selector: 'app-batch-detail',
  templateUrl: './batch-detail.component.html',
  styleUrls: ['./batch-detail.component.css']
})
export class BatchDetailComponent implements OnInit, OnDestroy {
  @ViewChild('genealogyChart') genealogyChartRef!: ElementRef<HTMLDivElement>;

  batch: any = null;
  genealogy: any = null;
  loading = true;
  loadingGenealogy = true;
  batchId!: number;

  // Split/Merge UI
  showSplitModal = false;
  showMergeModal = false;
  splitPortions: SplitPortion[] = [];
  splitReason = '';
  mergeSelectedBatches: any[] = [];
  availableBatchesForMerge: any[] = [];
  mergeTargetBatchNumber = '';
  mergeReason = '';
  error = '';
  success = '';
  submitting = false;

  // Allocation UI (GAP-001: Multi-Order Batch Confirmation)
  allocations: AllocationInfo[] = [];
  batchAvailability: BatchAvailability | null = null;
  loadingAllocations = false;
  showAllocationModal = false;
  allocationOrderLineId: number | null = null;
  allocationQuantity: number = 0;
  availableOrderLines: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private chartService: ChartService
  ) {}

  ngOnInit(): void {
    this.batchId = Number(this.route.snapshot.paramMap.get('batchId'));
    this.loadBatch();
    this.loadGenealogy();
    this.loadAllocations();
  }

  loadBatch(): void {
    this.loading = true;
    this.apiService.getBatchById(this.batchId).subscribe({
      next: (data) => {
        this.batch = data;
        this.loading = false;
        this.tryBuildGenealogyChart();
      },
      error: (err) => {
        console.error('Error loading batch:', err);
        this.loading = false;
      }
    });
  }

  loadGenealogy(): void {
    this.loadingGenealogy = true;
    this.apiService.getBatchGenealogy(this.batchId).subscribe({
      next: (data) => {
        this.genealogy = data;
        this.loadingGenealogy = false;
        this.tryBuildGenealogyChart();
      },
      error: (err) => {
        console.error('Error loading genealogy:', err);
        this.loadingGenealogy = false;
      }
    });
  }

  private tryBuildGenealogyChart(): void {
    if (!this.batch || !this.genealogy) return;
    // Allow nested *ngIf directives to resolve before accessing ViewChild
    setTimeout(() => this.buildGenealogyChart(), 50);
  }

  goBack(): void {
    this.router.navigate(['/batches']);
  }

  navigateToBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }

  // Split functionality
  openSplitModal(): void {
    this.showSplitModal = true;
    this.splitPortions = [{ quantity: 0, suffix: 'A' }];
    this.splitReason = '';
    this.error = '';
    this.success = '';
  }

  closeSplitModal(): void {
    this.showSplitModal = false;
  }

  addSplitPortion(): void {
    const nextSuffix = String.fromCharCode(65 + this.splitPortions.length); // A, B, C, ...
    this.splitPortions.push({ quantity: 0, suffix: nextSuffix });
  }

  removeSplitPortion(index: number): void {
    if (this.splitPortions.length > 1) {
      this.splitPortions.splice(index, 1);
    }
  }

  getTotalSplitQuantity(): number {
    return this.splitPortions.reduce((sum, p) => sum + (p.quantity || 0), 0);
  }

  canSplit(): boolean {
    if (!this.batch || this.batch.status !== 'AVAILABLE') return false;
    const totalSplit = this.getTotalSplitQuantity();
    return totalSplit > 0 && totalSplit <= this.batch.quantity;
  }

  submitSplit(): void {
    if (!this.canSplit()) return;

    this.submitting = true;
    this.error = '';

    const request = {
      sourceBatchId: this.batchId,
      portions: this.splitPortions.map(p => ({
        quantity: p.quantity,
        batchNumberSuffix: p.suffix
      })),
      reason: this.splitReason
    };

    this.apiService.splitBatch(this.batchId, request).subscribe({
      next: (result) => {
        this.success = `Batch split successfully into ${result.newBatches?.length || 0} new batches`;
        this.submitting = false;
        this.closeSplitModal();
        this.loadBatch();
        this.loadGenealogy();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to split batch';
        this.submitting = false;
      }
    });
  }

  // Merge functionality
  openMergeModal(): void {
    this.showMergeModal = true;
    this.mergeSelectedBatches = [];
    this.mergeTargetBatchNumber = '';
    this.mergeReason = '';
    this.error = '';
    this.success = '';
    this.loadAvailableBatchesForMerge();
  }

  closeMergeModal(): void {
    this.showMergeModal = false;
  }

  loadAvailableBatchesForMerge(): void {
    if (!this.batch) return;

    this.apiService.getAvailableBatches(this.batch.materialId).subscribe({
      next: (batches) => {
        // Filter out current batch and only show AVAILABLE batches
        this.availableBatchesForMerge = batches.filter(
          b => b.batchId !== this.batchId && b.status === 'AVAILABLE'
        );
      },
      error: (err) => console.error('Error loading batches for merge:', err)
    });
  }

  toggleBatchForMerge(batch: any): void {
    const index = this.mergeSelectedBatches.findIndex(b => b.batchId === batch.batchId);
    if (index >= 0) {
      this.mergeSelectedBatches.splice(index, 1);
    } else {
      this.mergeSelectedBatches.push(batch);
    }
  }

  isBatchSelectedForMerge(batch: any): boolean {
    return this.mergeSelectedBatches.some(b => b.batchId === batch.batchId);
  }

  getTotalMergeQuantity(): number {
    const currentQty = this.batch?.quantity || 0;
    const selectedQty = this.mergeSelectedBatches.reduce((sum, b) => sum + (b.quantity || 0), 0);
    return currentQty + selectedQty;
  }

  canMerge(): boolean {
    return this.batch?.status === 'AVAILABLE' && this.mergeSelectedBatches.length > 0;
  }

  submitMerge(): void {
    if (!this.canMerge()) return;

    this.submitting = true;
    this.error = '';

    const request = {
      sourceBatchIds: [this.batchId, ...this.mergeSelectedBatches.map(b => b.batchId)],
      targetBatchNumber: this.mergeTargetBatchNumber || undefined,
      reason: this.mergeReason
    };

    this.apiService.mergeBatches(request).subscribe({
      next: (result) => {
        this.success = `Batches merged successfully into ${result.mergedBatch?.batchNumber}`;
        this.submitting = false;
        this.closeMergeModal();
        // Navigate to the new merged batch
        if (result.mergedBatch?.batchId) {
          this.router.navigate(['/batches', result.mergedBatch.batchId]);
        }
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to merge batches';
        this.submitting = false;
      }
    });
  }

  // ============================================================
  // Allocation functionality (GAP-001: Multi-Order Batch Confirmation)
  // ============================================================

  loadAllocations(): void {
    this.loadingAllocations = true;
    this.apiService.getBatchAllocations(this.batchId).subscribe({
      next: (allocations) => {
        this.allocations = allocations;
        this.loadingAllocations = false;
      },
      error: (err) => {
        console.error('Error loading allocations:', err);
        this.loadingAllocations = false;
      }
    });

    this.apiService.getBatchAvailability(this.batchId).subscribe({
      next: (availability) => {
        this.batchAvailability = availability;
      },
      error: (err) => {
        console.error('Error loading batch availability:', err);
      }
    });
  }

  openAllocationModal(): void {
    this.showAllocationModal = true;
    this.allocationOrderLineId = null;
    this.allocationQuantity = this.batchAvailability?.availableQuantity || 0;
    this.error = '';
    this.loadAvailableOrderLines();
  }

  closeAllocationModal(): void {
    this.showAllocationModal = false;
  }

  loadAvailableOrderLines(): void {
    // Load orders with READY operations to get available order lines
    this.apiService.getAvailableOrders().subscribe({
      next: (orders) => {
        this.availableOrderLines = [];
        orders.forEach(order => {
          if (order.lineItems) {
            order.lineItems.forEach((line: any) => {
              this.availableOrderLines.push({
                orderLineId: line.orderLineId,
                orderId: order.orderId,
                orderNumber: order.orderNumber,
                productSku: line.productSku,
                productName: line.productName,
                orderedQty: line.quantity,
                unit: line.unit
              });
            });
          }
        });
      },
      error: (err) => console.error('Error loading order lines:', err)
    });
  }

  canAllocate(): boolean {
    return this.allocationOrderLineId !== null &&
           this.allocationQuantity > 0 &&
           this.allocationQuantity <= (this.batchAvailability?.availableQuantity || 0);
  }

  submitAllocation(): void {
    if (!this.canAllocate() || !this.allocationOrderLineId) return;

    this.submitting = true;
    this.error = '';

    this.apiService.allocateBatchToOrder({
      batchId: this.batchId,
      orderLineId: this.allocationOrderLineId,
      quantity: this.allocationQuantity
    }).subscribe({
      next: (result) => {
        this.success = `Successfully allocated ${result.allocatedQty} ${result.unit} to order`;
        this.submitting = false;
        this.closeAllocationModal();
        this.loadAllocations();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to allocate batch';
        this.submitting = false;
      }
    });
  }

  releaseAllocation(allocationId: number): void {
    if (!confirm('Are you sure you want to release this allocation?')) return;

    this.apiService.releaseAllocation(allocationId).subscribe({
      next: () => {
        this.success = 'Allocation released successfully';
        this.loadAllocations();
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to release allocation';
      }
    });
  }

  getActiveAllocations(): AllocationInfo[] {
    return this.allocations.filter(a => a.status === 'ALLOCATED');
  }

  getReleasedAllocations(): AllocationInfo[] {
    return this.allocations.filter(a => a.status === 'RELEASED');
  }

  ngOnDestroy(): void {
    this.chartService.disposeAll();
  }

  // ============================================================
  // GAP-020: Traceability Display Helpers
  // ============================================================

  /**
   * Get human-readable label for how the batch was created
   */
  getCreatedViaLabel(): string {
    if (!this.batch?.createdVia) return 'Unknown';

    const labels: Record<string, string> = {
      'PRODUCTION': 'Production Confirmation',
      'SPLIT': 'Batch Split',
      'MERGE': 'Batch Merge',
      'MANUAL': 'Manual Entry',
      'SYSTEM': 'System Generated',
      'RECEIPT': 'Goods Receipt'
    };

    return labels[this.batch.createdVia] || this.batch.createdVia;
  }

  /**
   * Get icon class for the creation method
   */
  getCreatedViaIcon(): string {
    if (!this.batch?.createdVia) return 'fa-question-circle';

    const icons: Record<string, string> = {
      'PRODUCTION': 'fa-industry',
      'SPLIT': 'fa-code-branch',
      'MERGE': 'fa-code-merge',
      'MANUAL': 'fa-pen-to-square',
      'SYSTEM': 'fa-robot',
      'RECEIPT': 'fa-truck-ramp-box'
    };

    return icons[this.batch.createdVia] || 'fa-circle';
  }

  /**
   * Get CSS class for the creation type badge
   */
  getCreatedViaClass(): string {
    if (!this.batch?.createdVia) return '';

    const classes: Record<string, string> = {
      'PRODUCTION': 'created-via-production',
      'SPLIT': 'created-via-split',
      'MERGE': 'created-via-merge',
      'MANUAL': 'created-via-manual',
      'SYSTEM': 'created-via-system',
      'RECEIPT': 'created-via-receipt'
    };

    return classes[this.batch.createdVia] || '';
  }

  /**
   * Check if batch has supplier info (for RM batches)
   */
  hasSupplierInfo(): boolean {
    return !!(this.batch?.supplierBatchNumber || this.batch?.supplierId);
  }

  /**
   * Navigate to the source operation
   */
  navigateToOperation(operationId: number): void {
    // Navigate to order/operation - operations are accessed via order detail
    this.router.navigate(['/production/confirm', operationId]);
  }

  private buildGenealogyChart(): void {
    if (!this.genealogyChartRef || !this.genealogy || !this.batch) return;
    const parents = this.genealogy.parentBatches || [];
    const children = this.genealogy.childBatches || [];
    if (parents.length === 0 && children.length === 0) return;

    const nodes: any[] = [];
    const edges: any[] = [];
    const nodeSpacingX = 200;
    const parentY = 50;
    const currentY = 200;
    const childY = 350;

    // Parent batch nodes (top row)
    const parentStartX = parents.length > 1 ? -(parents.length - 1) * nodeSpacingX / 2 : 0;
    parents.forEach((p: any, i: number) => {
      const nodeId = `parent-${p.batchId}`;
      nodes.push({
        id: nodeId,
        name: p.batchNumber,
        x: parentStartX + i * nodeSpacingX,
        y: parentY,
        symbolSize: [140, 50],
        symbol: 'roundRect',
        itemStyle: { color: '#fff', borderColor: '#1976d2', borderWidth: 2 },
        label: {
          show: true, fontSize: CHART_FONT.label, color: '#333',
          formatter: `${p.batchNumber}\n${p.materialId || ''}\nConsumed: ${p.quantityConsumed || ''} ${p.unit || ''}`
        },
        value: p.batchId
      });
      edges.push({
        source: nodeId,
        target: 'current',
        lineStyle: { color: '#1976d2', width: 2 },
        symbol: ['none', 'arrow'],
        symbolSize: 10,
        label: {
          show: !!(p.relationType),
          formatter: p.relationType || '',
          fontSize: CHART_FONT.edgeLabel, color: '#888'
        }
      });
    });

    // Current batch node (center)
    nodes.push({
      id: 'current',
      name: this.batch.batchNumber,
      x: 0,
      y: currentY,
      symbolSize: [160, 56],
      symbol: 'roundRect',
      itemStyle: { color: '#1976d2', borderColor: '#0d47a1', borderWidth: 3 },
      label: {
        show: true, fontSize: CHART_FONT.labelBold, fontWeight: 'bold', color: '#fff',
        formatter: `${this.batch.batchNumber}\n${this.batch.materialId || ''}\nQty: ${this.batch.quantity} ${this.batch.unit || ''}`
      }
    });

    // Child batch nodes (bottom row)
    const childStartX = children.length > 1 ? -(children.length - 1) * nodeSpacingX / 2 : 0;
    children.forEach((c: any, i: number) => {
      const nodeId = `child-${c.batchId}`;
      nodes.push({
        id: nodeId,
        name: c.batchNumber,
        x: childStartX + i * nodeSpacingX,
        y: childY,
        symbolSize: [140, 50],
        symbol: 'roundRect',
        itemStyle: { color: '#fff', borderColor: '#388e3c', borderWidth: 2 },
        label: {
          show: true, fontSize: CHART_FONT.label, color: '#333',
          formatter: `${c.batchNumber}\n${c.materialId || ''}\nQty: ${c.quantity || ''} ${c.unit || ''}`
        },
        value: c.batchId
      });
      edges.push({
        source: 'current',
        target: nodeId,
        lineStyle: { color: '#388e3c', width: 2 },
        symbol: ['none', 'arrow'],
        symbolSize: 10,
        label: {
          show: !!(c.relationType),
          formatter: c.relationType || '',
          fontSize: CHART_FONT.edgeLabel, color: '#888'
        }
      });
    });

    const chart = this.chartService.initChart(this.genealogyChartRef.nativeElement, 'batch-genealogy');
    this.chartService.setOption('batch-genealogy', {
      tooltip: {
        trigger: 'item',
        textStyle: { fontSize: CHART_FONT.tooltip },
        formatter: (params: any) => {
          if (params.dataType === 'node') return params.name;
          return '';
        }
      },
      series: [{
        type: 'graph',
        layout: 'none',
        roam: true,
        data: nodes,
        links: edges,
        lineStyle: { curveness: 0.1 },
        emphasis: { focus: 'adjacency', lineStyle: { width: 4 } }
      }]
    });

    // Click to navigate
    chart.on('click', (params: any) => {
      if (params.dataType === 'node' && params.data.value && params.data.id !== 'current') {
        this.router.navigate(['/batches', params.data.value]);
      }
    });
  }
}
