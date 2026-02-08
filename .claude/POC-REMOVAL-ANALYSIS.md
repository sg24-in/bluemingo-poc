# MES POC - Removal Analysis

**Branch:** poc
**Date:** 2026-02-08
**Purpose:** Document files to remove for minimal POC codebase

---

## POC Scope Definition

**From Email Proposal - 4 Screens Only:**
1. **Login** - JWT Authentication
2. **Order Dashboard** - Dashboard + Orders list/detail
3. **Production Confirmation** - Production confirm form
4. **Traceability View** - Batches list + detail with genealogy

**Explicitly Excluded:**
- No configuration screens
- No admin panels or setup UIs
- No master data management (customers, materials, products)
- No holds management
- No inventory management
- No quality management
- No equipment management
- No user management

---

## Frontend Removal List

### Feature Modules to DELETE (18 modules)

```
frontend/src/app/features/
├── audit/                     - DELETE (admin feature)
├── bom/                       - DELETE (management UI)
├── change-password/           - DELETE (not POC scope)
├── config/                    - DELETE (admin feature)
├── customers/                 - DELETE (master data)
├── equipment/                 - DELETE (master data)
├── holds/                     - DELETE (not POC scope)
├── inventory/                 - DELETE (not POC scope)
├── materials/                 - DELETE (master data)
├── operation-templates/       - DELETE (admin feature)
├── operations/                - DELETE (admin feature)
├── operators/                 - DELETE (master data)
├── processes/                 - DELETE (admin feature)
├── products/                  - DELETE (master data)
├── profile/                   - DELETE (not POC scope)
├── quality/                   - DELETE (not POC scope)
├── routing/                   - DELETE (admin feature)
└── users/                     - DELETE (admin feature)
```

### Feature Modules to KEEP (5 modules)

```
frontend/src/app/features/
├── auth/                      - KEEP (Login)
├── dashboard/                 - KEEP (Dashboard)
├── orders/                    - KEEP (Orders list/detail)
├── production/                - KEEP (Production confirmation)
└── batches/                   - KEEP (Traceability)
```

### Shared Components to DELETE

```
frontend/src/app/shared/components/
├── admin-layout/              - DELETE (admin routes only)
├── manage-landing/            - DELETE (admin routes only)
└── apply-hold-modal/          - DELETE (holds feature)
```

### Shared Components to KEEP

```
frontend/src/app/shared/components/
├── header/                    - KEEP (update to remove admin links)
├── main-layout/               - KEEP
├── pagination/                - KEEP
├── status-badge/              - KEEP
├── loading-spinner/           - KEEP
├── breadcrumb/                - KEEP
├── material-selection-modal/  - KEEP (production form)
└── confirm-dialog/            - KEEP (if exists)
```

---

## Backend Removal List

### Controllers to DELETE (19 controllers)

```
backend/src/main/java/com/mes/production/controller/
├── AuditController.java
├── BatchAllocationController.java
├── BatchSizeConfigController.java
├── BomController.java
├── ConfigController.java
├── CustomerController.java
├── DatabaseResetController.java
├── EquipmentController.java
├── EquipmentUsageController.java
├── HoldController.java
├── InventoryController.java
├── InventoryMovementController.java
├── MaterialController.java
├── OperationTemplateController.java
├── OperatorController.java
├── ProcessController.java
├── ProductController.java
├── RoutingController.java
└── UserController.java
```

### Controllers to KEEP (7 controllers)

```
backend/src/main/java/com/mes/production/controller/
├── AuthController.java        - KEEP (login)
├── DashboardController.java   - KEEP (dashboard)
├── OrderController.java       - KEEP (orders)
├── OperationController.java   - KEEP (read-only, order detail)
├── ProductionController.java  - KEEP (production confirm)
├── BatchController.java       - KEEP (batches/traceability)
└── MasterDataController.java  - KEEP (dropdown data only)
```

### Services to DELETE (25 services)

