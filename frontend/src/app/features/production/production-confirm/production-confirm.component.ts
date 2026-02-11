import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, switchMap, filter } from 'rxjs/operators';
import { ApiService } from '../../../core/services/api.service';
import { SuggestedConsumptionResponse, SuggestedMaterial, AvailableBatch, BatchSplitPreview } from '../../../shared/models';
import { MaterialSelection, InventoryItem } from '../../../shared/components/material-selection-modal/material-selection-modal.component';
import { EntityType } from '../../../shared/components/apply-hold-modal/apply-hold-modal.component';

interface MaterialConsumption {
  inventoryId: number;
  batchId: number;
  batchNumber: string;
  materialId: string;
  availableQuantity: number;
  quantityToConsume: number;
}

interface BomRequirement {
  bomId: number;
  materialId: string;
  materialName: string;
  quantityRequired: number;
  unit: string;
  sequenceLevel: number;
}

interface EquipmentSelection {
  equipmentId: number;
  equipmentCode: string;
  equipmentName: string;
  selected: boolean;
}

interface OperatorSelection {
  operatorId: number;
  operatorCode: string;
  operatorName: string;
  selected: boolean;
}

@Component({
  selector: 'app-production-confirm',
  templateUrl: './production-confirm.component.html',
  styleUrls: ['./production-confirm.component.css']
})
export class ProductionConfirmComponent implements OnInit, OnDestroy {
  operationId!: number;
  operation: any = null;
  loading = true;
  submitting = false;
  success = false;
  error = '';

  confirmForm!: FormGroup;
  availableInventory: any[] = [];
  availableEquipment: EquipmentSelection[] = [];
  activeOperators: OperatorSelection[] = [];
  processParameters: any[] = [];
  delayReasons: any[] = [];

  selectedMaterials: MaterialConsumption[] = [];
  confirmationResult: any = null;

  // BOM validation
  bomRequirements: BomRequirement[] = [];
  bomValidationResult: any = null;
  showBomWarning = false;

  // Suggested consumption from BOM
  suggestedConsumption: SuggestedConsumptionResponse | null = null;
  loadingSuggestions = false;
  showSuggestions = false;

  // P07-P08: Batch number preview
  previewBatchNumber: string = '';
  loadingBatchPreview = false;

  // P14: Material Selection Modal
  showMaterialModal = false;

  // R-01: Material Reservation
  reservedInventoryIds: number[] = [];
  reservationWarnings: { [inventoryId: number]: string } = {};
  reservingInventoryIds: number[] = [];

  // P15: Apply Hold Modal
  showHoldModal = false;

  // R-12: Batch Size Config Validation
  batchSizeConfig: { found: boolean; minBatchSize?: number; maxBatchSize?: number; preferredBatchSize?: number; unit?: string } | null = null;
  batchSizeWarning: string = '';

  // R-12: Batch Split Preview
  batchSplitPreview: BatchSplitPreview | null = null;
  loadingBatchSplitPreview = false;
  private batchSplitPreviewSubject = new Subject<number>();

  // P17: Collapsible Sections
  collapsedSections: { [key: string]: boolean } = {
    operationDetails: false,
    productionTime: false,
    productionQuantities: false,
    materialConsumption: false,
    equipmentOperator: false,
    delayTracking: false,
    processParameters: false,
    notes: false
  };

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

    // R-12: Listen for quantity changes to update batch size warning and split preview
    this.confirmForm.get('quantityProduced')?.valueChanges.subscribe((qty) => {
      this.checkBatchSizeWarning();
      this.batchSplitPreviewSubject.next(qty);
    });

