import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-quantity-type-form',
  templateUrl: './quantity-type-form.component.html',
  styleUrls: ['./quantity-type-form.component.css']
})
export class QuantityTypeFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      configName: ['', [Validators.required, Validators.maxLength(100)]],
      materialCode: [''],
      operationType: [''],
      equipmentType: [''],
      quantityType: ['DECIMAL'],
      decimalPrecision: [4, [Validators.min(0), Validators.max(10)]],
      roundingRule: ['HALF_UP'],
      minQuantity: [null],
      maxQuantity: [null],
      unit: [''],
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
    this.apiService.getQuantityTypeConfigById(this.itemId).subscribe({
      next: (item) => {
        this.form.patchValue({
          configName: item.configName,
          materialCode: item.materialCode || '',
          operationType: item.operationType || '',
          equipmentType: item.equipmentType || '',
          quantityType: item.quantityType,
          decimalPrecision: item.decimalPrecision,
          roundingRule: item.roundingRule,
          minQuantity: item.minQuantity,
          maxQuantity: item.maxQuantity,
          unit: item.unit || '',
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
      this.apiService.updateQuantityTypeConfig(this.itemId, val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/quantity-type']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to update.'; }
      });
    } else {
      this.apiService.createQuantityTypeConfig(val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/quantity-type']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to create.'; }
      });
    }
  }

  cancel(): void { this.router.navigate(['/manage/config/quantity-type']); }
  hasError(field: string): boolean { const c = this.form.get(field); return !!(c && c.invalid && c.touched); }
}
