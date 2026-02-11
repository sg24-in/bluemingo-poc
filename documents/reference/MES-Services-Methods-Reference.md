# MES Services & Methods Reference

**Generated:** 2026-02-10
**Package:** `com.mes.production.service`
**Source:** `backend/src/main/java/com/mes/production/service/`

---

## Summary Table

| # | Service | Lines | Key Responsibilities | Transaction Default |
|---|---------|-------|---------------------|-------------------|
| 1 | `ProductionService` | 1000+ | Production confirmation, batch generation, operation progression, BOM/param validation orchestration, consumption reversal (R-13) | Method-level `@Transactional` |
| 2 | `OrderService` | 456 | Order CRUD, line item management, paginated queries, order number generation | Class-level `@Transactional(readOnly = true)` |
| 3 | `BatchService` | 1114 | Batch lifecycle, split/merge, approval/rejection, quality, genealogy validation, quantity adjustment | Class-level `@Transactional(readOnly = true)` |
| 4 | `InventoryService` | 510 | Inventory state management (block/unblock/scrap/reserve), CRUD, paginated queries | Class-level `@Transactional(readOnly = true)` |
| 5 | `HoldService` | 340 | Cross-entity hold management, cascading holds, release with status restore | Method-level `@Transactional` |
| 6 | `OperationService` | 280 | Operation status transitions (block/unblock/pause/resume), paginated queries | Class-level `@Transactional(readOnly = true)` |
| 7 | `BomValidationService` | 251 | BOM requirement retrieval, consumption validation, suggested consumption calculation | Method-level `@Transactional(readOnly = true)` |
| 8 | `ReceiveMaterialService` | 202 | Raw material goods receipt (Batch + Inventory + Movement in one transaction) | Method-level `@Transactional` |
| 9 | `OperationInstantiationService` | 259 | Runtime operation creation from routing/process templates | Method-level `@Transactional` |
| 10 | `BatchNumberService` | 516 | Configurable batch number generation (production, split, merge, RM receipt) | Method-level `@Transactional` |
| 11 | `ProcessParameterService` | 192 | Dynamic process parameter validation against min/max config | Method-level `@Transactional(readOnly = true)` |
| 12 | `FieldChangeAuditService` | 230 | Reflection-based field-level change detection and audit logging | None (delegates to AuditService) |
| 13 | `BatchSizeService` | 171 | Multi-batch size calculations, config lookup | None (read-only) |
| 14 | `RoutingService` | 763 | Routing template CRUD, step management, routing lifecycle, lock detection | Method-level `@Transactional` |
| 15 | `AuditService` | 211 | Comprehensive audit trail (create/update/delete/status/consume/produce/hold/release) | `Propagation.REQUIRES_NEW` per method |
| 16 | `InventoryStateValidator` | 273 | Inventory state machine enforcement, hold checks, transition validation | None (stateless validator) |

---

## Table of Contents

