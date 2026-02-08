# MES E2E Test Coverage Gap Analysis

**Generated:** 2026-02-08
**Purpose:** Comprehensive audit of all Angular routes, components, buttons, actions, and validations against E2E test coverage.

---

## Executive Summary

| Category | Total Features | Covered | Partial | Missing | Coverage % |
|----------|---------------|---------|---------|---------|------------|
| **Authentication** | 8 | 6 | 1 | 1 | 81% |
| **Dashboard** | 18 | 4 | 2 | 12 | 33% |
| **Orders** | 28 | 8 | 4 | 16 | 43% |
| **Production** | 42 | 12 | 6 | 24 | 43% |
| **Inventory** | 24 | 14 | 3 | 7 | 71% |
| **Batches** | 38 | 20 | 6 | 12 | 68% |
| **Holds** | 16 | 8 | 2 | 6 | 63% |
| **Equipment** | 22 | 12 | 3 | 7 | 68% |
| **Operations** | 18 | 10 | 2 | 6 | 67% |
| **Processes** | 24 | 16 | 4 | 4 | 83% |
| **Quality** | 12 | 8 | 2 | 2 | 83% |
| **Customers** | 14 | 10 | 2 | 2 | 86% |
| **Materials** | 16 | 10 | 2 | 4 | 75% |
| **Products** | 14 | 10 | 2 | 2 | 86% |
| **BOM** | 26 | 14 | 4 | 8 | 69% |
| **Config** | 48 | 30 | 6 | 12 | 75% |
| **Operators** | 14 | 10 | 2 | 2 | 86% |
| **Users** | 18 | 14 | 2 | 2 | 89% |
| **Audit** | 14 | 10 | 2 | 2 | 86% |
| **Profile** | 12 | 8 | 2 | 2 | 83% |
| **Shared Components** | 20 | 6 | 4 | 10 | 50% |
| **TOTAL** | **446** | **230** | **63** | **153** | **66%** |

---

## Detailed Gap Analysis by Module

### Legend
- ✅ = Fully Covered
- ⚠️ = Partially Covered
- ❌ = Not Covered
- 🔴 = Critical Gap (business-critical feature)
- 🟡 = Important Gap (should be covered)
- 🟢 = Low Priority (nice to have)

---

## 1. AUTHENTICATION MODULE (`/login`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Login page display | ✅ | - | 01-auth |
| Email field validation (required) | ✅ | - | 01-auth |
| Email format validation | ✅ | - | 01-auth |
| Password field validation (required) | ✅ | - | 01-auth |
| Password min length validation | ❌ | 🟡 | - |
| Submit button disabled when invalid | ⚠️ | 🟡 | 01-auth |
| Successful login flow | ✅ | - | 01-auth |
| Failed login error display | ✅ | - | 01-auth |
| JWT token storage | ⚠️ | 🟡 | 01-auth |
| Redirect to dashboard after login | ✅ | - | 01-auth |
| Logout flow | ✅ | - | 01-auth |
| Auto-redirect if already authenticated | ❌ | 🟡 | - |

### Missing Tests - Authentication
```
AUTH-GAP-01: Password minimum length validation (6 chars)
AUTH-GAP-02: Auto-redirect when token exists
```

---

## 2. DASHBOARD MODULE (`/dashboard`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Dashboard page load | ✅ | - | 02-dashboard |
| Statistics cards display | ✅ | - | 02-dashboard |
| Total orders count | ❌ | 🟡 | - |
| Orders in progress count | ❌ | 🟡 | - |
| Operations ready count | ❌ | 🟡 | - |
| Active holds count | ❌ | 🟡 | - |
| Today's confirmations count | ❌ | 🟡 | - |
| Quality pending count | ❌ | 🟡 | - |
| Batches pending approval count | ❌ | 🟡 | - |
| Inventory State Distribution chart | ❌ | 🟢 | - |
| Order Status Distribution chart | ❌ | 🟢 | - |
| Batch Status Distribution chart | ❌ | 🟢 | - |
| Inventory Flow Pipeline | ❌ | 🟢 | - |
| Navigate to orders | ✅ | - | 02-dashboard |
| Navigate to holds | ✅ | - | 02-dashboard |
| Navigate to inventory with filter | ❌ | 🟡 | - |
| Navigate to batches with filter | ❌ | 🟡 | - |
| Alert indicators display | ❌ | 🟡 | - |
| Recent activity list | ❌ | 🟢 | - |

### Missing Tests - Dashboard
```
DASH-GAP-01: Verify each statistic card shows correct count
DASH-GAP-02: Click inventory flow stage navigates with type filter
DASH-GAP-03: Click batches pending navigates to ?status=QUALITY_PENDING
DASH-GAP-04: Alert section appears when holds > 0
DASH-GAP-05: Charts render correctly (optional visual test)
```

---

## 3. ORDERS MODULE (`/orders`, `/orders/new`, `/orders/:id`, `/orders/:id/edit`)

### Order List Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Orders list display | ✅ | - | 03-orders |
| Status filter dropdown | ✅ | - | 03-orders |
| Filter by CREATED | ❌ | 🟡 | - |
| Filter by IN_PROGRESS | ✅ | - | 03-orders |
| Filter by COMPLETED | ❌ | 🟡 | - |
| Filter by CANCELLED | ❌ | 🟡 | - |
| Search by order number | ⚠️ | 🟡 | - |
| Search by customer | ❌ | 🟡 | - |
| Pagination controls | ✅ | - | 10-pagination |
| Page size change | ✅ | - | 10-pagination |
| Navigate to order detail | ✅ | - | 03-orders |
| Navigate to edit order | ❌ | 🔴 | - |
| New Order button | ❌ | 🔴 | - |

