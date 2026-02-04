import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { Hold } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-hold-list',
  templateUrl: './hold-list.component.html',
  styleUrls: ['./hold-list.component.css']
})
export class HoldListComponent implements OnInit {
  holds: Hold[] = [];
  holdReasons: any[] = [];
  loading = false;
  error = '';
  success = '';

  // Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filter state
  filterStatus = '';
  filterEntityType = '';
  searchTerm = '';

  showApplyHoldModal = false;
  showReleaseHoldModal = false;
  selectedHold: Hold | null = null;

  applyHoldForm: FormGroup;
  releaseComments = '';

  entityTypes = [
    { value: 'OPERATION', label: 'Operation' },
    { value: 'PROCESS', label: 'Process' },
    { value: 'ORDER_LINE', label: 'Order Line' },
    { value: 'INVENTORY', label: 'Inventory' },
    { value: 'BATCH', label: 'Batch' }
  ];

  // Available entities for selection
  operations: any[] = [];
  processes: any[] = [];
  inventory: any[] = [];
  batches: any[] = [];

  constructor(
    private apiService: ApiService,
    private fb: FormBuilder
  ) {
    this.applyHoldForm = this.fb.group({
      entityType: ['', Validators.required],
      entityId: ['', Validators.required],
      reason: ['', Validators.required],
      comments: ['']
    });
  }

  ngOnInit(): void {
    this.loadHolds();
    this.loadHoldReasons();
    this.loadEntities();
  }

  loadHolds(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'appliedOn',
      sortDirection: 'DESC',
      status: this.filterStatus || undefined,
      type: this.filterEntityType || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getHoldsPaged(request).subscribe({
      next: (response: PagedResponse<Hold>) => {
        this.holds = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading holds:', err);
        this.error = 'Failed to load holds';
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadHolds();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadHolds();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadHolds();
  }

  onFilterEntityTypeChange(type: string): void {
    this.filterEntityType = type === 'all' ? '' : type;
    this.page = 0;
    this.loadHolds();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadHolds();
  }

  loadHoldReasons(): void {
    this.apiService.getHoldReasons().subscribe({
      next: (data) => {
        this.holdReasons = data;
      },
      error: (err) => console.error('Error loading hold reasons:', err)
    });
  }

  loadEntities(): void {
    // Load available operations
    this.apiService.getAvailableOrders().subscribe({
      next: (orders) => {
        this.operations = [];
        orders.forEach(order => {
          order.lineItems?.forEach((lineItem: any) => {
            lineItem.processes?.forEach((process: any) => {
              process.operations?.forEach((op: any) => {
                if (op.status !== 'ON_HOLD' && op.status !== 'CONFIRMED') {
                  this.operations.push({
                    id: op.operationId,
                    name: `${op.operationName} (Order: ${order.orderId})`
                  });
                }
              });
              if (process.status !== 'ON_HOLD' && process.status !== 'COMPLETED') {
                this.processes.push({
                  id: process.processId,
                  name: `${process.stageName} (Order: ${order.orderId})`
                });
              }
            });
          });
        });
      },
      error: (err) => console.error('Error loading operations:', err)
    });

    // Load inventory
    this.apiService.getAllInventory().subscribe({
      next: (data) => {
        this.inventory = data.filter(inv => inv.state !== 'ON_HOLD' && inv.state !== 'CONSUMED')
          .map(inv => ({
            id: inv.inventoryId,
            name: `${inv.materialId} - ${inv.materialName} (${inv.quantity} ${inv.unit})`
          }));
      },
      error: (err) => console.error('Error loading inventory:', err)
    });

    // Load batches
    this.apiService.getAllBatches().subscribe({
      next: (data) => {
        this.batches = data.filter(batch => batch.status !== 'ON_HOLD' && batch.status !== 'CONSUMED')
          .map(batch => ({
            id: batch.batchId,
            name: `${batch.batchNumber} - ${batch.materialName}`
          }));
      },
      error: (err) => console.error('Error loading batches:', err)
    });
  }

  getEntityOptions(): any[] {
    const entityType = this.applyHoldForm.get('entityType')?.value;
    switch (entityType) {
      case 'OPERATION': return this.operations;
      case 'PROCESS': return this.processes;
      case 'INVENTORY': return this.inventory;
      case 'BATCH': return this.batches;
      default: return [];
    }
  }

  openApplyHoldModal(): void {
    this.applyHoldForm.reset();
    this.showApplyHoldModal = true;
    this.error = '';
    this.success = '';
  }

  closeApplyHoldModal(): void {
    this.showApplyHoldModal = false;
  }

  openReleaseHoldModal(hold: Hold): void {
    this.selectedHold = hold;
    this.releaseComments = '';
    this.showReleaseHoldModal = true;
    this.error = '';
    this.success = '';
  }

  closeReleaseHoldModal(): void {
    this.showReleaseHoldModal = false;
    this.selectedHold = null;
  }

  applyHold(): void {
    if (this.applyHoldForm.invalid) {
      return;
    }

    const request = this.applyHoldForm.value;
    this.loading = true;
    this.error = '';

    this.apiService.applyHold(request).subscribe({
      next: () => {
        this.success = 'Hold applied successfully';
        this.closeApplyHoldModal();
        this.loadHolds();
        this.loadEntities();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error applying hold:', err);
        this.error = err.error?.message || 'Failed to apply hold';
        this.loading = false;
      }
    });
  }

  releaseHold(): void {
    if (!this.selectedHold) return;

    this.loading = true;
    this.error = '';

    this.apiService.releaseHold(this.selectedHold.holdId, this.releaseComments).subscribe({
      next: () => {
        this.success = 'Hold released successfully';
        this.closeReleaseHoldModal();
        this.loadHolds();
        this.loadEntities();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error releasing hold:', err);
        this.error = err.error?.message || 'Failed to release hold';
        this.loading = false;
      }
    });
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '-';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }
}
