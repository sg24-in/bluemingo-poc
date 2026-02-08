import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import {
  OperationTemplate,
  OPERATION_TYPES,
  QUANTITY_TYPES
} from '../../../shared/models/operation-template.model';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-operation-template-list',
  templateUrl: './operation-template-list.component.html',
  styleUrls: ['./operation-template-list.component.css']
})
export class OperationTemplateListComponent implements OnInit {
  templates: OperationTemplate[] = [];
  loading = true;

  // Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filter state
  filterStatus = '';
  filterType = '';
  searchTerm = '';

  // Delete modal
  showDeleteModal = false;
  templateToDelete: OperationTemplate | null = null;
  deleteLoading = false;
  deleteError = '';

  // Status toggle
  statusToggleLoading: { [id: number]: boolean } = {};

  operationTypes = OPERATION_TYPES;
  quantityTypes = QUANTITY_TYPES;

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
  }

  loadTemplates(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'operationName',
      sortDirection: 'ASC',
      status: this.filterStatus || undefined,
      type: this.filterType || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getOperationTemplatesPaged(request).subscribe({
      next: (response: PagedResponse<OperationTemplate>) => {
        this.templates = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading operation templates:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadTemplates();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadTemplates();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadTemplates();
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type === 'all' ? '' : type;
    this.page = 0;
    this.loadTemplates();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadTemplates();
  }

  createTemplate(): void {
    this.router.navigate(['/manage/operation-templates/new']);
  }

  editTemplate(template: OperationTemplate): void {
    this.router.navigate(['/manage/operation-templates', template.operationTemplateId, 'edit']);
  }

  openDeleteModal(template: OperationTemplate): void {
    this.templateToDelete = template;
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.templateToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.templateToDelete) return;

    this.deleteLoading = true;
    this.deleteError = '';

    this.apiService.deleteOperationTemplate(this.templateToDelete.operationTemplateId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.loadTemplates();
      },
      error: (err) => {
        this.deleteLoading = false;
        this.deleteError = err.error?.message || 'Failed to delete operation template.';
      }
    });
  }

  toggleStatus(template: OperationTemplate): void {
    const id = template.operationTemplateId;
    this.statusToggleLoading[id] = true;

    const action = template.status === 'ACTIVE'
      ? this.apiService.deactivateOperationTemplate(id)
      : this.apiService.activateOperationTemplate(id);

    action.subscribe({
      next: (updated) => {
        // Update template in list
        const idx = this.templates.findIndex(t => t.operationTemplateId === id);
        if (idx >= 0) {
          this.templates[idx] = updated;
        }
        this.statusToggleLoading[id] = false;
      },
      error: (err) => {
        console.error('Error toggling status:', err);
        this.statusToggleLoading[id] = false;
      }
    });
  }

  getOperationTypeLabel(type: string): string {
    const found = this.operationTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getQuantityTypeLabel(type: string): string {
    const found = this.quantityTypes.find(t => t.value === type);
    return found ? found.label : type;
  }
}