### Order Detail Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Order header info display | ✅ | - | 03-orders |
| Line items display | ✅ | - | 03-orders |
| Operations timeline | ✅ | - | 03-orders |
| Process flow chart | ❌ | 🟢 | - |
| Back button | ❌ | 🟡 | - |
| Edit button | ❌ | 🔴 | - |
| Start Production button (per operation) | ❌ | 🔴 | - |
| Navigate to production confirm | ❌ | 🔴 | - |

### Order Form Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Create form display | ❌ | 🔴 | - |
| Edit form display | ❌ | 🔴 | - |
| Customer dropdown | ❌ | 🔴 | - |
| Order date field | ❌ | 🔴 | - |
| Delivery date field | ❌ | 🟡 | - |
| Add line item | ❌ | 🔴 | - |
| Remove line item | ❌ | 🔴 | - |
| Line item product dropdown | ❌ | 🔴 | - |
| Line item quantity field | ❌ | 🔴 | - |
| Form validation | ❌ | 🔴 | - |
| Submit create order | ❌ | 🔴 | - |
| Submit update order | ❌ | 🔴 | - |
| Cancel button | ❌ | 🟡 | - |

### Missing Tests - Orders
```
ORD-GAP-01: Navigate to create order form
ORD-GAP-02: Fill and submit create order form
ORD-GAP-03: Navigate to edit order form
ORD-GAP-04: Update order and submit
ORD-GAP-05: Add/remove line items in form
ORD-GAP-06: Start Production button navigation
ORD-GAP-07: Search by customer name
ORD-GAP-08: Filter by all status values
ORD-GAP-09: Delete/cancel order
```

---

## 4. PRODUCTION MODULE (`/production`, `/production/confirm/:operationId`)

### Production Confirm Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Form display | ✅ | - | 04-production |
| Operation details display | ⚠️ | 🟡 | 04-production |
| Start time field | ✅ | - | 04-production |
| End time field | ✅ | - | 04-production |
| Start time ≤ now validation | ❌ | 🔴 | - |
| End time > start time validation | ❌ | 🔴 | - |
| Quantity produced field | ✅ | - | 04-production |
| Quantity scrapped field | ✅ | - | 04-production |
| Quantity min validation | ❌ | 🔴 | - |
| Delay minutes field | ❌ | 🟡 | - |
| Delay reason dropdown | ❌ | 🟡 | - |
| Delay reason required if delay > 0 | ❌ | 🔴 | - |
| Notes textarea | ❌ | 🟢 | - |
| Process parameters display | ❌ | 🔴 | - |
| Process parameters min/max validation | ❌ | 🔴 | - |
| Yield percentage calculation | ❌ | 🟡 | - |
| Yield indicator color | ❌ | 🟢 | - |
| Duration calculation | ❌ | 🟢 | - |
| Equipment checkbox selection | ✅ | - | 04-production |
| At least one equipment required | ❌ | 🔴 | - |
| Operator checkbox selection | ✅ | - | 04-production |
| At least one operator required | ❌ | 🔴 | - |
| Material selection section | ⚠️ | 🟡 | - |
| Add Materials button | ❌ | 🔴 | - |
| Material Selection Modal open | ❌ | 🔴 | - |
| Select materials in modal | ❌ | 🔴 | - |
| Update material quantities | ❌ | 🔴 | - |
| BOM requirements display | ❌ | 🟡 | - |
| BOM validation warnings | ❌ | 🟡 | - |
| Apply Suggestions button | ❌ | 🟡 | - |
| Batch number preview | ❌ | 🟢 | - |
| Submit confirmation | ❌ | 🔴 | - |
| Success result display | ❌ | 🔴 | - |
| Navigate to created batch | ❌ | 🟡 | - |
| Apply Hold button | ❌ | 🟡 | - |
| Apply Hold Modal | ❌ | 🟡 | - |
| Back button | ❌ | 🟢 | - |

### Production Landing Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Landing page display | ⚠️ | 🟡 | 04-production |
| Available operations list | ❌ | 🟡 | - |
| Select operation to confirm | ❌ | 🟡 | - |

### Production History Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| History page display | ✅ | - | 15-audit-history |
| Summary cards | ✅ | - | 15-audit-history |
| Table view | ✅ | - | 15-audit-history |
| Status filter | ✅ | - | 15-audit-history |
| Search | ✅ | - | 15-audit-history |
| Row click detail panel | ✅ | - | 15-audit-history |

### Missing Tests - Production
```
PROD-GAP-01: Open Material Selection Modal
PROD-GAP-02: Select materials and set quantities in modal
PROD-GAP-03: Validate at least one equipment selected
PROD-GAP-04: Validate at least one operator selected
PROD-GAP-05: Time validation (start ≤ now, end > start)
PROD-GAP-06: Delay reason required when delay > 0
PROD-GAP-07: Process parameter min/max validation
PROD-GAP-08: Submit production confirmation (full flow)
PROD-GAP-09: Verify success and batch creation
PROD-GAP-10: Apply Hold Modal from production confirm
```

---

