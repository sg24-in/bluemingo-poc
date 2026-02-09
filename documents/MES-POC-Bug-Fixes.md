# MES POC Branch: Bug Fixes & Schema Changes Analysis

**Date:** 2026-02-09
**Branch:** poc (compared against main)
**Purpose:** Document all non-deletion changes made on POC branch that need to be applied back to main

---

## A. Schema / Database Fixes

### 1. Schema Consolidation
Main has 45 incremental patches (`001` through `045`). POC consolidated to 6 patches.
**Action for main:** Do NOT consolidate. Instead, create new incremental patches for each fix.

### 2. Missing DB Columns — Entity-Schema Mismatch (patch 004)
These columns existed in JPA entities but **not** in the database:

| Table | Missing Column(s) | Type | Purpose |
|-------|-------------------|------|---------|
| `orders` | `customer_ref_id` | `BIGINT` | Customer FK reference |
| `operations` | `confirmed_qty` | `DECIMAL(15,4)` | Partial confirmation tracking |
| `operations` | `start_time` | `TIMESTAMP` | Execution start tracking |
| `operations` | `end_time` | `TIMESTAMP` | Execution end tracking |
| `batches` | `created_via` | `VARCHAR(50)` | Batch creation source (PRODUCTION, SPLIT, MERGE, MANUAL, RECEIPT) |
| `batches` | `received_date` | `DATE` | RM receipt tracking |
| `batches` | `receipt_notes` | `VARCHAR(500)` | RM receipt comments |
| `order_line_items` | `process_id` | `BIGINT` | Process assignment |
| `inventory` | `inventory_form` | `VARCHAR(20)` | Physical form classification |
| `inventory` | `current_temperature` | `DECIMAL(10,2)` | Temperature tracking |
| `inventory` | `moisture_content` | `DECIMAL(5,2)` | Moisture tracking |
| `inventory` | `density` | `DECIMAL(10,4)` | Density tracking |
| `inventory` | `scrap_reason` | `VARCHAR(500)` | Scrap tracking |
| `inventory` | `scrapped_by` | `VARCHAR(100)` | Scrap tracking |
| `inventory` | `scrapped_on` | `TIMESTAMP` | Scrap tracking |
| `inventory` | `reserved_for_order_id` | `BIGINT` | Reservation tracking |
| `inventory` | `reserved_for_operation_id` | `BIGINT` | Reservation tracking |
| `inventory` | `reserved_by` | `VARCHAR(100)` | Reservation tracking |
| `inventory` | `reserved_on` | `TIMESTAMP` | Reservation tracking |
| `inventory` | `reserved_qty` | `DECIMAL(15,4)` | Reservation tracking |
| `batch_quantity_adjustments` | `old_quantity` | `DECIMAL(15,4)` | Entity uses different column name than schema |
| `batch_quantity_adjustments` | `new_quantity` | `DECIMAL(15,4)` | Entity uses different column name than schema |
| `batch_quantity_adjustments` | `adjustment_reason` | `VARCHAR(500)` | Entity uses different column name than schema |
| `batch_size_config` | `material_id` | `VARCHAR(50)` | Missing entity-mapped column |
| `batch_size_config` | `equipment_type` | `VARCHAR(50)` | Missing entity-mapped column |
| `batch_size_config` | `preferred_batch_size` | `DECIMAL(15,4)` | Missing entity-mapped column |
| `batch_size_config` | `allow_partial_batch` | `BOOLEAN DEFAULT TRUE` | Missing entity-mapped column |
| `batch_size_config` | `is_active` | `BOOLEAN DEFAULT TRUE` | Missing entity-mapped column |
| `batch_size_config` | `priority` | `INTEGER DEFAULT 0` | Missing entity-mapped column |

### 3. CHECK Constraint Fixes

| Table | Constraint | What was missing | Fixed Value |
|-------|-----------|-----------------|-------------|
| `order_line_items` | `chk_line_status` | `CANCELLED`, `READY` | `('CREATED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED', 'ON_HOLD')` |
| `batch_relations` | `chk_relation_type` | `CONSUME` | `('SPLIT', 'MERGE', 'CONSUME')` |
| `production_confirmation` | `chk_confirm_status` | `PENDING_REVIEW` | `('CONFIRMED', 'PARTIALLY_CONFIRMED', 'REJECTED', 'PENDING_REVIEW')` |

