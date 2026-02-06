import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { OperatorDetailComponent } from './operator-detail.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('OperatorDetailComponent', () => {
  let component: OperatorDetailComponent;
  let fixture: ComponentFixture<OperatorDetailComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockOperator = {
    operatorId: 1,
    operatorCode: 'OP-001',
    name: 'Test Operator',
    department: 'Production',
    shift: 'Day',
    status: 'ACTIVE',
    createdOn: new Date().toISOString()
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getOperatorById',
      'deleteOperator',
      'activateOperator'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [OperatorDetailComponent],
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
    apiServiceSpy.getOperatorById.and.returnValue(of(mockOperator));
    fixture = TestBed.createComponent(OperatorDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load operator on init', () => {
    expect(apiServiceSpy.getOperatorById).toHaveBeenCalledWith(1);
    expect(component.operator).toEqual(mockOperator);
    expect(component.loading).toBeFalse();
  });

  it('should handle missing operator ID', async () => {
    await TestBed.resetTestingModule();
    const spy = jasmine.createSpyObj('ApiService', ['getOperatorById']);

    await TestBed.configureTestingModule({
      imports: [RouterTestingModule, HttpClientTestingModule, SharedModule],
      declarations: [OperatorDetailComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: { get: () => null } } }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(component.error).toBe('No operator ID provided');
    expect(component.loading).toBeFalse();
  });

  it('should handle error loading operator', () => {
    apiServiceSpy.getOperatorById.and.returnValue(throwError(() => new Error('Error')));

    component.loadOperator(1);

    expect(component.error).toBe('Failed to load operator');
    expect(component.loading).toBeFalse();
  });

  it('should navigate to edit operator', () => {
    spyOn(router, 'navigate');
    component.editOperator();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/operators', 1, 'edit']);
  });

  it('should navigate back to operator list', () => {
    spyOn(router, 'navigate');
    component.goBack();
    expect(router.navigate).toHaveBeenCalledWith(['/manage/operators']);
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

  it('should deactivate active operator', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deleteOperator.and.returnValue(of(void 0));
    apiServiceSpy.getOperatorById.and.returnValue(of({ ...mockOperator, status: 'INACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.deleteOperator).toHaveBeenCalledWith(1);
  });

  it('should not deactivate if user cancels', () => {
    spyOn(window, 'confirm').and.returnValue(false);

    component.toggleStatus();

    expect(apiServiceSpy.deleteOperator).not.toHaveBeenCalled();
  });

  it('should activate inactive operator', () => {
    component.operator = { ...mockOperator, status: 'INACTIVE' };
    apiServiceSpy.activateOperator.and.returnValue(of({ ...mockOperator, status: 'ACTIVE' }));

    component.toggleStatus();

    expect(apiServiceSpy.activateOperator).toHaveBeenCalledWith(1);
  });

  it('should handle deactivation error', () => {
    spyOn(window, 'confirm').and.returnValue(true);
    apiServiceSpy.deleteOperator.and.returnValue(throwError(() => new Error('Error')));

    component.toggleStatus();

    expect(component.error).toBe('Failed to deactivate operator');
  });

  it('should handle activation error', () => {
    component.operator = { ...mockOperator, status: 'INACTIVE' };
    apiServiceSpy.activateOperator.and.returnValue(throwError(() => new Error('Error')));

    component.toggleStatus();

    expect(component.error).toBe('Failed to activate operator');
  });
});
