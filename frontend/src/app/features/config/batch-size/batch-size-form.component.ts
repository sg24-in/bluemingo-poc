import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-batch-size-form',
  templateUrl: './batch-size-form.component.html',
  styleUrls: ['./batch-size-form.component.css']
})
export class BatchSizeFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  configId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  operationTypes = [
    'MELTING', 'CASTING', 'ROLLING', 'CUTTING', 'ANNEALING',
    'FINISHING', 'INSPECTION', 'PACKAGING', 'OTHER'
  ];

  units = ['T', 'KG', 'PC', 'M', 'L'];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.configId = +id;
      this.loadConfig(this.configId);
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      operationType: [''],
      materialId: [''],
      productSku: [''],
      equipmentType: [''],
      minBatchSize: [0, [Validators.min(0)]],
      maxBatchSize: ['', [Validators.required, Validators.min(0.0001)]],
      preferredBatchSize: ['', [Validators.min(0)]],
      unit: ['T', Validators.required],
      allowPartialBatch: [true],
      priority: [0, [Validators.min(0)]],
      isActive: [true]
    });
  }

  loadConfig(id: number): void {
    this.loading = true;
    this.apiService.getBatchSizeConfig(id).subscribe({
      next: (config) => {
        this.form.patchValue({
          operationType: config.operationType || '',
          materialId: config.materialId || '',
          productSku: config.productSku || '',
          equipmentType: config.equipmentType || '',
          minBatchSize: config.minBatchSize,
          maxBatchSize: config.maxBatchSize,
          preferredBatchSize: config.preferredBatchSize || '',
          unit: config.unit,
          allowPartialBatch: config.allowPartialBatch,
          priority: config.priority,
          isActive: config.isActive
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load configuration';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    // Validate min <= max
    const minSize = this.form.value.minBatchSize || 0;
    const maxSize = this.form.value.maxBatchSize;
    const preferredSize = this.form.value.preferredBatchSize;

    if (minSize > maxSize) {
      this.error = 'Min batch size cannot be greater than max batch size';
      return;
    }

    if (preferredSize && (preferredSize < minSize || preferredSize > maxSize)) {
      this.error = 'Preferred batch size must be between min and max';
      return;
    }

    this.saving = true;
    this.error = '';

    const request = {
      ...this.form.value,
      operationType: this.form.value.operationType || null,
      materialId: this.form.value.materialId || null,
      productSku: this.form.value.productSku || null,
      equipmentType: this.form.value.equipmentType || null,
      preferredBatchSize: this.form.value.preferredBatchSize || null
    };

    if (this.isEditMode && this.configId) {
      this.apiService.updateBatchSizeConfig(this.configId, request).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/config/batch-size']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update configuration';
          this.saving = false;
        }
      });
    } else {
      this.apiService.createBatchSizeConfig(request).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/config/batch-size']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create configuration';
          this.saving = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/config/batch-size']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  get title(): string {
    return this.isEditMode ? 'Edit Batch Size Configuration' : 'New Batch Size Configuration';
  }
}
