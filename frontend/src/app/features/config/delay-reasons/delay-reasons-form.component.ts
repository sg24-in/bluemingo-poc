import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-delay-reasons-form',
  templateUrl: './delay-reasons-form.component.html',
  styleUrls: ['./delay-reasons-form.component.css']
})
export class DelayReasonsFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  itemId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  constructor(private fb: FormBuilder, private apiService: ApiService, private route: ActivatedRoute, private router: Router) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      reasonCode: ['', [Validators.required, Validators.maxLength(50)]],
      reasonDescription: ['', [Validators.required, Validators.maxLength(255)]],
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
    this.apiService.getDelayReasonById(this.itemId).subscribe({
      next: (item) => {
        this.form.patchValue({ reasonCode: item.reasonCode, reasonDescription: item.reasonDescription, status: item.status });
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
      this.apiService.updateDelayReason(this.itemId, val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/delay-reasons']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to update.'; }
      });
    } else {
      this.apiService.createDelayReason(val).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/manage/config/delay-reasons']); },
        error: (err) => { this.saving = false; this.error = err.error?.message || 'Failed to create.'; }
      });
    }
  }

  cancel(): void { this.router.navigate(['/manage/config/delay-reasons']); }
  hasError(field: string): boolean { const c = this.form.get(field); return !!(c && c.invalid && c.touched); }
}
