# MES Template/Runtime Separation - Implementation Guide

**Date:** 2026-02-07
**Status:** Implementation In Progress

---

## Executive Summary

This document describes the architectural correction to properly separate TEMPLATE (design-time) and RUNTIME (execution-time) entities in the MES system.

### Key Principle
- **TEMPLATE entities** are reusable definitions created by engineers
- **RUNTIME entities** are execution instances created when orders are processed
- Templates NEVER reference runtime instances
- Runtime instances reference templates for genealogy

---

## Entity Classification

### TEMPLATE Entities (Design-Time)

| Entity | Purpose | Status Values |
|--------|---------|---------------|
| **Process** | Manufacturing process definition | DRAFT, ACTIVE, INACTIVE |
| **Routing** | Sequence of steps for a process | DRAFT, ACTIVE, INACTIVE, ON_HOLD |
| **RoutingStep** | Step definition within routing | ACTIVE, INACTIVE |
| **OperationTemplate** | Reusable operation definition (NEW) | ACTIVE, INACTIVE |
| **BillOfMaterial** | Material requirements | ACTIVE, OBSOLETE, ON_HOLD |

### RUNTIME Entities (Execution-Time)

| Entity | Purpose | Status Values |
|--------|---------|---------------|
| **Order** | Customer order | CREATED, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD |
| **OrderLineItem** | Product line within order | CREATED, READY, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD |
| **Operation** | Executable step instance | NOT_STARTED, READY, IN_PROGRESS, CONFIRMED, PARTIALLY_CONFIRMED, ON_HOLD, BLOCKED |
| **ProductionConfirmation** | Execution record | CONFIRMED, REJECTED, PARTIALLY_CONFIRMED |
| **Batch** | Material unit | AVAILABLE, CONSUMED, PRODUCED, ON_HOLD, BLOCKED, SCRAPPED |
| **Inventory** | Material at location | AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD |

---

## New Entity: OperationTemplate

### Database Schema
```sql
CREATE TABLE operation_templates (
    operation_template_id BIGSERIAL PRIMARY KEY,
    operation_name VARCHAR(100) NOT NULL,
    operation_code VARCHAR(50),
    operation_type VARCHAR(50) NOT NULL,
    quantity_type VARCHAR(20) DEFAULT 'DISCRETE',
    default_equipment_type VARCHAR(50),
    description VARCHAR(500),
    estimated_duration_minutes INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);
```

### Java Entity
`backend/src/main/java/com/mes/production/entity/OperationTemplate.java`

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/operation-templates` | List all templates |
| GET | `/api/operation-templates/active` | List active templates |
| GET | `/api/operation-templates/{id}` | Get template by ID |
| GET | `/api/operation-templates/by-type/{type}` | Get templates by type |
| GET | `/api/operation-templates/summaries` | Summaries for dropdowns |
| GET | `/api/operation-templates/types` | Distinct operation types |
| GET | `/api/operation-templates/paged` | Paginated with filters |
| POST | `/api/operation-templates` | Create template |
| PUT | `/api/operation-templates/{id}` | Update template |
| POST | `/api/operation-templates/{id}/activate` | Activate |
| POST | `/api/operation-templates/{id}/deactivate` | Deactivate |
| DELETE | `/api/operation-templates/{id}` | Soft delete |

---

## Entity Relationship Changes

### BEFORE (Incorrect)
```
RoutingStep ──FK──> Operation (runtime)  ❌ WRONG
                    ↳ Template references runtime
```

### AFTER (Correct)
```
OperationTemplate (template)
         ↑
RoutingStep ──FK──> OperationTemplate (template)  ✅ CORRECT
         ↑
Operation ──ref──> RoutingStep (for genealogy)
         ↳ operation_template_id (for genealogy)
         ↳ order_line_id (runtime parent)
```

---

## RoutingStep Changes

### Removed
- `operation_id` FK to Operation (template→runtime reference)
- Runtime status values (READY, IN_PROGRESS, COMPLETED)

### Added
- `operation_template_id` FK to OperationTemplate
- Template status values (ACTIVE, INACTIVE)

### Status Migration
| Old Status | New Status |
|------------|------------|
| READY | ACTIVE |
| IN_PROGRESS | ACTIVE |
| COMPLETED | ACTIVE |
| ON_HOLD | INACTIVE |

---

## Operation Changes

### Added Fields
- `operation_template_id` - References source template (genealogy)
- `start_time` / `end_time` - Execution timestamps

### Existing Fields (Preserved)
- `process_id` - Template reference
- `order_line_id` - Runtime parent
- `routing_step_id` - Template genealogy

---

## UI Changes Required

### 1. NEW: Operation Template Management Screen
**Location:** `/manage/operation-templates`
**Type:** Template (Admin)

**Features:**
- List all operation templates
- Create/Edit templates
- Activate/Deactivate
- Filter by type, status
- Search by name/code

**Fields to show:**
- Operation Name (required)
- Operation Code
- Operation Type (dropdown: FURNACE, CASTER, ROLLING, etc.)
- Quantity Type (DISCRETE/BATCH/CONTINUOUS)
- Default Equipment Type
- Description
- Estimated Duration (minutes)
- Status (ACTIVE/INACTIVE)

### 2. UPDATE: Routing Step Management
**Location:** `/manage/routing/{id}/edit`
**Type:** Template (Admin)

**Changes:**
- Add OperationTemplate dropdown (replaces embedded operation fields)
- Remove status field from step display (steps are always ACTIVE)
- Show inherited operation info from selected template

**Step Form Fields:**
- Sequence Number (required)
- Operation Template (dropdown - required)
- Is Parallel (checkbox)
- Mandatory (checkbox)
- Produces Output Batch (checkbox)
- Allows Split (checkbox)
- Allows Merge (checkbox)
- Target Quantity (optional)

### 3. UPDATE: Operation List Screen
**Location:** `/operations`
**Type:** Runtime (Read-Only)

**Changes:**
- Remove any "Create" or "Edit Operation" buttons
- Operations are automatically created from OrderLineItems
- Show only runtime actions: Start, Confirm, Hold, Release

### 4. UPDATE: Order Detail Screen
**Location:** `/orders/{id}`
**Type:** Runtime

**Changes:**
- Operations section is READ-ONLY in structure
- Cannot add/remove/reorder operations
- Can only start/confirm/hold operations

### 5. NO CHANGE: Production Confirmation
**Location:** `/production/confirm`
**Type:** Runtime

- Stays the same - works with Operation (runtime)

---

## Frontend Files to Create/Modify

### New Files (Operation Template Module)
```
frontend/src/app/features/operation-templates/
├── operation-templates.module.ts
├── operation-templates-routing.module.ts
├── operation-template-list/
│   ├── operation-template-list.component.ts
│   ├── operation-template-list.component.html
│   └── operation-template-list.component.css
└── operation-template-form/
    ├── operation-template-form.component.ts
    ├── operation-template-form.component.html
    └── operation-template-form.component.css
