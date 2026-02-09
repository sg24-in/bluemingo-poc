import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-hold-form',
  templateUrl: './hold-form.component.html',
  styleUrls: ['./hold-form.component.css']
})
export class HoldFormComponent implements OnInit {
  form!: FormGroup;
  saving = false;
  error = '';

  entityTypes = ['ORDER', 'OPERATION', 'BATCH', 'INVENTORY', 'EQUIPMENT'];
  holdReasons: { reasonCode: string; description: string }[] = [];
  loadingReasons = true;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      entityType: ['', Validators.required],
      entityId: ['', [Validators.required, Validators.min(1)]],
      reason: ['', Validators.required],
      comments: ['']
    });

    this.loadHoldReasons();
  }

  loadHoldReasons(): void {
    this.loadingReasons = true;
    this.apiService.getHoldReasons().subscribe({
      next: (reasons) => {
        this.holdReasons = reasons;
        this.loadingReasons = false;
      },
      error: () => {
        this.holdReasons = [];
        this.loadingReasons = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    this.error = '';

    const request = {
      entityType: this.form.value.entityType,
      entityId: +this.form.value.entityId,
      reason: this.form.value.reason,
      comments: this.form.value.comments || undefined
    };

    this.apiService.applyHold(request).subscribe({
      next: () => {
        this.saving = false;
        this.router.navigate(['/holds']);
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to apply hold';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/holds']);
  }

  hasError(field: string): boolean {
    const c = this.form.get(field);
    return !!(c && c.invalid && c.touched);
  }

  getEntityTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'ORDER': 'Order',
      'OPERATION': 'Operation',
      'BATCH': 'Batch',
      'INVENTORY': 'Inventory',
      'EQUIPMENT': 'Equipment'
    };
    return labels[type] || type;
  }
}
