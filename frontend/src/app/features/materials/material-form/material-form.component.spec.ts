import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MaterialFormComponent } from './material-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Material } from '../../../shared/models';

describe('MaterialFormComponent', () => {
  let component: MaterialFormComponent;
  let fixture: ComponentFixture<MaterialFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockMaterial: Material = {
    materialId: 1,
    materialCode: 'MAT-001',
    materialName: 'Steel Billet',
    materialType: 'RM',
    baseUnit: 'KG',
    description: 'Raw steel billet',
    status: 'ACTIVE'
  };

  // TASK-M4: Mock material with extended fields
  const mockMaterialWithExtended: Material = {
    ...mockMaterial,
    materialGroup: 'Ferrous',
    sku: 'SKU-001',
    standardCost: 100.50,
    costCurrency: 'USD',
    minStockLevel: 10,
    maxStockLevel: 1000,
    reorderPoint: 50,
    leadTimeDays: 14,
    shelfLifeDays: 365,
    storageConditions: 'Cool, dry place'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getMaterialById',
      'createMaterial',
      'updateMaterial'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [MaterialFormComponent],
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
    fixture = TestBed.createComponent(MaterialFormComponent);
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
      expect(component.materialId).toBeNull();
    });

    it('should have default material type RM', () => {
      expect(component.form.get('materialType')?.value).toBe('RM');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        materialCode: '',
        materialName: '',
        baseUnit: ''
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create material successfully', () => {
      apiServiceSpy.createMaterial.and.returnValue(of(mockMaterial));

      component.form.patchValue({
        materialCode: 'MAT-001',
        materialName: 'Steel Billet',
        materialType: 'RM',
        baseUnit: 'KG'
      });

      component.onSubmit();

      expect(apiServiceSpy.createMaterial).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getMaterialById.and.returnValue(of(mockMaterial));
      createComponent();
    });

    it('should be in edit mode when id param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.materialId).toBe(1);
    });

    it('should load material data', () => {
      expect(apiServiceSpy.getMaterialById).toHaveBeenCalledWith(1);
      expect(component.form.get('materialName')?.value).toBe('Steel Billet');
      expect(component.form.get('materialType')?.value).toBe('RM');
    });

    it('should disable materialCode in edit mode', () => {
      expect(component.form.get('materialCode')?.disabled).toBeTrue();
    });

    it('should update material successfully', () => {
      apiServiceSpy.updateMaterial.and.returnValue(of(mockMaterial));

      component.form.patchValue({
        materialName: 'Updated Name'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateMaterial).toHaveBeenCalledWith(1, jasmine.any(Object));
    });
  });

  describe('Material Types', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should have material types available', () => {
      expect(component.materialTypes.length).toBe(4);
    });

    it('should include all material types', () => {
      const types = component.materialTypes.map(t => t.value);
      expect(types).toContain('RM');
      expect(types).toContain('IM');
      expect(types).toContain('FG');
      expect(types).toContain('WIP');
    });
  });

  // TASK-M4: Extended Fields Tests
  describe('Extended Fields (TASK-M4)', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should have extended fields hidden by default', () => {
      expect(component.showExtendedFields).toBeFalse();
    });

    it('should toggle extended fields visibility', () => {
      component.toggleExtendedFields();
      expect(component.showExtendedFields).toBeTrue();
      component.toggleExtendedFields();
      expect(component.showExtendedFields).toBeFalse();
    });

    it('should have all extended form controls', () => {
      expect(component.form.get('materialGroup')).toBeTruthy();
      expect(component.form.get('sku')).toBeTruthy();
      expect(component.form.get('standardCost')).toBeTruthy();
      expect(component.form.get('costCurrency')).toBeTruthy();
      expect(component.form.get('minStockLevel')).toBeTruthy();
      expect(component.form.get('maxStockLevel')).toBeTruthy();
      expect(component.form.get('reorderPoint')).toBeTruthy();
      expect(component.form.get('leadTimeDays')).toBeTruthy();
      expect(component.form.get('shelfLifeDays')).toBeTruthy();
      expect(component.form.get('storageConditions')).toBeTruthy();
    });

    it('should have currency options', () => {
      expect(component.currencies.length).toBeGreaterThan(0);
      const currencyValues = component.currencies.map(c => c.value);
      expect(currencyValues).toContain('USD');
      expect(currencyValues).toContain('EUR');
    });

    it('should validate cost as non-negative', () => {
      component.form.patchValue({ standardCost: -10 });
      expect(component.form.get('standardCost')?.invalid).toBeTrue();
    });

    it('should validate stock levels as non-negative', () => {
      component.form.patchValue({ minStockLevel: -5 });
      expect(component.form.get('minStockLevel')?.invalid).toBeTrue();
    });

    it('should validate lead time max value', () => {
      component.form.patchValue({ leadTimeDays: 500 });
      expect(component.form.get('leadTimeDays')?.invalid).toBeTrue();
    });
  });

  describe('Extended Fields in Edit Mode (TASK-M4)', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getMaterialById.and.returnValue(of(mockMaterialWithExtended));
      createComponent();
    });

    it('should load extended fields from material', () => {
      expect(component.form.get('materialGroup')?.value).toBe('Ferrous');
      expect(component.form.get('sku')?.value).toBe('SKU-001');
      expect(component.form.get('standardCost')?.value).toBe(100.50);
      expect(component.form.get('minStockLevel')?.value).toBe(10);
      expect(component.form.get('maxStockLevel')?.value).toBe(1000);
      expect(component.form.get('leadTimeDays')?.value).toBe(14);
    });

    it('should auto-expand extended fields when data exists', () => {
      expect(component.showExtendedFields).toBeTrue();
    });

    it('should include extended fields in update request', () => {
      apiServiceSpy.updateMaterial.and.returnValue(of(mockMaterialWithExtended));

      component.onSubmit();

      expect(apiServiceSpy.updateMaterial).toHaveBeenCalled();
      const callArgs = apiServiceSpy.updateMaterial.calls.mostRecent().args[1];
      expect(callArgs.materialGroup).toBe('Ferrous');
      expect(callArgs.standardCost).toBe(100.50);
      expect(callArgs.minStockLevel).toBe(10);
    });
  });
});
