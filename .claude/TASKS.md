# MES POC - Active Tasks & Session Log

**Last Updated:** 2026-02-07
**Session Status:** Active - Process CRUD UI, Design-Time Status Alignment

---

## Latest Session Changes (2026-02-07 - Process Design-Time Architecture Refactor)

### PR-ARCH: Process Design-Time Architecture - COMPLETE ✅

**Issue:** User correctly noted runtime statuses don't make sense for design-time Process templates.

**Solution:** Complete architectural refactor per MES Consolidated Specification:
- Process is now design-time only with `ProcessStatus` enum: `DRAFT`, `ACTIVE`, `INACTIVE`
- Runtime execution tracking happens at Operation level (Operations link to OrderLineItem)
- No ProcessInstance needed - Operations handle runtime state

**Backend Changes:**

| File | Changes |
|------|---------|
| `entity/ProcessStatus.java` | **NEW** - Design-time status enum |
| `entity/Process.java` | Uses `ProcessStatus` enum, removed runtime status constants |
| `service/ProcessService.java` | Simplified to CRUD + activate/deactivate only |
| `controller/ProcessController.java` | Removed quality decision endpoints, added `/activate` `/deactivate` |
| `dto/ProcessDTO.java` | Removed runtime DTOs (QualityDecisionRequest, StatusUpdateRequest, etc.) |
| `repository/ProcessRepository.java` | Uses `ProcessStatus` enum for type safety |
| `service/DashboardService.java` | Removed quality pending process count (not applicable) |
| `service/HoldService.java` | Process holds don't change status (design-time entity) |
| `service/ProductionService.java` | Removed runtime Process status tracking |

**Frontend Changes:**

| File | Changes |
|------|---------|
| `process-list.component.ts` | Statuses: `['DRAFT', 'ACTIVE', 'INACTIVE']` |
| `process-list.component.html` | Summary cards: Draft/Active/Inactive |
| `process-list.component.css` | Design-time status badge styles |
| `process-form.component.ts` | Default status: `DRAFT` |

**Key Architectural Decision:**
- **No ProcessInstance** - Operations handle runtime tracking
- **Process = Template** - Defines what a manufacturing stage is
- **Operation = Runtime** - Linked to OrderLineItem, tracks execution status

### PR04-PR08: Process Form Component - COMPLETE ✅

**Files Created (previous session):**
- `frontend/src/app/features/processes/process-form/process-form.component.ts`
- `frontend/src/app/features/processes/process-form/process-form.component.html`
- `frontend/src/app/features/processes/process-form/process-form.component.css`

**Files Modified (previous session):**
- `frontend/src/app/features/processes/processes.module.ts` - Added ProcessFormComponent
- `frontend/src/app/features/processes/processes-routing.module.ts` - Added routes

### PR08-PR13: Process List Buttons & Modal - COMPLETE ✅

**Files Modified (previous session):**
- `frontend/src/app/features/processes/process-list/process-list.component.ts`
  - Added Router, delete modal state, navigation methods
  - Added `createProcess()`, `viewProcess()`, `editProcess()`, `confirmDelete()`, `deleteProcess()`
- `frontend/src/app/features/processes/process-list/process-list.component.html`
  - Added "New Process" button in header
  - Added Actions column with Edit/Delete buttons
  - Added clickable rows
  - Added delete confirmation modal
- `frontend/src/app/features/processes/process-list/process-list.component.css`
  - Added styling for page header, buttons, modal, clickable rows

**Build Status:** Both frontend and backend compile successfully ✅

---

## Pending Frontend Tasks - Process CRUD

| Task | Description | Status |
|------|-------------|--------|
| PR-FE01 | Update `api.service.ts` - Add `activateProcess()`, `deactivateProcess()` methods | PENDING |
| PR-FE02 | Add Activate/Deactivate buttons to process-list.component | PENDING |
| PR-FE03 | Update process-detail.component with Activate/Deactivate buttons | PENDING |
| PR-FE04 | Update shared/models - Remove usageDecision from Process interface | PENDING |
| PR-FE05 | E2E tests for Process CRUD workflow | PENDING |
| PR-FE06 | Update demo/data.sql with sample DRAFT/ACTIVE/INACTIVE processes | PENDING |

---

## Previous Session Changes (2026-02-07 - Batch Behavior Validation, Partial Confirmation, E2E Tests)

### R15: Batch Behavior Validation - COMPLETE ✅

**Files Modified:**
- `backend/src/main/java/com/mes/production/service/BatchService.java` - Added validateBatchBehaviorForMerge() call

**Changes:**
- Validates routing step `allowsSplit` and `allowsMerge` flags before batch operations
- Split operations blocked if routing step has allowsSplit=false
- Merge operations blocked if any batch's routing step has allowsMerge=false

### P10-P13: Partial Confirmation Backend - COMPLETE ✅

**Files Modified:**
- `backend/src/main/java/com/mes/production/dto/ProductionConfirmationDTO.java`
  - Added `saveAsPartial` flag to Request DTO
  - Added `isPartial` and `remainingQty` fields to Response DTO
- `backend/src/main/java/com/mes/production/service/ProductionService.java`
  - Respects saveAsPartial flag for explicit partial confirmation
  - Returns isPartial and remainingQty in response
  - Added `getContinuableOperations()` method
- `backend/src/main/java/com/mes/production/controller/ProductionController.java`
  - Added `/confirmations/partial` endpoint
  - Added `/operations/continuable` endpoint

### P18-P19: E2E Tests for Order Selection Flow - COMPLETE ✅

**Files Created:**
- `e2e/tests/23-order-selection.test.js` - 8 tests covering:
  - Available orders list
  - Order detail with operations
  - READY operation indicator
  - Navigate to production form
  - Operation dropdown populates
  - Full order selection flow
  - Yield and duration display
  - BOM suggested consumption

**Files Modified:**
- `e2e/run-all-tests.js` - Added import and call for new test file

### B23: User Documentation - COMPLETE ✅

**Files Modified:**
- `docs/USER-GUIDE.md` - Expanded Batch Traceability section with:
  - Batch status workflow diagram
  - Batch approval process
  - Quantity adjustment with mandatory reason
  - Split/merge operations
  - Batch number generation

**All Backend Tests: PASS (BUILD SUCCESSFUL)**

---

## Previous Session Changes (2026-02-07 - Filter Highlighting, Routing Specs, Batch Size Config)

### B14-B15: Batch Size Config CRUD & Frontend - IN PROGRESS

**Started:** Session continuation
**Files Created:**
- `backend/src/main/java/com/mes/production/controller/BatchSizeConfigController.java` - REST endpoints
- `frontend/src/app/features/config/batch-size/batch-size-list.component.ts` - List component
- `frontend/src/app/features/config/batch-size/batch-size-list.component.html`
- `frontend/src/app/features/config/batch-size/batch-size-list.component.css`
- `frontend/src/app/features/config/batch-size/batch-size-form.component.ts` - Form component
- `frontend/src/app/features/config/batch-size/batch-size-form.component.html`
- `frontend/src/app/features/config/batch-size/batch-size-form.component.css`

**Files Modified:**
- `frontend/src/app/core/services/api.service.ts` - Added batch size config methods
- `frontend/src/app/features/config/config.module.ts` - Added declarations
- `frontend/src/app/features/config/config-routing.module.ts` - Added routes

**Status:** Frontend build successful. Need to verify with running application.

**User Issues Reported (Investigated):**
1. **Dashboard operations showing zeros** - The dashboard calls `getAllOperations()` which returns runtime operations. If no orders have been created or operations instantiated, this will show zeros. This is expected behavior when starting with fresh data.
2. **Process creation UI missing** - CONFIRMED. The current `/manage/processes` shows runtime process instances (linked to orders), not design-time process templates.
   - **Note:** In this MES architecture, the **Routing** entity (at `/manage/routing`) defines the process flow template with routing steps. When orders are created, operations are instantiated from the routing.
   - If a separate "Process Template" CRUD is needed, that would be a new feature.

---

## Latest Session Changes (2026-02-07 - Filter Highlighting, Routing Specs)

### R28: Routing Frontend Spec Tests - COMPLETE ✅

**Files Created:**
- `frontend/src/app/features/routing/routing-list/routing-list.component.spec.ts` (45 tests)
- `frontend/src/app/features/routing/routing-form/routing-form.component.spec.ts` (53 tests)

**Files Modified:**
- `frontend/src/app/features/routing/routing-list/routing-list.component.html` - Added filter-active class bindings

**Test Coverage:**
- RoutingListComponent: Creation, loading, filtering, navigation, CRUD actions (activate, deactivate, hold, release, delete), error handling, utility functions, filter highlighting
- RoutingFormComponent: Create/Edit modes, form validation, step management (add, edit, delete, reorder), API interactions, error handling

**Result:** 98/98 tests passing

---

### Filter Highlighting Across System - COMPLETE ✅

**User Request:** Selected filter tiles should be highlighted to show when a filter is active.

**CSS Changes (styles.css):**
- Added `.filter-active` class for filter groups and select elements
- Blue border, light blue background, bold label when filter is applied
- Box shadow for emphasis
- Active filters bar with chips (optional, for future use)

**Templates Updated (17 list components):**
- `holds/hold-list/hold-list.component.html` - Status and Entity Type filters
- `inventory/inventory-list/inventory-list.component.html` - State and Type filters
- `operations/operation-list/operation-list.component.html` - Status filter
- `batches/batch-list/batch-list.component.html` - State filter
- `equipment/equipment-list/equipment-list.component.html` - Status and Type filters
- `orders/order-list/order-list.component.html` - Status filter
- `materials/material-list/material-list.component.html` - Status and Type filters
- `products/product-list/product-list.component.html` - Status filter
- `customers/customer-list/customer-list.component.html` - Status filter
- `operators/operator-list/operator-list.component.html` - Status filter
- `processes/process-list/process-list.component.html` - Status filter
- `production/production-history/production-history.component.html` - Status filter
- `config/hold-reasons/hold-reasons-list.component.html` - Status filter
- `config/quantity-type/quantity-type-list.component.html` - Status filter
- `config/delay-reasons/delay-reasons-list.component.html` - Status filter
- `config/batch-number/batch-number-list.component.html` - Status filter
- `config/process-params/process-params-list.component.html` - Status filter

**Pattern Applied:**
```html
<div class="filter-group" [class.filter-active]="filterStatus && filterStatus !== 'all'">
  <select ... [class.filter-active]="filterStatus && filterStatus !== 'all'">
```

**Tests Added:**
- `inventory-list.component.spec.ts` - 5 filter highlighting tests
- `operation-list.component.spec.ts` - 4 filter highlighting tests
- `hold-list.component.spec.ts` - 5 filter highlighting tests

---

### Dashboard Navigation Fixes - COMPLETE ✅

**Issue:** Dashboard tiles routing to incorrect pages (operations status clicking but no filter applied).

**Fixes Applied:**
- `dashboard.component.ts` - Fixed `navigateToOperationsByStatus()` to use `/operations?status=...`
- `operation-list.component.ts` - Added ActivatedRoute and query param reading
- `inventory-list.component.ts` - Added query param reading for `state` and `type`

**Tests Added:**
- `dashboard.component.spec.ts` - 7 navigation tests for operations, inventory, batch approval
- `operation-list.component.spec.ts` - 3 query param tests
- `inventory-list.component.spec.ts` - 5 query param tests

---

## Previous Session Changes (2026-02-07 - Continued)

### Phase 8A: Batch Immutability - COMPLETE ✅

**Per MES Batch Management Specification:**
- B01-B04: Manual batch creation blocked, quantity field removed, adjustQuantity endpoint enforces mandatory reason
- B05: 7 new integration tests verifying immutability rules

**Tests Added (BatchControllerTest.java):**
- B05-1: Manual batch creation should be BLOCKED with clear error message
- B05-2: Update batch should NOT allow quantity changes
- B05-3: Quantity changes MUST use adjustQuantity endpoint with reason
- B05-4: Quantity adjustment without reason should fail validation
- B05-5: Quantity adjustment with short reason should fail
- B05-6: Adjustment history provides full audit trail
- B05-7: Terminal status batches cannot be adjusted

**Additional Changes:**
- Added `logDelete()` method to AuditService for soft delete auditing

**Backend Tests:** All pass (BUILD SUCCESSFUL)

---

### Phase 8B: Default Batch Status & Approval Workflow - COMPLETE ✅

- B06-B07: Already implemented - batches default to QUALITY_PENDING
- B08: Added dashboard loading of pending approval batches
- B09: Already implemented - batch list has Approve/Reject buttons

**Dashboard Changes:**
- Added `getBatchesByStatus('QUALITY_PENDING')` call in dashboard.component.ts
- Alert card displays count of "Batches Pending Approval"
- Click navigates to `/batches?status=QUALITY_PENDING`

**Pre-existing Test Fixes (2026-02-07):**
Fixed multiple test compilation errors in:
- `user-list.component.spec.ts` - Updated to match component API
- `user-form.component.spec.ts` - Removed tests for non-existent features
- `profile.component.spec.ts` - Fixed User type mismatch
- `change-password.component.spec.ts` - Fixed mock return types
- `receive-material.component.spec.ts` - Added missing response fields
- `production-landing.component.spec.ts` - Fixed orderLineId field name
- `order-detail.component.spec.ts` - Fixed orderLineId field name

**Frontend Test Status:** 1002/1007 passing (5 failures - navigation/routing issues)

---

### Phase 8E: Testing & Documentation - PARTIAL ✅

**B21: Backend unit tests for batch rules - DONE**
- Verified 65+ existing tests cover all batch constraints
- BatchServiceTest: 20 tests (split, merge, genealogy, status transitions)
- BatchServiceComprehensiveTest: 40+ edge case tests
- BatchControllerTest: 25+ integration tests including B05 immutability

