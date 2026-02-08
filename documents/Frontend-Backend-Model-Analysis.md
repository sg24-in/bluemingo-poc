# Frontend-Backend Model Analysis

**Document Created:** 2026-02-08
**Purpose:** Comprehensive analysis of frontend TypeScript models vs backend Java DTOs to identify mismatches and gaps

---

## Executive Summary

This document analyzes the alignment between frontend TypeScript interfaces and backend Java DTOs. The analysis identified several categories of issues:

| Severity | Count | Description |
|----------|-------|-------------|
| 🔴 HIGH | 0 | All critical gaps resolved (GAP-019 fixed 2026-02-08) |
| 🟡 MEDIUM | 4 | Missing fields that affect functionality (Equipment, Material, Product models) |
| 🟢 LOW | 8 | Well-aligned models (Orders, Operations, Production, Batches, Inventory, etc.) |

---

## Analysis Results by Entity

### 1. Orders & Order Line Items

**Files:**
- Frontend: `frontend/src/app/shared/models/order.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/OrderDTO.java`

**Status:** 🟢 FIXED (2026-02-08)

**Previous Issue:**
- Frontend expected `lineItem.processes[].operations[]`
- Backend sends `lineItem.operations[]` directly

**Fix Applied:**
```typescript
// order.model.ts
export interface OrderLineItem {
  // ... existing fields
  operations?: OperationBrief[];  // ADDED - Operations link directly
  currentOperation?: OperationBrief;  // ADDED
  // Legacy - kept for backwards compatibility
  processes?: ProcessSummary[];
  currentProcess?: ProcessSummary;
}
```

**Current Alignment:** ✅ Complete

---

### 2. Operations

**Files:**
- Frontend: `frontend/src/app/shared/models/operation.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/OperationDTO.java`

**Status:** 🟢 GOOD

**Model Comparison:**

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| operationId | `number` | `Long` | ✅ Match |
| processId | `number?` | `Long` | ✅ Match |
| operationName | `string` | `String` | ✅ Match |
| operationCode | `string` | `String` | ✅ Match |
| operationType | `string` | `String` | ✅ Match |
| sequenceNumber | `number` | `Integer` | ✅ Match |
| status | `OperationStatusType` | `String` | ✅ Match |
| targetQty | `number?` | `BigDecimal` | ⚠️ Precision |
| confirmedQty | `number?` | `BigDecimal` | ⚠️ Precision |
| blockReason | `string?` | `String` | ✅ Match |
| blockedBy | `string?` | `String` | ✅ Match |
| blockedOn | `string?` | `LocalDateTime` | ✅ Match |
| processName | `string?` | `String` | ✅ Match (added) |
| orderNumber | `string?` | `String` | ✅ Match |
| productSku | `string?` | `String` | ✅ Match |

**Note:** BigDecimal→number conversion may lose precision for very large quantities (>15 significant digits)

---

### 3. Production Confirmation ✅ RESOLVED

**Files:**
- Frontend: `frontend/src/app/shared/models/production.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/ProductionConfirmationDTO.java`

**Status:** ✅ ALIGNED (Fixed 2026-02-08)

**Fields Added:**

| Field | Backend DTO | Frontend Model | Status |
|-------|-------------|----------------|--------|
| `outputBatches` | `List<BatchDTO>` | ✅ Added | Multi-batch output supported |
| `isPartial` | `Boolean` | ✅ Added | Partial confirmation indicator |
| `remainingQty` | `BigDecimal` | ✅ Added | Quantity left to confirm |
| `batchCount` | `Integer` | ✅ Added | Number of batches produced |
| `hasPartialBatch` | `Boolean` | ✅ Added | Split batch indicator |
| `saveAsPartial` | `Boolean` | ✅ Added | User intent for partial save |

**Implementation Complete:**
- All 6 fields added to frontend model
- Production confirm component updated with multi-batch display
- Partial confirmation workflow with progress bar and continue button
- Comprehensive UI styling added

---

### 4. Batches ✅ RESOLVED

**Files:**
- Frontend: `frontend/src/app/shared/models/batch.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/BatchDTO.java`

