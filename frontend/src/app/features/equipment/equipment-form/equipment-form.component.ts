import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Equipment } from '../../../shared/models';

@Component({
  selector: 'app-equipment-form',
  templateUrl: './equipment-form.component.html',
  styleUrls: ['./equipment-form.component.css']
})
export class EquipmentFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  equipmentId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  equipmentTypes = ['FURNACE', 'CASTER', 'ROLLING_MILL', 'BATCH', 'CONTINUOUS'];

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
      this.equipmentId = +id;
      this.loadEquipment();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      equipmentCode: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      equipmentType: ['', Validators.required],
      capacity: [null],
      capacityUnit: [''],
      location: [''],
      status: ['AVAILABLE']
    });
  }

  loadEquipment(): void {
    if (!this.equipmentId) return;

    this.loading = true;
    this.apiService.getEquipmentById(this.equipmentId).subscribe({
      next: (equipment: Equipment) => {
        this.form.patchValue({
          equipmentCode: equipment.equipmentCode,
          name: equipment.name,
          equipmentType: equipment.equipmentType,
          capacity: equipment.capacity || null,
          capacityUnit: equipment.capacityUnit || '',
          location: equipment.location || '',
          status: equipment.status
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load equipment.';
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

    if (this.isEditMode && this.equipmentId) {
      const updateRequest = {
        equipmentCode: formValue.equipmentCode,
        name: formValue.name,
        equipmentType: formValue.equipmentType,
        capacity: formValue.capacity || undefined,
        capacityUnit: formValue.capacityUnit || undefined,
        location: formValue.location || undefined,
        status: formValue.status
      };

      this.apiService.updateEquipment(this.equipmentId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/equipment']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update equipment.';
        }
      });
    } else {
      const createRequest = {
        equipmentCode: formValue.equipmentCode,
        name: formValue.name,
        equipmentType: formValue.equipmentType,
        capacity: formValue.capacity || undefined,
        capacityUnit: formValue.capacityUnit || undefined,
        location: formValue.location || undefined
      };

      this.apiService.createEquipment(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/equipment']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create equipment.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/equipment']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';

    if (control.errors['required']) return `This field is required`;
    if (control.errors['maxlength']) return `Value is too long`;

    return 'Invalid value';
  }
}
