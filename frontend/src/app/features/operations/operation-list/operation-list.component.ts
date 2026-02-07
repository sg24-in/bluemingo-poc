import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Operation } from '../../../shared/models';

@Component({
  selector: 'app-operation-list',
  templateUrl: './operation-list.component.html',
  styleUrls: ['./operation-list.component.css']
})
export class OperationListComponent implements OnInit {
  allOperations: Operation[] = [];
  operations: Operation[] = [];
  loading = true;
  error = '';
  actionError = '';

  filterStatus = 'all';
  searchTerm = '';

  statuses = ['NOT_STARTED', 'READY', 'IN_PROGRESS', 'CONFIRMED', 'PARTIALLY_CONFIRMED', 'ON_HOLD', 'BLOCKED'];

  // Block modal
  showBlockModal = false;
  operationToBlock: Operation | null = null;
  blockReason = '';
  blockLoading = false;

  constructor(
    private apiService: ApiService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read status from query params
    this.route.queryParams.subscribe(params => {
      if (params['status'] && this.statuses.includes(params['status'])) {
        this.filterStatus = params['status'];
      }
    });
    this.loadOperations();
  }

  loadOperations(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getAllOperations().subscribe({
      next: (operations) => {
        this.allOperations = operations;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load operations.';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.allOperations];

    if (this.filterStatus && this.filterStatus !== 'all') {
      filtered = filtered.filter(o => o.status === this.filterStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(o =>
        o.operationName?.toLowerCase().includes(term) ||
        o.operationCode?.toLowerCase().includes(term) ||
        o.orderNumber?.toLowerCase().includes(term) ||
        o.processName?.toLowerCase().includes(term)
      );
    }

    this.operations = filtered;
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status;
    this.applyFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase().replace(/_/g, '-') || '';
  }

  countByStatus(status: string): number {
    return this.allOperations.filter(o => o.status === status).length;
  }

  // Block/Unblock
  openBlockModal(operation: Operation): void {
    this.operationToBlock = operation;
    this.blockReason = '';
    this.actionError = '';
    this.showBlockModal = true;
  }

  closeBlockModal(): void {
    this.showBlockModal = false;
    this.operationToBlock = null;
    this.blockReason = '';
  }

  confirmBlock(): void {
    if (!this.operationToBlock || !this.blockReason.trim()) return;

    this.blockLoading = true;
    this.actionError = '';

    this.apiService.blockOperation(this.operationToBlock.operationId, this.blockReason).subscribe({
      next: () => {
        this.blockLoading = false;
        this.closeBlockModal();
        this.loadOperations();
      },
      error: (err) => {
        this.blockLoading = false;
        this.actionError = err.error?.message || 'Failed to block operation.';
      }
    });
  }

  unblockOperation(operation: Operation): void {
    this.actionError = '';

    this.apiService.unblockOperation(operation.operationId).subscribe({
      next: () => {
        this.loadOperations();
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Failed to unblock operation.';
      }
    });
  }
}
