import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-batch-number-form',
  templateUrl: './batch-number-form.component.html',
  styleUrls: ['./batch-number-form.component.css']
})
export class BatchNumberFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  loading = false;
  saving = false;
  error = '';
  previewResult = '';
  previewLoading = false;
  previewError = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      configName: ['', [Validators.required, Validators.maxLength(100)]],
      operationType: [''],
      productSku: [''],
      prefix: ['BATCH', [Validators.required, Validators.maxLength(20)]],
      includeOperationCode: [false],
      operationCodeLength: [3],
      separator: ['-', [Validators.required, Validators.maxLength(5)]],
      dateFormat: [''],
      includeDate: [false],
      sequenceLength: [3, [Validators.required, Validators.min(1), Validators.max(10)]],
      sequenceReset: ['DAILY'],
      priority: [100],
      status: ['ACTIVE']
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.itemId = +id;
      this.form.get('configName')?.disable();
      this.loadItem();
    }
  }

  loadItem(): void {
    if (!this.itemId) return;
    this.loading = true;
    this.apiService.getBatchNumberConfigById(this.itemId).subscribe({
      next: (item) => {
        this.form.patchValue({
          configName: item.configName,
          operationType: item.operationType || '',
          productSku: item.productSku || '',
          prefix: item.prefix,
          includeOperationCode: item.includeOperationCode,
          operationCodeLength: item.operationCodeLength,
          separator: item.separator,
          dateFormat: item.dateFormat || '',
          includeDate: item.includeDate,
          sequenceLength: item.sequenceLength,
          sequenceReset: item.sequenceReset,
          priority: item.priority,
          status: item.status
        });
        this.loading = false;
      },
      error: (err) => { this.error = err.error?.message || 'Failed to load.'; this.loading = false; }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    const val = this.form.getRawValue();
    if (this.isEditMode && this.itemId) {
      this.apiService.updateBatchNumberConfig(this.itemId, val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/batch-number']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to update.'; }
      });
    } else {
      this.apiService.createBatchNumberConfig(val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/batch-number']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to create.'; }
      });
    }
  }

  cancel(): void { this.router.navigate(['/manage/config/batch-number']); }
  hasError(field: string): boolean { const c = this.form.get(field); return !!(c && c.invalid && c.touched); }

  previewNumber(): void {
    this.previewLoading = true;
    this.previewError = '';
    this.previewResult = '';
    const val = this.form.getRawValue();
    this.apiService.previewBatchNumber(val.operationType || undefined, val.productSku || undefined).subscribe({
      next: (result) => {
        this.previewResult = result.previewBatchNumber;
        this.previewLoading = false;
      },
      error: (err) => {
        this.previewError = err.error?.message || 'Failed to generate preview.';
        this.previewLoading = false;
      }
    });
  }
}