**Status:** ✅ ALIGNED (Fixed 2026-02-08)

**Model Comparison:**

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| batchId | `number` | `Long` | ✅ Match |
| batchNumber | `string` | `String` | ✅ Match |
| materialId | `number?` | `Long` | ✅ Match |
| materialCode | `string?` | `String` | ✅ Match |
| materialName | `string?` | `String` | ✅ Match |
| quantity | `number` | `BigDecimal` | ⚠️ Precision |
| unit | `string?` | `String` | ✅ Match |
| status | `BatchStatusType` | `String` | ✅ Match |
| location | `string?` | `String` | ✅ Match |
| generatedAtOperationId | ✅ Added | `Long` | ✅ Match |
| createdVia | ✅ Added | `String` | ✅ Match |
| supplierBatchNumber | ✅ Added | `String` | ✅ Match |
| supplierId | ✅ Added | `String` | ✅ Match |
| parentBatches | `BatchRelation[]?` | `List<BatchRelationDTO>` | ✅ Match |
| childBatches | `BatchRelation[]?` | `List<BatchRelationDTO>` | ✅ Match |

**Implementation Complete:**
- Added `BatchCreatedVia` type with 6 creation methods
- Added 4 traceability fields to Batch interface
- Added "Traceability Information" card to batch detail page
- Color-coded badges for creation methods
- Supplier information display for goods receipt batches

---

### 5. Inventory

**Files:**
- Frontend: `frontend/src/app/shared/models/inventory.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/InventoryDTO.java`

**Status:** 🟢 GOOD

**Model Comparison:**

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| inventoryId | `number` | `Long` | ✅ Match |
| materialId | `number` | `Long` | ✅ Match |
| materialCode | `string` | `String` | ✅ Match |
| materialName | `string` | `String` | ✅ Match |
| materialType | `string` | `String` | ✅ Match |
| batchId | `number?` | `Long` | ✅ Match |
| batchNumber | `string?` | `String` | ✅ Match |
| quantity | `number` | `BigDecimal` | ⚠️ Precision |
| unit | `string` | `String` | ✅ Match |
| state | `InventoryStateType` | `String` | ✅ Match |
| location | `string?` | `String` | ✅ Match |
| blockReason | `string?` | `String` | ✅ Match |
| blockedBy | `string?` | `String` | ✅ Match |
| blockedOn | `string?` | `LocalDateTime` | ✅ Match |

**Note:** Model is well-aligned. BigDecimal precision note applies.

---

### 6. Equipment

**Files:**
- Frontend: `frontend/src/app/shared/models/equipment.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/EquipmentDTO.java`

**Status:** 🟡 MEDIUM - Missing Category Field

**Model Comparison:**

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| equipmentId | `number` | `Long` | ✅ Match |
| equipmentCode | `string` | `String` | ✅ Match |
| name | `string` | `String` | ✅ Match |
| equipmentType | `string` | `String` | ✅ Match |
| equipmentCategory | ❌ Missing | `String` | 🟡 Missing |
| capacity | `number?` | `BigDecimal` | ⚠️ Precision |
| capacityUnit | `string?` | `String` | ✅ Match |
| location | `string?` | `String` | ✅ Match |
| status | `EquipmentStatusType` | `String` | ✅ Match |

**Missing Field:**
```typescript
// equipment.model.ts - ADD
export interface Equipment {
  // ... existing fields
  equipmentCategory?: string;  // MELTING, CASTING, ROLLING, FINISHING, etc.
}
```

**Impact:** Cannot filter/group equipment by category (e.g., show all MELTING equipment)

---

### 7. Operators

**Files:**
- Frontend: `frontend/src/app/shared/models/operator.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/OperatorDTO.java`

**Status:** 🟢 WELL-ALIGNED

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| operatorId | `number` | `Long` | ✅ Match |
| operatorCode | `string` | `String` | ✅ Match |
| name | `string` | `String` | ✅ Match |
| department | `string?` | `String` | ✅ Match |
| shift | `string?` | `String` | ✅ Match |
| status | `string` | `String` | ✅ Match |

