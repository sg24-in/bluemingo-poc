# MES Consolidated Data Model Specification

**Document Date:** 2026-02-06
**Source:** User-provided MES Consolidated Specification
**Purpose:** Document the authoritative data model and business rules for MES POC

---

## 1. Terminology & Core Concepts

| Term | Definition |
|------|------------|
| **Stage** | Same as Process |
| **Process** | Produces an Intermediate Material (IM) or Finished Goods (FG) |
| **Operation** | Steps within a Process; Production confirmation happens here |

### Key Rules:
1. Each Process produces an IM or FG
2. Each Process contains multiple Operations
3. **Production confirmation happens at Operation level ONLY**
4. Process completion is derived from operation completion

---

## 2. Order Management

### 2.1 Order Structure
- Order is the starting point
- Order contains multiple line items

### 2.2 Order Line Item Fields
| Field | Description |
|-------|-------------|
| ProductSKU | The product being ordered |
| Quantity | Ordered quantity |
| DeliveryDate | For reporting only (not scheduling) |

### 2.3 Order Execution & Allocation
- Each order line item progresses **independently**
- An order can be processed with **multiple input materials**
- **Partial allocation:**
  - One batch → multiple orders ✓
  - One order → multiple batches ✓
- Allocation is recorded explicitly for traceability

---

## 3. Process Sequencing

| Rule | Description |
|------|-------------|
| Source | Process sequence derived from **BOM** |
| Multi-level | BOM can be multi-level |
| Override | Users **cannot override** process sequence |
| Gating | Next process available only after previous process `usage_decision = ACCEPT` |

---

## 4. Operation Sequencing

| Rule | Description |
|------|-------------|
| Source | Operation sequence derived from **Routing** |
| Routing defines | Operation order + Parallelism |
| Skip | Users **cannot skip** operations |
| Auto-progression | System automatically sets next operation |
| Readiness | Only ONE operation is READY at a time (unless routing allows parallelism) |

---

## 5. Equipment

### 5.1 Equipment Assignment
- Each Operation can have **multiple Equipments**
- Equipment selection happens at **operation execution**
- Equipment types: **Batch** or **Continuous**

### 5.2 Equipment Usage Recording
Recorded for:
- Traceability
- Reporting
- Future capacity planning

---

## 6. Production Confirmation

### 6.1 Level
- Production confirmation happens at **each operation**

### 6.2 Data Captured
| Field | Description |
|-------|-------------|
| Produced quantity | Good output |
| Scrap / yield loss | Waste quantity |
| Start time | When operation started |
| End time | When operation ended |
| Equipment(s) used | Which equipment was used |
| Operator(s) | Who performed the operation |
| Delay and delay reason | Any delays |
| Process parameters | Temperature, pressure, etc. |
| Consumed RM/IM quantities | Batch-wise consumption |

---

## 7. Status Definitions

### 7.1 Operation Status
```
NOT_STARTED → READY → IN_PROGRESS → PARTIALLY_CONFIRMED → CONFIRMED
                        ↓
                    BLOCKED / ON_HOLD
```

| Status | Description |
|--------|-------------|
| NOT_STARTED | Initial state |
| READY | Can be executed |
| IN_PROGRESS | Currently being worked |
| PARTIALLY_CONFIRMED | Partial completion |
| CONFIRMED | Fully completed |
| BLOCKED | Cannot proceed |
| ON_HOLD | Temporarily stopped |

### 7.2 Process Status
| Status | Description |
|--------|-------------|
| READY | Can start |
| IN_PROGRESS | Operations being executed |
| QUALITY_PENDING | Awaiting usage decision |
| COMPLETED | All operations done, accepted |
| REJECTED | Usage decision = REJECT |
| ON_HOLD | Temporarily stopped |

### 7.3 Order Line Status
| Status | Description |
|--------|-------------|
| CREATED | Initial state |
| IN_PROGRESS | Being processed |
| COMPLETED | Fully delivered |
| BLOCKED | Cannot proceed |
| ON_HOLD | Temporarily stopped |

### 7.4 Hold Management
**Can be applied to:**
- Operation
- Process
- Order line

**Hold requires:**
- Mandatory Hold Reason

