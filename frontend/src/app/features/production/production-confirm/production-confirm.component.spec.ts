import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterTestingModule } from '@angular/router/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';

import { ProductionConfirmComponent } from './production-confirm.component';
import { ApiService } from '../../../core/services/api.service';
import { SharedModule } from '../../../shared/shared.module';

describe('ProductionConfirmComponent', () => {
  let component: ProductionConfirmComponent;
  let fixture: ComponentFixture<ProductionConfirmComponent>;
  let apiServiceSpy: jasmine.SpyObj<ApiService>;
  let router: Router;

  const mockOperation = {
    operationId: 1,
    operationName: 'Melt Iron',
    operationCode: 'MLT-001',
    operationType: 'TRANSFORM',
    status: 'READY',
    order: {
      orderId: 1,
      productSku: 'STEEL-001',
      productName: 'Steel Rod',
      quantity: 100
    },
    process: {
      processId: 1,
      processName: 'Melting'
    }
  };

  const mockInventory = [
    {
      inventoryId: 1,
      materialId: 'RM-001',
      materialName: 'Iron Ore',
      batchId: 1,
      batchNumber: 'BATCH-001',
      quantity: 100,
      unit: 'KG'
    }
  ];

  const mockEquipment = [
    { equipmentId: 1, equipmentCode: 'FUR-001', equipmentName: 'Furnace 1', status: 'AVAILABLE' },
    { equipmentId: 2, equipmentCode: 'FUR-002', equipmentName: 'Furnace 2', status: 'AVAILABLE' }
  ];

  const mockOperators = [
    { operatorId: 1, operatorCode: 'OP-001', operatorName: 'John Doe', status: 'ACTIVE' },
    { operatorId: 2, operatorCode: 'OP-002', operatorName: 'Jane Smith', status: 'ACTIVE' }
  ];

  const mockDelayReasons = [
    { reasonCode: 'EQUIP_BREAKDOWN', description: 'Equipment Breakdown' },
    { reasonCode: 'MATERIAL_SHORTAGE', description: 'Material Shortage' }
  ];

  const mockBomRequirements = {
    productSku: 'STEEL-001',
    requirements: [
      { bomId: 1, materialId: 'RM-001', materialName: 'Iron Ore', quantityRequired: 50, unit: 'KG', sequenceLevel: 1 }
    ],
    levels: [1]
  };

  const mockHoldReasons = [
    { reasonCode: 'QUALITY', description: 'Quality Issue' },
    { reasonCode: 'EQUIPMENT', description: 'Equipment Problem' }
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('ApiService', [
      'getOperationDetails',
      'getAvailableEquipment',
      'getActiveOperators',
      'getAvailableInventory',
      'getProcessParameters',
      'getBomRequirements',
      'validateBomConsumption',
      'confirmProduction',
      'getDelayReasons',
      'getHoldReasons',
      'applyHold'
    ]);

    await TestBed.configureTestingModule({
      imports: [
        ReactiveFormsModule,
        RouterTestingModule,
        HttpClientTestingModule,
        SharedModule
      ],
      declarations: [ProductionConfirmComponent],
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
    apiServiceSpy.getOperationDetails.and.returnValue(of(mockOperation as any));
    apiServiceSpy.getAvailableEquipment.and.returnValue(of(mockEquipment as any));
    apiServiceSpy.getActiveOperators.and.returnValue(of(mockOperators as any));
    apiServiceSpy.getAvailableInventory.and.returnValue(of(mockInventory as any));
    apiServiceSpy.getProcessParameters.and.returnValue(of([]));
    apiServiceSpy.getBomRequirements.and.returnValue(of(mockBomRequirements as any));
    apiServiceSpy.validateBomConsumption.and.returnValue(of({ isValid: true, warnings: [], errors: [] } as any));
    apiServiceSpy.getDelayReasons.and.returnValue(of(mockDelayReasons as any));
    apiServiceSpy.getHoldReasons.and.returnValue(of(mockHoldReasons as any));
    apiServiceSpy.applyHold.and.returnValue(of({ holdId: 1, status: 'ACTIVE' } as any));

    fixture = TestBed.createComponent(ProductionConfirmComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with all required fields', () => {
    expect(component.confirmForm).toBeDefined();
    expect(component.confirmForm.get('operationId')?.value).toBe(1);
    expect(component.confirmForm.get('quantityProduced')).toBeTruthy();
    expect(component.confirmForm.get('startTime')).toBeTruthy();
    expect(component.confirmForm.get('endTime')).toBeTruthy();
    expect(component.confirmForm.get('delayMinutes')).toBeTruthy();
    expect(component.confirmForm.get('delayReason')).toBeTruthy();
  });

  it('should load operation details on init', () => {
    expect(apiServiceSpy.getOperationDetails).toHaveBeenCalledWith(1);
    expect(component.operation).toEqual(mockOperation);
  });

  it('should load master data after operation loads', () => {
    expect(apiServiceSpy.getAvailableEquipment).toHaveBeenCalled();
    expect(apiServiceSpy.getActiveOperators).toHaveBeenCalled();
    expect(apiServiceSpy.getAvailableInventory).toHaveBeenCalled();
    expect(component.availableEquipment.length).toBe(2);
    expect(component.activeOperators.length).toBe(2);
    expect(component.availableInventory.length).toBe(1);
  });

  it('should add material to selected list', () => {
    const inventory = mockInventory[0];
    component.addMaterial(inventory);
    expect(component.selectedMaterials.length).toBe(1);
    expect(component.selectedMaterials[0].inventoryId).toBe(1);
  });

  it('should not add duplicate material', () => {
    const inventory = mockInventory[0];
    component.addMaterial(inventory);
    component.addMaterial(inventory);
    expect(component.selectedMaterials.length).toBe(1);
  });

  it('should return true for isMaterialSelected when material is selected', () => {
    const inventory = mockInventory[0];
    component.addMaterial(inventory);
    expect(component.isMaterialSelected(inventory)).toBeTrue();
  });

  it('should return false for isMaterialSelected when material is not selected', () => {
    const inventory = mockInventory[0];
    expect(component.isMaterialSelected(inventory)).toBeFalse();
  });

  it('should return false for isMaterialSelected after material is removed', () => {
    const inventory = mockInventory[0];
    component.addMaterial(inventory);
    expect(component.isMaterialSelected(inventory)).toBeTrue();
    component.removeMaterial(0);
    expect(component.isMaterialSelected(inventory)).toBeFalse();
  });

  it('should remove material from selected list', () => {
    const inventory = mockInventory[0];
    component.addMaterial(inventory);
    expect(component.selectedMaterials.length).toBe(1);

    component.removeMaterial(0);
    expect(component.selectedMaterials.length).toBe(0);
  });

  it('should update material quantity', () => {
    const inventory = mockInventory[0];
    component.addMaterial(inventory);

    component.updateMaterialQuantity(0, 50);
    expect(component.selectedMaterials[0].quantityToConsume).toBe(50);
  });

  it('should not update quantity if exceeds available', () => {
    const inventory = mockInventory[0];
    component.addMaterial(inventory);
    component.selectedMaterials[0].quantityToConsume = 50;

    component.updateMaterialQuantity(0, 200); // Exceeds available 100
    expect(component.selectedMaterials[0].quantityToConsume).toBe(50); // Unchanged
  });

  describe('Form Submission', () => {
    beforeEach(() => {
      // Set up valid time range for all tests
      const pastStart = new Date();
      pastStart.setHours(pastStart.getHours() - 2);
      const pastEnd = new Date();
      pastEnd.setHours(pastEnd.getHours() - 1);

      component.confirmForm.patchValue({
        startTime: component.formatDateTimeLocal(pastStart),
        endTime: component.formatDateTimeLocal(pastEnd)
      });

      // Select equipment and operator
      component.availableEquipment[0].selected = true;
      component.activeOperators[0].selected = true;
    });

    it('should not submit if form is invalid', () => {
      component.confirmForm.patchValue({ quantityProduced: 0 });
      component.onSubmit();
      expect(apiServiceSpy.confirmProduction).not.toHaveBeenCalled();
    });

    it('should confirm production successfully', () => {
      const mockResult = { confirmationId: 1, outputBatchNumber: 'BATCH-OUT-001' } as any;
      apiServiceSpy.confirmProduction.and.returnValue(of(mockResult));

      component.confirmForm.patchValue({ quantityProduced: 100 });
      component.onSubmit();

      expect(apiServiceSpy.confirmProduction).toHaveBeenCalled();
      expect(component.success).toBeTrue();
      expect(component.confirmationResult).toEqual(mockResult);
    });

    it('should handle confirmation error', () => {
      apiServiceSpy.confirmProduction.and.returnValue(
        throwError(() => ({ error: { message: 'Production failed' } }))
      );

      component.confirmForm.patchValue({ quantityProduced: 100 });
      component.onSubmit();

      expect(component.success).toBeFalse();
      expect(component.error).toBe('Production failed');
      expect(component.submitting).toBeFalse();
    });
  });

  describe('BOM Validation', () => {
    it('should get total selected by material', () => {
      component.selectedMaterials = [
        { inventoryId: 1, batchId: 1, batchNumber: 'B1', materialId: 'RM-001', availableQuantity: 100, quantityToConsume: 30 },
        { inventoryId: 2, batchId: 2, batchNumber: 'B2', materialId: 'RM-001', availableQuantity: 100, quantityToConsume: 20 }
      ];

      expect(component.getTotalSelectedByMaterial('RM-001')).toBe(50);
    });

    it('should get requirement status - met', () => {
      component.selectedMaterials = [
        { inventoryId: 1, batchId: 1, batchNumber: 'B1', materialId: 'RM-001', availableQuantity: 100, quantityToConsume: 50 }
      ];

      const req = { bomId: 1, materialId: 'RM-001', materialName: 'Iron Ore', quantityRequired: 50, unit: 'KG', sequenceLevel: 1 };
      expect(component.getRequirementStatus(req)).toBe('met');
    });

    it('should get requirement status - partial', () => {
      component.selectedMaterials = [
        { inventoryId: 1, batchId: 1, batchNumber: 'B1', materialId: 'RM-001', availableQuantity: 100, quantityToConsume: 25 }
      ];

      const req = { bomId: 1, materialId: 'RM-001', materialName: 'Iron Ore', quantityRequired: 50, unit: 'KG', sequenceLevel: 1 };
      expect(component.getRequirementStatus(req)).toBe('partial');
    });

    it('should get requirement status - missing', () => {
      component.selectedMaterials = [];

      const req = { bomId: 1, materialId: 'RM-001', materialName: 'Iron Ore', quantityRequired: 50, unit: 'KG', sequenceLevel: 1 };
      expect(component.getRequirementStatus(req)).toBe('missing');
    });
  });

  describe('Apply Suggested Consumption', () => {
    it('should apply suggested materials to selectedMaterials', () => {
      component.suggestedConsumption = {
        operationId: 1,
        operationName: 'Melting',
        productSku: 'STEEL-001',
        targetQuantity: 100,
        totalRequiredQuantity: 150,
        suggestedMaterials: [
          {
            materialId: 'RM-001',
            materialName: 'Iron Ore',
            requiredQuantity: 50,
            unit: 'KG',
            yieldLossRatio: 1.0,
            availableQuantity: 100,
            sufficientStock: true,
            availableBatches: [
              { inventoryId: 10, batchId: 1, batchNumber: 'BATCH-001', availableQuantity: 100, suggestedConsumption: 50, location: 'Store A' }
            ]
          }
        ]
      };

      component.applySuggestedConsumption();

      expect(component.selectedMaterials.length).toBe(1);
      expect(component.selectedMaterials[0].inventoryId).toBe(10);
      expect(component.selectedMaterials[0].materialId).toBe('RM-001');
      expect(component.selectedMaterials[0].quantityToConsume).toBe(50);
    });

    it('should clear previous selections when applying suggestions', () => {
      component.selectedMaterials = [
        { inventoryId: 99, batchId: 99, batchNumber: 'OLD', materialId: 'OLD-001', availableQuantity: 50, quantityToConsume: 10 }
      ];

      component.suggestedConsumption = {
        operationId: 1,
        operationName: 'Melting',
        productSku: 'STEEL-001',
        targetQuantity: 100,
        totalRequiredQuantity: 50,
        suggestedMaterials: [
          {
            materialId: 'RM-001',
            materialName: 'Iron Ore',
            requiredQuantity: 50,
            unit: 'KG',
            yieldLossRatio: 1.0,
            availableQuantity: 100,
            sufficientStock: true,
            availableBatches: [
              { inventoryId: 10, batchId: 1, batchNumber: 'BATCH-001', availableQuantity: 100, suggestedConsumption: 50, location: 'Store A' }
            ]
          }
        ]
      };

      component.applySuggestedConsumption();

      expect(component.selectedMaterials.length).toBe(1);
      expect(component.selectedMaterials[0].inventoryId).toBe(10);
    });

    it('should not apply if suggestedConsumption is null', () => {
      component.suggestedConsumption = null;
      component.selectedMaterials = [
        { inventoryId: 99, batchId: 99, batchNumber: 'OLD', materialId: 'OLD-001', availableQuantity: 50, quantityToConsume: 10 }
      ];

      component.applySuggestedConsumption();

      expect(component.selectedMaterials.length).toBe(1);
      expect(component.selectedMaterials[0].inventoryId).toBe(99);
    });

    it('should skip batches with zero suggestedConsumption', () => {
      component.suggestedConsumption = {
        operationId: 1,
        operationName: 'Melting',
        productSku: 'STEEL-001',
        targetQuantity: 100,
        totalRequiredQuantity: 50,
        suggestedMaterials: [
          {
            materialId: 'RM-001',
            materialName: 'Iron Ore',
            requiredQuantity: 50,
            unit: 'KG',
            yieldLossRatio: 1.0,
            availableQuantity: 100,
            sufficientStock: true,
            availableBatches: [
              { inventoryId: 10, batchId: 1, batchNumber: 'BATCH-001', availableQuantity: 50, suggestedConsumption: 50, location: 'A' },
              { inventoryId: 11, batchId: 2, batchNumber: 'BATCH-002', availableQuantity: 50, suggestedConsumption: 0, location: 'B' }
            ]
          }
        ]
      };

      component.applySuggestedConsumption();

      expect(component.selectedMaterials.length).toBe(1);
      expect(component.selectedMaterials[0].inventoryId).toBe(10);
    });
  });

  describe('Start/End Time Validation', () => {
    it('should have start time initialized to current time', () => {
      const startTime = component.confirmForm.get('startTime')?.value;
      expect(startTime).toBeTruthy();
    });

    it('should invalidate start time in the future', () => {
      const futureDate = new Date();
      futureDate.setHours(futureDate.getHours() + 2);
      const futureDateTime = component.formatDateTimeLocal(futureDate);

      component.confirmForm.patchValue({ startTime: futureDateTime });
      const startTimeControl = component.confirmForm.get('startTime');

      expect(startTimeControl?.errors?.['futureStartTime']).toBeTrue();
    });

    it('should validate start time in the past', () => {
      const pastDate = new Date();
      pastDate.setHours(pastDate.getHours() - 2);
      const pastDateTime = component.formatDateTimeLocal(pastDate);

      component.confirmForm.patchValue({ startTime: pastDateTime });
      const startTimeControl = component.confirmForm.get('startTime');

      expect(startTimeControl?.errors?.['futureStartTime']).toBeFalsy();
    });

    it('should invalidate when end time is before start time', () => {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setHours(endDate.getHours() - 1);

      component.confirmForm.patchValue({
        startTime: component.formatDateTimeLocal(startDate),
        endTime: component.formatDateTimeLocal(endDate)
      });

      expect(component.confirmForm.errors?.['invalidTimeRange']).toBeTrue();
    });

    it('should validate when end time is after start time', () => {
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 2);
      const endDate = new Date();

      component.confirmForm.patchValue({
        startTime: component.formatDateTimeLocal(startDate),
        endTime: component.formatDateTimeLocal(endDate)
      });

      expect(component.confirmForm.errors?.['invalidTimeRange']).toBeFalsy();
    });

    it('should format date time local correctly', () => {
      const date = new Date(2026, 0, 15, 9, 30); // Jan 15, 2026 09:30
      const formatted = component.formatDateTimeLocal(date);
      expect(formatted).toBe('2026-01-15T09:30');
    });
  });

  describe('Equipment Multi-Select', () => {
    it('should initialize equipment as selection array', () => {
      expect(component.availableEquipment.length).toBe(2);
      expect(component.availableEquipment[0].selected).toBeFalse();
      expect(component.availableEquipment[0].equipmentId).toBe(1);
    });

    it('should toggle equipment selection', () => {
      expect(component.availableEquipment[0].selected).toBeFalse();

      component.toggleEquipment(0);
      expect(component.availableEquipment[0].selected).toBeTrue();

      component.toggleEquipment(0);
      expect(component.availableEquipment[0].selected).toBeFalse();
    });

    it('should get selected equipment ids', () => {
      component.availableEquipment[0].selected = true;
      component.availableEquipment[1].selected = true;

      const selectedIds = component.getSelectedEquipmentIds();
      expect(selectedIds).toEqual([1, 2]);
    });

    it('should count selected equipment', () => {
      expect(component.getSelectedEquipmentCount()).toBe(0);

      component.availableEquipment[0].selected = true;
      expect(component.getSelectedEquipmentCount()).toBe(1);

      component.availableEquipment[1].selected = true;
      expect(component.getSelectedEquipmentCount()).toBe(2);
    });
  });

  describe('Operator Multi-Select', () => {
    it('should initialize operators as selection array', () => {
      expect(component.activeOperators.length).toBe(2);
      expect(component.activeOperators[0].selected).toBeFalse();
      expect(component.activeOperators[0].operatorId).toBe(1);
    });

    it('should toggle operator selection', () => {
      expect(component.activeOperators[0].selected).toBeFalse();

      component.toggleOperator(0);
      expect(component.activeOperators[0].selected).toBeTrue();

      component.toggleOperator(0);
      expect(component.activeOperators[0].selected).toBeFalse();
    });

    it('should get selected operator ids', () => {
      component.activeOperators[0].selected = true;

      const selectedIds = component.getSelectedOperatorIds();
      expect(selectedIds).toEqual([1]);
    });

    it('should count selected operators', () => {
      expect(component.getSelectedOperatorCount()).toBe(0);

      component.activeOperators[0].selected = true;
      component.activeOperators[1].selected = true;
      expect(component.getSelectedOperatorCount()).toBe(2);
    });
  });

  describe('Delay Tracking', () => {
    it('should load delay reasons', () => {
      expect(apiServiceSpy.getDelayReasons).toHaveBeenCalled();
      expect(component.delayReasons.length).toBe(2);
    });

    it('should not require delay reason when delay is 0', () => {
      component.confirmForm.patchValue({ delayMinutes: 0 });
      expect(component.isDelayReasonRequired()).toBeFalsy();
    });

    it('should require delay reason when delay is greater than 0', () => {
      component.confirmForm.patchValue({ delayMinutes: 30 });
      expect(component.isDelayReasonRequired()).toBeTrue();
    });

    it('should block submission when delay > 0 and no reason selected', () => {
      // Set up valid form with valid time range
      const pastStart = new Date();
      pastStart.setHours(pastStart.getHours() - 2);
      const pastEnd = new Date();
      pastEnd.setHours(pastEnd.getHours() - 1);

      component.confirmForm.patchValue({
        quantityProduced: 100,
        delayMinutes: 30,
        delayReason: '',
        startTime: component.formatDateTimeLocal(pastStart),
        endTime: component.formatDateTimeLocal(pastEnd)
      });
      // Select equipment and operator
      component.availableEquipment[0].selected = true;
      component.activeOperators[0].selected = true;

      component.onSubmit();

      expect(component.error.toLowerCase()).toContain('delay reason');
      expect(apiServiceSpy.confirmProduction).not.toHaveBeenCalled();
    });
  });

  describe('Form Submission Validation', () => {
    it('should block submission when no equipment selected', () => {
      // Set valid form with valid time range
      const pastStart = new Date();
      pastStart.setHours(pastStart.getHours() - 2);
      const pastEnd = new Date();
      pastEnd.setHours(pastEnd.getHours() - 1);

      component.confirmForm.patchValue({
        quantityProduced: 100,
        startTime: component.formatDateTimeLocal(pastStart),
        endTime: component.formatDateTimeLocal(pastEnd)
      });
      // No equipment selected
      component.activeOperators[0].selected = true;

      component.onSubmit();

      expect(component.error.toLowerCase()).toContain('equipment');
      expect(apiServiceSpy.confirmProduction).not.toHaveBeenCalled();
    });

    it('should block submission when no operator selected', () => {
      // Set valid form with valid time range
      const pastStart = new Date();
      pastStart.setHours(pastStart.getHours() - 2);
      const pastEnd = new Date();
      pastEnd.setHours(pastEnd.getHours() - 1);

      component.confirmForm.patchValue({
        quantityProduced: 100,
        startTime: component.formatDateTimeLocal(pastStart),
        endTime: component.formatDateTimeLocal(pastEnd)
      });
      component.availableEquipment[0].selected = true;
      // No operator selected

      component.onSubmit();

      expect(component.error.toLowerCase()).toContain('operator');
      expect(apiServiceSpy.confirmProduction).not.toHaveBeenCalled();
    });

    it('should submit successfully with all required fields', () => {
      const mockResult = { confirmationId: 1, outputBatchNumber: 'BATCH-OUT-001' } as any;
      apiServiceSpy.confirmProduction.and.returnValue(of(mockResult));

      // Set valid form values
      const pastStart = new Date();
      pastStart.setHours(pastStart.getHours() - 2);
      const pastEnd = new Date();
      pastEnd.setHours(pastEnd.getHours() - 1);

      component.confirmForm.patchValue({
        quantityProduced: 100,
        startTime: component.formatDateTimeLocal(pastStart),
        endTime: component.formatDateTimeLocal(pastEnd),
        delayMinutes: 0
      });

      // Select equipment and operator
      component.availableEquipment[0].selected = true;
      component.activeOperators[0].selected = true;

      component.onSubmit();

      expect(apiServiceSpy.confirmProduction).toHaveBeenCalled();
      const callArgs = apiServiceSpy.confirmProduction.calls.mostRecent().args[0];
      expect(callArgs.equipmentIds).toEqual([1]);
      expect(callArgs.operatorIds).toEqual([1]);
      expect(callArgs.startTime).toBeTruthy();
      expect(callArgs.endTime).toBeTruthy();
    });
  });

  describe('Navigation', () => {
    it('should go back to order detail', () => {
      spyOn(router, 'navigate');
      component.operation = mockOperation;
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/orders', 1]);
    });

    it('should go back to orders list if no order', () => {
      spyOn(router, 'navigate');
      component.operation = {};
      component.goBack();
      expect(router.navigate).toHaveBeenCalledWith(['/orders']);
    });

    it('should navigate to batch', () => {
      spyOn(router, 'navigate');
      component.goToBatch(1);
      expect(router.navigate).toHaveBeenCalledWith(['/batches', 1]);
    });
  });

  it('should handle error loading operation', () => {
    apiServiceSpy.getOperationDetails.and.returnValue(throwError(() => new Error('Error')));

    component.loadData();

    expect(component.error).toBe('Failed to load operation details');
    expect(component.loading).toBeFalse();
  });
});
