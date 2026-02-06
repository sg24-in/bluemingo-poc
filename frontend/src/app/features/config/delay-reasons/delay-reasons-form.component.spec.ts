import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';
import { DelayReasonsFormComponent } from './delay-reasons-form.component';
import { ApiService } from '../../../core/services/api.service';
import { DelayReason } from '../../../shared/models';

describe('DelayReasonsFormComponent', () => {
  let component: DelayReasonsFormComponent;
  let fixture: ComponentFixture<DelayReasonsFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockDelayReason: DelayReason = {
    reasonId: 1,
    reasonCode: 'MAINT',
    reasonDescription: 'Equipment Maintenance',
    status: 'ACTIVE',
    createdOn: '2024-01-01T00:00:00',
    createdBy: 'admin'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getDelayReasonById',
      'createDelayReason',
      'updateDelayReason'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [DelayReasonsFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: (key: string) => routeParams[key] || null
              }
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      await configureTestBed({});
      fixture = TestBed.createComponent(DelayReasonsFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create in create mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBe(false);
      expect(component.itemId).toBeNull();
    });

    it('should initialize form with default values', () => {
      expect(component.form.get('reasonCode')?.value).toBe('');
      expect(component.form.get('reasonDescription')?.value).toBe('');
      expect(component.form.get('status')?.value).toBe('ACTIVE');
    });

    it('should have enabled reasonCode field in create mode', () => {
      expect(component.form.get('reasonCode')?.disabled).toBe(false);
    });

    it('should validate required fields', () => {
      expect(component.form.valid).toBe(false);

      component.form.patchValue({
        reasonCode: 'TEST',
        reasonDescription: 'Test Description'
      });

      expect(component.form.valid).toBe(true);
    });

    it('should validate maxLength for reasonCode', () => {
      const longCode = 'A'.repeat(51);
      component.form.patchValue({ reasonCode: longCode });

      expect(component.form.get('reasonCode')?.hasError('maxlength')).toBe(true);
    });

    it('should validate maxLength for reasonDescription', () => {
      const longDesc = 'A'.repeat(256);
      component.form.patchValue({ reasonDescription: longDesc });

      expect(component.form.get('reasonDescription')?.hasError('maxlength')).toBe(true);
    });

    it('should create delay reason successfully', () => {
      apiServiceSpy.createDelayReason.and.returnValue(of(mockDelayReason));
      spyOn(component['router'], 'navigate');

      component.form.patchValue({
        reasonCode: 'MAINT',
        reasonDescription: 'Equipment Maintenance',
        status: 'ACTIVE'
      });

      component.onSubmit();

      expect(apiServiceSpy.createDelayReason).toHaveBeenCalledWith({
        reasonCode: 'MAINT',
        reasonDescription: 'Equipment Maintenance',
        status: 'ACTIVE'
      });
      expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/delay-reasons']);
    });

    it('should handle create error', () => {
      apiServiceSpy.createDelayReason.and.returnValue(
        throwError(() => ({ error: { message: 'Create failed' } }))
      );

      component.form.patchValue({
        reasonCode: 'MAINT',
        reasonDescription: 'Equipment Maintenance'
      });

      component.onSubmit();

      expect(component.saving).toBe(false);
      expect(component.error).toBe('Create failed');
    });

    it('should not submit invalid form', () => {
      component.onSubmit();

      expect(apiServiceSpy.createDelayReason).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getDelayReasonById.and.returnValue(of(mockDelayReason));
      fixture = TestBed.createComponent(DelayReasonsFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create in edit mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBe(true);
      expect(component.itemId).toBe(1);
    });

    it('should load existing delay reason', () => {
      expect(apiServiceSpy.getDelayReasonById).toHaveBeenCalledWith(1);
      expect(component.form.get('reasonCode')?.value).toBe('MAINT');
      expect(component.form.get('reasonDescription')?.value).toBe('Equipment Maintenance');
      expect(component.form.get('status')?.value).toBe('ACTIVE');
    });

    it('should disable reasonCode field in edit mode', () => {
      expect(component.form.get('reasonCode')?.disabled).toBe(true);
    });

    it('should handle load error', () => {
      apiServiceSpy.getDelayReasonById.and.returnValue(
        throwError(() => ({ error: { message: 'Load failed' } }))
      );

      component.ngOnInit();

      expect(component.loading).toBe(false);
      expect(component.error).toBe('Load failed');
    });

    it('should update delay reason successfully', () => {
      apiServiceSpy.updateDelayReason.and.returnValue(of(mockDelayReason));
      spyOn(component['router'], 'navigate');

      component.form.patchValue({
        reasonDescription: 'Updated Description',
        status: 'INACTIVE'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateDelayReason).toHaveBeenCalledWith(1, {
        reasonCode: 'MAINT',
        reasonDescription: 'Updated Description',
        status: 'INACTIVE'
      });
      expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/delay-reasons']);
    });

    it('should include disabled reasonCode in update using getRawValue', () => {
      apiServiceSpy.updateDelayReason.and.returnValue(of(mockDelayReason));

      component.form.patchValue({
        reasonDescription: 'Updated Description'
      });

      component.onSubmit();

      const callArgs = apiServiceSpy.updateDelayReason.calls.mostRecent().args[1];
      expect(callArgs.reasonCode).toBe('MAINT');
    });

    it('should handle update error', () => {
      apiServiceSpy.updateDelayReason.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.form.patchValue({
        reasonDescription: 'Updated Description'
      });

      component.onSubmit();

      expect(component.saving).toBe(false);
      expect(component.error).toBe('Update failed');
    });
  });
});
