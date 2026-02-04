# MES Production Confirmation - Demo Video Script

**Duration:** 10 minutes
**Purpose:** Comprehensive walkthrough of all features
**Target Audience:** Stakeholders, End Users, Technical Team

---

## Video Structure

| Chapter | Duration | Content |
|---------|----------|---------|
| 1. Introduction | 0:45 | System overview, purpose |
| 2. Login & Authentication | 0:45 | Security, JWT tokens |
| 3. Dashboard Overview | 1:00 | Key metrics, navigation |
| 4. Orders Management | 1:15 | Order list, filtering, details |
| 5. Production Confirmation | 2:00 | Core workflow, BOM, batch generation |
| 6. Inventory Management | 1:15 | States, blocking, scrapping |
| 7. Batch Traceability | 1:00 | Genealogy, parent-child relationships |
| 8. Hold Management | 0:45 | Apply/release holds |
| 9. Equipment Management | 0:30 | Equipment status, maintenance |
| 10. Quality Inspection | 0:30 | Accept/reject workflow |
| 11. Closing | 0:15 | Summary |

---

## CHAPTER 1: INTRODUCTION (0:00 - 0:45)

### Screen: Title Screen / Logo

**VOICEOVER:**

> Welcome to the MES Production Confirmation System, a comprehensive Manufacturing Execution System designed for production workflows in process industries.
>
> This system enables real-time production tracking, material consumption recording, batch traceability, and quality management - all essential capabilities for modern manufacturing operations.
>
> In this demonstration, we'll walk through all the key features, from logging in to confirming production, managing inventory, and tracking batches through the entire production lifecycle.
>
> Let's begin.

---

## CHAPTER 2: LOGIN & AUTHENTICATION (0:45 - 1:30)

### Screen: Login Page

**VOICEOVER:**

> The system uses secure JWT token-based authentication. Each user has unique credentials that determine their access permissions.
>
> Let me enter my email address: admin@mes.com
>
> [TYPE EMAIL]
>
> And my password.
>
> [TYPE PASSWORD]
>
> When I click Sign In, the system validates my credentials against the database. On success, a JWT access token is generated and stored securely in the browser.
>
> [CLICK SIGN IN]
>
> The token allows me to access the system without re-entering credentials for the session duration. All API calls include this token for authentication.
>
> I'm now logged in and redirected to the Dashboard.

---

## CHAPTER 3: DASHBOARD OVERVIEW (1:30 - 2:30)

### Screen: Dashboard

**VOICEOVER:**

> The Dashboard provides a real-time overview of production operations.
>
> At the top, you see key performance metrics:
> - **Total Orders** shows all customer orders in the system
> - **Operations Ready** indicates how many production steps are waiting to be processed
> - **Active Holds** shows materials or equipment currently blocked
> - **Today's Confirmations** tracks production activity for the current day
> - **Quality Pending** shows items awaiting quality inspection
>
> Below the metrics, the **Inventory Summary** displays:
> - Total inventory count across all states
> - Available items ready for production
> - Consumed materials used in production
> - Items currently on hold
>
> The **Orders Ready for Production** section lists orders with operations in READY status. These are orders where production can begin immediately.
>
> **Recent Confirmations** shows the latest production activities, including operation name, product, and quantity produced.
>
> Finally, the **Audit Trail** at the bottom tracks all system activities - status changes, material consumption, production confirmations, and holds. This provides complete traceability for compliance and investigations.
>
> The navigation menu on the left provides access to all system modules.

---

## CHAPTER 4: ORDERS MANAGEMENT (2:30 - 3:45)

### Screen: Orders List

**VOICEOVER:**

> Let's look at the Orders module.
>
> [CLICK ORDERS IN NAV]
>
> This screen displays all customer orders in the system. Each order shows:
> - Order number for identification
> - Product being manufactured
> - Total quantity ordered
> - Current status: CREATED, IN_PROGRESS, or COMPLETED
> - Priority level
> - Due date for delivery
>
> With the new pagination feature, you can navigate through large datasets efficiently. The page size selector lets you choose how many records to display per page.
>
> [DEMONSTRATE PAGINATION]
>
> Use the status filter to focus on specific orders. Let me filter for IN_PROGRESS orders.
>
> [SELECT FILTER]
>
> You can also search by order number or product name.
>
> [TYPE IN SEARCH]
>
> Clicking on an order reveals its details.
>
> [CLICK ON ORDER]
>
> The Order Detail view shows:
> - Order header information including customer details
> - Line items listing each product ordered with quantities
> - The Operations Timeline showing the production workflow
>
> The timeline uses color coding: Green for completed, Blue for ready, Yellow for in-progress, and Gray for not started. This visual representation helps track production progress at a glance.

---

## CHAPTER 5: PRODUCTION CONFIRMATION (3:45 - 5:45)

### Screen: Production Confirmation Form

**VOICEOVER:**

