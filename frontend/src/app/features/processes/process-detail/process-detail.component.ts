import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Process } from '../../../shared/models';

@Component({
  selector: 'app-process-detail',
  templateUrl: './process-detail.component.html',
  styleUrls: ['./process-detail.component.css']
})
export class ProcessDetailComponent implements OnInit {
  process: Process | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.loadProcess(+idParam);
    } else {
      this.error = 'No process ID provided';
      this.loading = false;
    }
  }

  loadProcess(processId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getProcessById(processId).subscribe({
      next: (process) => {
        this.process = process;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading process:', err);
        this.error = 'Failed to load process';
        this.loading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/processes']);
  }

  viewOperation(operationId: number): void {
    this.router.navigate(['/operations', operationId]);
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'NOT_STARTED':
        return 'status-not-started';
      case 'IN_PROGRESS':
        return 'status-in-progress';
      case 'COMPLETED':
        return 'status-completed';
      case 'ON_HOLD':
        return 'status-on-hold';
      default:
        return '';
    }
  }

  getOperationStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'NOT_STARTED':
        return 'op-not-started';
      case 'READY':
        return 'op-ready';
      case 'IN_PROGRESS':
        return 'op-in-progress';
      case 'CONFIRMED':
        return 'op-confirmed';
      case 'ON_HOLD':
        return 'op-on-hold';
      case 'BLOCKED':
        return 'op-blocked';
      default:
        return '';
    }
  }

}
