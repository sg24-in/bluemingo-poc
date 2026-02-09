# Database Schema Changes Log

This document tracks all database schema changes for the MES Production Confirmation POC.
Every schema modification must be documented here before code is considered complete.

---

## Change ID: SC-001

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Description** | Add `material_id` column to `batch_number_config` table |
| **Affected Tables** | `batch_number_config` |
| **Branch** | poc |
| **Patch File** | `backend/src/main/resources/patches/004_batch_number_config_material_id.sql` |

### Reason for Change

The `BatchNumberService.findMatchingConfig()` method queries the `material_id` column in `batch_number_config` to support material-level batch number configuration (used for RM receipt numbering). However, the column was missing from both the PostgreSQL schema (`001_schema.sql`) and the H2 demo schema (`demo/schema.sql`), causing a 400 error on the `/api/batches/preview-number` endpoint.

### Exact SQL (DDL)

```sql
-- For existing PostgreSQL databases (patch 004):
ALTER TABLE batch_number_config ADD COLUMN IF NOT EXISTS material_id VARCHAR(100);
CREATE INDEX IF NOT EXISTS idx_batch_config_material ON batch_number_config(material_id);
```

```sql
-- For new databases (001_schema.sql CREATE TABLE):
-- Column added between operation_type and product_sku:
material_id VARCHAR(100),
```

### Impact Analysis

| Area | Impact |
|------|--------|
| **Backend** | `BatchNumberService.findMatchingConfig()` - Already references `material_id` in its SQL query. No code changes needed. |
| **Frontend** | No impact. The `material_id` column is only used internally by the batch number service. |
| **API** | `/api/batches/preview-number` - Previously returned 400, now returns correct preview. |
| **Data Migration** | No data migration needed. Column is nullable and defaults to NULL. |

### Rollback SQL

```sql
ALTER TABLE batch_number_config DROP COLUMN IF EXISTS material_id;
DROP INDEX IF EXISTS idx_batch_config_material;
```

### Files Modified

| File | Change |
|------|--------|
| `backend/src/main/resources/patches/001_schema.sql` | Added `material_id VARCHAR(100)` column to `batch_number_config` CREATE TABLE |
| `backend/src/main/resources/patches/004_batch_number_config_material_id.sql` | **NEW** - Migration patch for existing databases |
| `backend/src/main/resources/demo/schema.sql` | Added `material_id VARCHAR(100)` column to `batch_number_config` CREATE TABLE |

### Verification

```bash
# Verify column exists in demo mode (H2):
curl -s "http://localhost:8080/api/batches/preview-number?operationType=FURNACE&productSku=REBAR-10MM" \
  -H "Authorization: Bearer <token>"
# Expected: 200 OK with {"previewBatchNumber":"RB10-20260209-0001",...}

# Verify column exists in PostgreSQL:
psql -U postgres -d mes_production -c "\d batch_number_config" | grep material_id
# Expected: material_id | character varying(100) |
```

---

## Change ID: SC-002

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Description** | Add additional inventory and batch demo data |
| **Affected Tables** | `batches`, `inventory`, `audit_trail` |
| **Branch** | poc |
| **Patch File** | `backend/src/main/resources/patches/003_additional_inventory_data.sql` |

### Reason for Change

Several intermediate materials (IM-BLOOM, IM-WIRE-ROD) had zero inventory records in the demo data, and IM-LIQUID had critically low stock. This caused the production confirmation BOM suggested consumption to show "Insufficient" stock status for many operations.

### Exact SQL (DML)

```sql
-- 14 new batch records (IDs 57-70) for materials:
-- IM-BLOOM (2), IM-WIRE-ROD (2), IM-LIQUID (2), IM-SLAB (1), IM-HR-ROUGH (1)
-- RM-SCRAP-A (1), RM-SCRAP-B (1), RM-IRON-ORE (1), RM-LIMESTONE (1), RM-FEMN (1), RM-FESI (1)
INSERT INTO batches (batch_number, material_id, ...) SELECT ... WHERE NOT EXISTS (...);

-- 14 corresponding inventory records (IDs 57-70)
INSERT INTO inventory (material_id, ..., batch_id) SELECT ..., b.batch_id FROM batches b WHERE b.batch_number = '...';

-- Audit trail entries for all new records
INSERT INTO audit_trail (...) SELECT ... WHERE NOT EXISTS (...);
```

