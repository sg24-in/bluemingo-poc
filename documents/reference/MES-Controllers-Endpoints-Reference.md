# MES Controllers & Endpoints Reference

**Generated:** February 2026
**Source:** Controller Layer Analysis

---

## Table of Contents

1. [Overview](#overview)
2. [Security Configuration](#security-configuration)
3. [Global Exception Handling](#global-exception-handling)
4. [Authentication - AuthController](#1-authcontroller)
5. [Dashboard - DashboardController](#2-dashboardcontroller)
6. [Orders - OrderController](#3-ordercontroller)
7. [Production - ProductionController](#4-productioncontroller)
8. [Operations - OperationController](#5-operationcontroller)
9. [Batches - BatchController](#6-batchcontroller)
10. [Batch Allocations - BatchAllocationController](#7-batchallocationcontroller)
11. [Inventory - InventoryController](#8-inventorycontroller)
12. [Inventory Movements - InventoryMovementController](#9-inventorymovementcontroller)
13. [Holds - HoldController](#10-holdcontroller)
14. [Equipment - EquipmentController](#11-equipmentcontroller)
15. [Equipment Usage - EquipmentUsageController](#12-equipmentusagecontroller)
16. [BOM - BomController](#13-bomcontroller)
17. [Routing - RoutingController](#14-routingcontroller)
18. [Processes - ProcessController](#15-processcontroller)
19. [Operation Templates - OperationTemplateController](#16-operationtemplatecontroller)
20. [Customers - CustomerController](#17-customercontroller)
21. [Materials - MaterialController](#18-materialcontroller)
22. [Products - ProductController](#19-productcontroller)
23. [Operators - OperatorController](#20-operatorcontroller)
24. [Users - UserController](#21-usercontroller)
25. [Configuration - ConfigController](#22-configcontroller)
26. [Master Data - MasterDataController](#23-masterdatacontroller)
27. [Audit Trail - AuditController](#24-auditcontroller)
28. [Reports - ReportController](#25-reportcontroller)
29. [Report Analytics - ReportAnalyticsController](#26-reportanalyticscontroller)
30. [Batch Size Config - BatchSizeConfigController](#27-batchsizeconfigcontroller)
31. [Database Reset - DatabaseResetController](#28-databaseresetcontroller)
32. [Endpoint Count Summary](#endpoint-count-summary)

---

## Overview

The MES POC backend exposes a REST API via 28 Spring Boot controller classes under the base package `com.mes.production.controller`. All API endpoints are prefixed with `/api/` and secured via JWT authentication unless explicitly permitted.

**Source directory:** `backend/src/main/java/com/mes/production/controller/`

---

## Security Configuration

**File:** `backend/src/main/java/com/mes/production/config/SecurityConfig.java`

### Authentication Mechanism
- **Type:** JWT (JSON Web Token) via `JwtAuthenticationFilter`
- **Session:** Stateless (`SessionCreationPolicy.STATELESS`)
- **Password Encoding:** BCrypt
- **Profile:** Active on all profiles except `test` (`@Profile("!test")`)

### Public Endpoints (No Authentication Required)

| Pattern | Purpose |
|---------|---------|
| `POST /api/auth/login` | User login |
| `POST /api/auth/register` | User registration |
| `POST /api/auth/refresh` | Token refresh |
| `/api/public/**` | Public API endpoints |
| `/`, `/index.html`, `/*.js`, `/*.css`, `/*.ico`, `/*.png`, `/*.svg`, `/*.woff`, `/*.woff2`, `/*.ttf` | Static resources (Angular frontend) |
| `/media/**`, `/assets/**` | Media and asset files |
| `/h2-console/**` | H2 Console (demo mode) |
| `/swagger-ui/**`, `/v3/api-docs/**` | Swagger/OpenAPI docs |
| `/actuator/**` | Spring Actuator |

### Authenticated Endpoints
All other requests (`anyRequest().authenticated()`) require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <jwt-token>
```

### CORS Configuration
- **Allowed Origins:** `http://localhost:4200` (Angular dev server)
- **Allowed Methods:** GET, POST, PUT, DELETE, PATCH, OPTIONS
- **Allowed Headers:** All (`*`)
- **Credentials:** Allowed
- **Max Age:** 3600 seconds

### Unauthorized Response
When an unauthenticated request hits a protected endpoint, the response is:
```json
{
  "error": "Unauthorized",
  "message": "<auth exception message>"
}
```
**HTTP Status:** 401

---

## Global Exception Handling

**File:** `backend/src/main/java/com/mes/production/config/GlobalExceptionHandler.java`
**Annotation:** `@RestControllerAdvice`

All exceptions are caught globally and returned as structured JSON responses.

### Exception Handlers

| Exception | HTTP Status | Error Key | Response Message |
|-----------|-------------|-----------|-----------------|
| `MethodArgumentNotValidException` | 400 Bad Request | `"Validation Failed"` | Field-level error map (`{field: message}`) |
| `BadCredentialsException` | 401 Unauthorized | `"Unauthorized"` | `"Invalid email or password"` |
| `UsernameNotFoundException` | 401 Unauthorized | `"Unauthorized"` | `"Invalid email or password"` |
| `NoResourceFoundException` | 404 Not Found | (empty body) | (no body) |
| `RuntimeException` | 400 Bad Request | `"Bad Request"` | Exception message |
| `Exception` (generic) | 500 Internal Server Error | `"Internal Server Error"` | `"An unexpected error occurred"` |

### Standard Error Response Format
```json
{
  "timestamp": "2026-02-10T12:00:00",
  "status": 400,
  "error": "Bad Request",
  "message": "Human-readable error message"
}
```

### Validation Error Response Format
```json
{
  "timestamp": "2026-02-10T12:00:00",
  "status": 400,
  "error": "Validation Failed",
  "errors": {
    "fieldName1": "must not be blank",
    "fieldName2": "must be positive"
  }
}
```

---

## 1. AuthController

**Class:** `AuthController`
**Base Path:** `/api/auth`
**Authentication:** Mixed (login/refresh are public; me/logout require auth)

| Method | Path | Description | Request Body | Response Type | Auth |
|--------|------|-------------|-------------|---------------|------|
| `POST` | `/api/auth/login` | User login | `LoginRequest` (`@Valid`) | `LoginResponse` | Public |
| `GET` | `/api/auth/me` | Get current authenticated user | - | `LoginResponse.UserInfo` | Required |
| `POST` | `/api/auth/refresh` | Refresh JWT token | `Map<String, String>` (`refreshToken` key) | `LoginResponse` | Public |
| `POST` | `/api/auth/logout` | Logout (stateless - client removes token) | - | `Map<String, String>` | Required |

### Method Signatures
```java
ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request)
ResponseEntity<LoginResponse.UserInfo> getCurrentUser()
ResponseEntity<LoginResponse> refreshToken(@RequestBody Map<String, String> request)
ResponseEntity<Map<String, String>> logout()
```

---

## 2. DashboardController

**Class:** `DashboardController`
**Base Path:** `/api/dashboard`
**Authentication:** Required

| Method | Path | Query Params | Description | Response Type |
|--------|------|-------------|-------------|---------------|
| `GET` | `/api/dashboard/summary` | - | Dashboard summary with all key metrics | `DashboardDTO.Summary` |
| `GET` | `/api/dashboard/recent-activity` | `limit` (default: 5) | Recent production activity | `List<DashboardDTO.RecentActivity>` |

### Method Signatures
```java
ResponseEntity<DashboardDTO.Summary> getDashboardSummary()
ResponseEntity<List<DashboardDTO.RecentActivity>> getRecentActivity(@RequestParam(defaultValue = "5") int limit)
```

---

## 3. OrderController

**Class:** `OrderController`
**Base Path:** `/api/orders`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/orders` | - | - | List all active orders (non-paginated) | `List<OrderDTO>` |
| `GET` | `/api/orders/available` | - | - | Orders with READY operations | `List<OrderDTO>` |
| `GET` | `/api/orders/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated orders | `PagedResponseDTO<OrderDTO>` |
| `GET` | `/api/orders/{orderId}` | - | - | Get order by ID | `OrderDTO` |
| `POST` | `/api/orders` | - | `CreateOrderRequest` (`@Valid`) | Create order with line items | `OrderDTO` (201) |
| `PUT` | `/api/orders/{orderId}` | - | `UpdateOrderRequest` (`@Valid`) | Update order basic info | `OrderDTO` |
| `DELETE` | `/api/orders/{orderId}` | - | - | Soft delete (status -> CANCELLED) | `void` (204) |
| `POST` | `/api/orders/{orderId}/line-items` | - | `LineItemRequest` (`@Valid`) | Add line item to order | `OrderDTO` (201) |
| `PUT` | `/api/orders/{orderId}/line-items/{lineItemId}` | - | `LineItemRequest` (`@Valid`) | Update line item | `OrderDTO` |
| `DELETE` | `/api/orders/{orderId}/line-items/{lineItemId}` | - | - | Delete line item | `OrderDTO` |

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number (0-indexed) |
| `size` | int | 20 | Page size |
| `sortBy` | String | (null) | Sort field |
| `sortDirection` | String | DESC | ASC or DESC |
| `search` | String | (null) | Search term for order number or customer name |
| `status` | String | (null) | Filter by status |

---

## 4. ProductionController

**Class:** `ProductionController`
**Base Path:** `/api/production`
**Authentication:** Required

| Method | Path | Request Body | Description | Response Type |
|--------|------|-------------|-------------|---------------|
| `POST` | `/api/production/confirm` | `ProductionConfirmationDTO.Request` (`@Valid`) | Submit production confirmation | `ProductionConfirmationDTO.Response` |
| `GET` | `/api/production/operations/{operationId}` | - | Get operation details for confirmation | `Map<String, Object>` |
| `POST` | `/api/production/confirmations/{confirmationId}/reject` | `Map<String, String>` (`reason`, `notes`) | Reject a production confirmation | `ProductionConfirmationDTO.StatusUpdateResponse` |
| `GET` | `/api/production/confirmations/{confirmationId}` | - | Get confirmation by ID | `ProductionConfirmationDTO.Response` |
| `GET` | `/api/production/confirmations/status/{status}` | - | Get confirmations by status | `List<ProductionConfirmationDTO.Response>` |
| `GET` | `/api/production/confirmations/rejected` | - | Get rejected confirmations | `List<ProductionConfirmationDTO.Response>` |
| `GET` | `/api/production/confirmations/partial` | - | Get partial confirmations (P13) | `List<ProductionConfirmationDTO.Response>` |
| `GET` | `/api/production/operations/continuable` | - | Operations with partial progress (P13) | `List<Map<String, Object>>` |

---

## 5. OperationController

**Class:** `OperationController`
**Base Path:** `/api/operations`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/operations` | - | - | Get all operations | `List<OperationDTO>` |
| `GET` | `/api/operations/paged` | `page`, `size`, `sortBy`, `sortDirection`, `status`, `type`, `search` | - | Paginated operations | `PagedResponseDTO<OperationDTO>` |
| `GET` | `/api/operations/{id}` | - | - | Get operation by ID | `OperationDTO` |
| `GET` | `/api/operations/status/{status}` | - | - | Get operations by status | `List<OperationDTO>` |
| `GET` | `/api/operations/blocked` | - | - | Get blocked operations | `List<OperationDTO>` |
| `POST` | `/api/operations/{id}/block` | - | `OperationDTO.BlockRequest` | Block an operation | `OperationDTO.StatusUpdateResponse` |
| `POST` | `/api/operations/{id}/unblock` | - | - | Unblock an operation | `OperationDTO.StatusUpdateResponse` |
| `POST` | `/api/operations/{id}/pause` | - | - | Pause in-progress operation (R-11) | `OperationDTO.StatusUpdateResponse` |
| `POST` | `/api/operations/{id}/resume` | - | - | Resume paused operation (R-11) | `OperationDTO.StatusUpdateResponse` |

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 20 | Page size |
| `sortBy` | String | (null) | Sort field |
| `sortDirection` | String | ASC | ASC or DESC |
| `status` | String | (null) | Filter by status |
| `type` | String | (null) | Filter by operation type |
| `search` | String | (null) | Search term |

---

## 6. BatchController

**Class:** `BatchController`
**Base Path:** `/api/batches`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/batches` | - | - | Get all batches (non-paginated) | `List<BatchDTO>` |
| `GET` | `/api/batches/preview-number` | `operationType`, `productSku` | - | Preview next batch number (P07) | `BatchDTO.BatchNumberPreview` |
| `GET` | `/api/batches/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated batches | `PagedResponseDTO<BatchDTO>` |
| `GET` | `/api/batches/{batchId}` | - | - | Get batch by ID | `BatchDTO` |
| `GET` | `/api/batches/{batchId}/genealogy` | - | - | Batch traceability tree | `BatchDTO.Genealogy` |
| `POST` | `/api/batches` | - | `BatchDTO.CreateBatchRequest` (`@Valid`) | **BLOCKED** - Manual creation disabled | Throws `RuntimeException` |
| `POST` | `/api/batches/{batchId}/adjust-quantity` | - | `BatchDTO.AdjustQuantityRequest` (`@Valid`) | Adjust batch quantity with reason | `BatchDTO.AdjustQuantityResponse` |
| `GET` | `/api/batches/{batchId}/adjustments` | - | - | Get adjustment history | `List<BatchDTO.QuantityAdjustmentHistory>` |
| `PUT` | `/api/batches/{batchId}` | - | `BatchDTO.UpdateBatchRequest` (`@Valid`) | Update a batch | `BatchDTO` |
| `DELETE` | `/api/batches/{batchId}` | - | - | Soft delete (scrap) | `BatchDTO.StatusUpdateResponse` |
| `GET` | `/api/batches/available` | `materialId` | - | Available batches (by material) | `List<BatchDTO>` |
| `POST` | `/api/batches/{batchId}/split` | - | `BatchDTO.SplitRequest` (`@Valid`) | Split batch into multiple | `BatchDTO.SplitResponse` |
| `POST` | `/api/batches/merge` | - | `BatchDTO.MergeRequest` (`@Valid`) | Merge multiple batches | `BatchDTO.MergeResponse` |
| `GET` | `/api/batches/status/{status}` | - | - | Get batches by status | `List<BatchDTO>` |
| `GET` | `/api/batches/produced` | - | - | Produced batches pending approval | `List<BatchDTO>` |
| `GET` | `/api/batches/pending-approval` | - | - | QUALITY_PENDING batches | `List<BatchDTO>` |
| `POST` | `/api/batches/{batchId}/quality-check` | - | - | Send for quality check | `BatchDTO.StatusUpdateResponse` |
| `POST` | `/api/batches/{batchId}/approve` | - | - | Approve batch | `BatchDTO.StatusUpdateResponse` |
| `POST` | `/api/batches/{batchId}/reject` | - | `BatchDTO.RejectionRequest` | Reject batch with reason | `BatchDTO.StatusUpdateResponse` |
| `GET` | `/api/batches/{batchId}/validate/split` | - | - | Validate split quantity invariant (B16) | `BatchDTO.ValidationResult` |
| `GET` | `/api/batches/{batchId}/validate/merge` | - | - | Validate merge quantity invariant (B17) | `BatchDTO.ValidationResult` |
| `GET` | `/api/batches/{batchId}/validate/genealogy` | - | - | Validate all genealogy invariants | `List<BatchDTO.ValidationResult>` |
| `GET` | `/api/batches/{batchId}/can-consume` | - | - | Check if batch can be consumed (B19) | `Map<String, Object>` |

---

## 7. BatchAllocationController

**Class:** `BatchAllocationController`
**Base Path:** `/api/batch-allocations`
**Authentication:** Required

| Method | Path | Request Body | Description | Response Type |
|--------|------|-------------|-------------|---------------|
| `POST` | `/api/batch-allocations` | `BatchAllocationDTO.AllocateRequest` | Allocate batch to order line | `BatchAllocationDTO.AllocationInfo` |
| `PUT` | `/api/batch-allocations/{allocationId}/release` | - | Release an allocation | `BatchAllocationDTO.AllocationInfo` |
| `PUT` | `/api/batch-allocations/{allocationId}/quantity` | `BatchAllocationDTO.UpdateQuantityRequest` | Update allocation quantity | `BatchAllocationDTO.AllocationInfo` |
| `GET` | `/api/batch-allocations/batch/{batchId}` | - | Get allocations for a batch | `List<BatchAllocationDTO.AllocationInfo>` |
| `GET` | `/api/batch-allocations/order-line/{orderLineId}` | - | Get allocations for an order line | `List<BatchAllocationDTO.AllocationInfo>` |
| `GET` | `/api/batch-allocations/batch/{batchId}/availability` | - | Get batch availability details | `BatchAllocationDTO.BatchAvailability` |

---

## 8. InventoryController

**Class:** `InventoryController`
**Base Path:** `/api/inventory`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/inventory` | - | - | Get all inventory (non-paginated) | `List<InventoryDTO>` |
| `GET` | `/api/inventory/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status`, `type` | - | Paginated inventory | `PagedResponseDTO<InventoryDTO>` |
| `GET` | `/api/inventory/available` | `materialId` | - | Available inventory for consumption (RM/IM) | `List<InventoryDTO>` |
| `GET` | `/api/inventory/state/{state}` | - | - | Inventory by state | `List<InventoryDTO>` |
| `GET` | `/api/inventory/type/{type}` | - | - | Inventory by type (RM/IM/FG/WIP) | `List<InventoryDTO>` |
| `GET` | `/api/inventory/{id}` | - | - | Get inventory by ID | `InventoryDTO` |
| `POST` | `/api/inventory` | - | `InventoryDTO.CreateInventoryRequest` (`@Valid`) | Create new inventory | `InventoryDTO` (201) |
| `PUT` | `/api/inventory/{id}` | - | `InventoryDTO.UpdateInventoryRequest` (`@Valid`) | Update inventory | `InventoryDTO` |
| `DELETE` | `/api/inventory/{id}` | - | - | Soft delete (scrap) | `InventoryDTO.StateUpdateResponse` |
| `GET` | `/api/inventory/blocked` | - | - | Get blocked inventory | `List<InventoryDTO>` |
| `GET` | `/api/inventory/scrapped` | - | - | Get scrapped inventory | `List<InventoryDTO>` |
| `POST` | `/api/inventory/{id}/block` | - | `InventoryDTO.BlockRequest` | Block inventory | `InventoryDTO.StateUpdateResponse` |
| `POST` | `/api/inventory/{id}/unblock` | - | - | Unblock inventory | `InventoryDTO.StateUpdateResponse` |
| `POST` | `/api/inventory/{id}/scrap` | - | `InventoryDTO.ScrapRequest` | Scrap inventory | `InventoryDTO.StateUpdateResponse` |
| `GET` | `/api/inventory/reserved` | - | - | Get reserved inventory | `List<InventoryDTO>` |
| `GET` | `/api/inventory/reserved/order/{orderId}` | - | - | Reserved inventory for a specific order | `List<InventoryDTO>` |
| `POST` | `/api/inventory/{id}/reserve` | - | `InventoryDTO.ReserveRequest` | Reserve inventory | `InventoryDTO.StateUpdateResponse` |
| `POST` | `/api/inventory/{id}/release-reservation` | - | - | Release reservation | `InventoryDTO.StateUpdateResponse` |
| `POST` | `/api/inventory/receive-material` | - | `InventoryDTO.ReceiveMaterialRequest` (`@Valid`) | Receive raw material (creates Batch + Inventory) | `InventoryDTO.ReceiveMaterialResponse` (201) |

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 20 | Page size |
| `sortBy` | String | (null) | Sort field |
| `sortDirection` | String | DESC | ASC or DESC |
| `search` | String | (null) | Search term |
| `status` | String | (null) | Filter by state |
| `type` | String | (null) | Filter by material type (RM/IM/FG/WIP) |

---

## 9. InventoryMovementController

**Class:** `InventoryMovementController`
**Base Path:** `/api/inventory-movements`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `POST` | `/api/inventory-movements` | - | `InventoryMovementDTO.RecordMovementRequest` | Record a movement | `InventoryMovementDTO.MovementInfo` |
| `GET` | `/api/inventory-movements/inventory/{inventoryId}` | - | - | Movements for an inventory | `List<InventoryMovementDTO.MovementInfo>` |
| `GET` | `/api/inventory-movements/operation/{operationId}` | - | - | Movements for an operation | `List<InventoryMovementDTO.MovementInfo>` |
| `GET` | `/api/inventory-movements/batch/{batchId}` | - | - | Movements for a batch | `List<InventoryMovementDTO.MovementInfo>` |
| `GET` | `/api/inventory-movements/range` | `startTime` (ISO DateTime), `endTime` (ISO DateTime) | - | Movements in time range | `List<InventoryMovementDTO.MovementInfo>` |
| `GET` | `/api/inventory-movements/recent` | `limit` (default: 10) | - | Recent movements | `List<InventoryMovementDTO.MovementInfo>` |
| `GET` | `/api/inventory-movements/pending` | - | - | Pending movements | `List<InventoryMovementDTO.MovementInfo>` |
| `PUT` | `/api/inventory-movements/{movementId}/execute` | - | - | Execute a pending movement | `InventoryMovementDTO.MovementInfo` |

---

## 10. HoldController

**Class:** `HoldController`
**Base Path:** `/api/holds`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `POST` | `/api/holds` | - | `HoldDTO.ApplyHoldRequest` (`@Valid`) | Apply hold to an entity | `HoldDTO.HoldResponse` |
| `PUT` | `/api/holds/{holdId}/release` | - | `HoldDTO.ReleaseHoldRequest` (optional) | Release a hold | `HoldDTO.HoldResponse` |
| `GET` | `/api/holds/active` | - | - | Get all active holds | `List<HoldDTO.HoldResponse>` |
| `GET` | `/api/holds/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status`, `type` | - | Paginated holds | `PagedResponseDTO<HoldDTO.HoldResponse>` |
| `GET` | `/api/holds/count` | - | - | Active hold count | `HoldDTO.HoldCountResponse` |
| `GET` | `/api/holds/entity/{entityType}/{entityId}` | - | - | Holds for a specific entity | `List<HoldDTO.HoldResponse>` |
| `GET` | `/api/holds/check/{entityType}/{entityId}` | - | - | Check if entity is on hold | `Map<String, Boolean>` |

**Note:** The `releaseHold` path uses regex constraint `{holdId:\\d+}` to match numeric IDs only.

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 20 | Page size |
| `sortBy` | String | (null) | Sort field |
| `sortDirection` | String | DESC | ASC or DESC |
| `search` | String | (null) | Search term |
| `status` | String | (null) | Filter by hold status |
| `type` | String | (null) | Filter by entity type |

---

## 11. EquipmentController

**Class:** `EquipmentController`
**Base Path:** `/api/equipment`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/equipment` | - | - | Get all equipment | `List<EquipmentDTO>` |
| `GET` | `/api/equipment/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status`, `type` | - | Paginated equipment | `PagedResponseDTO<EquipmentDTO>` |
| `GET` | `/api/equipment/{id}` | - | - | Get equipment by ID | `EquipmentDTO` |
| `GET` | `/api/equipment/status/{status}` | - | - | Equipment by status | `List<EquipmentDTO>` |
| `GET` | `/api/equipment/maintenance` | - | - | Equipment under maintenance | `List<EquipmentDTO>` |
| `GET` | `/api/equipment/on-hold` | - | - | Equipment on hold | `List<EquipmentDTO>` |
| `POST` | `/api/equipment` | - | `EquipmentDTO.CreateEquipmentRequest` (`@Valid`) | Create new equipment | `EquipmentDTO` (201) |
| `PUT` | `/api/equipment/{id}` | - | `EquipmentDTO.UpdateEquipmentRequest` (`@Valid`) | Update equipment | `EquipmentDTO` |
| `DELETE` | `/api/equipment/{id}` | - | - | Soft delete | `Map<String, String>` |
| `POST` | `/api/equipment/{id}/maintenance/start` | - | `EquipmentDTO.MaintenanceRequest` | Start maintenance | `EquipmentDTO.StatusUpdateResponse` |
| `POST` | `/api/equipment/{id}/maintenance/end` | - | - | End maintenance | `EquipmentDTO.StatusUpdateResponse` |
| `POST` | `/api/equipment/{id}/hold` | - | `EquipmentDTO.HoldRequest` | Put on hold | `EquipmentDTO.StatusUpdateResponse` |
| `POST` | `/api/equipment/{id}/release` | - | - | Release from hold | `EquipmentDTO.StatusUpdateResponse` |

**Note:** Path variable `{id}` uses regex constraint `{id:\\d+}` to match numeric IDs only.

---

## 12. EquipmentUsageController

**Class:** `EquipmentUsageController`
**Base Path:** `/api/equipment-usage`
**Authentication:** Required

| Method | Path | Request Body | Description | Response Type |
|--------|------|-------------|-------------|---------------|
| `POST` | `/api/equipment-usage` | `EquipmentUsageDTO.LogUsageRequest` | Log equipment usage | `EquipmentUsageDTO.UsageInfo` |
| `POST` | `/api/equipment-usage/bulk` | `EquipmentUsageDTO.BulkLogRequest` | Log bulk equipment usage | `void` (200) |
| `GET` | `/api/equipment-usage/operation/{operationId}` | - | Usage records for an operation | `List<EquipmentUsageDTO.UsageInfo>` |
| `GET` | `/api/equipment-usage/equipment/{equipmentId}` | - | Usage history for equipment | `List<EquipmentUsageDTO.UsageInfo>` |
| `GET` | `/api/equipment-usage/operator/{operatorId}` | - | Usage history for operator | `List<EquipmentUsageDTO.UsageInfo>` |
| `GET` | `/api/equipment-usage/equipment/{equipmentId}/in-use` | - | Check if equipment is in use | `Boolean` |
| `PUT` | `/api/equipment-usage/{usageId}/confirm` | - | Confirm usage record | `EquipmentUsageDTO.UsageInfo` |

---

## 13. BomController

**Class:** `BomController`
**Base Path:** `/api/bom`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/bom/{productSku}/requirements` | - | - | BOM requirements for a product | `BomDTO.BomTreeResponse` |
| `GET` | `/api/bom/{productSku}/requirements/level/{level}` | - | - | BOM requirements for a specific level | `List<BomDTO.BomRequirement>` |
| `POST` | `/api/bom/validate` | - | `BomDTO.BomValidationRequest` | Validate material consumption against BOM | `BomDTO.BomValidationResult` |
| `GET` | `/api/bom/operation/{operationId}/suggested-consumption` | - | - | Suggested consumption from BOM (GAP-004) | `BomDTO.SuggestedConsumptionResponse` |
| `GET` | `/api/bom/{productSku}/tree` | - | - | Full hierarchical BOM tree | `BomDTO.BomTreeFullResponse` |
| `GET` | `/api/bom/{productSku}/tree/version/{version}` | - | - | BOM tree for a specific version | `BomDTO.BomTreeFullResponse` |
| `GET` | `/api/bom/{productSku}/list` | - | - | Flat list of BOM nodes (table view) | `List<BomDTO.BomListResponse>` |
| `GET` | `/api/bom/node/{bomId}` | - | - | Single BOM node by ID | `BomDTO.BomTreeNode` |
| `GET` | `/api/bom/products` | - | - | All products with BOMs | `List<BomDTO.BomProductSummary>` |
| `GET` | `/api/bom/products/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search` | - | Paginated products with BOMs | `PagedResponseDTO<BomDTO.BomProductSummary>` |
| `GET` | `/api/bom/{productSku}/versions` | - | - | Available versions for product | `List<String>` |
| `POST` | `/api/bom/node` | - | `BomDTO.CreateBomNodeRequest` | Create a single BOM node | `BomDTO.BomTreeNode` |
| `POST` | `/api/bom/tree` | - | `BomDTO.CreateBomTreeRequest` | Create full BOM tree (batch) | `BomDTO.BomTreeFullResponse` |
| `PUT` | `/api/bom/node/{bomId}` | - | `BomDTO.UpdateBomNodeRequest` | Update a BOM node | `BomDTO.BomTreeNode` |
| `PUT` | `/api/bom/{productSku}/settings` | - | `BomDTO.UpdateBomSettingsRequest` | Update BOM settings (version, status) | `BomDTO.UpdateBomSettingsResponse` |
| `PUT` | `/api/bom/node/{bomId}/move` | - | `BomDTO.MoveBomNodeRequest` | Move BOM node to new parent | `BomDTO.BomTreeNode` |
| `DELETE` | `/api/bom/node/{bomId}` | - | - | Delete BOM node (soft) | `Map<String, String>` |
| `DELETE` | `/api/bom/node/{bomId}/cascade` | - | - | Delete BOM node with all children | `Map<String, Object>` |
| `DELETE` | `/api/bom/{productSku}/tree` | - | - | Delete entire product BOM tree | `Map<String, Object>` |

---

## 14. RoutingController

**Class:** `RoutingController`
**Base Path:** `/api/routing`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/routing` | `status` | - | List all routings (optional status filter) | `List<RoutingDTO.RoutingInfo>` |
| `GET` | `/api/routing/paged` | `page`, `size`, `sortBy`, `sortDirection`, `status`, `type`, `search` | - | Paginated routings | `PagedResponseDTO<RoutingDTO.RoutingInfo>` |
| `GET` | `/api/routing/{routingId}` | - | - | Get routing by ID with steps | `RoutingDTO.RoutingInfo` |
| `GET` | `/api/routing/process/{processId}` | - | - | Active routing for a process (runtime) | `RoutingDTO.RoutingInfo` |
| `GET` | `/api/routing/template/{templateId}` | - | - | Active routing for a process template (design-time) | `RoutingDTO.RoutingInfo` |
| `GET` | `/api/routing/{routingId}/steps` | - | - | Routing steps in order | `List<RoutingDTO.RoutingStepInfo>` |
| `GET` | `/api/routing/operation/{operationId}/can-proceed` | - | - | Check if operation can proceed | `Boolean` |
| `GET` | `/api/routing/{routingId}/complete` | - | - | Check if routing is complete | `Boolean` |
| `GET` | `/api/routing/{routingId}/status` | - | - | Routing status summary | `RoutingDTO.RoutingStatus` |
| `GET` | `/api/routing/{routingId}/locked` | - | - | Check if routing is locked | `Boolean` |
| `POST` | `/api/routing` | - | `RoutingDTO.CreateRoutingRequest` | Create new routing | `RoutingDTO.RoutingInfo` (201) |
| `PUT` | `/api/routing/{routingId}` | - | `RoutingDTO.UpdateRoutingRequest` | Update routing | `RoutingDTO.RoutingInfo` |
| `DELETE` | `/api/routing/{routingId}` | - | - | Delete routing (soft) | `void` (204) |
| `POST` | `/api/routing/{routingId}/activate` | - | `RoutingDTO.ActivateRoutingRequest` (optional) | Activate routing | `RoutingDTO.RoutingInfo` |
| `POST` | `/api/routing/{routingId}/deactivate` | - | - | Deactivate routing | `RoutingDTO.RoutingInfo` |
| `POST` | `/api/routing/{routingId}/hold` | - | `RoutingDTO.HoldRoutingRequest` (optional) | Put routing on hold | `RoutingDTO.RoutingInfo` |
| `POST` | `/api/routing/{routingId}/release` | - | - | Release routing from hold | `RoutingDTO.RoutingInfo` |
| `POST` | `/api/routing/{routingId}/steps` | - | `RoutingDTO.CreateRoutingStepRequest` | Create routing step | `RoutingDTO.RoutingStepInfo` (201) |
| `PUT` | `/api/routing/steps/{stepId}` | - | `RoutingDTO.UpdateRoutingStepRequest` | Update routing step | `RoutingDTO.RoutingStepInfo` |
| `DELETE` | `/api/routing/steps/{stepId}` | - | - | Delete routing step | `void` (204) |
| `POST` | `/api/routing/{routingId}/reorder` | - | `RoutingDTO.ReorderStepsRequest` | Reorder routing steps | `List<RoutingDTO.RoutingStepInfo>` |

---

## 15. ProcessController

**Class:** `ProcessController`
**Base Path:** `/api/processes`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/processes` | - | - | Get all processes | `List<ProcessDTO.Response>` |
| `GET` | `/api/processes/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated processes | `PagedResponseDTO<ProcessDTO.Response>` |
| `GET` | `/api/processes/active` | - | - | Get active processes | `List<ProcessDTO.Response>` |
| `GET` | `/api/processes/{processId}` | - | - | Get process by ID | `ProcessDTO.Response` |
| `GET` | `/api/processes/status/{status}` | - | - | Processes by status (DRAFT/ACTIVE/INACTIVE) | `List<ProcessDTO.Response>` |
| `POST` | `/api/processes` | - | `ProcessDTO.CreateRequest` (`@Valid`) | Create process (defaults to DRAFT) | `ProcessDTO.Response` |
| `PUT` | `/api/processes/{processId}` | - | `ProcessDTO.UpdateRequest` (`@Valid`) | Update process | `ProcessDTO.Response` |
| `DELETE` | `/api/processes/{processId}` | - | - | Soft delete (INACTIVE) | `void` (204) |
| `POST` | `/api/processes/{processId}/activate` | - | - | Activate process | `ProcessDTO.Response` |
| `POST` | `/api/processes/{processId}/deactivate` | - | - | Deactivate process | `ProcessDTO.Response` |

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 10 | Page size |
| `sortBy` | String | processId | Sort field |
| `sortDirection` | String | ASC | ASC or DESC |
| `search` | String | (null) | Search term |
| `status` | String | (null) | Filter by status |

---

## 16. OperationTemplateController

**Class:** `OperationTemplateController`
**Base Path:** `/api/operation-templates`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/operation-templates` | - | - | Get all templates | `List<OperationTemplateDTO.Response>` |
| `GET` | `/api/operation-templates/active` | - | - | Get active templates | `List<OperationTemplateDTO.Response>` |
| `GET` | `/api/operation-templates/paged` | `page`, `size`, `sortBy`, `sortDirection`, `status`, `type`, `search` | - | Paginated templates | `PagedResponseDTO<OperationTemplateDTO.Response>` |
| `GET` | `/api/operation-templates/{id}` | - | - | Get template by ID | `OperationTemplateDTO.Response` |
| `GET` | `/api/operation-templates/by-type/{type}` | - | - | Templates by operation type | `List<OperationTemplateDTO.Response>` |
| `GET` | `/api/operation-templates/summaries` | - | - | Template summaries (for dropdowns) | `List<OperationTemplateDTO.Summary>` |
| `GET` | `/api/operation-templates/types` | - | - | Distinct operation types | `List<String>` |
| `POST` | `/api/operation-templates` | - | `OperationTemplateDTO.CreateRequest` | Create template | `OperationTemplateDTO.Response` |
| `PUT` | `/api/operation-templates/{id}` | - | `OperationTemplateDTO.UpdateRequest` | Update template | `OperationTemplateDTO.Response` |
| `POST` | `/api/operation-templates/{id}/activate` | - | - | Activate template | `OperationTemplateDTO.Response` |
| `POST` | `/api/operation-templates/{id}/deactivate` | - | - | Deactivate template | `OperationTemplateDTO.Response` |
| `DELETE` | `/api/operation-templates/{id}` | - | - | Soft delete (INACTIVE) | `void` (204) |

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 20 | Page size |
| `sortBy` | String | operationName | Sort field |
| `sortDirection` | String | ASC | ASC or DESC |
| `status` | String | (null) | Filter by status |
| `type` | String | (null) | Filter by operation type |
| `search` | String | (null) | Search term |

---

## 17. CustomerController

**Class:** `CustomerController`
**Base Path:** `/api/customers`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/customers` | - | - | Get all customers (non-paginated) | `List<CustomerDTO>` |
| `GET` | `/api/customers/active` | - | - | Active customers (for dropdowns) | `List<CustomerDTO>` |
| `GET` | `/api/customers/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated customers | `PagedResponseDTO<CustomerDTO>` |
| `GET` | `/api/customers/{id}` | - | - | Get customer by ID | `CustomerDTO` |
| `GET` | `/api/customers/code/{code}` | - | - | Get customer by code | `CustomerDTO` |
| `POST` | `/api/customers` | - | `CustomerDTO` (`@Valid`) | Create customer | `CustomerDTO` (201) |
| `PUT` | `/api/customers/{id}` | - | `CustomerDTO` (`@Valid`) | Update customer | `CustomerDTO` |
| `DELETE` | `/api/customers/{id}` | - | - | Soft delete (INACTIVE) | `Map<String, String>` |
| `DELETE` | `/api/customers/{id}/permanent` | - | - | Hard delete (permanent) | `Map<String, String>` |

---

## 18. MaterialController

**Class:** `MaterialController`
**Base Path:** `/api/materials`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/materials` | - | - | Get all materials (non-paginated) | `List<MaterialDTO>` |
| `GET` | `/api/materials/active` | - | - | Active materials (for dropdowns) | `List<MaterialDTO>` |
| `GET` | `/api/materials/active/type/{type}` | - | - | Active materials by type | `List<MaterialDTO>` |
| `GET` | `/api/materials/consumable` | - | - | Consumable materials (RM and IM) | `List<MaterialDTO>` |
| `GET` | `/api/materials/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status`, `type` | - | Paginated materials | `PagedResponseDTO<MaterialDTO>` |
| `GET` | `/api/materials/{id}` | - | - | Get material by ID | `MaterialDTO` |
| `GET` | `/api/materials/code/{code}` | - | - | Get material by code | `MaterialDTO` |
| `POST` | `/api/materials` | - | `MaterialDTO` (`@Valid`) | Create material | `MaterialDTO` (201) |
| `PUT` | `/api/materials/{id}` | - | `MaterialDTO` (`@Valid`) | Update material | `MaterialDTO` |
| `DELETE` | `/api/materials/{id}` | - | - | Soft delete (INACTIVE) | `Map<String, String>` |

---

## 19. ProductController

**Class:** `ProductController`
**Base Path:** `/api/products`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/products` | - | - | Get all products (non-paginated) | `List<ProductDTO>` |
| `GET` | `/api/products/active` | - | - | Active products (for dropdowns) | `List<ProductDTO>` |
| `GET` | `/api/products/active/category/{category}` | - | - | Active products by category | `List<ProductDTO>` |
| `GET` | `/api/products/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status`, `category` | - | Paginated products | `PagedResponseDTO<ProductDTO>` |
| `GET` | `/api/products/{id}` | - | - | Get product by ID | `ProductDTO` |
| `GET` | `/api/products/sku/{sku}` | - | - | Get product by SKU | `ProductDTO` |
| `POST` | `/api/products` | - | `ProductDTO` (`@Valid`) | Create product | `ProductDTO` (201) |
| `PUT` | `/api/products/{id}` | - | `ProductDTO` (`@Valid`) | Update product | `ProductDTO` |
| `DELETE` | `/api/products/{id}` | - | - | Soft delete (INACTIVE) | `Map<String, String>` |

---

## 20. OperatorController

**Class:** `OperatorController`
**Base Path:** `/api/operators`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/operators` | - | - | Get all operators | `List<OperatorDTO>` |
| `GET` | `/api/operators/active` | - | - | Active operators | `List<OperatorDTO>` |
| `GET` | `/api/operators/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated operators | `PagedResponseDTO<OperatorDTO>` |
| `GET` | `/api/operators/{id}` | - | - | Get operator by ID | `OperatorDTO` |
| `POST` | `/api/operators` | - | `OperatorDTO` (`@Valid`) | Create operator | `OperatorDTO` (201) |
| `PUT` | `/api/operators/{id}` | - | `OperatorDTO` (`@Valid`) | Update operator | `OperatorDTO` |
| `DELETE` | `/api/operators/{id}` | - | - | Soft delete | `Map<String, String>` |

---

## 21. UserController

**Class:** `UserController`
**Base Path:** `/api/users`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/users` | - | - | Get all users | `List<UserDTO>` |
| `GET` | `/api/users/active` | - | - | Get active users | `List<UserDTO>` |
| `GET` | `/api/users/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated users | `PagedResponseDTO<UserDTO>` |
| `GET` | `/api/users/{id}` | - | - | Get user by ID | `UserDTO` |
| `POST` | `/api/users` | - | `UserDTO.CreateUserRequest` (`@Valid`) | Create user | `UserDTO` |
| `PUT` | `/api/users/{id}` | - | `UserDTO.UpdateUserRequest` (`@Valid`) | Update user | `UserDTO` |
| `DELETE` | `/api/users/{id}` | - | - | Deactivate user | `Map<String, String>` |
| `POST` | `/api/users/me/change-password` | - | `UserDTO.ChangePasswordRequest` (`@Valid`) | Change current user's password (uses JWT) | `Map<String, String>` |
| `POST` | `/api/users/{id}/change-password` | - | `UserDTO.ChangePasswordRequest` (`@Valid`) | Change password by user ID (admin) | `Map<String, String>` |
| `POST` | `/api/users/{id}/reset-password` | - | `UserDTO.ResetPasswordRequest` (`@Valid`) | Admin reset password | `Map<String, String>` |
| `POST` | `/api/users/{id}/activate` | - | - | Activate user | `UserDTO` |
| `POST` | `/api/users/{id}/deactivate` | - | - | Deactivate user | `UserDTO` |

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 10 | Page size |
| `sortBy` | String | userId | Sort field |
| `sortDirection` | String | ASC | ASC or DESC |
| `search` | String | (null) | Search term |
| `status` | String | (null) | Filter by status |

---

## 22. ConfigController

**Class:** `ConfigController`
**Base Path:** `/api/config`
**Authentication:** Required

This controller manages multiple configuration domains. Each domain follows the same CRUD + paged pattern.

### Hold Reasons

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/config/hold-reasons` | - | - | All hold reasons | `List<HoldReasonDTO>` |
| `GET` | `/api/config/hold-reasons/active` | `applicableTo` | - | Active hold reasons (optionally filtered) | `List<HoldReasonDTO>` |
| `GET` | `/api/config/hold-reasons/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated hold reasons | `PagedResponseDTO<HoldReasonDTO>` |
| `GET` | `/api/config/hold-reasons/{id}` | - | - | Hold reason by ID | `HoldReasonDTO` |
| `POST` | `/api/config/hold-reasons` | - | `HoldReasonDTO` (`@Valid`) | Create hold reason | `HoldReasonDTO` (201) |
| `PUT` | `/api/config/hold-reasons/{id}` | - | `HoldReasonDTO` (`@Valid`) | Update hold reason | `HoldReasonDTO` |
| `DELETE` | `/api/config/hold-reasons/{id}` | - | - | Delete hold reason | `Map<String, String>` |

### Delay Reasons

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/config/delay-reasons` | - | - | All delay reasons | `List<DelayReasonDTO>` |
| `GET` | `/api/config/delay-reasons/active` | - | - | Active delay reasons | `List<DelayReasonDTO>` |
| `GET` | `/api/config/delay-reasons/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated delay reasons | `PagedResponseDTO<DelayReasonDTO>` |
| `GET` | `/api/config/delay-reasons/{id}` | - | - | Delay reason by ID | `DelayReasonDTO` |
| `POST` | `/api/config/delay-reasons` | - | `DelayReasonDTO` (`@Valid`) | Create delay reason | `DelayReasonDTO` (201) |
| `PUT` | `/api/config/delay-reasons/{id}` | - | `DelayReasonDTO` (`@Valid`) | Update delay reason | `DelayReasonDTO` |
| `DELETE` | `/api/config/delay-reasons/{id}` | - | - | Delete delay reason | `Map<String, String>` |

### Process Parameters Config

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/config/process-parameters` | - | - | All process parameter configs | `List<ProcessParametersConfigDTO>` |
| `GET` | `/api/config/process-parameters/active` | `operationType`, `productSku` | - | Active configs (optionally filtered) | `List<ProcessParametersConfigDTO>` |
| `GET` | `/api/config/process-parameters/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated configs | `PagedResponseDTO<ProcessParametersConfigDTO>` |
| `GET` | `/api/config/process-parameters/{id}` | - | - | Config by ID | `ProcessParametersConfigDTO` |
| `POST` | `/api/config/process-parameters` | - | `ProcessParametersConfigDTO` (`@Valid`) | Create config | `ProcessParametersConfigDTO` (201) |
| `PUT` | `/api/config/process-parameters/{id}` | - | `ProcessParametersConfigDTO` (`@Valid`) | Update config | `ProcessParametersConfigDTO` |
| `DELETE` | `/api/config/process-parameters/{id}` | - | - | Delete config | `Map<String, String>` |

### Batch Number Config

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/config/batch-number` | - | - | All batch number configs | `List<BatchNumberConfigDTO>` |
| `GET` | `/api/config/batch-number/active` | - | - | Active batch number configs | `List<BatchNumberConfigDTO>` |
| `GET` | `/api/config/batch-number/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated configs | `PagedResponseDTO<BatchNumberConfigDTO>` |
| `GET` | `/api/config/batch-number/{id}` | - | - | Config by ID | `BatchNumberConfigDTO` |
| `POST` | `/api/config/batch-number` | - | `BatchNumberConfigDTO` (`@Valid`) | Create config | `BatchNumberConfigDTO` (201) |
| `PUT` | `/api/config/batch-number/{id}` | - | `BatchNumberConfigDTO` (`@Valid`) | Update config | `BatchNumberConfigDTO` |
| `DELETE` | `/api/config/batch-number/{id}` | - | - | Delete config | `Map<String, String>` |

### Quantity Type Config

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/config/quantity-types` | - | - | All quantity type configs | `List<QuantityTypeConfigDTO>` |
| `GET` | `/api/config/quantity-types/active` | - | - | Active quantity type configs | `List<QuantityTypeConfigDTO>` |
| `GET` | `/api/config/quantity-types/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `status` | - | Paginated configs | `PagedResponseDTO<QuantityTypeConfigDTO>` |
| `GET` | `/api/config/quantity-types/{id}` | - | - | Config by ID | `QuantityTypeConfigDTO` |
| `POST` | `/api/config/quantity-types` | - | `QuantityTypeConfigDTO` (`@Valid`) | Create config | `QuantityTypeConfigDTO` (201) |
| `PUT` | `/api/config/quantity-types/{id}` | - | `QuantityTypeConfigDTO` (`@Valid`) | Update config | `QuantityTypeConfigDTO` |
| `DELETE` | `/api/config/quantity-types/{id}` | - | - | Delete config | `Map<String, String>` |

---

## 23. MasterDataController

**Class:** `MasterDataController`
**Base Path:** `/api/master`
**Authentication:** Required

| Method | Path | Query Params | Description | Response Type |
|--------|------|-------------|-------------|---------------|
| `GET` | `/api/master/equipment` | - | All equipment (entity list) | `List<Equipment>` |
| `GET` | `/api/master/equipment/available` | - | Available equipment | `List<Equipment>` |
| `GET` | `/api/master/operators` | - | All operators | `List<Operator>` |
| `GET` | `/api/master/operators/active` | - | Active operators | `List<Operator>` |
| `GET` | `/api/master/delay-reasons` | - | Active delay reasons (raw SQL) | `List<Map<String, Object>>` |
| `GET` | `/api/master/hold-reasons` | - | Active hold reasons (raw SQL) | `List<Map<String, Object>>` |
| `GET` | `/api/master/process-parameters` | `operationType`, `productSku` | Process parameters config (raw SQL) | `List<Map<String, Object>>` |
| `GET` | `/api/master/equipment-categories` | - | All active equipment categories | `List<Map<String, Object>>` |
| `GET` | `/api/master/equipment-categories/{category}` | - | Config for a specific category | `Map<String, Object>` |
| `GET` | `/api/master/inventory-forms` | - | All active inventory form configs | `List<Map<String, Object>>` |
| `GET` | `/api/master/inventory-forms/{formCode}` | - | Config for a specific form code | `Map<String, Object>` |
| `GET` | `/api/master/quantity-type-config` | `materialCode`, `operationType`, `equipmentType` | Quantity type config (priority-ordered) | `List<Map<String, Object>>` |

**Note:** This controller returns raw entity objects and JDBC result maps (not DTOs) for some endpoints. It serves as a convenience layer for frontend dropdowns and form data.

---

## 24. AuditController

**Class:** `AuditController`
**Base Path:** `/api/audit`
**Authentication:** Required

| Method | Path | Query Params | Description | Response Type |
|--------|------|-------------|-------------|---------------|
| `GET` | `/api/audit/entity/{entityType}/{entityId}` | - | Audit history for a specific entity | `AuditHistoryResponse` |
| `GET` | `/api/audit/recent` | `limit` (default: 50, max: 500) | Recent audit activity | `List<AuditEntryResponse>` |
| `GET` | `/api/audit/paged` | `page`, `size`, `entityType`, `action`, `search` | Paginated audit entries with filters | `PagedResponseDTO<AuditEntryResponse>` |
| `GET` | `/api/audit/production-confirmations` | `limit` (default: 10, max: 100) | Recent production confirmations | `List<AuditEntryResponse>` |
| `GET` | `/api/audit/user/{username}` | `limit` (default: 50, max: 500) | Activity by user | `List<AuditEntryResponse>` |
| `GET` | `/api/audit/range` | `startDate` (ISO DateTime), `endDate` (ISO DateTime) | Activity within date range | `List<AuditEntryResponse>` |
| `GET` | `/api/audit/summary` | - | Today's count + recent activity | `AuditSummary` |
| `GET` | `/api/audit/entity-types` | - | Valid entity types for filtering | `List<String>` |
| `GET` | `/api/audit/action-types` | - | Valid action types for filtering | `List<String>` |

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 20 | Page size |
| `entityType` | String | (null) | Filter by entity type |
| `action` | String | (null) | Filter by action type |
| `search` | String | (null) | Search term |

### Valid Entity Types
`PRODUCTION_CONFIRMATION`, `OPERATION`, `PROCESS`, `INVENTORY`, `BATCH`, `BATCH_RELATION`, `ORDER`, `ORDER_LINE`

### Valid Action Types
`CREATE`, `UPDATE`, `DELETE`, `STATUS_CHANGE`, `CONSUME`, `PRODUCE`, `HOLD`, `RELEASE`

---

## 25. ReportController

**Class:** `ReportController`
**Base Path:** `/api/reports`
**Authentication:** Required

### PDF Reports

| Method | Path | Description | Content-Type | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/reports/pdf/orders` | Export orders as PDF | `application/pdf` | `byte[]` (attachment: `orders-report.pdf`) |
| `GET` | `/api/reports/pdf/inventory` | Export inventory as PDF | `application/pdf` | `byte[]` (attachment: `inventory-report.pdf`) |

### Excel Exports

| Method | Path | Description | Content-Type | Response |
|--------|------|-------------|-------------|----------|
| `GET` | `/api/reports/excel/orders` | Export orders as Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `byte[]` (attachment: `orders-export.xlsx`) |
| `GET` | `/api/reports/excel/inventory` | Export inventory as Excel | `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet` | `byte[]` (attachment: `inventory-export.xlsx`) |

### Charts (PNG Images)

| Method | Path | Query Params | Description | Content-Type |
|--------|------|-------------|-------------|-------------|
| `GET` | `/api/reports/charts/order-status` | `width` (default: 600), `height` (default: 400) | Order status pie chart | `image/png` |
| `GET` | `/api/reports/charts/inventory-type` | `width` (default: 600), `height` (default: 400) | Inventory type chart | `image/png` |
| `GET` | `/api/reports/charts/inventory-state` | `width` (default: 600), `height` (default: 400) | Inventory state chart | `image/png` |

### Image Processing

| Method | Path | Request Params | Description | Content-Type |
|--------|------|---------------|-------------|-------------|
| `POST` | `/api/reports/image/grayscale` | `file` (MultipartFile) | Convert image to grayscale | `image/png` |
| `POST` | `/api/reports/image/resize` | `file` (MultipartFile), `width`, `height` | Resize image | `image/png` |
| `POST` | `/api/reports/image/thumbnail` | `file` (MultipartFile), `maxDimension` (default: 150) | Generate thumbnail | `image/png` |
| `POST` | `/api/reports/image/metadata` | `file` (MultipartFile) | Get image metadata | `Map<String, Object>` (width, height, colorType, sizeBytes) |

### Demo/Health

| Method | Path | Description | Response Type |
|--------|------|-------------|---------------|
| `GET` | `/api/reports/demo` | Report service health check | `Map<String, Object>` (available reports/libraries) |

---

## 26. ReportAnalyticsController

**Class:** `ReportAnalyticsController`
**Base Path:** `/api/reports/analytics`
**Authentication:** Required

| Method | Path | Query Params | Description | Response Type |
|--------|------|-------------|-------------|---------------|
| `GET` | `/api/reports/analytics/production/summary` | `startDate` (ISO Date), `endDate` (ISO Date) | Production summary (total produced, scrap, yield %) | `ReportAnalyticsDTO.ProductionSummary` |
| `GET` | `/api/reports/analytics/production/by-operation` | `startDate` (ISO Date), `endDate` (ISO Date) | Production grouped by operation type | `ReportAnalyticsDTO.ProductionByOperation` |
| `GET` | `/api/reports/analytics/quality/scrap-analysis` | `startDate` (ISO Date), `endDate` (ISO Date) | Scrap analysis by product and operation type | `ReportAnalyticsDTO.ScrapAnalysis` |
| `GET` | `/api/reports/analytics/orders/fulfillment` | - | Order fulfillment metrics | `ReportAnalyticsDTO.OrderFulfillment` |
| `GET` | `/api/reports/analytics/inventory/balance` | - | Inventory balance by type and state | `ReportAnalyticsDTO.InventoryBalance` |
| `GET` | `/api/reports/analytics/operations/cycle-times` | `startDate` (ISO Date), `endDate` (ISO Date) | Operation cycle times (avg/min/max) | `ReportAnalyticsDTO.OperationCycleTimes` |
| `GET` | `/api/reports/analytics/operations/holds` | - | Hold analysis (counts by entity type + top reasons) | `ReportAnalyticsDTO.HoldAnalysis` |
| `GET` | `/api/reports/analytics/executive/dashboard` | - | Executive dashboard (all KPIs, last 30 days) | `ReportAnalyticsDTO.ExecutiveDashboard` |

---

## 27. BatchSizeConfigController

**Class:** `BatchSizeConfigController`
**Base Path:** `/api/batch-size-config`
**Authentication:** Required

| Method | Path | Query Params | Request Body | Description | Response Type |
|--------|------|-------------|-------------|-------------|---------------|
| `GET` | `/api/batch-size-config` | - | - | Get all configs | `List<BatchSizeConfig>` |
| `GET` | `/api/batch-size-config/active` | - | - | Get active configs | `List<BatchSizeConfig>` |
| `GET` | `/api/batch-size-config/paged` | `page`, `size`, `sortBy`, `sortDirection`, `search`, `operationType`, `materialId`, `isActive` | - | Paginated configs | `PagedResponseDTO<BatchSizeConfig>` |
| `GET` | `/api/batch-size-config/{id}` | - | - | Config by ID | `BatchSizeConfig` |
| `POST` | `/api/batch-size-config` | - | `BatchSizeConfig` | Create config | `BatchSizeConfig` |
| `PUT` | `/api/batch-size-config/{id}` | - | `BatchSizeConfig` | Update config | `BatchSizeConfig` |
| `DELETE` | `/api/batch-size-config/{id}` | - | - | Soft delete (inactive) | `Map<String, String>` |
| `GET` | `/api/batch-size-config/check` | `operationType`, `materialId`, `productSku`, `equipmentType` | - | Check applicable config (R-12) | `Map<String, Object>` |
| `GET` | `/api/batch-size-config/calculate` | `quantity`, `operationType`, `materialId`, `productSku`, `equipmentType` | - | Calculate batch sizes | `BatchSizeService.BatchSizeResult` |
| `POST` | `/api/batch-size-config/preview` | - | `Map<String, Object>` (quantity, operationType, materialId, productSku, equipmentType) | Preview batch calculation for UI | `BatchSizeService.BatchSizeResult` |

### Paginated Endpoint Query Parameters
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number |
| `size` | int | 20 | Page size |
| `sortBy` | String | configId | Sort field |
| `sortDirection` | String | DESC | ASC or DESC |
| `search` | String | (null) | Search term |
| `operationType` | String | (null) | Filter by operation type |
| `materialId` | String | (null) | Filter by material ID |
| `isActive` | Boolean | (null) | Filter by active status |

---

## 28. DatabaseResetController

**Class:** `DatabaseResetController`
**Base Path:** `/api/admin/reset`
**Authentication:** Required

**WARNING:** These endpoints can DELETE ALL DATA. Only enabled in non-production environments.

| Method | Path | Query Params | Description | Response Type |
|--------|------|-------------|-------------|---------------|
| `GET` | `/api/admin/reset/status` | - | Check if reset is allowed | `Map<String, Object>` |
| `GET` | `/api/admin/reset/verify` | - | Verify database state (table counts) | `Map<String, Object>` |
| `POST` | `/api/admin/reset/transactional` | - | Reset transactional data only (preserves master data) | `Map<String, Object>` |
| `POST` | `/api/admin/reset/full` | - | Reset ALL data (WARNING: deletes everything) | `Map<String, Object>` |
| `POST` | `/api/admin/reset/demo` | - | Full demo reset: clear + reseed + generate operations | `Map<String, Object>` |
| `POST` | `/api/admin/reset/generate-operations` | - | Generate operations for all order line items | `Map<String, Object>` |
| `POST` | `/api/admin/reset/seed` | - | Seed demo data after reset | `Map<String, Object>` |
| `GET` | `/api/admin/reset/history` | `limit` (default: 10) | Get reset history | `List<Map<String, Object>>` |

**Environment Guard:** All POST operations check `databaseResetService.isResetAllowed()` and return 403 if blocked.

---

## Endpoint Count Summary

| Controller | Base Path | Endpoints |
|-----------|-----------|-----------|
| AuthController | `/api/auth` | 4 |
| DashboardController | `/api/dashboard` | 2 |
| OrderController | `/api/orders` | 10 |
| ProductionController | `/api/production` | 8 |
| OperationController | `/api/operations` | 9 |
| BatchController | `/api/batches` | 23 |
| BatchAllocationController | `/api/batch-allocations` | 6 |
| InventoryController | `/api/inventory` | 19 |
| InventoryMovementController | `/api/inventory-movements` | 8 |
| HoldController | `/api/holds` | 7 |
| EquipmentController | `/api/equipment` | 13 |
| EquipmentUsageController | `/api/equipment-usage` | 7 |
| BomController | `/api/bom` | 19 |
| RoutingController | `/api/routing` | 21 |
| ProcessController | `/api/processes` | 10 |
| OperationTemplateController | `/api/operation-templates` | 12 |
| CustomerController | `/api/customers` | 9 |
| MaterialController | `/api/materials` | 10 |
| ProductController | `/api/products` | 9 |
| OperatorController | `/api/operators` | 7 |
| UserController | `/api/users` | 12 |
| ConfigController | `/api/config` | 35 |
| MasterDataController | `/api/master` | 12 |
| AuditController | `/api/audit` | 9 |
| ReportController | `/api/reports` | 12 |
| ReportAnalyticsController | `/api/reports/analytics` | 8 |
| BatchSizeConfigController | `/api/batch-size-config` | 10 |
| DatabaseResetController | `/api/admin/reset` | 8 |
| **TOTAL** | | **~319** |

### By HTTP Method

| Method | Count (approx.) | Usage |
|--------|-----------------|-------|
| `GET` | ~200 | Read operations, paginated lists, filters, status checks |
| `POST` | ~75 | Create operations, status transitions, confirmations, uploads |
| `PUT` | ~30 | Update operations, quantity adjustments, step modifications |
| `DELETE` | ~20 | Soft deletes (status to INACTIVE/CANCELLED/SCRAPPED) |

### Paginated Endpoints

The following endpoints support server-side pagination via `PagedResponseDTO<T>`:

| Endpoint | Additional Filters |
|----------|--------------------|
| `GET /api/orders/paged` | `search`, `status` |
| `GET /api/batches/paged` | `search`, `status` |
| `GET /api/inventory/paged` | `search`, `status`, `type` |
| `GET /api/equipment/paged` | `search`, `status`, `type` |
| `GET /api/holds/paged` | `search`, `status`, `type` |
| `GET /api/operations/paged` | `search`, `status`, `type` |
| `GET /api/routing/paged` | `search`, `status`, `type` |
| `GET /api/processes/paged` | `search`, `status` |
| `GET /api/operation-templates/paged` | `search`, `status`, `type` |
| `GET /api/customers/paged` | `search`, `status` |
| `GET /api/materials/paged` | `search`, `status`, `type` |
| `GET /api/products/paged` | `search`, `status`, `category` |
| `GET /api/operators/paged` | `search`, `status` |
| `GET /api/users/paged` | `search`, `status` |
| `GET /api/bom/products/paged` | `search` |
| `GET /api/audit/paged` | `entityType`, `action`, `search` |
| `GET /api/batch-size-config/paged` | `search`, `operationType`, `materialId`, `isActive` |
| `GET /api/config/hold-reasons/paged` | `search`, `status` |
| `GET /api/config/delay-reasons/paged` | `search`, `status` |
| `GET /api/config/process-parameters/paged` | `search`, `status` |
| `GET /api/config/batch-number/paged` | `search`, `status` |
| `GET /api/config/quantity-types/paged` | `search`, `status` |

### Standard Pagination Query Parameters

All paginated endpoints accept:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | int | 0 | Page number (0-indexed) |
| `size` | int | 10-20 | Page size (varies by controller) |
| `sortBy` | String | varies | Field to sort by |
| `sortDirection` | String | ASC or DESC | Sort direction |

### PagedResponseDTO Structure
```json
{
  "content": [...],
  "page": 0,
  "size": 20,
  "totalElements": 150,
  "totalPages": 8,
  "first": true,
  "last": false,
  "hasNext": true,
  "hasPrevious": false
}
```