**B22: E2E tests for batch workflow - DONE**
Added 6 new E2E tests to `e2e/tests/06-batches.test.js`:
- Test 11: Filter QUALITY_PENDING batches
- Test 12: Batch Approval Buttons Visible
- Test 13: Batch Approval Modal
- Test 14: Batch Rejection Modal
- Test 15: Batch Quantity Adjustment
- Test 16: Batch Adjustment History

**B23: User documentation - PENDING**

---

### Phase 9F: Routing Tests - PARTIAL ✅

**R24: Unit tests for new services - DONE**
- RoutingServiceTest: 50+ tests (19 base + 7 nested classes)
- Covers: CRUD, activation/deactivation, hold/release, status checks

**R25: Integration tests for instantiation - DONE**
- RoutingControllerTest: 14 integration tests
- Covers: API endpoints, error handling, authentication

**R27: Batch behavior validation tests - DONE**
- Tested in RoutingServiceTest: canOperationProceed, sequencing validation
- Tests parallel vs sequential routing, mandatory step completion

**Completed:**
- R26: E2E tests for routing workflow (22-routing.test.js - 14 tests)
- R28: Frontend spec tests for routing components (98 tests passing)

---

### Session Log Documentation - CREATED ✅

**New Files:**
- `documents/MES-Development-Session-Log.md` - Permanent historical record

**Updated Instructions:**
- `.claude/CLAUDE.md` - Added session logging instructions
- `.claude/TASKS.md` - Added reference to session log document

---

### Phase 9E Analysis: ProcessTemplate UI REDUNDANT ❌

- R20-R21 (ProcessTemplate list/form) marked as N/A
- ProcessTemplate is an **internal** entity (not exposed in API)
- Routing frontend module handles all design-time configuration
- API uses `processId` in RoutingDTO per MES Consolidated Spec

---

### Routing Configuration Module - COMPLETE ✅

**Backend Step CRUD Endpoints (Already existed):**
- `POST /api/routing/{id}/steps` - Create routing step
- `PUT /api/routing/steps/{stepId}` - Update routing step
- `DELETE /api/routing/steps/{stepId}` - Delete routing step
- `POST /api/routing/{id}/reorder` - Reorder steps

**Frontend Routing Module Created:**
- `routing-list.component.ts/html/css` - List with summary cards, status filters, activation actions
- `routing-form.component.ts/html/css` - Create/edit form with inline step management
- Step modal for add/edit with batch behavior flags (producesOutputBatch, allowsSplit, allowsMerge)
- Move up/down buttons for step reordering
- Mandatory step delete protection

**API Service Methods Added:**
- `createRoutingStep()`, `updateRoutingStep()`, `deleteRoutingStep()`, `reorderRoutingSteps()`

**Admin Sidebar Updated:**
- Added "Routing" link under Production group at `/manage/routing`

**Documentation Updated:**
- `CLAUDE.md` - Added Routing endpoints section, updated Frontend Route Structure
- `MES-Routing-Configuration-Tasks.md` - Marked all implementation tasks as complete

**Pending:**
- Frontend spec tests for routing components
- E2E tests for routing CRUD flow

---

### Route Fix & E2E Tests - COMPLETE ✅

**Fixed `/manage/processes` Route:**
- Added missing route in `app-routing.module.ts` for `/manage/processes`
- Route now points to ProcessesModule under AdminLayoutComponent
- Updated E2E constants with ADMIN_PROCESSES routes

**Created E2E Tests for Production History:**
- New file: `e2e/tests/21-production-history.test.js`
- Tests: Page load, table/list view, status filter, date range filter, search, detail view, summary stats, sorting, pagination

**Updated E2E Tests for Admin Processes:**
- Modified `e2e/tests/18-processes.test.js` to include admin processes tests
- Tests: Admin page load, sidebar navigation, table/cards view, status filter, quality pending

**Updated Test Runner:**
- Added `runProductionHistoryTests` to `e2e/run-all-tests.js`
- Added `/manage/processes` to navigation flow test

---

## Previous Session Changes (2026-02-07)

### Demo Schema Alignment - COMPLETE ✅

Updated `demo/data.sql` to match MES Consolidated Specification:
- Processes now use `(process_id, process_name, status, created_by)` - NO `order_line_id` FK
- Operations now include `order_line_id` column for runtime order linking
- Added comments explaining design-time (Process) vs runtime (Operation→OrderLineItem) model

### Documentation Updates - COMPLETE ✅

**`docs/DEV-GUIDE.md`:**
- Added "Demo Mode Schema Alignment" section explaining how to keep demo/schema.sql in sync with patches
- Added "Alternative: Using Patches in Demo Mode" section recommending PostgreSQL for demo
- Documented entity model per MES Consolidated Spec

**`.claude/CLAUDE.md`:**
- Added "Demo Mode Schema Alignment (IMPORTANT)" to Database Setup section
- Documented which files must stay aligned and when to update them

### Frontend Tests - ALL PASSING ✅

Fixed 19 failing frontend tests:
1. **MaterialDetailComponent** - Fixed expected labels ('Finished Goods', 'Work In Progress')
2. **AuditListComponent** - Fixed expected icon ('circle-plus' instead of 'plus-circle')
3. **DashboardComponent** - Added missing `getAllOperations` mock
4. **BatchFormComponent** - Added missing `getBatchAdjustmentHistory` mock

**Final Result:** 909/909 tests passing (0 failures)

### Test Status Summary

| Test Suite | Tests | Status |
|------------|-------|--------|
| Backend | 1073 | ✅ PASSING |
| Frontend | 909 | ✅ PASSING |

---

## Key Documents

| Document | Purpose |
|----------|---------|
| `.claude/TASKS.md` | Active tasks and session log (this file) |
| `documents/MES-Development-Session-Log.md` | **Permanent session history for traceability** |
| `documents/MES-Batch-Number-Creation-Specification.md` | **Batch number generation rules (NEW)** |
| `documents/MES-Consolidated-Requirements-Implementation-Plan.md` | **Master plan: 72 tasks across 4 phases (~159h)** |
| `documents/MES-Data-Model-Gap-Analysis-Feb2026.md` | Data model alignment (~95-98%) |
| `documents/MES-Batch-Management-Gap-Analysis.md` | Batch lifecycle rules (~75% aligned) |
| `documents/MES-Routing-Process-Operation-Gap-Analysis.md` | Design-time/runtime separation (~60% aligned) |
| `documents/MES-Production-Confirmation-UI-Gap-Analysis.md` | Production UI workflow (~85% aligned) |
| `documents/MES-CRUD-Implementation-Tasks.md` | 128 CRUD tasks - Backend, Frontend, Tests, E2E |
| `documents/MES-Requirements-Gaps-Analysis.md` | Original requirements gaps |

**Session Logging:** At session end, update `documents/MES-Development-Session-Log.md` with permanent record of changes.

---

## Consolidated Requirements Gap Analysis (Updated 2026-02-06)

### Entity Comparison: Requirements vs Implementation (Per MES Consolidated Spec)

| Required Entity | Current Entity | Status | Notes |
|----------------|---------------|--------|-------|
| Orders | Order ✓ | ✅ Aligned | Has CustomerID, OrderDate, Status |
| OrderLineItems | OrderLineItem ✓ | ✅ Aligned | ProductSKU, Quantity, DeliveryDate, Status |
| BillOfMaterial | BillOfMaterial ✓ | ✅ Aligned | Multi-level BOM with ParentBOMID |
| Processes | Process ✓ | ✅ Aligned | ProcessID, ProcessName, Status (runtime entity) |
| Routing | Routing ✓ | ✅ Aligned | ProcessID FK per spec, RoutingType (Sequential/Parallel) |
| RoutingSteps | RoutingStep ✓ | ✅ Aligned | IsParallel, MandatoryFlag, batch behavior flags |
| Operations | Operation ✓ | ✅ Aligned | ProcessID FK per spec, Status, TargetQty, ConfirmedQty |
| Equipment | Equipment ✓ | ✅ Aligned | EquipmentType (Batch/Continuous), Capacity |
| OperationEquipmentUsage | OperationEquipmentUsage ✓ | ✅ Aligned | StartTime, EndTime, OperatorID |
| ProductionConfirmation | ProductionConfirmation ✓ | ✅ Aligned | All fields present |
| Inventory | Inventory ✓ | ✅ Aligned | All states supported |
| InventoryMovement | InventoryMovement ✓ | ✅ Aligned | MovementType, Status |
| Batches | Batch ✓ | ✅ Aligned | GeneratedAtOperationID |
| BatchRelations | BatchRelation ✓ | ✅ Aligned | SPLIT/MERGE support |
| BatchOrderAllocation | BatchOrderAllocation ✓ | ✅ Aligned | One-to-many allocation |
| HoldRecords | HoldRecord ✓ | ✅ Aligned | All entity types supported |
| AuditTrail | AuditTrail ✓ | ✅ Aligned | Field-level tracking |
| ProcessTemplate | ProcessTemplate ✓ | ✅ Internal | Design-time only, not exposed in API (uses processId) |

### Status Values Comparison (Updated 2026-02-06)

| Entity | Required Status | Current Status | Gap |
|--------|----------------|----------------|-----|
| Operation | NOT_STARTED, READY, IN_PROGRESS, PARTIALLY_CONFIRMED, CONFIRMED, BLOCKED, ON_HOLD | All present ✓ | ✅ None - PARTIALLY_CONFIRMED added |
| Process | READY, IN_PROGRESS, QUALITY_PENDING, COMPLETED, REJECTED, ON_HOLD | All present ✓ | ✅ None |
| OrderLine | CREATED, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD | All present ✓ | ✅ None - READY, BLOCKED, ON_HOLD added |
| Inventory | AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD | All present ✓ | ✅ None |
| Equipment | AVAILABLE, IN_USE, MAINTENANCE, ON_HOLD | All present + UNAVAILABLE | ✅ None |
| Batch | AVAILABLE, CONSUMED, PRODUCED, ON_HOLD | All present ✓ | ✅ None |
| Routing | DRAFT, ACTIVE, INACTIVE, ON_HOLD | All present ✓ | ✅ None - DRAFT added |

### Features Comparison

| Feature | Requirement | Status | Notes |
|---------|-------------|--------|-------|
| Production confirmation at operation level | Yes | ✅ Implemented | |
| Multi-level BOM | Yes | ✅ Implemented | ParentBOMID support |
| BOM suggested consumption | Yes | ✅ Implemented | GAP-004 completed |
| Yield loss calculation | Yes | ✅ Implemented | yieldLossRatio in BOM |
| Process sequence from BOM | Yes | ✅ Implemented | sequenceLevel |
| Operation sequence from Routing | Yes | ✅ Implemented | RoutingStep.sequenceNumber |
| Parallel operations support | Yes | ✅ Implemented | isParallel flag |
| Multiple equipments per operation | Yes | ✅ Implemented | ManyToMany relation |
| Equipment types (Batch/Continuous) | Yes | ✅ Implemented | equipmentType field |
| Quantity type configuration | Yes | ⚠️ Partial | Config tables exist, logic not fully implemented |
| Batch number generation | Yes | ✅ Implemented | GAP-005 completed |
| Batch split/merge | Yes | ✅ Implemented | BatchRelation entity |
| Batch-Order allocation | Yes | ✅ Implemented | BatchOrderAllocation entity |
| Hold management | Yes | ✅ Implemented | Multiple entity types |
| Field-level audit | Yes | ✅ Implemented | GAP-007 completed |
| Quality pending workflow | Yes | ✅ Implemented | Process status + usageDecision |

### Minor Status Constant Gaps

1. **Operation.java** - Add `STATUS_PARTIALLY_CONFIRMED = "PARTIALLY_CONFIRMED"`
2. **OrderLineItem.java** - Add `STATUS_BLOCKED` and `STATUS_ON_HOLD` constants
3. **Batch.java** - Add `STATUS_ON_HOLD` constant

### Comprehensive CRUD Gap Analysis

#### Backend CRUD Matrix

| Controller | Entity | GET List | GET Detail | POST Create | PUT Update | DELETE |
|------------|--------|:--------:|:----------:|:-----------:|:----------:|:------:|
| OrderController | Order | ✅ | ✅ | ❌ | ❌ | ❌ |
| ProductionController | ProductionConfirmation | ✅ | ✅ | ✅ | ❌ | ❌ |
| InventoryController | Inventory | ✅ | ✅ | ❌ | ⚠️ State only | ❌ |
| BatchController | Batch | ✅ | ✅ | ⚠️ Split/merge | ❌ | ❌ |
| HoldController | HoldRecord | ✅ | ❌ | ✅ | ⚠️ Release | ❌ |
| EquipmentController | Equipment | ✅ | ✅ | ❌ | ⚠️ State only | ❌ |
| OperationController | Operation | ✅ | ✅ | ❌ | ⚠️ Block only | ❌ |
| ProcessController | Process | ✅ | ✅ | ❌ | ⚠️ Status only | ❌ |
| BomController | BillOfMaterial | ✅ | ❌ | ❌ | ❌ | ❌ |
| RoutingController | Routing | ✅ | ✅ | ❌ | ❌ | ❌ |
| MasterDataController | Operators/Equipment | ✅ | ❌ | ❌ | ❌ | ❌ |
| AuditController | AuditTrail | ✅ | ❌ | ❌ | ❌ | ❌ |

#### Frontend Pages Matrix

