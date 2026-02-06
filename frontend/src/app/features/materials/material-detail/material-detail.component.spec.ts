import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { MaterialDetailComponent } from './material-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('MaterialDetailComponent', () => {
  let component: MaterialDetailComponent;
  let fixture: ComponentFixture<MaterialDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockMaterial = {
    materialId: 1,
    materialCode: 'MAT-001',
    materialName: 'Test Material',
    materialType: 'RM' as const,
    description: 'Test Description',
    baseUnit: 'KG',
    status: 'ACTIVE' as const,
    createdOn: new Date().toISOString()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getMaterialById',
      'deleteMaterial',
      'activateMaterial'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [MaterialDetailComponent],
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
    apiServiceSpy.getMaterialById.and.returnValue(of(mockMaterial));
    fixture = TestBed.createComponent(MaterialDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load material on init', () => {
    expect(apiServiceSpy.getMaterialById).toHaveBeenCalledWith(1);
    expect(component.material).toEqual(mockMaterial);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing material ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getMaterialById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [MaterialDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MaterialDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No material ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading material', () => {
    apiServiceSpy.getMaterialById.and.returnValue(throwError(() => new Error('Error')));

    component.loadMaterial(1);

    expect(component.error).toBe('Failed to load material');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit material', () => {
    spyOn(router, 'navigate');
    component.editMaterial();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/materials', 1, 'edit']);
  });

  it('should navigate back to material list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/materials']);
  });

  it('should return correct status class for ACTIVE', () => {
    expect(component.getStatusClass('ACTIVE')).toBe('status-active');
  });

  it('should return correct status class for INACTIVE', () => {
    expect(component.getStatusClass('INACTIVE')).toBe('status-inactive');
  });

  it('should return correct material type label for RM', () => {
    expect(component.getMaterialTypeLabel('RM')).toBe('Raw Material');
  });

  it('should return correct material type label for FG', () => {
    expect(component.getMaterialTypeLabel('FG')).toBe('Finished Goods');
  });

  it('should return correct material type label for IM', () => {
    expect(component.getMaterialTypeLabel('IM')).toBe('Intermediate');
  });

  it('should return correct material type label for WIP', () => {
    expect(component.getMaterialTypeLabel('WIP')).toBe('Work In Progress');
  });

  it('should deactivate active material', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deleteMaterial.and.returnValue(of(void 0));
    apiServiceSpy.getMaterialById.and.returnValue(of({ ...mockMaterial, status: 'INACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.deleteMaterial).toHaveBeenCalledWith(1);
  });

  it('should activate inactive material', () => {
    component.material = { ...mockMaterial, status: 'INACTIVE' };
    apiServiceSpy.activateMaterial.and.returnValue(of({ ...mockMaterial, status: 'ACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.activateMaterial).toHaveBeenCalledWith(1);
  });
});
