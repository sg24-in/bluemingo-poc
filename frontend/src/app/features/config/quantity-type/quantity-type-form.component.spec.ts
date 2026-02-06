import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { QuantityTypeConfig } from '../../../shared/models';
import { QuantityTypeFormComponent } from './quantity-type-form.component';

describe('QuantityTypeFormComponent', () => {
  let component: QuantityTypeFormComponent;
  let fixture: ComponentFixture<QuantityTypeFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockQuantityTypeConfig: QuantityTypeConfig = {
    configId: 1,
    configName: 'FURNACE_WEIGHT',
    materialCode: 'COPPER',
    operationType: 'MELTING',
    equipmentType: 'FURNACE',
    quantityType: 'DECIMAL',
    decimalPrecision: 2,
    roundingRule: 'HALF_UP',
    minQuantity: 10,
    maxQuantity: 1000,
    unit: 'KG',
    status: 'ACTIVE',
    createdOn: '2026-01-01T10:00:00',
    createdBy: 'admin'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', ['getQuantityTypeConfigById', 'createQuantityTypeConfig', 'updateQuantityTypeConfig']);
    const rSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule, SharedModule],
      declarations: [QuantityTypeFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: Router, useValue: rSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => routeParams[key] || null } } } }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      await configureTestBed({});
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(QuantityTypeFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize in create mode', () => {
      expect(component.isEditMode).toBe(false);
      expect(component.form).toBeDefined();
      expect(component.form.get('configName')?.enabled).toBe(true);
    });

    it('should set default values', () => {
      expect(component.form.get('quantityType')?.value).toBe('DECIMAL');
      expect(component.form.get('decimalPrecision')?.value).toBe(4);
      expect(component.form.get('roundingRule')?.value).toBe('HALF_UP');
      expect(component.form.get('status')?.value).toBe('ACTIVE');
    });

    it('should validate required fields', () => {
      const configNameControl = component.form.get('configName');
      configNameControl?.setValue('');
      configNameControl?.markAsTouched();

      expect(configNameControl?.hasError('required')).toBe(true);
      expect(component.hasError('configName')).toBe(true);
    });

    it('should validate configName maxLength', () => {
      const configNameControl = component.form.get('configName');
      configNameControl?.setValue('A'.repeat(101));
      configNameControl?.markAsTouched();

      expect(configNameControl?.hasError('maxlength')).toBe(true);
    });

    it('should validate decimalPrecision min value', () => {
      const precisionControl = component.form.get('decimalPrecision');
      precisionControl?.setValue(-1);
      precisionControl?.markAsTouched();

      expect(precisionControl?.hasError('min')).toBe(true);
    });

    it('should validate decimalPrecision max value', () => {
      const precisionControl = component.form.get('decimalPrecision');
      precisionControl?.setValue(11);
      precisionControl?.markAsTouched();

      expect(precisionControl?.hasError('max')).toBe(true);
    });

    it('should create new config successfully', () => {
      apiServiceSpy.createQuantityTypeConfig.and.returnValue(of(mockQuantityTypeConfig));

      component.form.patchValue({
        configName: 'NEW_CONFIG',
        quantityType: 'DECIMAL',
        decimalPrecision: 3,
        roundingRule: 'UP',
        status: 'ACTIVE'
      });

      component.onSubmit();

      expect(component.saving).toBe(false);
      expect(apiServiceSpy.createQuantityTypeConfig).toHaveBeenCalled();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/manage/config/quantity-type']);
    });

    it('should handle create error', () => {
      const errorResponse = { error: { message: 'Config name already exists' } };
      apiServiceSpy.createQuantityTypeConfig.and.returnValue(throwError(() => errorResponse));

      component.form.patchValue({
        configName: 'DUPLICATE_CONFIG',
        quantityType: 'DECIMAL',
        decimalPrecision: 4,
        roundingRule: 'HALF_UP',
        status: 'ACTIVE'
      });

      component.onSubmit();

      expect(component.saving).toBe(false);
      expect(component.error).toBe('Config name already exists');
    });

    it('should not submit when form is invalid', () => {
      component.form.patchValue({
        configName: ''
      });

      component.onSubmit();

      expect(apiServiceSpy.createQuantityTypeConfig).not.toHaveBeenCalled();
      expect(apiServiceSpy.updateQuantityTypeConfig).not.toHaveBeenCalled();
    });

    it('should return true for hasError when field is invalid and touched', () => {
      const configNameControl = component.form.get('configName');
      configNameControl?.setValue('');
      configNameControl?.markAsTouched();

      expect(component.hasError('configName')).toBe(true);
    });

    it('should return false for hasError when field is valid', () => {
      const configNameControl = component.form.get('configName');
      configNameControl?.setValue('VALID_CONFIG');
      configNameControl?.markAsTouched();

      expect(component.hasError('configName')).toBe(false);
    });

    it('should return false for hasError when field is untouched', () => {
      const configNameControl = component.form.get('configName');
      configNameControl?.setValue('');

      expect(component.hasError('configName')).toBe(false);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
    });

    beforeEach(() => {
      apiServiceSpy.getQuantityTypeConfigById.and.returnValue(of(mockQuantityTypeConfig));
      fixture = TestBed.createComponent(QuantityTypeFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize in edit mode', () => {
      expect(component.isEditMode).toBe(true);
      expect(component.itemId).toBe(1);
      expect(apiServiceSpy.getQuantityTypeConfigById).toHaveBeenCalledWith(1);
    });

    it('should load data in edit mode', () => {
      expect(component.form.get('configName')?.value).toBe('FURNACE_WEIGHT');
      expect(component.form.get('materialCode')?.value).toBe('COPPER');
      expect(component.form.get('operationType')?.value).toBe('MELTING');
      expect(component.form.get('equipmentType')?.value).toBe('FURNACE');
      expect(component.form.get('decimalPrecision')?.value).toBe(2);
      expect(component.form.get('minQuantity')?.value).toBe(10);
      expect(component.form.get('maxQuantity')?.value).toBe(1000);
      expect(component.form.get('unit')?.value).toBe('KG');
    });

    it('should disable configName in edit mode', () => {
      expect(component.form.get('configName')?.disabled).toBe(true);
    });

    it('should update existing config successfully', () => {
      apiServiceSpy.updateQuantityTypeConfig.and.returnValue(of(mockQuantityTypeConfig));

      component.form.patchValue({
        decimalPrecision: 3,
        minQuantity: 20
      });

      component.onSubmit();

      expect(component.saving).toBe(false);
      expect(apiServiceSpy.updateQuantityTypeConfig).toHaveBeenCalledWith(1, jasmine.any(Object));
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/manage/config/quantity-type']);
    });

    it('should include disabled configName in update payload', () => {
      apiServiceSpy.updateQuantityTypeConfig.and.returnValue(of(mockQuantityTypeConfig));

      component.form.patchValue({
        decimalPrecision: 3
      });

      component.onSubmit();

      const callArgs = apiServiceSpy.updateQuantityTypeConfig.calls.mostRecent().args;
      expect(callArgs[1].configName).toBe('FURNACE_WEIGHT');
    });

    it('should handle update error', () => {
      const errorResponse = { error: { message: 'Validation failed' } };
      apiServiceSpy.updateQuantityTypeConfig.and.returnValue(throwError(() => errorResponse));

      component.form.patchValue({
        decimalPrecision: 6
      });

      component.onSubmit();

      expect(component.saving).toBe(false);
      expect(component.error).toBe('Validation failed');
    });

    it('should handle load error in edit mode', () => {
      const errorResponse = { error: { message: 'Config not found' } };
      apiServiceSpy.getQuantityTypeConfigById.and.returnValue(throwError(() => errorResponse));

      const newFixture = TestBed.createComponent(QuantityTypeFormComponent);
      const newComponent = newFixture.componentInstance;
      newFixture.detectChanges();

      expect(newComponent.loading).toBe(false);
      expect(newComponent.error).toBe('Config not found');
    });
  });
});
