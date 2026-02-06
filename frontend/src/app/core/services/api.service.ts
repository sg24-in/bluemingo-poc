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
  CreateBatchRequest,
  UpdateBatchRequest,
  AdjustQuantityRequest,
  AdjustQuantityResponse,
  QuantityAdjustmentHistory,
  BatchNumberPreview,
  // Inventory
  Inventory,
  InventoryStateUpdateResponse,
  CreateInventoryRequest,
  UpdateInventoryRequest,
  ReceiveMaterialRequest,
  ReceiveMaterialResponse,
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
  BomTreeNode,
  BomTreeFullResponse,
  CreateBomNodeRequest,
  CreateBomTreeRequest,
  UpdateBomNodeRequest,
  MoveBomNodeRequest,
  BomListResponse,
  BomProductSummary,
  UpdateBomSettingsRequest,
  UpdateBomSettingsResponse,
  // Batch Allocation
  AllocationInfo,
  AllocateRequest,
  UpdateAllocationQuantityRequest,
  BatchAvailability,
  // Master Data
  Customer,
  CreateCustomerRequest,
  UpdateCustomerRequest,
  Material,
  CreateMaterialRequest,
  UpdateMaterialRequest,
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  // Config
  HoldReason,
  DelayReason,
  ProcessParametersConfig,
  BatchNumberConfig,
  QuantityTypeConfig,
  // Audit
  AuditEntry,
  AuditHistory,
  AuditSummary
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

  getConfirmationById(id: number): Observable<ProductionConfirmationResponse> {
    return this.http.get<ProductionConfirmationResponse>(`${environment.apiUrl}/production/confirmations/${id}`);
  }

  getConfirmationsByStatus(status: string): Observable<ProductionConfirmationResponse[]> {
    return this.http.get<ProductionConfirmationResponse[]>(`${environment.apiUrl}/production/confirmations/status/${status}`);
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

  createInventory(data: CreateInventoryRequest): Observable<Inventory> {
    return this.http.post<Inventory>(`${environment.apiUrl}/inventory`, data);
  }

  updateInventory(inventoryId: number, data: UpdateInventoryRequest): Observable<Inventory> {
    return this.http.put<Inventory>(`${environment.apiUrl}/inventory/${inventoryId}`, data);
  }

  deleteInventory(inventoryId: number): Observable<InventoryStateUpdateResponse> {
    return this.http.delete<InventoryStateUpdateResponse>(`${environment.apiUrl}/inventory/${inventoryId}`);
  }

  /**
   * Receive raw material into inventory.
   * Creates Batch (QUALITY_PENDING) + Inventory (AVAILABLE) + InventoryMovement (RECEIVE).
   */
  receiveMaterial(request: ReceiveMaterialRequest): Observable<ReceiveMaterialResponse> {
    return this.http.post<ReceiveMaterialResponse>(`${environment.apiUrl}/inventory/receive-material`, request);
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

  createBatch(data: CreateBatchRequest): Observable<Batch> {
    return this.http.post<Batch>(`${environment.apiUrl}/batches`, data);
  }

  updateBatch(batchId: number, data: UpdateBatchRequest): Observable<Batch> {
    return this.http.put<Batch>(`${environment.apiUrl}/batches/${batchId}`, data);
  }

  deleteBatch(batchId: number): Observable<BatchStatusUpdateResponse> {
    return this.http.delete<BatchStatusUpdateResponse>(`${environment.apiUrl}/batches/${batchId}`);
  }

  // Batch quantity adjustment (per MES Batch Management Specification)
  adjustBatchQuantity(batchId: number, request: AdjustQuantityRequest): Observable<AdjustQuantityResponse> {
    return this.http.post<AdjustQuantityResponse>(`${environment.apiUrl}/batches/${batchId}/adjust-quantity`, request);
  }

  getBatchAdjustmentHistory(batchId: number): Observable<QuantityAdjustmentHistory[]> {
    return this.http.get<QuantityAdjustmentHistory[]>(`${environment.apiUrl}/batches/${batchId}/adjustments`);
  }

  /**
   * P07: Preview the next batch number without incrementing sequence.
   * Shows users what the next batch number will be before confirmation.
   */
  previewBatchNumber(operationType?: string, productSku?: string): Observable<BatchNumberPreview> {
    let params = new HttpParams();
    if (operationType) {
      params = params.set('operationType', operationType);
    }
    if (productSku) {
      params = params.set('productSku', productSku);
    }
    return this.http.get<BatchNumberPreview>(`${environment.apiUrl}/batches/preview-number`, { params });
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

  createEquipment(data: any): Observable<Equipment> {
    return this.http.post<Equipment>(`${environment.apiUrl}/equipment`, data);
  }

  updateEquipment(equipmentId: number, data: any): Observable<Equipment> {
    return this.http.put<Equipment>(`${environment.apiUrl}/equipment/${equipmentId}`, data);
  }

  deleteEquipment(equipmentId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/equipment/${equipmentId}`);
  }

  // ============================================================
  // Operators (CRUD endpoints)
  // ============================================================

  getOperatorsPaged(request: PageRequest = {}): Observable<PagedResponse<any>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<any>>(`${environment.apiUrl}/operators/paged`, { params });
  }

  getOperatorById(operatorId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/operators/${operatorId}`);
  }

  createOperator(data: any): Observable<any> {
    return this.http.post(`${environment.apiUrl}/operators`, data);
  }

  updateOperator(operatorId: number, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/operators/${operatorId}`, data);
  }

  deleteOperator(operatorId: number): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/operators/${operatorId}`);
  }

  activateOperator(operatorId: number): Observable<any> {
    return this.http.post(`${environment.apiUrl}/operators/${operatorId}/activate`, {});
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

  getEquipmentTypes(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/master/equipment-types`);
  }

  getEquipmentTypeConfig(type: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/master/equipment-types/${type}`);
  }

  getInventoryForms(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/master/inventory-forms`);
  }

  getInventoryFormConfig(formCode: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/master/inventory-forms/${formCode}`);
  }

  getQuantityTypeConfigForContext(params: {materialCode?: string, operationType?: string, equipmentType?: string}): Observable<any> {
    let httpParams = new HttpParams();
    if (params.materialCode) {
      httpParams = httpParams.set('materialCode', params.materialCode);
    }
    if (params.operationType) {
      httpParams = httpParams.set('operationType', params.operationType);
    }
    if (params.equipmentType) {
      httpParams = httpParams.set('equipmentType', params.equipmentType);
    }
    return this.http.get<any>(`${environment.apiUrl}/master/quantity-type-config`, { params: httpParams });
  }

  // ============================================================
  // Holds
  // ============================================================

  getActiveHolds(): Observable<Hold[]> {
    return this.http.get<Hold[]>(`${environment.apiUrl}/holds/active`);
  }

  getHoldById(holdId: number): Observable<Hold> {
    return this.http.get<Hold>(`${environment.apiUrl}/holds/${holdId}`);
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
  // BOM Tree CRUD
  // ============================================================

  /**
   * Get full hierarchical BOM tree for a product
   */
  getBomTree(productSku: string): Observable<BomTreeFullResponse> {
    return this.http.get<BomTreeFullResponse>(`${environment.apiUrl}/bom/${productSku}/tree`);
  }

  /**
   * Get BOM tree for a specific version
   */
  getBomTreeByVersion(productSku: string, version: string): Observable<BomTreeFullResponse> {
    return this.http.get<BomTreeFullResponse>(`${environment.apiUrl}/bom/${productSku}/tree/version/${version}`);
  }

  /**
   * Get flat list of BOM nodes for table view
   */
  getBomList(productSku: string): Observable<BomListResponse[]> {
    return this.http.get<BomListResponse[]>(`${environment.apiUrl}/bom/${productSku}/list`);
  }

  /**
   * Get single BOM node by ID
   */
  getBomNode(bomId: number): Observable<BomTreeNode> {
    return this.http.get<BomTreeNode>(`${environment.apiUrl}/bom/node/${bomId}`);
  }

  /**
   * Get all products that have BOMs defined
   */
  getBomProducts(): Observable<BomProductSummary[]> {
    return this.http.get<BomProductSummary[]>(`${environment.apiUrl}/bom/products`);
  }

  /**
   * Get available BOM versions for a product
   */
  getBomVersions(productSku: string): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/bom/${productSku}/versions`);
  }

  /**
   * Create a single BOM node
   */
  createBomNode(request: CreateBomNodeRequest): Observable<BomTreeNode> {
    return this.http.post<BomTreeNode>(`${environment.apiUrl}/bom/node`, request);
  }

  /**
   * Create a full BOM tree (multiple nodes at once)
   */
  createBomTree(request: CreateBomTreeRequest): Observable<BomTreeFullResponse> {
    return this.http.post<BomTreeFullResponse>(`${environment.apiUrl}/bom/tree`, request);
  }

  /**
   * Update a BOM node
   */
  updateBomNode(bomId: number, request: UpdateBomNodeRequest): Observable<BomTreeNode> {
    return this.http.put<BomTreeNode>(`${environment.apiUrl}/bom/node/${bomId}`, request);
  }

  /**
   * Move a BOM node to a new parent
   */
  moveBomNode(bomId: number, request: MoveBomNodeRequest): Observable<BomTreeNode> {
    return this.http.put<BomTreeNode>(`${environment.apiUrl}/bom/node/${bomId}/move`, request);
  }

  /**
   * Delete a BOM node (soft delete, no children)
   */
  deleteBomNode(bomId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/bom/node/${bomId}`);
  }

  /**
   * Delete a BOM node and all its children (cascade)
   */
  deleteBomNodeCascade(bomId: number): Observable<{ message: string; deletedCount: number }> {
    return this.http.delete<{ message: string; deletedCount: number }>(`${environment.apiUrl}/bom/node/${bomId}/cascade`);
  }

  /**
   * Delete entire BOM tree for a product
   */
  deleteBomTree(productSku: string): Observable<{ message: string; deletedCount: number }> {
    return this.http.delete<{ message: string; deletedCount: number }>(`${environment.apiUrl}/bom/${productSku}/tree`);
  }

  /**
   * Update top-level BOM settings (version, status) for all nodes
   */
  updateBomSettings(productSku: string, request: UpdateBomSettingsRequest): Observable<UpdateBomSettingsResponse> {
    return this.http.put<UpdateBomSettingsResponse>(`${environment.apiUrl}/bom/${productSku}/settings`, request);
  }

  // ============================================================
  // Dashboard
  // ============================================================

  getDashboardSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${environment.apiUrl}/dashboard/summary`);
  }

  // ============================================================
  // Process Instances (Runtime - formerly "Processes" at runtime)
  // ============================================================

  getProcessInstanceById(processInstanceId: number): Observable<Process> {
    return this.http.get<Process>(`${environment.apiUrl}/process-instances/${processInstanceId}`);
  }

  getProcessInstancesByStatus(status: string): Observable<Process[]> {
    return this.http.get<Process[]>(`${environment.apiUrl}/process-instances/status/${status}`);
  }

  getQualityPendingProcessInstances(): Observable<Process[]> {
    return this.http.get<Process[]>(`${environment.apiUrl}/process-instances/quality-pending`);
  }

  transitionToQualityPending(processInstanceId: number, notes?: string): Observable<ProcessStatusUpdateResponse> {
    return this.http.post<ProcessStatusUpdateResponse>(`${environment.apiUrl}/process-instances/${processInstanceId}/quality-pending`, { notes });
  }

  makeQualityDecision(request: ProcessQualityDecisionRequest): Observable<ProcessStatusUpdateResponse> {
    return this.http.post<ProcessStatusUpdateResponse>(`${environment.apiUrl}/process-instances/quality-decision`, request);
  }

  acceptProcessInstance(processInstanceId: number, notes?: string): Observable<ProcessStatusUpdateResponse> {
    return this.http.post<ProcessStatusUpdateResponse>(`${environment.apiUrl}/process-instances/${processInstanceId}/accept`, { notes });
  }

  rejectProcessInstance(processInstanceId: number, reason: string, notes?: string): Observable<ProcessStatusUpdateResponse> {
    return this.http.post<ProcessStatusUpdateResponse>(`${environment.apiUrl}/process-instances/${processInstanceId}/reject`, { reason, notes });
  }

  updateProcessInstanceStatus(request: { processInstanceId: number; newStatus: string; reason?: string }): Observable<ProcessStatusUpdateResponse> {
    return this.http.put<ProcessStatusUpdateResponse>(`${environment.apiUrl}/process-instances/status`, request);
  }

  checkAllOperationsConfirmed(processInstanceId: number): Observable<{ allConfirmed: boolean; confirmedCount: number; totalCount: number }> {
    return this.http.get<{ allConfirmed: boolean; confirmedCount: number; totalCount: number }>(`${environment.apiUrl}/process-instances/${processInstanceId}/all-confirmed`);
  }

  // Backward compatibility aliases (deprecated - use new method names)
  /** @deprecated Use getProcessInstanceById instead */
  getProcessById(processId: number): Observable<Process> {
    return this.getProcessInstanceById(processId);
  }
  /** @deprecated Use getProcessInstancesByStatus instead */
  getProcessesByStatus(status: string): Observable<Process[]> {
    return this.getProcessInstancesByStatus(status);
  }
  /** @deprecated Use getQualityPendingProcessInstances instead */
  getQualityPendingProcesses(): Observable<Process[]> {
    return this.getQualityPendingProcessInstances();
  }
  /** @deprecated Use acceptProcessInstance instead */
  acceptProcess(processId: number, notes?: string): Observable<ProcessStatusUpdateResponse> {
    return this.acceptProcessInstance(processId, notes);
  }
  /** @deprecated Use rejectProcessInstance instead */
  rejectProcess(processId: number, reason: string, notes?: string): Observable<ProcessStatusUpdateResponse> {
    return this.rejectProcessInstance(processId, reason, notes);
  }
  /** @deprecated Use updateProcessInstanceStatus instead */
  updateProcessStatus(request: { processId: number; newStatus: string; reason?: string }): Observable<ProcessStatusUpdateResponse> {
    return this.updateProcessInstanceStatus({ processInstanceId: request.processId, newStatus: request.newStatus, reason: request.reason });
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

  // ============================================================
  // Customers
  // ============================================================

  getCustomersPaged(request: PageRequest = {}): Observable<PagedResponse<Customer>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<Customer>>(`${environment.apiUrl}/customers/paged`, { params });
  }

  getAllCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${environment.apiUrl}/customers`);
  }

  getActiveCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${environment.apiUrl}/customers/active`);
  }

  getCustomerById(customerId: number): Observable<Customer> {
    return this.http.get<Customer>(`${environment.apiUrl}/customers/${customerId}`);
  }

  createCustomer(request: CreateCustomerRequest): Observable<Customer> {
    return this.http.post<Customer>(`${environment.apiUrl}/customers`, request);
  }

  updateCustomer(customerId: number, request: UpdateCustomerRequest): Observable<Customer> {
    return this.http.put<Customer>(`${environment.apiUrl}/customers/${customerId}`, request);
  }

  deleteCustomer(customerId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/customers/${customerId}`);
  }

  activateCustomer(customerId: number): Observable<Customer> {
    return this.http.post<Customer>(`${environment.apiUrl}/customers/${customerId}/activate`, {});
  }

  // ============================================================
  // Materials
  // ============================================================

  getMaterialsPaged(request: PageRequest = {}): Observable<PagedResponse<Material>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<Material>>(`${environment.apiUrl}/materials/paged`, { params });
  }

  getAllMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(`${environment.apiUrl}/materials`);
  }

  getActiveMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(`${environment.apiUrl}/materials/active`);
  }

  getMaterialById(materialId: number): Observable<Material> {
    return this.http.get<Material>(`${environment.apiUrl}/materials/${materialId}`);
  }

  createMaterial(request: CreateMaterialRequest): Observable<Material> {
    return this.http.post<Material>(`${environment.apiUrl}/materials`, request);
  }

  updateMaterial(materialId: number, request: UpdateMaterialRequest): Observable<Material> {
    return this.http.put<Material>(`${environment.apiUrl}/materials/${materialId}`, request);
  }

  deleteMaterial(materialId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/materials/${materialId}`);
  }

  activateMaterial(materialId: number): Observable<Material> {
    return this.http.post<Material>(`${environment.apiUrl}/materials/${materialId}/activate`, {});
  }

  // ============================================================
  // Products
  // ============================================================

  getProductsPaged(request: PageRequest = {}): Observable<PagedResponse<Product>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<Product>>(`${environment.apiUrl}/products/paged`, { params });
  }

  getAllProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/products`);
  }

  getActiveProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/products/active`);
  }

  getProductById(productId: number): Observable<Product> {
    return this.http.get<Product>(`${environment.apiUrl}/products/${productId}`);
  }

  createProduct(request: CreateProductRequest): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/products`, request);
  }

  updateProduct(productId: number, request: UpdateProductRequest): Observable<Product> {
    return this.http.put<Product>(`${environment.apiUrl}/products/${productId}`, request);
  }

  deleteProduct(productId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/products/${productId}`);
  }

  activateProduct(productId: number): Observable<Product> {
    return this.http.post<Product>(`${environment.apiUrl}/products/${productId}/activate`, {});
  }

  // ============================================================
  // Orders CRUD
  // ============================================================

  createOrder(request: { customerId: string; customerName: string; orderDate: string; orderNumber?: string; lineItems: { productSku: string; productName: string; quantity: number; unit: string; deliveryDate?: string }[] }): Observable<Order> {
    return this.http.post<Order>(`${environment.apiUrl}/orders`, request);
  }

  updateOrder(orderId: number, request: { customerId: string; customerName: string; orderDate?: string; status?: string }): Observable<Order> {
    return this.http.put<Order>(`${environment.apiUrl}/orders/${orderId}`, request);
  }

  deleteOrder(orderId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/orders/${orderId}`);
  }

  addOrderLineItem(orderId: number, request: { productSku: string; productName: string; quantity: number; unit: string; deliveryDate?: string }): Observable<Order> {
    return this.http.post<Order>(`${environment.apiUrl}/orders/${orderId}/line-items`, request);
  }

  updateOrderLineItem(orderId: number, lineItemId: number, request: { productSku: string; productName: string; quantity: number; unit: string; deliveryDate?: string }): Observable<Order> {
    return this.http.put<Order>(`${environment.apiUrl}/orders/${orderId}/line-items/${lineItemId}`, request);
  }

  deleteOrderLineItem(orderId: number, lineItemId: number): Observable<Order> {
    return this.http.delete<Order>(`${environment.apiUrl}/orders/${orderId}/line-items/${lineItemId}`);
  }

  // ============================================================
  // Config: Hold Reasons
  // ============================================================

  getHoldReasonsPaged(request: PageRequest = {}): Observable<PagedResponse<HoldReason>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<HoldReason>>(`${environment.apiUrl}/config/hold-reasons/paged`, { params });
  }

  getHoldReasonById(id: number): Observable<HoldReason> {
    return this.http.get<HoldReason>(`${environment.apiUrl}/config/hold-reasons/${id}`);
  }

  createHoldReason(request: Partial<HoldReason>): Observable<HoldReason> {
    return this.http.post<HoldReason>(`${environment.apiUrl}/config/hold-reasons`, request);
  }

  updateHoldReason(id: number, request: Partial<HoldReason>): Observable<HoldReason> {
    return this.http.put<HoldReason>(`${environment.apiUrl}/config/hold-reasons/${id}`, request);
  }

  deleteHoldReason(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/config/hold-reasons/${id}`);
  }

  // ============================================================
  // Config: Delay Reasons
  // ============================================================

  getDelayReasonsPaged(request: PageRequest = {}): Observable<PagedResponse<DelayReason>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<DelayReason>>(`${environment.apiUrl}/config/delay-reasons/paged`, { params });
  }

  getDelayReasonById(id: number): Observable<DelayReason> {
    return this.http.get<DelayReason>(`${environment.apiUrl}/config/delay-reasons/${id}`);
  }

  createDelayReason(request: Partial<DelayReason>): Observable<DelayReason> {
    return this.http.post<DelayReason>(`${environment.apiUrl}/config/delay-reasons`, request);
  }

  updateDelayReason(id: number, request: Partial<DelayReason>): Observable<DelayReason> {
    return this.http.put<DelayReason>(`${environment.apiUrl}/config/delay-reasons/${id}`, request);
  }

  deleteDelayReason(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/config/delay-reasons/${id}`);
  }

  // ============================================================
  // Config: Process Parameters
  // ============================================================

  getProcessParamsPaged(request: PageRequest = {}): Observable<PagedResponse<ProcessParametersConfig>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<ProcessParametersConfig>>(`${environment.apiUrl}/config/process-parameters/paged`, { params });
  }

  getProcessParamById(id: number): Observable<ProcessParametersConfig> {
    return this.http.get<ProcessParametersConfig>(`${environment.apiUrl}/config/process-parameters/${id}`);
  }

  createProcessParam(request: Partial<ProcessParametersConfig>): Observable<ProcessParametersConfig> {
    return this.http.post<ProcessParametersConfig>(`${environment.apiUrl}/config/process-parameters`, request);
  }

  updateProcessParam(id: number, request: Partial<ProcessParametersConfig>): Observable<ProcessParametersConfig> {
    return this.http.put<ProcessParametersConfig>(`${environment.apiUrl}/config/process-parameters/${id}`, request);
  }

  deleteProcessParam(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/config/process-parameters/${id}`);
  }

  // ============================================================
  // Config: Batch Number
  // ============================================================

  getBatchNumberConfigsPaged(request: PageRequest = {}): Observable<PagedResponse<BatchNumberConfig>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<BatchNumberConfig>>(`${environment.apiUrl}/config/batch-number/paged`, { params });
  }

  getBatchNumberConfigById(id: number): Observable<BatchNumberConfig> {
    return this.http.get<BatchNumberConfig>(`${environment.apiUrl}/config/batch-number/${id}`);
  }

  createBatchNumberConfig(request: Partial<BatchNumberConfig>): Observable<BatchNumberConfig> {
    return this.http.post<BatchNumberConfig>(`${environment.apiUrl}/config/batch-number`, request);
  }

  updateBatchNumberConfig(id: number, request: Partial<BatchNumberConfig>): Observable<BatchNumberConfig> {
    return this.http.put<BatchNumberConfig>(`${environment.apiUrl}/config/batch-number/${id}`, request);
  }

  deleteBatchNumberConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/config/batch-number/${id}`);
  }

  // ============================================================
  // Config: Quantity Type
  // ============================================================

  getQuantityTypeConfigsPaged(request: PageRequest = {}): Observable<PagedResponse<QuantityTypeConfig>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<QuantityTypeConfig>>(`${environment.apiUrl}/config/quantity-types/paged`, { params });
  }

  getQuantityTypeConfigById(id: number): Observable<QuantityTypeConfig> {
    return this.http.get<QuantityTypeConfig>(`${environment.apiUrl}/config/quantity-types/${id}`);
  }

  createQuantityTypeConfig(request: Partial<QuantityTypeConfig>): Observable<QuantityTypeConfig> {
    return this.http.post<QuantityTypeConfig>(`${environment.apiUrl}/config/quantity-types`, request);
  }

  updateQuantityTypeConfig(id: number, request: Partial<QuantityTypeConfig>): Observable<QuantityTypeConfig> {
    return this.http.put<QuantityTypeConfig>(`${environment.apiUrl}/config/quantity-types/${id}`, request);
  }

  deleteQuantityTypeConfig(id: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/config/quantity-types/${id}`);
  }

  // ============================================================
  // Audit Trail
  // ============================================================

  getAuditHistory(entityType: string, entityId: number): Observable<AuditHistory> {
    return this.http.get<AuditHistory>(`${environment.apiUrl}/audit/entity/${entityType}/${entityId}`);
  }

  getRecentAuditActivity(limit: number = 50): Observable<AuditEntry[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<AuditEntry[]>(`${environment.apiUrl}/audit/recent`, { params });
  }

  getAuditByUser(username: string, limit: number = 50): Observable<AuditEntry[]> {
    const params = new HttpParams().set('limit', limit.toString());
    return this.http.get<AuditEntry[]>(`${environment.apiUrl}/audit/user/${username}`, { params });
  }

  getAuditByDateRange(startDate: string, endDate: string): Observable<AuditEntry[]> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<AuditEntry[]>(`${environment.apiUrl}/audit/range`, { params });
  }

  getAuditSummary(): Observable<AuditSummary> {
    return this.http.get<AuditSummary>(`${environment.apiUrl}/audit/summary`);
  }

  getAuditEntityTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/audit/entity-types`);
  }

  getAuditActionTypes(): Observable<string[]> {
    return this.http.get<string[]>(`${environment.apiUrl}/audit/action-types`);
  }

  // ============================================================
  // Processes (Design-time definitions - formerly ProcessTemplates)
  // ============================================================

  getProcessesPaged(request: PageRequest = {}): Observable<PagedResponse<any>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<any>>(`${environment.apiUrl}/processes/paged`, { params });
  }

  getProcessDefinitionById(processId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/processes/${processId}`);
  }

  getProcessByCode(processCode: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/processes/code/${processCode}`);
  }

  getProcessesForProduct(productSku: string): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/processes/product/${productSku}`);
  }

  getEffectiveProcess(productSku: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/processes/product/${productSku}/effective`);
  }

  createProcessDefinition(request: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/processes`, request);
  }

  updateProcessDefinition(processId: number, request: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/processes/${processId}`, request);
  }

  deleteProcessDefinition(processId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/processes/${processId}`);
  }

  activateProcess(processId: number, request?: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/processes/${processId}/activate`, request || {});
  }

  deactivateProcess(processId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/processes/${processId}/deactivate`, {});
  }

  createProcessVersion(processId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/processes/${processId}/new-version`, {});
  }

  addRoutingStepToProcess(processId: number, step: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/processes/${processId}/steps`, step);
  }

  updateRoutingStep(stepId: number, step: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/processes/steps/${stepId}`, step);
  }

  deleteRoutingStep(stepId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/processes/steps/${stepId}`);
  }

  // Backward compatibility aliases (deprecated - use new method names)
  /** @deprecated Use getProcessesPaged instead */
  getProcessTemplatesPaged(request: PageRequest = {}): Observable<PagedResponse<any>> {
    return this.getProcessesPaged(request);
  }
  /** @deprecated Use getProcessDefinitionById instead */
  getProcessTemplateById(templateId: number): Observable<any> {
    return this.getProcessDefinitionById(templateId);
  }
  /** @deprecated Use getProcessByCode instead */
  getProcessTemplateByCode(templateCode: string): Observable<any> {
    return this.getProcessByCode(templateCode);
  }
  /** @deprecated Use getProcessesForProduct instead */
  getProcessTemplatesForProduct(productSku: string): Observable<any[]> {
    return this.getProcessesForProduct(productSku);
  }
  /** @deprecated Use getEffectiveProcess instead */
  getEffectiveProcessTemplate(productSku: string): Observable<any> {
    return this.getEffectiveProcess(productSku);
  }
  /** @deprecated Use createProcessDefinition instead */
  createProcessTemplate(request: any): Observable<any> {
    return this.createProcessDefinition(request);
  }
  /** @deprecated Use updateProcessDefinition instead */
  updateProcessTemplate(templateId: number, request: any): Observable<any> {
    return this.updateProcessDefinition(templateId, request);
  }
  /** @deprecated Use deleteProcessDefinition instead */
  deleteProcessTemplate(templateId: number): Observable<void> {
    return this.deleteProcessDefinition(templateId);
  }
  /** @deprecated Use activateProcess instead */
  activateProcessTemplate(templateId: number, request?: any): Observable<any> {
    return this.activateProcess(templateId, request);
  }
  /** @deprecated Use deactivateProcess instead */
  deactivateProcessTemplate(templateId: number): Observable<any> {
    return this.deactivateProcess(templateId);
  }
  /** @deprecated Use createProcessVersion instead */
  createProcessTemplateVersion(templateId: number): Observable<any> {
    return this.createProcessVersion(templateId);
  }
  /** @deprecated Use addRoutingStepToProcess instead */
  addRoutingStepToTemplate(templateId: number, step: any): Observable<any> {
    return this.addRoutingStepToProcess(templateId, step);
  }

  // ============================================================
  // Routing
  // ============================================================

  getAllRoutings(status?: string): Observable<any[]> {
    let params = new HttpParams();
    if (status) {
      params = params.set('status', status);
    }
    return this.http.get<any[]>(`${environment.apiUrl}/routing`, { params });
  }

  getRoutingById(routingId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/routing/${routingId}`);
  }

  getRoutingForProcessInstance(processInstanceId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/routing/process-instance/${processInstanceId}`);
  }

  /** @deprecated Use getRoutingForProcessInstance instead */
  getRoutingForProcess(processId: number): Observable<any> {
    return this.getRoutingForProcessInstance(processId);
  }

  getRoutingSteps(routingId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/routing/${routingId}/steps`);
  }

  getRoutingStatus(routingId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/routing/${routingId}/status`);
  }

  isRoutingLocked(routingId: number): Observable<boolean> {
    return this.http.get<boolean>(`${environment.apiUrl}/routing/${routingId}/locked`);
  }

  isRoutingComplete(routingId: number): Observable<boolean> {
    return this.http.get<boolean>(`${environment.apiUrl}/routing/${routingId}/complete`);
  }

  canOperationProceed(operationId: number): Observable<boolean> {
    return this.http.get<boolean>(`${environment.apiUrl}/routing/operation/${operationId}/can-proceed`);
  }

  createRouting(request: any): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/routing`, request);
  }

  updateRouting(routingId: number, request: any): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/routing/${routingId}`, request);
  }

  deleteRouting(routingId: number): Observable<void> {
    return this.http.delete<void>(`${environment.apiUrl}/routing/${routingId}`);
  }

  activateRouting(routingId: number, deactivateOthers?: boolean): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/routing/${routingId}/activate`, { deactivateOthers });
  }

  deactivateRouting(routingId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/routing/${routingId}/deactivate`, {});
  }

  putRoutingOnHold(routingId: number, reason?: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/routing/${routingId}/hold`, { reason });
  }

  releaseRoutingFromHold(routingId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/routing/${routingId}/release`, {});
  }

  // ============================================================
  // Users (CRUD endpoints)
  // ============================================================

  getUsersPaged(request: PageRequest = {}): Observable<PagedResponse<any>> {
    const params = new HttpParams({ fromObject: toQueryParams(request) as any });
    return this.http.get<PagedResponse<any>>(`${environment.apiUrl}/users/paged`, { params });
  }

  getAllUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users`);
  }

  getActiveUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/active`);
  }

  getUserById(userId: number): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/users/${userId}`);
  }

  createUser(request: { email: string; name: string; password: string; employeeId?: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users`, request);
  }

  updateUser(userId: number, request: { name: string; employeeId?: string; status?: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/users/${userId}`, request);
  }

  deleteUser(userId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${environment.apiUrl}/users/${userId}`);
  }

  changePasswordById(userId: number, request: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/${userId}/change-password`, request);
  }

  // Change password for currently authenticated user
  changePassword(request: { currentPassword: string; newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/me/change-password`, request);
  }

  resetPassword(userId: number, request: { newPassword: string }): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${environment.apiUrl}/users/${userId}/reset-password`, request);
  }

  activateUser(userId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/${userId}/activate`, {});
  }

  deactivateUser(userId: number): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/users/${userId}/deactivate`, {});
  }
}
