import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PageRequest, PagedResponse, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

interface Routing {
  routingId: number;
  processId?: number;
  processName?: string;
  routingName: string;
  routingType: string;
  status: string;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
  steps?: RoutingStep[];
}

interface RoutingStep {
  routingStepId: number;
  sequenceNumber: number;
  operationName: string;
  operationType: string;
  isParallel: boolean;
  mandatoryFlag: boolean;
  producesOutputBatch: boolean;
  allowsSplit: boolean;
  allowsMerge: boolean;
  status: string;
}

@Component({
  selector: 'app-routing-list',
  templateUrl: './routing-list.component.html',
  styleUrls: ['./routing-list.component.css']
})
export class RoutingListComponent implements OnInit {
  routings: Routing[] = [];
  loading = true;
  error = '';

  // TASK-P2: Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filters
  filterStatus = '';
  filterType = '';
  searchTerm = '';

  // Status options
  statuses = ['DRAFT', 'ACTIVE', 'INACTIVE', 'ON_HOLD'];
  routingTypes = ['SEQUENTIAL', 'PARALLEL'];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRoutings();
  }

  // TASK-P2: Server-side paginated loading
  loadRoutings(): void {
    this.loading = true;
    this.error = '';

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'routingName',
      sortDirection: 'ASC',
      status: this.filterStatus || undefined,
      type: this.filterType || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getRoutingsPaged(request).subscribe({
      next: (response: PagedResponse<Routing>) => {
        this.routings = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load routings';
        this.loading = false;
      }
    });
  }

  // TASK-P2: Pagination handlers
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadRoutings();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadRoutings();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadRoutings();
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type === 'all' ? '' : type;
    this.page = 0;
    this.loadRoutings();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadRoutings();
  }

  clearFilters(): void {
    this.filterStatus = '';
    this.filterType = '';
    this.searchTerm = '';
    this.page = 0;
    this.loadRoutings();
  }

  createRouting(): void {
    this.router.navigate(['/manage/routing/new']);
  }

  editRouting(routing: Routing): void {
    this.router.navigate(['/manage/routing', routing.routingId, 'edit']);
  }

  viewRouting(routing: Routing): void {
    this.router.navigate(['/manage/routing', routing.routingId]);
  }

  activateRouting(routing: Routing): void {
    if (confirm(`Activate routing "${routing.routingName}"? This will deactivate other routings for the same process.`)) {
      this.apiService.activateRouting(routing.routingId, true).subscribe({
        next: () => {
          this.loadRoutings();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to activate routing');
        }
      });
    }
  }

  deactivateRouting(routing: Routing): void {
    if (confirm(`Deactivate routing "${routing.routingName}"?`)) {
      this.apiService.deactivateRouting(routing.routingId).subscribe({
        next: () => {
          this.loadRoutings();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to deactivate routing');
        }
      });
    }
  }

  putOnHold(routing: Routing): void {
    const reason = prompt('Enter hold reason:');
    if (reason !== null) {
      this.apiService.putRoutingOnHold(routing.routingId, reason).subscribe({
        next: () => {
          this.loadRoutings();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to put routing on hold');
        }
      });
    }
  }

  releaseFromHold(routing: Routing): void {
    if (confirm(`Release routing "${routing.routingName}" from hold?`)) {
      this.apiService.releaseRoutingFromHold(routing.routingId).subscribe({
        next: () => {
          this.loadRoutings();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to release routing');
        }
      });
    }
  }

  deleteRouting(routing: Routing): void {
    if (confirm(`Delete routing "${routing.routingName}"? This cannot be undone.`)) {
      this.apiService.deleteRouting(routing.routingId).subscribe({
        next: () => {
          this.loadRoutings();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete routing. Only DRAFT/INACTIVE routings without execution can be deleted.');
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'ON_HOLD': return 'status-on-hold';
      default: return '';
    }
  }

  getTypeLabel(type: string): string {
    return type === 'SEQUENTIAL' ? 'Sequential' : 'Parallel';
  }
}
