import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ReceiveMaterialComponent } from './receive-material.component';
import { ApiService } from '../../../core/services/api.service';
import { Material, ReceiveMaterialResponse } from '../../../shared/models';

describe('ReceiveMaterialComponent', () => {
  let component: ReceiveMaterialComponent;
  let fixture: ComponentFixture<ReceiveMaterialComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockMaterials: Material[] = [
    {
      materialId: 1,
      materialCode: 'RM-SCRAP-A',
      materialName: 'Steel Scrap Grade A',
      materialType: 'RM',
      baseUnit: 'T',
      status: 'ACTIVE'
    },
    {
      materialId: 2,
      materialCode: 'RM-IRON-ORE',
      materialName: 'Iron Ore Pellets',
      materialType: 'RM',
      baseUnit: 'T',
      status: 'ACTIVE'
    },
    {
      materialId: 3,
      materialCode: 'IM-SLAB',
      materialName: 'Steel Slab',
      materialType: 'IM',
      baseUnit: 'T',
      status: 'ACTIVE'
    }
  ];

  const mockReceiveResponse: ReceiveMaterialResponse = {
    batchId: 101,
    batchNumber: 'B-RM-101',
    inventoryId: 201,
    message: 'Material received successfully'
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getActiveMaterials',
      'receiveMaterial'
    ]);

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, RouterTestingModule],
      declarations: [ReceiveMaterialComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getActiveMaterials.and.returnValue(of(mockMaterials));
    fixture = TestBed.createComponent(ReceiveMaterialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with default values', () => {
    expect(component.form.get('materialId')?.value).toBe('');
    expect(component.form.get('quantity')?.value).toBeNull();
    expect(component.form.get('unit')?.value).toBe('KG');
    expect(component.form.get('receivedDate')?.value).toBeTruthy();
  });

  it('should load raw materials only', () => {
    expect(apiServiceSpy.getActiveMaterials).toHaveBeenCalled();
    expect(component.materials.length).toBe(2); // Only RM types
    expect(component.materials.every(m => m.materialType === 'RM')).toBeTrue();
  });

  describe('Form Validation', () => {
    it('should require material selection', () => {
      const control = component.form.get('materialId');
      expect(control?.valid).toBeFalse();

      control?.setValue('RM-SCRAP-A');
      expect(control?.valid).toBeTrue();
    });

    it('should require quantity greater than 0', () => {
      const control = component.form.get('quantity');
      expect(control?.valid).toBeFalse();

      control?.setValue(0);
      expect(control?.valid).toBeFalse();

      control?.setValue(0.0001);
      expect(control?.valid).toBeTrue();

      control?.setValue(100);
      expect(control?.valid).toBeTrue();
    });

    it('should require unit', () => {
      const control = component.form.get('unit');
      expect(control?.valid).toBeTrue(); // Has default 'KG'

      control?.setValue('');
      expect(control?.valid).toBeFalse();
    });

    it('should validate unit max length', () => {
      const control = component.form.get('unit');
      control?.setValue('A'.repeat(21));
      expect(control?.valid).toBeFalse();

      control?.setValue('T');
      expect(control?.valid).toBeTrue();
    });

    it('should validate optional fields max length', () => {
      const supplierBatch = component.form.get('supplierBatchNumber');
      supplierBatch?.setValue('A'.repeat(101));
      expect(supplierBatch?.valid).toBeFalse();

      supplierBatch?.setValue('SUP-BATCH-001');
      expect(supplierBatch?.valid).toBeTrue();
    });
  });

  describe('onMaterialChange', () => {
    it('should update form when material selected', () => {
      const event = { target: { value: 'RM-SCRAP-A' } } as unknown as Event;
      component.onMaterialChange(event);

      expect(component.form.get('materialName')?.value).toBe('Steel Scrap Grade A');
      expect(component.form.get('unit')?.value).toBe('T');
    });

    it('should clear form when material deselected', () => {
      component.form.patchValue({
        materialName: 'Some Material',
        unit: 'L'
      });

      const event = { target: { value: '' } } as unknown as Event;
      component.onMaterialChange(event);

      expect(component.form.get('materialName')?.value).toBe('');
      expect(component.form.get('unit')?.value).toBe('KG');
    });
  });

  describe('onSubmit', () => {
    it('should not submit invalid form', () => {
      component.onSubmit();
      expect(apiServiceSpy.receiveMaterial).not.toHaveBeenCalled();
    });

    it('should submit valid form', () => {
      apiServiceSpy.receiveMaterial.and.returnValue(of(mockReceiveResponse));

      component.form.patchValue({
        materialId: 'RM-SCRAP-A',
        materialName: 'Steel Scrap Grade A',
        quantity: 500,
        unit: 'T',
        location: 'Warehouse A'
      });

      component.onSubmit();

      expect(apiServiceSpy.receiveMaterial).toHaveBeenCalled();
      expect(component.receiptResult).toEqual(mockReceiveResponse);
      expect(component.successMessage).toBe('Material received successfully');
    });

    it('should handle submission error', () => {
      apiServiceSpy.receiveMaterial.and.returnValue(
        throwError(() => ({ error: { message: 'Duplicate batch number' } }))
      );

      component.form.patchValue({
        materialId: 'RM-SCRAP-A',
        quantity: 500,
        unit: 'T'
      });

      component.onSubmit();

      expect(component.saving).toBeFalse();
      expect(component.error).toBe('Duplicate batch number');
    });

    it('should handle error without message', () => {
      apiServiceSpy.receiveMaterial.and.returnValue(
        throwError(() => ({}))
      );

      component.form.patchValue({
        materialId: 'RM-SCRAP-A',
        quantity: 500,
        unit: 'T'
      });

      component.onSubmit();

      expect(component.error).toBe('Failed to receive material.');
    });
  });

  describe('Navigation', () => {
    it('should navigate to inventory on cancel', () => {
      spyOn(router, 'navigate');

      component.cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/inventory']);
    });

    it('should navigate to batch detail', () => {
      spyOn(router, 'navigate');
      component.receiptResult = mockReceiveResponse;

      component.viewBatch();

      expect(router.navigate).toHaveBeenCalledWith(['/batches', 101]);
    });

    it('should not navigate to batch without result', () => {
      spyOn(router, 'navigate');
      component.receiptResult = null;

      component.viewBatch();

      expect(router.navigate).not.toHaveBeenCalled();
    });

    it('should navigate to inventory detail', () => {
      spyOn(router, 'navigate');
      component.receiptResult = mockReceiveResponse;

      component.viewInventory();

      expect(router.navigate).toHaveBeenCalledWith(['/inventory', 201]);
    });

    it('should not navigate to inventory without result', () => {
      spyOn(router, 'navigate');
      component.receiptResult = null;

      component.viewInventory();

      expect(router.navigate).not.toHaveBeenCalled();
    });
  });

  describe('receiveAnother', () => {
    it('should reset state for new entry', () => {
      component.receiptResult = mockReceiveResponse;
      component.successMessage = 'Success';
      component.error = 'Error';

      component.receiveAnother();

      expect(component.receiptResult).toBeNull();
      expect(component.successMessage).toBe('');
      expect(component.error).toBe('');
    });
  });

  describe('hasError', () => {
    it('should report field errors when touched', () => {
      const control = component.form.get('materialId');
      control?.markAsTouched();

      expect(component.hasError('materialId')).toBeTrue();
    });

    it('should not report errors when untouched', () => {
      expect(component.hasError('materialId')).toBeFalse();
    });
  });

  describe('getError', () => {
    it('should return required error message', () => {
      const control = component.form.get('materialId');
      control?.markAsTouched();

      expect(component.getError('materialId')).toBe('This field is required');
    });

    it('should return min error message for quantity', () => {
      const control = component.form.get('quantity');
      control?.setValue(0);
      control?.markAsTouched();

      expect(component.getError('quantity')).toBe('Quantity must be greater than 0');
    });

    it('should return maxlength error message', () => {
      const control = component.form.get('unit');
      control?.setValue('A'.repeat(25));
      control?.markAsTouched();

      expect(component.getError('unit')).toBe('Value is too long');
    });
  });
});
