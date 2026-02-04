import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Import typed models - See CONVENTIONS.md for contract rules
import {
  // Pagination
  PagedResponse,
  PageRequest,
  toQueryParams,
  // Dashboard
  DashboardSummary,
  // Orders
  Order,
  // Batches
  Batch,
  BatchGenealogy,
  BatchSplitRequest,
  BatchSplitResponse,
  BatchMergeRequest,
  BatchMergeResponse,
  BatchStatusUpdateResponse,
  // Inventory
  Inventory,
  InventoryStateUpdateResponse,
  // Equipment
  Equipment,
  EquipmentStatusUpdateResponse,
  // Operations
  Operation,
  OperationStatusUpdateResponse,
  // Processes
  Process,
  ProcessStatusUpdateResponse,
  ProcessQualityDecisionRequest,
  // Holds
  Hold,
  ApplyHoldRequest,
  HoldCountResponse,
  // Production
  ProductionConfirmationRequest,
  ProductionConfirmationResponse,
  // BOM
  BomTreeResponse,
  BomValidationRequest,
  BomValidationResult,
  BomRequirement,
  SuggestedConsumptionResponse,
  // Batch Allocation
  AllocationInfo,
  AllocateRequest,
  UpdateAllocationQuantityRequest,
  BatchAvailability
} from '../../shared/models';

