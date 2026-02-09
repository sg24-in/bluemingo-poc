# MES Production Confirmation POC - Specification

**Document Version:** 1.0
**Project:** Bluemingo MES POC

---

## 1. Project Overview

### 1.1 Purpose
This Proof of Concept (POC) demonstrates a Manufacturing Execution System (MES) focused on production confirmation workflows, material consumption tracking, and batch traceability for steel manufacturing environments.

### 1.2 POC Scope
The POC covers the following core screens:
- **Login** - User authentication
- **Dashboard** - Production metrics and status overview
- **Orders** - Order management and tracking
- **Production Confirmation** - Confirm production with material consumption
- **Batches/Traceability** - Batch genealogy and tracking

### 1.3 Out of Scope
- ERP integration
- Real-time machine data collection (IoT)
- Advanced scheduling and planning
- Detailed costing and financials
- Multi-plant/multi-site support
- Administrative configuration screens

---

## 2. Business Objectives

| Objective | Success Criteria |
|-----------|------------------|
| Demonstrate production confirmation workflow | Complete end-to-end confirmation with all data captured |
| Show batch traceability | Forward and backward genealogy navigation |
| Validate inventory state management | Track all inventory state transitions |
| Enable equipment/operator tracking | Associate resources with production |

---

## 3. Key Workflows

### 3.1 Production Confirmation Workflow

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  Select Order   │────▶│ Select Operation│────▶│ Select Materials│
│  (READY status) │     │ (READY status)  │     │ (Input batches) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Confirm      │◀────│ Enter Quantities│◀────│ Enter Parameters│
│  (Submit form)  │     │ (Good/Scrap qty)│     │ (Temp, pressure) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────────┐
│                      System Actions:                             │
│  • Create output batch with auto-generated number               │
│  • Create batch relations (parent → child)                      │
│  • Update input inventory states to CONSUMED                    │
│  • Create output inventory record                               │
│  • Update operation status to CONFIRMED                         │
│  • Log audit trail entries                                      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Batch Genealogy Workflow

```
Forward Traceability:
Raw Material → Intermediate → Finished Good
    ↓              ↓              ↓
 BATCH-RM-001 → BATCH-IM-001 → BATCH-FG-001

Backward Traceability:
Finished Good → Intermediate → Raw Material
    ↓              ↓              ↓
 BATCH-FG-001 → BATCH-IM-001 → BATCH-RM-001
```

### 3.3 Inventory State Transitions

```
                    ┌──────────────┐
                    │   PRODUCED   │
                    └──────┬───────┘
                           │
                           ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│   RESERVED   │◀───│  AVAILABLE   │───▶│   CONSUMED   │
└──────────────┘    └──────┬───────┘    └──────────────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
       ┌──────────┐  ┌──────────┐  ┌──────────┐
       │  BLOCKED │  │ SCRAPPED │  │ ON_HOLD  │
       └──────────┘  └──────────┘  └──────────┘
```

---

## 4. Technical Architecture

### 4.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (Angular 17)                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │Dashboard│ │ Orders  │ │Production│ │ Batches │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
                           │ HTTP/REST
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Backend (Spring Boot 3.2)                  │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐           │
│  │ Controllers │ │  Services   │ │Repositories │           │
│  └─────────────┘ └─────────────┘ └─────────────┘           │
│                         │                                    │
│              ┌──────────┴──────────┐                        │
│              │    JWT Security     │                        │
│              └─────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
                           │ JPA/Hibernate
                           ▼
┌─────────────────────────────────────────────────────────────┐
│              Database (PostgreSQL / H2 Demo)                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Orders  │ │ Batches │ │Inventory│ │  Audit  │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Technology Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Frontend | Angular | 17.x |
| Frontend HTTP | Angular HttpClient | 17.x |
| Frontend Rx | RxJS | 7.8.0 |
| Backend | Spring Boot | 3.2.x |
| Backend Language | Java | 17 |
| Security | JWT (JJWT) | 0.12.3 |
| ORM | Hibernate/JPA | 6.x |
| Database (Prod) | PostgreSQL | 14+ |
| Database (Demo) | H2 | 2.x |
| Build | Gradle | 8.5 |
| Testing | JUnit 5 / Jasmine | - |
| E2E Testing | Playwright | - |

---

## 5. POC Screens

### 5.1 Login Screen
- Email/password authentication
- JWT token generation
- Redirect to Dashboard on success

### 5.2 Dashboard Screen
- Operations status summary (Ready, In Progress, Confirmed)
- Key metrics (Orders, Today's Production, Active Batches)
- Orders ready for production table
- Recent confirmations activity
- Recent batches table
- Quick actions navigation

### 5.3 Orders Screen
- List all orders with status filtering
- Order detail with line items
- Operations timeline per order
- Status: DRAFT, PENDING, IN_PROGRESS, COMPLETED, CANCELLED

### 5.4 Production Confirmation Screen
- Order/operation selection
- Input material selection (available inventory/batches)
- Process parameter entry
- Equipment and operator selection
- Output quantity entry
- Batch number preview
- Confirmation submission

### 5.5 Batches Screen
- List all batches with status filtering
- Batch detail with genealogy
- Forward/backward traceability
- Split and merge operations
- Batch approval workflow

---

## 6. Data Model Summary

### 6.1 Core Entities

| Entity | Purpose | Key Fields |
|--------|---------|------------|
| User | Authentication | email, password, role |
| Order | Customer orders | orderNumber, status, customerName |
| OrderLineItem | Products in order | productSku, quantity, status |
| Process | Production stage | name, sequence, operationType |
| Operation | Process step | name, status, sequence |
| ProductionConfirmation | Production record | quantities, times, parameters |
| Inventory | Material tracking | materialId, quantity, state |
| Batch | Trackable unit | batchNumber, quantity, status |
| BatchRelation | Genealogy | parentBatch, childBatch, relationType |
| Equipment | Machines | name, status, type |
| Operator | Personnel | name, employeeId |

---

## 7. Demo Credentials

| User | Email | Password | Role |
|------|-------|----------|------|
| Admin | admin@mes.com | admin123 | Admin |

---

## 8. Demo Scenarios

### 8.1 Scenario 1: Complete Production Confirmation
1. Login as admin@mes.com
2. Navigate to Orders, select IN_PROGRESS order
3. Navigate to Production Confirmation
4. Select order and READY operation
5. Select input materials (batches)
6. Enter process parameters
7. Enter equipment and operators
8. Enter produced quantity
9. Submit confirmation
10. Verify: New batch created, inventory updated, genealogy linked

### 8.2 Scenario 2: Batch Traceability
1. Navigate to Batches
2. Select a finished good batch
3. View genealogy
4. Trace backward to raw materials
5. Verify complete chain of custody

---

## 9. Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Feature Completeness | 90%+ | Implemented vs specified features |
| Test Coverage | 80%+ | Unit + integration tests |
| UI Responsiveness | <2s | Page load times |
| Data Integrity | 100% | Batch genealogy accuracy |

---

*Bluemingo MES Production Confirmation POC*
