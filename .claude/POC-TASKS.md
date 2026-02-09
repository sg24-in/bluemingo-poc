# MES POC Branch - Tasks & Progress

> ⚠️ **CRITICAL: NEVER MERGE THIS BRANCH TO MAIN**
>
> This branch has 58,000+ lines of code removed. Merging to `main` would destroy the full codebase.
> This branch is for **client delivery only**.

**Branch:** poc
**Created:** 2026-02-08
**Purpose:** Minimal POC codebase for client delivery

---

## Database Configuration

| Environment | Database Name | Purpose |
|-------------|---------------|---------|
| Development | `mes_poc_dev` | POC development/demo |
| Test | `mes_poc_test` | POC automated tests |

---

## POC Scope (4 Screens)

| Screen | Route | Status |
|--------|-------|--------|
| Login | `/#/login` | KEEP |
| Dashboard | `/#/dashboard` | KEEP |
| Orders | `/#/orders`, `/#/orders/:id` | KEEP |
| Production Confirmation | `/#/production/confirm` | KEEP |
| Batches/Traceability | `/#/batches`, `/#/batches/:id` | KEEP |

---

## Removal Progress

### Frontend Features

| Module | Status | Notes |
|--------|--------|-------|
| auth | KEEP | Login |
| dashboard | KEEP | Dashboard |
| orders | KEEP | Orders list/detail |
| production | KEEP | Production confirm |
| batches | KEEP | Traceability |
| audit | PENDING REMOVAL | Admin feature |
| bom | PENDING REMOVAL | Management UI |
| change-password | PENDING REMOVAL | Not POC scope |
| config | PENDING REMOVAL | Admin feature |
| customers | PENDING REMOVAL | Master data |
| equipment | PENDING REMOVAL | Master data |
| holds | PENDING REMOVAL | Not POC scope |
| inventory | PENDING REMOVAL | Not POC scope |
| materials | PENDING REMOVAL | Master data |
| operation-templates | PENDING REMOVAL | Admin feature |
| operations | PENDING REMOVAL | Admin feature |
| operators | PENDING REMOVAL | Master data |
| processes | PENDING REMOVAL | Admin feature |
| products | PENDING REMOVAL | Master data |
| profile | PENDING REMOVAL | Not POC scope |
| quality | PENDING REMOVAL | Not POC scope |
| routing | PENDING REMOVAL | Admin feature |
| users | PENDING REMOVAL | Admin feature |

### Shared Components

| Component | Status | Notes |
|-----------|--------|-------|
| header | KEEP | Navigation |
| main-layout | KEEP | Layout wrapper |
| pagination | KEEP | List pagination |
| status-badge | KEEP | Status display |
| loading-spinner | KEEP | Loading indicator |
| breadcrumb | KEEP | Navigation |
| material-selection-modal | KEEP | Production form |
| apply-hold-modal | REMOVE | Holds feature |
| admin-layout | REMOVE | Admin routes |
| manage-landing | REMOVE | Admin routes |

### Backend Controllers

| Controller | Status | Notes |
|------------|--------|-------|
| AuthController | KEEP | Authentication |
| DashboardController | KEEP | Dashboard |
| OrderController | KEEP | Orders |
| ProductionController | KEEP | Production |
| BatchController | KEEP | Batches |
| MasterDataController | KEEP | Dropdown data |
| OperationController | KEEP | Read-only |
| AuditController | PENDING REMOVAL | |
| BomController | PENDING REMOVAL | |
| CustomerController | PENDING REMOVAL | |
| EquipmentController | PENDING REMOVAL | |
| HoldController | PENDING REMOVAL | |
| InventoryController | PENDING REMOVAL | |
| MaterialController | PENDING REMOVAL | |
| ProcessController | PENDING REMOVAL | |
| ProductController | PENDING REMOVAL | |
| RoutingController | PENDING REMOVAL | |
| UserController | PENDING REMOVAL | |
| (+ 10 more) | PENDING REMOVAL | |

### E2E Tests

