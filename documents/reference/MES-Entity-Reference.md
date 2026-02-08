# MES Entity Reference

**Generated:** February 2026
**Source:** JPA Entity Analysis

---

## Entity Summary

The MES system contains **43 JPA entities** organized into the following domains:

---

## AUTHENTICATION & USER MANAGEMENT

### User
**Table:** `users`
**Purpose:** Authentication and user account management

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| userId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| email | String | @Column(nullable=false, unique=true) | Login email |
| passwordHash | String | @Column(nullable=false) | Hashed password |
| name | String | @Column(nullable=false) | User full name |
| employeeId | String | | Employee reference |
| status | String | @Column(nullable=false) | Account status (default: ACTIVE) |
| createdOn | LocalDateTime | @PrePersist | Auto-set on creation |
| createdBy | String | | User who created record |
| updatedOn | LocalDateTime | @PreUpdate | Auto-set on update |
| updatedBy | String | | User who last updated |

**Status Values:** ACTIVE, INACTIVE

---

## ORDERS & LINE ITEMS

### Order
**Table:** `orders`
**Purpose:** Customer orders containing products and operations

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| orderId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| orderNumber | String | @Column(unique=true) | Unique order identifier |
| customerId | String | | Customer legacy ID |
| customerName | String | | Customer name snapshot |
| customer | Customer | @ManyToOne(LAZY), @JoinColumn(customer_ref_id) | FK to Customer entity |
| orderDate | LocalDate | @Column(nullable=false) | Order creation date |
| status | String | @Column(nullable=false) | Order status (default: CREATED) |
| lineItems | List<OrderLineItem> | @OneToMany(mappedBy=order, CASCADE) | Child line items |
| createdOn | LocalDateTime | @PrePersist | Auto-set on creation |
| createdBy | String | | Created by user |
| updatedOn | LocalDateTime | @PreUpdate | Auto-set on update |
| updatedBy | String | | Updated by user |

**Status Values:** CREATED, READY, IN_PROGRESS, COMPLETED, ON_HOLD, BLOCKED

### OrderLineItem
**Table:** `order_line_items`
**Purpose:** Products within an order with quantity and delivery details

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| orderLineId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| order | Order | @ManyToOne(LAZY), @JoinColumn(nullable=false) | FK to parent Order |
| productSku | String | @Column(nullable=false) | Product SKU reference |
| productName | String | | Product name snapshot |
| quantity | BigDecimal | @Column(nullable=false, precision=15,scale=4) | Order quantity |
| unit | String | @Column(nullable=false) | Unit of measure (default: T) |
| deliveryDate | LocalDate | | Expected delivery date |
| status | String | @Column(nullable=false) | Line item status (default: CREATED) |
| operations | List<Operation> | @OneToMany(mappedBy=orderLineItem, CASCADE) | Child operations |

**Status Values:** CREATED, READY, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD

---

## PRODUCTION EXECUTION

### Operation (RUNTIME Entity)
**Table:** `operations`
**Purpose:** Runtime execution instance of a production step (created from RoutingStep + OperationTemplate)

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| operationId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| process | Process | @ManyToOne(LAZY) | TEMPLATE: FK to Process |
| orderLineItem | OrderLineItem | @ManyToOne(LAZY) | RUNTIME: FK to OrderLineItem |
| routingStepId | Long | | TEMPLATE GENEALOGY: Which step created this |
| operationTemplateId | Long | | TEMPLATE GENEALOGY: Which template defined this (NEW) |
| operationName | String | @Column(nullable=false) | Copied from OperationTemplate |
| operationCode | String | | Copied from OperationTemplate |
| operationType | String | | Type of operation (FURNACE, CASTER, ROLLING, etc.) |
| sequenceNumber | Integer | @Column(nullable=false) | Execution order (default: 1) |
| status | String | @Column(nullable=false) | Operation status (default: NOT_STARTED) |
| targetQty | BigDecimal | @Column(precision=15,scale=4) | Target output quantity |
| confirmedQty | BigDecimal | @Column(precision=15,scale=4) | Confirmed quantity |
| startTime | LocalDateTime | | Execution start (NEW) |
| endTime | LocalDateTime | | Execution end (NEW) |
| blockReason | String | @Column(length=500) | Reason for blocking |
| blockedBy | String | | User who blocked |
| blockedOn | LocalDateTime | | Block timestamp |
| confirmations | List<ProductionConfirmation> | @OneToMany(mappedBy=operation, CASCADE) | Production confirmations |