### 4. JSONB to TEXT (patch 006)

```sql
ALTER TABLE production_confirmation
    ALTER COLUMN process_parameters TYPE TEXT,
    ALTER COLUMN rm_consumed TYPE TEXT;
```

**Root cause:** Entity had `columnDefinition = "CLOB"` which sends VARCHAR. PostgreSQL JSONB rejects plain VARCHAR inserts.

### 5. Missing Join Tables

`confirmation_equipment` and `confirmation_operators` join tables were required by `@ManyToMany` on `ProductionConfirmation` entity but never created in schema.

```sql
CREATE TABLE IF NOT EXISTS confirmation_equipment (
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    equipment_id BIGINT NOT NULL REFERENCES equipment(equipment_id),
    PRIMARY KEY (confirmation_id, equipment_id)
);

CREATE TABLE IF NOT EXISTS confirmation_operators (
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    operator_id BIGINT NOT NULL REFERENCES operators(operator_id),
    PRIMARY KEY (confirmation_id, operator_id)
);
```

### 6. operation_equipment_usage Invalid Status
Status `'ACTIVE'` used in seed data but CHECK constraint only allows `'LOGGED'` or `'CONFIRMED'`. Changed to `'LOGGED'`.

---

## B. Backend Java Bug Fixes

### 1. findNextOperation — 36-Result NonUniqueResultException
**Files:** `OperationRepository.java`, `ProductionService.java`
**Severity:** CRITICAL — Production confirmation fails

**Root cause:** `findNextOperation()` queried by `processId` (shared design-time template). Process 2 (CR Sheet) shared by 18 line items = 36 results → `NonUniqueResultException`.

**Fix:**
```java
// OperationRepository.java
// BEFORE:
@Query("SELECT op FROM Operation op WHERE op.process.processId = :processId AND op.sequenceNumber > :currentSequence ORDER BY op.sequenceNumber ASC")
Optional<Operation> findNextOperation(@Param("processId") Long processId, @Param("currentSequence") Integer currentSequence);

// AFTER:
@Query("SELECT op FROM Operation op WHERE op.orderLineItem.orderLineId = :orderLineId AND op.sequenceNumber > :currentSequence ORDER BY op.sequenceNumber ASC LIMIT 1")
Optional<Operation> findNextOperation(@Param("orderLineId") Long orderLineId, @Param("currentSequence") Integer currentSequence);
```

```java
// ProductionService.java - setNextOperationReady()
// BEFORE:
Process process = currentOp.getProcess();
Optional<Operation> nextOp = operationRepository.findNextOperation(
    process.getProcessId(), currentOp.getSequenceNumber());

// AFTER:
Optional<Operation> nextOp = operationRepository.findNextOperation(
    currentOp.getOrderLineItem().getOrderLineId(), currentOp.getSequenceNumber());
String processName = currentOp.getProcess() != null ? currentOp.getProcess().getProcessName() : "Unknown";
```

### 2. RoutingStepRepository — Broken JPA Navigation
**File:** `RoutingStepRepository.java`
**Severity:** HIGH — All routing queries fail at runtime

**Root cause:** `RoutingStep` entity changed `@ManyToOne Routing routing` → `Long routingId` during POC refactor, but repository still used JPA navigation paths.

**Fix:** All 8 repository methods updated:
```java
// BEFORE:                                          AFTER:
findByRouting_RoutingIdOrderBySequenceNumberAsc  →  findByRoutingIdOrderBySequenceNumberAsc
findByRouting_RoutingIdAndSequenceNumber          →  findByRoutingIdAndSequenceNumber
rs.routing.routingId (in @Query)                  →  rs.routingId
countByRouting_RoutingIdAndStatus                 →  countByRoutingIdAndStatus
findByOperationTemplate_OperationTemplateId       →  findByOperationTemplateId
```

### 3. ProductionConfirmation Entity — CLOB columnDefinition
**File:** `ProductionConfirmation.java`
**Severity:** CRITICAL — Cannot save production confirmations to PostgreSQL

