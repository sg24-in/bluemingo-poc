import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OperatorFormComponent } from './operator-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Operator } from '../../../shared/models';

describe('OperatorFormComponent', () => {
  let component: OperatorFormComponent;
  let fixture: ComponentFixture<OperatorFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockOperator: Operator = {
    operatorId: 1,
    operatorCode: 'OP-001',
    name: 'John Doe',
    department: 'Production',
    shift: 'Morning',
    status: 'ACTIVE'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getOperatorById', 'createOperator', 'updateOperator'
    ]);

    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule],
      declarations: [OperatorFormComponent],
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

  const createComponent = () => {
    fixture = TestBed.createComponent(OperatorFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Create Mode', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be in create mode when no id param', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.operatorId).toBeNull();
    });

    it('should have empty form for create', () => {
      expect(component.form.get('operatorCode')?.value).toBe('');
      expect(component.form.get('name')?.value).toBe('');
      expect(component.form.get('department')?.value).toBe('');
      expect(component.form.get('shift')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.form.patchValue({ operatorCode: '', name: '' });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create operator successfully', () => {
      apiServiceSpy.createOperator.and.returnValue(of(mockOperator));

      component.form.patchValue({
        operatorCode: 'OP-001',
        name: 'John Doe',
        department: 'Production'
      });

      component.onSubmit();
      expect(apiServiceSpy.createOperator).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createOperator.and.returnValue(
        throwError(() => ({ error: { message: 'Code already exists' } }))
      );

      component.form.patchValue({
        operatorCode: 'OP-001',
        name: 'Test'
      });

      component.onSubmit();
      expect(component.error).toBe('Code already exists');
      expect(component.saving).toBeFalse();
    });

    it('should not submit if form is invalid', () => {
      component.onSubmit();
      expect(apiServiceSpy.createOperator).not.toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getOperatorById.and.returnValue(of(mockOperator));
      createComponent();
    });

    it('should be in edit mode when id param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.operatorId).toBe(1);
    });

    it('should load operator data', () => {
      expect(apiServiceSpy.getOperatorById).toHaveBeenCalledWith(1);
      expect(component.form.get('name')?.value).toBe('John Doe');
      expect(component.form.get('department')?.value).toBe('Production');
      expect(component.form.get('shift')?.value).toBe('Morning');
    });

    it('should disable operatorCode in edit mode', () => {
      expect(component.form.get('operatorCode')?.disabled).toBeTrue();
    });

    it('should update operator successfully', () => {
      apiServiceSpy.updateOperator.and.returnValue(of(mockOperator));

      component.form.patchValue({ name: 'Updated Name' });
      component.onSubmit();

      expect(apiServiceSpy.updateOperator).toHaveBeenCalledWith(1, jasmine.any(Object));
    });

    it('should handle update error', () => {
      apiServiceSpy.updateOperator.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.form.patchValue({ name: 'Updated' });
      component.onSubmit();

      expect(component.error).toBe('Update failed');
      expect(component.saving).toBeFalse();
    });

  });

  describe('Edit Mode Error', () => {
    it('should handle load error', async () => {
      await configureTestBed({ id: '999' });
      apiServiceSpy.getOperatorById.and.returnValue(
        throwError(() => ({ error: { message: 'Not found' } }))
      );
      createComponent();

      expect(component.error).toBe('Not found');
      expect(component.loading).toBeFalse();
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should validate max length for operatorCode', () => {
      const longString = 'a'.repeat(51);
      component.form.patchValue({ operatorCode: longString });
      expect(component.form.get('operatorCode')?.valid).toBeFalse();
    });

    it('should validate max length for name', () => {
      const longString = 'a'.repeat(201);
      component.form.patchValue({ name: longString });
      expect(component.form.get('name')?.valid).toBeFalse();
    });

    it('should report field errors', () => {
      component.form.get('operatorCode')?.markAsTouched();
      expect(component.hasError('operatorCode')).toBeTrue();
    });

    it('should return error messages', () => {
      component.form.get('operatorCode')?.markAsTouched();
      expect(component.getError('operatorCode')).toBe('This field is required');
    });

    it('should return false for hasError on non-existent field', () => {
      expect(component.hasError('nonExistent')).toBeFalse();
    });
  });
});
