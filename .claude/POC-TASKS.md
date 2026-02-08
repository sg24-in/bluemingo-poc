# MES POC Branch - Tasks & Progress

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

| Category | Files Removed |
|----------|---------------|
| Frontend Modules | 17 / 17 |
| Frontend Components | 3 / 3 |
| Backend Controllers | 19 / 19 |
| Backend Services | 27 / 27 |
| Backend Entities | pending |
| Backend Repositories | pending |
| Backend DTOs | pending |
| E2E Tests | 36 / 36 |
| **TOTAL** | **~102 / 167** |

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

*Last Updated: 2026-02-08*