| Feature Module | List Page | Detail Page | Create Page | Edit Page |
|----------------|:---------:|:-----------:|:-----------:|:---------:|
| Auth | ❌ | ❌ | ❌ (Login only) | ❌ |
| Dashboard | ✅ | ❌ | ❌ | ❌ |
| Orders | ✅ | ✅ | ❌ | ❌ |
| Production | ❌ | ❌ | ✅ Confirm | ❌ |
| Inventory | ✅ | ❌ | ❌ | ❌ |
| Batches | ✅ | ✅ | ❌ | ❌ |
| Holds | ✅ | ❌ | ✅ Modal | ❌ |
| Equipment | ✅ | ❌ | ❌ | ❌ |
| Quality | ✅ | ❌ | ❌ | ❌ |

#### Missing Entities (No Implementation)

| Entity | Type | Notes |
|--------|------|-------|
| Customer | Master Data | Required for order creation |
| Material | Master Data | Only referenced, no CRUD |
| Product | Master Data | Only referenced, no CRUD |
| Supplier | Master Data | Not implemented |
| Warehouse/Location | Master Data | Not implemented |
| Shift | Master Data | Not implemented |
| Department | Master Data | Not implemented |

#### Priority Classification

**🔴 CRITICAL (Blocking Order-to-Cash)**
| Missing Item | Backend | Frontend |
|--------------|---------|----------|
| Order CRUD | POST/PUT/DELETE | Create/Edit page |
| Customer Management | Entity + CRUD API | List/Create pages |
| Line Item Management | CRUD endpoints | Form component |

**🟠 HIGH (Blocking Production Setup)**
| Missing Item | Backend | Frontend |
|--------------|---------|----------|
| Inventory CRUD | POST/PUT/DELETE | Create/Edit page |
| Equipment CRUD | POST/PUT/DELETE | Create/Edit page |
| Batch CRUD | POST/PUT/DELETE | Create/Edit page |
| BOM CRUD | POST/PUT/DELETE | Create/Edit page |
| Routing CRUD | POST/PUT/DELETE | Create/Edit page |

**🟡 MEDIUM (Configuration)**
| Missing Item | Backend | Frontend |
|--------------|---------|----------|
| Operator Management | CRUD endpoints | Management page |
| Material/Product Master | Entity + CRUD | List/Create pages |
| Process/Operation CRUD | POST/PUT/DELETE | Configuration pages |
| Hold Reasons Config | CRUD endpoints | Config page |
| Delay Reasons Config | CRUD endpoints | Config page |

**🟢 LOW (Views/Reporting)**
| Missing Item | Backend | Frontend |
|--------------|---------|----------|
| Hold Detail View | GET /{id} | Detail page |
| Inventory Detail | - | Detail page |
| Equipment Detail | - | Detail page |
| Production History | - | History page |
| Audit Trail Viewer | Endpoints exist | UI page |

#### Summary Counts

| Operation Type | Missing Count |
|----------------|---------------|
| POST (Create) | 19+ |
| PUT (Update) | 14+ |
| DELETE | 14+ |
| Detail Views | 16 |
| List Views | 7 |
| **Missing Entities** | **7** |

---

## Current Sprint: Phase 1 CRUD Implementation

**Started:** 2026-02-04
**Goal:** Implement full CRUD for Customer, Material, Product entities and Order create/edit

### Phase 1 Backend Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 1 | Create Customer entity | ✅ DONE | `Customer.java` with all fields |
| 2 | Create CustomerRepository | ✅ DONE | Pagination support |
| 3 | Create CustomerDTO | ✅ DONE | Validation annotations |
| 4 | Create CustomerService | ✅ DONE | Full CRUD + audit |
| 5 | Create CustomerController | ✅ DONE | All REST endpoints |
| 6 | Create customers SQL patch | ✅ DONE | `014_customers_table.sql` |
| 7 | Create Material entity | ✅ DONE | Types: RM, IM, FG, WIP |
| 8 | Create MaterialRepository | ✅ DONE | Pagination support |
| 9 | Create MaterialDTO | ✅ DONE | Validation annotations |
| 10 | Create MaterialService | ✅ DONE | Full CRUD + audit |
| 11 | Create MaterialController | ✅ DONE | All REST endpoints |
| 12 | Create Product entity | ✅ DONE | SKU-based products |
| 13 | Create ProductRepository | ✅ DONE | Pagination support |
| 14 | Create ProductDTO | ✅ DONE | Validation annotations |
| 15 | Create ProductService | ✅ DONE | Full CRUD + audit |
| 16 | Create ProductController | ✅ DONE | All REST endpoints |
| 17 | Create materials/products SQL patch | ✅ DONE | `015_materials_products_tables.sql` |
| 18 | Order CRUD - CreateOrderRequest | ✅ DONE | With nested LineItemRequest |
| 19 | Order CRUD - UpdateOrderRequest | ✅ DONE | Basic order info |
| 20 | Order CRUD - LineItemRequest | ✅ DONE | For line item operations |
| 21 | Order CRUD - Service methods | ✅ DONE | create, update, delete + line items |
| 22 | Order CRUD - Controller endpoints | ✅ DONE | POST/PUT/DELETE + line items |

### Phase 1 Frontend Tasks

| # | Task | Status | Notes |
|---|------|--------|-------|
| 23 | Create customer.model.ts | ✅ DONE | TypeScript interfaces |
| 24 | Create material.model.ts | ✅ DONE | TypeScript interfaces |
| 25 | Create product.model.ts | ✅ DONE | TypeScript interfaces |
| 26 | Update models/index.ts exports | ✅ DONE | Export new models |
| 27 | Add Customer API methods | ✅ DONE | CRUD methods in api.service.ts |
| 28 | Add Material API methods | ✅ DONE | CRUD methods in api.service.ts |
| 29 | Add Product API methods | ✅ DONE | CRUD methods in api.service.ts |
| 30 | Add Order CRUD API methods | ✅ DONE | create, update, delete + line items |
| 31 | Create CustomersModule | ✅ DONE | Module + routing |
| 32 | Create CustomerListComponent | ✅ DONE | With pagination |
| 33 | Create CustomerFormComponent | ✅ DONE | Create/edit form |
| 34 | Create MaterialsModule | ✅ DONE | Module + routing |
| 35 | Create MaterialListComponent | ✅ DONE | With pagination |
| 36 | Create MaterialFormComponent | ✅ DONE | Create/edit form |
| 37 | Create ProductsModule | ✅ DONE | Module + routing |
| 38 | Create ProductListComponent | ✅ DONE | With pagination |
| 39 | Create ProductFormComponent | ✅ DONE | Create/edit form |
| 40 | Add routes to app-routing | ✅ DONE | customers, materials, products |
| 41 | Create Order create page | ✅ DONE | OrderFormComponent |
| 42 | Create Order edit page | ✅ DONE | OrderFormComponent (same) |
| 43 | Update OrderListComponent | ✅ DONE | Added New Order + Edit buttons |
| 44 | Update orders routing | ✅ DONE | Added /new and /:id/edit routes |

### Phase 1 Summary - COMPLETE

**Backend Created:**
- Customer entity, repository, service, controller, DTO (with validation)
- Material entity, repository, service, controller, DTO
- Product entity, repository, service, controller, DTO
- Order CRUD service methods and controller endpoints
- SQL patches: `014_customers_table.sql`, `015_materials_products_tables.sql`

**Frontend Created:**
- Customer module: list (paginated) + form (create/edit)
- Material module: list (paginated) + form (create/edit)
- Product module: list (paginated) + form (create/edit)
- Order form: create/edit with line items management
- Updated order list with New Order and Edit buttons
- Added routes: `/customers`, `/materials`, `/products`, `/orders/new`, `/orders/:id/edit`

**API Endpoints Added:**
- `GET/POST /api/customers`, `GET/PUT/DELETE /api/customers/{id}`, `GET /api/customers/paged`
- `GET/POST /api/materials`, `GET/PUT/DELETE /api/materials/{id}`, `GET /api/materials/paged`
- `GET/POST /api/products`, `GET/PUT/DELETE /api/products/{id}`, `GET /api/products/paged`
- `POST /api/orders`, `PUT/DELETE /api/orders/{id}`
- `POST/PUT/DELETE /api/orders/{id}/line-items/{lineId}`

### Phase 1 Testing

| # | Task | Status | Notes |
|---|------|--------|-------|
| 45 | Write frontend tests for Customer components | ✅ DONE | customer-list.spec.ts, customer-form.spec.ts |
| 46 | Write frontend tests for Material components | ✅ DONE | material-list.spec.ts, material-form.spec.ts |
| 47 | Write frontend tests for Product components | ✅ DONE | product-list.spec.ts, product-form.spec.ts |
| 48 | Write frontend tests for Order form | ✅ DONE | order-form.spec.ts |
| 49 | Write backend tests for Customer CRUD | ✅ DONE | CustomerServiceTest.java, CustomerControllerTest.java (already implemented) |
| 50 | Write backend tests for Material CRUD | ✅ DONE | MaterialServiceTest.java, MaterialControllerTest.java (already implemented) |
| 51 | Write backend tests for Product CRUD | ✅ DONE | ProductServiceTest.java, ProductControllerTest.java (already implemented) |
| 52 | Write backend tests for Order CRUD | ✅ DONE | OrderServiceTest.java, OrderControllerTest.java (already implemented) |
| 53 | Write E2E tests for CRUD flows | ✅ DONE | 11-crud.test.js - 22 tests for Customer, Material, Product CRUD |

---

## Phase 2: Production Setup Testing

**Goal:** Test Equipment, Operator, BOM, and Routing CRUD

### Phase 2 Backend Tests - COMPLETE (667 tests, 0 failures)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 54 | EquipmentService CRUD tests | ✅ DONE | Already comprehensive (pre-existing) |
| 55 | EquipmentController tests | ✅ DONE | Already comprehensive (pre-existing) |
| 56 | OperatorService CRUD tests | N/A | Operators are read-only master data, no service |
| 57 | OperatorController tests | ✅ DONE | +5 tests in MasterDataControllerTest |
| 58 | BomService CRUD tests | ✅ DONE | NEW BomServiceTest.java - 29 tests |
| 59 | BomController tests | ✅ DONE | +18 CRUD tests in BomControllerTest (23 total) |
| 60 | BOM hierarchy tests | ✅ DONE | Covered in BomServiceTest (tree, cascade, move) |
| 61 | RoutingService CRUD tests | ✅ DONE | Already comprehensive - 18 tests |
| 62 | RoutingController tests | ✅ DONE | Already comprehensive - 12 tests |
| 63 | Routing step CRUD tests | ✅ DONE | Covered in RoutingServiceTest |

**Also fixed:** 6 pre-existing test failures in CustomerControllerTest, MaterialControllerTest, ProductControllerTest, OrderControllerTest

### Phase 2 Frontend Tests - COMPLETE (485 tests, 0 failures)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 64 | EquipmentListComponent tests | ✅ DONE | equipment-list.component.spec.ts |
| 65 | EquipmentFormComponent tests | ✅ DONE | equipment-form.component.spec.ts |
| 66 | OperatorListComponent tests | N/A | Operators are read-only, no dedicated list component |
| 67 | OperatorFormComponent tests | N/A | Operators are read-only |
| 68 | BomListComponent tests | ✅ DONE | bom-list.component.spec.ts |
| 69 | BomFormComponent tests | ✅ DONE | bom-node-form.component.spec.ts + bom-tree.component.spec.ts |
| 70 | RoutingListComponent tests | N/A | Routing has no dedicated frontend module yet |
| 71 | RoutingFormComponent tests | N/A | Routing has no dedicated frontend module yet |

### Phase 2 E2E Tests - COMPLETE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 72 | E2E: Equipment CRUD flow | ✅ DONE | 12-entity-crud.test.js (Equipment section) |
| 73 | E2E: Operator CRUD flow | N/A | Operators are read-only master data |
| 74 | E2E: BOM CRUD flow | ✅ DONE | 13-bom-crud.test.js |
| 75 | E2E: Routing CRUD flow | N/A | Routing has no dedicated frontend module yet |

---

## Phase 3: Inventory & Batches Testing - COMPLETE

**Goal:** Test Inventory and Batch CRUD
**Result:** All tests pass - Backend BUILD SUCCESSFUL, Frontend 485/485

### Phase 3 Backend Tests - COMPLETE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 76 | InventoryService create tests | ✅ DONE | CreateInventoryTests nested class (2 tests) |
| 77 | InventoryService update tests | ✅ DONE | UpdateInventoryTests nested class (4 tests) |
| 78 | InventoryService delete tests | ✅ DONE | DeleteInventoryTests nested class (4 tests) |
| 79 | InventoryController CRUD tests | ✅ DONE | Create/Update/Delete endpoints (4 tests) |
| 80 | Inventory state transition tests | ✅ DONE | Block/Unblock/Scrap tests (11 tests) |
| 81 | BatchService create tests | ✅ DONE | CreateBatchTests nested class (2 tests) |
| 82 | BatchService update tests | ✅ DONE | UpdateBatchTests nested class (4 tests) |
| 83 | BatchService delete tests | ✅ DONE | DeleteBatchTests nested class (4 tests) |
| 84 | BatchController CRUD tests | ✅ DONE | Create/Update/Delete endpoints (5 tests) |
| 85 | Batch split/merge tests | ✅ DONE | Split (4 tests) + Merge (5 tests) |

### Phase 3 Frontend Tests - COMPLETE (72 inventory+batch tests)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 86 | InventoryListComponent tests | ✅ DONE | inventory-list.component.spec.ts (21 tests) |
| 87 | InventoryFormComponent tests | ✅ DONE | inventory-form.component.spec.ts (10 tests) |
| 88 | InventoryDetailComponent tests | N/A | No dedicated detail component (info shown in list) |
| 89 | Inventory state actions tests | ✅ DONE | Block/Unblock/Scrap in inventory-list.spec.ts |
| 90 | BatchListComponent tests | ✅ DONE | batch-list.component.spec.ts (12 tests) |
| 91 | BatchFormComponent tests | ✅ DONE | batch-form.component.spec.ts (9 tests) |
| 92 | BatchDetailComponent tests | ✅ DONE | batch-detail.component.spec.ts (11 tests) |

