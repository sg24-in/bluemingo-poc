import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { Process } from '../../../shared/models';

@Component({
  selector: 'app-process-form',
  templateUrl: './process-form.component.html',
  styleUrls: ['./process-form.component.css']
})
export class ProcessFormComponent implements OnInit {
  form!: FormGroup;
  isEditMode = false;
  processId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  // Design-time statuses for process templates (per MES Consolidated Spec)
  // Runtime statuses (READY, IN_PROGRESS, etc.) are for ProcessInstance execution tracking
  statuses = ['DRAFT', 'ACTIVE', 'INACTIVE'];

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
      this.processId = +id;
      this.loadProcess();
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      processName: ['', [Validators.required, Validators.maxLength(200)]],
      status: ['DRAFT']  // New templates start as DRAFT
    });
  }

  loadProcess(): void {
    if (!this.processId) return;

    this.loading = true;
    this.apiService.getProcessById(this.processId).subscribe({
      next: (process: Process) => {
        this.form.patchValue({
          processName: process.processName,
          status: process.status || 'DRAFT'
        });
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load process.';
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

    if (this.isEditMode && this.processId) {
      const updateRequest = {
        processName: formValue.processName,
        status: formValue.status
      };

      this.apiService.updateProcess(this.processId, updateRequest).subscribe({
        next: () => {
          this.saving = false;
          this.navigateBack();
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to update process.';
        }
      });
    } else {
      const createRequest = {
        processName: formValue.processName,
        status: formValue.status
      };

      this.apiService.createProcess(createRequest).subscribe({
        next: () => {
          this.saving = false;
          this.navigateBack();
        },
        error: (err) => {
          this.saving = false;
          this.error = err.error?.message || 'Failed to create process.';
        }
      });
    }
  }

  cancel(): void {
    this.navigateBack();
  }

  private navigateBack(): void {
    // Navigate to the appropriate list based on context
    // Check if we came from /manage/processes or /processes
    const currentUrl = this.router.url;
    if (currentUrl.includes('/manage/')) {
      this.router.navigate(['/manage/processes']);
    } else {
      this.router.navigate(['/processes/list']);
    }
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

    return 'Invalid value';
  }

  private getFieldLabel(field: string): string {
    const labels: { [key: string]: string } = {
      processName: 'Process Name',
      status: 'Status'
    };
    return labels[field] || field;
  }
}