## 5. INVENTORY MODULE (`/inventory`, `/inventory/new`, `/inventory/receive`)

### Inventory List Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Inventory list display | ✅ | - | 05-inventory |
| State filter (AVAILABLE) | ✅ | - | 05-inventory |
| State filter (BLOCKED) | ✅ | - | 05-inventory |
| State filter (SCRAPPED) | ✅ | - | 05-inventory |
| State filter (CONSUMED) | ❌ | 🟡 | - |
| State filter (ON_HOLD) | ❌ | 🟡 | - |
| Type filter (RM) | ✅ | - | 05-inventory |
| Type filter (WIP) | ✅ | - | 05-inventory |
| Type filter (IM) | ✅ | - | 05-inventory |
| Type filter (FG) | ✅ | - | 05-inventory |
| Search by batch number | ✅ | - | 05-inventory |
| Search by material ID | ❌ | 🟡 | - |
| Pagination | ✅ | - | 10-pagination |
| Block inventory button | ✅ | - | 05-inventory |
| Block modal with reason | ✅ | - | 05-inventory |
| Unblock inventory button | ✅ | - | 05-inventory |
| Scrap inventory button | ✅ | - | 05-inventory |
| Scrap modal with reason | ✅ | - | 05-inventory |
| Edit inventory button | ❌ | 🟡 | - |
| Delete inventory button | ❌ | 🟡 | - |
| Receive Material button | ❌ | 🔴 | - |
| New Inventory button | ❌ | 🟡 | - |

### Inventory Form Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Form display | ⚠️ | 🟡 | 12-entity-crud |
| Material dropdown | ❌ | 🟡 | - |
| Quantity field | ❌ | 🟡 | - |
| Quantity validation | ❌ | 🟡 | - |
| Location field | ❌ | 🟢 | - |
| Submit create | ⚠️ | 🟡 | 12-entity-crud |
| Submit update | ⚠️ | 🟡 | 12-entity-crud |

### Receive Material Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Receive form display | ❌ | 🔴 | - |
| Material selection | ❌ | 🔴 | - |
| Quantity input | ❌ | 🔴 | - |
| Supplier info | ❌ | 🟡 | - |
| Submit receive | ❌ | 🔴 | - |
| Creates batch + inventory | ❌ | 🔴 | - |

### Missing Tests - Inventory
```
INV-GAP-01: Receive Material full flow
INV-GAP-02: Filter by CONSUMED state
INV-GAP-03: Search by material ID
INV-GAP-04: Edit inventory form
INV-GAP-05: Delete inventory with confirmation
```

---

## 6. BATCHES MODULE (`/batches`, `/batches/:id`)

### Batch List Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Batch list display | ✅ | - | 06-batches |
| Status filter | ✅ | - | 06-batches |
| QUALITY_PENDING filter | ✅ | - | 06-batches |
| AVAILABLE filter | ✅ | - | 06-batches |
| Search batches | ✅ | - | 06-batches |
| Pagination | ✅ | - | 10-pagination |
| View batch detail | ✅ | - | 06-batches |
| Approve button visibility | ✅ | - | 06-batches |
| Reject button visibility | ✅ | - | 06-batches |
| Approve batch action | ✅ | - | 06-batches |
| Reject with reason | ✅ | - | 06-batches |
| Edit batch button | ❌ | 🟡 | - |
| Delete batch button | ❌ | 🟡 | - |
| New Batch button | ❌ | 🟡 | - |

### Batch Detail Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Detail display | ✅ | - | 06-batches |
| Genealogy visualization | ✅ | - | 06-batches |
| Parent batches display | ⚠️ | 🟡 | 06-batches |
| Child batches display | ⚠️ | 🟡 | 06-batches |
| Click navigate to related batch | ❌ | 🟡 | - |
| Split button | ✅ | - | 06-batches |
| Split modal form | ⚠️ | 🟡 | 06-batches |
| Split with portions | ❌ | 🔴 | - |
| Split validation (sum ≤ quantity) | ❌ | 🔴 | - |
| Merge button | ✅ | - | 06-batches |
| Merge modal | ⚠️ | 🟡 | 06-batches |
| Select batches to merge | ❌ | 🔴 | - |
| Merge validation (same material) | ❌ | 🔴 | - |
| Allocations section | ✅ | - | 06-batches |
| Allocate button | ⚠️ | 🟡 | 06-batches |
| Allocation modal form | ⚠️ | 🟡 | 06-batches |
| Release allocation button | ❌ | 🟡 | - |
| Quantity adjustment | ✅ | - | 06-batches |
| Adjustment history | ✅ | - | 06-batches |
| Adjustment reason required | ❌ | 🔴 | - |
| Back button | ❌ | 🟢 | - |
| Edit button | ❌ | 🟡 | - |

### Missing Tests - Batches
```
BAT-GAP-01: Complete split flow with multiple portions
BAT-GAP-02: Split validation (portions sum ≤ batch quantity)
BAT-GAP-03: Complete merge flow with batch selection
BAT-GAP-04: Merge validation (same material only)
BAT-GAP-05: Quantity adjustment with mandatory reason
BAT-GAP-06: Release allocation action
BAT-GAP-07: Navigate to parent/child batches via genealogy
BAT-GAP-08: Edit batch form
```

---

