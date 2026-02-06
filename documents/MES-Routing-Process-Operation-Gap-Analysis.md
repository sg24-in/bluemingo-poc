# MES Routing, Process & Operation Management - Gap Analysis

**Document Date:** 2026-02-06
**Spec Reference:** MES Routing, Process & Operation Management Specification
**Related:** MES-Batch-Management-Gap-Analysis.md, MES-Data-Model-Gap-Analysis-Feb2026.md

---

## 1. Executive Summary

The specification requires **strict separation between design-time and runtime entities**. The current implementation has a **fundamental architectural gap** - Process and RoutingStep are treated as runtime entities rather than design-time templates.

**Overall Alignment:** ~60%
**Critical Gaps:** 3 (Architectural)
**Medium Gaps:** 5
**Minor Gaps:** 4

---

## 2. Core Concept Comparison

| Concept | Spec Requirement | Current Implementation | Status |
|---------|-----------------|------------------------|--------|
| Process as Template | Design-time template | Runtime instance (has orderLineItem FK) | ❌ CRITICAL GAP |
| RoutingStep as Template | Defines operation metadata | Links to Operation entity directly | ❌ CRITICAL GAP |
| Batch Behavior Declaration | Flags on routing steps | Not implemented | ❌ CRITICAL GAP |
| Operation Instantiation | Created from routing at runtime | Pre-created, linked in routing | ⚠️ GAP |
| DRAFT Status | For design-time workflow | Missing (only ACTIVE/INACTIVE) | ⚠️ GAP |
| Single Active Routing | One ACTIVE routing per process | No enforcement | ⚠️ GAP |
| Routing Lock After Execution | Cannot modify after operations exist | No enforcement | ⚠️ GAP |
| Audit Trail | All design-time changes | Partial - exists but not complete | ✅ Partial |

---

## 3. Entity Responsibility Analysis

### 3.1 Current Architecture (PROBLEMATIC)

```
OrderLineItem
    └── Process (runtime instance, tied to order)
            └── Operation (runtime, pre-created)
                    ↑
            RoutingStep (points TO existing Operation)
                    ↑
            Routing (attached to Process instance)
```

**Problem:** Process is a runtime entity attached to OrderLineItem. RoutingStep points to Operation, implying operations exist before routing defines them.

### 3.2 Required Architecture (FROM SPEC)

```
DESIGN-TIME                          RUNTIME
-----------                          -------
ProcessTemplate                      ProcessInstance
    │                                    │
    └── Routing ─────────────────────────┼──→ creates Operations
            │                            │
            └── RoutingStep             Operation
                  • operationName         • from RoutingStep template
                  • operationType         • linked to ProcessInstance
                  • batchBehavior         • has execution status
```

**Solution:** Introduce ProcessTemplate (design-time) and have Operations instantiated from RoutingSteps at runtime.

---

## 4. Detailed Gap Analysis

### GAP-R01: Process is Runtime, Not Design-Time (CRITICAL)

**Spec Says:**
> Process defines a logical manufacturing stage (Design-time).

**Current Implementation:**
```java
// Process.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "order_line_id", nullable = false)
private OrderLineItem orderLineItem;  // ❌ Ties Process to runtime order
```

**Required Changes:**
1. Create `ProcessTemplate` entity for design-time definitions
2. Keep `Process` as runtime instance (or rename to `ProcessInstance`)
3. Add FK from Process to ProcessTemplate
4. ProcessTemplate fields: name, description, status (DRAFT/ACTIVE/INACTIVE)

**Impact:** HIGH - Requires schema and architectural changes

---

### GAP-R02: RoutingStep Links to Operation (CRITICAL)

**Spec Says:**
> RoutingStep defines operation metadata (name, type). Operations are created at runtime from routing.

**Current Implementation:**
```java
// RoutingStep.java
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "operation_id")
private Operation operation;  // ❌ Points to existing operation
```

**Required Changes:**
1. Remove `operation_id` FK from RoutingStep
2. Add fields to RoutingStep:
   - `operationName` (String)
   - `operationType` (String)
3. Create `OperationInstantiationService` to create Operations from RoutingSteps
4. Add `routingStepId` FK to Operation (to track source template)

**Impact:** HIGH - Requires schema and logic changes

---

### GAP-R03: Missing Batch Behavior Declaration (CRITICAL)

**Spec Says:**
> Each routing step MUST declare batch behavior capability:
> - ProducesOutputBatch (Y/N)
> - AllowsSplit (Y/N)
> - AllowsMerge (Y/N)
> - BatchRuleReference (optional)

**Current Implementation:**
RoutingStep has no batch behavior flags.

