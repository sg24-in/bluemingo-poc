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
    unit: 'KG',
    description: 'Raw steel billet',
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

    fixture = TestBed.createComponent(MaterialFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  beforeEach(async () => {
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
      expect(component.materialId).toBeNull();
    });

    it('should have default material type RM', () => {
      expect(component.form.get('materialType')?.value).toBe('RM');
    });

    it('should validate required fields', () => {
      component.form.patchValue({
        materialCode: '',
        materialName: '',
        unit: ''
      });
      expect(component.form.invalid).toBeTrue();
    });

    it('should create material successfully', () => {
      apiServiceSpy.createMaterial.and.returnValue(of(mockMaterial));

      component.form.patchValue({
        materialCode: 'MAT-001',
        materialName: 'Steel Billet',
        materialType: 'RM',
        unit: 'KG'
      });

      component.onSubmit();

      expect(apiServiceSpy.createMaterial).toHaveBeenCalled();
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      apiServiceSpy.getMaterialById.and.returnValue(of(mockMaterial));
      createComponent({ id: '1' });
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
    beforeEach(() => {
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
});
