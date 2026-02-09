import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { OperationTemplateListComponent } from './operation-template-list.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';
import { OperationTemplate } from '../../../shared/models/operation-template.model';
import { PagedResponse } from '../../../shared/models/pagination.model';

describe('OperationTemplateListComponent', () => {
  let component: OperationTemplateListComponent;
  let fixture: ComponentFixture<OperationTemplateListComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;

  const mockTemplates: OperationTemplate[] = [
    {
      operationTemplateId: 1,
      operationName: 'Melting',
      operationCode: 'MELT-01',
      operationType: 'FURNACE',
      quantityType: 'WEIGHT',
      status: 'ACTIVE'
    },
    {
      operationTemplateId: 2,
      operationName: 'Casting',
      operationCode: 'CAST-01',
      operationType: 'CASTER',
      quantityType: 'WEIGHT',
      status: 'ACTIVE'
    }
  ];

  const mockPagedResponse: PagedResponse<OperationTemplate> = {
    content: mockTemplates,
    page: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true,
    hasNext: false,
    hasPrevious: false
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getOperationTemplatesPaged',
      'deleteOperationTemplate',
      'activateOperationTemplate',
      'deactivateOperationTemplate'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        HttpClientTestingModule,
        RouterTestingModule,
        FormsModule,
        SharedModule
      ],
      declarations: [OperationTemplateListComponent],
      providers: [
        { provide: ApiService, useValue: spy }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  beforeEach(() => {
    apiServiceSpy.getOperationTemplatesPaged.and.returnValue(of(mockPagedResponse));
    fixture = TestBed.createComponent(OperationTemplateListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load templates on init', () => {
    expect(apiServiceSpy.getOperationTemplatesPaged).toHaveBeenCalled();
    expect(component.templates.length).toBe(2);
    expect(component.loading).toBeFalse();
  });

  it('should set pagination state from response', () => {
    expect(component.page).toBe(0);
    expect(component.totalElements).toBe(2);
    expect(component.totalPages).toBe(1);
  });

  it('should render app-pagination when data is present', () => {
    component.templates = [
      { operationTemplateId: 1, operationName: 'Test', operationType: 'FURNACE', quantityType: 'WEIGHT', status: 'ACTIVE', operationCode: 'T1' }
    ];
    component.loading = false;
    component.totalElements = 1;
    component.totalPages = 1;
    component.hasNext = false;
    component.hasPrevious = false;
    component.page = 0;
    component.size = 20;
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-pagination')).toBeTruthy();
  });
});
