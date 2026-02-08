# Production Confirmation UI Flow

This document illustrates the complete frontend user journey for production confirmation in the MES system.

---

## Overview

Production confirmation operates at the **Operation level**, not the Order or Line Item level. Each operation within a line item requires its own confirmation.

```
Order (ORD-2026-001)
├── LineItem 1: HR-COIL-2MM (150T)
│   ├── Operation 1: Scrap Charging → Confirmation #1
│   ├── Operation 2: Melting        → Confirmation #2
│   ├── Operation 3: Casting        → Confirmation #3
│   └── Operation 4: Hot Rolling    → Confirmation #4
│
└── LineItem 2: HR-COIL-3MM (50T)
    ├── Operation 1: Scrap Charging → Confirmation #5
    ├── Operation 2: Melting        → Confirmation #6
    ├── Operation 3: Casting        → Confirmation #7
    └── Operation 4: Hot Rolling    → Confirmation #8
```

---

## Screen 1: Dashboard - Operations Status

**Route:** `/#/dashboard`

![Dashboard](../e2e/output/screenshots/production-full-flow/01-dashboard-operations-status.png)

The dashboard shows:
- **Inventory Flow**: RM → WIP → IM → FG pipeline
- **Operations Status**: Ready, In Progress, Confirmed, On Hold, Blocked counts
- **Needs Attention**: Active holds, batches pending approval, blocked inventory
- **Currently Running**: Active operations in progress

---

## Screen 2: Orders List

**Route:** `/#/orders`

![Orders List](../e2e/output/screenshots/production-full-flow/02-orders-list.png)

Shows all production orders with status badges:

| Status | Description | Can Confirm? |
|--------|-------------|--------------|
| CREATED | New order, not started | No |
| IN PROGRESS | Active production | Yes (READY operations) |
| COMPLETED | All operations done | No |
| ON HOLD | Temporarily blocked | No |
| BLOCKED | Quality/issue block | No |
| CANCELLED | Order cancelled | No |

**User Action:** Click "View" to see order details with line items and operations.

---

## Screen 3: Order Detail with Line Items

**Route:** `/#/orders/{orderId}`

![Order Detail](../e2e/output/screenshots/production-full-flow/03-order-detail.png)

Shows:
- **Order Header**: Order number, status badge, customer, order date
- **Line Items**: Each product with SKU, quantity, delivery date
- **Process Flow**: Visual representation of operations for each line item

Example:
- **Order:** ORD-2026-001 (IN PROGRESS)
- **Customer:** ABC Steel Corporation
- **Line Item 1:** Hot Rolled Coil 2mm - 150T
- **Line Item 2:** Hot Rolled Coil 3mm - 50T

---

## Screen 4: Production Confirmation - Landing

**Route:** `/#/production`

![Production Landing](../e2e/output/screenshots/production-full-flow/04-production-landing.png)

Initial state shows:
- **Select Order & Operation** card with Order dropdown
- **Available for Production** summary:
  - 7 Orders with ready operations
  - 7 Ready Operations total

**User Action:** Select an order from the dropdown to see available operations.

---

## Screen 5: Production Confirmation Form - Top Section

**Route:** `/#/production/confirm/{operationId}`

![Confirm Form Top](../e2e/output/screenshots/production-full-flow/06-confirm-form-top.png)

### Header Actions
- **Back to Order** - Return to order detail
- **Apply Hold** button - Put operation on hold if needed

### Operation Details Section
- **Operation**: Scrap Charging (MELT-CHRG)
- **Type**: FURNACE
- **Status**: CONFIRMED/READY/IN_PROGRESS
- **Product**: Hot Rolled Coil 2mm (HR-COIL-2MM)
- **Order Quantity**: 150
- **Stage**: Hot Rolled Coil Production

### Production Time Section
- **Start Time**: Date/time picker (required)
- **End Time**: Date/time picker (required)
- Validation: End time must be after start time

### Production Quantities Section
- **Quantity Produced**: Amount produced (required)
- **Quantity Scrapped**: Scrap amount (optional)
- **Total Production**: Produced - Scrapped
- **Yield**: Percentage indicator with color coding:
  - 🟢 Green: ≥95% (Good)
  - 🟡 Yellow: 80-95% (Warning)
  - 🔴 Red: <80% (Critical)

