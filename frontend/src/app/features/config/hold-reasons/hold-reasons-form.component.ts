import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-hold-reasons-form',
  templateUrl: './hold-reasons-form.component.html',
  styleUrls: ['./hold-reasons-form.component.css']
})
export class HoldReasonsFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  entityTypes = ['ORDER', 'ORDER_LINE', 'OPERATION', 'PROCESS', 'BATCH', 'INVENTORY', 'EQUIPMENT'];
  selectedEntityTypes: Set<string> = new Set();

  constructor(private fb: FormBuilder, private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      reasonCode: ['', [Validators.required, Validators.maxLength(50)]],
      reasonDescription: ['', [Validators.required, Validators.maxLength(255)]],
      applicableTo: [''],
      status: ['ACTIVE']
    });
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.itemId = +id;
      this.form.get('reasonCode')?.disable();
      this.loadItem();
    }
  }

  loadItem(): void {
    if (!this.itemId) return;
    this.loading = true;
    this.apiService.getHoldReasonById(this.itemId).subscribe({
      next: (item) => {
        this.form.patchValue({ reasonCode: item.reasonCode, reasonDescription: item.reasonDescription, applicableTo: item.applicableTo || '', status: item.status });
        this.parseApplicableTo(item.applicableTo || '');
        this.loading = false;
      },
      error: (err) => { this.error = err.error?.message || 'Failed to load.'; this.loading = false; }
    });
  }

  toggleEntityType(type: string): void {
    if (this.selectedEntityTypes.has(type)) {
      this.selectedEntityTypes.delete(type);
    } else {
      this.selectedEntityTypes.add(type);
    }
    this.syncApplicableTo();
  }

  isEntityTypeSelected(type: string): boolean {
    return this.selectedEntityTypes.has(type);
  }

  selectAllEntityTypes(): void {
    this.entityTypes.forEach(t => this.selectedEntityTypes.add(t));
    this.syncApplicableTo();
  }

  clearAllEntityTypes(): void {
    this.selectedEntityTypes.clear();
    this.syncApplicableTo();
  }

  private parseApplicableTo(value: string): void {
    this.selectedEntityTypes.clear();
    if (value) {
      value.split(',').map(s => s.trim()).filter(s => s && this.entityTypes.includes(s)).forEach(s => this.selectedEntityTypes.add(s));
    }
  }

  private syncApplicableTo(): void {
    const value = Array.from(this.selectedEntityTypes).join(',');
    this.form.patchValue({ applicableTo: value });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.saving = true; this.error = '';
    const val = this.form.getRawValue();
    if (this.isEditMode && this.itemId) {
      this.apiService.updateHoldReason(this.itemId, val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/hold-reasons']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to update.'; }
      });
    } else {
      this.apiService.createHoldReason(val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/hold-reasons']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to create.'; }
      });
    }
  }

  cancel(): void { this.router.navigate(['/manage/config/hold-reasons']); }
  hasError(field: string): boolean { const c = this.form.get(field); return !!(c && c.invalid && c.touched); }
}
