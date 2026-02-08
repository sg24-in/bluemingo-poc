# MES API Reference

**Generated:** February 2026
**Source:** Controller Analysis

---

## API Summary

| Domain | Endpoints | Base Path |
|--------|-----------|-----------|
| Authentication | 4 | `/api/auth` |
| Orders | 11 | `/api/orders` |
| Production | 8 | `/api/production` |
| Inventory | 18 | `/api/inventory` |
| Batches | 22 | `/api/batches` |
| Holds | 7 | `/api/holds` |
| Equipment | 12 | `/api/equipment` |
| Master Data | 12 | `/api/master` |
| Customers | 9 | `/api/customers` |
| Materials | 9 | `/api/materials` |
| Products | 9 | `/api/products` |
| BOM | 17 | `/api/bom` |
| Dashboard | 2 | `/api/dashboard` |
| Audit | 8 | `/api/audit` |
| Operators | 7 | `/api/operators` |
| Operations | 6 | `/api/operations` |
| Processes | 10 | `/api/processes` |
| Users | 13 | `/api/users` |
| Configuration | 28 | `/api/config` |
| Routing | 18 | `/api/routing` |
| Batch Size | 6 | `/api/batch-size-config` |
| Inventory Movement | 8 | `/api/inventory-movements` |
| Batch Allocation | 6 | `/api/batch-allocations` |
| Equipment Usage | 7 | `/api/equipment-usage` |
| **Total** | **~247** | |

---

## Authentication Domain
**Base Path:** `/api/auth`

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | `/login` | User login with credentials | Public |
| GET | `/me` | Get current authenticated user | Required |
| POST | `/refresh` | Refresh JWT token | Public |
| POST | `/logout` | User logout | Required |

---

## Orders Domain
**Base Path:** `/api/orders`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List active orders | - |
| GET | `/paged` | Paginated orders | page, size, sortBy, sortDirection, search, status |
| GET | `/available` | Orders with READY operations | - |
| GET | `/{orderId}` | Get order by ID | - |
| POST | `/` | Create new order | - |
| PUT | `/{orderId}` | Update order | - |
| DELETE | `/{orderId}` | Delete order (soft) | - |
| POST | `/{orderId}/line-items` | Add line item | - |
| PUT | `/{orderId}/line-items/{lineItemId}` | Update line item | - |
| DELETE | `/{orderId}/line-items/{lineItemId}` | Delete line item | - |

---