```java
// BEFORE:
@Column(name = "process_parameters", columnDefinition = "CLOB")
private String processParametersJson;
@Column(name = "rm_consumed", columnDefinition = "CLOB")
private String rmConsumedJson;

// AFTER:
@Column(name = "process_parameters")
private String processParametersJson;
@Column(name = "rm_consumed")
private String rmConsumedJson;
```

### 4. GlobalExceptionHandler — NoResourceFoundException → 500
**File:** `GlobalExceptionHandler.java`
**Severity:** LOW — Cosmetic (500 errors in logs for missing static files)

```java
// ADDED:
@ExceptionHandler(NoResourceFoundException.class)
public ResponseEntity<Void> handleNoResourceFound(NoResourceFoundException ex) {
    log.debug("Static resource not found: {}", ex.getResourcePath());
    return ResponseEntity.notFound().build();
}
```

### 5. Order Entity — ManyToOne → Long
**File:** `Order.java`
**Severity:** MEDIUM — Prevents runtime errors if Customer entity not loaded

```java
// BEFORE:
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "customer_ref_id")
private Customer customer;

// AFTER:
@Column(name = "customer_ref_id")
private Long customerRefId;
```

### 6. RoutingStep Entity — ManyToOne → Long
**File:** `RoutingStep.java`
**Severity:** HIGH — Cascading fix for RoutingStepRepository

```java
// BEFORE:
@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "routing_id") private Routing routing;
@ManyToOne(fetch = FetchType.LAZY) @JoinColumn(name = "operation_template_id") private OperationTemplate operationTemplate;

// AFTER:
@Column(name = "routing_id") private Long routingId;
@Column(name = "operation_template_id") private Long operationTemplateId;
```

---

## C. Frontend Bug Fixes

### 1. Customer/Product Dropdowns Empty on Order Edit
**File:** `order-form.component.html`
**Severity:** HIGH — Cannot see customer/product when editing orders

**Root cause:** Async race condition — order data loaded and set `customerId`/`productSku` before dropdown options were populated from separate API calls.

**Fix:** In edit mode, show read-only text inputs instead of dropdowns:
```html
<!-- Read-only in edit mode -->
<input *ngIf="isEditMode" type="text"
  [value]="form.get('customerId')?.value + ' - ' + form.get('customerName')?.value"
  readonly />
<!-- Dropdown only for new orders -->
<select *ngIf="!isEditMode" ...>
```
Same pattern applied for product fields in line items.

### 2. Edit Button Visible on COMPLETED/CANCELLED Orders
**File:** `order-detail.component.html`
**Severity:** LOW — UX issue

```html
<button class="btn btn-primary" (click)="editOrder()"
        *ngIf="order.status !== 'COMPLETED' && order.status !== 'CANCELLED'">
```

### 3. Process Flow Chart Overflow with Multi-Stage Orders
**Files:** `order-detail.component.ts`, `order-detail.component.css`
**Severity:** MEDIUM — Chart unreadable for complex orders

**Changes:**
- Layout: horizontal → vertical row-based (each process = a row)
- Process nodes: left-aligned (`x: 60`), operations spread right (`x: 200 + i * 130`)
- Chart height: `280px` → `450px` with dynamic `Math.max(300, currentRow * 100 + 80)`
- Label truncation: `overflow: 'truncate', ellipsis: '..', width: 95`

### 4. Dashboard Grid Layout Broken
**Files:** `dashboard.component.css`, `dashboard.component.html`
**Severity:** MEDIUM — Visual layout issues

- Metrics grid: `repeat(4, 1fr)` → `repeat(3, 1fr)` (only 3 metrics after stripping)
- Charts grid: `repeat(3, 1fr)` → `repeat(2, 1fr)` (only 2 charts after stripping)
- Combined Alerts + Active Operations into side-by-side `.attention-row`
- Removed `max-width: 200px` from operation status cards

### 5. Equipment/Operator Name Mapping Wrong
**File:** `production-confirm.component.ts`
**Severity:** HIGH — Equipment/operator names blank in production confirm

