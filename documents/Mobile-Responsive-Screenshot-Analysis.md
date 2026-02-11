# Mobile Responsive Screenshot Analysis

**Date:** 2026-02-11
**Screenshot Directory:** `e2e/output/screenshots/2026-02-11T04-35-52/`
**Total Responsive Screenshots Analyzed:** 45
**Viewports Tested:** Mobile (375x812), Tablet (768x1024), Tablet Landscape (1024x768)

---

## Summary

| Category | Count | Severity |
|----------|-------|----------|
| Critical Layout Bugs | 3 | HIGH |
| Padding/Margin Issues | 6 | MEDIUM |
| Text/Content Truncation | 5 | MEDIUM |
| Modal/Overlay Issues | 2 | MEDIUM |
| Working Correctly | 29 | OK |

---

## CRITICAL LAYOUT BUGS

### BUG-1: Mobile Nav Menu Shows Only 2 Items (Missing Main Navigation)

**Screenshots:** `434-mobile-nav-menu-open.png`, `435-mobile-nav-all-sections.png`
**Viewport:** Mobile (375x812)
**Severity:** CRITICAL

**Problem:** When the hamburger menu is opened at mobile width, the nav menu only displays:
- "Dashboard" (at the top)
- "Manage" (far below, with huge empty gap)

**Missing:** All main navigation items are completely absent:
- Orders dropdown
- Manufacturing dropdown
- Inventory dropdown
- Quality dropdown

The empty space between "Dashboard" and "Manage" suggests the nav items exist in the DOM but are invisible or have `display: none` / `visibility: hidden` / `opacity: 0` at mobile breakpoint.

**Expected:** All navigation sections should be visible as a vertical list in the mobile slide-out menu.

**Root Cause:** Likely a CSS issue in the header component's mobile media query - the dropdown trigger buttons (which render as horizontal nav items on desktop) may be hidden at mobile without an alternative mobile rendering.

**Files to Fix:** `frontend/src/app/shared/components/header/header.component.css`

---

### BUG-2: Nav Menu Stays Open After Page Navigation (Content Hidden)

**Screenshots:** `441-mobile-dashboard.png`, `442-mobile-dashboard-scrolled.png`, `443-mobile-orders-list.png`, `444-mobile-inventory-list.png`, `445-mobile-batches-list.png`, `446-mobile-equipment-list.png`, `447-mobile-holds-list.png`
**Viewport:** Mobile (375x812)
**Severity:** CRITICAL

**Problem:** After clicking a nav link to navigate to a different page, the mobile nav menu (overlay with X close button) remains open and covers the entire page content. All 7 screenshots listed above show the nav menu overlay instead of the actual page content.

The screenshots show:
- Blue header with X button (menu is open)
- "Dashboard" link at top
- Various nav section labels visible (Orders, Inventory, Manufacturing, Quality)
- **Zero page content visible** - the menu overlay covers everything

**Expected:** After clicking a navigation link, the menu should automatically close and show the destination page content.

**Root Cause:** The header component's `toggleMenu()` or `closeMenu()` is not being called on `Router.events` (NavigationEnd). Navigation changes the route but doesn't close the menu overlay.

**Files to Fix:** `frontend/src/app/shared/components/header/header.component.ts` - Add router subscription to close menu on navigation.

---

### BUG-3: Dashboard "Loading..." Never Resolves at Tablet Viewport

**Screenshot:** `433-mobile-tablet-header.png`
**Viewport:** Tablet (768x1024)
**Severity:** HIGH

**Problem:** The dashboard at tablet viewport shows "Loading dashboard..." spinner indefinitely. The page title "Production Dashboard" is visible but no content loads below the spinner.

**Expected:** Dashboard stats, inventory flow, operations status should all render.

**Note:** This may be a timing issue (screenshot taken before API response) rather than a persistent bug. The same dashboard renders correctly at mobile (375px) in screenshot `324` and `437`.

---

## PADDING / MARGIN ISSUES

