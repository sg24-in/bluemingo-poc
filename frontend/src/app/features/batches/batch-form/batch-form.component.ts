import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Batch } from '../../../shared/models';

@Component({
  selector: 'app-batch-form',
  templateUrl: './batch-form.component.html',
  styleUrls: ['./batch-form.component.css']
})
export class BatchFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  batchId: number | null = null;
  loading = false;
  saving = false;
  error = '';
  batch: Batch | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('batchId');
    if (id) {
      this.isEditMode = true;
      this.batchId = +id;
      this.loadBatch();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      batchNumber: ['', [Validators.required, Validators.maxLength(100)]],
      materialId: ['', [Validators.required, Validators.maxLength(100)]],
      materialName: ['', Validators.maxLength(200)],
      // Quantity is read-only in edit mode - use adjustQuantity for changes
      quantity: [{ value: null, disabled: true }],
      unit: ['T', Validators.maxLength(20)],
      status: ['AVAILABLE']
    });
  }

  loadBatch(): void {
    if (!this.batchId) return;

    this.loading = true;
    this.apiService.getBatchById(this.batchId).subscribe({
      next: (batch: Batch) => {
        this.batch = batch;
        this.form.patchValue({
          batchNumber: batch.batchNumber,
          materialId: batch.materialId,
          materialName: batch.materialName || '',
          quantity: batch.quantity,
          unit: batch.unit || 'T',
          status: batch.status
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load batch.';
        this.loading = false;
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

    const formValue = this.form.getRawValue();

    if (this.isEditMode && this.batchId) {
      // Per MES spec: quantity is NOT included in update - use adjustQuantity instead
      const updateRequest = {
        batchNumber: formValue.batchNumber,
        materialId: formValue.materialId,
        materialName: formValue.materialName || undefined,
        // quantity REMOVED per MES Batch Management Specification
        unit: formValue.unit || undefined,
        status: formValue.status
      };

      this.apiService.updateBatch(this.batchId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/batches']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update batch.';
        }
      });
    } else {
      // Manual batch creation - show warning
      console.warn('Manual batch creation is deprecated. Batches should be created via production confirmation.');

      const createRequest = {
        batchNumber: formValue.batchNumber,
        materialId: formValue.materialId,
        materialName: formValue.materialName || undefined,
        quantity: formValue.quantity,
        unit: formValue.unit || undefined
      };

      this.apiService.createBatch(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/batches']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create batch.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/batches']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `This field is required`;
    if (control.errors['maxlength']) return `Value is too long`;

    return 'Invalid value';
  }
}
