import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { BatchNumberConfig } from '../../../shared/models';
import { BatchNumberFormComponent } from './batch-number-form.component';

describe('BatchNumberFormComponent', () => {
  let component: BatchNumberFormComponent;
  let fixture: ComponentFixture<BatchNumberFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockBatchNumberConfig: BatchNumberConfig = {
    configId: 1,
    configName: 'Furnace Batch',
    operationType: 'FURNACE',


    prefix: 'BATCH',
    includeOperationCode: true,
    operationCodeLength: 3,
    separator: '-',
    dateFormat: 'yyyyMMdd',
    includeDate: true,
    sequenceLength: 4,
    sequenceReset: 'DAILY',
    priority: 100,
    status: 'ACTIVE',
    createdOn: '2026-02-05T10:00:00',
    createdBy: 'admin@mes.com'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getBatchNumberConfigById',
      'createBatchNumberConfig',
      'updateBatchNumberConfig'
    ]);

    await TestBed.configureTestingModule({
      declarations: [BatchNumberFormComponent],
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule,
        SharedModule
      ],
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
    router = TestBed.inject(Router);
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      await configureTestBed({});
      fixture = TestBed.createComponent(BatchNumberFormComponent);
      component = fixture.componentInstance;
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize in create mode', () => {
      fixture.detectChanges();

      expect(component.isEditMode).toBe(false);
      expect(component.itemId).toBeNull();
      expect(component.form).toBeDefined();
    });

    it('should set default values in create mode', () => {
      fixture.detectChanges();

      expect(component.form.get('configName')?.value).toBe('');
      expect(component.form.get('prefix')?.value).toBe('BATCH');
      expect(component.form.get('includeOperationCode')?.value).toBe(false);
      expect(component.form.get('operationCodeLength')?.value).toBe(3);
      expect(component.form.get('separator')?.value).toBe('-');
      expect(component.form.get('includeDate')?.value).toBe(false);
      expect(component.form.get('sequenceLength')?.value).toBe(3);
      expect(component.form.get('sequenceReset')?.value).toBe('DAILY');
      expect(component.form.get('priority')?.value).toBe(100);
      expect(component.form.get('status')?.value).toBe('ACTIVE');
    });

    it('should validate required fields', () => {
      fixture.detectChanges();

      const configName = component.form.get('configName');
      // configName starts empty, so it should have required error
      expect(configName?.hasError('required')).toBe(true);

      configName?.setValue('Test Config');
      expect(configName?.hasError('required')).toBe(false);

      // prefix and separator have default values so they're valid initially
      expect(component.form.get('prefix')?.hasError('required')).toBe(false);
      expect(component.form.get('separator')?.hasError('required')).toBe(false);

      // Clear them to trigger required
      component.form.get('prefix')?.setValue('');
      expect(component.form.get('prefix')?.hasError('required')).toBe(true);
    });

    it('should validate sequence length min and max', () => {
      fixture.detectChanges();

      const sequenceLength = component.form.get('sequenceLength');

      sequenceLength?.setValue(0);
      expect(sequenceLength?.hasError('min')).toBe(true);

      sequenceLength?.setValue(11);
      expect(sequenceLength?.hasError('max')).toBe(true);

      sequenceLength?.setValue(5);
      expect(sequenceLength?.valid).toBe(true);
    });

    it('should validate maxLength for configName', () => {
      fixture.detectChanges();

      const configName = component.form.get('configName');
      configName?.setValue('a'.repeat(101));

      expect(configName?.hasError('maxlength')).toBe(true);

      configName?.setValue('a'.repeat(100));
      expect(configName?.hasError('maxlength')).toBe(false);
    });

    it('should validate maxLength for prefix', () => {
      fixture.detectChanges();

      const prefix = component.form.get('prefix');
      prefix?.setValue('a'.repeat(21));

      expect(prefix?.hasError('maxlength')).toBe(true);

      prefix?.setValue('a'.repeat(20));
      expect(prefix?.hasError('maxlength')).toBe(false);
    });

    it('should validate maxLength for separator', () => {
      fixture.detectChanges();

      const separator = component.form.get('separator');
      separator?.setValue('a'.repeat(6));

      expect(separator?.hasError('maxlength')).toBe(true);

      separator?.setValue('a'.repeat(5));
      expect(separator?.hasError('maxlength')).toBe(false);
    });

    it('should create batch number config successfully', () => {
      apiServiceSpy.createBatchNumberConfig.and.returnValue(of(mockBatchNumberConfig));
      spyOn(router, 'navigate');
      fixture.detectChanges();

      component.form.patchValue({
        configName: 'Test Config',
        prefix: 'TEST',
        separator: '-',
        sequenceLength: 4
      });

      component.onSubmit();

      expect(apiServiceSpy.createBatchNumberConfig).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-number']);
    });

    it('should handle create error', () => {
      const errorResponse = { error: { message: 'Create failed' } };
      apiServiceSpy.createBatchNumberConfig.and.returnValue(throwError(() => errorResponse));
      fixture.detectChanges();

      component.form.patchValue({
        configName: 'Test Config',
        prefix: 'TEST',
        separator: '-',
        sequenceLength: 4
      });

      component.onSubmit();

      expect(component.error).toBe('Create failed');
      expect(component.saving).toBe(false);
    });

    it('should not submit if form is invalid', () => {
      fixture.detectChanges();

      component.form.patchValue({
        configName: '',
        prefix: '',
        separator: '',
        sequenceLength: null
      });

      component.onSubmit();

      expect(apiServiceSpy.createBatchNumberConfig).not.toHaveBeenCalled();
      expect(apiServiceSpy.updateBatchNumberConfig).not.toHaveBeenCalled();
    });

    it('should submit empty optional fields as empty strings', () => {
      apiServiceSpy.createBatchNumberConfig.and.returnValue(of(mockBatchNumberConfig));
      fixture.detectChanges();

      component.form.patchValue({
        configName: 'Test Config',
        operationType: '',
        productSku: '',
        dateFormat: '',
        prefix: 'TEST',
        separator: '-',
        sequenceLength: 4
      });

      component.onSubmit();

      const submittedData = apiServiceSpy.createBatchNumberConfig.calls.mostRecent().args[0];
      expect(submittedData.operationType).toBe('');
      expect(submittedData.productSku).toBe('');
      expect(submittedData.dateFormat).toBe('');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
      apiServiceSpy.getBatchNumberConfigById.and.returnValue(of(mockBatchNumberConfig));
      fixture = TestBed.createComponent(BatchNumberFormComponent);
      component = fixture.componentInstance;
    });

    it('should initialize in edit mode', () => {
      fixture.detectChanges();

      expect(component.isEditMode).toBe(true);
      expect(component.itemId).toBe(1);
    });

    it('should load data in edit mode', () => {
      fixture.detectChanges();

      expect(apiServiceSpy.getBatchNumberConfigById).toHaveBeenCalledWith(1);
      expect(component.form.get('configName')?.value).toBe('Furnace Batch');
      expect(component.form.get('operationType')?.value).toBe('FURNACE');
      expect(component.form.get('prefix')?.value).toBe('BATCH');
      expect(component.form.get('sequenceLength')?.value).toBe(4);
    });

    it('should disable configName in edit mode', () => {
      fixture.detectChanges();

      expect(component.form.get('configName')?.disabled).toBe(true);
    });

    it('should update batch number config successfully', () => {
      apiServiceSpy.updateBatchNumberConfig.and.returnValue(of(mockBatchNumberConfig));
      spyOn(router, 'navigate');
      fixture.detectChanges();

      component.form.patchValue({
        prefix: 'UPDATED'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateBatchNumberConfig).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-number']);
    });

    it('should handle update error', () => {
      const errorResponse = { error: { message: 'Update failed' } };
      apiServiceSpy.updateBatchNumberConfig.and.returnValue(throwError(() => errorResponse));
      fixture.detectChanges();

      component.form.patchValue({
        prefix: 'UPDATED'
      });

      component.onSubmit();

      expect(component.error).toBe('Update failed');
      expect(component.saving).toBe(false);
    });

    it('should include disabled configName in getRawValue', () => {
      apiServiceSpy.updateBatchNumberConfig.and.returnValue(of(mockBatchNumberConfig));
      fixture.detectChanges();

      const rawValue = component.form.getRawValue();
      expect(rawValue.configName).toBe('Furnace Batch');
    });
  });

  describe('Utility Methods', () => {
    beforeEach(async () => {
      await configureTestBed({});
      fixture = TestBed.createComponent(BatchNumberFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should return true for hasError when field is invalid and touched', () => {
      const configName = component.form.get('configName');
      configName?.markAsTouched();

      expect(component.hasError('configName')).toBe(true);
    });

    it('should return false for hasError when field is valid', () => {
      const configName = component.form.get('configName');
      configName?.setValue('Test Config');
      configName?.markAsTouched();

      expect(component.hasError('configName')).toBe(false);
    });
  });
});