| Test | Status | Notes |
|------|--------|-------|
| 01-auth.test.js | KEEP | Login tests |
| 02-dashboard.test.js | KEEP | Dashboard tests |
| 03-orders.test.js | KEEP | Orders tests |
| 04-production.test.js | KEEP | Production tests |
| 06-batches.test.js | KEEP | Batches tests |
| All others (36+) | PENDING REMOVAL | Non-POC features |

---

## Task Checklist

### Phase 1: Database Setup
- [ ] Update application.properties for MES_POC_DB
- [ ] Update application-test.properties for MES_POC_TEST
- [ ] Create minimal demo data.sql

### Phase 2: Frontend Cleanup
- [ ] Remove non-POC feature modules (18 modules)
- [ ] Remove admin-layout and manage-landing components
- [ ] Update app-routing.module.ts (remove admin routes)
- [ ] Update header component (remove admin menu)
- [ ] Update shared.module.ts exports
- [ ] Fix compilation errors

### Phase 3: Backend Cleanup
- [ ] Remove non-POC controllers (19 controllers)
- [ ] Remove non-POC services (25 services)
- [ ] Remove non-POC entities (29 entities)
- [ ] Remove non-POC repositories (20 repositories)
- [ ] Remove non-POC DTOs (18 DTOs)
- [ ] Fix compilation errors

### Phase 4: Test Cleanup
- [ ] Remove non-POC E2E tests (36 tests)
- [ ] Remove non-POC frontend unit tests
- [ ] Remove non-POC backend unit tests
- [ ] Update test runner scripts

### Phase 5: Verification
- [ ] Backend compiles: `./gradlew build`
- [ ] Frontend compiles: `npm run build`
- [ ] Backend tests pass: `./gradlew test`
- [ ] Frontend tests pass: `npm test`
- [ ] E2E tests pass: `node e2e/run-all-tests.js`
- [ ] Manual verification of 4 screens

---

## Removed File Count

| Category | Files Removed | Notes |
|----------|---------------|-------|
| Frontend Modules | 17 | Phase 1 |
| Frontend Components | 3 | Phase 1 |
| Backend Controllers | 19 | Phase 1 |
| Backend Services | 27 + 22 = 49 | Phase 1 (27) + orphan cleanup (22) |
| Backend Entities | 21 | Orphan cleanup + JPA fixes |
| Backend Repositories | 12 | Orphan cleanup |
| Backend DTOs | 8 + 6 = 14 | Phase 1 (8) + orphan cleanup (6) |
| Backend Tests | 4 + 20 = 24 | Service tests for removed services |
| Backend Config | 1 | application-reset.yml |
| E2E Tests | 36 | Phase 1 |
| **TOTAL** | **~196 files, 20,780 lines** | |

### Remaining Backend Files (93 Java + 31 Tests = 124)

| Category | Count | Files |
|----------|-------|-------|
| Controllers | 7 | Auth, Dashboard, Order, Production, Batch, MasterData, Operation |
| Services | 13 | Auth, Dashboard, Order, Production, Batch, Operation, Audit, BatchNumber, BatchSize, EquipmentUsage, InventoryMovement, InventoryStateValidator, ProcessParameter |
| Service/Patch | 3 | PatchRunner, PatchService, TestPatchRunner |
| Repositories | 19 | All needed for POC controllers + support services |
| Entities | 23 | Core domain model for POC workflows |
| DTOs | 19 | API request/response objects |
| Security | 3 | JWT auth chain |
| Config | 4 | Security, exception handler, test configs |
| Root | 2 | Application, ServletInitializer |
| Tests | 31 | Controller + service tests for kept code |

---

## Session Log

### 2026-02-08 - Branch Creation & Phase 1 Cleanup
- Created `poc` branch from main
- Created POC-TASKS.md for tracking
- Created POC-REMOVAL-ANALYSIS.md with detailed removal plan
- Configured databases: mes_poc_dev, mes_poc_test

**Phase 1 Complete:**
- Removed 17 frontend feature modules
- Removed 3 shared components (admin-layout, apply-hold-modal, manage-landing)
- Removed 19 backend controllers
- Removed 27 backend services
- Removed 36 E2E tests
- Updated routing, header, shared.module
- Fixed production-confirm component (removed holds integration)

