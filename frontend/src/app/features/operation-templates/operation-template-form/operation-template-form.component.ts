import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import {
  OperationTemplate,
  OPERATION_TYPES,
  QUANTITY_TYPES
} from '../../../shared/models/operation-template.model';

@Component({
  selector: 'app-operation-template-form',
  templateUrl: './operation-template-form.component.html',
  styleUrls: ['./operation-template-form.component.css']
})
export class OperationTemplateFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  templateId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  operationTypes = OPERATION_TYPES;
  quantityTypes = QUANTITY_TYPES;

  equipmentTypes = [
    { value: 'EAF', label: 'Electric Arc Furnace' },
    { value: 'CASTER', label: 'Continuous Caster' },
    { value: 'HOT_MILL', label: 'Hot Rolling Mill' },
    { value: 'COLD_MILL', label: 'Cold Rolling Mill' },
    { value: 'ANNEALING', label: 'Annealing Furnace' },
    { value: 'COATING', label: 'Coating Line' },
    { value: 'SLITTER', label: 'Slitter' },
    { value: 'SHEAR', label: 'Shear Line' },
    { value: 'INSPECTION', label: 'Inspection Station' },
    { value: 'GENERAL', label: 'General Equipment' }
  ];

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
      this.templateId = +id;
      this.form.get('operationCode')?.disable();
      this.loadTemplate();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      operationCode: ['', [Validators.maxLength(50)]],
      operationName: ['', [Validators.required, Validators.maxLength(200)]],
      operationType: ['GENERAL', Validators.required],
      quantityType: ['DISCRETE', Validators.required],
      defaultEquipmentType: [''],
      description: ['', Validators.maxLength(500)],
      estimatedDurationMinutes: [null, [Validators.min(1), Validators.max(10000)]],
      status: ['ACTIVE']
    });
  }

  loadTemplate(): void {
    if (!this.templateId) return;

    this.loading = true;
    this.apiService.getOperationTemplateById(this.templateId).subscribe({
      next: (template: OperationTemplate) => {
        this.form.patchValue({
          operationCode: template.operationCode || '',
          operationName: template.operationName,
          operationType: template.operationType,
          quantityType: template.quantityType,
          defaultEquipmentType: template.defaultEquipmentType || '',
          description: template.description || '',
          estimatedDurationMinutes: template.estimatedDurationMinutes || null,
          status: template.status
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load operation template.';
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

    if (this.isEditMode && this.templateId) {
      const updateRequest = {
        operationCode: formValue.operationCode || undefined,
        operationName: formValue.operationName,
        operationType: formValue.operationType,
        quantityType: formValue.quantityType,
        defaultEquipmentType: formValue.defaultEquipmentType || undefined,
        description: formValue.description || undefined,
        estimatedDurationMinutes: formValue.estimatedDurationMinutes || undefined,
        status: formValue.status
      };

      this.apiService.updateOperationTemplate(this.templateId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/operation-templates']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update operation template.';
        }
      });
    } else {
      const createRequest = {
        operationCode: formValue.operationCode || undefined,
        operationName: formValue.operationName,
        operationType: formValue.operationType,
        quantityType: formValue.quantityType,
        defaultEquipmentType: formValue.defaultEquipmentType || undefined,
        description: formValue.description || undefined,
        estimatedDurationMinutes: formValue.estimatedDurationMinutes || undefined
      };

      this.apiService.createOperationTemplate(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/operation-templates']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create operation template.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/operation-templates']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `${this.getFieldLabel(field)} is required`;
    if (control.errors['maxlength']) return `${this.getFieldLabel(field)} is too long`;
    if (control.errors['min']) return `${this.getFieldLabel(field)} must be at least 1`;
    if (control.errors['max']) return `${this.getFieldLabel(field)} must be less than 10000`;

    return 'Invalid value';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      operationCode: 'Operation Code',
      operationName: 'Operation Name',
      operationType: 'Operation Type',
      quantityType: 'Quantity Type',
      defaultEquipmentType: 'Default Equipment Type',
      description: 'Description',
      estimatedDurationMinutes: 'Estimated Duration'
    };
    return labels[field] || field;
  }
}