**Status Values:** NOT_STARTED, READY, IN_PROGRESS, CONFIRMED, PARTIALLY_CONFIRMED, ON_HOLD, BLOCKED

**Important:** Operations are automatically created when OrderLineItems are processed. Users cannot manually create/edit/delete operations.

### ProductionConfirmation
**Table:** `production_confirmation`
**Purpose:** Records production data capture (materials consumed, output produced, parameters)

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| confirmationId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| operation | Operation | @ManyToOne(LAZY), @JoinColumn(nullable=false) | FK to Operation |
| producedQty | BigDecimal | @Column(nullable=false, precision=15,scale=4) | Output quantity |
| scrapQty | BigDecimal | @Column(precision=15,scale=4) | Scrap quantity (default: 0) |
| startTime | LocalDateTime | @Column(nullable=false) | Production start |
| endTime | LocalDateTime | @Column(nullable=false) | Production end |
| delayMinutes | Integer | | Production delay in minutes (default: 0) |
| delayReason | String | | Reason for delay |
| processParametersJson | String | @Column(columnDefinition=CLOB) | JSON: {"param1": value, ...} |
| rmConsumedJson | String | @Column(columnDefinition=CLOB) | JSON: consumed materials |
| equipment | Set<Equipment> | @ManyToMany, @JoinTable | Associated equipment |
| operators | Set<Operator> | @ManyToMany, @JoinTable | Associated operators |
| notes | String | @Column(length=1000) | Free-form notes |
| status | String | @Column(nullable=false) | Confirmation status (default: CONFIRMED) |
| rejectionReason | String | @Column(length=500) | Reason if rejected |
| rejectedBy | String | | User who rejected |
| rejectedOn | LocalDateTime | | Rejection timestamp |

**Status Values:** CONFIRMED, REJECTED, PARTIALLY_CONFIRMED, PENDING_REVIEW

---

## PROCESS & ROUTING

### Process
**Table:** `processes`
**Purpose:** Design-time process template (not runtime execution)

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| processId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| processName | String | @Column(nullable=false, length=100) | Process description |
| status | ProcessStatus | @Enumerated(STRING) | Template status |
| operations | List<Operation> | @OneToMany(mappedBy=process, CASCADE) | Design-time operations |

**ProcessStatus Enum:** DRAFT, ACTIVE, INACTIVE

### Routing
**Table:** `routing`
**Purpose:** Defines sequence of operations for a Process

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| routingId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| process | Process | @ManyToOne(LAZY) | FK to Process |
| routingName | String | @Column(nullable=false, length=100) | Routing description |
| routingType | String | @Column(nullable=false, length=20) | SEQUENTIAL or PARALLEL |
| status | String | @Column(nullable=false) | Routing status (default: ACTIVE) |
| routingSteps | List<RoutingStep> | @OneToMany(mappedBy=routing, CASCADE) | Steps in order |

**Status Values:** DRAFT, ACTIVE, INACTIVE, ON_HOLD

### OperationTemplate (NEW - Design-Time)
**Table:** `operation_templates`
**Purpose:** Reusable operation definition for use in routing steps

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| operationTemplateId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| operationName | String | @Column(nullable=false, length=100) | Operation description |
| operationCode | String | @Column(length=50) | Unique operation code |
| operationType | String | @Column(nullable=false, length=50) | Type (FURNACE, CASTER, ROLLING, etc.) |
| quantityType | String | @Column(length=20) | DISCRETE, BATCH, CONTINUOUS |
| defaultEquipmentType | String | @Column(length=50) | Suggested equipment type |
| description | String | @Column(length=500) | Detailed description |
| estimatedDurationMinutes | Integer | | Expected execution time |
| status | String | @Column(nullable=false) | Template status (default: ACTIVE) |