/**
 * API Service - All methods use typed interfaces matching backend DTOs.
 * See CONVENTIONS.md for contract rules.
 *
 * IMPORTANT: Never use 'any' type for API responses.
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {
  constructor(private http: HttpClient) {}

  // ============================================================
  // Orders
  // ============================================================

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiUrl}/orders`);
  }

  /**
   * Get orders with pagination, sorting, and filtering.
   */
  getOrdersPaged(request: PageRequest = {}): Observable<PagedResponse<Order>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<Order>>(`${environment.apiUrl}/orders/paged`, { params });
  }

  getAvailableOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${environment.apiUrl}/orders/available`);
  }

  getOrderById(orderId: number): Observable<Order> {
    return this.http.get<Order>(`${environment.apiUrl}/orders/${orderId}`);
  }

  // ============================================================
  // Production
  // ============================================================

  getOperationDetails(operationId: number): Observable<Operation> {
    return this.http.get<Operation>(`${environment.apiUrl}/production/operations/${operationId}`);
  }

  confirmProduction(request: ProductionConfirmationRequest): Observable<ProductionConfirmationResponse> {
    return this.http.post<ProductionConfirmationResponse>(`${environment.apiUrl}/production/confirm`, request);
  }

  // ============================================================
  // Inventory
  // ============================================================

  getAllInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${environment.apiUrl}/inventory`);
  }

  /**
   * Get inventory with pagination, sorting, and filtering.
   */
  getInventoryPaged(request: PageRequest = {}): Observable<PagedResponse<Inventory>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<Inventory>>(`${environment.apiUrl}/inventory/paged`, { params });
  }

  getAvailableInventory(materialId?: string): Observable<Inventory[]> {
    let params = new HttpParams();
    if (materialId) {
      params = params.set('materialId', materialId);
    }
    return this.http.get<Inventory[]>(`${environment.apiUrl}/inventory/available`, { params });
  }

  getInventoryByState(state: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${environment.apiUrl}/inventory/state/${state}`);
  }

  getInventoryByType(type: string): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${environment.apiUrl}/inventory/type/${type}`);
  }

  getInventoryById(inventoryId: number): Observable<Inventory> {
    return this.http.get<Inventory>(`${environment.apiUrl}/inventory/${inventoryId}`);
  }

  getBlockedInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${environment.apiUrl}/inventory/blocked`);
  }

  getScrappedInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${environment.apiUrl}/inventory/scrapped`);
  }

  blockInventory(inventoryId: number, reason: string): Observable<InventoryStateUpdateResponse> {
    return this.http.post<InventoryStateUpdateResponse>(`${environment.apiUrl}/inventory/${inventoryId}/block`, {
      inventoryId,
      reason
    });
  }

  unblockInventory(inventoryId: number): Observable<InventoryStateUpdateResponse> {
    return this.http.post<InventoryStateUpdateResponse>(`${environment.apiUrl}/inventory/${inventoryId}/unblock`, {});
  }

  scrapInventory(inventoryId: number, reason: string): Observable<InventoryStateUpdateResponse> {
    return this.http.post<InventoryStateUpdateResponse>(`${environment.apiUrl}/inventory/${inventoryId}/scrap`, {
      inventoryId,
      reason
    });
  }

  getReservedInventory(): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${environment.apiUrl}/inventory/reserved`);
  }

  getReservedForOrder(orderId: number): Observable<Inventory[]> {
    return this.http.get<Inventory[]>(`${environment.apiUrl}/inventory/reserved/order/${orderId}`);
  }

  reserveInventory(inventoryId: number, orderId: number, operationId: number, quantity?: number): Observable<InventoryStateUpdateResponse> {
    return this.http.post<InventoryStateUpdateResponse>(`${environment.apiUrl}/inventory/${inventoryId}/reserve`, {
      inventoryId,
      orderId,
      operationId,
      quantity
    });
  }

  releaseReservation(inventoryId: number): Observable<InventoryStateUpdateResponse> {
    return this.http.post<InventoryStateUpdateResponse>(`${environment.apiUrl}/inventory/${inventoryId}/release-reservation`, {});
  }

  // ============================================================
  // Batches
  // ============================================================

  getAllBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${environment.apiUrl}/batches`);
  }

  /**
   * Get batches with pagination, sorting, and filtering.
   */
  getBatchesPaged(request: PageRequest = {}): Observable<PagedResponse<Batch>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<Batch>>(`${environment.apiUrl}/batches/paged`, { params });
  }

  getBatchById(batchId: number): Observable<Batch> {
    return this.http.get<Batch>(`${environment.apiUrl}/batches/${batchId}`);
  }

  getBatchGenealogy(batchId: number): Observable<BatchGenealogy> {
    return this.http.get<BatchGenealogy>(`${environment.apiUrl}/batches/${batchId}/genealogy`);
  }

  getAvailableBatches(materialId?: string): Observable<Batch[]> {
    let params = new HttpParams();
    if (materialId) {
      params = params.set('materialId', materialId);
    }
    return this.http.get<Batch[]>(`${environment.apiUrl}/batches/available`, { params });
  }

  splitBatch(batchId: number, request: BatchSplitRequest): Observable<BatchSplitResponse> {
    return this.http.post<BatchSplitResponse>(`${environment.apiUrl}/batches/${batchId}/split`, request);
  }

  mergeBatches(request: BatchMergeRequest): Observable<BatchMergeResponse> {
    return this.http.post<BatchMergeResponse>(`${environment.apiUrl}/batches/merge`, request);
  }

  getBatchesByStatus(status: string): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${environment.apiUrl}/batches/status/${status}`);
  }

  getProducedBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${environment.apiUrl}/batches/produced`);
  }

  sendBatchForQualityCheck(batchId: number): Observable<BatchStatusUpdateResponse> {
    return this.http.post<BatchStatusUpdateResponse>(`${environment.apiUrl}/batches/${batchId}/quality-check`, {});
  }

  approveBatch(batchId: number): Observable<BatchStatusUpdateResponse> {
    return this.http.post<BatchStatusUpdateResponse>(`${environment.apiUrl}/batches/${batchId}/approve`, {});
  }

  rejectBatch(batchId: number, reason: string): Observable<BatchStatusUpdateResponse> {
    return this.http.post<BatchStatusUpdateResponse>(`${environment.apiUrl}/batches/${batchId}/reject`, { batchId, reason });
  }

  // ============================================================
  // Batch Allocations (GAP-001: Multi-Order Batch Confirmation)
  // ============================================================

  /**
   * Allocate batch to order line
   */
  allocateBatchToOrder(request: AllocateRequest): Observable<AllocationInfo> {
    return this.http.post<AllocationInfo>(`${environment.apiUrl}/batch-allocations`, request);
  }

  /**
   * Release an allocation
   */
  releaseAllocation(allocationId: number): Observable<AllocationInfo> {
    return this.http.put<AllocationInfo>(`${environment.apiUrl}/batch-allocations/${allocationId}/release`, {});
  }

  /**
   * Update allocation quantity
   */
  updateAllocationQuantity(allocationId: number, request: UpdateAllocationQuantityRequest): Observable<AllocationInfo> {
    return this.http.put<AllocationInfo>(`${environment.apiUrl}/batch-allocations/${allocationId}/quantity`, request);
  }

  /**
   * Get allocations for a batch
   */
  getBatchAllocations(batchId: number): Observable<AllocationInfo[]> {
    return this.http.get<AllocationInfo[]>(`${environment.apiUrl}/batch-allocations/batch/${batchId}`);
  }

  /**
   * Get allocations for an order line
   */
  getOrderLineAllocations(orderLineId: number): Observable<AllocationInfo[]> {
    return this.http.get<AllocationInfo[]>(`${environment.apiUrl}/batch-allocations/order-line/${orderLineId}`);
  }

  /**
   * Get batch availability (total, allocated, available)
   */
  getBatchAvailability(batchId: number): Observable<BatchAvailability> {
    return this.http.get<BatchAvailability>(`${environment.apiUrl}/batch-allocations/batch/${batchId}/availability`);
  }

  // ============================================================
  // Master Data
  // ============================================================

  getAllEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${environment.apiUrl}/master/equipment`);
  }

  /**
   * Get equipment with pagination, sorting, and filtering.
   */
  getEquipmentPaged(request: PageRequest = {}): Observable<PagedResponse<Equipment>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<Equipment>>(`${environment.apiUrl}/equipment/paged`, { params });
  }

  getAvailableEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${environment.apiUrl}/master/equipment/available`);
  }

  getAllOperators(): Observable<{ operatorId: number; operatorCode: string; operatorName: string; status: string }[]> {
    return this.http.get<{ operatorId: number; operatorCode: string; operatorName: string; status: string }[]>(`${environment.apiUrl}/master/operators`);
  }

  getActiveOperators(): Observable<{ operatorId: number; operatorCode: string; operatorName: string; status: string }[]> {
    return this.http.get<{ operatorId: number; operatorCode: string; operatorName: string; status: string }[]>(`${environment.apiUrl}/master/operators/active`);
  }

  // ============================================================
  // Equipment (dedicated endpoints)
  // ============================================================

  getEquipmentById(equipmentId: number): Observable<Equipment> {
    return this.http.get<Equipment>(`${environment.apiUrl}/equipment/${equipmentId}`);
  }

  getEquipmentByStatus(status: string): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${environment.apiUrl}/equipment/status/${status}`);
  }

  getMaintenanceEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${environment.apiUrl}/equipment/maintenance`);
  }

  getOnHoldEquipment(): Observable<Equipment[]> {
    return this.http.get<Equipment[]>(`${environment.apiUrl}/equipment/on-hold`);
  }

  startEquipmentMaintenance(equipmentId: number, reason: string, expectedEndTime?: string): Observable<EquipmentStatusUpdateResponse> {
    return this.http.post<EquipmentStatusUpdateResponse>(`${environment.apiUrl}/equipment/${equipmentId}/maintenance/start`, {
      equipmentId,
      reason,
      expectedEndTime
    });
  }

  endEquipmentMaintenance(equipmentId: number): Observable<EquipmentStatusUpdateResponse> {
    return this.http.post<EquipmentStatusUpdateResponse>(`${environment.apiUrl}/equipment/${equipmentId}/maintenance/end`, {});
  }

  putEquipmentOnHold(equipmentId: number, reason: string): Observable<EquipmentStatusUpdateResponse> {
    return this.http.post<EquipmentStatusUpdateResponse>(`${environment.apiUrl}/equipment/${equipmentId}/hold`, {
      equipmentId,
      reason
    });
  }

  releaseEquipmentFromHold(equipmentId: number): Observable<EquipmentStatusUpdateResponse> {
    return this.http.post<EquipmentStatusUpdateResponse>(`${environment.apiUrl}/equipment/${equipmentId}/release`, {});
  }

  getDelayReasons(): Observable<{ reasonCode: string; description: string }[]> {
    return this.http.get<{ reasonCode: string; description: string }[]>(`${environment.apiUrl}/master/delay-reasons`);
  }

  getHoldReasons(): Observable<{ reasonCode: string; description: string }[]> {
    return this.http.get<{ reasonCode: string; description: string }[]>(`${environment.apiUrl}/master/hold-reasons`);
  }

  getProcessParameters(operationType?: string, productSku?: string): Observable<{ parameter_name: string; default_value: string; is_required: boolean }[]> {
    let params = new HttpParams();
    if (operationType) {
      params = params.set('operationType', operationType);
    }
    if (productSku) {
      params = params.set('productSku', productSku);
    }
    return this.http.get<{ parameter_name: string; default_value: string; is_required: boolean }[]>(`${environment.apiUrl}/master/process-parameters`, { params });
  }

  // ============================================================
  // Holds
  // ============================================================

  getActiveHolds(): Observable<Hold[]> {
    return this.http.get<Hold[]>(`${environment.apiUrl}/holds/active`);
  }

  /**
   * Get holds with pagination, sorting, and filtering.
   */
  getHoldsPaged(request: PageRequest = {}): Observable<PagedResponse<Hold>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<Hold>>(`${environment.apiUrl}/holds/paged`, { params });
  }

  getActiveHoldCount(): Observable<HoldCountResponse> {
    return this.http.get<HoldCountResponse>(`${environment.apiUrl}/holds/count`);
  }

  applyHold(request: ApplyHoldRequest): Observable<Hold> {
    return this.http.post<Hold>(`${environment.apiUrl}/holds`, request);
  }

  releaseHold(holdId: number, releaseComments?: string): Observable<Hold> {
    return this.http.put<Hold>(`${environment.apiUrl}/holds/${holdId}/release`, { releaseComments });
  }

  checkEntityOnHold(entityType: string, entityId: number): Observable<{ onHold: boolean; holdId?: number }> {
    return this.http.get<{ onHold: boolean; holdId?: number }>(`${environment.apiUrl}/holds/check/${entityType}/${entityId}`);
  }

  getHoldsByEntity(entityType: string, entityId: number): Observable<Hold[]> {
    return this.http.get<Hold[]>(`${environment.apiUrl}/holds/entity/${entityType}/${entityId}`);
  }

  // ============================================================
  // BOM
  // ============================================================

  getBomRequirements(productSku: string): Observable<BomTreeResponse> {
    return this.http.get<BomTreeResponse>(`${environment.apiUrl}/bom/${productSku}/requirements`);
  }

  getBomRequirementsForLevel(productSku: string, level: number): Observable<BomRequirement[]> {
    return this.http.get<BomRequirement[]>(`${environment.apiUrl}/bom/${productSku}/requirements/level/${level}`);
  }

  validateBomConsumption(request: BomValidationRequest): Observable<BomValidationResult> {
    return this.http.post<BomValidationResult>(`${environment.apiUrl}/bom/validate`, request);
  }

  getSuggestedConsumption(operationId: number): Observable<SuggestedConsumptionResponse> {
    return this.http.get<SuggestedConsumptionResponse>(`${environment.apiUrl}/bom/operation/${operationId}/suggested-consumption`);
  }

  // ============================================================
  // Dashboard
  // ============================================================

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard/summary`);
  }

  // ============================================================
  // Processes
  // ============================================================

  getProcessById(processId: number): Observable<Process> {
    return this.http.get<Process>(`${environment.apiUrl}/processes/${processId}`);
  }

  getProcessesByStatus(status: string): Observable<Process[]> {
    return this.http.get<Process[]>(`${environment.apiUrl}/processes/status/${status}`);
  }

  getQualityPendingProcesses(): Observable<Process[]> {
    return this.http.get<Process[]>(`${environment.apiUrl}/processes/quality-pending`);
  }

  transitionToQualityPending(processId: number, notes?: string): Observable<ProcessStatusUpdateResponse> {
    return this.http.post<ProcessStatusUpdateResponse>(`${environment.apiUrl}/processes/${processId}/quality-pending`, { notes });
  }

  makeQualityDecision(request: ProcessQualityDecisionRequest): Observable<ProcessStatusUpdateResponse> {
    return this.http.post<ProcessStatusUpdateResponse>(`${environment.apiUrl}/processes/quality-decision`, request);
  }

  acceptProcess(processId: number, notes?: string): Observable<ProcessStatusUpdateResponse> {
    return this.http.post<ProcessStatusUpdateResponse>(`${environment.apiUrl}/processes/${processId}/accept`, { notes });
  }

  rejectProcess(processId: number, reason: string, notes?: string): Observable<ProcessStatusUpdateResponse> {
    return this.http.post<ProcessStatusUpdateResponse>(`${environment.apiUrl}/processes/${processId}/reject`, { reason, notes });
  }

  updateProcessStatus(request: { processId: number; newStatus: string; reason?: string }): Observable<ProcessStatusUpdateResponse> {
    return this.http.put<ProcessStatusUpdateResponse>(`${environment.apiUrl}/processes/status`, request);
  }

  checkAllOperationsConfirmed(processId: number): Observable<{ allConfirmed: boolean; confirmedCount: number; totalCount: number }> {
    return this.http.get<{ allConfirmed: boolean; confirmedCount: number; totalCount: number }>(`${environment.apiUrl}/processes/${processId}/all-confirmed`);
  }

  // ============================================================
  // Operations
  // ============================================================

  getAllOperations(): Observable<Operation[]> {
    return this.http.get<Operation[]>(`${environment.apiUrl}/operations`);
  }

  getOperationById(operationId: number): Observable<Operation> {
    return this.http.get<Operation>(`${environment.apiUrl}/operations/${operationId}`);
  }

  getOperationsByStatus(status: string): Observable<Operation[]> {
    return this.http.get<Operation[]>(`${environment.apiUrl}/operations/status/${status}`);
  }

  getBlockedOperations(): Observable<Operation[]> {
    return this.http.get<Operation[]>(`${environment.apiUrl}/operations/blocked`);
  }

  blockOperation(operationId: number, reason: string): Observable<OperationStatusUpdateResponse> {
    return this.http.post<OperationStatusUpdateResponse>(`${environment.apiUrl}/operations/${operationId}/block`, {
      operationId,
      reason
    });
  }

  unblockOperation(operationId: number): Observable<OperationStatusUpdateResponse> {
    return this.http.post<OperationStatusUpdateResponse>(`${environment.apiUrl}/operations/${operationId}/unblock`, {});
  }
}
