import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { BatchNumberConfig, PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models';

@Component({
  selector: 'app-batch-number-list',
  templateUrl: './batch-number-list.component.html',
  styleUrls: ['./batch-number-list.component.css']
})
export class BatchNumberListComponent implements OnInit {
  items: BatchNumberConfig[] = [];
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
  itemToDelete: BatchNumberConfig | null = null;
  deleteLoading = false;
  deleteError = '';

  constructor(private apiService: ApiService, private router: Router) {}

  ngOnInit(): void { this.loadItems(); }

  loadItems(): void {
    this.loading = true;
    const request: PageRequest = {
      page: this.page, size: this.size, sortBy: 'priority', sortDirection: 'ASC',
      status: this.filterStatus || undefined, search: this.searchTerm || undefined
    };
    this.apiService.getBatchNumberConfigsPaged(request).subscribe({
      next: (response: PagedResponse<BatchNumberConfig>) => {
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
  create(): void { this.router.navigate(['/manage/config/batch-number/new']); }
  edit(item: BatchNumberConfig): void { this.router.navigate(['/manage/config/batch-number', item.configId, 'edit']); }
  openDeleteModal(item: BatchNumberConfig): void { this.itemToDelete = item; this.deleteError = ''; this.showDeleteModal = true; }
  closeDeleteModal(): void { this.showDeleteModal = false; this.itemToDelete = null; }
  confirmDelete(): void {
    if (!this.itemToDelete) return;
    this.deleteLoading = true;
    this.apiService.deleteBatchNumberConfig(this.itemToDelete.configId).subscribe({
      next: () => { this.deleteLoading = false; this.closeDeleteModal(); this.loadItems(); },
      error: (err) => { this.deleteLoading = false; this.deleteError = err.error?.message || 'Failed to delete.'; }
    });
  }
}
