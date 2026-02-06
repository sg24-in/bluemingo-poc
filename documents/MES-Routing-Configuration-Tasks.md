# MES Routing Configuration Module - Task Analysis

**Created:** 2026-02-07
**Last Updated:** 2026-02-07
**Status:** Implementation COMPLETE (Testing Pending)

---

## Executive Summary

This document analyzes the Routing Configuration module requirements against the current implementation and defines all remaining tasks.

### Current Implementation Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Backend Entity** | ✅ COMPLETE | Routing.java, RoutingStep.java |
| **Backend Controller** | ✅ COMPLETE | RoutingController.java (15+ endpoints incl. step CRUD) |
| **Backend Service** | ✅ COMPLETE | RoutingService.java (415+ lines incl. step CRUD) |
| **Database Schema** | ✅ COMPLETE | Patch 025 applied |
| **Frontend API Methods** | ✅ COMPLETE | api.service.ts has all routing + step methods |
| **Frontend List Component** | ✅ COMPLETE | routing-list.component with summary cards, filters |
| **Frontend Form Component** | ✅ COMPLETE | routing-form.component with inline step management |
| **Frontend Step Editor** | ✅ COMPLETE | Step modal with CRUD, reordering, batch flags |
| **Admin Sidebar** | ✅ COMPLETE | Routing link added to AdminLayoutComponent |
| **Backend Tests** | ✅ COMPLETE | RoutingControllerTest, RoutingServiceTest |
| **Frontend Tests** | ❌ NOT STARTED | Need to create spec files |
| **E2E Tests** | ❌ NOT STARTED | Need to create |

---

## Requirement Analysis

### 1. Data Model (✅ COMPLETE)

| Entity | Field | Exists | Status |
|--------|-------|--------|--------|
| **Routing** | RoutingID | ✅ | PK |
| | ProcessID (FK) | ✅ | Links to Process |
| | RoutingName | ✅ | |
| | RoutingType | ✅ | SEQUENTIAL/PARALLEL |
| | Status | ✅ | DRAFT/ACTIVE/INACTIVE/ON_HOLD |
| **RoutingStep** | RoutingStepID | ✅ | PK |
| | RoutingID (FK) | ✅ | Links to Routing |
| | OperationName | ✅ | |
| | OperationType | ✅ | |
| | SequenceNumber | ✅ | |
| | IsParallel | ✅ | Y/N |
| | MandatoryFlag | ✅ | Y/N |

### 2. Backend API Requirements

| Endpoint | Exists | Implementation |
|----------|--------|----------------|
| `POST /routing` | ✅ | RoutingController.createRouting() |
| `GET /routing?processId=` | ✅ | RoutingController.getAllRoutings() |
| `PUT /routing/{id}` | ✅ | RoutingController.updateRouting() |
| `POST /routing/{id}/activate` | ✅ | RoutingController.activateRouting() |
| `POST /routing/{id}/deactivate` | ✅ | RoutingController.deactivateRouting() |
| `POST /routing/{id}/steps` | ✅ | RoutingController.createRoutingStep() |
| `PUT /routing/steps/{id}` | ✅ | RoutingController.updateRoutingStep() |
| `DELETE /routing/steps/{id}` | ✅ | RoutingController.deleteRoutingStep() |
| `POST /routing/{id}/reorder` | ✅ | RoutingController.reorderSteps() |

### 3. Frontend Requirements

| Screen | Status | Notes |
|--------|--------|-------|
| **Routing List** | ✅ COMPLETE | routing-list.component with summary cards, filters |
| **Create Routing** | ✅ COMPLETE | routing-form.component with step inline editor |
| **Edit Routing** | ✅ COMPLETE | routing-form.component (same, edit mode) |
| **Routing Steps Editor** | ✅ COMPLETE | Step modal with CRUD, reordering, batch flags |

### 4. Validation Rules

| Rule | Backend | Frontend |
|------|---------|----------|
| Routing needs ≥1 step to activate | ✅ | ⚠️ UI warning |
| Only one ACTIVE routing per Process | ✅ | ✅ via API |
| Mandatory steps cannot be removed | ✅ | ✅ delete disabled |
| SequenceNumber must be positive | ✅ | ✅ min="1" |
| Parallel steps share SequenceNumber | ⚠️ Partial | ⚠️ User enters manually |

---

## Task Breakdown

### Phase 1: Backend API Gaps (4 tasks)

| Task | Description | Effort | Priority |
|------|-------------|--------|----------|
| **R-B01** | Add `POST /routing/{id}/steps` endpoint | 1h | HIGH |
| **R-B02** | Add `PUT /routing/steps/{id}` endpoint | 1h | HIGH |
| **R-B03** | Add `DELETE /routing/steps/{id}` endpoint | 1h | HIGH |
| **R-B04** | Add `POST /routing/{id}/reorder` endpoint | 1.5h | HIGH |

**Files to Modify:**
- `backend/src/main/java/com/mes/production/controller/RoutingController.java`
- `backend/src/main/java/com/mes/production/service/RoutingService.java`
- `backend/src/main/java/com/mes/production/dto/RoutingDTO.java`

### Phase 2: Frontend Routing Form (4 tasks)

| Task | Description | Effort | Priority |
|------|-------------|--------|----------|
| **R-F01** | Create RoutingFormComponent (create/edit) | 2h | HIGH |
| **R-F02** | Add process dropdown with validation | 1h | HIGH |
| **R-F03** | Add routing type selection | 0.5h | MEDIUM |
| **R-F04** | Add form validation (prevent duplicate active) | 1h | HIGH |