**Required Changes:**
1. Add columns to `routing_steps` table:
```sql
ALTER TABLE routing_steps ADD COLUMN produces_output_batch BOOLEAN DEFAULT FALSE;
ALTER TABLE routing_steps ADD COLUMN allows_split BOOLEAN DEFAULT FALSE;
ALTER TABLE routing_steps ADD COLUMN allows_merge BOOLEAN DEFAULT FALSE;
ALTER TABLE routing_steps ADD COLUMN batch_rule_reference VARCHAR(100);
```
2. Update RoutingStep entity with new fields
3. Update ProductionService to check these flags before batch operations
4. Add validation in split/merge to verify routing allows it

**Impact:** HIGH - Affects batch workflow enforcement

---

### GAP-R04: Missing DRAFT Status (MEDIUM)

**Spec Says:**
> Process Status: DRAFT / ACTIVE / INACTIVE
> Routing Status: DRAFT / ACTIVE / INACTIVE

**Current Implementation:**
- Routing: ACTIVE, INACTIVE, ON_HOLD (no DRAFT)
- Process: READY, IN_PROGRESS, etc. (runtime statuses, no DRAFT)

**Required Changes:**
1. Add STATUS_DRAFT constant to Routing entity
2. Add STATUS_DRAFT to ProcessTemplate entity
3. Add validation: DRAFT items cannot be used in runtime
4. Add activation workflow: DRAFT → ACTIVE

**Impact:** MEDIUM - Status management

---

### GAP-R05: No Single Active Routing Enforcement (MEDIUM)

**Spec Says:**
> Only one ACTIVE routing per process

**Current Implementation:**
No enforcement - multiple ACTIVE routings possible for same process.

**Required Changes:**
1. Add unique constraint or validation in RoutingService
2. When activating a routing, deactivate others for same process
3. Add database constraint or application-level check

**Impact:** MEDIUM - Data integrity

---

### GAP-R06: No Routing Lock After Execution (MEDIUM)

**Spec Says:**
> Routing cannot be modified after runtime operations exist

**Current Implementation:**
No enforcement - routing can be modified anytime.

**Required Changes:**
1. Add `hasRuntimeOperations()` check in RoutingService
2. Block update/delete operations if runtime operations exist
3. Return clear error message explaining constraint

**Impact:** MEDIUM - Change control

---

### GAP-R07: Missing Operation Instantiation Service (MEDIUM)

**Spec Says:**
> Operations are created when an order line enters execution, based on ACTIVE routing

**Current Implementation:**
Operations appear to be pre-created and linked to routing steps.

**Required Changes:**
1. Create `OperationInstantiationService`
2. Method: `createOperationsFromRouting(ProcessInstance, Routing)`
3. For each RoutingStep, create an Operation with:
   - OperationName from step
   - OperationType from step
   - Status = NOT_STARTED (first = READY)
   - Link to ProcessInstance
   - Link to source RoutingStep (for traceability)

**Impact:** MEDIUM - New service

---

### GAP-R08: Missing Process Template Management UI (MEDIUM)

**Spec Says:**
> UI: Create / Manage Process with actions: Create, Update, Activate/Inactivate

**Current Implementation:**
No dedicated Process template management UI.

**Required Changes:**
1. Create ProcessTemplate list page
2. Create ProcessTemplate form (create/edit)
3. Add activation workflow UI
4. Add validation: cannot edit if referenced by active routing

**Impact:** MEDIUM - Frontend development

---

### GAP-R09: Missing Routing Designer UI (LOW)

**Spec Says:**
> Visual Model: Ordered list with drag-and-drop, parallel grouping

**Current Implementation:**
No routing designer UI exists.

**Required Changes:**
1. Create routing list page
2. Create routing step editor with:
   - Drag-and-drop reordering
   - Parallel step grouping
   - Batch behavior flag configuration
3. Add step create/edit forms

**Impact:** LOW - Enhancement, not critical

---

### GAP-R10: Missing API Endpoints (LOW)

**Spec Says:**
> APIs: POST/GET/PUT/PATCH for process, routing, routing steps, reorder

**Current Implementation:**
- Process: Limited CRUD
- Routing: Read-only
- RoutingSteps: Read-only

**Required Changes:**
1. Add ProcessTemplate CRUD endpoints
2. Add Routing CRUD endpoints
3. Add RoutingStep CRUD endpoints
4. Add `POST /routing/{id}/activate`
5. Add `POST /routing/{id}/reorder`

**Impact:** LOW - API extension

---

## 5. Implementation Tasks

### Phase 9A: Schema Changes (Critical)

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R01 | Create `process_templates` table (SQL patch) | 2h | CRITICAL |
| R02 | Add batch behavior columns to `routing_steps` | 1h | CRITICAL |
| R03 | Add `operation_name`, `operation_type` to routing_steps | 1h | CRITICAL |
| R04 | Add `routing_step_id` FK to operations table | 1h | CRITICAL |
| R05 | Add DRAFT status to routing table | 0.5h | HIGH |

