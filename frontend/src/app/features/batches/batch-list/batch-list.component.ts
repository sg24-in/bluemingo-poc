import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-batch-list',
  templateUrl: './batch-list.component.html',
  styleUrls: ['./batch-list.component.css']
})
export class BatchListComponent implements OnInit {
  batches: any[] = [];
  filteredBatches: any[] = [];
  loading = true;

  filterState = 'all';
  searchTerm = '';

  constructor(
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadBatches();
  }

  loadBatches(): void {
    this.loading = true;
    this.apiService.getAllBatches().subscribe({
      next: (data) => {
        this.batches = data;
        this.applyFilters();
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading batches:', err);
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    this.filteredBatches = this.batches.filter(batch => {
      const matchState = this.filterState === 'all' || batch.state === this.filterState;
      const matchSearch = !this.searchTerm ||
        batch.batchNumber?.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        batch.materialId?.toLowerCase().includes(this.searchTerm.toLowerCase());

      return matchState && matchSearch;
    });
  }

  onFilterStateChange(state: string): void {
    this.filterState = state;
    this.applyFilters();
  }

  onSearchChange(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  viewBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }
}
