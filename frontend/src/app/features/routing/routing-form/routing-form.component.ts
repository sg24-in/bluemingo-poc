import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface Process {
  processId: number;
  processName: string;
  status: string;
}

interface RoutingStep {
  routingStepId?: number;
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

  // Step editing
  showStepModal = false;
  editingStep: RoutingStep | null = null;
  editingStepIndex: number | null = null;

  routingTypes = [
    { value: 'SEQUENTIAL', label: 'Sequential' },
    { value: 'PARALLEL', label: 'Parallel' }
  ];

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
      operationName: ['', [Validators.required, Validators.maxLength(100)]],
      operationType: ['', Validators.required],
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
      sequenceNumber: this.steps.length + 1,
      isParallel: false,
      mandatoryFlag: true,
      producesOutputBatch: false,
      allowsSplit: false,
      allowsMerge: false
    });
    this.showStepModal = true;
  }

  openEditStep(step: RoutingStep, index: number): void {
    this.editingStep = step;
    this.editingStepIndex = index;
    this.stepForm.patchValue(step);
    this.showStepModal = true;
  }

  closeStepModal(): void {
    this.showStepModal = false;
    this.editingStep = null;
    this.editingStepIndex = null;
  }

  saveStep(): void {
    if (this.stepForm.invalid) {
      Object.keys(this.stepForm.controls).forEach(key => {
        this.stepForm.get(key)?.markAsTouched();
      });
      return;
    }

    const stepData: RoutingStep = {
      ...this.stepForm.value,
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
}
