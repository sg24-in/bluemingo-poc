# MES Production Confirmation POC - Project Context

## Session Persistence

**IMPORTANT: On session start, read `.claude/TASKS.md` for current work status.**

| File | Purpose |
|------|---------|
| `.claude/CLAUDE.md` | Project context, conventions, architecture |
| `.claude/TASKS.md` | **Active tasks, session log, next steps** |
| `documents/MES-Requirements-Gaps-Analysis.md` | Requirements gaps to implement |

### Resuming Work
1. Read `.claude/TASKS.md` for current sprint and in-progress tasks
2. Check "Next Steps" section for immediate actions
3. Update task status as you work
4. Update TASKS.md before session ends with progress

---

## Project Overview

**Name:** MES Production Confirmation POC (Bluemingo POC)
**Type:** Manufacturing Execution System - Proof of Concept
**Purpose:** Production confirmation workflows, material consumption tracking, and batch traceability for manufacturing environments

## Technology Stack

### Backend
- **Framework:** Spring Boot 3.2
- **Language:** Java 17
- **Database:** PostgreSQL 14+ (production), H2 (demo mode)
- **ORM:** Spring Data JPA / Hibernate
- **Security:** JWT Token Authentication (JJWT 0.12.3)
- **Build:** Gradle 8.5

### Frontend
- **Framework:** Angular 17 (Module-based architecture)
- **HTTP:** Angular HttpClient with RxJS 7.8.0
- **Styling:** Custom CSS

### Testing
- **E2E Tests:** Playwright
- **Test Runner:** Node.js scripts
- **Video Recording:** Playwright built-in recorder

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
│       ├── shared/          # Shared components
│       └── features/        # Feature modules
│           ├── auth/
│           ├── dashboard/
│           ├── orders/
│           ├── production/
│           ├── inventory/
│           ├── batches/
│           ├── holds/
│           ├── equipment/
│           └── quality/
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
2. **Order** - Customer orders with status
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
# Requires PostgreSQL running on localhost:5432
```

### Backend (Demo Mode - H2 In-Memory)
```bash
cd backend
./gradlew bootRun --args="--spring.profiles.active=demo"
# Starts on http://localhost:8080
# Uses H2 in-memory database
```

**Demo Mode Features:**
- Uses H2 in-memory database (no PostgreSQL required)
- Pre-seeded with rich sample data for screenshots/demos
- H2 Console: http://localhost:8080/h2-console
  - JDBC URL: `jdbc:h2:mem:mes_demo`
  - Username: `sa`, Password: (empty)

### Frontend
```bash
cd frontend
npm install
npm start
# Starts on http://localhost:4200
```

## POC Credentials
- **Email:** admin@mes.com
- **Password:** admin123

---

## E2E Testing

### Running Tests
```bash
# Run all tests (read-only mode)
node e2e/run-all-tests.js

# Run all tests WITH form submissions
node e2e/run-all-tests.js --submit

# Record video of test run
node e2e/run-all-tests.js --video

# Record user journey with video
node e2e/record-user-journey.js
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

### BOM (Bill of Materials)
| Endpoint | Description |
|----------|-------------|
| `GET /api/bom/{productSku}/requirements` | BOM requirements tree |
| `POST /api/bom/validate` | Validate BOM consumption |
| `GET /api/bom/operation/{id}/suggested-consumption` | Suggested consumption from BOM |

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

### Master Data
| Endpoint | Description |
|----------|-------------|
| `GET /api/master/operators` | Operators list |
| `GET /api/master/process-parameters` | Dynamic process parameters with min/max config |

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

## Git Info

- **Branch:** main
- **Initial Commit:** 6dd8a8d - "Initial commit: MES Production Confirmation POC"
