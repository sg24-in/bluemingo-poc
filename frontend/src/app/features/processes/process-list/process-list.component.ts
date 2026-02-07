import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Process } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-process-list',
  templateUrl: './process-list.component.html',
  styleUrls: ['./process-list.component.css']
})
export class ProcessListComponent implements OnInit {
  processes: Process[] = [];
  loading = true;
  error = '';

  // Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filter state
  filterStatus = '';
  searchTerm = '';

  // Status counts for summary cards
  statusCounts: { [key: string]: number } = {
    DRAFT: 0,
    ACTIVE: 0,
    INACTIVE: 0
  };

  // Delete modal
  showDeleteModal = false;
  processToDelete: Process | null = null;
  deleting = false;

  // Processing state for activate/deactivate
  processing = false;

  // Design-time statuses for process templates
  statuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProcesses();
    this.loadStatusCounts();
  }

  loadProcesses(): void {
    this.loading = true;
    this.error = '';

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'processId',
      sortDirection: 'DESC',
      status: this.filterStatus || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getProcessesPaged(request).subscribe({
      next: (response: PagedResponse<Process>) => {
        this.processes = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = !response.last;
        this.hasPrevious = !response.first;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading processes:', err);
        this.error = 'Failed to load processes.';
        this.loading = false;
      }
    });
  }

  loadStatusCounts(): void {
    this.statuses.forEach(status => {
      this.apiService.getProcessesByStatus(status).subscribe({
        next: (processes) => {
          this.statusCounts[status] = processes.length;
        },
        error: () => {
          this.statusCounts[status] = 0;
        }
      });
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadProcesses();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadProcesses();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadProcesses();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadProcesses();
  }

  getStatusClass(status: string): string {
    return status?.toLowerCase().replace(/_/g, '-') || '';
  }

  countByStatus(status: string): number {
    return this.statusCounts[status] || 0;
  }

  // Navigation methods
  createProcess(): void {
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
        this.loadStatusCounts();
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
        this.loadStatusCounts();
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
        this.loadProcesses();
        this.loadStatusCounts();
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