---

### 8. Holds

**Files:**
- Frontend: `frontend/src/app/shared/models/hold.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/HoldDTO.java`

**Status:** 🟢 WELL-ALIGNED

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| holdId | `number` | `Long` | ✅ Match |
| entityType | `HoldEntityType` | `String` | ✅ Match |
| entityId | `number` | `Long` | ✅ Match |
| entityName | `string?` | `String` | ✅ Match |
| reason | `string` | `String` | ✅ Match |
| reasonCode | `string?` | `String` | ✅ Match |
| comments | `string?` | `String` | ✅ Match |
| status | `HoldStatusType` | `String` | ✅ Match |
| appliedBy | `string` | `String` | ✅ Match |
| appliedOn | `string` | `LocalDateTime` | ✅ Match |
| releasedBy | `string?` | `String` | ✅ Match |
| releasedOn | `string?` | `LocalDateTime` | ✅ Match |
| releaseComments | `string?` | `String` | ✅ Match |

---

### 9. Customers

**Files:**
- Frontend: `frontend/src/app/shared/models/customer.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/CustomerDTO.java`

**Status:** 🟢 WELL-ALIGNED

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| customerId | `number` | `Long` | ✅ Match |
| customerCode | `string` | `String` | ✅ Match |
| customerName | `string` | `String` | ✅ Match |
| contactPerson | `string?` | `String` | ✅ Match |
| email | `string?` | `String` | ✅ Match |
| phone | `string?` | `String` | ✅ Match |
| address | `string?` | `String` | ✅ Match |
| status | `string` | `String` | ✅ Match |

---

### 10. Materials

**Files:**
- Frontend: `frontend/src/app/shared/models/material.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/MaterialDTO.java`

**Status:** 🟡 MEDIUM - Missing Fields

**Model Comparison:**

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| materialId | `number` | `Long` | ✅ Match |
| materialCode | `string` | `String` | ✅ Match |
| materialName | `string` | `String` | ✅ Match |
| materialType | `string` | `String` | ✅ Match |
| baseUnit | `string` | `String` | ✅ Match |
| description | `string?` | `String` | ✅ Match |
| status | `string` | `String` | ✅ Match |
| materialGroup | ❌ Missing | `String` | 🟡 Missing |
| standardCost | ❌ Missing | `BigDecimal` | 🟡 Missing |
| safetyStock | ❌ Missing | `BigDecimal` | 🟡 Missing |
| reorderPoint | ❌ Missing | `BigDecimal` | 🟡 Missing |
| leadTimeDays | ❌ Missing | `Integer` | 🟡 Missing |
| defaultSupplierId | ❌ Missing | `Long` | 🟡 Missing |
| defaultSupplierName | ❌ Missing | `String` | 🟡 Missing |
| specifications | ❌ Missing | `Map<String,String>` | 🟡 Missing |
| alternativeMaterials | ❌ Missing | `List<Long>` | 🟡 Missing |
| shelfLifeDays | ❌ Missing | `Integer` | 🟡 Missing |
| storageConditions | ❌ Missing | `String` | 🟡 Missing |
| hazardClass | ❌ Missing | `String` | 🟡 Missing |

**Missing Fields (11 total):**
```typescript
// material.model.ts - Consider adding
export interface Material {
  // ... existing fields
  materialGroup?: string;
  standardCost?: number;
  safetyStock?: number;
  reorderPoint?: number;
  leadTimeDays?: number;
  defaultSupplierId?: number;
  defaultSupplierName?: string;
  specifications?: Record<string, string>;
  alternativeMaterials?: number[];
  shelfLifeDays?: number;
  storageConditions?: string;
  hazardClass?: string;
}
```

**Impact:** Material management features limited (no cost, inventory thresholds, supplier defaults)

---

### 11. Products

**Files:**
- Frontend: `frontend/src/app/shared/models/product.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/ProductDTO.java`

**Status:** 🟡 MEDIUM - Missing Fields

