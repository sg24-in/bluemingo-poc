# MES Validation Rules Reference

**Generated:** February 2026
**Source:** Service Layer Analysis

---

## Overview

This document contains all validation rules extracted from the MES service layer, organized by domain.

---

## Production Confirmation Validations

### ProductionService

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Operation status must be READY or IN_PROGRESS | "Operation is not in READY or IN_PROGRESS status" | ProductionService:59-60 |
| No active hold on operation | "Operation is on hold and cannot be confirmed" | ProductionService:64-67 |
| No active hold on process | "Process is on hold and cannot be confirmed" | ProductionService:69-72 |
| Process must be ACTIVE | "Cannot confirm production: Process {id} status is {status}, must be ACTIVE" | ProductionService:74-79 |
| Consumption quantity ≤ available | "Consumption quantity exceeds available quantity for inventory: {id}" | ProductionService:122 |

### ProcessParameterService

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Required parameters provided | "Required parameter '{name}' is missing" | ProcessParameterService:136 |
| Value must be valid number | "Parameter '{name}' must be a valid number" | ProcessParameterService:151 |
| Value ≥ minimum | "Parameter '{name}' value {value} is below minimum {min}{unit}" | ProcessParameterService:156-159 |
| Value ≤ maximum | "Parameter '{name}' value {value} exceeds maximum {max}{unit}" | ProcessParameterService:162-165 |
| Warning: Within 10% of min | (Warning only, allows continuation) | ProcessParameterService:168-172 |
| Warning: Within 10% of max | (Warning only, allows continuation) | ProcessParameterService:173-177 |
| Unexpected parameters | "Unexpected parameter '{name}' will be ignored" (Warning) | ProcessParameterService:183 |

---

## Batch Validations

### BatchService - Split Operations

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Valid status for split | "Batch with status {status} cannot be split. Only batches with status AVAILABLE, RESERVED, BLOCKED, PRODUCED, or QUALITY_PENDING can be split." | BatchService:272-276 |
| Routing step allows split | "Split not allowed for batch {number}: routing step {name} has allowsSplit=false" | BatchService:223-226 |
| At least 1 portion | "At least one portion is required for splitting" | BatchService:282-284 |
| All portions positive | "All split portions must have a positive quantity" | BatchService:286-292 |
| Total ≤ source quantity | "Split quantities exceed available quantity" | BatchService:294-302 |

### BatchService - Merge Operations

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Minimum 2 batches | "At least 2 batches are required for merging" | BatchService:386-388 |
| No duplicate IDs | "Duplicate batch IDs are not allowed in merge request" | BatchService:390-394 |
| All batches AVAILABLE | "Only AVAILABLE batches can be merged. Batch {number} has status: {status}" | BatchService:403-408 |
| Same material ID | "All batches must have the same material ID for merging" | BatchService:410-414 |
| Same unit | "All batches must have the same unit for merging. Expected: {unit}, found: {unit}" | BatchService:416-422 |
| Routing step allows merge | "Merge not allowed for batch {number}: routing step {name} has allowsMerge=false" | BatchService:253-256 |

### BatchService - Quality Approval

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Approve: PRODUCED or QUALITY_PENDING | "Only PRODUCED or QUALITY_PENDING batches can be approved. Current status: {status}" | BatchService:516-518 |
| Reject: PRODUCED or QUALITY_PENDING | "Only PRODUCED or QUALITY_PENDING batches can be rejected. Current status: {status}" | BatchService:554-556 |
| Quality check: Only PRODUCED | "Only PRODUCED batches can be sent for quality check. Current status: {status}" | BatchService:593-595 |

### BatchService - Quantity Adjustment

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Reason required | "A reason is required for quantity adjustments" | BatchService:745 |
| Not consumed | "Cannot adjust quantity of consumed batch" | BatchService:750-752 |
| Not scrapped | "Cannot adjust quantity of scrapped batch" | BatchService:753-755 |
| Valid adjustment type | "Invalid adjustment type: {type}. Valid types: CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY, SYSTEM" | BatchService:758-761 |
| Non-negative quantity | "New quantity must be non-negative" | BatchService:765 |