**Example reasons:**
- Equipment breakdown
- Quality investigation
- Material shortage
- Operator unavailability

**Effects:**
- Cannot progress
- Cannot consume or produce inventory
- Release is controlled with audit trail

---

## 8. Inventory Management

### 8.1 Inventory Types
| Type | Description |
|------|-------------|
| RM | Raw Material |
| IM | Intermediate Material |
| FG | Finished Goods |
| WIP | Work in Progress (Operation-level) |

### 8.2 Inventory States
| State | Description |
|-------|-------------|
| AVAILABLE | Can be used |
| RESERVED | Allocated but not consumed |
| CONSUMED | Used in production |
| PRODUCED | Output from production |
| BLOCKED | Quality issue |
| SCRAPPED | Written off |
| ON_HOLD | Temporarily blocked |

### 8.3 Inventory Movement Rules
1. Movement happens at **operation boundaries**
2. Consume inventory from previous operation
3. Produce inventory at current operation
4. **Inventory for next process is BLOCKED until usage decision**
5. Inventory can be placed ON_HOLD with reason

---

## 9. Multilevel BOM Inventory Requirement

### Calculation Timing
- During production confirmation
- During RM/IM selection

### Uses
- Multilevel BOM
- Yield loss ratio
- Already consumed quantities

### Supports
- Multiple input materials per order
- Partial allocations across orders

### Displays
- Required quantity
- Available quantity
- Shortage indicator

---

## 10. Production Confirmation UI Rules

### 10.1 Available Orders List
Orders shown only if:
- Process = READY
- Previous process usage_decision = ACCEPT
- Order line not completed
- Not ON_HOLD

### 10.2 Available RM/IM List
Materials shown only if:
- Inventory state = AVAILABLE
- Batch not blocked or on hold
- Quantity sufficient (per BOM calculation)

---

## 11. Quantity Type Configuration

| Aspect | Description |
|--------|-------------|
| Types | INTEGER (pieces) or DECIMAL (continuous) |
| Configuration level | Material, Operation, or Equipment |
| Enforcement | Precision + Rounding rules |

---

## 12. Batch Management

### 12.1 Batch Generation
- Generated at **operation completion**
- Based on operation-level configuration

### 12.2 Batch Configuration
| Field | Description |
|-------|-------------|
| Prefix | e.g., "RM-", "FG-" |
| Date format | e.g., "YYYYMMDD" |
| Sequence | Auto-incrementing number |
| Batch size logic | Rules for splitting |
| Per-piece or per-quantity | Generation mode |

---

## 13. Batch Relationships

### 13.1 Supported Relationships
| Type | Description |
|------|-------------|
| 1:1 | One batch → One batch |
| 1:N | One batch → Many batches (SPLIT) |
| N:1 | Many batches → One batch (MERGE) |
| N:M | Many batches → Many batches |

### 13.2 Batch Relation Fields
| Field | Description |
|-------|-------------|
| Parent batch | Source batch(es) |
| Child batch | Output batch(es) |
| Quantity consumed | Amount used |
| Operation | Where it happened |
| Relation type | SPLIT or MERGE |

---

## 14. Batch ↔ Order Allocation

| Rule | Description |
|------|-------------|
| One batch → many orders | ✓ Supported |
| One order → many batches | ✓ Supported |
| Tracking | Batch ID, Order Line ID, Allocated Quantity |
| History | Immutable (audit trail) |

---

## 15. Change & Audit Tracking

### Tracked Entities
- Production status changes
- Hold / release actions
- Inventory movements
- Batch relations
- Batch-order allocations
- Usage decisions

### Captured Fields
| Field | Description |
|-------|-------------|
| Old value | Previous state |
| New value | New state |
| User | Who made change |
| Timestamp | When changed |

---

## 16. Entity Definitions

### Orders
| Field | Type | Description |
|-------|------|-------------|
| OrderID | PK | Primary key |
| CustomerID | FK | Customer reference |
| OrderDate | Date | When ordered |
| Status | Enum | CREATED/IN_PROGRESS/COMPLETED/BLOCKED/ON_HOLD |