### Impact Analysis

| Area | Impact |
|------|--------|
| **Backend** | No code changes. Data-only patch. |
| **Frontend** | More inventory items appear in Available Inventory list on production confirm page. |
| **API** | `/api/inventory/available` returns more items. BOM suggested consumption shows "Sufficient" for more materials. |
| **Data Migration** | Idempotent inserts using WHERE NOT EXISTS. Safe to re-run. |

### Rollback SQL

```sql
DELETE FROM audit_trail WHERE entity_type = 'INVENTORY' AND entity_id IN (57,58,59,60,61,62,63,64,65,66,67,68,69,70);
DELETE FROM audit_trail WHERE entity_type = 'BATCH' AND entity_id IN (57,58,59,60,61,62,63,64,65,66,67,68,69,70);
DELETE FROM inventory WHERE batch_id IN (SELECT batch_id FROM batches WHERE batch_number IN ('B-IM-021','B-IM-022','B-IM-023','B-IM-024','B-IM-025','B-IM-026','B-IM-027','B-IM-028','B-RM-023','B-RM-024','B-RM-025','B-RM-026','B-RM-027','B-RM-028'));
DELETE FROM batches WHERE batch_number IN ('B-IM-021','B-IM-022','B-IM-023','B-IM-024','B-IM-025','B-IM-026','B-IM-027','B-IM-028','B-RM-023','B-RM-024','B-RM-025','B-RM-026','B-RM-027','B-RM-028');
```

### Files Modified

| File | Change |
|------|--------|
| `backend/src/main/resources/patches/003_additional_inventory_data.sql` | **NEW** - Idempotent data patch |
| `backend/src/main/resources/demo/data.sql` | Added 14 batches, 14 inventory records, audit trail entries |

---

## Change ID: SC-003

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Description** | Add missing operations for 5 line items with no operations defined |
| **Affected Tables** | `operations` |
| **Branch** | poc |
| **Patch File** | `backend/src/main/resources/patches/005_missing_operations.sql` |

### Reason for Change

Systematic gap analysis found 5 order line items with no operations defined, causing "No operations defined for this line item" messages on the order detail page. These line items were created in the demo data but operations were never assigned to them.

### Affected Line Items

| Line Item ID | Order | Product | Quantity | Process |
|---|---|---|---|---|
| 18 | ORD-2026-001 | HR-COIL-3MM | 50T | Hot Rolled Coil Production (8 ops) |
| 19 | ORD-2026-002 | CR-SHEET-2MM | 40T | Cold Rolled Sheet Production (3 ops) |
| 20 | ORD-2026-003 | REBAR-12MM | 100T | Rebar Production (7 ops) |
| 21 | ORD-2026-006 | REBAR-12MM | 150T | Rebar Production (7 ops) |
| 22 | ORD-2026-009 | HR-COIL-4MM | 100T | Hot Rolled Coil Production (8 ops) |

### Exact SQL (DML)

```sql
-- 33 new operation records (IDs 61-93 in demo, auto-generated in PostgreSQL)
-- Each line item gets the full operation sequence for its process:
-- Process 1 (Hot Rolled Coil): 8 ops - Scrap Charging -> EAF Melting -> Ladle Refining -> Slab Casting -> Slab Reheating -> Rough Rolling -> Finish Rolling -> Cooling & Coiling
-- Process 2 (Cold Rolled Sheet): 3 ops - Pickling -> Cold Rolling -> Batch Annealing
-- Process 3 (Rebar): 7 ops - Scrap Charging -> EAF Melting -> Ladle Refining -> Billet Casting -> Billet Reheating -> Bar Rolling -> Quenching & Tempering
-- First operation in each sequence set to READY, rest NOT_STARTED
INSERT INTO operations (...) SELECT ... WHERE NOT EXISTS (...);
```

### Impact Analysis

| Area | Impact |
|------|--------|
| **Backend** | No code changes. Data-only patch. |
| **Frontend** | Order detail pages now show operation timelines instead of "No operations defined". Production landing shows more orders available for confirmation. |
| **API** | `/api/orders/{id}` returns operations for all line items. `/api/orders/available` includes newly operational line items. |
| **Data Migration** | Idempotent inserts using WHERE NOT EXISTS. Safe to re-run. |

