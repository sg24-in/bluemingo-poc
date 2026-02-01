import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface MaterialConsumption {
  inventoryId: number;
  batchNumber: string;
  materialId: string;
  availableQuantity: number;
  quantityToConsume: number;
}

@Component({
  selector: 'app-production-confirm',
  templateUrl: './production-confirm.component.html',
  styleUrls: ['./production-confirm.component.css']
})
export class ProductionConfirmComponent implements OnInit {
  operationId!: number;
  operation: any = null;
  loading = true;
  submitting = false;
  success = false;
  error = '';

  confirmForm!: FormGroup;
  availableInventory: any[] = [];
  availableEquipment: any[] = [];
  activeOperators: any[] = [];
  processParameters: any[] = [];

  selectedMaterials: MaterialConsumption[] = [];
  confirmationResult: any = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService
  ) {}

  ngOnInit(): void {
    this.operationId = Number(this.route.snapshot.paramMap.get('operationId'));
    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.confirmForm = this.fb.group({
      operationId: [this.operationId],
      quantityProduced: [0, [Validators.required, Validators.min(1)]],
      quantityScrapped: [0, [Validators.min(0)]],
      equipmentId: [null],
      operatorId: [null],
      notes: [''],
      processParameters: this.fb.array([])
    });
  }

  get processParamsFormArray(): FormArray {
    return this.confirmForm.get('processParameters') as FormArray;
  }

  loadData(): void {
    this.loading = true;

    // Load operation details
    this.apiService.getOperationDetails(this.operationId).subscribe({
      next: (op) => {
        this.operation = op;
        this.loadMasterData();
      },
      error: (err) => {
        console.error('Error loading operation:', err);
        this.error = 'Failed to load operation details';
        this.loading = false;
      }
    });
  }

  loadMasterData(): void {
    // Load available equipment
    this.apiService.getAvailableEquipment().subscribe({
      next: (equipment) => {
        this.availableEquipment = equipment;
      },
      error: (err) => console.error('Error loading equipment:', err)
    });

    // Load active operators
    this.apiService.getActiveOperators().subscribe({
      next: (operators) => {
        this.activeOperators = operators;
      },
      error: (err) => console.error('Error loading operators:', err)
    });

    // Load available inventory for consumption
    this.apiService.getAvailableInventory().subscribe({
      next: (inventory) => {
        this.availableInventory = inventory;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading inventory:', err);
        this.loading = false;
      }
    });

    // Load process parameters for this operation type
    if (this.operation?.operationType) {
      this.apiService.getProcessParameters(this.operation.operationType, this.operation.order?.productSku)
        .subscribe({
          next: (params) => {
            this.processParameters = params;
            this.initProcessParams();
          },
          error: (err) => console.error('Error loading process parameters:', err)
        });
    }
  }

  initProcessParams(): void {
    this.processParamsFormArray.clear();
    this.processParameters.forEach(param => {
      this.processParamsFormArray.push(this.fb.group({
        parameterName: [param.parameter_name],
        parameterValue: [param.default_value || '', param.is_required ? Validators.required : []]
      }));
    });
  }

  addMaterial(inventory: any): void {
    const existing = this.selectedMaterials.find(m => m.inventoryId === inventory.inventoryId);
    if (!existing) {
      this.selectedMaterials.push({
        inventoryId: inventory.inventoryId,
        batchNumber: inventory.batchNumber,
        materialId: inventory.materialId,
        availableQuantity: inventory.quantity,
        quantityToConsume: 0
      });
    }
  }

  removeMaterial(index: number): void {
    this.selectedMaterials.splice(index, 1);
  }

  updateMaterialQuantity(index: number, quantity: number): void {
    if (quantity >= 0 && quantity <= this.selectedMaterials[index].availableQuantity) {
      this.selectedMaterials[index].quantityToConsume = quantity;
    }
  }

  onSubmit(): void {
    if (this.confirmForm.invalid) {
      return;
    }

    this.submitting = true;
    this.error = '';

    const formValue = this.confirmForm.value;

    // Build request
    const request = {
      operationId: this.operationId,
      quantityProduced: formValue.quantityProduced,
      quantityScrapped: formValue.quantityScrapped || 0,
      equipmentId: formValue.equipmentId,
      operatorId: formValue.operatorId,
      notes: formValue.notes,
      materialConsumptions: this.selectedMaterials
        .filter(m => m.quantityToConsume > 0)
        .map(m => ({
          inventoryId: m.inventoryId,
          quantityConsumed: m.quantityToConsume
        })),
      processParameters: formValue.processParameters
        .filter((p: any) => p.parameterValue)
        .reduce((acc: any, p: any) => {
          acc[p.parameterName] = p.parameterValue;
          return acc;
        }, {})
    };

    this.apiService.confirmProduction(request).subscribe({
      next: (result) => {
        this.confirmationResult = result;
        this.success = true;
        this.submitting = false;
      },
      error: (err) => {
        console.error('Error confirming production:', err);
        this.error = err.error?.message || 'Failed to confirm production';
        this.submitting = false;
      }
    });
  }

  goBack(): void {
    if (this.operation?.order?.orderId) {
      this.router.navigate(['/orders', this.operation.order.orderId]);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  goToBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }
}
