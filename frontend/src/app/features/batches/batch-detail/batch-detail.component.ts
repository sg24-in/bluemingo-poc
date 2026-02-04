import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.batchId = Number(this.route.snapshot.paramMap.get('batchId'));
    this.loadBatch();
    this.loadGenealogy();
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
}
