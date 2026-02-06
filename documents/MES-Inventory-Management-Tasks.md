# MES Inventory Management - Implementation Tasks

## Executive Summary

Inventory in MES is **batch-based, state-driven, and only changes at operation boundaries**.
This document captures the implementation tasks to ensure full compliance.

---

## Current State Analysis

### What's Already Implemented ✅

| Component | Status | Notes |
|-----------|--------|-------|
| `Batches` table | ✅ Done | BatchID, MaterialID, Quantity, Status |
| `Inventory` table | ✅ Done | BatchID FK, InventoryType, State, Quantity |
| `InventoryMovement` table | ✅ Done | Consume/Produce/Hold/Release |
| `BatchRelation` table | ✅ Done | Parent/Child genealogy |
| `BatchOrderAllocation` table | ✅ Done | One-to-many allocation |
| Inventory state machine | ✅ Done | AVAILABLE/CONSUMED/BLOCKED/SCRAPPED/ON_HOLD |
| Batch creation at operation | ✅ Done | `GeneratedAtOperationID` field |
| Production confirmation flow | ✅ Done | Consumes RM, produces IM/FG |
| Batch split/merge | ✅ Done | Via BatchRelation |
| Hold management | ✅ Done | HoldRecords entity type support |

### Gaps Identified

| Gap | Priority | Description |
|-----|----------|-------------|
| **G-INV-01** | HIGH | No explicit Goods Receipt endpoint for RM entry |
| **G-INV-02** | MEDIUM | Supplier batch number field missing |
| **G-INV-03** | MEDIUM | No inventory valuation fields (for ERP integration) |
| **G-INV-04** | LOW | No location/warehouse hierarchy in inventory |
| **G-INV-05** | HIGH | Inventory state change enforcement not complete |
| **G-INV-06** | MEDIUM | No batch reservation for orders (only allocation) |
| **G-INV-07** | LOW | No inventory form tracking (slab/coil/plate) |

---

## Phase 1: Raw Material Entry (G-INV-01)

**Goal:** Create proper RM entry flow with batch creation

### Task INV-01: Create RM Entry Endpoint

**Backend:**
```
POST /api/inventory/receive-material
```

**Request:**
```json
{
  "materialId": "RM-STEEL-001",
  "materialName": "Steel Coil Grade A",
  "quantity": 100.0,
  "unit": "T",
  "supplierBatchNumber": "SUP-2026-001",
  "supplierId": "SUPPLIER-001",
  "receivedDate": "2026-02-06",
  "location": "Warehouse-A",
  "notes": "Delivery note reference"
}
```

**Response:**
```json
{
  "batchId": 123,
  "batchNumber": "RM-2026-02-06-001",
  "inventoryId": 456,
  "status": "QUALITY_PENDING",
  "message": "RM received, pending quality approval"
}
```

**Entities affected:**
- Creates `Batch` (status = QUALITY_PENDING)
- Creates `Inventory` (state = AVAILABLE after approval)
- Creates `InventoryMovement` (type = RECEIVE)

### Task INV-02: Add Supplier Batch Number Field

**Schema change (Patch 027):**
```sql
ALTER TABLE batches ADD COLUMN IF NOT EXISTS supplier_batch_number VARCHAR(100);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(50);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS received_date DATE;
```

### Task INV-03: Create RM Entry Service

**Service methods:**
- `receiveMaterial(ReceiveMaterialRequest)` - Main entry point
- `validateMaterialId(String)` - Check material exists
- `generateRMBatchNumber()` - Generate RM-prefixed batch number

### Task INV-04: Create RM Entry UI

**Frontend:**
- New page: `/inventory/receive`
- Form with material dropdown, quantity, supplier info
- After submit, redirect to inventory list

---

## Phase 2: Inventory State Enforcement (G-INV-05)

**Goal:** Ensure inventory state transitions are valid

### Task INV-05: State Transition Validator

Create `InventoryStateService` with:
- Valid transition map
- Validation before state change
- Audit logging for all transitions

**Valid Transitions:**
```
AVAILABLE → RESERVED, CONSUMED, BLOCKED, ON_HOLD
RESERVED → AVAILABLE, CONSUMED, BLOCKED
CONSUMED → (terminal)
BLOCKED → AVAILABLE, SCRAPPED
ON_HOLD → AVAILABLE, BLOCKED
SCRAPPED → (terminal)
```

### Task INV-06: Block Invalid Consumption