### Phase 9B: Entity & Repository Changes

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R06 | Create `ProcessTemplate` entity | 2h | CRITICAL |
| R07 | Update `RoutingStep` entity with new fields | 1h | CRITICAL |
| R08 | Update `Operation` entity with routingStepId | 1h | HIGH |
| R09 | Create ProcessTemplateRepository | 1h | HIGH |
| R10 | Add batch behavior constants to RoutingStep | 0.5h | HIGH |

### Phase 9C: Service Logic

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R11 | Create ProcessTemplateService (CRUD) | 3h | HIGH |
| R12 | Create OperationInstantiationService | 4h | HIGH |
| R13 | Add single-active-routing enforcement | 2h | MEDIUM |
| R14 | Add routing-lock-after-execution check | 2h | MEDIUM |
| R15 | Add batch behavior validation in ProductionService | 3h | HIGH |

### Phase 9D: Controllers & APIs

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R16 | Create ProcessTemplateController | 2h | HIGH |
| R17 | Add Routing CRUD endpoints | 2h | HIGH |
| R18 | Add RoutingStep CRUD endpoints | 2h | HIGH |
| R19 | Add routing activate/reorder endpoints | 2h | MEDIUM |

### Phase 9E: Frontend

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R20 | ProcessTemplate list page | 3h | MEDIUM |
| R21 | ProcessTemplate form | 2h | MEDIUM |
| R22 | Routing designer page | 6h | LOW |
| R23 | Routing step editor with batch flags | 4h | MEDIUM |

### Phase 9F: Testing

| # | Task | Effort | Priority |
|---|------|--------|----------|
| R24 | Unit tests for new services | 4h | HIGH |
| R25 | Integration tests for operation instantiation | 3h | HIGH |
| R26 | E2E tests for routing workflow | 3h | MEDIUM |
| R27 | Batch behavior validation tests | 2h | HIGH |

---

## 6. Database Schema Changes

```sql
-- Patch 025: Routing, Process & Operation Enhancements

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

-- 4. Add DRAFT status to routing
-- (Update CHECK constraint if exists, or add new allowed value)

-- 5. Link routing to process template (optional - for design-time routing)
ALTER TABLE routing ADD COLUMN IF NOT EXISTS process_template_id BIGINT REFERENCES process_templates(template_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_process_templates_status ON process_templates(status);
CREATE INDEX IF NOT EXISTS idx_routing_steps_batch_flags ON routing_steps(produces_output_batch, allows_split, allows_merge);
CREATE INDEX IF NOT EXISTS idx_operations_routing_step ON operations(routing_step_id);
```

---

## 7. Validation Rules to Implement

### Design-Time Validation
1. No duplicate sequence numbers in same routing
2. Parallel steps must share same sequence number
3. Mandatory steps cannot be removed
4. Inactive routing cannot be activated if steps missing
5. DRAFT routing cannot be used for operation instantiation

### Runtime Validation
1. Operations must follow routing sequence
2. Users cannot skip operations
3. Parallel execution allowed only if declared
4. Batch split allowed only if `allows_split = true`
5. Batch merge allowed only if `allows_merge = true`
6. Routing cannot be modified after runtime operations exist

---

## 8. Summary

| Category | Count | Effort |
|----------|-------|--------|
| Critical Gaps | 3 | ~12h |
| High Priority | 8 | ~20h |
| Medium Priority | 10 | ~25h |
| Low Priority | 6 | ~15h |
| **Total** | **27 tasks** | **~72h** |

### Recommended Approach

1. **Phase 9A** - Schema changes first (critical foundation)
2. **Phase 9B** - Entity updates
3. **Phase 9C** - Service logic (especially batch behavior enforcement)
4. **Phase 9D** - API endpoints
5. **Phase 9E** - Frontend (can be parallel with backend)
6. **Phase 9F** - Testing throughout

---

## 9. Integration with Batch Management

The routing batch behavior flags directly impact the Batch Management implementation:

| Routing Flag | Batch Management Impact |
|--------------|------------------------|
| `produces_output_batch` | Controls whether ProductionService creates output batch |
| `allows_split` | Controls whether BatchService.splitBatch() is allowed |
| `allows_merge` | Controls whether BatchService.mergeBatches() is allowed |
| `batch_rule_reference` | Links to BatchSizeConfig for batch creation rules |

**Cross-Reference:**
- GAP-R03 (Batch Behavior Declaration) relates to Phase 8C (Batch Size Configuration)
- Both should be implemented together for consistency

---

**End of Analysis**
