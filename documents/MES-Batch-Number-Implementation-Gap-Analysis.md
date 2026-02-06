# Batch Number Implementation Gap Analysis

**Reference Specification:** `documents/MES-Batch-Number-Creation-Specification.md`
**Analysis Date:** 2026-02-06
**Current Implementation:** `backend/src/main/java/com/mes/production/service/BatchNumberService.java`

---

## 1. Executive Summary

| Category | Spec Requirements | Current Status | Compliance |
|----------|------------------|----------------|------------|
| Core Principles | 5 | 5 implemented | 100% |
| Number Structure | 3 components | 3 implemented | 100% |
| Configuration Scope | 3 levels | 2 levels | 67% |
| Generation Scenarios | 4 scenarios | 3 scenarios | 75% |
| Sequence Management | 4 requirements | 3 implemented | 75% |
| Error Handling | 3 requirements | 2 implemented | 67% |
| Audit Requirements | 6 fields | 2 fields | 33% |
| **Overall** | **28 requirements** | **20 implemented** | **~71%** |

---

## 2. Detailed Gap Analysis

### 2.1 Core Principles (Section 2 of Spec)

| # | Principle | Spec Requirement | Current Implementation | Status |
|---|-----------|------------------|------------------------|--------|
| 1 | BatchID ≠ BatchNumber | BatchID is PK, BatchNumber is business ID | `Batch.batchId` (PK) vs `Batch.batchNumber` (unique) | ✅ COMPLIANT |
| 2 | BatchNumber is immutable | Never changed after creation | No update method for batchNumber in BatchService | ✅ COMPLIANT |
| 3 | System-generated only | Never manual entry | `BatchNumberService.generateBatchNumber()` called internally | ✅ COMPLIANT |
| 4 | Execution-time only | Generated at operation confirmation | Called from `ProductionService.confirmProduction()` | ✅ COMPLIANT |
| 5 | Deterministic & auditable | Same inputs = predictable format | Config-based format with sequence | ✅ COMPLIANT |

### 2.2 Batch Number Structure (Sections 4-5 of Spec)

| Component | Spec Requirement | Current Implementation | Status |
|-----------|------------------|------------------------|--------|
| **Prefix** | Derived from material type, SKU, process, or operation | `config.prefix` from `batch_number_config` table | ✅ COMPLIANT |
| **Date** | YYYYMMDD, YYMMDD, YYYYDDD, or YYMMDDHH | `config.date_format` (DateTimeFormatter pattern) | ✅ COMPLIANT |
| **Sequence** | Numeric, zero-padded, monotonically increasing | `config.sequence_length` with zero-padding | ✅ COMPLIANT |
| **Separator** | Configurable (-, _, etc.) | `config.separator` field | ✅ COMPLIANT |

**Current Format:** `{prefix}{separator}{operation_code}{separator}{date}{separator}{sequence}`
**Example:** `BATCH-FUR-20260206-0001`

### 2.3 Configuration Scope (Section 6 of Spec)

| Precedence | Spec Requirement | Current Implementation | Status |
|------------|------------------|------------------------|--------|
| 1 (Highest) | Operation-level config | `operation_type` column in `batch_number_config` | ✅ IMPLEMENTED |
| 2 | Material-level config | `product_sku` column (not material_id) | ⚠️ PARTIAL |
| 3 (Lowest) | Default system config | Fallback when no match found | ✅ IMPLEMENTED |

**Gap:** Spec says "Material-level configuration" but implementation uses `product_sku`. Need to clarify if this is acceptable or if `material_id` column should be added.

### 2.4 Generation Scenarios (Section 7 of Spec)

| Scenario | Spec Requirement | Current Implementation | Status |
|----------|------------------|------------------------|--------|
| **7.1 Raw Material (RM)** | Use supplier lot as prefix OR generate internal | Not implemented - no supplier lot support | ❌ GAP |
| **7.2 Production Output** | One or more batches per operation | Single batch per confirmation | ⚠️ PARTIAL |
| **7.3 Batch Split** | Parent retains number, children get new numbers | `generateSplitBatchNumber()` creates child numbers | ✅ COMPLIANT |
| **7.4 Batch Merge** | Parents keep numbers, merged batch gets new number | `generateMergeBatchNumber()` creates merged number | ✅ COMPLIANT |

**Gaps:**
1. RM receipt does not capture supplier lot number
2. Multi-batch creation per confirmation not fully implemented

### 2.5 Sequence Management (Section 8 of Spec)