### OrderLineItems
| Field | Type | Description |
|-------|------|-------------|
| OrderLineID | PK | Primary key |
| OrderID | FK | Parent order |
| ProductSKU | String | Product identifier |
| Quantity | Decimal | Ordered amount |
| DeliveryDate | Date | Target delivery |
| Status | Enum | CREATED/IN_PROGRESS/COMPLETED/BLOCKED/ON_HOLD |

### BillOfMaterial
| Field | Type | Description |
|-------|------|-------------|
| BOMID | PK | Primary key |
| ProductSKU | String | Product this BOM is for |
| BOMVersion | String | Version identifier |
| MaterialID | String | Component material |
| QuantityRequired | Decimal | How much needed |
| YieldLossRatio | Decimal | Expected loss |
| SequenceLevel | Integer | Multi-level BOM depth |
| ParentBOMID | FK | Recursive hierarchy |
| Status | Enum | ACTIVE/OBSOLETE/ON_HOLD |

### Processes
| Field | Type | Description |
|-------|------|-------------|
| ProcessID | PK | Primary key |
| ProcessName | String | Name of process |
| Status | Enum | READY/IN_PROGRESS/QUALITY_PENDING/COMPLETED/REJECTED/ON_HOLD |

**Note:** No OrderLineItem FK in Processes - this is a design-time entity!

### Routing
| Field | Type | Description |
|-------|------|-------------|
| RoutingID | PK | Primary key |
| ProcessID | FK | Which process this routing is for |
| RoutingName | String | Name |
| RoutingType | Enum | Sequential/Parallel |
| Status | Enum | ACTIVE/INACTIVE/ON_HOLD |

### RoutingSteps
| Field | Type | Description |
|-------|------|-------------|
| RoutingStepID | PK | Primary key |
| RoutingID | FK | Parent routing |
| OperationID | FK | Which operation (NOTE: This is problematic - see gap analysis) |
| SequenceNumber | Integer | Order of execution |
| IsParallel | Boolean | Can run in parallel |
| MandatoryFlag | Boolean | Required step |
| Status | Enum | READY/IN_PROGRESS/COMPLETED/ON_HOLD |

### Operations
| Field | Type | Description |
|-------|------|-------------|
| OperationID | PK | Primary key |
| ProcessID | FK | Parent process |
| OperationName | String | Name |
| OperationType | String | Type of operation |
| Status | Enum | NOT_STARTED/READY/IN_PROGRESS/PARTIALLY_CONFIRMED/CONFIRMED/BLOCKED/ON_HOLD |

### Equipment
| Field | Type | Description |
|-------|------|-------------|
| EquipmentID | PK | Primary key |
| EquipmentType | Enum | Batch/Continuous |
| Name | String | Equipment name |
| Capacity | Decimal | Max capacity |
| Status | Enum | AVAILABLE/IN_USE/MAINTENANCE/ON_HOLD |

### OperationEquipmentUsage
| Field | Type | Description |
|-------|------|-------------|
| OperationEquipmentID | PK | Primary key |
| OperationID | FK | Which operation |
| EquipmentID | FK | Which equipment |

### ProductionConfirmation
| Field | Type | Description |
|-------|------|-------------|
| ConfirmationID | PK | Primary key |
| OperationID | FK | Which operation |
| ProducedQty | Decimal | Good output |
| ScrapQty | Decimal | Waste |
| StartTime | Timestamp | When started |
| EndTime | Timestamp | When ended |
| DelayReason | String | If delayed |
| ProcessParameters | JSON | Captured parameters |
| RMConsumed | JSON | Batch-wise consumption |
| Status | Enum | CONFIRMED/PARTIALLY_CONFIRMED/REJECTED |

### Inventory
| Field | Type | Description |
|-------|------|-------------|
| InventoryID | PK | Primary key |
| MaterialID | String | Material reference |
| InventoryType | Enum | RM/IM/FG/WIP |
| State | Enum | AVAILABLE/RESERVED/CONSUMED/PRODUCED/BLOCKED/SCRAPPED/ON_HOLD |
| Quantity | Decimal | Amount |
| BatchID | FK | Associated batch |

