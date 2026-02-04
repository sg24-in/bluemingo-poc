import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
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
export class BatchDetailComponent implements OnInit {
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
    private apiService: ApiService
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
      },
      error: (err) => {
        console.error('Error loading genealogy:', err);
        this.loadingGenealogy = false;
      }
    });
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
}