| Requirement | Spec Requirement | Current Implementation | Status |
|-------------|------------------|------------------------|--------|
| Atomic | Thread-safe sequence generation | `SELECT ... FOR UPDATE` in `getNextSequence()` | ✅ COMPLIANT |
| Thread-safe | No race conditions | Database-level locking | ✅ COMPLIANT |
| Retry-safe | Idempotent on retry | Transactional rollback | ✅ COMPLIANT |
| Centralized | Database sequence or atomic counter | `batch_number_sequence` table | ✅ COMPLIANT |

**Sequence Scope Options (all implemented):**
- NEVER (global)
- YEARLY (per year)
- MONTHLY (per month)
- DAILY (per day)

### 2.6 Error Handling (Section 9 of Spec)

| Requirement | Spec Requirement | Current Implementation | Status |
|-------------|------------------|------------------------|--------|
| Failed creation | No batch number committed | `@Transactional` rollback | ✅ COMPLIANT |
| Retry handling | No duplicate numbers | UNIQUE constraint on `batch_number` | ✅ COMPLIANT |
| Sequence gaps | Allowed but auditable | Gaps allowed, not audited | ⚠️ PARTIAL |

**Gap:** Sequence gaps are not currently logged to audit trail.

### 2.7 Audit Requirements (Section 10 of Spec)

| Required Field | Spec Requirement | Current Implementation | Status |
|----------------|------------------|------------------------|--------|
| Generated BatchNumber | Log the generated number | Not logged to AuditTrail | ❌ GAP |
| Generation timestamp | When generated | Not logged | ❌ GAP |
| OperationID | Source operation | Not stored in Batch entity | ❌ GAP |
| User/system identity | Who triggered | Not logged | ❌ GAP |
| Source rule | Which config used | Logged via `log.info()` only | ⚠️ PARTIAL |
| Config details | Prefix, date format, etc. | Not logged | ❌ GAP |

**Major Gap:** No integration with `AuditTrailService` for batch number generation events.

### 2.8 Database Schema Alignment

| Schema Element | Spec Requirement | Current Schema | Status |
|----------------|------------------|----------------|--------|
| `Batches.BatchID` | Primary key | `batch_id BIGSERIAL PRIMARY KEY` | ✅ EXISTS |
| `Batches.BatchNumber` | Business identifier | `batch_number VARCHAR(100) UNIQUE` | ✅ EXISTS |
| `Batches.GeneratedAtOperationID` | FK to Operations | NOT EXISTS | ❌ GAP |
| `BatchRelations` | Split/merge tracking | EXISTS with relation_type | ✅ EXISTS |
| `batch_number_config` | Configuration table | EXISTS with all columns | ✅ EXISTS |
| `batch_number_sequence` | Sequence tracking | EXISTS | ✅ EXISTS |

---

## 3. Detailed Task Breakdown

### Phase 11A: Schema & Entity Updates (Priority: HIGH)

| Task ID | Task | Description | Files | Effort |
|---------|------|-------------|-------|--------|
| BN-A01 | Add GeneratedAtOperationID column | SQL patch to add `generated_at_operation_id` FK to batches table | `patches/026_batch_generated_operation.sql` | 0.5h |
| BN-A02 | Update Batch entity | Add `generatedAtOperationId` field and `@ManyToOne` relationship | `Batch.java` | 0.5h |
| BN-A03 | Update BatchDTO | Add `generatedAtOperationId` to response DTOs | `BatchDTO.java` | 0.25h |
| BN-A04 | Update ProductionService | Set `generatedAtOperationId` when creating batch | `ProductionService.java` | 0.5h |
| BN-A05 | Update BatchService | Set `generatedAtOperationId` for split/merge | `BatchService.java` | 0.5h |

**Subtotal: 2.25h**

### Phase 11B: Audit Trail Integration (Priority: HIGH)

| Task ID | Task | Description | Files | Effort |
|---------|------|-------------|-------|--------|
| BN-B01 | Create BatchNumberAuditDTO | DTO for batch number generation audit events | `BatchNumberAuditDTO.java` | 0.25h |
| BN-B02 | Add audit method to BatchNumberService | Log generation with all required fields | `BatchNumberService.java` | 1h |
| BN-B03 | Inject AuditTrailService | Wire up audit service dependency | `BatchNumberService.java` | 0.25h |
| BN-B04 | Add BATCH_NUMBER_GENERATED action type | New action type constant | `AuditTrail.java` | 0.25h |
| BN-B05 | Log config used | Record which config (operation/material/default) was applied | `BatchNumberService.java` | 0.5h |
| BN-B06 | Log sequence gaps | Audit when sequence has gaps (optional) | `BatchNumberService.java` | 0.5h |