### Phase 3 E2E Tests - COMPLETE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 93 | E2E: Inventory CRUD flow | ✅ DONE | 12-entity-crud.test.js (Inventory section) |
| 94 | E2E: Inventory state changes | ✅ DONE | 05-inventory.test.js (Block/Unblock/Scrap tests) |
| 95 | E2E: Batch CRUD flow | ✅ DONE | 12-entity-crud.test.js (Batch section) |
| 96 | E2E: Batch split/merge | ✅ DONE | 06-batches.test.js (Split/Merge modal tests) |

---

## Phase 4: Configuration Testing - COMPLETE

**Goal:** Test Process/Operation CRUD and configuration pages
**Result:** All existing tests pass - Backend BUILD SUCCESSFUL, Frontend 16/16

### Phase 4 Backend Tests - COMPLETE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 97 | ProcessService CRUD tests | ✅ DONE | ProcessServiceTest.java - 14+ tests (status transitions, quality decisions) |
| 98 | ProcessController tests | ✅ DONE | ProcessControllerTest.java - 7+ tests (all endpoints) |
| 99 | OperationService CRUD tests | ✅ DONE | OperationServiceTest.java - 12 tests (block/unblock, list, filter) |
| 100 | OperationController tests | ✅ DONE | OperationControllerTest.java - 7+ tests (all endpoints) |
| 101 | Hold reasons CRUD tests | DEFERRED → Phase 6 | No JPA entity yet, accessed via JdbcTemplate. See task 129-131 |
| 102 | Delay reasons CRUD tests | DEFERRED → Phase 6 | No JPA entity yet, accessed via JdbcTemplate. See task 132-134 |
| 103 | Equipment types CRUD tests | ✅ DONE | EquipmentTypeService with validation (GAP-002), read via MasterDataController |
| 104 | Units of measure CRUD tests | ✅ DONE | UnitOfMeasure enum with 16 units, validation in entity layer |

### Phase 4 Frontend Tests - COMPLETE

| # | Task | Status | Notes |
|---|------|--------|-------|
| 105 | ProcessListComponent tests | ✅ DONE | quality-pending.component.spec.ts (16 tests) |
| 106 | ProcessFormComponent tests | ✅ DONE | Quality decision modal tested in spec.ts |
| 107 | OperationFormComponent tests | N/A | Operations are system-managed, no dedicated form |
| 108 | HoldReasonsPage tests | DEFERRED → Phase 6 | Config page not yet built. See task 145 |
| 109 | DelayReasonsPage tests | DEFERRED → Phase 6 | Config page not yet built. See task 146 |
| 110 | EquipmentTypesPage tests | N/A | Equipment types are DB config, no dedicated page |
| 111 | UnitsPage tests | N/A | UnitOfMeasure is an enum, no dedicated page |

### Phase 4 E2E Tests

| # | Task | Status | Notes |
|---|------|--------|-------|
| 112 | E2E: Process/Operation CRUD | ✅ DONE | Process quality workflow in 09-quality.test.js |
| 113 | E2E: Configuration management | DEFERRED → Phase 6 | Config pages not yet built. See tasks 145-151 |

---

## Phase 5: Views & Reporting Testing

**Goal:** Test detail views, audit trail UI, and user management

### Phase 5 Backend Tests

| # | Task | Status | Notes |
|---|------|--------|-------|
| 114 | Hold detail endpoint tests | ✅ DONE | HoldControllerTest.java (12 tests) covers all endpoints |
| 115 | Production history tests | ✅ DONE | ProductionControllerTest.java (12 tests) covers confirmations |
| 116 | UserService CRUD tests | ✅ DONE | UserServiceTest.java (20 tests) covers all CRUD |
| 117 | UserController tests | ✅ DONE | UserControllerTest.java (16 tests) covers all endpoints |
| 118 | User authentication tests | ✅ DONE | AuthServiceTest.java (8) + AuthControllerTest.java (9) tests |

### Phase 5 Frontend Tests

| # | Task | Status | Notes |
|---|------|--------|-------|
| 119 | HoldDetailPage tests | ✅ DONE | hold-detail.component.spec.ts (22 tests) |
| 120 | InventoryDetailPage tests | ✅ DONE | inventory-detail.component.spec.ts (26 tests) |
| 121 | EquipmentDetailPage tests | ✅ DONE | equipment-detail.component.spec.ts (21 tests) |
| 122 | ProductionHistoryPage tests | ✅ DONE | production-history.component.spec.ts (15 tests) |
| 123 | AuditTrailPage tests | ✅ DONE | audit-list.component.spec.ts (17 tests) |
| 124 | UserListComponent tests | ✅ DONE | user-list.component.spec.ts (14 tests) |
| 125 | UserFormComponent tests | ✅ DONE | user-form.component.spec.ts (14 tests) |

### Phase 5 E2E Tests

| # | Task | Status | Notes |
|---|------|--------|-------|
| 126 | E2E: Detail views navigation | ✅ DONE | Covered in orders, batches, holds, processes, users tests |
| 127 | E2E: Audit trail viewing | ✅ DONE | 15-audit-history.test.js (17 tests) |
| 128 | E2E: User management | ✅ DONE | 20-users.test.js (13+ tests) |

---

## Phase 6: Missing Entity Implementation

**Goal:** Implement entities referenced as FKs in the MES specification but missing from implementation

### Analysis Summary

**Already Fully Implemented (no action needed):**
- Customer - Phase 1 CRUD complete
- Material - Phase 1 CRUD complete
- Product - Phase 1 CRUD complete
- Operator - Read-only master data, exists
- OperationEquipmentUsage - Full JPA entity + CRUD
- InventoryMovement - Full JPA entity + CRUD
- BatchOrderAllocation - Full JPA entity + CRUD

**Needs Full CRUD Implementation (DB table exists, no JPA layer):**

### Phase 6A: Lookup/Config Entity CRUD

| # | Task | Status | Notes |
|---|------|--------|-------|
| 129 | HoldReasons entity + repository | DONE | JPA entity for `hold_reasons` table (reason_code, reason_description, applicable_to, status) |
| 130 | HoldReasons service + controller | DONE | CRUD service + REST endpoints `/api/config/hold-reasons` |
| 131 | HoldReasons DTO + tests | DONE | DTO, service tests, controller tests |
| 132 | DelayReasons entity + repository | DONE | JPA entity for `delay_reasons` table (reason_code, reason_description, status) |
| 133 | DelayReasons service + controller | DONE | CRUD service + REST endpoints `/api/config/delay-reasons` |
| 134 | DelayReasons DTO + tests | DONE | DTO, service tests, controller tests |
| 135 | ProcessParametersConfig entity + repository | DONE | JPA entity for `process_parameters_config` (currently JdbcTemplate in ProcessParameterService) |
| 136 | ProcessParametersConfig CRUD controller | DONE | REST endpoints `/api/config/process-parameters` for CRUD (currently read-only via MasterDataController) |
| 137 | ProcessParametersConfig DTO + tests | DONE | DTO, service tests, controller tests |
| 138 | BatchNumberConfig entity + repository | DONE | JPA entity for `batch_number_config` (currently inner class in BatchNumberService) |
| 139 | BatchNumberConfig CRUD controller | DONE | REST endpoints `/api/config/batch-number` for CRUD |
| 140 | BatchNumberConfig DTO + tests | DONE | DTO, service tests, controller tests |

### Phase 6B: QuantityTypeConfig (New Entity)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 141 | QuantityTypeConfig SQL patch | DONE | New table: quantity_type_config with material_code, operation_type, equipment_type, quantity_type, precision, rounding_rule |
| 142 | QuantityTypeConfig entity + repository | DONE | JPA entity + Spring Data repository |
| 143 | QuantityTypeConfig service + controller | DONE | CRUD service + REST endpoints `/api/config/quantity-types` |
| 144 | QuantityTypeConfig DTO + tests | DONE | DTO, service tests, controller tests |

### Phase 6C: Frontend Config Pages

| # | Task | Status | Notes |
|---|------|--------|-------|
| 145 | Hold Reasons config page | DONE | List + Create/Edit form under /manage/config/hold-reasons |
| 146 | Delay Reasons config page | DONE | List + Create/Edit form under /manage/config/delay-reasons |
| 147 | Process Parameters config page | DONE | List + Create/Edit form under /manage/config/process-parameters |
| 148 | Batch Number Config page | DONE | List + Create/Edit form under /manage/config/batch-number |
| 149 | Quantity Type Config page | DONE | List + Create/Edit form under /manage/config/quantity-type |
| 150 | Frontend tests for config pages | DONE | 10 spec files, 645 total tests pass (0 failures) |
| 151 | E2E tests for config management | DONE | E2E CRUD flows for all 6 config pages (including batch-size) |

---

## Recent Session Changes (2026-02-07)

### B13: Multi-Batch Production Support - COMPLETE ✅

**Goal:** Integrate BatchSizeService into ProductionService for creating multiple batches when quantity exceeds max batch size

**Files Modified:**
- `backend/src/main/java/com/mes/production/dto/ProductionConfirmationDTO.java` - Added outputBatches, batchCount, hasPartialBatch fields
- `backend/src/main/java/com/mes/production/service/ProductionService.java` - Integrated BatchSizeService, creates multiple batches
- `backend/src/test/java/com/mes/production/service/ProductionServiceTest.java` - Added BatchSizeService mock

**Features:**
- Automatic batch splitting when produced quantity exceeds configured max batch size
- Sequential batch numbers with suffix (e.g., BATCH-001-01, BATCH-001-02)
- Response includes all output batches plus backward-compatible single batch field
- Creates inventory and batch relations for all split batches

**Test Results:** All backend tests pass (BUILD SUCCESSFUL)

---

### #151: E2E Tests for Config Management - COMPLETE ✅

**Files Modified:**
- `e2e/config/constants.js` - Added CONFIG_BATCH_SIZE routes
- `e2e/tests/14-config-crud.test.js` - Added Batch Size Config tests (list, form, create)

**Coverage:**
- Hold Reasons: List, form navigation, entity chips, CRUD
- Delay Reasons: List, form navigation, CRUD
- Process Parameters: List, form navigation, CRUD
- Batch Number Config: List, form navigation, CRUD
- Quantity Type Config: List, form navigation, CRUD
- Batch Size Config: List, form navigation, validation, CRUD
- Config navigation across all 6 pages

---

### UI Consistency Fixes

**Goal:** Fix padding, margin, and button size inconsistencies across list pages

**Files Modified:**

| File | Changes |
|------|---------|
| `frontend/src/app/features/users/user-list/user-list.component.css` | Removed conflicting button/filter overrides, use global styles |
| `frontend/src/app/features/equipment/equipment-list/equipment-list.component.css` | Fixed padding, consistent with other list pages |
| `frontend/src/app/features/config/batch-size/batch-size-list.component.spec.ts` | Fixed TypeScript null vs undefined issue |
| `frontend/src/app/features/equipment/equipment-list/equipment-list.component.html` | Changed table wrapper from `.card` to `.table-container` |
| `frontend/src/app/features/orders/order-list/order-list.component.html` | Changed table wrapper from `.card` to `.table-container` |
| `frontend/src/app/features/inventory/inventory-list/inventory-list.component.html` | Changed table wrapper from `.card` to `.table-container` |
| `frontend/src/app/features/batches/batch-list/batch-list.component.html` | Changed table wrapper from `.card` to `.table-container` |
| `frontend/src/app/features/orders/order-list/order-list.component.css` | Added `.table-container` styling |
| `frontend/src/app/features/inventory/inventory-list/inventory-list.component.css` | Added `.table-container` styling |
| `frontend/src/app/features/batches/batch-list/batch-list.component.css` | Added `.table-container` styling |
| `frontend/src/app/shared/components/pagination/pagination.component.css` | Added horizontal padding (16px all sides) |

**Issues Fixed:**
1. User Management page - Buttons/padding not matching other pages (local CSS overriding global)
2. Equipment Management page - Extra space between filter card and table (changed to table-container)
3. Equipment Management page - Pagination panel missing horizontal margin (updated shared component)
4. Orders page - Extra space between filter card and table (changed to table-container)
5. Inventory page - Extra space between filter card and table (changed to table-container)
6. Batches page - Extra space between filter card and table (changed to table-container)
7. Batch size spec tests - Type errors with null values in mock data

**Test Results:**
- Frontend: 1168 pass, 6 fail (pre-existing user-form failures)
- Build: Successful

---

## Recent Session Changes (2026-02-06)

### MES Consolidated Data Model Gap Analysis & Implementation

**Goal:** Analyze new MES Consolidated Data Model document, identify gaps, and implement missing tables/entities

**Documentation Created:**
- `documents/MES-Data-Model-Gap-Analysis-Feb2026.md` - Comprehensive gap analysis (~95-98% alignment)

**Database Patches Created:**

| Patch | Purpose |
|-------|---------|
| `019_order_line_hold_record_constraints.sql` | Add READY to OrderLineItem status, EQUIPMENT to HoldRecord entity_type |
| `020_orders_customer_fk.sql` | Add customer_ref_id FK from Orders to Customers (nullable) |
| `021_master_lookup_tables.sql` | 7 master tables: departments, shifts, locations, material_groups, product_categories, product_groups, operation_types |
| `022_property_attribute_tables.sql` | attribute_definitions + 5 entity-specific attribute tables (EAV pattern) |
| `023_process_parameter_values.sql` | process_parameter_values, operation_parameter_templates, consumed_materials, produced_outputs |

**Java Entities Created:**

