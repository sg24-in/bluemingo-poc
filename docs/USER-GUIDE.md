# MES Production Confirmation - User Guide

This guide walks you through the complete user journey of the MES Production Confirmation application, with screenshots illustrating each step.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [Orders Management](#orders-management)
4. [Production Confirmation](#production-confirmation)
5. [Inventory Management](#inventory-management)
6. [Batch Traceability](#batch-traceability)
7. [Hold Management](#hold-management)
8. [Equipment Management](#equipment-management)
9. [Quality Inspection](#quality-inspection)

---

## Getting Started

### Logging In

1. Open your browser and navigate to `http://localhost:4200`
2. You will see the login page

![Login Page](../e2e/output/screenshots/user-journey/001-login-page-empty.png)

3. Enter your credentials:
   - **Email:** admin@mes.com
   - **Password:** admin123

![Login Filled](../e2e/output/screenshots/user-journey/003-login-credentials-complete.png)

4. Click **Login** to access the dashboard

![Dashboard After Login](../e2e/output/screenshots/user-journey/004-dashboard-after-login.png)

### Navigation

The main navigation menu is located in the header. You can access:

- **Dashboard** - Overview and statistics
- **Orders** - Customer order management
- **Production** - Production confirmation forms
- **Inventory** - Material inventory tracking
- **Batches** - Batch management and traceability
- **Holds** - Hold records management
- **Equipment** - Equipment status and maintenance
- **Quality** - Quality inspection queue

---

## Dashboard Overview

The dashboard provides a quick overview of your production status.

![Dashboard Overview](../e2e/output/screenshots/user-journey/005-dashboard-overview.png)

### Dashboard Cards

The dashboard displays key metrics including:

- **Orders** - Total orders and status breakdown
- **Production** - Today's production statistics
- **Holds** - Active holds requiring attention
- **Quality** - Pending quality inspections

### Quick Actions

Click on any card to navigate directly to that module.

---

## Orders Management

### Viewing Orders

Navigate to **Orders** to see all customer orders.

![Orders List](../e2e/output/screenshots/user-journey/006-orders-list.png)

### Order Status

Orders can have the following statuses:
- **CREATED** - New order, not yet started
- **IN_PROGRESS** - Production has begun
- **COMPLETED** - All production finished
- **CANCELLED** - Order cancelled

### Filtering Orders

Use the status filter dropdown to show orders of a specific status.

### Order Details

Click on any order row to view details.

![Order Detail](../e2e/output/screenshots/user-journey/007-order-detail-view.png)

The detail view shows:
- Order information (customer, date, status)
- Line items (products ordered)
- Operations timeline (production stages)

---

## Production Confirmation

Production confirmation is the core workflow for recording manufacturing output.

### Accessing the Form

Navigate to **Production** > **Confirm** or click from an order detail.

![Production Form Empty](../e2e/output/screenshots/user-journey/008-production-form-empty.png)

### Step 1: Select Order

Choose an order from the dropdown. Only orders with READY operations are shown.

![Order Selected](../e2e/output/screenshots/user-journey/009-production-order-selected.png)

### Step 2: Select Operation

Select the specific operation to confirm.

![Operation Selected](../e2e/output/screenshots/user-journey/010-production-operation-selected.png)

### Step 3: Enter Production Times

Enter the start and end times for the production run.

### Step 4: Enter Quantities

- **Produced Quantity** - Amount of good product
- **Scrap Quantity** - Amount of rejected/waste product

![Form Filled](../e2e/output/screenshots/user-journey/011-production-form-filled.png)

### Step 5: Select Equipment & Operators

Check the equipment and operators used for this production run.

### Step 6: Submit Confirmation

Click **Confirm Production** to submit. This will:
- Update the operation status
- Create a new output batch
- Record the production confirmation
- Update inventory levels

---

## Inventory Management

### Viewing Inventory

Navigate to **Inventory** to see all material inventory.

![Inventory List](../e2e/output/screenshots/user-journey/012-inventory-list.png)

### Inventory States

Materials can be in these states:
- **AVAILABLE** - Ready for use
- **BLOCKED** - Temporarily unavailable
- **RESERVED** - Reserved for a specific order
- **CONSUMED** - Used in production
- **SCRAPPED** - Disposed of

### Filtering Inventory

Use the state and type filters to narrow down the list.

![Inventory Available Filter](../e2e/output/screenshots/user-journey/013-inventory-available-filter.png)

![Inventory Blocked Filter](../e2e/output/screenshots/user-journey/014-inventory-blocked-filter.png)

### Blocking Inventory

To block a material:
1. Find the material in the list
2. Click the **Block** button
3. Enter a reason for blocking
4. Click **Confirm**

### Unblocking Inventory

To release a blocked material:
1. Filter to show BLOCKED items
2. Click the **Unblock** button on the material
3. Confirm the action

### Scrapping Inventory

To scrap a material (permanent):
1. Click the **Scrap** button
2. Enter a scrap reason
3. Click **Confirm**

---

## Batch Traceability

Batches are trackable units of material that flow through production.

### Viewing Batches

Navigate to **Batches** to see all batches.

![Batches List](../e2e/output/screenshots/user-journey/015-batches-list.png)

### Batch Detail

Click on a batch to view its details.

![Batch Detail](../e2e/output/screenshots/user-journey/016-batch-detail-view.png)

### Genealogy / Traceability

The genealogy view shows the complete history of a batch:
- **Upstream** - Source materials (parents)
- **Downstream** - Products made from this batch (children)

![Batch Genealogy](../e2e/output/screenshots/user-journey/017-batch-genealogy.png)

This is essential for:
- Quality investigations
- Recall management
- Process optimization

### Batch Operations

Depending on the batch state, you may be able to:
- **Split** - Divide a batch into smaller batches
- **Merge** - Combine batches of the same material

---

## Hold Management

Holds temporarily stop operations on materials, orders, or equipment.

### Viewing Active Holds

Navigate to **Holds** to see all active holds.

![Holds List](../e2e/output/screenshots/user-journey/018-holds-list.png)

### Applying a Hold

1. Click **Apply Hold** or **New Hold**
2. Select the entity type (Order, Batch, Inventory, Equipment)
3. Select the specific item to hold
4. Select a reason
5. Add comments
6. Click **Apply**

![Apply Hold Modal](../e2e/output/screenshots/user-journey/019-holds-apply-modal.png)

### Releasing a Hold

1. Find the hold in the list
2. Click **Release**
3. Add release comments
4. Click **Confirm Release**

---

## Equipment Management

Track and manage production equipment.

### Viewing Equipment

Navigate to **Equipment** to see all equipment.

![Equipment List](../e2e/output/screenshots/user-journey/020-equipment-list.png)

### Equipment Status

Equipment can be:
- **AVAILABLE** - Ready for use
- **IN_USE** - Currently in production
- **MAINTENANCE** - Under maintenance
- **ON_HOLD** - Temporarily held

### Starting Maintenance

1. Find the equipment
2. Click **Maintenance** or **Start Maintenance**
3. Enter a reason
4. Click **Start**

### Ending Maintenance

1. Filter to show MAINTENANCE equipment
2. Click **End Maintenance**
3. Confirm the action

### Putting Equipment on Hold

1. Click **Hold** on the equipment
2. Enter a reason
3. Click **Apply Hold**

### Releasing Equipment from Hold

1. Filter to show ON_HOLD equipment
2. Click **Release**
3. Confirm the action

---

## Quality Inspection

Manage quality inspection queues and decisions.

### Viewing Pending Inspections

Navigate to **Quality** to see items pending inspection.

![Quality Pending](../e2e/output/screenshots/user-journey/021-quality-pending.png)

### Tabs

- **Pending** - Items awaiting quality decision
- **Rejected** - Items that failed inspection
- **All** - Complete history

### Accepting an Inspection

1. Find the item in the Pending tab
2. Click **Accept** or **Approve**
3. Confirm the action

### Rejecting an Inspection

1. Click **Reject**
2. Enter a rejection reason
3. Click **Confirm**

![Quality Rejected](../e2e/output/screenshots/user-journey/022-quality-rejected.png)

---

## Quick Reference

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+D | Go to Dashboard |
| Ctrl+O | Go to Orders |
| Ctrl+P | Go to Production |
| Esc | Close modal |

### Status Colors

| Color | Meaning |
|-------|---------|
| Green | Available / Ready / Completed |
| Yellow | In Progress / Pending |
| Red | Blocked / On Hold / Rejected |
| Gray | Not Started / Cancelled |

### Need Help?

- Contact your system administrator
- Review the developer documentation in `docs/DEV-GUIDE.md`
- Check the application logs for error details

---

## Generating Screenshots

To regenerate the screenshots for this guide:

```bash
# Ensure backend and frontend are running
node e2e/record-user-journey.js
```

Screenshots will be saved to `e2e/output/screenshots/user-journey-{timestamp}/`

To record a video of the complete journey:

```bash
node e2e/run-all-tests.js --video
```

Videos will be saved to `e2e/output/videos/`
