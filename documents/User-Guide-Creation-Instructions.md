# User Guide Creation Instructions

**Purpose:** Step-by-step instructions for creating comprehensive user guide documentation with screenshots for the MES POC application. These instructions can be reused for future documentation efforts.

---

## Prerequisites

1. **Backend running** in demo mode:
   ```bash
   cd backend
   ./gradlew bootRun --args="--spring.profiles.active=demo"
   ```

2. **Frontend running** in dev mode:
   ```bash
   cd frontend
   npm start
   ```

3. **Playwright installed** for automated screenshots:
   ```bash
   cd e2e
   npm install playwright
   npx playwright install chromium
   ```

4. **Verify both servers** are accessible:
   - Frontend: `http://localhost:4200/#/login`
   - Backend: `http://localhost:8080/api/auth/login`

---

## Step 1: Determine Scope

### Rule: Only document pages in the navigation menu + their sub-pages

1. **Check the header navigation** in `frontend/src/app/shared/components/header/header.component.html`
   - List every `routerLink` in the `<nav>` element
   - These are the in-scope pages

2. **Check sub-routes** for each feature module:
   - Look at `frontend/src/app/features/{feature}/{feature}-routing.module.ts`
   - List all child routes (detail pages, forms, etc.)

3. **Check the app routing module** at `frontend/src/app/app-routing.module.ts`
   - Confirm which modules are actually routed
   - Any route not defined here will redirect to dashboard (wildcard `**` route)

4. **Cross-reference with the POC Specification** (`documents/MES-POC-Specification.md`)
   - Section 1.2 (POC Scope) lists core screens
   - Section 1.3 lists out-of-scope items
   - Only document what's in scope

### Current POC Scope (as of Feb 2026)

| Menu Item | Route | Sub-pages |
|-----------|-------|-----------|
| Login | `/#/login` | Single page |
| Dashboard | `/#/dashboard` | Single page |
| Orders | `/#/orders` | List, Detail (`/:id`), Create (`/new`), Edit (`/:id/edit`) |
| Production | `/#/production` | Landing, Confirm (`/confirm/:opId`), History (`/history`) |
| Batches | `/#/batches` | List, Detail (`/:id`), Create (`/new`), Edit (`/:id/edit`) |

---

## Step 2: Capture Full-Page Screenshots

### Automated Script: `e2e/capture-user-guide-screenshots.js`

This Playwright script visits every page and captures numbered screenshots.

**Key patterns:**

```javascript
const { chromium } = require('playwright');

// Standard viewport for consistent screenshots
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await context.newPage();

// Screenshot with auto-numbering
async function screenshot(page, name, opts = {}) {
    counter++;
    const num = String(counter).padStart(3, '0');
    const filename = `${num}-${name}.png`;

    if (opts.locator) {
        // Cropped screenshot of specific element
        await opts.locator.screenshot({ path: filepath });
    } else {
        // Full page screenshot
        await page.screenshot({ path: filepath, fullPage: opts.fullPage || false });
    }
}
```

**For each in-scope page, capture:**

1. **Full page view** -- The complete page as first loaded
2. **Filter/search area** -- If the page has filters
3. **Data table** -- The main table content
4. **Status badges** -- Different status variations visible in the table
5. **Pagination controls** -- If paginated
6. **Detail views** -- Navigate into specific records
7. **Forms** -- Create/edit forms with empty and filled states
8. **Action results** -- Success/error messages after actions

**Screenshot naming convention:**
```
{3-digit-number}-{descriptive-kebab-case-name}.png
Examples:
001-login-page-empty.png
017-orders-list-full.png
026-order-detail-in-progress-full.png
```

### Tips for Status Badge Screenshots

**Problem:** Multiple badges of the same status type produce duplicate-looking screenshots.

**Solution:** Instead of capturing individual badge elements, capture the **entire table row** that contains each badge, showing the badge in context:

```javascript
// BAD: Individual badges look the same
const badges = page.locator('.status-badge');
for (let i = 0; i < 5; i++) {
    await screenshot(page, `badge-${i}`, { locator: badges.nth(i) });
}

// GOOD: Capture rows showing different statuses
// First filter to a specific status, then capture the table
const statuses = ['CREATED', 'IN_PROGRESS', 'COMPLETED', 'ON_HOLD'];
for (const status of statuses) {
    await page.selectOption('select.status-filter', status);
    await page.waitForTimeout(500);
    const firstRow = page.locator('table tbody tr').first();
    if (await firstRow.count() > 0) {
        await screenshot(page, `orders-status-${status.toLowerCase()}`, { locator: firstRow });
    }
}
```

### Running the Script

```bash
cd e2e
node capture-user-guide-screenshots.js
```