**Status Values:** ACTIVE, INACTIVE

**Usage:** Referenced by RoutingSteps, used to instantiate Operations.

### RoutingStep
**Table:** `routing_steps`
**Purpose:** Individual step within a routing sequence (DESIGN-TIME ONLY)

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| routingStepId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| routing | Routing | @ManyToOne(LAZY), @JoinColumn(nullable=false) | FK to parent Routing |
| operationTemplate | OperationTemplate | @ManyToOne(LAZY) | FK to OperationTemplate (NEW) |
| sequenceNumber | Integer | @Column(nullable=false) | Execution order |
| isParallel | Boolean | | Can run in parallel (default: false) |
| mandatoryFlag | Boolean | | Must be executed (default: true) |
| status | String | @Column(nullable=false) | Template status (default: ACTIVE) |
| producesOutputBatch | Boolean | | Generates output batch (default: true) |
| allowsSplit | Boolean | | Split operation allowed (default: false) |
| allowsMerge | Boolean | | Merge operation allowed (default: false) |
| operationName | String | @Column(length=100) | Legacy: Template operation name |
| operationType | String | @Column(length=50) | Legacy: Template operation type |
| estimatedDurationMinutes | Integer | | Expected execution time |

**Status Values:** ACTIVE, INACTIVE (template lifecycle, NOT runtime execution)

**Important:** RoutingStep does NOT reference runtime Operations. Operations reference RoutingStep for genealogy tracking (one-way relationship).

---

## INVENTORY & BATCHES

### Inventory
**Table:** `inventory`
**Purpose:** Material at a location with state tracking

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| inventoryId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| materialId | String | @Column(nullable=false) | Material identifier |
| materialName | String | | Material name snapshot |
| inventoryType | String | @Column(nullable=false) | RM, IM, FG, WIP |
| inventoryForm | String | | Physical form (powder, liquid, solid) |
| state | String | @Column(nullable=false) | Inventory state (default: AVAILABLE) |
| quantity | BigDecimal | @Column(nullable=false, precision=15,scale=4) | Current quantity |
| unit | String | @Column(nullable=false) | Unit of measure (default: T) |
| batch | Batch | @ManyToOne(LAZY) | FK to source Batch |
| location | String | | Storage location |
| currentTemperature | BigDecimal | @Column(precision=10,scale=2) | Current temperature |
| moistureContent | BigDecimal | @Column(precision=5,scale=2) | Moisture percentage |
| density | BigDecimal | @Column(precision=10,scale=4) | Material density |
| blockReason | String | @Column(length=500) | Reason for blocking |
| scrapReason | String | @Column(length=500) | Reason for scrapping |
| reservedForOrderId | Long | | Order this is reserved for |
| reservedForOperationId | Long | | Operation this is reserved for |
| reservedQty | BigDecimal | @Column(precision=15,scale=4) | Quantity reserved |

**State Values:** AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD

### Batch
**Table:** `batches`
**Purpose:** Trackable unit of material with genealogy

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| batchId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| batchNumber | String | @Column(nullable=false, unique=true) | Auto-generated batch ID |
| materialId | String | @Column(nullable=false) | Material identifier |
| materialName | String | | Material name snapshot |
| quantity | BigDecimal | @Column(nullable=false, precision=15,scale=4) | Total quantity |
| unit | String | @Column(nullable=false) | Unit of measure (default: T) |
| generatedAtOperationId | Long | | Operation that created this batch |
| status | String | @Column(nullable=false) | Batch status (default: QUALITY_PENDING) |
| approvedBy | String | | User who approved quality |
| approvedOn | LocalDateTime | | Quality approval timestamp |
| rejectionReason | String | @Column(length=500) | Quality rejection reason |
| createdVia | String | @Column(length=50) | PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT |
| supplierBatchNumber | String | @Column(length=100) | Supplier reference for RM |
| supplierId | String | @Column(length=50) | Supplier identifier |
| receivedDate | LocalDate | | Raw material receipt date |

