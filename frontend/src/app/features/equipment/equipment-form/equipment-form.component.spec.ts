import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { EquipmentFormComponent } from './equipment-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Equipment } from '../../../shared/models';

describe('EquipmentFormComponent', () => {
  let component: EquipmentFormComponent;
  let fixture: ComponentFixture<EquipmentFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let mockActivatedRoute: any;

  const mockEquipment: Equipment = {
    equipmentId: 1,
    equipmentCode: 'EQ-001',
    name: 'Furnace Alpha',
    equipmentType: 'BATCH',
    capacity: 5000,
    capacityUnit: 'KG',
    location: 'Building A',
    status: 'AVAILABLE' as any
  };

  const configureTestBed = async (routeParams: any = {}) => {
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => routeParams[key] || null
        }
      }
    };

    const spy = jasmine.createSpyObj('ApiService', [
      'getEquipmentById',
      'createEquipment',
      'updateEquipment',
      'getEquipmentTypes',
      'getEquipmentTypeConfig'
    ]);
    spy.getEquipmentTypes.and.returnValue(of([
      { equipment_type: 'BATCH', display_name: 'BATCH' },
      { equipment_type: 'CONTINUOUS', display_name: 'CONTINUOUS' }
    ]));
    spy.getEquipmentTypeConfig.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [EquipmentFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  };

  const createComponent = () => {
    fixture = TestBed.createComponent(EquipmentFormComponent);
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
      expect(component.equipmentId).toBeNull();
    });

    it('should have empty form for create', () => {
      expect(component.form.get('equipmentCode')?.value).toBe('');
      expect(component.form.get('name')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        equipmentCode: '',
        name: '',
        equipmentType: ''
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create equipment successfully', () => {
      apiServiceSpy.createEquipment.and.returnValue(of(mockEquipment));

      component.form.patchValue({
        equipmentCode: 'EQ-001',
        name: 'Furnace Alpha',
        equipmentType: 'BATCH'
      });

      component.onSubmit();

      expect(apiServiceSpy.createEquipment).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createEquipment.and.returnValue(
        throwError(() => ({ error: { message: 'Code already exists' } }))
      );

      component.form.patchValue({
        equipmentCode: 'EQ-001',
        name: 'Test',
        equipmentType: 'BATCH'
      });

      component.onSubmit();

      expect(component.error).toBe('Code already exists');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getEquipmentById.and.returnValue(of(mockEquipment));
      createComponent();
    });

    it('should be in edit mode when id param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.equipmentId).toBe(1);
    });

    it('should load equipment data', () => {
      expect(apiServiceSpy.getEquipmentById).toHaveBeenCalledWith(1);
      expect(component.form.get('name')?.value).toBe('Furnace Alpha');
    });

    it('should update equipment successfully', () => {
      apiServiceSpy.updateEquipment.and.returnValue(of(mockEquipment));

      component.form.patchValue({
        name: 'Updated Name'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateEquipment).toHaveBeenCalledWith(1, jasmine.any(Object));
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should validate max length', () => {
      const longString = 'a'.repeat(201);
      component.form.patchValue({ name: longString });
      expect(component.form.get('name')?.valid).toBeFalse();
    });

    it('should report field errors', () => {
      component.form.get('equipmentCode')?.markAsTouched();
      expect(component.hasError('equipmentCode')).toBeTrue();
    });

    it('should load equipment types from API', () => {
      expect(apiServiceSpy.getEquipmentTypes).toHaveBeenCalled();
      expect(component.equipmentTypes.length).toBe(2);
      expect(component.equipmentTypes[0].equipment_type).toBe('BATCH');
    });
  });
});
