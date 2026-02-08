import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { OperationTemplateSummary } from '../../../shared/models/operation-template.model';

interface Process {
  processId: number;
  processName: string;
  status: string;
}

interface RoutingStep {
  routingStepId?: number;
  operationTemplateId?: number;  // Reference to OperationTemplate
  operationName: string;
  operationType: string;
  operationCode?: string;
  sequenceNumber: number;
  isParallel: boolean;
  mandatoryFlag: boolean;
  producesOutputBatch?: boolean;
  allowsSplit?: boolean;
  allowsMerge?: boolean;
  status?: string;
  estimatedDurationMinutes?: number;
  description?: string;
}

@Component({
  selector: 'app-routing-form',
  templateUrl: './routing-form.component.html',
  styleUrls: ['./routing-form.component.css']
})
export class RoutingFormComponent implements OnInit {
  form!: FormGroup;
  stepForm!: FormGroup;
  isEditMode = false;
  routingId: number | null = null;
  loading = false;
  saving = false;
  error = '';

  processes: Process[] = [];
  steps: RoutingStep[] = [];
  operationTemplates: OperationTemplateSummary[] = [];

  // Step editing
  showStepModal = false;
  editingStep: RoutingStep | null = null;
  editingStepIndex: number | null = null;

  routingTypes = [
    { value: 'SEQUENTIAL', label: 'Sequential' },
    { value: 'PARALLEL', label: 'Parallel' }
  ];