```typescript
// BEFORE:
equipmentName: eq.equipmentName,
operatorName: op.operatorName,

// AFTER:
equipmentName: eq.name || eq.equipmentName,
operatorName: op.name || op.operatorName,
```

### 6. Production Confirm UX — Material Selection Order
**File:** `production-confirm.component.html`
**Severity:** MEDIUM — UX improvement

- Moved "Selected Materials" section **above** "Available Inventory"
- Removed `[disabled]="!hasSufficientStock()"` from "Apply Suggestions" button
- Added `isMaterialSelected()` visual feedback (green "Added" button, disabled when already added)
- Added count display: `Selected Materials ({{ selectedMaterials.length }})`

### 7. API URL — CORS Fix
**Files:** `environment.ts`, `angular.json`, `proxy.conf.json` (new)
**Severity:** HIGH — Dev mode broken by CORS

```typescript
// environment.ts
// BEFORE: apiUrl: 'http://localhost:8080/api'
// AFTER:  apiUrl: '/api'
```

```json
// proxy.conf.json (new file)
{ "/api": { "target": "http://localhost:8080", "secure": false } }
```

Angular dev server configured to use proxy via `angular.json` → `"proxyConfig": "proxy.conf.json"`.

### 8. E2E Test — Wrong Batch Search Pattern
**File:** `06-batches.test.js`
**Severity:** LOW — Test-only fix

```javascript
// BEFORE: 'RM-BATCH'
// AFTER:  'B-IM'
```

---

## D. Configuration Changes

| File | Change | Reason |
|------|--------|--------|
| `application.yml` | DB: `mes_production` → `mes_poc_dev` | POC isolation |
| `application-tomcat.yml` | DB: `mes_production` → `mes_poc_dev` | POC isolation |

**Note:** This is POC-specific and should NOT be applied to main.

---

## E. New Seed Data Added

| Data | Quantity | Purpose |
|------|----------|---------|
| Intermediate material batches + inventory | 14 batches + 14 inventory records | Materials for production confirm |
| Routings + routing steps | 4 routings, 22 steps | Process routing definitions |
| BOM trees | 88 nodes, 8 products | Bill of materials |
| Production confirmations | 35 records | Historical confirmations |
| Confirmation equipment/operator links | 35 + 35 | Join table data |
| Hold records | 12 (8 active, 4 released) | Hold management |
| Units of measure | 14 | UOM reference data |
| Unit conversions | 16 | UOM conversions |
| Equipment type configs | 13 | Equipment classification |
| Inventory form configs | 9 | Inventory forms |
| Operation equipment usage | 10 | Equipment usage logs |
| Inventory movements | 12 | Material flow tracking |
| Operations for orphan line items | 33 ops for 5 line items | Missing operations |
| Multi-stage orders | 30 orders, 57 line items, 332 operations | Rich demo data |

---

## F. Applicability to Main Branch

### Must Apply (Bug Fixes)
1. findNextOperation scoped by orderLineId (CRITICAL)
2. ProductionConfirmation CLOB → no columnDefinition + JSONB→TEXT patch (CRITICAL)
3. Missing DB columns — entity-schema mismatch (HIGH)
4. CHECK constraint fixes (HIGH)
5. Missing join tables (HIGH)
6. Customer/Product dropdown fix on order edit (HIGH)
7. Equipment/operator name mapping (HIGH)
8. GlobalExceptionHandler NoResourceFoundException (LOW)
9. Production confirm UX improvements (MEDIUM)
10. Edit button hidden for COMPLETED/CANCELLED (LOW)
11. Process flow chart vertical layout (MEDIUM)

### POC-Specific (Do NOT Apply to Main)
1. Database URL change (`mes_poc_dev`)
2. RoutingStep/Order entity ManyToOne → Long (main still has full entities)
3. RoutingStepRepository query changes (follows from entity change)
4. Dashboard grid layout changes (main has more metrics/charts)
5. API URL / proxy config (main may have different setup)
6. Schema consolidation (main uses incremental patches)

### Evaluate Before Applying
1. Seed data — main may already have different/richer data
2. E2E test batch search pattern — depends on main's seed data
