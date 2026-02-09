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
  // Master Data (read-only for POC - CRUD removed)
  Customer,
  Material,
  Product,
  // Config (basic lookups only - CRUD removed for POC)
  HoldReason,
  DelayReason
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

  getBatchesByStatus(status: string): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${environment.apiUrl}/batches/status/${status}`);
  }

  getProducedBatches(): Observable<Batch[]> {
    return this.http.get<Batch[]>(`${environment.apiUrl}/batches/produced`);
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
  // Master Data Lookups (continued)
  // ============================================================

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

  // TASK-P3: Paginated BOM products with search
  getBomProductsPaged(request: PageRequest): Observable<PagedResponse<BomProductSummary>> {
    const params: Record<string, string | number> = {
      page: request.page ?? 0,
      size: request.size ?? 20
    };
    if (request.sortBy) params['sortBy'] = request.sortBy;
    if (request.sortDirection) params['sortDirection'] = request.sortDirection;
    if (request.search) params['search'] = request.search;

    return this.http.get<PagedResponse<BomProductSummary>>(`${environment.apiUrl}/bom/products/paged`, { params });
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
  // Processes (Read-only lookups for POC)
  // ============================================================

  getAllProcesses(): Observable<Process[]> {
    return this.http.get<Process[]>(`${environment.apiUrl}/processes`);
  }

  getActiveProcesses(): Observable<Process[]> {
    return this.http.get<Process[]>(`${environment.apiUrl}/processes/active`);
  }

  // ============================================================
  // Operations
  // ============================================================

  getAllOperations(): Observable<Operation[]> {
    return this.http.get<Operation[]>(`${environment.apiUrl}/operations`);
  }

  // TASK-P1: Paginated operations with filters
  getOperationsPaged(request: PageRequest): Observable<PagedResponse<Operation>> {
    const params: Record<string, string | number> = {
      page: request.page ?? 0,
      size: request.size ?? 20
    };
    if (request.sortBy) params['sortBy'] = request.sortBy;
    if (request.sortDirection) params['sortDirection'] = request.sortDirection;
    if (request.status) params['status'] = request.status;
    if (request.type) params['type'] = request.type;
    if (request.search) params['search'] = request.search;

    return this.http.get<PagedResponse<Operation>>(`${environment.apiUrl}/operations/paged`, { params });
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
  // Master Data Lookups (POC: Read-only for dropdowns)
  // ============================================================

  getActiveCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(`${environment.apiUrl}/customers/active`);
  }

  getActiveMaterials(): Observable<Material[]> {
    return this.http.get<Material[]>(`${environment.apiUrl}/materials/active`);
  }

  getActiveProducts(): Observable<Product[]> {
    return this.http.get<Product[]>(`${environment.apiUrl}/products/active`);
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

}