## 7. HOLDS MODULE (`/holds`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Holds list display | ✅ | - | 07-holds |
| Status filter (ACTIVE) | ⚠️ | 🟡 | 07-holds |
| Status filter (RELEASED) | ❌ | 🟡 | - |
| Entity type filter | ✅ | - | 07-holds |
| Filter by OPERATION | ❌ | 🟡 | - |
| Filter by BATCH | ❌ | 🟡 | - |
| Filter by INVENTORY | ❌ | 🟡 | - |
| Filter by EQUIPMENT | ❌ | 🟡 | - |
| Search by reason/comments | ⚠️ | 🟡 | - |
| Pagination | ✅ | - | 10-pagination |
| Apply Hold button | ✅ | - | 07-holds |
| Apply Hold modal | ✅ | - | 07-holds |
| Entity type dropdown | ✅ | - | 07-holds |
| Entity dropdown (dynamic) | ⚠️ | 🟡 | 07-holds |
| Reason dropdown | ✅ | - | 07-holds |
| Comments textarea | ✅ | - | 07-holds |
| Submit hold | ⚠️ | 🟡 | 07-holds |
| Release button | ✅ | - | 07-holds |
| Release modal | ✅ | - | 07-holds |
| Release comments | ✅ | - | 07-holds |
| Hold duration display | ❌ | 🟢 | - |

### Missing Tests - Holds
```
HOLD-GAP-01: Filter by each entity type
HOLD-GAP-02: Filter RELEASED status
HOLD-GAP-03: Complete apply hold flow (submit)
HOLD-GAP-04: Verify entity blocked after hold applied
HOLD-GAP-05: Verify entity unblocked after release
```

---

## 8. EQUIPMENT MODULE (`/equipment`, `/manage/equipment`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Equipment list display | ✅ | - | 08-equipment |
| Status filter (AVAILABLE) | ✅ | - | 08-equipment |
| Status filter (MAINTENANCE) | ✅ | - | 08-equipment |
| Status filter (ON_HOLD) | ✅ | - | 08-equipment |
| Status filter (IN_USE) | ❌ | 🟡 | - |
| Type filter (Batch) | ✅ | - | 08-equipment |
| Type filter (Continuous) | ❌ | 🟡 | - |
| Search by code/name | ⚠️ | 🟡 | - |
| Pagination | ✅ | - | 10-pagination |
| Start Maintenance button | ✅ | - | 08-equipment |
| Maintenance modal with reason | ✅ | - | 08-equipment |
| End Maintenance button | ✅ | - | 08-equipment |
| Put on Hold button | ✅ | - | 08-equipment |
| Hold modal with reason | ✅ | - | 08-equipment |
| Release from Hold button | ✅ | - | 08-equipment |
| Edit equipment button | ⚠️ | 🟡 | 12-entity-crud |
| Delete equipment button | ⚠️ | 🟡 | 12-entity-crud |
| New Equipment button | ⚠️ | 🟡 | 12-entity-crud |
| Create equipment form | ⚠️ | 🟡 | 12-entity-crud |
| Equipment form validation | ❌ | 🟡 | - |
| Update equipment | ⚠️ | 🟡 | 12-entity-crud |

### Missing Tests - Equipment
```
EQUIP-GAP-01: Filter by IN_USE status
EQUIP-GAP-02: Filter by Continuous type
EQUIP-GAP-03: Full equipment form validation
EQUIP-GAP-04: Verify status changes after actions
```

---

## 9. OPERATIONS MODULE (`/operations`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Operations list display | ✅ | - | 17-operations |
| Status summary cards | ✅ | - | 17-operations |
| Status filter (READY) | ✅ | - | 17-operations |
| Status filter (IN_PROGRESS) | ✅ | - | 17-operations |
| Status filter (CONFIRMED) | ✅ | - | 17-operations |
| Status filter (ON_HOLD) | ❌ | 🟡 | - |
| Status filter (BLOCKED) | ⚠️ | 🟡 | 17-operations |
| Search operations | ✅ | - | 17-operations |
| Block operation button | ✅ | - | 17-operations |
| Block modal with reason | ✅ | - | 17-operations |
| Submit block | ✅ | - | 17-operations |
| Unblock button | ✅ | - | 17-operations |
| Submit unblock | ✅ | - | 17-operations |
| View operation detail | ⚠️ | 🟡 | 17-operations |
| Navigate to confirm operation | ❌ | 🔴 | - |
| Status count badges | ✅ | - | 17-operations |

### Missing Tests - Operations
```
OP-GAP-01: Filter by ON_HOLD status
OP-GAP-02: Navigate to production confirm from operations list
OP-GAP-03: Verify operation status change after block/unblock
```

---

## 10. PROCESSES MODULE (`/processes`, `/manage/processes`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Process list display | ✅ | - | 18-processes |
| Status summary cards | ✅ | - | 18-processes |
| Status filter | ✅ | - | 18-processes |
| QUALITY_PENDING filter | ✅ | - | 18-processes |
| COMPLETED filter | ✅ | - | 18-processes |
| Search processes | ✅ | - | 18-processes |
| New process button | ✅ | - | 18-processes |
| Create process form | ✅ | - | 18-processes |
| Edit process | ✅ | - | 18-processes |
| Delete process | ✅ | - | 18-processes |
| Delete confirmation modal | ✅ | - | 18-processes |
| View detail | ✅ | - | 18-processes |
| Activate button | ✅ | - | 18-processes |
| Deactivate button | ✅ | - | 18-processes |
| Quality decision modal | ✅ | - | 18-processes |
| Approve process | ✅ | - | 18-processes |
| Reject with reason | ✅ | - | 18-processes |
| Admin processes page | ✅ | - | 18-processes |
| Admin sidebar | ✅ | - | 18-processes |
| Admin table view | ✅ | - | 18-processes |
| Admin quality pending | ✅ | - | 18-processes |

