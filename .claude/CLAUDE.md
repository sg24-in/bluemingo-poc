# MES Production Confirmation POC - Project Context

## Session Persistence

**IMPORTANT: On session start, read `.claude/TASKS.md` for current work status.**

| File | Purpose |
|------|---------|
| `.claude/CLAUDE.md` | Project context, conventions, architecture |
| `.claude/TASKS.md` | **Active tasks, session log, next steps** |
| `prompts/YYYY-MM-DD.md` | **Prompt & session history (daily logs)** |
| `documents/MES-Development-Session-Log.md` | **Permanent historical record of all sessions** |
| `documents/MES-Requirements-Gaps-Analysis.md` | Requirements gaps to implement |
| `documents/reference/` | **Technical reference docs (keep updated!)** |

### Resuming Work
1. Read `.claude/TASKS.md` for current sprint and in-progress tasks
2. Read latest `prompts/YYYY-MM-DD.md` for recent instruction context
3. Check "Next Steps" section for immediate actions
4. Update task status as you work
5. Update TASKS.md before session ends with progress

### Prompt & Session History (MANDATORY)

**IMPORTANT: After EVERY user instruction, update `prompts/YYYY-MM-DD.md` with the instruction and outcome.**

This is a **BLOCKING requirement** - not optional. The prompt history serves as:
- Recovery context when context overflow or session interrupts occur
- Complete audit trail of all instructions given to the system
- Session progress tracker for continuity across conversations

**Rules:**
1. **On session start:** Create or open `prompts/YYYY-MM-DD.md` for today's date
2. **After each instruction:** Append a numbered entry with the instruction text and what was done
3. **On session end:** Update the "Session Progress" section with files changed and current state
4. **On context overflow recovery:** Read the latest prompts file to reconstruct what was happening

**Entry Format:**
```markdown
### #N - Short description
**Instruction:** "exact user instruction or summary"
**Action:** What was done
**Outcome:** Result, files created/modified, status
```

**Location:** `prompts/` folder, one file per day named `YYYY-MM-DD.md`

### Session Logging (IMPORTANT)

**At session end, update both files:**

1. **`.claude/TASKS.md`** - Update with:
   - Task status changes (PENDING → DONE)
   - Current session changes section
   - Next steps for continuity

2. **`documents/MES-Development-Session-Log.md`** - Add permanent record of:
   - Session date and focus areas
   - Key accomplishments with file changes
   - Implementation decisions and rationale
   - Test status summary
   - Pending work for future sessions

**Session Log Structure:**
```markdown
## Session: YYYY-MM-DD

### Session Overview
**Primary Focus:** [Phase/Feature name]
**Key Accomplishments:**
- [Major change 1]
- [Major change 2]

### [Feature/Phase Name] - [STATUS]
**Files Modified:**
- `path/to/file.java` - [What was changed]

### Test Status Summary
| Suite | Tests | Status |
|-------|-------|--------|
| Backend | X | PASS/FAIL |
| Frontend | X | PASS/FAIL |
```

This ensures traceability and allows future sessions to understand the development history.

### Documentation Maintenance (MANDATORY - TASK IS NOT COMPLETE WITHOUT THIS)

> **STRICT RULE: NO development task is considered DONE unless ALL affected reference documents are updated.**
> **This is a BLOCKING requirement — not optional, not "nice to have". Treat doc updates as part of the code change itself.**

**Reference Documents (MUST be kept in sync with code at ALL times):**

| # | Document | Update When | What to Update |
|---|----------|-------------|----------------|
| 1 | `documents/reference/MES-Controllers-Endpoints-Reference.md` | Adding/modifying ANY REST endpoint or controller | Controller class, HTTP method, path, params, request/response DTOs |
| 2 | `documents/reference/MES-Services-Methods-Reference.md` | Adding/modifying ANY service method | Method signature, parameters, return type, business logic summary |
| 3 | `documents/reference/MES-Entity-DTO-Reference.md` | Adding/modifying ANY JPA entity, field, or DTO | Entity fields, types, annotations, relationships, DTO fields |
| 4 | `documents/reference/MES-Database-Schema-Reference.md` | Creating ANY SQL patch or modifying tables | Patch entry, table columns, constraints, indexes, relationships |
| 5 | `documents/reference/MES-Frontend-Pages-Reference.md` | Adding/modifying ANY route, component, or module | Route path, component name, module, inputs/outputs, services used |
| 6 | `documents/reference/MES-Validation-Rules.md` | Adding/modifying ANY validation rule in services | Rule description, error message, code location |
| 7 | `documents/reference/MES-API-Reference.md` | Adding/modifying ANY API endpoint | Endpoint path, method, params, auth requirements |
| 8 | `documents/MES-Functional-Document-Complete.md` | Major feature additions or workflow changes | Feature description, workflows, business rules |

**Mandatory Update Checklist (apply ALL that match):**

| Change Type | Documents to Update |
|-------------|-------------------|
| New/modified JPA entity | #3 Entity Reference + #4 Database Schema |
| New/modified DTO | #3 Entity Reference |
| New/modified REST endpoint | #1 Controllers Reference + #7 API Reference |
| New/modified service method | #2 Services Reference |
| New/modified validation rule | #6 Validation Rules |
| New SQL patch | #4 Database Schema |
| New/modified Angular route | #5 Frontend Pages Reference |
| New/modified Angular component | #5 Frontend Pages Reference |
| New/modified Angular service method | #5 Frontend Pages Reference |
| Major feature addition | #8 Functional Document |