### PAD-1: "Administration" Title and Subtitle Text Overlap

**Screenshot:** `459-mobile-manage-landing.png`
**Viewport:** Mobile (375x812)
**Severity:** MEDIUM

**Problem:** On the Manage landing page, the subtitle text "Manage master data, production settings, and system configuration" runs directly into the "Administration" title with no proper line break or spacing. The text appears to be positioned inline or with insufficient margin-top, causing visual overlap.

**Current appearance:**
```
Administration Manage master data,
               production settings, and
               system configuration
```

**Expected:** Title and subtitle should be on separate lines with clear spacing:
```
Administration

Manage master data, production settings,
and system configuration
```

**Files to Fix:** The manage landing component CSS - add `display: block` or `margin-top` to the subtitle element.

---

### PAD-2: Hold Management Buttons Overlap Title

**Screenshots:** `472-mobile-holds-table-scroll.png`, `473-mobile-modal-viewport-fit.png`, `475-mobile-hold-modal-fit.png`
**Viewport:** Mobile (375x812)
**Severity:** MEDIUM

**Problem:** The "Hold Management" page title and the action buttons ("+ New Hold", "Apply Hold") are crowded together. The buttons appear to overlap with or sit on top of the title text, especially the "Apply Hold" button which drops below "New Hold" and visually clashes with the title.

**Current layout:**
```
Hold          + New Hold
Management    Apply Hold    <-- buttons crowd the title
```

**Expected:** At mobile width, buttons should stack below the title with proper margin:
```
Hold Management

+ New Hold    Apply Hold
```

**Files to Fix:** `frontend/src/app/features/holds/hold-list/hold-list.component.css` - Add mobile breakpoint to stack title and buttons vertically.

---

### PAD-3: Inventory Header Buttons Crowding

**Screenshot:** `470-mobile-no-overflow-inventory.png`
**Viewport:** Mobile (375x812)
**Severity:** MEDIUM

**Problem:** The Inventory page header shows the "Inventory" title next to "Receive Material" and "New Inventory" buttons all on the same line. At 375px width, these three elements are tightly packed with minimal spacing.

**Current layout:**
```
Inventory  [Receive Material] [New Inventory]
```

The buttons have adequate padding internally but crowd the title. The green and teal colored buttons touch or nearly touch each other.

**Expected:** At mobile, stack the buttons below the title:
```
Inventory

[Receive Material]  [New Inventory]
```

**Files to Fix:** `frontend/src/app/features/inventory/inventory-list/inventory-list.component.css`

---

### PAD-4: Customer Form Not Stacking to Single Column at Mobile

**Screenshot:** `456-mobile-customer-form.png`
**Viewport:** Tablet (768x1024) - Note: this is tablet, not mobile
**Severity:** LOW-MEDIUM

**Problem:** The customer form at tablet viewport (768px) still shows a 2-column layout for form fields:
- "Customer Code" | "Customer Name" side by side
- "Contact Person" | "Tax ID" side by side
- "Email" | "Phone" side by side
- "City" | "Country" side by side

Additionally, the admin sidebar navigation is visible at the bottom of the screen, which looks out of place.

**Expected:** At tablet width (768px), form fields should stack to single column for better usability, or at minimum the 2-column layout should have adequate spacing.

**Note:** The 2-column layout at 768px is borderline acceptable. The real issue is the sidebar appearing at the bottom.

---

### PAD-5: Production Confirm "Back to Order" Button Spacing

**Screenshots:** `461-mobile-production-form-stacked.png`, `462-mobile-production-info-grid.png`
**Viewport:** Mobile (375x812)
**Severity:** LOW

**Problem:** The "Back to Order" button at the top of the Production Confirmation page has a full-width blue background that extends edge-to-edge, but the "Production Confirmation" title below it has left padding. This creates a slight visual disconnect.

Also, the "Apply Hold" orange button sits directly below the title with minimal vertical spacing, making it look like it belongs to the same title group.

