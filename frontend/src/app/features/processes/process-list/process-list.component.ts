import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Process } from '../../../shared/models';

@Component({
  selector: 'app-process-list',
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.css']
})
export class ProcessListComponent implements OnInit {
  allProcesses: Process[] = [];
  processes: Process[] = [];
  loading = true;
  error = '';

  filterStatus = 'all';
  searchTerm = '';

  // Delete modal
  showDeleteModal = false;
  processToDelete: Process | null = null;
  deleting = false;

  // Processing state for activate/deactivate
  processing = false;

  // Design-time statuses for process templates (per MES Consolidated Spec)
  // Runtime execution statuses (READY, IN_PROGRESS, etc.) are for ProcessInstance tracking
  statuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];

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
    this.allProcesses = [];

    let loaded = 0;
    const total = this.statuses.length;

    this.statuses.forEach(status => {
      this.apiService.getProcessesByStatus(status).subscribe({
        next: (processes) => {
          this.allProcesses.push(...processes);
          loaded++;
          if (loaded === total) {
            this.allProcesses.sort((a, b) => (b.processId || 0) - (a.processId || 0));
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
    let filtered = [...this.allProcesses];

    if (this.filterStatus && this.filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === this.filterStatus);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.processName?.toLowerCase().includes(term) ||
        String(p.processId).includes(term)
      );
    }

    this.processes = filtered;
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
    return this.allProcesses.filter(p => p.status === status).length;
  }

  // Navigation methods
  createProcess(): void {
    // Check if we're in admin context
    if (this.router.url.includes('/manage/')) {
      this.router.navigate(['/manage/processes/new']);
    } else {
      this.router.navigate(['/processes/new']);
    }
  }

  viewProcess(process: Process): void {
    if (this.router.url.includes('/manage/')) {
      this.router.navigate(['/manage/processes', process.processId]);
    } else {
      this.router.navigate(['/processes', process.processId]);
    }
  }

  editProcess(process: Process): void {
    if (this.router.url.includes('/manage/')) {
      this.router.navigate(['/manage/processes', process.processId, 'edit']);
    } else {
      this.router.navigate(['/processes', process.processId, 'edit']);
    }
  }

  // Activate/Deactivate methods
  activateProcess(process: Process): void {
    this.processing = true;
    this.error = '';
    this.apiService.activateProcess(process.processId).subscribe({
      next: () => {
        this.processing = false;
        this.loadProcesses();
      },
      error: (err) => {
        this.processing = false;
        this.error = err.error?.message || 'Failed to activate process.';
      }
    });
  }

  deactivateProcess(process: Process): void {
    this.processing = true;
    this.error = '';
    this.apiService.deactivateProcess(process.processId).subscribe({
      next: () => {
        this.processing = false;
        this.loadProcesses();
      },
      error: (err) => {
        this.processing = false;
        this.error = err.error?.message || 'Failed to deactivate process.';
      }
    });
  }

  // Delete methods
  confirmDelete(process: Process): void {
    this.processToDelete = process;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.processToDelete = null;
  }

  deleteProcess(): void {
    if (!this.processToDelete) return;

    this.deleting = true;
    this.apiService.deleteProcess(this.processToDelete.processId!).subscribe({
      next: () => {
        this.deleting = false;
        this.showDeleteModal = false;
        this.processToDelete = null;
        // Reload the list
        this.loadProcesses();
      },
      error: (err) => {
        this.deleting = false;
        this.error = err.error?.message || 'Failed to delete process.';
        this.showDeleteModal = false;
        this.processToDelete = null;
      }
    });
  }
}