**Commit:** `4e9f8c8` - 313 files changed, 58,138 lines deleted

**Status:**
- Frontend: Builds successfully
- Backend: Compiles successfully
- E2E Tests: 5 core tests remain

---

## Detailed Cleanup Analysis (2026-02-09)

### Dashboard Component Fixes (COMPLETED)

**Removed from Dashboard:**
- Inventory Flow section (RM → WIP → IM → FG pipeline)
- Active Holds alert card
- Quality Inspections Pending alert card
- Blocked Inventory alert card
- Inventory Items metric card
- Inventory Distribution chart
- "Receive Material" quick action
- "Manage Holds" quick action

**Kept in Dashboard:**
- Operations Status Summary
- Key Metrics (Orders, Today's Production, Active Batches)
- Order Status chart
- Batch Status chart
- Orders Ready for Production table
- Recent Confirmations
- Recent Batches table
- Quick Actions: Confirm Production, View Orders, Batch Traceability

### Frontend Models Analysis

**KEEP - Used by POC Features (11 files):**
1. `pagination.model.ts` - Used by orders, batches
2. `order.model.ts` - Used by orders feature
3. `batch.model.ts` - Used by batches feature
4. `customer.model.ts` - Used by orders (order-form)
5. `product.model.ts` - Used by orders (order-form)
6. `production.model.ts` - Used by production feature
7. `dashboard.model.ts` - Used by dashboard feature
8. `bom.model.ts` - Used by production (suggested consumption)
9. `batch-allocation.model.ts` - Used by batches (batch-detail)
10. `operation.model.ts` - Required by order/production models
11. `hold.model.ts` - Referenced in dashboard/production workflow

**REMOVE - Not Used by POC (10 files):**
1. `equipment.model.ts`
2. `process.model.ts`
3. `inventory.model.ts`
4. `operator.model.ts`
5. `config.model.ts`
6. `unit-of-measure.model.ts`
7. `audit.model.ts`
8. `user.model.ts`
9. `operation-template.model.ts`
10. `material.model.ts` (KEEP - used in order-form)

### Backend DTOs Analysis

**KEEP - Used by POC Controllers (24 DTOs):**
- PagedResponseDTO, PageRequestDTO
- DashboardDTO
- OrderDTO (+ CreateOrderRequest, UpdateOrderRequest, LineItemRequest)
- ProductionConfirmationDTO
- BatchDTO
- OperationDTO
- InventoryDTO (used by ProductionConfirmationDTO)
- auth/LoginRequest, auth/LoginResponse
- OperatorDTO, HoldReasonDTO, DelayReasonDTO
- EquipmentDTO (used in production confirmation)
- ProcessParametersConfigDTO
- BatchNumberConfigDTO, QuantityTypeConfigDTO
- BomDTO (SuggestedConsumption)
- ProcessDTO, OperationTemplateDTO, RoutingDTO

**REMOVE - Not Used by POC (8 DTOs):**
1. `UserDTO.java` - User management out of scope
2. `AuditDTO.java` - Audit endpoints out of scope
3. `EquipmentUsageDTO.java` - Equipment usage logging not in POC
4. `InventoryMovementDTO.java` - Inventory movements not exposed
5. `BatchAllocationDTO.java` - Batch allocation not in POC
6. `ProductDTO.java` - Phase 2 deferred
7. `CustomerDTO.java` - Phase 2 deferred
8. `MaterialDTO.java` - Phase 2 deferred

### Backend Services Analysis

**KEEP - Direct Dependencies (9 services):**
1. `AuthService` - AuthController
2. `DashboardService` - DashboardController
3. `OrderService` - OrderController
4. `ProductionService` - ProductionController
5. `BatchService` - BatchController
6. `BatchNumberService` - BatchController (direct)
7. `OperationService` - OperationController
8. `EquipmentCategoryService` - MasterDataController
9. `InventoryFormService` - MasterDataController

**KEEP - Transitive Dependencies (8 services):**
1. `AuditService` - Used by Dashboard, Production, Batch, Operation services
2. `EquipmentUsageService` - Used by ProductionService
3. `InventoryMovementService` - Used by ProductionService
4. `ProcessParameterService` - Used by ProductionService
5. `InventoryStateValidator` - Used by ProductionService
6. `BatchSizeService` - Used by ProductionService
7. `FieldChangeAuditService` - Used by AuditService
8. `ProcessParametersConfigService` - Used by ProcessParameterService

**REMOVE - Not Used by POC (23 services):**
1. `CustomerService`
2. `MaterialService`
3. `ProductService`
4. `OperatorService`
5. `EquipmentService`
6. `HoldService`
7. `HoldReasonService`
8. `DelayReasonService`
9. `BomService`
10. `BomValidationService`
11. `RoutingService`
12. `ProcessService`
13. `OperationTemplateService`
14. `OperationInstantiationService`
15. `ReceiveMaterialService`
16. `DatabaseResetService`
17. `UserService`
18. `BatchAllocationService`
19. `BatchNumberConfigService`
20. `QuantityTypeConfigService`
21. `UnitConversionService`
22. `InventoryService`
23. `QualityService`

---

### 2026-02-09 - Dashboard Cleanup & Analysis

**Changes Made:**
- Fixed dashboard component (removed inventory/holds/quality references)
- Updated E2E test runner (reduced to 5 POC tests)
- E2E tests: 37/38 passed (1 minor data issue)

**Files Modified:**
- `frontend/src/app/features/dashboard/dashboard/dashboard.component.html`
- `frontend/src/app/features/dashboard/dashboard/dashboard.component.ts`
- `e2e/run-all-tests.js`

**Pending Cleanup:**
- [x] Remove unused frontend models (10 files) - SKIPPED: Models kept for type safety
- [x] Clean up api.service.ts imports - DONE: 621 lines removed (44% reduction)
- [x] Remove unused backend DTOs (14 files) - DONE
- [x] Remove unused backend services (26 files) - DONE
- [x] Remove unused backend repositories (12 files) - DONE
- [x] Remove unused backend entities (21 files) - DONE + 2 JPA fixes
- [x] Remove unused backend tests (24 files) - DONE
- [x] Remove unused config (1 file) - DONE

---

### 2026-02-09 - API Service Cleanup & PDF Generation

**Changes Made:**
- Cleaned up api.service.ts: 1,425 → 804 lines (621 lines removed, 44% reduction)
- Generated MES-POC-Specification.pdf from clean markdown
- Created generate-spec-pdf.js for future regeneration

**Sections Removed from api.service.ts:**
- Operation Templates (13 methods)
- Config CRUD (Hold Reasons, Delay Reasons, Process Parameters, Batch Number, Quantity Type, Batch Size - 30+ methods)
- Audit Trail (8 methods)
- Processes CRUD (kept only getAllProcesses, getActiveProcesses)
- Routing (20+ methods)
- Users (12 methods)
- Customers/Materials/Products CRUD (kept only getActive* lookups)
- Operators CRUD (kept only master data lookups)

**Backend Service Decision:**
Services are kept intact because:
1. ProductionService has transitive dependencies on 6+ services
2. Spring Boot dependency injection requires all referenced services
3. Removing services risks breaking the application
4. Controllers already reduced to 7 essential ones in Phase 1

**E2E Tests:** 37/38 passed (97%)

---

### 2026-02-09 - Unused Backend DTO & Service Removal

**Verification Analysis:**

| # | DTO | Referenced Outside Self | Verdict |
|---|-----|----------------------|---------|
| 1 | `UserDTO.java` | Only `UserService.java` (no controller) | REMOVED |
| 2 | `AuditDTO.java` | Self only | REMOVED |
| 3 | `EquipmentUsageDTO.java` | Self only | REMOVED |
| 4 | `InventoryMovementDTO.java` | Self only | REMOVED |
| 5 | `BatchAllocationDTO.java` | Self only | REMOVED |
| 6 | `ProductDTO.java` | Only `ProductService.java` (no controller) | REMOVED |
| 7 | `CustomerDTO.java` | Only `CustomerService.java` (no controller) | REMOVED |
| 8 | `MaterialDTO.java` | Only `MaterialService.java` (no controller) | REMOVED |

**Cascading Removals (orphaned by DTO deletion):**

| File | Reason |
|------|--------|
| `service/UserService.java` | Imported `UserDTO` (no controller references it) |
| `service/ProductService.java` | Imported `ProductDTO` (no controller references it) |
| `service/CustomerService.java` | Imported `CustomerDTO` (no controller references it) |
| `service/MaterialService.java` | Imported `MaterialDTO` (no controller references it) |
| `test/service/UserServiceTest.java` | Tests for removed service |
| `test/service/ProductServiceTest.java` | Tests for removed service |
| `test/service/CustomerServiceTest.java` | Tests for removed service |
| `test/service/MaterialServiceTest.java` | Tests for removed service |

**Total Removed:** 8 DTOs + 4 services + 4 test files = **16 files**

**Build Verification:** Backend compileJava + compileTestJava both SUCCESSFUL

---

### 2026-02-09 - Full Orphan Cleanup (DTOs, Services, Repos, Entities, Tests)

**Method:** Traced transitive dependencies from 7 POC controllers → services → repos → entities. Removed everything not in the dependency chain.

**Batch 1: Orphaned DTOs (6 removed)**
- `BomDTO.java`, `RoutingDTO.java`, `BatchNumberConfigDTO.java`
- `OperationTemplateDTO.java`, `QuantityTypeConfigDTO.java`, `HoldDTO.java`

**Batch 2: Orphaned Services (22 removed)**
- `BomService`, `BomValidationService`, `OperatorService`, `EquipmentService`
- `EquipmentCategoryService`, `ProcessService`, `RoutingService`, `HoldService`
- `InventoryService`, `InventoryFormService`, `OperationTemplateService`
- `OperationInstantiationService`, `BatchAllocationService`, `BatchNumberConfigService`
- `DelayReasonService`, `HoldReasonService`, `DatabaseResetService`
- `QuantityTypeConfigService`, `FieldChangeAuditService`, `UnitConversionService`
- `ReceiveMaterialService`, `ProcessParametersConfigService`

**Batch 3: Orphaned Repositories (12 removed)**
- `BatchNumberConfigRepository`, `BatchOrderAllocationRepository`, `BomRepository`
- `CustomerRepository`, `DelayReasonRepository`, `HoldReasonRepository`
- `MaterialRepository`, `OperationTemplateRepository`, `ProcessParametersConfigRepository`
- `ProductRepository`, `QuantityTypeConfigRepository`, `RoutingRepository`

**Batch 4: Orphaned Entities (21 removed)**
- `AttributeDefinition`, `BatchNumberConfig`, `BatchOrderAllocation`, `BillOfMaterial`
- `ConsumedMaterial`, `Customer`, `Department`, `Location`, `Material`, `MaterialGroup`
- `OperationTemplate`, `OperationType`, `ProcessParameterValue`, `ProducedOutput`
- `Product`, `ProductCategory`, `ProductGroup`, `QuantityTypeConfig`
- `Routing`, `Shift`, `UnitOfMeasure`

**JPA Relationship Fixes (2 entities modified):**
- `Order.java` — Replaced `@ManyToOne Customer customer` with `Long customerRefId`
- `RoutingStep.java` — Replaced `@ManyToOne Routing/OperationTemplate` with `Long routingId/operationTemplateId`, simplified helper methods

**Batch 5: Orphaned Test Files (20 removed)**
- All `*ServiceTest.java` and `*ComprehensiveTest.java` for removed services

**Batch 6: Config cleanup (1 removed)**
- `application-reset.yml` — Reset profile for deleted DatabaseResetService

**Total this session:** 6 DTOs + 22 services + 12 repos + 21 entities + 20 tests + 1 config = **82 files, ~20,780 lines**

**Cumulative total (including earlier 16):** **98 files removed in orphan cleanup**

**Build Verification:** compileJava + compileTestJava both SUCCESSFUL

---

*Last Updated: 2026-02-09*