  // Legacy operation types (used when no template selected)
  operationTypes = [
    'MELTING', 'CASTING', 'ROLLING', 'CUTTING', 'INSPECTION', 'PACKAGING', 'OTHER'
  ];

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.initForms();
    this.loadProcesses();
    this.loadOperationTemplates();

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.isEditMode = true;
      this.routingId = +id;
      this.loadRouting(this.routingId);
    }
  }

  initForms(): void {
    this.form = this.fb.group({
      routingName: ['', [Validators.required, Validators.maxLength(100)]],
      processId: ['', Validators.required],
      routingType: ['SEQUENTIAL', Validators.required]
    });

    this.stepForm = this.fb.group({
      operationTemplateId: [null],  // Optional template reference
      operationName: ['', [Validators.maxLength(100)]],  // Required if no template
      operationType: [''],  // Required if no template
      operationCode: ['', Validators.maxLength(50)],
      sequenceNumber: [1, [Validators.required, Validators.min(1)]],
      isParallel: [false],
      mandatoryFlag: [true],
      producesOutputBatch: [false],
      allowsSplit: [false],
      allowsMerge: [false],
      estimatedDurationMinutes: [null, Validators.min(1)],
      description: ['', Validators.maxLength(500)]
    });
  }

  loadProcesses(): void {
    this.apiService.getAllProcesses().subscribe({
      next: (data) => {
        this.processes = data;
      },
      error: (err) => {
        console.error('Failed to load processes', err);
      }
    });
  }

  loadOperationTemplates(): void {
    this.apiService.getActiveOperationTemplates().subscribe({
      next: (data) => {
        this.operationTemplates = data;
      },
      error: (err) => {
        console.error('Failed to load operation templates', err);
      }
    });
  }

  onTemplateChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const templateId = select.value ? +select.value : null;

    if (templateId) {
      const template = this.operationTemplates.find(t => t.operationTemplateId === templateId);
      if (template) {
        // Auto-populate fields from template
        this.stepForm.patchValue({
          operationName: template.operationName,
          operationType: template.operationType,
          operationCode: template.operationCode || ''
        });
        // Fetch full template to get duration
        this.apiService.getOperationTemplateById(templateId).subscribe({
          next: (fullTemplate) => {
            if (fullTemplate.estimatedDurationMinutes) {
              this.stepForm.patchValue({
                estimatedDurationMinutes: fullTemplate.estimatedDurationMinutes
              });
            }
          }
        });
      }
    } else {
      // Clear fields when "No Template" is selected
      this.stepForm.patchValue({
        operationName: '',
        operationType: '',
        operationCode: '',
        estimatedDurationMinutes: null
      });
    }
  }

  loadRouting(id: number): void {
    this.loading = true;
    this.apiService.getRoutingById(id).subscribe({
      next: (routing) => {
        this.form.patchValue({
          routingName: routing.routingName,
          processId: routing.processId,
          routingType: routing.routingType
        });
        this.steps = (routing.steps || []).map((s: any) => ({
          routingStepId: s.routingStepId,
          operationTemplateId: s.operationTemplateId || null,
          operationName: s.operationName || '',
          operationType: s.operationType || '',
          operationCode: s.operationCode || '',
          sequenceNumber: s.sequenceNumber,
          isParallel: s.isParallel || false,
          mandatoryFlag: s.mandatoryFlag !== false,
          producesOutputBatch: s.producesOutputBatch || false,
          allowsSplit: s.allowsSplit || false,
          allowsMerge: s.allowsMerge || false,
          status: s.status,
          estimatedDurationMinutes: s.estimatedDurationMinutes,
          description: s.description
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = err.error?.message || 'Failed to load routing';
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      Object.keys(this.form.controls).forEach(key => {
        this.form.get(key)?.markAsTouched();
      });
      return;
    }

    this.saving = true;
    this.error = '';

    const request = {
      ...this.form.value,
      processId: +this.form.value.processId
    };

    if (this.isEditMode && this.routingId) {
      this.apiService.updateRouting(this.routingId, request).subscribe({
        next: () => {
          this.saving = false;
          this.router.navigate(['/manage/routing']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update routing';
          this.saving = false;
        }
      });
    } else {
      this.apiService.createRouting(request).subscribe({
        next: (routing) => {
          // Save steps if any
          if (this.steps.length > 0) {
            this.saveSteps(routing.routingId);
          } else {
            this.saving = false;
            this.router.navigate(['/manage/routing']);
          }
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create routing';
          this.saving = false;
        }
      });
    }
  }

  saveSteps(routingId: number): void {
    // Save steps sequentially
    let completed = 0;
    for (const step of this.steps) {
      if (!step.routingStepId) {
        this.apiService.createRoutingStep(routingId, step).subscribe({
          next: () => {
            completed++;
            if (completed === this.steps.filter(s => !s.routingStepId).length) {
              this.saving = false;
              this.router.navigate(['/manage/routing']);
            }
          },
          error: (err) => {
            console.error('Failed to save step', err);
          }
        });
      } else {
        completed++;
      }
    }
    if (completed === this.steps.length) {
      this.saving = false;
      this.router.navigate(['/manage/routing']);
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/routing']);
  }

  // Step Management
  openAddStep(): void {
    this.editingStep = null;
    this.editingStepIndex = null;
    this.stepForm.reset({
      operationTemplateId: null,
      operationName: '',
      operationType: '',
      operationCode: '',
      sequenceNumber: this.steps.length + 1,
      isParallel: false,
      mandatoryFlag: true,
      producesOutputBatch: false,
      allowsSplit: false,
      allowsMerge: false,
      estimatedDurationMinutes: null,
      description: ''
    });
    this.showStepModal = true;
  }

  openEditStep(step: RoutingStep, index: number): void {
    this.editingStep = step;
    this.editingStepIndex = index;
    this.stepForm.patchValue({
      operationTemplateId: step.operationTemplateId || null,
      operationName: step.operationName,
      operationType: step.operationType,
      operationCode: step.operationCode || '',
      sequenceNumber: step.sequenceNumber,
      isParallel: step.isParallel,
      mandatoryFlag: step.mandatoryFlag,
      producesOutputBatch: step.producesOutputBatch || false,
      allowsSplit: step.allowsSplit || false,
      allowsMerge: step.allowsMerge || false,
      estimatedDurationMinutes: step.estimatedDurationMinutes || null,
      description: step.description || ''
    });
    this.showStepModal = true;
  }

  closeStepModal(): void {
    this.showStepModal = false;
    this.editingStep = null;
    this.editingStepIndex = null;
  }

  saveStep(): void {
    const formValue = this.stepForm.value;

    // Validate: either template or manual entry required
    if (!formValue.operationTemplateId && !formValue.operationName) {
      this.stepForm.get('operationName')?.setErrors({ required: true });
      this.stepForm.get('operationName')?.markAsTouched();
      return;
    }
    if (!formValue.operationTemplateId && !formValue.operationType) {
      this.stepForm.get('operationType')?.setErrors({ required: true });
      this.stepForm.get('operationType')?.markAsTouched();
      return;
    }

    if (this.stepForm.invalid) {
      Object.keys(this.stepForm.controls).forEach(key => {
        this.stepForm.get(key)?.markAsTouched();
      });
      return;
    }

    const stepData: RoutingStep = {
      ...formValue,
      operationTemplateId: formValue.operationTemplateId ? +formValue.operationTemplateId : undefined,
      routingStepId: this.editingStep?.routingStepId
    };

    if (this.editingStepIndex !== null) {
      // Update existing step
      this.steps[this.editingStepIndex] = stepData;

      // If it's a saved step, update via API
      if (stepData.routingStepId && this.routingId) {
        this.apiService.updateRoutingStep(stepData.routingStepId, stepData).subscribe({
          error: (err) => console.error('Failed to update step', err)
        });
      }
    } else {
      // Add new step
      this.steps.push(stepData);

      // If routing exists, create via API
      if (this.routingId) {
        this.apiService.createRoutingStep(this.routingId, stepData).subscribe({
          next: (savedStep) => {
            const idx = this.steps.findIndex(s => s === stepData);
            if (idx >= 0) {
              this.steps[idx].routingStepId = savedStep.routingStepId;
            }
          },
          error: (err) => console.error('Failed to create step', err)
        });
      }
    }

    this.closeStepModal();
  }

  deleteStep(index: number): void {
    const step = this.steps[index];

    if (step.mandatoryFlag) {
      alert('Cannot delete mandatory step');
      return;
    }

    if (confirm('Delete this step?')) {
      if (step.routingStepId) {
        this.apiService.deleteRoutingStep(step.routingStepId).subscribe({
          next: () => {
            this.steps.splice(index, 1);
          },
          error: (err) => {
            alert(err.error?.message || 'Failed to delete step');
          }
        });
      } else {
        this.steps.splice(index, 1);
      }
    }
  }

  moveStepUp(index: number): void {
    if (index > 0) {
      const temp = this.steps[index];
      this.steps[index] = this.steps[index - 1];
      this.steps[index - 1] = temp;
      this.updateSequenceNumbers();
    }
  }

  moveStepDown(index: number): void {
    if (index < this.steps.length - 1) {
      const temp = this.steps[index];
      this.steps[index] = this.steps[index + 1];
      this.steps[index + 1] = temp;
      this.updateSequenceNumbers();
    }
  }

  updateSequenceNumbers(): void {
    this.steps.forEach((step, idx) => {
      step.sequenceNumber = idx + 1;
    });

    // If routing exists, reorder via API
    if (this.routingId && this.steps.every(s => s.routingStepId)) {
      const stepIds = this.steps.map(s => s.routingStepId!);
      this.apiService.reorderRoutingSteps(this.routingId, stepIds).subscribe({
        error: (err) => console.error('Failed to reorder steps', err)
      });
    }
  }

  hasError(field: string): boolean {
    const control = this.form.get(field);
    return !!control && control.invalid && control.touched;
  }

  hasStepError(field: string): boolean {
    const control = this.stepForm.get(field);
    return !!control && control.invalid && control.touched;
  }

  get title(): string {
    return this.isEditMode ? 'Edit Routing' : 'Create Routing';
  }

  getTemplateName(templateId: number | undefined): string {
    if (!templateId) return '-';
    const template = this.operationTemplates.find(t => t.operationTemplateId === templateId);
    return template ? template.operationName : `Template #${templateId}`;
  }
}
