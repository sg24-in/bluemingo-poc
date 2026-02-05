# MES Functional Requirements Document (FRD)

**Document Version:** 1.1
**Last Updated:** 2026-02-05
**Project:** Bluemingo MES POC

---

## 1. Introduction

### 1.1 Purpose
This document defines the functional requirements for the Manufacturing Execution System (MES) Production Confirmation POC. It serves as the basis for development, testing, and validation activities.

### 1.2 Scope
The requirements cover production confirmation workflows for a steel manufacturing environment, including material tracking, batch genealogy, quality holds, and equipment/operator assignment.

### 1.3 Definitions

| Term | Definition |
|------|------------|
| Batch | A uniquely identified quantity of material |
| Genealogy | Parent-child relationships between batches |
| Hold | A restriction placed on an entity preventing its use |
| Operation | A single step within a production process |
| Process | A series of operations to transform materials |
| Confirmation | Recording of completed production activity |

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization

#### FR-AUTH-001: User Login
**Priority:** HIGH
**Description:** System shall allow users to authenticate using email and password.
**Acceptance Criteria:**
- User enters valid email and password
- System validates credentials against stored values
- System issues JWT token on successful authentication
- User is redirected to dashboard

#### FR-AUTH-002: Session Management
**Priority:** HIGH
**Description:** System shall manage user sessions using JWT tokens.
**Acceptance Criteria:**
- Token expires after 24 hours
- Expired tokens are rejected
- User can logout to invalidate session

#### FR-AUTH-003: Protected Routes
**Priority:** HIGH
**Description:** System shall protect routes requiring authentication.
**Acceptance Criteria:**
- Unauthenticated users are redirected to login
- API requests without valid token return 401
- Token is included in all API requests

---

### 2.2 Dashboard

#### FR-DASH-001: Key Metrics Display
**Priority:** MEDIUM
**Description:** Dashboard shall display key operational metrics.
**Acceptance Criteria:**
- Shows total orders by status
- Shows inventory summary by state
- Shows active holds count
- Shows recent production confirmations

#### FR-DASH-002: Quick Navigation
**Priority:** LOW
**Description:** Dashboard shall provide quick links to common actions.
**Acceptance Criteria:**
- Links to orders ready for production
- Links to active holds
- Links to pending quality decisions

---

### 2.3 Order Management

#### FR-ORD-001: Order List View
**Priority:** HIGH
**Description:** System shall display paginated list of orders.
**Acceptance Criteria:**
- Shows order number, customer, date, status
- Supports filtering by status
- Supports search by order number
- Pagination with configurable page size

#### FR-ORD-002: Order Detail View
**Priority:** HIGH
**Description:** System shall display detailed order information.
**Acceptance Criteria:**
- Shows all order header information
- Shows line items with products and quantities
- Shows order status history
- Shows associated operations and their status

#### FR-ORD-003: Order Status Management
**Priority:** HIGH
**Description:** System shall manage order status transitions.
**Acceptance Criteria:**
- Valid transitions: NOT_STARTED → IN_PROGRESS → COMPLETED
- Status changes are logged in audit trail
- Cannot transition to invalid status

---

### 2.4 Production Confirmation

#### FR-PROD-001: Operation Selection
**Priority:** HIGH
**Description:** System shall allow selection of order and operation for confirmation.
**Acceptance Criteria:**
- Only shows orders with READY operations
- Only shows operations in READY status
- Displays operation details after selection

#### FR-PROD-002: Material Selection
**Priority:** HIGH
**Description:** System shall allow selection of input materials.
**Acceptance Criteria:**
- Shows available inventory for material type
- Allows selection of specific batches
- Shows batch details (quantity, status)
- Validates sufficient quantity available

#### FR-PROD-003: BOM Suggested Consumption
**Priority:** MEDIUM
**Description:** System shall suggest material quantities based on BOM.
**Acceptance Criteria:**
- Calculates required quantities from BOM
- Shows availability status (Sufficient/Insufficient)
- Allows one-click application of suggestions
- Accounts for yield loss ratios

#### FR-PROD-004: Process Parameter Entry
**Priority:** HIGH
**Description:** System shall capture process parameters.
**Acceptance Criteria:**
- Shows parameters configured for operation type
- Validates against min/max limits
- Shows warnings for out-of-range values
- Required parameters must be filled

#### FR-PROD-005: Equipment Selection
**Priority:** MEDIUM
**Description:** System shall allow equipment selection.
**Acceptance Criteria:**
- Shows available equipment for operation type
- Allows multiple equipment selection
- Shows equipment status

#### FR-PROD-006: Operator Assignment
**Priority:** MEDIUM
**Description:** System shall allow operator assignment.
**Acceptance Criteria:**
- Shows available operators
- Allows multiple operator selection
- Records operator involvement

#### FR-PROD-007: Quantity Entry
**Priority:** HIGH
**Description:** System shall capture production quantities.
**Acceptance Criteria:**
- Enter good quantity produced
- Enter scrap quantity (if any)
- Validates total against expected
- Shows unit of measure

