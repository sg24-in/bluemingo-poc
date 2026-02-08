import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuditEntry, PagedResponse } from '../../../shared/models';

@Component({
  selector: 'app-audit-list',
  templateUrl: './audit-list.component.html',
  styleUrls: ['./audit-list.component.css']
})
export class AuditListComponent implements OnInit {
  entries: AuditEntry[] = [];
  loading = true;
  error = '';

  // Filters
  entityTypes: string[] = [];
  actionTypes: string[] = [];
  filterEntityType = 'all';
  filterAction = 'all';
  filterUser = '';
  todaysCount = 0;

  // Pagination
  currentPage = 0;
  pageSize = 20;
  totalElements = 0;
  totalPages = 0;
  pageSizeOptions = [10, 20, 50, 100];

  // Detail panel
  selectedEntry: AuditEntry | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadFilters();
    this.loadPaged();
    this.loadSummary();
  }

  loadFilters(): void {
    this.apiService.getAuditEntityTypes().subscribe({
      next: (types) => this.entityTypes = types,
      error: () => {}
    });
    this.apiService.getAuditActionTypes().subscribe({
      next: (types) => this.actionTypes = types,
      error: () => {}
    });
  }

  loadSummary(): void {
    this.apiService.getAuditSummary().subscribe({
      next: (summary) => this.todaysCount = summary.todaysActivityCount,
      error: () => {}
    });
  }

  loadPaged(): void {
    this.loading = true;
    this.error = '';

    const request: any = {
      page: this.currentPage,
      size: this.pageSize
    };

    // Add filters if set
    if (this.filterEntityType !== 'all') {
      request.entityType = this.filterEntityType;
    }
    if (this.filterAction !== 'all') {
      request.action = this.filterAction;
    }
    if (this.filterUser) {
      request.search = this.filterUser;
    }

    this.apiService.getAuditPaged(request).subscribe({
      next: (response: PagedResponse<AuditEntry>) => {
        this.entries = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load audit trail.';
        this.loading = false;
      }
    });
  }

  onFilterChange(): void {
    this.currentPage = 0;
    this.loadPaged();
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadPaged();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadPaged();
  }

  getActionClass(action: string): string {
    switch (action) {
      case 'CREATE': return 'action-create';
      case 'UPDATE': return 'action-update';
      case 'DELETE': return 'action-delete';
      case 'STATUS_CHANGE': return 'action-status';
      case 'HOLD': return 'action-hold';
      case 'RELEASE': return 'action-release';
      case 'CONSUME': return 'action-consume';
      case 'PRODUCE': return 'action-produce';
      default: return '';
    }
  }

  getActionIcon(action: string): string {
    switch (action) {
      case 'CREATE': return 'circle-plus';
      case 'UPDATE': return 'pencil';
      case 'DELETE': return 'trash';
      case 'STATUS_CHANGE': return 'arrows-rotate';
      case 'HOLD': return 'circle-pause';
      case 'RELEASE': return 'circle-play';
      case 'CONSUME': return 'download';
      case 'PRODUCE': return 'upload';
      default: return 'clock-rotate-left';
    }
  }

  formatEntityType(type: string): string {
    return type?.replace(/_/g, ' ') || '';
  }

  formatTimestamp(ts: string): string {
    if (!ts) return '-';
    const date = new Date(ts);
    return date.toLocaleString();
  }

  selectEntry(entry: AuditEntry): void {
    this.selectedEntry = this.selectedEntry === entry ? null : entry;
  }

  clearFilters(): void {
    this.filterEntityType = 'all';
    this.filterAction = 'all';
    this.filterUser = '';
    this.currentPage = 0;
    this.loadPaged();
  }

  // Pagination helper getters
  get startIndex(): number {
    return this.currentPage * this.pageSize + 1;
  }

  get endIndex(): number {
    return Math.min((this.currentPage + 1) * this.pageSize, this.totalElements);
  }

  get pages(): number[] {
    const pages: number[] = [];
    const start = Math.max(0, this.currentPage - 2);
    const end = Math.min(this.totalPages, start + 5);
    for (let i = start; i < end; i++) {
      pages.push(i);
    }
    return pages;
  }
}
