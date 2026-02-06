import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Operator } from '../../../shared/models';

@Component({
  selector: 'app-operator-detail',
  templateUrl: './operator-detail.component.html',
  styleUrls: ['./operator-detail.component.css']
})
export class OperatorDetailComponent implements OnInit {
  operator: Operator | null = null;
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
      this.loadOperator(+idParam);
    } else {
      this.error = 'No operator ID provided';
      this.loading = false;
    }
  }

  loadOperator(operatorId: number): void {
    this.loading = true;
    this.error = null;

    this.apiService.getOperatorById(operatorId).subscribe({
      next: (operator) => {
        this.operator = operator;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading operator:', err);
        this.error = 'Failed to load operator';
        this.loading = false;
      }
    });
  }

  editOperator(): void {
    if (this.operator) {
      this.router.navigate(['/manage/operators', this.operator.operatorId, 'edit']);
    }
  }

  goBack(): void {
    this.router.navigate(['/manage/operators']);
  }

  getStatusClass(status: string): string {
    switch (status?.toUpperCase()) {
      case 'ACTIVE':
        return 'status-active';
      case 'INACTIVE':
        return 'status-inactive';
      default:
        return '';
    }
  }

  toggleStatus(): void {
    if (!this.operator) return;

    if (this.operator.status === 'ACTIVE') {
      if (confirm(`Are you sure you want to deactivate operator "${this.operator.name}"?`)) {
        this.apiService.deleteOperator(this.operator.operatorId).subscribe({
          next: () => {
            this.loadOperator(this.operator!.operatorId);
          },
          error: (err) => {
            console.error('Error deactivating operator:', err);
            this.error = 'Failed to deactivate operator';
          }
        });
      }
    } else {
      this.apiService.activateOperator(this.operator.operatorId).subscribe({
        next: () => {
          this.loadOperator(this.operator!.operatorId);
        },
        error: (err) => {
          console.error('Error activating operator:', err);
          this.error = 'Failed to activate operator';
        }
      });
    }
  }
}
