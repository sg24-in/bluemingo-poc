import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

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
  filteredRoutings: Routing[] = [];
  loading = true;
  error = '';

  // Filters
  statusFilter = '';
  searchTerm = '';

  // Status options
  statuses = ['', 'DRAFT', 'ACTIVE', 'INACTIVE', 'ON_HOLD'];

  // Summary counts
  summary = {
    total: 0,
    draft: 0,
    active: 0,
    inactive: 0,
    onHold: 0
  };

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRoutings();
  }

  loadRoutings(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getAllRoutings().subscribe({
      next: (data) => {
        this.routings = data;
        this.calculateSummary();
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load routings';
        this.loading = false;
      }
    });
  }

  calculateSummary(): void {
    this.summary = {
      total: this.routings.length,
      draft: this.routings.filter(r => r.status === 'DRAFT').length,
      active: this.routings.filter(r => r.status === 'ACTIVE').length,
      inactive: this.routings.filter(r => r.status === 'INACTIVE').length,
      onHold: this.routings.filter(r => r.status === 'ON_HOLD').length
    };
  }

  applyFilters(): void {
    let result = [...this.routings];

    if (this.statusFilter) {
      result = result.filter(r => r.status === this.statusFilter);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(r =>
        r.routingName.toLowerCase().includes(term) ||
        r.processName?.toLowerCase().includes(term) ||
        r.routingType.toLowerCase().includes(term)
      );
    }

    this.filteredRoutings = result;
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  clearFilters(): void {
    this.statusFilter = '';
    this.searchTerm = '';
    this.applyFilters();
  }

  createRouting(): void {
    this.router.navigate(['/manage/routing/new']);
  }

  editRouting(routing: Routing): void {
    this.router.navigate(['/manage/routing', routing.routingId, 'edit']);
  }

  viewRouting(routing: Routing): void {
    this.router.navigate(['/manage/routing', routing.routingId, 'edit']);
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