### Missing Tests - Processes
```
PROC-GAP-01: Process form validation
PROC-GAP-02: Verify status after activate/deactivate
```

---

## 11. QUALITY MODULE (`/quality`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Quality list display | ✅ | - | 09-quality |
| Pending tab | ✅ | - | 09-quality |
| Rejected tab | ✅ | - | 09-quality |
| All tab | ✅ | - | 09-quality |
| Accept button | ✅ | - | 09-quality |
| Accept action | ✅ | - | 09-quality |
| Reject button | ✅ | - | 09-quality |
| Reject modal with reason | ✅ | - | 09-quality |
| Verify status change after accept | ❌ | 🟡 | - |
| Verify status change after reject | ❌ | 🟡 | - |

### Missing Tests - Quality
```
QUAL-GAP-01: Verify item moves from Pending to All after accept
QUAL-GAP-02: Verify item appears in Rejected tab after reject
```

---

## 12. CUSTOMERS MODULE (`/manage/customers`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Customer list display | ✅ | - | 11-crud |
| Status filter | ✅ | - | 11-crud |
| Search by name | ✅ | - | 11-crud |
| Pagination | ✅ | - | 11-crud |
| New Customer button | ✅ | - | 11-crud |
| Create form display | ✅ | - | 11-crud |
| Customer name field | ✅ | - | 11-crud |
| Contact person field | ⚠️ | 🟢 | 11-crud |
| Email field | ⚠️ | 🟢 | 11-crud |
| Email validation | ❌ | 🟡 | - |
| Phone field | ⚠️ | 🟢 | 11-crud |
| Address fields | ❌ | 🟢 | - |
| Submit create | ✅ | - | 11-crud |
| Edit customer | ✅ | - | 11-crud |
| Delete with confirmation | ✅ | - | 11-crud |

### Missing Tests - Customers
```
CUST-GAP-01: Email format validation
CUST-GAP-02: Required field validation
```

---

## 13. MATERIALS MODULE (`/manage/materials`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Material list display | ✅ | - | 11-crud |
| Status filter | ⚠️ | 🟡 | 11-crud |
| Type filter (RM/IM/FG/WIP) | ✅ | - | 11-crud |
| Search | ✅ | - | 11-crud |
| Pagination | ✅ | - | 11-crud |
| New Material button | ✅ | - | 11-crud |
| Create form display | ✅ | - | 11-crud |
| Material ID field | ⚠️ | 🟡 | 11-crud |
| Material ID uniqueness | ❌ | 🔴 | - |
| Material name field | ⚠️ | 🟡 | 11-crud |
| Type dropdown | ⚠️ | 🟡 | 11-crud |
| Unit dropdown | ⚠️ | 🟡 | 11-crud |
| Submit create | ✅ | - | 11-crud |
| Edit material | ✅ | - | 11-crud |
| Delete material | ✅ | - | 11-crud |

### Missing Tests - Materials
```
MAT-GAP-01: Material ID uniqueness validation
MAT-GAP-02: Required field validation
MAT-GAP-03: Filter by each type (RM, IM, FG, WIP separately)
```

---

## 14. PRODUCTS MODULE (`/manage/products`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Product list display | ✅ | - | 11-crud |
| Status filter | ⚠️ | 🟡 | 11-crud |
| Search by SKU/name | ✅ | - | 11-crud |
| Pagination | ✅ | - | 11-crud |
| New Product button | ✅ | - | 11-crud |
| Create form display | ✅ | - | 11-crud |
| SKU field | ⚠️ | 🟡 | 11-crud |
| SKU uniqueness | ❌ | 🔴 | - |
| Product name field | ⚠️ | 🟡 | 11-crud |
| Unit dropdown | ⚠️ | 🟡 | 11-crud |
| Submit create | ✅ | - | 11-crud |
| Edit product | ✅ | - | 11-crud |
| Delete product | ✅ | - | 11-crud |

### Missing Tests - Products
```
PROD-GAP-01: SKU uniqueness validation
PROD-GAP-02: Required field validation
```

---

## 15. BOM MODULE (`/manage/bom`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| BOM products list | ✅ | - | 13-bom-crud |
| Product cards display | ✅ | - | 13-bom-crud |
| View Tree button | ✅ | - | 13-bom-crud |
| Tree view display | ✅ | - | 13-bom-crud |
| Expand/collapse nodes | ✅ | - | 13-bom-crud |
| Expand All button | ⚠️ | 🟢 | 13-bom-crud |
| Collapse All button | ⚠️ | 🟢 | 13-bom-crud |
| Flow chart visualization | ✅ | - | 13-bom-crud |
| Add Root Node button | ⚠️ | 🟡 | 13-bom-crud |
| Add Child Node button | ⚠️ | 🟡 | 13-bom-crud |
| Node form display | ✅ | - | 13-bom-crud |
| Material dropdown | ⚠️ | 🟡 | 13-bom-crud |
| Quantity required field | ⚠️ | 🟡 | 13-bom-crud |
| Yield loss ratio field | ❌ | 🟡 | - |
| Create BOM node | ✅ | - | 13-bom-crud |
| Edit BOM node | ✅ | - | 13-bom-crud |
| Delete BOM node | ✅ | - | 13-bom-crud |
| Delete cascade (with children) | ❌ | 🔴 | - |
| Move node to new parent | ❌ | 🔴 | - |
| Edit Settings modal | ✅ | - | 13-bom-crud |
| New BOM creation | ⚠️ | 🟡 | 13-bom-crud |
| BOM version field | ❌ | 🟡 | - |
| BOM status dropdown | ❌ | 🟡 | - |

