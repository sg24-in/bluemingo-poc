# BF-01 to BF-13 Bug Fix Test Coverage Strategy

**Date:** 2026-02-09
**Target:** 98-99% behavioral test coverage for all BF-modified files
**Rules:** `should_X_when_Y` naming, real GIVEN/WHEN/THEN, no coverage-padding tests

---

## 1. Current State Summary

### Backend Tests (BF-modified files only)

| File | Test File | Current Tests | BF Tests Added |
|------|-----------|:---:|:---:|
| `ProductionService.java` (693 lines) | `ProductionServiceTest.java` | 18 | 4 (BF-01, BF-02) |
| `GlobalExceptionHandler.java` (98 lines) | `GlobalExceptionHandlerTest.java` | 6 | 6 (BF-08, all new) |
| `OperationRepository.java` (120 lines) | *(no dedicated test)* | 0 | 0 |
| `ProductionConfirmation.java` (122 lines) | *(no dedicated test)* | 0 | 0 |

**Backend total: 24 tests across 2 test files**

### Frontend Tests (BF-modified files only)

| File | Test File | Current Tests | BF Tests Added |
|------|-----------|:---:|:---:|
| `order-form.component.ts` (268 lines) | `order-form.component.spec.ts` | 27 | 4 (BF-06) |
| `order-detail.component.ts` (422 lines) | `order-detail.component.spec.ts` | 30 | 6 (BF-11, BF-12) |
| `production-confirm.component.ts` (758 lines) | `production-confirm.component.spec.ts` | 47 | 6 (BF-07, BF-10) |

**Frontend total: 104 tests across 3 test files**

### Other Modified Files (no unit tests applicable)

| File | BF | Notes |
|------|-----|-------|
| `046_fix_jsonb_to_text.sql` | BF-02 | SQL patch, verified indirectly |
| `047_fix_check_constraints.sql` | BF-04 | SQL patch, verified indirectly |
| `06-batches.test.js` | BF-13 | E2E test file itself was changed |

---

## 2. Coverage Gap Analysis

### 2.1 Backend: `ProductionService.java`

**Covered Methods (18 tests):**
- `confirmProduction()` - 11 tests (happy path, validation errors, partial/full)
- `getOperationDetails()` - 1 test
- `rejectConfirmation()` - 1 test
- `getConfirmationById()` - 1 test
- `getConfirmationsByStatus()` - 1 test
- `setNextOperationReady()` (private, via confirm) - 3 tests (BF-01)

**Uncovered Methods/Branches:**

| # | Method/Branch | Why It Matters | Priority |
|---|--------------|----------------|----------|
| B1 | `getContinuableOperations()` | Returns ops with PARTIALLY_CONFIRMED status for "continue" workflow | HIGH |
| B2 | `confirmProduction()` - process parameter validation failure path | Backend rejects when params out of min/max range (GAP-003) | HIGH |
| B3 | `confirmProduction()` - process parameter warnings path | Returns warnings when params within 10% of limits | MEDIUM |
| B4 | `confirmProduction()` - batch size service split scenario | When output qty exceeds max batch size, creates multiple batches | MEDIUM |
| B5 | `confirmProduction()` - operation ON_HOLD rejection | Held operations should throw exception | LOW (similar to existing) |
| B6 | `toResponse()` private method edge cases | Null equipment/operator lists | LOW |

**Tests to Write: 5 new tests**

```
1. should_returnPartiallyConfirmedOperations_when_getContinuableOperationsCalled
2. should_rejectConfirmation_when_processParametersBelowMinimum
3. should_returnWarnings_when_processParametersNearLimits
4. should_createMultipleBatches_when_outputExceedsMaxBatchSize
5. should_throwException_when_operationIsOnHold
```

### 2.2 Backend: `GlobalExceptionHandler.java`

**Status: 100% COVERED (6/6 handlers tested)**

No additional tests needed.

### 2.3 Backend: `OperationRepository.java`

**Status: No dedicated test file. Tested indirectly via ProductionServiceTest.**

The repository is a Spring Data JPA interface with `@Query` annotations. The BF-01 change to `findNextOperation` is already tested via `ProductionServiceTest` using mocks. Repository tests would require integration tests with a real database, which is beyond the BF-scope.

**Decision: SKIP** - Repository queries are tested via service-level mocks. Integration tests are a separate concern.

### 2.4 Backend: `ProductionConfirmation.java`

**Status: Entity with @PrePersist/@PreUpdate lifecycle hooks. Tested indirectly.**

The BF-02 change removed `columnDefinition = "CLOB"` annotations. This is a schema-level change that affects database DDL, not runtime behavior. The `@PrePersist`/`@PreUpdate` lifecycle hooks set default values (status, timestamps).

**Decision: SKIP** - Entity lifecycle methods are tested via service-level tests that create/update entities. Dedicated entity tests would be coverage-padding.

---

### 2.5 Frontend: `order-form.component.ts`