| Entity | Purpose |
|--------|---------|
| `Department.java` | Operator departments (code, name, status) |
| `Shift.java` | Work shifts (code, name, startTime, endTime) |
| `Location.java` | Hierarchical locations/warehouses (parent, temperatureControlled) |
| `MaterialGroup.java` | Hierarchical material categorization (parent, description) |
| `ProductCategory.java` | Hierarchical product categories (parent, description) |
| `ProductGroup.java` | Product groups linked to categories |
| `OperationType.java` | Operation type definitions (code, name, parameters) |
| `AttributeDefinition.java` | Dynamic attribute definitions (EAV: dataType, entityType, min/max, allowedValues) |
| `ProcessParameterValue.java` | Captured parameter values (value, stringValue, isWithinSpec) |
| `ConsumedMaterial.java` | Detailed material consumption per confirmation |
| `ProducedOutput.java` | Production outputs with type (GOOD/SCRAP/REWORK/BYPRODUCT) |

**Entity Modifications:**
- `OrderLineItem.java` - Added `STATUS_READY` constant
- `HoldRecord.java` - Added `ENTITY_TYPE_EQUIPMENT` constant
- `Order.java` - Added `customerRefId` FK and `Customer` relationship (ManyToOne)

**Frontend Modifications:**
- `frontend/src/app/shared/constants/status.constants.ts` - Added `PARTIALLY_CONFIRMED` to OperationStatus, new `OrderLineStatus`
- `frontend/src/app/shared/models/order.model.ts` - Changed status type to `OrderLineStatusType`
- `frontend/src/app/features/orders/order-list/order-list.component.spec.ts` - Fixed mock statuses

**Verification Results:**
- Backend: 873 tests pass (0 failures)
- Frontend: Builds successfully (bundle warnings only)

---

### Dashboard Chart Race Condition Fix

**Issue:** Charts on dashboard didn't load on first login but worked after page refresh.

**Root Cause:** Race condition between:
1. `ngAfterViewInit()` setting `chartsReady = true`
2. Multiple API calls completing asynchronously
3. `loading` flag only set to `false` when inventory loaded, but charts also depend on orders and summary data

**Files Modified:**
- `frontend/src/app/features/dashboard/dashboard/dashboard.component.ts`

**Changes:**
1. Added `dataLoaded` tracking object for inventory, orders, and summary
2. Each API subscription now sets its corresponding `dataLoaded` flag (even on error)
3. Added `checkLoadingComplete()` method that sets `loading = false` only when all three data sources are ready
4. Added `setTimeout(0)` in `tryBuildCharts()` to ensure DOM is stable after Angular change detection

**Code Changes:**
```typescript
// Track each data source independently
dataLoaded = {
  inventory: false,
  orders: false,
  summary: false
};

// Check all data is loaded before building charts
private checkLoadingComplete(): void {
  if (this.dataLoaded.inventory && this.dataLoaded.orders && this.dataLoaded.summary) {
    this.loading = false;
    this.tryBuildCharts();
  }
}

// Ensure DOM stability with setTimeout
private tryBuildCharts(): void {
  if (!this.chartsReady || this.loading) return;
  setTimeout(() => {
    this.buildInventoryChart();
    this.buildOrderStatusChart();
    this.buildOperationsChart();
  }, 0);
}
```

---

## Recent Session Changes (2026-02-05)

### BOM CRUD Backend Implementation (IN PROGRESS)

**Goal:** Implement full CRUD for BOM with hierarchical tree structure support

**Files Created/Modified:**

1. **`backend/src/main/java/com/mes/production/dto/BomDTO.java`** - Added tree CRUD DTOs:
   - `BomTreeNode` - Tree node with children list
   - `BomTreeFullResponse` - Full tree response with metadata
   - `CreateBomNodeRequest` - Create single node
   - `CreateBomTreeRequest` - Create full tree
   - `UpdateBomNodeRequest` - Update node properties
   - `MoveBomNodeRequest` - Move node to new parent
   - `BomListResponse` - Flat list view with child count
   - `BomProductSummary` - Product-level BOM summary

2. **`backend/src/main/java/com/mes/production/repository/BomRepository.java`** - Added tree queries:
   - `findRootNodesByProductSku()` - Get root nodes (no parent)
   - `findByParentBomId()` - Get children of a node
   - `countChildrenByParentBomId()` - Count children
   - `findActiveByProductSkuAndBomVersion()` - Version-specific query
   - `findDistinctProductSkus()` - All products with BOMs
   - `findDistinctVersionsByProductSku()` - Versions for a product
   - `findMaxSequenceLevelByProductSku()` - Max depth
   - `existsByProductSkuAndMaterialId()` - Check material exists

3. **`backend/src/main/java/com/mes/production/service/BomService.java`** - NEW: Tree CRUD service:
   - `getBomTree()` - Get full hierarchical tree
   - `getBomTreeByVersion()` - Get tree for specific version
   - `getBomNode()` - Get single node with children
   - `getAllProducts()` - Products with BOMs
   - `getVersionsForProduct()` - Available versions
   - `getBomList()` - Flat list for table view
   - `createBomNode()` - Create single node
   - `createBomTree()` - Create full tree (batch)
   - `updateBomNode()` - Update node properties
   - `moveBomNode()` - Move to new parent
   - `deleteBomNode()` - Soft delete (no children)
   - `deleteBomNodeCascade()` - Delete with children
   - `deleteBomTree()` - Delete entire tree
   - Tree building helpers with cycle detection

4. **`backend/src/main/java/com/mes/production/controller/BomController.java`** - Added tree endpoints:
   - `GET /{productSku}/tree` - Full hierarchical tree
   - `GET /{productSku}/tree/version/{version}` - Tree by version
   - `GET /{productSku}/list` - Flat list for tables
   - `GET /node/{bomId}` - Single node with children
   - `GET /products` - All products with BOMs
   - `GET /{productSku}/versions` - Available versions
   - `POST /node` - Create single node
   - `POST /tree` - Create full tree
   - `PUT /node/{bomId}` - Update node
   - `PUT /node/{bomId}/move` - Move node
   - `DELETE /node/{bomId}` - Delete node
   - `DELETE /node/{bomId}/cascade` - Delete with children
   - `DELETE /{productSku}/tree` - Delete entire tree

**API Endpoints Added:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/bom/{sku}/tree` | GET | Get full BOM tree (hierarchical) |
| `/api/bom/{sku}/tree/version/{v}` | GET | Get tree for specific version |
| `/api/bom/{sku}/list` | GET | Get flat list (for tables) |
| `/api/bom/node/{id}` | GET | Get single node with children |
| `/api/bom/products` | GET | List all products with BOMs |
| `/api/bom/{sku}/versions` | GET | Get available versions |
| `/api/bom/node` | POST | Create single BOM node |
| `/api/bom/tree` | POST | Create full BOM tree |
| `/api/bom/node/{id}` | PUT | Update BOM node |
| `/api/bom/node/{id}/move` | PUT | Move node to new parent |
| `/api/bom/node/{id}` | DELETE | Soft delete node |
| `/api/bom/node/{id}/cascade` | DELETE | Delete with all children |
| `/api/bom/{sku}/tree` | DELETE | Delete entire product BOM |

**Tree Structure Response Example:**
```json
{
  "productSku": "FG-STEEL-001",
  "bomVersion": "V1",
  "totalNodes": 5,
  "maxDepth": 3,
  "tree": [
    {
      "bomId": 1,
      "materialId": "RM-IRON-001",
      "materialName": "Iron Ore",
      "quantityRequired": 1.5,
      "sequenceLevel": 1,
      "children": [
        {
          "bomId": 2,
          "materialId": "IM-BILLET-001",
          "sequenceLevel": 2,
          "children": []
        }
      ]
    }
  ]
}
```

**Next Steps for BOM:**
- [x] Run backend tests to verify compilation - DONE (609/615 passed)
- [ ] Write unit tests for BomService
- [x] Create frontend BOM tree component - DONE
- [ ] Add E2E tests for BOM CRUD

### BOM Product Selection Fix (2026-02-05)

**Issue:** When clicking "New BOM", users could not select a product - the form auto-generated a random SKU.

**Files Modified:**
- `frontend/src/app/features/bom/bom-node-form/bom-node-form.component.ts` - Added product loading and selection
- `frontend/src/app/features/bom/bom-node-form/bom-node-form.component.html` - Added product dropdown
- `frontend/src/app/features/bom/bom-node-form/bom-node-form.component.css` - Added styles for full-width group

**Changes:**
- Added `products: Product[]` array and `selectedProductSku` field
- Added `loadProducts()` method to fetch active products from API
- Added `onProductSelect()` handler for dropdown
- Added product selection dropdown when `isNewBom` is true
- Updated `createNode()` to use selected product instead of generating random SKU
- Removed unused `generateProductSku()` method
- Updated title getter to show "Create New BOM" for new BOMs

### E2E CRUD Tests (2026-02-05)

**Files Created:**
- `e2e/tests/11-crud.test.js` - 22 tests covering Customer, Material, Product CRUD flows

**Tests Include:**
- Customer: List, Filter, Search, Create Form, (Create/Edit/Delete with --submit)
- Material: List, Filter, Create Form, (Create/Edit/Delete with --submit)
- Product: List, Search, Create Form, (Create/Edit/Delete with --submit)
- Admin sidebar navigation
- Form validation
- Pagination controls

**Test Results:** 80/80 tests pass

### BOM Frontend Implementation (COMPLETED)

**Files Created:**
- `frontend/src/app/features/bom/bom.module.ts` - BOM module
- `frontend/src/app/features/bom/bom-routing.module.ts` - BOM routing
- `frontend/src/app/features/bom/bom-list/bom-list.component.*` - Products with BOMs list
- `frontend/src/app/features/bom/bom-tree/bom-tree.component.*` - Hierarchical tree view
- `frontend/src/app/features/bom/bom-node-form/bom-node-form.component.*` - Create/edit node form

**Files Modified:**
- `frontend/src/app/shared/models/bom.model.ts` - Added tree CRUD interfaces
- `frontend/src/app/core/services/api.service.ts` - Added BOM CRUD API methods
- `frontend/src/app/app-routing.module.ts` - Added `/manage/bom` route
- `frontend/src/app/shared/components/admin-layout/admin-layout.component.ts` - Added BOM nav link

**Features:**
- Product list showing all BOMs with summary stats (nodes, depth, version)
- Hierarchical tree view with expand/collapse
- Add root node and child node support
- Edit and delete nodes (with cascade option)
- Material selection from master data or manual entry
- Yield loss ratio configuration
- Sequence level management

**Routes:**
- `/manage/bom` - BOM products list
- `/manage/bom/:productSku/tree` - Tree view for product
- `/manage/bom/:productSku/node/new` - Add new node
- `/manage/bom/:productSku/node/:bomId/edit` - Edit node

### Layout Component Refactoring
- Created `MainLayoutComponent` - Wrapper for main pages with header
- Created `AdminLayoutComponent` - Admin pages with sidebar navigation
- Removed `<app-header>` from all individual page components
- Updated routing structure:
  - Main pages: `/dashboard`, `/orders`, etc. use `MainLayoutComponent`
  - Admin pages: `/manage/customers`, `/manage/products`, `/manage/materials` use `AdminLayoutComponent`
- Header now has simple "Manage" link to `/manage` instead of dropdown menu

### Admin/Manage Layout Features
- Left sidebar with navigation links (Customers, Products, Materials)
- "Back to Dashboard" link in sidebar footer
- Responsive design with horizontal layout on mobile
- Dark sidebar theme (#1e293b)

### Hash-Based Routing Migration
- Updated `app-routing.module.ts` to use `useHash: true`
- All URLs now use hash format: `/#/dashboard`, `/#/orders`, etc.
- Updated E2E test constants in `e2e/config/constants.js`
- Updated test helpers in `e2e/utils/test-helpers.js`
- Updated all demo recording scripts for hash-based URLs
- Admin routes: `/#/manage/customers`, `/#/manage/products`, `/#/manage/materials`

### Material Model Fix
- Changed `unit` to `baseUnit` in Material model, forms, and templates
- Updated `material.model.ts` - `baseUnit` in interfaces
- Updated `material-form.component.ts` - Form uses `baseUnit`
- Updated `material-form.component.html` - Template uses `baseUnit`
- Updated `material-list.component.html` - Display uses `baseUnit`

### Bug Fix
- Fixed `OrderService.java` compilation error - ambiguous `Process` reference
- Changed from wildcard import `com.mes.production.entity.*` to explicit imports

---

## Test Summary by Phase

| Phase | Backend Tests | Frontend Tests | E2E Tests | Total |
|-------|--------------|----------------|-----------|-------|
| Phase 1 | 4 ✅ DONE | 4 ✅ DONE | 1 ✅ DONE | 9 ✅ |
| Phase 2 | 10 | 8 | 4 | 22 |
| Phase 3 | 10 | 7 | 4 | 21 |
| Phase 4 | 8 | 7 | 2 | 17 |
| Phase 5 | 5 | 7 | 3 | 15 |
| **Total** | **37** | **33** | **14** | **84** |

**Phase 1 Complete:**
- Backend tests: CustomerServiceTest, CustomerControllerTest, MaterialServiceTest, MaterialControllerTest, ProductServiceTest, ProductControllerTest, OrderServiceTest, OrderControllerTest (all already implemented)
- Frontend tests: customer-list.spec.ts, customer-form.spec.ts, material-list.spec.ts, material-form.spec.ts, product-list.spec.ts, product-form.spec.ts, order-form.spec.ts
- E2E tests: 11-crud.test.js (22 tests for Customer, Material, Product CRUD)

---

### Previous Sprint (Completed)