Output goes to: `e2e/output/user-guide-screenshots/{timestamp}/`

---

## Step 3: Capture Panel-Specific Cropped Screenshots

### Automated Script: `e2e/capture-panel-screenshots.js`

This script targets specific UI panels, sections, buttons, and cards within each page.

**Key patterns for cropping panels:**

```javascript
// Target specific CSS classes for panels
await screenshot(page, 'panel-dashboard-top-row', {
    locator: page.locator('.dashboard-row, .stats-row, .row').first()
});

// Target individual cards
const cards = page.locator('.card, .stat-card, .dashboard-card');
for (let i = 0; i < Math.min(await cards.count(), 8); i++) {
    await screenshot(page, `panel-card-${i+1}`, { locator: cards.nth(i) });
}
```

**Important: Fallback handling**
- If a CSS selector doesn't match, the script falls back to a full-page screenshot
- Review output to identify which crops actually captured panels vs. fell back
- Adjust selectors based on actual CSS classes in the components

**Finding CSS selectors:**
1. Open the Angular component HTML: `frontend/src/app/features/{feature}/{component}/{component}.component.html`
2. Look for class names on major `<div>` sections
3. Use browser DevTools (F12) to inspect elements and find stable selectors

### Numbering Convention

Panel screenshots continue from where full-page screenshots left off:
```
080-panel-dashboard-top-row.png
081-panel-dashboard-card-1-detail.png
...
```

---

## Step 4: Collect Color Information

### Status Badge Colors

The application uses a `StatusBadgeComponent` with CSS-defined colors.

**Source file:** `frontend/src/app/shared/components/status-badge/status-badge.component.css`

**How to extract colors:**
1. Read the CSS file
2. Map each CSS class to its status:
   - `.badge-completed` → COMPLETED
   - `.badge-in-progress` → IN_PROGRESS
   - `.badge-on-hold` → ON_HOLD
   - etc.
3. Extract `background-color` and `color` properties from each class
4. The convention is CSS class = `badge-{status-in-kebab-case}`
   - Status `IN_PROGRESS` → class `badge-in-progress`
   - Status `QUALITY_PENDING` → class `badge-quality-pending`

**Color palette used:** Material Design 50-level backgrounds, 900-level text:

| Color Family | Background (50) | Text (900) | Used For |
|-------------|-----------------|------------|----------|
| Green | `#e8f5e9` | `#2e7d32` | COMPLETED, AVAILABLE, CONFIRMED |
| Blue | `#e3f2fd` | `#1565c0` | IN_PROGRESS, READY, PRODUCED |
| Amber | `#fff8e1` | `#f57f17` | ON_HOLD, RESERVED |
| Red | `#ffebee` | `#c62828` | BLOCKED, REJECTED |
| Purple | `#f3e5f5` | `#7b1fa2` | CREATED, PLANNED |
| Orange | `#fff3e0` | `#e65100` | PENDING, QUALITY_PENDING |
| Blue-Grey | `#eceff1` | `#546e7a` | NOT_STARTED |
| Brown | `#efebe9` | `#5d4037` | SCRAPPED, CANCELLED |

### Flow Chart Node Colors

Check the order detail component for flow chart colors:
`frontend/src/app/features/orders/order-detail/order-detail.component.ts`

Look for the `getStatusColor()` or similar method that maps statuses to chart node border/fill colors.

---

## Step 5: Write the User Guide Document

### File Location

`documents/MES-User-Guide-Complete.md`

### Document Structure

```markdown
# Application Name - Complete User Guide

**Application:** Name
**Version:** Version
**URL:** `http://localhost:4200/#/login`

---

## Table of Contents
(Auto-numbered, one entry per section)

---

## 1. Application Overview
- Key capabilities bullet list
- Technology summary

## 2. Login and Authentication
- Login page screenshot
- Credential fields
- Validation rules table
- Login flow steps
- What happens on login (JWT, redirect)

## 3. Navigation and Layout
- Header screenshot
- Menu items table (icon, URL, description)
- User profile dropdown behavior

## N. [Page Name]
For each page in scope:
- Full page screenshot
- Page header description
- Filter area (if any) + panel crop
- Data table columns table
- Status badges table with colors
- Action buttons table
- Panel crops inline
- Database side effects of actions

## Status Color Reference
- Color palette overview table
- Per-entity status color tables
- Flow chart node colors

