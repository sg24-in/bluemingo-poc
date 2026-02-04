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

  materialTypes = [
    { value: 'RM', label: 'Raw Material' },
    { value: 'IM', label: 'Intermediate' },
    { value: 'FG', label: 'Finished Goods' },
    { value: 'WIP', label: 'Work In Progress' }
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
      this.loadMaterial();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      materialCode: ['', [Validators.required, Validators.maxLength(50)]],
      materialName: ['', [Validators.required, Validators.maxLength(200)]],
      materialType: ['RM', Validators.required],
      description: ['', Validators.maxLength(500)],
      baseUnit: ['', [Validators.required, Validators.maxLength(20)]],
      status: ['ACTIVE']
    });

    // Material code cannot be changed in edit mode
    if (this.isEditMode) {
      this.form.get('materialCode')?.disable();
    }
  }

  loadMaterial(): void {
    if (!this.materialId) return;

    this.loading = true;
    this.apiService.getMaterialById(this.materialId).subscribe({
      next: (material: Material) => {
        this.form.patchValue({
          materialCode: material.materialCode,
          materialName: material.materialName,
          materialType: material.materialType,
          description: material.description || '',
          baseUnit: material.baseUnit,
          status: material.status
        });
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

    if (this.isEditMode && this.materialId) {
      const updateRequest = {
        materialCode: formValue.materialCode,
        materialName: formValue.materialName,
        materialType: formValue.materialType,
        description: formValue.description || undefined,
        baseUnit: formValue.baseUnit,
        status: formValue.status
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
        baseUnit: formValue.baseUnit
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
