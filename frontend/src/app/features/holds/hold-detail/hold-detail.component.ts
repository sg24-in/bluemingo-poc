import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Hold } from '../../../shared/models';

@Component({
  selector: 'app-hold-detail',
  templateUrl: './hold-detail.component.html',
  styleUrls: ['./hold-detail.component.css']
})
export class HoldDetailComponent implements OnInit {
  hold: Hold | null = null;
  loading = true;
  error: string | null = null;
  releasing = false;

  // Entity type display names
  entityTypeLabels: Record<string, string> = {
    'ORDER': 'Order',
    'OPERATION': 'Operation',
    'BATCH': 'Batch',
    'INVENTORY': 'Inventory',
    'EQUIPMENT': 'Equipment'
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadHold(+idParam);
    } else {
      this.error = 'No hold ID provided';
      this.loading = false;
    }
  }

  loadHold(holdId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getHoldById(holdId).subscribe({
      next: (hold) => {
        this.hold = hold;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading hold:', err);
        this.error = 'Failed to load hold';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/holds']);
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'RELEASED':
        return 'status-released';
      default:
        return '';
    }
  }

  getEntityTypeLabel(type: string): string {
    return this.entityTypeLabels[type] || type;
  }

  getEntityTypeClass(type: string): string {
    switch (type?.toUpperCase()) {
      case 'ORDER':
        return 'entity-order';
      case 'OPERATION':
        return 'entity-operation';
      case 'BATCH':
        return 'entity-batch';
      case 'INVENTORY':
        return 'entity-inventory';
      case 'EQUIPMENT':
        return 'entity-equipment';
      default:
        return '';
    }
  }

  navigateToEntity(): void {
    if (!this.hold) return;

    switch (this.hold.entityType) {
      case 'ORDER':
        this.router.navigate(['/orders', this.hold.entityId]);
        break;
      case 'BATCH':
        this.router.navigate(['/batches', this.hold.entityId]);
        break;
      case 'INVENTORY':
        this.router.navigate(['/inventory', this.hold.entityId]);
        break;
      case 'EQUIPMENT':
        this.router.navigate(['/equipment', this.hold.entityId]);
        break;
    }
  }

  releaseHold(): void {
    if (!this.hold || this.hold.status !== 'ACTIVE') return;

    const comments = prompt('Enter release comments (optional):');
    this.releasing = true;

    this.apiService.releaseHold(this.hold.holdId, comments || undefined).subscribe({
      next: () => {
        this.releasing = false;
        this.loadHold(this.hold!.holdId);
      },
      error: (err) => {
        this.releasing = false;
        console.error('Error releasing hold:', err);
        this.error = 'Failed to release hold';
      }
    });
  }

  formatDuration(minutes: number | undefined): string {
    if (!minutes) return '-';
    if (minutes < 60) return `${minutes} min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours < 24) return `${hours}h ${mins}m`;
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return `${days}d ${remainingHours}h`;
  }
}