    // R-12: Debounced batch split preview API call
    this.batchSplitPreviewSubject.pipe(
      debounceTime(300),
      filter(() => !!this.batchSizeConfig?.found && !!this.batchSizeConfig?.maxBatchSize),
      switchMap((qty: number) => {
        if (!qty || qty <= 0 || qty <= (this.batchSizeConfig?.maxBatchSize || 0)) {
          this.batchSplitPreview = null;
          this.loadingBatchSplitPreview = false;
          return [];
        }
        this.loadingBatchSplitPreview = true;
        const operationType = this.operation?.operationType || '';
        const productSku = this.operation?.order?.productSku || '';
        return this.apiService.calculateBatchSizes(qty, operationType, undefined, productSku);
      })
    ).subscribe({
      next: (result: any) => {
        if (result && result.batchCount > 1) {
          this.batchSplitPreview = result;
        } else {
          this.batchSplitPreview = null;
        }
        this.loadingBatchSplitPreview = false;
      },
      error: () => {
        this.batchSplitPreview = null;
        this.loadingBatchSplitPreview = false;
      }
    });
  }

  ngOnDestroy(): void {
    this.releaseAllReservations();
  }

  initForm(): void {
    const now = new Date();
    const localDateTime = this.formatDateTimeLocal(now);

    this.confirmForm = this.fb.group({
      operationId: [this.operationId],
      startTime: [localDateTime, [Validators.required, this.startTimeValidator()]],
      endTime: [localDateTime, [Validators.required]],
      quantityProduced: [0, [Validators.required, Validators.min(1)]],
      quantityScrapped: [0, [Validators.min(0)]],
      delayMinutes: [0, [Validators.min(0)]],
      delayReason: [''],
      notes: [''],
      processParameters: this.fb.array([]),
      // GAP-019: Partial confirmation option
      saveAsPartial: [false]
    }, { validators: this.timeRangeValidator() });
  }

  // Custom validator: Start time must be <= current time
  startTimeValidator() {
    return (control: AbstractControl): ValidationErrors | null => {
      if (!control.value) return null;
      const startTime = new Date(control.value);
      const now = new Date();
      if (startTime > now) {
        return { futureStartTime: true };
      }
      return null;
    };
  }

  // Custom validator: End time must be > Start time
  timeRangeValidator() {
    return (group: AbstractControl): ValidationErrors | null => {
      const startTime = group.get('startTime')?.value;
      const endTime = group.get('endTime')?.value;
      if (startTime && endTime) {
        const start = new Date(startTime);
        const end = new Date(endTime);
        if (end <= start) {
          return { invalidTimeRange: true };
        }
      }
      return null;
    };
  }

  // Format date to datetime-local input format
  formatDateTimeLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  get processParamsFormArray(): FormArray {
    return this.confirmForm.get('processParameters') as FormArray;
  }

  loadData(): void {
    this.loading = true;
    this.batchSplitPreview = null;

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
    // Load available equipment as selection array
    this.apiService.getAvailableEquipment().subscribe({
      next: (equipment) => {
        this.availableEquipment = equipment.map((eq: any) => ({
          equipmentId: eq.equipmentId,
          equipmentCode: eq.equipmentCode,
          equipmentName: eq.name || eq.equipmentName,
          selected: false
        }));
      },
      error: (err) => console.error('Error loading equipment:', err)
    });

    // Load active operators as selection array
    this.apiService.getActiveOperators().subscribe({
      next: (operators) => {
        this.activeOperators = operators.map((op: any) => ({
          operatorId: op.operatorId,
          operatorCode: op.operatorCode,
          operatorName: op.name || op.operatorName,
          selected: false
        }));
      },
      error: (err) => console.error('Error loading operators:', err)
    });

    // Load delay reasons
    this.apiService.getDelayReasons().subscribe({
      next: (reasons) => {
        this.delayReasons = reasons;
      },
      error: (err) => console.error('Error loading delay reasons:', err)
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

    // Load BOM requirements
    if (this.operation?.order?.productSku) {
      this.apiService.getBomRequirements(this.operation.order.productSku).subscribe({
        next: (result) => {
          this.bomRequirements = result.requirements || [];
        },
        error: (err) => console.error('Error loading BOM requirements:', err)
      });
    }

    // Load suggested consumption from BOM
    this.loadSuggestedConsumption();

    // P07: Load batch number preview
    this.loadBatchNumberPreview();

    // R-12: Load batch size config for quantity validation
    this.loadBatchSizeConfig();
  }

  /**
   * P07: Load the preview of the next batch number that would be generated.
   * Does NOT increment the sequence - just shows what it would be.
   */
  loadBatchNumberPreview(): void {
    this.loadingBatchPreview = true;
    const operationType = this.operation?.operationType || '';
    const productSku = this.operation?.order?.productSku || '';

    this.apiService.previewBatchNumber(operationType, productSku).subscribe({
      next: (result) => {
        this.previewBatchNumber = result.previewBatchNumber;
        this.loadingBatchPreview = false;
      },
      error: (err) => {
        console.error('Error loading batch number preview:', err);
        this.previewBatchNumber = '';
        this.loadingBatchPreview = false;
      }
    });
  }

  loadSuggestedConsumption(): void {
    this.loadingSuggestions = true;
    this.apiService.getSuggestedConsumption(this.operationId).subscribe({
      next: (result) => {
        this.suggestedConsumption = result;
        this.loadingSuggestions = false;
        this.showSuggestions = result.suggestedMaterials?.length > 0;

        // Pre-fill target quantity if available
        if (result.targetQuantity && !this.confirmForm.get('quantityProduced')?.value) {
          this.confirmForm.patchValue({ quantityProduced: result.targetQuantity });
        }
      },
      error: (err) => {
        console.error('Error loading suggested consumption:', err);
        this.loadingSuggestions = false;
      }
    });
  }

  /**
   * R-12: Load batch size config for the current operation context.
   * Used to show inline quantity warnings without blocking submission.
   */
  loadBatchSizeConfig(): void {
    const operationType = this.operation?.operationType || '';
    const productSku = this.operation?.order?.productSku || '';

    this.apiService.checkBatchSizeConfig(operationType, productSku).subscribe({
      next: (result) => {
        this.batchSizeConfig = result;
        // Re-validate current quantity against config
        this.checkBatchSizeWarning();
      },
      error: (err) => {
        console.error('Error loading batch size config:', err);
        this.batchSizeConfig = null;
      }
    });
  }

  /**
   * R-12: Check produced quantity against batch size config and set warning message.
   * Called when quantity changes or config loads.
   */
  checkBatchSizeWarning(): void {
    this.batchSizeWarning = '';

    if (!this.batchSizeConfig || !this.batchSizeConfig.found) return;

    const qty = this.confirmForm.get('quantityProduced')?.value || 0;
    if (qty <= 0) return;

    const min = this.batchSizeConfig.minBatchSize || 0;
    const max = this.batchSizeConfig.maxBatchSize || 0;
    const unit = this.batchSizeConfig.unit || 'T';

    const warnings: string[] = [];

    if (min > 0 && qty < min) {
      warnings.push(`Quantity ${qty} is below minimum batch size of ${min} ${unit}`);
    }

    if (max > 0 && qty > max) {
      warnings.push(`Quantity ${qty} exceeds maximum batch size of ${max} ${unit}`);
    }

    this.batchSizeWarning = warnings.join('. ');
  }

  applySuggestedConsumption(): void {
    if (!this.suggestedConsumption) return;

    // R-01: Release all existing reservations before applying suggestions
    this.releaseAllReservations();

    // Clear existing selections
    this.selectedMaterials = [];

    // Apply suggested materials
    for (const material of this.suggestedConsumption.suggestedMaterials) {
      for (const batch of material.availableBatches) {
        if (batch.suggestedConsumption > 0) {
          this.selectedMaterials.push({
            inventoryId: batch.inventoryId,
            batchId: batch.batchId || 0,
            batchNumber: batch.batchNumber || '',
            materialId: material.materialId,
            availableQuantity: batch.availableQuantity,
            quantityToConsume: batch.suggestedConsumption
          });
          // R-01: Reserve each suggested material
          this.reserveInventoryItem(batch.inventoryId, batch.availableQuantity);
        }
      }
    }

    this.validateBom();
  }

  getTotalSuggestedQuantity(): number {
    if (!this.suggestedConsumption) return 0;
    return this.suggestedConsumption.suggestedMaterials
      .reduce((sum, m) => sum + m.requiredQuantity, 0);
  }

  hasSufficientStock(): boolean {
    if (!this.suggestedConsumption) return true;
    return this.suggestedConsumption.suggestedMaterials
      .every(m => m.sufficientStock);
  }

  initProcessParams(): void {
    this.processParamsFormArray.clear();
    this.processParameters.forEach(param => {
      const validators: any[] = [];

      // Required validator
      if (param.is_required) {
        validators.push(Validators.required);
      }

      // Min value validator
      if (param.min_value !== null && param.min_value !== undefined) {
        validators.push(Validators.min(param.min_value));
      }

      // Max value validator
      if (param.max_value !== null && param.max_value !== undefined) {
        validators.push(Validators.max(param.max_value));
      }

      this.processParamsFormArray.push(this.fb.group({
        parameterName: [param.parameter_name],
        parameterValue: [param.default_value || '', validators]
      }));
    });
  }

  isMaterialSelected(inventory: any): boolean {
    return this.selectedMaterials.some(m => m.inventoryId === inventory.inventoryId);
  }

  addMaterial(inventory: any): void {
    const existing = this.selectedMaterials.find(m => m.inventoryId === inventory.inventoryId);
    if (!existing) {
      this.selectedMaterials.push({
        inventoryId: inventory.inventoryId,
        batchId: inventory.batchId,
        batchNumber: inventory.batchNumber,
        materialId: inventory.materialId,
        availableQuantity: inventory.quantity,
        quantityToConsume: 0
      });
      this.validateBom();
      // R-01: Reserve inventory to prevent double-allocation
      this.reserveInventoryItem(inventory.inventoryId, inventory.quantity);
    }
  }

  removeMaterial(index: number): void {
    const material = this.selectedMaterials[index];
    if (material) {
      // R-01: Release reservation when material is removed
      this.releaseInventoryReservation(material.inventoryId);
    }
    this.selectedMaterials.splice(index, 1);
  }

  updateMaterialQuantity(index: number, quantity: number): void {
    if (quantity >= 0 && quantity <= this.selectedMaterials[index].availableQuantity) {
      this.selectedMaterials[index].quantityToConsume = quantity;
      this.validateBom();
    }
  }

  // Equipment selection methods
  toggleEquipment(index: number): void {
    this.availableEquipment[index].selected = !this.availableEquipment[index].selected;
  }

  getSelectedEquipmentIds(): number[] {
    return this.availableEquipment
      .filter(eq => eq.selected)
      .map(eq => eq.equipmentId);
  }

  getSelectedEquipmentCount(): number {
    return this.availableEquipment.filter(eq => eq.selected).length;
  }

  // Operator selection methods
  toggleOperator(index: number): void {
    this.activeOperators[index].selected = !this.activeOperators[index].selected;
  }

  getSelectedOperatorIds(): number[] {
    return this.activeOperators
      .filter(op => op.selected)
      .map(op => op.operatorId);
  }

  getSelectedOperatorCount(): number {
    return this.activeOperators.filter(op => op.selected).length;
  }

  // Check if delay reason is required
  isDelayReasonRequired(): boolean {
    const delayMinutes = this.confirmForm.get('delayMinutes')?.value;
    return delayMinutes && delayMinutes > 0;
  }

  validateBom(): void {
    if (!this.operation?.order?.productSku || this.selectedMaterials.length === 0) {
      this.bomValidationResult = null;
      return;
    }

    const request = {
      productSku: this.operation.order.productSku,
      targetQuantity: this.confirmForm.get('quantityProduced')?.value || 0,
      materialsConsumed: this.selectedMaterials
        .filter(m => m.quantityToConsume > 0)
        .map(m => ({
          materialId: m.materialId,
          quantity: m.quantityToConsume
        }))
    };

    this.apiService.validateBomConsumption(request).subscribe({
      next: (result) => {
        this.bomValidationResult = result;
        this.showBomWarning = result.warnings?.length > 0 || result.errors?.length > 0;
      },
      error: (err) => console.error('Error validating BOM:', err)
    });
  }

  getTotalSelectedByMaterial(materialId: string): number {
    return this.selectedMaterials
      .filter(m => m.materialId === materialId)
      .reduce((sum, m) => sum + m.quantityToConsume, 0);
  }

  getRequirementStatus(req: BomRequirement): string {
    const selected = this.getTotalSelectedByMaterial(req.materialId);
    if (selected >= req.quantityRequired) return 'met';
    if (selected > 0) return 'partial';
    return 'missing';
  }

  onSubmit(): void {
    if (this.confirmForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    // Validate at least one equipment selected
    if (this.getSelectedEquipmentCount() === 0) {
      this.error = 'Please select at least one equipment.';
      return;
    }

    // Validate at least one operator selected
    if (this.getSelectedOperatorCount() === 0) {
      this.error = 'Please select at least one operator.';
      return;
    }

    // Validate delay reason if delay > 0
    const formValue = this.confirmForm.value;
    if (formValue.delayMinutes > 0 && !formValue.delayReason) {
      this.error = 'Please select a delay reason when delay duration is greater than 0.';
      return;
    }

    this.submitting = true;
    this.error = '';

    // Build request with new fields
    const request = {
      operationId: this.operationId,
      producedQty: formValue.quantityProduced,
      scrapQty: formValue.quantityScrapped || 0,
      startTime: new Date(formValue.startTime).toISOString(),
      endTime: new Date(formValue.endTime).toISOString(),
      equipmentIds: this.getSelectedEquipmentIds(),
      operatorIds: this.getSelectedOperatorIds(),
      materialsConsumed: this.selectedMaterials
        .filter(m => m.quantityToConsume > 0)
        .map(m => ({
          batchId: m.batchId,
          inventoryId: m.inventoryId,
          quantity: m.quantityToConsume
        })),
      processParameters: formValue.processParameters
        .filter((p: any) => p.parameterValue)
        .reduce((acc: any, p: any) => {
          acc[p.parameterName] = p.parameterValue;
          return acc;
        }, {}),
      delayMinutes: formValue.delayMinutes || 0,
      delayReason: formValue.delayReason || null,
      notes: formValue.notes,
      // GAP-019: Include saveAsPartial flag
      saveAsPartial: formValue.saveAsPartial || false
    };

    this.apiService.confirmProduction(request).subscribe({
      next: (result) => {
        this.confirmationResult = result;
        this.success = true;
        this.submitting = false;
        // R-01: Clear reservation tracking on success - materials are now consumed, not reserved
        this.reservedInventoryIds = [];
        this.reservationWarnings = {};
        this.reservingInventoryIds = [];
      },
      error: (err) => {
        console.error('Error confirming production:', err);
        this.error = err.error?.message || 'Failed to confirm production';
        this.submitting = false;
      }
    });
  }

  goBack(): void {
    // R-01: Release all reservations when navigating away
    this.releaseAllReservations();
    if (this.operation?.order?.orderId) {
      this.router.navigate(['/orders', this.operation.order.orderId]);
    } else {
      this.router.navigate(['/orders']);
    }
  }

  goToBatch(batchId: number): void {
    this.router.navigate(['/batches', batchId]);
  }

  // ========== Phase 10B: Display Enhancements ==========

  /**
   * P05-P06: Calculate yield percentage = (Good / Total) * 100
   * Where Good = quantityProduced, Total = quantityProduced + quantityScrapped
   */
  get yieldPercentage(): number | null {
    const produced = this.confirmForm.get('quantityProduced')?.value || 0;
    const scrapped = this.confirmForm.get('quantityScrapped')?.value || 0;
    const total = produced + scrapped;
    if (total === 0) return null;
    return Math.round((produced / total) * 10000) / 100; // 2 decimal places
  }

  /**
   * P06: Get yield indicator class based on percentage
   * Green (≥95%), Yellow (80-95%), Red (<80%)
   */
  get yieldClass(): string {
    const yield_pct = this.yieldPercentage;
    if (yield_pct === null) return '';
    if (yield_pct >= 95) return 'yield-good';
    if (yield_pct >= 80) return 'yield-warning';
    return 'yield-critical';
  }

  /**
   * P09: Calculate duration between start and end time in minutes
   */
  get durationMinutes(): number | null {
    const startTime = this.confirmForm.get('startTime')?.value;
    const endTime = this.confirmForm.get('endTime')?.value;
    if (!startTime || !endTime) return null;
    const start = new Date(startTime);
    const end = new Date(endTime);
    const diffMs = end.getTime() - start.getTime();
    if (diffMs <= 0) return null;
    return Math.round(diffMs / 60000); // Convert ms to minutes
  }

  /**
   * P09: Format duration as hours and minutes
   */
  get durationFormatted(): string {
    const mins = this.durationMinutes;
    if (mins === null || mins <= 0) return '--';
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) {
      return `${hours}h ${remainingMins}m`;
    }
    return `${remainingMins}m`;
  }

  /**
   * P05: Get total production quantity (good + scrap)
   */
  get totalProduction(): number {
    const produced = this.confirmForm.get('quantityProduced')?.value || 0;
    const scrapped = this.confirmForm.get('quantityScrapped')?.value || 0;
    return produced + scrapped;
  }

  // ========== P14: Material Selection Modal ==========

  openMaterialModal(): void {
    this.showMaterialModal = true;
  }

  closeMaterialModal(): void {
    this.showMaterialModal = false;
  }

  onMaterialSelectionChange(selections: MaterialSelection[]): void {
    // R-01: Determine which items were added and which were removed
    const oldIds = new Set(this.selectedMaterials.map(m => m.inventoryId));
    const newIds = new Set(selections.map(s => s.inventoryId));

    // Release reservations for removed materials
    for (const oldId of oldIds) {
      if (!newIds.has(oldId)) {
        this.releaseInventoryReservation(oldId);
      }
    }

    // Reserve newly added materials
    for (const sel of selections) {
      if (!oldIds.has(sel.inventoryId)) {
        this.reserveInventoryItem(sel.inventoryId, sel.availableQuantity);
      }
    }

    // Convert MaterialSelection to MaterialConsumption
    this.selectedMaterials = selections.map(sel => ({
      inventoryId: sel.inventoryId,
      batchId: sel.batchId,
      batchNumber: sel.batchNumber,
      materialId: sel.materialId,
      availableQuantity: sel.availableQuantity,
      quantityToConsume: sel.quantityToConsume
    }));
    this.validateBom();
  }

  // Convert available inventory to InventoryItem format for modal
  get inventoryForModal(): InventoryItem[] {
    return this.availableInventory.map(inv => ({
      inventoryId: inv.inventoryId,
      batchId: inv.batchId,
      batchNumber: inv.batchNumber,
      materialId: inv.materialId,
      materialName: inv.materialName,
      quantity: inv.quantity,
      unit: inv.unit || 'T',
      state: inv.state,
      location: inv.location
    }));
  }

  // ========== P15: Apply Hold Modal ==========

  openHoldModal(): void {
    this.showHoldModal = true;
  }

  closeHoldModal(): void {
    this.showHoldModal = false;
  }

  onHoldApplied(hold: any): void {
    // Reload operation to get updated status
    this.loadData();
  }

  get operationName(): string {
    if (!this.operation) return '';
    return `${this.operation.operationName} (${this.operation.operationCode})`;
  }

  // ========== P17: Collapsible Sections ==========

  toggleSection(section: string): void {
    this.collapsedSections[section] = !this.collapsedSections[section];
  }

  isCollapsed(section: string): boolean {
    return this.collapsedSections[section] || false;
  }

  // ========== GAP-019: Multi-Batch & Partial Confirmation Support ==========

  /**
   * Get all output batches from the confirmation result.
   * Falls back to single outputBatch for backward compatibility.
   */
  getOutputBatches(): any[] {
    if (!this.confirmationResult) return [];
    if (this.confirmationResult.outputBatches && this.confirmationResult.outputBatches.length > 0) {
      return this.confirmationResult.outputBatches;
    }
    if (this.confirmationResult.outputBatch) {
      return [this.confirmationResult.outputBatch];
    }
    return [];
  }

  /**
   * Check if confirmation result has multiple batches
   */
  hasMultipleBatches(): boolean {
    return this.getOutputBatches().length > 1;
  }

  /**
   * Check if this is a partial confirmation
   */
  isPartialConfirmation(): boolean {
    return this.confirmationResult?.isPartial === true;
  }

  /**
   * Get remaining quantity for partial confirmation
   */
  getRemainingQty(): number {
    return this.confirmationResult?.remainingQty || 0;
  }

  /**
   * Continue with another confirmation for the same operation (for partial confirmations)
   */
  continueConfirmation(): void {
    // Reset the form but keep the operation
    this.success = false;
    this.confirmationResult = null;
    this.selectedMaterials = [];
    // R-01: Clear reservation tracking (prior materials were consumed)
    this.reservedInventoryIds = [];
    this.reservationWarnings = {};
    this.reservingInventoryIds = [];
    this.initForm();

    // Reload data for fresh state
    this.loadData();
  }

  /**
   * Get the target quantity from operation for comparison
   */
  getTargetQty(): number {
    return this.operation?.targetQty || this.operation?.order?.quantity || 0;
  }

  /**
   * Calculate progress percentage for partial confirmations
   */
  getConfirmationProgress(): number {
    const target = this.getTargetQty();
    if (target <= 0) return 0;
    const confirmed = this.confirmationResult?.producedQty || 0;
    return Math.min(100, Math.round((confirmed / target) * 100));
  }

  // ========== R-01: Material Reservation ==========

  /**
   * Check if a given inventory item has been reserved by this session.
   */
  isReserved(inventoryId: number): boolean {
    return this.reservedInventoryIds.includes(inventoryId);
  }

  /**
   * Check if a given inventory item is currently being reserved (API in flight).
   */
  isReserving(inventoryId: number): boolean {
    return this.reservingInventoryIds.includes(inventoryId);
  }

  /**
   * Check if a reservation warning exists for a given inventory item.
   */
  getReservationWarning(inventoryId: number): string | null {
    return this.reservationWarnings[inventoryId] || null;
  }

  /**
   * Check if there are any reservation warnings across all selected materials.
   */
  hasReservationWarnings(): boolean {
    return Object.keys(this.reservationWarnings).length > 0;
  }

  /**
   * Reserve a single inventory item. On success, track it in reservedInventoryIds.
   * On failure, show a warning but allow the selection (soft enforcement for POC).
   */
  reserveInventoryItem(inventoryId: number, quantity: number): void {
    // Don't re-reserve if already reserved
    if (this.reservedInventoryIds.includes(inventoryId)) return;

    const orderId = this.operation?.order?.orderId || 0;

    // Track as reserving (in-flight)
    this.reservingInventoryIds.push(inventoryId);
    // Clear any previous warning
    delete this.reservationWarnings[inventoryId];

    this.apiService.reserveInventory(inventoryId, orderId, this.operationId, quantity).subscribe({
      next: () => {
        // Mark as reserved
        if (!this.reservedInventoryIds.includes(inventoryId)) {
          this.reservedInventoryIds.push(inventoryId);
        }
        // Remove from reserving
        this.reservingInventoryIds = this.reservingInventoryIds.filter(id => id !== inventoryId);
      },
      error: (err) => {
        console.warn('Failed to reserve inventory:', inventoryId, err);
        // Soft enforcement: allow selection but show warning
        this.reservationWarnings[inventoryId] =
          err.error?.message || 'Could not reserve - may be allocated to another session';
        // Remove from reserving
        this.reservingInventoryIds = this.reservingInventoryIds.filter(id => id !== inventoryId);
      }
    });
  }

  /**
   * Release a single inventory reservation.
   */
  releaseInventoryReservation(inventoryId: number): void {
    if (!this.reservedInventoryIds.includes(inventoryId)) {
      // Not reserved by us, just clean up warning
      delete this.reservationWarnings[inventoryId];
      return;
    }

    this.apiService.releaseReservation(inventoryId).subscribe({
      next: () => {
        this.reservedInventoryIds = this.reservedInventoryIds.filter(id => id !== inventoryId);
        delete this.reservationWarnings[inventoryId];
      },
      error: (err) => {
        console.warn('Failed to release reservation:', inventoryId, err);
        // Still remove from tracking to avoid stale state
        this.reservedInventoryIds = this.reservedInventoryIds.filter(id => id !== inventoryId);
        delete this.reservationWarnings[inventoryId];
      }
    });
  }

  /**
   * Release all reservations held by this session.
   * Called on destroy, cancel, and before applying new suggestions.
   */
  releaseAllReservations(): void {
    const idsToRelease = [...this.reservedInventoryIds];
    for (const inventoryId of idsToRelease) {
      this.apiService.releaseReservation(inventoryId).subscribe({
        next: () => {},
        error: (err) => console.warn('Failed to release reservation on cleanup:', inventoryId, err)
      });
    }
    this.reservedInventoryIds = [];
    this.reservationWarnings = {};
    this.reservingInventoryIds = [];
  }
}
