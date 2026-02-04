import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Process } from '../../../shared/models';

@Component({
  selector: 'app-quality-pending',
  templateUrl: './quality-pending.component.html',
  styleUrls: ['./quality-pending.component.css']
})
export class QualityPendingComponent implements OnInit {
  qualityPendingProcesses: Process[] = [];
  rejectedProcesses: Process[] = [];
  loading = true;
  error = '';
  success = '';

  selectedProcess: Process | null = null;
  showDecisionModal = false;
  decisionType: 'accept' | 'reject' | null = null;
  rejectReason = '';
  notes = '';
  processing = false;

  // Tab selection
  activeTab: 'pending' | 'rejected' = 'pending';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProcesses();
  }

  loadProcesses(): void {
    this.loading = true;
    this.error = '';

    // Load quality pending processes
    this.apiService.getQualityPendingProcesses().subscribe({
      next: (data) => {
        this.qualityPendingProcesses = data;
        this.loadRejectedProcesses();
      },
      error: (err) => {
        console.error('Error loading quality pending processes:', err);
        this.error = 'Failed to load quality pending processes';
        this.loading = false;
      }
    });
  }

  loadRejectedProcesses(): void {
    this.apiService.getProcessesByStatus('REJECTED').subscribe({
      next: (data) => {
        this.rejectedProcesses = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading rejected processes:', err);
        this.loading = false;
      }
    });
  }

  setActiveTab(tab: 'pending' | 'rejected'): void {
    this.activeTab = tab;
  }

  openDecisionModal(process: Process, decision: 'accept' | 'reject'): void {
    this.selectedProcess = process;
    this.decisionType = decision;
    this.rejectReason = '';
    this.notes = '';
    this.showDecisionModal = true;
    this.error = '';
  }

  closeDecisionModal(): void {
    this.showDecisionModal = false;
    this.selectedProcess = null;
    this.decisionType = null;
    this.rejectReason = '';
    this.notes = '';
  }

  submitDecision(): void {
    if (!this.selectedProcess || !this.decisionType) return;

    if (this.decisionType === 'reject' && !this.rejectReason.trim()) {
      this.error = 'Rejection reason is required';
      return;
    }

    this.processing = true;
    this.error = '';

    if (this.decisionType === 'accept') {
      this.apiService.acceptProcess(this.selectedProcess.processId, this.notes).subscribe({
        next: (response) => {
          this.success = `Process ${this.selectedProcess?.stageName} accepted and marked as completed`;
          this.closeDecisionModal();
          this.loadProcesses();
          this.processing = false;
        },
        error: (err) => {
          console.error('Error accepting process:', err);
          this.error = err.error?.message || 'Failed to accept process';
          this.processing = false;
        }
      });
    } else {
      this.apiService.rejectProcess(this.selectedProcess.processId, this.rejectReason, this.notes).subscribe({
        next: (response) => {
          this.success = `Process ${this.selectedProcess?.stageName} rejected`;
          this.closeDecisionModal();
          this.loadProcesses();
          this.processing = false;
        },
        error: (err) => {
          console.error('Error rejecting process:', err);
          this.error = err.error?.message || 'Failed to reject process';
          this.processing = false;
        }
      });
    }
  }

  retryProcess(process: Process): void {
    this.processing = true;
    this.error = '';

    // Move rejected process back to quality pending for re-inspection
    this.apiService.updateProcessStatus({ processId: process.processId, newStatus: 'QUALITY_PENDING' }).subscribe({
      next: (response) => {
        this.success = `Process ${process.stageName} moved back to quality pending for re-inspection`;
        this.loadProcesses();
        this.processing = false;
      },
      error: (err) => {
        console.error('Error retrying process:', err);
        this.error = err.error?.message || 'Failed to retry process';
        this.processing = false;
      }
    });
  }

  getOperationsSummary(process: Process): string {
    if (!process.operations || process.operations.length === 0) {
      return 'No operations';
    }
    const confirmed = process.operations.filter(op => op.status === 'CONFIRMED').length;
    return `${confirmed}/${process.operations.length} confirmed`;
  }

  navigateToOrder(orderLineId: number): void {
    // Navigate to order detail (order ID from order line)
    this.router.navigate(['/orders']);
  }

  clearMessages(): void {
    this.error = '';
    this.success = '';
  }
}