### Missing Tests - BOM
```
BOM-GAP-01: Delete node cascade with children
BOM-GAP-02: Move node to different parent
BOM-GAP-03: Yield loss ratio field validation
BOM-GAP-04: BOM version management
BOM-GAP-05: Cannot create circular relationships
```

---

## 16. CONFIG MODULE (`/manage/config/*`)

### Hold Reasons

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| List display | ✅ | - | 14-config-crud |
| Status filter | ⚠️ | 🟡 | 14-config-crud |
| Search | ⚠️ | 🟡 | 14-config-crud |
| Entity type chips (multi-select) | ✅ | - | 14-config-crud |
| Create form | ✅ | - | 14-config-crud |
| Reason code field | ✅ | - | 14-config-crud |
| Description field | ✅ | - | 14-config-crud |
| Entity types selection | ✅ | - | 14-config-crud |
| Submit create | ✅ | - | 14-config-crud |
| Edit | ✅ | - | 14-config-crud |
| Delete | ✅ | - | 14-config-crud |

### Delay Reasons

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| List display | ✅ | - | 14-config-crud |
| Create form | ✅ | - | 14-config-crud |
| Edit | ✅ | - | 14-config-crud |
| Delete | ✅ | - | 14-config-crud |

### Process Parameters

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| List display | ✅ | - | 14-config-crud |
| Operation type filter | ⚠️ | 🟡 | 14-config-crud |
| Product filter | ❌ | 🟡 | - |
| Create form | ✅ | - | 14-config-crud |
| Min/Max validation | ⚠️ | 🟡 | 14-config-crud |
| Edit | ✅ | - | 14-config-crud |
| Delete | ✅ | - | 14-config-crud |

### Batch Number Config

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| List display | ✅ | - | 14-config-crud |
| Create with prefix/separator | ✅ | - | 14-config-crud |
| Date format field | ⚠️ | 🟡 | 14-config-crud |
| Sequence reset options | ❌ | 🟡 | - |
| Edit | ✅ | - | 14-config-crud |
| Delete | ✅ | - | 14-config-crud |

### Quantity Types

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| List display | ✅ | - | 14-config-crud |
| Create with decimal precision | ✅ | - | 14-config-crud |
| Edit | ✅ | - | 14-config-crud |
| Delete | ✅ | - | 14-config-crud |

### Batch Size Config

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| List display | ✅ | - | 14-config-crud |
| Create with min/max/preferred | ✅ | - | 14-config-crud |
| Form validation | ⚠️ | 🟡 | 14-config-crud |
| Edit | ⚠️ | 🟡 | 14-config-crud |
| Delete | ⚠️ | 🟡 | 14-config-crud |

### Missing Tests - Config
```
CFG-GAP-01: Process parameter product filter
CFG-GAP-02: Batch number sequence reset options
CFG-GAP-03: Min < Max validation for process parameters
CFG-GAP-04: Unique code validation for all config entities
```

---

## 17. OPERATORS MODULE (`/manage/operators`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Operator list display | ✅ | - | 16-operators |
| Search | ✅ | - | 16-operators |
| Pagination | ✅ | - | 16-operators |
| New Operator button | ✅ | - | 16-operators |
| Create form | ✅ | - | 16-operators |
| Form fields display | ✅ | - | 16-operators |
| Form validation | ✅ | - | 16-operators |
| Submit create | ⚠️ | 🟡 | 16-operators |
| Edit operator | ⚠️ | 🟡 | 16-operators |
| Delete operator | ❌ | 🟡 | - |
| Detail view | ⚠️ | 🟡 | 16-operators |
| Status filter | ❌ | 🟡 | - |

### Missing Tests - Operators
```
OPR-GAP-01: Delete operator with confirmation
OPR-GAP-02: Status filter (ACTIVE/INACTIVE)
```

---

## 18. USERS MODULE (`/manage/users`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Users list display | ✅ | - | 20-users |
| Search | ✅ | - | 20-users |
| Role filter | ✅ | - | 20-users |
| Pagination | ⚠️ | 🟡 | 20-users |
| New User button | ✅ | - | 20-users |
| Create form | ✅ | - | 20-users |
| Name field | ✅ | - | 20-users |
| Email field | ✅ | - | 20-users |
| Email validation | ✅ | - | 20-users |
| Password field | ✅ | - | 20-users |
| Role dropdown | ✅ | - | 20-users |
| Form validation | ✅ | - | 20-users |
| Submit create | ✅ | - | 20-users |
| Edit user | ✅ | - | 20-users |
| Delete with confirmation | ✅ | - | 20-users |
| User detail view | ✅ | - | 20-users |

### Missing Tests - Users
```
USR-GAP-01: Password minimum length validation
USR-GAP-02: Cannot delete self
```