**Covered (27 tests):**
- Component creation
- Create mode init (form, line items, customer loading)
- Edit mode init (loads order, populates form, shows readonly fields - BF-06)
- Form validation (required fields, date range)
- Submit flow (create, update, error)

**Uncovered Methods/Branches:**

| # | Method/Branch | Why It Matters | Priority |
|---|--------------|----------------|----------|
| F1 | `cancel()` | Should navigate to `/orders` or `/orders/:id` | HIGH |
| F2 | `removeLineItem(index)` | Should remove from FormArray, block if only 1 item | HIGH |
| F3 | `onCustomerChange(event)` | Should set customerName from selected option text | MEDIUM |
| F4 | `onProductChange(index, event)` | Should set productName and baseUnit from selection | MEDIUM |
| F5 | `hasError(field)` / `hasLineItemError()` | Form validation helper display | LOW |
| F6 | `loadCustomers()` error path | Should handle API failure gracefully | LOW |
| F7 | `loadProducts()` error path | Should handle API failure gracefully | LOW |
| F8 | `canEditLineItems()` | Returns false when order is COMPLETED/CANCELLED | MEDIUM |

**Tests to Write: 6 new tests**

```
1. should_navigateToOrdersList_when_cancelClickedInCreateMode
2. should_navigateToOrderDetail_when_cancelClickedInEditMode
3. should_removeLineItem_when_removeClickedWithMultipleItems
4. should_notRemoveLastLineItem_when_onlyOneExists
5. should_setCustomerName_when_customerDropdownChanged
6. should_blockLineItemEditing_when_orderIsCompleted
```

### 2.6 Frontend: `order-detail.component.ts`

**Covered (30 tests):**
- Component creation, init, route params
- Navigation (goBack, startProduction)
- `canStartOperation()` - 6 status tests
- `getOperationStatusClass()` - 9 status tests
- `getProcessesForLineItem()` - 3 tests
- Error handling
- BF-12: Edit button visibility - 4 tests
- BF-11: Statistics - 2 tests

**Uncovered Methods/Branches:**

| # | Method/Branch | Why It Matters | Priority |
|---|--------------|----------------|----------|
| F9 | `editOrder()` | Should navigate to `/orders/:id/edit` | HIGH |
| F10 | `getInProgressOperations()` | Returns count of IN_PROGRESS/PARTIALLY_CONFIRMED ops | HIGH |
| F11 | `getPendingOperations()` | Returns count of NOT_STARTED/ON_HOLD/BLOCKED ops | HIGH |
| F12 | `getLineItemProgress()` | Returns % complete per line item | HIGH |
| F13 | `getOperationIcon()` | Returns icon class per status (8 branches) | MEDIUM |
| F14 | `toggleFlowChart()` | Toggles collapsed state | MEDIUM |
| F15 | `toggleLineItem()` / `isLineItemCollapsed()` | Toggle per-item collapse state | MEDIUM |
| F16 | `ngOnDestroy()` | Should call `chartService.disposeAll()` | MEDIUM |
| F17 | `getCompletionPercentage()` with completed ops | 0% tested, need >0% case | HIGH |
| F18 | Order with empty lineItems | Edge case: no operations | LOW |

**Tests to Write: 10 new tests**

```
1. should_navigateToEditPage_when_editOrderCalled
2. should_returnInProgressCount_when_operationsAreInProgress
3. should_returnPendingCount_when_operationsArePending
4. should_returnLineItemProgress_when_operationsCompleted
5. should_returnCorrectPercentage_when_someOperationsCompleted
6. should_returnCheckIcon_when_statusIsCompleted
7. should_returnSpinnerIcon_when_statusIsInProgress
8. should_returnPlayIcon_when_statusIsReady
9. should_toggleFlowChartCollapsed_when_toggleCalled
10. should_disposeCharts_when_componentDestroyed
```

### 2.7 Frontend: `production-confirm.component.ts`

**Covered (47 tests):**
- Component creation, init, form setup
- Operation loading, master data loading
- Material selection (add, remove, update quantity)
- BOM validation
- Start/end time validation (8 tests)
- Equipment multi-select (5 tests)
- Operator multi-select (5 tests)
- Delay tracking (5 tests)
- Form submission (3 tests)
- Navigation (3 tests)
- Error handling
- BF-07: Equipment/operator name mapping (3 tests)
- BF-10: isMaterialSelected, duplicate prevention (3 tests)

**Uncovered Methods/Branches:**