| # | Task | Status |
|---|------|--------|
| 1 | Add getBatchesPaged() to frontend API service | ✅ DONE |
| 2 | Integrate pagination into OrderListComponent | ✅ DONE |
| 3 | Integrate pagination into BatchListComponent | ✅ DONE |
| 4 | Integrate pagination into InventoryListComponent | ✅ DONE |
| 5 | Fix batches table missing quality columns | ✅ DONE (patch 010) |
| 6 | Align demo schema with PostgreSQL patches | ✅ DONE |
| 7 | Add missing columns to operations/inventory | ✅ DONE (patch 011) |
| 8 | Create PostgreSQL test profile | ✅ DONE (application-test.yml) |
| 9 | Create test schema reset mechanism | ✅ DONE (TestSchemaReset.java) |
| 10 | Update build.gradle for integrated testing | ✅ DONE |
| 11 | Create test runner scripts | ✅ DONE (run-tests.bat/sh) |

---

## Schema Alignment Summary

### PostgreSQL Patches Created

| Patch | Purpose |
|-------|---------|
| `010_batch_quality_fields.sql` | Adds approved_by, approved_on, rejected_by, rejected_on, rejection_reason to batches |
| `011_operations_inventory_fields.sql` | Adds target_qty, confirmed_qty, block fields to operations; block/scrap/reservation fields to inventory |

### Demo Schema Updated

- Added config tables: `equipment_type_config`, `unit_of_measure`, `unit_conversion`, `inventory_form_config`, `batch_number_config`, `batch_number_sequence`
- Added inventory columns: `inventory_form`, `current_temperature`, `moisture_content`, `density`

### Entity Updates

- `Inventory.java` - Added `inventoryForm`, `currentTemperature`, `moistureContent`, `density` fields

---

## Testing Infrastructure

### Database Setup

| Database | Purpose | Profile |
|----------|---------|---------|
| `mes_production` | Production | default |
| `mes_test` | Testing | test |

### Test Profile (application-test.yml)

- Uses PostgreSQL `mes_test` database
- Schema reset enabled (`app.test.reset-schema=true`)
- Patches run automatically after schema reset

### Test Flow

1. `TestSchemaReset` drops and recreates public schema
2. `PatchRunner` applies all patches (001-011)
3. Tests run against fresh database
4. Each test run starts clean

### Running Tests

```bash
# All tests (backend + frontend + E2E)
./run-tests.bat         # Windows
./run-tests.sh          # Unix

# Backend only
./run-tests.bat --backend

# Frontend only
./run-tests.bat --frontend

# E2E only (builds frontend, copies to static)
./run-tests.bat --e2e

# Or using Gradle directly
cd backend
./gradlew test -Dspring.profiles.active=test
```

---

## User Instructions Log

### Session 2026-02-04 (Continued)

1. **Fix batches column error** - Added missing quality approval columns via patch 010
2. **Compare demo vs PostgreSQL schemas** - Identified all differences
3. **Remove H2/HSQLDB** - Switched to PostgreSQL for all testing
4. **Create mes_test database** - Dedicated test database with schema reset
5. **Align all tests** - Same patching mechanism for production and test
6. **Update documentation** - All context files updated

### Key Decisions Made

- **PostgreSQL only** - Removed H2 demo mode dependency
- **Same patch mechanism** - Production and test use identical patches
- **Schema reset for tests** - Public schema dropped/recreated before each test run
- **Integrated testing** - Frontend copied to static folder for E2E tests

---

## Files Modified This Session (Continued)

### Database Patches
- `backend/src/main/resources/patches/010_batch_quality_fields.sql` - NEW
- `backend/src/main/resources/patches/011_operations_inventory_fields.sql` - NEW

### Demo Schema
- `backend/src/main/resources/demo/schema.sql` - Updated with config tables and inventory columns

### Configuration
- `backend/src/main/resources/application-test.yml` - NEW: PostgreSQL test profile
- `backend/src/main/java/com/mes/production/config/TestSchemaReset.java` - NEW: Schema reset for tests

### Entity
- `backend/src/main/java/com/mes/production/entity/Inventory.java` - Added form tracking fields

### Build
- `backend/build.gradle` - Added test tasks, frontend integration tasks

### Scripts
- `run-tests.bat` - NEW: Windows test runner
- `run-tests.sh` - NEW: Unix test runner

### Documentation
- `.claude/TASKS.md` - Updated (this file)
- `.claude/CLAUDE.md` - Updated with testing infrastructure

---

## Available Scripts Summary (Updated)

| Script | Purpose | Command |
|--------|---------|---------|
| Backend (production) | Start with PostgreSQL | `cd backend && ./gradlew bootRun` |
| Backend (test profile) | Start with mes_test DB | `cd backend && ./gradlew bootRun -Dspring.profiles.active=test` |
| Backend tests | Run Java tests | `cd backend && ./gradlew test -Dspring.profiles.active=test` |
| Frontend | Start Angular dev server | `cd frontend && npm start` |
| Frontend build | Build for production | `cd frontend && npm run build` |
| Frontend tests | Run Angular tests | `cd frontend && npm test` |
| Copy frontend | Copy build to static | `cd backend && ./gradlew copyFrontendToStatic` |
| E2E tests | Run Playwright tests | `node e2e/run-all-tests.js` |
| Full test suite | All tests | `./run-tests.bat` or `./run-tests.sh` |

---

## Gaps Remaining (from MES-Requirements-Gaps-Analysis.md)

| Gap | Priority | Status |
|-----|----------|--------|
| GAP-001: Multi-Order Batch Confirmation | Medium | DONE | BatchOrderAllocation entity + UI in batch-detail |
| GAP-002: Equipment Type Logic | Low | PENDING |
| GAP-006: Quantity Type Configuration | Low | DONE | Phase 6B/6C: QuantityTypeConfig CRUD + frontend pages |
| GAP-008: Inventory Form Tracking | Low | PENDING |
| GAP-009: Quality Workflow | Medium | PENDING |

All HIGH priority gaps are complete (GAP-003, GAP-004, GAP-005, GAP-007, GAP-010).
GAP-001 and GAP-006 also completed.

---

## Next Steps

### Architecture Refactoring Complete (2026-02-07)

**MES Consolidated Specification Alignment:**

Per MES Consolidated Spec, the data model was refactored:
- **Process** = Design-time entity only (ProcessID, ProcessName, Status)
- **Operation** = Links to Process (design-time) AND OrderLineItem (runtime)
- Removed all `process_instances` references
- Removed `ProcessTemplate` service and files

**Fixes Applied:**
1. Created SQL patch `031_process_usage_decision.sql` - Adds missing `usage_decision` column
2. Fixed `BatchService` validations:
   - Split now allows AVAILABLE, RESERVED, BLOCKED, PRODUCED, QUALITY_PENDING statuses
   - Split validates non-empty portions with positive quantities
   - Merge validates no duplicate batch IDs and matching units
   - AdjustQuantity requires non-empty reason
3. Fixed `BatchNumberService` merge fallback format - uses milliseconds for uniqueness
4. Updated comprehensive tests to match new behaviors

**Test Results:** ✅ 1073/1073 tests passing

**Application Status:** ✅ Starts successfully in demo mode, authentication working

---

**Phase 6 Complete:** All backend CRUD (6A/6B) and frontend config pages (6C) are done.
- 6A: HoldReasons, DelayReasons, ProcessParametersConfig, BatchNumberConfig — DONE
- 6B: QuantityTypeConfig — DONE
- 6C: 10 frontend components (5 list + 5 form) + routing + sidebar + 10 spec files — DONE
- Frontend tests: 645 total, 0 failures

### Phase 7: Missing Frontend Pages for Existing APIs

| # | Task | Status | Notes |
|---|------|--------|-------|
| 37 | Operators CRUD frontend (list + form) | ✅ DONE | /manage/operators with paginated list + create/edit form |
| 38 | Processes admin list page | ✅ DONE | /processes/list with client-side filtering, summary cards |
| 39 | Operations admin list page | ✅ DONE | /operations with client-side filtering, block/unblock modal |

**Files Created:**
- `frontend/src/app/features/operators/` - Full CRUD module (list + form + specs)
- `frontend/src/app/features/processes/process-list/` - Process list component + spec
- `frontend/src/app/features/operations/` - Operations module (list + spec)

**Frontend Tests:** 720 total, 0 failures

---

### UI/UX Improvements (2026-02-05)

