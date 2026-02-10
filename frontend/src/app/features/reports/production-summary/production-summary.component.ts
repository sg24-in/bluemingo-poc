import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ProductionSummary, ProductionByOperation } from '../../../shared/models';

@Component({
  selector: 'app-production-summary',
  templateUrl: './production-summary.component.html',
  styleUrls: ['./production-summary.component.css']
})
export class ProductionSummaryComponent implements OnInit {
  loading = true;
  error = '';
  summary: ProductionSummary | null = null;
  byOperation: ProductionByOperation | null = null;
  startDate = '';
  endDate = '';

  constructor(private apiService: ApiService) {
    const now = new Date();
    this.endDate = now.toISOString().split('T')[0];
    const start = new Date(now);
    start.setDate(start.getDate() - 30);
    this.startDate = start.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getProductionSummary(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.summary = data;
        this.loadByOperation();
      },
      error: (err) => {
        this.error = 'Failed to load production summary';
        this.loading = false;
      }
    });
  }

  private loadByOperation(): void {
    this.apiService.getProductionByOperation(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.byOperation = data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      this.loadData();
    }
  }
}