| # | Method/Branch | Why It Matters | Priority |
|---|--------------|----------------|----------|
| F19 | `loadSuggestedConsumption()` | Loads BOM-based suggestions, sets `suggestedConsumption` | HIGH |
| F20 | `applySuggestedConsumption()` | Auto-fills material selections from BOM | HIGH |
| F21 | `loadBatchNumberPreview()` | Shows preview of next batch number | MEDIUM |
| F22 | `yieldPercentage` getter | Calculates output/input ratio | MEDIUM |
| F23 | `yieldClass` getter | Returns CSS class based on yield % | MEDIUM |
| F24 | `durationMinutes` / `durationFormatted` | Calculates time between start/end | MEDIUM |
| F25 | `toggleSection()` / `isCollapsed()` | Section collapse state management | LOW |
| F26 | `openHoldModal()` / `closeHoldModal()` / `onHoldApplied()` | Hold workflow within production | MEDIUM |
| F27 | `isPartialConfirmation()` / `getRemainingQty()` | Partial confirmation UI logic | HIGH |
| F28 | `getOutputBatches()` / `hasMultipleBatches()` | Multi-batch display logic | MEDIUM |
| F29 | `openMaterialModal()` / `closeMaterialModal()` / `onMaterialSelectionChange()` | Material modal integration | LOW |
| F30 | `getTargetQty()` / `getConfirmationProgress()` | Progress display for partial confirms | MEDIUM |
| F31 | `hasSufficientStock()` | Returns whether all BOM requirements met | LOW |
| F32 | `getTotalSelectedByMaterial()` | Sum of selected qty per material | LOW |

**Tests to Write: 12 new tests**

```
1. should_loadSuggestedConsumption_when_operationHasBom
2. should_handleError_when_suggestedConsumptionFails
3. should_autoFillMaterials_when_applySuggestionsCalled
4. should_loadBatchNumberPreview_when_operationLoaded
5. should_calculateYieldPercentage_when_outputAndInputProvided
6. should_returnYieldGoodClass_when_yieldAbove95
7. should_returnYieldWarningClass_when_yieldBetween85And95
8. should_calculateDurationMinutes_when_startAndEndTimeSet
9. should_formatDuration_when_durationCalculated
10. should_returnTrue_when_confirmationIsPartial
11. should_returnRemainingQuantity_when_partialConfirmation
12. should_toggleSectionCollapse_when_toggleSectionCalled
```

---

## 3. Test Writing Plan

### Phase 1: Backend (5 new tests)

**File: `ProductionServiceTest.java`**
- Add 5 tests for uncovered branches (B1-B5)
- Estimated: ~150 lines of test code
- Mock setup already exists in beforeEach

### Phase 2: Frontend - OrderDetailComponent (10 new tests)

**File: `order-detail.component.spec.ts`**
- Add 10 tests for uncovered methods (F9-F18)
- Most are simple getter/helper tests
- Mock data already exists

### Phase 3: Frontend - OrderFormComponent (6 new tests)

**File: `order-form.component.spec.ts`**
- Add 6 tests for uncovered methods (F1-F8)
- Needs both create and edit mode test beds

### Phase 4: Frontend - ProductionConfirmComponent (12 new tests)

**File: `production-confirm.component.spec.ts`**
- Add 12 tests for uncovered methods (F19-F32)
- Requires additional mock setup for BOM suggestions
- Requires mock for hold modal integration

---

## 4. Coverage Estimates

### Before (Current)

| File | Methods | Tested | Est. Coverage |
|------|:-------:|:------:|:----:|
| ProductionService.java | 10 public | 8 | ~85% |
| GlobalExceptionHandler.java | 6 | 6 | 100% |
| order-form.component.ts | 19 | 15 | ~82% |
| order-detail.component.ts | 20 | 14 | ~78% |
| production-confirm.component.ts | 52 | 35 | ~72% |

### After (Projected)

| File | Tests Added | Est. Coverage |
|------|:----------:|:----:|
| ProductionService.java | +5 | ~98% |
| GlobalExceptionHandler.java | 0 | 100% |
| order-form.component.ts | +6 | ~98% |
| order-detail.component.ts | +10 | ~98% |
| production-confirm.component.ts | +12 | ~95% |

**Note:** `production-confirm.component.ts` has private chart-building methods and complex modal integrations that are difficult to unit test meaningfully. Remaining ~5% would require E2E-level testing.

---

## 5. Total New Tests

| Layer | Tests to Write |
|-------|:-:|
| Backend (ProductionServiceTest) | 5 |
| Frontend (order-detail.spec) | 10 |
| Frontend (order-form.spec) | 6 |
| Frontend (production-confirm.spec) | 12 |
| **Total** | **33** |

---

## 6. Test Quality Rules (Enforced)

1. **Naming:** `should_<behavior>_when_<condition>` (Jasmine: `'should X when Y'`)
2. **Structure:** Real GIVEN/WHEN/THEN with meaningful assertions
3. **No padding:** Every test validates a real behavioral scenario
4. **No mocking internals:** Mock external dependencies only (API, Router, Services)
5. **No testing getters/setters trivially:** Only test computed logic
6. **Assertions must validate behavior:** Not just "method was called" but "state changed correctly"

---

## 7. Execution Order

1. Backend tests first (fastest to write, fewest dependencies)
2. Frontend order-detail (most straightforward component)
3. Frontend order-form (needs dual test bed setup)
4. Frontend production-confirm (most complex, needs BOM mocks)
5. Run full test suite to verify no regressions
6. Report final coverage numbers
