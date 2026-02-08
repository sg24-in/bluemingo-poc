import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Product, Material, UNITS_OF_MEASURE } from '../../../shared/models';

@Component({
  selector: 'app-product-form',
  templateUrl: './product-form.component.html',
  styleUrls: ['./product-form.component.css']
})
export class ProductFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  productId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  // TASK-M4: Track expanded sections
  showExtendedFields = false;

  // TASK-M4: Materials for linking
  materials: Material[] = [];

  units = UNITS_OF_MEASURE;

  // TASK-M4: Weight unit options
  weightUnits = [
    { value: 'KG', label: 'Kilograms (KG)' },
    { value: 'T', label: 'Metric Tons (T)' },
    { value: 'LB', label: 'Pounds (LB)' },
    { value: 'G', label: 'Grams (G)' }
  ];

  // TASK-M4: Currency options
  currencies = [
    { value: 'USD', label: 'USD - US Dollar' },
    { value: 'EUR', label: 'EUR - Euro' },
    { value: 'INR', label: 'INR - Indian Rupee' },
    { value: 'GBP', label: 'GBP - British Pound' },
    { value: 'JPY', label: 'JPY - Japanese Yen' }
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadMaterials();  // TASK-M4: Load materials for linking

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.productId = +id;
      this.form.get('sku')?.disable();
      this.loadProduct();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      // Basic fields
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      productName: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(500)],
      baseUnit: ['', Validators.required],
      status: ['ACTIVE'],

      // TASK-M4: Classification fields
      productCategory: ['', Validators.maxLength(100)],
      productGroup: ['', Validators.maxLength(100)],

      // TASK-M4: Physical specifications
      weightPerUnit: [null, [Validators.min(0)]],
      weightUnit: ['KG'],

      // TASK-M4: Pricing fields
      standardPrice: [null, [Validators.min(0)]],
      priceCurrency: ['USD'],

      // TASK-M4: Order management fields
      minOrderQty: [null, [Validators.min(0)]],
      leadTimeDays: [null, [Validators.min(0), Validators.max(365)]],

      // TASK-M4: Material linkage
      materialId: [null]
    });
  }

  // TASK-M4: Load materials for linking
  loadMaterials(): void {
    this.apiService.getAllMaterials().subscribe({
      next: (materials: Material[]) => {
        this.materials = materials.filter(m => m.status === 'ACTIVE');
      },
      error: () => {
        // Silent fail - materials dropdown will be empty
      }
    });
  }

  // TASK-M4: Toggle extended fields section
  toggleExtendedFields(): void {
    this.showExtendedFields = !this.showExtendedFields;
  }

  loadProduct(): void {
    if (!this.productId) return;

    this.loading = true;
    this.apiService.getProductById(this.productId).subscribe({
      next: (product: Product) => {
        this.form.patchValue({
          // Basic fields
          sku: product.sku,
          productName: product.productName,
          description: product.description || '',
          baseUnit: product.baseUnit,
          status: product.status,

          // TASK-M4: Extended fields
          productCategory: product.productCategory || '',
          productGroup: product.productGroup || '',
          weightPerUnit: product.weightPerUnit,
          weightUnit: product.weightUnit || 'KG',
          standardPrice: product.standardPrice,
          priceCurrency: product.priceCurrency || 'USD',
          minOrderQty: product.minOrderQty,
          leadTimeDays: product.leadTimeDays,
          materialId: product.materialId
        });

        // Auto-expand extended fields if any are populated
        if (product.productCategory || product.productGroup || product.weightPerUnit ||
            product.standardPrice || product.minOrderQty || product.leadTimeDays ||
            product.materialId) {
          this.showExtendedFields = true;
        }

        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load product.';
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
      productCategory: formValue.productCategory || undefined,
      productGroup: formValue.productGroup || undefined,
      weightPerUnit: formValue.weightPerUnit ?? undefined,
      weightUnit: formValue.weightPerUnit ? formValue.weightUnit : undefined,
      standardPrice: formValue.standardPrice ?? undefined,
      priceCurrency: formValue.standardPrice ? formValue.priceCurrency : undefined,
      minOrderQty: formValue.minOrderQty ?? undefined,
      leadTimeDays: formValue.leadTimeDays ?? undefined,
      materialId: formValue.materialId ?? undefined
    };

    if (this.isEditMode && this.productId) {
      const updateRequest = {
        sku: formValue.sku,
        productName: formValue.productName,
        description: formValue.description || undefined,
        baseUnit: formValue.baseUnit,
        status: formValue.status,
        ...extendedFields
      };

      this.apiService.updateProduct(this.productId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/products']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update product.';
        }
      });
    } else {
      const createRequest = {
        sku: formValue.sku,
        productName: formValue.productName,
        description: formValue.description || undefined,
        baseUnit: formValue.baseUnit,
        ...extendedFields
      };

      this.apiService.createProduct(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/products']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create product.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/products']);
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
