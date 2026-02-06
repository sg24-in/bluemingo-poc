# MES Spec Alignment - Migration Plan

**Date:** 2026-02-06
**Goal:** Align current implementation with MES Consolidated Specification

---

## 1. Entity Renaming Strategy

| Current Entity | Spec Entity | Action |
|----------------|-------------|--------|
| `ProcessTemplate` | `Process` (design-time) | Rename → `Process` |
| `Process` | N/A (runtime tracking) | Rename → `ProcessInstance` |

### Reasoning:
- Spec shows `Process` as design-time (no OrderLineItem FK)
- We need runtime tracking (current `Process` with orderLineItem FK)
- Solution: Use spec naming for design-time, add `Instance` suffix for runtime

---

## 2. Database Changes

### Patch 028: Entity Alignment

```sql
-- 1. Rename process_templates → processes (design-time)
ALTER TABLE process_templates RENAME TO processes_design;

-- 2. Rename current processes → process_instances (runtime)
ALTER TABLE processes RENAME TO process_instances;

-- 3. Final rename to match spec
ALTER TABLE processes_design RENAME TO processes;

-- 4. Update FKs in routing table
-- routing.process_id should point to design-time processes
-- routing.process_template_id is now redundant

-- 5. Add process_id FK to process_instances (link runtime to design-time)
ALTER TABLE process_instances ADD COLUMN process_id BIGINT REFERENCES processes(process_id);

-- 6. Rename columns for consistency
ALTER TABLE processes RENAME COLUMN template_id TO process_id;
ALTER TABLE processes RENAME COLUMN template_name TO process_name;
ALTER TABLE processes RENAME COLUMN template_code TO process_code;
```

---

## 3. Entity Changes

### 3.1 New `Process` Entity (Design-Time)

From current `ProcessTemplate`, rename to `Process`:

```java
@Entity
@Table(name = "processes")
public class Process {
    @Id
    @Column(name = "process_id")
    private Long processId;

    @Column(name = "process_name")
    private String processName;

    @Column(name = "process_code")
    private String processCode;

    private String description;
    private String productSku;
    private String status;  // DRAFT, ACTIVE, INACTIVE
    private String version;
    // ... routing steps via Routing
}
```

### 3.2 New `ProcessInstance` Entity (Runtime)

From current `Process`, rename to `ProcessInstance`:

```java
@Entity
@Table(name = "process_instances")
public class ProcessInstance {
    @Id
    @Column(name = "process_instance_id")
    private Long processInstanceId;

    @ManyToOne
    @JoinColumn(name = "order_line_id")
    private OrderLineItem orderLineItem;

    @ManyToOne
    @JoinColumn(name = "process_id")
    private Process process;  // Link to design-time

    private Integer stageSequence;
    private String status;  // READY, IN_PROGRESS, QUALITY_PENDING, COMPLETED, REJECTED, ON_HOLD
    private String usageDecision;  // PENDING, ACCEPT, REJECT

    @OneToMany(mappedBy = "processInstance")
    private List<Operation> operations;
}
```

### 3.3 Update `Routing` Entity

```java
@Entity
@Table(name = "routing")
public class Routing {
    @Id
    private Long routingId;

    @ManyToOne
    @JoinColumn(name = "process_id")
    private Process process;  // Now points to design-time Process

    // Remove processTemplateId (redundant)

    private String routingName;
    private String routingType;
    private String status;
}
```

### 3.4 Update `Operation` Entity

```java
@Entity
@Table(name = "operations")
public class Operation {
    @Id
    private Long operationId;

    @ManyToOne
    @JoinColumn(name = "process_instance_id")  // Changed from process_id
    private ProcessInstance processInstance;

    private Long routingStepId;
    private String operationName;
    private String operationType;
    private String status;
    // ...
}
```

---

## 4. File Changes Required

### 4.1 Backend - Entities

| File | Action |
|------|--------|
| `ProcessTemplate.java` | Rename → `Process.java`, update table name |
| `Process.java` | Rename → `ProcessInstance.java`, update table name |
| `Routing.java` | Update process FK reference |
| `Operation.java` | Update process FK → processInstance FK |

### 4.2 Backend - Repositories

| File | Action |
|------|--------|
| `ProcessTemplateRepository.java` | Rename → `ProcessRepository.java` |
| `ProcessRepository.java` | Rename → `ProcessInstanceRepository.java` |

### 4.3 Backend - Services

| File | Action |
|------|--------|
| `ProcessTemplateService.java` | Rename → `ProcessService.java` |
| `ProcessService.java` | Rename → `ProcessInstanceService.java` |
| `OperationInstantiationService.java` | Update references |
| `ProductionService.java` | Update references |
| `RoutingService.java` | Update references |

### 4.4 Backend - Controllers

| File | Action |
|------|--------|
| `ProcessTemplateController.java` | Rename → `ProcessController.java` |
| `ProcessController.java` | Rename → `ProcessInstanceController.java` |

### 4.5 Backend - DTOs

| File | Action |
|------|--------|
| `ProcessTemplateDTO.java` | Rename → `ProcessDTO.java` |
| `ProcessDTO.java` | Rename → `ProcessInstanceDTO.java` |

### 4.6 Frontend

| File | Action |
|------|--------|
| `process-template.model.ts` | Rename → `process.model.ts` |
| `process-templates/` folder | Rename → `processes/` |
| `api.service.ts` | Update method names |
| Routes and navigation | Update paths |

---

## 5. API Endpoint Changes

| Current | New |
|---------|-----|
| `/api/process-templates` | `/api/processes` |
| `/api/process-templates/{id}` | `/api/processes/{id}` |
| `/api/processes` (runtime) | `/api/process-instances` |
| `/api/processes/{id}` (runtime) | `/api/process-instances/{id}` |

---

## 6. Migration Steps

### Step 1: Create SQL Patch (028)
- Rename tables
- Update FK references
- Add new columns

### Step 2: Update Backend Entities
- Rename files
- Update class names
- Update annotations
- Update relationships

### Step 3: Update Backend Repositories
- Rename files
- Update class names
- Update query methods

### Step 4: Update Backend Services
- Rename files
- Update class names
- Update method references

### Step 5: Update Backend Controllers
- Rename files
- Update class names
- Update endpoint paths

### Step 6: Update Backend Tests
- Update test class names
- Update references

### Step 7: Update Frontend
- Rename model files
- Rename component folders
- Update API service
- Update routes

### Step 8: Run Tests
- Backend tests
- Frontend tests
- E2E tests

---

## 7. Execution Order

1. **Backup database**
2. **Create and apply SQL patch**
3. **Backend entity changes**
4. **Backend repository changes**
5. **Backend service changes**
6. **Backend controller changes**
7. **Backend DTO changes**
8. **Backend test updates**
9. **Verify backend compiles and tests pass**
10. **Frontend model changes**
11. **Frontend component changes**
12. **Frontend API service changes**
13. **Frontend route changes**
14. **Verify frontend compiles**
15. **Run full test suite**

---

## 8. Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Data loss | Backup database before migration |
| Broken references | Comprehensive find/replace |
| Test failures | Run tests after each step |
| API breaking changes | Update all clients |

---

**Ready to proceed with implementation?**
