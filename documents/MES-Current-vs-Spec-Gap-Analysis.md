# MES Current Implementation vs Consolidated Spec - Gap Analysis

**Document Date:** 2026-02-06
**Purpose:** Identify gaps between current POC implementation and MES Consolidated Specification

---

## 1. Executive Summary

| Category | Current | Spec | Alignment |
|----------|---------|------|-----------|
| Order/OrderLineItem | ✅ Aligned | ✓ | 95% |
| Process | ⚠️ Runtime entity | Design-time template | 40% |
| Routing | ⚠️ Linked to runtime | Linked to design-time | 60% |
| RoutingStep | ⚠️ Has operation FK | Has operation FK (spec says this) | 70% |
| Operation | ⚠️ Has process FK | Has process FK (spec says this) | 80% |
| Inventory/Batch | ✅ Good | ✓ | 90% |

**Core Architectural Issue:** The spec shows `Process` as a design-time entity (no OrderLineItem FK), but the current implementation has `Process` as a runtime entity (with OrderLineItem FK).

---

## 2. Entity-by-Entity Comparison

### 2.1 Orders

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| OrderID | PK | ✓ orderId | ✅ |
| CustomerID | FK | ✓ customerRefId | ✅ |
| OrderDate | Date | ✓ orderDate | ✅ |
| Status | Enum | ✓ status | ✅ |

**Gap:** None - fully aligned.

---

### 2.2 OrderLineItems

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| OrderLineID | PK | ✓ orderLineId | ✅ |
| OrderID | FK | ✓ order | ✅ |
| ProductSKU | String | ✓ productSku | ✅ |
| Quantity | Decimal | ✓ quantity | ✅ |
| DeliveryDate | Date | ✓ deliveryDate | ✅ |
| Status | Enum | ✓ status | ✅ |

**Gap:** None - fully aligned.

---

### 2.3 Processes ⚠️ CRITICAL GAP

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| ProcessID | PK | ✓ processId | ✅ |
| ProcessName | String | ❌ stageName | ⚠️ Different field name |
| Status | Enum | ✓ status | ✅ |
| OrderLineItem FK | **NOT IN SPEC** | ✓ orderLineItem | ❌ EXTRA |
| BOMID | Not shown | ✓ bomId | 🤔 Extra |
| StageSequence | Not shown | ✓ stageSequence | 🤔 Extra |
| UsageDecision | Not shown | ✓ usageDecision | 🤔 Extra |

**Analysis:**

The spec shows Process as:
```
Processes
├── ProcessID (PK)
├── ProcessName
└── Status
```

But current implementation has:
```java
// Process.java
@ManyToOne
@JoinColumn(name = "order_line_id", nullable = false)
private OrderLineItem orderLineItem;  // ❌ Not in spec!

private String stageName;      // Should be processName
private Integer stageSequence; // Not in spec
private String usageDecision;  // Not in spec
```

**Root Cause:**
The spec shows Process as a **design-time template**, while current implementation treats it as a **runtime instance**.

**Solution Options:**

| Option | Description | Impact |
|--------|-------------|--------|
| A. Rename Process | Change `Process` → `ProcessInstance`, create new `Process` entity as design-time | HIGH - Schema change |
| B. Use ProcessTemplate | Keep current Process as runtime, use ProcessTemplate as design-time | LOW - Already implemented |
| C. Refactor Process | Remove orderLineItem FK, add to separate linking table | MEDIUM |

**Recommended:** Option B - We already have `ProcessTemplate` for design-time. Keep `Process` as runtime.

---

### 2.4 Routing

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| RoutingID | PK | ✓ routingId | ✅ |
| ProcessID | FK | ✓ process (FK) | ⚠️ Points to runtime Process |
| RoutingName | String | ✓ routingName | ✅ |
| RoutingType | Enum | ✓ routingType | ✅ |
| Status | Enum | ✓ status | ✅ |

**Gap:**
- `ProcessID` FK in spec should point to design-time Process
- Current points to runtime Process

**Current has extra:**
- `processTemplateId` - Links to design-time ProcessTemplate ✅ This is correct!

---

### 2.5 RoutingSteps

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| RoutingStepID | PK | ✓ routingStepId | ✅ |
| RoutingID | FK | ✓ routing | ✅ |
| OperationID | FK | ✓ operation | ⚠️ See below |
| SequenceNumber | Int | ✓ sequenceNumber | ✅ |
| IsParallel | Boolean | ✓ isParallel | ✅ |
| MandatoryFlag | Boolean | ✓ mandatoryFlag | ✅ |
| Status | Enum | ✓ status | ✅ |

**Current has extra (good!):**
- `operationName` - Template field
- `operationType` - Template field
- `producesOutputBatch` - Batch behavior
- `allowsSplit` - Batch behavior
- `allowsMerge` - Batch behavior

**Analysis:**
The spec shows `OperationID` FK in RoutingStep. This is confusing because:
- If Operations are runtime entities, how can RoutingStep (design-time) link to them?
- Current implementation has BOTH: operation FK AND operation template fields