> Production Confirmation is the core workflow of the MES system. This is where we record completed production work.
>
> [CLICK PRODUCTION IN NAV]
>
> The form is divided into several sections. Let me walk through each one.
>
> **Step 1: Select Order and Operation**
>
> First, I select an Order from the dropdown. Only orders with READY operations appear here.
>
> [SELECT ORDER]
>
> Now I select the specific Operation to confirm. Each operation represents a production step - like Melting, Casting, or Rolling.
>
> [SELECT OPERATION]
>
> **Step 2: BOM-Based Suggested Consumption**
>
> The system automatically calculates material requirements based on the Bill of Materials. This section shows:
> - Required materials with suggested quantities
> - Available batches for each material
> - Stock availability status
>
> The "Apply Suggestions" button auto-fills the consumption based on BOM calculations, including yield loss ratios. This reduces manual input and errors.
>
> **Step 3: Enter Production Details**
>
> I enter the Start Time and End Time of the production run.
>
> [ENTER TIMES]
>
> Next, the Produced Quantity - this is the good output from the operation.
>
> [ENTER PRODUCED QTY]
>
> And Scrap Quantity - any rejected or waste material.
>
> [ENTER SCRAP QTY]
>
> The system calculates the yield percentage automatically.
>
> **Step 4: Equipment and Operators**
>
> I select the equipment used during production. Multiple equipment can be selected for operations that span multiple machines.
>
> [SELECT EQUIPMENT]
>
> And the operators involved in this production run.
>
> [SELECT OPERATORS]
>
> **Step 5: Process Parameters**
>
> For certain operations, we capture process parameters like temperature, pressure, or speed. These are configured per operation type and have validation rules with minimum and maximum values.
>
> **Step 6: Delay Tracking**
>
> If there was any delay during production, I enter the duration and select a reason from the predefined list.
>
> When I click Confirm, the system:
> 1. Creates a Production Confirmation record
> 2. Generates a new output batch with a configurable batch number
> 3. Updates consumed materials to CONSUMED state
> 4. Creates batch relationships for traceability
> 5. Updates the operation status to CONFIRMED
> 6. Sets the next operation to READY
> 7. Records everything in the audit trail
>
> All of this happens in a single transaction to ensure data integrity.

---

## CHAPTER 6: INVENTORY MANAGEMENT (5:45 - 7:00)

### Screen: Inventory List

**VOICEOVER:**

> The Inventory module tracks all materials in the system.
>
> [CLICK INVENTORY IN NAV]
>
> Each inventory item has:
> - Batch number for identification
> - Material ID
> - Type: RM for Raw Material, IM for Intermediate, FG for Finished Goods, or WIP for Work in Progress
> - Quantity with unit of measure
> - Current state
> - Location in the facility
>
> Materials can be in several states:
> - **AVAILABLE**: Ready for use in production
> - **CONSUMED**: Used in a production operation
> - **BLOCKED**: Temporarily held, cannot be used
> - **SCRAPPED**: Permanently removed from inventory
> - **ON_HOLD**: Under quality or other investigation
>
> With server-side pagination, even large inventories are manageable. Use the filters to narrow down by state or type.
>
> [DEMONSTRATE FILTERS]
>
> **Blocking Inventory**
>
> If I need to prevent material from being used, I click Block.
>
> [CLICK BLOCK BUTTON]
>
> A reason must be provided - this creates an audit trail. Common reasons include quality issues, contamination concerns, or pending investigation.
>
> [SHOW MODAL]
>
> Blocked items display their block reason directly in the table.
>
> **Unblocking**
>
> When the issue is resolved, clicking Unblock returns the material to AVAILABLE state.
>
> **Scrapping**
>
> For material that cannot be used, the Scrap action permanently removes it from available inventory. This action cannot be undone, so a confirmation with reason is required.

---

## CHAPTER 7: BATCH TRACEABILITY (7:00 - 8:00)

### Screen: Batches List

**VOICEOVER:**

> Batch Traceability is critical for quality management and regulatory compliance.
>
> [CLICK BATCHES IN NAV]
>
> Each batch has a unique number generated based on configurable patterns. The batch number can include prefixes, date formats, and sequences specific to operation types or products.
>
> Let me view a batch's details.
>
> [CLICK ON BATCH]
>
> The Batch Detail screen shows all the information about this batch: material, quantity, status, and when it was created.
>
> The key feature here is the Genealogy view.
>
> [CLICK GENEALOGY TAB]
>
> Genealogy shows the complete history of this batch:
> - **Parent batches**: The input materials that were consumed to create this batch
> - **Child batches**: Any batches produced from this one in subsequent operations
> - **Quantity consumed and produced** at each step
> - **Operations** where transformations occurred
>
> This forward and backward traceability is essential for:
> - Quality investigations: "What materials went into this product?"
> - Recall management: "What finished products contain this material?"
> - Yield analysis: "How efficient was this production run?"
>
> The system supports SPLIT and MERGE relationships - one batch can split into multiple outputs, or multiple inputs can merge into one output.

