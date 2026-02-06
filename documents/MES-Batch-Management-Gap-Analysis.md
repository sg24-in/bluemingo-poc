# MES Batch Management - Gap Analysis & Implementation Plan

**Document Date:** 2026-02-06
**Spec Reference:** MES Batch Management Specification (Batch Creation, Split, Merge & Genealogy)
**Related:** MES-Data-Model-Gap-Analysis-Feb2026.md (Schema alignment - 95-98%)

---

## 0. Relationship to Data Model

The **MES Consolidated Data Model** (analyzed separately) covers **schema alignment**:
- Tables, columns, foreign keys, constraints
- Status: **95-98% aligned** - all batch tables exist correctly

This document covers **behavioral rules** that the Batch Management Specification adds:
- When batches can be created (operation boundaries only)
- What operations are allowed (no direct edits)
- How transformations work (split/merge as relationships)
- Immutability and audit requirements

**Schema is correct. Behavior needs enforcement.**

---

## 1. Executive Summary

The MES Batch Management Specification defines **strict rules** for batch lifecycle, immutability, and traceability. This analysis compares the specification requirements against the current implementation.

**Overall Alignment:** ~75%
**Critical Gaps:** 5
**Medium Gaps:** 4
**Minor Gaps:** 3

---

## 2. Core Principles Compliance

| Principle | Spec Requirement | Current State | Status |
|-----------|-----------------|---------------|--------|
| Batch identity is immutable | Never change, reuse, or overwrite BatchID | ✅ Unique constraint on batch_number | ✅ COMPLIANT |
| Batches created at operation boundaries | During operation completion only | ❌ Manual createBatch() allows standalone creation | ⚠️ GAP |
| Batch quantity never edited directly | Only via consumption/production movements | ❌ updateBatch() allows direct quantity edits | ❌ CRITICAL GAP |
| All transformations explicit | Split/merge modeled as relationships | ✅ BatchRelation entity with SPLIT/MERGE types | ✅ COMPLIANT |
| Genealogy permanent and immutable | Never deleted or modified | ⚠️ No enforcement - relations can be deleted | ⚠️ GAP |
| Every batch change auditable | User, timestamp, operation context | ✅ AuditService logs all changes | ✅ COMPLIANT |

---

## 3. Detailed Gap Analysis

### GAP-B01: Manual Batch Creation (CRITICAL)

**Spec Says:**
> Batches are created ONLY at operation boundaries, during production confirmation.

**Current Implementation:**
- `BatchService.createBatch()` allows standalone batch creation
- `BatchController.createBatch()` exposes this as a public API endpoint
- Frontend has batch form for manual creation

**Required Changes:**
1. Remove or restrict `createBatch()` to internal/system use only
2. Ensure batches are ONLY created via `ProductionService.confirmProduction()`
3. Add validation to reject external batch creation requests
4. Update frontend to remove manual batch creation option

**Impact:** High - Affects data integrity and compliance

---

### GAP-B02: Direct Quantity Editing (CRITICAL)

**Spec Says:**
> Batch quantity is NEVER edited directly. Quantity changes only via consumption or production movements.

**Current Implementation:**
```java
// BatchService.updateBatch() - Line 554
if (request.getQuantity() != null) batch.setQuantity(request.getQuantity());
```

**Required Changes:**
1. Remove quantity field from `UpdateBatchRequest` DTO
2. Remove quantity update logic from `updateBatch()`
3. Only allow quantity changes via:
   - `consumeBatch()` - reduces quantity
   - `splitBatch()` - redistributes quantity
   - `mergeBatch()` - combines quantities
4. Add quantity adjustment endpoint for corrections (with audit trail)

**Impact:** High - Affects quantity integrity and traceability

---

### GAP-B03: Default Status Not BLOCKED (MEDIUM)

**Spec Says:**
> Output batches are BLOCKED by default until usage decision (ACCEPT/REJECT).

**Current Implementation:**
```java
// Batch.java - Line 86
if (status == null) status = "AVAILABLE";
```

**Required Changes:**
1. Change default status in `Batch.onCreate()` to `STATUS_PRODUCED` or `STATUS_BLOCKED`
2. Update `ProductionService` to create batches with `BLOCKED` status
3. Require explicit approval workflow before batch becomes `AVAILABLE`
4. Update frontend to show pending batches needing approval

**Impact:** Medium - Affects quality control workflow

---

### GAP-B04: Batch Size Configuration Missing (MEDIUM)

**Spec Says:**
> Batch creation based on size rules: per-piece / per-quantity. Example: 100kg produced with 25kg batch size = 4 batches.

**Current Implementation:**
- No batch size configuration exists
- Production confirmation creates single batch per operation