**Subtotal: 2.75h**

### Phase 11C: Raw Material Receipt Enhancement (Priority: MEDIUM)

| Task ID | Task | Description | Files | Effort |
|---------|------|-------------|-------|--------|
| BN-C01 | Add supplier_lot_number to ReceiveMaterialRequest | New field in DTO | `InventoryDTO.java` | 0.25h |
| BN-C02 | Add supplier_lot_number to Batch entity | New column to store supplier info | `Batch.java`, SQL patch | 0.5h |
| BN-C03 | Update BatchNumberService for RM | Add generateRmBatchNumber() method | `BatchNumberService.java` | 1h |
| BN-C04 | Add RM config option | Config flag to use supplier lot as prefix | `batch_number_config` SQL | 0.5h |
| BN-C05 | Update InventoryService | Call RM-specific batch number generation | `InventoryService.java` | 0.5h |
| BN-C06 | Update frontend receive material form | Add supplier lot number field | `receive-material.component.*` | 1h |

**Subtotal: 3.75h**

### Phase 11D: Multi-Batch Production (Priority: MEDIUM)

| Task ID | Task | Description | Files | Effort |
|---------|------|-------------|-------|--------|
| BN-D01 | Review batch size config | Verify batch_size_config is used in production | `ProductionService.java` | 0.5h |
| BN-D02 | Verify multi-batch creation | Ensure multiple batches created when qty > batch size | Test coverage | 0.5h |
| BN-D03 | Sequential batch numbers | Ensure batch numbers are sequential within confirmation | `BatchNumberService.java` | 0.5h |

**Subtotal: 1.5h**

### Phase 11E: Configuration Clarification (Priority: LOW)

| Task ID | Task | Description | Files | Effort |
|---------|------|-------------|-------|--------|
| BN-E01 | Clarify product_sku vs material_id | Document decision: keep product_sku or add material_id | Documentation | 0.5h |
| BN-E02 | Add material_id column (if needed) | Alternative config lookup by material | SQL patch, service | 1h |
| BN-E03 | Update config precedence logic | Adjust findMatchingConfig() if needed | `BatchNumberService.java` | 0.5h |

**Subtotal: 2h (optional)**

### Phase 11F: Testing (Priority: HIGH)

| Task ID | Task | Description | Files | Effort |
|---------|------|-------------|-------|--------|
| BN-F01 | Unit tests: BatchNumberService | Test all generation methods | `BatchNumberServiceTest.java` | 2h |
| BN-F02 | Unit tests: Config precedence | Test operation > product > default | `BatchNumberServiceTest.java` | 1h |
| BN-F03 | Unit tests: Sequence reset | Test DAILY, MONTHLY, YEARLY, NEVER | `BatchNumberServiceTest.java` | 1h |
| BN-F04 | Integration tests: Concurrency | Test thread-safety with parallel requests | `BatchNumberIntegrationTest.java` | 2h |
| BN-F05 | Integration tests: Audit logging | Verify audit records created | `BatchNumberIntegrationTest.java` | 1h |
| BN-F06 | E2E tests: Preview display | Verify batch number preview in UI | `e2e/tests/` | 1h |
| BN-F07 | E2E tests: RM receipt | Verify supplier lot in batch number | `e2e/tests/` | 1h |

**Subtotal: 9h**

### Phase 11G: Documentation (Priority: LOW)

| Task ID | Task | Description | Files | Effort |
|---------|------|-------------|-------|--------|
| BN-G01 | Update CLAUDE.md | Add batch number generation section | `.claude/CLAUDE.md` | 0.5h |
| BN-G02 | API documentation | Document /api/batches/preview-number | API docs | 0.5h |
| BN-G03 | Config documentation | Document batch_number_config options | Admin guide | 0.5h |

**Subtotal: 1.5h**

---

## 4. Implementation Priority Matrix

### Critical Path (Must Do)

| Priority | Phase | Tasks | Effort | Dependencies |
|----------|-------|-------|--------|--------------|
| 1 | 11A | Schema & Entity Updates | 2.25h | None |
| 2 | 11B | Audit Trail Integration | 2.75h | 11A |
| 3 | 11F | Core Testing | 5h | 11A, 11B |

**Critical Path Total: 10h**

### Important (Should Do)

| Priority | Phase | Tasks | Effort | Dependencies |
|----------|-------|-------|-------|--------------|
| 4 | 11C | RM Receipt Enhancement | 3.75h | 11A |
| 5 | 11D | Multi-Batch Production | 1.5h | None |
| 6 | 11F | Extended Testing | 4h | 11C, 11D |

