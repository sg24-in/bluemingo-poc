import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { HoldReasonsFormComponent } from './hold-reasons-form.component';
import { HoldReason } from '../../../shared/models';

describe('HoldReasonsFormComponent', () => {
  let component: HoldReasonsFormComponent;
  let fixture: ComponentFixture<HoldReasonsFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockHoldReason: HoldReason = {
    reasonId: 1,
    reasonCode: 'QUALITY',
    reasonDescription: 'Quality Issue',
    applicableTo: 'BATCH',
    status: 'ACTIVE'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getHoldReasonById', 'createHoldReason', 'updateHoldReason'
    ]);
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, RouterTestingModule, ReactiveFormsModule, SharedModule],
      declarations: [HoldReasonsFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: (key: string) => routeParams[key] || null } } } }
      ]
    }).compileComponents();
    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  };

  const createComponent = () => {
    fixture = TestBed.createComponent(HoldReasonsFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should create', async () => {
    await configureTestBed();
    createComponent();
    expect(component).toBeTruthy();
  });

  it('should be in create mode when no id param', async () => {
    await configureTestBed();
    createComponent();
    expect(component.isEditMode).toBe(false);
    expect(component.itemId).toBeNull();
  });

  it('should initialize form with default values in create mode', async () => {
    await configureTestBed();
    createComponent();
    expect(component.form.get('reasonCode')?.value).toBe('');
    expect(component.form.get('reasonDescription')?.value).toBe('');
    expect(component.form.get('applicableTo')?.value).toBe('');
    expect(component.form.get('status')?.value).toBe('ACTIVE');
    expect(component.form.get('reasonCode')?.enabled).toBe(true);
  });

  it('should validate required fields', async () => {
    await configureTestBed();
    createComponent();
    const reasonCodeControl = component.form.get('reasonCode');
    const reasonDescriptionControl = component.form.get('reasonDescription');

    reasonCodeControl?.setValue('');
    reasonCodeControl?.markAsTouched();
    expect(reasonCodeControl?.hasError('required')).toBe(true);

    reasonDescriptionControl?.setValue('');
    reasonDescriptionControl?.markAsTouched();
    expect(reasonDescriptionControl?.hasError('required')).toBe(true);
  });

  it('should validate maxLength for reasonCode', async () => {
    await configureTestBed();
    createComponent();
    const reasonCodeControl = component.form.get('reasonCode');

    reasonCodeControl?.setValue('A'.repeat(51));
    expect(reasonCodeControl?.hasError('maxlength')).toBe(true);

    reasonCodeControl?.setValue('VALID');
    expect(reasonCodeControl?.hasError('maxlength')).toBe(false);
  });

  it('should validate maxLength for reasonDescription', async () => {
    await configureTestBed();
    createComponent();
    const reasonDescriptionControl = component.form.get('reasonDescription');

    reasonDescriptionControl?.setValue('A'.repeat(256));
    expect(reasonDescriptionControl?.hasError('maxlength')).toBe(true);

    reasonDescriptionControl?.setValue('Valid description');
    expect(reasonDescriptionControl?.hasError('maxlength')).toBe(false);
  });

  it('should create hold reason successfully', async () => {
    await configureTestBed();
    apiServiceSpy.createHoldReason.and.returnValue(of(mockHoldReason));
    createComponent();

    component.form.patchValue({
      reasonCode: 'QUALITY',
      reasonDescription: 'Quality Issue',
      applicableTo: 'BATCH',
      status: 'ACTIVE'
    });

    spyOn(component['router'], 'navigate');
    component.onSubmit();

    expect(apiServiceSpy.createHoldReason).toHaveBeenCalledWith({
      reasonCode: 'QUALITY',
      reasonDescription: 'Quality Issue',
      applicableTo: 'BATCH',
      status: 'ACTIVE'
    });
    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/hold-reasons']);
  });

  it('should handle create error', async () => {
    await configureTestBed();
    apiServiceSpy.createHoldReason.and.returnValue(throwError(() => ({ error: { message: 'Create failed' } })));
    createComponent();

    component.form.patchValue({
      reasonCode: 'QUALITY',
      reasonDescription: 'Quality Issue',
      status: 'ACTIVE'
    });

    component.onSubmit();

    expect(component.error).toBe('Create failed');
    expect(component.saving).toBe(false);
  });

  it('should be in edit mode when id param is provided', async () => {
    await configureTestBed({ id: '1' });
    apiServiceSpy.getHoldReasonById.and.returnValue(of(mockHoldReason));
    createComponent();

    expect(component.isEditMode).toBe(true);
    expect(component.itemId).toBe(1);
  });

  it('should load hold reason in edit mode', async () => {
    await configureTestBed({ id: '1' });
    apiServiceSpy.getHoldReasonById.and.returnValue(of(mockHoldReason));
    createComponent();

    expect(apiServiceSpy.getHoldReasonById).toHaveBeenCalledWith(1);
    expect(component.form.get('reasonCode')?.value).toBe('QUALITY');
    expect(component.form.get('reasonDescription')?.value).toBe('Quality Issue');
    expect(component.form.get('applicableTo')?.value).toBe('BATCH');
    expect(component.form.get('status')?.value).toBe('ACTIVE');
  });

  it('should disable reasonCode in edit mode', async () => {
    await configureTestBed({ id: '1' });
    apiServiceSpy.getHoldReasonById.and.returnValue(of(mockHoldReason));
    createComponent();

    expect(component.form.get('reasonCode')?.disabled).toBe(true);
  });

  it('should update hold reason successfully', async () => {
    await configureTestBed({ id: '1' });
    apiServiceSpy.getHoldReasonById.and.returnValue(of(mockHoldReason));
    apiServiceSpy.updateHoldReason.and.returnValue(of(mockHoldReason));
    createComponent();

    component.form.patchValue({
      reasonDescription: 'Updated Description',
      applicableTo: 'INVENTORY',
      status: 'INACTIVE'
    });

    spyOn(component['router'], 'navigate');
    component.onSubmit();

    expect(apiServiceSpy.updateHoldReason).toHaveBeenCalledWith(1, {
      reasonCode: 'QUALITY',
      reasonDescription: 'Updated Description',
      applicableTo: 'INVENTORY',
      status: 'INACTIVE'
    });
    expect(component['router'].navigate).toHaveBeenCalledWith(['/manage/config/hold-reasons']);
  });

  it('should handle update error', async () => {
    await configureTestBed({ id: '1' });
    apiServiceSpy.getHoldReasonById.and.returnValue(of(mockHoldReason));
    apiServiceSpy.updateHoldReason.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));
    createComponent();

    component.form.patchValue({
      reasonDescription: 'Updated Description'
    });

    component.onSubmit();

    expect(component.error).toBe('Update failed');
    expect(component.saving).toBe(false);
  });

  it('should not submit if form is invalid', async () => {
    await configureTestBed();
    createComponent();

    component.form.patchValue({
      reasonCode: '',
      reasonDescription: ''
    });

    component.onSubmit();

    expect(apiServiceSpy.createHoldReason).not.toHaveBeenCalled();
    expect(apiServiceSpy.updateHoldReason).not.toHaveBeenCalled();
  });

  it('should check hasError correctly', async () => {
    await configureTestBed();
    createComponent();

    const reasonCodeControl = component.form.get('reasonCode');
    reasonCodeControl?.setValue('');
    reasonCodeControl?.markAsTouched();

    expect(component.hasError('reasonCode')).toBe(true);

    reasonCodeControl?.setValue('VALID');
    expect(component.hasError('reasonCode')).toBe(false);
  });

  it('should return false for hasError if field does not exist', async () => {
    await configureTestBed();
    createComponent();

    expect(component.hasError('nonexistentField')).toBe(false);
  });

  it('should handle error loading hold reason in edit mode', async () => {
    await configureTestBed({ id: '1' });
    apiServiceSpy.getHoldReasonById.and.returnValue(throwError(() => ({ error: { message: 'Load failed' } })));
    createComponent();

    expect(component.loading).toBe(false);
    expect(component.error).toBe('Load failed');
  });

  it('should have entity types available for multi-select', async () => {
    await configureTestBed();
    createComponent();

    expect(component.entityTypes).toEqual(['ORDER', 'ORDER_LINE', 'OPERATION', 'PROCESS', 'BATCH', 'INVENTORY', 'EQUIPMENT']);
    expect(component.selectedEntityTypes.size).toBe(0);
  });

  it('should toggle entity type selection', async () => {
    await configureTestBed();
    createComponent();

    component.toggleEntityType('BATCH');
    expect(component.isEntityTypeSelected('BATCH')).toBe(true);
    expect(component.form.get('applicableTo')?.value).toBe('BATCH');

    component.toggleEntityType('ORDER');
    expect(component.isEntityTypeSelected('ORDER')).toBe(true);
    expect(component.form.get('applicableTo')?.value).toContain('BATCH');
    expect(component.form.get('applicableTo')?.value).toContain('ORDER');

    component.toggleEntityType('BATCH');
    expect(component.isEntityTypeSelected('BATCH')).toBe(false);
    expect(component.form.get('applicableTo')?.value).toBe('ORDER');
  });

  it('should select all entity types', async () => {
    await configureTestBed();
    createComponent();

    component.selectAllEntityTypes();
    expect(component.selectedEntityTypes.size).toBe(7);
    expect(component.form.get('applicableTo')?.value).toContain('ORDER');
    expect(component.form.get('applicableTo')?.value).toContain('PROCESS');
    expect(component.form.get('applicableTo')?.value).toContain('EQUIPMENT');
  });

  it('should clear all entity types', async () => {
    await configureTestBed();
    createComponent();

    component.selectAllEntityTypes();
    expect(component.selectedEntityTypes.size).toBe(7);

    component.clearAllEntityTypes();
    expect(component.selectedEntityTypes.size).toBe(0);
    expect(component.form.get('applicableTo')?.value).toBe('');
  });

  it('should parse applicableTo from loaded data in edit mode', async () => {
    await configureTestBed({ id: '1' });
    const multiApplicable = { ...mockHoldReason, applicableTo: 'BATCH,ORDER,INVENTORY' };
    apiServiceSpy.getHoldReasonById.and.returnValue(of(multiApplicable));
    createComponent();

    expect(component.selectedEntityTypes.size).toBe(3);
    expect(component.isEntityTypeSelected('BATCH')).toBe(true);
    expect(component.isEntityTypeSelected('ORDER')).toBe(true);
    expect(component.isEntityTypeSelected('INVENTORY')).toBe(true);
    expect(component.isEntityTypeSelected('EQUIPMENT')).toBe(false);
  });

  it('should parse PROCESS and ORDER_LINE entity types', async () => {
    await configureTestBed({ id: '1' });
    const data = { ...mockHoldReason, applicableTo: 'OPERATION,PROCESS,ORDER_LINE,BATCH,INVENTORY' };
    apiServiceSpy.getHoldReasonById.and.returnValue(of(data));
    createComponent();

    expect(component.selectedEntityTypes.size).toBe(5);
    expect(component.isEntityTypeSelected('PROCESS')).toBe(true);
    expect(component.isEntityTypeSelected('ORDER_LINE')).toBe(true);
    expect(component.isEntityTypeSelected('OPERATION')).toBe(true);
    expect(component.isEntityTypeSelected('BATCH')).toBe(true);
    expect(component.isEntityTypeSelected('INVENTORY')).toBe(true);
  });

  it('should filter out invalid entity types from loaded data', async () => {
    await configureTestBed({ id: '1' });
    const data = { ...mockHoldReason, applicableTo: 'BATCH,INVALID_TYPE,ORDER' };
    apiServiceSpy.getHoldReasonById.and.returnValue(of(data));
    createComponent();

    expect(component.selectedEntityTypes.size).toBe(2);
    expect(component.isEntityTypeSelected('BATCH')).toBe(true);
    expect(component.isEntityTypeSelected('ORDER')).toBe(true);
    expect(component.isEntityTypeSelected('INVALID_TYPE' as any)).toBe(false);
  });
});
