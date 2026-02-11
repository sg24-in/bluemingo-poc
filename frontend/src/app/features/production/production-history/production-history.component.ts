import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ProductionConfirmationResponse, CanReverseResponse } from '../../../shared/models';

@Component({
  selector: 'app-production-history',
  templateUrl: './production-history.component.html',
  styleUrls: ['./production-history.component.css']
})
export class ProductionHistoryComponent implements OnInit {
  allConfirmations: ProductionConfirmationResponse[] = [];
  confirmations: ProductionConfirmationResponse[] = [];
  loading = true;
  error = '';

  filterStatus = 'all';
  searchTerm = '';

  statuses = ['CONFIRMED', 'PENDING_REVIEW', 'PARTIALLY_CONFIRMED', 'REJECTED', 'REVERSED'];

  // Detail panel
  selectedConfirmation: ProductionConfirmationResponse | null = null;

  // Reversal dialog
  showReversalDialog = false;
  reversalConfirmation: ProductionConfirmationResponse | null = null;
  reversalReason = '';
  reversalNotes = '';
  reversalLoading = false;
  reversalError = '';
  canReverseResult: CanReverseResponse | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadConfirmations();
  }

  loadConfirmations(): void {
    this.loading = true;
    this.error = '';
    this.allConfirmations = [];

    let loaded = 0;
    const total = this.statuses.length;

    this.statuses.forEach(status => {
      this.apiService.getConfirmationsByStatus(status).subscribe({
        next: (confirmations) => {
          this.allConfirmations.push(...confirmations);
          loaded++;
          if (loaded === total) {
            this.allConfirmations.sort((a, b) => (b.confirmationId || 0) - (a.confirmationId || 0));
            this.applyFilters();
            this.loading = false;
          }
        },
        error: () => {
          loaded++;
          if (loaded === total) {
            this.applyFilters();
            this.loading = false;
          }
        }
      });
    });
  }

  applyFilters(): void {
    let filtered = [...this.allConfirmations];

    if (this.filterStatus && this.filterStatus !== 'all') {
      filtered = filtered.filter(c => c.status === this.filterStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(c =>
        c.operationName?.toLowerCase().includes(term) ||
        c.outputBatch?.batchNumber?.toLowerCase().includes(term) ||
        String(c.confirmationId).includes(term) ||
        c.notes?.toLowerCase().includes(term)
      );
    }

    this.confirmations = filtered;
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
    return this.allConfirmations.filter(c => c.status === status).length;
  }

  formatDateTime(dt: string): string {
    if (!dt) return '-';
    return new Date(dt).toLocaleString();
  }

  getDuration(start: string, end: string): string {
    if (!start || !end) return '-';
    const ms = new Date(end).getTime() - new Date(start).getTime();
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ${mins % 60}m`;
  }

  toggleDetail(confirmation: ProductionConfirmationResponse): void {
    this.selectedConfirmation = this.selectedConfirmation === confirmation ? null : confirmation;
  }

  canReverse(confirmation: ProductionConfirmationResponse): boolean {
    return confirmation.status === 'CONFIRMED' || confirmation.status === 'PARTIALLY_CONFIRMED';
  }

  openReverseDialog(confirmation: ProductionConfirmationResponse): void {
    this.reversalConfirmation = confirmation;
    this.reversalReason = '';
    this.reversalNotes = '';
    this.reversalError = '';
    this.reversalLoading = true;
    this.canReverseResult = null;
    this.showReversalDialog = true;

    this.apiService.canReverseConfirmation(confirmation.confirmationId).subscribe({
      next: (result) => {
        this.canReverseResult = result;
        this.reversalLoading = false;
      },
      error: (err) => {
        this.reversalError = 'Failed to check reversal eligibility.';
        this.reversalLoading = false;
      }
    });
  }

  closeReverseDialog(): void {
    this.showReversalDialog = false;
    this.reversalConfirmation = null;
    this.canReverseResult = null;
  }

  confirmReversal(): void {
    if (!this.reversalConfirmation || !this.reversalReason.trim()) return;

    this.reversalLoading = true;
    this.reversalError = '';

    this.apiService.reverseConfirmation(
      this.reversalConfirmation.confirmationId,
      this.reversalReason.trim(),
      this.reversalNotes.trim() || undefined
    ).subscribe({
      next: () => {
        this.closeReverseDialog();
        this.selectedConfirmation = null;
        this.loadConfirmations();
      },
      error: (err) => {
        this.reversalError = err.error?.message || err.error?.error || 'Failed to reverse confirmation.';
        this.reversalLoading = false;
      }
    });
  }
}
