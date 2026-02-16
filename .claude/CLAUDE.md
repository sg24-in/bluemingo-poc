# MES Production Confirmation POC - Project Context

## Split File Index

| File | Content |
|------|---------|
| **CLAUDE.md** | Core rules, project overview, conventions (this file) |
| `.claude/CLAUDE-database.md` | Database setup, SQL patches, schema management |
| `.claude/CLAUDE-testing.md` | Testing commands, E2E structure, demo video tools |
| `.claude/CLAUDE-api.md` | All API endpoints reference |
| `.claude/CLAUDE-changelog.md` | Implementation history |

---

## Session Persistence

**On session start, read `.claude/TASKS.md` for current work status.**

| File | Purpose |
|------|---------|
| `.claude/TASKS.md` | **Active tasks, session log, next steps** |
| `prompts/YYYY-MM-DD.md` | **Prompt & session history (daily logs)** |
| `documents/MES-Development-Session-Log.md` | **Permanent historical record** |
| `documents/reference/` | **Technical reference docs (keep updated!)** |

### Resuming Work
1. Read `.claude/TASKS.md` for current sprint and in-progress tasks
2. Read latest `prompts/YYYY-MM-DD.md` for recent instruction context
3. Check "Next Steps" section for immediate actions
4. Update task status as you work

### Prompt History (MANDATORY)

After EVERY user instruction, update `prompts/YYYY-MM-DD.md`:
```markdown
### #N - Short description
**Instruction:** "exact user instruction or summary"
**Action:** What was done
**Outcome:** Result, files created/modified, status
```

### Session End Logging

Update **both** files at session end:
1. **`.claude/TASKS.md`** — task status changes, next steps
2. **`documents/MES-Development-Session-Log.md`** — permanent record with files changed, decisions, test status

---

## Documentation Maintenance (MANDATORY)

> **NO task is DONE unless ALL affected reference documents are updated.**

| # | Document | Update When |
|---|----------|-------------|
| 1 | `documents/reference/MES-Controllers-Endpoints-Reference.md` | Any REST endpoint change |
| 2 | `documents/reference/MES-Services-Methods-Reference.md` | Any service method change |
| 3 | `documents/reference/MES-Entity-DTO-Reference.md` | Any entity/DTO change |
| 4 | `documents/reference/MES-Database-Schema-Reference.md` | Any SQL patch or table change |
| 5 | `documents/reference/MES-Frontend-Pages-Reference.md` | Any route/component/module change |
| 6 | `documents/reference/MES-Validation-Rules.md` | Any validation rule change |
| 7 | `documents/reference/MES-API-Reference.md` | Any API endpoint change |
| 8 | `documents/MES-Functional-Document-Complete.md` | Major feature additions |

**Quick lookup — change type → docs to update:**
- Entity/DTO → #3 + #4
- REST endpoint → #1 + #7
- Service method → #2
- Validation → #6
- SQL patch → #4
- Angular route/component → #5
- Major feature → #8

---

## Project Overview

**Name:** MES Production Confirmation POC (Bluemingo POC)
**Purpose:** Production confirmation workflows, material consumption tracking, batch traceability

### Tech Stack
- **Backend:** Spring Boot 3.2, Java 17, PostgreSQL 14+, JPA/Hibernate, JWT (JJWT 0.12.3), Gradle 8.5
- **Frontend:** Angular 17 (Module-based, NOT standalone), Hash routing (`/#/path`), RxJS 7.8, Custom CSS
- **Testing:** JUnit 5, Karma/Jasmine, Playwright

### Layouts
- `MainLayoutComponent` — header + content (dashboard, orders, production, inventory, batches, holds, equipment)
- `AdminLayoutComponent` — header + sidebar + content (manage/* routes)

### Frontend Route Structure
```
/login → Auth (no layout)
Main: /dashboard, /orders, /production, /inventory, /batches, /holds, /equipment
Admin: /manage/customers, /manage/products, /manage/materials, /manage/processes,
       /manage/routing, /manage/equipment, /manage/operators, /manage/bom,
       /manage/users, /manage/config, /manage/audit
```

## Project Structure

```
backend/src/main/java/com/mes/production/
  config/ controller/ dto/ entity/ repository/ security/ service/ service/patch/
frontend/src/app/
  core/ (services, guards, interceptors)
  shared/ (components, layouts, models)
  features/ (auth, dashboard, orders, production, inventory, batches, holds,
             equipment, quality, customers, materials, products)
e2e/ (config, tests, utils, output)
documents/ (specs, reference docs)
```

## Running the Application

```bash
# Backend (production)
cd backend && ./gradlew bootRun                                    # Port 8080

# Backend (test mode — resets schema)
cd backend && ./gradlew bootRun -Dspring.profiles.active=test

# Frontend
cd frontend && npm install && npm start                            # Port 4200

# Build & integrate frontend into Spring Boot
cd backend && ./gradlew integrateFrontend
```

**POC Credentials:** admin@mes.com / admin123

---

## Development Conventions

### Java (Backend)
- Java 17 features, constructor injection, DTOs for API (no entities in controllers)
- Service layer for business logic, Repository layer for data access

### Angular (Frontend)
- **Module-based** (NOT standalone components)
- Lazy load via `loadChildren` in `app-routing.module.ts`
- SharedModule for reusable components (`<app-pagination>`, modals)
- Barrel exports in `shared/models/index.ts`

### Git
- Branches: `feature/`, `fix/`, `refactor/`
- Commit messages: imperative mood, concise
- PR titles: under 70 characters

### Database Changes (CRITICAL)
- **EVERY** entity field change → SQL patch in `patches/` + update `demo/schema.sql`
- See `.claude/CLAUDE-database.md` for full conventions

---

## Status State Machines

### Operation Status
```
NOT_STARTED → READY → IN_PROGRESS → CONFIRMED
                ↓
              ON_HOLD ↔ READY
```

### Inventory State
```
AVAILABLE → CONSUMED / RESERVED / PRODUCED / BLOCKED / SCRAPPED
```

### Equipment Status
```
AVAILABLE → IN_USE / MAINTENANCE / ON_HOLD
```

---

## Key Workflows

### Production Confirmation
1. Select Order (READY status) → Select Input Materials → Enter Details → Generate Output Batch → Confirm

### Batch Traceability
- Forward/backward tracing, SPLIT/MERGE supported

### Hold Management
- Apply to: Orders, Operations, Batches, Inventory, Equipment
- Configurable reasons, release with comments, audit trail

---

## Help Content

| Page | Key Info |
|------|----------|
| Receive Material | Creates Batch (QUALITY_PENDING) + Inventory (AVAILABLE) |
| Production Confirm | Consumes inputs → produces output batches |
| Inventory | States: AVAILABLE, ON_HOLD, BLOCKED, CONSUMED |
| Batches | Statuses: QUALITY_PENDING, AVAILABLE, PRODUCED, CONSUMED, BLOCKED, SCRAPPED |
| Holds | Blocks entities temporarily; release with reason |
| Orders | Line items → processes → operations (confirm in sequence) |

---

## Documentation Index

- `docs/DEV-GUIDE.md` — Development setup
- `docs/USER-GUIDE.md` — User journey with screenshots
- `documents/MES-POC-Specification.md` — POC objectives
- `documents/MES-Functional-Requirements-Document.md` — Detailed FRD
- `documents/MES-Requirements-Gaps-Analysis.md` — Gaps analysis
- `documents/database-schema.puml` — Complete DB ER diagram (42 tables)

## Git Info

- **Branch:** main
- **Initial Commit:** 6dd8a8d
