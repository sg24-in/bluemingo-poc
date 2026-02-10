# MES System - Comprehensive Gap Analysis & E2E Test Coverage

**Date:** 2026-02-10
**Scope:** Full system audit - Backend services, Frontend components, E2E test coverage
**Purpose:** Document all gaps, missing tests, and inconsistencies before creating System Guide

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Backend Service Layer Gaps](#2-backend-service-layer-gaps)
3. [Frontend-Backend Mismatches](#3-frontend-backend-mismatches)
4. [Design-Time Entity Gaps](#4-design-time-entity-gaps)
5. [Production Workflow Gaps](#5-production-workflow-gaps)
6. [Configuration Entity Gaps](#6-configuration-entity-gaps)
7. [E2E Test Coverage Analysis](#7-e2e-test-coverage-analysis)
8. [Missing E2E Test Cases](#8-missing-e2e-test-cases)
9. [Pagination Inconsistencies](#9-pagination-inconsistencies)
10. [Recommendations](#10-recommendations)

---

## 1. Executive Summary

### System Health Overview

| Area | Status | Gaps Found |
|------|--------|-----------|
| Backend Services | Good | 10 gaps (3 HIGH, 4 MEDIUM, 3 LOW) |
| Frontend Components | Good | 6 gaps |
| Frontend-Backend Alignment | Moderate | 11 mismatches |
| Design-Time Entities | Good | 5 gaps |
| Production Workflow | Moderate | 9 gaps |
| Configuration Entities | Good | 3 gaps |
| E2E Test Coverage | Good | 7 routes uncovered (all Reports module) |
| Pagination Consistency | Needs Work | 12 pages with custom pagination |

### Route Coverage Summary
- **Total Frontend Routes:** 68 unique routes across 22 feature modules
- **Total E2E Test Files:** 45 test files, ~390+ test cases
- **Routes with E2E coverage:** 61/68 (90%)
- **Uncovered routes:** 7 (all in Reports module - paused feature)

### Priority Classification

- **CRITICAL**: Issues that could cause data corruption or incorrect production tracking
- **HIGH**: Missing functionality that affects core workflows
- **MEDIUM**: Inconsistencies that affect user experience
- **LOW**: Minor issues or missing polish

---

## 2. Backend Service Layer Gaps

### 2.1 ProductionService

**File:** `backend/src/main/java/com/mes/production/service/ProductionService.java`

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| SVC-01 | BOM not validated during confirmation | **HIGH** | `confirmProduction()` calls `bomValidationService.getSuggestedConsumption()` for display but does NOT enforce BOM requirements. A user can confirm production without consuming the correct materials. |
| SVC-02 | Scrap quantity not tracked separately | **MEDIUM** | Production confirmation records `outputQuantity` but has no `scrapQuantity` field. Scrap is only handled via the separate `scrapInventory()` call. |
| SVC-03 | No partial confirmation rollback | **MEDIUM** | If a multi-step confirmation fails partway (e.g., batch creation succeeds but inventory update fails), there's no transaction rollback mechanism beyond Spring's `@Transactional`. |

### 2.2 ReceiveMaterialService

**File:** `backend/src/main/java/com/mes/production/service/ReceiveMaterialService.java`

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| SVC-04 | Movement type is PRODUCE instead of RECEIVE | **LOW** | When creating inventory for received raw materials, the movement type logged is `PRODUCE` instead of `RECEIVE` or `GOODS_RECEIPT`. This affects audit trail clarity. |
| SVC-05 | No supplier tracking | **LOW** | Received materials don't record supplier information. The `Batch` entity has no `supplier` field. |

### 2.3 BatchService

**File:** `backend/src/main/java/com/mes/production/service/BatchService.java`

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| SVC-06 | Split/merge inventory not automatically updated | **MEDIUM** | When a batch is split, the original batch's inventory quantity is reduced, but the new sub-batches may not have corresponding inventory records created automatically. |
| SVC-07 | No batch expiry tracking | **LOW** | Batches have no `expiryDate` field for perishable materials. |

### 2.4 HoldService

**File:** `backend/src/main/java/com/mes/production/service/HoldService.java`

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| SVC-08 | Equipment holds not in HoldService | **MEDIUM** | Equipment hold/release uses `EquipmentController` directly with `EquipmentRepository`, bypassing `HoldService`. This means equipment holds don't create `HoldRecord` entries and lack the standard hold audit trail. |
| SVC-09 | Duplicate hold logic | **LOW** | `InventoryStateValidator` has its own hold-checking logic separate from `HoldService`. Could lead to inconsistencies if one is updated without the other. |

### 2.5 OperationInstantiationService

**File:** `backend/src/main/java/com/mes/production/service/OperationInstantiationService.java`

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| SVC-10 | No re-instantiation support | **LOW** | Once operations are instantiated from a routing, there's no way to re-instantiate if the routing changes (e.g., adding a new step). The routing becomes "locked" once any operation is IN_PROGRESS. |

---

## 3. Frontend-Backend Mismatches

### 3.1 Missing Frontend Pages for Existing Backend APIs

| # | Backend API | Frontend Page | Status | Severity |
|---|-------------|--------------|--------|----------|
| FB-01 | `GET /api/batches/{id}/genealogy` | Genealogy visualization | Partial - shows in batch detail but no dedicated page | **LOW** |
| FB-02 | `GET /api/report-analytics/*` | Reports module | Created but paused (routes exist, components stubbed) | **MEDIUM** |
| FB-03 | `POST /api/batches/{id}/split` | Batch split UI | No dedicated form - only API exists | **MEDIUM** |
| FB-04 | `POST /api/batches/merge` | Batch merge UI | No dedicated form - only API exists | **MEDIUM** |
| FB-05 | `GET /api/batch-size-config/calculate` | Batch size calculator | No UI for calculating/previewing batch sizes | **LOW** |

### 3.2 Frontend Features Without Backend Support

| # | Frontend Feature | Backend Status | Severity |
|---|-----------------|---------------|----------|
| FB-06 | Equipment usage history tab | No endpoint for equipment usage history | **LOW** |
| FB-07 | Inventory movement history tab | No endpoint for inventory movements over time | **LOW** |
| FB-08 | Dashboard production chart | `GET /api/dashboard/stats` returns counts but no time-series data for charts | **LOW** |

### 3.3 API Data Mismatches

| # | Issue | Details | Severity |
|---|-------|---------|----------|
| FB-09 | Order entity has no `deliveryDate` | Frontend order form has delivery date field but backend `Order` entity doesn't have it | **MEDIUM** |
| FB-10 | Order entity has no `notes` field | Frontend shows notes but backend doesn't persist them | **MEDIUM** |
| FB-11 | Inventory has no `batchNumber` field | Frontend references `inventory.batchNumber` but must use `inventory.batch.getBatchNumber()` | **LOW** (workaround exists) |

---

## 4. Design-Time Entity Gaps

### 4.1 Process Entity

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| DT-01 | Process not locked when routing locked | **MEDIUM** | When a routing is locked (operations IN_PROGRESS), the parent Process can still be edited or deactivated. Should cascade lock status. |
| DT-02 | No process versioning | **LOW** | Process definitions can't be versioned. Changes affect all existing orders. |

### 4.2 Operation Entity

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| DT-03 | Limited status transitions | **MEDIUM** | Operations can only go `NOT_STARTED -> READY -> IN_PROGRESS -> CONFIRMED`. No PAUSED state, no rollback from IN_PROGRESS to READY. |
| DT-04 | No operation duration tracking | **LOW** | Operations don't track planned vs actual duration (start/end timestamps exist in ProductionConfirmation but not in Operation itself). |

### 4.3 Routing Entity

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| DT-05 | Routing-Process link is optional | **LOW** | A routing can exist without being linked to a process. Orphan routings are possible. |

---

## 5. Production Workflow Gaps

### 5.1 Material Consumption Flow

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| PW-01 | No reservation mechanism | **HIGH** | Materials selected for production are consumed immediately during confirmation. There's no "reserve" step to prevent double-allocation when multiple operators select the same material. |
| PW-02 | No consumption reversal | **MEDIUM** | Once materials are consumed, there's no way to reverse the consumption (e.g., if production is cancelled after confirmation). |
| PW-03 | Material substitution not supported | **LOW** | BOM specifies exact materials. No mechanism for approved substitutes. |

### 5.2 Batch Lifecycle Flow

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| PW-04 | Quality approval not enforced | **MEDIUM** | Batches in QUALITY_PENDING status can theoretically be used in production if inventory state is AVAILABLE. The check is at inventory level, not batch level. |
| PW-05 | No batch status history | **LOW** | Batch status changes are logged in audit trail but there's no dedicated status history table for quick queries. |

### 5.3 Order Lifecycle Flow

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| PW-06 | No automatic order completion | **MEDIUM** | When all operations in all line items are CONFIRMED, the order status doesn't automatically change to COMPLETED. Manual status update required. |
| PW-07 | No order priority/scheduling | **LOW** | Orders have no priority field. All orders with READY operations appear equally in the production confirm page. |

### 5.4 Hold Impact Flow

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| PW-08 | Hold cascade incomplete | **MEDIUM** | Placing an order on hold doesn't automatically hold its operations. Each entity must be held separately. |
| PW-09 | No hold escalation | **LOW** | No mechanism to escalate holds that have been active beyond a threshold duration. |

---

## 6. Configuration Entity Gaps

### 6.1 Batch Number Config

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| CFG-01 | No preview endpoint in frontend | **LOW** | Backend has `POST /api/batch-number-config/preview` but frontend doesn't use it to show users what batch numbers will look like. |

### 6.2 Batch Size Config

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| CFG-02 | Frontend has no pagination | **MEDIUM** | Batch Size Config list page has no server-side pagination (only client-side display). All other config pages have pagination. |
| CFG-03 | No integration with production confirm | **MEDIUM** | Batch size configs exist but aren't consulted during production confirmation to auto-split output into multiple batches. |

---

## 7. E2E Test Coverage Analysis

### 7.1 Test File Inventory

| File | Tests | Coverage Area |
|------|-------|---------------|
| `01-auth.test.js` | 8+ | Login, logout, token management |
| `02-dashboard.test.js` | 5+ | Dashboard metrics, cards |
| `03-orders.test.js` | 6+ | Order list, filters, search |
| `04-production.test.js` | 8+ | Production confirm form, submission |
| `05-inventory.test.js` | 8+ | Inventory list, filters, block/unblock |
| `06-batches.test.js` | 10+ | Batch list, filters, genealogy, split/merge |
| `07-holds.test.js` | 6+ | Hold list, apply, release |
| `08-equipment.test.js` | 8+ | Equipment list, maintenance, holds |
| `09-quality.test.js` | 5+ | Quality pending queue |
| `10-pagination.test.js` | 8+ | Pagination controls on 5 main pages |
| `11-crud.test.js` | 12+ | Customer/Material/Product CRUD |
| `12-entity-crud.test.js` | 10+ | Entity CRUD operations |
| `13-bom-crud.test.js` | 10+ | BOM tree CRUD |
| `14-config-crud.test.js` | 15+ | All config entity CRUD |
| `15-audit-history.test.js` | 12+ | Audit trail, filters, entity links |
| `16-operators.test.js` | 8+ | Operator CRUD |
| `17-operations.test.js` | 10+ | Operation list, status changes |
| `18-processes.test.js` | 12+ | Process CRUD, status flow |
| `19-user-profile.test.js` | 8+ | Profile view/edit |
| `20-users.test.js` | 10+ | User management CRUD |
| `21-production-history.test.js` | 8+ | Production history list, filters |
| `22-routing.test.js` | 10+ | Routing list, CRUD |
| `23-order-selection.test.js` | 8+ | Order selection for production |
| `24-partial-confirmation.test.js` | 10+ | Partial production confirmation |
| `25-detail-pages.test.js` | 10+ | Various detail pages |
| `25-material-selection-modal.test.js` | 8+ | Material selection modal |
| `26-apply-hold-modal.test.js` | 8+ | Apply hold modal |
| `26-process-parameters.test.js` | 10+ | Process parameter validation |
| `27-admin-sidebar.test.js` | 8+ | Admin sidebar navigation |
| `30-full-workflow-setup.test.js` | -- | Setup script (not in runner) |
| `31-big-demo-setup.test.js` | -- | Setup script (not in runner) |
| `32-order-crud.test.js` | 10+ | Order create/edit/delete |
| `33-production-complete.test.js` | 12+ | Complete production workflow |
| `34-receive-material.test.js` | 8+ | Receive material flow |
| `35-batch-operations.test.js` | 12+ | Batch split/merge/approve |
| `36-routing-crud.test.js` | 12+ | Routing CRUD, steps, reorder |
| `37-operation-templates.test.js` | 10+ | Operation template CRUD |
| `38-dashboard-features.test.js` | 8+ | Dashboard charts, widgets |
| `39-form-validations.test.js` | 12+ | Form validation across pages |
| `40-e2e-workflow-verification.test.js` | 15+ | End-to-end workflow |
| `41-production-flow-e2e.test.js` | 12+ | Full production flow |
| `42-new-detail-pages.test.js` | 8+ | Routing/OperationTemplate detail |
| `43-change-password.test.js` | 7 | Change password page |
| `44-entity-detail-pages.test.js` | 24 | Entity detail pages |
| `45-crud-submissions.test.js` | 22 | CRUD form submissions |

**Total: 45 test files, ~390+ test cases**

### 7.2 Note: Files NOT in Test Runner

The following files exist in `e2e/tests/` but are **NOT** imported in `run-all-tests.js`:
- `25-material-selection-modal.test.js` (duplicate number with 25-detail-pages)
- `26-apply-hold-modal.test.js` (duplicate number with 26-process-parameters)
- `30-full-workflow-setup.test.js` (setup script, not tests)
- `31-big-demo-setup.test.js` (setup script, not tests)

### 7.3 Route Coverage Matrix

| Route | E2E Tests | Status |
|-------|-----------|--------|
| `/login` | 01-auth | COVERED |
| `/dashboard` | 02-dashboard, 38-dashboard-features | COVERED |
| `/orders` | 03-orders, 32-order-crud | COVERED |
| `/orders/:id` | 25-detail-pages, 44-entity-detail-pages | COVERED |
| `/orders/new` | 32-order-crud, 45-crud-submissions | COVERED |
| `/orders/:id/edit` | 32-order-crud | COVERED |
| `/production/confirm` | 04-production, 23-order-selection, 24-partial, 33-production-complete | COVERED |
| `/production/history` | 21-production-history | COVERED |
| `/production/receive-material` | 34-receive-material, 45-crud-submissions | COVERED |
| `/inventory` | 05-inventory | COVERED |
| `/inventory/:id` | 44-entity-detail-pages | COVERED |
| `/batches` | 06-batches, 35-batch-operations | COVERED |
| `/batches/:id` | 06-batches, 44-entity-detail-pages | COVERED |
| `/holds` | 07-holds | COVERED |
| `/holds/:id` | 44-entity-detail-pages | COVERED |
| `/equipment` | 08-equipment | COVERED |
| `/equipment/:id` | 44-entity-detail-pages | COVERED |
| `/processes/list` | 18-processes | COVERED |
| `/processes/quality-pending` | 09-quality | COVERED |
| `/operations` | 17-operations | COVERED |
| `/profile` | 19-user-profile | COVERED |
| `/change-password` | 43-change-password | COVERED |
| `/manage/customers` | 11-crud, 12-entity-crud | COVERED |
| `/manage/customers/:id` | 44-entity-detail-pages | COVERED |
| `/manage/customers/new` | 45-crud-submissions | COVERED |
| `/manage/materials` | 11-crud, 12-entity-crud | COVERED |
| `/manage/materials/:id` | 44-entity-detail-pages | COVERED |
| `/manage/materials/new` | 45-crud-submissions | COVERED |
| `/manage/products` | 11-crud, 12-entity-crud | COVERED |
| `/manage/products/:id` | 44-entity-detail-pages | COVERED |
| `/manage/products/new` | 45-crud-submissions | COVERED |
| `/manage/bom` | 13-bom-crud | COVERED |
| `/manage/operators` | 16-operators | COVERED |
| `/manage/operators/:id` | 44-entity-detail-pages | COVERED |
| `/manage/operators/new` | 45-crud-submissions | COVERED |
| `/manage/processes` | 18-processes | COVERED |
| `/manage/routing` | 22-routing, 36-routing-crud | COVERED |
| `/manage/routing/:id` | 42-new-detail-pages | COVERED |
| `/manage/operation-templates` | 37-operation-templates | COVERED |
| `/manage/operation-templates/:id` | 42-new-detail-pages | COVERED |
| `/manage/users` | 20-users | COVERED |
| `/manage/users/:id` | 44-entity-detail-pages | COVERED |
| `/manage/audit` | 15-audit-history | COVERED |
| `/manage/config/hold-reasons` | 14-config-crud | COVERED |
| `/manage/config/delay-reasons` | 14-config-crud | COVERED |
| `/manage/config/process-params` | 14-config-crud, 26-process-parameters | COVERED |
| `/manage/config/batch-number` | 14-config-crud | COVERED |
| `/manage/config/quantity-type` | 14-config-crud | COVERED |
| `/manage/config/batch-size` | 14-config-crud | COVERED |
| `/reports` | **NONE** | **NOT COVERED** |
| `/reports/production-summary` | **NONE** | **NOT COVERED** |
| `/reports/material-consumption` | **NONE** | **NOT COVERED** |
| `/reports/batch-traceability` | **NONE** | **NOT COVERED** |
| `/reports/equipment-utilization` | **NONE** | **NOT COVERED** |
| `/reports/quality-metrics` | **NONE** | **NOT COVERED** |
| `/reports/order-fulfillment` | **NONE** | **NOT COVERED** |

---

## 8. Missing E2E Test Cases

### 8.1 Routes with ZERO E2E Coverage

| # | Route | Priority | Notes |
|---|-------|----------|-------|
| E2E-01 | `/reports` | **HIGH** | Reports landing page (module exists, components stubbed) |
| E2E-02 | `/reports/production-summary` | **MEDIUM** | Production summary report |
| E2E-03 | `/reports/material-consumption` | **MEDIUM** | Material consumption report |
| E2E-04 | `/reports/batch-traceability` | **MEDIUM** | Batch traceability report |
| E2E-05 | `/reports/equipment-utilization` | **MEDIUM** | Equipment utilization report |
| E2E-06 | `/reports/quality-metrics` | **MEDIUM** | Quality metrics report |
| E2E-07 | `/reports/order-fulfillment` | **MEDIUM** | Order fulfillment report |

### 8.2 Feature Scenarios Missing E2E Tests

| # | Scenario | Priority | E2E Files That Should Cover It |
|---|----------|----------|-------------------------------|
| E2E-08 | Batch split with quantity validation | **HIGH** | 35-batch-operations (exists but may not test validation) |
| E2E-09 | Batch merge with multiple batches | **HIGH** | 35-batch-operations (exists but may not test multi-merge) |
| E2E-10 | BOM suggested consumption → Apply → Confirm | **HIGH** | 33-production-complete (may not test BOM suggestion flow) |
| E2E-11 | Multi-batch production (batch size config) | **MEDIUM** | Not covered anywhere |
| E2E-12 | Routing lock verification | **MEDIUM** | 36-routing-crud (may not test lock state) |
| E2E-13 | Operation sequential enforcement | **MEDIUM** | 41-production-flow-e2e (may cover partially) |
| E2E-14 | Hold cascade (hold order → check operations) | **MEDIUM** | 07-holds (tests hold/release but not cascade) |
| E2E-15 | Batch quality approval → inventory available | **MEDIUM** | 35-batch-operations (may cover) |
| E2E-16 | Concurrent material selection conflict | **LOW** | Not testable in single-browser E2E |
| E2E-17 | Pagination on all 22 list pages | **MEDIUM** | 10-pagination covers 5 main pages |
| E2E-18 | Admin sidebar navigation (all links work) | **LOW** | 27-admin-sidebar covers most |
| E2E-19 | Error handling on API failures | **LOW** | 39-form-validations covers some |
| E2E-20 | Session expiry / token refresh | **LOW** | 01-auth covers some |
| E2E-21 | Mobile/responsive layout | **LOW** | Not covered |

### 8.3 Duplicate Test File Numbers

| File Number | Files | Issue |
|-------------|-------|-------|
| 25 | `25-detail-pages.test.js`, `25-material-selection-modal.test.js` | Duplicate number |
| 26 | `26-process-parameters.test.js`, `26-apply-hold-modal.test.js` | Duplicate number |

**Impact:** Only one of each pair is registered in `run-all-tests.js`. The modal test files (25-material-selection-modal, 26-apply-hold-modal) are NOT run as part of the main test suite.

---

## 9. Pagination Inconsistencies

### 9.1 Current State

| Page | Pagination Type | Component Used | Status |
|------|----------------|----------------|--------|
| Orders | `<app-pagination>` | Reusable component | OK |
| Inventory | `<app-pagination>` | Reusable component | OK |
| Batches | `<app-pagination>` | Reusable component | OK |
| Holds | `<app-pagination>` | Reusable component | OK |
| Equipment | `<app-pagination>` | Reusable component | OK |
| Production History | `<app-pagination>` | Reusable component | OK |
| Processes | `<app-pagination>` | Reusable component | OK |
| Users | `<app-pagination>` | Reusable component | OK |
| BOM | `<app-pagination>` | Reusable component | OK |
| Operations | `<app-pagination>` | Reusable component | OK |
| Customers | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Materials | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Products | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Operators | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Operation Templates | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Batch Number Config | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Hold Reasons Config | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Delay Reasons Config | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Process Params Config | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Quantity Type Config | Custom HTML | `.pagination-controls` div | **NEEDS UPDATE** |
| Audit | Custom HTML (different vars) | Custom with `currentPage`/`pageSize` | **NEEDS UPDATE** |
| Batch Size Config | **NONE** | No pagination at all | **NEEDS IMPLEMENTATION** |

### 9.2 Pagination Plan Status

A plan exists at `.claude/plans/recursive-kindling-quiche.md` to migrate all 12 pages to `<app-pagination>`:
- **Phase 1 (HTML only):** 10 pages with custom HTML → swap to `<app-pagination>` (no TS changes)
- **Phase 2 (TS + HTML):** Audit list (different variable names, needs `hasNext`/`hasPrevious`)
- **Phase 3 (Backend + Frontend):** Batch Size Config (needs new `/paged` endpoint)
- **Phase 4:** Unit tests for all 12 pages
- **Phase 5:** E2E pagination tests for all pages

**Status:** Plan created but NOT yet implemented.

---

## 10. Recommendations

### 10.1 Critical Priority (Should Fix Before System Guide)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R-01 | Add material reservation mechanism (PW-01) | Large | Prevents double-allocation in production |
| R-02 | Enforce BOM validation in production confirm (SVC-01) | Medium | Ensures correct material consumption |
| R-03 | Add `deliveryDate` and `notes` to Order entity (FB-09, FB-10) | Small | Data integrity - frontend sends but backend ignores |

### 10.2 High Priority (Should Fix Soon)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R-04 | Implement pagination migration plan (12 pages) | Medium | UI consistency |
| R-05 | Create reports module E2E tests (E2E-01 to E2E-07) | Medium | Test coverage |
| R-06 | Add batch split/merge dedicated UI (FB-03, FB-04) | Medium | User experience |
| R-07 | Fix equipment hold to use HoldService (SVC-08) | Small | Audit trail consistency |
| R-08 | Auto-complete orders when all operations confirmed (PW-06) | Small | Workflow automation |

### 10.3 Medium Priority (Nice to Have)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R-09 | Add hold cascade (PW-08) | Medium | Workflow consistency |
| R-10 | Fix duplicate E2E file numbers (25, 26) | Small | Test suite integrity |
| R-11 | Add PAUSED operation state (DT-03) | Medium | Production flexibility |
| R-12 | Batch size config → production integration (CFG-03) | Medium | Multi-batch production |
| R-13 | Add consumption reversal capability (PW-02) | Large | Error recovery |

### 10.4 Low Priority (Future Enhancement)

| # | Recommendation | Effort | Impact |
|---|---------------|--------|--------|
| R-14 | Add supplier tracking to batches (SVC-05) | Small | Traceability |
| R-15 | Add batch expiry dates (SVC-07) | Small | Material management |
| R-16 | Add order priority/scheduling (PW-07) | Medium | Production planning |
| R-17 | Add process versioning (DT-02) | Large | Design flexibility |
| R-18 | Add batch number preview in config UI (CFG-01) | Small | User experience |
| R-19 | Add mobile responsive E2E tests (E2E-21) | Medium | Cross-device testing |

---

## Appendix A: Entity-Route-Test Cross Reference

### Master Data Entities

| Entity | List Route | Detail Route | Create Route | E2E List | E2E Detail | E2E CRUD |
|--------|-----------|-------------|-------------|----------|-----------|----------|
| Customer | `/manage/customers` | `/manage/customers/:id` | `/manage/customers/new` | 11,12 | 44 | 45 |
| Material | `/manage/materials` | `/manage/materials/:id` | `/manage/materials/new` | 11,12 | 44 | 45 |
| Product | `/manage/products` | `/manage/products/:id` | `/manage/products/new` | 11,12 | 44 | 45 |
| Equipment | `/equipment` | `/equipment/:id` | `/equipment/new` | 08 | 44 | 45 |
| Operator | `/manage/operators` | `/manage/operators/:id` | `/manage/operators/new` | 16 | 44 | 45 |
| User | `/manage/users` | `/manage/users/:id` | `/manage/users/new` | 20 | 44 | 45 |

### Design-Time Entities

| Entity | List Route | Detail Route | E2E List | E2E Detail | E2E CRUD |
|--------|-----------|-------------|----------|-----------|----------|
| Process | `/manage/processes` | via list | 18 | 18 | 18 |
| Routing | `/manage/routing` | `/manage/routing/:id` | 22 | 42 | 36 |
| Operation Template | `/manage/operation-templates` | `/manage/operation-templates/:id` | 37 | 42 | 37 |
| BOM | `/manage/bom` | via tree | 13 | 13 | 13 |

### Runtime Entities

| Entity | List Route | Detail Route | E2E List | E2E Detail | E2E Workflow |
|--------|-----------|-------------|----------|-----------|-------------|
| Order | `/orders` | `/orders/:id` | 03 | 25,44 | 32,40,41 |
| Inventory | `/inventory` | `/inventory/:id` | 05 | 44 | 40,41 |
| Batch | `/batches` | `/batches/:id` | 06 | 44 | 35,40,41 |
| Hold | `/holds` | `/holds/:id` | 07 | 44 | 07 |
| Operation | `/operations` | via order detail | 17 | -- | 33,41 |

### Configuration Entities

| Entity | Route | E2E CRUD |
|--------|-------|----------|
| Hold Reasons | `/manage/config/hold-reasons` | 14 |
| Delay Reasons | `/manage/config/delay-reasons` | 14 |
| Process Params | `/manage/config/process-params` | 14,26 |
| Batch Number | `/manage/config/batch-number` | 14 |
| Quantity Type | `/manage/config/quantity-type` | 14 |
| Batch Size | `/manage/config/batch-size` | 14 |

---

## Appendix B: Screenshots Needed for System Guide

The following screenshots should be captured for the MES System Guide document:

### Phase 1: Master Data Setup
1. Customer list (empty state)
2. Customer create form
3. Customer list (with data)
4. Material list + material types
5. Material create form
6. Product list + product SKU
7. Product create form
8. Equipment list + status badges
9. Equipment create form
10. Operator list
11. Operator create form

### Phase 2: Design Phase
12. Process list
13. Process create form
14. Routing list
15. Routing create with steps
16. Routing detail with step reorder
17. Operation template list
18. Operation template create form
19. BOM tree view
20. BOM node create
21. Batch number config
22. Batch size config
23. Process parameters config

### Phase 3: Production Workflow
24. Order create form
25. Order detail with line items
26. Order detail with operations timeline
27. Receive material form
28. Receive material success
29. Batch list (QUALITY_PENDING)
30. Batch approve action
31. Production confirm - order selection
32. Production confirm - material selection
33. Production confirm - BOM suggested consumption
34. Production confirm - process parameters
35. Production confirm - success
36. Inventory list (after production)
37. Batch genealogy view
38. Production history list
39. Hold apply modal
40. Hold release modal
41. Audit trail list
42. Dashboard with metrics

---

*Document generated: 2026-02-10*
*Next step: Create E2E screenshot capture script, then write MES-System-Guide-Complete.md*
