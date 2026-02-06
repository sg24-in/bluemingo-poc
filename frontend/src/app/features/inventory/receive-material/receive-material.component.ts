import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Material, ReceiveMaterialResponse } from '../../../shared/models';

@Component({
  selector: 'app-receive-material',
  templateUrl: './receive-material.component.html',
  styleUrls: ['./receive-material.component.css']
})
export class ReceiveMaterialComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  saving = false;
  error = '';
  successMessage = '';

  materials: Material[] = [];
  loadingMaterials = false;

  // Receipt result
  receiptResult: ReceiveMaterialResponse | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMaterials();
  }

  initForm(): void {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    this.form = this.fb.group({
      materialId: ['', [Validators.required]],
      materialName: [''],
      quantity: [null, [Validators.required, Validators.min(0.0001)]],
      unit: ['KG', [Validators.required, Validators.maxLength(20)]],
      supplierBatchNumber: ['', Validators.maxLength(100)],
      supplierId: ['', Validators.maxLength(50)],
      receivedDate: [today],
      location: ['', Validators.maxLength(200)],
      notes: ['', Validators.maxLength(500)]
    });
  }

  loadMaterials(): void {
    this.loadingMaterials = true;
    this.apiService.getActiveMaterials().subscribe({
      next: (materials) => {
        // Filter to only RM (Raw Material) types
        this.materials = materials.filter(m => m.materialType === 'RM');
        this.loadingMaterials = false;
      },
      error: (err) => {
        console.error('Failed to load materials:', err);
        this.loadingMaterials = false;
      }
    });
  }

  onMaterialChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const materialId = select.value;

    if (materialId) {
      const selected = this.materials.find(m => m.materialCode === materialId);
      if (selected) {
        this.form.patchValue({
          materialName: selected.materialName,
          unit: selected.baseUnit || 'KG'
        });
      }
    } else {
      this.form.patchValue({
        materialName: '',
        unit: 'KG'
      });
    }
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving = true;
    this.error = '';
    this.successMessage = '';
    this.receiptResult = null;

    const formValue = this.form.getRawValue();

    const request = {
      materialId: formValue.materialId,
      materialName: formValue.materialName || undefined,
      quantity: formValue.quantity,
      unit: formValue.unit || undefined,
      supplierBatchNumber: formValue.supplierBatchNumber || undefined,
      supplierId: formValue.supplierId || undefined,
      receivedDate: formValue.receivedDate || undefined,
      location: formValue.location || undefined,
      notes: formValue.notes || undefined
    };

    this.apiService.receiveMaterial(request).subscribe({
      next: (response) => {
        this.saving = false;
        this.receiptResult = response;
        this.successMessage = response.message;
        // Reset form for next entry
        this.initForm();
      },
      error: (err) => {
        this.saving = false;
        this.error = err.error?.message || 'Failed to receive material.';
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/inventory']);
  }

  viewBatch(): void {
    if (this.receiptResult?.batchId) {
      this.router.navigate(['/batches', this.receiptResult.batchId]);
    }
  }

  viewInventory(): void {
    if (this.receiptResult?.inventoryId) {
      this.router.navigate(['/inventory', this.receiptResult.inventoryId]);
    }
  }

  receiveAnother(): void {
    this.receiptResult = null;
    this.successMessage = '';
    this.error = '';
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return 'This field is required';
    if (control.errors['maxlength']) return 'Value is too long';
    if (control.errors['min']) return 'Quantity must be greater than 0';

    return 'Invalid value';
  }
}
