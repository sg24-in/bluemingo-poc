import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { BomProductSummary } from '../../../shared/models';
import { PageRequest, PagedResponse, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-bom-list',
  templateUrl: './bom-list.component.html',
  styleUrls: ['./bom-list.component.css']
})
export class BomListComponent implements OnInit {
  products: BomProductSummary[] = [];
  loading = true;
  error: string | null = null;

  // TASK-P3: Pagination state
  page = 0;
  size = DEFAULT_PAGE_SIZE;
  totalElements = 0;
  totalPages = 0;
  hasNext = false;
  hasPrevious = false;

  // Filter state
  searchTerm = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  // TASK-P3: Server-side paginated loading
  loadProducts(): void {
    this.loading = true;
    this.error = null;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'productSku',
      sortDirection: 'ASC',
      search: this.searchTerm || undefined
    };

    this.apiService.getBomProductsPaged(request).subscribe({
      next: (response: PagedResponse<BomProductSummary>) => {
        this.products = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load BOM products';
        this.loading = false;
        console.error('Error loading BOM products:', err);
      }
    });
  }

  // TASK-P3: Pagination handlers
  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadProducts();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadProducts();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadProducts();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.page = 0;
    this.loadProducts();
  }

  viewTree(productSku: string): void {
    this.router.navigate(['/manage/bom', productSku, 'tree']);
  }

  addNode(productSku: string): void {
    this.router.navigate(['/manage/bom', productSku, 'node', 'new']);
  }

  createNewBom(): void {
    this.router.navigate(['/manage/bom', 'create']);
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'EMPTY':
        return 'status-empty';
      case 'INACTIVE':
        return 'status-inactive';
      case 'DRAFT':
        return 'status-draft';
      case 'OBSOLETE':
        return 'status-obsolete';
      default:
        return '';
    }
  }
}