#### FR-PROD-008: Time Recording
**Priority:** MEDIUM
**Description:** System shall capture production times.
**Acceptance Criteria:**
- Enter start time
- Enter end time
- Validates end > start
- Calculates duration

#### FR-PROD-009: Confirmation Submission
**Priority:** HIGH
**Description:** System shall process production confirmation.
**Acceptance Criteria:**
- Creates output batch with auto-generated number
- Creates batch genealogy relations
- Updates input inventory to CONSUMED
- Creates output inventory record
- Updates operation status
- Logs all changes to audit trail

---

### 2.5 Inventory Management

#### FR-INV-001: Inventory List View
**Priority:** HIGH
**Description:** System shall display paginated inventory list.
**Acceptance Criteria:**
- Shows material, batch, quantity, state
- Supports filtering by state
- Supports filtering by type (RM/IM/FG)
- Supports search by batch number

#### FR-INV-002: Block Inventory
**Priority:** HIGH
**Description:** System shall allow blocking inventory.
**Acceptance Criteria:**
- Select item to block
- Enter block reason (required)
- State changes to BLOCKED
- Action logged in audit trail

#### FR-INV-003: Unblock Inventory
**Priority:** HIGH
**Description:** System shall allow unblocking inventory.
**Acceptance Criteria:**
- Only blocked items can be unblocked
- Confirmation required
- State returns to AVAILABLE
- Action logged in audit trail

#### FR-INV-004: Scrap Inventory
**Priority:** HIGH
**Description:** System shall allow scrapping inventory.
**Acceptance Criteria:**
- Select item to scrap
- Enter scrap reason (required)
- State changes to SCRAPPED
- Action is irreversible
- Action logged in audit trail

---

### 2.6 Batch Management

#### FR-BAT-001: Batch List View
**Priority:** HIGH
**Description:** System shall display paginated batch list.
**Acceptance Criteria:**
- Shows batch number, material, quantity, status
- Supports filtering by status
- Supports search by batch number
- Shows creation date

#### FR-BAT-002: Batch Detail View
**Priority:** HIGH
**Description:** System shall display detailed batch information.
**Acceptance Criteria:**
- Shows all batch attributes
- Shows associated inventory
- Shows production information

#### FR-BAT-003: Batch Genealogy View
**Priority:** HIGH
**Description:** System shall display batch genealogy.
**Acceptance Criteria:**
- Shows parent batches (inputs)
- Shows child batches (outputs)
- Shows relation type (CONSUMED, PRODUCED, SPLIT, MERGE)
- Allows navigation to related batches

#### FR-BAT-004: Batch Split
**Priority:** MEDIUM
**Description:** System shall allow splitting batches.
**Acceptance Criteria:**
- Select batch to split
- Define portions with quantities
- Total must equal original quantity
- Creates new batches with relation
- Original batch marked as SPLIT

#### FR-BAT-005: Batch Merge
**Priority:** MEDIUM
**Description:** System shall allow merging batches.
**Acceptance Criteria:**
- Select batches to merge (same material)
- Creates merged batch with combined quantity
- Source batches marked as MERGED
- Genealogy links created

#### FR-BAT-006: Configurable Batch Numbering
**Priority:** HIGH
**Description:** System shall generate batch numbers per configuration.
**Acceptance Criteria:**
- Configurable prefix by operation type
- Configurable date format
- Auto-incrementing sequence
- Configurable sequence reset (daily/monthly/yearly)

---

### 2.7 Bill of Materials (BOM) Management

#### FR-BOM-001: BOM List View
**Priority:** HIGH
**Description:** System shall display list of products with BOMs defined.
**Acceptance Criteria:**
- Shows product SKU, BOM version, node count
- Shows BOM status (ACTIVE/INACTIVE/DRAFT/OBSOLETE)
- Shows max hierarchy depth
- Links to view tree or add nodes

#### FR-BOM-002: BOM Tree View
**Priority:** HIGH
**Description:** System shall display BOM as hierarchical tree.
**Acceptance Criteria:**
- Shows materials in parent-child hierarchy
- Shows material ID, name, quantity, unit
- Shows yield loss ratio
- Shows sequence level badge
- Shows status badge per node
- Supports expand/collapse all
- Node actions: add child, edit, delete

#### FR-BOM-003: Create BOM Node
**Priority:** HIGH
**Description:** System shall allow creating BOM nodes.
**Acceptance Criteria:**
- Select product (for new BOM)
- Select material from dropdown
- Enter quantity required
- Select unit of measure
- Enter yield loss ratio (optional, default 1)
- Select parent node (optional for root)
- Default status is ACTIVE
- Auto-assigns sequence level

#### FR-BOM-004: Edit BOM Node
**Priority:** HIGH
**Description:** System shall allow editing BOM nodes.
**Acceptance Criteria:**
- Edit material selection
- Edit quantity and unit
- Edit yield loss ratio
- Edit sequence level
- Edit status (ACTIVE/INACTIVE/DRAFT/OBSOLETE)
- Shows read-only BOM ID and product SKU

