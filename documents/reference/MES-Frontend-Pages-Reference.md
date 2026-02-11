# MES Frontend Pages Reference

**Generated:** February 2026
**Source:** Angular Frontend Analysis
**Framework:** Angular 17 (Module-based architecture)
**Routing:** Hash-based (`useHash: true`) -- all URLs are prefixed with `/#/`

---

## Table of Contents

1. [Route Map](#route-map)
2. [Layout Architecture](#layout-architecture)
3. [Feature Modules](#feature-modules)
4. [Shared Components](#shared-components)
5. [Models / Interfaces](#models--interfaces)
6. [Core Services](#core-services)
7. [Core Guards & Interceptors](#core-guards--interceptors)

---

## Route Map

All routes use hash-based navigation. The browser URL format is `http://localhost:4200/#/<path>`.

### Top-Level Routes

| URL Path | Component / Action | Layout | Auth | Lazy Module |
|----------|-------------------|--------|------|-------------|
| `/` | Redirect to `/dashboard` | -- | -- | -- |
| `/login` | `LoginComponent` | None (standalone) | No | `AuthModule` |
| `/**` (wildcard) | Redirect to `/dashboard` | -- | -- | -- |

### Main Layout Routes (Header + Content)

These routes are children of `MainLayoutComponent` and require `AuthGuard`.

| URL Path | Component | Module | Description |
|----------|-----------|--------|-------------|
| `/dashboard` | `DashboardComponent` | `DashboardModule` | KPI metrics, recent activity, audit summary |
| `/orders` | `OrderListComponent` | `OrdersModule` | Paginated order list with filters |
| `/orders/new` | `OrderFormComponent` | `OrdersModule` | Create new order with line items |
| `/orders/:orderId` | `OrderDetailComponent` | `OrdersModule` | Order detail with line items and operations |
| `/orders/:orderId/edit` | `OrderFormComponent` | `OrdersModule` | Edit existing order |
| `/production` | `ProductionLandingComponent` | `ProductionModule` | Production landing with available operations |
| `/production/confirm/:operationId` | `ProductionConfirmComponent` | `ProductionModule` | Production confirmation form |
| `/production/history` | `ProductionHistoryComponent` | `ProductionModule` | Confirmation history list |
| `/inventory` | `InventoryListComponent` | `InventoryModule` | Paginated inventory with state/type filters |
| `/inventory/new` | `InventoryFormComponent` | `InventoryModule` | Create inventory record |
| `/inventory/receive` | `ReceiveMaterialComponent` | `InventoryModule` | Raw material goods receipt |
| `/inventory/:id` | `InventoryDetailComponent` | `InventoryModule` | Inventory item detail with actions |
| `/inventory/:id/edit` | `InventoryFormComponent` | `InventoryModule` | Edit inventory record |
| `/batches` | `BatchListComponent` | `BatchesModule` | Paginated batch list with status filters |
| `/batches/new` | `BatchFormComponent` | `BatchesModule` | Create batch |
| `/batches/:batchId` | `BatchDetailComponent` | `BatchesModule` | Batch detail with genealogy, split/merge |
| `/batches/:batchId/edit` | `BatchFormComponent` | `BatchesModule` | Edit batch |
| `/holds` | `HoldListComponent` | `HoldsModule` | Active holds list with entity type filter |
| `/holds/new` | `HoldFormComponent` | `HoldsModule` | Apply hold form |
| `/holds/:id` | `HoldDetailComponent` | `HoldsModule` | Hold detail with release action |
| `/equipment` | `EquipmentListComponent` | `EquipmentModule` | Equipment list with status filters |
| `/equipment/new` | `EquipmentFormComponent` | `EquipmentModule` | Create equipment |
| `/equipment/:id` | `EquipmentDetailComponent` | `EquipmentModule` | Equipment detail with maintenance/hold actions |
| `/equipment/:id/edit` | `EquipmentFormComponent` | `EquipmentModule` | Edit equipment |
| `/operations` | `OperationListComponent` | `OperationsModule` | Operations list with status/type filters |
| `/operations/:id` | `OperationDetailComponent` | `OperationsModule` | Operation detail with block/unblock actions |
| `/profile` | `ProfileComponent` | `ProfileModule` | User profile view |
| `/change-password` | `ChangePasswordComponent` | `ChangePasswordModule` | Change current user password |
| `/reports` | `ReportsLandingComponent` | `ReportsModule` | Reports hub with navigation tiles |
| `/reports/production` | `ProductionSummaryComponent` | `ReportsModule` | Production summary report with date range |
| `/reports/scrap` | `ScrapAnalysisComponent` | `ReportsModule` | Scrap analysis by product and operation |
| `/reports/inventory` | `InventoryBalanceComponent` | `ReportsModule` | Inventory balance by type and state |
| `/reports/orders` | `OrderFulfillmentComponent` | `ReportsModule` | Order fulfillment status report |
| `/reports/operations` | `OperationsReportComponent` | `ReportsModule` | Operation cycle times report |
| `/reports/executive` | `ExecutiveDashboardComponent` | `ReportsModule` | Executive dashboard combining all reports |

### Admin Layout Routes (Header + Sidebar + Content)

These routes are children of `AdminLayoutComponent` and require `AuthGuard`. All prefixed with `/manage`.

| URL Path | Component | Module | Description |
|----------|-----------|--------|-------------|
| `/manage` | `ManageLandingComponent` | SharedModule | Tile-based navigation to admin sections |

#### Master Data

| URL Path | Component | Module | Description |
|----------|-----------|--------|-------------|
| `/manage/customers` | `CustomerListComponent` | `CustomersModule` | Paginated customer list |
| `/manage/customers/new` | `CustomerFormComponent` | `CustomersModule` | Create customer |
| `/manage/customers/:id` | `CustomerDetailComponent` | `CustomersModule` | Customer detail |
| `/manage/customers/:id/edit` | `CustomerFormComponent` | `CustomersModule` | Edit customer |
| `/manage/materials` | `MaterialListComponent` | `MaterialsModule` | Paginated material list |
| `/manage/materials/new` | `MaterialFormComponent` | `MaterialsModule` | Create material |
| `/manage/materials/:id` | `MaterialDetailComponent` | `MaterialsModule` | Material detail |
| `/manage/materials/:id/edit` | `MaterialFormComponent` | `MaterialsModule` | Edit material |
| `/manage/products` | `ProductListComponent` | `ProductsModule` | Paginated product list |
| `/manage/products/new` | `ProductFormComponent` | `ProductsModule` | Create product |
| `/manage/products/:id` | `ProductDetailComponent` | `ProductsModule` | Product detail |
| `/manage/products/:id/edit` | `ProductFormComponent` | `ProductsModule` | Edit product |

#### Production Configuration

| URL Path | Component | Module | Description |
|----------|-----------|--------|-------------|
| `/manage/processes` | Redirect to `list` | `ProcessesModule` | -- |
| `/manage/processes/list` | `ProcessListComponent` | `ProcessesModule` | Process definitions list |
| `/manage/processes/quality-pending` | `QualityPendingComponent` | `ProcessesModule` | Quality pending queue |
| `/manage/processes/new` | `ProcessFormComponent` | `ProcessesModule` | Create process |
| `/manage/processes/:id` | `ProcessDetailComponent` | `ProcessesModule` | Process detail |
| `/manage/processes/:id/edit` | `ProcessFormComponent` | `ProcessesModule` | Edit process |
| `/manage/routing` | `RoutingListComponent` | `RoutingModule` | Routing definitions list |
| `/manage/routing/new` | `RoutingFormComponent` | `RoutingModule` | Create routing |
| `/manage/routing/:id` | `RoutingDetailComponent` | `RoutingModule` | Routing detail with steps |
| `/manage/routing/:id/edit` | `RoutingFormComponent` | `RoutingModule` | Edit routing |
| `/manage/operation-templates` | `OperationTemplateListComponent` | `OperationTemplatesModule` | Operation template list |
| `/manage/operation-templates/new` | `OperationTemplateFormComponent` | `OperationTemplatesModule` | Create template |
| `/manage/operation-templates/:id` | `OperationTemplateDetailComponent` | `OperationTemplatesModule` | Template detail |
| `/manage/operation-templates/:id/edit` | `OperationTemplateFormComponent` | `OperationTemplatesModule` | Edit template |
| `/manage/equipment` | `EquipmentListComponent` | `EquipmentModule` | Equipment management (shared module) |
| `/manage/equipment/new` | `EquipmentFormComponent` | `EquipmentModule` | Create equipment |
| `/manage/equipment/:id` | `EquipmentDetailComponent` | `EquipmentModule` | Equipment detail |
| `/manage/equipment/:id/edit` | `EquipmentFormComponent` | `EquipmentModule` | Edit equipment |
| `/manage/operators` | `OperatorListComponent` | `OperatorsModule` | Operators list |
| `/manage/operators/new` | `OperatorFormComponent` | `OperatorsModule` | Create operator |
| `/manage/operators/:id` | `OperatorDetailComponent` | `OperatorsModule` | Operator detail |
| `/manage/operators/:id/edit` | `OperatorFormComponent` | `OperatorsModule` | Edit operator |
| `/manage/bom` | `BomListComponent` | `BomModule` | BOM product list |
| `/manage/bom/create` | `BomNodeFormComponent` | `BomModule` | Create BOM node |
| `/manage/bom/:productSku/tree` | `BomTreeComponent` | `BomModule` | Hierarchical BOM tree view |
| `/manage/bom/:productSku/node/new` | `BomNodeFormComponent` | `BomModule` | Add BOM node to product |
| `/manage/bom/:productSku/node/:bomId/edit` | `BomNodeFormComponent` | `BomModule` | Edit BOM node |

#### Configuration

| URL Path | Component | Module | Description |
|----------|-----------|--------|-------------|
| `/manage/config` | Redirect to `hold-reasons` | `ConfigModule` | -- |
| `/manage/config/hold-reasons` | `HoldReasonsListComponent` | `ConfigModule` | Hold reasons list |
| `/manage/config/hold-reasons/new` | `HoldReasonsFormComponent` | `ConfigModule` | Create hold reason |
| `/manage/config/hold-reasons/:id/edit` | `HoldReasonsFormComponent` | `ConfigModule` | Edit hold reason |
| `/manage/config/delay-reasons` | `DelayReasonsListComponent` | `ConfigModule` | Delay reasons list |
| `/manage/config/delay-reasons/new` | `DelayReasonsFormComponent` | `ConfigModule` | Create delay reason |
| `/manage/config/delay-reasons/:id/edit` | `DelayReasonsFormComponent` | `ConfigModule` | Edit delay reason |
| `/manage/config/process-params` | `ProcessParamsListComponent` | `ConfigModule` | Process parameters list |
| `/manage/config/process-params/new` | `ProcessParamsFormComponent` | `ConfigModule` | Create process parameter |
| `/manage/config/process-params/:id/edit` | `ProcessParamsFormComponent` | `ConfigModule` | Edit process parameter |
| `/manage/config/batch-number` | `BatchNumberListComponent` | `ConfigModule` | Batch number configs list |
| `/manage/config/batch-number/new` | `BatchNumberFormComponent` | `ConfigModule` | Create batch number config |
| `/manage/config/batch-number/:id/edit` | `BatchNumberFormComponent` | `ConfigModule` | Edit batch number config |
| `/manage/config/quantity-type` | `QuantityTypeListComponent` | `ConfigModule` | Quantity type configs list |
| `/manage/config/quantity-type/new` | `QuantityTypeFormComponent` | `ConfigModule` | Create quantity type config |
| `/manage/config/quantity-type/:id/edit` | `QuantityTypeFormComponent` | `ConfigModule` | Edit quantity type config |
| `/manage/config/batch-size` | `BatchSizeListComponent` | `ConfigModule` | Batch size configs list |
| `/manage/config/batch-size/new` | `BatchSizeFormComponent` | `ConfigModule` | Create batch size config |
| `/manage/config/batch-size/:id/edit` | `BatchSizeFormComponent` | `ConfigModule` | Edit batch size config |

#### System

| URL Path | Component | Module | Description |
|----------|-----------|--------|-------------|
| `/manage/users` | `UserListComponent` | `UsersModule` | User list |
| `/manage/users/new` | `UserFormComponent` | `UsersModule` | Create user |
| `/manage/users/:id` | `UserDetailComponent` | `UsersModule` | User detail |
| `/manage/users/:id/edit` | `UserFormComponent` | `UsersModule` | Edit user |
| `/manage/audit` | `AuditListComponent` | `AuditModule` | Audit trail list with filters |

---

## Layout Architecture

### No Layout (Standalone)

- **Login page** (`/login`) -- Renders without any layout wrapper.

### MainLayoutComponent

- **Selector:** `app-main-layout`
- **Structure:** `<app-header>` + `<app-breadcrumb>` + `<router-outlet>`
- **Used by:** All operational pages (dashboard, orders, production, inventory, batches, holds, equipment, operations, reports, profile, change-password)
- **No inputs/outputs** -- purely structural wrapper.

### AdminLayoutComponent

- **Selector:** `app-admin-layout`
- **Structure:** `<app-header>` + sidebar navigation + `<router-outlet>`
- **Used by:** All `/manage/*` admin/configuration pages
- **Sidebar Groups:**

| Group | Items |
|-------|-------|
| **Master Data** | Customers, Products, Materials |
| **Production** | Processes, Routing, Operation Templates, Equipment, Operators, Bill of Materials |
| **Configuration** | Hold Reasons, Delay Reasons, Process Parameters, Batch Number, Batch Size, Quantity Types |
| **System** | Users, Audit Trail |

- **Behavior:** Listens to `NavigationEnd` events to auto-expand the sidebar group containing the active route. Groups are collapsible.

### ManageLandingComponent

- **Selector:** `app-manage-landing`
- **Route:** `/manage` (exact path match)
- **Purpose:** Tile-based navigation dashboard for the admin area. Displays grouped tiles linking to admin sections.

---

## Feature Modules

All feature modules are **lazy-loaded** via `loadChildren` in the app routing module.

### AuthModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/login` |
| **Components** | `LoginComponent` |
| **Layout** | None |
| **Auth required** | No |
| **Key features** | Email/password login form, JWT token storage, redirect to dashboard |

### DashboardModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/dashboard` |
| **Components** | `DashboardComponent` |
| **Layout** | MainLayout |
| **Key features** | KPI cards (orders, operations, holds, confirmations, quality pending), recent production activity table, audit activity feed, ECharts visualizations |
| **Services used** | `ApiService.getDashboardSummary()` |

### OrdersModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/orders` |
| **Components** | `OrderListComponent`, `OrderDetailComponent`, `OrderFormComponent` |
| **Layout** | MainLayout |
| **Key features** | Paginated list with search/status filter, order create/edit form with dynamic line items, order detail showing line items with operations timeline, delete (soft-delete to CANCELLED) |
| **Services used** | `ApiService.getOrdersPaged()`, `getOrderById()`, `createOrder()`, `updateOrder()`, `deleteOrder()`, `addOrderLineItem()`, `updateOrderLineItem()`, `deleteOrderLineItem()` |

### ProductionModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/production` |
| **Components** | `ProductionLandingComponent`, `ProductionConfirmComponent`, `ProductionHistoryComponent` |
| **Layout** | MainLayout |
| **Key features** | Landing page with available operations for confirmation, production confirmation form (material consumption, equipment/operator selection, process parameters, batch number preview, BOM suggested consumption), partial confirmation support, confirmation history with reversal support (R-13: Reverse button, reversal dialog with reason/notes, reversed status badge with purple theme, reversal info display) |
| **Services used** | `ApiService.getAvailableOrders()`, `getOperationDetails()`, `confirmProduction()`, `getAvailableInventory()`, `getSuggestedConsumption()`, `previewBatchNumber()`, `getAvailableEquipment()`, `getActiveOperators()`, `getProcessParameters()`, `checkBatchSizeConfig()`, `canReverseConfirmation()`, `reverseConfirmation()` |

### InventoryModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/inventory` |
| **Components** | `InventoryListComponent`, `InventoryFormComponent`, `InventoryDetailComponent`, `ReceiveMaterialComponent` |
| **Layout** | MainLayout |
| **Key features** | Paginated list with state/type/search filters, block/unblock/scrap actions, reserve/release reservation, receive material (goods receipt creating Batch + Inventory), CRUD operations |
| **Services used** | `ApiService.getInventoryPaged()`, `getInventoryById()`, `createInventory()`, `updateInventory()`, `deleteInventory()`, `blockInventory()`, `unblockInventory()`, `scrapInventory()`, `reserveInventory()`, `releaseReservation()`, `receiveMaterial()` |

### BatchesModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/batches` |
| **Components** | `BatchListComponent`, `BatchDetailComponent`, `BatchFormComponent` |
| **Layout** | MainLayout |
| **Key features** | Paginated list with status filter, batch detail with genealogy tree (parent/child), split and merge operations, quality approval/rejection workflow, quantity adjustment with audit, batch number preview, CRUD |
| **Services used** | `ApiService.getBatchesPaged()`, `getBatchById()`, `getBatchGenealogy()`, `splitBatch()`, `mergeBatches()`, `approveBatch()`, `rejectBatch()`, `adjustBatchQuantity()`, `getBatchAdjustmentHistory()`, `createBatch()`, `updateBatch()`, `deleteBatch()` |

### HoldsModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/holds` |
| **Components** | `HoldListComponent`, `HoldFormComponent`, `HoldDetailComponent` |
| **Layout** | MainLayout |
| **Key features** | Paginated list with entity type/status filters, apply hold form with reason selection, hold detail with release action, supports entity types: ORDER, OPERATION, BATCH, INVENTORY, EQUIPMENT |
| **Services used** | `ApiService.getHoldsPaged()`, `getHoldById()`, `applyHold()`, `releaseHold()`, `getHoldReasons()`, `checkEntityOnHold()` |

### EquipmentModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/equipment` (Main) and `/manage/equipment` (Admin) |
| **Components** | `EquipmentListComponent`, `EquipmentFormComponent`, `EquipmentDetailComponent` |
| **Layout** | MainLayout or AdminLayout |
| **Key features** | Paginated list with status/type filters, CRUD operations, maintenance start/end workflow, hold/release actions, equipment category support |
| **Services used** | `ApiService.getEquipmentPaged()`, `getEquipmentById()`, `createEquipment()`, `updateEquipment()`, `deleteEquipment()`, `startEquipmentMaintenance()`, `endEquipmentMaintenance()`, `putEquipmentOnHold()`, `releaseEquipmentFromHold()` |

### OperationsModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/operations` |
| **Components** | `OperationListComponent`, `OperationDetailComponent` |
| **Layout** | MainLayout |
| **Key features** | Paginated list with status/type/search filters, operation detail with block/unblock/pause/resume actions, link to production confirmation |
| **Services used** | `ApiService.getOperationsPaged()`, `getOperationById()`, `blockOperation()`, `unblockOperation()`, `pauseOperation()`, `resumeOperation()` |

### ProfileModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/profile` |
| **Components** | `ProfileComponent` |
| **Layout** | MainLayout |
| **Key features** | Display current user information |
| **Services used** | `AuthService.currentUser$` |

### ChangePasswordModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/change-password` |
| **Components** | `ChangePasswordComponent` |
| **Layout** | MainLayout |
| **Key features** | Reactive form for current/new password, validation |
| **Services used** | `ApiService.changePassword()` |

### ReportsModule

| Property | Value |
|----------|-------|
| **Path prefix** | `/reports` |
| **Components** | `ReportsLandingComponent`, `ProductionSummaryComponent`, `ScrapAnalysisComponent`, `InventoryBalanceComponent`, `OrderFulfillmentComponent`, `OperationsReportComponent`, `ExecutiveDashboardComponent` |
| **Layout** | MainLayout |
| **Key features** | Reports hub with navigation tiles, date-range production summary, scrap analysis by product/operation, inventory balance by type/state, order fulfillment overview, operation cycle times, executive dashboard combining all metrics, ECharts visualizations |
| **Services used** | `ApiService.getProductionSummary()`, `getProductionByOperation()`, `getScrapAnalysis()`, `getOrderFulfillment()`, `getInventoryBalance()`, `getOperationCycleTimes()`, `getHoldAnalysis()`, `getExecutiveDashboard()` |

### CustomersModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/customers` |
| **Components** | `CustomerListComponent`, `CustomerFormComponent`, `CustomerDetailComponent` |
| **Layout** | AdminLayout |
| **Key features** | Paginated customer list with search, CRUD operations, activate/deactivate (soft delete to INACTIVE) |
| **Services used** | `ApiService.getCustomersPaged()`, `getCustomerById()`, `createCustomer()`, `updateCustomer()`, `deleteCustomer()`, `activateCustomer()` |

### MaterialsModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/materials` |
| **Components** | `MaterialListComponent`, `MaterialFormComponent`, `MaterialDetailComponent` |
| **Layout** | AdminLayout |
| **Key features** | Paginated material list with type/search filters, CRUD with extended fields (cost, inventory levels, logistics), material types: RM/IM/FG/WIP |
| **Services used** | `ApiService.getMaterialsPaged()`, `getMaterialById()`, `createMaterial()`, `updateMaterial()`, `deleteMaterial()`, `activateMaterial()` |

### ProductsModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/products` |
| **Components** | `ProductListComponent`, `ProductFormComponent`, `ProductDetailComponent` |
| **Layout** | AdminLayout |
| **Key features** | Paginated product list with search, CRUD with extended fields (pricing, weight, order management), material linkage |
| **Services used** | `ApiService.getProductsPaged()`, `getProductById()`, `createProduct()`, `updateProduct()`, `deleteProduct()`, `activateProduct()` |

### ProcessesModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/processes` |
| **Components** | `ProcessListComponent`, `ProcessDetailComponent`, `ProcessFormComponent`, `QualityPendingComponent` |
| **Layout** | AdminLayout |
| **Key features** | Process definition CRUD (design-time), process status management (DRAFT/ACTIVE/INACTIVE), quality pending queue, versioning |
| **Services used** | `ApiService.getProcessesPaged()`, `getProcessById()`, `createProcess()`, `updateProcess()`, `deleteProcess()`, `activateProcess()`, `deactivateProcess()` |

### RoutingModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/routing` |
| **Components** | `RoutingListComponent`, `RoutingDetailComponent`, `RoutingFormComponent` |
| **Layout** | AdminLayout |
| **Key features** | Routing definition CRUD, routing steps management, step reordering, routing activation/deactivation/hold, process linkage |
| **Services used** | `ApiService.getRoutingsPaged()`, `getRoutingById()`, `createRouting()`, `updateRouting()`, `deleteRouting()`, `activateRouting()`, `deactivateRouting()`, `putRoutingOnHold()`, `releaseRoutingFromHold()`, `createRoutingStep()`, `updateRoutingStep()`, `deleteRoutingStep()`, `reorderRoutingSteps()` |

### OperationTemplatesModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/operation-templates` |
| **Components** | `OperationTemplateListComponent`, `OperationTemplateFormComponent`, `OperationTemplateDetailComponent` |
| **Layout** | AdminLayout |
| **Key features** | Operation template CRUD (design-time), operation types and quantity types configuration, referenced by routing steps |
| **Services used** | `ApiService.getOperationTemplatesPaged()`, `getOperationTemplateById()`, `createOperationTemplate()`, `updateOperationTemplate()`, `deleteOperationTemplate()`, `activateOperationTemplate()`, `deactivateOperationTemplate()`, `getOperationTypes()` |

### OperatorsModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/operators` |
| **Components** | `OperatorListComponent`, `OperatorFormComponent`, `OperatorDetailComponent` |
| **Layout** | AdminLayout |
| **Key features** | Operator CRUD, activate/deactivate, department and shift assignment |
| **Services used** | `ApiService.getOperatorsPaged()`, `getOperatorById()`, `createOperator()`, `updateOperator()`, `deleteOperator()`, `activateOperator()` |

### BomModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/bom` |
| **Components** | `BomListComponent`, `BomTreeComponent`, `BomNodeFormComponent` |
| **Layout** | AdminLayout |
| **Key features** | Paginated product BOM list, hierarchical tree visualization, node CRUD (create/edit/move/delete/cascade delete), version management, BOM settings update |
| **Services used** | `ApiService.getBomProductsPaged()`, `getBomTree()`, `getBomNode()`, `createBomNode()`, `createBomTree()`, `updateBomNode()`, `moveBomNode()`, `deleteBomNode()`, `deleteBomNodeCascade()`, `deleteBomTree()`, `getBomVersions()`, `updateBomSettings()` |

### ConfigModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/config` |
| **Components** | `HoldReasonsListComponent`, `HoldReasonsFormComponent`, `DelayReasonsListComponent`, `DelayReasonsFormComponent`, `ProcessParamsListComponent`, `ProcessParamsFormComponent`, `BatchNumberListComponent`, `BatchNumberFormComponent`, `QuantityTypeListComponent`, `QuantityTypeFormComponent`, `BatchSizeListComponent`, `BatchSizeFormComponent` |
| **Layout** | AdminLayout |
| **Key features** | Configuration CRUD for 6 config types: hold reasons, delay reasons, process parameters (with min/max/required), batch number generation (prefix/date/sequence), quantity types (precision/rounding), batch size constraints |
| **Services used** | `ApiService.getHoldReasonsPaged()`, `createHoldReason()`, `updateHoldReason()`, `deleteHoldReason()`, `getDelayReasonsPaged()`, `createDelayReason()`, `updateDelayReason()`, `deleteDelayReason()`, `getProcessParamsPaged()`, `createProcessParam()`, `updateProcessParam()`, `deleteProcessParam()`, `getBatchNumberConfigsPaged()`, `createBatchNumberConfig()`, `updateBatchNumberConfig()`, `deleteBatchNumberConfig()`, `getQuantityTypeConfigsPaged()`, `createQuantityTypeConfig()`, `updateQuantityTypeConfig()`, `deleteQuantityTypeConfig()`, `getBatchSizeConfigsPaged()`, `createBatchSizeConfig()`, `updateBatchSizeConfig()`, `deleteBatchSizeConfig()` |

### UsersModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/users` |
| **Components** | `UserListComponent`, `UserFormComponent`, `UserDetailComponent` |
| **Layout** | AdminLayout |
| **Key features** | User CRUD, activate/deactivate, password reset, role management |
| **Services used** | `ApiService.getUsersPaged()`, `getUserById()`, `createUser()`, `updateUser()`, `deleteUser()`, `activateUser()`, `deactivateUser()`, `resetPassword()` |

### AuditModule (Admin)

| Property | Value |
|----------|-------|
| **Path prefix** | `/manage/audit` |
| **Components** | `AuditListComponent` |
| **Layout** | AdminLayout |
| **Key features** | Paginated audit trail with entity type/action type/date range/user filters, field-level change tracking (old value / new value) |
| **Services used** | `ApiService.getAuditPaged()`, `getAuditEntityTypes()`, `getAuditActionTypes()`, `getAuditSummary()` |

---

## Shared Components

All shared components are declared and exported by `SharedModule` (`frontend/src/app/shared/shared.module.ts`).

### HeaderComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-header` |
| **File** | `shared/components/header/header.component.ts` |
| **Inputs** | None |
| **Outputs** | None |
| **Description** | Global navigation header with main nav links, dropdown menus (Orders & Production, Manufacturing, Inventory & Batches, Quality), user profile dropdown (profile, change password, logout), mobile responsive with hamburger menu |
| **Services** | `AuthService` (current user, logout), `Router` (active route detection) |
| **Active state methods** | `isOrdersActive()` (orders/production), `isManufacturingActive()` (operations/equipment), `isInventoryActive()` (inventory/batches), `isQualityActive()` (holds) |

### MainLayoutComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-main-layout` |
| **File** | `shared/components/main-layout/main-layout.component.ts` |
| **Inputs** | None |
| **Outputs** | None |
| **Description** | Wrapper layout providing `<app-header>` + `<app-breadcrumb>` + `<router-outlet>` for main operational pages |

### AdminLayoutComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-admin-layout` |
| **File** | `shared/components/admin-layout/admin-layout.component.ts` |
| **Inputs** | None |
| **Outputs** | None |
| **Description** | Wrapper layout providing `<app-header>` + collapsible sidebar navigation + `<router-outlet>` for admin pages. Sidebar organized into 4 groups: Master Data, Production, Configuration, System. Auto-expands active group on navigation. |
| **Services** | `Router` (active route detection for sidebar highlighting) |

### ManageLandingComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-manage-landing` |
| **File** | `shared/components/manage-landing/manage-landing.component.ts` |
| **Inputs** | None |
| **Outputs** | None |
| **Description** | Tile-based navigation page displayed at `/manage`. Shows colored icon tiles grouped by: Master Data (Customers, Products, Materials), Production (Equipment, Operators, Bill of Materials), System (Configuration, Audit Trail). |

### PaginationComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-pagination` |
| **File** | `shared/components/pagination/pagination.component.ts` |
| **Inputs** | `page: number` (current page, 0-indexed), `size: number` (page size, default 20), `totalElements: number`, `totalPages: number`, `hasNext: boolean`, `hasPrevious: boolean` |
| **Outputs** | `pageChange: EventEmitter<number>` (emits target page number), `sizeChange: EventEmitter<number>` (emits new page size) |
| **Description** | Reusable pagination controls with first/prev/next/last buttons, numbered page links (max 5 visible), page size dropdown (10/20/50/100), "Showing X-Y of Z" display. Used by all paginated list pages. |

### BreadcrumbComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-breadcrumb` |
| **File** | `shared/components/breadcrumb/breadcrumb.component.ts` |
| **Inputs** | None |
| **Outputs** | None |
| **Description** | Renders breadcrumb trail based on current route. Subscribes to `BreadcrumbService.breadcrumbs$`. Automatically generates breadcrumbs from URL segments with configurable labels and icons. Supports dynamic entity labels (e.g., "Order #5"). |
| **Services** | `BreadcrumbService` |

### LoadingSpinnerComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-loading-spinner` |
| **File** | `shared/components/loading-spinner/loading-spinner.component.ts` |
| **Inputs** | `message: string` (default: `'Loading...'`) |
| **Outputs** | None |
| **Description** | Displays a centered loading spinner with customizable message text. |

### StatusBadgeComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-status-badge` |
| **File** | `shared/components/status-badge/status-badge.component.ts` |
| **Inputs** | `status: string` |
| **Outputs** | None |
| **Description** | Renders a colored badge for any status value. Converts status to CSS class (e.g., `QUALITY_PENDING` becomes `badge-quality-pending`). Displays status with underscores replaced by spaces. |

### MaterialSelectionModalComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-material-selection-modal` |
| **File** | `shared/components/material-selection-modal/material-selection-modal.component.ts` |
| **Inputs** | `isOpen: boolean`, `availableInventory: InventoryItem[]`, `selectedMaterials: MaterialSelection[]` |
| **Outputs** | `close: EventEmitter<void>`, `selectionChange: EventEmitter<MaterialSelection[]>` |
| **Description** | Modal dialog for selecting input materials during production confirmation. Features: search by batch number or material ID, filter by material type prefix (RM/IM/FG/WIP), bulk select all / clear all, per-item quantity input with min/max validation, selection summary with count and total quantity, backdrop click to cancel. |

**Local interfaces:**

```typescript
interface InventoryItem {
  inventoryId: number; batchId: number; batchNumber: string;
  materialId: string; materialName?: string; quantity: number;
  unit: string; state: string; location?: string;
}

interface MaterialSelection {
  inventoryId: number; batchId: number; batchNumber: string;
  materialId: string; availableQuantity: number; quantityToConsume: number;
}
```

### ApplyHoldModalComponent

| Property | Value |
|----------|-------|
| **Selector** | `app-apply-hold-modal` |
| **File** | `shared/components/apply-hold-modal/apply-hold-modal.component.ts` |
| **Inputs** | `isOpen: boolean`, `entityType: EntityType` (one of `'ORDER' | 'OPERATION' | 'BATCH' | 'INVENTORY' | 'EQUIPMENT'`), `entityId: number`, `entityName: string` |
| **Outputs** | `close: EventEmitter<void>`, `holdApplied: EventEmitter<any>` |
| **Description** | Modal dialog for applying holds to entities. Loads hold reasons from API on open, displays entity info and impact warning, requires reason selection with optional comments, shows success state with 1.5s auto-close delay, handles API errors with user-friendly messages. Uses reactive form with `FormBuilder`. |
| **Services** | `ApiService.getHoldReasons()`, `ApiService.applyHold()` |

---

## Models / Interfaces

All TypeScript interfaces are located in `frontend/src/app/shared/models/` and re-exported from `index.ts`.

### Pagination (`pagination.model.ts`)

| Interface | Fields | Description |
|-----------|--------|-------------|
| `PagedResponse<T>` | `content: T[]`, `page`, `size`, `totalElements`, `totalPages`, `first`, `last`, `hasNext`, `hasPrevious`, `sortBy?`, `sortDirection?`, `filterValue?` | Generic server-side paginated response |
| `PageRequest` | `page?`, `size?`, `sortBy?`, `sortDirection?: 'ASC' | 'DESC'`, `search?`, `status?`, `type?`, `category?`, `dateFrom?`, `dateTo?` | Request parameters for paginated endpoints |
| `SortConfig` | `field`, `direction: 'ASC' | 'DESC'` | Column sort configuration |
| `PaginationState` | `page`, `size`, `totalElements`, `totalPages`, `sort?`, `search?`, `filters?` | Component-level pagination state |

**Constants:** `DEFAULT_PAGE_SIZE = 20`, `PAGE_SIZE_OPTIONS = [10, 20, 50, 100]`
**Utility:** `toQueryParams(request: PageRequest)` -- converts to HTTP params, `emptyPagedResponse<T>()` -- creates empty response

### Dashboard (`dashboard.model.ts`)

| Interface | Fields |
|-----------|--------|
| `DashboardSummary` | `totalOrders`, `ordersInProgress`, `operationsReady`, `operationsInProgress`, `activeHolds`, `todayConfirmations`, `qualityPendingProcesses`, `batchesPendingApproval`, `recentActivity[]`, `auditActivity[]` |
| `RecentActivity` | `confirmationId`, `operationName`, `productSku`, `producedQty`, `operatorName`, `confirmedAt`, `batchNumber` |
| `AuditActivity` | `auditId`, `entityType`, `entityId`, `action`, `description`, `changedBy`, `timestamp` |
| `OrderSummary` | `total`, `created`, `inProgress`, `completed`, `onHold` |
| `OperationSummary` | `total`, `notStarted`, `ready`, `inProgress`, `confirmed`, `onHold` |

### Order (`order.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Order` | `orderId`, `orderNumber?`, `customerId?`, `customerName?`, `orderDate?`, `deliveryDate?`, `notes?`, `priority?` (1-5), `status`, `lineItems?[]` |
| `OrderLineItem` | `orderLineId`, `productSku`, `productName`, `quantity`, `unit`, `deliveryDate?`, `status`, `operations?[]`, `currentOperation?`, `processes?[]` (legacy), `currentProcess?` (legacy) |

### Batch (`batch.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Batch` | `batchId`, `batchNumber`, `materialId`, `materialName`, `quantity`, `unit`, `state?`, `status`, `createdOn`, `generatedAtOperationId?`, `createdVia?` (`PRODUCTION | SPLIT | MERGE | MANUAL | SYSTEM | RECEIPT`), `supplierBatchNumber?`, `supplierId?`, `expiryDate?`, `approvedBy?`, `approvedOn?`, `rejectionReason?`, `rejectedBy?`, `rejectedOn?` |
| `BatchGenealogy` | `batch`, `parentBatches[]`, `childBatches[]`, `productionInfo?` |
| `ParentBatchInfo` | `batchId`, `batchNumber`, `materialName`, `quantityConsumed`, `unit`, `relationType` |
| `ChildBatchInfo` | `batchId`, `batchNumber`, `materialName`, `quantity`, `unit`, `relationType` |
| `ProductionInfo` | `operationId`, `operationName`, `processName`, `orderId`, `productionDate` |
| `BatchSplitRequest` | `sourceBatchId`, `portions[]`, `reason?` |
| `SplitPortion` | `quantity`, `batchNumberSuffix?` |
| `BatchSplitResponse` | `sourceBatchId`, `sourceBatchNumber`, `originalQuantity`, `remainingQuantity`, `newBatches[]`, `status` |
| `BatchMergeRequest` | `sourceBatchIds[]`, `targetBatchNumber?`, `reason?` |
| `BatchMergeResponse` | `sourceBatches[]`, `mergedBatch`, `totalQuantity`, `status` |
| `BatchStatusUpdateResponse` | `batchId`, `batchNumber`, `previousStatus`, `newStatus`, `message`, `updatedBy`, `updatedOn` |
| `CreateBatchRequest` | `batchNumber`, `materialId`, `materialName?`, `quantity`, `unit?` |
| `UpdateBatchRequest` | `batchNumber?`, `materialId?`, `materialName?`, `unit?`, `status?` (no quantity -- use `AdjustQuantityRequest`) |
| `AdjustQuantityRequest` | `newQuantity`, `reason`, `adjustmentType: 'CORRECTION' | 'INVENTORY_COUNT' | 'DAMAGE' | 'SCRAP_RECOVERY'` |
| `AdjustQuantityResponse` | `batchId`, `batchNumber`, `previousQuantity`, `newQuantity`, `quantityDifference`, `adjustmentType`, `reason`, `adjustedBy`, `adjustedOn`, `message` |
| `QuantityAdjustmentHistory` | `adjustmentId`, `oldQuantity`, `newQuantity`, `difference`, `adjustmentType`, `reason`, `adjustedBy`, `adjustedOn` |
| `BatchNumberPreview` | `previewBatchNumber`, `operationType?`, `productSku?` |

### Inventory (`inventory.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Inventory` | `inventoryId`, `materialId`, `materialName`, `inventoryType` (RM/IM/FG/WIP), `state`, `quantity`, `unit`, `location?`, `batchId?`, `batchNumber?`, `blockReason?`, `blockedBy?`, `blockedOn?`, `scrapReason?`, `scrappedBy?`, `scrappedOn?`, `reservedForOrderId?`, `reservedForOperationId?`, `reservedBy?`, `reservedOn?`, `reservedQty?` |
| `InventoryStateUpdateResponse` | `inventoryId`, `previousState`, `newState`, `message`, `updatedBy`, `updatedOn` |
| `CreateInventoryRequest` | `materialId`, `materialName?`, `inventoryType`, `quantity`, `unit?`, `location?`, `batchId?` |
| `UpdateInventoryRequest` | `materialId?`, `materialName?`, `inventoryType?`, `quantity?`, `unit?`, `location?`, `state?`, `batchId?` |
| `ReceiveMaterialRequest` | `materialId`, `materialName?`, `quantity`, `unit?`, `supplierBatchNumber?`, `supplierId?`, `receivedDate?`, `expiryDate?`, `location?`, `notes?` |
| `ReceiveMaterialResponse` | `batchId`, `batchNumber`, `inventoryId`, `batchStatus`, `inventoryState`, `quantity`, `unit`, `message` |

### Equipment (`equipment.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Equipment` | `equipmentId`, `equipmentCode`, `name`, `equipmentType` (BATCH/CONTINUOUS), `equipmentCategory?` (MELTING/CASTING/ROLLING/FINISHING/COATING/WIRE_ROLLING/PACKAGING/QUALITY/UTILITY/OTHER), `capacity?`, `capacityUnit?`, `location?`, `status`, `maintenanceReason?`, `maintenanceStart?`, `maintenanceBy?`, `expectedMaintenanceEnd?`, `holdReason?`, `holdStart?`, `heldBy?` |
| `EquipmentStatusUpdateResponse` | `equipmentId`, `equipmentCode`, `previousStatus`, `newStatus`, `message`, `updatedBy`, `updatedOn` |

### Operation (`operation.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Operation` | `operationId`, `processId?`, `operationName`, `operationCode`, `operationType`, `sequenceNumber`, `status`, `targetQty?`, `confirmedQty?`, `blockReason?`, `blockedBy?`, `blockedOn?`, `processName?`, `orderNumber?`, `productSku?` |
| `OperationStatusUpdateResponse` | `operationId`, `previousStatus`, `newStatus`, `message`, `updatedBy`, `updatedOn` |
| `OperationBrief` | `operationId`, `operationName`, `operationCode`, `operationType?`, `sequenceNumber`, `status`, `processId?`, `processName?` |

### Process (`process.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Process` | `processId`, `processName`, `status: ProcessStatusType` (DRAFT/ACTIVE/INACTIVE), `createdOn?`, `createdBy?`, `updatedOn?`, `updatedBy?`, `operations?[]` |
| `ProcessSummary` | `processId`, `processName`, `status`, `operations?[]` |

### Hold (`hold.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Hold` | `holdId`, `entityType`, `entityId`, `entityName?`, `reason`, `comments?`, `appliedBy`, `appliedOn`, `releasedBy?`, `releasedOn?`, `releaseComments?`, `status`, `durationMinutes?` |
| `ApplyHoldRequest` | `entityType`, `entityId`, `reason`, `comments?` |
| `ReleaseHoldRequest` | `releaseComments?` |
| `HoldCountResponse` | `activeHolds` |

### Production (`production.model.ts`)

| Interface | Fields |
|-----------|--------|
| `ProductionConfirmationRequest` | `operationId`, `materialsConsumed[]`, `producedQty`, `scrapQty?`, `startTime`, `endTime`, `equipmentIds[]`, `operatorIds[]`, `delayMinutes?`, `delayReason?`, `processParameters?`, `notes?`, `saveAsPartial?` |
| `MaterialConsumption` | `batchId`, `inventoryId`, `quantity` |
| `ProductionConfirmationResponse` | `confirmationId`, `operationId`, `operationName`, `producedQty`, `scrapQty?`, `startTime`, `endTime`, `delayMinutes?`, `delayReason?`, `processParameters?`, `notes?`, `status`, `createdOn`, `isPartial?`, `remainingQty?`, `rejectionReason?`, `reversedBy?`, `reversedOn?`, `reversalReason?`, `outputBatch?`, `outputBatches?[]`, `batchCount?`, `hasPartialBatch?`, `nextOperation?`, `equipment?[]`, `operators?[]`, `materialsConsumed?[]` |
| `ProductionReversalResponse` | `confirmationId`, `previousStatus`, `newStatus`, `message`, `reversedBy`, `reversedOn`, `restoredInventoryIds[]`, `restoredBatchIds[]`, `scrappedOutputBatchIds[]`, `operationId`, `operationNewStatus`, `nextOperationId?`, `nextOperationNewStatus?` |
| `CanReverseResponse` | `canReverse`, `blockers[]`, `currentStatus`, `statusAllowsReversal`, `outputBatchCount` |
| `BatchInfo` | `batchId`, `batchNumber`, `materialId`, `materialName`, `quantity`, `unit` |
| `NextOperationInfo` | `operationId`, `operationName`, `status`, `processName` |

### BOM (`bom.model.ts`)

| Interface | Fields |
|-----------|--------|
| `BomRequirement` | `bomId`, `productSku`, `materialId`, `materialName`, `quantityRequired`, `unit`, `yieldLossRatio?`, `sequenceLevel` |
| `BomValidationRequest` | `productSku`, `targetQuantity`, `materialsConsumed[]` |
| `BomValidationResult` | `valid`, `productSku`, `requirementChecks[]`, `warnings[]`, `errors[]` |
| `SuggestedConsumptionResponse` | `operationId`, `operationName`, `productSku`, `targetQuantity`, `suggestedMaterials[]`, `totalRequiredQuantity` |
| `SuggestedMaterial` | `materialId`, `materialName`, `requiredQuantity`, `unit`, `yieldLossRatio`, `availableQuantity`, `availableBatches[]`, `sufficientStock` |
| `BomTreeNode` | `bomId`, `productSku`, `bomVersion`, `materialId`, `materialName`, `quantityRequired`, `unit`, `yieldLossRatio?`, `sequenceLevel`, `parentBomId?`, `status`, `children[]` |
| `BomTreeFullResponse` | `productSku`, `bomVersion`, `tree[]`, `totalNodes`, `maxDepth` |
| `CreateBomNodeRequest` | `productSku`, `bomVersion?`, `materialId`, `materialName`, `quantityRequired`, `unit`, `yieldLossRatio?`, `sequenceLevel?`, `parentBomId?` |
| `BomProductSummary` | `productSku`, `bomVersion`, `totalNodes`, `maxLevel`, `status` |
| `UpdateBomSettingsRequest` | `newProductSku?`, `bomVersion?`, `status?` |

### Batch Allocation (`batch-allocation.model.ts`)

| Interface | Fields |
|-----------|--------|
| `AllocationInfo` | `allocationId`, `batchId`, `batchNumber`, `materialId`, `materialName`, `orderLineId`, `orderId`, `productSku`, `productName`, `allocatedQty`, `unit`, `timestamp`, `status`, `createdBy` |
| `AllocateRequest` | `batchId`, `orderLineId`, `quantity` |
| `BatchAvailability` | `batchId`, `batchNumber`, `totalQuantity`, `allocatedQuantity`, `availableQuantity`, `fullyAllocated` |

### Customer (`customer.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Customer` | `customerId`, `customerCode`, `customerName`, `contactPerson?`, `email?`, `phone?`, `address?`, `city?`, `country?`, `taxId?`, `status: 'ACTIVE' | 'INACTIVE'`, `createdOn?`, `updatedOn?` |
| `CreateCustomerRequest` | `customerCode`, `customerName`, `contactPerson?`, `email?`, `phone?`, `address?`, `city?`, `country?`, `taxId?` |
| `UpdateCustomerRequest` | `customerName`, `contactPerson?`, `email?`, `phone?`, `address?`, `city?`, `country?`, `taxId?`, `status?` |

### Material (`material.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Material` | `materialId`, `materialCode`, `materialName`, `materialType: MaterialType` (RM/IM/FG/WIP), `description?`, `baseUnit`, `status`, `materialGroup?`, `sku?`, `standardCost?`, `costCurrency?`, `minStockLevel?`, `maxStockLevel?`, `reorderPoint?`, `leadTimeDays?`, `shelfLifeDays?`, `storageConditions?`, `createdOn?`, `createdBy?`, `updatedOn?`, `updatedBy?` |
| `CreateMaterialRequest` | `materialCode`, `materialName`, `materialType`, `description?`, `baseUnit`, plus optional extended fields |
| `UpdateMaterialRequest` | `materialName?`, `materialType?`, `description?`, `baseUnit?`, `status?`, plus optional extended fields |

### Product (`product.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Product` | `productId`, `sku`, `productName`, `description?`, `baseUnit`, `status`, `productCategory?`, `productGroup?`, `weightPerUnit?`, `weightUnit?`, `standardPrice?`, `priceCurrency?`, `minOrderQty?`, `leadTimeDays?`, `materialId?`, `createdOn?`, `createdBy?`, `updatedOn?`, `updatedBy?` |
| `CreateProductRequest` | `sku`, `productName`, `description?`, `baseUnit`, plus optional extended fields |
| `UpdateProductRequest` | `productName?`, `description?`, `baseUnit?`, `status?`, plus optional extended fields |

### Operation Template (`operation-template.model.ts`)

| Interface | Fields |
|-----------|--------|
| `OperationTemplate` | `operationTemplateId`, `operationName`, `operationCode?`, `operationType`, `quantityType`, `defaultEquipmentType?`, `description?`, `estimatedDurationMinutes?`, `status: 'ACTIVE' | 'INACTIVE'`, `createdOn?`, `createdBy?`, `updatedOn?`, `updatedBy?` |
| `OperationTemplateSummary` | `operationTemplateId`, `operationName`, `operationCode?`, `operationType`, `status` |

**Constants:** `OPERATION_TYPES` (12 types: FURNACE, CASTER, ROLLING, HEAT_TREATMENT, COATING, FINISHING, INSPECTION, CUTTING, WELDING, ASSEMBLY, PACKAGING, GENERAL), `QUANTITY_TYPES` (DISCRETE, BATCH, CONTINUOUS)

### Operator (`operator.model.ts`)

| Interface | Fields |
|-----------|--------|
| `Operator` | `operatorId`, `operatorCode`, `name`, `department?`, `shift?`, `status`, `createdOn?`, `createdBy?`, `updatedOn?`, `updatedBy?` |

### User (`user.model.ts`)

| Interface | Fields |
|-----------|--------|
| `User` | `userId`, `email`, `name`, `employeeId?`, `status`, `lastLogin?`, `createdOn?`, `createdBy?`, `updatedOn?`, `updatedBy?` |
| `CreateUserRequest` | `email`, `name`, `password`, `employeeId?` |
| `UpdateUserRequest` | `name`, `employeeId?`, `status?` |
| `ChangePasswordRequest` | `currentPassword`, `newPassword` |
| `ResetPasswordRequest` | `newPassword` |

### Audit (`audit.model.ts`)

| Interface | Fields |
|-----------|--------|
| `AuditEntry` | `auditId`, `entityType`, `entityId`, `fieldName?`, `oldValue?`, `newValue?`, `action`, `changedBy`, `timestamp` |
| `AuditHistory` | `entityType`, `entityId`, `entries[]`, `totalEntries` |
| `AuditSummary` | `todaysActivityCount`, `recentActivity[]` |

### Config (`config.model.ts`)

| Interface | Fields |
|-----------|--------|
| `HoldReason` | `reasonId`, `reasonCode`, `reasonDescription`, `applicableTo?`, `status`, `createdOn?`, `createdBy?`, `updatedOn?`, `updatedBy?` |
| `DelayReason` | `reasonId`, `reasonCode`, `reasonDescription`, `status`, `createdOn?`, `createdBy?`, `updatedOn?`, `updatedBy?` |
| `ProcessParametersConfig` | `configId`, `operationType`, `productSku?`, `parameterName`, `parameterType`, `unit?`, `minValue?`, `maxValue?`, `defaultValue?`, `isRequired`, `displayOrder`, `status`, `createdOn?`, `createdBy?` |
| `BatchNumberConfig` | `configId`, `configName`, `operationType?`, `productSku?`, `prefix`, `includeOperationCode`, `operationCodeLength`, `separator`, `dateFormat?`, `includeDate`, `sequenceLength`, `sequenceReset`, `priority`, `status`, `createdOn?`, `createdBy?` |
| `QuantityTypeConfig` | `configId`, `configName`, `materialCode?`, `operationType?`, `equipmentType?`, `quantityType`, `decimalPrecision`, `roundingRule`, `minQuantity?`, `maxQuantity?`, `unit?`, `status`, `createdOn?`, `createdBy?` |

### Unit of Measure (`unit-of-measure.model.ts`)

| Interface | Fields |
|-----------|--------|
| `UnitOption` | `value`, `label`, `category: 'weight' | 'count' | 'volume' | 'length' | 'area' | 'packaging'` |

**Constants:** `UNITS_OF_MEASURE` -- 20 standard units across 6 categories (KG, MT, LB, G, PCS, EA, L, ML, GAL, M, CM, MM, FT, IN, M2, M3, BOX, BAG, ROLL, SET)
**Utilities:** `getUnitsByCategory()`, `getUnitLabel()`, `isValidUnit()`

### Report Analytics (`report-analytics.model.ts`)

| Interface | Fields |
|-----------|--------|
| `ProductionSummary` | `startDate`, `endDate`, `totalProduced`, `totalScrap`, `yieldPercentage`, `avgCycleTimeMinutes`, `confirmationCount` |
| `ProductionByOperation` | `startDate`, `endDate`, `entries[]` |
| `ScrapAnalysis` | `startDate`, `endDate`, `totalScrap`, `scrapByProduct[]`, `scrapByOperation[]` |
| `OrderFulfillment` | `totalOrders`, `completedOrders`, `inProgressOrders`, `overdueOrders`, `completionPercentage` |
| `InventoryBalance` | `totalItems`, `totalQuantity`, `byType[]`, `byState[]` |
| `OperationCycleTimes` | `startDate`, `endDate`, `entries[]` |
| `HoldAnalysis` | `totalActiveHolds`, `totalReleasedHolds`, `byEntityType[]`, `topReasons[]` |
| `ExecutiveDashboard` | `productionSummary`, `orderFulfillment`, `inventoryBalance`, `holdAnalysis`, `topCycleTimes[]` |

---

## Core Services

All core services are in `frontend/src/app/core/services/` and provided at root level (`providedIn: 'root'`).

### ApiService (`api.service.ts`)

Central HTTP service for all backend API communication. All methods return `Observable<T>` with typed responses.

#### Orders

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getOrders()` | `Order[]` | `GET /api/orders` |
| `getOrdersPaged(request?)` | `PagedResponse<Order>` | `GET /api/orders/paged` |
| `getAvailableOrders()` | `Order[]` | `GET /api/orders/available` |
| `getOrderById(orderId)` | `Order` | `GET /api/orders/:id` |
| `createOrder(request)` | `Order` | `POST /api/orders` |
| `updateOrder(orderId, request)` | `Order` | `PUT /api/orders/:id` |
| `deleteOrder(orderId)` | `void` | `DELETE /api/orders/:id` |
| `addOrderLineItem(orderId, request)` | `Order` | `POST /api/orders/:id/line-items` |
| `updateOrderLineItem(orderId, lineId, request)` | `Order` | `PUT /api/orders/:id/line-items/:lineId` |
| `deleteOrderLineItem(orderId, lineId)` | `Order` | `DELETE /api/orders/:id/line-items/:lineId` |

#### Production

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getOperationDetails(operationId)` | `Operation` | `GET /api/production/operations/:id` |
| `confirmProduction(request)` | `ProductionConfirmationResponse` | `POST /api/production/confirm` |
| `getConfirmationById(id)` | `ProductionConfirmationResponse` | `GET /api/production/confirmations/:id` |
| `getConfirmationsByStatus(status)` | `ProductionConfirmationResponse[]` | `GET /api/production/confirmations/status/:status` |
| `canReverseConfirmation(confirmationId)` | `CanReverseResponse` | `GET /api/production/confirmations/:id/can-reverse` |
| `reverseConfirmation(confirmationId, reason, notes?)` | `ProductionReversalResponse` | `POST /api/production/confirmations/:id/reverse` |

#### Inventory

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getAllInventory()` | `Inventory[]` | `GET /api/inventory` |
| `getInventoryPaged(request?)` | `PagedResponse<Inventory>` | `GET /api/inventory/paged` |
| `getAvailableInventory(materialId?)` | `Inventory[]` | `GET /api/inventory/available` |
| `getInventoryById(id)` | `Inventory` | `GET /api/inventory/:id` |
| `createInventory(data)` | `Inventory` | `POST /api/inventory` |
| `updateInventory(id, data)` | `Inventory` | `PUT /api/inventory/:id` |
| `deleteInventory(id)` | `InventoryStateUpdateResponse` | `DELETE /api/inventory/:id` |
| `blockInventory(id, reason)` | `InventoryStateUpdateResponse` | `POST /api/inventory/:id/block` |
| `unblockInventory(id)` | `InventoryStateUpdateResponse` | `POST /api/inventory/:id/unblock` |
| `scrapInventory(id, reason)` | `InventoryStateUpdateResponse` | `POST /api/inventory/:id/scrap` |
| `reserveInventory(id, orderId, operationId, qty?)` | `InventoryStateUpdateResponse` | `POST /api/inventory/:id/reserve` |
| `releaseReservation(id)` | `InventoryStateUpdateResponse` | `POST /api/inventory/:id/release-reservation` |
| `receiveMaterial(request)` | `ReceiveMaterialResponse` | `POST /api/inventory/receive-material` |

#### Batches

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getAllBatches()` | `Batch[]` | `GET /api/batches` |
| `getBatchesPaged(request?)` | `PagedResponse<Batch>` | `GET /api/batches/paged` |
| `getBatchById(id)` | `Batch` | `GET /api/batches/:id` |
| `getBatchGenealogy(id)` | `BatchGenealogy` | `GET /api/batches/:id/genealogy` |
| `getAvailableBatches(materialId?)` | `Batch[]` | `GET /api/batches/available` |
| `splitBatch(id, request)` | `BatchSplitResponse` | `POST /api/batches/:id/split` |
| `mergeBatches(request)` | `BatchMergeResponse` | `POST /api/batches/merge` |
| `approveBatch(id)` | `BatchStatusUpdateResponse` | `POST /api/batches/:id/approve` |
| `rejectBatch(id, reason)` | `BatchStatusUpdateResponse` | `POST /api/batches/:id/reject` |
| `createBatch(data)` | `Batch` | `POST /api/batches` |
| `updateBatch(id, data)` | `Batch` | `PUT /api/batches/:id` |
| `deleteBatch(id)` | `BatchStatusUpdateResponse` | `DELETE /api/batches/:id` |
| `adjustBatchQuantity(id, request)` | `AdjustQuantityResponse` | `POST /api/batches/:id/adjust-quantity` |
| `getBatchAdjustmentHistory(id)` | `QuantityAdjustmentHistory[]` | `GET /api/batches/:id/adjustments` |
| `previewBatchNumber(opType?, productSku?)` | `BatchNumberPreview` | `GET /api/batches/preview-number` |

#### Batch Allocations

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `allocateBatchToOrder(request)` | `AllocationInfo` | `POST /api/batch-allocations` |
| `releaseAllocation(id)` | `AllocationInfo` | `PUT /api/batch-allocations/:id/release` |
| `updateAllocationQuantity(id, request)` | `AllocationInfo` | `PUT /api/batch-allocations/:id/quantity` |
| `getBatchAllocations(batchId)` | `AllocationInfo[]` | `GET /api/batch-allocations/batch/:id` |
| `getOrderLineAllocations(orderLineId)` | `AllocationInfo[]` | `GET /api/batch-allocations/order-line/:id` |
| `getBatchAvailability(batchId)` | `BatchAvailability` | `GET /api/batch-allocations/batch/:id/availability` |

#### Equipment

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getAllEquipment()` | `Equipment[]` | `GET /api/master/equipment` |
| `getEquipmentPaged(request?)` | `PagedResponse<Equipment>` | `GET /api/equipment/paged` |
| `getAvailableEquipment()` | `Equipment[]` | `GET /api/master/equipment/available` |
| `getEquipmentById(id)` | `Equipment` | `GET /api/equipment/:id` |
| `createEquipment(data)` | `Equipment` | `POST /api/equipment` |
| `updateEquipment(id, data)` | `Equipment` | `PUT /api/equipment/:id` |
| `deleteEquipment(id)` | `any` | `DELETE /api/equipment/:id` |
| `startEquipmentMaintenance(id, reason, end?)` | `EquipmentStatusUpdateResponse` | `POST /api/equipment/:id/maintenance/start` |
| `endEquipmentMaintenance(id)` | `EquipmentStatusUpdateResponse` | `POST /api/equipment/:id/maintenance/end` |
| `putEquipmentOnHold(id, reason)` | `EquipmentStatusUpdateResponse` | `POST /api/equipment/:id/hold` |
| `releaseEquipmentFromHold(id)` | `EquipmentStatusUpdateResponse` | `POST /api/equipment/:id/release` |

#### Operators

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getAllOperators()` | `Operator[]` | `GET /api/master/operators` |
| `getActiveOperators()` | `Operator[]` | `GET /api/master/operators/active` |
| `getOperatorsPaged(request?)` | `PagedResponse<any>` | `GET /api/operators/paged` |
| `getOperatorById(id)` | `any` | `GET /api/operators/:id` |
| `createOperator(data)` | `any` | `POST /api/operators` |
| `updateOperator(id, data)` | `any` | `PUT /api/operators/:id` |
| `deleteOperator(id)` | `any` | `DELETE /api/operators/:id` |
| `activateOperator(id)` | `any` | `POST /api/operators/:id/activate` |

#### Holds

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getActiveHolds()` | `Hold[]` | `GET /api/holds/active` |
| `getHoldById(id)` | `Hold` | `GET /api/holds/:id` |
| `getHoldsPaged(request?)` | `PagedResponse<Hold>` | `GET /api/holds/paged` |
| `getActiveHoldCount()` | `HoldCountResponse` | `GET /api/holds/count` |
| `applyHold(request)` | `Hold` | `POST /api/holds` |
| `releaseHold(id, comments?)` | `Hold` | `PUT /api/holds/:id/release` |
| `checkEntityOnHold(entityType, entityId)` | `{ onHold, holdId? }` | `GET /api/holds/check/:type/:id` |
| `getHoldsByEntity(entityType, entityId)` | `Hold[]` | `GET /api/holds/entity/:type/:id` |

#### BOM

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getBomRequirements(productSku)` | `BomTreeResponse` | `GET /api/bom/:sku/requirements` |
| `validateBomConsumption(request)` | `BomValidationResult` | `POST /api/bom/validate` |
| `getSuggestedConsumption(operationId)` | `SuggestedConsumptionResponse` | `GET /api/bom/operation/:id/suggested-consumption` |
| `getBomTree(productSku)` | `BomTreeFullResponse` | `GET /api/bom/:sku/tree` |
| `getBomProducts()` | `BomProductSummary[]` | `GET /api/bom/products` |
| `getBomProductsPaged(request)` | `PagedResponse<BomProductSummary>` | `GET /api/bom/products/paged` |
| `getBomVersions(productSku)` | `string[]` | `GET /api/bom/:sku/versions` |
| `createBomNode(request)` | `BomTreeNode` | `POST /api/bom/node` |
| `createBomTree(request)` | `BomTreeFullResponse` | `POST /api/bom/tree` |
| `updateBomNode(bomId, request)` | `BomTreeNode` | `PUT /api/bom/node/:id` |
| `moveBomNode(bomId, request)` | `BomTreeNode` | `PUT /api/bom/node/:id/move` |
| `deleteBomNode(bomId)` | `{ message }` | `DELETE /api/bom/node/:id` |
| `deleteBomNodeCascade(bomId)` | `{ message, deletedCount }` | `DELETE /api/bom/node/:id/cascade` |
| `deleteBomTree(productSku)` | `{ message, deletedCount }` | `DELETE /api/bom/:sku/tree` |
| `updateBomSettings(productSku, request)` | `UpdateBomSettingsResponse` | `PUT /api/bom/:sku/settings` |

#### Processes

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getAllProcesses()` | `Process[]` | `GET /api/processes` |
| `getProcessById(id)` | `Process` | `GET /api/processes/:id` |
| `getProcessesPaged(request?)` | `PagedResponse<any>` | `GET /api/processes/paged` |
| `createProcess(request)` | `Process` | `POST /api/processes` |
| `updateProcess(id, request)` | `Process` | `PUT /api/processes/:id` |
| `deleteProcess(id)` | `void` | `DELETE /api/processes/:id` |
| `activateProcess(id)` | `Process` | `POST /api/processes/:id/activate` |
| `deactivateProcess(id)` | `Process` | `POST /api/processes/:id/deactivate` |

#### Operations

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getAllOperations()` | `Operation[]` | `GET /api/operations` |
| `getOperationsPaged(request)` | `PagedResponse<Operation>` | `GET /api/operations/paged` |
| `getOperationById(id)` | `Operation` | `GET /api/operations/:id` |
| `blockOperation(id, reason)` | `OperationStatusUpdateResponse` | `POST /api/operations/:id/block` |
| `unblockOperation(id)` | `OperationStatusUpdateResponse` | `POST /api/operations/:id/unblock` |
| `pauseOperation(id)` | `OperationStatusUpdateResponse` | `POST /api/operations/:id/pause` |
| `resumeOperation(id)` | `OperationStatusUpdateResponse` | `POST /api/operations/:id/resume` |

#### Routing

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getAllRoutings(status?)` | `any[]` | `GET /api/routing` |
| `getRoutingsPaged(request)` | `PagedResponse<any>` | `GET /api/routing/paged` |
| `getRoutingById(id)` | `any` | `GET /api/routing/:id` |
| `createRouting(request)` | `any` | `POST /api/routing` |
| `updateRouting(id, request)` | `any` | `PUT /api/routing/:id` |
| `deleteRouting(id)` | `void` | `DELETE /api/routing/:id` |
| `activateRouting(id, deactivateOthers?)` | `any` | `POST /api/routing/:id/activate` |
| `deactivateRouting(id)` | `any` | `POST /api/routing/:id/deactivate` |
| `putRoutingOnHold(id, reason?)` | `any` | `POST /api/routing/:id/hold` |
| `releaseRoutingFromHold(id)` | `any` | `POST /api/routing/:id/release` |
| `createRoutingStep(routingId, step)` | `any` | `POST /api/routing/:id/steps` |
| `updateRoutingStep(stepId, step)` | `any` | `PUT /api/routing/steps/:id` |
| `deleteRoutingStep(stepId)` | `void` | `DELETE /api/routing/steps/:id` |
| `reorderRoutingSteps(routingId, stepIds)` | `any[]` | `POST /api/routing/:id/reorder` |

#### Operation Templates

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getOperationTemplates()` | `OperationTemplate[]` | `GET /api/operation-templates` |
| `getActiveOperationTemplates()` | `OperationTemplateSummary[]` | `GET /api/operation-templates/active` |
| `getOperationTemplatesPaged(request?)` | `PagedResponse<OperationTemplate>` | `GET /api/operation-templates/paged` |
| `getOperationTemplateById(id)` | `OperationTemplate` | `GET /api/operation-templates/:id` |
| `createOperationTemplate(request)` | `OperationTemplate` | `POST /api/operation-templates` |
| `updateOperationTemplate(id, request)` | `OperationTemplate` | `PUT /api/operation-templates/:id` |
| `deleteOperationTemplate(id)` | `void` | `DELETE /api/operation-templates/:id` |
| `activateOperationTemplate(id)` | `OperationTemplate` | `POST /api/operation-templates/:id/activate` |
| `deactivateOperationTemplate(id)` | `OperationTemplate` | `POST /api/operation-templates/:id/deactivate` |

#### Customers

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getCustomersPaged(request?)` | `PagedResponse<Customer>` | `GET /api/customers/paged` |
| `getAllCustomers()` | `Customer[]` | `GET /api/customers` |
| `getActiveCustomers()` | `Customer[]` | `GET /api/customers/active` |
| `getCustomerById(id)` | `Customer` | `GET /api/customers/:id` |
| `createCustomer(request)` | `Customer` | `POST /api/customers` |
| `updateCustomer(id, request)` | `Customer` | `PUT /api/customers/:id` |
| `deleteCustomer(id)` | `void` | `DELETE /api/customers/:id` |
| `activateCustomer(id)` | `Customer` | `POST /api/customers/:id/activate` |

#### Materials

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getMaterialsPaged(request?)` | `PagedResponse<Material>` | `GET /api/materials/paged` |
| `getAllMaterials()` | `Material[]` | `GET /api/materials` |
| `getActiveMaterials()` | `Material[]` | `GET /api/materials/active` |
| `getMaterialById(id)` | `Material` | `GET /api/materials/:id` |
| `createMaterial(request)` | `Material` | `POST /api/materials` |
| `updateMaterial(id, request)` | `Material` | `PUT /api/materials/:id` |
| `deleteMaterial(id)` | `void` | `DELETE /api/materials/:id` |
| `activateMaterial(id)` | `Material` | `POST /api/materials/:id/activate` |

#### Products

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getProductsPaged(request?)` | `PagedResponse<Product>` | `GET /api/products/paged` |
| `getAllProducts()` | `Product[]` | `GET /api/products` |
| `getActiveProducts()` | `Product[]` | `GET /api/products/active` |
| `getProductById(id)` | `Product` | `GET /api/products/:id` |
| `createProduct(request)` | `Product` | `POST /api/products` |
| `updateProduct(id, request)` | `Product` | `PUT /api/products/:id` |
| `deleteProduct(id)` | `void` | `DELETE /api/products/:id` |
| `activateProduct(id)` | `Product` | `POST /api/products/:id/activate` |

#### Users

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getUsersPaged(request?)` | `PagedResponse<any>` | `GET /api/users/paged` |
| `getAllUsers()` | `any[]` | `GET /api/users` |
| `getUserById(id)` | `any` | `GET /api/users/:id` |
| `createUser(request)` | `any` | `POST /api/users` |
| `updateUser(id, request)` | `any` | `PUT /api/users/:id` |
| `deleteUser(id)` | `{ message }` | `DELETE /api/users/:id` |
| `activateUser(id)` | `any` | `POST /api/users/:id/activate` |
| `deactivateUser(id)` | `any` | `POST /api/users/:id/deactivate` |
| `changePassword(request)` | `{ message }` | `POST /api/users/me/change-password` |
| `changePasswordById(userId, request)` | `{ message }` | `POST /api/users/:id/change-password` |
| `resetPassword(userId, request)` | `{ message }` | `POST /api/users/:id/reset-password` |

#### Configuration

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getHoldReasonsPaged(request?)` | `PagedResponse<HoldReason>` | `GET /api/config/hold-reasons/paged` |
| `getHoldReasonById(id)` | `HoldReason` | `GET /api/config/hold-reasons/:id` |
| `createHoldReason(request)` | `HoldReason` | `POST /api/config/hold-reasons` |
| `updateHoldReason(id, request)` | `HoldReason` | `PUT /api/config/hold-reasons/:id` |
| `deleteHoldReason(id)` | `void` | `DELETE /api/config/hold-reasons/:id` |
| `getDelayReasonsPaged(request?)` | `PagedResponse<DelayReason>` | `GET /api/config/delay-reasons/paged` |
| `createDelayReason(request)` | `DelayReason` | `POST /api/config/delay-reasons` |
| `updateDelayReason(id, request)` | `DelayReason` | `PUT /api/config/delay-reasons/:id` |
| `deleteDelayReason(id)` | `void` | `DELETE /api/config/delay-reasons/:id` |
| `getProcessParamsPaged(request?)` | `PagedResponse<ProcessParametersConfig>` | `GET /api/config/process-parameters/paged` |
| `createProcessParam(request)` | `ProcessParametersConfig` | `POST /api/config/process-parameters` |
| `updateProcessParam(id, request)` | `ProcessParametersConfig` | `PUT /api/config/process-parameters/:id` |
| `deleteProcessParam(id)` | `void` | `DELETE /api/config/process-parameters/:id` |
| `getBatchNumberConfigsPaged(request?)` | `PagedResponse<BatchNumberConfig>` | `GET /api/config/batch-number/paged` |
| `createBatchNumberConfig(request)` | `BatchNumberConfig` | `POST /api/config/batch-number` |
| `updateBatchNumberConfig(id, request)` | `BatchNumberConfig` | `PUT /api/config/batch-number/:id` |
| `deleteBatchNumberConfig(id)` | `void` | `DELETE /api/config/batch-number/:id` |
| `getQuantityTypeConfigsPaged(request?)` | `PagedResponse<QuantityTypeConfig>` | `GET /api/config/quantity-types/paged` |
| `createQuantityTypeConfig(request)` | `QuantityTypeConfig` | `POST /api/config/quantity-types` |
| `updateQuantityTypeConfig(id, request)` | `QuantityTypeConfig` | `PUT /api/config/quantity-types/:id` |
| `deleteQuantityTypeConfig(id)` | `void` | `DELETE /api/config/quantity-types/:id` |
| `getBatchSizeConfigsPaged(request)` | `PagedResponse<any>` | `GET /api/batch-size-config/paged` |
| `createBatchSizeConfig(request)` | `any` | `POST /api/batch-size-config` |
| `updateBatchSizeConfig(id, request)` | `any` | `PUT /api/batch-size-config/:id` |
| `deleteBatchSizeConfig(id)` | `void` | `DELETE /api/batch-size-config/:id` |
| `calculateBatchSizes(quantity, opType?, matId?, productSku?)` | `any` | `GET /api/batch-size-config/calculate` |
| `checkBatchSizeConfig(opType?, productSku?, equipType?)` | `any` | `GET /api/batch-size-config/check` |

#### Dashboard

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getDashboardSummary()` | `DashboardSummary` | `GET /api/dashboard/summary` |

#### Audit Trail

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getAuditPaged(request?)` | `PagedResponse<AuditEntry>` | `GET /api/audit/paged` |
| `getAuditHistory(entityType, entityId)` | `AuditHistory` | `GET /api/audit/entity/:type/:id` |
| `getRecentAuditActivity(limit?)` | `AuditEntry[]` | `GET /api/audit/recent` |
| `getAuditByUser(username, limit?)` | `AuditEntry[]` | `GET /api/audit/user/:username` |
| `getAuditByDateRange(startDate, endDate)` | `AuditEntry[]` | `GET /api/audit/range` |
| `getAuditSummary()` | `AuditSummary` | `GET /api/audit/summary` |
| `getAuditEntityTypes()` | `string[]` | `GET /api/audit/entity-types` |
| `getAuditActionTypes()` | `string[]` | `GET /api/audit/action-types` |

#### Report Analytics

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getProductionSummary(startDate, endDate)` | `ProductionSummary` | `GET /api/reports/analytics/production/summary` |
| `getProductionByOperation(startDate, endDate)` | `ProductionByOperation` | `GET /api/reports/analytics/production/by-operation` |
| `getScrapAnalysis(startDate, endDate)` | `ScrapAnalysis` | `GET /api/reports/analytics/quality/scrap-analysis` |
| `getOrderFulfillment()` | `OrderFulfillment` | `GET /api/reports/analytics/orders/fulfillment` |
| `getInventoryBalance()` | `InventoryBalance` | `GET /api/reports/analytics/inventory/balance` |
| `getOperationCycleTimes(startDate, endDate)` | `OperationCycleTimes` | `GET /api/reports/analytics/operations/cycle-times` |
| `getHoldAnalysis()` | `HoldAnalysis` | `GET /api/reports/analytics/operations/holds` |
| `getExecutiveDashboard()` | `ExecutiveDashboard` | `GET /api/reports/analytics/executive/dashboard` |

#### Master Data (Shared)

| Method | Return Type | Endpoint |
|--------|-------------|----------|
| `getDelayReasons()` | `{ reasonCode, description }[]` | `GET /api/master/delay-reasons` |
| `getHoldReasons()` | `{ reasonCode, description }[]` | `GET /api/master/hold-reasons` |
| `getProcessParameters(opType?, productSku?)` | `{ parameter_name, default_value, is_required }[]` | `GET /api/master/process-parameters` |
| `getEquipmentTypes()` | `any[]` | `GET /api/master/equipment-types` |
| `getInventoryForms()` | `any[]` | `GET /api/master/inventory-forms` |
| `getQuantityTypeConfigForContext(params)` | `any` | `GET /api/master/quantity-type-config` |

### AuthService (`auth.service.ts`)

Handles authentication, token management, and current user state.

| Method / Property | Return Type | Description |
|-------------------|-------------|-------------|
| `login(credentials)` | `Observable<LoginResponse>` | POST to `/api/auth/login`, stores JWT token and user in localStorage |
| `logout()` | `void` | Clears token and user from localStorage, navigates to `/login` |
| `getToken()` | `string | null` | Returns stored JWT token |
| `isAuthenticated()` | `boolean` | Checks token existence and expiration (decodes JWT payload) |
| `getCurrentUser()` | `User | null` | Returns current user from BehaviorSubject |
| `currentUser$` | `Observable<User | null>` | Observable of current user state |

**Interfaces defined:**
- `LoginRequest` -- `{ email, password }`
- `LoginResponse` -- `{ accessToken, refreshToken, tokenType, expiresIn, user: { userId, email, name, employeeId } }`
- `User` -- `{ email, fullName, role? }`

**Storage keys:** `mes_token`, `mes_user`

### BreadcrumbService (`breadcrumb.service.ts`)

Automatically generates breadcrumb trails from router navigation events.

| Method / Property | Return Type | Description |
|-------------------|-------------|-------------|
| `breadcrumbs$` | `Observable<Breadcrumb[]>` | Observable of current breadcrumb trail |
| `setBreadcrumbs(breadcrumbs)` | `void` | Manually set breadcrumbs (for dynamic titles) |
| `updateLastBreadcrumb(label)` | `void` | Update last breadcrumb label (e.g., show entity name instead of ID) |

**Interface:** `Breadcrumb` -- `{ label, url, icon? }`

**Features:**
- Automatic route-to-breadcrumb mapping from 30+ configured route segments
- Dynamic entity labels for numeric segments (e.g., "Order #5", "Batch #12")
- Kebab-case to Title Case conversion for unmapped segments
- Icon support via Font Awesome class names

### ChartService (`chart.service.ts`)

Centralized ECharts management service for data visualizations.

| Method | Return Type | Description |
|--------|-------------|-------------|
| `initChart(element, chartId)` | `echarts.ECharts` | Initialize an ECharts instance on a DOM element |
| `setOption(chartId, option)` | `void` | Set chart options |
| `getChart(chartId)` | `echarts.ECharts | undefined` | Get chart instance by ID |
| `disposeChart(chartId)` | `void` | Dispose a single chart |
| `disposeAll()` | `void` | Dispose all managed charts |

**Registered chart types:** PieChart, BarChart, GraphChart, SankeyChart
**Font constants:** `CHART_FONT` -- `{ title: 11, axisLabel: 9, label: 8, labelBold: 9, emphasis: 10, edgeLabel: 8, tooltip: 10 }`

---

## Core Guards & Interceptors

### AuthGuard (`core/guards/auth.guard.ts`)

| Property | Value |
|----------|-------|
| **Type** | `CanActivate` guard |
| **Behavior** | Checks `AuthService.isAuthenticated()`. If true, allows navigation. If false, redirects to `/login`. |
| **Applied to** | `MainLayoutComponent` and `AdminLayoutComponent` route groups |

### AuthInterceptor (`core/interceptors/auth.interceptor.ts`)

| Property | Value |
|----------|-------|
| **Type** | `HttpInterceptor` |
| **Behavior** | Attaches `Authorization: Bearer <token>` header to all outgoing HTTP requests when a JWT token exists. On 401 responses, calls `AuthService.logout()` to clear session and redirect to login. |

---

## Component Summary Statistics

| Category | Count |
|----------|-------|
| Total feature components | 78 |
| Shared components | 9 |
| Feature modules (lazy-loaded) | 21 |
| Total routes | 100+ |
| Model files | 23 |
| Core services | 4 |
| Guards | 1 |
| Interceptors | 1 |
