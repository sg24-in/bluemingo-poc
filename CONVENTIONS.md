# MES Production Confirmation - Contract Conventions

**Version:** 1.0
**Last Updated:** 2026-02-04
**Purpose:** Single authoritative source for data contract conventions across database, backend, and frontend layers.

---

## 1. Core Principles

### 1.1 Strict Contract Consistency
- All enums/status values MUST be persisted as **strings** in the database
- All enums/status values MUST use **identical names and values** across backend and frontend
- Java DTOs and TypeScript interfaces MUST match **exactly** in:
  - Field names (camelCase)
  - Data types
  - Structure and nesting
  - Optionality (nullable vs required)

### 1.2 Any Mismatch is a Defect
- Field name differences between layers are defects
- Type mismatches are defects
- Missing fields are defects
- Transformed/renamed fields are defects

---

## 2. Type Mappings

### 2.1 Java to TypeScript Type Mapping

| Java Type | TypeScript Type | Notes |
|-----------|-----------------|-------|
| `Long` | `number` | All IDs |
| `Integer` | `number` | Sequences, counts |
| `String` | `string` | Text, status values |
| `BigDecimal` | `number` | Quantities, decimals |
| `Boolean` / `boolean` | `boolean` | Flags |
| `LocalDateTime` | `string` | ISO 8601 format (serialized by Jackson) |
| `LocalDate` | `string` | ISO 8601 date format |
| `List<T>` | `T[]` | Arrays |
| `Map<String, Object>` | `Record<string, any>` | Dynamic key-value |

### 2.2 Nullable Fields
- Java: Use wrapper types (Long, Integer) for nullable, primitives for required
- TypeScript: Use `fieldName?: Type` for optional, `fieldName: Type` for required
- Backend `@NotNull` annotation = Frontend required field

---

## 3. Status/State Constants

### 3.1 Naming Convention
- Backend: `public static final String STATUS_<NAME> = "<NAME>";`
- Frontend: Defined in `shared/constants/status.constants.ts`
- Values: SCREAMING_SNAKE_CASE (e.g., `IN_PROGRESS`, `ON_HOLD`)

### 3.2 Authoritative Status Values

#### Operation Status
| Constant | Value | Description |
|----------|-------|-------------|
| `STATUS_NOT_STARTED` | `"NOT_STARTED"` | Initial state |
| `STATUS_READY` | `"READY"` | Ready for production |
| `STATUS_IN_PROGRESS` | `"IN_PROGRESS"` | Currently being worked |
| `STATUS_CONFIRMED` | `"CONFIRMED"` | Production confirmed |
| `STATUS_ON_HOLD` | `"ON_HOLD"` | Temporarily paused |
| `STATUS_BLOCKED` | `"BLOCKED"` | Blocked from proceeding |

#### Process Status
| Constant | Value | Description |
|----------|-------|-------------|
| `STATUS_READY` | `"READY"` | Ready to start |
| `STATUS_IN_PROGRESS` | `"IN_PROGRESS"` | In progress |
| `STATUS_QUALITY_PENDING` | `"QUALITY_PENDING"` | Awaiting quality decision |
| `STATUS_COMPLETED` | `"COMPLETED"` | All operations done |
| `STATUS_REJECTED` | `"REJECTED"` | Quality rejected |
| `STATUS_ON_HOLD` | `"ON_HOLD"` | On hold |

#### Inventory State
| Constant | Value | Description |
|----------|-------|-------------|
| `STATE_AVAILABLE` | `"AVAILABLE"` | Available for use |
| `STATE_RESERVED` | `"RESERVED"` | Reserved for order |
| `STATE_CONSUMED` | `"CONSUMED"` | Used in production |
| `STATE_PRODUCED` | `"PRODUCED"` | Newly produced |
| `STATE_BLOCKED` | `"BLOCKED"` | Blocked from use |
| `STATE_SCRAPPED` | `"SCRAPPED"` | Scrapped |
| `STATE_ON_HOLD` | `"ON_HOLD"` | On hold |

#### Batch Status
| Constant | Value | Description |
|----------|-------|-------------|
| `STATUS_PRODUCED` | `"PRODUCED"` | Newly produced |
| `STATUS_AVAILABLE` | `"AVAILABLE"` | Available for use |
| `STATUS_CONSUMED` | `"CONSUMED"` | Fully consumed |
| `STATUS_BLOCKED` | `"BLOCKED"` | Blocked |
| `STATUS_SCRAPPED` | `"SCRAPPED"` | Scrapped |
| `STATUS_QUALITY_PENDING` | `"QUALITY_PENDING"` | Awaiting QC |

#### Equipment Status
| Constant | Value | Description |
|----------|-------|-------------|
| `STATUS_AVAILABLE` | `"AVAILABLE"` | Available for use |
| `STATUS_IN_USE` | `"IN_USE"` | Currently in use |
| `STATUS_MAINTENANCE` | `"MAINTENANCE"` | Under maintenance |
| `STATUS_ON_HOLD` | `"ON_HOLD"` | On hold |
| `STATUS_UNAVAILABLE` | `"UNAVAILABLE"` | Not available |

#### Production Confirmation Status
| Constant | Value | Description |
|----------|-------|-------------|
| `STATUS_CONFIRMED` | `"CONFIRMED"` | Confirmed |
| `STATUS_REJECTED` | `"REJECTED"` | Rejected |
| `STATUS_PARTIALLY_CONFIRMED` | `"PARTIALLY_CONFIRMED"` | Partial |
| `STATUS_PENDING_REVIEW` | `"PENDING_REVIEW"` | Awaiting review |