**Important Total: 9.25h**

### Optional (Nice to Have)

| Priority | Phase | Tasks | Effort | Dependencies |
|----------|-------|-------|-------|--------------|
| 7 | 11E | Configuration Clarification | 2h | None |
| 8 | 11G | Documentation | 1.5h | All |

**Optional Total: 3.5h**

---

## 5. Recommended Sprint Plan

### Sprint 1: Core Compliance (Days 1-2)
**Goal:** Achieve full spec compliance for core scenarios

| Day | Tasks | Effort |
|-----|-------|--------|
| Day 1 AM | BN-A01 to BN-A03 (Schema + Entity) | 1.25h |
| Day 1 PM | BN-A04 to BN-A05 (Service updates) | 1h |
| Day 1 PM | BN-B01 to BN-B03 (Audit setup) | 1.5h |
| Day 2 AM | BN-B04 to BN-B06 (Audit completion) | 1.25h |
| Day 2 PM | BN-F01 to BN-F03 (Unit tests) | 4h |

### Sprint 2: Extended Features (Days 3-4)
**Goal:** Add RM support and complete testing

| Day | Tasks | Effort |
|-----|-------|--------|
| Day 3 AM | BN-C01 to BN-C03 (RM backend) | 1.75h |
| Day 3 PM | BN-C04 to BN-C06 (RM frontend) | 2h |
| Day 4 AM | BN-D01 to BN-D03 (Multi-batch) | 1.5h |
| Day 4 PM | BN-F04 to BN-F07 (Integration + E2E) | 5h |

### Sprint 3: Polish (Day 5)
**Goal:** Documentation and optional enhancements

| Day | Tasks | Effort |
|-----|-------|--------|
| Day 5 | BN-E01 to BN-E03 (Config clarification) | 2h |
| Day 5 | BN-G01 to BN-G03 (Documentation) | 1.5h |

---

## 6. Files to Modify Summary

### Backend Files

| File | Changes |
|------|---------|
| `patches/026_batch_generated_operation.sql` | NEW: Add generated_at_operation_id column |
| `Batch.java` | Add generatedAtOperationId field, supplier_lot_number |
| `BatchDTO.java` | Add fields to response DTOs |
| `BatchNumberService.java` | Add audit logging, RM generation, sequence gap logging |
| `ProductionService.java` | Set generatedAtOperationId on batch creation |
| `BatchService.java` | Set generatedAtOperationId for split/merge |
| `InventoryDTO.java` | Add supplier_lot_number to ReceiveMaterialRequest |
| `InventoryService.java` | Call RM batch number generation |
| `AuditTrail.java` | Add BATCH_NUMBER_GENERATED action type |
| `BatchNumberServiceTest.java` | NEW: Comprehensive unit tests |
| `BatchNumberIntegrationTest.java` | NEW: Concurrency and audit tests |

### Frontend Files

| File | Changes |
|------|---------|
| `receive-material.component.ts` | Add supplier lot number field |
| `receive-material.component.html` | Add form input |
| `inventory.model.ts` | Add supplier_lot_number to interface |

### Documentation Files

| File | Changes |
|------|---------|
| `.claude/CLAUDE.md` | Add batch number generation section |
| `.claude/TASKS.md` | Track implementation progress |

---

## 7. Risk Assessment

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Sequence concurrency issues | HIGH | LOW | Already using FOR UPDATE lock |
| Breaking existing batch numbers | HIGH | LOW | Only new batches affected |
| Audit performance overhead | MEDIUM | MEDIUM | Async audit logging |
| RM flow changes user workflow | MEDIUM | MEDIUM | Make supplier lot optional |

---

## 8. Acceptance Criteria

### Core Compliance (Sprint 1)
- [ ] All new batches have `generatedAtOperationId` populated
- [ ] Batch number generation logged to AuditTrail
- [ ] Audit record includes: batchNumber, timestamp, operationId, userId, configName
- [ ] Unit tests pass for all generation scenarios
- [ ] No regression in existing functionality

### Extended Features (Sprint 2)
- [ ] RM receipt can capture supplier lot number
- [ ] Supplier lot can be used as batch number prefix (configurable)
- [ ] Multi-batch creation respects batch size config
- [ ] Concurrent generation does not produce duplicates
- [ ] E2E tests verify preview display

### Documentation (Sprint 3)
- [ ] CLAUDE.md updated with batch number section
- [ ] API documentation complete
- [ ] Configuration options documented

---

**Total Estimated Effort:** 22.75h (3-4 days)
**Compliance Target:** 100% after implementation
