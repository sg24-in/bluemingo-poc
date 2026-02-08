import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { ProcessFormComponent } from './process-form.component';
import { ApiService } from '../../../core/services/api.service';
import { Process } from '../../../shared/models';

describe('ProcessFormComponent', () => {
  let component: ProcessFormComponent;
  let fixture: ComponentFixture<ProcessFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockProcess: Process = {
    processId: 1,
    processName: 'Melting Process',
    status: 'DRAFT',
    createdOn: '2024-01-01T00:00:00',
    createdBy: 'admin'
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      const apiSpy = jasmine.createSpyObj('ApiService', [
        'getProcessById',
        'createProcess',
        'updateProcess'
      ]);

      await TestBed.configureTestingModule({
        imports: [
          ReactiveFormsModule,
          HttpClientTestingModule,
          RouterTestingModule.withRoutes([
            { path: 'processes/list', component: ProcessFormComponent },
            { path: 'manage/processes', component: ProcessFormComponent }
          ])
        ],
        declarations: [ProcessFormComponent],
        providers: [
          { provide: ApiService, useValue: apiSpy },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: convertToParamMap({})
              }
            }
          }
        ]
      }).compileComponents();

      apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
      router = TestBed.inject(Router);
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize in create mode when no ID in route', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.processId).toBeNull();
    });

    it('should initialize form with default values', () => {
      expect(component.form).toBeTruthy();
      expect(component.form.get('processName')?.value).toBe('');
      expect(component.form.get('status')?.value).toBe('DRAFT');
    });

    it('should have design-time statuses only', () => {
      expect(component.statuses).toEqual(['DRAFT', 'ACTIVE', 'INACTIVE']);
    });

    it('should require process name', () => {
      const processNameControl = component.form.get('processName');
      processNameControl?.setValue('');
      expect(processNameControl?.valid).toBeFalse();
      expect(processNameControl?.errors?.['required']).toBeTruthy();
    });

    it('should validate max length for process name', () => {
      const processNameControl = component.form.get('processName');
      processNameControl?.setValue('a'.repeat(201));
      expect(processNameControl?.valid).toBeFalse();
      expect(processNameControl?.errors?.['maxlength']).toBeTruthy();
    });

    it('should accept valid process name', () => {
      const processNameControl = component.form.get('processName');
      processNameControl?.setValue('New Process');
      expect(processNameControl?.valid).toBeTrue();
    });

    it('should not submit invalid form', () => {
      component.form.get('processName')?.setValue('');
      component.onSubmit();

      expect(apiServiceSpy.createProcess).not.toHaveBeenCalled();
      expect(component.form.get('processName')?.touched).toBeTrue();
    });

    it('should create process on valid submit', fakeAsync(() => {
      apiServiceSpy.createProcess.and.returnValue(of(mockProcess));
      spyOn(router, 'navigate');

      component.form.patchValue({
        processName: 'New Process',
        status: 'DRAFT'
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.createProcess).toHaveBeenCalledWith({
        processName: 'New Process',
        status: 'DRAFT'
      });
      expect(component.saving).toBeFalse();
    }));

    it('should handle create error', fakeAsync(() => {
      apiServiceSpy.createProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Process name already exists' } }))
      );

      component.form.patchValue({
        processName: 'Duplicate Process',
        status: 'DRAFT'
      });

      component.onSubmit();
      tick();

      expect(component.error).toBe('Process name already exists');
      expect(component.saving).toBeFalse();
    }));

    it('should handle create error without message', fakeAsync(() => {
      apiServiceSpy.createProcess.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      component.form.patchValue({
        processName: 'Test Process',
        status: 'DRAFT'
      });

      component.onSubmit();
      tick();

      expect(component.error).toBe('Failed to create process.');
    }));

    it('should navigate to list on cancel', () => {
      spyOn(router, 'navigate');
      spyOnProperty(router, 'url', 'get').and.returnValue('/processes/new');

      component.cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/processes/list']);
    });

    it('should navigate to admin list when in manage context', () => {
      spyOn(router, 'navigate');
      spyOnProperty(router, 'url', 'get').and.returnValue('/manage/processes/new');

      component.cancel();

      expect(router.navigate).toHaveBeenCalledWith(['/manage/processes']);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      const apiSpy = jasmine.createSpyObj('ApiService', [
        'getProcessById',
        'createProcess',
        'updateProcess'
      ]);

      await TestBed.configureTestingModule({
        imports: [
          ReactiveFormsModule,
          HttpClientTestingModule,
          RouterTestingModule.withRoutes([
            { path: 'processes/list', component: ProcessFormComponent },
            { path: 'manage/processes', component: ProcessFormComponent }
          ])
        ],
        declarations: [ProcessFormComponent],
        providers: [
          { provide: ApiService, useValue: apiSpy },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: convertToParamMap({ id: '1' })
              }
            }
          }
        ]
      }).compileComponents();

      apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
      router = TestBed.inject(Router);

      // Set up the getProcessById response before component creation
      apiServiceSpy.getProcessById.and.returnValue(of(mockProcess));
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should initialize in edit mode when ID in route', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.processId).toBe(1);
    });

    it('should load process data', () => {
      expect(apiServiceSpy.getProcessById).toHaveBeenCalledWith(1);
      expect(component.form.get('processName')?.value).toBe('Melting Process');
      expect(component.form.get('status')?.value).toBe('DRAFT');
    });

    it('should update process on valid submit', fakeAsync(() => {
      apiServiceSpy.updateProcess.and.returnValue(of({ ...mockProcess, processName: 'Updated Process' }));
      spyOn(router, 'navigate');

      component.form.patchValue({
        processName: 'Updated Process',
        status: 'ACTIVE'
      });

      component.onSubmit();
      tick();

      expect(apiServiceSpy.updateProcess).toHaveBeenCalledWith(1, {
        processName: 'Updated Process',
        status: 'ACTIVE'
      });
      expect(component.saving).toBeFalse();
    }));

    it('should handle update error', fakeAsync(() => {
      apiServiceSpy.updateProcess.and.returnValue(
        throwError(() => ({ error: { message: 'Invalid status transition' } }))
      );

      component.form.patchValue({
        processName: 'Updated Process',
        status: 'ACTIVE'
      });

      component.onSubmit();
      tick();

      expect(component.error).toBe('Invalid status transition');
      expect(component.saving).toBeFalse();
    }));
  });

  describe('Edit Mode Load Error', () => {
    beforeEach(async () => {
      const apiSpy = jasmine.createSpyObj('ApiService', [
        'getProcessById',
        'createProcess',
        'updateProcess'
      ]);

      await TestBed.configureTestingModule({
        imports: [
          ReactiveFormsModule,
          HttpClientTestingModule,
          RouterTestingModule
        ],
        declarations: [ProcessFormComponent],
        providers: [
          { provide: ApiService, useValue: apiSpy },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: convertToParamMap({ id: '999' })
              }
            }
          }
        ]
      }).compileComponents();

      apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    });

    it('should handle load error with message', fakeAsync(() => {
      apiServiceSpy.getProcessById.and.returnValue(
        throwError(() => ({ error: { message: 'Process not found' } }))
      );

      fixture = TestBed.createComponent(ProcessFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.error).toBe('Process not found');
      expect(component.loading).toBeFalse();
    }));

    it('should handle load error without message', fakeAsync(() => {
      apiServiceSpy.getProcessById.and.returnValue(
        throwError(() => ({ error: {} }))
      );

      fixture = TestBed.createComponent(ProcessFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
      tick();

      expect(component.error).toBe('Failed to load process.');
    }));
  });

  describe('Helper Methods', () => {
    beforeEach(async () => {
      const apiSpy = jasmine.createSpyObj('ApiService', [
        'getProcessById',
        'createProcess',
        'updateProcess'
      ]);

      await TestBed.configureTestingModule({
        imports: [
          ReactiveFormsModule,
          HttpClientTestingModule,
          RouterTestingModule
        ],
        declarations: [ProcessFormComponent],
        providers: [
          { provide: ApiService, useValue: apiSpy },
          {
            provide: ActivatedRoute,
            useValue: {
              snapshot: {
                paramMap: convertToParamMap({})
              }
            }
          }
        ]
      }).compileComponents();
    });

    beforeEach(() => {
      fixture = TestBed.createComponent(ProcessFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should detect field errors correctly', () => {
      const control = component.form.get('processName');

      // Initially no error (not touched)
      expect(component.hasError('processName')).toBeFalse();

      // After touch with empty value
      control?.setValue('');
      control?.markAsTouched();
      expect(component.hasError('processName')).toBeTrue();

      // After setting valid value
      control?.setValue('Valid Name');
      expect(component.hasError('processName')).toBeFalse();
    });

    it('should return correct error message for required', () => {
      const control = component.form.get('processName');
      control?.setValue('');
      control?.markAsTouched();

      expect(component.getError('processName')).toBe('Process Name is required');
    });

    it('should return correct error message for maxlength', () => {
      const control = component.form.get('processName');
      control?.setValue('a'.repeat(201));
      control?.markAsTouched();

      expect(component.getError('processName')).toBe('Process Name is too long');
    });

    it('should return empty string for no errors', () => {
      const control = component.form.get('processName');
      control?.setValue('Valid Name');

      expect(component.getError('processName')).toBe('');
    });

    it('should return empty string for non-existent field', () => {
      expect(component.getError('nonExistent')).toBe('');
    });
  });
});