```
backend/src/main/java/com/mes/production/service/
├── AuditService.java
├── BatchAllocationService.java
├── BatchNumberConfigService.java
├── BatchSizeService.java
├── BomService.java
├── BomValidationService.java
├── CustomerService.java
├── DatabaseResetService.java
├── DelayReasonService.java
├── EquipmentCategoryService.java
├── EquipmentUsageService.java
├── HoldReasonService.java
├── HoldService.java
├── InventoryFormService.java
├── InventoryMovementService.java
├── InventoryService.java
├── MaterialService.java
├── OperationInstantiationService.java
├── OperationTemplateService.java
├── ProcessParametersConfigService.java
├── ProcessService.java
├── ProductService.java
├── QuantityTypeConfigService.java
├── RoutingService.java
└── UnitConversionService.java
```

### Services to KEEP (14 services)

```
backend/src/main/java/com/mes/production/service/
├── AuthService.java               - KEEP (authentication)
├── UserService.java               - KEEP (user validation)
├── DashboardService.java          - KEEP (dashboard)
├── OrderService.java              - KEEP (orders)
├── OperationService.java          - KEEP (operations)
├── ProductionService.java         - KEEP (production confirm)
├── BatchService.java              - KEEP (batches)
├── BatchRelationService.java      - KEEP (genealogy)
├── BatchNumberService.java        - KEEP (batch number generation)
├── ProcessParameterService.java   - KEEP (parameter validation)
├── EquipmentService.java          - KEEP (dropdown data)
├── OperatorService.java           - KEEP (dropdown data)
├── FieldChangeAuditService.java   - KEEP (audit logging)
└── patch/PatchService.java        - KEEP (database patches)
```

### Entities to DELETE (29 entities)

```
backend/src/main/java/com/mes/production/entity/
├── AttributeDefinition.java
├── BatchAllocationOrderAllocation.java
├── BatchNumberConfig.java
├── BatchQuantityAdjustment.java
├── BatchSizeConfig.java
├── BillOfMaterial.java
├── ConsumedMaterial.java
├── Customer.java
├── DelayReason.java
├── Department.java
├── HoldReason.java
├── HoldRecord.java
├── Inventory.java
├── InventoryMovement.java
├── Location.java
├── MaterialGroup.java
├── OperationTemplate.java
├── OperationType.java
├── ProcessParametersConfig.java
├── ProcessParameterValue.java
├── ProcessStatus.java
├── ProducedOutput.java
├── ProductCategory.java
├── ProductGroup.java
├── QuantityTypeConfig.java
├── Routing.java
├── RoutingStep.java
├── Shift.java
└── UnitOfMeasure.java
```

### Entities to KEEP (15 entities)

```
backend/src/main/java/com/mes/production/entity/
├── User.java                      - KEEP (authentication)
├── Order.java                     - KEEP (orders)
├── OrderLineItem.java             - KEEP (order details)
├── Process.java                   - KEEP (process reference)
├── Operation.java                 - KEEP (operations)
├── ProductionConfirmation.java    - KEEP (production)
├── Batch.java                     - KEEP (batches)
├── BatchRelation.java             - KEEP (genealogy)
├── Equipment.java                 - KEEP (dropdown data)
├── Operator.java                  - KEEP (dropdown data)
├── Material.java                  - KEEP (production context)
├── Product.java                   - KEEP (order context)
├── AuditTrail.java                - KEEP (logging)
├── DatabasePatch.java             - KEEP (patch tracking)
└── OperationEquipmentUsage.java   - KEEP (if used)
```

### Repositories to DELETE (20 repositories)

```
backend/src/main/java/com/mes/production/repository/
├── BatchAllocationRepository.java
├── BatchNumberConfigRepository.java
├── BatchQuantityAdjustmentRepository.java
├── BatchSizeConfigRepository.java
├── BomRepository.java
├── CustomerRepository.java
├── DelayReasonRepository.java
├── HoldReasonRepository.java
├── HoldRecordRepository.java
├── InventoryMovementRepository.java
├── InventoryRepository.java
├── OperationTemplateRepository.java
├── ProcessParametersConfigRepository.java
├── QuantityTypeConfigRepository.java
├── RoutingRepository.java
├── RoutingStepRepository.java
└── (+ any others for removed entities)
```

