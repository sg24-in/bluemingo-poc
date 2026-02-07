import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { Router, ActivatedRoute, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';

import { RoutingFormComponent } from './routing-form.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('RoutingFormComponent', () => {
  let component: RoutingFormComponent;
  let fixture: ComponentFixture<RoutingFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;
  let activatedRoute: any;

  const mockProcesses: any[] = [
    { processId: 1, processName: 'Melting Process', status: 'ACTIVE' },
    { processId: 2, processName: 'Casting Process', status: 'ACTIVE' },
    { processId: 3, processName: 'Rolling Process', status: 'INACTIVE' }
  ];

  const mockRouting = {
    routingId: 1,
    processId: 1,
    processName: 'Melting Process',
    routingName: 'Standard Melting',
    routingType: 'SEQUENTIAL',
    status: 'DRAFT',
    steps: [
      {
        routingStepId: 1,
        sequenceNumber: 1,
        operationName: 'Melt',
        operationType: 'MELTING',
        operationCode: 'MLT-001',
        isParallel: false,
        mandatoryFlag: true,
        producesOutputBatch: true,
        allowsSplit: false,
        allowsMerge: false,
        status: 'ACTIVE',
        estimatedDurationMinutes: 60,
        description: 'Main melting operation'
      },
      {
        routingStepId: 2,
        sequenceNumber: 2,
        operationName: 'Cast',
        operationType: 'CASTING',
        operationCode: 'CST-001',
        isParallel: false,
        mandatoryFlag: true,
        producesOutputBatch: true,
        allowsSplit: true,
        allowsMerge: false,
        status: 'ACTIVE',
        estimatedDurationMinutes: 45,
        description: 'Casting operation'
      }
    ]
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getAllProcesses',
      'getRoutingById',
      'createRouting',
      'updateRouting',
      'createRoutingStep',
      'updateRoutingStep',
      'deleteRoutingStep',
      'reorderRoutingSteps'
    ]);

    activatedRoute = {
      snapshot: {
        paramMap: convertToParamMap({})
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [RoutingFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
        { provide: ActivatedRoute, useValue: activatedRoute }
      ]
    }).compileComponents();

    apiServiceSpy = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
    router = TestBed.inject(Router);
  });

  describe('Create Mode', () => {
    beforeEach(() => {
      apiServiceSpy.getAllProcesses.and.returnValue(of(mockProcesses));
      fixture = TestBed.createComponent(RoutingFormComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize in create mode', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.routingId).toBeNull();
    });

    it('should load processes on init', () => {
      expect(apiServiceSpy.getAllProcesses).toHaveBeenCalled();
      expect(component.processes.length).toBe(3);
    });

    it('should initialize form with default values', () => {
      expect(component.form.get('routingName')?.value).toBe('');
      expect(component.form.get('processId')?.value).toBe('');
      expect(component.form.get('routingType')?.value).toBe('SEQUENTIAL');
    });

    it('should show create title', () => {
      expect(component.title).toBe('Create Routing');
    });

    it('should have empty steps array', () => {
      expect(component.steps.length).toBe(0);
    });

    describe('Form Validation', () => {
      it('should be invalid when empty', () => {
        expect(component.form.invalid).toBeTrue();
      });

      it('should require routing name', () => {
        component.form.patchValue({ processId: 1, routingType: 'SEQUENTIAL' });
        expect(component.form.invalid).toBeTrue();
        expect(component.form.get('routingName')?.errors?.['required']).toBeTrue();
      });

      it('should require process ID', () => {
        component.form.patchValue({ routingName: 'Test', routingType: 'SEQUENTIAL' });
        expect(component.form.invalid).toBeTrue();
        expect(component.form.get('processId')?.errors?.['required']).toBeTrue();
      });

      it('should be valid when all required fields are filled', () => {
        component.form.patchValue({
          routingName: 'Test Routing',
          processId: 1,
          routingType: 'SEQUENTIAL'
        });
        expect(component.form.valid).toBeTrue();
      });

      it('should enforce max length on routing name', () => {
        const longName = 'a'.repeat(101);
        component.form.get('routingName')?.setValue(longName);
        expect(component.form.get('routingName')?.errors?.['maxlength']).toBeTruthy();
      });
    });

    describe('Submit', () => {
      it('should not submit if form is invalid', () => {
        component.onSubmit();
        expect(apiServiceSpy.createRouting).not.toHaveBeenCalled();
      });

      it('should mark fields as touched on invalid submit', () => {
        component.onSubmit();
        expect(component.form.get('routingName')?.touched).toBeTrue();
        expect(component.form.get('processId')?.touched).toBeTrue();
      });

      it('should create routing successfully', fakeAsync(() => {
        spyOn(router, 'navigate');
        apiServiceSpy.createRouting.and.returnValue(of({ routingId: 10, routingName: 'New Routing' }));

        component.form.patchValue({
          routingName: 'New Routing',
          processId: 1,
          routingType: 'SEQUENTIAL'
        });

        component.onSubmit();
        tick();

        expect(apiServiceSpy.createRouting).toHaveBeenCalledWith({
          routingName: 'New Routing',
          processId: 1,
          routingType: 'SEQUENTIAL'
        });
        expect(router.navigate).toHaveBeenCalledWith(['/manage/routing']);
      }));

      it('should create routing with steps', fakeAsync(() => {
        spyOn(router, 'navigate');
        apiServiceSpy.createRouting.and.returnValue(of({ routingId: 10, routingName: 'New Routing' }));
        apiServiceSpy.createRoutingStep.and.returnValue(of({ routingStepId: 1, operationName: 'Step 1' }));

        component.form.patchValue({
          routingName: 'New Routing',
          processId: 1,
          routingType: 'SEQUENTIAL'
        });

        component.steps = [
          {
            routingStepId: undefined,
            operationName: 'Step 1',
            operationType: 'MELTING',
            sequenceNumber: 1,
            isParallel: false,
            mandatoryFlag: true,
            producesOutputBatch: true,
            allowsSplit: false,
            allowsMerge: false
          }
        ];

        component.onSubmit();
        tick();

        expect(apiServiceSpy.createRouting).toHaveBeenCalled();
        expect(apiServiceSpy.createRoutingStep).toHaveBeenCalledWith(10, jasmine.objectContaining({
          operationName: 'Step 1'
        }));
      }));

      it('should handle create error', fakeAsync(() => {
        apiServiceSpy.createRouting.and.returnValue(throwError(() => ({ error: { message: 'Create failed' } })));

        component.form.patchValue({
          routingName: 'New Routing',
          processId: 1,
          routingType: 'SEQUENTIAL'
        });

        component.onSubmit();
        tick();

        expect(component.error).toBe('Create failed');
        expect(component.saving).toBeFalse();
      }));
    });

    describe('Cancel', () => {
      it('should navigate back on cancel', () => {
        spyOn(router, 'navigate');
        component.cancel();
        expect(router.navigate).toHaveBeenCalledWith(['/manage/routing']);
      });
    });

    describe('Step Management', () => {
      describe('Add Step', () => {
        it('should open add step modal', () => {
          component.openAddStep();
          expect(component.showStepModal).toBeTrue();
          expect(component.editingStep).toBeNull();
          expect(component.editingStepIndex).toBeNull();
        });

        it('should set default values for new step', () => {
          component.steps = [{ sequenceNumber: 1 } as any];
          component.openAddStep();
          expect(component.stepForm.get('sequenceNumber')?.value).toBe(2);
          expect(component.stepForm.get('mandatoryFlag')?.value).toBeTrue();
          expect(component.stepForm.get('isParallel')?.value).toBeFalse();
        });

        it('should add new step to list', () => {
          component.stepForm.patchValue({
            operationName: 'New Step',
            operationType: 'MELTING',
            sequenceNumber: 1,
            isParallel: false,
            mandatoryFlag: true
          });

          component.saveStep();

          expect(component.steps.length).toBe(1);
          expect(component.steps[0].operationName).toBe('New Step');
          expect(component.showStepModal).toBeFalse();
        });

        it('should not add step with invalid form', () => {
          component.stepForm.patchValue({ operationName: '' });
          component.saveStep();
          expect(component.steps.length).toBe(0);
          expect(component.stepForm.get('operationName')?.touched).toBeTrue();
        });
      });

      describe('Edit Step', () => {
        beforeEach(() => {
          component.steps = [
            {
              routingStepId: 1,
              operationName: 'Existing Step',
              operationType: 'MELTING',
              sequenceNumber: 1,
              isParallel: false,
              mandatoryFlag: true,
              producesOutputBatch: true,
              allowsSplit: false,
              allowsMerge: false
            }
          ];
        });

        it('should open edit step modal', () => {
          component.openEditStep(component.steps[0], 0);
          expect(component.showStepModal).toBeTrue();
          expect(component.editingStep).toBe(component.steps[0]);
          expect(component.editingStepIndex).toBe(0);
        });

        it('should populate step form with existing data', () => {
          component.openEditStep(component.steps[0], 0);
          expect(component.stepForm.get('operationName')?.value).toBe('Existing Step');
          expect(component.stepForm.get('operationType')?.value).toBe('MELTING');
        });

        it('should update existing step in list', () => {
          component.openEditStep(component.steps[0], 0);
          component.stepForm.patchValue({ operationName: 'Updated Step' });
          component.saveStep();

          expect(component.steps[0].operationName).toBe('Updated Step');
          expect(component.showStepModal).toBeFalse();
        });

        it('should call API to update saved step', () => {
          apiServiceSpy.updateRoutingStep.and.returnValue(of({}));
          component.routingId = 1;

          component.openEditStep(component.steps[0], 0);
          component.stepForm.patchValue({ operationName: 'Updated Step' });
          component.saveStep();

          expect(apiServiceSpy.updateRoutingStep).toHaveBeenCalledWith(1, jasmine.objectContaining({
            operationName: 'Updated Step'
          }));
        });
      });

      describe('Delete Step', () => {
        beforeEach(() => {
          component.steps = [
            {
              routingStepId: 1,
              operationName: 'Step 1',
              operationType: 'MELTING',
              sequenceNumber: 1,
              isParallel: false,
              mandatoryFlag: false,
              producesOutputBatch: true,
              allowsSplit: false,
              allowsMerge: false
            },
            {
              routingStepId: 2,
              operationName: 'Step 2',
              operationType: 'CASTING',
              sequenceNumber: 2,
              isParallel: false,
              mandatoryFlag: true,
              producesOutputBatch: true,
              allowsSplit: false,
              allowsMerge: false
            }
          ];
        });

        it('should not delete mandatory step', () => {
          spyOn(window, 'alert');
          component.deleteStep(1); // Step 2 is mandatory
          expect(window.alert).toHaveBeenCalledWith('Cannot delete mandatory step');
          expect(component.steps.length).toBe(2);
        });

        it('should delete non-mandatory step when confirmed', () => {
          spyOn(window, 'confirm').and.returnValue(true);
          apiServiceSpy.deleteRoutingStep.and.returnValue(of(void 0));

          component.deleteStep(0); // Step 1 is not mandatory

          expect(apiServiceSpy.deleteRoutingStep).toHaveBeenCalledWith(1);
        });

        it('should not delete when not confirmed', () => {
          spyOn(window, 'confirm').and.returnValue(false);

          component.deleteStep(0);

          expect(apiServiceSpy.deleteRoutingStep).not.toHaveBeenCalled();
          expect(component.steps.length).toBe(2);
        });

        it('should delete unsaved step without API call', () => {
          spyOn(window, 'confirm').and.returnValue(true);
          component.steps[0].routingStepId = undefined;

          component.deleteStep(0);

          expect(apiServiceSpy.deleteRoutingStep).not.toHaveBeenCalled();
          expect(component.steps.length).toBe(1);
        });
      });

      describe('Reorder Steps', () => {
        beforeEach(() => {
          component.steps = [
            { routingStepId: 1, sequenceNumber: 1, operationName: 'Step 1' } as any,
            { routingStepId: 2, sequenceNumber: 2, operationName: 'Step 2' } as any,
            { routingStepId: 3, sequenceNumber: 3, operationName: 'Step 3' } as any
          ];
          component.routingId = 1;
        });

        it('should move step up', () => {
          apiServiceSpy.reorderRoutingSteps.and.returnValue(of([]));

          component.moveStepUp(1);

          expect(component.steps[0].operationName).toBe('Step 2');
          expect(component.steps[1].operationName).toBe('Step 1');
          expect(component.steps[0].sequenceNumber).toBe(1);
          expect(component.steps[1].sequenceNumber).toBe(2);
        });

        it('should not move first step up', () => {
          const originalOrder = [...component.steps];
          component.moveStepUp(0);
          expect(component.steps[0].operationName).toBe(originalOrder[0].operationName);
        });

        it('should move step down', () => {
          apiServiceSpy.reorderRoutingSteps.and.returnValue(of([]));

          component.moveStepDown(0);

          expect(component.steps[0].operationName).toBe('Step 2');
          expect(component.steps[1].operationName).toBe('Step 1');
        });

        it('should not move last step down', () => {
          const originalOrder = [...component.steps];
          component.moveStepDown(2);
          expect(component.steps[2].operationName).toBe(originalOrder[2].operationName);
        });

        it('should call API to reorder steps', () => {
          apiServiceSpy.reorderRoutingSteps.and.returnValue(of([]));

          component.moveStepUp(1);

          expect(apiServiceSpy.reorderRoutingSteps).toHaveBeenCalledWith(1, [2, 1, 3]);
        });
      });

      describe('Close Modal', () => {
        it('should close step modal', () => {
          component.showStepModal = true;
          component.editingStep = {} as any;
          component.editingStepIndex = 0;

          component.closeStepModal();

          expect(component.showStepModal).toBeFalse();
          expect(component.editingStep).toBeNull();
          expect(component.editingStepIndex).toBeNull();
        });
      });
    });

    describe('Step Form Validation', () => {
      it('should require operation name', () => {
        component.stepForm.patchValue({
          operationType: 'MELTING',
          sequenceNumber: 1
        });
        expect(component.stepForm.get('operationName')?.errors?.['required']).toBeTrue();
      });

      it('should require operation type', () => {
        component.stepForm.patchValue({
          operationName: 'Test',
          sequenceNumber: 1
        });
        expect(component.stepForm.get('operationType')?.errors?.['required']).toBeTrue();
      });

      it('should require sequence number minimum of 1', () => {
        component.stepForm.get('sequenceNumber')?.setValue(0);
        expect(component.stepForm.get('sequenceNumber')?.errors?.['min']).toBeTruthy();
      });

      it('should enforce max length on operation name', () => {
        const longName = 'a'.repeat(101);
        component.stepForm.get('operationName')?.setValue(longName);
        expect(component.stepForm.get('operationName')?.errors?.['maxlength']).toBeTruthy();
      });

      it('should allow optional estimated duration', () => {
        component.stepForm.patchValue({
          operationName: 'Test',
          operationType: 'MELTING',
          sequenceNumber: 1,
          estimatedDurationMinutes: null
        });
        expect(component.stepForm.get('estimatedDurationMinutes')?.errors).toBeNull();
      });

      it('should validate minimum duration when provided', () => {
        component.stepForm.get('estimatedDurationMinutes')?.setValue(0);
        expect(component.stepForm.get('estimatedDurationMinutes')?.errors?.['min']).toBeTruthy();
      });
    });

    describe('Helper Methods', () => {
      it('should detect form errors', () => {
        component.form.get('routingName')?.markAsTouched();
        expect(component.hasError('routingName')).toBeTrue();
      });

      it('should not detect errors on valid touched field', () => {
        component.form.get('routingName')?.setValue('Valid Name');
        component.form.get('routingName')?.markAsTouched();
        expect(component.hasError('routingName')).toBeFalse();
      });

      it('should detect step form errors', () => {
        component.stepForm.get('operationName')?.markAsTouched();
        expect(component.hasStepError('operationName')).toBeTrue();
      });

      it('should not detect step errors on valid touched field', () => {
        component.stepForm.get('operationName')?.setValue('Valid Name');
        component.stepForm.get('operationName')?.markAsTouched();
        expect(component.hasStepError('operationName')).toBeFalse();
      });
    });
  });
});