**Expected:** Add ~8px margin-bottom to the "Apply Hold" button or add a subtle separator between the header area and the form content.

---

### PAD-6: Date Range Filter Inputs Not Aligned

**Screenshot:** `465-mobile-report-date-filters.png`
**Viewport:** Mobile (375x812)
**Severity:** LOW

**Problem:** The "From:" and "To:" date inputs are on the same line at mobile width, causing the "To:" date value to be truncated. The date shows "11-02-202" (cut off) instead of the full "11-02-2026".

The "From:" and "To:" labels and inputs should stack vertically at mobile to give each date field full width.

**Files to Fix:** Report component CSS - add mobile breakpoint to stack date inputs vertically.

---

## TEXT / CONTENT TRUNCATION ISSUES

### TRUNC-1: Inventory Flow Cards Cut Off at Right Edge

**Screenshots:** `324-dashboard-mobile-view.png`, `437-mobile-user-profile.png`, `468-mobile-no-overflow-dashboard.png`
**Viewport:** Mobile (375x812)
**Severity:** MEDIUM

**Problem:** The horizontal Inventory Flow section (RM -> WIP -> IM -> FG pipeline) is cut off at the right edge of the mobile viewport. Only the RM card is fully visible with its text "RM Raw... 18 availab" (truncated). The WIP, IM, and FG cards are partially visible or completely hidden.

**Expected:** At mobile width, either:
1. The flow cards should wrap to 2x2 grid, OR
2. The container should be horizontally scrollable with a visual indicator, OR
3. The cards should shrink to fit all 4 in a row

**Files to Fix:** `frontend/src/app/features/dashboard/dashboard.component.css` - Add mobile responsive layout for inventory flow section.

---

### TRUNC-2: Table Columns Truncated on Multiple Pages

**Screenshots & Pages Affected:**

| Screenshot | Page | Truncated Column |
|------------|------|-----------------|
| `448-mobile-customers-list.png` | Customers | "Email" column - shows "john.s", "kwan", "y.tana" |
| `450-mobile-products-list.png` | Products | "Description" column - shows "Cold roll", "Hot rolle" |
| `472-mobile-holds-table-scroll.png` | Holds | "Reason" column - shows "SPEC_DEVIATIO...", "SAFETY_CONC..." |

**Viewport:** Mobile (375x812)
**Severity:** MEDIUM

**Problem:** Table rows show truncated text in the rightmost visible columns. The text is simply cut off without ellipsis or any indication that there's more content.

**Expected:** Either:
1. Add `text-overflow: ellipsis` with `overflow: hidden` for cleaner truncation
2. Make the table container horizontally scrollable with `overflow-x: auto`
3. Hide less important columns at mobile breakpoint and show only essential ones

---

### TRUNC-3: Orders Table Missing Columns at Mobile

**Screenshots:** `438-mobile-nav-navigated-orders.png`, `451-mobile-filters-stacked.png`, `469-mobile-no-overflow-orders.png`, `471-mobile-orders-table-scroll.png`
**Viewport:** Mobile (375x812)
**Severity:** LOW

**Problem:** The orders table at mobile shows only 3 columns: "Order Number", "Customer", "Product". Missing columns: "Quantity", "Status", "Order Date", "Actions".

**Assessment:** This is actually **acceptable responsive behavior** - hiding less critical columns at mobile. However, the "Status" column is arguably important and should be retained if possible.

---

### TRUNC-4: Materials Table Type Badge Positioning

**Screenshot:** `449-mobile-materials-list.png`
**Viewport:** Mobile (375x812)
**Severity:** LOW

**Problem:** The materials table shows "Code", "Name", "Type" columns. The type badges (RAW MATERIAL, INTERMEDIATE, FINISHED GOODS) are color-coded but the badge text is quite wide. Some badges like "RAW MATERIAL" are close to the right edge.

**Assessment:** Currently fits within viewport. Minor issue - badge could use abbreviated text at mobile (e.g., "RM" instead of "RAW MATERIAL").

---