**Enforcement Rules:**
1. **Before marking any task as DONE** → verify all affected reference docs are updated
2. **Before creating a git commit** → ensure reference doc updates are included in the same commit
3. **At session end** → review all code changes and confirm corresponding doc updates were made
4. **If you forget** → go back and update the docs BEFORE moving to the next task
5. **When in doubt** → update the doc. It's better to over-document than under-document

---

## Project Overview

**Name:** MES Production Confirmation POC (Bluemingo POC)
**Type:** Manufacturing Execution System - Proof of Concept
**Purpose:** Production confirmation workflows, material consumption tracking, and batch traceability for manufacturing environments

## Technology Stack

### Backend
- **Framework:** Spring Boot 3.2
- **Language:** Java 17
- **Database:** PostgreSQL 14+ (all environments)
- **ORM:** Spring Data JPA / Hibernate
- **Security:** JWT Token Authentication (JJWT 0.12.3)
- **Build:** Gradle 8.5
- **Schema Management:** SQL Patch System

### Frontend
- **Framework:** Angular 17 (Module-based architecture)
- **Routing:** Hash-based (`useHash: true`) - URLs are `/#/dashboard`, `/#/orders`, etc.
- **Layouts:** Two layout wrappers for authenticated pages
  - `MainLayoutComponent` - Main pages (header + content)
  - `AdminLayoutComponent` - Admin pages (header + sidebar + content)
- **HTTP:** Angular HttpClient with RxJS 7.8.0
- **Styling:** Custom CSS

### Frontend Route Structure
```
/ → redirect to /dashboard
/login → Auth module (no layout)
MainLayoutComponent (with header):
  /dashboard, /orders, /production, /inventory, /batches, /holds, /equipment
AdminLayoutComponent (with header + sidebar):
  Master Data:
    /manage/customers, /manage/products, /manage/materials
  Production:
    /manage/processes, /manage/routing, /manage/equipment, /manage/operators, /manage/bom
  System:
    /manage/users, /manage/config, /manage/audit
```

### Testing
- **Backend Tests:** JUnit 5 with Spring Boot Test
- **Frontend Tests:** Karma/Jasmine
- **E2E Tests:** Playwright
- **Test Database:** PostgreSQL `mes_test`
- **Test Runner:** `run-tests.bat` / `run-tests.sh`

## Project Structure

```
bluemingo-poc/
├── .claude/                 # Claude Code instructions
│   └── CLAUDE.md           # This file - project context
├── backend/
│   └── src/main/java/com/mes/production/
│       ├── config/          # Security, exception handling
│       ├── controller/      # REST API endpoints
│       ├── dto/             # Data Transfer Objects
│       ├── entity/          # JPA Entities (12 entities)
│       ├── repository/      # Spring Data repositories
│       ├── security/        # JWT authentication
│       └── service/         # Business logic
│           └── patch/       # SQL patch service
├── frontend/
│   └── src/app/
│       ├── core/            # Services, Guards, Interceptors
│       ├── shared/          # Shared components, layouts, models
│       │   ├── components/  # Header, MainLayout, AdminLayout, Pagination, Modals
│       │   │   ├── material-selection-modal/  # Material picker for production
│       │   │   └── apply-hold-modal/          # Quick hold action modal
│       │   └── models/      # TypeScript interfaces
│       └── features/        # Feature modules
│           ├── auth/
│           ├── dashboard/
│           ├── orders/         # Orders list, detail, form (create/edit)
│           ├── production/
│           ├── inventory/
│           ├── batches/
│           ├── holds/
│           ├── equipment/
│           ├── quality/
│           ├── customers/      # NEW: Customer CRUD (list, form)
│           ├── materials/      # NEW: Material CRUD (list, form)
│           └── products/       # NEW: Product CRUD (list, form)
├── e2e/                     # E2E test suite
│   ├── config/              # Test configuration
│   ├── tests/               # Feature-based test files
│   ├── utils/               # Test utilities
│   ├── output/              # Screenshots & videos
│   │   ├── screenshots/     # Test screenshots
│   │   └── comprehensive-demo/  # Demo video output
│   ├── record-comprehensive-demo.js  # 33-scene demo recorder
│   ├── create-synced-voiceover.js    # Voiceover generator
│   ├── run-all-tests.js     # Master test runner
│   └── record-user-journey.js        # User journey recorder
├── docs/                    # Documentation
│   ├── DEV-GUIDE.md        # Development instructions
│   └── USER-GUIDE.md       # User journey documentation
└── documents/               # Specifications & requirements
```

## Core Entities

