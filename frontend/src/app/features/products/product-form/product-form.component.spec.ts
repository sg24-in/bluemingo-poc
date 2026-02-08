import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProductFormComponent } from './product-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Product } from '../../../shared/models';

describe('ProductFormComponent', () => {
  let component: ProductFormComponent;
  let fixture: ComponentFixture<ProductFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockProduct: Product = {
    productId: 1,
    sku: 'SKU-001',
    productName: 'Steel Rod 10mm',
    baseUnit: 'MTR',
    description: 'Steel rod 10mm diameter',
    status: 'ACTIVE'
  };

  // TASK-M4: Mock product with extended fields
  const mockProductWithExtended: Product = {
    ...mockProduct,
    productCategory: 'Steel Products',
    productGroup: 'Rebars',
    weightPerUnit: 1.5,
    weightUnit: 'KG',
    standardPrice: 500.00,
    priceCurrency: 'USD',
    minOrderQty: 100,
    leadTimeDays: 14,
    materialId: 5
  };

  // TASK-M4: Mock materials for linking
  const mockMaterials = [
    { materialId: 5, materialCode: 'MAT-001', materialName: 'Steel Billet', status: 'ACTIVE' },
    { materialId: 6, materialCode: 'MAT-002', materialName: 'Steel Rod', status: 'ACTIVE' }
  ];

  const configureTestBed = async (routeParams: any = {}) => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getProductById',
      'createProduct',
      'updateProduct',
      'getAllMaterials'  // TASK-M4: Add materials API
    ]);
    spy.getAllMaterials.and.returnValue(of(mockMaterials));  // TASK-M4

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [ProductFormComponent],
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
    fixture = TestBed.createComponent(ProductFormComponent);
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
      expect(component.productId).toBeNull();
    });

    it('should have empty form for create', () => {
      expect(component.form.get('sku')?.value).toBe('');
      expect(component.form.get('productName')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        sku: '',
        productName: '',
        baseUnit: ''
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create product successfully', () => {
      apiServiceSpy.createProduct.and.returnValue(of(mockProduct));

      component.form.patchValue({
        sku: 'SKU-001',
        productName: 'Steel Rod 10mm',
        baseUnit: 'MTR'
      });

      component.onSubmit();

      expect(apiServiceSpy.createProduct).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createProduct.and.returnValue(
        throwError(() => ({ error: { message: 'SKU already exists' } }))
      );

      component.form.patchValue({
        sku: 'SKU-001',
        productName: 'Test',
        baseUnit: 'PCS'
      });

      component.onSubmit();

      expect(component.error).toBe('SKU already exists');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getProductById.and.returnValue(of(mockProduct));
      createComponent();
    });

    it('should be in edit mode when id param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.productId).toBe(1);
    });

    it('should load product data', () => {
      expect(apiServiceSpy.getProductById).toHaveBeenCalledWith(1);
      expect(component.form.get('productName')?.value).toBe('Steel Rod 10mm');
      expect(component.form.get('baseUnit')?.value).toBe('MTR');
    });

    it('should disable sku in edit mode', () => {
      expect(component.form.get('sku')?.disabled).toBeTrue();
    });

    it('should update product successfully', () => {
      apiServiceSpy.updateProduct.and.returnValue(of(mockProduct));

      component.form.patchValue({
        productName: 'Updated Name'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateProduct).toHaveBeenCalledWith(1, jasmine.any(Object));
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await configureTestBed();
      createComponent();
    });

    it('should validate max length for SKU', () => {
      const longString = 'a'.repeat(51);
      component.form.patchValue({ sku: longString });
      expect(component.form.get('sku')?.valid).toBeFalse();
    });

    it('should validate max length for name', () => {
      const longString = 'a'.repeat(201);
      component.form.patchValue({ productName: longString });
      expect(component.form.get('productName')?.valid).toBeFalse();
    });

    it('should report field errors', () => {
      component.form.get('sku')?.markAsTouched();
      expect(component.hasError('sku')).toBeTrue();
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
      expect(component.form.get('productCategory')).toBeTruthy();
      expect(component.form.get('productGroup')).toBeTruthy();
      expect(component.form.get('weightPerUnit')).toBeTruthy();
      expect(component.form.get('weightUnit')).toBeTruthy();
      expect(component.form.get('standardPrice')).toBeTruthy();
      expect(component.form.get('priceCurrency')).toBeTruthy();
      expect(component.form.get('minOrderQty')).toBeTruthy();
      expect(component.form.get('leadTimeDays')).toBeTruthy();
      expect(component.form.get('materialId')).toBeTruthy();
    });

    it('should have currency options', () => {
      expect(component.currencies.length).toBeGreaterThan(0);
      const currencyValues = component.currencies.map(c => c.value);
      expect(currencyValues).toContain('USD');
      expect(currencyValues).toContain('EUR');
    });

    it('should have weight unit options', () => {
      expect(component.weightUnits.length).toBeGreaterThan(0);
      const weightValues = component.weightUnits.map(w => w.value);
      expect(weightValues).toContain('KG');
      expect(weightValues).toContain('T');
    });

    it('should load materials for linking', () => {
      expect(component.materials.length).toBe(2);
      expect(component.materials[0].materialCode).toBe('MAT-001');
    });

    it('should validate price as non-negative', () => {
      component.form.patchValue({ standardPrice: -10 });
      expect(component.form.get('standardPrice')?.invalid).toBeTrue();
    });

    it('should validate weight as non-negative', () => {
      component.form.patchValue({ weightPerUnit: -1 });
      expect(component.form.get('weightPerUnit')?.invalid).toBeTrue();
    });

    it('should validate lead time max value', () => {
      component.form.patchValue({ leadTimeDays: 500 });
      expect(component.form.get('leadTimeDays')?.invalid).toBeTrue();
    });
  });

  describe('Extended Fields in Edit Mode (TASK-M4)', () => {
    beforeEach(async () => {
      await configureTestBed({ id: '1' });
      apiServiceSpy.getProductById.and.returnValue(of(mockProductWithExtended));
      createComponent();
    });

    it('should load extended fields from product', () => {
      expect(component.form.get('productCategory')?.value).toBe('Steel Products');
      expect(component.form.get('productGroup')?.value).toBe('Rebars');
      expect(component.form.get('weightPerUnit')?.value).toBe(1.5);
      expect(component.form.get('standardPrice')?.value).toBe(500.00);
      expect(component.form.get('minOrderQty')?.value).toBe(100);
      expect(component.form.get('materialId')?.value).toBe(5);
    });

    it('should auto-expand extended fields when data exists', () => {
      expect(component.showExtendedFields).toBeTrue();
    });

    it('should include extended fields in update request', () => {
      apiServiceSpy.updateProduct.and.returnValue(of(mockProductWithExtended));

      component.onSubmit();

      expect(apiServiceSpy.updateProduct).toHaveBeenCalled();
      const callArgs = apiServiceSpy.updateProduct.calls.mostRecent().args[1];
      expect(callArgs.productCategory).toBe('Steel Products');
      expect(callArgs.weightPerUnit).toBe(1.5);
      expect(callArgs.standardPrice).toBe(500.00);
      expect(callArgs.materialId).toBe(5);
    });
  });
});