### TRUNC-5: Batch Detail Genealogy Tree Overflow Risk

**Screenshot:** `454-mobile-batch-detail.png`
**Viewport:** Mobile (375x812)
**Severity:** LOW

**Problem:** The batch genealogy tree at the bottom of the detail page shows nodes (B-RM-001, B-IM-001, B-IM-006, B-IM-003) that extend to the edges. With deeper or wider genealogy trees, this would overflow the mobile viewport.

**Assessment:** Currently fits, but fragile for complex batch histories.

---

## MODAL / OVERLAY ISSUES

### MODAL-1: Material Selection Modal - Backdrop Click Intercept

**Screenshot:** `474-error-mobile---modal-search-filters-wrap.png`
**Viewport:** Mobile (375x812)
**Severity:** MEDIUM (Test Failure)

**Problem:** The Material Selection Modal renders correctly at mobile width - search bar, filter dropdown, table with batches, and action buttons (Cancel, Confirm Selection) are all visible and properly formatted.

However, the E2E test failed because clicking the "Cancel" button was intercepted by the `.modal-backdrop` element. This is a z-index layering issue where the backdrop sits above the modal buttons.

**Visual Assessment:** The modal itself looks good - properly sized within viewport, buttons accessible, table scrollable. The issue is purely a CSS z-index problem.

**Files to Fix:** Modal CSS - ensure `.modal-content` has higher `z-index` than `.modal-backdrop`.

---

### MODAL-2: Apply Hold Modal Fits Viewport Correctly

**Screenshots:** `473-mobile-modal-viewport-fit.png`, `475-mobile-hold-modal-fit.png`
**Viewport:** Mobile (375x812)
**Severity:** OK (No issue)

**Assessment:** The Apply Hold modal renders correctly at mobile width:
- Modal title "Apply Hold" with X close button
- Entity Type dropdown - full width
- Reason dropdown - full width
- Comments textarea - full width
- Cancel and Apply Hold buttons - properly spaced at bottom
- Modal fits within 375px viewport with appropriate padding

**Status:** PASS - No fix needed.

---

## PAGES RENDERING CORRECTLY

The following screenshots show pages that render correctly at mobile/tablet viewports with no significant issues:

| # | Screenshot | Page | Assessment |
|---|-----------|------|------------|
| 1 | `324-dashboard-mobile-view.png` | Dashboard (mobile) | Stats cards stack in 2-col grid. Operations status fits well. |
| 2 | `437-mobile-user-profile.png` | Dashboard (after profile) | Dashboard content loads correctly. Inventory flow and stats visible. |
| 3 | `438-mobile-nav-navigated-orders.png` | Orders (mobile) | Table shows 3 key columns, search/filter stack vertically. |
| 4 | `448-mobile-customers-list.png` | Customers (mobile) | Admin list renders with table, search/filters stack. |
| 5 | `449-mobile-materials-list.png` | Materials (mobile) | Table with type badges renders well. |
| 6 | `450-mobile-products-list.png` | Products (mobile) | SKU, Name, Unit columns visible. |
| 7 | `451-mobile-filters-stacked.png` | Orders filters | Search and status filter stack vertically - correct behavior. |
| 8 | `452-mobile-pagination.png` | Pagination | Same as 451, pagination controls work at mobile. |
| 9 | `453-mobile-order-detail.png` | Order Detail | Summary cards stack vertically, metrics readable. Progress bar visible. |
| 10 | `454-mobile-batch-detail.png` | Batch Detail | Batch info, split/merge buttons, genealogy tree all fit. |
| 11 | `455-mobile-order-form.png` | New Order Form | Single column layout, dropdowns full width, line items stack. |
| 12 | `457-mobile-admin-layout.png` | Admin - Customers | Customers list in admin layout renders correctly. |
| 13 | `458-mobile-admin-sidebar-full-width.png` | Admin sidebar | Same as customers list, sidebar collapsed. |
| 14 | `459-mobile-manage-landing.png` | Manage Landing | Admin cards (Customers, Products, Materials) stack vertically. (Title overlap noted in PAD-1) |
| 15 | `460-mobile-production-landing.png` | Production Landing | Clean layout, order selector, availability stats in 2-col. |
| 16 | `461-mobile-production-form-stacked.png` | Production Confirm | Operation details in 2-col grid, sections stack properly. |
| 17 | `462-mobile-production-info-grid.png` | Production Info Grid | Same form, info grid responsive. |
| 18 | `463-mobile-reports-landing.png` | Reports Landing | Report cards stack vertically with icons, descriptions, metrics. |
| 19 | `464-mobile-executive-dashboard.png` | Executive Dashboard | KPI cards stack vertically (Yield, Produced, Scrap, Cycle Time). |
| 20 | `465-mobile-report-date-filters.png` | Report Date Filters | Production summary with date range. (Truncation noted in TRUNC-1) |
| 21 | `466-tablet-landscape-dashboard.png` | Dashboard (tablet landscape) | Full desktop nav visible, all content fits 1024px width. |
| 22 | `467-tablet-landscape-orders.png` | Orders (tablet landscape) | Full table with all columns, desktop-like experience. |
| 23 | `468-mobile-no-overflow-dashboard.png` | Dashboard overflow check | No horizontal scroll detected. |
| 24 | `469-mobile-no-overflow-orders.png` | Orders overflow check | No horizontal scroll detected. |
| 25 | `470-mobile-no-overflow-inventory.png` | Inventory overflow check | No horizontal scroll. (Button crowding noted in PAD-3) |
| 26 | `471-mobile-orders-table-scroll.png` | Orders table scroll | Table renders within viewport. |
| 27 | `436-mobile-nav-dropdown-expanded.png` | Nav dropdown | Orders dropdown expands correctly showing "Order List" and "Production Confirm". |
| 28 | `473-mobile-modal-viewport-fit.png` | Apply Hold modal | Modal fits viewport correctly. |
| 29 | `475-mobile-hold-modal-fit.png` | Hold modal (duplicate) | Same modal, fits correctly. |

---

## PRIORITY FIX LIST

### Priority 1 - Critical (Must Fix)

| # | Issue | Files to Modify | Effort |
|---|-------|----------------|--------|
| BUG-1 | Nav menu missing main items at mobile | `header.component.css` | Medium |
| BUG-2 | Nav menu stays open after navigation | `header.component.ts` | Small |

### Priority 2 - Medium (Should Fix)

| # | Issue | Files to Modify | Effort |
|---|-------|----------------|--------|
| PAD-1 | Admin title/subtitle overlap | Manage landing component CSS | Small |
| PAD-2 | Hold Management buttons overlap title | `hold-list.component.css` | Small |
| PAD-3 | Inventory header buttons crowding | `inventory-list.component.css` | Small |
| TRUNC-1 | Inventory Flow cards cut off | `dashboard.component.css` | Medium |
| MODAL-1 | Modal backdrop z-index intercept | Modal CSS files | Small |

### Priority 3 - Low (Nice to Have)

| # | Issue | Files to Modify | Effort |
|---|-------|----------------|--------|
| PAD-5 | Production confirm button spacing | `production-confirm.component.css` | Small |
| PAD-6 | Date filter input truncation | Report component CSS | Small |
| TRUNC-2 | Table column text truncation | Multiple list component CSS files | Medium |
| TRUNC-4 | Material type badge width | `material-list.component.css` | Small |
| PAD-4 | Customer form 2-col at tablet | `customer-form.component.css` | Small |

---

## SCREENSHOT REFERENCE

All screenshots are located at:
```
D:\repositories\bluemingo-poc\e2e\output\screenshots\2026-02-11T04-35-52\
```

Files prefixed with `error-` indicate E2E test failures:
- `439-error-mobile---nav-link-navigates-to-dashboard.png`
- `440-error-mobile---menu-closes-after-navigation.png`
- `474-error-mobile---modal-search-filters-wrap.png`
