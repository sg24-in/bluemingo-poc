# MES Consolidated Requirements - Implementation Plan

**Document Date:** 2026-02-06
**Project:** Bluemingo MES Production Confirmation POC

---

## 1. Executive Summary

This document consolidates all MES specification gap analyses into a unified implementation plan. The analyses compare four MES specification documents against the current implementation.

### Specification Documents Analyzed

| Document | Focus Area | Current Alignment |
|----------|------------|-------------------|
| MES Consolidated Data Model | Schema & Entities | **95-98%** |
| MES Batch Management Specification | Batch Lifecycle & Rules | **75%** |
| MES Routing, Process & Operation Specification | Design-time vs Runtime | **60%** |
| MES Production Confirmation UI Specification | UI Workflow | **85%** |

### Gap Summary

| Category | Data Model | Batch Mgmt | Routing/Ops | Prod UI | **Total** |
|----------|------------|------------|-------------|---------|-----------|
| Critical | 0 | 2 | 3 | 1 | **6** |
| High | 0 | 4 | 5 | 2 | **11** |
| Medium | 2 | 9 | 10 | 9 | **30** |
| Low | 0 | 4 | 9 | 5 | **18** |
| **Tasks** | 2 | 23 | 27 | 20 | **72** |
| **Effort** | ~3h | ~48h | ~72h | ~36h | **~159h** |

---

## 2. Critical Architecture Gaps

These gaps represent fundamental design issues that affect system integrity.

### ARCH-01: Process as Runtime vs Design-Time (Routing Spec)

**Issue:** Process entity is tied to OrderLineItem (runtime), not a reusable template.

**Impact:**
- Cannot define reusable process templates
- Routing definitions are order-specific
- No design-time workflow for process engineers

**Solution:** Introduce `ProcessTemplate` entity for design-time definitions.

### ARCH-02: RoutingStep Links to Operation (Routing Spec)

**Issue:** RoutingStep points TO existing Operation instead of defining template metadata.

**Impact:**
- Operations must exist before routing can reference them
- Cannot instantiate operations from templates
- Breaks design-time / runtime separation

**Solution:** Add `operationName`, `operationType` to RoutingStep; create operations at runtime.

### ARCH-03: Missing Batch Behavior Declaration (Routing Spec)

**Issue:** No flags on routing steps to control batch creation/split/merge.

**Impact:**
- Cannot enforce batch rules at operation level
- Split/merge allowed anywhere regardless of process design
- No batch size configuration integration

**Solution:** Add `produces_output_batch`, `allows_split`, `allows_merge`, `batch_rule_reference` to RoutingStep.

### ARCH-04: Manual Batch Creation Allowed (Batch Spec)

**Issue:** BatchService.createBatch() allows standalone batch creation.

**Impact:**
- Batches can exist without production context
- No operation traceability
- Violates "batches at operation boundaries" rule

**Solution:** Restrict createBatch() to internal use; require production context.

### ARCH-05: Direct Batch Quantity Editing (Batch Spec)

**Issue:** UpdateBatch() allows direct quantity changes.

**Impact:**
- Breaks quantity integrity
- No audit trail for quantity changes
- Violates immutability principle

**Solution:** Remove quantity from UpdateBatchRequest; only allow via split/merge/adjustment.

### ARCH-06: Missing Order Selection Flow (Prod UI Spec)

**Issue:** Production confirmation navigates directly to operation without order context.

**Impact:**
- No order-level workflow visibility
- Cannot see all ready operations for an order
- Missing customer/product context display

**Solution:** Add order selection landing page with cascading dropdowns.

---

## 3. Implementation Phases

The implementation is organized into logical phases that can be executed in parallel where dependencies allow.

### Phase 8: Batch Management Compliance (~48h)

**Objective:** Enforce batch immutability and lifecycle rules.

#### Phase 8A: Critical Fixes (11h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B01 | Remove/restrict `createBatch()` endpoint | 2h | CRITICAL |
| B02 | Remove quantity from `UpdateBatchRequest` | 1h | CRITICAL |
| B03 | Add `adjustQuantity()` with mandatory reason | 3h | CRITICAL |
| B04 | Update frontend to remove manual batch creation | 2h | CRITICAL |
| B05 | Add integration tests for batch immutability | 3h | CRITICAL |