1. **User** - Authentication
2. **Customer** - Customer master data (NEW)
3. **Material** - Material master data with types RM/IM/FG/WIP (NEW)
4. **Product** - Product master data with SKU (NEW)
5. **Order** - Customer orders with status
3. **OrderLineItem** - Products within orders
4. **Process** - Production stages (Melting, Casting, Rolling)
5. **Operation** - Steps within a process
6. **ProductionConfirmation** - Production data capture
7. **Inventory** - Material tracking with states
8. **Batch** - Trackable material units
9. **BatchRelation** - Parent-child batch relationships
10. **Equipment** - Machines/equipment
11. **Operator** - Personnel
12. **HoldRecord** - Hold tracking
13. **DatabasePatch** - Applied SQL patches tracking

## Key API Endpoints

| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User login (JWT) |
| `GET /api/orders` | List orders |
| `GET /api/orders/available` | Orders with READY operations |
| `POST /api/production/confirm` | Submit production confirmation |
| `GET /api/inventory` | Inventory list with filters |
| `POST /api/inventory/{id}/block` | Block inventory |
| `POST /api/inventory/{id}/unblock` | Unblock inventory |
| `GET /api/batches` | Batch list |
| `GET /api/batches/{id}/genealogy` | Batch traceability |
| `GET /api/holds` | Active holds list |
| `POST /api/holds` | Apply hold |
| `PUT /api/holds/{id}/release` | Release hold |
| `GET /api/master/equipment` | Equipment list |
| `GET /api/master/operators` | Operators list |

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

## Development Conventions

### Code Style

#### Java (Backend)
- Use Java 17 features (records, pattern matching, etc.)
- Follow Spring Boot conventions for REST APIs
- Use constructor injection for dependencies
- DTOs for API request/response (no entities in controllers)
- Service layer for business logic
- Repository layer for data access

#### TypeScript/Angular (Frontend)
- Module-based architecture (NOT standalone components)
- Services for API calls and state management
- Components for UI presentation
- Use RxJS operators for async operations
- FormControl for reactive forms

### Git Conventions
- **Branch naming:** `feature/`, `fix/`, `refactor/`
- **Commit messages:** Imperative mood, concise
- **PR titles:** Under 70 characters

### Testing Conventions
- E2E tests in `e2e/tests/` organized by feature
- Use before/after screenshots for documentation
- Test data in `backend/src/main/resources/demo/data.sql`
- Run tests with `node e2e/run-all-tests.js`

---

## Running the Application

### Backend (PostgreSQL - Production)
```bash
cd backend
./gradlew bootRun
# Starts on http://localhost:8080
# Requires PostgreSQL mes_production database
```

### Backend (Test Mode)
```bash
cd backend
./gradlew bootRun -Dspring.profiles.active=test
# Starts on http://localhost:8080
# Uses PostgreSQL mes_test database
# Schema is reset and rebuilt from patches
```

### Frontend Development
```bash
cd frontend
npm install
npm start
# Starts on http://localhost:4200
```

### Frontend Build & Integration
```bash
# Build frontend
cd frontend && npm run build

# Copy to Spring Boot static folder
cd backend && ./gradlew copyFrontendToStatic

# Or do both at once
cd backend && ./gradlew integrateFrontend
```

## POC Credentials
- **Email:** admin@mes.com
- **Password:** admin123

---

## Database Setup

### PostgreSQL Databases
| Database | Purpose | Created By |
|----------|---------|------------|
| `mes_production` | Production | Manual |
| `mes_test` | Testing | Manual or `run-tests.bat` |

### Create Databases
```bash
psql -U postgres -c "CREATE DATABASE mes_production"
psql -U postgres -c "CREATE DATABASE mes_test"
```

### Schema Management
- All schema changes are managed via SQL patches in `backend/src/main/resources/patches/`
- Patches are numbered (001, 002, etc.) and run automatically on startup
- Test mode resets schema (DROP/CREATE public) before running patches
- Patches are tracked in `database_patches` table to prevent re-running

### SQL Patch Conventions (IMPORTANT)

**AVOID in patches:**
- **Dollar-quoted strings (`$$...$$`)** - The patch parser cannot handle PostgreSQL's dollar-quoting syntax used in stored procedures and functions
- **PL/pgSQL functions** - Use Spring application code instead of stored procedures
- **Complex multi-statement procedures** - Keep patches simple with DDL/DML only

**If you need stored procedures:**
- Implement logic in Java service classes instead
- For database-level logic, create a separate SQL script to run manually with `psql`
- Document manual SQL scripts in `backend/src/main/resources/manual-scripts/`

**MANDATORY: Every database schema change MUST have a SQL patch:**
- **Any time** you add/modify entity fields, add new tables, or change column types → create a numbered SQL patch in `patches/`
- **Also update** `demo/schema.sql` with the equivalent H2-compatible DDL change
- This applies to ALL changes, including gap fixes, bug fixes, and feature additions
- Patch numbering: check the latest patch number and increment by 1

**Patch best practices:**
- Use simple DDL: CREATE TABLE, ALTER TABLE, CREATE INDEX
- Use simple DML: INSERT, UPDATE, DELETE
- Use `IF NOT EXISTS` / `IF EXISTS` for idempotency
- Use standard SQL quoting ('single quotes' for strings)
- One logical change per patch for easier debugging

### Demo Mode Schema Alignment (IMPORTANT)

Demo mode uses H2 in-memory database with **separate schema files** that must be kept in sync with patches:

| File | Purpose | When to Update |
|------|---------|----------------|
| `patches/*.sql` | **Source of truth** | Any schema change |
| `demo/schema.sql` | H2-compatible DDL | After creating a patch |
| `demo/data.sql` | Rich sample data | When patches add new tables |

**When creating a new patch:**
1. Create patch: `patches/NNN_description.sql`
2. Update `demo/schema.sql` with equivalent H2-compatible DDL
3. Update `demo/data.sql` if new tables need sample data

**Entity Model (MES Consolidated Spec):**
- **Process** = Design-time entity only (`process_name`, `status`) - NO `order_line_id` FK
- **Operation** = Links to Process via `process_id` AND to OrderLineItem via `order_line_id`

**Verify both profiles work:**
```bash
./gradlew bootRun -Dspring.profiles.active=test    # Patches (PostgreSQL)
./gradlew bootRun --args='--spring.profiles.active=demo'  # H2 demo
```

---

## Testing

### Full Test Suite
```bash
# Run all tests (backend + frontend + E2E)
./run-tests.bat         # Windows
./run-tests.sh          # Unix

# Backend tests only
./run-tests.bat --backend

# Frontend tests only
./run-tests.bat --frontend

# E2E tests only (includes frontend build)
./run-tests.bat --e2e
```

### Backend Tests
```bash
cd backend
./gradlew test -Dspring.profiles.active=test
# Uses mes_test database
# Schema reset before each run
```

### Frontend Tests
```bash
cd frontend
npm test -- --watch=false --browsers=ChromeHeadless
```

### E2E Tests
```bash
# Ensure servers are running, then:
node e2e/run-all-tests.js

# With form submissions
node e2e/run-all-tests.js --submit

# Record video
node e2e/run-all-tests.js --video
```

### Test Structure
```
e2e/
├── config/
│   ├── playwright.config.js   # Browser/viewport settings
│   └── constants.js           # Selectors, routes, test data
├── tests/
│   ├── 01-auth.test.js        # Authentication tests
│   ├── 02-dashboard.test.js   # Dashboard tests
│   ├── 03-orders.test.js      # Orders tests
│   ├── 04-production.test.js  # Production confirmation tests
│   ├── 05-inventory.test.js   # Inventory tests
│   ├── 06-batches.test.js     # Batches tests
│   ├── 07-holds.test.js       # Holds tests
│   ├── 08-equipment.test.js   # Equipment tests
│   └── 09-quality.test.js     # Quality tests
├── utils/
│   └── test-helpers.js        # Screenshot, auth, navigation helpers
├── run-all-tests.js           # Master test runner
└── record-user-journey.js     # User journey recorder with video
```

### Screenshot Output
- Screenshots: `e2e/output/screenshots/{timestamp}/`
- Videos: `e2e/output/videos/{timestamp}/`

### Demo Video Creation Tools

#### Quick Start: Create Demo with Voiceover
```bash
# 1. Start servers (both terminals)
cd backend && ./gradlew bootRun --args="--spring.profiles.active=demo"
cd frontend && npm start

# 2. Install demo dependencies (one-time)
cd e2e && npm install google-tts-api ffmpeg-static ffprobe-static fluent-ffmpeg

# 3. Record comprehensive demo (33 scenes with captions)
node e2e/record-comprehensive-demo.js

# 4. Add synced voiceover to recorded video
node e2e/create-synced-voiceover.js <demo-folder-path>
# OR auto-detect latest:
node e2e/create-synced-voiceover.js
```

#### Demo Scripts

| Script | Purpose |
|--------|---------|
| `e2e/record-comprehensive-demo.js` | Records 33-scene demo with text captions, captures all features |
| `e2e/create-synced-voiceover.js` | Generates voiceover matching exact screenshots, combines with video |
| `e2e/add-voiceover-to-demo.js` | Alternative voiceover with timed script (for custom timing) |
| `e2e/record-demo-with-captions.js` | Simpler 24-scene demo with caption overlays |
| `e2e/create-final-demo.js` | All-in-one: record + voiceover in single run |

#### Output Structure
```
e2e/output/comprehensive-demo/{timestamp}/
├── *.webm                              # Raw recorded video
├── synced-voiceover.mp3                # Combined audio track
├── MES-Demo-Synced-{timestamp}.mp4     # Final video with voiceover
├── screenshots/                        # 33 scene screenshots
│   ├── 001-login-page.png
│   ├── 002-login-email-entered.png
│   └── ... (33 total)
└── synced-audio/                       # Individual voiceover segments
    ├── 001-voice.mp3
    ├── 001-pad.mp3 (silence padding)
    └── ...
```

#### 33 Demo Scenes
| # | Scene | Description |
|---|-------|-------------|
| 001-005 | Authentication | Login page, credentials, JWT auth, redirect |
| 006-009 | Dashboard | Metrics, inventory summary, orders ready, audit trail |
| 010-014 | Orders | List, filters, detail, line items, operations timeline |
| 015-019 | Inventory | List, status cards, filter available/blocked/type |
| 020-021 | Batches | List, filter consumed |
| 022-026 | Holds | List, filter, apply modal, entity type, release modal |
| 027-029 | Equipment | List, status summary, filter maintenance |
| 030 | Quality | Pending inspection queue |
| 031-033 | Logout | Session complete, logged out, demo complete |

