import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  operationTemplateId?: number;
  operationName: string;
  operationType: string;
  operationCode?: string;
  sequenceNumber: number;
  isParallel: boolean;
  mandatoryFlag: boolean;
  producesOutputBatch: boolean;
  allowsSplit: boolean;
  allowsMerge: boolean;
  estimatedDurationMinutes?: number;
  description?: string;
  status: string;
}

@Component({
  selector: 'app-routing-detail',
  templateUrl: './routing-detail.component.html',
  styleUrls: ['./routing-detail.component.css']
})
export class RoutingDetailComponent implements OnInit {
  routing: Routing | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadRouting(+idParam);
    } else {
      this.error = 'No routing ID provided';
      this.loading = false;
    }
  }

  loadRouting(routingId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getRoutingById(routingId).subscribe({
      next: (routing) => {
        this.routing = routing;
        // Sort steps by sequence number
        if (this.routing?.steps) {
          this.routing.steps.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading routing:', err);
        this.error = 'Failed to load routing';
        this.loading = false;
      }
    });
  }

  editRouting(): void {
    if (this.routing) {
      this.router.navigate(['/manage/routing', this.routing.routingId, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/manage/routing']);
  }

  activateRouting(): void {
    if (!this.routing) return;

    if (confirm(`Activate routing "${this.routing.routingName}"? This will deactivate other routings for the same process.`)) {
      this.apiService.activateRouting(this.routing.routingId, true).subscribe({
        next: () => {
          this.loadRouting(this.routing!.routingId);
        },
        error: (err) => {
          console.error('Error activating routing:', err);
          this.error = err.error?.message || 'Failed to activate routing';
        }
      });
    }
  }

  deactivateRouting(): void {
    if (!this.routing) return;

    if (confirm(`Deactivate routing "${this.routing.routingName}"?`)) {
      this.apiService.deactivateRouting(this.routing.routingId).subscribe({
        next: () => {
          this.loadRouting(this.routing!.routingId);
        },
        error: (err) => {
          console.error('Error deactivating routing:', err);
          this.error = err.error?.message || 'Failed to deactivate routing';
        }
      });
    }
  }

  putOnHold(): void {
    if (!this.routing) return;

    const reason = prompt('Enter hold reason:');
    if (reason !== null) {
      this.apiService.putRoutingOnHold(this.routing.routingId, reason).subscribe({
        next: () => {
          this.loadRouting(this.routing!.routingId);
        },
        error: (err) => {
          console.error('Error putting on hold:', err);
          this.error = err.error?.message || 'Failed to put routing on hold';
        }
      });
    }
  }

  releaseFromHold(): void {
    if (!this.routing) return;

    if (confirm(`Release routing "${this.routing.routingName}" from hold?`)) {
      this.apiService.releaseRoutingFromHold(this.routing.routingId).subscribe({
        next: () => {
          this.loadRouting(this.routing!.routingId);
        },
        error: (err) => {
          console.error('Error releasing from hold:', err);
          this.error = err.error?.message || 'Failed to release routing from hold';
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
        return 'status-draft';
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      case 'ON_HOLD':
        return 'status-on-hold';
      default:
        return '';
    }
  }

  getTypeLabel(type: string): string {
    return type === 'SEQUENTIAL' ? 'Sequential' : 'Parallel';
  }

  getStepStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      case 'NOT_STARTED':
        return 'status-draft';
      case 'READY':
        return 'status-active';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'CONFIRMED':
        return 'status-confirmed';
      default:
        return '';
    }
  }
}