## Pagination and Sorting
## Keyboard Shortcuts
## Workflow Reference
## Validation Rules Reference
## Troubleshooting
## Appendix A: URL Reference
## Appendix B: API Endpoint Reference
## Appendix C: Glossary
```

### Writing Guidelines

1. **Screenshot references:** Use relative paths from the documents folder:
   ```markdown
   ![Description](../e2e/output/user-guide-screenshots/{timestamp}/{filename}.png)
   ```

2. **Panel crops inline:** Add cropped panel images right after describing the panel:
   ```markdown
   ### Section Name

   Description of what this section shows...

   **Panel Detail (Cropped):**

   ![Panel description](../e2e/output/user-guide-screenshots/{timestamp}/panels/{filename}.png)
   ```

3. **Color tables:** Include both hex codes and visual description:
   ```markdown
   | Status | Badge Appearance | Background | Text Color |
   |--------|-----------------|------------|------------|
   | COMPLETED | Green text on light green bg | `#e8f5e9` | `#2e7d32` |
   ```

4. **Action side effects:** Document what happens in the database when a user action is performed:
   ```markdown
   **What happens when production is confirmed:**
   1. A ProductionConfirmation record is created
   2. Input inventory states change to CONSUMED
   3. Output batch created with PRODUCED status
   ...
   ```

5. **Validation rules:** Use tables with Field, Rules columns:
   ```markdown
   | Field | Rules |
   |-------|-------|
   | Email | Required, valid email format |
   ```

6. **No industry-specific references:** Keep the guide generic (e.g., say "manufacturing" not "steel manufacturing")

7. **Only document in-scope pages:** Pages that are in the navigation menu and their sub-pages

---

## Step 6: Validate Screenshots

### Common Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Panel crops show full page | CSS selector didn't match | Check actual CSS classes in component HTML |
| Multiple identical badge images | All visible rows have same status | Filter by status first, then capture one row per status |
| Empty tables | Demo data not loaded | Ensure backend runs with `--spring.profiles.active=demo` |
| Screenshots show loading spinners | `waitForTimeout` too short | Increase timeout or use `waitForSelector` |
| Screenshots cut off | Viewport too small | Use `{ fullPage: true }` for long pages |

### Validation Checklist

- [ ] Every in-scope page has at least one full-page screenshot
- [ ] Panel crops actually show the cropped panel (not full page fallback)
- [ ] Status badge screenshots show different statuses (not all the same)
- [ ] All screenshots are referenced in the user guide document
- [ ] No screenshots of out-of-scope pages remain in the document
- [ ] Color hex codes match the actual CSS file values
- [ ] All relative image paths are correct

---

## Step 7: Review and Finalize

1. **Read through the entire document** end-to-end
2. **Verify every image reference** loads correctly
3. **Check section numbering** is sequential with no gaps
4. **Verify Table of Contents** matches actual section headings
5. **Remove out-of-scope content** that may have been added by mistake
6. **Commit** the document, screenshots, and capture scripts

### Git Commit

```bash
git add documents/MES-User-Guide-Complete.md
git add e2e/capture-user-guide-screenshots.js
git add e2e/capture-panel-screenshots.js
git add e2e/output/user-guide-screenshots/
git commit -m "Add comprehensive user guide with screenshots"
```

---

## Quick Reference: File Locations

| File | Purpose |
|------|---------|
| `documents/MES-User-Guide-Complete.md` | The user guide document |
| `e2e/capture-user-guide-screenshots.js` | Full-page screenshot capture script |
| `e2e/capture-panel-screenshots.js` | Panel-specific cropped screenshot script |
| `e2e/output/user-guide-screenshots/{timestamp}/` | Full-page screenshot output |
| `e2e/output/user-guide-screenshots/{timestamp}/panels/` | Panel crop output |
| `frontend/src/app/shared/components/status-badge/status-badge.component.css` | Status badge color definitions |
| `frontend/src/app/shared/components/header/header.component.html` | Navigation menu items |
| `frontend/src/app/app-routing.module.ts` | Route definitions |
| `frontend/src/app/features/{module}/{module}-routing.module.ts` | Sub-page routes |
| `documents/MES-POC-Specification.md` | POC scope reference |

---

## Appendix: Useful Playwright Patterns

### Wait for page load
```javascript
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(1500); // Extra settle time for Angular
```

### Screenshot specific element
```javascript
const element = page.locator('.my-class').first();
if (await element.count() > 0 && await element.isVisible()) {
    await element.screenshot({ path: 'output.png' });
}
```

### Filter then capture
```javascript
await page.selectOption('select.status-filter', 'COMPLETED');
await page.waitForTimeout(500);
await page.screenshot({ path: 'filtered.png' });
```

### Navigate with hash routing
```javascript
await page.goto(`${BASE_URL}/#/orders/1`, { waitUntil: 'networkidle' });
```

### Login helper
```javascript
async function login(page) {
    await page.goto(`${BASE_URL}/#/login`, { waitUntil: 'networkidle' });
    await page.fill('input[formControlName="email"]', 'admin@mes.com');
    await page.fill('input[formControlName="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard', { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(1500);
}
```
