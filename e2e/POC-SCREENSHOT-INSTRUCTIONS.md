# POC Demo Screenshot Capture Instructions

**Date:** 08-02-2026
**Purpose:** Instructions for capturing screenshots for MES-POC-Demo-Document.md

---

## Prerequisites

1. **Backend running in demo mode:**
   ```bash
   cd backend
   ./gradlew bootRun --args='--spring.profiles.active=demo'
   ```

2. **Frontend running:**
   ```bash
   cd frontend
   npm start
   ```

3. **Verify servers:**
   - Backend: http://localhost:8080
   - Frontend: http://localhost:4200

---

## Screenshot Scripts

### 1. Main POC Screenshots (`capture-poc-final.js`)

**Purpose:** Captures the 14 core screenshots for the POC demo document.

**Run:**
```bash
cd e2e
node capture-poc-final.js
```

**Screenshots captured:**
| # | Filename | Screen | Description |
|---|----------|--------|-------------|
| 1 | 01-login-page.png | Login | Empty login form |
| 2 | 02-login-filled.png | Login | Form with credentials entered |
| 3 | 03-dashboard-full.png | Dashboard | Full dashboard view |
| 4 | 06-orders-list.png | Orders | Orders list page |
| 5 | 07-order-detail-inprogress.png | Orders | Order detail (IN_PROGRESS) |
| 6 | 11-production-confirm-empty.png | Production | Empty confirmation form |
| 7 | 15-batches-list.png | Traceability | Batches list page |
| 8 | 16-batch-detail.png | Traceability | Batch detail with info |
| 9 | 21-production-with-operation.png | Production | Form with operation loaded |
| 10 | 22-production-materials.png | Production | Material consumption section |
| 11 | 23-production-parameters.png | Production | Process parameters section |
| 12 | 24-production-resources.png | Production | Equipment & operators section |
| 13 | 25-production-output.png | Production | Output quantities section |
| 14 | 27-batch-with-genealogy.png | Traceability | Batch with genealogy |

---

### 2. Production Form Sections (`capture-production-sections.js`)

**Purpose:** Captures detailed screenshots of each production confirmation form section.

**Run:**
```bash
cd e2e
node capture-production-sections.js
```

**Screenshots captured:**
| # | Filename | Section | Description |
|---|----------|---------|-------------|
| 1 | 21-production-with-operation.png | Full form | Complete form with operation selected |
| 2 | 22-production-materials.png | Materials | Material consumption table |
| 3 | 23-production-parameters.png | Parameters | Process parameter inputs |
| 4 | 24-production-resources.png | Resources | Equipment and operator dropdowns |
| 5 | 25-production-output.png | Output | Produced/scrap quantities |
| 6 | 26-production-confirm-button.png | Button | Confirm button area |

**How it works:**
1. Logs in as admin@mes.com
2. Navigates to Orders page
3. Clicks "Start Production" on first READY operation
4. Captures full form screenshot
5. Finds each card section and captures individually
6. Uses clip regions for precise section capture

---

### 3. Original Full Capture (`capture-poc-screenshots.js`)

**Purpose:** Original script that captures 20 screenshots covering all screens.

**Run:**
```bash
cd e2e
node capture-poc-screenshots.js
```

**Screenshots captured:**
| # | Filename | Description |
|---|----------|-------------|
| 1-2 | 01-02 | Login screens |
| 3-5 | 03-05 | Dashboard (full, metrics, charts) |
| 6 | 06 | Orders list |
| 7-10 | 07-10 | Order details (different statuses) |
| 11 | 11 | Production confirm empty |
| 12-14 | 12-14 | Inventory (all, available, blocked) |
| 15-16 | 15-16 | Batches (list, detail) |
| 17 | 17 | Holds list |
| 18 | 18 | Equipment list |
| 19 | 19 | Quality pending |
| 20 | 20 | Receive material |

---

## Output Directory

All screenshots are saved to:
```
e2e/output/poc-demo-screenshots/
```

---

## Troubleshooting

### Screenshots show loading spinner
- Increase delay times in script
- Check if backend is returning data properly

### Screenshots are duplicates (same file size)
- Dropdown selections may not be working
- Use `capture-production-sections.js` which uses element-based scrolling

### Script fails on dropdown selection
- Check if the option values match exactly
- Use `selectOption({ index: 1 })` instead of value matching

### Page not loading
- Verify both servers are running
- Check browser console for errors
- Increase `waitForLoadState` timeout

---

## Demo Document Reference

The screenshots are used in:
```
documents/MES-POC-Demo-Document.md
```

Screenshot paths in document use relative paths:
```markdown
![Login Page](../e2e/output/poc-demo-screenshots/01-login-page.png)
```

---

## Quick Recapture Commands

**Recapture all POC screenshots:**
```bash
cd e2e && node capture-poc-final.js
```

**Recapture only production sections:**
```bash
cd e2e && node capture-production-sections.js
```

**Recapture everything (extended):**
```bash
cd e2e && node capture-poc-screenshots.js
```

---

## Script Descriptions Summary

| Script | Purpose | Output |
|--------|---------|--------|
| `capture-poc-final.js` | Core POC screenshots (4 screens) | 14 PNG files |
| `capture-production-sections.js` | Production form sections only | 6 PNG files |
| `capture-poc-screenshots.js` | Full capture including extras | 20 PNG files |
| `capture-poc-screenshots-enhanced.js` | Extended with filters | 45 PNG files |
| `capture-screenshots-fixed.js` | Fixed version with better waits | 35 PNG files |
| `capture-remaining-screenshots.js` | Continuation script | 12 PNG files |
| `generate-pdf.js` | Generate PDF from demo document | 1 PDF file |

---

## PDF Generation (`generate-pdf.js`)

**Purpose:** Converts the MES-POC-Demo-Document.md to a professionally styled PDF with embedded screenshots.

**Run:**
```bash
cd e2e
node generate-pdf.js
```

**Input:** `documents/MES-POC-Demo-Document.md`
**Output:** `documents/MES-POC-Demo-Document.pdf`

**How it works:**
1. Reads the markdown file from `documents/` folder
2. Converts relative image paths (`../e2e/output/poc-demo-screenshots/`) to absolute `file:///` paths
3. Converts markdown to HTML using the `marked` library
4. Applies professional CSS styling:
   - Blue headers with borders
   - Styled tables with alternating row colors
   - Dark code blocks with syntax highlighting colors
   - Bordered images with shadows
   - Proper print margins
5. Writes temporary HTML file
6. Launches Playwright (Chromium) to render the HTML
7. Generates A4 PDF with:
   - Custom header: "MES Production Confirmation - POC Demo Document"
   - Custom footer: Page numbers + "BLUEMINGO TECH PRIVATE LIMITED"
   - 20mm top/bottom, 15mm left/right margins
8. Cleans up temporary HTML file

**Dependencies:**
```bash
npm install playwright marked
```

**Styling Features:**
| Element | Style |
|---------|-------|
| H1 | Dark blue (#1a365d), 24pt, bottom border |
| H2 | Medium blue (#2c5282), 18pt, page-break-after: avoid |
| Tables | Collapsed borders, alternating row colors |
| Code blocks | Dark background (#1a202c), monospace font |
| Images | Rounded corners, subtle shadow, max-width: 100% |

**Troubleshooting:**
- If images don't appear, ensure screenshots exist in `e2e/output/poc-demo-screenshots/`
- If PDF is blank, check the markdown file path is correct
- For large documents, increase the `waitForTimeout` value (default: 2000ms)

---

*End of Instructions*
