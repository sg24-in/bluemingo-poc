import { Component, OnInit } from '@angular/core';
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

  statuses = ['READY', 'IN_PROGRESS', 'QUALITY_PENDING', 'COMPLETED', 'REJECTED', 'ON_HOLD'];

  constructor(private apiService: ApiService) {}

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

  getOperationCount(process: Process): number {
    return process.operations?.length || 0;
  }

  getConfirmedCount(process: Process): number {
    return process.operations?.filter(op => op.status === 'CONFIRMED').length || 0;
  }

  countByStatus(status: string): number {
    return this.allProcesses.filter(p => p.status === status).length;
  }
}
