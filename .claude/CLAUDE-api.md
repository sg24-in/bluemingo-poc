# API Endpoints Reference

> Also see `documents/reference/MES-API-Reference.md` for full details with request/response DTOs.

## Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login (JWT) |

## Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/paged` | Paginated with sorting/filtering |
| GET | `/api/orders/available` | Orders with READY operations |
| GET | `/api/orders/{id}` | Get order by ID |
| POST | `/api/orders` | Create order with line items |
| PUT | `/api/orders/{id}` | Update order |
| DELETE | `/api/orders/{id}` | Soft delete (CANCELLED) |
| POST | `/api/orders/{id}/line-items` | Add line item |
| PUT | `/api/orders/{id}/line-items/{lineId}` | Update line item |
| DELETE | `/api/orders/{id}/line-items/{lineId}` | Delete line item |

## Production
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/production/confirm` | Submit confirmation |
| GET | `/api/production/confirmations` | List confirmations |

## Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List all |
| GET | `/api/inventory/paged` | Paginated with sorting/filtering |
| POST | `/api/inventory/{id}/block` | Block inventory |
| POST | `/api/inventory/{id}/unblock` | Unblock inventory |
| POST | `/api/inventory/{id}/scrap` | Scrap inventory |

## Batches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/batches` | List all |
| GET | `/api/batches/paged` | Paginated with sorting/filtering |
| GET | `/api/batches/{id}/genealogy` | Batch traceability |
| POST | `/api/batches/{id}/split` | Split batch |
| POST | `/api/batches/merge` | Merge batches |

## BOM (Bill of Materials)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bom/{productSku}/requirements` | BOM requirements (flat) |
| POST | `/api/bom/validate` | Validate BOM consumption |
| GET | `/api/bom/operation/{id}/suggested-consumption` | Suggested consumption |
| GET | `/api/bom/{productSku}/tree` | Hierarchical BOM tree |
| GET | `/api/bom/{productSku}/tree/version/{v}` | BOM tree for version |
| GET | `/api/bom/{productSku}/list` | Flat list with child count |
| GET | `/api/bom/node/{bomId}` | Single node with children |
| GET | `/api/bom/products` | Products with BOMs |
| GET | `/api/bom/{productSku}/versions` | Available versions |
| POST | `/api/bom/node` | Create BOM node |
| POST | `/api/bom/tree` | Create full BOM tree |
| PUT | `/api/bom/node/{bomId}` | Update BOM node |
| PUT | `/api/bom/node/{bomId}/move` | Move node to new parent |
| DELETE | `/api/bom/node/{bomId}` | Delete node (no children) |
| DELETE | `/api/bom/node/{bomId}/cascade` | Delete node + children |
| DELETE | `/api/bom/{productSku}/tree` | Delete entire product BOM |

## Holds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holds/active` | Active holds |
| GET | `/api/holds/paged` | Paginated with sorting/filtering |
| POST | `/api/holds` | Apply hold |
| PUT | `/api/holds/{id}/release` | Release hold |
| GET | `/api/holds/count` | Active hold count |

## Equipment
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/equipment` | List all |
| GET | `/api/equipment/paged` | Paginated with sorting/filtering |
| POST | `/api/equipment/{id}/maintenance/start` | Start maintenance |
| POST | `/api/equipment/{id}/maintenance/end` | End maintenance |
| POST | `/api/equipment/{id}/hold` | Put on hold |
| POST | `/api/equipment/{id}/release` | Release from hold |

## Routing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routing` | List all (optional: ?status=ACTIVE) |
| GET | `/api/routing/{id}` | Get with steps |
| GET | `/api/routing/process/{processId}` | Get for process |
| POST | `/api/routing` | Create routing |
| PUT | `/api/routing/{id}` | Update routing |
| DELETE | `/api/routing/{id}` | Soft delete |
| POST | `/api/routing/{id}/activate` | Activate |
| POST | `/api/routing/{id}/deactivate` | Deactivate |
| POST | `/api/routing/{id}/hold` | Put on hold |
| POST | `/api/routing/{id}/release` | Release from hold |
| GET | `/api/routing/{id}/status` | Status summary |
| GET | `/api/routing/{id}/locked` | Check if locked |
| POST | `/api/routing/{id}/steps` | Create step |
| PUT | `/api/routing/steps/{stepId}` | Update step |
| DELETE | `/api/routing/steps/{stepId}` | Delete step |
| POST | `/api/routing/{id}/reorder` | Reorder steps |

## Customers
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | List all |
| GET | `/api/customers/paged` | Paginated with sorting/filtering |
| GET | `/api/customers/active` | Active only |
| GET | `/api/customers/{id}` | Get by ID |
| POST | `/api/customers` | Create |
| PUT | `/api/customers/{id}` | Update |
| DELETE | `/api/customers/{id}` | Soft delete (INACTIVE) |

## Materials
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/materials` | List all |
| GET | `/api/materials/paged` | Paginated with sorting/filtering |
| GET | `/api/materials/active` | Active only |
| GET | `/api/materials/{id}` | Get by ID |
| POST | `/api/materials` | Create |
| PUT | `/api/materials/{id}` | Update |
| DELETE | `/api/materials/{id}` | Soft delete (INACTIVE) |

## Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all |
| GET | `/api/products/paged` | Paginated with sorting/filtering |
| GET | `/api/products/active` | Active only |
| GET | `/api/products/{id}` | Get by ID |
| POST | `/api/products` | Create |
| PUT | `/api/products/{id}` | Update |
| DELETE | `/api/products/{id}` | Soft delete (INACTIVE) |

## Master Data
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/master/operators` | Operators list |
| GET | `/api/master/process-parameters` | Process parameters with config |

## Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/stats` | Statistics |
| GET | `/api/dashboard/recent-confirmations` | Recent confirmations |

## Audit Trail
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/entity/{type}/{id}` | History for entity |
| GET | `/api/audit/recent?limit=50` | Recent activity |
| GET | `/api/audit/production-confirmations?limit=10` | Recent confirmations |
| GET | `/api/audit/user/{username}?limit=50` | Activity by user |
| GET | `/api/audit/range?startDate=...&endDate=...` | Date range |
| GET | `/api/audit/summary` | Today's count + recent |
| GET | `/api/audit/entity-types` | Valid entity types |
| GET | `/api/audit/action-types` | Valid action types |
