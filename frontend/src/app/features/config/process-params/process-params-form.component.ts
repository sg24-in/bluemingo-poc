import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-process-params-form',
  templateUrl: './process-params-form.component.html',
  styleUrls: ['./process-params-form.component.css']
})
export class ProcessParamsFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      operationType: ['', [Validators.required]],
      productSku: [''],
      parameterName: ['', [Validators.required, Validators.maxLength(100)]],
      parameterType: ['DECIMAL'],
      unit: [''],
      minValue: [null],
      maxValue: [null],
      defaultValue: [null],
      isRequired: [false],
      displayOrder: [1],
      status: ['ACTIVE']
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.itemId = +id;
      this.form.get('operationType')?.disable();
      this.form.get('parameterName')?.disable();
      this.loadItem();
    }
  }

  loadItem(): void {
    if (!this.itemId) return;
    this.loading = true;
    this.apiService.getProcessParamById(this.itemId).subscribe({
      next: (item) => {
        this.form.patchValue({
          operationType: item.operationType,
          productSku: item.productSku || '',
          parameterName: item.parameterName,
          parameterType: item.parameterType,
          unit: item.unit || '',
          minValue: item.minValue,
          maxValue: item.maxValue,
          defaultValue: item.defaultValue,
          isRequired: item.isRequired,
          displayOrder: item.displayOrder,
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
      this.apiService.updateProcessParam(this.itemId, val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/process-params']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to update.'; }
      });
    } else {
      this.apiService.createProcessParam(val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/process-params']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to create.'; }
      });
    }
  }

  cancel(): void { this.router.navigate(['/manage/config/process-params']); }
  hasError(field: string): boolean { const c = this.form.get(field); return !!(c && c.invalid && c.touched); }
}
