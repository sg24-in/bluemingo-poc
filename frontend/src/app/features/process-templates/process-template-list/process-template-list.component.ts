import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PageRequest, PagedResponse } from '../../../shared/models';

interface ProcessSummary {
  processId: number;
  processName: string;
  processCode: string;
  productSku?: string;
  status: string;
  version: string;
  isEffective?: boolean;
  stepCount: number;
  createdOn?: string;
}

@Component({
  selector: 'app-process-list',
  templateUrl: './process-template-list.component.html',
  styleUrls: ['./process-template-list.component.css']
})
export class ProcessTemplateListComponent implements OnInit {
  processes: ProcessSummary[] = [];
  loading = true;
  error = '';

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;

  // Filters
  searchTerm = '';
  statusFilter = '';
  productFilter = '';

  // Summary counts
  draftCount = 0;
  activeCount = 0;
  inactiveCount = 0;

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

    const request: PageRequest = {
      page: this.currentPage,
      size: this.pageSize,
      sortBy: 'createdOn',
      sortDirection: 'DESC'
    };

    if (this.searchTerm) {
      request.search = this.searchTerm;
    }
    if (this.statusFilter) {
      request.status = this.statusFilter;
    }
    if (this.productFilter) {
      (request as any).productSku = this.productFilter;
    }

    this.apiService.getProcessesPaged(request).subscribe({
      next: (response: PagedResponse<ProcessSummary>) => {
        this.processes = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
        this.updateCounts();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load processes';
        this.loading = false;
        console.error('Error loading processes:', err);
      }
    });
  }

  updateCounts(): void {
    this.draftCount = this.processes.filter(p => p.status === 'DRAFT').length;
    this.activeCount = this.processes.filter(p => p.status === 'ACTIVE').length;
    this.inactiveCount = this.processes.filter(p => p.status === 'INACTIVE' || p.status === 'SUPERSEDED').length;
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadProcesses();
  }

  onStatusChange(): void {
    this.currentPage = 0;
    this.loadProcesses();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadProcesses();
  }

  onPageSizeChange(size: number): void {
    this.pageSize = size;
    this.currentPage = 0;
    this.loadProcesses();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = '';
    this.productFilter = '';
    this.currentPage = 0;
    this.loadProcesses();
  }

  createProcess(): void {
    this.router.navigate(['/manage/processes/new']);
  }

  editProcess(process: ProcessSummary): void {
    this.router.navigate(['/manage/processes', process.processId, 'edit']);
  }

  viewProcess(process: ProcessSummary): void {
    this.router.navigate(['/manage/processes', process.processId]);
  }

  activateProcess(process: ProcessSummary): void {
    if (confirm(`Activate process "${process.processName}"? This will deactivate other active processes for the same product.`)) {
      this.apiService.activateProcess(process.processId, { deactivateOthers: true }).subscribe({
        next: () => {
          this.loadProcesses();
        },
        error: (err) => {
          this.error = 'Failed to activate process';
          console.error('Error activating process:', err);
        }
      });
    }
  }

  deactivateProcess(process: ProcessSummary): void {
    if (confirm(`Deactivate process "${process.processName}"?`)) {
      this.apiService.deactivateProcess(process.processId).subscribe({
        next: () => {
          this.loadProcesses();
        },
        error: (err) => {
          this.error = 'Failed to deactivate process';
          console.error('Error deactivating process:', err);
        }
      });
    }
  }

  createNewVersion(process: ProcessSummary): void {
    if (confirm(`Create a new version of process "${process.processName}"?`)) {
      this.apiService.createProcessVersion(process.processId).subscribe({
        next: (newProcess) => {
          this.router.navigate(['/manage/processes', newProcess.processId, 'edit']);
        },
        error: (err) => {
          this.error = 'Failed to create new version';
          console.error('Error creating version:', err);
        }
      });
    }
  }

  deleteProcess(process: ProcessSummary): void {
    if (process.status !== 'DRAFT') {
      alert('Only DRAFT processes can be deleted.');
      return;
    }
    if (confirm(`Delete process "${process.processName}"? This action cannot be undone.`)) {
      this.apiService.deleteProcessDefinition(process.processId).subscribe({
        next: () => {
          this.loadProcesses();
        },
        error: (err) => {
          this.error = 'Failed to delete process';
          console.error('Error deleting process:', err);
        }
      });
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'SUPERSEDED': return 'status-superseded';
      default: return '';
    }
  }

  formatDate(dateStr?: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
}
