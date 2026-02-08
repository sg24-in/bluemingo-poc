import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Material, UNITS_OF_MEASURE } from '../../../shared/models';

@Component({
  selector: 'app-material-form',
  templateUrl: './material-form.component.html',
  styleUrls: ['./material-form.component.css']
})
export class MaterialFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  materialId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  // TASK-M4: Track expanded sections
  showExtendedFields = false;

  materialTypes = [
    { value: 'RM', label: 'Raw Material' },
    { value: 'IM', label: 'Intermediate' },
    { value: 'FG', label: 'Finished Goods' },
    { value: 'WIP', label: 'Work In Progress' }
  ];

  // TASK-M4: Currency options
  currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' }
  ];

  units = UNITS_OF_MEASURE;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.materialId = +id;
      this.form.get('materialCode')?.disable();
      this.loadMaterial();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      // Basic fields
      materialCode: ['', [Validators.required, Validators.maxLength(50)]],
      materialName: ['', [Validators.required, Validators.maxLength(200)]],
      materialType: ['RM', Validators.required],
      description: ['', Validators.maxLength(500)],
      baseUnit: ['', [Validators.required, Validators.maxLength(20)]],
      status: ['ACTIVE'],

      // TASK-M4: Classification fields
      materialGroup: ['', Validators.maxLength(100)],
      sku: ['', Validators.maxLength(50)],

      // TASK-M4: Cost fields
      standardCost: [null, [Validators.min(0)]],
      costCurrency: ['USD'],

      // TASK-M4: Inventory management fields
      minStockLevel: [null, [Validators.min(0)]],
      maxStockLevel: [null, [Validators.min(0)]],
      reorderPoint: [null, [Validators.min(0)]],

      // TASK-M4: Logistics fields
      leadTimeDays: [null, [Validators.min(0), Validators.max(365)]],
      shelfLifeDays: [null, [Validators.min(0)]],
      storageConditions: ['', Validators.maxLength(200)]
    });
  }

  // TASK-M4: Toggle extended fields section
  toggleExtendedFields(): void {
    this.showExtendedFields = !this.showExtendedFields;
  }

  loadMaterial(): void {
    if (!this.materialId) return;

    this.loading = true;
    this.apiService.getMaterialById(this.materialId).subscribe({
      next: (material: Material) => {
        this.form.patchValue({
          // Basic fields
          materialCode: material.materialCode,
          materialName: material.materialName,
          materialType: material.materialType,
          description: material.description || '',
          baseUnit: material.baseUnit,
          status: material.status,

          // TASK-M4: Extended fields
          materialGroup: material.materialGroup || '',
          sku: material.sku || '',
          standardCost: material.standardCost,
          costCurrency: material.costCurrency || 'USD',
          minStockLevel: material.minStockLevel,
          maxStockLevel: material.maxStockLevel,
          reorderPoint: material.reorderPoint,
          leadTimeDays: material.leadTimeDays,
          shelfLifeDays: material.shelfLifeDays,
          storageConditions: material.storageConditions || ''
        });

        // Auto-expand extended fields if any are populated
        if (material.materialGroup || material.sku || material.standardCost ||
            material.minStockLevel || material.maxStockLevel || material.reorderPoint ||
            material.leadTimeDays || material.shelfLifeDays || material.storageConditions) {
          this.showExtendedFields = true;
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load material.';
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

    // TASK-M4: Build extended fields object (only include non-empty values)
    const extendedFields = {
      materialGroup: formValue.materialGroup || undefined,
      sku: formValue.sku || undefined,
      standardCost: formValue.standardCost ?? undefined,
      costCurrency: formValue.standardCost ? formValue.costCurrency : undefined,
      minStockLevel: formValue.minStockLevel ?? undefined,
      maxStockLevel: formValue.maxStockLevel ?? undefined,
      reorderPoint: formValue.reorderPoint ?? undefined,
      leadTimeDays: formValue.leadTimeDays ?? undefined,
      shelfLifeDays: formValue.shelfLifeDays ?? undefined,
      storageConditions: formValue.storageConditions || undefined
    };

    if (this.isEditMode && this.materialId) {
      const updateRequest = {
        materialCode: formValue.materialCode,
        materialName: formValue.materialName,
        materialType: formValue.materialType,
        description: formValue.description || undefined,
        baseUnit: formValue.baseUnit,
        status: formValue.status,
        ...extendedFields
      };

      this.apiService.updateMaterial(this.materialId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/materials']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update material.';
        }
      });
    } else {
      const createRequest = {
        materialCode: formValue.materialCode,
        materialName: formValue.materialName,
        materialType: formValue.materialType,
        description: formValue.description || undefined,
        baseUnit: formValue.baseUnit,
        ...extendedFields
      };

      this.apiService.createMaterial(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/materials']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create material.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/materials']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${field} is required`;
    if (control.errors['maxlength']) return `${field} is too long`;

    return 'Invalid value';
  }
}
