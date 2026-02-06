import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { InventoryFormComponent } from './inventory-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Inventory } from '../../../shared/models';

describe('InventoryFormComponent', () => {
  let component: InventoryFormComponent;
  let fixture: ComponentFixture<InventoryFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockInventory: Inventory = {
    inventoryId: 1,
    materialId: 'RM-001',
    materialName: 'Iron Ore',
    inventoryType: 'RM',
    state: 'AVAILABLE' as any,
    quantity: 500,
    unit: 'KG',
    location: 'WH-01'
  };

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getInventoryById',
      'createInventory',
      'updateInventory',
      'getInventoryForms',
      'getInventoryFormConfig'
    ]);
    spy.getInventoryForms.and.returnValue(of([]));
    spy.getInventoryFormConfig.and.returnValue(of(null));

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [InventoryFormComponent],
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
    fixture = TestBed.createComponent(InventoryFormComponent);
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
      expect(component.inventoryId).toBeNull();
    });

    it('should have empty form for create', () => {
      expect(component.form.get('materialId')?.value).toBe('');
      expect(component.form.get('inventoryType')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        materialId: '',
        inventoryType: '',
        quantity: null
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create inventory successfully', () => {
      apiServiceSpy.createInventory.and.returnValue(of(mockInventory));

      component.form.patchValue({
        materialId: 'RM-001',
        inventoryType: 'RM',
        quantity: 500
      });

      component.onSubmit();

      expect(apiServiceSpy.createInventory).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createInventory.and.returnValue(
        throwError(() => ({ error: { message: 'Failed to create' } }))
      );

      component.form.patchValue({
        materialId: 'RM-001',
        inventoryType: 'RM',
        quantity: 500
      });

      component.onSubmit();

      expect(component.error).toBe('Failed to create');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getInventoryById.and.returnValue(of(mockInventory));
      createComponent();
    });

    it('should be in edit mode when id param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.inventoryId).toBe(1);
    });

    it('should load inventory data', () => {
      expect(apiServiceSpy.getInventoryById).toHaveBeenCalledWith(1);
      expect(component.form.get('materialId')?.value).toBe('RM-001');
      expect(component.form.get('inventoryType')?.value).toBe('RM');
    });

    it('should update inventory successfully', () => {
      apiServiceSpy.updateInventory.and.returnValue(of(mockInventory));

      component.form.patchValue({
        quantity: 600
      });

      component.onSubmit();

      expect(apiServiceSpy.updateInventory).toHaveBeenCalledWith(1, jasmine.any(Object));
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should validate max length for materialId', () => {
      const longString = 'a'.repeat(101);
      component.form.patchValue({ materialId: longString });
      expect(component.form.get('materialId')?.valid).toBeFalse();
    });

    it('should report field errors', () => {
      component.form.get('materialId')?.markAsTouched();
      expect(component.hasError('materialId')).toBeTrue();
    });

    it('should have correct inventory types', () => {
      expect(component.inventoryTypes).toEqual(['RM', 'IM', 'FG', 'WIP']);
    });
  });
});