**Status Values:** QUALITY_PENDING, AVAILABLE, PRODUCED, CONSUMED, BLOCKED, SCRAPPED, ON_HOLD

### BatchRelation
**Table:** `batch_relations`
**Purpose:** Parent-child batch relationships for genealogy tracing

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| relationId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| parentBatch | Batch | @ManyToOne(LAZY), @JoinColumn(nullable=false) | Source batch |
| childBatch | Batch | @ManyToOne(LAZY), @JoinColumn(nullable=false) | Result batch |
| operationId | Long | | Operation that created relation |
| relationType | String | @Column(nullable=false) | MERGE, SPLIT, CONSUME, PRODUCE |
| quantityConsumed | BigDecimal | @Column(nullable=false, precision=15,scale=4) | Amount transferred |
| status | String | @Column(nullable=false) | Relation status (default: ACTIVE) |

### BatchQuantityAdjustment
**Table:** `batch_quantity_adjustments`
**Purpose:** Audit trail for batch quantity changes

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| adjustmentId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| batch | Batch | @ManyToOne(LAZY), @JoinColumn(nullable=false) | Batch being adjusted |
| oldQuantity | BigDecimal | @Column(nullable=false, precision=15,scale=4) | Previous quantity |
| newQuantity | BigDecimal | @Column(nullable=false, precision=15,scale=4) | New quantity |
| adjustmentReason | String | @Column(nullable=false, length=500) | Mandatory reason |
| adjustmentType | String | @Column(nullable=false, length=50) | Type of adjustment |
| adjustedBy | String | @Column(nullable=false, length=100) | User who adjusted |
| adjustedOn | LocalDateTime | | Adjustment timestamp |

**Adjustment Types:** CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY, SYSTEM

---

## EQUIPMENT & OPERATORS

### Equipment
**Table:** `equipment`
**Purpose:** Machines/equipment used in production

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| equipmentId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| equipmentCode | String | @Column(nullable=false, unique=true) | Equipment identifier |
| name | String | @Column(nullable=false) | Equipment name |
| equipmentType | String | @Column(nullable=false) | Type classification (default: BATCH) |
| capacity | BigDecimal | @Column(precision=15,scale=4) | Equipment capacity |
| capacityUnit | String | | Capacity unit (T, L, PCS) |
| location | String | | Equipment location |
| status | String | @Column(nullable=false) | Equipment status (default: AVAILABLE) |
| maintenanceReason | String | @Column(length=500) | Current maintenance reason |
| maintenanceStart | LocalDateTime | | Maintenance start time |
| holdReason | String | @Column(length=500) | Hold reason |
| holdStart | LocalDateTime | | Hold start time |

**Status Values:** AVAILABLE, IN_USE, MAINTENANCE, ON_HOLD, UNAVAILABLE

### Operator
**Table:** `operators`
**Purpose:** Personnel who operate equipment during production

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| operatorId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| operatorCode | String | @Column(nullable=false, unique=true) | Operator badge number |
| name | String | @Column(nullable=false) | Operator full name |
| department | String | | Department assignment |
| shift | String | | Shift assignment |
| status | String | @Column(nullable=false) | Operator status (default: ACTIVE) |

**Status Values:** ACTIVE, INACTIVE

---

## HOLDS & BLOCKING

### HoldRecord
**Table:** `hold_records`
**Purpose:** Temporary holds on entities

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| holdId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| entityType | String | @Column(nullable=false) | Type of entity held |
| entityId | Long | @Column(nullable=false) | ID of entity held |
| reason | String | @Column(nullable=false) | Hold reason |
| comments | String | @Column(columnDefinition=TEXT) | Additional context |
| appliedBy | String | @Column(nullable=false) | User applying hold |
| appliedOn | LocalDateTime | @Column(nullable=false) | Hold timestamp |
| releasedBy | String | | User releasing hold |
| releasedOn | LocalDateTime | | Release timestamp |
| releaseComments | String | @Column(columnDefinition=TEXT) | Release notes |
| status | String | @Column(nullable=false) | Hold status (default: ACTIVE) |