```

### New Model
```
frontend/src/app/shared/models/operation-template.model.ts
```

### API Service Updates
```typescript
// api.service.ts - Add these methods:
getOperationTemplates(): Observable<OperationTemplate[]>
getActiveOperationTemplates(): Observable<OperationTemplate[]>
getOperationTemplate(id: number): Observable<OperationTemplate>
createOperationTemplate(request: CreateOperationTemplateRequest): Observable<OperationTemplate>
updateOperationTemplate(id: number, request: UpdateOperationTemplateRequest): Observable<OperationTemplate>
activateOperationTemplate(id: number): Observable<OperationTemplate>
deactivateOperationTemplate(id: number): Observable<OperationTemplate>
```

### Routing Form Updates
```
frontend/src/app/features/routing/routing-form/
└── routing-form.component.ts
    - Add OperationTemplate dropdown to step form
    - Load operation templates on init
    - Show template details when selected
```

---

## Backend Files Created/Modified

### New Files
| File | Description |
|------|-------------|
| `entity/OperationTemplate.java` | New design-time entity |
| `repository/OperationTemplateRepository.java` | Repository with queries |
| `dto/OperationTemplateDTO.java` | Request/Response DTOs |
| `service/OperationTemplateService.java` | CRUD operations |
| `controller/OperationTemplateController.java` | REST endpoints |
| `patches/040_operation_template_separation.sql` | Database migration |

### Modified Files
| File | Changes |
|------|---------|
| `entity/RoutingStep.java` | Removed Operation ref, added OperationTemplate ref, fixed status constants |
| `entity/Operation.java` | Added operation_template_id field |

---

## Service Integration Points

### OperationInstantiationService
**Current behavior:** Creates Operations from RoutingSteps
**Required update:**
- Use OperationTemplate from RoutingStep for operation details
- Set `operation_template_id` on created Operation
- Copy name/type/code from OperationTemplate

### RoutingService
**Required update:**
- When creating RoutingStep, require OperationTemplate reference
- Validate OperationTemplate exists and is ACTIVE

### OperationService
**No changes needed** - Operations are runtime, service already handles runtime behavior

---

## Validation Checklist

After implementation, verify:

| Check | Expected |
|-------|----------|
| Can edit routing without affecting existing orders? | YES |
| Do two orders create separate Operations? | YES |
| Does UI prevent editing templates during execution? | YES |
| Does confirmation still create batches correctly? | YES |
| Is routing sequence always enforced? | YES |
| Can OperationTemplate be reused across routings? | YES |

---

## Migration Strategy

### Phase 1: Database (Complete)
- [x] Create patch 040 with operation_templates table
- [x] Migrate existing RoutingStep operation data to OperationTemplates
- [x] Add operation_template_id FK to routing_steps
- [x] Add operation_template_id FK to operations
- [x] Fix routing_steps status constraint

### Phase 2: Backend (Complete)
- [x] Create OperationTemplate entity
- [x] Create OperationTemplate repository
- [x] Create OperationTemplate DTOs
- [x] Create OperationTemplate service
- [x] Create OperationTemplate controller
- [x] Update RoutingStep entity
- [x] Update Operation entity

### Phase 3: Frontend (Pending)
- [ ] Create operation-template.model.ts
- [ ] Add OperationTemplate API methods to api.service.ts
- [ ] Create OperationTemplate module with list/form components
- [ ] Update routing-form to use OperationTemplate dropdown
- [ ] Add route to admin sidebar
- [ ] Update routing-list to show template info

### Phase 4: Service Integration (Pending)
- [ ] Update OperationInstantiationService to use OperationTemplate
- [ ] Update RoutingService for OperationTemplate validation
- [ ] Update RoutingStepDTO to include OperationTemplate

---

## Admin Sidebar Navigation

Add new menu item under "Production" section:

```
Production:
  /manage/processes       - Process Templates
  /manage/routing         - Routing Templates
  /manage/operation-templates  - Operation Templates (NEW)
  /manage/bom             - Bill of Materials
  /manage/equipment       - Equipment
  /manage/operators       - Operators
```