#### Phase 8B: Default Status & Workflow (8h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B06 | Change default batch status to BLOCKED/PRODUCED | 1h | HIGH |
| B07 | Update ProductionService batch creation | 2h | HIGH |
| B08 | Add pending approval queue to dashboard | 3h | HIGH |
| B09 | Update batch list to show approval workflow | 2h | HIGH |

#### Phase 8C: Batch Size Configuration (15h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B10 | Create `batch_size_config` table (SQL patch) | 1h | MEDIUM |
| B11 | Create `BatchSizeConfig` entity | 1h | MEDIUM |
| B12 | Create `BatchSizeService` with calculation logic | 3h | MEDIUM |
| B13 | Update ProductionService for multi-batch creation | 4h | MEDIUM |
| B14 | Add BatchSizeConfig CRUD endpoints | 2h | MEDIUM |
| B15 | Add frontend config page | 4h | MEDIUM |

#### Phase 8D: Validation & Constraints (9h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B16 | Add quantity invariant validation to split | 2h | MEDIUM |
| B17 | Add quantity invariant validation to merge | 2h | MEDIUM |
| B18 | Add genealogy delete prevention (app-level) | 2h | MEDIUM |
| B19 | Add ON_HOLD validation to consumption | 2h | LOW |
| B20 | Make operationId NOT NULL for prod relations | 1h | LOW |

#### Phase 8E: Testing (5h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| B21 | Backend unit tests for all batch rules | 4h | HIGH |
| B22 | E2E tests for batch workflow | 3h | HIGH |
| B23 | Update user documentation | 2h | MEDIUM |

---

### Phase 9: Routing, Process & Operation Management (~72h)

**Objective:** Implement design-time vs runtime separation.

#### Phase 9A: Schema Changes (5.5h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R01 | Create `process_templates` table (SQL patch) | 2h | CRITICAL |
| R02 | Add batch behavior columns to `routing_steps` | 1h | CRITICAL |
| R03 | Add `operation_name`, `operation_type` to routing_steps | 1h | CRITICAL |
| R04 | Add `routing_step_id` FK to operations table | 1h | CRITICAL |
| R05 | Add DRAFT status to routing table | 0.5h | HIGH |

#### Phase 9B: Entity & Repository Changes (5.5h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R06 | Create `ProcessTemplate` entity | 2h | CRITICAL |
| R07 | Update `RoutingStep` entity with new fields | 1h | CRITICAL |
| R08 | Update `Operation` entity with routingStepId | 1h | HIGH |
| R09 | Create ProcessTemplateRepository | 1h | HIGH |
| R10 | Add batch behavior constants to RoutingStep | 0.5h | HIGH |

#### Phase 9C: Service Logic (14h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R11 | Create ProcessTemplateService (CRUD) | 3h | HIGH |
| R12 | Create OperationInstantiationService | 4h | HIGH |
| R13 | Add single-active-routing enforcement | 2h | MEDIUM |
| R14 | Add routing-lock-after-execution check | 2h | MEDIUM |
| R15 | Add batch behavior validation in ProductionService | 3h | HIGH |

#### Phase 9D: Controllers & APIs (8h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R16 | Create ProcessTemplateController | 2h | HIGH |
| R17 | Add Routing CRUD endpoints | 2h | HIGH |
| R18 | Add RoutingStep CRUD endpoints | 2h | HIGH |
| R19 | Add routing activate/reorder endpoints | 2h | MEDIUM |

#### Phase 9E: Frontend (15h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R20 | ProcessTemplate list page | 3h | MEDIUM |
| R21 | ProcessTemplate form | 2h | MEDIUM |
| R22 | Routing designer page | 6h | LOW |
| R23 | Routing step editor with batch flags | 4h | MEDIUM |

#### Phase 9F: Testing (12h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R24 | Unit tests for new services | 4h | HIGH |
| R25 | Integration tests for operation instantiation | 3h | HIGH |
| R26 | E2E tests for routing workflow | 3h | MEDIUM |
| R27 | Batch behavior validation tests | 2h | HIGH |

---

### Phase 10: Production Confirmation UI (~36h)

**Objective:** Complete UI workflow per specification.

#### Phase 10A: Order Selection Flow (8h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| P01 | Create production landing page with order dropdown | 3h | CRITICAL |
| P02 | Add cascading operation dropdown after order selection | 2h | CRITICAL |
| P03 | Add API: `GET /api/orders/with-ready-operations` | 2h | HIGH |
| P04 | Show order context (customer, product, due date) | 1h | HIGH |