### InventoryMovement
| Field | Type | Description |
|-------|------|-------------|
| MovementID | PK | Primary key |
| OperationID | FK | Which operation |
| InventoryID | FK | Which inventory |
| MovementType | Enum | Consume/Produce/Hold/Release |
| Quantity | Decimal | Amount moved |
| Timestamp | Timestamp | When |
| Reason | String | Why |
| Status | Enum | EXECUTED/PENDING/ON_HOLD |

### Batches
| Field | Type | Description |
|-------|------|-------------|
| BatchID | PK | Primary key |
| MaterialID | String | Material reference |
| GeneratedAtOperationID | FK | Where created |
| BatchNumber | String | Unique identifier |
| Quantity | Decimal | Amount |
| Status | Enum | AVAILABLE/CONSUMED/PRODUCED/ON_HOLD |

### BatchRelations
| Field | Type | Description |
|-------|------|-------------|
| RelationID | PK | Primary key |
| ParentBatchID | FK | Source batch |
| ChildBatchID | FK | Output batch |
| OperationID | FK | Where relation created |
| RelationType | Enum | SPLIT/MERGE |
| QuantityConsumed | Decimal | Amount used |
| Status | Enum | ACTIVE/CLOSED |

### BatchOrderAllocation
| Field | Type | Description |
|-------|------|-------------|
| AllocationID | PK | Primary key |
| BatchID | FK | Which batch |
| OrderLineID | FK | Which order line |
| AllocatedQty | Decimal | Amount allocated |
| Timestamp | Timestamp | When allocated |
| Status | Enum | ALLOCATED/RELEASED |

### HoldRecords
| Field | Type | Description |
|-------|------|-------------|
| HoldID | PK | Primary key |
| EntityType | Enum | Operation/Process/OrderLine/Inventory/Batch |
| EntityID | Long | Reference to entity |
| Reason | String | Why held |
| AppliedBy | String | Who applied |
| AppliedOn | Timestamp | When applied |
| ReleasedBy | String | Who released |
| ReleasedOn | Timestamp | When released |
| Status | Enum | ACTIVE/RELEASED |

### AuditTrail
| Field | Type | Description |
|-------|------|-------------|
| AuditID | PK | Primary key |
| EntityType | String | Which entity |
| EntityID | Long | Entity reference |
| FieldName | String | Which field changed |
| OldValue | String | Previous value |
| NewValue | String | New value |
| ChangedBy | String | Who changed |
| Timestamp | Timestamp | When changed |

---

## 17. Relationships Overview

```
Orders
    └── OrderLineItems
            └── Processes
                    └── Operations

Operations ↔ Equipment (many-to-many via OperationEquipmentUsage)
Operations ↔ ProductionConfirmation
Operations ↔ InventoryMovement

Inventory ↔ Batches
Batches ↔ BatchRelations ↔ BatchOrderAllocation

HoldRecords → Operations / Processes / OrderLines
AuditTrail → All entities
```

---

## 18. Critical Architecture Questions

### Q1: How does OrderLineItem link to Process?
The spec shows `OrderLineItems → Processes` but the Process entity has no OrderLineItem FK.

**Possible interpretations:**
1. Process is design-time, and there's a runtime `ProcessInstance` that links to OrderLineItem
2. The FK exists but wasn't explicitly listed
3. The relationship is logical, not physical (via BOM/Product)

**Current POC:** Process has `orderLineItem` FK (runtime pattern)

### Q2: RoutingStep links to OperationID - but Operations are runtime?
The spec shows RoutingStep has `OperationID` FK, but Operations are runtime entities.

**Gap:** Operations should be created FROM RoutingSteps at runtime, not pre-exist.

**Recommendation:** RoutingStep should define operation metadata (name, type), not link to existing operations.

---

## 19. Implementation Gap Summary

| Current Implementation | Spec Requirement | Gap |
|----------------------|------------------|-----|
| Process has orderLineItem FK | Process has no orderLineItem FK | Process should be design-time |
| RoutingStep links to Operation | RoutingStep defines operation metadata | RoutingStep should not have operationId FK |
| Operation created manually | Operation instantiated from RoutingStep | Need OperationInstantiationService |
| No PARTIALLY_CONFIRMED status | Operation has PARTIALLY_CONFIRMED | Add status constant |
| No RESERVED inventory state | Inventory has RESERVED state | Implement reservation |

---

**End of Specification Document**