#### Dependencies
```bash
# Required for voiceover generation
npm install google-tts-api         # Text-to-speech API
npm install ffmpeg-static          # FFmpeg binary
npm install ffprobe-static         # FFprobe binary
npm install fluent-ffmpeg          # FFmpeg wrapper
```

#### Troubleshooting Demo Recording
- **Server check failing**: Scripts accept any HTTP response (not just 200)
- **ffprobe not found**: Install `ffprobe-static` package
- **Filter timeout errors**: Wrapped in try-catch, non-fatal
- **Audio out of sync**: Use `create-synced-voiceover.js` (matches screenshots exactly)

---

## Key Workflows

### Production Confirmation
1. Select Order (READY status)
2. Select Input Materials (available inventory)
3. Enter Production Details (equipment, operator, quantities)
4. Generate Output Batch (auto-numbered)
5. Confirm → Updates statuses, creates batch relations

### Batch Traceability
- Forward: Source materials → Final product
- Backward: Final product → Source materials
- SPLIT/MERGE operations supported

### Hold Management
- Apply holds to: Orders, Operations, Batches, Inventory, Equipment
- Hold reasons configurable
- Release with comments
- Audit trail maintained

---

## Documentation

- `docs/DEV-GUIDE.md` - Development setup and instructions
- `docs/USER-GUIDE.md` - User journey with screenshots
- `documents/MES-POC-Specification.md` - POC objectives, workflows
- `documents/MES-Functional-Requirements-Document.md` - Detailed FRD
- `documents/MES-Production-Confirmation-Requirements.md` - UI mockups
- `documents/MES-Implementation-Analysis.md` - Implementation vs requirements comparison
- `documents/MES-Requirements-Gaps-Analysis.md` - **Gaps analysis from Teams meeting requirements**
- `documents/Process-Status-Validation-Report.md` - **Process status behavior validation report**
- `documents/Production-Confirmation-Architecture-Validation.md` - **Production confirmation flow validation (Operation-level)**

---

## Troubleshooting

### Backend won't start
- Check PostgreSQL is running (production mode)
- Check port 8080 is available
- For demo mode: use `-Dspring-boot.run.profiles=demo`

### Frontend won't start
- Run `npm install` first
- Check port 4200 is available
- Check backend is running for API calls

### E2E tests failing
- Ensure backend is running in demo mode
- Ensure frontend is running
- Check network connectivity
- Review screenshots in `e2e/output/screenshots/`

---

## Recent Enhancements (Implementation Log)

### GAP-004: BOM Suggested Consumption (Completed)
**Files Modified:**
- `backend/src/main/java/com/mes/production/dto/BomDTO.java` - Added SuggestedConsumptionResponse, SuggestedMaterial, AvailableBatch DTOs
- `backend/src/main/java/com/mes/production/service/BomValidationService.java` - Added getSuggestedConsumption() method
- `backend/src/main/java/com/mes/production/controller/BomController.java` - Added `/bom/operation/{operationId}/suggested-consumption` endpoint
- `frontend/src/app/shared/models/bom.model.ts` - Added TypeScript interfaces
- `frontend/src/app/core/services/api.service.ts` - Added getSuggestedConsumption() method
- `frontend/src/app/features/production/production-confirm/production-confirm.component.*` - Added suggested consumption UI section

**Features:**
- Pre-populates material consumption based on BOM requirements
- Calculates required quantities with yield loss ratios
- Shows stock availability status (Sufficient/Insufficient)
- "Apply Suggestions" button to auto-fill material selections

### Pagination & Sorting (Completed)
**Files Created/Modified:**
- `backend/src/main/java/com/mes/production/dto/PagedResponseDTO.java` - NEW: Generic paged response
- `backend/src/main/java/com/mes/production/dto/PageRequestDTO.java` - NEW: Pagination request params
- All repository classes - Added Pageable methods with `findByFilters()` queries
- All service classes - Added `get*Paged()` methods
- All controllers - Added `/paged` endpoints
- `frontend/src/app/shared/models/pagination.model.ts` - NEW: TypeScript interfaces
- `frontend/src/app/shared/components/pagination/` - NEW: Reusable pagination component
- `frontend/src/app/core/services/api.service.ts` - Added paginated API methods

**Features:**
- Server-side pagination with configurable page size (10, 20, 50, 100)
- Sorting by field with ASC/DESC direction
- Combined search/filter support
- Reusable PaginationComponent for all list pages
- Page size dropdown and navigation controls

**Paginated API Endpoints:**
| Endpoint | Query Params |
|----------|-------------|
| `GET /api/orders/paged` | page, size, sortBy, sortDirection, search, status |
| `GET /api/batches/paged` | page, size, sortBy, sortDirection, search, status |
| `GET /api/inventory/paged` | page, size, sortBy, sortDirection, search, status, type |
| `GET /api/equipment/paged` | page, size, sortBy, sortDirection, search, status, type |
| `GET /api/holds/paged` | page, size, sortBy, sortDirection, search, status, type |

**E2E Tests:**
- `e2e/tests/10-pagination.test.js` - 8 tests covering pagination controls, navigation, and combined filters