#### Phase 10B: Display Enhancements (5.5h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| P05 | Add yield calculation display | 1h | MEDIUM |
| P06 | Add color indicator for yield (good/warning/bad) | 0.5h | MEDIUM |
| P07 | Add batch number preview API endpoint | 2h | MEDIUM |
| P08 | Display previewed batch number in form | 1h | MEDIUM |
| P09 | Add duration calculation display | 1h | MEDIUM |

#### Phase 10C: Workflow Enhancements (6h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| P10 | Add "Save as Partial" button | 2h | MEDIUM |
| P11 | Update backend to accept isPartial flag | 1h | MEDIUM |
| P12 | Show partial confirmation indicator | 1h | MEDIUM |
| P13 | Enable continuing partial confirmations | 2h | MEDIUM |

#### Phase 10D: Optional Enhancements (9h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| P14 | Create MaterialSelectionModalComponent | 4h | LOW |
| P15 | Add "Apply Hold" quick action button | 2h | LOW |
| P16 | Implement two-column responsive layout | 2h | LOW |
| P17 | Add collapsible section headers | 1h | LOW |

#### Phase 10E: Testing (5h)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| P18 | E2E tests for order selection flow | 2h | HIGH |
| P19 | E2E tests for yield/duration calculations | 1h | MEDIUM |
| P20 | E2E tests for partial confirmation | 2h | MEDIUM |

---

### Phase 11: Data Model Minor Fixes (~3h)

**Objective:** Address remaining minor schema gaps.

| # | Task | Effort | Priority |
|---|------|--------|----------|
| D01 | Add deliveryDate, priority to Order entity | 1h | MEDIUM |
| D02 | Add database constraint for Order delivery fields | 0.5h | MEDIUM |
| D03 | Update Order API to include new fields | 0.5h | MEDIUM |
| D04 | Update Order frontend forms | 1h | MEDIUM |

---

## 4. Database Schema Changes

All schema changes consolidated into patches.

### Patch 024: Batch Management Compliance

```sql
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

-- 3. Add soft delete to batch_relations
ALTER TABLE batch_relations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE batch_relations ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100);
```

### Patch 025: Routing, Process & Operation Enhancements

```sql
-- 1. Process Templates (Design-Time)
CREATE TABLE IF NOT EXISTS process_templates (
    template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_process_template_status CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE'))
);

-- 2. Add batch behavior flags to routing_steps
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS operation_name VARCHAR(100);
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50);
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS produces_output_batch BOOLEAN DEFAULT FALSE;
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS allows_split BOOLEAN DEFAULT FALSE;
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS allows_merge BOOLEAN DEFAULT FALSE;
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS batch_rule_reference VARCHAR(100);

-- 3. Add routing step reference to operations
ALTER TABLE operations ADD COLUMN IF NOT EXISTS routing_step_id BIGINT REFERENCES routing_steps(routing_step_id);

-- 4. Link routing to process template
ALTER TABLE routing ADD COLUMN IF NOT EXISTS process_template_id BIGINT REFERENCES process_templates(template_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_process_templates_status ON process_templates(status);
CREATE INDEX IF NOT EXISTS idx_routing_steps_batch_flags ON routing_steps(produces_output_batch, allows_split, allows_merge);
CREATE INDEX IF NOT EXISTS idx_operations_routing_step ON operations(routing_step_id);
```

### Patch 026: Order Enhancements

```sql
-- Add delivery scheduling fields to orders
ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL';
ALTER TABLE orders ADD CONSTRAINT chk_order_priority CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT'));

CREATE INDEX IF NOT EXISTS idx_orders_delivery_date ON orders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
```

---

## 5. Validation Rules Summary

### Batch Management Rules

| Rule | Current | Required |
|------|---------|----------|
| Batches created at operation boundaries only | ❌ | ✅ |
| Batch quantity never edited directly | ❌ | ✅ |
| Genealogy is permanent and immutable | ⚠️ | ✅ |
| Split: Sum(child qty) = parent consumed qty | ⚠️ | ✅ |
| Merge: Sum(parent qty) = child qty | ✅ | ✅ |
| ON_HOLD blocks consumption | ⚠️ | ✅ |

### Routing/Operation Rules