### Rollback SQL

```sql
DELETE FROM operations WHERE order_line_id IN (18, 19, 20, 21, 22) AND operation_id > 60;
```

### Files Modified

| File | Change |
|------|--------|
| `backend/src/main/resources/patches/005_missing_operations.sql` | **NEW** - Idempotent operations data patch |
| `backend/src/main/resources/demo/data.sql` | Added 33 operations (IDs 61-93) for 5 line items |

---

## Change ID: SC-004

| Field | Value |
|-------|-------|
| **Date** | 2026-02-09 |
| **Description** | Add 30 additional orders with multi-stage products (57 line items, 332 operations) |
| **Affected Tables** | `orders`, `order_line_items`, `operations`, `audit_trail` |
| **Branch** | poc |
| **Patch File** | `backend/src/main/resources/patches/006_additional_orders_multi_stage.sql` |

### Reason for Change

The demo database had only 15 orders, which was insufficient for demonstrating pagination, filtering, and realistic data volumes. Additionally, there were no multi-stage orders (orders with line items spanning multiple production processes), which is a common real-world pattern in steel manufacturing.

### Multi-Stage Order Types

| Type | Description | Processes | Total Ops |
|------|-------------|-----------|-----------|
| **HR→CR** | Hot Rolled Coil feeds into Cold Rolled Sheet | Process 1 → Process 2 | 11 |
| **Billet→Rebar** | Steel Billet feeds into Rebar | Process 4 → Process 3 | 11 |
| **Full Pipeline** | HR Coil + CR Sheet + Rebar | Process 1 + 2 + 3 | 18 |
| **Triple Process** | Billet + HR Coil + CR Sheet | Process 4 + 1 + 2 | 15 |
| **Full Pipeline 4-Stage** | All 4 processes in one order | Process 4 + 1 + 2 + 3 | 22 |
| **Heavy HR→CR** | Multiple HR Coil variants + CR Sheet | Process 1 + 2 | 19 |
| **Mixed** | Multiple products from same process | Single process | Varies |

### Order Distribution

| Status | Count |
|--------|-------|
| CREATED | 10 |
| IN_PROGRESS | 8 |
| COMPLETED | 6 |
| ON_HOLD | 3 |
| CANCELLED | 2 |
| BLOCKED | 1 |

### Exact SQL (DML)

```sql
-- 30 new orders (IDs 16-45)
INSERT INTO orders (...) VALUES (...); -- 30 rows

-- 57 new line items (IDs 26-82)
-- 10 single-product, 15 multi-stage (2-4 items per order), 4 mixed
INSERT INTO order_line_items (...) VALUES (...); -- 57 rows

-- 332 new operations (IDs 94-425)
-- Each line item gets full operation sequence for its product's process
INSERT INTO operations (...) VALUES (...); -- 332 rows

-- ~50 audit trail entries for order creation and status changes
INSERT INTO audit_trail (...) VALUES (...);
```

### Impact Analysis

| Area | Impact |
|------|--------|
| **Backend** | No code changes. Data-only patch. |
| **Frontend** | Orders list now shows 45 orders instead of 15. Pagination is more meaningful. Multi-stage orders visible in order detail with multiple line items. |
| **API** | `/api/orders` returns 45 orders. `/api/orders/paged` has more data for pagination. `/api/orders/available` includes new orders with READY operations. |
| **Data Migration** | Idempotent using WHERE NOT EXISTS guard. Safe to re-run. |

### Rollback SQL

```sql
DELETE FROM operations WHERE operation_id >= 94 AND operation_id <= 425;
DELETE FROM order_line_items WHERE order_line_id >= 26 AND order_line_id <= 82;
DELETE FROM audit_trail WHERE entity_type = 'ORDER' AND entity_id >= 16 AND entity_id <= 45;
DELETE FROM orders WHERE order_id >= 16 AND order_id <= 45;
```

### Files Modified

| File | Change |
|------|--------|
| `backend/src/main/resources/patches/006_additional_orders_multi_stage.sql` | **NEW** - Idempotent data patch for PostgreSQL |
| `backend/src/main/resources/demo/data.sql` | Added 30 orders, 57 line items, 332 operations, ~50 audit entries |
| `e2e/generate-orders.js` | **NEW** - Generator script for reproducible order data |