### Repositories to KEEP (14 repositories)

```
backend/src/main/java/com/mes/production/repository/
├── UserRepository.java
├── OrderRepository.java
├── OrderLineItemRepository.java
├── ProcessRepository.java
├── OperationRepository.java
├── ProductionConfirmationRepository.java
├── BatchRepository.java
├── BatchRelationRepository.java
├── EquipmentRepository.java
├── OperatorRepository.java
├── MaterialRepository.java
├── ProductRepository.java
├── AuditTrailRepository.java
└── DatabasePatchRepository.java
```

### DTOs to DELETE (18 DTOs)

```
backend/src/main/java/com/mes/production/dto/
├── BatchAllocationDTO.java
├── BatchNumberConfigDTO.java
├── BomDTO.java
├── CustomerDTO.java
├── DelayReasonDTO.java
├── EquipmentUsageDTO.java
├── HoldDTO.java
├── HoldReasonDTO.java
├── InventoryDTO.java
├── InventoryMovementDTO.java
├── OperationTemplateDTO.java
├── ProcessParametersConfigDTO.java
├── QuantityTypeConfigDTO.java
├── RoutingDTO.java
└── (+ subdirectories for removed features)
```

### DTOs to KEEP

```
backend/src/main/java/com/mes/production/dto/
├── auth/                          - KEEP (login/register)
├── order/                         - KEEP (order DTOs)
├── UserDTO.java                   - KEEP
├── DashboardDTO.java              - KEEP
├── OperationDTO.java              - KEEP
├── ProductionConfirmationDTO.java - KEEP
├── BatchDTO.java                  - KEEP
├── EquipmentDTO.java              - KEEP (for dropdowns)
├── OperatorDTO.java               - KEEP (for dropdowns)
├── MaterialDTO.java               - KEEP (for dropdowns)
├── ProductDTO.java                - KEEP (for context)
├── AuditDTO.java                  - KEEP (for logging)
├── PagedResponseDTO.java          - KEEP
└── PageRequestDTO.java            - KEEP
```

---

## E2E Tests Removal List

### Tests to DELETE (36+ tests)

```
e2e/tests/
├── 05-inventory.test.js
├── 07-holds.test.js
├── 08-equipment.test.js
├── 09-quality.test.js
├── 10-pagination.test.js          - DELETE (tests removed features)
├── 11-crud.test.js
├── 12-entity-crud.test.js
├── 13-bom-crud.test.js
├── 14-config-crud.test.js
├── 15-audit-history.test.js
├── 16-operators.test.js
├── 17-operations.test.js
├── 18-processes.test.js
├── 19-user-profile.test.js
├── 20-users.test.js
├── 21-production-history.test.js
├── 22-routing.test.js
├── 23-order-selection.test.js
├── 24-partial-confirmation.test.js
├── 25-detail-pages.test.js
├── 25-material-selection-modal.test.js
├── 26-apply-hold-modal.test.js
├── 26-process-parameters.test.js
├── 27-admin-sidebar.test.js
├── 30-full-workflow-setup.test.js
├── 31-big-demo-setup.test.js
├── 32-order-crud.test.js
├── 33-production-complete.test.js
├── 34-receive-material.test.js
├── 35-batch-operations.test.js
├── 36-routing-crud.test.js
├── 37-operation-templates.test.js
├── 38-dashboard-features.test.js
├── 39-form-validations.test.js
├── 40-e2e-workflow-verification.test.js
└── 41-production-flow-e2e.test.js
```

### Tests to KEEP (5 tests)

```
e2e/tests/
├── 01-auth.test.js                - KEEP (login)
├── 02-dashboard.test.js           - KEEP (dashboard)
├── 03-orders.test.js              - KEEP (orders)
├── 04-production.test.js          - KEEP (production)
└── 06-batches.test.js             - KEEP (batches)
```

