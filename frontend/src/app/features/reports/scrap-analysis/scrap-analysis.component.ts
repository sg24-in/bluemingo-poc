import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../../core/services/api.service';
import { ScrapAnalysis } from '../../../shared/models';

@Component({
  selector: 'app-scrap-analysis',
  templateUrl: './scrap-analysis.component.html',
  styleUrls: ['./scrap-analysis.component.css']
})
export class ScrapAnalysisComponent implements OnInit {
  loading = true;
  error = '';
  scrapData: ScrapAnalysis | null = null;
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

    this.apiService.getScrapAnalysis(this.startDate, this.endDate).subscribe({
      next: (data) => {
        this.scrapData = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load scrap analysis data';
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
