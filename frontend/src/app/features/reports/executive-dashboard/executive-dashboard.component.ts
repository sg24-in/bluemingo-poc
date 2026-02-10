import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ExecutiveDashboard } from '../../../shared/models';

@Component({
  selector: 'app-executive-dashboard',
  templateUrl: './executive-dashboard.component.html',
  styleUrls: ['./executive-dashboard.component.css']
})
export class ExecutiveDashboardComponent implements OnInit {
  loading = true;
  error = '';
  data: ExecutiveDashboard | null = null;

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loading = true;
    this.error = '';

    this.apiService.getExecutiveDashboard().subscribe({
      next: (data) => {
        this.data = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load executive dashboard';
        this.loading = false;
      }
    });
  }

  getYieldClass(yieldPct: number): string {
    if (yieldPct >= 95) return 'yield-good';
    if (yieldPct >= 85) return 'yield-warning';
    return 'yield-danger';
  }

  getCompletionClass(pct: number): string {
    if (pct >= 90) return 'completion-good';
    if (pct >= 70) return 'completion-warning';
    return 'completion-danger';
  }

  getTypeLabel(type: string): string {
    switch (type?.toUpperCase()) {
      case 'RM': return 'Raw Material';
      case 'WIP': return 'Work in Progress';
      case 'IM': return 'Intermediate';
      case 'FG': return 'Finished Goods';
      default: return type;
    }
  }
}
