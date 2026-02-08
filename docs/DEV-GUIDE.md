# MES Production Confirmation - Development Guide

This guide covers everything you need to set up, develop, test, and deploy the MES Production Confirmation POC.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Project Setup](#project-setup)
3. [Running the Application](#running-the-application)
4. [Development Workflow](#development-workflow)
5. [Testing](#testing)
6. [Code Conventions](#code-conventions)
7. [API Reference](#api-reference)
8. [Database](#database)
9. [Demo Video & Voiceover](#demo-video--voiceover) - **Create demo videos with automated voiceover**
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Software

| Software | Version | Purpose |
|----------|---------|---------|
| Java JDK | 17+ | Backend runtime |
| Node.js | 18+ | Frontend runtime |
| Gradle | 8.5+ | Backend build tool |
| PostgreSQL | 14+ | Database (all environments) |
| Git | 2.x | Version control |

### Optional Tools

| Tool | Purpose |
|------|---------|
| VS Code | Frontend development |
| IntelliJ IDEA | Backend development |
| Postman | API testing |
| DBeaver | Database management |

---

## Project Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd bluemingo-poc
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies and build
./gradlew clean build

# Verify build
./gradlew test
```

### 3. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Verify installation
npm run build
```

### 4. E2E Test Setup

```bash
# Install Playwright (from project root)
npm install playwright
npx playwright install chromium
```

---

## Running the Application

### Database Setup

**Create PostgreSQL Databases:**
```bash
# Create databases (one-time setup)
psql -U postgres -c "CREATE DATABASE mes_production"
psql -U postgres -c "CREATE DATABASE mes_test"
```

### Development Mode (PostgreSQL)

**Terminal 1 - Backend:**
```bash
cd backend
./gradlew bootRun
# Uses mes_production database
# Patches auto-apply on startup
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
```

**Access Points:**
- Frontend: http://localhost:4200
- Backend API: http://localhost:8080

### Test Mode

**Start with Test Profile:**
```bash
cd backend
./gradlew bootRun -Dspring.profiles.active=test
# Uses mes_test database
# Schema is reset and rebuilt from patches
```

**Run Tests:**
```bash
# All tests (Windows)
./run-tests.bat

# All tests (Unix)
./run-tests.sh

# Backend only
./run-tests.bat --backend

# Frontend only
./run-tests.bat --frontend

# E2E only
./run-tests.bat --e2e
```

### Login Credentials

| Environment | Email | Password |
|-------------|-------|----------|
| All | admin@mes.com | admin123 |

---

## Development Workflow

### Backend Development

#### Adding a New Entity

1. Create entity in `entity/` package:
```java
@Entity
@Table(name = "my_entity")
public class MyEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    // fields...
}
```

2. Create repository in `repository/` package:
```java
public interface MyEntityRepository extends JpaRepository<MyEntity, Long> {
    // custom queries...
}
```

3. Create DTO in `dto/` package:
```java
public class MyEntityDTO {
    private Long id;
    // fields with getters/setters
}
```

4. Create service in `service/` package:
```java
@Service
public class MyEntityService {
    private final MyEntityRepository repository;

    public MyEntityService(MyEntityRepository repository) {
        this.repository = repository;
    }
    // business logic...
}
```

5. Create controller in `controller/` package:
```java
@RestController
@RequestMapping("/api/my-entity")
public class MyEntityController {
    private final MyEntityService service;

    // endpoints...
}
```

#### Adding a Database Patch

1. Create SQL file in `backend/src/main/resources/patches/`:
   - Name format: `NNN_description.sql` (e.g., `003_add_new_table.sql`)
2. Patches auto-apply on startup (PostgreSQL mode only)

### Frontend Development

#### Adding a New Feature Module

1. Generate module:
```bash
cd frontend
ng generate module features/my-feature --routing
```

2. Generate component:
```bash
ng generate component features/my-feature/my-component
```

3. Register route in `app-routing.module.ts`:
```typescript
{
  path: 'my-feature',
  loadChildren: () => import('./features/my-feature/my-feature.module')
    .then(m => m.MyFeatureModule),
  canActivate: [AuthGuard]
}
```

4. Add navigation link in header component

#### Using the API Service

```typescript
import { ApiService } from '../../core/services/api.service';

constructor(private api: ApiService) {}

// GET request
this.api.get<MyDTO[]>('/my-endpoint').subscribe(data => {
  this.items = data;
});

// POST request
this.api.post<ResponseDTO>('/my-endpoint', payload).subscribe(response => {
  // handle response
});
```

---

## Testing

### Full Test Suite

The project uses PostgreSQL (`mes_test` database) for all testing. Schema is reset before each test run.

```bash
# Run all tests (Windows)
./run-tests.bat

# Run all tests (Unix)
./run-tests.sh

# Options:
./run-tests.bat --backend    # Backend tests only
./run-tests.bat --frontend   # Frontend tests only
./run-tests.bat --e2e        # E2E tests only (includes frontend build)
```

### Backend Tests (PostgreSQL)

```bash
cd backend

# Run with test profile (resets schema)
./gradlew test -Dspring.profiles.active=test

# Run with coverage report
./gradlew test jacocoTestReport -Dspring.profiles.active=test
```

### E2E Tests

```bash
# Ensure servers are running first

# Run all tests (read-only, no submissions)
node e2e/run-all-tests.js

# Run tests with actual form submissions
node e2e/run-all-tests.js --submit

# Run tests with video recording
node e2e/run-all-tests.js --video

# Run tests with both
node e2e/run-all-tests.js --submit --video

# Record complete user journey
node e2e/record-user-journey.js
```

### Test Output

- **Screenshots:** `e2e/output/screenshots/{timestamp}/`
- **Videos:** `e2e/output/videos/{timestamp}/`
- **JaCoCo Coverage:** `backend/build/reports/jacoco/index.html`

### Adding New E2E Tests

1. Create test file in `e2e/tests/`:
```javascript
const { ROUTES } = require('../config/constants');
const config = require('../config/playwright.config');

async function runMyTests(page, screenshots, results, runTest) {
    console.log('\n📂 MY MODULE TESTS');

    await runTest('My Test Name', async () => {
        await page.goto(`${config.baseUrl}/my-route`);
        await screenshots.capture(page, 'my-screenshot');
        // assertions...
    }, page, results, screenshots);
}

module.exports = { runMyTests };
```

2. Import and call in `e2e/run-all-tests.js`

### Running Unit Tests

**Backend (306 tests):**
```bash
cd backend

# Run all tests
./gradlew test

# Run tests with coverage report
./gradlew test jacocoTestReport
# Coverage report: backend/build/reports/jacoco/index.html

# Run specific test class
./gradlew test --tests "com.mes.production.controller.EquipmentControllerTest"

# Run tests matching pattern
./gradlew test --tests "*ControllerTest"

# Run with verbose output
./gradlew test --info
```

**Frontend (257 tests):**
```bash
cd frontend

# Run all tests in watch mode
npm test

# Run tests once (CI mode)
npm test -- --no-watch --browsers=ChromeHeadless

# Run tests with coverage
npm test -- --no-watch --code-coverage
# Coverage report: frontend/coverage/index.html

# Run specific test file
npm test -- --no-watch --include="**/equipment-list.component.spec.ts"
```

### Test Categories

| Category | Backend | Frontend | E2E |
|----------|---------|----------|-----|
| Authentication | 9 | 8 | 5 |
| Dashboard | 5 | 15 | 4 |
| Orders | 10 | 22 | 5 |
| Production | 20 | 47 | 7 |
| Inventory | 14 | 30 | 9 |
| Batches | 14 | 20 | 8 |
| Holds | 12 | 28 | 5 |
| Equipment | 14 | 20 | 7 |
| Quality | - | 10 | 6 |
| Pagination | - | 8 | 8 |
| Batch Allocation | 11 | - | - |
| Equipment Usage | 12 | - | - |
| Inventory Movement | 13 | - | - |
| Routing | 12 | - | - |
| **Total** | **306** | **257** | **65** |

---

## Code Conventions

### Java (Backend)

```java
// Use constructor injection
@Service
public class MyService {
    private final MyRepository repository;

    public MyService(MyRepository repository) {
        this.repository = repository;
    }
}

// Use Optional for nullable returns
public Optional<Entity> findById(Long id) {
    return repository.findById(id);
}

// Use DTOs for API responses
@GetMapping
public List<MyDTO> getAll() {
    return service.getAll().stream()
        .map(this::toDTO)
        .collect(Collectors.toList());
}
```

### TypeScript (Frontend)

```typescript
// Use TypeScript interfaces
interface MyData {
  id: number;
  name: string;
}

// Use RxJS operators
this.api.get<MyData[]>('/endpoint').pipe(
  map(items => items.filter(i => i.active)),
  catchError(error => {
    console.error(error);
    return of([]);
  })
).subscribe(data => this.items = data);

// Use reactive forms
this.form = this.fb.group({
  name: ['', [Validators.required]],
  email: ['', [Validators.required, Validators.email]]
});
```

### CSS

```css
/* Use BEM naming convention */
.module-name { }
.module-name__element { }
.module-name--modifier { }

/* Use CSS variables for theming */
:root {
  --primary-color: #2196F3;
  --error-color: #f44336;
}
```

### Git Commit Messages

```
feat: add production confirmation form
fix: resolve batch genealogy display issue
refactor: extract shared validation logic
docs: update API documentation
test: add inventory E2E tests
```

---

## API Reference

### Authentication

```
POST /api/auth/login
Body: { "email": "admin@mes.com", "password": "admin123" }
Response: { "accessToken": "...", "user": {...} }
```

### Orders

```
GET /api/orders                    # List all orders
GET /api/orders/paged              # Paginated orders (page, size, sortBy, sortDirection, search, status)
GET /api/orders/{id}               # Get order details
GET /api/orders/available          # Orders with READY operations
```

### Production

```
POST /api/production/confirm       # Submit confirmation
Body: {
  "operationId": 1,
  "producedQty": 100,
  "scrapQty": 5,
  "startTime": "2024-01-15T08:00:00",
  "endTime": "2024-01-15T12:00:00",
  "equipmentIds": [1, 2],
  "operatorIds": [1],
  "notes": "Optional notes"
}
```

### Inventory

```
GET /api/inventory                      # List inventory
GET /api/inventory/paged                # Paginated inventory (page, size, sortBy, sortDirection, search, status, type)
GET /api/inventory?state=AVAILABLE      # Filter by state
POST /api/inventory/{id}/block          # Block inventory
POST /api/inventory/{id}/unblock        # Unblock inventory
POST /api/inventory/{id}/scrap          # Scrap inventory
```

### Batches

```
GET /api/batches                   # List batches
GET /api/batches/paged             # Paginated batches (page, size, sortBy, sortDirection, search, status)
GET /api/batches/{id}              # Batch details
GET /api/batches/{id}/genealogy    # Batch traceability
POST /api/batches/{id}/split       # Split batch
POST /api/batches/merge            # Merge batches
```

### Holds

```
GET /api/holds/active              # Active holds
GET /api/holds/paged               # Paginated holds (page, size, sortBy, sortDirection, search, status, type)
POST /api/holds                    # Apply hold
PUT /api/holds/{id}/release        # Release hold
GET /api/holds/count               # Active hold count
```

### Equipment

```
GET /api/equipment                 # Equipment list
GET /api/equipment/paged           # Paginated equipment (page, size, sortBy, sortDirection, search, status, type)
GET /api/equipment/{id}            # Equipment details
POST /api/equipment/{id}/maintenance/start   # Start maintenance (body: { reason, expectedEndTime })
POST /api/equipment/{id}/maintenance/end     # End maintenance
POST /api/equipment/{id}/hold      # Put on hold (body: { reason })
POST /api/equipment/{id}/release   # Release from hold
```

---

## Database

### Entity Relationship Overview

```
Order (1) ─────> (N) OrderLineItem
                      │
                      v
                Process (1) ─────> (N) Operation
                      │                    │
                      v                    v
                   BOM              ProductionConfirmation
                                          │
                                          v
                                       Batch ────> BatchRelation
                                          │
                                          v
                                      Inventory
```

### Key Tables

| Table | Description |
|-------|-------------|
| users | User accounts |
| orders | Customer orders |
| order_line_items | Products in orders |
| processes | Production stages |
| operations | Steps within processes |
| production_confirmation | Production records |
| batches | Material batches |
| batch_relations | Parent-child batch links |
| inventory | Material inventory |
| equipment | Machines/equipment |
| operators | Personnel |
| hold_records | Active/released holds |

### Schema Management

All schema changes are managed via SQL patches:
- Location: `backend/src/main/resources/patches/`
- Naming: `NNN_description.sql` (e.g., `001_initial_schema.sql`)
- Auto-applied on startup by PatchService
- Test mode resets schema (DROP/CREATE public) before patches
- Tracked in `database_patches` table to prevent re-running

### SQL Patch Conventions

**IMPORTANT: Avoid these in patches (parser limitations):**

| Avoid | Reason | Alternative |
|-------|--------|-------------|
| Dollar-quoted strings (`$$...$$`) | Parser cannot handle PostgreSQL dollar-quoting | Use Java service code |
| PL/pgSQL functions | Require dollar-quoting | Implement in Spring services |
| Complex stored procedures | Multi-statement parsing issues | Break into separate patches |

**Best practices for patches:**
```sql
-- DO: Use simple DDL
CREATE TABLE IF NOT EXISTS my_table (...);
ALTER TABLE my_table ADD COLUMN IF NOT EXISTS new_col VARCHAR(50);
CREATE INDEX IF NOT EXISTS idx_name ON my_table(column);

-- DO: Use simple DML
INSERT INTO config_table (name, value) VALUES ('key', 'value');
UPDATE config_table SET value = 'new' WHERE name = 'key';

-- DON'T: Use dollar-quoted functions
-- CREATE FUNCTION my_func() RETURNS void AS $$ BEGIN ... END; $$ LANGUAGE plpgsql;
-- Instead, implement in Java: @Service public class MyService { ... }
```

**For stored procedures:**
- Implement logic in Java service classes instead
- If truly needed, create manual scripts in `backend/src/main/resources/manual-scripts/`
- Run manual scripts with `psql -f script.sql` before application startup

### Seed Data

Seed data is included in patches:
- `002_seed_data.sql` - Initial master data and sample data
- `004_additional_seed_data.sql` - Additional sample data

### Batch Number Generation

The `BatchNumberService` generates batch numbers based on configurable patterns stored in `batch_number_config` table.

#### Configuration Table Schema

```sql
CREATE TABLE batch_number_config (
    config_id BIGINT PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL,
    operation_type VARCHAR(50),           -- FURNACE, CASTER, ROLLING, etc.
    product_sku VARCHAR(100),              -- Optional product-specific pattern
    prefix VARCHAR(20) DEFAULT 'BATCH',
    separator VARCHAR(5) DEFAULT '-',
    include_date BOOLEAN DEFAULT true,
    date_format VARCHAR(20) DEFAULT 'yyyyMMdd',
    sequence_digits INT DEFAULT 4,
    reset_frequency VARCHAR(20) DEFAULT 'DAILY',  -- DAILY, MONTHLY, YEARLY, NEVER
    current_sequence INT DEFAULT 0,
    last_reset_date DATE,
    status VARCHAR(20) DEFAULT 'ACTIVE'
);
```

#### Pattern Resolution

The service uses this priority order:
1. **Product + Operation** - Most specific match
2. **Operation only** - Operation-type default
3. **Product only** - Product default
4. **Fallback** - Uses `BATCH-{date}-{seq}` pattern

#### Example Patterns

| Config | Operation | Product | Example Output |
|--------|-----------|---------|----------------|
| Furnace Default | FURNACE | - | `FURN-20260207-0001` |
| Caster Monthly | CASTER | - | `CAST-2602-001` |
| Product Specific | - | HR-COIL | `HR-COIL-20260207-0001` |
| Rolling + Product | ROLLING | CR-SHEET | `CR-SHEET-ROLL-001` |

#### Using BatchNumberService

```java
@Service
public class ProductionService {
    private final BatchNumberService batchNumberService;

    public Batch createBatch(String operationType, String productSku) {
        // Generates batch number based on config
        String batchNumber = batchNumberService.generateBatchNumber(
            operationType, productSku);

        return Batch.builder()
            .batchNumber(batchNumber)
            .build();
    }
}
```

#### Sequence Reset

Sequences reset based on `reset_frequency`:
- **DAILY** - Resets at midnight each day
- **MONTHLY** - Resets on the 1st of each month
- **YEARLY** - Resets on January 1st
- **NEVER** - Continuous sequence (no reset)

#### Split/Merge Batch Numbers

When splitting or merging batches:
- **Split**: Appends suffix to original (e.g., `FURN-20260207-0001-A`, `-B`)
- **Merge**: Generates new number with `MERGED-` prefix

### Demo Mode Schema Alignment

**IMPORTANT:** Demo mode (`--spring.profiles.active=demo`) uses separate schema files that must be kept in sync with patches.

**Files that must stay aligned:**
| File | Purpose |
|------|---------|
| `patches/*.sql` | **Source of truth** - All schema changes go here |
| `demo/schema.sql` | H2-compatible copy of combined patches |
| `demo/data.sql` | Rich demo data for screenshots/demos |

**When adding a new patch:**
1. Create the patch file: `patches/NNN_description.sql`
2. Update `demo/schema.sql` with the equivalent DDL (H2-compatible syntax)
3. Update `demo/data.sql` if new tables need sample data

**Key differences between PostgreSQL patches and H2 demo:**
```sql
-- PostgreSQL (patches/*.sql):
ALTER TABLE batches ALTER COLUMN batch_id RESTART WITH 28;
CREATE INDEX IF NOT EXISTS idx_name ON table(column);

-- H2 (demo/schema.sql):
ALTER TABLE batches ALTER COLUMN batch_id RESTART WITH 28;
CREATE INDEX IF NOT EXISTS idx_name ON table(column);
-- H2 is largely compatible, but GENERATED ALWAYS must be GENERATED BY DEFAULT
```

**Entity Model Changes (MES Spec):**
Per the MES Consolidated Specification:
- **Process** = Design-time entity only (`process_name`, `status`) - NO `order_line_id` FK
- **Operation** = Links to Process via `process_id` AND to OrderLineItem via `order_line_id` for runtime tracking

**Verifying alignment:**
```bash
# Start with demo profile and check for errors
./gradlew bootRun --args='--spring.profiles.active=demo'

# Start with test profile (uses patches)
./gradlew bootRun -Dspring.profiles.active=test
```

If demo mode fails but test mode works, `demo/schema.sql` is out of sync with patches.

### Alternative: Using Patches in Demo Mode (Recommended)

Instead of maintaining separate `demo/schema.sql`, you can configure demo mode to use the patching mechanism like production. This eliminates sync issues entirely.

**Option 1: Demo with PostgreSQL (Recommended)**

Create a demo PostgreSQL database and use patches:

```bash
# Create demo database
psql -U postgres -c "CREATE DATABASE mes_demo"

# Update application-demo.yml:
spring:
  datasource:
    url: jdbc:postgresql://localhost:5432/mes_demo
    username: postgres
    password: postgres
    driver-class-name: org.postgresql.Driver
  jpa:
    hibernate:
      ddl-auto: none
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
  sql:
    init:
      mode: always
      data-locations: classpath:demo/data.sql  # Only load data, not schema
app:
  patch:
    enabled: true  # Enable patch system
  test:
    reset-schema: true  # Reset on each startup for fresh demo
```

Benefits:
- Schema always matches production
- No H2 compatibility issues
- Demo data loaded via `data.sql` after patches

**Option 2: Keeping H2 for Demo**

If H2 is preferred (no PostgreSQL dependency), keep the current setup but:
1. When creating a patch, immediately update `demo/schema.sql`
2. Run both profiles to verify:
   ```bash
   ./gradlew bootRun -Dspring.profiles.active=test    # Test patches
   ./gradlew bootRun --args='--spring.profiles.active=demo'  # Test H2
   ```
3. Add a CI check that starts both profiles

---

## Demo Video & Voiceover

### Quick Start: Create Final Demo (Recommended)

The easiest way to create a complete demo video with synchronized voiceover:

```bash
# Step 1: Install dependencies (from project root)
npm install ffmpeg-static ffprobe-static fluent-ffmpeg google-tts-api

# Step 2: Start backend in demo mode
cd backend
./gradlew bootRun --args="--spring.profiles.active=demo"

# Step 3: Start frontend (new terminal)
cd frontend
npm start

# Step 4: Create final demo (new terminal)
node e2e/create-final-demo.js
```

**Output:** `e2e/output/final/{timestamp}/MES-Demo-{timestamp}.mp4`

### What the Script Does

1. **Generates voiceover audio** - 16 MP3 segments using Google Text-to-Speech (free, no API key)
2. **Concatenates audio** - Combines all segments into one track
3. **Records video** - 1920x1080 HD recording with Playwright
4. **Combines video + audio** - Creates final MP4 with synchronized voiceover

### Output Files

```
e2e/output/final/{timestamp}/
├── MES-Demo-{timestamp}.mp4    # Final video with voiceover (2-3 MB)
├── combined_voiceover.mp3       # Combined audio track (500 KB)
├── audio/                       # Individual voiceover segments
│   ├── 01.mp3                   # Introduction
│   ├── 02.mp3                   # Login
│   └── ...                      # 16 segments total
└── video/
    └── *.webm                   # Source video recording (7-8 MB)
```

### Demo Content (16 Scenes)

| Scene | Title | Duration | Content |
|-------|-------|----------|---------|
| 01 | Introduction | 5s | System overview |
| 02 | Login | 4s | Email/password authentication |
| 03 | Sign In | 4s | JWT token handling |
| 04 | Dashboard | 6s | Key metrics, statistics |
| 05 | Orders List | 5s | Server-side pagination |
| 06 | Order Detail | 5s | Line items, timeline |
| 07 | Production Form | 4s | Core workflow introduction |
| 08 | Select Order/Operation | 5s | BOM suggestions |
| 09 | Enter Details | 5s | Parameter validation |
| 10 | Inventory List | 5s | Filters, search |
| 11 | Batches List | 4s | Batch tracking |
| 12 | Batch Genealogy | 5s | Traceability view |
| 13 | Holds Management | 4s | Apply/release holds |
| 14 | Equipment List | 4s | Status tracking |
| 15 | Quality Inspection | 4s | Accept/reject workflow |
| 16 | Conclusion | 6s | Test coverage summary |

### Alternative: Manual Steps

#### Generate Voiceover Only (No servers required)
```bash
npm install google-tts-api
node e2e/generate-voiceover.js
```
Output: `e2e/output/voiceover/{timestamp}/*.mp3`

#### Record Video Only
```bash
# With servers running:
node e2e/record-demo-video.js
```
Output:
- Video: `e2e/output/videos/demo-{timestamp}/*.webm`
- Screenshots: `e2e/output/screenshots/demo-{timestamp}/*.png`

#### Combine Manually with FFmpeg
```bash
# Concatenate audio files
cd e2e/output/voiceover/{timestamp}
ffmpeg -f concat -safe 0 -i filelist.txt -c copy combined.mp3

# Combine video and audio
ffmpeg -i ../videos/demo-{timestamp}/*.webm -i combined.mp3 \
  -c:v libx264 -c:a aac -shortest final.mp4
```

### Customizing the Demo

#### Modify Demo Script
Edit `e2e/create-final-demo.js`:
- `DEMO_SCENES` array - Add/remove scenes
- `voiceover` property - Change narration text
- `duration` property - Adjust scene timing (milliseconds)
- `action` function - Modify Playwright actions

#### Change Voice Settings
In the script, modify google-tts-api options:
```javascript
await googleTTS.getAudioBase64(text, {
    lang: 'en',      // Language: en, es, fr, de, etc.
    slow: false      // Set true for slower speech
});
```

### Dependencies

| Package | Purpose |
|---------|---------|
| `ffmpeg-static` | Bundled FFmpeg binary (no manual install) |
| `ffprobe-static` | Media file analysis |
| `fluent-ffmpeg` | FFmpeg Node.js wrapper |
| `google-tts-api` | Free Google Text-to-Speech |
| `playwright` | Browser automation & recording |

### Troubleshooting

**"Servers not running" error:**
- Ensure backend responds at http://localhost:8080
- Ensure frontend responds at http://localhost:4200

**Audio generation fails:**
- Check internet connection (uses Google TTS API)
- Script has rate limiting (500ms delay between requests)

**Video recording fails:**
- Check browser can access the application
- Try running with `headless: false` for debugging

**Final video has no audio:**
- Ensure `combined_voiceover.mp3` was created
- Check ffprobe-static is installed

For more details, see [DEMO-GUIDE.md](DEMO-GUIDE.md).

---

## Troubleshooting

### Common Issues

**Backend won't start:**
```
Error: Connection refused to localhost:5432
```
Solution: Use demo mode (`-Dspring-boot.run.profiles=demo`) or start PostgreSQL.

**Frontend won't start:**
```
Error: ENOENT: no such file or directory
```
Solution: Run `npm install` first.

**E2E tests timeout:**
```
Error: Timeout 30000ms exceeded
```
Solution: Ensure both backend and frontend are running.

**JWT token expired:**
```
Error: 401 Unauthorized
```
Solution: Log out and log in again. Tokens expire after 24 hours.

### Logging

**Backend:**
- Log files: `backend/logs/`
- Log level: Edit `application.yml`:
```yaml
logging:
  level:
    com.mes.production: DEBUG
```

**Frontend:**
- Browser console (F12)
- Angular CLI output

### Getting Help

1. Check this documentation
2. Review `.claude/CLAUDE.md` for project context
3. Check `documents/` folder for requirements
4. Review E2E test screenshots for expected behavior

---

## Quick Reference

### Useful Commands

```bash
# Full Test Suite
./run-tests.bat                                           # Run all tests (Windows)
./run-tests.sh                                            # Run all tests (Unix)
./run-tests.bat --backend                                 # Backend tests only
./run-tests.bat --frontend                                # Frontend tests only
./run-tests.bat --e2e                                     # E2E tests only

# Backend
./gradlew bootRun                                         # Start (production database)
./gradlew bootRun -Dspring.profiles.active=test          # Start (test database, schema reset)
./gradlew clean build                                     # Build
./gradlew test -Dspring.profiles.active=test             # Run tests
./gradlew test jacocoTestReport -Dspring.profiles.active=test  # Tests with coverage

# Frontend
npm start                                                 # Start dev server
npm run build                                             # Production build
npm test                                                  # Run tests
npm test -- --code-coverage                              # Tests with coverage

# Frontend Integration
./gradlew copyFrontendToStatic                           # Copy build to Spring Boot static
./gradlew integrateFrontend                              # Build frontend and copy

# E2E Tests
node e2e/run-all-tests.js                                # Run all tests
node e2e/run-all-tests.js --submit --video               # Full test with video
node e2e/record-user-journey.js                          # Record user journey

# Demo Video Creation
node e2e/create-final-demo.js                            # Create final demo with voiceover
node e2e/record-demo-video.js                            # Record video only
node e2e/generate-voiceover.js                           # Generate voiceover only
```

---

## Test Coverage

### Backend Tests (261 tests)

Coverage report location: `backend/build/reports/jacoco/index.html`

| Test Class | Tests | Description |
|------------|-------|-------------|
| AuthControllerTest | 9 | Authentication endpoints |
| BatchControllerTest | 8 | Batch management endpoints |
| BomControllerTest | 5 | BOM validation endpoints |
| DashboardControllerTest | 5 | Dashboard statistics |
| EquipmentControllerTest | 14 | Equipment management (including pagination) |
| HoldControllerTest | 12 | Hold management (including pagination) |
| InventoryControllerTest | 14 | Inventory management |
| MasterDataControllerTest | 10 | Master data endpoints |
| OperationControllerTest | 7 | Operation endpoints |
| OrderControllerTest | 6 | Order endpoints |
| ProcessControllerTest | 6 | Process endpoints |
| ProductionControllerTest | 6 | Production confirmation |
| Service Tests | ~70 | Service layer tests |

### Frontend Tests (257 tests)

Coverage location: `frontend/coverage/`

### E2E Tests (65 tests)

Screenshot output: `e2e/output/screenshots/{timestamp}/`

---

## PostgreSQL vs H2 Compatibility

### JPQL Queries

All paginated queries use standard JPQL syntax that works with both databases:

```java
@Query("SELECT e FROM Equipment e WHERE " +
       "(:status IS NULL OR e.status = :status) AND " +
       "(:type IS NULL OR e.equipmentType = :type) AND " +
       "(:search IS NULL OR LOWER(e.equipmentCode) LIKE :search OR LOWER(e.name) LIKE :search)")
Page<Equipment> findByFilters(...);
```

**Key points:**
- NULL parameter handling: `:param IS NULL OR ...` works on both databases
- LOWER() function: Standard SQL supported by both
- LIKE with wildcards: Add `%` in service layer, not query
- Pageable: Spring Data handles database-specific pagination

### Testing with PostgreSQL

1. **Start PostgreSQL:**
   ```bash
   # Using Docker
   docker run -d --name mes-postgres \
     -e POSTGRES_DB=mes_production \
     -e POSTGRES_USER=mes_user \
     -e POSTGRES_PASSWORD=mes_password \
     -p 5432:5432 postgres:14
   ```

2. **Run application:**
   ```bash
   cd backend
   ./gradlew bootRun
   ```

3. **Verify with curl:**
   ```bash
   # Login
   TOKEN=$(curl -s -X POST http://localhost:8080/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email":"admin@mes.com","password":"admin123"}' \
     | jq -r '.accessToken')

   # Test paginated endpoint
   curl -s "http://localhost:8080/api/orders/paged?page=0&size=20" \
     -H "Authorization: Bearer $TOKEN" | jq '.totalElements'
   ```

---

## Development Hints

### Adding Pagination to a New Entity

1. **Repository - Add findByFilters method:**
   ```java
   @Query("SELECT e FROM MyEntity e WHERE " +
          "(:status IS NULL OR e.status = :status) AND " +
          "(:search IS NULL OR LOWER(e.name) LIKE :search)")
   Page<MyEntity> findByFilters(
       @Param("status") String status,
       @Param("search") String search,
       Pageable pageable);
   ```

2. **Service - Add paged method:**
   ```java
   public PagedResponseDTO<MyDTO> getEntitiesPaged(PageRequestDTO pageRequest) {
       Pageable pageable = pageRequest.toPageable("defaultSortField");
       Page<MyEntity> page;
       if (pageRequest.hasFilters()) {
           page = repository.findByFilters(
               pageRequest.getStatus(),
               pageRequest.getSearchPattern(),
               pageable);
       } else {
           page = repository.findAll(pageable);
       }
       Page<MyDTO> dtoPage = page.map(this::convertToDTO);
       return PagedResponseDTO.fromPage(dtoPage, ...);
   }
   ```

3. **Controller - Add endpoint:**
   ```java
   @GetMapping("/paged")
   public ResponseEntity<PagedResponseDTO<MyDTO>> getEntitiesPaged(
       @RequestParam(defaultValue = "0") int page,
       @RequestParam(defaultValue = "20") int size,
       @RequestParam(required = false) String sortBy,
       @RequestParam(defaultValue = "ASC") String sortDirection,
       @RequestParam(required = false) String search,
       @RequestParam(required = false) String status) {

       PageRequestDTO pageRequest = PageRequestDTO.builder()
           .page(page).size(size).sortBy(sortBy)
           .sortDirection(sortDirection).search(search).status(status)
           .build();
       return ResponseEntity.ok(service.getEntitiesPaged(pageRequest));
   }
   ```

4. **Frontend API Service:**
   ```typescript
   getEntitiesPaged(request: PageRequest = {}): Observable<PagedResponse<MyDTO>> {
     const params = new HttpParams({ fromObject: toQueryParams(request) as any });
     return this.http.get<PagedResponse<MyDTO>>(`${environment.apiUrl}/my-entity/paged`, { params });
   }
   ```

5. **Frontend Component:**
   ```typescript
   // State
   page = 0;
   size = DEFAULT_PAGE_SIZE;
   totalElements = 0;

   // Load data
   loadData(): void {
     const request: PageRequest = {
       page: this.page,
       size: this.size,
       sortBy: 'createdOn',  // Match entity field name!
       sortDirection: 'DESC'
     };
     this.api.getEntitiesPaged(request).subscribe(response => {
       this.items = response.content;
       this.totalElements = response.totalElements;
       // ... update other pagination state
     });
   }
   ```

### Common Pitfalls

1. **sortBy field mismatch:** Frontend sends `sortBy: 'createdAt'` but entity has `createdOn`
   - **Fix:** Always use exact entity field names

2. **Path variable conflicts:** `/paged` conflicts with `/{id}`
   - **Fix:** Add regex constraint: `@GetMapping("/{id:\\d+}")`

3. **Search pattern:** Forgot to add wildcards for LIKE
   - **Fix:** Use `pageRequest.getSearchPattern()` which adds `%` prefix/suffix

4. **NULL handling in JPQL:** Query fails when filter is null
   - **Fix:** Use `(:param IS NULL OR e.field = :param)` pattern

### URLs

| Service | URL |
|---------|-----|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:8080 |

### Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@mes.com | admin123 |
