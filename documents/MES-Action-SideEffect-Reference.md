# MES Action & Side-Effect Reference

**Last Updated:** 2026-02-08
**Purpose:** Comprehensive reference of all system actions and their expected side effects for QA testing

---

## Table of Contents

1. [Authentication Actions](#1-authentication-actions)
2. [Customer Management](#2-customer-management)
3. [Material Management](#3-material-management)
4. [Product Management](#4-product-management)
5. [Order Management](#5-order-management)
6. [Material Receipt](#6-material-receipt)
7. [Batch Management](#7-batch-management)
8. [Inventory Management](#8-inventory-management)
9. [Production Confirmation](#9-production-confirmation)
10. [Hold Management](#10-hold-management)
11. [Equipment Management](#11-equipment-management)
12. [Routing Management](#12-routing-management)
13. [Operation Template Management](#13-operation-template-management)
14. [BOM Management](#14-bom-management)
15. [User Management](#15-user-management)
16. [Configuration Management](#16-configuration-management)

---

## 1. Authentication Actions

### 1.1 Login
| Action | Side Effects |
|--------|--------------|
| Submit valid credentials | - JWT token stored in localStorage |
| | - User info stored in localStorage |
| | - Redirect to Dashboard |
| | - Audit log: LOGIN action recorded |

### 1.2 Logout
| Action | Side Effects |
|--------|--------------|
| Click logout button | - JWT token removed from localStorage |
| | - User info removed |
| | - Redirect to Login page |
| | - Audit log: LOGOUT action recorded |

### 1.3 Change Password
| Action | Side Effects |
|--------|--------------|
| Submit new password | - Password updated in database |
| | - Success message displayed |
| | - Audit log: PASSWORD_CHANGE recorded |

---

## 2. Customer Management

### 2.1 Create Customer
| Action | Side Effects |
|--------|--------------|
| Submit customer form | - Customer record created in `customers` table |
| | - Status: ACTIVE |
| | - Customer appears in customer list |
| | - Customer selectable in Order creation |
| | - Audit log: CUSTOMER_CREATED |

### 2.2 Update Customer
| Action | Side Effects |
|--------|--------------|
| Submit edit form | - Customer record updated |
| | - Changes reflected in list view |
| | - Changes reflected in existing orders (name display) |
| | - Audit log: CUSTOMER_UPDATED with field changes |

### 2.3 Delete Customer
| Action | Side Effects |
|--------|--------------|
| Click delete button | - Customer status → INACTIVE (soft delete) |
| | - Customer removed from active customer list |
| | - Customer NOT selectable for new orders |
| | - Existing orders still show customer name |
| | - Audit log: CUSTOMER_DELETED |

---

## 3. Material Management

### 3.1 Create Material
| Action | Side Effects |
|--------|--------------|
| Submit material form | - Material record created in `materials` table |
| | - Status: ACTIVE |
| | - Material appears in material list |
| | - Material selectable in: |
| |   - Receive Material |
| |   - BOM creation |
| |   - Production confirmation |
| | - Audit log: MATERIAL_CREATED |

**Validation Side Effects:**
- Duplicate materialCode → Error message, no creation

### 3.2 Update Material
| Action | Side Effects |
|--------|--------------|
| Submit edit form | - Material record updated |
| | - If type changes: affects inventory type classification |
| | - Audit log: MATERIAL_UPDATED with field changes |

### 3.3 Delete Material
| Action | Side Effects |
|--------|--------------|
| Click delete | - Material status → INACTIVE |
| | - Material removed from active lists |
| | - Cannot receive this material anymore |
| | - Existing batches/inventory unchanged |
| | - Audit log: MATERIAL_DELETED |

---

## 4. Product Management

### 4.1 Create Product
| Action | Side Effects |
|--------|--------------|
| Submit product form | - Product record created in `products` table |
| | - Status: ACTIVE |
| | - Product appears in product list |
| | - Product selectable in Order line items |
| | - Can create BOM for this product |
| | - Audit log: PRODUCT_CREATED |

**Validation Side Effects:**
- Duplicate SKU → Error message, no creation

### 4.2 Update Product
| Action | Side Effects |
|--------|--------------|
| Submit edit form | - Product record updated |
| | - Changes reflected in orders (display name) |
| | - Audit log: PRODUCT_UPDATED |

### 4.3 Delete Product
| Action | Side Effects |
|--------|--------------|
| Click delete | - Product status → INACTIVE |
| | - Product removed from active list |
| | - Cannot add to new orders |
| | - Existing order line items unchanged |
| | - Audit log: PRODUCT_DELETED |

---

## 5. Order Management

### 5.1 Create Order
| Action | Side Effects |
|--------|--------------|
| Submit order form | - Order record created in `orders` table |
| | - Status: DRAFT or PENDING |
| | - Order line items created in `order_line_items` table |
| | - For each line item: |
| |   - Process instance created (from product's routing) |
| |   - Operations created (from routing steps) |
| |   - First operation status: READY |
| |   - Other operations: NOT_STARTED |
| | - Order appears in order list |
| | - Order appears in "Orders with Ready Operations" |
| | - Dashboard "Orders Ready" count increments |
| | - Audit log: ORDER_CREATED |

### 5.2 Add Line Item
| Action | Side Effects |
|--------|--------------|
| Add line item to order | - OrderLineItem record created |
| | - Process instance created |
| | - Operations created based on routing |
| | - Audit log: LINE_ITEM_ADDED |

### 5.3 Update Line Item
| Action | Side Effects |
|--------|--------------|
| Update line item | - Quantity/product updated |
| | - If quantity increases: may affect material requirements |
| | - Audit log: LINE_ITEM_UPDATED |

### 5.4 Delete Line Item
| Action | Side Effects |
|--------|--------------|
| Delete line item | - Line item marked as deleted |
| | - Associated process/operations marked inactive |
| | - Audit log: LINE_ITEM_DELETED |

### 5.5 Cancel Order
| Action | Side Effects |
|--------|--------------|
| Cancel order | - Order status → CANCELLED |
| | - All operations status → CANCELLED |
| | - Order removed from active lists |
| | - Order still visible with CANCELLED filter |
| | - Audit log: ORDER_CANCELLED |

---

## 6. Material Receipt

### 6.1 Receive Material
| Action | Side Effects |
|--------|--------------|
| Submit receive form | **Creates Batch:** |
| | - Batch record created in `batches` table |
| | - Batch number auto-generated (configurable pattern) |
| | - Status: QUALITY_PENDING |
| | - Quantity: as entered |
| | - Material: as selected |
| | - Supplier/lot info stored |
| | |
| | **Creates Inventory:** |
| | - Inventory record created in `inventory` table |
| | - State: AVAILABLE |
| | - Linked to the new batch |
| | - Location: as specified or default |
| | |
| | **Dashboard Updates:** |
| | - "Batches Pending Approval" count +1 |
| | - Inventory flow RM count updated |
| | |
| | **Audit Trail:** |
| | - BATCH_CREATED |
| | - INVENTORY_CREATED |
| | - MATERIAL_RECEIVED |

**Validation Side Effects:**
- Quantity ≤ 0 → Error, no creation
- No material selected → Error, no creation

---

## 7. Batch Management

### 7.1 Approve Batch
| Action | Side Effects |
|--------|--------------|
| Click Approve | - Batch status: QUALITY_PENDING → AVAILABLE |
| | - Batch now usable in production |
| | - Dashboard "Pending Approval" count -1 |
| | - Quality inspection record updated |
| | - Audit log: BATCH_APPROVED |

### 7.2 Reject Batch
| Action | Side Effects |
|--------|--------------|
| Click Reject | - Batch status: QUALITY_PENDING → REJECTED |
| | - Associated inventory state → BLOCKED or SCRAPPED |
| | - Batch NOT usable in production |
| | - Dashboard "Pending Approval" count -1 |
| | - Audit log: BATCH_REJECTED |

### 7.3 Split Batch
| Action | Side Effects |
|--------|--------------|
| Submit split form | - Original batch quantity reduced |
| | - N new child batches created |
| | - Each child batch: |
| |   - New batch number (original-A, -B, etc.) |
| |   - Status: same as parent |
| |   - Quantity: split portion |
| | - BatchRelation records created (type: SPLIT) |
| | - Parent → Children relationship stored |
| | - New inventory records for each child batch |
| | - Audit log: BATCH_SPLIT |

### 7.4 Merge Batches
| Action | Side Effects |
|--------|--------------|
| Submit merge form | - New merged batch created |
| | - All source batches status → CONSUMED |
| | - Source inventory state → CONSUMED |
| | - BatchRelation records: source → merged (type: MERGE) |
| | - New inventory for merged batch |
| | - Audit log: BATCH_MERGED |

**Validation Side Effects:**
- Different materials → Error, cannot merge
- Different statuses → Error, cannot merge

### 7.5 Adjust Quantity
| Action | Side Effects |
|--------|--------------|
| Submit adjustment | - Batch quantity updated |
| | - Adjustment reason recorded |
| | - Inventory quantity synced |
| | - Audit log: BATCH_QUANTITY_ADJUSTED (old→new values) |

### 7.6 Hold Batch
| Action | Side Effects |
|--------|--------------|
| Apply hold to batch | - Batch status → ON_HOLD |
| | - Associated inventory state → ON_HOLD |
| | - HoldRecord created in `holds` table |
| | - Batch NOT usable in production |
| | - Dashboard "Active Holds" count +1 |
| | - Audit log: BATCH_HELD |

### 7.7 View Genealogy
| Action | Side Effects |
|--------|--------------|
| View genealogy | (Read-only, no side effects) |
| | - Displays parent batches (inputs) |
| | - Displays child batches (outputs) |
| | - Full traceability chain visible |

---

## 8. Inventory Management

### 8.1 Block Inventory
| Action | Side Effects |
|--------|--------------|
| Click Block | - Inventory state: AVAILABLE → BLOCKED |
| | - Block reason recorded |
| | - Inventory NOT usable in production |
| | - Dashboard inventory counts updated |
| | - Audit log: INVENTORY_BLOCKED |

### 8.2 Unblock Inventory
| Action | Side Effects |
|--------|--------------|
| Click Unblock | - Inventory state: BLOCKED → AVAILABLE |
| | - Unblock reason recorded |
| | - Inventory usable in production again |
| | - Dashboard inventory counts updated |
| | - Audit log: INVENTORY_UNBLOCKED |

### 8.3 Scrap Inventory
| Action | Side Effects |
|--------|--------------|
| Click Scrap | - Inventory state → SCRAPPED |
| | - Scrap reason recorded |
| | - Inventory permanently unusable |
| | - Associated batch may be marked SCRAPPED |
| | - Dashboard inventory counts updated |
| | - Audit log: INVENTORY_SCRAPPED |

### 8.4 Transfer Inventory
| Action | Side Effects |
|--------|--------------|
| Submit transfer | - Inventory location updated |
| | - Transfer history recorded |
| | - Audit log: INVENTORY_TRANSFERRED |

---

## 9. Production Confirmation

### 9.1 Submit Production Confirmation
| Action | Side Effects |
|--------|--------------|

**This is the most complex action with multiple side effects:**

| Category | Side Effect |
|----------|-------------|
| **Operation Update** | - Operation status: READY → CONFIRMED |
| | - Next operation in sequence: NOT_STARTED → READY |
| | - Operation completion timestamp recorded |
| **Input Material Consumption** | - Input batch(es) status → CONSUMED (if fully used) |
| | - Input batch quantity reduced (if partially used) |
| | - Input inventory state → CONSUMED |
| | - Input inventory quantity → 0 (if fully consumed) |
| **Output Batch Creation** | - New output batch created |
| | - Batch number: generated per configuration |
| | - Status: PRODUCED or QUALITY_PENDING (depends on config) |
| | - Quantity: produced quantity from form |
| | - Material: output material from operation |
| **Output Inventory Creation** | - New inventory record created |
| | - State: PRODUCED or AVAILABLE |
| | - Linked to new output batch |
| **Batch Genealogy** | - BatchRelation records created |
| | - Input batches → Output batch (type: PRODUCTION) |
| | - Full traceability maintained |
| **Process Parameters** | - Parameter values stored in confirmation |
| | - Values validated against min/max config |
| **Production History** | - ProductionConfirmation record created |
| | - Operator, equipment, times recorded |
| | - Process parameter values stored |
| **Equipment Update** | - Equipment lastUsedAt updated |
| | - Equipment usage count incremented |
| **Dashboard Updates** | - "Today's Confirmations" count +1 |
| | - Inventory flow counts updated |
| | - Operations ready count may decrease |
| **Audit Trail** | - PRODUCTION_CONFIRMED |
| | - BATCH_CONSUMED (for each input) |
| | - BATCH_PRODUCED |
| | - INVENTORY_CONSUMED |
| | - INVENTORY_PRODUCED |

**Validation Side Effects:**
- No input materials selected → Error
- Quantity ≤ 0 → Error
- Future start time → Error (start time must be ≤ now)
- End time < start time → Error
- Process parameters out of range → Error
- Equipment on hold → Error
- Input batch on hold → Error

### 9.2 Apply Hold During Production
| Action | Side Effects |
|--------|--------------|
| Click Hold in confirmation | - HoldRecord created |
| | - Entity (operation/batch) status → ON_HOLD |
| | - Production cannot continue |
| | - Audit log: HOLD_APPLIED |

---

## 10. Hold Management

### 10.1 Apply Hold
| Action | Side Effects |
|--------|--------------|
| Submit hold form | - HoldRecord created in `holds` table |
| | - Hold status: ACTIVE |
| | - Entity (based on type) status updated: |
| |   - Order → ON_HOLD |
| |   - Operation → ON_HOLD |
| |   - Batch → ON_HOLD |
| |   - Inventory → ON_HOLD |
| |   - Equipment → ON_HOLD |
| | - Entity NOT usable until released |
| | - Dashboard "Active Holds" count +1 |
| | - Audit log: HOLD_APPLIED |

**Entity-Specific Side Effects:**

| Entity Type | Additional Side Effects |
|-------------|------------------------|
| ORDER | All operations on hold, production blocked |
| OPERATION | Production blocked for this step |
| BATCH | Cannot be used as input, cannot split/merge |
| INVENTORY | Cannot be consumed in production |
| EQUIPMENT | Cannot be selected for production |

### 10.2 Release Hold
| Action | Side Effects |
|--------|--------------|
| Submit release | - Hold status: ACTIVE → RELEASED |
| | - Release timestamp recorded |
| | - Release comments recorded |
| | - Entity status reverts to previous (ON_HOLD → AVAILABLE/READY) |
| | - Entity usable again |
| | - Dashboard "Active Holds" count -1 |
| | - Audit log: HOLD_RELEASED |

---

## 11. Equipment Management

### 11.1 Create Equipment
| Action | Side Effects |
|--------|--------------|
| Submit form | - Equipment record created |
| | - Status: AVAILABLE |
| | - Equipment appears in lists |
| | - Equipment selectable in production confirmation |
| | - Audit log: EQUIPMENT_CREATED |

### 11.2 Start Maintenance
| Action | Side Effects |
|--------|--------------|
| Click Start Maintenance | - Equipment status: AVAILABLE → MAINTENANCE |
| | - Maintenance start time recorded |
| | - Equipment NOT selectable for production |
| | - Dashboard equipment counts updated |
| | - Audit log: EQUIPMENT_MAINTENANCE_STARTED |

### 11.3 End Maintenance
| Action | Side Effects |
|--------|--------------|
| Click End Maintenance | - Equipment status: MAINTENANCE → AVAILABLE |
| | - Maintenance end time recorded |
| | - Maintenance duration calculated |
| | - Equipment usable again |
| | - Dashboard equipment counts updated |
| | - Audit log: EQUIPMENT_MAINTENANCE_ENDED |

### 11.4 Hold Equipment
| Action | Side Effects |
|--------|--------------|
| Apply hold | - Equipment status → ON_HOLD |
| | - HoldRecord created |
| | - Equipment NOT usable |
| | - Audit log: EQUIPMENT_HELD |

### 11.5 Release Equipment
| Action | Side Effects |
|--------|--------------|
| Release hold | - Equipment status: ON_HOLD → AVAILABLE |
| | - Hold record released |
| | - Equipment usable again |
| | - Audit log: EQUIPMENT_RELEASED |

---

## 12. Routing Management

### 12.1 Create Routing
| Action | Side Effects |
|--------|--------------|
| Submit routing form | - Routing record created |
| | - Status: DRAFT |
| | - Routing NOT usable until activated |
| | - Audit log: ROUTING_CREATED |

### 12.2 Add Routing Step
| Action | Side Effects |
|--------|--------------|
| Add step | - RoutingStep record created |
| | - Sequence number assigned |
| | - Step linked to operation template or manual config |
| | - Audit log: ROUTING_STEP_ADDED |

### 12.3 Reorder Steps
| Action | Side Effects |
|--------|--------------|
| Reorder steps | - Sequence numbers updated |
| | - Step order changed in list |
| | - Audit log: ROUTING_STEPS_REORDERED |

### 12.4 Activate Routing
| Action | Side Effects |
|--------|--------------|
| Click Activate | - Routing status: DRAFT → ACTIVE |
| | - Other routings for same process → INACTIVE |
| | - Routing now used for new orders |
| | - Audit log: ROUTING_ACTIVATED |

### 12.5 Deactivate Routing
| Action | Side Effects |
|--------|--------------|
| Click Deactivate | - Routing status: ACTIVE → INACTIVE |
| | - Routing NOT used for new orders |
| | - Existing orders unchanged |
| | - Audit log: ROUTING_DEACTIVATED |

### 12.6 Hold Routing
| Action | Side Effects |
|--------|--------------|
| Apply hold | - Routing status → ON_HOLD |
| | - Cannot be activated |
| | - Audit log: ROUTING_HELD |

### 12.7 Delete Routing Step
| Action | Side Effects |
|--------|--------------|
| Delete step | - Step removed from routing |
| | - Other steps' sequence renumbered |
| | - Audit log: ROUTING_STEP_DELETED |

---

## 13. Operation Template Management

### 13.1 Create Template
| Action | Side Effects |
|--------|--------------|
| Submit form | - OperationTemplate record created |
| | - Status: ACTIVE |
| | - Template appears in template list |
| | - Template selectable in routing step creation |
| | - Audit log: TEMPLATE_CREATED |

### 13.2 Update Template
| Action | Side Effects |
|--------|--------------|
| Submit edit | - Template record updated |
| | - Changes affect NEW routing steps only |
| | - Existing routing steps unchanged |
| | - Audit log: TEMPLATE_UPDATED |

### 13.3 Deactivate Template
| Action | Side Effects |
|--------|--------------|
| Deactivate | - Template status → INACTIVE |
| | - Template NOT selectable for new routing steps |
| | - Existing routing steps unchanged |
| | - Audit log: TEMPLATE_DEACTIVATED |

---

## 14. BOM Management

### 14.1 Create BOM Node
| Action | Side Effects |
|--------|--------------|
| Add BOM node | - BomNode record created |
| | - Parent-child relationship established |
| | - Material requirements calculated |
| | - Suggested consumption available |
| | - Audit log: BOM_NODE_CREATED |

### 14.2 Update BOM Node
| Action | Side Effects |
|--------|--------------|
| Update node | - Node quantity/material updated |
| | - Suggested consumption recalculated |
| | - Audit log: BOM_NODE_UPDATED |

### 14.3 Delete BOM Node
| Action | Side Effects |
|--------|--------------|
| Delete node | - Node marked deleted |
| | - Child nodes optionally deleted (cascade) |
| | - BOM requirements recalculated |
| | - Audit log: BOM_NODE_DELETED |

### 14.4 Move BOM Node
| Action | Side Effects |
|--------|--------------|
| Move node | - Parent reference updated |
| | - BOM tree restructured |
| | - Audit log: BOM_NODE_MOVED |

---

## 15. User Management

### 15.1 Create User
| Action | Side Effects |
|--------|--------------|
| Submit form | - User record created |
| | - Password hashed and stored |
| | - Role assigned |
| | - User can login immediately |
| | - Audit log: USER_CREATED |

### 15.2 Update User
| Action | Side Effects |
|--------|--------------|
| Submit edit | - User details updated |
| | - If role changed: permissions changed immediately |
| | - Audit log: USER_UPDATED |

### 15.3 Deactivate User
| Action | Side Effects |
|--------|--------------|
| Deactivate | - User status → INACTIVE |
| | - User cannot login |
| | - Existing sessions invalidated |
| | - Audit log: USER_DEACTIVATED |

### 15.4 Reset Password
| Action | Side Effects |
|--------|--------------|
| Reset password | - Password updated |
| | - User must use new password |
| | - Audit log: PASSWORD_RESET |

---

## 16. Configuration Management

### 16.1 Update Hold Reasons
| Action | Side Effects |
|--------|--------------|
| Add/update reason | - Reason available in hold modal |
| | - Affects all future holds |
| | - Audit log: CONFIG_UPDATED |

### 16.2 Update Delay Reasons
| Action | Side Effects |
|--------|--------------|
| Add/update reason | - Reason available in production confirmation |
| | - Audit log: CONFIG_UPDATED |

### 16.3 Update Process Parameters Config
| Action | Side Effects |
|--------|--------------|
| Update min/max values | - Validation rules change |
| | - Affects future confirmations |
| | - Existing confirmations unchanged |
| | - Audit log: CONFIG_UPDATED |

### 16.4 Update Batch Number Config
| Action | Side Effects |
|--------|--------------|
| Update pattern/sequence | - New batches use new pattern |
| | - Existing batch numbers unchanged |
| | - Sequence reset if configured |
| | - Audit log: CONFIG_UPDATED |

---

## Audit Trail Side Effects

Every action in the system creates an audit log entry with:

| Field | Description |
|-------|-------------|
| `timestamp` | When the action occurred |
| `username` | Who performed the action |
| `actionType` | CREATE, UPDATE, DELETE, STATUS_CHANGE, etc. |
| `entityType` | CUSTOMER, ORDER, BATCH, INVENTORY, etc. |
| `entityId` | The affected entity's ID |
| `oldValues` | Previous values (for updates) |
| `newValues` | New values (for updates/creates) |
| `description` | Human-readable description |

---

## Dashboard Real-Time Updates

The following dashboard metrics update after each action:

| Metric | Updated By |
|--------|------------|
| Orders Ready for Production | Order creation, operation confirmation |
| Active Holds | Hold apply, hold release |
| Today's Confirmations | Production confirmation |
| Batches Pending Approval | Material receipt, batch approval |
| Inventory by Type (RM/WIP/IM/FG) | Material receipt, production, scrap |
| Operations by Status | Operation status changes |

---

## Testing Checklist

For each action, verify:

- [ ] Primary action completes successfully
- [ ] Success/error message displayed appropriately
- [ ] Entity appears/updates in relevant lists
- [ ] Status changes reflected everywhere
- [ ] Related entities updated correctly
- [ ] Dashboard metrics update
- [ ] Audit trail entry created
- [ ] Validation prevents invalid actions
- [ ] Error cases handled gracefully

---

*This document should be updated whenever new actions are added or existing action behavior changes.*
