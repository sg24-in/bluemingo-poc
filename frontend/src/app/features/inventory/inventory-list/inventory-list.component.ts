import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Inventory } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-inventory-list',
  templateUrl: './inventory-list.component.html',
  styleUrls: ['./inventory-list.component.css']
})
export class InventoryListComponent implements OnInit {
  inventory: Inventory[] = [];
  loading = true;

  // Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filter state
  filterState = '';
  filterType = '';
  searchTerm = '';

  // Modal states
  showBlockModal = false;
  showScrapModal = false;
  selectedInventory: Inventory | null = null;
  actionReason = '';
  actionLoading = false;
  actionError = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadInventory();
  }

  loadInventory(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'createdOn',
      sortDirection: 'DESC',
      status: this.filterState || undefined,
      type: this.filterType || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getInventoryPaged(request).subscribe({
      next: (response: PagedResponse<Inventory>) => {
        this.inventory = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadInventory();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadInventory();
  }

  onFilterStateChange(state: string): void {
    this.filterState = state === 'all' ? '' : state;
    this.page = 0;
    this.loadInventory();
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type === 'all' ? '' : type;
    this.page = 0;
    this.loadInventory();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadInventory();
  }

  // Block actions
  openBlockModal(item: Inventory): void {
    this.selectedInventory = item;
    this.actionReason = '';
    this.actionError = '';
    this.showBlockModal = true;
  }

  closeBlockModal(): void {
    this.showBlockModal = false;
    this.selectedInventory = null;
    this.actionReason = '';
    this.actionError = '';
  }

  confirmBlock(): void {
    if (!this.actionReason.trim()) {
      this.actionError = 'Please provide a reason for blocking.';
      return;
    }

    if (!this.selectedInventory) return;

    this.actionLoading = true;
    this.actionError = '';

    this.apiService.blockInventory(this.selectedInventory.inventoryId, this.actionReason).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeBlockModal();
        this.loadInventory();
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Failed to block inventory.';
      }
    });
  }

  // Unblock actions
  unblockInventory(item: Inventory): void {
    if (!confirm(`Are you sure you want to unblock inventory ${item.batchNumber}?`)) {
      return;
    }

    this.loading = true;
    this.apiService.unblockInventory(item.inventoryId).subscribe({
      next: () => {
        this.loadInventory();
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.message || 'Failed to unblock inventory.');
      }
    });
  }

  // Scrap actions
  openScrapModal(item: Inventory): void {
    this.selectedInventory = item;
    this.actionReason = '';
    this.actionError = '';
    this.showScrapModal = true;
  }

  closeScrapModal(): void {
    this.showScrapModal = false;
    this.selectedInventory = null;
    this.actionReason = '';
    this.actionError = '';
  }

  confirmScrap(): void {
    if (!this.actionReason.trim()) {
      this.actionError = 'Please provide a reason for scrapping.';
      return;
    }

    if (!this.selectedInventory) return;

    this.actionLoading = true;
    this.actionError = '';

    this.apiService.scrapInventory(this.selectedInventory.inventoryId, this.actionReason).subscribe({
      next: () => {
        this.actionLoading = false;
        this.closeScrapModal();
        this.loadInventory();
      },
      error: (err) => {
        this.actionLoading = false;
        this.actionError = err.error?.message || 'Failed to scrap inventory.';
      }
    });
  }

  // CRUD actions
  createInventory(): void {
    this.router.navigate(['/inventory/new']);
  }

  editInventory(item: Inventory): void {
    this.router.navigate(['/inventory', item.inventoryId, 'edit']);
  }

  deleteInventory(item: Inventory): void {
    if (!confirm(`Are you sure you want to delete inventory for ${item.materialId}?`)) {
      return;
    }

    this.loading = true;
    this.apiService.deleteInventory(item.inventoryId).subscribe({
      next: () => {
        this.loadInventory();
      },
      error: (err) => {
        this.loading = false;
        alert(err.error?.message || 'Failed to delete inventory.');
      }
    });
  }

  // Helpers
  canBlock(item: Inventory): boolean {
    return item.state !== 'BLOCKED' && item.state !== 'CONSUMED' && item.state !== 'SCRAPPED';
  }

  canUnblock(item: Inventory): boolean {
    return item.state === 'BLOCKED';
  }

  canScrap(item: Inventory): boolean {
    return item.state !== 'CONSUMED' && item.state !== 'SCRAPPED';
  }

  canEdit(item: Inventory): boolean {
    return item.state !== 'CONSUMED' && item.state !== 'SCRAPPED';
  }

  canDelete(item: Inventory): boolean {
    return item.state !== 'CONSUMED' && item.state !== 'SCRAPPED';
  }
}
