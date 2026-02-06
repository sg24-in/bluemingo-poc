import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProductDetailComponent } from './product-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('ProductDetailComponent', () => {
  let component: ProductDetailComponent;
  let fixture: ComponentFixture<ProductDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockProduct = {
    productId: 1,
    sku: 'PROD-001',
    productName: 'Test Product',
    description: 'Test Description',
    baseUnit: 'PCS',
    status: 'ACTIVE' as const,
    createdOn: new Date().toISOString()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getProductById',
      'deleteProduct',
      'activateProduct'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [ProductDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: {
                get: () => '1'
              }
            }
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  beforeEach(() => {
    apiServiceSpy.getProductById.and.returnValue(of(mockProduct));
    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load product on init', () => {
    expect(apiServiceSpy.getProductById).toHaveBeenCalledWith(1);
    expect(component.product).toEqual(mockProduct);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing product ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getProductById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [ProductDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProductDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No product ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading product', () => {
    apiServiceSpy.getProductById.and.returnValue(throwError(() => new Error('Error')));

    component.loadProduct(1);

    expect(component.error).toBe('Failed to load product');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit product', () => {
    spyOn(router, 'navigate');
    component.editProduct();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/products', 1, 'edit']);
  });

  it('should navigate back to product list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/products']);
  });

  it('should return correct status class for ACTIVE', () => {
    expect(component.getStatusClass('ACTIVE')).toBe('status-active');
  });

  it('should return correct status class for INACTIVE', () => {
    expect(component.getStatusClass('INACTIVE')).toBe('status-inactive');
  });

  it('should deactivate active product', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deleteProduct.and.returnValue(of(void 0));
    apiServiceSpy.getProductById.and.returnValue(of({ ...mockProduct, status: 'INACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.deleteProduct).toHaveBeenCalledWith(1);
  });

  it('should activate inactive product', () => {
    component.product = { ...mockProduct, status: 'INACTIVE' };
    apiServiceSpy.activateProduct.and.returnValue(of({ ...mockProduct, status: 'ACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.activateProduct).toHaveBeenCalledWith(1);
  });
});