| # | Task | Status | Notes |
|---|------|--------|-------|
| 40 | Status constants alignment | ✅ DONE | Already present in all entities |
| 41 | Audit Trail viewer page | ✅ DONE | /manage/audit with filtering |
| 42 | Production History page | ✅ DONE | /production/history with detail panels |
| 43-46 | Apache ECharts integration | ✅ DONE | Dashboard charts, Process Flow, Batch Genealogy (from prior session) |
| 47 | Fix scroll layout | ✅ DONE | Flexbox layout: header fixed, content scrolls below |
| 48 | Standardize button colors | ✅ DONE | Replaced Bootstrap (#007bff) → Material (#1976d2) in all 8 form CSS files |
| 49 | Standardize secondary button colors | ✅ DONE | Replaced #6c757d → #757575 in 8 form + 1 list CSS files |
| 50 | Standardize error colors | ✅ DONE | Replaced #dc3545 → #d32f2f in all 8 form CSS files |
| 51 | Logical menu grouping - header | ✅ DONE | Nav separators between logical groups |
| 52 | Logical menu grouping - sidebar | ✅ DONE | Master Data / Production / System groups |

**Frontend Tests:** 748 total, 0 failures

**Scroll Fix Details:**
- `styles.css`: `html, body { overflow: hidden }` + `app-root { display: block; height: 100%; }`
- `main-layout.component.css`: `:host { display: flex; flex-direction: column; height: 100vh; }` + `.main-content { flex: 1; overflow-y: auto; }`
- `admin-layout.component.css`: `:host { display: flex; flex-direction: column; height: 100vh; }` + `.admin-container { flex: 1; overflow: hidden; }`
- `header.component.css`: Removed `position: sticky; top: 0;`, added `flex-shrink: 0;`

---

**Remaining:**
1. ~~**E2E tests for config management** (Task #151) - E2E CRUD flows for config pages~~ ✅ DONE (Task #51)
2. **Run full test suite** - Backend + Frontend + E2E
3. **Record updated demo video** - After all features complete

---

## Phase 8: Batch Management Compliance (NEW - 2026-02-06)

**Reference:** `documents/MES-Batch-Management-Gap-Analysis.md`
**Goal:** Implement strict batch lifecycle rules per MES Batch Management Specification

### Core Principles to Enforce
- Batch identity is immutable (BatchID never changed/reused)
- Batches created ONLY at operation boundaries
- Batch quantity NEVER edited directly (only via consumption/production)
- All transformations explicit (split/merge as relationships)
- Genealogy permanent and immutable
- Every batch change auditable

### Phase 8A: Critical Fixes (Block Manual Editing) - ✅ COMPLETE (ALL 5 TASKS DONE)

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| B01 | Remove/restrict `createBatch()` endpoint | ✅ DONE | CRITICAL | Now throws error with guidance to use production/receive |
| B02 | Remove quantity from `UpdateBatchRequest` | ✅ DONE | CRITICAL | Already removed - quantity field not in DTO |
| B03 | Add `adjustQuantity()` with mandatory reason | ✅ DONE | CRITICAL | Exists: requires reason (10-500 chars) + adjustmentType |
| B04 | Update frontend - remove manual batch creation | ✅ DONE | CRITICAL | "New Batch" button removed from list, form disabled |
| B05 | Add integration tests for batch immutability | ✅ DONE | CRITICAL | 7 new B05-* tests in BatchControllerTest |

**Implementation Details (2026-02-07):**
- `BatchController.createBatch()` now throws RuntimeException with clear guidance
- `UpdateBatchRequest` has no quantity field - use `adjustQuantity()` endpoint
- `adjustQuantity()` requires: newQuantity, reason (10-500 chars), adjustmentType
- `BatchQuantityAdjustment` table tracks all quantity changes with audit trail
- Frontend batch-list "New Batch" button removed
- Batch form quantity field disabled in edit mode with help text
- **B05 Tests:** 7 integration tests verifying immutability rules (all pass)

### Phase 8B: Default Status & Workflow - ✅ COMPLETE

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| B06 | Change default batch status to QUALITY_PENDING | ✅ DONE | HIGH | Already implemented in Batch.java @PrePersist |
| B07 | Update ProductionService batch creation | ✅ DONE | HIGH | Already sets STATUS_QUALITY_PENDING (line 341) |
| B08 | Add pending approval queue to dashboard | ✅ DONE | HIGH | Added getBatchesByStatus('QUALITY_PENDING') call |
| B09 | Update batch list for approval workflow | ✅ DONE | HIGH | Already has canApprove/approveBatch/rejectBatch |

**Implementation Details (2026-02-07):**
- `Batch.java` @PrePersist sets default status to QUALITY_PENDING
- `ProductionService.createOutputBatch()` explicitly sets STATUS_QUALITY_PENDING
- `ReceiveMaterialService` also creates batches with QUALITY_PENDING
- Dashboard now loads batches pending approval via `getBatchesByStatus('QUALITY_PENDING')`
- Dashboard alert card shows count and links to `/batches?status=QUALITY_PENDING`
- Batch list has Approve/Reject buttons for QUALITY_PENDING batches

### Phase 8C: Batch Size Configuration

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| B10 | Create `batch_size_config` table (patch) | DONE | MEDIUM | SQL patch 026_batch_size_config.sql |
| B11 | Create `BatchSizeConfig` entity | DONE | MEDIUM | BatchSizeConfig.java |
| B12 | Create `BatchSizeService` | DONE | MEDIUM | BatchSizeService.java with calculateBatchSizes() |
| B13 | Update ProductionService multi-batch | DONE | MEDIUM | Integrated BatchSizeService, creates multiple batches when qty > max |
| B14 | Add BatchSizeConfig CRUD endpoints | DONE | MEDIUM | BatchSizeConfigController.java |
| B15 | Add frontend config page | DONE | MEDIUM | /manage/config/batch-size - list & form components |

### Phase 8D: Validation & Constraints

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| B16 | Add quantity invariant validation (split) | ✅ DONE | MEDIUM | validateSplitInvariant() in BatchService |
| B17 | Add quantity invariant validation (merge) | ✅ DONE | MEDIUM | validateMergeInvariant() in BatchService |
| B18 | Add genealogy delete prevention | ✅ DONE | MEDIUM | canDeleteBatchRelation() + softDeleteBatchRelation() |
| B19 | Add ON_HOLD validation to consumption | ✅ DONE | LOW | validateBatchForConsumption() + canConsumeBatch() |
| B20 | Make operationId NOT NULL for relations | PENDING | LOW | Schema constraint

### Phase 8E: Testing & Documentation

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| B21 | Backend unit tests for batch rules | DONE | HIGH | 65+ tests in BatchServiceTest, BatchServiceComprehensiveTest, BatchControllerTest |
| B22 | E2E tests for batch workflow | DONE | HIGH | Added 6 tests: approval filter, buttons, modal, rejection, adjustment, history |
| B23 | Update user documentation | ✅ DONE | MEDIUM | Updated USER-GUIDE.md with batch workflow docs |

### Database Schema Changes (Patch 024)

```sql
-- batch_size_config table
-- batch_quantity_adjustments table
-- batch_relations soft delete columns
```

See `documents/MES-Batch-Management-Gap-Analysis.md` for full SQL.

---

## Phase 9: Routing, Process & Operation Management (MOSTLY COMPLETE - 2026-02-06)

**Reference:** `documents/MES-Routing-Process-Operation-Gap-Analysis.md`
**Goal:** Implement design-time/runtime separation and batch behavior declaration

### Architecture (Per MES Consolidated Specification)
- **Routing** links to **Process** via `processId` (not processTemplateId in API)
- **ProcessTemplate** kept internally for design-time management (not exposed in DTOs)
- **RoutingStep** has batch behavior flags (producesOutputBatch, allowsSplit, allowsMerge)
- **DRAFT** status added for design-time workflow
- Single-active-routing enforcement implemented

### Core Issues - RESOLVED ✅
- ✅ Process is runtime (tied to OrderLineItem) - ProcessTemplate for design-time
- ✅ RoutingStep defines operation metadata (operationName, operationType, etc.)
- ✅ Batch behavior flags added (ProducesOutputBatch, AllowsSplit, AllowsMerge)
- ✅ DRAFT status for design-time workflow
- ✅ Single-active-routing enforcement via deactivateOtherRoutings()

### Phase 9A: Schema Changes (Critical) - COMPLETE

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| R01 | Create `process_templates` table | ✅ DONE | CRITICAL | Patch 025 |
| R02 | Add batch behavior columns to routing_steps | ✅ DONE | CRITICAL | Patch 025 |
| R03 | Add operation_name, operation_type to routing_steps | ✅ DONE | CRITICAL | Patch 025 |
| R04 | Add routing_step_id FK to operations | ✅ DONE | CRITICAL | Already existed |
| R05 | Add DRAFT status to routing | ✅ DONE | HIGH | Patch 025 |

### Phase 9B: Entity & Repository Changes - COMPLETE

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| R06 | Create ProcessTemplate entity | ✅ DONE | CRITICAL | ProcessTemplate.java |
| R07 | Update RoutingStep entity | ✅ DONE | CRITICAL | Has batch behavior fields |
| R08 | Update Operation entity | ✅ DONE | HIGH | Has routingStepId |
| R09 | Create ProcessTemplateRepository | ✅ DONE | HIGH | ProcessTemplateRepository.java |
| R10 | Add batch behavior constants | ✅ DONE | HIGH | In RoutingStep entity |

### Phase 9C: Service Logic - COMPLETE

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| R11 | Create ProcessTemplateService | ✅ DONE | HIGH | Full CRUD + activation + versioning |
| R12 | Create OperationInstantiationService | ✅ DONE | HIGH | Create ops from routing at runtime |
| R13 | Add single-active-routing enforcement | ✅ DONE | MEDIUM | deactivateOtherTemplates() |
| R14 | Add routing-lock-after-execution | ✅ DONE | MEDIUM | isRoutingLocked() checks step status |
| R15 | Add batch behavior validation | ✅ DONE | HIGH | validateBatchBehaviorForSplit/Merge() in BatchService |

**Files Created:**
- `ProcessTemplateDTO.java` - Request/response DTOs for templates
- `ProcessTemplateService.java` - Full CRUD with activation workflow
- `ProcessTemplateController.java` - REST endpoints for template management
- `OperationInstantiationService.java` - Creates operations from routing at runtime

**Files Modified:**
- `RoutingDTO.java` - Added CRUD DTOs (Create, Update, Status, Hold)
- `RoutingService.java` - Added CRUD methods + lock/hold/status
- `RoutingController.java` - Added CRUD endpoints

**API Endpoints Added:**
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/process-templates` | POST | Create template |
| `/api/process-templates/{id}` | GET | Get template |
| `/api/process-templates/{id}` | PUT | Update template |
| `/api/process-templates/{id}` | DELETE | Delete template |
| `/api/process-templates/{id}/activate` | POST | Activate template |
| `/api/process-templates/{id}/deactivate` | POST | Deactivate template |
| `/api/process-templates/{id}/new-version` | POST | Create new version |
| `/api/process-templates/paged` | GET | Paginated list |
| `/api/process-templates/product/{sku}` | GET | Templates for product |
| `/api/process-templates/product/{sku}/effective` | GET | Effective template |
| `/api/process-templates/{id}/steps` | POST | Add routing step |
| `/api/process-templates/steps/{id}` | PUT | Update routing step |
| `/api/process-templates/steps/{id}` | DELETE | Delete routing step |
| `/api/routing` | GET | List routings |
| `/api/routing` | POST | Create routing |
| `/api/routing/{id}` | PUT | Update routing |
| `/api/routing/{id}` | DELETE | Delete routing |
| `/api/routing/{id}/activate` | POST | Activate routing |
| `/api/routing/{id}/deactivate` | POST | Deactivate routing |
| `/api/routing/{id}/hold` | POST | Put on hold |
| `/api/routing/{id}/release` | POST | Release from hold |
| `/api/routing/{id}/status` | GET | Get status summary |
| `/api/routing/{id}/locked` | GET | Check if locked |

**Tests:**
- `ProcessTemplateServiceTest.java` - 16 tests covering CRUD, activation, versioning
- `RoutingServiceTest.java` - Updated with 33+ tests including new CRUD methods

### Phase 9D: Controllers & APIs - COMPLETE

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| R16 | Create ProcessTemplateController | ✅ DONE | HIGH | ProcessTemplateController.java |
| R17 | Add Routing CRUD endpoints | ✅ DONE | HIGH | RoutingController.java |
| R18 | Add RoutingStep CRUD endpoints | ✅ DONE | HIGH | Via ProcessTemplateController |
| R19 | Add routing activate/reorder | ✅ DONE | MEDIUM | activate/deactivate/hold/release |

### Phase 9E: Frontend

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| R20 | ProcessTemplate list page | ❌ N/A | - | **REDUNDANT**: ProcessTemplate is internal; Routing UI handles design-time config |
| R21 | ProcessTemplate form | ❌ N/A | - | **REDUNDANT**: ProcessTemplate is internal; Routing UI handles design-time config |
| R22 | Routing designer page | ✅ DONE | LOW | routing-list.component + routing-form.component |
| R23 | Routing step editor | ✅ DONE | MEDIUM | Step modal with batch flags, reordering |

### Phase 9F: Testing

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| R24 | Unit tests for new services | DONE | HIGH | RoutingServiceTest: 50+ tests (19 base + 7 nested classes) |
| R25 | Integration tests for instantiation | DONE | HIGH | RoutingControllerTest: 14 tests, all passing |
| R26 | E2E tests for routing workflow | ✅ DONE | MEDIUM | 22-routing.test.js - 14 tests |
| R27 | Batch behavior validation tests | DONE | HIGH | Tested in RoutingServiceTest (canOperationProceed, sequencing) |
| R28 | Routing frontend spec tests | DONE | MEDIUM | routing-list.spec.ts (45 tests), routing-form.spec.ts (53 tests) - All 98 passing |

---

## Phase 10: Production Confirmation UI (NEW - 2026-02-06)

**Reference:** `documents/MES-Production-Confirmation-UI-Gap-Analysis.md`
**Goal:** Complete Production Confirmation UI per specification

### Core Issues to Fix
- Missing Order selection dropdown (navigates directly to operation)
- No yield calculation display
- No output batch number preview
- No duration calculation display
- No partial confirmation support

### Phase 10A: Order Selection Flow (Critical) - COMPLETE

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| P01 | Create production landing page with order dropdown | ✅ DONE | CRITICAL | production-landing.component.ts |
| P02 | Add cascading operation dropdown | ✅ DONE | CRITICAL | extractReadyOperations() |
| P03 | Add API: GET /api/orders/available | ✅ DONE | HIGH | Endpoint + api.service.ts |
| P04 | Show order context (customer, product, due date) | ✅ DONE | HIGH | orderContext getter + HTML |

### Phase 10B: Display Enhancements - COMPLETE

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| P05 | Add yield calculation display | ✅ DONE | MEDIUM | yieldPercentage getter + visual bar |
| P06 | Add color indicator for yield | ✅ DONE | MEDIUM | Green(≥95%)/Yellow(80-95%)/Red(<80%) |
| P07 | Add batch number preview API | ✅ DONE | MEDIUM | GET /api/batches/preview-number |
| P08 | Display previewed batch number | ✅ DONE | MEDIUM | In operation details card |
| P09 | Add duration calculation display | ✅ DONE | MEDIUM | durationMinutes + durationFormatted |

### Phase 10C: Workflow Enhancements

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| P10 | Add "Save as Partial" button | ✅ DONE | MEDIUM | saveAsPartial flag in Request DTO |
| P11 | Update backend for isPartial flag | ✅ DONE | MEDIUM | ProductionService respects saveAsPartial |
| P12 | Show partial confirmation indicator | ✅ DONE | MEDIUM | isPartial + remainingQty in Response DTO |
| P13 | Enable continuing partial confirmations | ✅ DONE | MEDIUM | /operations/continuable + /confirmations/partial endpoints |

### Phase 10D: Optional Enhancements

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| P14 | Create MaterialSelectionModalComponent | PENDING | LOW | Better UX for selection |
| P15 | Add "Apply Hold" quick action | PENDING | LOW | From confirmation form |
| P16 | Implement two-column responsive layout | PENDING | LOW | Desktop optimization |
| P17 | Add collapsible section headers | PENDING | LOW | Mobile optimization |

### Phase 10E: Testing

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| P18 | E2E tests for order selection flow | ✅ DONE | HIGH | 23-order-selection.test.js - 8 tests |
| P19 | E2E tests for yield/duration | ✅ DONE | MEDIUM | Included in P18 test file |
| P20 | E2E tests for partial confirmation | PENDING | MEDIUM | Partial flow |

---

## Phase 11: Batch Number Creation Specification Compliance (IN PROGRESS - 2026-02-06)

**Reference Documents:**
- `documents/MES-Batch-Number-Creation-Specification.md` - The specification
- `documents/MES-Batch-Number-Implementation-Gap-Analysis.md` - Detailed gap analysis

**Goal:** Ensure batch number generation fully complies with specification
**Current Compliance:** ~85% | **Target:** 100%
**Estimated Effort:** 22.75h (3-4 days)

### Sprint 1 Status: COMPLETE ✅

### Current Compliance Status

| Category | Requirements | Implemented | Compliance |
|----------|-------------|-------------|------------|
| Core Principles | 5 | 5 | 100% |
| Number Structure | 4 | 4 | 100% |
| Configuration Scope | 3 | 2 | 67% |
| Generation Scenarios | 4 | 3 | 75% |
| Sequence Management | 4 | 4 | 100% |
| Error Handling | 3 | 2 | 67% |
| Audit Requirements | 6 | 2 | 33% |

### Phase 11A: Schema & Entity Updates (Priority: HIGH) - 2.25h ✅ COMPLETE

| Task ID | Task | Status | Files | Effort |
|---------|------|--------|-------|--------|
| BN-A01 | Add generated_at_operation_id column | ✅ DONE | Already existed in schema | 0h |
| BN-A02 | Update Batch entity | ✅ DONE | `Batch.java` - field already existed | 0h |
| BN-A03 | Update BatchDTO | ✅ DONE | `BatchDTO.java` - added generatedAtOperationId, createdVia, supplierBatchNumber, supplierId | 0.25h |
| BN-A04 | Update ProductionService | ✅ DONE | Sets generatedAtOperationId on batch creation + audit call | 0.5h |
| BN-A05 | Update BatchService | ✅ DONE | Inherits generatedAtOperationId for split/merge + audit calls | 0.5h |

### Phase 11B: Audit Trail Integration (Priority: HIGH) - 2.75h ✅ COMPLETE

| Task ID | Task | Status | Files | Effort |
|---------|------|--------|-------|--------|
| BN-B01 | Create BatchNumberAuditDTO | N/A | Using inline details in audit log | - |
| BN-B02 | Add audit method to AuditService | ✅ DONE | `AuditService.java` - logBatchNumberGenerated() method | 0.5h |
| BN-B03 | Inject AuditService in services | ✅ DONE | ProductionService, BatchService, ReceiveMaterialService all call audit | 0.25h |
| BN-B04 | Add BATCH_NUMBER_GENERATED action type | ✅ DONE | `AuditTrail.java` - ACTION_BATCH_NUMBER_GENERATED constant | 0.25h |
| BN-B05 | Log config used | ✅ DONE | Audit logs: batchNumber, operationId, config name, generation method | 0.5h |
| BN-B06 | Log sequence gaps | DEFERRED | Lower priority - can be added later | - |

### Phase 11C: Raw Material Receipt Enhancement (Priority: MEDIUM) - 3.75h ✅ COMPLETE

| Task ID | Task | Status | Files | Effort |
|---------|------|--------|-------|--------|
| BN-C01 | Add supplier_lot_number to ReceiveMaterialRequest | ✅ DONE | Already existed in `InventoryDTO.java` | 0h |
| BN-C02 | Add supplier_lot_number to Batch entity | ✅ DONE | Already existed in `Batch.java` | 0h |
| BN-C03 | Add generateRmBatchNumber() method | ✅ DONE | `BatchNumberService.java` - new method with config support | 1h |
| BN-C04 | Add RM config option | ✅ DONE | Supports RM_RECEIPT operation type in config | 0.5h |
| BN-C05 | Update ReceiveMaterialService | ✅ DONE | Now calls `batchNumberService.generateRmBatchNumber()` | 0.5h |
| BN-C06 | Update frontend receive material form | ✅ DONE | Already had supplier fields (supplierBatchNumber, supplierId) | 0h |

**Key Changes:**
- Added `generateRmBatchNumber(materialId, receivedDate, supplierBatchNumber)` to BatchNumberService
- Supports configurable RM batch numbers via RM_RECEIPT operation type
- Includes optional supplier lot in batch number (sanitized, max 15 chars)
- Falls back to standard format: `RM-{MATERIALCODE}-{YYYYMMDD}-{SEQ}`
- Added 6 new unit tests for RM batch number generation

### Phase 11D: Multi-Batch Production Verification (Priority: MEDIUM) - 1.5h ⚠️ DEFERRED

| Task ID | Task | Status | Files | Effort |
|---------|------|--------|-------|--------|
| BN-D01 | Review batch size config usage | ✅ VERIFIED | `BatchSizeService.java` exists but NOT integrated into ProductionService | 0.5h |
| BN-D02 | Verify multi-batch creation | DEFERRED | Requires ProductionService integration first | 0.5h |
| BN-D03 | Sequential batch numbers | DEFERRED | Requires ProductionService integration first | 0.5h |

**Finding:** `BatchSizeService` exists with complete logic for:
- Calculating batch sizes based on min/max/preferred configuration
- Finding applicable config by operation/material/product/equipment type
- Splitting total quantity into multiple batches with partial batch support

**Gap:** Service is not currently used by ProductionService. Requires integration work (Task #98).

### Phase 11E: Configuration Clarification (Priority: LOW) - 2h

| Task ID | Task | Status | Files | Effort |
|---------|------|--------|-------|--------|
| BN-E01 | Clarify product_sku vs material_id | PENDING | Document decision | 0.5h |
| BN-E02 | Add material_id column (if needed) | PENDING | SQL patch + service update | 1h |
| BN-E03 | Update config precedence logic | PENDING | Adjust findMatchingConfig() | 0.5h |

### Phase 11F: Testing (Priority: HIGH) - 9h ✅ COMPREHENSIVE TESTS COMPLETE

| Task ID | Task | Status | Files | Effort |
|---------|------|--------|-------|--------|
| BN-F01 | Unit tests: generation methods | ✅ DONE | `BatchNumberServiceTest.java` - 22 tests | 2h |
| BN-F02 | Unit tests: config precedence | ✅ DONE | Tests with/without config, fallback patterns | 1h |
| BN-F03 | Unit tests: sequence reset | ✅ DONE | DAILY/MONTHLY/YEARLY/NEVER all tested | 1h |
| BN-F04 | Comprehensive BatchNumber tests | ✅ DONE | `BatchNumberServiceComprehensiveTest.java` - 41 tests | 2h |
| BN-F05 | Comprehensive BatchService tests | ✅ DONE | `BatchServiceComprehensiveTest.java` - 30+ tests | 2h |
| BN-F06 | Comprehensive Allocation tests | ✅ DONE | `BatchAllocationServiceComprehensiveTest.java` - 30+ tests | 2h |

### Comprehensive Test Files Created (2026-02-06)

**1. BatchNumberServiceComprehensiveTest.java (~41 tests)**
Per MES Batch Number Creation Specification, covers:
- Production Batch Numbers (6 tests) - full config, fallback, sequence increment
- RM Batch Numbers (8 tests) - fallback format, supplier lot, sanitization, truncation
- Split Batch Numbers (5 tests) - various indices, complex sources
- Merge Batch Numbers (2 tests) - fallback format, uniqueness
- Configuration Precedence (3 tests) - operation > material > product > default
- Sequence Reset Policies (4 tests) - DAILY, MONTHLY, YEARLY, NEVER
- Edge Cases (6 tests) - null/empty inputs, special chars, precision
- Error Handling (2 tests) - database failure, null date
- Preview Functionality (3 tests) - no increment, placeholder format
- Configuration Retrieval (2 tests) - list active configs

**2. BatchServiceComprehensiveTest.java (~30+ tests)**
Per MES Batch Management Specification, covers:
- Split Edge Cases (7 tests) - exact quantity, precision, zero/negative, max portions
- Merge Edge Cases (5 tests) - different units, large quantities, duplicates
- Quantity Adjustment (6 tests) - zero, precision, increase, empty reason
- Status Transitions (3 tests) - splittable vs terminal statuses
- Genealogy Edge Cases (3 tests) - orphan batch, multiple parents/children
- Data Integrity (3 tests) - material ID preserved, unit preserved, relations

**3. BatchAllocationServiceComprehensiveTest.java (~30+ tests)**
Per MES Batch Allocation Specification, covers:
- Allocation Quantity Edge Cases (6 tests) - exact, precision, zero, negative, large
- Multiple Allocations (3 tests) - same batch different orders, duplicates
- Partial Allocations (2 tests) - remaining calculation
- Release and Re-allocate (3 tests) - restore quantity, prevent double release
- Update Allocation Quantity (5 tests) - increase, decrease, released status
- Available Quantity Calculations (5 tests) - full, zero, status checks
- Error Handling (4 tests) - clear error messages with context
- Query Operations (5 tests) - empty lists, multiple results, filtering

**Total: ~100+ new tests for batch operations**

### Phase 11G: Documentation (Priority: LOW) - 1.5h

| Task ID | Task | Status | Files | Effort |
|---------|------|--------|-------|--------|
| BN-G01 | Update CLAUDE.md | PENDING | Add batch number section | 0.5h |
| BN-G02 | API documentation | PENDING | Document preview-number endpoint | 0.5h |
| BN-G03 | Config documentation | PENDING | Document batch_number_config options | 0.5h |

### Sprint Plan

**Sprint 1: Core Compliance (10h) ✅ COMPLETE (2026-02-06)**
- ✅ Phase 11A: Schema & Entity Updates - Already existed, minimal work
- ✅ Phase 11B: Audit Trail Integration - logBatchNumberGenerated() method added
- ✅ Phase 11F: Unit Tests BN-F01 to BN-F03 - 16 comprehensive tests pass

**Sprint 2: Extended Features (10.25h)** ✅ IN PROGRESS
- ✅ Phase 11C: RM Receipt Enhancement - generateRmBatchNumber() added with 6 tests
- ⚠️ Phase 11D: Multi-Batch Verification - DEFERRED (BatchSizeService exists but not integrated)
- 🔄 Phase 11F: Integration + E2E Tests BN-F04 to BN-F07 (5h) - pending

**Sprint 3: Polish (3.5h)**
- Phase 11E: Configuration Clarification (2h)
- Phase 11G: Documentation (1.5h)

### Acceptance Criteria

**Sprint 1 (Core): ✅ ALL COMPLETE**
- [x] All new batches have `generatedAtOperationId` populated (via ProductionService, BatchService)
- [x] Batch number generation logged to AuditTrail (logBatchNumberGenerated method)
- [x] Audit record includes: batchNumber, timestamp, operationId, userId, configName (details field)
- [x] Unit tests pass for all generation scenarios (16 tests in BatchNumberServiceTest)

**Sprint 2 (Extended): ✅ MOSTLY COMPLETE**
- [x] RM receipt captures supplier lot number (already implemented)
- [x] Supplier lot included in batch number when configured (sanitized, max 15 chars)
- [x] `generateRmBatchNumber()` method with RM_RECEIPT config support
- [x] 6 new unit tests for RM batch number generation (22 total in BatchNumberServiceTest)
- [ ] Multi-batch creation respects batch size config (DEFERRED - BatchSizeService not integrated)
- [ ] Concurrent generation produces no duplicates (needs integration test)

**Sprint 3 (Documentation):**
- [ ] CLAUDE.md updated with batch number section
- [ ] API and config documentation complete

---

## Phase 12: Process CRUD UI (NEW - 2026-02-07)

**Issue:** Backend CRUD APIs exist but frontend UI is incomplete - no create/edit functionality visible.

**Current State:**
- Backend: Full CRUD endpoints exist (`POST`, `GET`, `PUT`, `DELETE /api/processes`)
- Frontend: ProcessListComponent exists but NO "New Process" button
- Frontend: ProcessDetailComponent exists but NO Edit/Delete buttons
- Frontend: **ProcessFormComponent does NOT exist**
- Frontend: No routes for `/new` or `/:id/edit`

### Phase 12A: Backend Enhancement

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| PR01 | Add `/api/processes/paged` endpoint | PENDING | MEDIUM | Paginated list with filters |
| PR02 | Add pagination to ProcessRepository | PENDING | MEDIUM | findByFilters() query |
| PR03 | Add pagination to ProcessService | PENDING | MEDIUM | getProcessesPaged() method |

### Phase 12B: Frontend - Create ProcessFormComponent

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| PR04 | Create ProcessFormComponent | PENDING | HIGH | Create/Edit form similar to CustomerForm |
| PR05 | Add form fields | PENDING | HIGH | processName, status, description |
| PR06 | Add validation | PENDING | HIGH | Required fields, name uniqueness |
| PR07 | Add save/cancel buttons | PENDING | HIGH | Create/Update API calls |

### Phase 12C: Frontend - Update List & Detail Components

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| PR08 | Add "New Process" button to list | PENDING | HIGH | Navigate to /manage/processes/new |
| PR09 | Add Edit button to list actions | PENDING | HIGH | Navigate to /manage/processes/:id/edit |
| PR10 | Add Delete button to list actions | PENDING | HIGH | Confirm modal + soft delete |
| PR11 | Add Edit button to detail page | PENDING | MEDIUM | Navigate to edit form |
| PR12 | Add Delete button to detail page | PENDING | MEDIUM | Confirm modal + soft delete |
| PR13 | Add pagination controls to list | PENDING | MEDIUM | Use PaginationComponent |

### Phase 12D: Frontend - Routing

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| PR14 | Add route for /manage/processes/new | PENDING | HIGH | ProcessFormComponent (create mode) |
| PR15 | Add route for /manage/processes/:id/edit | PENDING | HIGH | ProcessFormComponent (edit mode) |
| PR16 | Update processes-routing.module.ts | PENDING | HIGH | Add new routes |

### Phase 12E: Testing

| # | Task | Status | Priority | Notes |
|---|------|--------|----------|-------|
| PR17 | Add ProcessFormComponent spec tests | PENDING | MEDIUM | Create/Edit tests |
| PR18 | Update ProcessListComponent spec tests | PENDING | MEDIUM | New button, actions tests |
| PR19 | Add E2E tests for Process CRUD | PENDING | MEDIUM | Full workflow |

**Estimated Effort:** ~8-10 hours

---

## Implementation Priority Summary

### By Phase and Effort (Updated 2026-02-06)

| Phase | Focus | Tasks | Status | Priority |
|-------|-------|-------|--------|----------|
| 9A-B | Routing Schema + Entities | 10 | ✅ COMPLETE | CRITICAL |
| 9C-D | Routing Services & APIs | 9 | ✅ COMPLETE | HIGH |
| 10A | Order Selection Flow | 4 | ✅ COMPLETE | CRITICAL |
| 8A | Batch Critical Fixes | 5 | ✅ COMPLETE | CRITICAL |
| 8B-D | Batch Workflow & Config | 14 | ✅ COMPLETE | HIGH |
| 8E | Batch Testing | 3 | ✅ COMPLETE | HIGH |
| 9E-F | Routing Frontend & Testing | 8 | ✅ COMPLETE | MEDIUM |
| **12** | **Process CRUD UI** | **19** | **PENDING** | **HIGH** |
| 10B-C | UI Enhancements | 9 | PENDING | MEDIUM |
| 10D-E | UI Optional & Testing | 7 | PENDING | LOW |

**Completed: ~115h | Remaining: ~54h**

### Recommended Sprint Plan

**Sprint 1 (Weeks 1-2):** Foundations - ~30h
- Phase 8A (Batch Critical)
- Phase 9A-B (Routing Schema/Entities)
- Phase 10A (Order Selection)

**Sprint 2 (Weeks 3-4):** Services - ~37h
- Phase 8B-C (Batch Workflow + Config)
- Phase 9C (Routing Services)

**Sprint 3 (Weeks 5-6):** UI & APIs - ~43.5h
- Phase 8D (Batch Validation)
- Phase 9D-E (Routing APIs + Frontend)
- Phase 10B-C (UI Enhancements)

**Sprint 4 (Week 7):** Testing & Polish - ~34h
- Phase 8E (Batch Testing)
- Phase 9F (Routing Testing)
- Phase 10D-E (UI Optional + Testing)

---

## How to Resume Session

When starting a new Claude session:
1. Read this file (`.claude/TASKS.md`) for current status
2. Check "User Instructions Log" for recent requests
3. Review "Next Steps" for immediate actions
4. Update this file as you work
