import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import {
  OperationCycleTimes,
  CycleTimeEntry,
  HoldAnalysis,
  HoldByEntityTypeEntry,
  HoldReasonEntry
} from '../../../shared/models';

@Component({
  selector: 'app-operations-report',
  templateUrl: './operations-report.component.html',
  styleUrls: ['./operations-report.component.css']
})
export class OperationsReportComponent implements OnInit {
  loading = true;
  error = '';

  cycleTimes: CycleTimeEntry[] = [];
  holdAnalysis: HoldAnalysis | null = null;

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

    this.apiService.getOperationCycleTimes(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.cycleTimes = data.entries || [];
        this.loadHoldAnalysis();
      },
      error: (err) => {
        this.error = 'Failed to load operations data';
        this.loading = false;
      }
    });
  }

  private loadHoldAnalysis(): void {
    this.apiService.getHoldAnalysis().subscribe({
      next: (data) => {
        this.holdAnalysis = data;
        this.loading = false;
      },
      error: () => {
        this.holdAnalysis = null;
        this.loading = false;
      }
    });
  }

  onDateChange(): void {
    if (this.startDate && this.endDate) {
      this.loadData();
    }
  }

  getCycleTimeClass(avg: number, max: number): string {
    if (max > 0 && avg / max > 0.9) return 'cycle-warning';
    return '';
  }
}
