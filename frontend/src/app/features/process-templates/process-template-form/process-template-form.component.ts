import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface ProcessDefinition {
  processId: number;
  processName: string;
  processCode: string;
  description?: string;
  productSku?: string;
  status: string;
  version: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isEffective?: boolean;
  routingSteps?: RoutingStepDefinition[];
  createdOn?: string;
  createdBy?: string;
}

interface RoutingStepDefinition {
  routingStepId?: number;
  sequenceNumber: number;
  operationName: string;
  operationType?: string;
  operationCode?: string;
  description?: string;
  targetQty?: number;
  estimatedDurationMinutes?: number;
  isParallel?: boolean;
  mandatoryFlag?: boolean;
  producesOutputBatch?: boolean;
  allowsSplit?: boolean;
  allowsMerge?: boolean;
  status?: string;
}

@Component({
  selector: 'app-process-form',
  templateUrl: './process-template-form.component.html',
  styleUrls: ['./process-template-form.component.css']
})
export class ProcessTemplateFormComponent implements OnInit {
  processForm!: FormGroup;
  processId: number | null = null;
  process: ProcessDefinition | null = null;
  loading = true;
  saving = false;
  error = '';
  successMessage = '';
  isViewMode = false;
  isEditMode = false;

  operationTypes = ['PRODUCTION', 'QUALITY_CHECK', 'PACKAGING', 'ASSEMBLY', 'INSPECTION'];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.initForm();

    const id = this.route.snapshot.paramMap.get('id');
    const path = this.route.snapshot.routeConfig?.path || '';

