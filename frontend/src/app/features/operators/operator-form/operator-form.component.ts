import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

@Component({
  selector: 'app-operator-form',
  templateUrl: './operator-form.component.html',
  styleUrls: ['./operator-form.component.css']
})
export class OperatorFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  operatorId: number | null = null;
  loading = false;
  saving = false;
  error = '';

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
      this.operatorId = +id;
      this.form.get('operatorCode')?.disable();
      this.loadOperator();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      operatorCode: ['', [Validators.required, Validators.maxLength(50)]],
      name: ['', [Validators.required, Validators.maxLength(200)]],
      department: ['', Validators.maxLength(100)],
      shift: ['', Validators.maxLength(50)],
      status: ['ACTIVE']
    });
  }

  loadOperator(): void {
    if (!this.operatorId) return;

    this.loading = true;
    this.apiService.getOperatorById(this.operatorId).subscribe({
      next: (operator) => {
        this.form.patchValue({
          operatorCode: operator.operatorCode,
          name: operator.name,
          department: operator.department || '',
          shift: operator.shift || '',
          status: operator.status
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load operator.';
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

    if (this.isEditMode && this.operatorId) {
      this.apiService.updateOperator(this.operatorId, formValue).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/operators']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update operator.';
        }
      });
    } else {
      this.apiService.createOperator(formValue).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/operators']);
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create operator.';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/operators']);
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!(control && control.invalid && control.touched);
  }

  getError(field: string): string {
    const control = this.form.get(field);
    if (!control || !control.errors) return '';
    if (control.errors['required']) return 'This field is required';
    if (control.errors['maxlength']) return `Maximum ${control.errors['maxlength'].requiredLength} characters`;
    return 'Invalid value';
  }
}