### BatchService - Consumption

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Batch AVAILABLE | "Cannot consume batch {number}: batch status is {status}, expected AVAILABLE" | BatchService:1078-1085 |
| Batch not on HOLD | "Cannot consume batch {number}: batch is BLOCKED (on hold)" | BatchService:1072-1075 |

### BatchService - Deletion

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Not consumed | "Cannot delete consumed batch" | BatchService:858-860 |
| Not already scrapped | "Batch is already scrapped" | BatchService:861-863 |

---

## Inventory Validations

### InventoryStateValidator - State Transitions

**Valid State Transitions:**

| From State | Allowed Transitions |
|------------|---------------------|
| AVAILABLE | RESERVED, CONSUMED, BLOCKED, ON_HOLD |
| RESERVED | AVAILABLE, CONSUMED, BLOCKED |
| PRODUCED | AVAILABLE, CONSUMED, BLOCKED |
| BLOCKED | AVAILABLE, SCRAPPED |
| ON_HOLD | AVAILABLE, BLOCKED |
| CONSUMED | (terminal - no transitions) |
| SCRAPPED | (terminal - no transitions) |

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Current state not null | "Current state cannot be null" | InventoryStateValidator:81-83 |
| New state not null | "New state cannot be null" | InventoryStateValidator:85-87 |
| Valid state | "Unknown inventory state: {state}" | InventoryStateValidator:89-91 |
| Valid transition | "Invalid state transition: {current} → {new}. Allowed transitions from {current}: {allowed}" | InventoryStateValidator:93-100 |

### InventoryStateValidator - Consumption

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| State AVAILABLE or RESERVED | "Inventory {id} cannot be consumed in state {state}. Must be AVAILABLE or RESERVED." | InventoryStateValidator:111-115 |
| If RESERVED, same order | "Inventory {id} is reserved for order {orderId}, cannot be consumed by order {orderId}" | InventoryStateValidator:120-125 |
| No active hold on inventory | "Inventory {id} has an active hold and cannot be consumed" | InventoryStateValidator:130-133 |
| No active hold on batch | "Batch {id} has an active hold, inventory {id} cannot be consumed" | InventoryStateValidator:138-142 |

### InventoryService

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Unblock: Must be blocked | "Cannot unblock inventory {id} - it is not blocked or on hold (current state: {state})" | InventoryService:195-203 |
| Reserve: Quantity available | "Reservation quantity exceeds available quantity" | InventoryService:281-283 |
| Release: Must be reserved | "Inventory {id} is not reserved (current state: {state})" | InventoryService:232-239 |
| Modify: Valid state | "Inventory {id} cannot be modified in state {state}" | InventoryService:164-170 |
| Modify: No active hold | "Inventory {id} has an active hold and cannot be modified" | InventoryService:175-181 |
| Update: Not consumed | "Cannot update consumed inventory" | InventoryService:390-392 |
| Update: Not scrapped | "Cannot update scrapped inventory" | InventoryService:393-395 |
| Delete: Not consumed | "Cannot delete consumed inventory" | InventoryService:435-437 |
| Delete: Not scrapped | "Inventory is already scrapped" | InventoryService:438-440 |

---

## Order Validations

### OrderService

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Order number unique | "Order number already exists: {number}" | OrderService:198-203 |
| Delete: Only CREATED | "Cannot delete order with status: {status}. Only CREATED orders can be deleted." | OrderService:285-290 |
| Add line item: Only CREATED orders | "Cannot add line item to order with status: {status}" | OrderService:312-314 |
| Update line item: Only CREATED | "Cannot update line item with status: {status}" | OrderService:358-360 |
| Delete line item: Only CREATED | "Cannot delete line item with status: {status}" | OrderService:396-398 |
| Delete line item: Not last | "Cannot delete the last line item. Delete the order instead." | OrderService:400-403 |
| Line item belongs to order | "Line item does not belong to order" | OrderService:353-354, 391-392 |

---

## Equipment Validations

