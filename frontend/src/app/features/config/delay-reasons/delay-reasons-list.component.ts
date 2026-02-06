import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { DelayReason, PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models';

@Component({
  selector: 'app-delay-reasons-list',
  templateUrl: './delay-reasons-list.component.html',
  styleUrls: ['./delay-reasons-list.component.css']
})
export class DelayReasonsListComponent implements OnInit {
  items: DelayReason[] = [];
  loading = true;
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;
  filterStatus = '';
  searchTerm = '';
  showDeleteModal = false;
  itemToDelete: DelayReason | null = null;
  deleteLoading = false;
  deleteError = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void { this.loadItems(); }

  loadItems(): void {
    this.loading = true;
    const request: PageRequest = {
      page: this.page, size: this.size, sortBy: 'reasonCode', sortDirection: 'ASC',
      status: this.filterStatus || undefined, search: this.searchTerm || undefined
    };
    this.apiService.getDelayReasonsPaged(request).subscribe({
      next: (response: PagedResponse<DelayReason>) => {
        this.items = response.content;
        this.page = response.page;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = !response.last;
        this.hasPrevious = !response.first;
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  onPageChange(p: number): void { this.page = p; this.loadItems(); }
  onSizeChange(s: number): void { this.size = s; this.page = 0; this.loadItems(); }
  onFilterStatusChange(status: string): void { this.filterStatus = status === 'all' ? '' : status; this.page = 0; this.loadItems(); }
  onSearchChange(term: string): void { this.searchTerm = term; this.page = 0; this.loadItems(); }
  create(): void { this.router.navigate(['/manage/config/delay-reasons/new']); }
  edit(item: DelayReason): void { this.router.navigate(['/manage/config/delay-reasons', item.reasonId, 'edit']); }
  openDeleteModal(item: DelayReason): void { this.itemToDelete = item; this.deleteError = ''; this.showDeleteModal = true; }
  closeDeleteModal(): void { this.showDeleteModal = false; this.itemToDelete = null; }
  confirmDelete(): void {
    if (!this.itemToDelete) return;
    this.deleteLoading = true;
    this.apiService.deleteDelayReason(this.itemToDelete.reasonId).subscribe({
      next: () => { this.deleteLoading = false; this.closeDeleteModal(); this.loadItems(); },
      error: (err) => { this.deleteLoading = false; this.deleteError = err.error?.message || 'Failed to delete.'; }
    });
  }
}