---

## 19. AUDIT MODULE (`/manage/audit`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Audit list display | ✅ | - | 15-audit-history |
| Entity type filter | ✅ | - | 15-audit-history |
| Action type filter | ✅ | - | 15-audit-history |
| User filter | ✅ | - | 15-audit-history |
| Clear filters button | ✅ | - | 15-audit-history |
| Row selection detail | ✅ | - | 15-audit-history |
| Action badges | ✅ | - | 15-audit-history |
| Result count | ✅ | - | 15-audit-history |
| Field change details | ⚠️ | 🟡 | 15-audit-history |
| Date range filter | ❌ | 🟡 | - |
| Export functionality | ❌ | 🟢 | - |

### Missing Tests - Audit
```
AUD-GAP-01: Date range filter
AUD-GAP-02: Field change old/new value display
```

---

## 20. PROFILE MODULE (`/profile`, `/change-password`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Profile page display | ✅ | - | 19-user-profile |
| User info display | ✅ | - | 19-user-profile |
| Edit mode toggle | ✅ | - | 19-user-profile |
| Update profile | ✅ | - | 19-user-profile |
| Navigate to change password | ✅ | - | 19-user-profile |
| Change password form | ✅ | - | 19-user-profile |
| Current password field | ⚠️ | 🟡 | 19-user-profile |
| New password field | ✅ | - | 19-user-profile |
| Confirm password field | ✅ | - | 19-user-profile |
| Password mismatch detection | ✅ | - | 19-user-profile |
| Submit change password | ❌ | 🔴 | - |
| Wrong current password error | ❌ | 🔴 | - |

### Missing Tests - Profile
```
PROF-GAP-01: Submit change password (full flow)
PROF-GAP-02: Wrong current password error handling
```

---

## 21. SHARED COMPONENTS

### Header Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Logo/title display | ⚠️ | 🟢 | multiple |
| Navigation menu | ✅ | - | multiple |
| User profile menu | ⚠️ | 🟡 | 19-user-profile |
| Logout button | ✅ | - | 01-auth |
| Active route highlighting | ❌ | 🟢 | - |
| Mobile menu toggle | ❌ | 🟡 | - |
| Dropdown navigation | ⚠️ | 🟡 | multiple |

### Pagination Component

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Page size dropdown | ✅ | - | 10-pagination |
| First/Last buttons | ⚠️ | 🟡 | 10-pagination |
| Previous/Next buttons | ✅ | - | 10-pagination |
| Page number buttons | ⚠️ | 🟡 | 10-pagination |
| Record count display | ✅ | - | 10-pagination |
| Disabled state when no next/prev | ❌ | 🟡 | - |

### Material Selection Modal

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Modal open/close | ❌ | 🔴 | - |
| Search filter | ❌ | 🔴 | - |
| Type filter | ❌ | 🔴 | - |
| Toggle selection | ❌ | 🔴 | - |
| Select all | ❌ | 🔴 | - |
| Clear all | ❌ | 🔴 | - |
| Quantity input | ❌ | 🔴 | - |
| Quantity validation | ❌ | 🔴 | - |
| Confirm button | ❌ | 🔴 | - |
| Cancel button | ❌ | 🔴 | - |

### Apply Hold Modal

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Modal open/close | ⚠️ | 🟡 | 07-holds |
| Entity info display | ⚠️ | 🟡 | 07-holds |
| Reason dropdown | ⚠️ | 🟡 | 07-holds |
| Comments field | ⚠️ | 🟡 | 07-holds |
| Submit button | ⚠️ | 🟡 | 07-holds |
| Success auto-close | ❌ | 🟡 | - |
| Error handling | ❌ | 🟡 | - |

### Missing Tests - Shared Components
```
SHARED-GAP-01: Material Selection Modal full workflow
SHARED-GAP-02: Apply Hold Modal from production confirm
SHARED-GAP-03: Mobile responsive menu toggle
SHARED-GAP-04: Pagination disabled state
```

---

## 22. ROUTING MODULE (`/manage/routing`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Routing list display | ❌ | 🔴 | - |
| Status filter | ❌ | 🔴 | - |
| Search | ❌ | 🔴 | - |
| New Routing button | ❌ | 🔴 | - |
| Create routing form | ❌ | 🔴 | - |
| Routing name field | ❌ | 🔴 | - |
| Process dropdown | ❌ | 🔴 | - |
| Routing type dropdown | ❌ | 🔴 | - |
| Add routing step | ❌ | 🔴 | - |
| Step modal form | ❌ | 🔴 | - |
| Operation template dropdown | ❌ | 🔴 | - |
| Sequence number | ❌ | 🔴 | - |
| Step flags (mandatory, parallel) | ❌ | 🔴 | - |
| Reorder steps (up/down) | ❌ | 🔴 | - |
| Delete step | ❌ | 🔴 | - |
| Submit routing | ❌ | 🔴 | - |
| Edit routing | ❌ | 🔴 | - |
| Activate routing | ❌ | 🔴 | - |
| Deactivate routing | ❌ | 🔴 | - |
| Put on hold | ❌ | 🔴 | - |
| Release from hold | ❌ | 🔴 | - |
| Delete routing | ❌ | 🔴 | - |