---

## Screen 6: Production Confirmation Form - Material Consumption

![Material Consumption](../e2e/output/screenshots/production-full-flow/07-confirm-material-consumption.png)

### Material Consumption Section
- **+ Select Materials** button - Opens material selection modal
- **BOM Suggested Consumption** box:
  - Target Quantity: 150 T
  - Total Required: 147 T
  - **Apply Suggestions** button - Auto-fills based on BOM

When materials are selected:
- List of selected batches with quantities
- Remaining quantity available
- Total consumption summary

---

## Screen 7: Production Confirmation Form - Equipment & Operator

The form continues with:

### Equipment & Operator Section
- **Equipment** dropdown - Filtered by operation type (e.g., FURNACE equipment for furnace operations)
- **Operator** dropdown - Available operators for the shift

### Delay Tracking Section (if delays occurred)
- **Delay Checkbox** - Indicate if there was a delay
- **Delay Reason** dropdown - Select from configured reasons
- **Delay Duration** - Minutes of delay
- **Delay Comments** - Additional notes

### Process Parameters Section
Dynamic parameters based on operation type:

**FURNACE Operations:**
- Temperature (°C) - Min: 1500, Max: 1700
- Power (MW) - Min: 50, Max: 100
- Duration (min)

**ROLLING Operations:**
- Roll Force (kN)
- Speed (m/s)
- Entry Temperature (°C)
- Exit Temperature (°C)

**CASTING Operations:**
- Casting Speed (m/min)
- Mold Level (%)
- Cooling Rate

---

## Screen 8: Production Confirmation Form - Submit

At the bottom of the form:

### Output Batch Section
- **Auto-generated Batch Number** preview
- Format: `{PREFIX}-{DATE}-{SEQUENCE}`
- Example: `B-FG-2026-0208-001`

### Action Buttons
- **Confirm Production** - Submit the confirmation (validates all required fields)
- **Cancel** - Discard and return to previous page

### Validation Summary
Before submission, the system validates:
- Start/End times are valid
- Quantity produced is positive
- Required materials are selected (if BOM requires)
- Equipment is selected
- Operator is selected
- Process parameters are within min/max limits

---

## Screen 9: Batches List

**Route:** `/#/batches`

![Batches List](../e2e/output/screenshots/production-full-flow/11-batches-list.png)

Shows all batches with:
- **Batch Number**: Unique identifier
- **Material ID**: What material this batch contains
- **Quantity**: Amount in the batch
- **UoM**: Unit of measure (T = Tonnes)
- **State**: AVAILABLE, PRODUCED, CONSUMED, QUALITY_PENDING, BLOCKED
- **Created**: When the batch was created
- **Actions**: View, Approve/Reject (for PRODUCED batches), Edit, Delete

---

## Screen 10: Batch Detail - Genealogy (Traceability)

**Route:** `/#/batches/{batchId}`

![Batch Genealogy](../e2e/output/screenshots/production-full-flow/12-batch-genealogy.png)

Shows complete batch traceability:

### Batch Information
- **Batch Number**: B-RM-001
- **Material ID**: RM-SCRAP-A
- **Quantity**: 500 T
- **Status**: AVAILABLE
- **Split Batch** / **Merge Batches** buttons

### Visual Genealogy Tree
Shows parent-child relationships graphically:

```
        B-RM-001 (500T)
       /     |      \
      /      |       \
B-IM-001  B-IM-006  B-IM-003
 (165T)    (85T)     (90T)
```

Relationship types:
- **CONSUME**: Material was consumed to produce output
- **MERGE**: Multiple batches combined into one
- **SPLIT**: One batch divided into multiple

---

## Screen 11: Production History

**Route:** `/#/production/history`

![Production History](../e2e/output/screenshots/production-full-flow/13-production-history.png)

Shows all production confirmations:

### Summary Cards
- **35 TOTAL** confirmations
- **35 CONFIRMED** (completed successfully)
- **0 PENDING REVIEW** (awaiting quality approval)
- **0 REJECTED** (failed quality check)

