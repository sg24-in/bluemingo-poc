import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { AuditEntry } from '../../../shared/models';

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

  // Detail panel
  selectedEntry: AuditEntry | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadFilters();
    this.loadRecent();
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

  loadRecent(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getRecentAuditActivity(200).subscribe({
      next: (entries) => {
        this.entries = entries;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load audit trail.';
        this.loading = false;
      }
    });
  }

  get filteredEntries(): AuditEntry[] {
    let result = this.entries;

    if (this.filterEntityType !== 'all') {
      result = result.filter(e => e.entityType === this.filterEntityType);
    }

    if (this.filterAction !== 'all') {
      result = result.filter(e => e.action === this.filterAction);
    }

    if (this.filterUser) {
      const term = this.filterUser.toLowerCase();
      result = result.filter(e => e.changedBy?.toLowerCase().includes(term));
    }

    return result;
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
  }
}
