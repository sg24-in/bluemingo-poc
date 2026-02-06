import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Operator } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-operator-list',
  templateUrl: './operator-list.component.html',
  styleUrls: ['./operator-list.component.css']
})
export class OperatorListComponent implements OnInit {
  operators: Operator[] = [];
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
  operatorToDelete: Operator | null = null;
  deleteLoading = false;
  deleteError = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadOperators();
  }

  loadOperators(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'operatorCode',
      sortDirection: 'ASC',
      status: this.filterStatus || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getOperatorsPaged(request).subscribe({
      next: (response: PagedResponse<Operator>) => {
        this.operators = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading operators:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadOperators();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadOperators();
  }

  onFilterStatusChange(status: string): void {
    this.filterStatus = status === 'all' ? '' : status;
    this.page = 0;
    this.loadOperators();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadOperators();
  }

  createOperator(): void {
    this.router.navigate(['/manage/operators/new']);
  }

  editOperator(operator: Operator): void {
    this.router.navigate(['/manage/operators', operator.operatorId, 'edit']);
  }

  openDeleteModal(operator: Operator): void {
    this.operatorToDelete = operator;
    this.deleteError = '';
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.operatorToDelete = null;
    this.deleteError = '';
  }

  confirmDelete(): void {
    if (!this.operatorToDelete) return;

    this.deleteLoading = true;
    this.deleteError = '';

    this.apiService.deleteOperator(this.operatorToDelete.operatorId).subscribe({
      next: () => {
        this.deleteLoading = false;
        this.closeDeleteModal();
        this.loadOperators();
      },
      error: (err) => {
        this.deleteLoading = false;
        this.deleteError = err.error?.message || 'Failed to delete operator.';
      }
    });
  }
}