---

## Routing Changes

### Frontend Routes to REMOVE

```typescript
// Remove from app-routing.module.ts

// All /manage/* routes
{ path: 'manage/customers', ... }
{ path: 'manage/products', ... }
{ path: 'manage/materials', ... }
{ path: 'manage/processes', ... }
{ path: 'manage/routing', ... }
{ path: 'manage/equipment', ... }
{ path: 'manage/operators', ... }
{ path: 'manage/bom', ... }
{ path: 'manage/users', ... }
{ path: 'manage/config', ... }
{ path: 'manage/audit', ... }

// Non-POC operational routes
{ path: 'inventory', ... }
{ path: 'holds', ... }
{ path: 'equipment', ... }
{ path: 'quality', ... }
{ path: 'profile', ... }
{ path: 'change-password', ... }
```

### Frontend Routes to KEEP

```typescript
// Keep in app-routing.module.ts

{ path: '', redirectTo: '/dashboard', pathMatch: 'full' }
{ path: 'login', loadChildren: () => ... AuthModule }
{ path: 'dashboard', loadChildren: () => ... DashboardModule }
{ path: 'orders', loadChildren: () => ... OrdersModule }
{ path: 'production', loadChildren: () => ... ProductionModule }
{ path: 'batches', loadChildren: () => ... BatchesModule }
```

---

## Header Navigation Changes

### Remove from Header

```html
<!-- Remove admin menu/dropdown entirely -->
<!-- Remove these nav links: -->
- Inventory
- Holds
- Equipment
- Quality
- Admin dropdown (all items)
- User Profile
```

### Keep in Header

```html
<!-- Keep these nav links: -->
- Dashboard
- Orders
- Production
- Batches
- Logout
```

---

## POC API Endpoints (Final List)

```
Authentication
  POST   /api/auth/login

Dashboard
  GET    /api/dashboard/stats
  GET    /api/dashboard/summary

Orders
  GET    /api/orders
  GET    /api/orders/paged
  GET    /api/orders/{id}
  GET    /api/orders/available

Operations (Read-only)
  GET    /api/operations/{id}

Production
  POST   /api/production/confirm
  GET    /api/production/confirmations

Batches
  GET    /api/batches
  GET    /api/batches/paged
  GET    /api/batches/{id}
  GET    /api/batches/{id}/genealogy

Master Data (Dropdown support only)
  GET    /api/master/equipment
  GET    /api/master/operators
  GET    /api/master/process-parameters
```

---

## Summary Statistics

| Category | Total | Keep | Remove |
|----------|-------|------|--------|
| Frontend Feature Modules | 23 | 5 | 18 |
| Shared Components | 11 | 8 | 3 |
| Backend Controllers | 26 | 7 | 19 |
| Backend Services | 39 | 14 | 25 |
| Backend Entities | 44 | 15 | 29 |
| Backend Repositories | 34 | 14 | 20 |
| Backend DTOs | 36 | 18 | 18 |
| E2E Tests | 41 | 5 | 36 |
| **TOTAL** | **254** | **86** | **168** |

**Reduction: 66% of codebase removed**

---

## Execution Order

1. **Database Configuration** - Update to mes_poc_dev / mes_poc_test
2. **Frontend Feature Modules** - Delete 18 modules
3. **Frontend Shared Components** - Delete 3 components
4. **Frontend Routing** - Update app-routing.module.ts
5. **Frontend Header** - Remove admin links
6. **Backend Controllers** - Delete 19 controllers
7. **Backend Services** - Delete 25 services
8. **Backend Entities** - Delete 29 entities
9. **Backend Repositories** - Delete 20 repositories
10. **Backend DTOs** - Delete 18 DTOs
11. **E2E Tests** - Delete 36 tests
12. **Fix Compilation Errors** - Resolve import issues
13. **Verify Build** - Backend + Frontend
14. **Run Tests** - All test suites
15. **Manual Verification** - Test 4 screens

---

*Last Updated: 2026-02-08*