**Entity Types:** OPERATION, PROCESS, ORDER_LINE, INVENTORY, BATCH, EQUIPMENT
**Status Values:** ACTIVE, RELEASED

### HoldReason
**Table:** `hold_reasons`
**Purpose:** Predefined hold reason codes

| Field | Type | Annotations | Purpose |
|-------|------|-------------|---------|
| reasonId | Long | @Id, @GeneratedValue(IDENTITY) | Primary Key |
| reasonCode | String | @Column(nullable=false, unique=true, length=50) | Code (e.g., QI_001) |
| reasonDescription | String | @Column(nullable=false, length=255) | Description |
| applicableTo | String | @Column(length=100) | Applicable entity types |
| status | String | @Column(nullable=false, length=20) | Reason status (default: ACTIVE) |

---

## CONFIGURATION ENTITIES

### ProcessParametersConfig
**Table:** `process_parameters_config`
**Purpose:** Defines dynamic process parameters with validation ranges

| Field | Type | Purpose |
|-------|------|---------|
| configId | Long | Primary Key |
| operationType | String | Operation type |
| productSku | String | Product-specific config |
| parameterName | String | Parameter name |
| parameterType | String | DECIMAL, INTEGER, STRING |
| unit | String | Unit of measure |
| minValue | BigDecimal | Minimum allowed value |
| maxValue | BigDecimal | Maximum allowed value |
| defaultValue | BigDecimal | Default value |
| isRequired | Boolean | Must be provided |
| displayOrder | Integer | UI display order |

### BatchNumberConfig
**Table:** `batch_number_config`
**Purpose:** Configurable batch number generation patterns

| Field | Type | Purpose |
|-------|------|---------|
| configId | Long | Primary Key |
| configName | String | Config identifier |
| operationType | String | Operation-specific config |
| productSku | String | Product-specific config |
| prefix | String | Prefix (e.g., BATCH, FURN) |
| separator | String | Separator char (-, /) |
| dateFormat | String | Date format (yyyyMMdd) |
| sequenceLength | Integer | Zero-padded sequence length |
| sequenceReset | String | Reset frequency (DAILY, MONTHLY, YEARLY, NEVER) |

### BatchSizeConfig
**Table:** `batch_size_config`
**Purpose:** Batch size limits for multi-batch production

| Field | Type | Purpose |
|-------|------|---------|
| configId | Long | Primary Key |
| materialId | String | Material-specific config |
| operationType | String | Operation-specific config |
| productSku | String | Product-specific config |
| minBatchSize | BigDecimal | Minimum batch size |
| maxBatchSize | BigDecimal | Maximum batch size |
| preferredBatchSize | BigDecimal | Optimal batch size |
| unit | String | Unit of measure |

### QuantityTypeConfig
**Table:** `quantity_type_config`
**Purpose:** Quantity precision and rounding rules

| Field | Type | Purpose |
|-------|------|---------|
| configId | Long | Primary Key |
| configName | String | Config identifier |
| materialCode | String | Material-specific config |
| operationType | String | Operation-specific config |
| quantityType | String | DECIMAL or INTEGER |
| decimalPrecision | Integer | Number of decimal places |
| roundingRule | String | HALF_UP, HALF_DOWN, CEILING, FLOOR |
| minQuantity | BigDecimal | Minimum allowed quantity |
| maxQuantity | BigDecimal | Maximum allowed quantity |

---

## MASTER DATA ENTITIES

### Customer
**Table:** `customers`
**Purpose:** Customer master data

| Field | Type | Purpose |
|-------|------|---------|
| customerId | Long | Primary Key |
| customerCode | String | Customer identifier |
| customerName | String | Customer name |
| contactPerson | String | Primary contact name |
| email | String | Contact email |
| phone | String | Contact phone |
| address | String | Customer address |
| city | String | City |
| country | String | Country |
| status | String | ACTIVE, INACTIVE |

