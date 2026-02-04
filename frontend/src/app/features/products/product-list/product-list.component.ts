import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Product, getUnitLabel } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
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
  searchTerm = '';

  // Delete modal
  showDeleteModal = false;
  productToDelete: Product | null = null;
  deleteLoading = false;
  deleteError = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'productName',
      sortDirection: 'ASC',
      status: this.filterStatus || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getProductsPaged(request).subscribe({
      next: (response: PagedResponse<Product>) => {
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
        console.error('Error loading products:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadProducts();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadProducts();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadProducts();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadProducts();
  }

  createProduct(): void {
    this.router.navigate(['/manage/products/new']);
  }

  editProduct(product: Product): void {
    this.router.navigate(['/manage/products', product.productId, 'edit']);
  }

  openDeleteModal(product: Product): void {
    this.productToDelete = product;
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.productToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.productToDelete) return;

    this.deleteLoading = true;
    this.deleteError = '';

    this.apiService.deleteProduct(this.productToDelete.productId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.loadProducts();
      },
      error: (err) => {
        this.deleteLoading = false;
        this.deleteError = err.error?.message || 'Failed to delete product.';
      }
    });
  }

  getUnitLabel(code: string): string {
    return getUnitLabel(code);
  }
}
