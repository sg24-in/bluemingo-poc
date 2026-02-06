import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { MaterialListComponent } from './material-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { Material } from '../../../shared/models';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('MaterialListComponent', () => {
  let component: MaterialListComponent;
  let fixture: ComponentFixture<MaterialListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockMaterials: Material[] = [
    {
      materialId: 1,
      materialCode: 'MAT-001',
      materialName: 'Steel Billet',
      materialType: 'RM',
      baseUnit: 'KG',
      description: 'Raw steel billet',
      status: 'ACTIVE'
    },
    {
      materialId: 2,
      materialCode: 'MAT-002',
      materialName: 'Aluminum Sheet',
      materialType: 'IM',
      baseUnit: 'KG',
      status: 'ACTIVE'
    },
    {
      materialId: 3,
      materialCode: 'MAT-003',
      materialName: 'Finished Product',
      materialType: 'FG',
      baseUnit: 'PCS',
      status: 'INACTIVE'
    }
  ];

  const mockPagedResponse: PagedResponse<Material> = {
    content: mockMaterials,
    page: 0,
    size: 20,
    totalElements: 3,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getMaterialsPaged',
      'deleteMaterial'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      declarations: [MaterialListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getMaterialsPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(MaterialListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load materials on init', () => {
    expect(apiServiceSpy.getMaterialsPaged).toHaveBeenCalled();
    expect(component.materials.length).toBe(3);
    expect(component.loading).toBeFalse();
  });

  it('should have material types defined', () => {
    expect(component.materialTypes.length).toBe(4);
    expect(component.materialTypes.map(t => t.value)).toContain('RM');
    expect(component.materialTypes.map(t => t.value)).toContain('FG');
  });

  describe('Filtering', () => {
    beforeEach(() => {
      apiServiceSpy.getMaterialsPaged.calls.reset();
    });

    it('should filter by status', () => {
      component.onFilterStatusChange('ACTIVE');
      expect(component.filterStatus).toBe('ACTIVE');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getMaterialsPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by type', () => {
      component.onFilterTypeChange('RM');
      expect(component.filterType).toBe('RM');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getMaterialsPaged).toHaveBeenCalledTimes(1);
    });

    it('should filter by search term', () => {
      component.onSearchChange('Steel');
      expect(component.searchTerm).toBe('Steel');
      expect(component.page).toBe(0);
      expect(apiServiceSpy.getMaterialsPaged).toHaveBeenCalledTimes(1);
    });
  });

  describe('Type Label', () => {
    it('should return correct label for material type', () => {
      expect(component.getTypeLabel('RM')).toBe('Raw Material');
      expect(component.getTypeLabel('IM')).toBe('Intermediate');
      expect(component.getTypeLabel('FG')).toBe('Finished Goods');
      expect(component.getTypeLabel('WIP')).toBe('Work In Progress');
    });

    it('should return type code for unknown types', () => {
      expect(component.getTypeLabel('UNKNOWN')).toBe('UNKNOWN');
    });
  });

  describe('Pagination', () => {
    beforeEach(() => {
      apiServiceSpy.getMaterialsPaged.calls.reset();
    });

    it('should change page', () => {
      component.onPageChange(1);
      expect(apiServiceSpy.getMaterialsPaged).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getMaterialsPaged).toHaveBeenCalledWith(jasmine.objectContaining({ page: 1 }));
    });

    it('should change page size', () => {
      component.onSizeChange(50);
      expect(apiServiceSpy.getMaterialsPaged).toHaveBeenCalledTimes(1);
      expect(apiServiceSpy.getMaterialsPaged).toHaveBeenCalledWith(jasmine.objectContaining({ size: 50, page: 0 }));
    });
  });

  describe('Delete Operations', () => {
    it('should open delete modal', () => {
      component.openDeleteModal(mockMaterials[0]);
      expect(component.showDeleteModal).toBeTrue();
      expect(component.materialToDelete).toBe(mockMaterials[0]);
    });

    it('should close delete modal', () => {
      component.openDeleteModal(mockMaterials[0]);
      component.closeDeleteModal();
      expect(component.showDeleteModal).toBeFalse();
      expect(component.materialToDelete).toBeNull();
    });

    it('should delete material successfully', () => {
      apiServiceSpy.deleteMaterial.and.returnValue(of(void 0));

      component.openDeleteModal(mockMaterials[0]);
      component.confirmDelete();

      expect(apiServiceSpy.deleteMaterial).toHaveBeenCalledWith(1);
    });
  });

  it('should handle error loading materials', () => {
    apiServiceSpy.getMaterialsPaged.and.returnValue(throwError(() => new Error('Error')));
    component.loadMaterials();
    expect(component.loading).toBeFalse();
  });
});
