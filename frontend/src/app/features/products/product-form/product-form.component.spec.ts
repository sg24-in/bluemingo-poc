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
    productSku: 'SKU-001',
    productName: 'Steel Rod 10mm',
    unit: 'MTR',
    description: 'Steel rod 10mm diameter',
    status: 'ACTIVE'
  };

  const createComponent = (routeParams: any = {}) => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          paramMap: {
            get: (key: string) => routeParams[key] || null
          }
        }
      }
    });

    fixture = TestBed.createComponent(ProductFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getProductById',
      'createProduct',
      'updateProduct'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        ReactiveFormsModule
      ],
      declarations: [ProductFormComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  describe('Create Mode', () => {
    beforeEach(() => {
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
      expect(component.form.get('productSku')?.value).toBe('');
      expect(component.form.get('productName')?.value).toBe('');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        productSku: '',
        productName: '',
        unit: ''
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create product successfully', () => {
      apiServiceSpy.createProduct.and.returnValue(of(mockProduct));

      component.form.patchValue({
        productSku: 'SKU-001',
        productName: 'Steel Rod 10mm',
        unit: 'MTR'
      });

      component.onSubmit();

      expect(apiServiceSpy.createProduct).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createProduct.and.returnValue(
        throwError(() => ({ error: { message: 'SKU already exists' } }))
      );

      component.form.patchValue({
        productSku: 'SKU-001',
        productName: 'Test',
        unit: 'PCS'
      });

      component.onSubmit();

      expect(component.error).toBe('SKU already exists');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      apiServiceSpy.getProductById.and.returnValue(of(mockProduct));
      createComponent({ id: '1' });
    });

    it('should be in edit mode when id param exists', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.productId).toBe(1);
    });

    it('should load product data', () => {
      expect(apiServiceSpy.getProductById).toHaveBeenCalledWith(1);
      expect(component.form.get('productName')?.value).toBe('Steel Rod 10mm');
      expect(component.form.get('unit')?.value).toBe('MTR');
    });

    it('should disable productSku in edit mode', () => {
      expect(component.form.get('productSku')?.disabled).toBeTrue();
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
    beforeEach(() => {
      createComponent();
    });

    it('should validate max length for SKU', () => {
      const longString = 'a'.repeat(51);
      component.form.patchValue({ productSku: longString });
      expect(component.form.get('productSku')?.valid).toBeFalse();
    });

    it('should validate max length for name', () => {
      const longString = 'a'.repeat(201);
      component.form.patchValue({ productName: longString });
      expect(component.form.get('productName')?.valid).toBeFalse();
    });

    it('should report field errors', () => {
      component.form.get('productSku')?.markAsTouched();
      expect(component.hasError('productSku')).toBeTrue();
    });
  });
});
