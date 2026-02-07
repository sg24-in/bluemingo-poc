import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

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
  filteredConfigs: BatchSizeConfig[] = [];
  loading = true;
  error = '';

  // Filters
  statusFilter = '';
  searchTerm = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadConfigs();
  }

  loadConfigs(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getBatchSizeConfigs().subscribe({
      next: (data) => {
        this.configs = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load batch size configurations';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    let result = [...this.configs];

    if (this.statusFilter === 'active') {
      result = result.filter(c => c.isActive);
    } else if (this.statusFilter === 'inactive') {
      result = result.filter(c => !c.isActive);
    }

    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(c =>
        c.operationType?.toLowerCase().includes(term) ||
        c.materialId?.toLowerCase().includes(term) ||
        c.productSku?.toLowerCase().includes(term) ||
        c.equipmentType?.toLowerCase().includes(term)
      );
    }

    this.filteredConfigs = result;
  }

  onFilterChange(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
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
          this.loadConfigs();
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
