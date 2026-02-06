import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { BomNodeFormComponent } from './bom-node-form.component';
import { ApiService } from '../../../core/services/api.service';
import { BomTreeNode, Material, Product } from '../../../shared/models';

describe('BomNodeFormComponent', () => {
  let component: BomNodeFormComponent;
  let fixture: ComponentFixture<BomNodeFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;
  let paramsSubject: BehaviorSubject<any>;
  let queryParamsSubject: BehaviorSubject<any>;

  const mockMaterials: Material[] = [
    {
      materialId: 1,
      materialCode: 'RM-IRON-001',
      materialName: 'Iron Ore',
      materialType: 'RM',
      baseUnit: 'T',
      status: 'ACTIVE'
    },
    {
      materialId: 2,
      materialCode: 'RM-COAL-001',
      materialName: 'Coal',
      materialType: 'RM',
      baseUnit: 'T',
      status: 'ACTIVE'
    }
  ];

  const mockProducts: Product[] = [
    {
      productId: 1,
      sku: 'FG-STEEL-001',
      productName: 'Steel Plate',
      baseUnit: 'T',
      status: 'ACTIVE'
    },
    {
      productId: 2,
      sku: 'FG-STEEL-002',
      productName: 'Steel Coil',
      baseUnit: 'T',
      status: 'ACTIVE'
    }
  ];

  const mockBomNode: BomTreeNode = {
    bomId: 1,
    productSku: 'FG-STEEL-001',
    bomVersion: 'V1',
    materialId: 'RM-IRON-001',
    materialName: 'Iron Ore',
    quantityRequired: 1.5,
    unit: 'T',
    yieldLossRatio: 1.05,
    sequenceLevel: 1,
    parentBomId: undefined,
    status: 'ACTIVE',
    children: []
  };

  const createComponent = (routeParams: any = {}, queryParams: any = {}) => {
    paramsSubject.next(routeParams);
    queryParamsSubject.next(queryParams);
    fixture = TestBed.createComponent(BomNodeFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
    paramsSubject = new BehaviorSubject<any>({});
    queryParamsSubject = new BehaviorSubject<any>({});

    const spy = jasmine.createSpyObj('ApiService', [
      'getActiveMaterials',
      'getActiveProducts',
      'getBomNode',
      'createBomNode',
      'updateBomNode'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        ReactiveFormsModule
      ],
      declarations: [BomNodeFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: {
            params: paramsSubject.asObservable(),
            queryParams: queryParamsSubject.asObservable()
          }
        }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);

    // Default mock returns
    apiServiceSpy.getActiveMaterials.and.returnValue(of(mockMaterials));
    apiServiceSpy.getActiveProducts.and.returnValue(of(mockProducts));
  });

  describe('Create Mode (Existing Product)', () => {
    beforeEach(() => {
      createComponent({ productSku: 'FG-STEEL-001' });
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should be in create mode', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.isNewBom).toBeFalse();
    });

    it('should load materials', () => {
      expect(apiServiceSpy.getActiveMaterials).toHaveBeenCalled();
      expect(component.materials.length).toBe(2);
    });

    it('should NOT load products (not new BOM)', () => {
      expect(apiServiceSpy.getActiveProducts).not.toHaveBeenCalled();
    });

    it('should have empty form', () => {
      expect(component.form.get('materialId')?.value).toBe('');
      expect(component.form.get('materialName')?.value).toBe('');
    });

    it('should have default values', () => {
      expect(component.form.get('quantityRequired')?.value).toBe(1);
      expect(component.form.get('unit')?.value).toBe('KG');
      expect(component.form.get('yieldLossRatio')?.value).toBe(1);
      expect(component.form.get('sequenceLevel')?.value).toBe(1);
      expect(component.form.get('bomVersion')?.value).toBe('V1');
      expect(component.form.get('status')?.value).toBe('ACTIVE');
    });

    it('should validate required fields', () => {
      expect(component.form.invalid).toBeTrue();

      component.form.patchValue({
        materialId: 'RM-IRON-001',
        materialName: 'Iron Ore'
      });

      expect(component.form.valid).toBeTrue();
    });

    it('should validate quantity min value', () => {
      component.form.patchValue({ quantityRequired: 0 });
      expect(component.form.get('quantityRequired')?.valid).toBeFalse();

      component.form.patchValue({ quantityRequired: 0.0001 });
      expect(component.form.get('quantityRequired')?.valid).toBeTrue();
    });

    it('should create node successfully', () => {
      const createdNode = { ...mockBomNode };
      apiServiceSpy.createBomNode.and.returnValue(of(createdNode));
      const navigateSpy = spyOn(router, 'navigate');

      component.form.patchValue({
        materialId: 'RM-IRON-001',
        materialName: 'Iron Ore',
        quantityRequired: 1.5,
        unit: 'T'
      });

      component.onSubmit();

      expect(apiServiceSpy.createBomNode).toHaveBeenCalledWith(jasmine.objectContaining({
        productSku: 'FG-STEEL-001',
        materialId: 'RM-IRON-001',
        materialName: 'Iron Ore'
      }));
      expect(navigateSpy).toHaveBeenCalled();
    });

    it('should handle create error', () => {
      apiServiceSpy.createBomNode.and.returnValue(
        throwError(() => ({ error: { message: 'Material already exists' } }))
      );

      component.form.patchValue({
        materialId: 'RM-IRON-001',
        materialName: 'Iron Ore'
      });

      component.onSubmit();

      expect(component.error).toBe('Material already exists');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Create Mode (New BOM - Product Selection)', () => {
    beforeEach(() => {
      // No productSku param means new BOM (dedicated 'create' route)
      createComponent({});
    });

    it('should be in new BOM mode', () => {
      expect(component.isNewBom).toBeTrue();
      expect(component.isEditMode).toBeFalse();
    });

    it('should load products for selection', () => {
      expect(apiServiceSpy.getActiveProducts).toHaveBeenCalled();
      expect(component.products.length).toBe(2);
    });

    it('should have empty productSku form field', () => {
      expect(component.form.get('productSku')?.value).toBe('');
    });

    it('should select product via form control', () => {
      component.form.patchValue({ productSku: 'FG-STEEL-001' });
      expect(component.form.get('productSku')?.value).toBe('FG-STEEL-001');
    });

    it('should require product selection for new BOM', () => {
      apiServiceSpy.createBomNode.and.returnValue(of(mockBomNode));

      component.form.patchValue({
        materialId: 'RM-IRON-001',
        materialName: 'Iron Ore'
      });

      // Without selecting product, form should be invalid
      expect(component.form.invalid).toBeTrue();
      expect(component.form.get('productSku')?.errors?.['required']).toBeTruthy();

      component.onSubmit();

      // Form validation prevents submission
      expect(apiServiceSpy.createBomNode).not.toHaveBeenCalled();
    });

    it('should create node with selected product', () => {
      const createdNode = { ...mockBomNode };
      apiServiceSpy.createBomNode.and.returnValue(of(createdNode));
      const navigateSpy = spyOn(router, 'navigate');

      component.form.patchValue({
        productSku: 'FG-STEEL-001',
        materialId: 'RM-IRON-001',
        materialName: 'Iron Ore'
      });

      component.onSubmit();

      expect(apiServiceSpy.createBomNode).toHaveBeenCalledWith(jasmine.objectContaining({
        productSku: 'FG-STEEL-001'
      }));
    });

    it('should show correct title for new BOM', () => {
      expect(component.title).toBe('Create New BOM');
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      apiServiceSpy.getBomNode.and.returnValue(of(mockBomNode));
      createComponent({ productSku: 'FG-STEEL-001', bomId: '1' });
    });

    it('should be in edit mode', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.bomId).toBe(1);
    });

    it('should load existing node data', () => {
      expect(apiServiceSpy.getBomNode).toHaveBeenCalledWith(1);
      expect(component.form.get('materialId')?.value).toBe('RM-IRON-001');
      expect(component.form.get('materialName')?.value).toBe('Iron Ore');
      expect(component.form.get('quantityRequired')?.value).toBe(1.5);
      expect(component.form.get('status')?.value).toBe('ACTIVE');
    });

    it('should update node successfully', () => {
      apiServiceSpy.updateBomNode.and.returnValue(of(mockBomNode));
      const navigateSpy = spyOn(router, 'navigate');

      component.form.patchValue({
        materialName: 'Updated Iron Ore',
        status: 'INACTIVE'
      });

      component.onSubmit();

      expect(apiServiceSpy.updateBomNode).toHaveBeenCalledWith(1, jasmine.objectContaining({
        materialName: 'Updated Iron Ore',
        status: 'INACTIVE'
      }));
      expect(navigateSpy).toHaveBeenCalled();
    });

    it('should include status in update request', () => {
      apiServiceSpy.updateBomNode.and.returnValue(of(mockBomNode));

      component.form.patchValue({ status: 'DRAFT' });
      component.onSubmit();

      expect(apiServiceSpy.updateBomNode).toHaveBeenCalledWith(1, jasmine.objectContaining({
        status: 'DRAFT'
      }));
    });

    it('should show correct title for edit', () => {
      expect(component.title).toBe('Edit BOM Node');
    });

    it('should handle update error', () => {
      apiServiceSpy.updateBomNode.and.returnValue(
        throwError(() => ({ error: { message: 'Update failed' } }))
      );

      component.onSubmit();

      expect(component.error).toBe('Update failed');
      expect(component.saving).toBeFalse();
    });
  });

  describe('Add Child Node', () => {
    beforeEach(() => {
      const parentNode: BomTreeNode = {
        ...mockBomNode,
        sequenceLevel: 1,
        bomVersion: 'V2'
      };
      apiServiceSpy.getBomNode.and.returnValue(of(parentNode));
      createComponent({ productSku: 'FG-STEEL-001' }, { parentId: '1' });
    });

    it('should set parent BOM ID from query params', () => {
      expect(component.parentBomId).toBe(1);
    });

    it('should load parent info', () => {
      expect(apiServiceSpy.getBomNode).toHaveBeenCalledWith(1);
    });

    it('should show correct title for child node', () => {
      expect(component.title).toBe('Add Child Node');
    });
  });

  describe('Material Selection', () => {
    beforeEach(() => {
      createComponent({ productSku: 'FG-STEEL-001' });
    });

    it('should populate form when selecting material', () => {
      const event = { target: { value: 'RM-IRON-001' } } as any;
      component.onMaterialSelect(event);

      expect(component.form.get('materialId')?.value).toBe('RM-IRON-001');
      expect(component.form.get('materialName')?.value).toBe('Iron Ore');
      expect(component.form.get('unit')?.value).toBe('T');
    });

    it('should not populate form for invalid material', () => {
      const event = { target: { value: 'INVALID' } } as any;
      component.onMaterialSelect(event);

      expect(component.form.get('materialId')?.value).toBe('');
    });
  });

  describe('Status Field', () => {
    beforeEach(() => {
      apiServiceSpy.getBomNode.and.returnValue(of({
        ...mockBomNode,
        status: 'DRAFT'
      }));
      createComponent({ productSku: 'FG-STEEL-001', bomId: '1' });
    });

    it('should load status from node', () => {
      expect(component.form.get('status')?.value).toBe('DRAFT');
    });

    it('should allow changing status', () => {
      component.form.patchValue({ status: 'OBSOLETE' });
      expect(component.form.get('status')?.value).toBe('OBSOLETE');
    });
  });

  describe('Cancel', () => {
    it('should navigate back to tree for existing product', () => {
      createComponent({ productSku: 'FG-STEEL-001' });
      const navigateSpy = spyOn(router, 'navigate');

      component.cancel();

      expect(navigateSpy).toHaveBeenCalledWith(['/manage/bom', 'FG-STEEL-001', 'tree']);
    });

    it('should navigate back to list for new BOM', () => {
      createComponent({});
      const navigateSpy = spyOn(router, 'navigate');

      component.cancel();

      expect(navigateSpy).toHaveBeenCalledWith(['/manage/bom']);
    });
  });

  describe('Units', () => {
    beforeEach(() => {
      createComponent({ productSku: 'FG-STEEL-001' });
    });

    it('should have predefined units', () => {
      expect(component.units).toContain('KG');
      expect(component.units).toContain('T');
      expect(component.units).toContain('PCS');
      expect(component.units).toContain('M');
      expect(component.units).toContain('L');
    });
  });

  describe('Status Options', () => {
    beforeEach(() => {
      apiServiceSpy.getBomNode.and.returnValue(of(mockBomNode));
      createComponent({ productSku: 'FG-STEEL-001', bomId: '1' });
    });

    it('should have status options for edit mode', () => {
      expect(component.isEditMode).toBeTrue();
    });

    it('should allow all status values', () => {
      const validStatuses = ['ACTIVE', 'INACTIVE', 'DRAFT', 'OBSOLETE'];
      validStatuses.forEach(status => {
        component.form.patchValue({ status });
        expect(component.form.get('status')?.value).toBe(status);
      });
    });
  });

  describe('Yield Loss Ratio', () => {
    beforeEach(() => {
      createComponent({ productSku: 'FG-STEEL-001' });
    });

    it('should have default yield loss ratio of 1', () => {
      expect(component.form.get('yieldLossRatio')?.value).toBe(1);
    });

    it('should allow setting yield loss ratio', () => {
      component.form.patchValue({ yieldLossRatio: 1.15 });
      expect(component.form.get('yieldLossRatio')?.value).toBe(1.15);
    });
  });

  describe('BOM Version', () => {
    beforeEach(() => {
      createComponent({ productSku: 'FG-STEEL-001' });
    });

    it('should have default version V1', () => {
      expect(component.form.get('bomVersion')?.value).toBe('V1');
    });

    it('should allow custom version', () => {
      component.form.patchValue({ bomVersion: 'V2.1' });
      expect(component.form.get('bomVersion')?.value).toBe('V2.1');
    });
  });
});
