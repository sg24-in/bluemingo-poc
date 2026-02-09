# MES POC — Bug Fixes Log

**Branch:** `poc`
**Period:** February 2026
**Total Bug Fixes:** 6

---

## Table of Contents

1. [BUG-001: Customer and Product Not Visible on Order Edit Page](#bug-001)
2. [BUG-002: Production Confirm — NonUniqueResultException and Order Detail UI](#bug-002)
3. [BUG-003: Batch Number Preview 400 Error and Production Confirm UX](#bug-003)
4. [BUG-004: Accidentally Deleted Backend APIs and Dashboard Layout](#bug-004)
5. [BUG-005: RoutingStepRepository Broken Queries](#bug-005)
6. [BUG-006: Batch Search E2E Test Using Invalid Pattern](#bug-006)

---

## BUG-001: Customer and Product Not Visible on Order Edit Page {#bug-001}

| Field | Value |
|-------|-------|
| **Commit** | `52465fc` |
| **Severity** | High |
| **Area** | Frontend — Order Form |
| **Status** | Fixed |

### Problem

When navigating to the order edit page (e.g., `/#/orders/3/edit`), both the Customer dropdown and the Product dropdown in the Line Items section displayed "Select a..." placeholder text instead of the actual values.

### Root Cause

Async race condition in `OrderFormComponent.ngOnInit()`. Three API calls — `loadOrder()`, `loadCustomers()`, and `loadProducts()` — all fire in parallel. If the order data loaded before the customer/product arrays were populated, Angular's `<select>` elements could not match the form values to any `<option>` because the options didn't exist in the DOM yet. Angular does not retroactively re-match when options are added later.

### Fix

Replaced dropdowns with read-only `<input>` labels in edit mode:
- **Customer:** Shows `customerId - customerName` as a read-only input in edit mode; dropdown only shown for new orders.
- **Product:** Shows `productSku - productName` as a read-only input for existing line items in edit mode; dropdown shown for newly added line items.

### Solution Applied

In `order-form.component.html`, added `*ngIf` conditionals to toggle between two rendering modes:

**Customer field:**
```html
<!-- Read-only label in edit mode -->
<input *ngIf="isEditMode" type="text"
  [value]="form.get('customerId')?.value + ' - ' + form.get('customerName')?.value"
  readonly />
<!-- Dropdown for new orders -->
<select *ngIf="!isEditMode" formControlName="customerId" ...>
```

**Product field (per line item):**
```html
<!-- Read-only for existing line items in edit mode -->
<input *ngIf="isEditMode && lineItems.at(i).get('orderLineId')?.value" type="text"
  [value]="lineItems.at(i).get('productSku')?.value + ' - ' + lineItems.at(i).get('productName')?.value"
  readonly />
<!-- Dropdown for new line items -->
<select *ngIf="!isEditMode || !lineItems.at(i).get('orderLineId')?.value"
  formControlName="productSku" ...>
```

The key insight: the form already has `customerName` and `productName` populated from the API response via `loadOrder()` — only the `<select>` matching was broken. By rendering a plain `<input readonly>` bound to these existing form values, the display is immediate and independent of when the dropdown option arrays load.

### Files Modified

| File | Change |
|------|--------|
| `frontend/src/app/features/orders/order-form/order-form.component.html` | Added conditional read-only labels for customer and product fields in edit mode |
| `e2e/tests/03-orders.test.js` | Added E2E test verifying customer and product labels are visible in edit mode |

### Test Coverage

- E2E Test: "Orders — Customer & Product Visible in Edit Mode" — navigates to `/orders/3/edit`, verifies both read-only inputs have non-empty values.

---

## BUG-002: Production Confirm — NonUniqueResultException and Order Detail UI {#bug-002}

| Field | Value |
|-------|-------|
| **Commit** | `c2ac56c` |
| **Severity** | Critical |
| **Area** | Backend — Production Service; Frontend — Order Detail |
| **Status** | Fixed |

### Problem

1. **Backend:** Production confirmation failed with `NonUniqueResultException` when confirming operations for processes shared across multiple orders.
2. **Frontend:** The Edit Order button was visible for COMPLETED and CANCELLED orders, which should not be editable.
3. **Frontend:** Process flow chart labels overflowed their containers when operation names were long.

### Root Cause

1. The `findNextOperation` query in `OperationRepository` was scoped by `processId` instead of `orderLineId`. Since a process can be shared across multiple orders, the query returned multiple results instead of one.
2. No status-based visibility check on the Edit button in the order detail component.
3. Flow chart node CSS lacked text truncation.

### Fix

1. Changed the `findNextOperation` query to scope by `orderLineId` instead of `processId`, ensuring uniqueness within a single order's line item.
2. Added conditional rendering to hide the Edit button when order status is `COMPLETED` or `CANCELLED`.
3. Redesigned flow chart to a vertical row-based layout with dynamic height and added CSS text truncation for long labels.

### Solution Applied

**1. Backend query fix** in `OperationRepository.java`:
```java
// BEFORE (broken): scoped by processId — returns multiple results when process is shared
@Query("SELECT o FROM Operation o WHERE o.processId = :processId AND o.sequenceNumber > :seq ORDER BY o.sequenceNumber ASC")

// AFTER (fixed): scoped by orderLineId — always unique within a line item
@Query("SELECT o FROM Operation o WHERE o.orderLineId = :orderLineId AND o.sequenceNumber > :seq ORDER BY o.sequenceNumber ASC")
```
The `ProductionService` was updated to pass `orderLineId` from the confirmed operation instead of `processId`.

**2. Edit button visibility** in `order-detail.component.html`:
```html
<button *ngIf="order.status !== 'COMPLETED' && order.status !== 'CANCELLED'"
  class="btn btn-primary" (click)="editOrder()">Edit Order</button>
```

**3. Flow chart redesign** in `order-detail.component.ts`:
- Switched from horizontal fixed-width layout to vertical row-based layout
- Each operation renders as a row with status-colored left border
- Added CSS `text-overflow: ellipsis` and `max-width` constraints on node labels
- Chart container uses `min-height` based on operation count for dynamic sizing

### Files Modified

| File | Change |
|------|--------|
| `backend/src/main/java/com/mes/production/repository/OperationRepository.java` | Changed query to scope by `orderLineId` |
| `backend/src/main/java/com/mes/production/service/ProductionService.java` | Updated service to pass `orderLineId` |
| `backend/src/test/java/.../ProductionServiceTest.java` | Added regression test for the fix |
| `frontend/src/app/features/orders/order-detail/order-detail.component.html` | Hide Edit button for COMPLETED/CANCELLED |
| `frontend/src/app/features/orders/order-detail/order-detail.component.ts` | Redesigned flow chart layout |
| `frontend/src/app/features/orders/order-detail/order-detail.component.css` | Fixed label overflow with truncation |
| `frontend/src/app/features/orders/order-detail/order-detail.component.spec.ts` | Added 5 unit tests for edit button visibility |
| `e2e/tests/03-orders.test.js` | Added 3 E2E tests for order detail |
| `e2e/tests/04-production.test.js` | Added 1 E2E regression test |

### Test Coverage

- Backend unit test: Verifies `findNextOperation` returns correct result when process is shared.
- Frontend unit tests (5): Edit button visibility per order status.
- E2E tests (4): Order detail UI and production confirm regression.

---

## BUG-003: Batch Number Preview 400 Error and Production Confirm UX {#bug-003}

| Field | Value |
|-------|-------|
| **Commit** | `316595e` |
| **Severity** | High |
| **Area** | Backend — Schema; Frontend — Production Confirm |
| **Status** | Fixed |

### Problem

1. **Backend:** The `/api/batches/preview-number` endpoint returned a 400 error because the `batch_number_config` table was missing the `material_id` column.
2. **Frontend:** On the production confirm page, the "Apply Suggestions" button was disabled until a material was manually pre-selected, making the BOM suggestion feature unintuitive.
3. **Frontend:** The "Selected Materials" section was placed below the "Available Inventory" section, making it hard to see what was already selected.

### Root Cause

1. SQL patch `004_batch_number_config.sql` did not include the `material_id` column in the table definition, causing a schema mismatch with the entity.
2. The Apply Suggestions button had a guard checking `selectedMaterials.length > 0` before enabling.
3. Component template ordered sections with Available Inventory first.

### Fix

1. Added `material_id` column to both the PostgreSQL patch and the H2 demo schema.
2. Removed the material pre-selection guard from the Apply Suggestions button.
3. Reordered template to show Selected Materials above Available Inventory.

### Solution Applied

**1. Schema fix** — Created new patch `004_batch_number_config_material_id.sql`:
```sql
ALTER TABLE batch_number_config ADD COLUMN IF NOT EXISTS material_id VARCHAR(50);
```
Also updated `demo/schema.sql` (H2) to include the column in the `CREATE TABLE` statement so both profiles stay in sync.

**2. Apply Suggestions button** in `production-confirm.component.html`:
```html
<!-- BEFORE: disabled until materials pre-selected -->
<button [disabled]="selectedMaterials.length === 0" (click)="applySuggestions()">

<!-- AFTER: always enabled when suggestions are available -->
<button [disabled]="!suggestedConsumption" (click)="applySuggestions()">
```

**3. Section reorder** — Moved the `Selected Materials` `<div>` block above the `Available Inventory` block in the template, so users immediately see what BOM suggestions were applied before scrolling to manually add more.

### Files Modified

| File | Change |
|------|--------|
| `backend/src/main/resources/patches/001_schema.sql` | Added `material_id` column |
| `backend/src/main/resources/demo/schema.sql` | Added `material_id` column (H2) |
| `backend/src/main/resources/patches/004_batch_number_config_material_id.sql` | New patch for existing deployments |
| `frontend/src/app/features/production/production-confirm/production-confirm.component.html` | Reordered sections, fixed button state |
| `frontend/src/app/features/production/production-confirm/production-confirm.component.ts` | Removed guard |
| `e2e/tests/04-production.test.js` | Added E2E tests for the fixes |

### Test Coverage

- E2E tests: Verify batch preview loads, Apply Suggestions button works without pre-selection.

---

## BUG-004: Accidentally Deleted Backend APIs and Dashboard Layout {#bug-004}

| Field | Value |
|-------|-------|
| **Commit** | `858dc35` |
| **Severity** | Critical |
| **Area** | Backend — Controllers/Services; Frontend — Dashboard |
| **Status** | Fixed |

### Problem

1. **Backend:** During the POC branch cleanup (removing non-POC features), several critical controllers, services, DTOs, entities, and repositories were accidentally deleted — including BOM, Hold, and Inventory APIs.
2. **Frontend:** Dashboard grid layout was misaligned after cleanup — the metrics row assumed 4 cards but only 3 existed; chart and table sections had incorrect column spans.
3. **Frontend:** Equipment and operator name mapping in the production confirm component was broken.

### Root Cause

1. Over-aggressive code removal during the POC branch cleanup phase. The BOM, Hold, and Inventory modules were mistakenly categorized as out-of-scope.
2. Dashboard CSS grid template didn't match the actual number of content sections after removal of out-of-scope widgets.
3. Production confirm component referenced deleted service methods.

### Fix

1. Restored all accidentally deleted files: 3 controllers, 4 services, 3 DTOs, 1 entity, 3 repositories (19 files total, ~3,300 lines).
2. Fixed dashboard grid to match actual content (3 metrics, 2 charts) and restructured Needs Attention + Currently Running sections into a side-by-side layout.
3. Fixed equipment/operator name mapping in production confirm component.

### Solution Applied

**1. Restored backend modules** — Retrieved the full source of all deleted files from git history (`main` branch) and restored them into the `poc` branch:
- **Controllers:** `BomController` (238 lines, 15 endpoints), `HoldController` (127 lines, 6 endpoints), `InventoryController` (241 lines, 8 endpoints)
- **Services:** `BomService`, `BomValidationService`, `HoldService`, `InventoryService` (~1,746 lines combined)
- **DTOs:** `BomDTO` (291 lines, 7 inner classes), `HoldDTO`, `InventoryMovementDTO`
- **Entity:** `BillOfMaterial` (81 lines)
- **Repositories:** `BomRepository`, `DelayReasonRepository`, `HoldReasonRepository`

**2. Dashboard grid fix** in `dashboard.component.css`:
```css
/* BEFORE: assumed 4 metric cards */
.metrics-row { grid-template-columns: repeat(4, 1fr); }

/* AFTER: matches actual 3 cards */
.metrics-row { grid-template-columns: repeat(3, 1fr); }

/* Side-by-side layout for Needs Attention + Currently Running */
.bottom-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
```

**3. Production confirm name mapping** in `production-confirm.component.ts`:
```typescript
// BEFORE: referenced deleted methods
this.equipmentName = this.equipmentService.getNameById(id);

// AFTER: uses inline lookup from loaded arrays
this.equipmentName = this.equipmentList.find(e => e.equipmentId === id)?.equipmentName || '';
```

### Files Restored/Modified

| File | Change |
|------|--------|
| `backend/.../controller/BomController.java` | Restored |
| `backend/.../controller/HoldController.java` | Restored |
| `backend/.../controller/InventoryController.java` | Restored |
| `backend/.../dto/BomDTO.java` | Restored |
| `backend/.../dto/HoldDTO.java` | Restored |
| `backend/.../dto/InventoryMovementDTO.java` | Restored |
| `backend/.../entity/BillOfMaterial.java` | Restored |
| `backend/.../repository/BomRepository.java` | Restored |
| `backend/.../repository/DelayReasonRepository.java` | Restored |
| `backend/.../repository/HoldReasonRepository.java` | Restored |
| `backend/.../service/BomService.java` | Restored |
| `backend/.../service/BomValidationService.java` | Restored |
| `backend/.../service/HoldService.java` | Restored |
| `backend/.../service/InventoryService.java` | Restored |
| `frontend/.../dashboard/dashboard.component.css` | Fixed grid layout |
| `frontend/.../dashboard/dashboard.component.html` | Fixed grid template |
| `frontend/.../production-confirm.component.ts` | Fixed name mapping |

---

## BUG-005: RoutingStepRepository Broken Queries {#bug-005}

| Field | Value |
|-------|-------|
| **Commit** | `b6919b4` |
| **Severity** | High |
| **Area** | Backend — Repository |
| **Status** | Fixed |

### Problem

All `RoutingStepRepository` JPA queries failed at runtime with query parsing errors after the POC cleanup phase.

### Root Cause

During cleanup, `@ManyToOne` JPA relationships in the `RoutingStep` entity were replaced with plain `Long` ID fields (e.g., `routingId` instead of `Routing routing`). However, the repository queries still used JPA navigation syntax (e.g., `r.routing.routingId`) which is only valid when a `@ManyToOne` relationship exists.

### Fix

Replaced all JPA navigation-style queries with direct field references:
- `r.routing.routingId` → `r.routingId`
- `r.operationTemplate.operationTemplateId` → `r.operationTemplateId`

### Solution Applied

Updated 8 `@Query` annotations in `RoutingStepRepository.java` to use direct field references instead of JPA navigation paths:

```java
// BEFORE (broken): JPA navigation syntax requires @ManyToOne relationship
@Query("SELECT rs FROM RoutingStep rs WHERE rs.routing.routingId = :routingId ORDER BY rs.stepOrder")
@Query("DELETE FROM RoutingStep rs WHERE rs.routing.routingId = :routingId")
@Query("SELECT rs FROM RoutingStep rs WHERE rs.operationTemplate.operationTemplateId = :templateId")

// AFTER (fixed): direct field reference works with plain Long ID fields
@Query("SELECT rs FROM RoutingStep rs WHERE rs.routingId = :routingId ORDER BY rs.stepOrder")
@Query("DELETE FROM RoutingStep rs WHERE rs.routingId = :routingId")
@Query("SELECT rs FROM RoutingStep rs WHERE rs.operationTemplateId = :templateId")
```

Also removed 38 lines of dead code (unused query methods that referenced the old relationship paths).

### Files Modified

| File | Change |
|------|--------|
| `backend/src/main/java/com/mes/production/repository/RoutingStepRepository.java` | Replaced 8 queries with direct field references, removed 38 lines of dead code |

---

## BUG-006: Batch Search E2E Test Using Invalid Pattern {#bug-006}

| Field | Value |
|-------|-------|
| **Commit** | `badb23c` |
| **Severity** | Low |
| **Area** | E2E Tests |
| **Status** | Fixed |

### Problem

The batch search E2E test and the comprehensive demo recording script searched for `RM-BATCH`, which returned no results, causing the test to fail or the demo to show an empty table.

### Root Cause

The search term `RM-BATCH` did not match any batch numbers in the demo seed data. Actual batch numbers in demo data follow the pattern `B-IM-xxx`, `B-FG-xxx`, `B-RM-xxx`.

### Fix

Changed the search term from `RM-BATCH` to `B-IM` to match actual demo data batch naming conventions.

### Solution Applied

Simple string replacement in two files:

```javascript
// BEFORE
const searchTerm = 'RM-BATCH';

// AFTER
const searchTerm = 'B-IM';
```

The pattern `B-IM` matches intermediate material batches (e.g., `B-IM-BLOOM-001`, `B-IM-SLAB-002`) which are present in the demo seed data (`demo/data.sql`).

### Files Modified

| File | Change |
|------|--------|
| `e2e/tests/06-batches.test.js` | Changed search term to `B-IM` |
| `e2e/record-comprehensive-demo.js` | Changed search term to `B-IM` |

---

## Summary

| # | Bug | Severity | Root Cause | Solution Applied |
|---|-----|----------|------------|-----------------|
| BUG-001 | Order edit dropdowns empty | High | Async race condition between `loadOrder()` and `loadProducts()`/`loadCustomers()` | Replaced `<select>` with read-only `<input>` labels in edit mode using `*ngIf="isEditMode"` |
| BUG-002 | Production confirm crash + UI | Critical | `findNextOperation` query scoped by `processId` instead of `orderLineId` | Changed query to scope by `orderLineId`; added status-based `*ngIf` on Edit button; redesigned flow chart layout |
| BUG-003 | Batch preview 400 error | High | Missing `material_id` column in `batch_number_config` table | Added column via new SQL patch; removed button guard; reordered UI sections |
| BUG-004 | Deleted APIs + broken dashboard | Critical | Over-aggressive code removal during POC cleanup | Restored 19 files from git history; fixed dashboard grid to `repeat(3, 1fr)`; fixed name mapping to use inline array lookup |
| BUG-005 | Routing queries broken | High | JPA navigation syntax on plain `Long` fields after `@ManyToOne` removal | Replaced `r.routing.routingId` → `r.routingId` in 8 queries; removed 38 lines dead code |
| BUG-006 | E2E test wrong search term | Low | Search term `RM-BATCH` didn't match demo data naming | Changed search term to `B-IM` matching actual batch names |