### GAP-007: Field-Level Audit Trail (Completed)
**Files Created/Modified:**
- `backend/src/main/java/com/mes/production/service/FieldChangeAuditService.java` - NEW: Field change detection and auditing

**Features:**
- Automatic comparison of old vs new entity values
- Logs individual field changes with old/new values (satisfies Meeting 22:58)
- Dedicated methods for Production Confirmation, Inventory, Batch, Operation changes
- Support for BigDecimal, LocalDateTime, and other types
- Excludes system fields (createdOn, updatedOn, etc.)

**Usage Example:**
```java
fieldChangeAuditService.auditProductionConfirmationChanges(
    confirmationId, oldConfirmation, newConfirmation);
```

### GAP-005: Configurable Batch Number Generation (Completed)
**Files Created/Modified:**
- `backend/src/main/resources/patches/004_batch_number_config.sql` - NEW: Config table schema
- `backend/src/main/java/com/mes/production/service/BatchNumberService.java` - NEW: Configurable batch number generation
- `backend/src/main/java/com/mes/production/service/ProductionService.java` - Uses BatchNumberService
- `backend/src/main/java/com/mes/production/service/BatchService.java` - Uses BatchNumberService for split/merge

**Features:**
- Configuration table with prefix, date format, sequence, separator options
- Operation-type specific configurations (FURNACE, CASTER, ROLLING)
- Product-specific configurations
- Sequence reset options: DAILY, MONTHLY, YEARLY, NEVER
- Fallback pattern when no config found
- Split/merge batch number generation

### GAP-003: Dynamic Process Parameters Validation (Completed)
**Files Modified:**
- `backend/src/main/java/com/mes/production/service/ProcessParameterService.java` - NEW: Validates parameters against min/max config
- `backend/src/main/java/com/mes/production/service/ProductionService.java` - Added parameter validation before confirmation
- `frontend/src/app/features/production/production-confirm/production-confirm.component.ts` - Added min/max validators
- `frontend/src/app/features/production/production-confirm/production-confirm.component.html` - Added validation error messages

**Features:**
- Backend validates process parameters against configured min/max values
- Frontend shows real-time validation errors
- Warnings for values close to limits (within 10%)
- Required parameter validation

### GAP-010: BLOCKED/SCRAPPED Inventory States (Already Implemented)
**Verified existing implementation in:**
- `backend/src/main/java/com/mes/production/entity/Inventory.java` - State constants
- `backend/src/main/java/com/mes/production/controller/InventoryController.java` - Block/unblock/scrap endpoints
- `frontend/src/app/features/inventory/` - UI for state management

### Holds Management UI Fix (Completed)
**Files Modified:**
- `frontend/src/app/features/holds/hold-list/hold-list.component.css` - Fixed filter layout
- `frontend/src/app/features/holds/hold-list/hold-list.component.html` - Added Equipment entity type

**Issue:** Filter controls were stacked vertically instead of horizontal alignment

**Fix Applied:**
```css
.filters {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}
.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}
```

### Comprehensive Demo Video System (Completed)
**Files Created:**
- `e2e/record-comprehensive-demo.js` - Records 33-scene demo with captions
- `e2e/create-synced-voiceover.js` - Generates synced voiceover matching screenshots
- `e2e/add-voiceover-to-demo.js` - Alternative timed voiceover script
- `e2e/record-demo-with-captions.js` - Simpler 24-scene demo

**Features:**
- 33 scenes covering all application features
- Text caption overlays showing scene descriptions
- Google TTS voiceover generation with proper sync
- FFmpeg video/audio combination
- Screenshot capture for each scene
- Automatic server health checks

**Final Output Example:**
- `e2e/output/comprehensive-demo/2026-02-04T13-54-41/MES-Demo-Synced-2026-02-04T14-05-59.mp4` (3.1 MB)

### P14: MaterialSelectionModalComponent (Completed)
**Files Created:**
- `frontend/src/app/shared/components/material-selection-modal/material-selection-modal.component.ts`
- `frontend/src/app/shared/components/material-selection-modal/material-selection-modal.component.html`
- `frontend/src/app/shared/components/material-selection-modal/material-selection-modal.component.css`
- `frontend/src/app/shared/components/material-selection-modal/material-selection-modal.component.spec.ts`
- `e2e/tests/25-material-selection-modal.test.js`

**Features:**
- Search by batch number or material ID
- Filter by material type (RM/IM/FG/WIP)
- Bulk selection (Select All/Clear All)
- Quantity input with validation (max = available, min = 0)
- Selection summary with total quantity
- Modal backdrop click to close
- Integration with production confirm component

### P15: ApplyHoldModalComponent (Completed)
**Files Created:**
- `frontend/src/app/shared/components/apply-hold-modal/apply-hold-modal.component.ts`
- `frontend/src/app/shared/components/apply-hold-modal/apply-hold-modal.component.html`
- `frontend/src/app/shared/components/apply-hold-modal/apply-hold-modal.component.css`
- `frontend/src/app/shared/components/apply-hold-modal/apply-hold-modal.component.spec.ts`
- `e2e/tests/26-apply-hold-modal.test.js`

