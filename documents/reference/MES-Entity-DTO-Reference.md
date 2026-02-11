# MES Entity & DTO Reference

**Generated:** 2026-02-10
**Package:** `com.mes.production`
**Framework:** Spring Boot 3.2 / JPA (Hibernate) / Java 17

## Summary

| Category | Count |
|----------|-------|
| JPA Entities | 44 |
| Enums | 2 |
| DTO Classes (top-level) | 34 |
| Nested DTO Classes | 80+ |
| Total Types | 160+ |

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [Order Management](#2-order-management)
3. [Production](#3-production)
4. [Inventory & Batches](#4-inventory--batches)
5. [Equipment & Operators](#5-equipment--operators)
6. [Routing & Templates](#6-routing--templates)
7. [Configuration](#7-configuration)
8. [Master Data](#8-master-data)
9. [Tracking & Audit](#9-tracking--audit)
10. [Bill of Materials](#10-bill-of-materials)
11. [Enums](#11-enums)
12. [DTOs](#12-dtos)
13. [Relationship Diagram](#13-relationship-diagram)
14. [Validation Summary](#14-validation-summary)

---

# ENTITIES

All entities use Lombok annotations: `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`.

---

## 1. Authentication

### 1.1 User

**Class:** `com.mes.production.entity.User`
**Table:** `users`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| userId | Long | `user_id` | `@Id @GeneratedValue(IDENTITY)` |
| email | String | `email` | `nullable=false, unique=true` |
| passwordHash | String | `password_hash` | `nullable=false` |
| name | String | `name` | `nullable=false` |
| employeeId | String | `employee_id` | |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:** None

**Constants:** None (status managed as plain String)

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = "ACTIVE"` if null
- `@PreUpdate`: Sets `updatedOn = now()`

---

## 2. Order Management

### 2.1 Order

**Class:** `com.mes.production.entity.Order`
**Table:** `orders`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| orderId | Long | `order_id` | `@Id @GeneratedValue(IDENTITY)` |
| orderNumber | String | `order_number` | `unique=true` |
| customerId | String | `customer_id` | |
| customerName | String | `customer_name` | |
| customer | Customer | `customer_ref_id` | `@ManyToOne(LAZY)`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` |
| orderDate | LocalDate | `order_date` | `nullable=false` |
| deliveryDate | LocalDate | `delivery_date` | |
| notes | String | `notes` | `length=1000` |
| priority | Integer | `priority` | `nullable=false` |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |
| lineItems | List\<OrderLineItem\> | - | `@OneToMany(mappedBy="order", cascade=ALL, fetch=LAZY)`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` |

**Relationships:**
- `@ManyToOne` -> Customer (via `customer_ref_id`)
- `@OneToMany` -> OrderLineItem (mappedBy `order`)

**Constants:** None (priority: 1=CRITICAL, 2=HIGH, 3=MEDIUM, 4=LOW, 5=BACKLOG)

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `priority = 3`, defaults `status = "CREATED"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 2.2 OrderLineItem

**Class:** `com.mes.production.entity.OrderLineItem`
**Table:** `order_line_items`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| orderLineId | Long | `order_line_id` | `@Id @GeneratedValue(IDENTITY)` |
| order | Order | `order_id` | `@ManyToOne(LAZY)`, `nullable=false`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` |
| productSku | String | `product_sku` | `nullable=false` |
| productName | String | `product_name` | |
| quantity | BigDecimal | `quantity` | `nullable=false, precision=15, scale=4` |
| unit | String | `unit` | `nullable=false` |
| deliveryDate | LocalDate | `delivery_date` | |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |
| processId | Long | `process_id` | Cached from product's default process |
| operations | List\<Operation\> | - | `@OneToMany(mappedBy="orderLineItem", cascade=ALL, fetch=LAZY)`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` |

**Relationships:**
- `@ManyToOne` -> Order (via `order_id`)
- `@OneToMany` -> Operation (mappedBy `orderLineItem`)

**Constants:**
```java
STATUS_CREATED = "CREATED"
STATUS_READY = "READY"
STATUS_IN_PROGRESS = "IN_PROGRESS"
STATUS_COMPLETED = "COMPLETED"
STATUS_BLOCKED = "BLOCKED"
STATUS_ON_HOLD = "ON_HOLD"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = "CREATED"`, defaults `unit = "T"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 2.3 Customer

**Class:** `com.mes.production.entity.Customer`
**Table:** `customers`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| customerId | Long | `customer_id` | `@Id @GeneratedValue(IDENTITY)` |
| customerCode | String | `customer_code` | `nullable=false, unique=true, length=50` |
| customerName | String | `customer_name` | `nullable=false, length=200` |
| contactPerson | String | `contact_person` | `length=100` |
| email | String | `email` | `length=100` |
| phone | String | `phone` | `length=50` |
| address | String | `address` | `length=500` |
| city | String | `city` | `length=100` |
| country | String | `country` | `length=100` |
| taxId | String | `tax_id` | `length=50` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Relationships:** None

**Constants:**
```java
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

## 3. Production

### 3.1 Process

**Class:** `com.mes.production.entity.Process`
**Table:** `processes`

Design-time entity only. Runtime execution tracking happens at Operation level.

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| processId | Long | `process_id` | `@Id @GeneratedValue(IDENTITY)` |
| processName | String | `process_name` | `nullable=false, length=100` |
| status | ProcessStatus | `status` | `@Enumerated(STRING), nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |
| operations | List\<Operation\> | - | `@OneToMany(mappedBy="process", cascade=ALL, fetch=LAZY)`, `@OrderBy("sequenceNumber ASC")`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` |

**Relationships:**
- `@OneToMany` -> Operation (mappedBy `process`)

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = ProcessStatus.DRAFT`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 3.2 Operation

**Class:** `com.mes.production.entity.Operation`
**Table:** `operations`

Runtime operation entity. Created automatically when OrderLineItems are instantiated.

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| operationId | Long | `operation_id` | `@Id @GeneratedValue(IDENTITY)` |
| process | Process | `process_id` | `@ManyToOne(LAZY)`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` |
| orderLineItem | OrderLineItem | `order_line_id` | `@ManyToOne(LAZY)`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` |
| routingStepId | Long | `routing_step_id` | Template genealogy reference |
| operationTemplateId | Long | `operation_template_id` | Template genealogy reference |
| operationName | String | `operation_name` | `nullable=false` |
| operationCode | String | `operation_code` | |
| operationType | String | `operation_type` | |
| sequenceNumber | Integer | `sequence_number` | `nullable=false` |
| status | String | `status` | `nullable=false` |
| targetQty | BigDecimal | `target_qty` | `precision=15, scale=4` |
| confirmedQty | BigDecimal | `confirmed_qty` | `precision=15, scale=4` |
| blockReason | String | `block_reason` | `length=500` |
| blockedBy | String | `blocked_by` | |
| blockedOn | LocalDateTime | `blocked_on` | |
| startTime | LocalDateTime | `start_time` | |
| endTime | LocalDateTime | `end_time` | |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |
| confirmations | List\<ProductionConfirmation\> | - | `@OneToMany(mappedBy="operation", cascade=ALL, fetch=LAZY)`, `@ToString.Exclude`, `@EqualsAndHashCode.Exclude` |

**Relationships:**
- `@ManyToOne` -> Process (via `process_id`)
- `@ManyToOne` -> OrderLineItem (via `order_line_id`)
- `@OneToMany` -> ProductionConfirmation (mappedBy `operation`)

**Constants:**
```java
STATUS_NOT_STARTED = "NOT_STARTED"
STATUS_READY = "READY"
STATUS_IN_PROGRESS = "IN_PROGRESS"
STATUS_CONFIRMED = "CONFIRMED"
STATUS_PARTIALLY_CONFIRMED = "PARTIALLY_CONFIRMED"
STATUS_ON_HOLD = "ON_HOLD"
STATUS_PAUSED = "PAUSED"
STATUS_BLOCKED = "BLOCKED"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_NOT_STARTED`, defaults `sequenceNumber = 1`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 3.3 ProductionConfirmation

**Class:** `com.mes.production.entity.ProductionConfirmation`
**Table:** `production_confirmation`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| confirmationId | Long | `confirmation_id` | `@Id @GeneratedValue(IDENTITY)` |
| operation | Operation | `operation_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| producedQty | BigDecimal | `produced_qty` | `nullable=false, precision=15, scale=4` |
| scrapQty | BigDecimal | `scrap_qty` | `precision=15, scale=4` |
| startTime | LocalDateTime | `start_time` | `nullable=false` |
| endTime | LocalDateTime | `end_time` | `nullable=false` |
| delayMinutes | Integer | `delay_minutes` | |
| delayReason | String | `delay_reason` | |
| processParametersJson | String | `process_parameters` | |
| rmConsumedJson | String | `rm_consumed` | |
| equipment | Set\<Equipment\> | - | `@ManyToMany(LAZY)`, join table `confirmation_equipment` |
| operators | Set\<Operator\> | - | `@ManyToMany(LAZY)`, join table `confirmation_operators` |
| notes | String | `notes` | `length=1000` |
| status | String | `status` | `nullable=false` |
| rejectionReason | String | `rejection_reason` | `length=500` |
| rejectedBy | String | `rejected_by` | |
| rejectedOn | LocalDateTime | `rejected_on` | |
| reversedBy | String | `reversed_by` | Added R-13 |
| reversedOn | LocalDateTime | `reversed_on` | Added R-13 |
| reversalReason | String | `reversal_reason` | `length=500`, Added R-13 |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:**
- `@ManyToOne` -> Operation (via `operation_id`)
- `@ManyToMany` -> Equipment (join table `confirmation_equipment`: `confirmation_id` <-> `equipment_id`)
- `@ManyToMany` -> Operator (join table `confirmation_operators`: `confirmation_id` <-> `operator_id`)

**Constants:**
```java
STATUS_CONFIRMED = "CONFIRMED"
STATUS_REJECTED = "REJECTED"
STATUS_PARTIALLY_CONFIRMED = "PARTIALLY_CONFIRMED"
STATUS_PENDING_REVIEW = "PENDING_REVIEW"
STATUS_REVERSED = "REVERSED"   // Added R-13
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_CONFIRMED`, defaults `scrapQty = BigDecimal.ZERO`, defaults `delayMinutes = 0`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 3.4 ConsumedMaterial

**Class:** `com.mes.production.entity.ConsumedMaterial`
**Table:** `consumed_materials`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| consumptionId | Long | `consumption_id` | `@Id @GeneratedValue(IDENTITY)` |
| confirmation | ProductionConfirmation | `confirmation_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| inventory | Inventory | `inventory_id` | `@ManyToOne(LAZY)` |
| batch | Batch | `batch_id` | `@ManyToOne(LAZY)` |
| materialId | String | `material_id` | `nullable=false` |
| materialName | String | `material_name` | |
| quantityConsumed | BigDecimal | `quantity_consumed` | `nullable=false, precision=15, scale=4` |
| unit | String | `unit` | `nullable=false` |
| consumedBy | String | `consumed_by` | |
| consumedOn | LocalDateTime | `consumed_on` | |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |

**Relationships:**
- `@ManyToOne` -> ProductionConfirmation (via `confirmation_id`)
- `@ManyToOne` -> Inventory (via `inventory_id`)
- `@ManyToOne` -> Batch (via `batch_id`)

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, sets `consumedOn = now()`

---

### 3.5 ProducedOutput

**Class:** `com.mes.production.entity.ProducedOutput`
**Table:** `produced_outputs`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| outputId | Long | `output_id` | `@Id @GeneratedValue(IDENTITY)` |
| confirmation | ProductionConfirmation | `confirmation_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| batch | Batch | `batch_id` | `@ManyToOne(LAZY)` |
| inventory | Inventory | `inventory_id` | `@ManyToOne(LAZY)` |
| materialId | String | `material_id` | `nullable=false` |
| materialName | String | `material_name` | |
| quantityProduced | BigDecimal | `quantity_produced` | `nullable=false, precision=15, scale=4` |
| unit | String | `unit` | `nullable=false` |
| isPrimaryOutput | Boolean | `is_primary_output` | |
| outputType | String | `output_type` | |
| producedBy | String | `produced_by` | |
| producedOn | LocalDateTime | `produced_on` | |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |

**Relationships:**
- `@ManyToOne` -> ProductionConfirmation (via `confirmation_id`)
- `@ManyToOne` -> Batch (via `batch_id`)
- `@ManyToOne` -> Inventory (via `inventory_id`)

**Constants:**
```java
OUTPUT_TYPE_GOOD = "GOOD"
OUTPUT_TYPE_SCRAP = "SCRAP"
OUTPUT_TYPE_REWORK = "REWORK"
OUTPUT_TYPE_BYPRODUCT = "BYPRODUCT"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, sets `producedOn = now()`, defaults `isPrimaryOutput = true`, defaults `outputType = OUTPUT_TYPE_GOOD`

---

### 3.6 ProcessParameterValue

**Class:** `com.mes.production.entity.ProcessParameterValue`
**Table:** `process_parameter_values`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| valueId | Long | `value_id` | `@Id @GeneratedValue(IDENTITY)` |
| confirmation | ProductionConfirmation | `confirmation_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| config | ProcessParametersConfig | `config_id` | `@ManyToOne(LAZY)` |
| parameterName | String | `parameter_name` | `nullable=false` |
| parameterValue | BigDecimal | `parameter_value` | `precision=15, scale=4` |
| stringValue | String | `string_value` | `length=500` |
| unit | String | `unit` | |
| minLimit | BigDecimal | `min_limit` | `precision=15, scale=4` |
| maxLimit | BigDecimal | `max_limit` | `precision=15, scale=4` |
| isWithinSpec | Boolean | `is_within_spec` | |
| deviationReason | String | `deviation_reason` | `length=500` |
| recordedBy | String | `recorded_by` | |
| recordedOn | LocalDateTime | `recorded_on` | |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |

**Relationships:**
- `@ManyToOne` -> ProductionConfirmation (via `confirmation_id`)
- `@ManyToOne` -> ProcessParametersConfig (via `config_id`)

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, sets `recordedOn = now()`, defaults `isWithinSpec = true`

---

## 4. Inventory & Batches

### 4.1 Batch

**Class:** `com.mes.production.entity.Batch`
**Table:** `batches`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| batchId | Long | `batch_id` | `@Id @GeneratedValue(IDENTITY)` |
| batchNumber | String | `batch_number` | `nullable=false, unique=true` |
| materialId | String | `material_id` | `nullable=false` |
| materialName | String | `material_name` | |
| quantity | BigDecimal | `quantity` | `nullable=false, precision=15, scale=4` |
| unit | String | `unit` | `nullable=false` |
| generatedAtOperationId | Long | `generated_at_operation_id` | |
| confirmationId | Long | `confirmation_id` | Added R-13, links batch to production confirmation for reversal |
| status | String | `status` | `nullable=false` |
| approvedBy | String | `approved_by` | |
| approvedOn | LocalDateTime | `approved_on` | |
| rejectionReason | String | `rejection_reason` | `length=500` |
| rejectedBy | String | `rejected_by` | |
| rejectedOn | LocalDateTime | `rejected_on` | |
| createdVia | String | `created_via` | `length=50` |
| supplierBatchNumber | String | `supplier_batch_number` | `length=100` |
| supplierId | String | `supplier_id` | `length=50` |
| receivedDate | LocalDate | `received_date` | |
| receiptNotes | String | `receipt_notes` | `length=500` |
| expiryDate | LocalDate | `expiry_date` | |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:** None (referenced by BatchRelation, ConsumedMaterial, ProducedOutput, Inventory, BatchOrderAllocation, BatchQuantityAdjustment)

**Constants:**
```java
// Status
STATUS_PRODUCED = "PRODUCED"
STATUS_AVAILABLE = "AVAILABLE"
STATUS_CONSUMED = "CONSUMED"
STATUS_BLOCKED = "BLOCKED"
STATUS_SCRAPPED = "SCRAPPED"
STATUS_ON_HOLD = "ON_HOLD"
STATUS_QUALITY_PENDING = "QUALITY_PENDING"

// Creation source
CREATED_VIA_PRODUCTION = "PRODUCTION"
CREATED_VIA_SPLIT = "SPLIT"
CREATED_VIA_MERGE = "MERGE"
CREATED_VIA_MANUAL = "MANUAL"
CREATED_VIA_SYSTEM = "SYSTEM"
CREATED_VIA_RECEIPT = "RECEIPT"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_QUALITY_PENDING`, defaults `unit = "T"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 4.2 Inventory

**Class:** `com.mes.production.entity.Inventory`
**Table:** `inventory`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| inventoryId | Long | `inventory_id` | `@Id @GeneratedValue(IDENTITY)` |
| materialId | String | `material_id` | `nullable=false` |
| materialName | String | `material_name` | |
| inventoryType | String | `inventory_type` | `nullable=false` |
| inventoryForm | String | `inventory_form` | |
| state | String | `state` | `nullable=false` |
| quantity | BigDecimal | `quantity` | `nullable=false, precision=15, scale=4` |
| unit | String | `unit` | `nullable=false` |
| batch | Batch | `batch_id` | `@ManyToOne(LAZY)` |
| location | String | `location` | |
| currentTemperature | BigDecimal | `current_temperature` | `precision=10, scale=2` |
| moistureContent | BigDecimal | `moisture_content` | `precision=5, scale=2` |
| density | BigDecimal | `density` | `precision=10, scale=4` |
| blockReason | String | `block_reason` | `length=500` |
| blockedBy | String | `blocked_by` | |
| blockedOn | LocalDateTime | `blocked_on` | |
| scrapReason | String | `scrap_reason` | `length=500` |
| scrappedBy | String | `scrapped_by` | |
| scrappedOn | LocalDateTime | `scrapped_on` | |
| reservedForOrderId | Long | `reserved_for_order_id` | |
| reservedForOperationId | Long | `reserved_for_operation_id` | |
| reservedBy | String | `reserved_by` | |
| reservedOn | LocalDateTime | `reserved_on` | |
| reservedQty | BigDecimal | `reserved_qty` | `precision=15, scale=4` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:**
- `@ManyToOne` -> Batch (via `batch_id`)

**Constants:**
```java
STATE_AVAILABLE = "AVAILABLE"
STATE_RESERVED = "RESERVED"
STATE_CONSUMED = "CONSUMED"
STATE_PRODUCED = "PRODUCED"
STATE_BLOCKED = "BLOCKED"
STATE_SCRAPPED = "SCRAPPED"
STATE_ON_HOLD = "ON_HOLD"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `state = STATE_AVAILABLE`, defaults `unit = "T"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 4.3 InventoryMovement

**Class:** `com.mes.production.entity.InventoryMovement`
**Table:** `inventory_movement`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| movementId | Long | `movement_id` | `@Id @GeneratedValue(IDENTITY)` |
| operation | Operation | `operation_id` | `@ManyToOne(LAZY)` |
| inventory | Inventory | `inventory_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| movementType | String | `movement_type` | `nullable=false, length=20` |
| quantity | BigDecimal | `quantity` | `nullable=false, precision=15, scale=4` |
| timestamp | LocalDateTime | `timestamp` | `nullable=false` |
| reason | String | `reason` | `length=255` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |

**Relationships:**
- `@ManyToOne` -> Operation (via `operation_id`)
- `@ManyToOne` -> Inventory (via `inventory_id`)

**Constants:**
```java
// Movement types
TYPE_CONSUME = "CONSUME"
TYPE_PRODUCE = "PRODUCE"
TYPE_HOLD = "HOLD"
TYPE_RELEASE = "RELEASE"
TYPE_SCRAP = "SCRAP"
TYPE_REVERSAL = "REVERSAL"   // Added R-13

// Status
STATUS_EXECUTED = "EXECUTED"
STATUS_PENDING = "PENDING"
STATUS_ON_HOLD = "ON_HOLD"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `timestamp = now()`, defaults `status = STATUS_EXECUTED`

---

### 4.4 BatchRelation

**Class:** `com.mes.production.entity.BatchRelation`
**Table:** `batch_relations`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| relationId | Long | `relation_id` | `@Id @GeneratedValue(IDENTITY)` |
| parentBatch | Batch | `parent_batch_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| childBatch | Batch | `child_batch_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| operationId | Long | `operation_id` | |
| relationType | String | `relation_type` | `nullable=false` |
| quantityConsumed | BigDecimal | `quantity_consumed` | `nullable=false, precision=15, scale=4` |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |

**Relationships:**
- `@ManyToOne` -> Batch (via `parent_batch_id`)
- `@ManyToOne` -> Batch (via `child_batch_id`)

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = "ACTIVE"`, defaults `relationType = "MERGE"`

---

### 4.5 BatchOrderAllocation

**Class:** `com.mes.production.entity.BatchOrderAllocation`
**Table:** `batch_order_allocation`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| allocationId | Long | `allocation_id` | `@Id @GeneratedValue(IDENTITY)` |
| batch | Batch | `batch_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| orderLineItem | OrderLineItem | `order_line_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| allocatedQty | BigDecimal | `allocated_qty` | `nullable=false, precision=15, scale=4` |
| timestamp | LocalDateTime | `timestamp` | `nullable=false` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |

**Relationships:**
- `@ManyToOne` -> Batch (via `batch_id`)
- `@ManyToOne` -> OrderLineItem (via `order_line_id`)

**Constants:**
```java
STATUS_ALLOCATED = "ALLOCATED"
STATUS_RELEASED = "RELEASED"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `timestamp = now()`, defaults `status = STATUS_ALLOCATED`

---

### 4.6 BatchQuantityAdjustment

**Class:** `com.mes.production.entity.BatchQuantityAdjustment`
**Table:** `batch_quantity_adjustments`

Per MES Batch Management Specification: batch quantities should never be edited directly. All quantity changes must go through this adjustment mechanism with mandatory reason.

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| adjustmentId | Long | `adjustment_id` | `@Id @GeneratedValue(IDENTITY)` |
| batch | Batch | `batch_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| oldQuantity | BigDecimal | `old_quantity` | `nullable=false, precision=15, scale=4` |
| newQuantity | BigDecimal | `new_quantity` | `nullable=false, precision=15, scale=4` |
| adjustmentReason | String | `adjustment_reason` | `nullable=false, length=500` |
| adjustmentType | String | `adjustment_type` | `nullable=false, length=50` |
| adjustedBy | String | `adjusted_by` | `nullable=false, length=100` |
| adjustedOn | LocalDateTime | `adjusted_on` | |

**Relationships:**
- `@ManyToOne` -> Batch (via `batch_id`)

**Constants:**
```java
TYPE_CORRECTION = "CORRECTION"
TYPE_INVENTORY_COUNT = "INVENTORY_COUNT"
TYPE_DAMAGE = "DAMAGE"
TYPE_SCRAP_RECOVERY = "SCRAP_RECOVERY"
TYPE_SYSTEM = "SYSTEM"
```

**Custom Methods:**
- `getQuantityDifference()` -> `BigDecimal` (newQuantity - oldQuantity)

**Lifecycle Callbacks:**
- `@PrePersist`: Defaults `adjustedOn = now()` if null

---

## 5. Equipment & Operators

### 5.1 Equipment

**Class:** `com.mes.production.entity.Equipment`
**Table:** `equipment`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| equipmentId | Long | `equipment_id` | `@Id @GeneratedValue(IDENTITY)` |
| equipmentCode | String | `equipment_code` | `nullable=false, unique=true` |
| name | String | `name` | `nullable=false` |
| equipmentType | String | `equipment_type` | `nullable=false` |
| equipmentCategory | String | `equipment_category` | |
| capacity | BigDecimal | `capacity` | `precision=15, scale=4` |
| capacityUnit | String | `capacity_unit` | |
| location | String | `location` | |
| status | String | `status` | `nullable=false` |
| maintenanceReason | String | `maintenance_reason` | `length=500` |
| maintenanceStart | LocalDateTime | `maintenance_start` | |
| maintenanceBy | String | `maintenance_by` | |
| expectedMaintenanceEnd | LocalDateTime | `expected_maintenance_end` | |
| holdReason | String | `hold_reason` | `length=500` |
| holdStart | LocalDateTime | `hold_start` | |
| heldBy | String | `held_by` | |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:** None (referenced via `@ManyToMany` from ProductionConfirmation)

**Constants:**
```java
// Status
STATUS_AVAILABLE = "AVAILABLE"
STATUS_IN_USE = "IN_USE"
STATUS_MAINTENANCE = "MAINTENANCE"
STATUS_ON_HOLD = "ON_HOLD"
STATUS_UNAVAILABLE = "UNAVAILABLE"

// Type (processing mode)
TYPE_BATCH = "BATCH"
TYPE_CONTINUOUS = "CONTINUOUS"

// Category (equipment function)
CATEGORY_MELTING = "MELTING"
CATEGORY_REFINING = "REFINING"
CATEGORY_CASTING = "CASTING"
CATEGORY_HOT_ROLLING = "HOT_ROLLING"
CATEGORY_COLD_ROLLING = "COLD_ROLLING"
CATEGORY_ANNEALING = "ANNEALING"
CATEGORY_PICKLING = "PICKLING"
CATEGORY_BAR_ROLLING = "BAR_ROLLING"
CATEGORY_COATING = "COATING"
CATEGORY_WIRE_ROLLING = "WIRE_ROLLING"
CATEGORY_FINISHING = "FINISHING"
CATEGORY_INSPECTION = "INSPECTION"
CATEGORY_PACKAGING = "PACKAGING"
CATEGORY_HEAT_TREATMENT = "HEAT_TREATMENT"
CATEGORY_GENERAL = "GENERAL"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = "AVAILABLE"`, defaults `equipmentType = "BATCH"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 5.2 Operator

**Class:** `com.mes.production.entity.Operator`
**Table:** `operators`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| operatorId | Long | `operator_id` | `@Id @GeneratedValue(IDENTITY)` |
| operatorCode | String | `operator_code` | `nullable=false, unique=true` |
| name | String | `name` | `nullable=false` |
| department | String | `department` | |
| shift | String | `shift` | |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:** None (referenced via `@ManyToMany` from ProductionConfirmation)

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = "ACTIVE"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 5.3 OperationEquipmentUsage

**Class:** `com.mes.production.entity.OperationEquipmentUsage`
**Table:** `operation_equipment_usage`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| usageId | Long | `usage_id` | `@Id @GeneratedValue(IDENTITY)` |
| operation | Operation | `operation_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| equipment | Equipment | `equipment_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| startTime | LocalDateTime | `start_time` | |
| endTime | LocalDateTime | `end_time` | |
| operator | Operator | `operator_id` | `@ManyToOne(LAZY)` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |

**Relationships:**
- `@ManyToOne` -> Operation (via `operation_id`)
- `@ManyToOne` -> Equipment (via `equipment_id`)
- `@ManyToOne` -> Operator (via `operator_id`)

**Constants:**
```java
STATUS_LOGGED = "LOGGED"
STATUS_CONFIRMED = "CONFIRMED"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_LOGGED`

---

## 6. Routing & Templates

### 6.1 Routing

**Class:** `com.mes.production.entity.Routing`
**Table:** `routing`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| routingId | Long | `routing_id` | `@Id @GeneratedValue(IDENTITY)` |
| process | Process | `process_id` | `@ManyToOne(LAZY)` |
| routingName | String | `routing_name` | `nullable=false, length=100` |
| routingType | String | `routing_type` | `nullable=false, length=20` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |
| routingSteps | List\<RoutingStep\> | - | `@OneToMany(mappedBy="routing", cascade=ALL, fetch=LAZY)`, `@Builder.Default = new ArrayList<>()` |

**Relationships:**
- `@ManyToOne` -> Process (via `process_id`)
- `@OneToMany` -> RoutingStep (mappedBy `routing`)

**Constants:**
```java
// Routing type
TYPE_SEQUENTIAL = "SEQUENTIAL"
TYPE_PARALLEL = "PARALLEL"

// Status
STATUS_DRAFT = "DRAFT"
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
STATUS_ON_HOLD = "ON_HOLD"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, defaults `routingType = TYPE_SEQUENTIAL`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 6.2 RoutingStep

**Class:** `com.mes.production.entity.RoutingStep`
**Table:** `routing_steps`

Design-time entity. Does NOT reference runtime Operations.

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| routingStepId | Long | `routing_step_id` | `@Id @GeneratedValue(IDENTITY)` |
| routing | Routing | `routing_id` | `@ManyToOne(LAZY)`, `nullable=false` |
| operationTemplate | OperationTemplate | `operation_template_id` | `@ManyToOne(LAZY)` |
| sequenceNumber | Integer | `sequence_number` | `nullable=false` |
| isParallel | Boolean | `is_parallel` | |
| mandatoryFlag | Boolean | `mandatory_flag` | |
| status | String | `status` | `nullable=false, length=20` |
| producesOutputBatch | Boolean | `produces_output_batch` | |
| allowsSplit | Boolean | `allows_split` | |
| allowsMerge | Boolean | `allows_merge` | |
| operationName | String | `operation_name` | `length=100` (legacy) |
| operationType | String | `operation_type` | `length=50` (legacy) |
| operationCode | String | `operation_code` | `length=50` (legacy) |
| targetQty | BigDecimal | `target_qty` | `precision=15, scale=4` |
| description | String | `description` | `length=500` |
| estimatedDurationMinutes | Integer | `estimated_duration_minutes` | |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Relationships:**
- `@ManyToOne` -> Routing (via `routing_id`)
- `@ManyToOne` -> OperationTemplate (via `operation_template_id`)

**Constants:**
```java
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
```

**Custom Methods:**
- `getEffectiveOperationName()` -> Returns template name if available, else legacy field
- `getEffectiveOperationType()` -> Returns template type if available, else legacy field
- `getEffectiveOperationCode()` -> Returns template code if available, else legacy field

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `isParallel = false`, `mandatoryFlag = true`, `producesOutputBatch = true`, `allowsSplit = false`, `allowsMerge = false`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 6.3 OperationTemplate

**Class:** `com.mes.production.entity.OperationTemplate`
**Table:** `operation_templates`

Design-time operation definition. Reusable templates referenced by RoutingSteps.

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| operationTemplateId | Long | `operation_template_id` | `@Id @GeneratedValue(IDENTITY)` |
| operationName | String | `operation_name` | `nullable=false, length=100` |
| operationCode | String | `operation_code` | `length=50` |
| operationType | String | `operation_type` | `nullable=false, length=50` |
| quantityType | String | `quantity_type` | `length=20` |
| defaultEquipmentType | String | `default_equipment_type` | `length=50` |
| description | String | `description` | `length=500` |
| estimatedDurationMinutes | Integer | `estimated_duration_minutes` | |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Relationships:** None (referenced by RoutingStep and Operation)

**Constants:**
```java
// Status
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"

// Quantity type
QTY_TYPE_DISCRETE = "DISCRETE"
QTY_TYPE_BATCH = "BATCH"
QTY_TYPE_CONTINUOUS = "CONTINUOUS"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, defaults `quantityType = QTY_TYPE_DISCRETE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

## 7. Configuration

### 7.1 ProcessParametersConfig

**Class:** `com.mes.production.entity.ProcessParametersConfig`
**Table:** `process_parameters_config`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| configId | Long | `config_id` | `@Id @GeneratedValue(IDENTITY)` |
| operationType | String | `operation_type` | `nullable=false, length=50` |
| productSku | String | `product_sku` | `length=100` |
| parameterName | String | `parameter_name` | `nullable=false, length=100` |
| parameterType | String | `parameter_type` | `nullable=false, length=30` |
| unit | String | `unit` | `length=20` |
| minValue | BigDecimal | `min_value` | `precision=15, scale=4` |
| maxValue | BigDecimal | `max_value` | `precision=15, scale=4` |
| defaultValue | BigDecimal | `default_value` | `precision=15, scale=4` |
| isRequired | Boolean | `is_required` | |
| displayOrder | Integer | `display_order` | |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Constants:**
```java
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `parameterType = "DECIMAL"`, `displayOrder = 1`, `isRequired = false`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 7.2 BatchNumberConfig

**Class:** `com.mes.production.entity.BatchNumberConfig`
**Table:** `batch_number_config`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| configId | Long | `config_id` | `@Id @GeneratedValue(IDENTITY)` |
| configName | String | `config_name` | `nullable=false, unique=true, length=100` |
| operationType | String | `operation_type` | `length=50` |
| productSku | String | `product_sku` | `length=100` |
| prefix | String | `prefix` | `nullable=false, length=50` |
| includeOperationCode | Boolean | `include_operation_code` | |
| operationCodeLength | Integer | `operation_code_length` | |
| separator | String | `separator` | `nullable=false, length=5` |
| dateFormat | String | `date_format` | `length=20` |
| includeDate | Boolean | `include_date` | |
| sequenceLength | Integer | `sequence_length` | `nullable=false` |
| sequenceReset | String | `sequence_reset` | `length=20` |
| priority | Integer | `priority` | |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Constants:**
```java
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `prefix = "BATCH"`, `separator = "-"`, `sequenceLength = 3`, `priority = 100`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 7.3 HoldReason

**Class:** `com.mes.production.entity.HoldReason`
**Table:** `hold_reasons`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| reasonId | Long | `reason_id` | `@Id @GeneratedValue(IDENTITY)` |
| reasonCode | String | `reason_code` | `nullable=false, unique=true, length=50` |
| reasonDescription | String | `reason_description` | `nullable=false, length=255` |
| applicableTo | String | `applicable_to` | `length=100` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 7.4 DelayReason

**Class:** `com.mes.production.entity.DelayReason`
**Table:** `delay_reasons`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| reasonId | Long | `reason_id` | `@Id @GeneratedValue(IDENTITY)` |
| reasonCode | String | `reason_code` | `nullable=false, unique=true, length=50` |
| reasonDescription | String | `reason_description` | `nullable=false, length=255` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 7.5 QuantityTypeConfig

**Class:** `com.mes.production.entity.QuantityTypeConfig`
**Table:** `quantity_type_config`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| configId | Long | `config_id` | `@Id @GeneratedValue(IDENTITY)` |
| configName | String | `config_name` | `nullable=false, unique=true, length=100` |
| materialCode | String | `material_code` | `length=50` |
| operationType | String | `operation_type` | `length=50` |
| equipmentType | String | `equipment_type` | `length=50` |
| quantityType | String | `quantity_type` | `nullable=false, length=20` |
| decimalPrecision | Integer | `decimal_precision` | `nullable=false` |
| roundingRule | String | `rounding_rule` | `nullable=false, length=20` |
| minQuantity | BigDecimal | `min_quantity` | `precision=15, scale=4` |
| maxQuantity | BigDecimal | `max_quantity` | `precision=15, scale=4` |
| unit | String | `unit` | `length=20` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `quantityType = "DECIMAL"`, `decimalPrecision = 4`, `roundingRule = "HALF_UP"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 7.6 BatchSizeConfig

**Class:** `com.mes.production.entity.BatchSizeConfig`
**Table:** `batch_size_config`

Configures batch size limits for multi-batch production confirmation.

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| configId | Long | `config_id` | `@Id @GeneratedValue(IDENTITY)` |
| materialId | String | `material_id` | `length=50` |
| operationType | String | `operation_type` | `length=50` |
| equipmentType | String | `equipment_type` | `length=50` |
| productSku | String | `product_sku` | `length=50` |
| minBatchSize | BigDecimal | `min_batch_size` | `precision=15, scale=4` |
| maxBatchSize | BigDecimal | `max_batch_size` | `nullable=false, precision=15, scale=4` |
| preferredBatchSize | BigDecimal | `preferred_batch_size` | `precision=15, scale=4` |
| unit | String | `unit` | `length=20` |
| allowPartialBatch | Boolean | `allow_partial_batch` | |
| isActive | Boolean | `is_active` | |
| priority | Integer | `priority` | |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `isActive = true`, `allowPartialBatch = true`, `minBatchSize = BigDecimal.ZERO`, `unit = "T"`, `priority = 0`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 7.7 OperationType

**Class:** `com.mes.production.entity.OperationType`
**Table:** `operation_types`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| typeId | Long | `type_id` | `@Id @GeneratedValue(IDENTITY)` |
| typeCode | String | `type_code` | `nullable=false, unique=true` |
| typeName | String | `type_name` | `nullable=false` |
| description | String | `description` | |
| defaultDurationMinutes | Integer | `default_duration_minutes` | |
| requiresEquipment | Boolean | `requires_equipment` | |
| requiresOperator | Boolean | `requires_operator` | |
| producesOutput | Boolean | `produces_output` | |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `requiresEquipment = true`, `requiresOperator = true`, `producesOutput = true`
- `@PreUpdate`: Sets `updatedOn = now()`

---

## 8. Master Data

### 8.1 Material

**Class:** `com.mes.production.entity.Material`
**Table:** `materials`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| materialId | Long | `material_id` | `@Id @GeneratedValue(IDENTITY)` |
| materialCode | String | `material_code` | `nullable=false, unique=true, length=50` |
| materialName | String | `material_name` | `nullable=false, length=200` |
| description | String | `description` | `length=500` |
| materialType | String | `material_type` | `nullable=false, length=20` |
| baseUnit | String | `base_unit` | `nullable=false, length=20` |
| materialGroup | String | `material_group` | `length=50` |
| sku | String | `sku` | `length=50` |
| standardCost | BigDecimal | `standard_cost` | `precision=15, scale=4` |
| costCurrency | String | `cost_currency` | `length=3` |
| minStockLevel | BigDecimal | `min_stock_level` | `precision=15, scale=4` |
| maxStockLevel | BigDecimal | `max_stock_level` | `precision=15, scale=4` |
| reorderPoint | BigDecimal | `reorder_point` | `precision=15, scale=4` |
| leadTimeDays | Integer | `lead_time_days` | |
| shelfLifeDays | Integer | `shelf_life_days` | |
| storageConditions | String | `storage_conditions` | `length=255` |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Constants:**
```java
// Material types
TYPE_RAW_MATERIAL = "RM"
TYPE_INTERMEDIATE = "IM"
TYPE_FINISHED_GOODS = "FG"
TYPE_WIP = "WIP"

// Status
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
STATUS_OBSOLETE = "OBSOLETE"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `baseUnit = "T"`, `costCurrency = "USD"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 8.2 Product

**Class:** `com.mes.production.entity.Product`
**Table:** `products`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| productId | Long | `product_id` | `@Id @GeneratedValue(IDENTITY)` |
| sku | String | `sku` | `nullable=false, unique=true, length=50` |
| productName | String | `product_name` | `nullable=false, length=200` |
| description | String | `description` | `length=500` |
| productCategory | String | `product_category` | `length=100` |
| productGroup | String | `product_group` | `length=100` |
| baseUnit | String | `base_unit` | `nullable=false, length=20` |
| weightPerUnit | BigDecimal | `weight_per_unit` | `precision=15, scale=4` |
| weightUnit | String | `weight_unit` | `length=10` |
| standardPrice | BigDecimal | `standard_price` | `precision=15, scale=4` |
| priceCurrency | String | `price_currency` | `length=3` |
| minOrderQty | BigDecimal | `min_order_qty` | `precision=15, scale=4` |
| leadTimeDays | Integer | `lead_time_days` | |
| materialId | Long | `material_id` | Reference to material |
| defaultProcessId | Long | `default_process_id` | Default process for operations |
| status | String | `status` | `nullable=false, length=20` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | `length=100` |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | `length=100` |

**Constants:**
```java
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
STATUS_DISCONTINUED = "DISCONTINUED"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `baseUnit = "T"`, `priceCurrency = "USD"`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 8.3 MaterialGroup

**Class:** `com.mes.production.entity.MaterialGroup`
**Table:** `material_groups`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| groupId | Long | `group_id` | `@Id @GeneratedValue(IDENTITY)` |
| groupCode | String | `group_code` | `nullable=false, unique=true` |
| groupName | String | `group_name` | `nullable=false` |
| description | String | `description` | |
| parentGroup | MaterialGroup | `parent_group_id` | `@ManyToOne(LAZY)` (self-referencing) |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:**
- `@ManyToOne` -> MaterialGroup (self-referencing via `parent_group_id`)

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 8.4 ProductCategory

**Class:** `com.mes.production.entity.ProductCategory`
**Table:** `product_categories`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| categoryId | Long | `category_id` | `@Id @GeneratedValue(IDENTITY)` |
| categoryCode | String | `category_code` | `nullable=false, unique=true` |
| categoryName | String | `category_name` | `nullable=false` |
| description | String | `description` | |
| parentCategory | ProductCategory | `parent_category_id` | `@ManyToOne(LAZY)` (self-referencing) |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:**
- `@ManyToOne` -> ProductCategory (self-referencing via `parent_category_id`)

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 8.5 ProductGroup

**Class:** `com.mes.production.entity.ProductGroup`
**Table:** `product_groups`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| groupId | Long | `group_id` | `@Id @GeneratedValue(IDENTITY)` |
| groupCode | String | `group_code` | `nullable=false, unique=true` |
| groupName | String | `group_name` | `nullable=false` |
| description | String | `description` | |
| category | ProductCategory | `category_id` | `@ManyToOne(LAZY)` |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:**
- `@ManyToOne` -> ProductCategory (via `category_id`)

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 8.6 Location

**Class:** `com.mes.production.entity.Location`
**Table:** `locations`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| locationId | Long | `location_id` | `@Id @GeneratedValue(IDENTITY)` |
| locationCode | String | `location_code` | `nullable=false, unique=true` |
| locationName | String | `location_name` | `nullable=false` |
| locationType | String | `location_type` | `nullable=false` |
| parentLocation | Location | `parent_location_id` | `@ManyToOne(LAZY)` (self-referencing) |
| address | String | `address` | |
| capacity | BigDecimal | `capacity` | `precision=15, scale=4` |
| capacityUnit | String | `capacity_unit` | |
| isTemperatureControlled | Boolean | `is_temperature_controlled` | |
| minTemperature | BigDecimal | `min_temperature` | `precision=5, scale=2` |
| maxTemperature | BigDecimal | `max_temperature` | `precision=5, scale=2` |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:**
- `@ManyToOne` -> Location (self-referencing via `parent_location_id`)

**Constants:**
```java
// Location types
TYPE_WAREHOUSE = "WAREHOUSE"
TYPE_PLANT = "PLANT"
TYPE_ZONE = "ZONE"
TYPE_RACK = "RACK"
TYPE_BIN = "BIN"
TYPE_STAGING = "STAGING"

// Status
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
STATUS_MAINTENANCE = "MAINTENANCE"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `locationType = TYPE_WAREHOUSE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 8.7 Department

**Class:** `com.mes.production.entity.Department`
**Table:** `departments`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| departmentId | Long | `department_id` | `@Id @GeneratedValue(IDENTITY)` |
| departmentCode | String | `department_code` | `nullable=false, unique=true` |
| departmentName | String | `department_name` | `nullable=false` |
| description | String | `description` | |
| managerName | String | `manager_name` | |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 8.8 Shift

**Class:** `com.mes.production.entity.Shift`
**Table:** `shifts`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| shiftId | Long | `shift_id` | `@Id @GeneratedValue(IDENTITY)` |
| shiftCode | String | `shift_code` | `nullable=false, unique=true` |
| shiftName | String | `shift_name` | `nullable=false` |
| startTime | LocalTime | `start_time` | |
| endTime | LocalTime | `end_time` | |
| description | String | `description` | |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Constants:** `STATUS_ACTIVE = "ACTIVE"`, `STATUS_INACTIVE = "INACTIVE"`

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`
- `@PreUpdate`: Sets `updatedOn = now()`

---

### 8.9 AttributeDefinition

**Class:** `com.mes.production.entity.AttributeDefinition`
**Table:** `attribute_definitions`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| attributeId | Long | `attribute_id` | `@Id @GeneratedValue(IDENTITY)` |
| attributeCode | String | `attribute_code` | `nullable=false, unique=true` |
| attributeName | String | `attribute_name` | `nullable=false` |
| description | String | `description` | |
| dataType | String | `data_type` | `nullable=false` |
| entityType | String | `entity_type` | `nullable=false` |
| unit | String | `unit` | |
| minValue | BigDecimal | `min_value` | `precision=15, scale=4` |
| maxValue | BigDecimal | `max_value` | `precision=15, scale=4` |
| allowedValues | String | `allowed_values` | `columnDefinition="TEXT"` |
| isRequired | Boolean | `is_required` | |
| isSearchable | Boolean | `is_searchable` | |
| displayOrder | Integer | `display_order` | |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Constants:**
```java
// Data types
DATA_TYPE_STRING = "STRING"
DATA_TYPE_INTEGER = "INTEGER"
DATA_TYPE_DECIMAL = "DECIMAL"
DATA_TYPE_BOOLEAN = "BOOLEAN"
DATA_TYPE_DATE = "DATE"
DATA_TYPE_DATETIME = "DATETIME"
DATA_TYPE_LIST = "LIST"

// Entity types
ENTITY_MATERIAL = "MATERIAL"
ENTITY_PRODUCT = "PRODUCT"
ENTITY_BATCH = "BATCH"
ENTITY_EQUIPMENT = "EQUIPMENT"
ENTITY_OPERATION = "OPERATION"
ENTITY_INVENTORY = "INVENTORY"

// Status
STATUS_ACTIVE = "ACTIVE"
STATUS_INACTIVE = "INACTIVE"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = STATUS_ACTIVE`, `dataType = DATA_TYPE_STRING`, `isRequired = false`, `isSearchable = true`, `displayOrder = 1`
- `@PreUpdate`: Sets `updatedOn = now()`

---

## 9. Tracking & Audit

### 9.1 HoldRecord

**Class:** `com.mes.production.entity.HoldRecord`
**Table:** `hold_records`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| holdId | Long | `hold_id` | `@Id @GeneratedValue(IDENTITY)` |
| entityType | String | `entity_type` | `nullable=false` |
| entityId | Long | `entity_id` | `nullable=false` |
| reason | String | `reason` | `nullable=false` |
| comments | String | `comments` | `columnDefinition="TEXT"` |
| appliedBy | String | `applied_by` | `nullable=false` |
| appliedOn | LocalDateTime | `applied_on` | `nullable=false` |
| releasedBy | String | `released_by` | |
| releasedOn | LocalDateTime | `released_on` | |
| releaseComments | String | `release_comments` | `columnDefinition="TEXT"` |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| previousStatus | String | - | `@Transient` (not persisted) |

**Relationships:** None

**Constants:**
```java
// Entity types
ENTITY_TYPE_OPERATION = "OPERATION"
ENTITY_TYPE_PROCESS = "PROCESS"
ENTITY_TYPE_ORDER_LINE = "ORDER_LINE"
ENTITY_TYPE_INVENTORY = "INVENTORY"
ENTITY_TYPE_BATCH = "BATCH"
ENTITY_TYPE_EQUIPMENT = "EQUIPMENT"

// Status
STATUS_ACTIVE = "ACTIVE"
STATUS_RELEASED = "RELEASED"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, sets `appliedOn = now()`, defaults `status = "ACTIVE"`

---

### 9.2 AuditTrail

**Class:** `com.mes.production.entity.AuditTrail`
**Table:** `audit_trail`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| auditId | Long | `audit_id` | `@Id @GeneratedValue(IDENTITY)` |
| entityType | String | `entity_type` | `nullable=false, length=50` |
| entityId | Long | `entity_id` | `nullable=false` |
| fieldName | String | `field_name` | `length=100` |
| oldValue | String | `old_value` | `columnDefinition="TEXT"` |
| newValue | String | `new_value` | `columnDefinition="TEXT"` |
| action | String | `action` | `nullable=false, length=30` |
| changedBy | String | `changed_by` | `nullable=false, length=100` |
| timestamp | LocalDateTime | `timestamp` | `nullable=false` |

**Relationships:** None

**Constants:**
```java
// Action types
ACTION_CREATE = "CREATE"
ACTION_UPDATE = "UPDATE"
ACTION_DELETE = "DELETE"
ACTION_STATUS_CHANGE = "STATUS_CHANGE"
ACTION_CONSUME = "CONSUME"
ACTION_PRODUCE = "PRODUCE"
ACTION_HOLD = "HOLD"
ACTION_RELEASE = "RELEASE"
ACTION_BATCH_NUMBER_GENERATED = "BATCH_NUMBER_GENERATED"

// Entity types
ENTITY_PRODUCTION_CONFIRMATION = "PRODUCTION_CONFIRMATION"
ENTITY_OPERATION = "OPERATION"
ENTITY_PROCESS = "PROCESS"
ENTITY_INVENTORY = "INVENTORY"
ENTITY_BATCH = "BATCH"
ENTITY_BATCH_RELATION = "BATCH_RELATION"
ENTITY_ORDER = "ORDER"
ENTITY_ORDER_LINE = "ORDER_LINE"
```

**Lifecycle Callbacks:**
- `@PrePersist`: Defaults `timestamp = now()` if null

---

### 9.3 DatabasePatch

**Class:** `com.mes.production.entity.DatabasePatch`
**Table:** `database_patches`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| id | Long | `id` | `@Id @GeneratedValue(IDENTITY)` |
| patchNumber | Integer | `patch_number` | `nullable=false, unique=true` |
| patchName | String | `patch_name` | `nullable=false` |
| fileName | String | `file_name` | `nullable=false` |
| appliedOn | LocalDateTime | `applied_on` | `nullable=false` |
| appliedBy | String | `applied_by` | |
| executionTimeMs | Long | `execution_time_ms` | |
| checksum | String | `checksum` | |
| success | Boolean | `success` | `nullable=false` |
| errorMessage | String | `error_message` | `columnDefinition="TEXT"` |

**Relationships:** None

**Lifecycle Callbacks:** None

---

## 10. Bill of Materials

### 10.1 BillOfMaterial

**Class:** `com.mes.production.entity.BillOfMaterial`
**Table:** `bill_of_material`

| Field | Java Type | Column | Annotations / Constraints |
|-------|-----------|--------|---------------------------|
| bomId | Long | `bom_id` | `@Id @GeneratedValue(IDENTITY)` |
| productSku | String | `product_sku` | `nullable=false` |
| bomVersion | String | `bom_version` | |
| materialId | String | `material_id` | `nullable=false` |
| materialName | String | `material_name` | |
| quantityRequired | BigDecimal | `quantity_required` | `nullable=false, precision=15, scale=4` |
| unit | String | `unit` | `nullable=false` |
| yieldLossRatio | BigDecimal | `yield_loss_ratio` | `precision=10, scale=4` |
| sequenceLevel | Integer | `sequence_level` | `nullable=false` |
| parentBomId | Long | `parent_bom_id` | Self-referencing parent |
| status | String | `status` | `nullable=false` |
| createdOn | LocalDateTime | `created_on` | |
| createdBy | String | `created_by` | |
| updatedOn | LocalDateTime | `updated_on` | |
| updatedBy | String | `updated_by` | |

**Relationships:** None (self-referencing via `parentBomId` Long field, not JPA relationship)

**Lifecycle Callbacks:**
- `@PrePersist`: Sets `createdOn = now()`, defaults `status = "ACTIVE"`, `bomVersion = "V1"`, `unit = "T"`, `yieldLossRatio = BigDecimal.ONE`, `sequenceLevel = 1`
- `@PreUpdate`: Sets `updatedOn = now()`

---

## 11. Enums

### 11.1 ProcessStatus

**Class:** `com.mes.production.entity.ProcessStatus`

Design-time status for Process templates.

| Value | Description |
|-------|-------------|
| `DRAFT` | Being designed, not ready for use |
| `ACTIVE` | Ready to be used in routings |
| `INACTIVE` | Retired, no longer available |

---

### 11.2 UnitOfMeasure

**Class:** `com.mes.production.entity.UnitOfMeasure`

Standard units of measure used across the MES system.

| Category | Values |
|----------|--------|
| **Weight** | `KG` (Kilogram), `MT` (Metric Ton), `LB` (Pound), `G` (Gram) |
| **Count** | `PCS` (Pieces), `EA` (Each) |
| **Volume** | `L` (Liter), `ML` (Milliliter), `GAL` (Gallon) |
| **Length** | `M` (Meter), `CM` (Centimeter), `MM` (Millimeter), `FT` (Feet), `IN` (Inch) |
| **Area/Volume** | `M2` (Square Meter), `M3` (Cubic Meter) |
| **Packaging** | `BOX` (Box), `BAG` (Bag), `ROLL` (Roll), `SET` (Set) |

**Methods:**
- `getLabel()` -> String (human-readable name)
- `getCode()` -> String (enum name)
- `getDisplayName()` -> String (format: "Label (CODE)")
- `fromString(String)` -> UnitOfMeasure (returns null if not found)
- `isValid(String)` -> boolean

---

# 12. DTOs

All DTOs use Lombok: `@Data`, `@Builder`, `@NoArgsConstructor`, `@AllArgsConstructor`.

## 12.1 Authentication DTOs

### LoginRequest
**Package:** `com.mes.production.dto.auth`

| Field | Type | Validation |
|-------|------|------------|
| email | String | `@NotBlank("Email is required")`, `@Email("Invalid email format")` |
| password | String | `@NotBlank("Password is required")` |

### LoginResponse
**Package:** `com.mes.production.dto.auth`

| Field | Type |
|-------|------|
| accessToken | String |
| refreshToken | String |
| tokenType | String |
| expiresIn | Long |
| user | UserInfo |

**Nested: LoginResponse.UserInfo**

| Field | Type |
|-------|------|
| userId | Long |
| email | String |
| name | String |
| employeeId | String |

---

## 12.2 UserDTO

**Package:** `com.mes.production.dto`

| Field | Type | Validation |
|-------|------|------------|
| userId | Long | |
| email | String | `@NotBlank`, `@Email`, `@Size(max=100)` |
| name | String | `@NotBlank`, `@Size(max=100)` |
| employeeId | String | `@Size(max=50)` |
| status | String | |
| createdOn | LocalDateTime | |
| createdBy | String | |
| updatedOn | LocalDateTime | |
| updatedBy | String | |

**Conversion methods:** `fromEntity(User)`, `toEntity()`

**Nested: UserDTO.CreateUserRequest**

| Field | Type | Validation |
|-------|------|------------|
| email | String | `@NotBlank`, `@Email` |
| name | String | `@NotBlank` |
| password | String | `@NotBlank`, `@Size(min=6)` |
| employeeId | String | |

**Nested: UserDTO.UpdateUserRequest**

| Field | Type | Validation |
|-------|------|------------|
| name | String | `@NotBlank` |
| employeeId | String | |
| status | String | |

**Nested: UserDTO.ChangePasswordRequest**

| Field | Type | Validation |
|-------|------|------------|
| currentPassword | String | `@NotBlank` |
| newPassword | String | `@NotBlank`, `@Size(min=6)` |

**Nested: UserDTO.ResetPasswordRequest**

| Field | Type | Validation |
|-------|------|------------|
| newPassword | String | `@NotBlank`, `@Size(min=6)` |

---

## 12.3 OrderDTO

**Package:** `com.mes.production.dto`

| Field | Type |
|-------|------|
| orderId | Long |
| orderNumber | String |
| customerId | String |
| customerName | String |
| orderDate | LocalDate |
| deliveryDate | LocalDate |
| notes | String |
| priority | Integer |
| status | String |
| lineItems | List\<OrderLineDTO\> |

**Nested: OrderDTO.OrderLineDTO**

| Field | Type |
|-------|------|
| orderLineId | Long |
| productSku | String |
| productName | String |
| quantity | BigDecimal |
| unit | String |
| deliveryDate | LocalDate |
| status | String |
| operations | List\<OperationDTO\> |
| currentOperation | OperationDTO |

**Nested: OrderDTO.OperationDTO**

| Field | Type |
|-------|------|
| operationId | Long |
| operationName | String |
| operationCode | String |
| operationType | String |
| sequenceNumber | Integer |
| status | String |
| processId | Long |
| processName | String |

---

## 12.4 Order Request DTOs

### CreateOrderRequest
**Package:** `com.mes.production.dto.order`

| Field | Type | Validation |
|-------|------|------------|
| customerId | String | `@NotBlank`, `@Size(max=50)` |
| customerName | String | `@NotBlank`, `@Size(max=200)` |
| orderDate | LocalDate | `@NotNull` |
| orderNumber | String | Optional (auto-generated) |
| deliveryDate | LocalDate | |
| notes | String | `@Size(max=1000)` |
| priority | Integer | |
| lineItems | List\<LineItemRequest\> | `@NotEmpty`, `@Valid` |

**Nested: CreateOrderRequest.LineItemRequest**

| Field | Type | Validation |
|-------|------|------------|
| productSku | String | `@NotBlank`, `@Size(max=50)` |
| productName | String | `@NotBlank`, `@Size(max=200)` |
| quantity | BigDecimal | `@NotNull` |
| unit | String | `@NotBlank`, `@Size(max=20)` |
| deliveryDate | LocalDate | |

### UpdateOrderRequest
**Package:** `com.mes.production.dto.order`

| Field | Type | Validation |
|-------|------|------------|
| customerId | String | `@NotBlank`, `@Size(max=50)` |
| customerName | String | `@NotBlank`, `@Size(max=200)` |
| orderDate | LocalDate | |
| deliveryDate | LocalDate | |
| notes | String | `@Size(max=1000)` |
| priority | Integer | |
| status | String | |

### LineItemRequest (standalone)
**Package:** `com.mes.production.dto.order`

| Field | Type | Validation |
|-------|------|------------|
| productSku | String | `@NotBlank`, `@Size(max=50)` |
| productName | String | `@NotBlank`, `@Size(max=200)` |
| quantity | BigDecimal | `@NotNull` |
| unit | String | `@NotBlank`, `@Size(max=20)` |
| deliveryDate | LocalDate | |

---

## 12.5 ProductionConfirmationDTO

**Package:** `com.mes.production.dto`

Container class with nested static classes only.

### ProductionConfirmationDTO.Request

| Field | Type | Validation |
|-------|------|------------|
| operationId | Long | `@NotNull` |
| materialsConsumed | List\<MaterialConsumption\> | `@NotEmpty` |
| producedQty | BigDecimal | `@NotNull`, `@Positive` |
| scrapQty | BigDecimal | |
| startTime | LocalDateTime | `@NotNull` |
| endTime | LocalDateTime | `@NotNull` |
| equipmentIds | List\<Long\> | `@NotEmpty` |
| operatorIds | List\<Long\> | `@NotEmpty` |
| delayMinutes | Integer | |
| delayReason | String | |
| processParameters | Map\<String, Object\> | |
| notes | String | |
| saveAsPartial | Boolean | Flag for partial confirmation |

### ProductionConfirmationDTO.MaterialConsumption

| Field | Type | Validation |
|-------|------|------------|
| batchId | Long | `@NotNull` |
| inventoryId | Long | `@NotNull` |
| quantity | BigDecimal | `@NotNull`, `@Positive` |

### ProductionConfirmationDTO.Response

| Field | Type |
|-------|------|
| confirmationId | Long |
| operationId | Long |
| operationName | String |
| producedQty | BigDecimal |
| scrapQty | BigDecimal |
| startTime | LocalDateTime |
| endTime | LocalDateTime |
| delayMinutes | Integer |
| delayReason | String |
| processParameters | Map\<String, Object\> |
| notes | String |
| status | String |
| createdOn | LocalDateTime |
| isPartial | Boolean |
| remainingQty | BigDecimal |
| rejectionReason | String |
| rejectedBy | String |
| rejectedOn | LocalDateTime |
| reversedBy | String | Added R-13 |
| reversedOn | LocalDateTime | Added R-13 |
| reversalReason | String | Added R-13 |
| outputBatch | BatchInfo |
| outputBatches | List\<BatchInfo\> |
| batchCount | Integer |
| hasPartialBatch | Boolean |
| nextOperation | NextOperationInfo |
| equipment | List\<EquipmentInfo\> |
| operators | List\<OperatorInfo\> |
| materialsConsumed | List\<MaterialConsumedInfo\> |

### ProductionConfirmationDTO.MaterialConsumedInfo

| Field | Type |
|-------|------|
| batchId | Long |
| batchNumber | String |
| inventoryId | Long |
| materialId | String |
| quantityConsumed | BigDecimal |

### ProductionConfirmationDTO.EquipmentInfo

| Field | Type |
|-------|------|
| equipmentId | Long |
| equipmentCode | String |
| name | String |

### ProductionConfirmationDTO.OperatorInfo

| Field | Type |
|-------|------|
| operatorId | Long |
| operatorCode | String |
| name | String |

### ProductionConfirmationDTO.BatchInfo

| Field | Type |
|-------|------|
| batchId | Long |
| batchNumber | String |
| materialId | String |
| materialName | String |
| quantity | BigDecimal |
| unit | String |

### ProductionConfirmationDTO.NextOperationInfo

| Field | Type |
|-------|------|
| operationId | Long |
| operationName | String |
| status | String |
| processName | String |

### ProductionConfirmationDTO.RejectionRequest

| Field | Type | Validation |
|-------|------|------------|
| confirmationId | Long | `@NotNull` |
| reason | String | `@NotNull` |
| notes | String | |

### ProductionConfirmationDTO.StatusUpdateResponse

| Field | Type |
|-------|------|
| confirmationId | Long |
| previousStatus | String |
| newStatus | String |
| message | String |
| updatedBy | String |
| updatedOn | LocalDateTime |

### ProductionConfirmationDTO.ReversalRequest (R-13)

| Field | Type | Validation |
|-------|------|------------|
| confirmationId | Long | `@NotNull` |
| reason | String | `@NotNull` |
| notes | String | |

### ProductionConfirmationDTO.ReversalResponse (R-13)

| Field | Type |
|-------|------|
| confirmationId | Long |
| previousStatus | String |
| newStatus | String |
| message | String |
| reversedBy | String |
| reversedOn | LocalDateTime |
| restoredInventoryIds | List\<Long\> |
| restoredBatchIds | List\<Long\> |
| scrappedOutputBatchIds | List\<Long\> |
| operationId | Long |
| operationNewStatus | String |
| nextOperationId | Long |
| nextOperationNewStatus | String |

---

## 12.6 ProcessDTO

**Package:** `com.mes.production.dto`

### ProcessDTO.Response

| Field | Type |
|-------|------|
| processId | Long |
| processName | String |
| status | String |
| createdOn | LocalDateTime |
| createdBy | String |
| updatedOn | LocalDateTime |
| updatedBy | String |
| operations | List\<OperationSummary\> |

### ProcessDTO.OperationSummary

| Field | Type |
|-------|------|
| operationId | Long |
| operationName | String |
| operationCode | String |
| status | String |
| sequenceNumber | Integer |
| orderLineId | Long |

### ProcessDTO.CreateRequest

| Field | Type | Validation |
|-------|------|------------|
| processName | String | `@NotBlank` |
| status | String | Optional, defaults to DRAFT |

### ProcessDTO.UpdateRequest

| Field | Type |
|-------|------|
| processName | String |
| status | String |

---

## 12.7 OperationDTO

**Package:** `com.mes.production.dto`

| Field | Type |
|-------|------|
| operationId | Long |
| processId | Long |
| operationName | String |
| operationCode | String |
| operationType | String |
| sequenceNumber | Integer |
| status | String |
| targetQty | BigDecimal |
| confirmedQty | BigDecimal |
| blockReason | String |
| blockedBy | String |
| blockedOn | LocalDateTime |
| processName | String |
| orderNumber | String |
| productSku | String |

### OperationDTO.StatusUpdateResponse

| Field | Type |
|-------|------|
| operationId | Long |
| previousStatus | String |
| newStatus | String |
| message | String |
| updatedBy | String |
| updatedOn | LocalDateTime |

### OperationDTO.BlockRequest

| Field | Type |
|-------|------|
| operationId | Long |
| reason | String |

---

## 12.8 BatchDTO

**Package:** `com.mes.production.dto`

| Field | Type |
|-------|------|
| batchId | Long |
| batchNumber | String |
| materialId | String |
| materialName | String |
| quantity | BigDecimal |
| unit | String |
| status | String |
| createdOn | LocalDateTime |
| generatedAtOperationId | Long |
| createdVia | String |
| supplierBatchNumber | String |
| supplierId | String |
| expiryDate | LocalDate |
| approvedBy | String |
| approvedOn | LocalDateTime |
| rejectionReason | String |
| rejectedBy | String |
| rejectedOn | LocalDateTime |

**Nested classes:** Genealogy, ParentBatchInfo, ChildBatchInfo, ProductionInfo, SplitRequest, SplitPortion, SplitResponse, MergeRequest, MergeResponse, StatusUpdateResponse, ApprovalRequest, RejectionRequest, CreateBatchRequest, UpdateBatchRequest, AdjustQuantityRequest, AdjustQuantityResponse, QuantityAdjustmentHistory, BatchNumberPreview, ValidationResult

### BatchDTO.CreateBatchRequest

| Field | Type | Validation |
|-------|------|------------|
| batchNumber | String | `@NotBlank`, `@Size(max=100)` |
| materialId | String | `@NotBlank`, `@Size(max=100)` |
| materialName | String | `@Size(max=200)` |
| quantity | BigDecimal | `@NotNull` |
| unit | String | `@Size(max=20)` |

### BatchDTO.AdjustQuantityRequest

| Field | Type | Validation |
|-------|------|------------|
| newQuantity | BigDecimal | `@NotNull` |
| reason | String | `@NotBlank`, `@Size(min=10, max=500)` |
| adjustmentType | String | `@NotBlank` |

---

## 12.9 InventoryDTO

**Package:** `com.mes.production.dto`

| Field | Type |
|-------|------|
| inventoryId | Long |
| materialId | String |
| materialName | String |
| inventoryType | String |
| state | String |
| quantity | BigDecimal |
| unit | String |
| location | String |
| batchId | Long |
| batchNumber | String |
| blockReason | String |
| blockedBy | String |
| blockedOn | LocalDateTime |
| scrapReason | String |
| scrappedBy | String |
| scrappedOn | LocalDateTime |
| reservedForOrderId | Long |
| reservedForOperationId | Long |
| reservedBy | String |
| reservedOn | LocalDateTime |
| reservedQty | BigDecimal |

**Nested classes:** StateUpdateResponse, BlockRequest, ScrapRequest, ReserveRequest, CreateInventoryRequest, UpdateInventoryRequest, ReceiveMaterialRequest, ReceiveMaterialResponse

### InventoryDTO.ReceiveMaterialRequest

| Field | Type | Validation |
|-------|------|------------|
| materialId | String | `@NotBlank`, `@Size(max=100)` |
| materialName | String | `@Size(max=200)` |
| quantity | BigDecimal | `@NotNull`, `@Positive` |
| unit | String | `@Size(max=20)` |
| supplierBatchNumber | String | `@Size(max=100)` |
| supplierId | String | `@Size(max=50)` |
| receivedDate | LocalDate | |
| expiryDate | LocalDate | |
| location | String | `@Size(max=200)` |
| notes | String | `@Size(max=500)` |

---

## 12.10 EquipmentDTO

**Package:** `com.mes.production.dto`

| Field | Type |
|-------|------|
| equipmentId | Long |
| equipmentCode | String |
| name | String |
| equipmentType | String |
| equipmentCategory | String |
| capacity | BigDecimal |
| capacityUnit | String |
| location | String |
| status | String |
| maintenanceReason | String |
| maintenanceStart | LocalDateTime |
| maintenanceBy | String |
| expectedMaintenanceEnd | LocalDateTime |
| holdReason | String |
| holdStart | LocalDateTime |
| heldBy | String |

**Nested classes:** StatusUpdateResponse, MaintenanceRequest, HoldRequest, CreateEquipmentRequest, UpdateEquipmentRequest

**Conversion methods:** `fromEntity(Equipment)`

---

## 12.11 HoldDTO

**Package:** `com.mes.production.dto`

### HoldDTO.ApplyHoldRequest

| Field | Type | Validation |
|-------|------|------------|
| entityType | String | `@NotBlank` |
| entityId | Long | `@NotNull` |
| reason | String | `@NotBlank` |
| comments | String | |

### HoldDTO.ReleaseHoldRequest

| Field | Type |
|-------|------|
| releaseComments | String |

### HoldDTO.HoldResponse

| Field | Type |
|-------|------|
| holdId | Long |
| entityType | String |
| entityId | Long |
| entityName | String |
| reason | String |
| comments | String |
| appliedBy | String |
| appliedOn | LocalDateTime |
| releasedBy | String |
| releasedOn | LocalDateTime |
| releaseComments | String |
| status | String |
| durationMinutes | Long |

### HoldDTO.HoldCountResponse

| Field | Type |
|-------|------|
| activeHolds | Long |

---

## 12.12 BomDTO

**Package:** `com.mes.production.dto`

**Nested classes (20):** BomRequirement, BomValidationRequest, MaterialConsumption, BomValidationResult, RequirementCheck, BomTreeResponse, SuggestedConsumptionResponse, SuggestedMaterial, AvailableBatch, BomTreeNode, BomTreeFullResponse, CreateBomNodeRequest, CreateBomTreeRequest, UpdateBomNodeRequest, MoveBomNodeRequest, BomListResponse, BomProductSummary, UpdateBomSettingsRequest, UpdateBomSettingsResponse

(See full field listing in source file `BomDTO.java`)

---

## 12.13 RoutingDTO

**Package:** `com.mes.production.dto`

**Nested classes (10):** RoutingInfo, RoutingStepInfo, CreateRoutingRequest, UpdateRoutingRequest, RoutingStatus, ActivateRoutingRequest, HoldRoutingRequest, CreateRoutingStepRequest, UpdateRoutingStepRequest, ReorderStepsRequest

---

## 12.14 DashboardDTO

**Package:** `com.mes.production.dto`

**Nested classes:** Summary, RecentActivity, OrderSummary, OperationSummary, AuditActivity

---

## 12.15 AuditDTO

**Package:** `com.mes.production.dto`

**Nested classes:** AuditEntryResponse (with `fromEntity` and `fromEntities` methods), AuditHistoryResponse, DateRangeRequest, AuditSummary

---

## 12.16 ReportAnalyticsDTO

**Package:** `com.mes.production.dto`

**Nested classes (14):** ProductionSummary, ProductionByOperation, OperationProductionEntry, ScrapAnalysis, ScrapByProductEntry, ScrapByOperationEntry, OrderFulfillment, InventoryBalance, InventoryByTypeEntry, InventoryByStateEntry, OperationCycleTimes, CycleTimeEntry, HoldAnalysis, HoldByEntityTypeEntry, HoldReasonEntry, ExecutiveDashboard

---

## 12.17 Pagination DTOs

### PageRequestDTO
**Package:** `com.mes.production.dto`

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| page | int | 0 | Page number (0-indexed) |
| size | int | 20 | Items per page (max 100) |
| sortBy | String | null | Sort field |
| sortDirection | String | "ASC" | ASC or DESC |
| search | String | null | General search term |
| status | String | null | Status filter |
| type | String | null | Type filter |
| dateFrom | String | null | Date from filter (ISO format) |
| dateTo | String | null | Date to filter (ISO format) |

**Methods:** `normalize()`, `toPageable()`, `toPageable(String)`, `toPageable(String...)`, `hasFilters()`, `getSearchTermLower()`, `getSearchPattern()`, `defaults()`

### PagedResponseDTO\<T\>
**Package:** `com.mes.production.dto`

| Field | Type | Description |
|-------|------|-------------|
| content | List\<T\> | Current page items |
| page | int | Current page number |
| size | int | Page size |
| totalElements | long | Total elements |
| totalPages | int | Total pages |
| first | boolean | Is first page |
| last | boolean | Is last page |
| hasNext | boolean | Has next page |
| hasPrevious | boolean | Has previous page |
| sortBy | String | Sort field |
| sortDirection | String | Sort direction |
| filterValue | String | Active filter |

**Static factory methods:** `fromPage(Page<T>)`, `fromPage(Page<T>, String, String)`, `fromPage(Page<T>, String, String, String)`, `ofAll(List<T>)`

---

## 12.18 Master Data DTOs

### CustomerDTO

| Field | Type | Validation |
|-------|------|------------|
| customerId | Long | |
| customerCode | String | `@NotBlank`, `@Size(max=50)` |
| customerName | String | `@NotBlank`, `@Size(max=200)` |
| contactPerson | String | `@Size(max=100)` |
| email | String | `@Email`, `@Size(max=100)` |
| phone | String | `@Size(max=50)` |
| address | String | `@Size(max=500)` |
| city | String | `@Size(max=100)` |
| country | String | `@Size(max=100)` |
| taxId | String | `@Size(max=50)` |
| status | String | |

**Conversion methods:** `fromEntity(Customer)`, `toEntity()`

### MaterialDTO

| Field | Type | Validation |
|-------|------|------------|
| materialId | Long | |
| materialCode | String | `@NotBlank`, `@Size(max=50)` |
| materialName | String | `@NotBlank`, `@Size(max=200)` |
| description | String | `@Size(max=500)` |
| materialType | String | `@NotBlank` |
| baseUnit | String | `@NotBlank` |
| materialGroup | String | |
| sku | String | |
| standardCost | BigDecimal | |
| costCurrency | String | |
| minStockLevel | BigDecimal | |
| maxStockLevel | BigDecimal | |
| reorderPoint | BigDecimal | |
| leadTimeDays | Integer | |
| shelfLifeDays | Integer | |
| storageConditions | String | |
| status | String | |

**Conversion methods:** `fromEntity(Material)`, `toEntity()`

### ProductDTO

| Field | Type | Validation |
|-------|------|------------|
| productId | Long | |
| sku | String | `@NotBlank`, `@Size(max=50)` |
| productName | String | `@NotBlank`, `@Size(max=200)` |
| description | String | `@Size(max=500)` |
| productCategory | String | |
| productGroup | String | |
| baseUnit | String | `@NotBlank` |
| weightPerUnit | BigDecimal | |
| weightUnit | String | |
| standardPrice | BigDecimal | |
| priceCurrency | String | |
| minOrderQty | BigDecimal | |
| leadTimeDays | Integer | |
| materialId | Long | |
| status | String | |

**Conversion methods:** `fromEntity(Product)`, `toEntity()`

---

## 12.19 Configuration DTOs

### HoldReasonDTO, DelayReasonDTO, ProcessParametersConfigDTO, BatchNumberConfigDTO, QuantityTypeConfigDTO

All follow the same pattern with `fromEntity()` and `toEntity()` conversion methods. Validation annotations mirror the entity field constraints. See individual source files for complete field listings.

### OperationTemplateDTO

**Nested classes:** Response, CreateRequest, UpdateRequest, Summary

### OperatorDTO

| Field | Type | Validation |
|-------|------|------------|
| operatorId | Long | |
| operatorCode | String | `@NotBlank`, `@Size(max=50)` |
| name | String | `@NotBlank`, `@Size(max=200)` |
| department | String | `@Size(max=100)` |
| shift | String | `@Size(max=50)` |
| status | String | |

**Conversion methods:** `fromEntity(Operator)`, `toEntity()`

---

## 12.20 Tracking DTOs

### InventoryMovementDTO

**Nested: MovementInfo** - Fields: movementId, inventoryId, materialId, materialName, operationId, operationName, movementType, quantity, unit, timestamp, reason, status, createdBy

**Nested: RecordMovementRequest** - Fields: inventoryId, operationId, movementType, quantity, reason

### BatchAllocationDTO

**Nested: AllocationInfo** - Fields: allocationId, batchId, batchNumber, materialId, materialName, orderLineId, orderId, productSku, productName, allocatedQty, unit, timestamp, status, createdBy

**Nested: AllocateRequest** - Fields: batchId, orderLineId, quantity

**Nested: UpdateQuantityRequest** - Fields: quantity

**Nested: BatchAvailability** - Fields: batchId, batchNumber, totalQuantity, allocatedQuantity, availableQuantity, fullyAllocated

### EquipmentUsageDTO

**Nested: UsageInfo** - Fields: usageId, operationId, operationName, equipmentId, equipmentCode, equipmentName, operatorId, operatorCode, operatorName, startTime, endTime, status, createdOn

**Nested: LogUsageRequest** - Fields: operationId, equipmentId, operatorId, startTime, endTime

**Nested: BulkLogRequest** - Fields: operationId, equipmentIds (List), operatorIds (List), startTime, endTime

---

# 13. Relationship Diagram

```
                            +------------+
                            |   Customer |
                            +------+-----+
                                   |
                            customer_ref_id
                                   |
+--------+     order_id     +------v-----+    order_line_id    +----------------+
|  Order  |<----------------|OrderLineItem|<-------------------|   Operation    |
+--------+     1:N          +------+-----+       1:N           +-------+--------+
                                   |                                   |
                            process_id (cached)              operation_id |
                                   |                                   |
                            +------v-----+                    +--------v--------+
                            |  Process   |              +---->|ProductionConfirm.|
                            +------+-----+              |     +--------+--------+
                                   |                    |              |
                            operations (1:N)      confirmations    confirmation_id
                                   |                    |              |
                            +------v-----+              |     +--------v--------+
                            | (same as   |              |     | ConsumedMaterial |
                            | Operation) |--------------+     +-----------------+
                            +------------+                    | ProducedOutput   |
                                                              +-----------------+
                                                              | ProcessParamVal  |
                                                              +-----------------+

+----------+   routing_id  +-------------+  operation_template_id  +-----------------+
|  Routing |<--------------| RoutingStep |------------------------>|OperationTemplate|
+----------+      1:N      +-------------+                         +-----------------+
     |
  process_id
     |
  Process


+-------+  batch_id   +-----------+                    +------------------+
| Batch |<-------------|  Inventory|                    |  BatchRelation   |
+---+---+              +-----------+                    +------------------+
    |                                                   | parent_batch_id -> Batch |
    +---batch_id----> BatchOrderAllocation              | child_batch_id  -> Batch |
    +---batch_id----> BatchQuantityAdjustment           +------------------+

ProductionConfirmation --ManyToMany--> Equipment  (via confirmation_equipment)
ProductionConfirmation --ManyToMany--> Operator   (via confirmation_operators)

OperationEquipmentUsage --> Operation, Equipment, Operator
InventoryMovement --> Operation, Inventory

Self-referencing hierarchies:
  MaterialGroup.parentGroup -> MaterialGroup
  ProductCategory.parentCategory -> ProductCategory
  Location.parentLocation -> Location
  ProductGroup.category -> ProductCategory
```

---

# 14. Validation Summary

### Validation Annotations Used

| Annotation | Count | Description |
|-----------|-------|-------------|
| `@NotBlank` | 30+ | Non-null, non-empty, non-whitespace String |
| `@NotNull` | 12+ | Non-null value of any type |
| `@NotEmpty` | 4 | Non-null, non-empty collection or String |
| `@Size` | 35+ | String length constraint (min/max) |
| `@Email` | 3 | Valid email format |
| `@Positive` | 3 | Number > 0 |
| `@Valid` | 1 | Cascaded validation on nested objects |

### JPA Column Constraints

| Constraint | Usage |
|-----------|-------|
| `nullable=false` | Required columns across all entities |
| `unique=true` | Business keys: email, order_number, batch_number, equipment_code, operator_code, customer_code, material_code, sku, config_name, reason_code, group_code, category_code, location_code, department_code, shift_code, attribute_code, type_code |
| `precision=15, scale=4` | Standard BigDecimal for quantities, prices |
| `precision=10, scale=2` | Temperature, moisture |
| `precision=5, scale=2` | Moisture content, temperature ranges |
| `columnDefinition="TEXT"` | Long text fields: comments, release_comments, old_value, new_value, error_message, allowed_values |
| `length=N` | Various string length constraints (3-1000) |

### ID Generation Strategy

All entities use `@GeneratedValue(strategy = GenerationType.IDENTITY)` -- database auto-increment.

### Fetch Strategy

All `@ManyToOne` relationships use `FetchType.LAZY`.
All `@OneToMany` relationships use `FetchType.LAZY`.
All `@ManyToMany` relationships use `FetchType.LAZY`.

---

*End of MES Entity & DTO Reference Document*