## Production Domain
**Base Path:** `/api/production`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/confirm` | Submit production confirmation |
| GET | `/operations/{operationId}` | Get operation details |
| POST | `/confirmations/{confirmationId}/reject` | Reject confirmation |
| GET | `/confirmations/{confirmationId}` | Get confirmation details |
| GET | `/confirmations/status/{status}` | Get confirmations by status |
| GET | `/confirmations/rejected` | Get rejected confirmations |
| GET | `/confirmations/partial` | Get partial confirmations |
| GET | `/operations/continuable` | Get operations that can be continued |

---

## Inventory Domain
**Base Path:** `/api/inventory`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List all inventory | - |
| GET | `/paged` | Paginated inventory | page, size, sortBy, sortDirection, search, status, type |
| GET | `/available` | Available inventory for consumption | materialId |
| GET | `/blocked` | Blocked inventory | - |
| GET | `/scrapped` | Scrapped inventory | - |
| GET | `/reserved` | Reserved inventory | - |
| GET | `/reserved/order/{orderId}` | Reserved for specific order | - |
| GET | `/state/{state}` | By state | - |
| GET | `/type/{type}` | By type (RM, IM, FG, WIP) | - |
| GET | `/{id}` | Get by ID | - |
| POST | `/` | Create inventory | - |
| PUT | `/{id}` | Update inventory | - |
| DELETE | `/{id}` | Delete inventory (soft) | - |
| POST | `/{id}/block` | Block inventory | - |
| POST | `/{id}/unblock` | Unblock inventory | - |
| POST | `/{id}/scrap` | Scrap inventory | - |
| POST | `/{id}/reserve` | Reserve inventory | - |
| POST | `/{id}/release-reservation` | Release reservation | - |
| POST | `/receive-material` | Receive raw material | - |

---

## Batches Domain
**Base Path:** `/api/batches`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List all batches | - |
| GET | `/paged` | Paginated batches | page, size, sortBy, sortDirection, search, status |
| GET | `/preview-number` | Preview next batch number | operationType, productSku |
| GET | `/{batchId}` | Get batch by ID | - |
| GET | `/{batchId}/genealogy` | Batch traceability | - |
| POST | `/{batchId}/adjust-quantity` | Adjust batch quantity | - |
| GET | `/{batchId}/adjustments` | Quantity adjustment history | - |
| PUT | `/{batchId}` | Update batch | - |
| DELETE | `/{batchId}` | Delete batch (soft) | - |
| GET | `/available` | Available batches | materialId |
| POST | `/{batchId}/split` | Split batch | - |
| POST | `/merge` | Merge batches | - |
| GET | `/status/{status}` | By status | - |
| GET | `/produced` | Produced batches | - |
| GET | `/pending-approval` | Pending quality approval | - |
| POST | `/{batchId}/quality-check` | Send for quality check | - |
| POST | `/{batchId}/approve` | Approve batch | - |
| POST | `/{batchId}/reject` | Reject batch | - |
| GET | `/{batchId}/validate/split` | Validate split | - |
| GET | `/{batchId}/validate/merge` | Validate merge | - |
| GET | `/{batchId}/validate/genealogy` | Validate genealogy | - |
| GET | `/{batchId}/can-consume` | Check consumption allowed | - |

---

## Holds Domain
**Base Path:** `/api/holds`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| POST | `/` | Apply hold | - |
| PUT | `/{holdId}/release` | Release hold | - |
| GET | `/active` | Active holds | - |
| GET | `/paged` | Paginated holds | page, size, sortBy, sortDirection, search, status, type |
| GET | `/count` | Active hold count | - |
| GET | `/entity/{entityType}/{entityId}` | Holds for entity | - |
| GET | `/check/{entityType}/{entityId}` | Check if on hold | - |

---

## Equipment Domain
**Base Path:** `/api/equipment`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List all equipment | - |
| GET | `/paged` | Paginated equipment | page, size, sortBy, sortDirection, search, status, type |
| GET | `/{id}` | Get by ID | - |
| GET | `/status/{status}` | By status | - |
| GET | `/maintenance` | Under maintenance | - |
| GET | `/on-hold` | On hold | - |
| POST | `/` | Create equipment | - |
| PUT | `/{id}` | Update equipment | - |
| DELETE | `/{id}` | Delete equipment | - |
| POST | `/{id}/maintenance/start` | Start maintenance | - |
| POST | `/{id}/maintenance/end` | End maintenance | - |
| POST | `/{id}/hold` | Put on hold | - |
| POST | `/{id}/release` | Release from hold | - |

---

## BOM Domain
**Base Path:** `/api/bom`

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/{productSku}/requirements` | BOM requirements |
| GET | `/{productSku}/requirements/level/{level}` | Requirements by level |
| POST | `/validate` | Validate consumption |
| GET | `/operation/{operationId}/suggested-consumption` | Suggested consumption |
| GET | `/{productSku}/tree` | Full BOM tree |
| GET | `/{productSku}/tree/version/{version}` | Tree for version |
| GET | `/{productSku}/list` | Flat BOM list |
| GET | `/node/{bomId}` | Single node |
| GET | `/products` | Products with BOMs |
| GET | `/{productSku}/versions` | Available versions |
| POST | `/node` | Create node |
| POST | `/tree` | Create tree |
| PUT | `/node/{bomId}` | Update node |
| PUT | `/{productSku}/settings` | Update settings |
| PUT | `/node/{bomId}/move` | Move node |
| DELETE | `/node/{bomId}` | Delete node |
| DELETE | `/node/{bomId}/cascade` | Delete with children |
| DELETE | `/{productSku}/tree` | Delete entire tree |

---

## Customers Domain
**Base Path:** `/api/customers`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List all customers | - |
| GET | `/active` | Active customers | - |
| GET | `/paged` | Paginated customers | page, size, sortBy, sortDirection, search, status |
| GET | `/{id}` | Get by ID | - |
| GET | `/code/{code}` | Get by code | - |
| POST | `/` | Create customer | - |
| PUT | `/{id}` | Update customer | - |
| DELETE | `/{id}` | Delete customer (soft) | - |
| DELETE | `/{id}/permanent` | Delete permanently | - |

---

## Materials Domain
**Base Path:** `/api/materials`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List all materials | - |
| GET | `/active` | Active materials | - |
| GET | `/active/type/{type}` | Active by type | - |
| GET | `/consumable` | Consumable (RM, IM) | - |
| GET | `/paged` | Paginated materials | page, size, sortBy, sortDirection, search, status, type |
| GET | `/{id}` | Get by ID | - |
| GET | `/code/{code}` | Get by code | - |
| POST | `/` | Create material | - |
| PUT | `/{id}` | Update material | - |
| DELETE | `/{id}` | Delete material (soft) | - |

---

## Products Domain
**Base Path:** `/api/products`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List all products | - |
| GET | `/active` | Active products | - |
| GET | `/active/category/{category}` | By category | - |
| GET | `/paged` | Paginated products | page, size, sortBy, sortDirection, search, status, category |
| GET | `/{id}` | Get by ID | - |
| GET | `/sku/{sku}` | Get by SKU | - |
| POST | `/` | Create product | - |
| PUT | `/{id}` | Update product | - |
| DELETE | `/{id}` | Delete product (soft) | - |

---

