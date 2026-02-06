import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Inventory } from '../../../shared/models';

@Component({
  selector: 'app-inventory-form',
  templateUrl: './inventory-form.component.html',
  styleUrls: ['./inventory-form.component.css']
})
export class InventoryFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  inventoryId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  inventoryTypes = ['RM', 'IM', 'FG', 'WIP'];
  inventoryForms: any[] = [];
  selectedFormConfig: any = null;
  handlingNotes: string = '';

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadInventoryForms();

    this.form.get('inventoryForm')!.valueChanges.subscribe((value: string) => {
      this.onFormChange(value);
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.inventoryId = +id;
      this.loadInventory();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      materialId: ['', [Validators.required, Validators.maxLength(100)]],
      materialName: ['', Validators.maxLength(200)],
      inventoryType: ['', Validators.required],
      quantity: [null, Validators.required],
      unit: ['T', Validators.maxLength(20)],
      location: ['', Validators.maxLength(200)],
      state: ['AVAILABLE'],
      inventoryForm: [''],
      currentTemperature: [null],
      moistureContent: [null],
      density: [null]
    });
  }

  loadInventoryForms(): void {
    this.apiService.getInventoryForms().subscribe({
      next: (forms: any[]) => {
        this.inventoryForms = forms;
      },
      error: () => {
        // Inventory forms are optional; silently ignore load failures
      }
    });
  }

  onFormChange(formCode: string): void {
    if (!formCode) {
      this.selectedFormConfig = null;
      this.handlingNotes = '';
      return;
    }

    this.apiService.getInventoryFormConfig(formCode).subscribe({
      next: (config: any) => {
        this.selectedFormConfig = config;
        this.handlingNotes = config?.handling_notes || '';
      },
      error: () => {
        this.selectedFormConfig = null;
        this.handlingNotes = '';
      }
    });
  }

  loadInventory(): void {
    if (!this.inventoryId) return;

    this.loading = true;
    this.apiService.getInventoryById(this.inventoryId).subscribe({
      next: (inventory: Inventory) => {
        this.form.patchValue({
          materialId: inventory.materialId,
          materialName: inventory.materialName || '',
          inventoryType: inventory.inventoryType,
          quantity: inventory.quantity,
          unit: inventory.unit || 'T',
          location: inventory.location || '',
          state: inventory.state,
          inventoryForm: (inventory as any).inventoryForm || '',
          currentTemperature: (inventory as any).currentTemperature || null,
          moistureContent: (inventory as any).moistureContent || null,
          density: (inventory as any).density || null
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load inventory.';
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

    if (this.isEditMode && this.inventoryId) {
      const updateRequest = {
        materialId: formValue.materialId,
        materialName: formValue.materialName || undefined,
        inventoryType: formValue.inventoryType,
        quantity: formValue.quantity,
        unit: formValue.unit || undefined,
        location: formValue.location || undefined,
        state: formValue.state,
        inventoryForm: formValue.inventoryForm || undefined,
        currentTemperature: formValue.currentTemperature,
        moistureContent: formValue.moistureContent,
        density: formValue.density
      };

      this.apiService.updateInventory(this.inventoryId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/inventory']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update inventory.';
        }
      });
    } else {
      const createRequest = {
        materialId: formValue.materialId,
        materialName: formValue.materialName || undefined,
        inventoryType: formValue.inventoryType,
        quantity: formValue.quantity,
        unit: formValue.unit || undefined,
        location: formValue.location || undefined,
        inventoryForm: formValue.inventoryForm || undefined,
        currentTemperature: formValue.currentTemperature,
        moistureContent: formValue.moistureContent,
        density: formValue.density
      };

      this.apiService.createInventory(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/inventory']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create inventory.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/inventory']);
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
