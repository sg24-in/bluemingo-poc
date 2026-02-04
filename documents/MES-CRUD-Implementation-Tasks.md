# MES CRUD Implementation Tasks

**Document Version:** 1.0
**Created:** 2026-02-04
**Status:** Planning

This document lists all tasks required to implement missing CRUD operations in the MES Production Confirmation system.

---

## Table of Contents

1. [Summary](#summary)
2. [Priority Classification](#priority-classification)
3. [Critical Priority Tasks](#critical-priority-tasks)
4. [High Priority Tasks](#high-priority-tasks)
5. [Medium Priority Tasks](#medium-priority-tasks)
6. [Low Priority Tasks](#low-priority-tasks)
7. [Task Dependencies](#task-dependencies)
8. [Estimation Summary](#estimation-summary)

---

## Summary

| Category | Backend Tasks | Frontend Tasks | Test Tasks | E2E Tasks | Total |
|----------|---------------|----------------|------------|-----------|-------|
| Critical | 8 | 6 | 8 | 4 | 26 |
| High | 15 | 10 | 15 | 5 | 45 |
| Medium | 12 | 8 | 12 | 4 | 36 |
| Low | 6 | 6 | 6 | 3 | 21 |
| **Total** | **41** | **30** | **41** | **16** | **128** |

---

## Priority Classification

- **🔴 CRITICAL**: Blocking order-to-cash workflow
- **🟠 HIGH**: Blocking production setup and operations
- **🟡 MEDIUM**: Configuration and master data management
- **🟢 LOW**: Views, reporting, and quality-of-life improvements

---

## Critical Priority Tasks

### 1. Order Management CRUD

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-ORD-001 | Create Order DTO for create/update | Add CreateOrderRequest, UpdateOrderRequest DTOs | - |
| BE-ORD-002 | Implement create order endpoint | POST /api/orders | `POST /api/orders` |
| BE-ORD-003 | Implement update order endpoint | PUT /api/orders/{id} | `PUT /api/orders/{id}` |
| BE-ORD-004 | Implement delete order endpoint | DELETE /api/orders/{id} | `DELETE /api/orders/{id}` |
| BE-ORD-005 | Implement add line item endpoint | POST /api/orders/{id}/line-items | `POST /api/orders/{id}/line-items` |
| BE-ORD-006 | Implement update line item endpoint | PUT /api/orders/{id}/line-items/{lineId} | `PUT /api/orders/{id}/line-items/{lineId}` |
| BE-ORD-007 | Implement delete line item endpoint | DELETE /api/orders/{id}/line-items/{lineId} | `DELETE /api/orders/{id}/line-items/{lineId}` |
| BE-ORD-008 | Add order validation service | Validate order data, check duplicates | - |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-ORD-001 | Create OrderFormComponent | Reusable form for create/edit | - |
| FE-ORD-002 | Create OrderCreatePage | Page to create new orders | `/orders/new` |
| FE-ORD-003 | Create OrderEditPage | Page to edit existing orders | `/orders/:id/edit` |
| FE-ORD-004 | Create LineItemFormComponent | Form for adding/editing line items | - |
| FE-ORD-005 | Add order API methods | createOrder, updateOrder, deleteOrder in ApiService | - |
| FE-ORD-006 | Update OrderListComponent | Add create/edit/delete buttons | `/orders` |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-ORD-001 | OrderService create tests | Test createOrder() with valid/invalid data |
| TEST-ORD-002 | OrderService update tests | Test updateOrder() with valid/invalid data |
| TEST-ORD-003 | OrderService delete tests | Test deleteOrder() with cascading |
| TEST-ORD-004 | OrderController create tests | Test POST /api/orders endpoint |
| TEST-ORD-005 | OrderController update tests | Test PUT /api/orders/{id} endpoint |
| TEST-ORD-006 | OrderController delete tests | Test DELETE /api/orders/{id} endpoint |
| TEST-ORD-007 | LineItem CRUD tests | Test line item operations |
| TEST-ORD-008 | Order validation tests | Test validation rules |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-ORD-001 | Order creation flow | Create order with line items |
| E2E-ORD-002 | Order edit flow | Edit existing order |
| E2E-ORD-003 | Order delete flow | Delete order with confirmation |
| E2E-ORD-004 | Order validation errors | Test form validation |

---

### 2. Customer Management (New Entity)

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-CUST-001 | Create Customer entity | Customer.java with fields: id, code, name, contact, address, status | - |
| BE-CUST-002 | Create CustomerRepository | JpaRepository with custom queries | - |
| BE-CUST-003 | Create CustomerService | CRUD operations for customers | - |
| BE-CUST-004 | Create CustomerController | Full CRUD endpoints | `/api/customers` |
| BE-CUST-005 | Create CustomerDTO | Request/response DTOs | - |
| BE-CUST-006 | Add customer patch | SQL patch for customers table | `014_customers_table.sql` |
| BE-CUST-007 | Update Order entity | Add Customer relation to Order | - |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-CUST-001 | Create CustomersModule | New feature module | - |
| FE-CUST-002 | Create CustomerListComponent | List all customers | `/customers` |
| FE-CUST-003 | Create CustomerFormComponent | Create/edit form | - |
| FE-CUST-004 | Create CustomerCreatePage | Create customer page | `/customers/new` |
| FE-CUST-005 | Create CustomerEditPage | Edit customer page | `/customers/:id/edit` |
| FE-CUST-006 | Add customer API methods | Full CRUD in ApiService | - |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-CUST-001 | CustomerService CRUD tests | Test all CRUD operations |
| TEST-CUST-002 | CustomerController tests | Test all endpoints |
| TEST-CUST-003 | Customer validation tests | Test validation rules |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-CUST-001 | Customer CRUD flow | Create, edit, delete customer |

---

## High Priority Tasks

### 3. Inventory Management CRUD

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-INV-001 | Create inventory DTOs | CreateInventoryRequest, UpdateInventoryRequest | - |
| BE-INV-002 | Implement create inventory | POST /api/inventory | `POST /api/inventory` |
| BE-INV-003 | Implement update inventory | PUT /api/inventory/{id} | `PUT /api/inventory/{id}` |
| BE-INV-004 | Implement delete inventory | DELETE /api/inventory/{id} | `DELETE /api/inventory/{id}` |
| BE-INV-005 | Add inventory detail endpoint | GET /api/inventory/{id} (enhanced) | `GET /api/inventory/{id}` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-INV-001 | Create InventoryFormComponent | Create/edit form | - |
| FE-INV-002 | Create InventoryCreatePage | Create inventory page | `/inventory/new` |
| FE-INV-003 | Create InventoryEditPage | Edit inventory page | `/inventory/:id/edit` |
| FE-INV-004 | Create InventoryDetailPage | View inventory details | `/inventory/:id` |
| FE-INV-005 | Update InventoryListComponent | Add CRUD buttons | `/inventory` |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-INV-001 | InventoryService create tests | Test createInventory() |
| TEST-INV-002 | InventoryService update tests | Test updateInventory() |
| TEST-INV-003 | InventoryService delete tests | Test deleteInventory() |
| TEST-INV-004 | InventoryController CRUD tests | Test all new endpoints |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-INV-001 | Inventory CRUD flow | Create, view, edit, delete inventory |

---

### 4. Equipment Management CRUD

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-EQP-001 | Create equipment DTOs | CreateEquipmentRequest, UpdateEquipmentRequest | - |
| BE-EQP-002 | Implement create equipment | POST /api/equipment | `POST /api/equipment` |
| BE-EQP-003 | Implement update equipment | PUT /api/equipment/{id} | `PUT /api/equipment/{id}` |
| BE-EQP-004 | Implement delete equipment | DELETE /api/equipment/{id} | `DELETE /api/equipment/{id}` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-EQP-001 | Create EquipmentFormComponent | Create/edit form | - |
| FE-EQP-002 | Create EquipmentCreatePage | Create equipment page | `/equipment/new` |
| FE-EQP-003 | Create EquipmentEditPage | Edit equipment page | `/equipment/:id/edit` |
| FE-EQP-004 | Create EquipmentDetailPage | View equipment details | `/equipment/:id` |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-EQP-001 | EquipmentService CRUD tests | Test all CRUD operations |
| TEST-EQP-002 | EquipmentController CRUD tests | Test all new endpoints |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-EQP-001 | Equipment CRUD flow | Create, view, edit, delete equipment |

---

### 5. Batch Management CRUD

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-BAT-001 | Create batch DTOs | CreateBatchRequest, UpdateBatchRequest | - |
| BE-BAT-002 | Implement create batch | POST /api/batches | `POST /api/batches` |
| BE-BAT-003 | Implement update batch | PUT /api/batches/{id} | `PUT /api/batches/{id}` |
| BE-BAT-004 | Implement delete batch | DELETE /api/batches/{id} | `DELETE /api/batches/{id}` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-BAT-001 | Create BatchFormComponent | Create/edit form | - |
| FE-BAT-002 | Create BatchCreatePage | Create batch page | `/batches/new` |
| FE-BAT-003 | Create BatchEditPage | Edit batch page | `/batches/:id/edit` |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-BAT-001 | BatchService CRUD tests | Test all CRUD operations |
| TEST-BAT-002 | BatchController CRUD tests | Test all new endpoints |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-BAT-001 | Batch CRUD flow | Create, view, edit, delete batch |

---

### 6. BOM Management CRUD

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-BOM-001 | Create BOM DTOs | CreateBomRequest, UpdateBomRequest | - |
| BE-BOM-002 | Implement create BOM | POST /api/bom | `POST /api/bom` |
| BE-BOM-003 | Implement update BOM | PUT /api/bom/{id} | `PUT /api/bom/{id}` |
| BE-BOM-004 | Implement delete BOM | DELETE /api/bom/{id} | `DELETE /api/bom/{id}` |
| BE-BOM-005 | Implement BOM detail | GET /api/bom/{id} | `GET /api/bom/{id}` |
| BE-BOM-006 | Implement BOM list | GET /api/bom | `GET /api/bom` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-BOM-001 | Create BomModule | New feature module | - |
| FE-BOM-002 | Create BomListComponent | List all BOMs | `/bom` |
| FE-BOM-003 | Create BomFormComponent | Create/edit BOM with tree structure | - |
| FE-BOM-004 | Create BomDetailPage | View BOM tree | `/bom/:id` |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-BOM-001 | BomService CRUD tests | Test all CRUD operations |
| TEST-BOM-002 | BomController CRUD tests | Test all new endpoints |
| TEST-BOM-003 | BOM hierarchy tests | Test multi-level BOM operations |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-BOM-001 | BOM CRUD flow | Create, view, edit BOM with hierarchy |

---

### 7. Routing Management CRUD

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-RTG-001 | Create routing DTOs | CreateRoutingRequest, UpdateRoutingRequest | - |
| BE-RTG-002 | Implement create routing | POST /api/routing | `POST /api/routing` |
| BE-RTG-003 | Implement update routing | PUT /api/routing/{id} | `PUT /api/routing/{id}` |
| BE-RTG-004 | Implement delete routing | DELETE /api/routing/{id} | `DELETE /api/routing/{id}` |
| BE-RTG-005 | Implement routing step CRUD | CRUD for routing steps | `/api/routing/{id}/steps` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-RTG-001 | Create RoutingModule | New feature module | - |
| FE-RTG-002 | Create RoutingListComponent | List all routings | `/routing` |
| FE-RTG-003 | Create RoutingFormComponent | Create/edit routing with steps | - |
| FE-RTG-004 | Create RoutingDetailPage | View routing steps | `/routing/:id` |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-RTG-001 | RoutingService CRUD tests | Test all CRUD operations |
| TEST-RTG-002 | RoutingController CRUD tests | Test all new endpoints |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-RTG-001 | Routing CRUD flow | Create, view, edit routing with steps |

---

## Medium Priority Tasks

### 8. Material/Product Management (New Entity)

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-MAT-001 | Create Material entity | Material.java with SKU, name, type, unit | - |
| BE-MAT-002 | Create MaterialRepository | JpaRepository | - |
| BE-MAT-003 | Create MaterialService | CRUD operations | - |
| BE-MAT-004 | Create MaterialController | Full CRUD endpoints | `/api/materials` |
| BE-MAT-005 | Add material patch | SQL patch for materials table | `015_materials_table.sql` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-MAT-001 | Create MaterialsModule | New feature module | - |
| FE-MAT-002 | Create MaterialListComponent | List materials | `/materials` |
| FE-MAT-003 | Create MaterialFormComponent | Create/edit material | - |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-MAT-001 | MaterialService CRUD tests | Test all CRUD operations |
| TEST-MAT-002 | MaterialController tests | Test all endpoints |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-MAT-001 | Material CRUD flow | Create, edit, delete material |

---

### 9. Operator Management CRUD

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-OPR-001 | Create operator DTOs | CreateOperatorRequest, UpdateOperatorRequest | - |
| BE-OPR-002 | Implement create operator | POST /api/master/operators | `POST /api/master/operators` |
| BE-OPR-003 | Implement update operator | PUT /api/master/operators/{id} | `PUT /api/master/operators/{id}` |
| BE-OPR-004 | Implement delete operator | DELETE /api/master/operators/{id} | `DELETE /api/master/operators/{id}` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-OPR-001 | Create OperatorListComponent | List operators | `/operators` |
| FE-OPR-002 | Create OperatorFormComponent | Create/edit operator | - |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-OPR-001 | OperatorService CRUD tests | Test all CRUD operations |
| TEST-OPR-002 | OperatorController tests | Test all endpoints |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-OPR-001 | Operator CRUD flow | Create, edit, delete operator |

---

### 10. Process/Operation CRUD

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-PRC-001 | Create process DTOs | CreateProcessRequest, UpdateProcessRequest | - |
| BE-PRC-002 | Implement create process | POST /api/processes | `POST /api/processes` |
| BE-PRC-003 | Implement update process | PUT /api/processes/{id} | `PUT /api/processes/{id}` |
| BE-PRC-004 | Implement delete process | DELETE /api/processes/{id} | `DELETE /api/processes/{id}` |
| BE-OPN-001 | Implement create operation | POST /api/operations | `POST /api/operations` |
| BE-OPN-002 | Implement update operation | PUT /api/operations/{id} | `PUT /api/operations/{id}` |
| BE-OPN-003 | Implement delete operation | DELETE /api/operations/{id} | `DELETE /api/operations/{id}` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-PRC-001 | Create ProcessListComponent | List processes | `/processes` |
| FE-PRC-002 | Create ProcessFormComponent | Create/edit process | - |
| FE-OPN-001 | Create OperationFormComponent | Create/edit operation | - |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-PRC-001 | ProcessService CRUD tests | Test all CRUD operations |
| TEST-OPN-001 | OperationService CRUD tests | Test all CRUD operations |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-PRC-001 | Process/Operation CRUD flow | Create, edit, delete |

---

### 11. Configuration Management

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-CFG-001 | Hold reasons CRUD | CRUD for hold_reasons config | `/api/config/hold-reasons` |
| BE-CFG-002 | Delay reasons CRUD | CRUD for delay_reasons config | `/api/config/delay-reasons` |
| BE-CFG-003 | Equipment types CRUD | CRUD for equipment_type_config | `/api/config/equipment-types` |
| BE-CFG-004 | Units of measure CRUD | CRUD for unit_of_measure | `/api/config/units` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-CFG-001 | Create ConfigModule | Configuration module | - |
| FE-CFG-002 | Create HoldReasonsPage | Manage hold reasons | `/config/hold-reasons` |
| FE-CFG-003 | Create DelayReasonsPage | Manage delay reasons | `/config/delay-reasons` |
| FE-CFG-004 | Create EquipmentTypesPage | Manage equipment types | `/config/equipment-types` |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-CFG-001 | Configuration CRUD tests | Test all config endpoints |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-CFG-001 | Configuration flow | Manage configuration items |

---

## Low Priority Tasks

### 12. Detail Views (Missing Pages)

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-DTL-001 | Create HoldDetailPage | View hold record details | `/holds/:id` |
| FE-DTL-002 | Create InventoryDetailPage | View inventory details | `/inventory/:id` |
| FE-DTL-003 | Create EquipmentDetailPage | View equipment details | `/equipment/:id` |
| FE-DTL-004 | Create ProductionHistoryPage | View confirmation history | `/production/history` |
| FE-DTL-005 | Create AuditTrailPage | View audit trail | `/audit` |

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-DTL-001 | Hold detail endpoint | GET /api/holds/{id} | `GET /api/holds/{id}` |
| BE-DTL-002 | Enhanced production history | GET /api/production/history | `GET /api/production/history` |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-DTL-001 | Detail views test | Navigate and view all detail pages |

---

### 13. User Management

#### Backend Tasks

| ID | Task | Description | Endpoint |
|----|------|-------------|----------|
| BE-USR-001 | User list endpoint | GET /api/users | `GET /api/users` |
| BE-USR-002 | User create endpoint | POST /api/users | `POST /api/users` |
| BE-USR-003 | User update endpoint | PUT /api/users/{id} | `PUT /api/users/{id}` |
| BE-USR-004 | User delete endpoint | DELETE /api/users/{id} | `DELETE /api/users/{id}` |

#### Frontend Tasks

| ID | Task | Description | Route |
|----|------|-------------|-------|
| FE-USR-001 | Create UserManagementModule | User management module | - |
| FE-USR-002 | Create UserListComponent | List users | `/users` |
| FE-USR-003 | Create UserFormComponent | Create/edit user | - |

#### Backend Tests

| ID | Task | Description |
|----|------|-------------|
| TEST-USR-001 | UserService CRUD tests | Test all CRUD operations |
| TEST-USR-002 | UserController tests | Test all endpoints |

#### E2E Tests

| ID | Task | Description |
|----|------|-------------|
| E2E-USR-001 | User management flow | Create, edit, delete users |

---

## Task Dependencies

```
Customer Entity ──────────────────┐
                                  ├──► Order CRUD
Material Entity ──────────────────┘

BOM CRUD ─────────────────────────┐
                                  ├──► Routing CRUD ──► Process/Operation CRUD
Equipment CRUD ───────────────────┘

Inventory CRUD ───────────────────┐
                                  ├──► Batch CRUD
Batch CRUD ───────────────────────┘
```

### Recommended Implementation Order

1. **Phase 1: Foundation**
   - Customer entity
   - Material entity
   - Order CRUD

2. **Phase 2: Production Setup**
   - Equipment CRUD
   - Operator CRUD
   - BOM CRUD
   - Routing CRUD

3. **Phase 3: Inventory & Batches**
   - Inventory CRUD
   - Batch CRUD

4. **Phase 4: Configuration**
   - Process/Operation CRUD
   - Configuration pages

5. **Phase 5: Views & Reporting**
   - Detail pages
   - Audit trail UI
   - User management

---

## Estimation Summary

| Priority | Tasks | Est. Hours | Est. Days (8h/day) |
|----------|-------|------------|-------------------|
| Critical | 26 | 40-50 | 5-6 |
| High | 45 | 60-80 | 8-10 |
| Medium | 36 | 40-50 | 5-6 |
| Low | 21 | 25-30 | 3-4 |
| **Total** | **128** | **165-210** | **21-26** |

---

## Appendix: File Structure for New Modules

### Backend Structure (per entity)

```
backend/src/main/java/com/mes/production/
├── entity/
│   └── {Entity}.java
├── repository/
│   └── {Entity}Repository.java
├── service/
│   └── {Entity}Service.java
├── controller/
│   └── {Entity}Controller.java
└── dto/
    ├── {Entity}DTO.java
    ├── Create{Entity}Request.java
    └── Update{Entity}Request.java
```

### Frontend Structure (per module)

```
frontend/src/app/features/{feature}/
├── {feature}.module.ts
├── {feature}-routing.module.ts
├── {feature}-list/
│   ├── {feature}-list.component.ts
│   ├── {feature}-list.component.html
│   └── {feature}-list.component.css
├── {feature}-form/
│   ├── {feature}-form.component.ts
│   ├── {feature}-form.component.html
│   └── {feature}-form.component.css
└── {feature}-detail/
    ├── {feature}-detail.component.ts
    ├── {feature}-detail.component.html
    └── {feature}-detail.component.css
```

### Test Structure

```
backend/src/test/java/com/mes/production/
├── service/
│   └── {Entity}ServiceTest.java
└── controller/
    └── {Entity}ControllerTest.java

e2e/tests/
└── XX-{feature}.test.js
```

---

## Notes

1. All CRUD operations should include proper validation
2. All endpoints should be secured with JWT authentication
3. All operations should be audited via AuditTrail
4. Frontend forms should have client-side validation
5. E2E tests should cover happy path and error scenarios
