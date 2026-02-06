import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Product, UNITS_OF_MEASURE } from '../../../shared/models';

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
      this.productId = +id;
      this.form.get('sku')?.disable();
      this.loadProduct();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      sku: ['', [Validators.required, Validators.maxLength(50)]],
      productName: ['', [Validators.required, Validators.maxLength(200)]],
      description: ['', Validators.maxLength(500)],
      baseUnit: ['', Validators.required],
      status: ['ACTIVE']
    });

  }

  loadProduct(): void {
    if (!this.productId) return;

    this.loading = true;
    this.apiService.getProductById(this.productId).subscribe({
      next: (product: Product) => {
        this.form.patchValue({
          sku: product.sku,
          productName: product.productName,
          description: product.description || '',
          baseUnit: product.baseUnit,
          status: product.status
        });
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

    if (this.isEditMode && this.productId) {
      const updateRequest = {
        sku: formValue.sku,
        productName: formValue.productName,
        description: formValue.description || undefined,
        baseUnit: formValue.baseUnit,
        status: formValue.status
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
        baseUnit: formValue.baseUnit
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