**Rules:**
- Cannot consume BLOCKED inventory
- Cannot consume ON_HOLD inventory
- Cannot consume already CONSUMED inventory
- Cannot consume SCRAPPED inventory

**Update:** `ProductionService.confirmProduction()` to check inventory state before consumption.

### Task INV-07: Quantity Change Audit

All quantity changes must go through:
- `InventoryMovement` (for consumption/production)
- `BatchQuantityAdjustment` (for corrections)

No direct `UPDATE inventory SET quantity = ...` allowed.

---

## Phase 3: Inventory Reservation (G-INV-06)

**Goal:** Reserve inventory for orders before production

### Task INV-08: Create Reservation Entity

```sql
CREATE TABLE inventory_reservations (
    reservation_id SERIAL PRIMARY KEY,
    inventory_id BIGINT REFERENCES inventory(inventory_id),
    batch_id BIGINT REFERENCES batches(batch_id),
    order_id BIGINT REFERENCES orders(order_id),
    order_line_item_id BIGINT REFERENCES order_line_items(order_line_item_id),
    reserved_quantity DECIMAL(15,4) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    reserved_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reserved_by VARCHAR(100),
    released_on TIMESTAMP,
    released_by VARCHAR(100),
    notes VARCHAR(500)
);
```

### Task INV-09: Reservation Service

**Methods:**
- `reserveInventory(inventoryId, orderId, quantity)` - Create reservation
- `releaseReservation(reservationId)` - Cancel reservation
- `consumeReservation(reservationId)` - Convert to consumption
- `getAvailableQuantity(inventoryId)` - Total - Reserved

### Task INV-10: Update Inventory State Logic

When inventory is partially reserved:
- State stays AVAILABLE
- Available quantity = Total - Sum(reservations)

When fully reserved:
- State changes to RESERVED

---

## Phase 4: Location/Warehouse (G-INV-04)

**Goal:** Track inventory location

### Task INV-11: Location Hierarchy

Already have `Location` entity from Patch 021. Need to:
- Add FK to Inventory: `location_id`
- Add transfer endpoint

### Task INV-12: Inventory Transfer

**Endpoint:**
```
POST /api/inventory/{id}/transfer
```
**Body:**
```json
{
  "fromLocationId": 1,
  "toLocationId": 2,
  "quantity": 50.0,
  "reason": "Move to production area"
}
```

Creates `InventoryMovement` with type = TRANSFER.

---

## Phase 5: ERP Integration Fields (G-INV-03)

**Goal:** Add fields for ERP handoff

### Task INV-13: Valuation Fields

```sql
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS unit_cost DECIMAL(15,4);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS total_value DECIMAL(15,4);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS cost_center VARCHAR(50);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS gl_account VARCHAR(50);
```

Note: MES does not calculate these - they come from ERP or are set at goods receipt.

---

## Implementation Priority

| Phase | Tasks | Priority | Effort |
|-------|-------|----------|--------|
| Phase 1 | INV-01 to INV-04 | HIGH | ~8h |
| Phase 2 | INV-05 to INV-07 | HIGH | ~6h |
| Phase 3 | INV-08 to INV-10 | MEDIUM | ~8h |
| Phase 4 | INV-11 to INV-12 | LOW | ~4h |
| Phase 5 | INV-13 | LOW | ~2h |

**Total: 13 tasks, ~28 hours**

---

## Recommended Sprint Plan

**Sprint A (Week 1):** RM Entry + State Enforcement (~14h)
- INV-01, INV-02, INV-03, INV-04 (RM Entry)
- INV-05, INV-06, INV-07 (State Enforcement)

**Sprint B (Week 2):** Reservation + Location (~12h)
- INV-08, INV-09, INV-10 (Reservation)
- INV-11, INV-12 (Location)

**Sprint C (Future):** ERP Integration (~2h)
- INV-13 (Valuation fields)

---

## API Summary (New Endpoints)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inventory/receive-material` | POST | Receive RM with batch creation |
| `/api/inventory/{id}/reserve` | POST | Reserve inventory for order |
| `/api/inventory/{id}/release-reservation` | POST | Release reservation |
| `/api/inventory/{id}/transfer` | POST | Transfer between locations |
| `/api/inventory/reservations` | GET | List active reservations |
| `/api/inventory/{id}/available-quantity` | GET | Get unreserved quantity |

---

## Notes

- MES tracks "what was made", ERP tracks "what was shipped"
- No costing/valuation logic in MES core
- All inventory changes are event-based (InventoryMovement)
- State machine is enforced, not just advisory
