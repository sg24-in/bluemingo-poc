import { Component, EventEmitter, Input, OnInit, Output, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

export type EntityType = 'ORDER' | 'OPERATION' | 'BATCH' | 'INVENTORY' | 'EQUIPMENT';

interface HoldReasonOption {
  reasonCode: string;
  reasonDescription: string;
}

@Component({
  selector: 'app-apply-hold-modal',
  templateUrl: './apply-hold-modal.component.html',
  styleUrls: ['./apply-hold-modal.component.css']
})
export class ApplyHoldModalComponent implements OnInit, OnChanges {
  @Input() isOpen = false;
  @Input() entityType: EntityType = 'OPERATION';
  @Input() entityId: number = 0;
  @Input() entityName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() holdApplied = new EventEmitter<any>();

  holdForm!: FormGroup;
  holdReasons: HoldReasonOption[] = [];
  loading = false;
  submitting = false;
  error = '';
  success = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadHoldReasons();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen'] && this.isOpen) {
      this.resetForm();
      this.loadHoldReasons();
    }
  }

  private initForm(): void {
    this.holdForm = this.fb.group({
      reason: ['', Validators.required],
      comments: ['']
    });
  }

  private resetForm(): void {
    this.holdForm.reset({ reason: '', comments: '' });
    this.error = '';
    this.success = false;
  }

  loadHoldReasons(): void {
    this.loading = true;
    this.apiService.getHoldReasons().subscribe({
      next: (reasons) => {
        // Map to our internal format
        this.holdReasons = reasons.map(r => ({
          reasonCode: r.reasonCode,
          reasonDescription: r.description
        }));
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading hold reasons:', err);
        this.error = 'Failed to load hold reasons';
        this.loading = false;
      }
    });
  }

  get entityTypeDisplay(): string {
    return this.entityType.charAt(0) + this.entityType.slice(1).toLowerCase();
  }

  onSubmit(): void {
    if (this.holdForm.invalid) {
      return;
    }

    this.submitting = true;
    this.error = '';

    const request = {
      entityType: this.entityType,
      entityId: this.entityId,
      reason: this.holdForm.value.reason,
      comments: this.holdForm.value.comments || undefined
    };

    this.apiService.applyHold(request).subscribe({
      next: (result) => {
        this.success = true;
        this.submitting = false;
        this.holdApplied.emit(result);
        // Close after a short delay to show success
        setTimeout(() => {
          this.close.emit();
        }, 1500);
      },
      error: (err) => {
        console.error('Error applying hold:', err);
        this.error = err.error?.message || 'Failed to apply hold';
        this.submitting = false;
      }
    });
  }

  onCancel(): void {
    this.resetForm();
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onCancel();
    }
  }
}
