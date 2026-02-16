# Testing Guide

## Running Tests

```bash
# All tests
./run-tests.bat         # Windows
./run-tests.sh          # Unix

# Individual suites
./run-tests.bat --backend
./run-tests.bat --frontend
./run-tests.bat --e2e
```

### Backend Tests
```bash
cd backend && ./gradlew test -Dspring.profiles.active=test
# Uses mes_test database, schema reset before each run
```

### Frontend Tests
```bash
cd frontend && npm test -- --watch=false --browsers=ChromeHeadless
```

### E2E Tests
```bash
node e2e/run-all-tests.js           # Basic
node e2e/run-all-tests.js --submit  # With form submissions
node e2e/run-all-tests.js --video   # Record video
```

## E2E Test Structure

```
e2e/
├── config/
│   ├── playwright.config.js   # Browser/viewport settings
│   └── constants.js           # Selectors, routes, test data
├── tests/
│   ├── 01-auth.test.js        # Authentication
│   ├── 02-dashboard.test.js   # Dashboard
│   ├── 03-orders.test.js      # Orders
│   ├── 04-production.test.js  # Production confirmation
│   ├── 05-inventory.test.js   # Inventory
│   ├── 06-batches.test.js     # Batches
│   ├── 07-holds.test.js       # Holds
│   ├── 08-equipment.test.js   # Equipment
│   └── 09-quality.test.js     # Quality
├── utils/test-helpers.js      # Screenshot, auth, navigation helpers
├── run-all-tests.js           # Master test runner
└── record-user-journey.js     # User journey recorder with video
```

### E2E Test Pattern
```js
export async function runXTests(page, screenshots, results, runTest, submitActions)
```
- Register in `e2e/run-all-tests.js` (both import and call)
- Routes in `e2e/config/constants.js` — hash-based: `/#/path`
- Test files numbered sequentially (01-41 exist, 42+ for new)

### Output
- Screenshots: `e2e/output/screenshots/{timestamp}/`
- Videos: `e2e/output/videos/{timestamp}/`

## Demo Video Creation

### Quick Start
```bash
# 1. Start servers
cd backend && ./gradlew bootRun --args="--spring.profiles.active=demo"
cd frontend && npm start

# 2. Install deps (one-time)
cd e2e && npm install google-tts-api ffmpeg-static ffprobe-static fluent-ffmpeg

# 3. Record + voiceover
node e2e/record-comprehensive-demo.js
node e2e/create-synced-voiceover.js
```

### Demo Scripts

| Script | Purpose |
|--------|---------|
| `record-comprehensive-demo.js` | 33-scene demo with text captions |
| `create-synced-voiceover.js` | Voiceover matching screenshots |
| `add-voiceover-to-demo.js` | Alternative voiceover with timed script |
| `record-demo-with-captions.js` | Simpler 24-scene demo |
| `create-final-demo.js` | All-in-one: record + voiceover |

### 33 Demo Scenes

| Scenes | Feature |
|--------|---------|
| 001-005 | Authentication (login, JWT, redirect) |
| 006-009 | Dashboard (metrics, inventory, orders, audit) |
| 010-014 | Orders (list, filters, detail, line items, operations) |
| 015-019 | Inventory (list, status cards, filters) |
| 020-021 | Batches (list, filter consumed) |
| 022-026 | Holds (list, filter, apply, entity type, release) |
| 027-029 | Equipment (list, status, filter maintenance) |
| 030 | Quality (pending inspection) |
| 031-033 | Logout (session complete, logged out) |

### Troubleshooting
- **Server check failing**: Scripts accept any HTTP response (not just 200)
- **ffprobe not found**: Install `ffprobe-static` package
- **Audio out of sync**: Use `create-synced-voiceover.js`