### Material
**Table:** `materials`
**Purpose:** Material master data

| Field | Type | Purpose |
|-------|------|---------|
| materialId | Long | Primary Key |
| materialCode | String | Material identifier |
| materialName | String | Material description |
| materialType | String | RM, IM, FG, WIP |
| baseUnit | String | Default unit |
| materialGroup | String | Material group |
| standardCost | BigDecimal | Cost per unit |
| minStockLevel | BigDecimal | Reorder warning level |
| maxStockLevel | BigDecimal | Maximum inventory |
| status | String | ACTIVE, INACTIVE, OBSOLETE |

### Product
**Table:** `products`
**Purpose:** Product master data

| Field | Type | Purpose |
|-------|------|---------|
| productId | Long | Primary Key |
| sku | String | Product SKU |
| productName | String | Product name |
| productCategory | String | Category classification |
| baseUnit | String | Unit |
| standardPrice | BigDecimal | Price per unit |
| minOrderQty | BigDecimal | Minimum order quantity |
| leadTimeDays | Integer | Delivery lead time |
| status | String | ACTIVE, INACTIVE, DISCONTINUED |

### BillOfMaterial
**Table:** `bill_of_material`
**Purpose:** Hierarchical BOM tree

| Field | Type | Purpose |
|-------|------|---------|
| bomId | Long | Primary Key |
| productSku | String | Product identifier |
| bomVersion | String | BOM version |
| materialId | String | Material required |
| quantityRequired | BigDecimal | Amount needed |
| yieldLossRatio | BigDecimal | Yield loss factor |
| sequenceLevel | Integer | Tree depth |
| parentBomId | Long | Parent BOM node ID |
| status | String | ACTIVE, INACTIVE, DRAFT |

---

## AUDIT & SYSTEM

### AuditTrail
**Table:** `audit_trail`
**Purpose:** Complete audit history of all system changes

| Field | Type | Purpose |
|-------|------|---------|
| auditId | Long | Primary Key |
| entityType | String | Type of entity changed |
| entityId | Long | ID of changed entity |
| fieldName | String | Specific field changed |
| oldValue | String | Previous value |
| newValue | String | New value |
| action | String | Action type |
| changedBy | String | User making change |
| timestamp | LocalDateTime | Change timestamp |

**Action Types:** CREATE, UPDATE, DELETE, STATUS_CHANGE, CONSUME, PRODUCE, HOLD, RELEASE

### DatabasePatch
**Table:** `database_patches`
**Purpose:** Tracks applied SQL patch files

| Field | Type | Purpose |
|-------|------|---------|
| id | Long | Primary Key |
| patchNumber | Integer | Patch sequence |
| patchName | String | Patch description |
| fileName | String | SQL file name |
| appliedOn | LocalDateTime | Application timestamp |
| success | Boolean | Application successful |

---

## ENTITY COUNT BY DOMAIN

| Domain | Count | Entities |
|--------|-------|----------|
| Orders & Line Items | 2 | Order, OrderLineItem |
| Production Execution | 2 | Operation, ProductionConfirmation |
| Process & Routing | 3 | Process, Routing, RoutingStep |
| Inventory & Batches | 5 | Inventory, Batch, BatchRelation, BatchQuantityAdjustment, BatchOrderAllocation |
| Production Materials | 3 | ConsumedMaterial, ProducedOutput, BillOfMaterial |
| Equipment & Operations | 3 | Equipment, Operator, OperationEquipmentUsage |
| Holds & Blocking | 2 | HoldRecord, HoldReason |
| Configuration | 4 | ProcessParametersConfig, BatchNumberConfig, BatchSizeConfig, QuantityTypeConfig |
| Master Data | 4 | Customer, Material, Product, DelayReason |
| Organizational | 6 | Department, Shift, Location, MaterialGroup, ProductCategory, ProductGroup |
| Audit & System | 3 | AuditTrail, DatabasePatch, User |
| **Total** | **43** | |

---

*End of Entity Reference*