describe('RoutingFormComponent Edit Mode', () => {
  let component: RoutingFormComponent;
  let fixture: ComponentFixture<RoutingFormComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockProcesses: any[] = [
    { processId: 1, processName: 'Melting Process', status: 'ACTIVE' },
    { processId: 2, processName: 'Casting Process', status: 'ACTIVE' }
  ];

  const mockRouting = {
    routingId: 1,
    processId: 1,
    processName: 'Melting Process',
    routingName: 'Standard Melting',
    routingType: 'SEQUENTIAL',
    status: 'DRAFT',
    steps: [
      {
        routingStepId: 1,
        sequenceNumber: 1,
        operationName: 'Melt',
        operationType: 'MELTING',
        isParallel: false,
        mandatoryFlag: true,
        producesOutputBatch: true,
        allowsSplit: false,
        allowsMerge: false
      },
      {
        routingStepId: 2,
        sequenceNumber: 2,
        operationName: 'Cast',
        operationType: 'CASTING',
        isParallel: false,
        mandatoryFlag: true,
        producesOutputBatch: true,
        allowsSplit: true,
        allowsMerge: false
      }
    ]
  };

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getAllProcesses',
      'getRoutingById',
      'createRouting',
      'updateRouting',
      'createRoutingStep',
      'updateRoutingStep',
      'deleteRoutingStep',
      'reorderRoutingSteps'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        FormsModule,
        ReactiveFormsModule,
        HttpClientTestingModule,
        RouterTestingModule.withRoutes([]),
        SharedModule
      ],
      declarations: [RoutingFormComponent],
      providers: [
        { provide: ApiService, useValue: spy },
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
  });

  beforeEach(() => {
    apiServiceSpy.getAllProcesses.and.returnValue(of(mockProcesses));
    apiServiceSpy.getRoutingById.and.returnValue(of(mockRouting));

    fixture = TestBed.createComponent(RoutingFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should initialize in edit mode', () => {
    expect(component.isEditMode).toBeTrue();
    expect(component.routingId).toBe(1);
  });

  it('should load routing data', () => {
    expect(apiServiceSpy.getRoutingById).toHaveBeenCalledWith(1);
  });

  it('should populate form with routing data', () => {
    expect(component.form.get('routingName')?.value).toBe('Standard Melting');
    expect(component.form.get('processId')?.value).toBe(1);
    expect(component.form.get('routingType')?.value).toBe('SEQUENTIAL');
  });

  it('should load steps', () => {
    expect(component.steps.length).toBe(2);
    expect(component.steps[0].operationName).toBe('Melt');
    expect(component.steps[1].operationName).toBe('Cast');
  });

  it('should show edit title', () => {
    expect(component.title).toBe('Edit Routing');
  });

  it('should update routing successfully', fakeAsync(() => {
    spyOn(router, 'navigate');
    apiServiceSpy.updateRouting.and.returnValue(of({ routingId: 1, routingName: 'Updated Routing' }));

    component.form.patchValue({ routingName: 'Updated Routing' });
    component.onSubmit();
    tick();

    expect(apiServiceSpy.updateRouting).toHaveBeenCalledWith(1, jasmine.objectContaining({
      routingName: 'Updated Routing'
    }));
    expect(router.navigate).toHaveBeenCalledWith(['/manage/routing']);
  }));

  it('should handle update error', fakeAsync(() => {
    apiServiceSpy.updateRouting.and.returnValue(throwError(() => ({ error: { message: 'Update failed' } })));

    component.onSubmit();
    tick();

    expect(component.error).toBe('Update failed');
    expect(component.saving).toBeFalse();
  }));

  it('should handle load routing error', () => {
    apiServiceSpy.getRoutingById.and.returnValue(throwError(() => ({ error: { message: 'Not found' } })));

    component.loadRouting(999);

    expect(component.error).toBe('Not found');
    expect(component.loading).toBeFalse();
  });
});