    if (id && id !== 'new') {
      this.processId = +id;
      this.isViewMode = !path.includes('edit');
      this.isEditMode = path.includes('edit');
      this.loadProcess();
    } else {
      this.loading = false;
    }
  }

  initForm(): void {
    this.processForm = this.fb.group({
      processName: ['', [Validators.required, Validators.maxLength(100)]],
      processCode: ['', [Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(500)]],
      productSku: [''],
      version: ['1.0', [Validators.required]],
      effectiveFrom: [''],
      effectiveTo: [''],
      routingSteps: this.fb.array([])
    });
  }

  get routingSteps(): FormArray {
    return this.processForm.get('routingSteps') as FormArray;
  }

  createStepFormGroup(step?: RoutingStepDefinition): FormGroup {
    return this.fb.group({
      routingStepId: [step?.routingStepId || null],
      sequenceNumber: [step?.sequenceNumber || this.routingSteps.length + 1, Validators.required],
      operationName: [step?.operationName || '', [Validators.required, Validators.maxLength(100)]],
      operationType: [step?.operationType || 'PRODUCTION'],
      operationCode: [step?.operationCode || ''],
      description: [step?.description || ''],
      targetQty: [step?.targetQty || null],
      estimatedDurationMinutes: [step?.estimatedDurationMinutes || null],
      isParallel: [step?.isParallel || false],
      mandatoryFlag: [step?.mandatoryFlag ?? true],
      producesOutputBatch: [step?.producesOutputBatch || false],
      allowsSplit: [step?.allowsSplit || false],
      allowsMerge: [step?.allowsMerge || false]
    });
  }

  loadProcess(): void {
    this.loading = true;
    this.apiService.getProcessDefinitionById(this.processId!).subscribe({
      next: (process: ProcessDefinition) => {
        this.process = process;
        this.patchFormValues(process);
        this.loading = false;

        if (this.isViewMode || process.status !== 'DRAFT') {
          this.processForm.disable();
        }
      },
      error: (err) => {
        this.error = 'Failed to load process';
        this.loading = false;
        console.error('Error loading process:', err);
      }
    });
  }

  patchFormValues(process: ProcessDefinition): void {
    this.processForm.patchValue({
      processName: process.processName,
      processCode: process.processCode,
      description: process.description,
      productSku: process.productSku,
      version: process.version,
      effectiveFrom: process.effectiveFrom ? process.effectiveFrom.substring(0, 10) : '',
      effectiveTo: process.effectiveTo ? process.effectiveTo.substring(0, 10) : ''
    });

    // Clear existing steps and add from process
    while (this.routingSteps.length) {
      this.routingSteps.removeAt(0);
    }

    if (process.routingSteps) {
      process.routingSteps
        .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
        .forEach(step => {
          this.routingSteps.push(this.createStepFormGroup(step));
        });
    }
  }

  addStep(): void {
    this.routingSteps.push(this.createStepFormGroup());
  }

  removeStep(index: number): void {
    this.routingSteps.removeAt(index);
    this.resequenceSteps();
  }

  moveStepUp(index: number): void {
    if (index > 0) {
      const steps = this.routingSteps;
      const current = steps.at(index);
      steps.removeAt(index);
      steps.insert(index - 1, current);
      this.resequenceSteps();
    }
  }

  moveStepDown(index: number): void {
    if (index < this.routingSteps.length - 1) {
      const steps = this.routingSteps;
      const current = steps.at(index);
      steps.removeAt(index);
      steps.insert(index + 1, current);
      this.resequenceSteps();
    }
  }

  resequenceSteps(): void {
    this.routingSteps.controls.forEach((control, index) => {
      control.get('sequenceNumber')?.setValue(index + 1);
    });
  }

  onSubmit(): void {
    if (this.processForm.invalid) {
      this.markFormGroupTouched(this.processForm);
      return;
    }

    this.saving = true;
    this.error = '';
    this.successMessage = '';

    const formValue = this.processForm.value;
    const request = {
      processName: formValue.processName,
      processCode: formValue.processCode || undefined,
      description: formValue.description || undefined,
      productSku: formValue.productSku || undefined,
      version: formValue.version,
      effectiveFrom: formValue.effectiveFrom || undefined,
      effectiveTo: formValue.effectiveTo || undefined,
      routingSteps: formValue.routingSteps.map((step: any) => ({
        routingStepId: step.routingStepId || undefined,
        sequenceNumber: step.sequenceNumber,
        operationName: step.operationName,
        operationType: step.operationType,
        operationCode: step.operationCode || undefined,
        description: step.description || undefined,
        targetQty: step.targetQty || undefined,
        estimatedDurationMinutes: step.estimatedDurationMinutes || undefined,
        isParallel: step.isParallel,
        mandatoryFlag: step.mandatoryFlag,
        producesOutputBatch: step.producesOutputBatch,
        allowsSplit: step.allowsSplit,
        allowsMerge: step.allowsMerge
      }))
    };

    if (this.processId) {
      this.apiService.updateProcessDefinition(this.processId, request).subscribe({
        next: () => {
          this.successMessage = 'Process updated successfully';
          this.saving = false;
          setTimeout(() => this.router.navigate(['/manage/processes']), 1500);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to update process';
          this.saving = false;
        }
      });
    } else {
      this.apiService.createProcessDefinition(request).subscribe({
        next: (created) => {
          this.successMessage = 'Process created successfully';
          this.saving = false;
          setTimeout(() => this.router.navigate(['/manage/processes', created.processId]), 1500);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create process';
          this.saving = false;
        }
      });
    }
  }

  enableEdit(): void {
    if (this.process && this.process.status === 'DRAFT') {
      this.router.navigate(['/manage/processes', this.processId, 'edit']);
    }
  }

  activateProcess(): void {
    if (!this.processId) return;

    if (confirm(`Activate process "${this.process?.processName}"? This will deactivate other active processes for the same product.`)) {
      this.apiService.activateProcess(this.processId, { deactivateOthers: true }).subscribe({
        next: () => {
          this.successMessage = 'Process activated successfully';
          this.loadProcess();
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to activate process';
        }
      });
    }
  }

  createNewVersion(): void {
    if (!this.processId) return;

    if (confirm(`Create a new version of process "${this.process?.processName}"?`)) {
      this.apiService.createProcessVersion(this.processId).subscribe({
        next: (newProcess) => {
          this.router.navigate(['/manage/processes', newProcess.processId, 'edit']);
        },
        error: (err) => {
          this.error = err.error?.message || 'Failed to create new version';
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/manage/processes']);
  }

  private markFormGroupTouched(formGroup: FormGroup | FormArray): void {
    Object.values(formGroup.controls).forEach(control => {
      if (control instanceof FormGroup || control instanceof FormArray) {
        this.markFormGroupTouched(control);
      } else {
        control.markAsTouched();
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'DRAFT': return 'status-draft';
      case 'ACTIVE': return 'status-active';
      case 'INACTIVE': return 'status-inactive';
      case 'SUPERSEDED': return 'status-superseded';
      default: return '';
    }
  }
}