**Model Comparison:**

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| productId | `number` | `Long` | ✅ Match |
| sku | `string` | `String` | ✅ Match |
| productName | `string` | `String` | ✅ Match |
| productCategory | `string?` | `String` | ✅ Match |
| description | `string?` | `String` | ✅ Match |
| baseUnit | `string` | `String` | ✅ Match |
| status | `string` | `String` | ✅ Match |
| productGroup | ❌ Missing | `String` | 🟡 Missing |
| standardCost | ❌ Missing | `BigDecimal` | 🟡 Missing |
| sellingPrice | ❌ Missing | `BigDecimal` | 🟡 Missing |
| defaultProcessId | ❌ Missing | `Long` | 🟡 Missing |
| defaultProcessName | ❌ Missing | `String` | 🟡 Missing |
| leadTimeDays | ❌ Missing | `Integer` | 🟡 Missing |
| shelfLifeDays | ❌ Missing | `Integer` | 🟡 Missing |
| minOrderQty | ❌ Missing | `BigDecimal` | 🟡 Missing |
| specifications | ❌ Missing | `Map<String,String>` | 🟡 Missing |
| packagingInfo | ❌ Missing | `String` | 🟡 Missing |

**Missing Fields (11 total):**
```typescript
// product.model.ts - Consider adding
export interface Product {
  // ... existing fields
  productGroup?: string;
  standardCost?: number;
  sellingPrice?: number;
  defaultProcessId?: number;
  defaultProcessName?: string;
  leadTimeDays?: number;
  shelfLifeDays?: number;
  minOrderQty?: number;
  specifications?: Record<string, string>;
  packagingInfo?: string;
}
```

**Impact:** Product management features limited (no pricing, default process, specifications)

---

### 12. Processes

**Files:**
- Frontend: `frontend/src/app/shared/models/process.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/ProcessDTO.java`

**Status:** 🟢 WELL-ALIGNED

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| processId | `number` | `Long` | ✅ Match |
| processName | `string` | `String` | ✅ Match |
| processType | `string?` | `String` | ✅ Match |
| description | `string?` | `String` | ✅ Match |
| status | `string` | `String` | ✅ Match |
| operationTemplates | `OperationTemplate[]?` | `List<OperationTemplateDTO>` | ✅ Match |

---

### 13. BOM (Bill of Materials)

**Files:**
- Frontend: `frontend/src/app/shared/models/bom.model.ts`
- Backend: `backend/src/main/java/com/mes/production/dto/BomDTO.java`

**Status:** 🟢 GOOD

| Field | Frontend | Backend | Status |
|-------|----------|---------|--------|
| bomId | `number` | `Long` | ✅ Match |
| productSku | `string` | `String` | ✅ Match |
| componentMaterialCode | `string` | `String` | ✅ Match |
| componentMaterialName | `string` | `String` | ✅ Match |
| quantity | `number` | `BigDecimal` | ⚠️ Precision |
| unit | `string` | `String` | ✅ Match |
| level | `number` | `Integer` | ✅ Match |
| parentBomId | `number?` | `Long` | ✅ Match |
| yieldFactor | `number?` | `BigDecimal` | ⚠️ Precision |
| scrapFactor | `number?` | `BigDecimal` | ⚠️ Precision |
| children | `BomNode[]?` | `List<BomNodeDTO>` | ✅ Match |

---

## Cross-Cutting Issues

### 1. BigDecimal to Number Precision Loss 🟡

**Affected Fields Across All Models:**
- All `quantity` fields
- All `cost` fields
- All `price` fields
- `yieldFactor`, `scrapFactor` in BOM
- `capacity` in Equipment

**Issue:**
- JavaScript `number` type uses IEEE 754 double-precision (64-bit)
- Precision: ~15-17 significant decimal digits
- BigDecimal in Java can have arbitrary precision

**Impact:**
- For typical MES quantities (under 1 million tons), no practical issue
- For very large quantities or precise financial calculations, may lose precision

**Recommendation:**
For critical precision requirements, consider:
```typescript
// Option 1: Use string for precise values
quantity: string;  // "1234567890.123456789"

// Option 2: Use decimal.js library
import Decimal from 'decimal.js';
quantity: Decimal;
```

