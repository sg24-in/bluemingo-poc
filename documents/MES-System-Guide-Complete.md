# MES Production Confirmation - Complete System Guide

**Version:** 1.0
**Date:** 2026-02-10
**Application:** MES Production Confirmation POC (Bluemingo)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Architecture & Technology Stack](#2-architecture--technology-stack)
3. [Getting Started](#3-getting-started)
4. [Phase 1: Master Data Setup](#4-phase-1-master-data-setup)
5. [Phase 2: Design Phase - Process & Routing](#5-phase-2-design-phase---process--routing)
6. [Phase 3: Configuration](#6-phase-3-configuration)
7. [Phase 4: Order Management](#7-phase-4-order-management)
8. [Phase 5: Material Receipt](#8-phase-5-material-receipt)
9. [Phase 6: Production Confirmation](#9-phase-6-production-confirmation)
10. [Phase 7: Batch Management & Traceability](#10-phase-7-batch-management--traceability)
11. [Phase 8: Inventory Management](#11-phase-8-inventory-management)
12. [Phase 9: Hold Management](#12-phase-9-hold-management)
13. [Phase 10: Quality Management](#13-phase-10-quality-management)
14. [Dashboard & Monitoring](#14-dashboard--monitoring)
15. [Audit Trail](#15-audit-trail)
16. [User Management](#16-user-management)
17. [Status Reference](#17-status-reference)
18. [Complete Workflow: End-to-End](#18-complete-workflow-end-to-end)
19. [API Reference Summary](#19-api-reference-summary)
20. [Known Gaps & Future Enhancements](#20-known-gaps--future-enhancements)

---

## 1. System Overview

### What is MES Production Confirmation?

The Manufacturing Execution System (MES) Production Confirmation application manages the complete production lifecycle in a manufacturing environment. It bridges the gap between planning (ERP) and the shop floor by tracking:

- **What** is being produced (orders, products, materials)
- **How** it is produced (processes, routings, operations)
- **With what** resources (equipment, operators, materials)
- **When** each step happens (production confirmations, audit trail)
- **Where** materials are (inventory, batches, locations)

### Key Concepts

| Concept | Description |
|---------|-------------|
| **Master Data** | Static reference data: Customers, Materials, Products, Equipment, Operators |
| **Design-Time** | Production recipes: Processes, Routings, Operation Templates, BOM |
| **Runtime** | Actual production: Orders, Operations, Production Confirmations |
| **Traceability** | Material tracking: Batches, Inventory, Genealogy |
| **Quality** | Quality controls: Holds, Batch Approval, Process Parameters |

### System Flow Overview

```
SETUP (once)                    DESIGN (per product)              EXECUTION (per order)
==================              ====================              ====================
1. Create Customers      -->    4. Define Processes        -->    8. Create Orders
2. Create Materials      -->    5. Create Routings         -->    9. Receive Raw Materials
3. Create Products       -->    6. Configure BOM           -->   10. Confirm Production
   Create Equipment              7. Set Batch/Param Config        11. Track Batches
   Create Operators                                               12. Manage Inventory
                                                                  13. Apply/Release Holds
```

---

## 2. Architecture & Technology Stack

### Backend
| Component | Technology |
|-----------|-----------|
| Framework | Spring Boot 3.2 |
| Language | Java 17 |
| Database | PostgreSQL 14+ |
| ORM | Spring Data JPA / Hibernate |
| Security | JWT Token Authentication (JJWT 0.12.3) |
| Build | Gradle 8.5 |

### Frontend
| Component | Technology |
|-----------|-----------|
| Framework | Angular 17 (Module-based) |
| Routing | Hash-based (`/#/path`) |
| HTTP | Angular HttpClient with RxJS |
| Styling | Custom CSS |

### Application Layout

The application uses two layout types:

1. **Main Layout** (Header + Content): Dashboard, Orders, Production, Inventory, Batches, Holds, Equipment, Operations
2. **Admin Layout** (Header + Sidebar + Content): Master Data, Configuration, Users, Audit

---

## 3. Getting Started

### Login

- **URL:** `http://localhost:4200/#/login`
- **Demo Credentials:** `admin@mes.com` / `admin123`

After successful login, a JWT token is stored in localStorage and the user is redirected to the Dashboard.

### Navigation

The application header provides access to all main areas:
- **Dashboard** - System overview and metrics
- **Orders** - Order management
- **Production** - Production confirmation and history
- **Inventory** - Inventory tracking
- **Batches** - Batch management and traceability
- **Holds** - Hold management
- **Equipment** - Equipment management
- **Admin** - Opens the admin sidebar with master data, configuration, and system management

---

## 4. Phase 1: Master Data Setup

Master data must be set up BEFORE creating processes or orders. This is the foundation of the system.

### 4.1 Customers

**Route:** `/#/manage/customers`
**Purpose:** Customer records linked to orders.

| Field | Required | Description |
|-------|----------|-------------|
| Customer Code | Yes | Unique identifier (e.g., CUST-001) |
| Customer Name | Yes | Full company name |
| Contact Person | No | Primary contact |
| Email | No | Contact email |
| Phone | No | Contact phone |
| Address | No | Street address |
| City | No | City |
| Country | No | Country |
| Tax ID | No | Tax identification number |

**Status Values:** `ACTIVE`, `INACTIVE`

**Operations:**
- Create: `/#/manage/customers/new`
- Edit: `/#/manage/customers/{id}/edit`
- Delete: Soft delete (sets status to INACTIVE)
- View Detail: `/#/manage/customers/{id}`

### 4.2 Materials

**Route:** `/#/manage/materials`
**Purpose:** Raw materials, intermediates, and finished goods used in production.

| Field | Required | Description |
|-------|----------|-------------|
| Material Code | Yes | Unique identifier (e.g., MAT-RM-001) |
| Material Name | Yes | Descriptive name |
| Material Type | Yes | RM (Raw Material), IM (Intermediate), FG (Finished Goods), WIP (Work in Progress) |
| Base Unit | Yes | Unit of measure (KG, T, PCS, etc.) |
| Description | No | Detailed description |
| Material Group | No | Classification group |
| SKU | No | Stock Keeping Unit |
| Standard Cost | No | Cost per unit |
| Min Stock Level | No | Minimum inventory threshold |
| Max Stock Level | No | Maximum inventory threshold |
| Reorder Point | No | When to reorder |
| Lead Time (Days) | No | Procurement lead time |
| Shelf Life (Days) | No | Expiry tracking |
| Storage Conditions | No | Special storage requirements |

**Material Type Flow:**
```
RM (Raw Material) --> IM (Intermediate) --> FG (Finished Goods)
                          ^
                          |
                      WIP (Work in Progress)
```

**Status Values:** `ACTIVE`, `INACTIVE`, `OBSOLETE`

**Key Rule:** Material type determines where it appears in production:
- **RM** and **IM** appear as *input materials* in production confirmation
- **IM** and **FG** are created as *output materials* from production
- **WIP** is for in-process tracking

### 4.3 Products

**Route:** `/#/manage/products`
**Purpose:** Products that can be ordered by customers and produced.

| Field | Required | Description |
|-------|----------|-------------|
| SKU | Yes | Unique Stock Keeping Unit |
| Product Name | Yes | Product display name |
| Product Category | No | Category classification |
| Product Group | No | Group classification |
| Base Unit | Yes | Unit of measure |
| Weight Per Unit | No | Weight per unit |
| Standard Price | No | Selling price per unit |
| Min Order Qty | No | Minimum order quantity |
| Lead Time (Days) | No | Manufacturing lead time |
| Material ID | No | Links to output material |
| Default Process ID | No | Default manufacturing process |

**Status Values:** `ACTIVE`, `INACTIVE`, `DISCONTINUED`

**Key Relationship:** A Product links to:
- A **Material** (what it's made of)
- A **Process** (how it's made)

### 4.4 Equipment

**Route:** `/#/equipment`
**Purpose:** Machines and equipment used in production operations.

| Field | Required | Description |
|-------|----------|-------------|
| Equipment Code | Yes | Unique identifier (e.g., EQ-FURN-001) |
| Name | Yes | Equipment display name |
| Equipment Type | No | BATCH or CONTINUOUS |
| Equipment Category | No | MELTING, CASTING, ROLLING, ANNEALING, etc. |
| Capacity | No | Maximum capacity |
| Capacity Unit | No | Unit for capacity |
| Location | No | Physical location |

**Status Values:** `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `ON_HOLD`, `UNAVAILABLE`

**Status Transitions:**
```
AVAILABLE --> IN_USE (during production)
AVAILABLE --> MAINTENANCE (start maintenance)
AVAILABLE --> ON_HOLD (hold applied)
MAINTENANCE --> AVAILABLE (end maintenance)
ON_HOLD --> AVAILABLE (hold released)
IN_USE --> AVAILABLE (production complete)
```

**Equipment Categories:**
MELTING, REFINING, CASTING, HOT_ROLLING, COLD_ROLLING, ANNEALING, PICKLING, BAR_ROLLING, COATING, WIRE_ROLLING, FINISHING, INSPECTION, PACKAGING, HEAT_TREATMENT, GENERAL

### 4.5 Operators

**Route:** `/#/manage/operators`
**Purpose:** Production personnel who operate equipment and confirm production.

| Field | Required | Description |
|-------|----------|-------------|
| Operator Code | Yes | Unique identifier (e.g., OP-001) |
| Name | Yes | Operator full name |
| Department | No | Department assignment |
| Shift | No | Shift assignment |

**Status Values:** `ACTIVE` (default)

---

## 5. Phase 2: Design Phase - Process & Routing

The design phase defines HOW products are manufactured. This is done once per product type and can be reused across multiple orders.

### 5.1 Processes

**Route:** `/#/manage/processes`
**Purpose:** A Process represents a production recipe (e.g., "Steel Billet Production", "Copper Wire Manufacturing").

| Field | Required | Description |
|-------|----------|-------------|
| Process Name | Yes | Descriptive name |
| Status | Auto | DRAFT, ACTIVE, INACTIVE |

**Process Status Flow:**
```
DRAFT --> ACTIVE --> INACTIVE
```

**Key Rule:** A Process is a **design-time entity only**. It defines WHAT needs to be done but doesn't directly track production. Operations (runtime copies) are created from the process routing when an order is placed.

### 5.2 Routings

**Route:** `/#/manage/routing`
**Purpose:** A Routing defines the sequence of operations within a Process. Each Process can have multiple Routings (e.g., standard vs. express).

| Field | Required | Description |
|-------|----------|-------------|
| Routing Name | Yes | Descriptive name |
| Process | Yes | Parent process |
| Routing Type | Yes | SEQUENTIAL or PARALLEL |
| Status | Auto | DRAFT, ACTIVE, INACTIVE, ON_HOLD |

**Routing Types:**
- **SEQUENTIAL**: Operations execute one after another. The next operation becomes READY only after the previous is CONFIRMED.
- **PARALLEL**: All operations are set to READY simultaneously. They can be confirmed in any order.

**Routing Status Flow:**
```
DRAFT --> ACTIVE --> INACTIVE
           |
       ON_HOLD <--> ACTIVE
```

**Key Rules:**
- Only ONE routing per process can be ACTIVE at a time
- Activating a routing automatically deactivates the previous active one
- A routing becomes **LOCKED** once any of its operations are IN_PROGRESS or CONFIRMED (no structural changes allowed)

### 5.3 Routing Steps

**Managed within:** `/#/manage/routing/{id}` (Routing Detail page)
**Purpose:** Individual steps within a routing, each defining one operation to perform.

| Field | Required | Description |
|-------|----------|-------------|
| Sequence Number | Yes | Execution order (1, 2, 3...) |
| Operation Template | No | Template to copy settings from |
| Operation Name | Yes | Name of this step |
| Operation Type | No | e.g., MELTING, CASTING, ROLLING |
| Operation Code | No | Short code identifier |
| Target Quantity | No | Expected output quantity |
| Estimated Duration | No | Minutes to complete |
| Is Parallel | No | Can run in parallel with adjacent steps |
| Mandatory | No | Must be completed (default: true) |
| Produces Output Batch | No | Whether this step creates an output batch |
| Allows Split | No | Whether batches can be split at this step |
| Allows Merge | No | Whether batches can be merged at this step |

**Key Rules:**
- Steps can be reordered by drag-and-drop or via the Reorder API
- Steps reference **Operation Templates** for default values but can override them
- Steps marked `producesOutputBatch = true` will generate output batches during production confirmation

### 5.4 Operation Templates

**Route:** `/#/manage/operation-templates`
**Purpose:** Reusable templates for common operation types. Templates provide default values that are copied into Routing Steps and runtime Operations.

| Field | Required | Description |
|-------|----------|-------------|
| Template Name | Yes | Descriptive name |
| Operation Type | Yes | e.g., MELTING, CASTING, ROLLING |
| Operation Code | No | Short code |
| Default Duration | No | Estimated duration in minutes |
| Description | No | Detailed instructions |

### 5.5 Bill of Materials (BOM)

**Route:** `/#/manage/bom`
**Purpose:** Defines what materials are needed to produce a product, organized as a hierarchical tree.

**BOM Structure:**
```
Product SKU (Root)
  |
  +-- Material A (RM) - Qty: 100 KG, Yield Loss: 5%
  |     |
  |     +-- Sub-Material A1 (RM) - Qty: 50 KG
  |     +-- Sub-Material A2 (RM) - Qty: 50 KG
  |
  +-- Material B (IM) - Qty: 200 KG, Yield Loss: 3%
```

| Field | Required | Description |
|-------|----------|-------------|
| Product SKU | Yes | Root product |
| Material | Yes | Material required |
| Quantity | Yes | Amount needed |
| Unit | Yes | Unit of measure |
| Yield Loss Ratio | No | Expected loss (0.00-1.00) |
| BOM Version | No | Version number |
| Parent BOM ID | No | For nested BOMs |

**Key Features:**
- **Tree View**: Hierarchical display of materials needed
- **Version Control**: Multiple BOM versions per product
- **Suggested Consumption**: During production, BOM is used to suggest material quantities
- **Yield Loss**: Accounts for material loss during production

### Design Phase Summary

The design phase creates a complete **production recipe**:

```
Process: "Steel Billet Production"
  |
  +-- Routing: "Standard Route" (SEQUENTIAL)
  |     |
  |     +-- Step 1: Melting (Seq: 1, Output: Yes, Duration: 120min)
  |     +-- Step 2: Refining (Seq: 2, Output: No, Duration: 60min)
  |     +-- Step 3: Casting (Seq: 3, Output: Yes, Duration: 90min)
  |
  +-- BOM: "BLT-001"
        |
        +-- Steel Scrap (RM) - 1200 KG, Loss: 5%
        +-- Ferro-alloy (RM) - 50 KG, Loss: 2%
        +-- Limestone Flux (RM) - 30 KG, Loss: 10%
```

---

## 6. Phase 3: Configuration

Configuration entities customize system behavior. Set these up after master data and before production.

### 6.1 Batch Number Configuration

**Route:** `/#/manage/config/batch-number`
**Purpose:** Defines how batch numbers are automatically generated.

| Field | Description |
|-------|-------------|
| Prefix | String prefix (e.g., "BLT", "FRN") |
| Date Format | Date component (e.g., "yyyyMMdd", "yyMM") |
| Separator | Character between parts (e.g., "-", "/") |
| Sequence Length | Digits in sequence (e.g., 4 = 0001) |
| Reset Frequency | When sequence resets: DAILY, MONTHLY, YEARLY, NEVER |
| Operation Type | Optional: apply only to specific operation types |
| Product SKU | Optional: apply only to specific products |
| Priority | Higher priority configs override lower ones |

**Example Generated Numbers:**
| Config | Example |
|--------|---------|
| Prefix: BLT, Date: yyyyMMdd, Sep: -, Seq: 4 | BLT-20260210-0001 |
| Prefix: FRN, Date: yyMM, Sep: /, Seq: 3 | FRN/2602/001 |

### 6.2 Batch Size Configuration

**Route:** `/#/manage/config/batch-size`
**Purpose:** Defines maximum batch sizes for automatic multi-batch splitting during production.

| Field | Description |
|-------|-------------|
| Max Batch Size | Maximum quantity per batch (required) |
| Min Batch Size | Minimum quantity per batch |
| Preferred Batch Size | Target quantity per batch |
| Unit | Unit of measure |
| Operation Type | Apply to specific operation type |
| Material ID | Apply to specific material |
| Product SKU | Apply to specific product |
| Equipment Type | Apply to specific equipment type |
| Allow Partial Batch | Whether partial batches are allowed |
| Priority | Config priority (higher = more specific) |

**How it works:** When production output exceeds `maxBatchSize`, the system automatically creates multiple batches. The `preferredBatchSize` is used for full batches, and any remainder becomes a partial batch (if allowed).

### 6.3 Process Parameters Configuration

**Route:** `/#/manage/config/process-params`
**Purpose:** Defines required parameters with min/max validation for production confirmation.

| Field | Description |
|-------|-------------|
| Parameter Name | e.g., "Temperature", "Pressure", "Speed" |
| Parameter Code | Short code |
| Data Type | NUMBER, TEXT, BOOLEAN |
| Unit | Unit of measure |
| Min Value | Minimum acceptable value |
| Max Value | Maximum acceptable value |
| Required | Whether parameter is mandatory |
| Applicable To | Which entity types this parameter applies to |

**Validation Behavior:**
- Values outside min/max are **rejected**
- Values within 10% of limits trigger a **warning**
- Required parameters must have a value to confirm production

### 6.4 Hold Reasons

**Route:** `/#/manage/config/hold-reasons`
**Purpose:** Predefined reasons for placing entities on hold.

| Field | Description |
|-------|-------------|
| Reason Code | Unique code |
| Description | Human-readable reason |
| Applicable To | Entity types (ORDER, OPERATION, BATCH, INVENTORY, EQUIPMENT) |

### 6.5 Delay Reasons

**Route:** `/#/manage/config/delay-reasons`
**Purpose:** Predefined reasons for production delays.

| Field | Description |
|-------|-------------|
| Reason Code | Unique code |
| Description | Human-readable reason |

### 6.6 Quantity Type Configuration

**Route:** `/#/manage/config/quantity-type`
**Purpose:** Defines available units of measure.

| Field | Description |
|-------|-------------|
| Type Code | Unit code (e.g., KG, T, PCS) |
| Description | Full description |

---

## 7. Phase 4: Order Management

Orders are the trigger for production. Each order contains line items (products to produce), and each line item gets operations instantiated from the product's process routing.

### 7.1 Creating an Order

**Route:** `/#/orders/new`

| Field | Required | Description |
|-------|----------|-------------|
| Order Number | Auto | Automatically generated |
| Customer | Yes | Select from customer list |
| Order Date | Yes | Date of order |

**Line Items (one or more):**

| Field | Required | Description |
|-------|----------|-------------|
| Product | Yes | Select from product list |
| Quantity | Yes | Amount to produce |
| Unit | Yes | Unit of measure |
| Delivery Date | No | Expected delivery |
| Process | Auto | Defaults to product's default process |

### 7.2 Order Status Flow

```
CREATED --> READY --> IN_PROGRESS --> COMPLETED
              |                          |
          ON_HOLD                    CANCELLED
```

**What happens when an order is created:**

1. Order record is created with status `CREATED`
2. For each line item:
   a. The product's default process and its ACTIVE routing are found
   b. The `OperationInstantiationService` creates runtime **Operations** from the routing steps
   c. For SEQUENTIAL routing: first operation = `READY`, rest = `NOT_STARTED`
   d. For PARALLEL routing: all operations = `READY`
   e. Line item status becomes `READY`

### 7.3 Order Detail View

**Route:** `/#/orders/{id}`

The order detail page shows:
- **Header**: Order number, customer, date, status
- **Line Items Table**: Products, quantities, status
- **Operations Timeline**: Visual flow chart showing operation sequence and status for each line item
- **Actions**: Edit, Delete (if CREATED), Apply Hold

### 7.4 Operation Instantiation (Automatic)

When an order line item is created, the system automatically:

```
1. Find Process for product
2. Find ACTIVE Routing for process
3. For each RoutingStep (ordered by sequenceNumber):
   a. Create Operation with:
      - operationName from RoutingStep (or OperationTemplate)
      - operationType from RoutingStep
      - sequenceNumber from RoutingStep
      - targetQty from RoutingStep or OrderLineItem.quantity
      - status = READY (if first) or NOT_STARTED (if sequential)
      - routingStepId = RoutingStep.routingStepId
      - operationTemplateId = RoutingStep.operationTemplate.id
```

---

## 8. Phase 5: Material Receipt

Before production can begin, raw materials must be received into inventory.

### 8.1 Receive Material

**Route:** `/#/inventory/receive`

| Field | Required | Description |
|-------|----------|-------------|
| Material | Yes | Select material (typically RM type) |
| Quantity | Yes | Amount received |
| Unit | Yes | Unit of measure |
| Supplier Batch Number | No | Supplier's batch reference |
| Location | No | Storage location |
| Notes | No | Receipt notes |

**What happens when material is received:**

1. A new **Batch** is created with:
   - Auto-generated batch number (from BatchNumberService)
   - Status: `QUALITY_PENDING`
   - Created Via: `RECEIPT`
2. A new **Inventory** record is created with:
   - State: `AVAILABLE`
   - Type: based on material type
   - Linked to the new batch
3. An **Inventory Movement** is recorded
4. **Audit trail** entries are created

### 8.2 Batch Approval (Required Before Use)

New batches start in `QUALITY_PENDING` status. They must be approved before being used in production:

1. Navigate to `/#/batches` and find the batch
2. Open the batch detail page
3. Click **Approve** to set status to `AVAILABLE`
4. Or click **Reject** to set status to `BLOCKED` (requires reason)

---

## 9. Phase 6: Production Confirmation

Production confirmation is the core workflow. It records what was produced, what materials were consumed, and what output was generated.

### 9.1 Starting Production Confirmation

**Route:** `/#/production/confirm`

**Step 1: Select an Operation**

The page shows orders with READY operations. Select an order, then select the specific operation to confirm.

**Requirements:**
- Operation must be in `READY` or `IN_PROGRESS` status
- Operation cannot be on hold
- Parent process must be ACTIVE and not on hold

### 9.2 Production Confirmation Form

**Step 2: Fill in production details**

| Section | Fields | Description |
|---------|--------|-------------|
| **Operation Info** | Auto-populated | Operation name, order, target quantity |
| **Equipment** | Select equipment | Must be AVAILABLE status |
| **Operator** | Select operator | Must be ACTIVE status |
| **Output Quantity** | Enter produced amount | Must be > 0, compared to target |
| **Process Parameters** | Dynamic based on config | Temperature, pressure, etc. with min/max validation |
| **Input Materials** | Select from available inventory | Materials to consume |
| **BOM Suggestions** | Auto-calculated from BOM | Suggested quantities based on BOM requirements |

### 9.3 BOM Suggested Consumption

When an operation is selected, the system checks for BOM requirements:

1. Finds the BOM for the product being produced
2. Calculates required quantities based on:
   - Target quantity for the operation
   - Yield loss ratios from BOM
3. Shows available batches for each required material
4. Indicates sufficiency: "Sufficient Stock" or "Insufficient Stock"
5. **"Apply Suggestions"** button auto-fills material selections

### 9.4 Material Selection

For each input material:
- Select from **AVAILABLE** inventory items
- Specify consumption quantity (cannot exceed available quantity)
- Materials must not be on hold or blocked

### 9.5 What Happens on Confirmation

When the user clicks **Confirm**:

```
1. VALIDATE
   - Check operation status (READY or IN_PROGRESS)
   - Check no active holds on operation, process, materials
   - Validate process parameters against min/max
   - Validate material quantities against availability

2. CONSUME INPUT MATERIALS
   - For each selected material:
     a. Reduce inventory quantity
     b. Set inventory state to CONSUMED (if fully consumed)
     c. Set batch status to CONSUMED (if fully consumed)
     d. Create BatchRelation (parent → child)
     e. Record inventory movement
     f. Log audit trail

3. GENERATE OUTPUT
   - Create output Batch with auto-generated number
     (status: QUALITY_PENDING)
   - Create output Inventory record
     (state: PRODUCED)
   - Record inventory movement
   - Log batch number generation in audit

4. UPDATE OPERATION STATUS
   - If outputQty >= targetQty:
     a. Set operation to CONFIRMED
     b. Set NEXT operation to READY (for sequential routing)
   - If outputQty < targetQty:
     a. Set operation to IN_PROGRESS (partial confirmation)
     b. Track confirmedQty for continuation

5. RECORD CONFIRMATION
   - Create ProductionConfirmation record
   - Store equipment usage
   - Store operator assignment
   - Store process parameter values
   - Log comprehensive audit trail

6. UPDATE EQUIPMENT
   - Set equipment status to IN_USE during production
   - Track equipment usage history
```

### 9.6 Partial Confirmation

If the output quantity is less than the target quantity:
- Operation status becomes `IN_PROGRESS` (not CONFIRMED)
- The next operation does NOT become READY yet
- The operation can be selected again for continuation
- Previous confirmations' quantities are accumulated

### 9.7 Production History

**Route:** `/#/production/history`

Lists all production confirmations with:
- Operation name and order reference
- Input materials consumed
- Output batch produced
- Equipment and operator used
- Timestamp
- Filters by status, date range, and search

---

## 10. Phase 7: Batch Management & Traceability

### 10.1 Batch Lifecycle

```
QUALITY_PENDING --> AVAILABLE (approve) --> CONSUMED (used in production)
                      |                         |
                  --> BLOCKED (reject/hold)      +--> PRODUCED (output of production)
                      |                                  |
                  --> SCRAPPED (quality fail)         --> AVAILABLE (approve output)
                      |
                  --> ON_HOLD (hold applied)
```

### 10.2 Batch Creation Sources

| Source | When |
|--------|------|
| RECEIPT | Raw material received via `/#/inventory/receive` |
| PRODUCTION | Output of a production confirmation |
| SPLIT | Created by splitting a parent batch |
| MERGE | Created by merging multiple batches |
| MANUAL | Created manually (deprecated) |

### 10.3 Batch Split

Split a batch into multiple smaller batches while maintaining genealogy:

```
Parent Batch: BLT-20260210-0001 (1000 KG)
  |
  +-- Child 1: BLT-20260210-0001-S1 (400 KG)
  +-- Child 2: BLT-20260210-0001-S2 (600 KG)
```

**Rules:**
- Source batch must be: AVAILABLE, RESERVED, BLOCKED, PRODUCED, or QUALITY_PENDING
- Split portions must be positive and sum <= source quantity
- Routing step must allow split (`allowsSplit = true`)
- Split batches inherit material properties from parent

### 10.4 Batch Merge

Merge multiple batches into one:

```
Parent 1: BLT-20260210-0001 (400 KG) --|
                                         +--> Merged: BLT-20260210-M001 (1000 KG)
Parent 2: BLT-20260210-0002 (600 KG) --|
```

**Rules:**
- Minimum 2 source batches required
- All batches must be AVAILABLE
- All batches must have the same material
- All batches must have the same unit
- Routing step must allow merge (`allowsMerge = true`)

### 10.5 Batch Genealogy

**Route:** `/#/batches/{id}` (Genealogy section)

Genealogy shows the complete traceability chain:
- **Forward Tracing**: From raw materials to finished goods
- **Backward Tracing**: From finished goods back to source materials

Each genealogy record includes:
- Relation type: PRODUCTION, SPLIT, MERGE
- Quantity consumed
- Timestamp
- Operation that created the relation

### 10.6 Quantity Adjustments

Batch quantities can only be adjusted via the Quantity Adjustment mechanism (not direct edit):

| Adjustment Type | When |
|----------------|------|
| CORRECTION | Fix data entry errors |
| INVENTORY_COUNT | Physical inventory reconciliation |
| DAMAGE | Material damaged |
| SCRAP_RECOVERY | Recovered material from scrap |
| SYSTEM | System-initiated adjustments |

Each adjustment creates an audit record with mandatory reason.

---

## 11. Phase 8: Inventory Management

### 11.1 Inventory States

```
AVAILABLE --> RESERVED (reserved for order)
AVAILABLE --> CONSUMED (used in production)
AVAILABLE --> BLOCKED (quality issue)
AVAILABLE --> ON_HOLD (hold applied)
AVAILABLE --> SCRAPPED (quality fail)

RESERVED --> AVAILABLE (reservation released)
RESERVED --> CONSUMED (used in production)

BLOCKED --> AVAILABLE (unblocked)
BLOCKED --> SCRAPPED (quality fail)

PRODUCED --> AVAILABLE (after batch approval)
```

### 11.2 Inventory Types

| Type | Description |
|------|-------------|
| RM | Raw Material - received from suppliers |
| IM | Intermediate - produced during manufacturing |
| FG | Finished Goods - final product ready for shipping |
| WIP | Work in Progress - currently being processed |

### 11.3 Inventory Actions

| Action | From State | To State | Route |
|--------|-----------|----------|-------|
| Block | AVAILABLE | BLOCKED | `POST /api/inventory/{id}/block` |
| Unblock | BLOCKED | AVAILABLE | `POST /api/inventory/{id}/unblock` |
| Scrap | AVAILABLE | SCRAPPED | `POST /api/inventory/{id}/scrap` |
| Reserve | AVAILABLE | RESERVED | Internal (during production) |
| Release | RESERVED | AVAILABLE | Internal |

---

## 12. Phase 9: Hold Management

Holds temporarily block entities from being used in production.

### 12.1 Entity Types That Can Be Held

| Entity Type | Effect When On Hold |
|-------------|-------------------|
| ORDER | Cannot progress line items or operations |
| OPERATION | Cannot be selected for production confirmation |
| BATCH | Cannot be consumed or split/merged |
| INVENTORY | Cannot be used in production |
| EQUIPMENT | Cannot be selected for production |

### 12.2 Applying a Hold

**Route:** `/#/holds/new` or via the Apply Hold Modal on any entity page

| Field | Required | Description |
|-------|----------|-------------|
| Entity Type | Yes | ORDER, OPERATION, BATCH, INVENTORY, EQUIPMENT |
| Entity ID | Yes | The specific entity to hold |
| Reason | Yes | Select from configured hold reasons |
| Comments | No | Additional context |

### 12.3 Releasing a Hold

1. Navigate to `/#/holds`
2. Find the active hold
3. Click **Release**
4. Enter release reason/comments
5. Entity returns to its previous status (READY for operations, AVAILABLE for inventory/batches)

### 12.4 Hold Impact on Production

When an entity is on hold, the production confirmation form will:
- Not show held operations in the available operations list
- Not show held inventory in the material selection
- Not allow selection of held equipment
- Display a warning if the batch or order has active holds

---

## 13. Phase 10: Quality Management

### 13.1 Quality Pending Queue

**Route:** `/#/processes/quality-pending`

Shows all operations and batches awaiting quality inspection or approval.

### 13.2 Batch Quality Approval

1. Raw materials arrive as `QUALITY_PENDING` batches
2. Production output creates `QUALITY_PENDING` batches
3. Quality inspector reviews the batch
4. **Approve**: Status changes to `AVAILABLE` (can be used in production)
5. **Reject**: Status changes to `BLOCKED` with rejection reason

### 13.3 Process Parameter Validation

During production confirmation, process parameters are validated in real-time:
- **Green**: Value within acceptable range
- **Yellow/Warning**: Value within 10% of min/max limits
- **Red/Error**: Value outside acceptable range (blocks confirmation)
- **Required**: Must have a value to proceed

---

## 14. Dashboard & Monitoring

**Route:** `/#/dashboard`

The dashboard provides a real-time overview of the system:

### 14.1 Key Metrics
- Total Orders
- Active Operations
- Available Inventory
- Active Holds
- Recent Production Confirmations
- Today's Audit Activity

### 14.2 Dashboard Cards
- **Inventory Summary**: Breakdown by state (Available, Blocked, Reserved)
- **Orders Ready for Production**: Orders with READY operations
- **Recent Audit Trail**: Latest system activity
- **Equipment Status**: Equipment availability breakdown

---

## 15. Audit Trail

**Route:** `/#/manage/audit`

The audit trail records every significant action in the system.

### 15.1 What Gets Audited

| Event Type | Examples |
|-----------|---------|
| CREATE | New order, new batch, new customer |
| UPDATE | Status changes, quantity updates |
| DELETE | Soft deletes (status to INACTIVE/SCRAPPED) |
| STATUS_CHANGE | Operation status transitions, equipment status |
| FIELD_CHANGE | Individual field modifications with old/new values |
| BATCH_NUMBER | Batch number generation events |
| EQUIPMENT_USAGE | Equipment assignment to production |
| INVENTORY_MOVEMENT | Material receipts, consumption, transfers |

### 15.2 Audit Entry Fields

| Field | Description |
|-------|-------------|
| Action | CREATE, UPDATE, DELETE, STATUS_CHANGE, etc. |
| Entity Type | ORDER, BATCH, INVENTORY, OPERATION, etc. |
| Entity ID | ID of the affected entity |
| Field Name | Specific field that changed |
| Old Value | Previous value |
| New Value | New value |
| Username | User who performed the action |
| Timestamp | When it happened |

### 15.3 Filtering Audit Data

- Filter by Entity Type
- Filter by Action Type
- Filter by User
- Search across all fields
- Date range filtering

---

## 16. User Management

### 16.1 User Accounts

**Route:** `/#/manage/users`

| Field | Required | Description |
|-------|----------|-------------|
| Name | Yes | Full name |
| Email | Yes | Login email (unique) |
| Password | Yes | Login password |
| Role | Yes | ADMIN, OPERATOR, VIEWER |

### 16.2 User Roles

| Role | Permissions |
|------|------------|
| ADMIN | Full access to all features including user management |
| OPERATOR | Can confirm production, manage inventory, view orders |
| VIEWER | Read-only access to all pages |

### 16.3 Profile & Password

- **Profile:** `/#/profile` - View and edit own profile
- **Change Password:** `/#/change-password` - Update password

---

## 17. Status Reference

### 17.1 All Status Values by Entity

| Entity | Statuses |
|--------|----------|
| Customer | ACTIVE, INACTIVE |
| Material | ACTIVE, INACTIVE, OBSOLETE |
| Product | ACTIVE, INACTIVE, DISCONTINUED |
| Process | DRAFT, ACTIVE, INACTIVE |
| Routing | DRAFT, ACTIVE, INACTIVE, ON_HOLD |
| Routing Step | ACTIVE, INACTIVE |
| Order | CREATED, READY, IN_PROGRESS, COMPLETED, CANCELLED, ON_HOLD |
| Order Line Item | CREATED, READY, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD |
| Operation | NOT_STARTED, READY, IN_PROGRESS, CONFIRMED, PARTIALLY_CONFIRMED, ON_HOLD, BLOCKED |
| Batch | QUALITY_PENDING, AVAILABLE, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD |
| Inventory | AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD |
| Equipment | AVAILABLE, IN_USE, MAINTENANCE, ON_HOLD, UNAVAILABLE |
| Operator | ACTIVE |
| Hold Record | ACTIVE, RELEASED |

### 17.2 Status Color Coding (UI)

| Color | Meaning | Status Examples |
|-------|---------|----------------|
| Green | Active/Available/Ready | ACTIVE, AVAILABLE, READY, CONFIRMED |
| Blue | In Progress/Info | IN_PROGRESS, RESERVED, CREATED |
| Yellow | Warning/Pending | QUALITY_PENDING, ON_HOLD, MAINTENANCE |
| Red | Blocked/Error | BLOCKED, SCRAPPED, INACTIVE |
| Grey | Not Started/Inactive | NOT_STARTED, CANCELLED, UNAVAILABLE |

---

## 18. Complete Workflow: End-to-End

This section walks through a complete production cycle from setup to confirmation.

### Scenario: Producing Steel Billets from Scrap Metal

#### Step 1: Master Data Setup

```
1. Create Customer: "ABC Steel Corp" (CUST-ABC)
2. Create Materials:
   - Steel Scrap (MAT-RM-001, Type: RM, Unit: T)
   - Ferro-alloy (MAT-RM-002, Type: RM, Unit: KG)
   - Liquid Steel (MAT-IM-001, Type: IM, Unit: T)
   - Steel Billet (MAT-FG-001, Type: FG, Unit: T)
3. Create Product: "Standard Billet" (SKU: BLT-STD-001)
4. Create Equipment:
   - Electric Arc Furnace (EQ-FURN-001, Category: MELTING)
   - Continuous Caster (EQ-CAST-001, Category: CASTING)
5. Create Operators:
   - John Smith (OP-001, Dept: Melting)
   - Jane Doe (OP-002, Dept: Casting)
```

#### Step 2: Design Phase

```
6. Create Process: "Billet Production" (Status: ACTIVE)
7. Create Routing: "Standard Billet Route" (Type: SEQUENTIAL)
   - Step 1: Melting (Seq: 1, Output: Yes, Duration: 120min)
   - Step 2: Casting (Seq: 2, Output: Yes, Duration: 90min)
8. Create BOM for BLT-STD-001:
   - Steel Scrap: 1200 KG per T, Yield Loss: 5%
   - Ferro-alloy: 50 KG per T, Yield Loss: 2%
9. Configure Batch Numbers:
   - Prefix: BLT, Date: yyyyMMdd, Sequence: 4
10. Configure Process Parameters:
    - Temperature: Min 1500, Max 1700 (Celsius)
    - Pressure: Min 1.0, Max 5.0 (Bar)
```

#### Step 3: Order & Receipt

```
11. Create Order for "ABC Steel Corp":
    - Line Item: BLT-STD-001 x 10 T
    --> System auto-creates:
        - Operation 1: Melting (READY)
        - Operation 2: Casting (NOT_STARTED)

12. Receive Raw Materials:
    - Steel Scrap: 15 T --> Batch: RM-20260210-0001 (QUALITY_PENDING)
    - Ferro-alloy: 100 KG --> Batch: RM-20260210-0002 (QUALITY_PENDING)

13. Approve Batches:
    - RM-20260210-0001 --> AVAILABLE
    - RM-20260210-0002 --> AVAILABLE
```

#### Step 4: Production Confirmation

```
14. Confirm Operation 1 (Melting):
    - Equipment: EQ-FURN-001
    - Operator: OP-001
    - Input: Steel Scrap (12 T), Ferro-alloy (50 KG)
    - Parameters: Temperature = 1650C, Pressure = 3.2 Bar
    - Output: 10.5 T Liquid Steel
    --> Creates: BLT-20260210-0001 (QUALITY_PENDING)
    --> Operation 1: CONFIRMED
    --> Operation 2: READY

15. Approve Output Batch:
    - BLT-20260210-0001 --> AVAILABLE

16. Confirm Operation 2 (Casting):
    - Equipment: EQ-CAST-001
    - Operator: OP-002
    - Input: Liquid Steel (10.5 T, from BLT-20260210-0001)
    - Parameters: Casting Speed = 1.2 m/min
    - Output: 10 T Steel Billets
    --> Creates: BLT-20260210-0002 (QUALITY_PENDING)
    --> Operation 2: CONFIRMED
    --> All operations CONFIRMED
```

#### Step 5: Traceability

```
17. Genealogy for BLT-20260210-0002 (Final Product):
    BLT-20260210-0002 (Steel Billets, 10 T)
      <-- BLT-20260210-0001 (Liquid Steel, 10.5 T)
            <-- RM-20260210-0001 (Steel Scrap, 12 T)
            <-- RM-20260210-0002 (Ferro-alloy, 50 KG)
```

---

## 19. API Reference Summary

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with email/password, returns JWT |

### Orders
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/paged` | Paginated orders with filters |
| GET | `/api/orders/available` | Orders with READY operations |
| GET | `/api/orders/{id}` | Order detail with line items |
| POST | `/api/orders` | Create order with line items |
| PUT | `/api/orders/{id}` | Update order |
| DELETE | `/api/orders/{id}` | Cancel order (soft delete) |

### Production
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/production/confirm` | Submit production confirmation |
| GET | `/api/production/confirmations` | List confirmations |

### Inventory
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/inventory` | List all inventory |
| GET | `/api/inventory/paged` | Paginated with filters |
| POST | `/api/inventory/{id}/block` | Block inventory |
| POST | `/api/inventory/{id}/unblock` | Unblock inventory |
| POST | `/api/inventory/{id}/scrap` | Scrap inventory |

### Batches
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/batches` | List all batches |
| GET | `/api/batches/paged` | Paginated with filters |
| GET | `/api/batches/{id}/genealogy` | Batch traceability |
| POST | `/api/batches/{id}/split` | Split batch |
| POST | `/api/batches/merge` | Merge batches |

### Holds
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/holds/active` | Active holds |
| GET | `/api/holds/paged` | Paginated holds |
| POST | `/api/holds` | Apply hold |
| PUT | `/api/holds/{id}/release` | Release hold |

### Master Data (Customers, Materials, Products)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/{entity}` | List all |
| GET | `/api/{entity}/paged` | Paginated with filters |
| GET | `/api/{entity}/{id}` | Get by ID |
| POST | `/api/{entity}` | Create |
| PUT | `/api/{entity}/{id}` | Update |
| DELETE | `/api/{entity}/{id}` | Soft delete |

### Routing
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/routing` | List routings |
| GET | `/api/routing/{id}` | Routing with steps |
| POST | `/api/routing` | Create routing |
| POST | `/api/routing/{id}/steps` | Add step |
| POST | `/api/routing/{id}/activate` | Activate routing |
| POST | `/api/routing/{id}/reorder` | Reorder steps |

### BOM
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bom/{sku}/tree` | BOM tree |
| POST | `/api/bom/tree` | Create BOM tree |
| GET | `/api/bom/operation/{id}/suggested-consumption` | Suggested consumption |

### Audit
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit/recent` | Recent activity |
| GET | `/api/audit/entity/{type}/{id}` | Entity audit history |
| GET | `/api/audit/summary` | Today's summary |

---

## 20. Known Gaps & Future Enhancements

For a complete gap analysis, see `documents/MES-System-Gap-Analysis-Complete.md`.

### Key Gaps Summary

| # | Gap | Severity | Description |
|---|-----|----------|-------------|
| 1 | No material reservation | HIGH | Materials can be double-allocated |
| 2 | BOM not enforced on confirm | HIGH | Production can proceed without correct materials |
| 3 | No hold cascade | MEDIUM | Holding an order doesn't hold its operations |
| 4 | No auto order completion | MEDIUM | Orders don't auto-complete when all operations done |
| 5 | Batch size not integrated | MEDIUM | Batch size config exists but not used in production |
| 6 | No batch split/merge UI | MEDIUM | Only API endpoints, no dedicated frontend forms |
| 7 | Reports module paused | MEDIUM | Routes exist but components are stubs |
| 8 | 12 pages need pagination update | LOW | Custom HTML instead of reusable component |

### Future Enhancements

- Material reservation before production
- Order scheduling and priority
- Equipment maintenance scheduling
- Supplier management
- Batch expiry tracking
- Process versioning
- Mobile responsive design
- Reports with charts and data visualization
- Export to CSV/PDF
- Email notifications

---

*Document generated: 2026-02-10*
*For screenshots, run: `node e2e/capture-system-guide-screenshots.js`*
*For gap details, see: `documents/MES-System-Gap-Analysis-Complete.md`*
