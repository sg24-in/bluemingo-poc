import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Operation } from '../../../shared/models';

@Component({
  selector: 'app-operation-detail',
  templateUrl: './operation-detail.component.html',
  styleUrls: ['./operation-detail.component.css']
})
export class OperationDetailComponent implements OnInit {
  operation: Operation | null = null;
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
      this.loadOperation(+idParam);
    } else {
      this.error = 'No operation ID provided';
      this.loading = false;
    }
  }

  loadOperation(operationId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getOperationById(operationId).subscribe({
      next: (operation) => {
        this.operation = operation;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading operation:', err);
        this.error = 'Failed to load operation';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/operations']);
  }

  viewProcess(): void {
    if (this.operation?.processId) {
      this.router.navigate(['/processes', this.operation.processId]);
    }
  }

  startProduction(): void {
    if (this.operation) {
      this.router.navigate(['/production'], {
        queryParams: { operationId: this.operation.operationId }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'NOT_STARTED':
        return 'status-not-started';
      case 'READY':
        return 'status-ready';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'PAUSED':
        return 'status-paused';
      case 'CONFIRMED':
        return 'status-confirmed';
      case 'ON_HOLD':
        return 'status-on-hold';
      case 'BLOCKED':
        return 'status-blocked';
      default:
        return '';
    }
  }

  getProgress(): number {
    if (!this.operation?.targetQty || this.operation.targetQty === 0) return 0;
    const confirmed = this.operation.confirmedQty || 0;
    return Math.min(100, (confirmed / this.operation.targetQty) * 100);
  }

  pauseOperation(): void {
    if (!this.operation) return;

    this.apiService.pauseOperation(this.operation.operationId).subscribe({
      next: () => {
        this.loadOperation(this.operation!.operationId);
      },
      error: (err) => {
        console.error('Error pausing operation:', err);
        this.error = 'Failed to pause operation';
      }
    });
  }

  resumeOperation(): void {
    if (!this.operation) return;

    this.apiService.resumeOperation(this.operation.operationId).subscribe({
      next: () => {
        this.loadOperation(this.operation!.operationId);
      },
      error: (err) => {
        console.error('Error resuming operation:', err);
        this.error = 'Failed to resume operation';
      }
    });
  }

  blockOperation(): void {
    if (!this.operation) return;

    const reason = prompt('Enter block reason:');
    if (reason) {
      this.apiService.blockOperation(this.operation.operationId, reason).subscribe({
        next: () => {
          this.loadOperation(this.operation!.operationId);
        },
        error: (err) => {
          console.error('Error blocking operation:', err);
          this.error = 'Failed to block operation';
        }
      });
    }
  }

  unblockOperation(): void {
    if (!this.operation) return;

    this.apiService.unblockOperation(this.operation.operationId).subscribe({
      next: () => {
        this.loadOperation(this.operation!.operationId);
      },
      error: (err) => {
        console.error('Error unblocking operation:', err);
        this.error = 'Failed to unblock operation';
      }
    });
  }
}