**Required Changes:**
1. Add `BatchSizeConfig` entity/table:
   ```sql
   CREATE TABLE batch_size_config (
     config_id SERIAL PRIMARY KEY,
     material_code VARCHAR(100),
     operation_type VARCHAR(50),
     batch_size_type VARCHAR(20), -- 'FIXED_QUANTITY' | 'FIXED_COUNT' | 'SINGLE'
     batch_size DECIMAL(15,4),
     batch_size_unit VARCHAR(20),
     status VARCHAR(20)
   );
   ```
2. Add `BatchSizeService` to calculate batch count/sizes
3. Update `ProductionService` to create multiple batches based on config
4. Add frontend config page for batch size rules

**Impact:** Medium - Required for correct batch generation

---

### GAP-B05: Quantity Invariant Validation (MEDIUM)

**Spec Says:**
> Split: Sum(child batch quantities) = Consumed from parent
> Merge: Sum(consumed parent quantities) = Child batch quantity

**Current Implementation:**
- Split validates `totalSplitQty <= sourceBatch.quantity` but doesn't enforce equality
- Merge correctly sums all source quantities

**Required Changes:**
1. Add validation mode (strict vs tolerant) for splits
2. Add explicit quantity reconciliation check after operations
3. Log discrepancies for audit purposes
4. Add tolerance configuration for rounding differences

**Impact:** Medium - Affects quantity accuracy

---

### GAP-B06: Genealogy Immutability Enforcement (MEDIUM)

**Spec Says:**
> Genealogy is permanent and immutable. No deletes or overwrites.

**Current Implementation:**
- No constraints prevent deletion of BatchRelation records
- No soft delete mechanism

**Required Changes:**
1. Add application-level restriction on delete operations
2. Add database trigger to prevent DELETE on batch_relations
3. Implement soft delete with `deleted_at` timestamp if removal needed
4. Add audit logging for any deletion attempts

**Impact:** Medium - Affects compliance and traceability

---

### GAP-B07: Hold State Enforcement (LOW)

**Spec Says:**
> ON_HOLD blocks consumption and allocation.

**Current Implementation:**
- Status check exists in split/merge for AVAILABLE only
- No explicit ON_HOLD check in consumption flow

**Required Changes:**
1. Add ON_HOLD validation in `consumeBatch()` operations
2. Add ON_HOLD validation in `BatchOrderAllocation` service
3. Return clear error message when attempting blocked operations

**Impact:** Low - Minor enforcement gap

---

### GAP-B08: Allocation Immutability (LOW)

**Spec Says:**
> Allocation does not alter batch quantity. Allocation history is immutable.

**Current Implementation:**
- `BatchOrderAllocation` entity exists
- No explicit immutability enforcement

**Required Changes:**
1. Review allocation logic to ensure quantity is not modified
2. Add application-level delete restriction on allocations
3. Add "release" as separate record rather than deletion

**Impact:** Low - Allocation system exists, needs constraints

---

### GAP-B09: Operation Context in Genealogy (LOW)

**Spec Says:**
> Each relationship must have OperationID, Timestamp, Status.

**Current Implementation:**
- `BatchRelation` has `operationId`, `createdOn`, `status`
- OperationID is nullable

**Required Changes:**
1. Make `operationId` NOT NULL for production-generated relations
2. Allow NULL only for manual corrections (with audit trail)

**Impact:** Low - Schema adjustment

---

## 4. Implementation Tasks

### Phase 1: Critical Fixes (Block Manual Editing)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B01 | Remove/restrict `createBatch()` endpoint | 2h | CRITICAL |
| B02 | Remove quantity from `UpdateBatchRequest` | 1h | CRITICAL |
| B03 | Add `adjustQuantity()` with mandatory reason | 3h | CRITICAL |
| B04 | Update frontend to remove manual batch creation | 2h | CRITICAL |
| B05 | Add integration tests for batch immutability | 3h | CRITICAL |

### Phase 2: Default Status & Workflow (Quality Control)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B06 | Change default batch status to BLOCKED/PRODUCED | 1h | HIGH |
| B07 | Update ProductionService batch creation | 2h | HIGH |
| B08 | Add pending approval queue to dashboard | 3h | HIGH |
| B09 | Update batch list to show approval workflow | 2h | HIGH |

### Phase 3: Batch Size Configuration

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B10 | Create `batch_size_config` table (SQL patch) | 1h | MEDIUM |
| B11 | Create `BatchSizeConfig` entity | 1h | MEDIUM |
| B12 | Create `BatchSizeService` with calculation logic | 3h | MEDIUM |
| B13 | Update ProductionService for multi-batch creation | 4h | MEDIUM |
| B14 | Add BatchSizeConfig CRUD endpoints | 2h | MEDIUM |
| B15 | Add frontend config page | 4h | MEDIUM |

### Phase 4: Validation & Constraints

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B16 | Add quantity invariant validation to split | 2h | MEDIUM |
| B17 | Add quantity invariant validation to merge | 2h | MEDIUM |
| B18 | Add genealogy delete prevention (app-level) | 2h | MEDIUM |
| B19 | Add ON_HOLD validation to consumption | 2h | LOW |
| B20 | Make operationId NOT NULL for prod relations | 1h | LOW |