**Files to Create:**
- `frontend/src/app/features/routing/routing-form/routing-form.component.ts`
- `frontend/src/app/features/routing/routing-form/routing-form.component.html`
- `frontend/src/app/features/routing/routing-form/routing-form.component.css`

### Phase 3: Frontend Step Editor (5 tasks)

| Task | Description | Effort | Priority |
|------|-------------|--------|----------|
| **R-F05** | Create step list table in form | 1.5h | HIGH |
| **R-F06** | Add step modal for add/edit | 2h | HIGH |
| **R-F07** | Implement step deletion with mandatory check | 1h | HIGH |
| **R-F08** | Implement step reordering (up/down buttons) | 1.5h | MEDIUM |
| **R-F09** | Add parallel step grouping UI | 1h | LOW |

### Phase 4: Frontend API Integration (3 tasks)

| Task | Description | Effort | Priority |
|------|-------------|--------|----------|
| **R-F10** | Add step CRUD API methods to api.service.ts | 1h | HIGH |
| **R-F11** | Add reorder API method | 0.5h | MEDIUM |
| **R-F12** | Update routing routes in app-routing.module.ts | 0.5h | HIGH |

### Phase 5: Testing (5 tasks)

| Task | Description | Effort | Priority |
|------|-------------|--------|----------|
| **R-T01** | Backend tests for step CRUD endpoints | 2h | HIGH |
| **R-T02** | Backend tests for reorder endpoint | 1h | MEDIUM |
| **R-T03** | Frontend spec for routing-list.component | 1.5h | MEDIUM |
| **R-T04** | Frontend spec for routing-form.component | 1.5h | MEDIUM |
| **R-T05** | E2E tests for routing CRUD flow | 2h | LOW |

### Phase 6: Documentation & Cleanup (2 tasks)

| Task | Description | Effort | Priority |
|------|-------------|--------|----------|
| **R-D01** | Update CLAUDE.md with routing endpoints | 0.5h | LOW |
| **R-D02** | Update TASKS.md with completed tasks | 0.5h | LOW |

---

## Implementation Order (Recommended)

### Sprint 1: Backend Completion (~4.5h)
1. R-B01: Add step create endpoint
2. R-B02: Add step update endpoint
3. R-B03: Add step delete endpoint
4. R-B04: Add step reorder endpoint

### Sprint 2: Frontend Form & Integration (~6h)
1. R-F12: Update routing in app-routing.module.ts
2. R-F01: Create RoutingFormComponent
3. R-F02: Add process dropdown
4. R-F03: Add routing type selection
5. R-F10: Add step API methods

### Sprint 3: Step Editor (~6h)
1. R-F05: Create step list table
2. R-F06: Add step modal
3. R-F07: Implement step deletion
4. R-F08: Implement reordering
5. R-F04: Form validation

### Sprint 4: Testing & Polish (~8h)
1. R-T01: Backend step tests
2. R-T02: Backend reorder tests
3. R-T03: Frontend list spec
4. R-T04: Frontend form spec
5. R-T05: E2E tests
6. R-F09: Parallel grouping UI
7. R-D01 & R-D02: Documentation

---

## Total Effort Estimate

| Phase | Tasks | Effort |
|-------|-------|--------|
| Phase 1: Backend | 4 | 4.5h |
| Phase 2: Frontend Form | 4 | 4.5h |
| Phase 3: Step Editor | 5 | 7h |
| Phase 4: API Integration | 3 | 2h |
| Phase 5: Testing | 5 | 8h |
| Phase 6: Documentation | 2 | 1h |
| **TOTAL** | **23** | **~27h** |

---

## What's Already Done

### Backend (✅ Complete)
- Routing entity with all required fields
- RoutingStep entity with batch behavior flags
- 15+ API endpoints for routing management
- Single-active-routing enforcement
- Routing lock after execution
- Activation/deactivation workflow
- Hold/release functionality
- Unit tests for service and controller

### Frontend (🔄 In Progress)
- RoutingModule created
- RoutingRoutingModule (routes) created
- RoutingListComponent created
- API service methods exist

---

## What's NOT in Scope (Per Requirements)

- ❌ Production execution logic
- ❌ Batch creation
- ❌ Inventory logic
- ❌ Operator actions
- ❌ Production confirmation UI
- ❌ Quantity definitions
- ❌ Runtime operation creation

---

## Files Summary

### Already Exist (Backend)
```
backend/src/main/java/com/mes/production/
├── entity/
│   ├── Routing.java
│   └── RoutingStep.java
├── controller/
│   └── RoutingController.java
├── service/
│   └── RoutingService.java
├── repository/
│   ├── RoutingRepository.java
│   └── RoutingStepRepository.java
└── dto/
    └── RoutingDTO.java
```

### Already Exist (Frontend)
```
frontend/src/app/
├── core/services/api.service.ts (routing methods)
└── features/routing/
    ├── routing.module.ts
    ├── routing-routing.module.ts
    └── routing-list/
        ├── routing-list.component.ts
        ├── routing-list.component.html
        └── routing-list.component.css
```

### To Create (Frontend)
```
frontend/src/app/features/routing/
└── routing-form/
    ├── routing-form.component.ts
    ├── routing-form.component.html
    ├── routing-form.component.css
    └── routing-form.component.spec.ts
```

---

## Next Immediate Actions

1. **Complete routing form component** (R-F01)
2. **Add step CRUD endpoints** (R-B01, R-B02, R-B03)
3. **Add routing route to app-routing.module.ts** (R-F12)
4. **Test the routing list page** manually