### 2. DateTime Handling

**Pattern Used:**
- Backend: `LocalDateTime`
- Frontend: `string` (ISO 8601 format)

**This is correct approach** - dates are serialized as ISO strings and parsed as needed in UI.

---

## Action Items

### Priority 1: Critical (Blocking Features) ✅ COMPLETED

| Task | Severity | Status |
|------|----------|--------|
| Add multi-batch fields to ProductionConfirmation model | 🔴 HIGH | ✅ Done |
| Update production confirm component for multi-batch display | 🔴 HIGH | ✅ Done |
| Add partial confirmation support to frontend | 🔴 HIGH | ✅ Done |

### Priority 2: Important (Enhanced Functionality)

| Task | Severity | Status |
|------|----------|--------|
| Add traceability fields to Batch model | 🟡 MEDIUM | ✅ Done |
| Add equipmentCategory to Equipment model | 🟡 MEDIUM | Pending |
| Add material management fields | 🟡 MEDIUM | Pending |
| Add product management fields | 🟡 MEDIUM | Pending |

### Priority 3: Low (Nice to Have)

| Task | Severity | Effort |
|------|----------|--------|
| Document BigDecimal precision implications | 🟢 LOW | 1h |
| Consider decimal.js for financial fields | 🟢 LOW | 4h |

---

## Appendix: Status Constants Alignment

### Operation Status Types
```typescript
// Frontend
type OperationStatusType = 'NOT_STARTED' | 'READY' | 'IN_PROGRESS' | 'CONFIRMED' | 'ON_HOLD' | 'BLOCKED' | 'PARTIALLY_CONFIRMED';

// Backend
public static final String STATUS_NOT_STARTED = "NOT_STARTED";
public static final String STATUS_READY = "READY";
public static final String STATUS_IN_PROGRESS = "IN_PROGRESS";
public static final String STATUS_CONFIRMED = "CONFIRMED";
public static final String STATUS_ON_HOLD = "ON_HOLD";
public static final String STATUS_BLOCKED = "BLOCKED";
public static final String STATUS_PARTIALLY_CONFIRMED = "PARTIALLY_CONFIRMED";
```
✅ Aligned

### Inventory State Types
```typescript
// Frontend
type InventoryStateType = 'AVAILABLE' | 'CONSUMED' | 'RESERVED' | 'PRODUCED' | 'BLOCKED' | 'ON_HOLD' | 'SCRAPPED';

// Backend
public static final String STATE_AVAILABLE = "AVAILABLE";
public static final String STATE_CONSUMED = "CONSUMED";
public static final String STATE_RESERVED = "RESERVED";
public static final String STATE_PRODUCED = "PRODUCED";
public static final String STATE_BLOCKED = "BLOCKED";
public static final String STATE_ON_HOLD = "ON_HOLD";
public static final String STATE_SCRAPPED = "SCRAPPED";
```
✅ Aligned

### Batch Status Types
```typescript
// Frontend
type BatchStatusType = 'QUALITY_PENDING' | 'AVAILABLE' | 'PRODUCED' | 'CONSUMED' | 'BLOCKED' | 'ON_HOLD' | 'SCRAPPED';

// Backend
public static final String STATUS_QUALITY_PENDING = "QUALITY_PENDING";
public static final String STATUS_AVAILABLE = "AVAILABLE";
public static final String STATUS_PRODUCED = "PRODUCED";
public static final String STATUS_CONSUMED = "CONSUMED";
public static final String STATUS_BLOCKED = "BLOCKED";
public static final String STATUS_ON_HOLD = "ON_HOLD";
public static final String STATUS_SCRAPPED = "SCRAPPED";
```
✅ Aligned

---

## Document History

| Date | Version | Changes |
|------|---------|---------|
| 2026-02-08 | 1.0 | Initial analysis document created |
| 2026-02-08 | 1.1 | GAP-019 (Production Confirmation Multi-Batch) implemented and marked complete |
| 2026-02-08 | 1.2 | GAP-020 (Batch Traceability Fields) implemented and marked complete |
