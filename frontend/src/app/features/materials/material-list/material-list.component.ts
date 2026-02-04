import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Material, getUnitLabel } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-material-list',
  templateUrl: './material-list.component.html',
  styleUrls: ['./material-list.component.css']
})
export class MaterialListComponent implements OnInit {
  materials: Material[] = [];
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
  materialToDelete: Material | null = null;
  deleteLoading = false;
  deleteError = '';

  materialTypes = [
    { value: 'RM', label: 'Raw Material' },
    { value: 'IM', label: 'Intermediate' },
    { value: 'FG', label: 'Finished Goods' },
    { value: 'WIP', label: 'Work In Progress' }
  ];

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'materialName',
      sortDirection: 'ASC',
      status: this.filterStatus || undefined,
      type: this.filterType || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getMaterialsPaged(request).subscribe({
      next: (response: PagedResponse<Material>) => {
        this.materials = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading materials:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadMaterials();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadMaterials();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadMaterials();
  }

  onFilterTypeChange(type: string): void {
    this.filterType = type === 'all' ? '' : type;
    this.page = 0;
    this.loadMaterials();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadMaterials();
  }

  createMaterial(): void {
    this.router.navigate(['/manage/materials/new']);
  }

  editMaterial(material: Material): void {
    this.router.navigate(['/manage/materials', material.materialId, 'edit']);
  }

  openDeleteModal(material: Material): void {
    this.materialToDelete = material;
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.materialToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.materialToDelete) return;

    this.deleteLoading = true;
    this.deleteError = '';

    this.apiService.deleteMaterial(this.materialToDelete.materialId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.loadMaterials();
      },
      error: (err) => {
        this.deleteLoading = false;
        this.deleteError = err.error?.message || 'Failed to delete material.';
      }
    });
  }

  getTypeLabel(type: string): string {
    const found = this.materialTypes.find(t => t.value === type);
    return found ? found.label : type;
  }

  getUnitLabel(code: string): string {
    return getUnitLabel(code);
  }
}