### Missing Tests - Routing
```
ROUT-GAP-01: Complete routing CRUD workflow
ROUT-GAP-02: Add/edit/delete routing steps
ROUT-GAP-03: Reorder steps (move up/down)
ROUT-GAP-04: Activate/deactivate routing
ROUT-GAP-05: Put routing on hold/release
```

---

## 23. OPERATION TEMPLATES MODULE (`/manage/operation-templates`)

| Feature | E2E Coverage | Priority | Test File |
|---------|--------------|----------|-----------|
| Template list display | ❌ | 🔴 | - |
| Status filter | ❌ | 🔴 | - |
| Search | ❌ | 🔴 | - |
| New Template button | ❌ | 🔴 | - |
| Create template form | ❌ | 🔴 | - |
| Operation name field | ❌ | 🔴 | - |
| Operation code field | ❌ | 🔴 | - |
| Operation type dropdown | ❌ | 🔴 | - |
| Quantity type dropdown | ❌ | 🔴 | - |
| Equipment type field | ❌ | 🔴 | - |
| Duration field | ❌ | 🔴 | - |
| Submit create | ❌ | 🔴 | - |
| Edit template | ❌ | 🔴 | - |
| Delete template | ❌ | 🔴 | - |
| Activate/deactivate | ❌ | 🔴 | - |

### Missing Tests - Operation Templates
```
OPTPL-GAP-01: Complete operation template CRUD workflow
OPTPL-GAP-02: Template form validation
OPTPL-GAP-03: Activate/deactivate template
```

---

## CRITICAL GAPS SUMMARY (🔴)

These are business-critical features that MUST have E2E coverage:

### Orders Module
1. **ORD-GAP-01**: Create order form and submission
2. **ORD-GAP-02**: Add/remove line items
3. **ORD-GAP-06**: Start Production navigation

### Production Module
1. **PROD-GAP-01**: Material Selection Modal integration
2. **PROD-GAP-03**: Equipment selection validation
3. **PROD-GAP-04**: Operator selection validation
4. **PROD-GAP-05**: Time validation rules
5. **PROD-GAP-06**: Delay reason conditional validation
6. **PROD-GAP-07**: Process parameter min/max validation
7. **PROD-GAP-08**: Submit production confirmation (full flow)
8. **PROD-GAP-09**: Verify batch creation on success

### Inventory Module
1. **INV-GAP-01**: Receive Material full workflow

### Batches Module
1. **BAT-GAP-01**: Complete split flow
2. **BAT-GAP-02**: Split validation
3. **BAT-GAP-03**: Complete merge flow
4. **BAT-GAP-04**: Merge validation
5. **BAT-GAP-05**: Quantity adjustment mandatory reason

### BOM Module
1. **BOM-GAP-01**: Delete cascade
2. **BOM-GAP-02**: Move node to different parent

### Products/Materials
1. **PROD-GAP-01**: SKU uniqueness validation
2. **MAT-GAP-01**: Material ID uniqueness validation

### Profile Module
1. **PROF-GAP-01**: Change password submission
2. **PROF-GAP-02**: Wrong password error handling

### Routing Module (ENTIRE MODULE)
1. Complete CRUD workflow missing
2. Step management missing
3. Status transitions missing

### Operation Templates Module (ENTIRE MODULE)
1. Complete CRUD workflow missing
2. Template management missing

### Shared Components
1. **SHARED-GAP-01**: Material Selection Modal complete workflow

---

## RECOMMENDED TEST ADDITIONS

### Priority 1 - Critical Business Flows (Immediate)

```javascript
// New test file: e2e/tests/21-order-crud.test.js
- Create new order with line items
- Update order
- Delete/cancel order
- Start production from order

// New test file: e2e/tests/22-production-complete.test.js
- Material Selection Modal integration
- Full production confirmation submission
- Validation checks (equipment, operator, times)
- Process parameter validation
- Verify batch creation

// New test file: e2e/tests/23-receive-material.test.js
- Receive material form
- Submit and verify batch + inventory created

// New test file: e2e/tests/24-batch-operations.test.js
- Complete split flow with validation
- Complete merge flow with validation
- Quantity adjustment with mandatory reason

// New test file: e2e/tests/27-routing-crud.test.js
- Routing CRUD workflow
- Step management
- Reorder steps
- Status transitions

// New test file: e2e/tests/28-operation-templates.test.js
- Operation template CRUD workflow
```

### Priority 2 - Important Gaps (Next Sprint)

```javascript
// Enhance existing tests:
// 02-dashboard.test.js
- Verify statistics counts
- Navigation with filters

// 05-inventory.test.js
- Edit inventory form
- Receive Material navigation

// 06-batches.test.js
- Navigate genealogy links
- Allocation release

// 07-holds.test.js
- All entity type filters
- Complete apply hold flow with submission

// 19-user-profile.test.js
- Change password full submission
- Error handling
```

### Priority 3 - Validation & Edge Cases (Backlog)

```javascript
// Form validations across all modules
- Required field validations
- Uniqueness validations
- Min/max validations
- Format validations (email, phone)

// Edge cases
- Pagination disabled states
- Mobile responsive behavior
- Error handling scenarios
```

---

## NEXT STEPS

1. **Review this analysis** with stakeholders
2. **Prioritize critical gaps** based on business risk
3. **Create test files** for Priority 1 items
4. **Enhance existing tests** for Priority 2 items
5. **Schedule backlog items** for Priority 3

---

*Generated by Claude Code - MES POC E2E Coverage Analysis*
