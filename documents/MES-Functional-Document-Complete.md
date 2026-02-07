# MES Production Confirmation - Complete Functional Document

**Version:** 1.0
**Generated:** February 2026
**Source:** Code-first analysis of bluemingo-poc codebase

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Core Domain Model](#2-core-domain-model)
3. [End-to-End Functional Flows](#3-end-to-end-functional-flows)
4. [Validation Rules](#4-validation-rules)
5. [Status Model & State Machines](#5-status-model--state-machines)
6. [UI Functionality](#6-ui-functionality)
7. [Backend APIs](#7-backend-apis)
8. [Configuration & Seed Data](#8-configuration--seed-data)
9. [Audit & Traceability Coverage](#9-audit--traceability-coverage)
10. [Explicit Limitations & Gaps](#10-explicit-limitations--gaps)
11. [Architectural Observations](#11-architectural-observations)
12. [Summary Matrix](#12-summary-matrix)

---

## 1. System Overview

### 1.1 Purpose
The MES Production Confirmation system is a Manufacturing Execution System proof-of-concept designed to manage:
- Production order management and tracking
- Multi-stage manufacturing processes with operation sequences
- Material and inventory management with batch traceability
- Equipment and operator resource management
- Quality control and batch approval workflows
- Configurable process parameters and batch numbering
- Complete audit trail for compliance

### 1.2 Technology Stack

| Layer | Technology |
|-------|------------|
| Backend Framework | Spring Boot 3.2 |
| Language | Java 17 |
| Database | PostgreSQL 14+ |
| ORM | Spring Data JPA / Hibernate |
| Security | JWT Token Authentication (JJWT 0.12.3) |
| Build | Gradle 8.5 |
| Schema Management | SQL Patch System (32 patches) |
| Frontend Framework | Angular 17 (Module-based) |
| Routing | Hash-based (`useHash: true`) |
| HTTP Client | Angular HttpClient with RxJS 7.8.0 |
| Styling | Custom CSS |

### 1.3 Core Capabilities

| Capability | Description |
|------------|-------------|
| Order Management | Customer orders with line items, products, and operations |
| Production Confirmation | Material consumption, output production, process parameters |
| Batch Traceability | Forward/backward genealogy with SPLIT/MERGE operations |
| Inventory Management | State-based tracking (AVAILABLE, RESERVED, CONSUMED, BLOCKED, SCRAPPED) |
| Equipment Management | Status tracking, maintenance scheduling, hold management |
| Hold Management | Entity-level holds across orders, operations, batches, inventory, equipment |
| Quality Approval | Batch approval workflow (QUALITY_PENDING → AVAILABLE/BLOCKED) |
| Configurable Parameters | Dynamic process parameters with min/max validation |
| Configurable Batch Numbers | Pattern-based generation by operation type/product |
| Audit Trail | Field-level change tracking with old/new values |

---

## 2. Core Domain Model

### 2.1 Entity Summary

The system consists of **43 JPA entities** organized into the following domains:

| Domain | Entity Count | Key Entities |
|--------|--------------|--------------|
| Orders & Line Items | 2 | Order, OrderLineItem |
| Production Execution | 3 | Operation, ProductionConfirmation, Process |
| Process & Routing | 2 | Routing, RoutingStep |
| Inventory & Batches | 5 | Inventory, Batch, BatchRelation, BatchQuantityAdjustment, BatchOrderAllocation |
| Production Materials | 3 | ConsumedMaterial, ProducedOutput, BillOfMaterial |
| Equipment & Operations | 3 | Equipment, Operator, OperationEquipmentUsage |
| Holds & Blocking | 2 | HoldRecord, HoldReason |
| Configuration | 4 | ProcessParametersConfig, BatchNumberConfig, BatchSizeConfig, QuantityTypeConfig |
| Master Data | 4 | Customer, Material, Product, DelayReason |
| Organizational | 6 | Department, Shift, Location, MaterialGroup, ProductCategory, ProductGroup |
| Operation Types | 2 | OperationType, AttributeDefinition |
| Audit & System | 3 | AuditTrail, DatabasePatch, User |

### 2.2 Key Entity Relationships

```
Customer (1) ←──────────── (*) Order
                              │
                              ├── (*) OrderLineItem
                              │         │
                              │         └── (*) Operation ──→ Process (design-time)
                              │                   │
                              │                   └── (*) ProductionConfirmation
                              │                              │
                              │                              ├── (*) ConsumedMaterial ──→ Inventory/Batch
                              │                              └── (*) ProducedOutput ──→ Batch/Inventory
                              │
                              └── (*) BatchOrderAllocation ──→ Batch

Product ←── BillOfMaterial (hierarchical, self-referencing via parentBomId)

Batch ←─── BatchRelation (parent/child) ───→ Batch
  │
  └── BatchQuantityAdjustment (audit trail)

Equipment ←─── OperationEquipmentUsage ───→ Operation
  │                    │
  └────────────────────┴──→ Operator

HoldRecord ──→ (OPERATION | PROCESS | ORDER_LINE | INVENTORY | BATCH | EQUIPMENT)
```

### 2.3 Critical Entity Details

#### Order
| Field | Type | Purpose |
|-------|------|---------|
| orderId | Long | Primary Key |
| orderNumber | String (unique) | Business identifier (auto-generated: ORD-{sequence}) |
| customer | Customer | FK to customer master |
| orderDate | LocalDate | Order creation date |
| status | String | CREATED, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD |
| lineItems | List<OrderLineItem> | Child items (@OneToMany) |

#### Operation
| Field | Type | Purpose |
|-------|------|---------|
| operationId | Long | Primary Key |
| orderLineItem | OrderLineItem | Runtime tracking (FK) |
| process | Process | Design-time template (FK) |
| operationType | String | FURNACE, CASTER, ROLLING, etc. |
| sequenceNumber | Integer | Execution order |
| status | String | NOT_STARTED, READY, IN_PROGRESS, CONFIRMED, etc. |
| targetQty | BigDecimal | Target output quantity |
| confirmedQty | BigDecimal | Confirmed quantity |

#### Batch
| Field | Type | Purpose |
|-------|------|---------|
| batchId | Long | Primary Key |
| batchNumber | String (unique) | Auto-generated via BatchNumberConfig |
| materialId | String | Material identifier |
| quantity | BigDecimal | Current quantity |
| status | String | QUALITY_PENDING (default), AVAILABLE, CONSUMED, etc. |
| createdVia | String | PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT |
| generatedAtOperationId | Long | Operation that created this batch |

#### Inventory
| Field | Type | Purpose |
|-------|------|---------|
| inventoryId | Long | Primary Key |
| materialId | String | Material identifier |
| inventoryType | String | RM, IM, FG, WIP |
| state | String | AVAILABLE, RESERVED, CONSUMED, BLOCKED, SCRAPPED, ON_HOLD |
| quantity | BigDecimal | Current quantity |
| batch | Batch | Source batch (FK) |
| location | String | Storage location |
| reservedForOrderId | Long | Order reservation |
| reservedForOperationId | Long | Operation reservation |

#### ProductionConfirmation
| Field | Type | Purpose |
|-------|------|---------|
| confirmationId | Long | Primary Key |
| operation | Operation | Associated operation (FK) |
| producedQty | BigDecimal | Output quantity |
| scrapQty | BigDecimal | Scrap quantity |
| startTime | LocalDateTime | Production start |
| endTime | LocalDateTime | Production end |
| processParametersJson | String (CLOB) | Captured parameters as JSON |
| equipment | Set<Equipment> | Used equipment (@ManyToMany) |
| operators | Set<Operator> | Used operators (@ManyToMany) |
| status | String | CONFIRMED, PARTIALLY_CONFIRMED, REJECTED, PENDING_REVIEW |

---

## 3. End-to-End Functional Flows

### 3.1 Order Creation Flow

```
1. Customer Selection
   └── Select existing customer or create new

2. Order Creation
   └── POST /api/orders
       ├── Auto-generate orderNumber (ORD-{sequence})
       ├── Set status = CREATED
       └── Validate: At least 1 line item required

3. Line Item Addition
   └── Each line item:
       ├── Product SKU (from products table)
       ├── Quantity and unit
       └── Delivery date

4. Operations Generation
   └── Based on product routing/process template:
       ├── Create Operation for each routing step
       ├── Set sequenceNumber for ordering
       └── First operation status = READY, others = NOT_STARTED
```

### 3.2 Raw Material Receipt Flow

```
1. Receive Material Request
   └── POST /api/inventory/receive-material
       ├── materialId (must be RM type)
       ├── quantity
       ├── supplierBatchNumber (optional)
       └── location

2. Batch Creation
   └── Auto-generate batch number via BatchNumberConfig
       ├── Status = QUALITY_PENDING (default)
       ├── createdVia = RECEIPT
       └── Store supplier info

3. Inventory Creation
   └── Create inventory record
       ├── State = AVAILABLE
       ├── Link to batch
       └── Set location

4. Quality Approval Required
   └── Batch must be approved before inventory can be consumed
       ├── POST /api/batches/{id}/approve → Status = AVAILABLE
       └── POST /api/batches/{id}/reject → Status = BLOCKED
```

### 3.3 Production Confirmation Flow

```
1. Select Operation
   └── GET /api/orders/available
       └── Returns orders with READY operations

2. Load Operation Details
   └── GET /api/production/operations/{operationId}
       ├── Process parameters config
       ├── BOM requirements
       └── Available input materials

3. Suggested Consumption (GAP-004)
   └── GET /api/bom/operation/{operationId}/suggested-consumption
       ├── Calculate required quantities from BOM
       ├── Apply yield loss ratios
       └── Show stock availability

4. Select Input Materials
   └── Choose from available inventory/batches
       └── Validate: State = AVAILABLE or RESERVED (for this order)

5. Enter Process Parameters
   └── Dynamic validation against ProcessParametersConfig
       ├── Required parameters must be provided
       ├── Values within min/max range
       └── Warnings for values within 10% of limits

6. Submit Confirmation
   └── POST /api/production/confirm
       ├── Validate operation status (READY or IN_PROGRESS)
       ├── Validate no active holds
       ├── Validate process is ACTIVE
       └── Execute confirmation

7. Confirmation Processing
   ├── Create ProductionConfirmation record
   ├── Consume input materials
   │   ├── Update inventory state → CONSUMED
   │   └── Create ConsumedMaterial records
   ├── Generate output batch
   │   ├── Auto-generate batch number
   │   ├── Status = QUALITY_PENDING
   │   └── Create BatchRelation (parent → child)
   ├── Create output inventory
   │   ├── State = PRODUCED
   │   └── Link to output batch
   ├── Update operation status
   │   ├── If partial: IN_PROGRESS or PARTIALLY_CONFIRMED
   │   └── If complete: CONFIRMED
   ├── Advance next operation
   │   └── Next in sequence → READY
   └── Create audit trail entries
```

### 3.4 Batch Split Flow

```
1. Validate Splittable
   └── Batch status in: AVAILABLE, RESERVED, BLOCKED, PRODUCED, QUALITY_PENDING
   └── Routing step allows split (allowsSplit = true)

2. Define Portions
   └── POST /api/batches/{id}/split
       ├── portions[] with quantity and optional suffix
       └── Total portions ≤ source quantity

3. Execute Split
   ├── Reduce source batch quantity
   ├── Create child batches
   │   ├── Inherit material, unit
   │   ├── New batch numbers with suffix
   │   └── Status = source status
   ├── Create BatchRelation records
   │   └── relationType = SPLIT
   └── Audit trail entry
```

### 3.5 Batch Merge Flow

```
1. Validate Mergeable
   └── All batches: status = AVAILABLE
   └── Same materialId and unit
   └── Routing step allows merge (allowsMerge = true)
   └── Minimum 2 batches

2. Submit Merge
   └── POST /api/batches/merge
       ├── sourceBatchIds[]
       └── Optional targetBatchNumber

3. Execute Merge
   ├── Create merged batch
   │   ├── Quantity = sum of source quantities
   │   └── Status = AVAILABLE
   ├── Update source batches
   │   └── Status = MERGED, quantity = 0
   ├── Create BatchRelation records
   │   └── relationType = MERGE
   └── Audit trail entry
```

### 3.6 Hold Management Flow

```
1. Apply Hold
   └── POST /api/holds
       ├── entityType: OPERATION | PROCESS | ORDER_LINE | INVENTORY | BATCH | EQUIPMENT
       ├── entityId
       └── reason, comments

2. Hold Effect
   ├── Capture previous status
   ├── Update entity status → ON_HOLD or BLOCKED
   └── Entity blocked from production use

3. Release Hold
   └── PUT /api/holds/{holdId}/release
       ├── Validate hold is ACTIVE
       ├── Restore previous status
       └── Record release comments
```

---

## 4. Validation Rules

### 4.1 Production Confirmation Validations

| Rule | Error Message | Location |
|------|---------------|----------|
| Operation status must be READY or IN_PROGRESS | "Operation is not in READY or IN_PROGRESS status" | ProductionService:59-60 |
| No active hold on operation | "Operation is on hold and cannot be confirmed" | ProductionService:64-67 |
| No active hold on process | "Process is on hold and cannot be confirmed" | ProductionService:69-72 |
| Process must be ACTIVE | "Cannot confirm production: Process {id} status is {status}, must be ACTIVE" | ProductionService:74-79 |
| Consumption quantity ≤ available | "Consumption quantity exceeds available quantity for inventory: {id}" | ProductionService:122 |
| Required parameters provided | "Required parameter '{name}' is missing" | ProcessParameterService:136 |
| Parameter values in range | "Parameter '{name}' value {value} is below minimum {min}" | ProcessParameterService:156-165 |

### 4.2 Batch Validations

| Rule | Error Message | Location |
|------|---------------|----------|
| Split: Valid status | "Batch with status {status} cannot be split. Only batches with status AVAILABLE, RESERVED, BLOCKED, PRODUCED, or QUALITY_PENDING can be split." | BatchService:272-276 |
| Split: Routing allows | "Split not allowed for batch {number}: routing step {name} has allowsSplit=false" | BatchService:223-226 |
| Split: At least 1 portion | "At least one portion is required for splitting" | BatchService:282-284 |
| Split: Positive quantities | "All split portions must have a positive quantity" | BatchService:286-292 |
| Split: Total ≤ source | "Split quantities exceed available quantity" | BatchService:294-302 |
| Merge: Minimum 2 batches | "At least 2 batches are required for merging" | BatchService:386-388 |
| Merge: All AVAILABLE | "Only AVAILABLE batches can be merged. Batch {number} has status: {status}" | BatchService:403-408 |
| Merge: Same material | "All batches must have the same material ID for merging" | BatchService:410-414 |
| Merge: Same unit | "All batches must have the same unit for merging" | BatchService:416-422 |
| Approve: Valid status | "Only PRODUCED or QUALITY_PENDING batches can be approved. Current status: {status}" | BatchService:516-518 |
| Adjust: Reason required | "A reason is required for quantity adjustments" | BatchService:745 |
| Adjust: Not consumed | "Cannot adjust quantity of consumed batch" | BatchService:750-752 |
| Adjust: Not scrapped | "Cannot adjust quantity of scrapped batch" | BatchService:753-755 |
| Adjust: Non-negative | "New quantity must be non-negative" | BatchService:765 |

### 4.3 Inventory Validations

| Rule | Error Message | Location |
|------|---------------|----------|
| State transition valid | "Invalid state transition: {current} → {new}. Allowed transitions from {current}: {allowed}" | InventoryStateValidator:81-100 |
| Consume: AVAILABLE or RESERVED | "Inventory {id} cannot be consumed in state {state}. Must be AVAILABLE or RESERVED." | InventoryStateValidator:111-115 |
| Consume: Same order if reserved | "Inventory {id} is reserved for order {orderId}, cannot be consumed by order {orderId}" | InventoryStateValidator:120-125 |
| Consume: No active hold | "Inventory {id} has an active hold and cannot be consumed" | InventoryStateValidator:130-133 |
| Consume: Batch not on hold | "Batch {id} has an active hold, inventory {id} cannot be consumed" | InventoryStateValidator:138-142 |
| Unblock: Must be blocked | "Cannot unblock inventory {id} - it is not blocked or on hold (current state: {state})" | InventoryService:195-203 |
| Reserve: Quantity available | "Reservation quantity exceeds available quantity" | InventoryService:281-283 |

### 4.4 Order Validations

| Rule | Error Message | Location |
|------|---------------|----------|
| Order number unique | "Order number already exists: {number}" | OrderService:198-203 |
| Delete: Only CREATED | "Cannot delete order with status: {status}. Only CREATED orders can be deleted." | OrderService:285-290 |
| Add line item: Only CREATED | "Cannot add line item to order with status: {status}" | OrderService:312-314 |
| Update line item: Only CREATED | "Cannot update line item with status: {status}" | OrderService:358-360 |
| Delete line item: Only CREATED | "Cannot delete line item with status: {status}" | OrderService:396-398 |
| Delete line item: Not last | "Cannot delete the last line item. Delete the order instead." | OrderService:400-403 |
| Line item ownership | "Line item does not belong to order" | OrderService:353-354, 391-392 |

### 4.5 Equipment Validations

| Rule | Error Message | Location |
|------|---------------|----------|
| Maintenance: Not IN_USE | "Cannot start maintenance on equipment currently in use" | EquipmentService:117-119 |
| Maintenance: Not already | "Equipment is already under maintenance" | EquipmentService:121-123 |
| End maintenance: Must be MAINTENANCE | "Equipment is not under maintenance. Current status: {status}" | EquipmentService:159-161 |
| Hold: Not IN_USE | "Cannot put equipment on hold while in use" | EquipmentService:198-200 |
| Hold: Not already | "Equipment is already on hold" | EquipmentService:202-204 |
| Release: Must be ON_HOLD | "Equipment is not on hold. Current status: {status}" | EquipmentService:239-241 |
| Code unique | "Equipment code already exists: {code}" | EquipmentService:272-273, 308-310 |
| Delete: Not IN_USE | "Cannot delete equipment that is currently in use" | EquipmentService:343-344 |

### 4.6 Routing Validations

| Rule | Error Message | Location |
|------|---------------|----------|
| Update: Not locked | "Cannot update routing after execution has started: {id}" | RoutingService:225-226 |
| Add steps: Not locked | "Cannot add steps to a routing that has started execution" | RoutingService:427-428 |
| Update steps: Not locked | "Cannot update steps of a routing that has started execution" | RoutingService:468-469 |
| Delete: Not locked | "Cannot delete routing after execution has started: {id}" | RoutingService:550-551 |
| Delete: Not ACTIVE | "Cannot delete active routing: {id}" | RoutingService:300-301 |
| Sequence number positive | "Sequence number must be a positive integer" | RoutingService:432-434, 483-485 |
| Delete step: Not mandatory | "Cannot delete mandatory routing step: {id}" | RoutingService:533-535 |

---

## 5. Status Model & State Machines

### 5.1 Order Status

```
CREATED ──→ IN_PROGRESS ──→ COMPLETED
    ↓           ↓
    └───→ BLOCKED ←───┘
            ↓
         ON_HOLD
```

| Status | Description |
|--------|-------------|
| CREATED | New order, no production started |
| IN_PROGRESS | At least one operation started |
| COMPLETED | All operations confirmed |
| BLOCKED | Business/quality hold |
| ON_HOLD | Temporary hold |

### 5.2 Operation Status

```
NOT_STARTED ──→ READY ──→ IN_PROGRESS ──→ CONFIRMED
                  ↓                          ↓
               ON_HOLD ←───────────── PARTIALLY_CONFIRMED
                  ↓
               BLOCKED
```

| Status | Description |
|--------|-------------|
| NOT_STARTED | Not yet ready (waiting for previous) |
| READY | Ready for production |
| IN_PROGRESS | Production started |
| PARTIALLY_CONFIRMED | Partial quantity confirmed |
| CONFIRMED | Fully confirmed |
| ON_HOLD | Temporary hold |
| BLOCKED | Business/quality hold |

### 5.3 Batch Status

```
                              ┌── CONSUMED (terminal)
                              │
QUALITY_PENDING ──→ AVAILABLE ┼── PRODUCED
       ↓                ↓     │
    BLOCKED ←─────── ON_HOLD  └── SPLIT/MERGED
       ↓
    SCRAPPED (terminal)
```

| Status | Description |
|--------|-------------|
| QUALITY_PENDING | Default - awaiting approval |
| AVAILABLE | Approved for production use |
| PRODUCED | Output from production |
| CONSUMED | Completely used (terminal) |
| BLOCKED | Quality/business hold |
| ON_HOLD | Temporary hold |
| SCRAPPED | Disposed (terminal) |
| SPLIT | Original after split operation |
| MERGED | Source after merge operation |

### 5.4 Inventory State

```
            ┌── RESERVED
            │       ↓
AVAILABLE ──┼── CONSUMED (terminal)
    ↓       │
ON_HOLD     └── PRODUCED
    ↓
BLOCKED ──→ SCRAPPED (terminal)
```

| State | Description | Allowed Transitions |
|-------|-------------|---------------------|
| AVAILABLE | Ready for use | RESERVED, CONSUMED, BLOCKED, ON_HOLD |
| RESERVED | Held for specific order | AVAILABLE, CONSUMED, BLOCKED |
| PRODUCED | Output from production | AVAILABLE, CONSUMED, BLOCKED |
| BLOCKED | Quality/business hold | AVAILABLE, SCRAPPED |
| ON_HOLD | Temporary hold | AVAILABLE, BLOCKED |
| CONSUMED | Used in production | (terminal) |
| SCRAPPED | Disposed | (terminal) |

### 5.5 Equipment Status

```
AVAILABLE ←─→ IN_USE
    ↓           ↓
MAINTENANCE ←───┘
    ↓
ON_HOLD ──→ UNAVAILABLE
```

| Status | Description |
|--------|-------------|
| AVAILABLE | Ready for use |
| IN_USE | Currently in production |
| MAINTENANCE | Under maintenance |
| ON_HOLD | Business hold |
| UNAVAILABLE | Not operational |

### 5.6 Production Confirmation Status

| Status | Description |
|--------|-------------|
| CONFIRMED | Successfully confirmed |
| PARTIALLY_CONFIRMED | Partial quantity confirmed |
| REJECTED | Confirmation rejected |
| PENDING_REVIEW | Awaiting review |

### 5.7 Process Status (Design-Time)

| Status | Description |
|--------|-------------|
| DRAFT | Being designed |
| ACTIVE | Ready for use |
| INACTIVE | Retired |
| SUPERSEDED | Replaced by newer version |

### 5.8 Routing Status

| Status | Description |
|--------|-------------|
| DRAFT | Being designed |
| ACTIVE | In use |
| INACTIVE | Retired |
| ON_HOLD | Temporarily suspended |

---

## 6. UI Functionality

### 6.1 Page Structure

| Page | Route | Layout | Purpose |
|------|-------|--------|---------|
| Login | `/#/login` | None | Authentication |
| Dashboard | `/#/dashboard` | MainLayout | Overview metrics |
| Orders | `/#/orders` | MainLayout | Order list |
| Order Detail | `/#/orders/:id` | MainLayout | Order details |
| Production Confirm | `/#/production/confirm` | MainLayout | Production confirmation form |
| Inventory | `/#/inventory` | MainLayout | Inventory list |
| Batches | `/#/batches` | MainLayout | Batch list |
| Batch Detail | `/#/batches/:id` | MainLayout | Batch details with genealogy |
| Holds | `/#/holds` | MainLayout | Hold records |
| Equipment | `/#/equipment` | MainLayout | Equipment list |
| Quality | `/#/quality` | MainLayout | Quality pending queue |
| Manage (Admin) | `/#/manage/*` | AdminLayout | Administration pages |

### 6.2 Admin Sidebar Structure

```
Master Data:
├── Customers      (/manage/customers)
├── Products       (/manage/products)
└── Materials      (/manage/materials)

Production:
├── Processes      (/manage/processes)
├── Routing        (/manage/routing)
├── Equipment      (/manage/equipment)
├── Operators      (/manage/operators)
└── Bill of Materials (/manage/bom)

Configuration:
├── Hold Reasons       (/manage/config/hold-reasons)
├── Delay Reasons      (/manage/config/delay-reasons)
├── Process Parameters (/manage/config/process-params)
├── Batch Number       (/manage/config/batch-number)
├── Batch Size         (/manage/config/batch-size)
└── Quantity Types     (/manage/config/quantity-type)

System:
├── Users         (/manage/users)
└── Audit Trail   (/manage/audit)
```

### 6.3 Key UI Components

| Component | Purpose |
|-----------|---------|
| PaginationComponent | Server-side pagination with page size selector |
| HeaderComponent | Navigation header with user menu |
| AdminLayoutComponent | Admin pages with sidebar navigation |
| MainLayoutComponent | Main pages with header only |
| StatusBadge | Color-coded status display |

### 6.4 Pagination Features

All list pages support:
- Server-side pagination
- Page size selector (10, 20, 50, 100)
- Sort by column (ASC/DESC)
- Text search
- Status/type filters

---

## 7. Backend APIs

### 7.1 API Summary

| Domain | Endpoints | Base Path |
|--------|-----------|-----------|
| Authentication | 4 | `/api/auth` |
| Orders | 11 | `/api/orders` |
| Production | 8 | `/api/production` |
| Inventory | 18 | `/api/inventory` |
| Batches | 22 | `/api/batches` |
| Holds | 7 | `/api/holds` |
| Equipment | 12 | `/api/equipment` |
| Master Data | 12 | `/api/master` |
| Customers | 9 | `/api/customers` |
| Materials | 9 | `/api/materials` |
| Products | 9 | `/api/products` |
| BOM | 17 | `/api/bom` |
| Dashboard | 2 | `/api/dashboard` |
| Audit | 8 | `/api/audit` |
| Operators | 7 | `/api/operators` |
| Operations | 6 | `/api/operations` |
| Processes | 10 | `/api/processes` |
| Users | 13 | `/api/users` |
| Configuration | 28 | `/api/config` |
| Routing | 18 | `/api/routing` |
| Batch Size | 6 | `/api/batch-size-config` |
| Inventory Movement | 8 | `/api/inventory-movements` |
| Batch Allocation | 6 | `/api/batch-allocations` |
| Equipment Usage | 7 | `/api/equipment-usage` |
| **Total** | **~247** | |

### 7.2 Key API Endpoints

#### Authentication
```
POST /api/auth/login          - User login (public)
GET  /api/auth/me             - Current user info
POST /api/auth/refresh        - Refresh JWT token
POST /api/auth/logout         - User logout
```

#### Orders
```
GET  /api/orders              - List orders
GET  /api/orders/paged        - Paginated orders
GET  /api/orders/available    - Orders with READY operations
GET  /api/orders/{id}         - Order by ID
POST /api/orders              - Create order
PUT  /api/orders/{id}         - Update order
DELETE /api/orders/{id}       - Delete order (soft)
POST /api/orders/{id}/line-items         - Add line item
PUT  /api/orders/{id}/line-items/{lineId} - Update line item
DELETE /api/orders/{id}/line-items/{lineId} - Delete line item
```

#### Production
```
POST /api/production/confirm  - Submit production confirmation
GET  /api/production/operations/{id} - Operation details
POST /api/production/confirmations/{id}/reject - Reject confirmation
GET  /api/production/confirmations/{id} - Confirmation details
GET  /api/production/operations/continuable - Continuable operations
```

#### Batches
```
GET  /api/batches             - List batches
GET  /api/batches/paged       - Paginated batches
GET  /api/batches/{id}        - Batch by ID
GET  /api/batches/{id}/genealogy - Batch traceability
POST /api/batches/{id}/split  - Split batch
POST /api/batches/merge       - Merge batches
POST /api/batches/{id}/approve - Approve batch
POST /api/batches/{id}/reject - Reject batch
POST /api/batches/{id}/adjust-quantity - Adjust quantity
GET  /api/batches/{id}/adjustments - Adjustment history
GET  /api/batches/preview-number - Preview next batch number
```

#### Inventory
```
GET  /api/inventory           - List inventory
GET  /api/inventory/paged     - Paginated inventory
GET  /api/inventory/available - Available for consumption
POST /api/inventory/{id}/block - Block inventory
POST /api/inventory/{id}/unblock - Unblock inventory
POST /api/inventory/{id}/scrap - Scrap inventory
POST /api/inventory/{id}/reserve - Reserve inventory
POST /api/inventory/{id}/release-reservation - Release reservation
POST /api/inventory/receive-material - Receive raw material
```

#### BOM
```
GET  /api/bom/{sku}/requirements - BOM requirements
GET  /api/bom/{sku}/tree      - Full BOM tree
POST /api/bom/validate        - Validate consumption
GET  /api/bom/operation/{id}/suggested-consumption - Suggested materials
POST /api/bom/node            - Create BOM node
PUT  /api/bom/node/{id}       - Update BOM node
DELETE /api/bom/node/{id}     - Delete BOM node
DELETE /api/bom/node/{id}/cascade - Delete with children
```

#### Holds
```
POST /api/holds               - Apply hold
PUT  /api/holds/{id}/release  - Release hold
GET  /api/holds/active        - Active holds
GET  /api/holds/paged         - Paginated holds
GET  /api/holds/count         - Active hold count
GET  /api/holds/check/{type}/{id} - Check if on hold
```

### 7.3 Pagination Parameters

All `/paged` endpoints support:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Zero-indexed page number |
| size | int | 20 | Items per page |
| sortBy | string | varies | Sort field |
| sortDirection | string | DESC | ASC or DESC |
| search | string | - | Text search |
| status | string | - | Status filter |
| type | string | - | Type filter (where applicable) |

---

## 8. Configuration & Seed Data

### 8.1 Configuration Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| process_parameters_config | Parameter min/max validation | operationType, productSku, minValue, maxValue, isRequired |
| batch_number_config | Batch number patterns | prefix, dateFormat, separator, sequenceLength, sequenceReset |
| batch_size_config | Batch size limits | maxBatchSize, minBatchSize, preferredBatchSize |
| quantity_type_config | Quantity precision/rounding | decimalPrecision, roundingRule, minQuantity, maxQuantity |
| equipment_type_config | Equipment type rules | minCapacity, maxCapacity, requiresOperator |
| inventory_form_config | Inventory form properties | tracksTemperature, tracksMoisture, requiresTemperatureControl |

### 8.2 Batch Number Configuration

**Pattern Format:** `{prefix}{separator}{date}{separator}{sequence}`

**Example Configurations:**

| Config | Pattern Example | Reset |
|--------|-----------------|-------|
| DEFAULT | BATCH-20260207-001 | DAILY |
| FURNACE_OPERATION | FURN-20260207-001 | DAILY |
| CASTER_OPERATION | CAST-2602-001 | MONTHLY |
| ROLLING_OPERATION | ROLL-2026-001 | YEARLY |
| SPLIT_BATCH | SPL-20260207-001 | DAILY |
| MERGE_BATCH | MRG-20260207-001 | DAILY |
| RM_RECEIPT_DEFAULT | RCV-20260207-001 | DAILY |

### 8.3 Process Parameters (Seed Data)

| Operation Type | Parameter | Min | Max | Unit | Required |
|----------------|-----------|-----|-----|------|----------|
| ROLLING | Temperature | 850 | 1100 | °C | Yes |
| ROLLING | Pressure | 50 | 200 | bar | Yes |
| ROLLING | Speed | 5 | 50 | m/min | No |
| ROLLING | Thickness | 0.5 | 25 | mm | No |
| FURNACE | Temperature | 1200 | 1650 | °C | Yes |
| FURNACE | HoldingTime | 30 | 240 | min | Yes |
| FURNACE | OxygenLevel | 1 | 5 | % | No |
| CASTER | CastingSpeed | 0.5 | 2.5 | m/min | Yes |
| CASTER | MoldTemperature | 150 | 300 | °C | No |
| CASTER | CoolingWaterFlow | 100 | 500 | L/min | No |

### 8.4 Batch Size Configuration (Seed Data)

| Operation Type | Min | Max | Preferred | Unit |
|----------------|-----|-----|-----------|------|
| MELTING | 10 | 50 | 40 | T |
| CASTING | 5 | 25 | 20 | T |
| ROLLING | 2 | 15 | 10 | T |
| ANNEALING | 5 | 30 | 25 | T |
| FINISHING | 1 | 10 | 8 | T |

### 8.5 Master Data (Seed Data)

**Equipment (8 items):**
- EAF-001 (Electric Arc Furnace)
- EAF-002 (Electric Arc Furnace)
- CC-001 (Continuous Caster)
- HRM-001, HRM-002 (Hot Rolling Mill)
- CRM-001 (Cold Rolling Mill)
- TF-001 (Tempering Furnace)
- SL-001 (Slitting Line)

**Operators (5 items):**
- OP-001 to OP-005 (Production department, Day/Night shifts)

**Materials (10 items):**
- Steel Scrap A/B (RM)
- Iron Ore Pellets (RM)
- Limestone (RM)
- FeSi (RM)
- Liquid Steel (IM)
- Billets, Slabs (IM)
- HR Coil, CR Sheet (FG)

**Products (10 items):**
- HR Coil 2-4mm, CR Sheet 1-2mm
- Steel Billets, Steel Slabs
- Wire Rod, Rebars

### 8.6 Units of Measure

| Type | Units |
|------|-------|
| Weight | KG (base), TONS, LB, G |
| Length | M (base), MM, CM, FT, IN |
| Volume | L (base), M3, GAL |
| Pieces | PCS (base), EA |
| Area | M2 (base) |

---

## 9. Audit & Traceability Coverage

### 9.1 Audit Trail Entity

```sql
CREATE TABLE audit_trail (
    audit_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    field_name VARCHAR(100),         -- Specific field (null for entity-level)
    old_value TEXT,                   -- Previous value
    new_value TEXT,                   -- New value
    action VARCHAR(20) NOT NULL,      -- Action type
    changed_by VARCHAR(100) NOT NULL, -- User
    timestamp TIMESTAMP NOT NULL      -- When
);
```

### 9.2 Tracked Actions

| Action | Description |
|--------|-------------|
| CREATE | New record created |
| UPDATE | Field value changed |
| DELETE | Record deleted |
| STATUS_CHANGE | Status modified |
| CONSUME | Material consumed |
| PRODUCE | Batch produced |
| HOLD | Hold applied |
| RELEASE | Hold released |
| BATCH_NUMBER_GENERATED | Batch number assigned |

### 9.3 Tracked Entity Types

- PRODUCTION_CONFIRMATION
- OPERATION
- PROCESS
- INVENTORY
- BATCH
- BATCH_RELATION
- ORDER
- ORDER_LINE
- EQUIPMENT
- HOLD_RECORD

### 9.4 Field-Level Auditing (GAP-007)

The `FieldChangeAuditService` provides:
- Automatic old vs new value comparison
- Individual field change logging
- Support for BigDecimal, LocalDateTime, String types
- Exclusion of system fields (createdOn, updatedOn, etc.)

### 9.5 Audit API Endpoints

```
GET /api/audit/entity/{type}/{id}    - Entity history
GET /api/audit/recent?limit=50       - Recent activity
GET /api/audit/user/{username}       - User activity
GET /api/audit/range?start=...&end=... - Date range
GET /api/audit/summary               - Today's count + recent
GET /api/audit/entity-types          - Valid entity types
GET /api/audit/action-types          - Valid action types
```

### 9.6 Batch Genealogy Traceability

**Forward Tracing:** Source materials → Final product
- Follow child_batch_id in batch_relations

**Backward Tracing:** Final product → Source materials
- Follow parent_batch_id in batch_relations

**API Endpoint:**
```
GET /api/batches/{id}/genealogy
```

**Response:**
```json
{
  "batch": { ... },
  "parentBatches": [
    { "batchId": 2, "batchNumber": "...", "relationType": "TRANSFORM", "quantityConsumed": 100 }
  ],
  "childBatches": [
    { "batchId": 3, "batchNumber": "...", "relationType": "TRANSFORM", "quantity": 450 }
  ],
  "productionInfo": {
    "operationId": 1,
    "operationName": "Melting",
    "processName": "Steel Production",
    "productionDate": "2026-02-07T10:30:00"
  }
}
```

---

## 10. Explicit Limitations & Gaps

### 10.1 Known Limitations

| Area | Limitation |
|------|------------|
| Authentication | Single role (admin) - no RBAC |
| Multi-tenancy | Not supported |
| Real-time updates | No WebSocket/SSE - polling required |
| File attachments | Not implemented |
| Reporting | No report generation |
| Notifications | No email/SMS notifications |
| Scheduling | No production scheduling module |
| Mobile | No mobile-optimized UI |
| Localization | English only |
| Timezone | Server timezone only |

### 10.2 Implementation Gaps

| Gap ID | Description | Status |
|--------|-------------|--------|
| GAP-001 | Multi-Order Batch Confirmation | Implemented (BatchOrderAllocation) |
| GAP-002 | Batch Split/Merge Approval | Partially implemented |
| GAP-003 | Dynamic Process Parameters | Implemented |
| GAP-004 | BOM Suggested Consumption | Implemented |
| GAP-005 | Configurable Batch Numbering | Implemented |
| GAP-006 | Routing Step Batch Behavior | Implemented (allowsSplit, allowsMerge) |
| GAP-007 | Field-Level Audit Trail | Implemented |
| GAP-010 | BLOCKED/SCRAPPED Inventory | Implemented |
| GAP-013 | Audit Trail API | Implemented |

### 10.3 Missing Features

| Feature | Description |
|---------|-------------|
| Rework handling | No dedicated rework workflow |
| Scrap recovery | Manual batch adjustment only |
| Equipment calibration | No calibration tracking |
| Operator certification | No skill/certification management |
| SPC (Statistical Process Control) | No statistical analysis |
| OEE (Overall Equipment Effectiveness) | No OEE calculation |
| Work order scheduling | Manual operation sequencing only |
| Capacity planning | Not implemented |
| MRP (Material Requirements Planning) | Not implemented |

---

## 11. Architectural Observations

### 11.1 Design Patterns

| Pattern | Usage |
|---------|-------|
| Repository Pattern | Spring Data JPA repositories |
| Service Layer | Business logic in @Service classes |
| DTO Pattern | API request/response separation |
| State Machine | Centralized InventoryStateValidator |
| Audit Trail | Automatic change logging |
| Soft Delete | Status-based deletion (CANCELLED, INACTIVE, SCRAPPED) |

### 11.2 Design-Time vs Runtime

**Design-Time (Templates):**
- Process definitions
- Routing with steps
- BOM structures
- Process parameter configurations

**Runtime (Execution):**
- Operations linked to OrderLineItem
- ProductionConfirmation records
- Batch genealogy
- Inventory movements

### 11.3 Key Architectural Decisions

1. **Hash-based routing** (`useHash: true`) for Angular SPA
2. **PostgreSQL only** - no H2/in-memory for testing
3. **SQL Patch System** for schema management (32 patches)
4. **JWT Authentication** with refresh token support
5. **Module-based Angular** (not standalone components)
6. **Server-side pagination** for all list endpoints
7. **Soft delete** for most entities (status-based)
8. **JSONB fields** for flexible data (process_parameters, rm_consumed)

### 11.4 Database Schema Statistics

| Category | Count |
|----------|-------|
| Core Entity Tables | 22 |
| Configuration Tables | 10 |
| Lookup/Master Tables | 9 |
| Attribute Tables | 7 |
| Production Tracking | 3 |
| Routing Tables | 3 |
| **Total Tables** | **54** |
| **SQL Patches** | **32** |

---

## 12. Summary Matrix

### 12.1 Entity Status Matrix

| Entity | Statuses | Terminal States |
|--------|----------|-----------------|
| Order | CREATED, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD | COMPLETED |
| OrderLineItem | CREATED, READY, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD | COMPLETED |
| Operation | NOT_STARTED, READY, IN_PROGRESS, PARTIALLY_CONFIRMED, CONFIRMED, BLOCKED, ON_HOLD | CONFIRMED |
| Batch | QUALITY_PENDING, AVAILABLE, PRODUCED, CONSUMED, BLOCKED, SCRAPPED, ON_HOLD | CONSUMED, SCRAPPED |
| Inventory | AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD | CONSUMED, SCRAPPED |
| Equipment | AVAILABLE, IN_USE, MAINTENANCE, ON_HOLD, UNAVAILABLE | UNAVAILABLE |
| Process | DRAFT, ACTIVE, INACTIVE, SUPERSEDED | - |
| Routing | DRAFT, ACTIVE, INACTIVE, ON_HOLD | - |
| ProductionConfirmation | CONFIRMED, PARTIALLY_CONFIRMED, REJECTED, PENDING_REVIEW | CONFIRMED, REJECTED |
| HoldRecord | ACTIVE, RELEASED | RELEASED |

### 12.2 API Coverage Matrix

| Domain | List | Paged | CRUD | Status Change | Special |
|--------|------|-------|------|---------------|---------|
| Orders | ✓ | ✓ | ✓ | ✓ | Line item management |
| Operations | ✓ | - | - | ✓ | Block/unblock |
| Batches | ✓ | ✓ | ✓ | ✓ | Split, merge, approve, reject, adjust |
| Inventory | ✓ | ✓ | ✓ | ✓ | Block, unblock, scrap, reserve, receive |
| Equipment | ✓ | ✓ | ✓ | ✓ | Maintenance, hold, release |
| Holds | ✓ | ✓ | - | ✓ | Apply, release |
| Customers | ✓ | ✓ | ✓ | - | - |
| Materials | ✓ | ✓ | ✓ | - | - |
| Products | ✓ | ✓ | ✓ | - | - |
| BOM | ✓ | - | ✓ | - | Tree, validate, suggested |
| Routing | ✓ | - | ✓ | ✓ | Activate, hold, release, reorder |
| Processes | ✓ | ✓ | ✓ | ✓ | Activate, deactivate |
| Users | ✓ | ✓ | ✓ | ✓ | Password management |
| Config | ✓ | ✓ | ✓ | - | All 6 config types |
| Audit | - | - | - | - | Query endpoints |

### 12.3 Validation Rule Count

| Domain | Rules |
|--------|-------|
| Production Confirmation | 7 |
| Batch Operations | 15 |
| Inventory Operations | 7 |
| Order Management | 7 |
| Equipment Management | 8 |
| Routing Management | 6 |
| **Total** | **~50** |

### 12.4 Feature Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Order Management | ✓ Complete | Full CRUD with line items |
| Production Confirmation | ✓ Complete | With partial confirmation |
| Batch Traceability | ✓ Complete | Split, merge, genealogy |
| Inventory Management | ✓ Complete | All state transitions |
| Equipment Management | ✓ Complete | Maintenance, holds |
| Hold Management | ✓ Complete | Multi-entity support |
| Quality Approval | ✓ Complete | Batch approval workflow |
| Process Parameters | ✓ Complete | Dynamic validation |
| Batch Numbering | ✓ Complete | Configurable patterns |
| BOM Management | ✓ Complete | Hierarchical tree |
| Audit Trail | ✓ Complete | Field-level tracking |
| Server Pagination | ✓ Complete | All list endpoints |
| User Management | ✓ Complete | Basic auth, password |
| Master Data CRUD | ✓ Complete | Customers, materials, products |
| Configuration CRUD | ✓ Complete | All 6 config types |

---

## Document Information

**Generated From:** bluemingo-poc codebase analysis
**Entities Analyzed:** 43 JPA entities
**Controllers Analyzed:** 24 REST controllers
**Database Tables:** 54 tables across 32 SQL patches
**API Endpoints:** ~247 endpoints

**Analysis Tools Used:**
- Entity file exploration
- Service validation extraction
- Controller endpoint mapping
- SQL patch documentation

---

*End of Document*