| Rule | Current | Required |
|------|---------|----------|
| DRAFT routing cannot be used at runtime | N/A | ✅ |
| Only one ACTIVE routing per process | ❌ | ✅ |
| Routing locked after operations exist | ❌ | ✅ |
| Operations created from routing templates | ❌ | ✅ |
| Batch split allowed only if allows_split=true | N/A | ✅ |
| Batch merge allowed only if allows_merge=true | N/A | ✅ |

### Production Confirmation Rules

| Rule | Current | Required |
|------|---------|----------|
| Order must be IN_PROGRESS | ✅ | ✅ |
| Operation must be READY | ✅ | ✅ |
| Start time <= current time | ✅ | ✅ |
| End time > start time | ✅ | ✅ |
| Process parameters within min/max | ✅ | ✅ |
| At least one equipment selected | ✅ | ✅ |
| At least one operator selected | ✅ | ✅ |
| Delay reason required if delay > 0 | ✅ | ✅ |

---

## 6. Recommended Execution Order

### Sprint 1: Critical Foundations (Weeks 1-2)

**Focus:** Address architectural gaps and critical batch rules.

1. Phase 8A (Batch Critical) - 11h
2. Phase 9A (Routing Schema) - 5.5h
3. Phase 9B (Routing Entities) - 5.5h
4. Phase 10A (Order Selection) - 8h

**Total:** ~30h

### Sprint 2: Service Logic (Weeks 3-4)

**Focus:** Implement business logic and validation.

1. Phase 8B (Batch Workflow) - 8h
2. Phase 8C (Batch Size Config) - 15h
3. Phase 9C (Routing Services) - 14h

**Total:** ~37h

### Sprint 3: APIs & UI (Weeks 5-6)

**Focus:** Complete API endpoints and frontend features.

1. Phase 8D (Batch Validation) - 9h
2. Phase 9D (Routing APIs) - 8h
3. Phase 9E (Routing Frontend) - 15h
4. Phase 10B (UI Enhancements) - 5.5h
5. Phase 10C (Partial Confirm) - 6h

**Total:** ~43.5h

### Sprint 4: Polish & Testing (Week 7)

**Focus:** Testing, documentation, optional enhancements.

1. Phase 8E (Batch Testing) - 5h
2. Phase 9F (Routing Testing) - 12h
3. Phase 10D (Optional UI) - 9h
4. Phase 10E (UI Testing) - 5h
5. Phase 11 (Order Enhancements) - 3h

**Total:** ~34h

---

## 7. Risk Assessment

### High Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Design-time/runtime separation requires significant refactoring | Schema and service changes | Implement in phases; backward compatibility layer |
| Batch immutability may break existing workflows | User workflow disruption | Document changes; add adjustment endpoint |

### Medium Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Batch size configuration complexity | Multi-batch creation logic | Start with SINGLE; add FIXED_* later |
| Routing designer UI complexity | Development effort | Start with list-based editor; visual later |

### Low Risk

| Risk | Impact | Mitigation |
|------|--------|------------|
| Order selection flow change | Minor UX change | Backward compatible URL support |
| Display enhancements | Minor effort | Implement incrementally |

---

## 8. Success Criteria

### Phase 8 (Batch Management)

- [ ] Batch creation only via production confirmation
- [ ] Batch quantity immutable (adjust endpoint only)
- [ ] Genealogy records cannot be deleted
- [ ] All batch tests passing

### Phase 9 (Routing/Operations)

- [ ] ProcessTemplate CRUD working
- [ ] Operations created from routing at runtime
- [ ] Batch behavior flags enforced
- [ ] Routing lock after execution
- [ ] All routing tests passing

### Phase 10 (Production UI)

- [ ] Order selection dropdown working
- [ ] Yield/duration calculations displayed
- [ ] Partial confirmation supported
- [ ] All E2E tests passing

---

## 9. Reference Documents

| Document | Location |
|----------|----------|
| MES Data Model Gap Analysis | `documents/MES-Data-Model-Gap-Analysis-Feb2026.md` |
| MES Batch Management Gap Analysis | `documents/MES-Batch-Management-Gap-Analysis.md` |
| MES Routing/Operation Gap Analysis | `documents/MES-Routing-Process-Operation-Gap-Analysis.md` |
| MES Production UI Gap Analysis | `documents/MES-Production-Confirmation-UI-Gap-Analysis.md` |
| Production Confirmation Requirements | `documents/MES-Production-Confirmation-Requirements.md` |
| Implementation Progress | `.claude/TASKS.md` |

---

**End of Document**
