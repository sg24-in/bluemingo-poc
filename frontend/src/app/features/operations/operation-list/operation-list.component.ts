import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Operation } from '../../../shared/models';
import { PageRequest, PagedResponse, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-operation-list',
  templateUrl: './operation-list.component.html',
  styleUrls: ['./operation-list.component.css']
})
export class OperationListComponent implements OnInit {
  operations: Operation[] = [];
  loading = true;
  error = '';
  actionError = '';

  // TASK-P1: Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filter state
  filterStatus = '';
  filterType = '';
  searchTerm = '';

  statuses = ['NOT_STARTED', 'READY', 'IN_PROGRESS', 'PAUSED', 'CONFIRMED', 'PARTIALLY_CONFIRMED', 'ON_HOLD', 'BLOCKED'];
  operationTypes = ['BATCH', 'CONTINUOUS'];

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
      this.loadOperations();
    });
  }

  // TASK-P1: Server-side paginated loading
  loadOperations(): void {
    this.loading = true;
    this.error = '';

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'sequenceNumber',
      sortDirection: 'ASC',
      status: this.filterStatus || undefined,
      type: this.filterType || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getOperationsPaged(request).subscribe({
      next: (response: PagedResponse<Operation>) => {
        this.operations = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load operations.';
        this.loading = false;
      }
    });
  }

  // TASK-P1: Pagination handlers
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadOperations();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadOperations();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadOperations();
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type === 'all' ? '' : type;
    this.page = 0;
    this.loadOperations();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadOperations();
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase().replace(/_/g, '-') || '';
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

  pauseOperation(operation: Operation): void {
    this.actionError = '';

    this.apiService.pauseOperation(operation.operationId).subscribe({
      next: () => {
        this.loadOperations();
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Failed to pause operation.';
      }
    });
  }

  resumeOperation(operation: Operation): void {
    this.actionError = '';

    this.apiService.resumeOperation(operation.operationId).subscribe({
      next: () => {
        this.loadOperations();
      },
      error: (err) => {
        this.actionError = err.error?.message || 'Failed to resume operation.';
      }
    });
  }
}
