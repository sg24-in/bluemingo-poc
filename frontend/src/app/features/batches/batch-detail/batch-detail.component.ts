import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-batch-detail',
  templateUrl: './batch-detail.component.html',
  styleUrls: ['./batch-detail.component.css']
})
export class BatchDetailComponent implements OnInit {
  batch: any = null;
  genealogy: any = null;
  loading = true;
  loadingGenealogy = true;
  batchId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.batchId = Number(this.route.snapshot.paramMap.get('batchId'));
    this.loadBatch();
    this.loadGenealogy();
  }

  loadBatch(): void {
    this.loading = true;
    this.apiService.getBatchById(this.batchId).subscribe({
      next: (data) => {
        this.batch = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading batch:', err);
        this.loading = false;
      }
    });
  }

  loadGenealogy(): void {
    this.loadingGenealogy = true;
    this.apiService.getBatchGenealogy(this.batchId).subscribe({
      next: (data) => {
        this.genealogy = data;
        this.loadingGenealogy = false;
      },
      error: (err) => {
        console.error('Error loading genealogy:', err);
        this.loadingGenealogy = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/batches']);
  }

  navigateToBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }
}
