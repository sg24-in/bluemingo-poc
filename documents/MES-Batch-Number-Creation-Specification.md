# Batch Number Creation Specification

*(Aligned with MES Data Model & Production Confirmation Flow)*

---

## 1. Purpose

This specification defines **how batch numbers are generated** in the MES system.

The goal is to ensure:

* Deterministic and human-readable batch numbers
* Full traceability and auditability
* Cloud-safe, distributed generation
* Alignment with production confirmation, split, and merge behavior
* No dependency on operator actions

This specification applies to:

* Raw Material (RM) batches
* Intermediate Material (IM / WIP) batches
* Finished Goods (FG) batches

---

## 2. Fundamental Principles (Non-Negotiable)

1. **BatchID ≠ BatchNumber**

   * `BatchID` is a system-generated technical identifier (PK).
   * `BatchNumber` is a business identifier used by users, QA, ERP, and reports.

2. **BatchNumber is immutable**

   * Once generated, it is never changed.
   * Split / merge creates new batch numbers.

3. **Batch numbers are generated only by the system**

   * Never entered manually.
   * Never generated on client/UI side.

4. **Batch numbers are generated only at execution time**

   * Specifically during **operation confirmation**.
   * Never during routing, process, or master setup.

5. **Batch number generation is deterministic and auditable**

   * Same inputs must always result in predictable format.
   * All generation events are audit-logged.

---

## 3. Where Batch Numbers Are Generated in the System

Batch numbers are generated **only during batch creation**, which occurs at:

* Production confirmation (IM / FG / WIP)
* Raw material receipt / ingestion (RM)
* Split or merge operations (child batches only)

### Schema Touchpoints

* `Batches.BatchID`
* `Batches.BatchNumber`
* `Batches.GeneratedAtOperationID`
* `ProductionConfirmation`
* `BatchRelations`

---

## 4. Batch Number Structure (Standard MES Pattern)

BatchNumber is a **structured composite identifier**.

### Recommended Canonical Format

```
<PREFIX>-<DATE>-<SEQUENCE>
```

### Example

```
RM-STEEL-20240215-0012
FG-PIPEA-20240215-0007
WIP-MELT-2502-003
```

---

## 5. Batch Number Components

### 5.1 Prefix

**Purpose**

* Human identification
* Business and regulatory clarity

**Derived from (configurable):**

* Material type (RM / IM / FG)
* Material code / SKU
* Process name
* Operation name

**Examples**

* `RM-STEEL`
* `FG-PIPEA`
* `WIP-ROLL`

---

### 5.2 Date Component

**Purpose**

* Time-based traceability
* Regulatory and operational analysis

**Supported formats**

* `YYYYMMDD`
* `YYMMDD`
* `YYYYDDD` (Julian)
* `YYMMDDHH` (if required)

**Source**

* Production confirmation timestamp
* Or RM receipt timestamp

---

### 5.3 Sequence Component

**Purpose**

* Ensure uniqueness within scope

**Properties**

* Numeric
* Zero-padded
* Monotonically increasing

**Sequence Scope (configurable):**

* Global
* Per day
* Per material
* Per process
* Per operation

**Examples**

```
001
0007
0123
```

---

## 6. Batch Number Configuration Scope

Batch number rules may be configured at **multiple levels**.

**Precedence Order (highest → lowest):**

1. Operation-level configuration
2. Material-level configuration
3. Default system configuration

This allows:

* Packaging operations to define their own rules
* Raw materials to follow supplier-aligned logic
* Consistent fallback behavior

---

## 7. Batch Number Generation Rules by Scenario

### 7.1 Raw Material (RM) Batch Creation

**Trigger**

* RM ingestion / goods receipt

**Rules**

* BatchNumber may:

  * Use supplier lot number as prefix
  * Or generate internal batch number
* Supplier lot (if present) must be stored separately

**Example**

```
SUPP-784512-01
RM-STEEL-20240215-003
```

---

### 7.2 Production Output (IM / FG)

**Trigger**

* Operation confirmation

**Rules**

* One or more batch numbers generated per operation
* Batch size logic applied
* Batch number derived from:

  * Operation context
  * Confirmation timestamp

**Invariant**

```
Number of batches × batch quantity = Produced quantity
```

---

### 7.3 Batch Split

**Trigger**

* Split-capable operation confirmation

**Rules**

* Parent batch retains its BatchNumber
* Each child batch gets a new BatchNumber
* Parent–child relationship recorded

**Example**

```
FG-PIPEA-20240215-001 → FG-PIPEA-20240215-001A
                        FG-PIPEA-20240215-001B
```

(or new sequences depending on config)

---

### 7.4 Batch Merge

**Trigger**

* Merge-capable operation confirmation

**Rules**

* Parent batches keep original BatchNumbers
* New merged batch gets a new BatchNumber
* All parent batches linked via BatchRelations

---

## 8. Sequence Management & Concurrency (Cloud-Safe)

### Requirements

* Sequence generation must be:

  * Atomic
  * Thread-safe
  * Retry-safe

### Implementation Guidance

* Use centralized sequence authority:

  * Database sequence
  * Atomic counter service
* Do NOT generate sequence in UI or client
* Scope sequences as per configuration

---

## 9. Error Handling & Idempotency

### Rules

* If batch creation fails → no batch number is committed
* Retried requests must not generate duplicate batch numbers
* Sequence gaps are allowed but must be auditable

---

## 10. Audit & Traceability Requirements

Each batch number generation must record:

* Generated BatchNumber
* Generation timestamp
* OperationID (if applicable)
* User or system identity
* Source rule (operation/material/default)

Mapped to:

* `AuditTrail`

---

## 11. What the System Must NEVER Do

* Do NOT allow manual batch number entry
* Do NOT reuse batch numbers
* Do NOT change batch numbers after creation
* Do NOT generate batch numbers at routing or design time
* Do NOT generate batch numbers on client side

---

## 12. Alignment with Current Data Model

This specification directly maps to:

* `Batches.BatchID`
* `Batches.BatchNumber`
* `Batches.GeneratedAtOperationID`
* `ProductionConfirmation`
* `BatchRelations`
* `AuditTrail`

**No schema changes are required.**

---

## 13. Canonical Mental Model for Developers

```
Operation confirmed
→ Produced quantity known
→ Batch rule selected
→ Sequence generated atomically
→ BatchNumber constructed
→ Batch record persisted
→ Audit logged
```

---

## 14. Final Instruction for Cloud Coding Assistant

* Treat BatchNumber generation as a **core system service**
* Keep it deterministic, configurable, auditable
* Never leak logic into UI
* Never infer missing parts
* Fail loudly on misconfiguration

---

**End of Batch Number Creation Specification**