### EquipmentService

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Maintenance: Not IN_USE | "Cannot start maintenance on equipment currently in use" | EquipmentService:117-119 |
| Maintenance: Not already | "Equipment is already under maintenance" | EquipmentService:121-123 |
| End maintenance: Must be MAINTENANCE | "Equipment is not under maintenance. Current status: {status}" | EquipmentService:159-161 |
| Hold: Not IN_USE | "Cannot put equipment on hold while in use" | EquipmentService:198-200 |
| Hold: Not already | "Equipment is already on hold" | EquipmentService:202-204 |
| Release: Must be ON_HOLD | "Equipment is not on hold. Current status: {status}" | EquipmentService:239-241 |
| Code unique | "Equipment code already exists: {code}" | EquipmentService:272-273, 308-310 |
| Delete: Not IN_USE | "Cannot delete equipment that is currently in use" | EquipmentService:343-344 |

---

## Hold Validations

### HoldService

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Valid entity type | "Invalid entity type: {type}" | HoldService:157-162 |
| Entity must exist | (EntityNotFoundException) | HoldService:33-40 |
| Not already on hold | "Entity is already on hold" | HoldService:42 |
| Release: Must be ACTIVE | "Hold is not active" | HoldService:74 |

---

## Routing Validations

### RoutingService

| Rule | Error Message | Code Location |
|------|---------------|---------------|
| Update: Not locked | "Cannot update routing after execution has started: {id}" | RoutingService:225-226 |
| Add steps: Not locked | "Cannot add steps to a routing that has started execution" | RoutingService:427-428 |
| Update steps: Not locked | "Cannot update steps of a routing that has started execution" | RoutingService:468-469 |
| Delete: Not locked | "Cannot delete routing after execution has started: {id}" | RoutingService:550-551 |
| Delete: Not ACTIVE | "Cannot delete active routing: {id}" | RoutingService:300-301 |
| Sequence number positive | "Sequence number must be a positive integer" | RoutingService:432-434, 483-485 |
| Delete step: Not mandatory | "Cannot delete mandatory routing step: {id}" | RoutingService:533-535 |
| Reorder: Not locked | "Cannot reorder steps of a routing that has started execution" | RoutingService:225-226 |

---

## Required Fields Summary

| Domain | Entity | Required Fields |
|--------|--------|-----------------|
| Production | Confirmation | operationId, materialConsumed[], producedQty |
| Batch | Split | sourceBatchId, portions[] (with quantity) |
| Batch | Merge | sourceBatchIds (≥2), compatible material/unit |
| Batch | Adjust Quantity | batchId, newQuantity (≥0), reason (non-empty) |
| Inventory | Create | materialId, materialName, inventoryType, quantity |
| Inventory | Block | inventoryId, reason |
| Inventory | Scrap | inventoryId, reason |
| Hold | Apply | entityType (valid), entityId (exists) |
| Hold | Release | holdId (ACTIVE status) |
| Order | Create | customerId, customerName, lineItems (≥1) |
| Order | Line Item | productSku, productName, quantity, unit |
| Equipment | Create | equipmentCode (unique), name, equipmentType |
| Equipment | Maintenance | equipmentId, reason, expectedEndTime |
| Routing | Create | processId, routingName, routingType |
| Routing | Step | operationName, operationType, sequenceNumber (>0) |

---

## Validation Rule Count by Domain

| Domain | Rules |
|--------|-------|
| Production Confirmation | 12 |
| Batch Operations | 18 |
| Inventory Operations | 14 |
| Order Management | 7 |
| Equipment Management | 8 |
| Hold Management | 4 |
| Routing Management | 7 |
| **Total** | **~70** |

---

## Key Constraint Patterns

1. **Status Restrictions**: Most entities enforce strict status-based operations
2. **Terminal States**: CONSUMED, SCRAPPED, UNAVAILABLE have no outbound transitions
3. **Hold Checks**: Active holds prevent consumption, modification, and reservation
4. **Uniqueness**: Order numbers, equipment codes, batch numbers must be unique
5. **Quantity Validations**: All quantity changes validated as non-negative
6. **Genealogy Integrity**: Batch split/merge invariants maintained automatically
7. **Mandatory Reasons**: Adjustments, blocks, scraps all require documented reasons
8. **State Machine Enforcement**: InventoryStateValidator centralizes all state transitions
9. **Parameter Validation**: Dynamic min/max checks per operation type + product
10. **Ownership Checks**: Line items must belong to orders, steps to routings

---

*End of Validation Rules Reference*