**Features:**
- Load hold reasons from API on modal open
- Display entity info (type, name)
- Warning message about hold impact
- Required reason selection, optional comments
- Success state with auto-close (1.5s delay)
- Error handling with user-friendly messages
- Supports entity types: OPERATION, BATCH, INVENTORY, ORDER, EQUIPMENT

---

## Key API Endpoints (Updated)

### Authentication
| Endpoint | Description |
|----------|-------------|
| `POST /api/auth/login` | User login (JWT) |

### Orders
| Endpoint | Description |
|----------|-------------|
| `GET /api/orders` | List all orders |
| `GET /api/orders/paged` | **Paginated** orders with sorting/filtering |
| `GET /api/orders/available` | Orders with READY operations |
| `GET /api/orders/{id}` | Get order by ID |
| `POST /api/orders` | **Create** new order with line items |
| `PUT /api/orders/{id}` | **Update** order basic info |
| `DELETE /api/orders/{id}` | **Delete** order (soft delete to CANCELLED) |
| `POST /api/orders/{id}/line-items` | **Add** line item to order |
| `PUT /api/orders/{id}/line-items/{lineId}` | **Update** line item |
| `DELETE /api/orders/{id}/line-items/{lineId}` | **Delete** line item |

### Production
| Endpoint | Description |
|----------|-------------|
| `POST /api/production/confirm` | Submit production confirmation |
| `GET /api/production/confirmations` | List production confirmations |

### Inventory
| Endpoint | Description |
|----------|-------------|
| `GET /api/inventory` | List all inventory |
| `GET /api/inventory/paged` | **Paginated** inventory with sorting/filtering |
| `POST /api/inventory/{id}/block` | Block inventory |
| `POST /api/inventory/{id}/unblock` | Unblock inventory |
| `POST /api/inventory/{id}/scrap` | Scrap inventory |

### Batches
| Endpoint | Description |
|----------|-------------|
| `GET /api/batches` | List all batches |
| `GET /api/batches/paged` | **Paginated** batches with sorting/filtering |
| `GET /api/batches/{id}/genealogy` | Batch traceability |
| `POST /api/batches/{id}/split` | Split a batch |
| `POST /api/batches/merge` | Merge batches |

### BOM (Bill of Materials) - Full CRUD with Tree Structure
| Endpoint | Description |
|----------|-------------|
| `GET /api/bom/{productSku}/requirements` | BOM requirements (flat list) |
| `POST /api/bom/validate` | Validate BOM consumption |
| `GET /api/bom/operation/{id}/suggested-consumption` | Suggested consumption from BOM |
| `GET /api/bom/{productSku}/tree` | **Full hierarchical BOM tree** |
| `GET /api/bom/{productSku}/tree/version/{v}` | BOM tree for specific version |
| `GET /api/bom/{productSku}/list` | Flat list for tables (with child count) |
| `GET /api/bom/node/{bomId}` | Single node with children |
| `GET /api/bom/products` | All products with BOMs |
| `GET /api/bom/{productSku}/versions` | Available versions for product |
| `POST /api/bom/node` | **Create** single BOM node |
| `POST /api/bom/tree` | **Create** full BOM tree (batch) |
| `PUT /api/bom/node/{bomId}` | **Update** BOM node |
| `PUT /api/bom/node/{bomId}/move` | **Move** node to new parent |
| `DELETE /api/bom/node/{bomId}` | **Delete** node (soft, no children) |
| `DELETE /api/bom/node/{bomId}/cascade` | **Delete** node with all children |
| `DELETE /api/bom/{productSku}/tree` | **Delete** entire product BOM

### Holds
| Endpoint | Description |
|----------|-------------|
| `GET /api/holds/active` | Active holds list |
| `GET /api/holds/paged` | **Paginated** holds with sorting/filtering |
| `POST /api/holds` | Apply hold |
| `PUT /api/holds/{id}/release` | Release hold |
| `GET /api/holds/count` | Active hold count |

### Equipment
| Endpoint | Description |
|----------|-------------|
| `GET /api/equipment` | List all equipment |
| `GET /api/equipment/paged` | **Paginated** equipment with sorting/filtering |
| `POST /api/equipment/{id}/maintenance/start` | Start maintenance |
| `POST /api/equipment/{id}/maintenance/end` | End maintenance |
| `POST /api/equipment/{id}/hold` | Put on hold |
| `POST /api/equipment/{id}/release` | Release from hold |

### Routing (NEW - Design-Time Configuration)
| Endpoint | Description |
|----------|-------------|
| `GET /api/routing` | List all routings (optional: ?status=ACTIVE) |
| `GET /api/routing/{id}` | Get routing by ID with steps |
| `GET /api/routing/process/{processId}` | Get routing for a process |
| `POST /api/routing` | Create new routing |
| `PUT /api/routing/{id}` | Update routing (name, type) |
| `DELETE /api/routing/{id}` | Delete routing (soft delete) |
| `POST /api/routing/{id}/activate` | Activate routing (deactivates others) |
| `POST /api/routing/{id}/deactivate` | Deactivate routing |
| `POST /api/routing/{id}/hold` | Put routing on hold |
| `POST /api/routing/{id}/release` | Release routing from hold |
| `GET /api/routing/{id}/status` | Get routing status summary |
| `GET /api/routing/{id}/locked` | Check if routing is locked |
| `POST /api/routing/{id}/steps` | **Create** routing step |
| `PUT /api/routing/steps/{stepId}` | **Update** routing step |
| `DELETE /api/routing/steps/{stepId}` | **Delete** routing step |
| `POST /api/routing/{id}/reorder` | Reorder routing steps |