## Audit Domain
**Base Path:** `/api/audit`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/entity/{entityType}/{entityId}` | Entity history | - |
| GET | `/recent` | Recent activity | limit (default: 50, max: 500) |
| GET | `/production-confirmations` | Production confirmations | limit (default: 10, max: 100) |
| GET | `/user/{username}` | User activity | limit (default: 50, max: 500) |
| GET | `/range` | Date range activity | startDate, endDate (ISO 8601) |
| GET | `/summary` | Audit summary | - |
| GET | `/entity-types` | Valid entity types | - |
| GET | `/action-types` | Valid action types | - |

---

## Routing Domain
**Base Path:** `/api/routing`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List all routings | status |
| GET | `/{routingId}` | Get by ID | - |
| GET | `/process/{processId}` | For process (runtime) | - |
| GET | `/template/{templateId}` | For template (design-time) | - |
| GET | `/{routingId}/steps` | Get steps in order | - |
| GET | `/operation/{operationId}/can-proceed` | Can proceed | - |
| GET | `/{routingId}/complete` | Is complete | - |
| GET | `/{routingId}/status` | Status summary | - |
| GET | `/{routingId}/locked` | Is locked | - |
| POST | `/` | Create | - |
| PUT | `/{routingId}` | Update | - |
| DELETE | `/{routingId}` | Delete | - |
| POST | `/{routingId}/activate` | Activate | - |
| POST | `/{routingId}/deactivate` | Deactivate | - |
| POST | `/{routingId}/hold` | Put on hold | - |
| POST | `/{routingId}/release` | Release from hold | - |
| POST | `/{routingId}/steps` | Create step | - |
| PUT | `/steps/{stepId}` | Update step | - |
| DELETE | `/steps/{stepId}` | Delete step | - |
| POST | `/{routingId}/reorder` | Reorder steps | - |

---

## Operation Template Domain (NEW)
**Base Path:** `/api/operation-templates`

| Method | Endpoint | Purpose | Query Params |
|--------|----------|---------|--------------|
| GET | `/` | List all templates | - |
| GET | `/active` | List active only | - |
| GET | `/paged` | Paginated list | page, size, sortBy, sortDirection, status, type, search |
| GET | `/{id}` | Get by ID | - |
| GET | `/by-type/{type}` | By operation type | - |
| GET | `/summaries` | Summaries for dropdowns | - |
| GET | `/types` | Distinct operation types | - |
| POST | `/` | Create template | - |
| PUT | `/{id}` | Update template | - |
| POST | `/{id}/activate` | Activate | - |
| POST | `/{id}/deactivate` | Deactivate | - |
| DELETE | `/{id}` | Soft delete (to INACTIVE) | - |

**Purpose:** Design-time operation definitions used by RoutingSteps and instantiated into runtime Operations.

---

## Configuration Domain
**Base Path:** `/api/config`

### Hold Reasons
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/hold-reasons` | All hold reasons |
| GET | `/hold-reasons/active` | Active hold reasons |
| GET | `/hold-reasons/paged` | Paginated |
| GET | `/hold-reasons/{id}` | Get by ID |
| POST | `/hold-reasons` | Create |
| PUT | `/hold-reasons/{id}` | Update |
| DELETE | `/hold-reasons/{id}` | Delete |

### Delay Reasons
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/delay-reasons` | All delay reasons |
| GET | `/delay-reasons/active` | Active only |
| GET | `/delay-reasons/paged` | Paginated |
| GET | `/delay-reasons/{id}` | Get by ID |
| POST | `/delay-reasons` | Create |
| PUT | `/delay-reasons/{id}` | Update |
| DELETE | `/delay-reasons/{id}` | Delete |

### Process Parameters
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/process-parameters` | All config |
| GET | `/process-parameters/active` | Active |
| GET | `/process-parameters/paged` | Paginated |
| GET | `/process-parameters/{id}` | Get by ID |
| POST | `/process-parameters` | Create |
| PUT | `/process-parameters/{id}` | Update |
| DELETE | `/process-parameters/{id}` | Delete |

### Batch Number Config
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/batch-number` | All config |
| GET | `/batch-number/active` | Active |
| GET | `/batch-number/paged` | Paginated |
| GET | `/batch-number/{id}` | Get by ID |
| POST | `/batch-number` | Create |
| PUT | `/batch-number/{id}` | Update |
| DELETE | `/batch-number/{id}` | Delete |

### Quantity Type Config
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/quantity-types` | All config |
| GET | `/quantity-types/active` | Active |
| GET | `/quantity-types/paged` | Paginated |
| GET | `/quantity-types/{id}` | Get by ID |
| POST | `/quantity-types` | Create |
| PUT | `/quantity-types/{id}` | Update |
| DELETE | `/quantity-types/{id}` | Delete |

---

## Pagination Parameters

All `/paged` endpoints support:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| page | int | 0 | Zero-indexed page number |
| size | int | 20 | Items per page |
| sortBy | string | varies | Sort field |
| sortDirection | string | DESC | ASC or DESC |
| search | string | - | Text search |
| status | string | - | Status filter |
| type | string | - | Type filter |

---

## Authentication

All endpoints except `/api/auth/login`, `/api/auth/logout`, and `/api/auth/refresh` require a valid JWT token:

```
Authorization: Bearer <token>
```

---

## Status Codes

| Code | Description |
|------|-------------|
| 200 | Successful GET, PUT |
| 201 | Successful POST |
| 204 | Successful DELETE |
| 400 | Invalid request |
| 401 | Missing JWT token |
| 403 | Insufficient permissions |
| 404 | Entity not found |
| 500 | Server error |

---

*End of API Reference*