### Phase 5: Testing & Documentation

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B21 | Backend unit tests for all batch rules | 4h | HIGH |
| B22 | E2E tests for batch workflow | 3h | HIGH |
| B23 | Update user documentation | 2h | MEDIUM |

---

## 4.1 Schema Alignment with Data Model

**Batches Table (batches):**
| Field | Spec | Implementation | Status |
|-------|------|----------------|--------|
| BatchID (PK) | Required | batch_id | ✅ |
| BatchNumber | Required, unique | batch_number UNIQUE | ✅ |
| MaterialID | Required | material_id | ✅ |
| Quantity | Required | quantity DECIMAL(15,4) | ✅ |
| Status | PRODUCED/BLOCKED/AVAILABLE/ON_HOLD/CONSUMED/SCRAPPED | All present | ✅ |
| GeneratedAtOperationId | Required FK | generated_at_operation_id | ✅ |
| ApprovedBy | For quality decision | approved_by | ✅ |
| ApprovedOn | Timestamp | approved_on | ✅ |
| RejectionReason | For rejections | rejection_reason | ✅ |
| RejectedBy | For rejections | rejected_by | ✅ |
| RejectedOn | Timestamp | rejected_on | ✅ |

**BatchRelations Table (batch_relations):**
| Field | Spec | Implementation | Status |
|-------|------|----------------|--------|
| RelationID (PK) | Required | relation_id | ✅ |
| ParentBatchID (FK) | Required | parent_batch_id | ✅ |
| ChildBatchID (FK) | Required | child_batch_id | ✅ |
| OperationID (FK) | Required | operation_id | ✅ |
| RelationType | SPLIT/MERGE | relation_type | ✅ |
| QuantityConsumed | Required | quantity_consumed | ✅ |
| Timestamp | Required | created_on | ✅ |
| Status | ACTIVE/CLOSED | status | ✅ |
| CreatedBy | Audit | created_by | ✅ |

**BatchOrderAllocation Table (batch_order_allocations):**
| Field | Spec | Implementation | Status |
|-------|------|----------------|--------|
| AllocationID (PK) | Required | allocation_id | ✅ |
| BatchID (FK) | Required | batch_id | ✅ |
| OrderLineID (FK) | Required | order_line_id | ✅ |
| AllocatedQty | Required | allocated_qty | ✅ |
| Status | ALLOCATED/RELEASED | status | ✅ |

**Schema Alignment: 100%** - All tables and fields match specification.

---

## 5. Existing Implementation Strengths

**Already Compliant:**
1. Batch entity with proper status model
2. BatchRelation for genealogy (SPLIT/MERGE types)
3. Split and merge operations with proper relation creation
4. Genealogy query with parent/child traversal
5. Audit trail logging for all changes
6. Quality approval/rejection workflow
7. BatchOrderAllocation for order-batch mapping
8. Configurable batch number generation

---

## 6. Database Schema Changes Required

```sql
-- Patch 024: Batch Management Compliance

-- 1. Batch size configuration
CREATE TABLE IF NOT EXISTS batch_size_config (
    config_id SERIAL PRIMARY KEY,
    material_code VARCHAR(100),
    operation_type VARCHAR(50),
    equipment_type VARCHAR(50),
    batch_size_type VARCHAR(20) NOT NULL DEFAULT 'SINGLE',
    batch_size DECIMAL(15,4),
    batch_size_unit VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT chk_batch_size_type CHECK (batch_size_type IN ('FIXED_QUANTITY', 'FIXED_COUNT', 'SINGLE'))
);

-- 2. Batch quantity adjustments (for corrections with audit trail)
CREATE TABLE IF NOT EXISTS batch_quantity_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    old_quantity DECIMAL(15,4) NOT NULL,
    new_quantity DECIMAL(15,4) NOT NULL,
    adjustment_reason VARCHAR(500) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL,
    adjusted_by VARCHAR(100) NOT NULL,
    adjusted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_adjustment_type CHECK (adjustment_type IN ('CORRECTION', 'INVENTORY_COUNT', 'DAMAGE', 'SYSTEM'))
);

-- 3. Add soft delete to batch_relations (optional - for compliance)
ALTER TABLE batch_relations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE batch_relations ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100);
```

---

## 7. Summary

| Category | Count | Effort |
|----------|-------|--------|
| Critical Gaps | 2 | ~11h |
| High Priority | 4 | ~8h |
| Medium Priority | 9 | ~22h |
| Low Priority | 4 | ~7h |
| **Total** | **19 tasks** | **~48h** |

**Recommended Approach:**
1. Start with Phase 1 (Critical) - Block direct editing
2. Phase 2 (High) - Fix default workflow
3. Phase 3 (Medium) - Add batch size configuration
4. Phase 4 (Medium/Low) - Add validations
5. Phase 5 - Testing & Documentation

---

**End of Analysis**
