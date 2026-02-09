import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchFormComponent } from './batch-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Batch } from '../../../shared/models';

describe('BatchFormComponent', () => {
  let component: BatchFormComponent;
  let fixture: ComponentFixture<BatchFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockBatch: Batch = {
    batchId: 1,
    batchNumber: 'BATCH-001',
    materialId: 'RM-001',
    materialName: 'Iron Ore',
    quantity: 500,
    unit: 'KG',
    status: 'AVAILABLE',
    createdOn: '2026-01-01T00:00:00'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => routeParams[key] || null
        }
      }
    };

    const spy = jasmine.createSpyObj('ApiService', [
      'getBatchById',
      'createBatch',
      'updateBatch'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [BatchFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  };

  const createComponent = () => {
    fixture = TestBed.createComponent(BatchFormComponent);
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

    it('should be in create mode when no batchId param', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.batchId).toBeNull();
    });

    it('should have empty form for create', () => {
      expect(component.form.get('batchNumber')?.value).toBe('');
      expect(component.form.get('materialId')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        batchNumber: '',
        materialId: '',
        quantity: null
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create batch successfully', () => {
      apiServiceSpy.createBatch.and.returnValue(of(mockBatch));

      component.form.patchValue({
        batchNumber: 'BATCH-001',
        materialId: 'RM-001',
        quantity: 500
      });

      component.onSubmit();

      expect(apiServiceSpy.createBatch).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createBatch.and.returnValue(
        throwError(() => ({ error: { message: 'Batch number already exists' } }))
      );

      component.form.patchValue({
        batchNumber: 'BATCH-001',
        materialId: 'RM-001',
        quantity: 500
      });

      component.onSubmit();

      expect(component.error).toBe('Batch number already exists');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ batchId: '1' });
      apiServiceSpy.getBatchById.and.returnValue(of(mockBatch));
      createComponent();
    });

    it('should be in edit mode when batchId param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.batchId).toBe(1);
    });

    it('should load batch data', () => {
      expect(apiServiceSpy.getBatchById).toHaveBeenCalledWith(1);
      expect(component.form.get('batchNumber')?.value).toBe('BATCH-001');
      expect(component.form.get('materialId')?.value).toBe('RM-001');
    });

    it('should update batch successfully', () => {
      apiServiceSpy.updateBatch.and.returnValue(of(mockBatch));

      component.form.patchValue({
        quantity: 600
      });

      component.onSubmit();

      expect(apiServiceSpy.updateBatch).toHaveBeenCalledWith(1, jasmine.any(Object));
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should validate max length for batchNumber', () => {
      const longString = 'a'.repeat(101);
      component.form.patchValue({ batchNumber: longString });
      expect(component.form.get('batchNumber')?.valid).toBeFalse();
    });

    it('should report field errors', () => {
      component.form.get('batchNumber')?.markAsTouched();
      expect(component.hasError('batchNumber')).toBeTrue();
    });
  });
});