---

## CHAPTER 8: HOLD MANAGEMENT (8:00 - 8:45)

### Screen: Holds List

**VOICEOVER:**

> The Holds module manages temporary blocks on various entities.
>
> [CLICK HOLDS IN NAV]
>
> Active holds prevent production activities on the held items. You can place holds on:
> - Orders
> - Operations
> - Batches
> - Inventory
> - Equipment
>
> **Applying a Hold**
>
> [CLICK APPLY HOLD]
>
> Select the entity type and specific item. Common hold reasons include:
> - Equipment breakdown
> - Quality inspection required
> - Material shortage
> - Operator unavailability
>
> Add detailed comments for investigation purposes.
>
> **Releasing a Hold**
>
> When the issue is resolved, click Release.
>
> [CLICK RELEASE]
>
> Release comments document what was done to resolve the issue. The item returns to its previous state and can be used in production.
>
> All hold activities are recorded in the audit trail with timestamps and user information.

---

## CHAPTER 9: EQUIPMENT MANAGEMENT (8:45 - 9:15)

### Screen: Equipment List

**VOICEOVER:**

> The Equipment module tracks all production equipment.
>
> [CLICK EQUIPMENT IN NAV]
>
> Equipment can be in four states:
> - **AVAILABLE**: Ready for use
> - **IN_USE**: Currently assigned to an operation
> - **MAINTENANCE**: Scheduled or unscheduled downtime
> - **ON_HOLD**: Blocked due to issues
>
> **Starting Maintenance**
>
> [CLICK MAINTENANCE BUTTON]
>
> Enter the reason for maintenance and expected duration. The equipment is immediately marked as unavailable and won't appear in the production form's equipment selection.
>
> **Ending Maintenance**
>
> When maintenance is complete, End Maintenance returns the equipment to AVAILABLE status.
>
> **Equipment on Hold**
>
> For issues requiring investigation, use the Hold action. This creates a formal hold record with tracking.

---

## CHAPTER 10: QUALITY INSPECTION (9:15 - 9:45)

### Screen: Quality Page

**VOICEOVER:**

> The Quality module manages inspection workflows.
>
> [CLICK QUALITY IN NAV]
>
> When a process reaches QUALITY_PENDING status, it appears here for inspection.
>
> Inspectors can:
> - **Accept**: Approve the process to continue to the next stage
> - **Reject**: Fail the process with a required reason
>
> Accepted processes move to COMPLETED status. Rejected processes are flagged and may require rework or disposition decisions.
>
> Quality decisions are fully audited with inspector information and timestamps.

---

## CHAPTER 11: CLOSING (9:45 - 10:00)

### Screen: Dashboard / Logout

**VOICEOVER:**

> That concludes our tour of the MES Production Confirmation system.
>
> We've covered:
> - Secure authentication with JWT tokens
> - Dashboard with real-time metrics
> - Order management with pagination and filtering
> - Production confirmation with BOM integration
> - Inventory management with state tracking
> - Batch traceability for quality and compliance
> - Hold and equipment management
> - Quality inspection workflows
>
> The system provides complete traceability through comprehensive audit trails, supports flexible batch numbering configurations, and integrates BOM calculations for efficient production workflows.
>
> To log out, click the Logout button.
>
> [CLICK LOGOUT]
>
> Thank you for watching this demonstration.

---

## Recording Instructions

### Prerequisites
1. Backend running in demo mode: `./gradlew bootRun --args="--spring.profiles.active=demo"`
2. Frontend running: `npm start` in frontend directory
3. Playwright installed for recording

### Recording Commands
```bash
# Record using existing demo script with text overlays
node e2e/record-demo-video.js

# Record user journey
node e2e/record-user-journey.js
```

### Post-Production
1. Export video from `e2e/output/videos/`
2. Add voiceover using this script
3. Add background music (optional)
4. Export final video in MP4 format

---

## Scripts Summary

| Script | Purpose | Command |
|--------|---------|---------|
| `run-demo.sh` | Start backend in demo mode | `./run-demo.sh` |
| `e2e/run-all-tests.js` | Run all E2E tests | `node e2e/run-all-tests.js` |
| `e2e/record-demo-video.js` | Record demo with text overlays | `node e2e/record-demo-video.js` |
| `e2e/record-user-journey.js` | Record user journey video | `node e2e/record-user-journey.js` |
| `frontend/npm start` | Start frontend dev server | `cd frontend && npm start` |
| `frontend/npm test` | Run frontend tests | `cd frontend && npm test` |
| `backend/gradlew test` | Run backend tests | `cd backend && ./gradlew test` |
| `backend/gradlew bootRun` | Start backend | `cd backend && ./gradlew bootRun` |

---

**Script Version:** 1.0
**Created:** 2026-02-04
**For:** MES Production Confirmation POC Demo
