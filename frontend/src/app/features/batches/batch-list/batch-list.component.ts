import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Batch } from '../../../shared/models';
import { PagedResponse, PageRequest, DEFAULT_PAGE_SIZE } from '../../../shared/models/pagination.model';

@Component({
  selector: 'app-batch-list',
  templateUrl: './batch-list.component.html',
  styleUrls: ['./batch-list.component.css']
})
export class BatchListComponent implements OnInit {
  batches: Batch[] = [];
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

  constructor(
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Read initial status from query params (e.g., ?status=QUALITY_PENDING)
    this.route.queryParams.subscribe(params => {
      if (params['status']) {
        this.filterStatus = params['status'];
      }
      this.loadBatches();
    });
  }

  loadBatches(): void {
    this.loading = true;

    const request: PageRequest = {
      page: this.page,
      size: this.size,
      sortBy: 'createdOn',
      sortDirection: 'DESC',
      status: this.filterStatus || undefined,
      search: this.searchTerm || undefined
    };

    this.apiService.getBatchesPaged(request).subscribe({
      next: (response: PagedResponse<Batch>) => {
        this.batches = response.content;
        this.page = response.page;
        this.size = response.size;
        this.totalElements = response.totalElements;
        this.totalPages = response.totalPages;
        this.hasNext = response.hasNext;
        this.hasPrevious = response.hasPrevious;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading batches:', err);
        this.loading = false;
      }
    });
  }

  onPageChange(newPage: number): void {
    this.page = newPage;
    this.loadBatches();
  }

  onSizeChange(newSize: number): void {
    this.size = newSize;
    this.page = 0;
    this.loadBatches();
  }

  onFilterStateChange(state: string): void {
    this.filterStatus = state === 'all' ? '' : state;
    this.page = 0;
    this.loadBatches();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.page = 0;
    this.loadBatches();
  }

  viewBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }
}