#### Audit Actions
| Constant | Value | Description |
|----------|-------|-------------|
| `ACTION_CREATE` | `"CREATE"` | Entity created |
| `ACTION_UPDATE` | `"UPDATE"` | Entity updated |
| `ACTION_DELETE` | `"DELETE"` | Entity deleted |
| `ACTION_STATUS_CHANGE` | `"STATUS_CHANGE"` | Status changed |
| `ACTION_CONSUME` | `"CONSUME"` | Material consumed |
| `ACTION_PRODUCE` | `"PRODUCE"` | Material produced |
| `ACTION_HOLD` | `"HOLD"` | Put on hold |
| `ACTION_RELEASE` | `"RELEASE"` | Released from hold |

#### Entity Types (for Holds/Audit)
| Constant | Value |
|----------|-------|
| `ENTITY_OPERATION` | `"OPERATION"` |
| `ENTITY_PROCESS` | `"PROCESS"` |
| `ENTITY_ORDER` | `"ORDER"` |
| `ENTITY_ORDER_LINE` | `"ORDER_LINE"` |
| `ENTITY_INVENTORY` | `"INVENTORY"` |
| `ENTITY_BATCH` | `"BATCH"` |
| `ENTITY_BATCH_RELATION` | `"BATCH_RELATION"` |
| `ENTITY_PRODUCTION_CONFIRMATION` | `"PRODUCTION_CONFIRMATION"` |

---

## 4. DTO/Interface Contracts

### 4.1 File Locations
- **Backend DTOs:** `backend/src/main/java/com/mes/production/dto/*.java`
- **Frontend Models:** `frontend/src/app/shared/models/*.model.ts`
- **Frontend Constants:** `frontend/src/app/shared/constants/*.constants.ts`

### 4.2 Naming Convention
- Backend: `<Entity>DTO.java` with nested static classes
- Frontend: `<entity>.model.ts` with exported interfaces

### 4.3 Required Contracts

| Backend DTO | Frontend Interface | File |
|-------------|-------------------|------|
| `DashboardDTO.Summary` | `DashboardSummary` | `dashboard.model.ts` |
| `DashboardDTO.AuditActivity` | `AuditActivity` | `dashboard.model.ts` |
| `DashboardDTO.RecentActivity` | `RecentActivity` | `dashboard.model.ts` |
| `BatchDTO` | `Batch` | `batch.model.ts` |
| `BatchDTO.Genealogy` | `BatchGenealogy` | `batch.model.ts` |
| `BatchDTO.SplitRequest` | `BatchSplitRequest` | `batch.model.ts` |
| `BatchDTO.SplitResponse` | `BatchSplitResponse` | `batch.model.ts` |
| `BatchDTO.MergeRequest` | `BatchMergeRequest` | `batch.model.ts` |
| `BatchDTO.MergeResponse` | `BatchMergeResponse` | `batch.model.ts` |
| `InventoryDTO` | `Inventory` | `inventory.model.ts` |
| `InventoryDTO.StateUpdateResponse` | `InventoryStateUpdateResponse` | `inventory.model.ts` |
| `OperationDTO` | `Operation` | `operation.model.ts` |
| `ProcessDTO.Response` | `Process` | `process.model.ts` |
| `OrderDTO` | `Order` | `order.model.ts` |
| `EquipmentDTO` | `Equipment` | `equipment.model.ts` |
| `HoldDTO.HoldResponse` | `Hold` | `hold.model.ts` |
| `ProductionConfirmationDTO.Request` | `ProductionConfirmationRequest` | `production.model.ts` |
| `ProductionConfirmationDTO.Response` | `ProductionConfirmationResponse` | `production.model.ts` |
| `BomDTO.BomRequirement` | `BomRequirement` | `bom.model.ts` |
| `BomDTO.BomValidationResult` | `BomValidationResult` | `bom.model.ts` |

---

## 5. API Service Typing

### 5.1 Rules
- **Never use `any` type** for API responses
- All API methods must return `Observable<TypedInterface>`
- Import interfaces from shared models

### 5.2 Example
```typescript
// BAD
getOrders(): Observable<any[]> { ... }

// GOOD
import { Order } from '../../shared/models/order.model';
getOrders(): Observable<Order[]> { ... }
```

---

## 6. Validation Checklist

When adding/modifying a DTO or interface:

- [ ] Field names match exactly (camelCase)
- [ ] Types map correctly per Section 2.1
- [ ] Nullable fields marked correctly
- [ ] Nested classes have corresponding nested interfaces
- [ ] Status values exist in constants files
- [ ] API service method uses typed return
- [ ] No `any` types used

---

## 7. Change Process

1. **Backend first:** Modify DTO in Java
2. **Update conventions:** Add to this file if new status/type
3. **Frontend second:** Update TypeScript interface
4. **API service:** Update return types
5. **Tests:** Update test mocks to match

---

## 8. Known Deviations

| Location | Issue | Status |
|----------|-------|--------|
| Frontend `ApiService` | Uses `any` return types | TO FIX |
| Frontend components | Inline interfaces instead of shared | TO FIX |
| Dashboard `recentActivity` | Typed as `any[]` | TO FIX |

---

## 9. Enforcement

- Code reviews must verify contract consistency
- CI/CD should include contract validation (future)
- This document is the single source of truth

---

*This document must be updated whenever contracts change.*