### Master Data
| Endpoint | Description |
|----------|-------------|
| `GET /api/master/operators` | Operators list |
| `GET /api/master/process-parameters` | Dynamic process parameters with min/max config |

### Customers (NEW - Phase 1)
| Endpoint | Description |
|----------|-------------|
| `GET /api/customers` | List all customers |
| `GET /api/customers/paged` | **Paginated** customers with sorting/filtering |
| `GET /api/customers/active` | Get active customers only |
| `GET /api/customers/{id}` | Get customer by ID |
| `POST /api/customers` | Create new customer |
| `PUT /api/customers/{id}` | Update customer |
| `DELETE /api/customers/{id}` | Delete customer (soft delete to INACTIVE) |

### Materials (NEW - Phase 1)
| Endpoint | Description |
|----------|-------------|
| `GET /api/materials` | List all materials |
| `GET /api/materials/paged` | **Paginated** materials with sorting/filtering |
| `GET /api/materials/active` | Get active materials only |
| `GET /api/materials/{id}` | Get material by ID |
| `POST /api/materials` | Create new material |
| `PUT /api/materials/{id}` | Update material |
| `DELETE /api/materials/{id}` | Delete material (soft delete to INACTIVE) |

### Products (NEW - Phase 1)
| Endpoint | Description |
|----------|-------------|
| `GET /api/products` | List all products |
| `GET /api/products/paged` | **Paginated** products with sorting/filtering |
| `GET /api/products/active` | Get active products only |
| `GET /api/products/{id}` | Get product by ID |
| `POST /api/products` | Create new product |
| `PUT /api/products/{id}` | Update product |
| `DELETE /api/products/{id}` | Delete product (soft delete to INACTIVE) |

### Dashboard
| Endpoint | Description |
|----------|-------------|
| `GET /api/dashboard/stats` | Dashboard statistics |
| `GET /api/dashboard/recent-confirmations` | Recent production confirmations |

### Audit Trail (GAP-013)
| Endpoint | Description |
|----------|-------------|
| `GET /api/audit/entity/{type}/{id}` | Get audit history for specific entity |
| `GET /api/audit/recent?limit=50` | Get recent audit activity |
| `GET /api/audit/production-confirmations?limit=10` | Recent production confirmations |
| `GET /api/audit/user/{username}?limit=50` | Get activity by user |
| `GET /api/audit/range?startDate=...&endDate=...` | Activity within date range |
| `GET /api/audit/summary` | Today's count + recent activity |
| `GET /api/audit/entity-types` | Valid entity types for filtering |
| `GET /api/audit/action-types` | Valid action types for filtering |

---

## Help Content Documentation

The application uses contextual help widgets (Task #73) to provide in-app guidance. Help content should be maintained here and kept updated as features change.

### Page-Level Help Content

| Page | Help Content |
|------|-------------|
| **Receive Material** | Raw material goods receipt creates a new Batch (QUALITY_PENDING status) and Inventory record (AVAILABLE state). The batch must be approved before the inventory can be used in production. |
| **Production Confirm** | Production confirmation consumes input materials and produces output batches. Select an operation, choose input batches, enter process parameters, and confirm to complete the operation. |
| **Inventory List** | Inventory items represent material at a location. States: AVAILABLE (can be used), ON_HOLD (temporarily blocked), BLOCKED (quality issue), CONSUMED (used in production). |
| **Batch List** | Batches are trackable units of material. Statuses: QUALITY_PENDING (awaiting approval), AVAILABLE (approved for use), PRODUCED, CONSUMED, BLOCKED, SCRAPPED. |
| **Holds** | Holds temporarily block entities from being used. Can be applied to: Orders, Operations, Batches, Inventory, Equipment. Release with reason when issue is resolved. |
| **Orders** | Orders contain line items (products) and each line item has a process with operations. Operations must be confirmed in sequence based on routing. |

### Feature Help

| Feature | Help Content |
|---------|-------------|
| **Batch Approval** | New batches start in QUALITY_PENDING. Go to batch detail and click Approve/Reject. Approved batches become AVAILABLE for production. |
| **Inventory Types** | RM = Raw Material, WIP = Work in Progress, IM = Intermediate, FG = Finished Goods. Type determines where material is in the production flow. |
| **Genealogy** | Batch genealogy shows material traceability - parent batches (inputs) and child batches (outputs). Supports forward and backward tracing. |
| **Split/Merge** | Batches can be split into multiple smaller batches or merged together. Original relationships are preserved in genealogy. |

### Updating Help Content

When adding or modifying features:
1. Update the relevant help content in this section
2. Ensure the HelpWidget component references the correct content key
3. Keep explanations concise and action-oriented
4. Include any prerequisites or dependencies

---

## Git Info

- **Branch:** main
- **Initial Commit:** 6dd8a8d - "Initial commit: MES Production Confirmation POC"