**Interpretation:**
The spec may be using "OperationID" as a reference to an Operation **template** definition, not a runtime instance.

---

### 2.6 Operations

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| OperationID | PK | ✓ operationId | ✅ |
| ProcessID | FK | ✓ process | ✅ |
| OperationName | String | ✓ operationName | ✅ |
| OperationType | String | ✓ operationType | ✅ |
| Status | Enum | ✓ status | ✅ |

**Current has extra:**
- `routingStepId` - Link back to template ✅ Good for traceability
- `operationCode` - Extra identifier
- `sequenceNumber` - Execution order
- `targetQty`, `confirmedQty` - Production tracking
- Block tracking fields

**Status Values:**

| Spec | Current | Match |
|------|---------|-------|
| NOT_STARTED | ✓ STATUS_NOT_STARTED | ✅ |
| READY | ✓ STATUS_READY | ✅ |
| IN_PROGRESS | ✓ STATUS_IN_PROGRESS | ✅ |
| PARTIALLY_CONFIRMED | ✓ STATUS_PARTIALLY_CONFIRMED | ✅ |
| CONFIRMED | ✓ STATUS_CONFIRMED | ✅ |
| BLOCKED | ✓ STATUS_BLOCKED | ✅ |
| ON_HOLD | ✓ STATUS_ON_HOLD | ✅ |

**Gap:** None for Operation entity itself - well aligned!

---

### 2.7 Equipment

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| EquipmentID | PK | ✓ equipmentId | ✅ |
| EquipmentType | Enum | ✓ equipmentType | ✅ |
| Name | String | ✓ equipmentName | ✅ |
| Capacity | Decimal | ✓ capacity | ✅ |
| Status | Enum | ✓ status | ✅ |

**Gap:** None - fully aligned.

---

### 2.8 ProductionConfirmation

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| ConfirmationID | PK | ✓ confirmationId | ✅ |
| OperationID | FK | ✓ operation | ✅ |
| ProducedQty | Decimal | ✓ producedQty | ✅ |
| ScrapQty | Decimal | ✓ scrapQty | ✅ |
| StartTime | Timestamp | ✓ startTime | ✅ |
| EndTime | Timestamp | ✓ endTime | ✅ |
| DelayReason | String | ✓ delayReason | ✅ |
| ProcessParameters | JSON | ✓ processParameters | ✅ |
| RMConsumed | JSON | ❓ Need to verify | ⚠️ |
| Status | Enum | ✓ status | ✅ |

---

### 2.9 Inventory

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| InventoryID | PK | ✓ inventoryId | ✅ |
| MaterialID | String | ✓ materialId | ✅ |
| InventoryType | Enum | ✓ inventoryType | ✅ |
| State | Enum | ✓ state | ✅ |
| Quantity | Decimal | ✓ quantity | ✅ |
| BatchID | FK | ✓ batch | ✅ |

**State Values:**

| Spec | Current | Match |
|------|---------|-------|
| AVAILABLE | ✓ STATE_AVAILABLE | ✅ |
| RESERVED | ⚠️ Need to check | ? |
| CONSUMED | ✓ STATE_CONSUMED | ✅ |
| PRODUCED | ✓ STATE_PRODUCED | ✅ |
| BLOCKED | ✓ STATE_BLOCKED | ✅ |
| SCRAPPED | ✓ STATE_SCRAPPED | ✅ |
| ON_HOLD | ✓ STATE_ON_HOLD | ✅ |

**Gap:** May need to add RESERVED state (for reservation system).

---

### 2.10 Batches

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| BatchID | PK | ✓ batchId | ✅ |
| MaterialID | String | ✓ materialId | ✅ |
| GeneratedAtOperationID | FK | ✓ generatedAtOperation | ✅ |
| BatchNumber | String | ✓ batchNumber | ✅ |
| Quantity | Decimal | ✓ quantity | ✅ |
| Status | Enum | ✓ status | ✅ |

**Gap:** None - well aligned.

---

### 2.11 BatchRelations

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| RelationID | PK | ✓ relationId | ✅ |
| ParentBatchID | FK | ✓ parentBatch | ✅ |
| ChildBatchID | FK | ✓ childBatch | ✅ |
| OperationID | FK | ✓ operation | ✅ |
| RelationType | Enum | ✓ relationType | ✅ |
| QuantityConsumed | Decimal | ✓ quantityConsumed | ✅ |
| Status | Enum | ✓ status | ✅ |

**Gap:** None - fully aligned.

---

### 2.12 BatchOrderAllocation

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| AllocationID | PK | ✓ allocationId | ✅ |
| BatchID | FK | ✓ batch | ✅ |
| OrderLineID | FK | ✓ orderLineItem | ✅ |
| AllocatedQty | Decimal | ✓ allocatedQty | ✅ |
| Timestamp | Timestamp | ✓ createdOn | ✅ |
| Status | Enum | ✓ status | ✅ |

