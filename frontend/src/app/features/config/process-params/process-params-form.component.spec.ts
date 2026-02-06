import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ProcessParamsFormComponent } from './process-params-form.component';
import { ApiService } from '../../../core/services/api.service';
import { ProcessParametersConfig } from '../../../shared/models';

describe('ProcessParamsFormComponent', () => {
  let component: ProcessParamsFormComponent;
  let fixture: ComponentFixture<ProcessParamsFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProcessParam: ProcessParametersConfig = {
    configId: 1,
    operationType: 'FURNACE',
    productSku: 'SKU-001',
    parameterName: 'Temperature',
    parameterType: 'DECIMAL',
    unit: 'C',
    minValue: 100,
    maxValue: 500,
    defaultValue: 300,
    isRequired: true,
    displayOrder: 1,
    status: 'ACTIVE',
    createdOn: '2026-02-05T10:00:00',
    createdBy: 'admin'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', ['getProcessParamById', 'createProcessParam', 'updateProcessParam']);
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule],
      declarations: [ProcessParamsFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => routeParams[key] || null } } } }
      ]
    }).compileComponents();
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      await configureTestBed({});
      fixture = TestBed.createComponent(ProcessParamsFormComponent);
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

    it('should have default form values in create mode', () => {
      fixture.detectChanges();

      expect(component.form.get('operationType')?.value).toBe('');
      expect(component.form.get('productSku')?.value).toBe('');
      expect(component.form.get('parameterName')?.value).toBe('');
      expect(component.form.get('parameterType')?.value).toBe('DECIMAL');
      expect(component.form.get('unit')?.value).toBe('');
      expect(component.form.get('minValue')?.value).toBeNull();
      expect(component.form.get('maxValue')?.value).toBeNull();
      expect(component.form.get('defaultValue')?.value).toBeNull();
      expect(component.form.get('isRequired')?.value).toBe(false);
      expect(component.form.get('displayOrder')?.value).toBe(1);
      expect(component.form.get('status')?.value).toBe('ACTIVE');
    });

    it('should validate required fields', () => {
      fixture.detectChanges();

      const operationType = component.form.get('operationType');
      const parameterName = component.form.get('parameterName');

      expect(operationType?.hasError('required')).toBe(true);
      expect(parameterName?.hasError('required')).toBe(true);

      operationType?.setValue('FURNACE');
      parameterName?.setValue('Temperature');

      expect(operationType?.hasError('required')).toBe(false);
      expect(parameterName?.hasError('required')).toBe(false);
    });

    it('should validate parameterName maxLength', () => {
      fixture.detectChanges();

      const parameterName = component.form.get('parameterName');
      const longName = 'A'.repeat(101);

      parameterName?.setValue(longName);

      expect(parameterName?.hasError('maxlength')).toBe(true);

      parameterName?.setValue('Temperature');

      expect(parameterName?.hasError('maxlength')).toBe(false);
    });

    it('should create process param successfully', () => {
      apiServiceSpy.createProcessParam.and.returnValue(of(mockProcessParam));
      fixture.detectChanges();
      spyOn(component['router'], 'navigate');

      component.form.patchValue({
        operationType: 'FURNACE',
        productSku: 'SKU-001',
        parameterName: 'Temperature',
        parameterType: 'DECIMAL',
        unit: 'C',
        minValue: 100,
        maxValue: 500,
        defaultValue: 300,
        isRequired: true,
        displayOrder: 1,
        status: 'ACTIVE'
      });

      component.onSubmit();

      expect(apiServiceSpy.createProcessParam).toHaveBeenCalled();
      expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/process-params']);
    });

    it('should handle create error', () => {
      const error = { error: { message: 'Creation failed' } };
      apiServiceSpy.createProcessParam.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      component.form.patchValue({
        operationType: 'FURNACE',
        parameterName: 'Temperature'
      });

      component.onSubmit();

      expect(apiServiceSpy.createProcessParam).toHaveBeenCalled();
      expect(component.error).toBe('Creation failed');
      expect(component.saving).toBe(false);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getProcessParamById.and.returnValue(of(mockProcessParam));
      fixture = TestBed.createComponent(ProcessParamsFormComponent);
      component = fixture.componentInstance;
    });

    it('should initialize in edit mode', () => {
      fixture.detectChanges();

      expect(component.isEditMode).toBe(true);
      expect(component.itemId).toBe(1);
      expect(apiServiceSpy.getProcessParamById).toHaveBeenCalledWith(1);
    });

    it('should load data in edit mode', () => {
      fixture.detectChanges();

      const formValue = component.form.getRawValue();
      expect(formValue.operationType).toBe('FURNACE');
      expect(formValue.productSku).toBe('SKU-001');
      expect(formValue.parameterName).toBe('Temperature');
      expect(formValue.parameterType).toBe('DECIMAL');
      expect(formValue.unit).toBe('C');
      expect(formValue.minValue).toBe(100);
      expect(formValue.maxValue).toBe(500);
      expect(formValue.defaultValue).toBe(300);
      expect(formValue.isRequired).toBe(true);
      expect(formValue.displayOrder).toBe(1);
      expect(formValue.status).toBe('ACTIVE');
    });

    it('should disable operationType and parameterName fields in edit mode', () => {
      fixture.detectChanges();

      expect(component.form.get('operationType')?.disabled).toBe(true);
      expect(component.form.get('parameterName')?.disabled).toBe(true);
    });

    it('should update process param successfully', () => {
      apiServiceSpy.updateProcessParam.and.returnValue(of(mockProcessParam));
      fixture.detectChanges();
      spyOn(component['router'], 'navigate');

      component.form.patchValue({
        minValue: 150,
        maxValue: 550
      });

      component.onSubmit();

      expect(apiServiceSpy.updateProcessParam).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/process-params']);
    });

    it('should handle update error', () => {
      const error = { error: { message: 'Update failed' } };
      apiServiceSpy.updateProcessParam.and.returnValue(throwError(() => error));
      fixture.detectChanges();

      component.onSubmit();

      expect(apiServiceSpy.updateProcessParam).toHaveBeenCalled();
      expect(component.error).toBe('Update failed');
      expect(component.saving).toBe(false);
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed({});
      fixture = TestBed.createComponent(ProcessParamsFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should check if field has error', () => {
      const parameterName = component.form.get('parameterName');
      parameterName?.markAsTouched();

      expect(component.hasError('parameterName')).toBe(true);

      parameterName?.setValue('Temperature');

      expect(component.hasError('parameterName')).toBe(false);
    });

    it('should not submit invalid form', () => {
      component.onSubmit();

      expect(component.form.invalid).toBe(true);
      expect(apiServiceSpy.createProcessParam).not.toHaveBeenCalled();
    });
  });
});