- [1. Core Production](#1-core-production)
  - [1.1 ProductionService](#11-productionservice)
  - [1.2 OperationService](#12-operationservice)
  - [1.3 OperationInstantiationService](#13-operationinstantiationservice)
- [2. Order Management](#2-order-management)
  - [2.1 OrderService](#21-orderservice)
- [3. Inventory & Batch](#3-inventory--batch)
  - [3.1 InventoryService](#31-inventoryservice)
  - [3.2 BatchService](#32-batchservice)
  - [3.3 ReceiveMaterialService](#33-receivematerialservice)
  - [3.4 InventoryStateValidator](#34-inventorystatevalidator)
- [4. Holds](#4-holds)
  - [4.1 HoldService](#41-holdservice)
- [5. BOM & Validation](#5-bom--validation)
  - [5.1 BomValidationService](#51-bomvalidationservice)
  - [5.2 ProcessParameterService](#52-processparameterservice)
- [6. Configuration](#6-configuration)
  - [6.1 BatchNumberService](#61-batchnumberservice)
  - [6.2 BatchSizeService](#62-batchsizeservice)
- [7. Routing](#7-routing)
  - [7.1 RoutingService](#71-routingservice)
- [8. Audit](#8-audit)
  - [8.1 AuditService](#81-auditservice)
  - [8.2 FieldChangeAuditService](#82-fieldchangeauditservice)
- [9. Architectural Patterns](#9-architectural-patterns)
- [10. Validation Strategy: Soft vs Hard Enforcement](#10-validation-strategy-soft-vs-hard-enforcement)

---

## 1. Core Production

### 1.1 ProductionService

**Full Class:** `com.mes.production.service.ProductionService`
**File:** `backend/src/main/java/com/mes/production/service/ProductionService.java`
**Lines:** 812
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`
**Transaction Default:** Method-level (no class-level annotation)

#### Dependencies (Injected via Constructor)

| Dependency | Type |
|-----------|------|
| `operationRepository` | `OperationRepository` |
| `processRepository` | `ProcessRepository` |
| `inventoryRepository` | `InventoryRepository` |
| `batchRepository` | `BatchRepository` |
| `batchRelationRepository` | `BatchRelationRepository` |
| `confirmationRepository` | `ProductionConfirmationRepository` |
| `equipmentRepository` | `EquipmentRepository` |
| `operatorRepository` | `OperatorRepository` |
| `holdRecordRepository` | `HoldRecordRepository` |
| `auditService` | `AuditService` |
| `equipmentUsageService` | `EquipmentUsageService` |
| `inventoryMovementService` | `InventoryMovementService` |
| `processParameterService` | `ProcessParameterService` |
| `batchNumberService` | `BatchNumberService` |
| `inventoryStateValidator` | `InventoryStateValidator` |
| `batchSizeService` | `BatchSizeService` |
| `orderRepository` | `OrderRepository` |
| `bomValidationService` | `BomValidationService` |

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `confirmProduction` | `ProductionConfirmationDTO.Response confirmProduction(ProductionConfirmationDTO.Request request)` | `@Transactional` | Core production confirmation orchestrator |
| `getOperationDetails` | `Operation getOperationDetails(Long operationId)` | `@Transactional(readOnly = true)` | Get operation details for confirmation form |
| `rejectConfirmation` | `ProductionConfirmationDTO.StatusUpdateResponse rejectConfirmation(ProductionConfirmationDTO.RejectionRequest request)` | `@Transactional` | Reject a production confirmation |
| `getConfirmationById` | `ProductionConfirmationDTO.Response getConfirmationById(Long confirmationId)` | `@Transactional(readOnly = true)` | Get single confirmation by ID |
| `getConfirmationsByStatus` | `List<ProductionConfirmationDTO.Response> getConfirmationsByStatus(String status)` | `@Transactional(readOnly = true)` | Get confirmations filtered by status |
| `getContinuableOperations` | `List<Map<String, Object>> getContinuableOperations()` | `@Transactional(readOnly = true)` | P13: Get IN_PROGRESS operations with partial progress |
| `canReverseConfirmation` | `Map<String, Object> canReverseConfirmation(Long confirmationId)` | `@Transactional(readOnly = true)` | R-13: Check if confirmation can be reversed (validates status, checks downstream consumption) |
| `reverseConfirmation` | `ProductionConfirmationDTO.ReversalResponse reverseConfirmation(ProductionConfirmationDTO.ReversalRequest request)` | `@Transactional` | R-13: 16-step reversal: validate, find output batches, check downstream, restore inputs, scrap outputs, deactivate relations, revert operation/next operation status, mark REVERSED, audit |

#### Key Business Logic Rules

1. **Operation Status Guard:** Only READY or IN_PROGRESS operations can be confirmed.
2. **Hold Checks:** Active holds on the operation or its parent process block confirmation.
3. **Process Status Guard:** Only ACTIVE processes are allowed for production confirmation.
4. **Process Parameter Validation (GAP-003):** Submitted parameters validated against configured min/max values before confirmation. Errors block; warnings are logged.
5. **Inventory Consumption:** Uses `InventoryStateValidator.validateConsumption()` -- checks AVAILABLE/RESERVED state, hold status, reservation ownership. Consumption quantity cannot exceed available.
6. **BOM Validation (R-02):** Consumed materials validated against BOM requirements. Soft enforcement -- warnings logged via audit but do not block production.
7. **Multi-batch Support (B13):** `BatchSizeService.calculateBatchSizes()` determines if output should be split into multiple batches. Each batch gets a unique number with sequence suffix (e.g., `-01`, `-02`).
8. **Batch Size Validation (R-12):** Produced quantity checked against min/max batch size config. Soft enforcement -- logs warnings only.
9. **Batch Creation:** Output batches created with `QUALITY_PENDING` status per MES Batch Management Specification. Batch numbers generated via `BatchNumberService`.
10. **Partial Confirmation (P10-P11):** If `saveAsPartial=true` or `newConfirmedQty < targetQty`, status is `PARTIALLY_CONFIRMED` and operation stays `IN_PROGRESS`. Otherwise, full confirmation marks operation `CONFIRMED`.
11. **Next Operation Progression:** On full confirmation, finds next operation scoped by `orderLineId` and sets it to READY. If no more operations, checks if all order operations are complete.
12. **Order Auto-Completion (R-08):** When all operations across all line items of an order are CONFIRMED, order status is auto-set to COMPLETED.
13. **Equipment Usage Logging:** Equipment usage events logged for each confirmation.
14. **Inventory Movement Recording:** Consumption and production movements recorded for traceability.
15. **Confirmation-Batch Linkage (R-13):** Output batches are linked to the confirmation via `confirmationId` field for reversal traceability. Uses Jackson ObjectMapper for rmConsumedJson serialization.
16. **Consumption Reversal (R-13):** `canReverseConfirmation()` validates status is CONFIRMED or PARTIALLY_CONFIRMED and checks no downstream consumption of output batches. `reverseConfirmation()` performs a 16-step reversal: validate status, find output batches, check downstream, parse consumed inputs from rmConsumedJson, restore input inventory (CONSUMED->AVAILABLE), record REVERSAL movements, restore input batches, scrap output batches, scrap output inventory, deactivate batch relations (ACTIVE->REVERSED), reduce operation confirmed qty, revert operation status, revert next operation if needed, mark confirmation REVERSED, audit trail.

#### Private/Helper Methods

| Method | Description |
|--------|-------------|
| `generateOutputBatch(Operation, BigDecimal, String)` | Overloaded single-batch convenience method |
| `generateOutputBatch(Operation, BigDecimal, String, int, int)` | Creates output batch with configurable batch number, QUALITY_PENDING status |
| `createOutputInventory(Operation, Batch, BigDecimal, String)` | Creates AVAILABLE inventory record linked to output batch |
| `createBatchRelations(List<MaterialConsumption>, Batch, Long, String)` | Links consumed input batches to output batch via MERGE relations |
| `setNextOperationReady(Operation, String)` | Finds and activates the next operation in sequence |
| `checkAndCompleteOrder(Operation, String)` | R-08: Checks all operations and auto-completes order |
| `getCurrentUser()` | Extracts username from SecurityContext (fallback: "SYSTEM") |
| `validateBatchSizeConfig(BigDecimal, String, String, String, Long)` | R-12: Soft batch size validation with audit logging |
| `toResponse(ProductionConfirmation)` | Maps entity to response DTO |

---

### 1.2 OperationService

**Full Class:** `com.mes.production.service.OperationService`
**File:** `backend/src/main/java/com/mes/production/service/OperationService.java`
**Lines:** 280
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`, `@Transactional(readOnly = true)`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `operationRepository` | `OperationRepository` |
| `auditService` | `AuditService` |

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `getAllOperations` | `List<OperationDTO> getAllOperations()` | Inherited read-only | List all operations |
| `getOperationsPaged` | `PagedResponseDTO<OperationDTO> getOperationsPaged(PageRequestDTO pageRequest)` | Inherited read-only | TASK-P1: Paginated operations with filters (status, type, search) |
| `getOperationById` | `OperationDTO getOperationById(Long operationId)` | Inherited read-only | Get single operation with details (process name, product SKU, order number) |
| `getOperationsByStatus` | `List<OperationDTO> getOperationsByStatus(String status)` | Inherited read-only | Filter operations by status |
| `getBlockedOperations` | `List<OperationDTO> getBlockedOperations()` | Inherited read-only | Get all BLOCKED operations |
| `blockOperation` | `OperationDTO.StatusUpdateResponse blockOperation(Long operationId, String reason)` | `@Transactional` | Block an operation with reason |
| `unblockOperation` | `OperationDTO.StatusUpdateResponse unblockOperation(Long operationId)` | `@Transactional` | Unblock to READY status |
| `pauseOperation` | `OperationDTO.StatusUpdateResponse pauseOperation(Long operationId)` | `@Transactional` | R-11: Pause IN_PROGRESS operation to PAUSED |
| `resumeOperation` | `OperationDTO.StatusUpdateResponse resumeOperation(Long operationId)` | `@Transactional` | R-11: Resume PAUSED operation to IN_PROGRESS |

#### Key Business Logic Rules

1. **Block Guard:** Cannot block CONFIRMED or already BLOCKED operations.
2. **Unblock Guard:** Only BLOCKED operations can be unblocked. Restores to READY.
3. **Pause Guard (R-11):** Only IN_PROGRESS operations can be paused.
4. **Resume Guard (R-11):** Only PAUSED operations can be resumed.
5. **Audit Integration:** All status changes are logged via `AuditService.logStatusChange()`.

---

### 1.3 OperationInstantiationService

**Full Class:** `com.mes.production.service.OperationInstantiationService`
**File:** `backend/src/main/java/com/mes/production/service/OperationInstantiationService.java`
**Lines:** 259
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `processRepository` | `ProcessRepository` |
| `routingRepository` | `RoutingRepository` |
| `routingStepRepository` | `RoutingStepRepository` |
| `operationRepository` | `OperationRepository` |

#### Inner Types

```java
public record InstantiationResult(
    Process process,
    Routing routing,
    List<Operation> operations,
    List<RoutingStep> routingSteps
) {}
```

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `instantiateOperationsForOrder` | `InstantiationResult instantiateOperationsForOrder(OrderLineItem orderLineItem, Long processId, BigDecimal targetQuantity, String createdBy)` | `@Transactional` | Creates runtime operations from process/routing templates |
| `isRoutingLocked` | `boolean isRoutingLocked(Long routingId)` | `@Transactional(readOnly = true)` | Checks if any operations have executed (IN_PROGRESS/CONFIRMED/PARTIALLY_CONFIRMED) |
| `getNextOperationToExecute` | `Optional<Operation> getNextOperationToExecute(Long orderLineId)` | `@Transactional(readOnly = true)` | Returns first READY operation for an order line |
| `progressToNextOperation` | `void progressToNextOperation(Long completedOperationId, String updatedBy)` | `@Transactional` | Sets next NOT_STARTED operation to READY after completion |

#### Key Business Logic Rules

1. **Process Status Guard:** Only ACTIVE processes can be used for instantiation.
2. **Routing Required:** A routing must exist for the process; prefers ACTIVE routing.
3. **Step Filtering:** Only ACTIVE routing steps are instantiated as operations.
4. **First Operation READY:** First created operation is automatically set to READY status.
5. **Template Genealogy:** Operations store `routingStepId` and `operationTemplateId` for traceability back to templates.
6. **Operation Details Source:** Details come from OperationTemplate (if linked to RoutingStep) or RoutingStep legacy fields.

---

## 2. Order Management

### 2.1 OrderService

**Full Class:** `com.mes.production.service.OrderService`
**File:** `backend/src/main/java/com/mes/production/service/OrderService.java`
**Lines:** 456
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`, `@Transactional(readOnly = true)`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `orderRepository` | `OrderRepository` |
| `orderLineItemRepository` | `OrderLineItemRepository` |
| `operationRepository` | `OperationRepository` |
| `auditTrailRepository` | `AuditTrailRepository` |

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `getAvailableOrders` | `List<OrderDTO> getAvailableOrders()` | Inherited read-only | Orders with READY operations for production |
| `getOrderById` | `OrderDTO getOrderById(Long orderId)` | Inherited read-only | Get order with all line items and operations |
| `getActiveOrders` | `List<OrderDTO> getActiveOrders()` | Inherited read-only | All non-cancelled, non-completed orders |
| `getOrdersPaged` | `PagedResponseDTO<OrderDTO> getOrdersPaged(PageRequestDTO pageRequest)` | Inherited read-only | Paginated orders with status/search filters |
| `getActiveOrdersPaged` | `PagedResponseDTO<OrderDTO> getActiveOrdersPaged(PageRequestDTO pageRequest)` | Inherited read-only | Paginated active orders |
| `createOrder` | `OrderDTO createOrder(CreateOrderRequest request)` | `@Transactional` | Create order with line items |
| `updateOrder` | `OrderDTO updateOrder(Long orderId, UpdateOrderRequest request)` | `@Transactional` | Update order basic info |
| `deleteOrder` | `void deleteOrder(Long orderId)` | `@Transactional` | Soft delete (CANCELLED) |
| `addLineItem` | `OrderDTO addLineItem(Long orderId, LineItemRequest request)` | `@Transactional` | Add line item to existing order |
| `updateLineItem` | `OrderDTO updateLineItem(Long orderId, Long lineItemId, LineItemRequest request)` | `@Transactional` | Update line item within order |
| `deleteLineItem` | `OrderDTO deleteLineItem(Long orderId, Long lineItemId)` | `@Transactional` | Delete line item (cannot delete last one) |

#### Key Business Logic Rules

1. **Order Number Generation:** Auto-generated as `ORD-XXXXX` if not provided; uniqueness enforced.
2. **Delete Guard:** Only CREATED orders can be deleted (soft delete to CANCELLED).
3. **Line Item Modification Guard:** Only CREATED status line items can be modified or deleted.
4. **Line Item Ownership:** Validates line item belongs to the specified order before modification.
5. **Last Line Item Protection:** Cannot delete the last line item -- must delete the order instead.
6. **Audit Trail:** All CRUD operations logged via `AuditTrailRepository` directly (not through AuditService).

---

## 3. Inventory & Batch

### 3.1 InventoryService

**Full Class:** `com.mes.production.service.InventoryService`
**File:** `backend/src/main/java/com/mes/production/service/InventoryService.java`
**Lines:** 510
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`, `@Transactional(readOnly = true)`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `inventoryRepository` | `InventoryRepository` |
| `batchRepository` | `BatchRepository` |
| `auditService` | `AuditService` |
| `stateValidator` | `InventoryStateValidator` |

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `getAvailableForConsumption` | `List<InventoryDTO> getAvailableForConsumption()` | Inherited read-only | Available RM and IM inventory for production |
| `getAvailableByMaterialId` | `List<InventoryDTO> getAvailableByMaterialId(String materialId)` | Inherited read-only | Available inventory for a specific material |
| `getAllInventory` | `List<InventoryDTO> getAllInventory()` | Inherited read-only | All inventory records |
| `getInventoryPaged` | `PagedResponseDTO<InventoryDTO> getInventoryPaged(PageRequestDTO pageRequest)` | Inherited read-only | Paginated inventory with state/type/search filters |
| `getInventoryByState` | `List<InventoryDTO> getInventoryByState(String state)` | Inherited read-only | Filter by state |
| `getInventoryByType` | `List<InventoryDTO> getInventoryByType(String type)` | Inherited read-only | Filter by type (RM/IM/FG/WIP) |
| `blockInventory` | `InventoryDTO.StateUpdateResponse blockInventory(Long inventoryId, String reason)` | `@Transactional` | Block inventory with reason |
| `unblockInventory` | `InventoryDTO.StateUpdateResponse unblockInventory(Long inventoryId)` | `@Transactional` | Unblock to AVAILABLE |
| `scrapInventory` | `InventoryDTO.StateUpdateResponse scrapInventory(Long inventoryId, String reason)` | `@Transactional` | Scrap inventory (terminal) |
| `getInventoryById` | `InventoryDTO getInventoryById(Long inventoryId)` | Inherited read-only | Get single inventory record |
| `getBlockedInventory` | `List<InventoryDTO> getBlockedInventory()` | Inherited read-only | All BLOCKED inventory |
| `getScrappedInventory` | `List<InventoryDTO> getScrappedInventory()` | Inherited read-only | All SCRAPPED inventory |
| `getReservedInventory` | `List<InventoryDTO> getReservedInventory()` | Inherited read-only | All RESERVED inventory |
| `reserveInventory` | `InventoryDTO.StateUpdateResponse reserveInventory(Long inventoryId, Long orderId, Long operationId, BigDecimal quantity)` | `@Transactional` | Reserve inventory for order/operation |
| `releaseReservation` | `InventoryDTO.StateUpdateResponse releaseReservation(Long inventoryId)` | `@Transactional` | Release reservation back to AVAILABLE |
| `createInventory` | `InventoryDTO createInventory(InventoryDTO.CreateInventoryRequest request)` | `@Transactional` | Create new inventory record |
| `updateInventory` | `InventoryDTO updateInventory(Long inventoryId, InventoryDTO.UpdateInventoryRequest request)` | `@Transactional` | Update inventory fields |
| `deleteInventory` | `InventoryDTO.StateUpdateResponse deleteInventory(Long inventoryId)` | `@Transactional` | Soft delete (SCRAPPED) |
| `getReservedForOrder` | `List<InventoryDTO> getReservedForOrder(Long orderId)` | Inherited read-only | Inventory reserved for a specific order |

#### Key Business Logic Rules

1. **State Validation Delegation:** All state transitions delegated to `InventoryStateValidator`.
2. **Terminal State Protection:** Cannot update or delete CONSUMED or SCRAPPED inventory.
3. **Reservation Quantity Check:** Reservation quantity cannot exceed available quantity.
4. **Valid States Constant:** `AVAILABLE`, `RESERVED`, `CONSUMED`, `PRODUCED`, `BLOCKED`, `SCRAPPED`, `ON_HOLD`.

---

### 3.2 BatchService

**Full Class:** `com.mes.production.service.BatchService`
**File:** `backend/src/main/java/com/mes/production/service/BatchService.java`
**Lines:** 1114
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`, `@Transactional(readOnly = true)`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `batchRepository` | `BatchRepository` |
| `batchRelationRepository` | `BatchRelationRepository` |
| `adjustmentRepository` | `BatchQuantityAdjustmentRepository` |
| `operationRepository` | `OperationRepository` |
| `routingStepRepository` | `RoutingStepRepository` |
| `auditService` | `AuditService` |
| `batchNumberService` | `BatchNumberService` |

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `getAllBatches` | `List<BatchDTO> getAllBatches()` | Inherited read-only | List all batches |
| `getBatchesPaged` | `PagedResponseDTO<BatchDTO> getBatchesPaged(PageRequestDTO pageRequest)` | Inherited read-only | Paginated batches with status/search filters |
| `getBatchById` | `BatchDTO getBatchById(Long batchId)` | Inherited read-only | Get single batch |
| `getBatchGenealogy` | `BatchDTO.Genealogy getBatchGenealogy(Long batchId)` | Inherited read-only | Full genealogy: parent batches, child batches, production info |
| `getAvailableBatchesByMaterial` | `List<BatchDTO> getAvailableBatchesByMaterial(String materialId)` | Inherited read-only | Available batches for a material |
| `splitBatch` | `BatchDTO.SplitResponse splitBatch(BatchDTO.SplitRequest request, String userId)` | `@Transactional` | Split batch into multiple portions |
| `mergeBatches` | `BatchDTO.MergeResponse mergeBatches(BatchDTO.MergeRequest request, String userId)` | `@Transactional` | Merge 2+ batches into one |
| `getProducedBatches` | `List<BatchDTO> getProducedBatches()` | Inherited read-only | Batches pending quality approval |
| `approveBatch` | `BatchDTO.StatusUpdateResponse approveBatch(Long batchId)` | `@Transactional` | Approve PRODUCED/QUALITY_PENDING batch to AVAILABLE |
| `rejectBatch` | `BatchDTO.StatusUpdateResponse rejectBatch(Long batchId, String reason)` | `@Transactional` | Reject batch to BLOCKED with reason |
| `sendForQualityCheck` | `BatchDTO.StatusUpdateResponse sendForQualityCheck(Long batchId)` | `@Transactional` | Transition PRODUCED to QUALITY_PENDING |
| `getBatchesByStatus` | `List<BatchDTO> getBatchesByStatus(String status)` | Inherited read-only | Filter by status |
| `createBatch` | `BatchDTO createBatch(BatchDTO.CreateBatchRequest request)` | `@Transactional` `@Deprecated` | Direct batch creation (admin only) |
| `updateBatch` | `BatchDTO updateBatch(Long batchId, BatchDTO.UpdateBatchRequest request)` | `@Transactional` | Update metadata only (not quantity) |
| `adjustQuantity` | `BatchDTO.AdjustQuantityResponse adjustQuantity(Long batchId, BatchDTO.AdjustQuantityRequest request)` | `@Transactional` | Quantity change with mandatory reason and audit |
| `getAdjustmentHistory` | `List<BatchDTO.QuantityAdjustmentHistory> getAdjustmentHistory(Long batchId)` | Inherited read-only | Quantity adjustment history for a batch |
| `deleteBatch` | `BatchDTO.StatusUpdateResponse deleteBatch(Long batchId)` | `@Transactional` | Soft delete (SCRAPPED) |
| `validateSplitInvariant` | `BatchDTO.ValidationResult validateSplitInvariant(Long parentBatchId)` | Inherited read-only | B16: Verify sum(children) = consumed from parent |
| `validateMergeInvariant` | `BatchDTO.ValidationResult validateMergeInvariant(Long mergedBatchId)` | Inherited read-only | B17: Verify sum(parents) = merged quantity |
| `canDeleteBatchRelation` | `boolean canDeleteBatchRelation(Long relationId)` | Inherited read-only | B18: Check if relation can be deleted (only non-ACTIVE) |
| `softDeleteBatchRelation` | `void softDeleteBatchRelation(Long relationId, String reason)` | `@Transactional` | B18: Soft delete relation (status=DELETED) |
| `canConsumeBatch` | `boolean canConsumeBatch(Long batchId)` | Inherited read-only | B19: Check AVAILABLE status and no hold |
| `validateBatchForConsumption` | `void validateBatchForConsumption(Long batchId)` | Inherited read-only | B19: Throws if batch cannot be consumed |
| `validateGenealogyIntegrity` | `List<BatchDTO.ValidationResult> validateGenealogyIntegrity(Long batchId)` | Inherited read-only | Validates all split/merge invariants recursively |

#### Key Business Logic Rules

1. **Splittable Statuses:** AVAILABLE, RESERVED, BLOCKED, PRODUCED, QUALITY_PENDING.
2. **Split Validation:** Portions must be positive; total cannot exceed source quantity. Source batch quantity reduced; marked SPLIT if fully consumed.
3. **Merge Validation:** Minimum 2 batches; no duplicates; all must be AVAILABLE; all must have same materialId and unit.
4. **R15 Batch Behavior:** Split/merge checked against routing step `allowsSplit`/`allowsMerge` flags.
5. **Quantity Adjustment:** Direct quantity edits are prohibited. Must use `adjustQuantity()` with mandatory reason. Valid types: CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY, SYSTEM.
6. **Terminal State Protection:** Cannot update/adjust/delete CONSUMED or SCRAPPED batches.
7. **Approval Flow:** PRODUCED/QUALITY_PENDING -> AVAILABLE (approve) or BLOCKED (reject).
8. **Genealogy Immutability (B18):** Active batch relations cannot be hard-deleted; only soft-deleted.
9. **Batch Number Generation:** Uses `BatchNumberService` for all batch number generation (split, merge).

---

### 3.3 ReceiveMaterialService

**Full Class:** `com.mes.production.service.ReceiveMaterialService`
**File:** `backend/src/main/java/com/mes/production/service/ReceiveMaterialService.java`
**Lines:** 202
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `batchRepository` | `BatchRepository` |
| `inventoryRepository` | `InventoryRepository` |
| `movementRepository` | `InventoryMovementRepository` |
| `auditService` | `AuditService` |
| `batchNumberService` | `BatchNumberService` |
| `unitConversionService` | `UnitConversionService` |

#### Constants

- `DEFAULT_WEIGHT_UNIT` = `"KG"`

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `receiveMaterial` | `InventoryDTO.ReceiveMaterialResponse receiveMaterial(InventoryDTO.ReceiveMaterialRequest request)` | `@Transactional` | Raw material goods receipt: creates Batch + Inventory + InventoryMovement |

#### Key Business Logic Rules

1. **Single Transaction:** Batch, Inventory, and InventoryMovement created atomically.
2. **Batch Status:** New batches start as `QUALITY_PENDING` per MES Batch Management Specification.
3. **Batch Number:** Generated via `BatchNumberService.generateRmBatchNumber()` with material ID, date, and optional supplier batch number.
4. **Inventory Type:** Always `RM` (Raw Material) with state `AVAILABLE`.
5. **Unit Normalization:** Validates unit against system configuration; common aliases supported (T/TON/MT -> TONS, KILOGRAM/KILO -> KG, etc.); falls back to KG.
6. **Movement Type:** Creates `PRODUCE` movement type (RECEIVE not yet in DB constraint).
7. **Audit Trail:** Logs batch creation, batch number generation, and inventory creation.

---

### 3.4 InventoryStateValidator

**Full Class:** `com.mes.production.service.InventoryStateValidator`
**File:** `backend/src/main/java/com/mes/production/service/InventoryStateValidator.java`
**Lines:** 273
**Annotations:** `@Service`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `holdRecordRepository` | `HoldRecordRepository` (constructor injected) |

#### State Machine Definition

```
AVAILABLE  -> RESERVED, CONSUMED, BLOCKED, ON_HOLD
RESERVED   -> AVAILABLE, CONSUMED, BLOCKED
PRODUCED   -> AVAILABLE, CONSUMED, BLOCKED
BLOCKED    -> AVAILABLE, SCRAPPED
ON_HOLD    -> AVAILABLE, BLOCKED
CONSUMED   -> (terminal)
SCRAPPED   -> (terminal)
```

#### Constants

- `CONSUMABLE_STATES`: AVAILABLE, RESERVED
- `MODIFIABLE_STATES`: AVAILABLE, RESERVED, PRODUCED, ON_HOLD

#### Public Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `validateTransition` | `void validateTransition(String currentState, String newState)` | Validates state transition is allowed; throws `IllegalStateException` if not |
| `validateConsumption` | `void validateConsumption(Inventory inventory)` | Validates consumption without order context |
| `validateConsumption` | `void validateConsumption(Inventory inventory, Long orderId)` | Validates consumption for specific order (checks reservation ownership, holds on inventory and batch) |
| `validateModification` | `void validateModification(Inventory inventory)` | Validates inventory can be modified (not terminal, no holds) |
| `validateBlock` | `void validateBlock(Inventory inventory)` | Validates block transition is allowed |
| `validateUnblock` | `void validateUnblock(Inventory inventory)` | Validates unblock (must be BLOCKED or ON_HOLD) |
| `validateScrap` | `void validateScrap(Inventory inventory)` | Validates scrap transition is allowed |
| `validateReserve` | `void validateReserve(Inventory inventory)` | Validates reservation (transition + no holds) |
| `validateReleaseReservation` | `void validateReleaseReservation(Inventory inventory)` | Validates release (must be RESERVED) |
| `hasActiveHold` | `boolean hasActiveHold(Inventory inventory)` | Checks HoldRecord table for active INVENTORY hold |
| `hasBatchActiveHold` | `boolean hasBatchActiveHold(Long batchId)` | Checks HoldRecord table for active BATCH hold |
| `isTerminalState` | `boolean isTerminalState(String state)` | Returns true for CONSUMED/SCRAPPED |
| `getAllowedTransitions` | `Set<String> getAllowedTransitions(String currentState)` | Returns set of allowed target states |

#### Key Business Logic Rules

1. **Central Authority:** All inventory state transitions should go through this validator.
2. **Reservation Ownership:** RESERVED inventory can only be consumed by the order it is reserved for.
3. **Cascading Hold Check:** Consumption is blocked if either the inventory or its linked batch has an active hold.
4. **Same-State Transition:** Transitioning to the same state is always allowed (no-op).

---

## 4. Holds

### 4.1 HoldService

**Full Class:** `com.mes.production.service.HoldService`
**File:** `backend/src/main/java/com/mes/production/service/HoldService.java`
**Lines:** 340
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `holdRecordRepository` | `HoldRecordRepository` |
| `operationRepository` | `OperationRepository` |
| `processRepository` | `ProcessRepository` |
| `orderLineItemRepository` | `OrderLineItemRepository` |
| `orderRepository` | `OrderRepository` |
| `inventoryRepository` | `InventoryRepository` |
| `batchRepository` | `BatchRepository` |
| `equipmentRepository` | `EquipmentRepository` |

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `applyHold` | `HoldDTO.HoldResponse applyHold(HoldDTO.ApplyHoldRequest request, String appliedBy)` | `@Transactional` | Apply hold to any entity type |
| `releaseHold` | `HoldDTO.HoldResponse releaseHold(Long holdId, HoldDTO.ReleaseHoldRequest request, String releasedBy)` | `@Transactional` | Release an active hold |
| `getActiveHolds` | `List<HoldDTO.HoldResponse> getActiveHolds()` | `@Transactional(readOnly = true)` | All active holds sorted by date |
| `getHoldsPaged` | `PagedResponseDTO<HoldDTO.HoldResponse> getHoldsPaged(PageRequestDTO pageRequest)` | `@Transactional(readOnly = true)` | Paginated holds with status/type/search filters |
| `getHoldsByEntity` | `List<HoldDTO.HoldResponse> getHoldsByEntity(String entityType, Long entityId)` | `@Transactional(readOnly = true)` | Hold history for specific entity |
| `isEntityOnHold` | `boolean isEntityOnHold(String entityType, Long entityId)` | `@Transactional(readOnly = true)` | Check if entity has active hold |
| `getActiveHoldCount` | `Long getActiveHoldCount()` | `@Transactional(readOnly = true)` | Count of active holds |

#### Supported Entity Types

`OPERATION`, `PROCESS`, `ORDER`, `ORDER_LINE`, `INVENTORY`, `BATCH`, `EQUIPMENT`

#### Key Business Logic Rules

1. **Duplicate Prevention:** Cannot apply hold to entity already on hold.
2. **Previous Status Storage:** Current entity status is saved in hold record for restoration on release.
3. **Process Hold Exception:** Process is design-time only; holds are recorded but Process status is not changed.
4. **Order Hold Cascading (R-09):** When an order is put on hold, all READY/IN_PROGRESS operations are cascaded to ON_HOLD. When released, ON_HOLD operations restored to READY.
5. **Release Status Restoration:** Each entity type has a default restore status (OPERATION -> READY, INVENTORY -> AVAILABLE, etc.).
6. **Duration Calculation:** Hold response includes duration in minutes (from appliedOn to releasedOn or now).

---

## 5. BOM & Validation

### 5.1 BomValidationService

**Full Class:** `com.mes.production.service.BomValidationService`
**File:** `backend/src/main/java/com/mes/production/service/BomValidationService.java`
**Lines:** 251
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `bomRepository` | `BomRepository` |
| `operationRepository` | `OperationRepository` |
| `inventoryRepository` | `InventoryRepository` |

#### Constants

- `VARIANCE_WARNING_THRESHOLD` = `5.0` (percent)

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `getBomRequirements` | `BomDTO.BomTreeResponse getBomRequirements(String productSku)` | `@Transactional(readOnly = true)` | Full BOM requirement list with levels for a product |
| `getBomRequirementsForLevel` | `List<BomDTO.BomRequirement> getBomRequirementsForLevel(String productSku, Integer level)` | `@Transactional(readOnly = true)` | BOM requirements for specific sequence level |
| `validateConsumption` | `BomDTO.BomValidationResult validateConsumption(BomDTO.BomValidationRequest request)` | `@Transactional(readOnly = true)` | Validate consumed materials against BOM requirements |
| `getSuggestedConsumption` | `BomDTO.SuggestedConsumptionResponse getSuggestedConsumption(Long operationId)` | `@Transactional(readOnly = true)` | Pre-populate material suggestions based on BOM and available inventory |

#### Key Business Logic Rules

1. **Yield Loss Ratio:** Required quantity = `bomQty * targetQty * yieldLossRatio`. If no yield ratio, defaults to 1.0.
2. **Variance Check:** Consumption variance > 5% triggers a warning.
3. **Insufficiency Detection:** If actual < required for any material, validation result is `valid=false`.
4. **No BOM Graceful Handling:** If no BOM exists for a product, returns valid with a warning.
5. **Suggested Consumption (GAP-004):** Calculates per-material required quantities, finds available inventory, and suggests FIFO consumption amounts. Reports stock sufficiency.
6. **Level-Based Lookup:** First tries BOM entries matching operation's sequence number; falls back to all active BOM entries.

---

### 5.2 ProcessParameterService

**Full Class:** `com.mes.production.service.ProcessParameterService`
**File:** `backend/src/main/java/com/mes/production/service/ProcessParameterService.java`
**Lines:** 192
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `jdbcTemplate` | `JdbcTemplate` |

#### Inner Types

```java
public static class ValidationResult {
    boolean valid;
    List<String> errors;
    List<String> warnings;
    // Methods: isValid(), getErrors(), getWarnings(), addError(String), addWarning(String)
}
```

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `getConfiguredParameters` | `List<Map<String, Object>> getConfiguredParameters(String operationType, String productSku)` | `@Transactional(readOnly = true)` | Get parameter configs for operation/product sorted by display_order |
| `validateParameters` | `ValidationResult validateParameters(String operationType, String productSku, Map<String, Object> submittedParams)` | `@Transactional(readOnly = true)` | Validate submitted parameters against min/max config |

#### Key Business Logic Rules

1. **Required Parameter Check:** If no parameters submitted, checks if any configured parameters are required.
2. **Numeric Validation:** Parameters parsed as BigDecimal; non-numeric values generate errors.
3. **Min/Max Enforcement:** Values below min or above max generate hard errors.
4. **Proximity Warning:** Values within 10% of min or max limits generate warnings.
5. **Unexpected Parameter Warning:** Parameters not in config generate warnings (not errors).
6. **Product-Specific Config:** Queries by `operation_type = ? AND (product_sku = ? OR product_sku IS NULL)`.

---

## 6. Configuration

### 6.1 BatchNumberService

**Full Class:** `com.mes.production.service.BatchNumberService`
**File:** `backend/src/main/java/com/mes/production/service/BatchNumberService.java`
**Lines:** 516
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `jdbcTemplate` | `JdbcTemplate` |

#### Inner Types

```java
public static class BatchNumberConfig {
    Long configId, String configName, String prefix, boolean includeOperationCode,
    int operationCodeLength, String separator, String dateFormat, boolean includeDate,
    int sequenceLength, String sequenceReset
}
```

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `generateBatchNumber` | `String generateBatchNumber(String operationType, String productSku)` | `@Transactional` | Generate batch number for production output |
| `generateSplitBatchNumber` | `String generateSplitBatchNumber(String sourceBatchNumber, int splitIndex)` | `@Transactional` | Generate batch number for split operations |
| `generateMergeBatchNumber` | `String generateMergeBatchNumber()` | `@Transactional` | Generate batch number for merge operations |
| `generateRmBatchNumber` | `String generateRmBatchNumber(String materialId, LocalDate receivedDate, String supplierBatchNumber)` | `@Transactional` | Generate batch number for raw material receipt |
| `getAllConfigurations` | `List<Map<String, Object>> getAllConfigurations()` | `@Transactional(readOnly = true)` | List all active batch number configurations |
| `previewBatchNumber` | `String previewBatchNumber(String operationType, String productSku)` | `@Transactional(readOnly = true)` | P07: Preview next batch number without incrementing sequence |

#### Key Business Logic Rules

1. **Batch Number Format:** `{prefix}{separator}{operation_code}{separator}{date}{separator}{sequence}`
2. **Configuration Precedence:** (1) operation_type + material_id + product_sku, (2) operation_type + material_id, (3) operation_type + product_sku, (4) operation_type only, (5) default (null operation_type).
3. **Sequence Management:** Sequences stored in `batch_number_sequence` table with `FOR UPDATE` locking for concurrency.
4. **Sequence Reset Policies:** `DAILY`, `MONTHLY`, `YEARLY`, `NEVER`.
5. **Fallback Pattern:** `BATCH-{operationType[:2]}-{yyyyMMdd}-{millis%10000}` when no config found.
6. **Split Fallback:** `{sourceBatchNumber}-S{XX}` format.
7. **Merge Fallback:** `MRG-{yyyyMMddHHmmssSSS}` format.
8. **RM Receipt:** Includes sanitized supplier batch number (max 15 chars, alphanumeric only).
9. **Preview (P07):** Reads current sequence without incrementing using `peekNextSequence()`.

---

### 6.2 BatchSizeService

**Full Class:** `com.mes.production.service.BatchSizeService`
**File:** `backend/src/main/java/com/mes/production/service/BatchSizeService.java`
**Lines:** 171
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `configRepository` | `BatchSizeConfigRepository` |

#### Inner Types

```java
public record BatchSizeResult(
    List<BigDecimal> batchSizes,
    int batchCount,
    BigDecimal totalQuantity,
    boolean hasPartialBatch,
    BatchSizeConfig configUsed
) {}
```

#### Public Methods

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `calculateBatchSizes` | `BatchSizeResult calculateBatchSizes(BigDecimal totalQuantity, String operationType, String materialId, String productSku, String equipmentType)` | None | Calculate how to split production quantity into batches |
| `findApplicableConfig` | `Optional<BatchSizeConfig> findApplicableConfig(String operationType, String materialId, String productSku, String equipmentType)` | None | Find most specific batch size configuration |
| `getAllActiveConfigs` | `List<BatchSizeConfig> getAllActiveConfigs()` | None | List all active configurations |

#### Key Business Logic Rules

1. **No Config = Single Batch:** If no configuration found, entire quantity becomes one batch.
2. **Within Max = Single Batch:** If total quantity <= maxBatchSize, single batch.
3. **Multi-batch Split:** Creates full batches at preferredSize, then handles remainder.
4. **Remainder Handling:** (a) If remainder >= minBatchSize and partials allowed, create partial batch. (b) If remainder < minBatchSize, add to last batch (if within max). (c) Otherwise, create partial batch anyway.
5. **Config Priority:** Repository returns configs ordered by specificity (product + material + operation + equipment most specific).

---

## 7. Routing

### 7.1 RoutingService

**Full Class:** `com.mes.production.service.RoutingService`
**File:** `backend/src/main/java/com/mes/production/service/RoutingService.java`
**Lines:** 763
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `routingRepository` | `RoutingRepository` |
| `routingStepRepository` | `RoutingStepRepository` |
| `processRepository` | `ProcessRepository` |
| `operationRepository` | `OperationRepository` |
| `operationTemplateRepository` | `OperationTemplateRepository` |

#### Public Methods -- Routing Queries

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `getRoutingWithSteps` | `Optional<Routing> getRoutingWithSteps(Long routingId)` | `@Transactional(readOnly = true)` | Get routing by ID with all steps |
| `getActiveRoutingForProcess` | `Optional<Routing> getActiveRoutingForProcess(Long processId)` | `@Transactional(readOnly = true)` | Get active routing for process (runtime) |
| `getActiveRoutingForTemplate` | `Optional<Routing> getActiveRoutingForTemplate(Long processId)` | `@Transactional(readOnly = true)` | Get active routing for process (design-time) |
| `getRoutingStepsInOrder` | `List<RoutingStep> getRoutingStepsInOrder(Long routingId)` | `@Transactional(readOnly = true)` | Steps sorted by sequence number |
| `getNextSteps` | `List<RoutingStep> getNextSteps(Long routingId, Integer currentSequence)` | `@Transactional(readOnly = true)` | Steps after current sequence |
| `getParallelSteps` | `List<RoutingStep> getParallelSteps(Long routingId, Integer sequenceNumber)` | `@Transactional(readOnly = true)` | Steps at same level |
| `getAllRoutings` | `List<Routing> getAllRoutings()` | `@Transactional(readOnly = true)` | All routings |
| `getRoutingsByStatus` | `List<Routing> getRoutingsByStatus(String status)` | `@Transactional(readOnly = true)` | Filter by status |
| `getRoutingsPaged` | `PagedResponseDTO<RoutingDTO.RoutingInfo> getRoutingsPaged(PageRequestDTO pageRequest)` | `@Transactional(readOnly = true)` | TASK-P2: Paginated routings |

#### Public Methods -- Routing Lifecycle

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `isRoutingComplete` | `boolean isRoutingComplete(Long routingId)` | `@Transactional(readOnly = true)` | Template-level check: has active steps and routing is ACTIVE |
| `isRoutingCompleteForOrderLine` | `boolean isRoutingCompleteForOrderLine(Long orderLineId)` | `@Transactional(readOnly = true)` | Runtime check: all Operations CONFIRMED |
| `getNextOperationToReady` | `Optional<Operation> getNextOperationToReady(Long orderLineId)` | `@Transactional(readOnly = true)` | First NOT_STARTED operation for order line |
| `getStepForOperation` | `Optional<RoutingStep> getStepForOperation(Long operationId)` | `@Transactional(readOnly = true)` | Get template step linked to runtime operation |
| `canOperationProceed` | `boolean canOperationProceed(Long operationId)` | `@Transactional(readOnly = true)` | Check operation can proceed based on routing rules |
| `isRoutingLocked` | `boolean isRoutingLocked(Long routingId)` | `@Transactional(readOnly = true)` | Check if any operations have been executed |
| `getRoutingStatus` | `RoutingDTO.RoutingStatus getRoutingStatus(Long routingId)` | `@Transactional(readOnly = true)` | Status summary with step counts and lock state |

#### Public Methods -- Routing CRUD

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `createRouting` | `Routing createRouting(RoutingDTO.CreateRoutingRequest request, String createdBy)` | `@Transactional` | Create new routing for a process |
| `updateRouting` | `Routing updateRouting(Long routingId, RoutingDTO.UpdateRoutingRequest request, String updatedBy)` | `@Transactional` | Update routing name/type (not if locked) |
| `activateRouting` | `Routing activateRouting(Long routingId, boolean deactivateOthers, String activatedBy)` | `@Transactional` | Activate routing, optionally deactivate others |
| `deactivateRouting` | `Routing deactivateRouting(Long routingId, String deactivatedBy)` | `@Transactional` | Deactivate an active routing |
| `deleteRouting` | `void deleteRouting(Long routingId)` | `@Transactional` | Delete DRAFT/INACTIVE routing (not if locked) |
| `putRoutingOnHold` | `Routing putRoutingOnHold(Long routingId, String reason, String heldBy)` | `@Transactional` | Set routing status to ON_HOLD |
| `releaseRoutingFromHold` | `Routing releaseRoutingFromHold(Long routingId, String releasedBy)` | `@Transactional` | Release from ON_HOLD to ACTIVE |

#### Public Methods -- Routing Step CRUD

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `createRoutingStep` | `RoutingStep createRoutingStep(Long routingId, RoutingDTO.CreateRoutingStepRequest request, String createdBy)` | `@Transactional` | Create step (from template or manual fields) |
| `updateRoutingStep` | `RoutingStep updateRoutingStep(Long stepId, RoutingDTO.UpdateRoutingStepRequest request, String updatedBy)` | `@Transactional` | Update step fields (template or overrides) |
| `deleteRoutingStep` | `void deleteRoutingStep(Long stepId)` | `@Transactional` | Delete non-mandatory step (not if locked) |
| `reorderSteps` | `List<RoutingStep> reorderSteps(Long routingId, List<Long> stepIds, String updatedBy)` | `@Transactional` | Reorder step sequence numbers |

#### Key Business Logic Rules

1. **Template vs Runtime:** Routing/RoutingStep are TEMPLATE entities; Operations are RUNTIME. Completion is checked via Operations.
2. **Lock Guard:** All modifications (update, delete, add/remove steps, reorder) are blocked if routing is locked (has executed operations).
3. **Single Active Routing:** When activating, can deactivate other routings for the same process.
4. **Delete Guard:** Cannot delete ACTIVE routings. Must deactivate first.
5. **OperationTemplate Support:** Steps can reference OperationTemplate; step fields override template values.
6. **Mandatory Step Protection:** Cannot delete mandatory routing steps.
7. **Sequential vs Parallel:** `canOperationProceed()` checks previous operations are CONFIRMED for sequential routing; parallel routing always allows READY operations.
8. **Step Validation:** Sequence number must be positive; without a template, operationName and operationType are required.

---

## 8. Audit

### 8.1 AuditService

**Full Class:** `com.mes.production.service.AuditService`
**File:** `backend/src/main/java/com/mes/production/service/AuditService.java`
**Lines:** 211
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `auditTrailRepository` | `AuditTrailRepository` |

#### Public Methods -- Write Operations

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `logCreate` | `void logCreate(String entityType, Long entityId, String newValue)` | `REQUIRES_NEW` | Log entity creation |
| `logUpdate` | `void logUpdate(String entityType, Long entityId, String fieldName, String oldValue, String newValue)` | `REQUIRES_NEW` | Log field-level update |
| `logStatusChange` | `void logStatusChange(String entityType, Long entityId, String oldStatus, String newStatus)` | `REQUIRES_NEW` | Log status transition |
| `logConsume` | `void logConsume(String entityType, Long entityId, String details)` | `REQUIRES_NEW` | Log inventory consumption |
| `logProduce` | `void logProduce(String entityType, Long entityId, String details)` | `REQUIRES_NEW` | Log production output |
| `logHold` | `void logHold(String entityType, Long entityId, String reason)` | `REQUIRES_NEW` | Log hold action |
| `logRelease` | `void logRelease(String entityType, Long entityId, String details)` | `REQUIRES_NEW` | Log release action |
| `logDelete` | `void logDelete(String entityType, Long entityId, String entityName)` | `REQUIRES_NEW` | Log soft delete |
| `logBatchNumberGenerated` | `void logBatchNumberGenerated(Long batchId, String batchNumber, Long operationId, String configName, String generationMethod)` | `REQUIRES_NEW` | Log batch number generation per MES Batch Number Spec |
| `createAuditEntry` | `void createAuditEntry(String entityType, Long entityId, String fieldName, String oldValue, String newValue, String action)` | `REQUIRES_NEW` | Generic audit entry creation |

#### Public Methods -- Read Operations

| Method | Signature | Transaction | Description |
|--------|-----------|-------------|-------------|
| `getEntityHistory` | `List<AuditTrail> getEntityHistory(String entityType, Long entityId)` | `readOnly = true` | Audit history for specific entity |
| `getRecentActivity` | `List<AuditTrail> getRecentActivity(int limit)` | `readOnly = true` | Most recent audit entries |
| `getRecentProductionConfirmations` | `List<AuditTrail> getRecentProductionConfirmations(int limit)` | `readOnly = true` | Recent production confirmations for dashboard |
| `getActivityByUser` | `List<AuditTrail> getActivityByUser(String username, int limit)` | `readOnly = true` | Activity by specific user |
| `getActivityByDateRange` | `List<AuditTrail> getActivityByDateRange(LocalDateTime startDate, LocalDateTime endDate)` | `readOnly = true` | Activity within date range |
| `countTodaysActivity` | `long countTodaysActivity()` | `readOnly = true` | Count of today's audit entries |
| `getPagedAudit` | `Page<AuditTrail> getPagedAudit(int page, int size, String entityType, String action, String search)` | `readOnly = true` | Paginated audit with filters (max page size: 100) |

#### Key Business Logic Rules

1. **Propagation.REQUIRES_NEW:** All write methods run in a separate transaction so audit entries persist even if the calling transaction rolls back.
2. **Error Swallowing:** Audit entry creation failures are caught and logged (never propagated). Ensures audit failures do not disrupt business operations.
3. **User Resolution:** Extracts current user from `SecurityContextHolder`; falls back to "SYSTEM".
4. **Batch Number Audit:** Dedicated method for MES Batch Number Specification compliance with config context and generation method tracking.

---

### 8.2 FieldChangeAuditService

**Full Class:** `com.mes.production.service.FieldChangeAuditService`
**File:** `backend/src/main/java/com/mes/production/service/FieldChangeAuditService.java`
**Lines:** 230
**Annotations:** `@Service`, `@RequiredArgsConstructor`, `@Slf4j`

#### Dependencies

| Dependency | Type |
|-----------|------|
| `auditService` | `AuditService` |

#### Inner Types

```java
public record FieldChange(String fieldName, String oldValue, String newValue) {}
```

#### Constants

- `EXCLUDED_FIELDS`: `updatedOn`, `updatedBy`, `createdOn`, `createdBy`, `hibernateLazyInitializer`, `handler`, `serialVersionUID`

#### Public Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `auditFieldChanges` | `void auditFieldChanges(String entityType, Long entityId, Object oldEntity, Object newEntity, Set<String> fields)` | Compare two objects and log all field changes |
| `detectFieldChanges` | `List<FieldChange> detectFieldChanges(Object oldEntity, Object newEntity, Set<String> fieldsToTrack)` | Compare objects and return change list (no logging) |
| `auditProductionConfirmationChanges` | `void auditProductionConfirmationChanges(Long confirmationId, Object oldConfirmation, Object newConfirmation)` | Audit: producedQty, scrapQty, startTime, endTime, delayMinutes, delayReason, notes, status |
| `auditInventoryChanges` | `void auditInventoryChanges(Long inventoryId, Object oldInventory, Object newInventory)` | Audit: quantity, state, location, blockReason |
| `auditBatchChanges` | `void auditBatchChanges(Long batchId, Object oldBatch, Object newBatch)` | Audit: quantity, status |
| `auditOperationChanges` | `void auditOperationChanges(Long operationId, Object oldOperation, Object newOperation)` | Audit: status, targetQty, confirmedQty |
| `logFieldChange` | `void logFieldChange(String entityType, Long entityId, String fieldName, Object oldValue, Object newValue)` | Log a single field change directly |

#### Key Business Logic Rules

1. **Reflection-Based Detection:** Uses `java.lang.reflect.Field` to iterate all fields (including inherited) and detect changes.
2. **BigDecimal Scale-Insensitive:** Uses `compareTo()` instead of `equals()` for BigDecimal comparison.
3. **Collection Formatting:** Collections are formatted as `Collection[N items]` rather than full content.
4. **Field Filtering:** Can track all fields (pass `null`) or specific fields only.
5. **Domain-Specific Methods:** Pre-configured methods for each entity type with relevant field sets.

---

## 9. Architectural Patterns

### 9.1 Dependency Injection

All 16 services use **constructor injection** via Lombok's `@RequiredArgsConstructor`. Dependencies are declared as `private final` fields. The single exception is `InventoryStateValidator` which uses explicit constructor injection (no Lombok).

### 9.2 Transaction Management

| Pattern | Services |
|---------|----------|
| **Class-level `@Transactional(readOnly = true)`** with method overrides | `OrderService`, `BatchService`, `InventoryService`, `OperationService` |
| **Method-level `@Transactional`** only | `ProductionService`, `HoldService`, `RoutingService`, `OperationInstantiationService`, `ReceiveMaterialService`, `BatchNumberService` |
| **`Propagation.REQUIRES_NEW`** (isolated) | `AuditService` (all write methods) |
| **No transaction annotations** (stateless) | `FieldChangeAuditService`, `BatchSizeService`, `InventoryStateValidator`, `ProcessParameterService` |

### 9.3 User Resolution Pattern

All services that need the current user follow the same pattern:

```java
private String getCurrentUser() {
    try {
        return SecurityContextHolder.getContext().getAuthentication().getName();
    } catch (Exception e) {
        return "SYSTEM";
    }
}
```

### 9.4 DTO Conversion Pattern

Services maintain entity-to-DTO conversion as private methods (`convertToDTO`, `convertToResponse`, `toResponse`). DTOs are never exposed below the service layer. Controllers receive and return DTOs only.

### 9.5 Audit Integration Pattern

Services integrate with audit in three ways:
1. **Direct AuditService calls:** Most services call `auditService.logCreate/logUpdate/logStatusChange` for significant actions.
2. **FieldChangeAuditService:** For entity-level field change tracking (reflection-based).
3. **Direct AuditTrailRepository:** `OrderService` writes audit entries directly without using `AuditService`.

### 9.6 Repository Access Pattern

Services use Spring Data JPA repositories with custom query methods:
- `findByFilters()` -- JPQL queries for paginated + filtered queries
- `findByStatus()` / `findByState()` -- Simple status filters
- `findByIdWithDetails()` -- Eager fetch joins for related entities
- Some services (`BatchNumberService`, `ProcessParameterService`) use `JdbcTemplate` directly for config table access.

### 9.7 Error Handling Pattern

All services throw `RuntimeException` (or `IllegalArgumentException` / `IllegalStateException`) for business rule violations. These are caught by the global exception handler in the controller layer. There is no custom exception hierarchy.

### 9.8 Soft Delete Pattern

No entities use hard deletes. Terminal states serve as soft deletes:
- **Order:** `CANCELLED`
- **Batch:** `SCRAPPED`
- **Inventory:** `SCRAPPED`
- **BatchRelation:** status = `DELETED`
- **Routing:** Only DRAFT/INACTIVE can be deleted; steps cascade.

---

## 10. Validation Strategy: Soft vs Hard Enforcement

The MES POC uses a deliberate strategy of **soft enforcement** for certain validations and **hard enforcement** for others.

### Hard Enforcement (Blocks Operation)

| Rule | Service | Behavior |
|------|---------|----------|
| Operation must be READY/IN_PROGRESS | `ProductionService` | Throws `RuntimeException` |
| Operation/process cannot be on hold | `ProductionService` | Throws `RuntimeException` |
| Process must be ACTIVE | `ProductionService`, `OperationInstantiationService` | Throws `RuntimeException` / `IllegalStateException` |
| Consumption qty cannot exceed available | `ProductionService` | Throws `RuntimeException` |
| Inventory state machine violations | `InventoryStateValidator` | Throws `IllegalStateException` |
| Process parameter min/max violations | `ProcessParameterService` | Returns errors in `ValidationResult` -> `ProductionService` throws |
| Required parameters missing | `ProcessParameterService` | Returns errors -> blocks confirmation |
| Batch terminal state modifications | `BatchService` | Throws `RuntimeException` |
| Order delete guard (only CREATED) | `OrderService` | Throws `RuntimeException` |
| Routing lock guard | `RoutingService` | Throws `IllegalStateException` |
| Split/merge validation | `BatchService` | Throws `RuntimeException` |
| Reversal status guard (R-13) | `ProductionService` | Only CONFIRMED/PARTIALLY_CONFIRMED can be reversed; throws if downstream consumed |
| Reversal downstream check (R-13) | `ProductionService` | Output batches must not have been consumed downstream; throws `RuntimeException` |

### Soft Enforcement (Logs Warning, Continues)

| Rule | Service | Behavior |
|------|---------|----------|
| BOM consumption validation (R-02) | `ProductionService` | Logs warning, creates audit entry, continues |
| Batch size validation (R-12) | `ProductionService` | Logs warning, creates audit entry, continues |
| Process parameter proximity warnings | `ProcessParameterService` | Adds to `warnings` list (not errors) |
| BOM variance > 5% | `BomValidationService` | Reports as warning status |
| Unexpected parameters | `ProcessParameterService` | Adds to warnings list |

### Design Rationale

Soft enforcement is used for the POC to:
1. Allow production to continue even with minor deviations.
2. Capture data for future analysis of compliance rates.
3. Avoid blocking shop floor operations for non-critical issues.
4. Build an audit trail that enables future enforcement decisions.

Hard enforcement is reserved for:
1. State machine integrity (must never be violated).
2. Security boundaries (hold blocks, status guards).
3. Data integrity constraints (quantity limits, uniqueness).
4. Template immutability after execution begins.