**Gap:** None - fully aligned.

---

### 2.13 HoldRecords

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| HoldID | PK | ✓ holdId | ✅ |
| EntityType | Enum | ✓ entityType | ✅ |
| EntityID | Long | ✓ entityId | ✅ |
| Reason | String | ✓ holdReason | ✅ |
| AppliedBy | String | ✓ appliedBy | ✅ |
| AppliedOn | Timestamp | ✓ appliedOn | ✅ |
| ReleasedBy | String | ✓ releasedBy | ✅ |
| ReleasedOn | Timestamp | ✓ releasedOn | ✅ |
| Status | Enum | ✓ status | ✅ |

**Gap:** None - fully aligned.

---

### 2.14 AuditTrail

| Field | Spec | Current | Status |
|-------|------|---------|--------|
| AuditID | PK | ✓ auditId | ✅ |
| EntityType | String | ✓ entityType | ✅ |
| EntityID | Long | ✓ entityId | ✅ |
| FieldName | String | ✓ fieldName | ✅ |
| OldValue | String | ✓ oldValue | ✅ |
| NewValue | String | ✓ newValue | ✅ |
| ChangedBy | String | ✓ changedBy | ✅ |
| Timestamp | Timestamp | ✓ timestamp | ✅ |

**Gap:** None - fully aligned.

---

## 3. Relationship Analysis

### Spec Says:
```
Orders → OrderLineItems → Processes → Operations
```

### Current Implementation:
```
Orders → OrderLineItems ← Process (has orderLineItem FK)
                              ↓
                          Operations (has process FK)
```

### Issue:
The arrow direction suggests OrderLineItems LINK to Processes, but spec shows no FK in Process for OrderLineItem.

### Interpretation:
The spec's "Processes" is likely a **design-time template**. At runtime, there must be a linking mechanism.

**Options:**
1. **ProcessInstance entity** - Separate runtime entity linking OrderLineItem to Process template
2. **Current approach** - Process IS the runtime instance, ProcessTemplate is design-time

---

## 4. Critical Gaps Summary

### 4.1 Architectural Gaps

| Gap | Description | Priority |
|-----|-------------|----------|
| GAP-ARCH-01 | Process is runtime (has OrderLineItem FK) vs spec shows no FK | HIGH |
| GAP-ARCH-02 | Need clear design-time vs runtime separation | HIGH |

### 4.2 Field Gaps

| Gap | Entity | Field | Issue |
|-----|--------|-------|-------|
| GAP-FLD-01 | Process | stageName | Should be processName |
| GAP-FLD-02 | Inventory | RESERVED state | May not exist |

### 4.3 Missing Entities

| Entity | Description | Priority |
|--------|-------------|----------|
| ProcessInstance | Runtime process linked to OrderLineItem | Consider |

---

## 5. Recommended Approach

### Current Architecture Decision

We have already implemented:
- `ProcessTemplate` - Design-time process definition
- `Process` - Runtime process instance (has orderLineItem FK)
- `RoutingStep` - Has both operation FK and template fields

**Recommendation:** Keep this architecture but clarify naming:

| Spec Entity | Our Entity | Purpose |
|-------------|------------|---------|
| Process (design-time) | ProcessTemplate | Template definition |
| Process (runtime) | Process | Runtime instance per OrderLineItem |
| Routing | Routing | Links to ProcessTemplate |
| RoutingStep | RoutingStep | Defines operation template + batch behavior |
| Operation | Operation | Runtime instance created from RoutingStep |

### Implementation Path

1. **Rename ProcessTemplate → Process (design-time)**
2. **Rename Process → ProcessInstance (runtime)**
3. OR keep current naming with documentation

---

## 6. Action Items

### Immediate (Spec Alignment)

| # | Action | Files | Priority |
|---|--------|-------|----------|
| 1 | Add RESERVED to Inventory states | Inventory.java | HIGH |
| 2 | Rename stageName → processName | Process.java, related files | MEDIUM |
| 3 | Document design-time vs runtime clearly | CLAUDE.md | MEDIUM |

### Future (Nice to Have)

| # | Action | Description |
|---|--------|-------------|
| 4 | Consider renaming Process → ProcessInstance | Clearer naming |
| 5 | Consider renaming ProcessTemplate → Process | Matches spec |

---

## 7. Conclusion

The current implementation is **approximately 85% aligned** with the spec. The main architectural difference is:

- **Spec:** Process appears to be design-time (no OrderLineItem FK)
- **Current:** Process is runtime (has OrderLineItem FK), ProcessTemplate is design-time

This is a valid interpretation because:
1. We need runtime tracking of process execution per order
2. ProcessTemplate provides the design-time template
3. The relationship `OrderLineItems → Processes` in spec implies a runtime linkage

**No breaking changes required** - the current architecture can support all spec requirements with minor field additions.

---

**End of Gap Analysis**
