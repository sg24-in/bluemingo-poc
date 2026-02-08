import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';
import { ApplyHoldModalComponent } from './apply-hold-modal.component';
import { ApiService } from '../../../core/services/api.service';
import { Hold } from '../../models/hold.model';

describe('ApplyHoldModalComponent', () => {
  let component: ApplyHoldModalComponent;
  let fixture: ComponentFixture<ApplyHoldModalComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockHoldReasons = [
    { reasonCode: 'QUALITY', description: 'Quality Issue' },
    { reasonCode: 'EQUIPMENT', description: 'Equipment Problem' },
    { reasonCode: 'MATERIAL', description: 'Material Shortage' }
  ];

  const mockHoldResult: Hold = {
    holdId: 1,
    entityType: 'OPERATION',
    entityId: 123,
    reason: 'QUALITY',
    appliedBy: 'admin@mes.com',
    appliedOn: '2024-01-15T10:00:00',
    status: 'ACTIVE'
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', ['getHoldReasons', 'applyHold']);
    spy.getHoldReasons.and.returnValue(of(mockHoldReasons));

    await TestBed.configureTestingModule({
      declarations: [ApplyHoldModalComponent],
      imports: [ReactiveFormsModule],
      providers: [{ provide: ApiService, useValue: spy }]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    fixture = TestBed.createComponent(ApplyHoldModalComponent);
    component = fixture.componentInstance;
    component.entityType = 'OPERATION';
    component.entityId = 123;
    component.entityName = 'Melting Op';
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should initialize form with empty values', () => {
      expect(component.holdForm.get('reason')?.value).toBe('');
      expect(component.holdForm.get('comments')?.value).toBe('');
    });

    it('should load hold reasons on init', () => {
      expect(apiServiceSpy.getHoldReasons).toHaveBeenCalled();
      expect(component.holdReasons.length).toBe(3);
    });

    it('should map hold reasons correctly', () => {
      expect(component.holdReasons[0].reasonCode).toBe('QUALITY');
      expect(component.holdReasons[0].reasonDescription).toBe('Quality Issue');
    });
  });

  describe('Form Validation', () => {
    it('should require reason', () => {
      component.holdForm.patchValue({ reason: '' });
      expect(component.holdForm.invalid).toBeTrue();
    });

    it('should be valid with reason selected', () => {
      component.holdForm.patchValue({ reason: 'QUALITY' });
      expect(component.holdForm.valid).toBeTrue();
    });

    it('should allow empty comments', () => {
      component.holdForm.patchValue({ reason: 'QUALITY', comments: '' });
      expect(component.holdForm.valid).toBeTrue();
    });
  });

  describe('Entity Type Display', () => {
    it('should format OPERATION correctly', () => {
      component.entityType = 'OPERATION';
      expect(component.entityTypeDisplay).toBe('Operation');
    });

    it('should format BATCH correctly', () => {
      component.entityType = 'BATCH';
      expect(component.entityTypeDisplay).toBe('Batch');
    });

    it('should format INVENTORY correctly', () => {
      component.entityType = 'INVENTORY';
      expect(component.entityTypeDisplay).toBe('Inventory');
    });
  });

  describe('Form Submission', () => {
    it('should not submit if form is invalid', () => {
      component.holdForm.patchValue({ reason: '' });
      component.onSubmit();
      expect(apiServiceSpy.applyHold).not.toHaveBeenCalled();
    });

    it('should submit hold request with correct data', () => {
      apiServiceSpy.applyHold.and.returnValue(of(mockHoldResult));

      component.holdForm.patchValue({ reason: 'QUALITY', comments: 'Test comment' });
      component.onSubmit();

      expect(apiServiceSpy.applyHold).toHaveBeenCalledWith({
        entityType: 'OPERATION',
        entityId: 123,
        reason: 'QUALITY',
        comments: 'Test comment'
      });
    });

    it('should set success state on successful submission', fakeAsync(() => {
      apiServiceSpy.applyHold.and.returnValue(of(mockHoldResult));

      component.holdForm.patchValue({ reason: 'QUALITY' });
      component.onSubmit();

      expect(component.success).toBeTrue();
      expect(component.submitting).toBeFalse();

      // Flush the auto-close timer (1.5s delay in component)
      tick(1500);
    }));

    it('should emit holdApplied on successful submission', () => {
      apiServiceSpy.applyHold.and.returnValue(of(mockHoldResult));
      spyOn(component.holdApplied, 'emit');

      component.holdForm.patchValue({ reason: 'QUALITY' });
      component.onSubmit();

      expect(component.holdApplied.emit).toHaveBeenCalledWith(mockHoldResult);
    });

    it('should handle submission error', () => {
      apiServiceSpy.applyHold.and.returnValue(throwError(() => ({ error: { message: 'Hold failed' } })));

      component.holdForm.patchValue({ reason: 'QUALITY' });
      component.onSubmit();

      expect(component.error).toBe('Hold failed');
      expect(component.submitting).toBeFalse();
      expect(component.success).toBeFalse();
    });

    it('should set submitting flag during submission', () => {
      apiServiceSpy.applyHold.and.returnValue(of(mockHoldResult));

      component.holdForm.patchValue({ reason: 'QUALITY' });
      expect(component.submitting).toBeFalse();

      component.onSubmit();
      // After completion
      expect(component.submitting).toBeFalse();
    });
  });

  describe('Modal Actions', () => {
    it('should emit close event on cancel', () => {
      spyOn(component.close, 'emit');
      component.onCancel();
      expect(component.close.emit).toHaveBeenCalled();
    });

    it('should reset form on cancel', () => {
      component.holdForm.patchValue({ reason: 'QUALITY', comments: 'Test' });
      component.error = 'Some error';
      component.success = true;

      component.onCancel();

      expect(component.holdForm.get('reason')?.value).toBe('');
      expect(component.holdForm.get('comments')?.value).toBe('');
      expect(component.error).toBe('');
      expect(component.success).toBeFalse();
    });

    it('should reload hold reasons when modal opens', () => {
      apiServiceSpy.getHoldReasons.calls.reset();

      component.isOpen = true;
      component.ngOnChanges({
        isOpen: { currentValue: true, previousValue: false, firstChange: false, isFirstChange: () => false }
      });

      expect(apiServiceSpy.getHoldReasons).toHaveBeenCalled();
    });
  });

  describe('Backdrop Click', () => {
    it('should close modal on backdrop click', () => {
      spyOn(component, 'onCancel');
      const mockEvent = { target: { classList: { contains: () => true } } } as any;
      component.onBackdropClick(mockEvent);
      expect(component.onCancel).toHaveBeenCalled();
    });

    it('should not close modal on content click', () => {
      spyOn(component, 'onCancel');
      const mockEvent = { target: { classList: { contains: () => false } } } as any;
      component.onBackdropClick(mockEvent);
      expect(component.onCancel).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle hold reasons loading error', () => {
      apiServiceSpy.getHoldReasons.and.returnValue(throwError(() => new Error('Load failed')));

      component.loadHoldReasons();

      expect(component.error).toBe('Failed to load hold reasons');
      expect(component.loading).toBeFalse();
    });

    it('should use fallback message when error has no message', () => {
      apiServiceSpy.applyHold.and.returnValue(throwError(() => ({})));

      component.holdForm.patchValue({ reason: 'QUALITY' });
      component.onSubmit();

      expect(component.error).toBe('Failed to apply hold');
    });
  });
});