#### FR-BOM-005: Delete BOM Node
**Priority:** HIGH
**Description:** System shall allow deleting BOM nodes.
**Acceptance Criteria:**
- Confirmation required before delete
- Option to delete node only (if no children)
- Option to cascade delete with all children
- Soft delete (sets status to INACTIVE)
- Audit trail entry created

#### FR-BOM-006: Edit BOM Settings (Top-Level)
**Priority:** HIGH
**Description:** System shall allow editing top-level BOM settings.
**Acceptance Criteria:**
- Change product SKU (moves all nodes to new product)
- Change BOM version (e.g., V1 → V2)
- Change status for all nodes
- Shows warning when changing product
- Navigates to new product tree after product change
- Updates all nodes in single transaction

#### FR-BOM-007: BOM Status Management
**Priority:** MEDIUM
**Description:** System shall support BOM status lifecycle.
**Acceptance Criteria:**
- Supported statuses: ACTIVE, INACTIVE, DRAFT, OBSOLETE
- Status displayed with color-coded badges
- ACTIVE: Green - Currently in use
- INACTIVE: Gray - Disabled
- DRAFT: Yellow/Orange - Work in progress
- OBSOLETE: Red - Deprecated version

---

### 2.8 Hold Management

#### FR-HOLD-001: Hold List View
**Priority:** HIGH
**Description:** System shall display active holds.
**Acceptance Criteria:**
- Shows hold type, entity, reason, date
- Shows held by user
- Supports filtering by entity type

#### FR-HOLD-002: Apply Hold
**Priority:** HIGH
**Description:** System shall allow applying holds.
**Acceptance Criteria:**
- Select entity type (Order/Batch/Inventory/Equipment)
- Select specific entity
- Enter hold reason (required)
- Select hold category
- Entity state updated to reflect hold

#### FR-HOLD-003: Release Hold
**Priority:** HIGH
**Description:** System shall allow releasing holds.
**Acceptance Criteria:**
- Select active hold
- Enter release notes
- Entity state returns to previous
- Hold record updated with release info

---

### 2.9 Equipment Management

#### FR-EQP-001: Equipment List View
**Priority:** MEDIUM
**Description:** System shall display equipment list.
**Acceptance Criteria:**
- Shows equipment name, type, status
- Supports filtering by status
- Shows current assignment if in use

#### FR-EQP-002: Start Maintenance
**Priority:** MEDIUM
**Description:** System shall allow putting equipment in maintenance.
**Acceptance Criteria:**
- Select available equipment
- Enter maintenance reason
- Status changes to MAINTENANCE

#### FR-EQP-003: End Maintenance
**Priority:** MEDIUM
**Description:** System shall allow ending maintenance.
**Acceptance Criteria:**
- Select equipment in maintenance
- Status returns to AVAILABLE

---

### 2.10 Quality Management

#### FR-QA-001: Quality Queue View
**Priority:** MEDIUM
**Description:** System shall display quality inspection queue.
**Acceptance Criteria:**
- Shows batches pending quality decision
- Shows batch details
- Supports filtering by status

#### FR-QA-002: Accept Batch
**Priority:** MEDIUM
**Description:** System shall allow accepting batches.
**Acceptance Criteria:**
- Select pending batch
- Status changes to APPROVED
- Batch available for use

#### FR-QA-003: Reject Batch
**Priority:** MEDIUM
**Description:** System shall allow rejecting batches.
**Acceptance Criteria:**
- Select pending batch
- Enter rejection reason (required)
- Status changes to REJECTED
- Triggers appropriate hold

---

### 2.11 Audit Trail

#### FR-AUD-001: Change Logging
**Priority:** HIGH
**Description:** System shall log all data changes.
**Acceptance Criteria:**
- Logs entity type and ID
- Logs action (CREATE/UPDATE/DELETE)
- Logs old and new values
- Logs user and timestamp

#### FR-AUD-002: Field-Level Audit
**Priority:** HIGH
**Description:** System shall log individual field changes.
**Acceptance Criteria:**
- Logs each changed field separately
- Shows old value and new value
- Excludes system fields (createdOn, etc.)

---

## 3. Non-Functional Requirements

### 3.1 Performance
- Page load time < 2 seconds
- API response time < 500ms for standard operations
- Support 50 concurrent users

### 3.2 Security
- All passwords hashed with BCrypt
- JWT tokens for API authentication
- HTTPS for all communications (production)

### 3.3 Availability
- 99% uptime during business hours
- Graceful error handling

### 3.4 Usability
- Responsive design for desktop browsers
- Consistent navigation patterns
- Clear error messages

---

## Document History

| Date | Author | Changes |
|------|--------|---------|
| 2026-02-04 | Claude Code | Initial document creation |
| 2026-02-05 | Claude Code | Added BOM Management section (FR-BOM-001 to FR-BOM-007) |
