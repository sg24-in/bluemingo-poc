import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OperationTemplateDetailComponent } from './operation-template-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('OperationTemplateDetailComponent', () => {
  let component: OperationTemplateDetailComponent;
  let fixture: ComponentFixture<OperationTemplateDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockTemplate = {
    operationTemplateId: 1,
    operationCode: 'OT-001',
    operationName: 'Test Template',
    operationType: 'FURNACE',
    quantityType: 'DISCRETE',
    defaultEquipmentType: 'EAF',
    description: 'A test operation template',
    estimatedDurationMinutes: 60,
    status: 'ACTIVE' as const,
    createdOn: new Date().toISOString(),
    createdBy: 'admin',
    updatedOn: new Date().toISOString(),
    updatedBy: 'admin'
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getOperationTemplateById',
      'activateOperationTemplate',
      'deactivateOperationTemplate'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [OperationTemplateDetailComponent],
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
    apiServiceSpy.getOperationTemplateById.and.returnValue(of(mockTemplate));
    fixture = TestBed.createComponent(OperationTemplateDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load operation template on init', () => {
    expect(apiServiceSpy.getOperationTemplateById).toHaveBeenCalledWith(1);
    expect(component.template).toEqual(mockTemplate);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing template ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getOperationTemplateById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [OperationTemplateDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperationTemplateDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No operation template ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading template', () => {
    apiServiceSpy.getOperationTemplateById.and.returnValue(throwError(() => new Error('Error')));

    component.loadTemplate(1);

    expect(component.error).toBe('Failed to load operation template');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit template', () => {
    spyOn(router, 'navigate');
    component.editTemplate();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/operation-templates', 1, 'edit']);
  });

  it('should navigate back to template list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/operation-templates']);
  });

  it('should return correct status class for ACTIVE', () => {
    expect(component.getStatusClass('ACTIVE')).toBe('status-active');
  });

  it('should return correct status class for INACTIVE', () => {
    expect(component.getStatusClass('INACTIVE')).toBe('status-inactive');
  });

  it('should return empty string for unknown status', () => {
    expect(component.getStatusClass('UNKNOWN')).toBe('');
  });

  it('should return correct operation type label', () => {
    expect(component.getOperationTypeLabel('FURNACE')).toBe('Furnace');
    expect(component.getOperationTypeLabel('CASTER')).toBe('Caster');
    expect(component.getOperationTypeLabel('UNKNOWN_TYPE')).toBe('UNKNOWN_TYPE');
  });

  it('should return correct quantity type label', () => {
    expect(component.getQuantityTypeLabel('DISCRETE')).toBe('Discrete');
    expect(component.getQuantityTypeLabel('BATCH')).toBe('Batch');
    expect(component.getQuantityTypeLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should return correct equipment type label', () => {
    expect(component.getEquipmentTypeLabel('EAF')).toBe('Electric Arc Furnace');
    expect(component.getEquipmentTypeLabel('CASTER')).toBe('Continuous Caster');
    expect(component.getEquipmentTypeLabel('UNKNOWN')).toBe('UNKNOWN');
  });

  it('should deactivate active template', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deactivateOperationTemplate.and.returnValue(of({ ...mockTemplate, status: 'INACTIVE' as const }));
    apiServiceSpy.getOperationTemplateById.and.returnValue(of({ ...mockTemplate, status: 'INACTIVE' as const }));

    component.toggleStatus();

    expect(apiServiceSpy.deactivateOperationTemplate).toHaveBeenCalledWith(1);
  });

  it('should not deactivate if user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.toggleStatus();

    expect(apiServiceSpy.deactivateOperationTemplate).not.toHaveBeenCalled();
  });

  it('should activate inactive template', () => {
    component.template = { ...mockTemplate, status: 'INACTIVE' };
    apiServiceSpy.activateOperationTemplate.and.returnValue(of({ ...mockTemplate, status: 'ACTIVE' as const }));
    apiServiceSpy.getOperationTemplateById.and.returnValue(of({ ...mockTemplate, status: 'ACTIVE' as const }));

    component.toggleStatus();

    expect(apiServiceSpy.activateOperationTemplate).toHaveBeenCalledWith(1);
  });

  it('should handle deactivation error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deactivateOperationTemplate.and.returnValue(throwError(() => new Error('Error')));

    component.toggleStatus();

    expect(component.error).toBe('Failed to deactivate operation template');
  });

  it('should handle activation error', () => {
    component.template = { ...mockTemplate, status: 'INACTIVE' };
    apiServiceSpy.activateOperationTemplate.and.returnValue(throwError(() => new Error('Error')));

    component.toggleStatus();

    expect(component.error).toBe('Failed to activate operation template');
  });

  it('should not toggle status when template is null', () => {
    component.template = null;
    component.toggleStatus();
    expect(apiServiceSpy.deactivateOperationTemplate).not.toHaveBeenCalled();
    expect(apiServiceSpy.activateOperationTemplate).not.toHaveBeenCalled();
  });

  it('should not navigate to edit when template is null', () => {
    spyOn(router, 'navigate');
    component.template = null;
    component.editTemplate();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
