import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { PagedResponse } from '../../../shared/models';

interface BatchSizeConfig {
  configId: number;
  materialId?: string;
  operationType?: string;
  equipmentType?: string;
  productSku?: string;
  minBatchSize: number;
  maxBatchSize: number;
  preferredBatchSize?: number;
  unit: string;
  allowPartialBatch: boolean;
  isActive: boolean;
  priority: number;
  createdOn?: string;
  createdBy?: string;
  updatedOn?: string;
  updatedBy?: string;
}

@Component({
  selector: 'app-batch-size-list',
  templateUrl: './batch-size-list.component.html',
  styleUrls: ['./batch-size-list.component.css']
})
export class BatchSizeListComponent implements OnInit {
  configs: BatchSizeConfig[] = [];
  loading = true;
  error = '';

  // Filters
  filterStatus = 'all';
  searchTerm = '';

  // Pagination
  page = 0;
  size = 20;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadPaged();
  }

  loadPaged(): void {
    this.loading = true;
    this.error = '';

    const request: any = {
      page: this.page,
      size: this.size
    };

    if (this.filterStatus === 'active') {
      request.isActive = true;
    } else if (this.filterStatus === 'inactive') {
      request.isActive = false;
    }

    if (this.searchTerm) {
      request.search = this.searchTerm;
    }

    this.apiService.getBatchSizeConfigsPaged(request).subscribe({
      next: (response: PagedResponse<BatchSizeConfig>) => {
        this.configs = response.content;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load batch size configurations';
        this.loading = false;
      }
    });
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status;
    this.page = 0;
    this.loadPaged();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadPaged();
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadPaged();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadPaged();
  }

  create(): void {
    this.router.navigate(['/manage/config/batch-size/new']);
  }

  edit(config: BatchSizeConfig): void {
    this.router.navigate(['/manage/config/batch-size', config.configId, 'edit']);
  }

  delete(config: BatchSizeConfig): void {
    if (confirm(`Deactivate batch size config for ${config.operationType || 'generic'}?`)) {
      this.apiService.deleteBatchSizeConfig(config.configId).subscribe({
        next: () => {
          this.loadPaged();
        },
        error: (err) => {
          alert(err.error?.message || 'Failed to delete configuration');
        }
      });
    }
  }

  formatScope(config: BatchSizeConfig): string {
    const parts = [];
    if (config.productSku) parts.push(`Product: ${config.productSku}`);
    if (config.materialId) parts.push(`Material: ${config.materialId}`);
    if (config.operationType) parts.push(`Op: ${config.operationType}`);
    if (config.equipmentType) parts.push(`Equip: ${config.equipmentType}`);
    return parts.length > 0 ? parts.join(', ') : 'Generic (Default)';
  }
}
