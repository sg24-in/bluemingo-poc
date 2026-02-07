import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { BatchSizeFormComponent } from './batch-size-form.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('BatchSizeFormComponent', () => {
  let component: BatchSizeFormComponent;
  let fixture: ComponentFixture<BatchSizeFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockConfig = {
    configId: 1,
    operationType: 'MELTING',
    materialId: 'RM-001',
    productSku: null,
    equipmentType: null,
    minBatchSize: 5,
    maxBatchSize: 50,
    preferredBatchSize: 45,
    unit: 'T',
    allowPartialBatch: true,
    isActive: true,
    priority: 10
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getBatchSizeConfig',
      'createBatchSizeConfig',
      'updateBatchSizeConfig'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [BatchSizeFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({})
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      fixture = TestBed.createComponent(BatchSizeFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize in create mode', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.configId).toBeNull();
    });

    it('should show create title', () => {
      expect(component.title).toBe('New Batch Size Configuration');
    });

    it('should initialize form with default values', () => {
      expect(component.form.get('unit')?.value).toBe('T');
      expect(component.form.get('allowPartialBatch')?.value).toBeTrue();
      expect(component.form.get('priority')?.value).toBe(0);
    });

    describe('Form Validation', () => {
      it('should require max batch size', () => {
        expect(component.form.get('maxBatchSize')?.errors?.['required']).toBeTrue();
      });

      it('should validate min batch size >= 0', () => {
        component.form.get('minBatchSize')?.setValue(-1);
        expect(component.form.get('minBatchSize')?.errors?.['min']).toBeTruthy();
      });

      it('should validate max batch size > 0', () => {
        component.form.get('maxBatchSize')?.setValue(0);
        expect(component.form.get('maxBatchSize')?.errors?.['min']).toBeTruthy();
      });

      it('should be valid with required fields', () => {
        component.form.patchValue({ maxBatchSize: 50 });
        expect(component.form.valid).toBeTrue();
      });
    });

    describe('Submit', () => {
      it('should not submit if form is invalid', () => {
        component.onSubmit();
        expect(apiServiceSpy.createBatchSizeConfig).not.toHaveBeenCalled();
      });

      it('should show error if min > max', () => {
        component.form.patchValue({
          minBatchSize: 100,
          maxBatchSize: 50
        });

        component.onSubmit();

        expect(component.error).toBe('Min batch size cannot be greater than max batch size');
        expect(apiServiceSpy.createBatchSizeConfig).not.toHaveBeenCalled();
      });

      it('should show error if preferred out of range', () => {
        component.form.patchValue({
          minBatchSize: 10,
          maxBatchSize: 50,
          preferredBatchSize: 5
        });

        component.onSubmit();

        expect(component.error).toBe('Preferred batch size must be between min and max');
      });

      it('should create config successfully', fakeAsync(() => {
        spyOn(router, 'navigate');
        apiServiceSpy.createBatchSizeConfig.and.returnValue(of({ configId: 10 }));

        component.form.patchValue({
          operationType: 'CASTING',
          maxBatchSize: 25
        });

        component.onSubmit();
        tick();

        expect(apiServiceSpy.createBatchSizeConfig).toHaveBeenCalled();
        expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-size']);
      }));

      it('should handle create error', fakeAsync(() => {
        apiServiceSpy.createBatchSizeConfig.and.returnValue(throwError(() => ({ error: { message: 'Create failed' } })));

        component.form.patchValue({ maxBatchSize: 50 });
        component.onSubmit();
        tick();

        expect(component.error).toBe('Create failed');
        expect(component.saving).toBeFalse();
      }));
    });

    describe('Cancel', () => {
      it('should navigate back on cancel', () => {
        spyOn(router, 'navigate');
        component.cancel();
        expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-size']);
      });
    });
  });
});

describe('BatchSizeFormComponent Edit Mode', () => {
  let component: BatchSizeFormComponent;
  let fixture: ComponentFixture<BatchSizeFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockConfig = {
    configId: 1,
    operationType: 'MELTING',
    materialId: 'RM-001',
    productSku: null,
    equipmentType: null,
    minBatchSize: 5,
    maxBatchSize: 50,
    preferredBatchSize: 45,
    unit: 'T',
    allowPartialBatch: true,
    isActive: true,
    priority: 10
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getBatchSizeConfig',
      'createBatchSizeConfig',
      'updateBatchSizeConfig'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [BatchSizeFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: '1' })
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getBatchSizeConfig.and.returnValue(of(mockConfig));
    fixture = TestBed.createComponent(BatchSizeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize in edit mode', () => {
    expect(component.isEditMode).toBeTrue();
    expect(component.configId).toBe(1);
  });

  it('should show edit title', () => {
    expect(component.title).toBe('Edit Batch Size Configuration');
  });

  it('should load config data', () => {
    expect(apiServiceSpy.getBatchSizeConfig).toHaveBeenCalledWith(1);
  });

  it('should populate form with config data', () => {
    expect(component.form.get('operationType')?.value).toBe('MELTING');
    expect(component.form.get('materialId')?.value).toBe('RM-001');
    expect(component.form.get('maxBatchSize')?.value).toBe(50);
    expect(component.form.get('preferredBatchSize')?.value).toBe(45);
  });

  it('should update config successfully', fakeAsync(() => {
    spyOn(router, 'navigate');
    apiServiceSpy.updateBatchSizeConfig.and.returnValue(of({ configId: 1 }));

    component.form.patchValue({ maxBatchSize: 60 });
    component.onSubmit();
    tick();

    expect(apiServiceSpy.updateBatchSizeConfig).toHaveBeenCalledWith(1, jasmine.objectContaining({
      maxBatchSize: 60
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/manage/config/batch-size']);
  }));

  it('should handle update error', fakeAsync(() => {
    apiServiceSpy.updateBatchSizeConfig.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));

    component.onSubmit();
    tick();

    expect(component.error).toBe('Update failed');
    expect(component.saving).toBeFalse();
  }));

  it('should handle load error', () => {
    apiServiceSpy.getBatchSizeConfig.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));

    component.loadConfig(999);

    expect(component.error).toBe('Not found');
    expect(component.loading).toBeFalse();
  });
});