### Confirmation List
| Column | Description |
|--------|-------------|
| ID | Confirmation ID |
| Operation | Operation name (Pickling, Scrap Charging, etc.) |
| Output Batch | Batch created by this confirmation |
| Produced Qty | Quantity produced |
| Scrap Qty | Quantity scrapped |
| Duration | How long the operation took |
| Status | CONFIRMED, PENDING_REVIEW, REJECTED |
| Created | When the confirmation was submitted |

### Filters
- **Status** dropdown - Filter by confirmation status
- **Search** - Search by operation, batch, or notes

---

## Complete User Journey

### 1. Start Production
```
Dashboard → Click "Ready" operations count
    OR
Orders → Select IN_PROGRESS order → View operations → Click "Start Production"
    OR
Manufacturing Menu → Production → Select order & operation
```

### 2. Fill Confirmation Form
```
1. Review Operation Details (auto-populated)
2. Enter Start Time
3. Enter End Time
4. Enter Produced Quantity
5. Enter Scrap Quantity (if any)
6. Select Input Materials (+ Select Materials button)
7. Select Equipment
8. Select Operator
9. Fill Process Parameters
10. Add Delay info (if applicable)
11. Review Output Batch number
12. Click "Confirm Production"
```

### 3. Result of Confirmation
```
✓ ProductionConfirmation record created
✓ Input batches → status: CONSUMED
✓ Output batch created → status: PRODUCED or QUALITY_PENDING
✓ BatchRelation records created (parent → child)
✓ Inventory updated (consumed quantities, new inventory)
✓ Operation status → CONFIRMED
✓ Next operation in sequence → READY
✓ Audit trail entry created
```

### 4. Verify Traceability
```
Batches → Click output batch → View Genealogy
    Shows: Input batches as parents, relationship type
```

### 5. View History
```
Production → View History
    Shows: All confirmations with quantities, duration, status
```

---

## Status Flow Diagrams

### Operation Status
```
NOT_STARTED → READY → IN_PROGRESS → CONFIRMED
                ↓           ↓
             ON_HOLD ←→ BLOCKED
```

### Batch Status
```
                    ┌→ AVAILABLE → CONSUMED
PRODUCED → QUALITY_PENDING
                    └→ BLOCKED → SCRAPPED
```

### Inventory State
```
AVAILABLE → CONSUMED (used in production)
          → RESERVED (allocated to order)
          → BLOCKED (quality issue)
          → SCRAPPED (unusable)
```

---

## Key Points

1. **Granular Confirmation**: Each operation is confirmed individually, not the entire order or line item
2. **Sequential Operations**: Operations must be confirmed in routing sequence order
3. **Material Traceability**: Every confirmation creates batch genealogy records
4. **Quality Gates**: Output batches can go to QUALITY_PENDING for inspection
5. **Holds Block Production**: Operations ON_HOLD cannot be confirmed
6. **BOM Integration**: Suggested consumption based on Bill of Materials
7. **Yield Tracking**: Visual indicator for production efficiency
8. **Audit Trail**: Every confirmation logged with full details

---

## Screenshots Reference

| Screen | File | Description |
|--------|------|-------------|
| Dashboard | `01-dashboard-operations-status.png` | Operations status overview |
| Orders List | `02-orders-list.png` | All orders with statuses |
| Order Detail | `03-order-detail.png` | Line items and process flow |
| Production Landing | `04-production-landing.png` | Order/operation selection |
| Confirm Form Top | `06-confirm-form-top.png` | Operation details, time, quantities |
| Material Consumption | `07-confirm-material-consumption.png` | BOM suggestions, material selection |
| Batches List | `11-batches-list.png` | All batches with states |
| Batch Genealogy | `12-batch-genealogy.png` | Visual traceability tree |
| Production History | `13-production-history.png` | Confirmation records |

---

## Related Documentation

- [Production Confirmation Architecture Validation](Production-Confirmation-Architecture-Validation.md)
- [MES Entity Reference](reference/MES-Entity-Reference.md)
- [MES API Reference](reference/MES-API-Reference.md)

---

*Generated: 2026-02-08*
