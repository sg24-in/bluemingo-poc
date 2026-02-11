# MES Responsive UI & E2E Test Governance

> **Version:** 1.0
> **Last Updated:** 2026-02-11
> **Scope:** MES Production Confirmation POC (Bluemingo POC)
> **Purpose:** Enterprise-grade governance for responsive UI standards, E2E test organization, CI tiering, CSS architecture, and regression guard rules.

---

## Table of Contents

1. [Route Coverage Matrix](#1-route-coverage-matrix)
2. [Test ID Convention](#2-test-id-convention)
3. [CI Test Tier Classification](#3-ci-test-tier-classification)
4. [Responsive Breakpoint Standard](#4-responsive-breakpoint-standard)
5. [CSS Rules for New Components](#5-css-rules-for-new-components)
6. [CSS Architecture Audit](#6-css-architecture-audit)
7. [Design Tokens (Proposed)](#7-design-tokens-proposed)
8. [Z-Index Stacking Order](#8-z-index-stacking-order)
9. [Color Palette Reference](#9-color-palette-reference)
10. [API Testing Standards](#10-api-testing-standards)
11. [Security Testing Standards](#11-security-testing-standards)
12. [Accessibility Baseline](#12-accessibility-baseline)
13. [Performance Baseline](#13-performance-baseline)
14. [Test File Naming Convention](#14-test-file-naming-convention)
15. [Component CSS Checklist](#15-component-css-checklist)
16. [Test-Fix Governance Rule](#16-test-fix-governance-rule)
17. [Regression Guard Rule](#17-regression-guard-rule)

---

## 1. Route Coverage Matrix

Every application route must have at least one E2E test covering navigation, render, and primary action. The table below maps routes to auth requirements, layout wrappers, lazy-loaded modules, guards, covering test files, and test priority.

### Public Routes

| Route | Auth | Layout | Module | Guards | E2E Test Files | Priority |
|-------|------|--------|--------|--------|----------------|----------|
| `/#/login` | None | None (standalone) | `AuthModule` | None | `01-auth`, `51-auth-security` | P0 |

### Main Layout Routes (AuthGuard Protected)

| Route | Auth | Layout | Module | Guards | E2E Test Files | Priority |
|-------|------|--------|--------|--------|----------------|----------|
| `/#/dashboard` | JWT | `MainLayoutComponent` | `DashboardModule` | `AuthGuard` | `02-dashboard`, `38-dashboard-features` | P0 |
| `/#/orders` | JWT | `MainLayoutComponent` | `OrdersModule` | `AuthGuard` | `03-orders`, `23-order-selection`, `32-order-crud`, `45-crud-submissions` | P0 |
| `/#/orders/:id` | JWT | `MainLayoutComponent` | `OrdersModule` | `AuthGuard` | `25-detail-pages`, `44-entity-detail-pages` | P1 |
| `/#/orders/new` | JWT | `MainLayoutComponent` | `OrdersModule` | `AuthGuard` | `32-order-crud`, `39-form-validations` | P1 |
| `/#/production` | JWT | `MainLayoutComponent` | `ProductionModule` | `AuthGuard` | `04-production`, `33-production-complete`, `41-production-flow-e2e` | P0 |
| `/#/production/confirm` | JWT | `MainLayoutComponent` | `ProductionModule` | `AuthGuard` | `04-production`, `24-partial-confirmation`, `26-process-parameters` | P0 |
| `/#/production/history` | JWT | `MainLayoutComponent` | `ProductionModule` | `AuthGuard` | `21-production-history` | P1 |
| `/#/inventory` | JWT | `MainLayoutComponent` | `InventoryModule` | `AuthGuard` | `05-inventory`, `10-pagination` | P0 |
| `/#/inventory/:id` | JWT | `MainLayoutComponent` | `InventoryModule` | `AuthGuard` | `25-detail-pages`, `44-entity-detail-pages` | P1 |
| `/#/inventory/receive` | JWT | `MainLayoutComponent` | `InventoryModule` | `AuthGuard` | `34-receive-material` | P1 |
| `/#/batches` | JWT | `MainLayoutComponent` | `BatchesModule` | `AuthGuard` | `06-batches`, `10-pagination`, `35-batch-operations` | P0 |
| `/#/batches/:id` | JWT | `MainLayoutComponent` | `BatchesModule` | `AuthGuard` | `25-detail-pages`, `44-entity-detail-pages` | P1 |
| `/#/holds` | JWT | `MainLayoutComponent` | `HoldsModule` | `AuthGuard` | `07-holds`, `10-pagination` | P1 |
| `/#/holds/:id` | JWT | `MainLayoutComponent` | `HoldsModule` | `AuthGuard` | `25-detail-pages`, `44-entity-detail-pages` | P1 |
| `/#/equipment` | JWT | `MainLayoutComponent` | `EquipmentModule` | `AuthGuard` | `08-equipment`, `10-pagination` | P1 |
| `/#/equipment/:id` | JWT | `MainLayoutComponent` | `EquipmentModule` | `AuthGuard` | `25-detail-pages`, `44-entity-detail-pages` | P1 |
| `/#/operations` | JWT | `MainLayoutComponent` | `OperationsModule` | `AuthGuard` | `17-operations` | P1 |
| `/#/operations/:id` | JWT | `MainLayoutComponent` | `OperationsModule` | `AuthGuard` | `42-new-detail-pages`, `44-entity-detail-pages` | P1 |
| `/#/profile` | JWT | `MainLayoutComponent` | `ProfileModule` | `AuthGuard` | `19-user-profile` | P1 |
| `/#/change-password` | JWT | `MainLayoutComponent` | `ChangePasswordModule` | `AuthGuard` | `43-change-password` | P2 |
| `/#/reports` | JWT | `MainLayoutComponent` | `ReportsModule` | `AuthGuard` | `48-reports` | P1 |
| `/#/reports/production-summary` | JWT | `MainLayoutComponent` | `ReportsModule` | `AuthGuard` | `48-reports` | P1 |
| `/#/reports/scrap-analysis` | JWT | `MainLayoutComponent` | `ReportsModule` | `AuthGuard` | `48-reports` | P2 |
| `/#/reports/inventory-balance` | JWT | `MainLayoutComponent` | `ReportsModule` | `AuthGuard` | `48-reports` | P2 |
| `/#/reports/order-fulfillment` | JWT | `MainLayoutComponent` | `ReportsModule` | `AuthGuard` | `48-reports` | P2 |
| `/#/reports/operations-report` | JWT | `MainLayoutComponent` | `ReportsModule` | `AuthGuard` | `48-reports` | P2 |
| `/#/reports/executive-dashboard` | JWT | `MainLayoutComponent` | `ReportsModule` | `AuthGuard` | `48-reports` | P2 |

### Admin Layout Routes (AuthGuard Protected)

| Route | Auth | Layout | Module | Guards | E2E Test Files | Priority |
|-------|------|--------|--------|--------|----------------|----------|
| `/#/manage` | JWT | `AdminLayoutComponent` | `ManageLandingComponent` | `AuthGuard` | `27-admin-sidebar` | P1 |
| `/#/manage/customers` | JWT | `AdminLayoutComponent` | `CustomersModule` | `AuthGuard` | `11-crud`, `12-entity-crud`, `45-crud-submissions` | P1 |
| `/#/manage/customers/:id` | JWT | `AdminLayoutComponent` | `CustomersModule` | `AuthGuard` | `44-entity-detail-pages` | P2 |
| `/#/manage/materials` | JWT | `AdminLayoutComponent` | `MaterialsModule` | `AuthGuard` | `11-crud`, `12-entity-crud`, `45-crud-submissions` | P1 |
| `/#/manage/materials/:id` | JWT | `AdminLayoutComponent` | `MaterialsModule` | `AuthGuard` | `44-entity-detail-pages` | P2 |
| `/#/manage/products` | JWT | `AdminLayoutComponent` | `ProductsModule` | `AuthGuard` | `11-crud`, `12-entity-crud`, `45-crud-submissions` | P1 |
| `/#/manage/products/:id` | JWT | `AdminLayoutComponent` | `ProductsModule` | `AuthGuard` | `44-entity-detail-pages` | P2 |
| `/#/manage/bom` | JWT | `AdminLayoutComponent` | `BomModule` | `AuthGuard` | `13-bom-crud` | P1 |
| `/#/manage/equipment` | JWT | `AdminLayoutComponent` | `EquipmentModule` | `AuthGuard` | `08-equipment` | P2 |
| `/#/manage/operators` | JWT | `AdminLayoutComponent` | `OperatorsModule` | `AuthGuard` | `16-operators` | P1 |
| `/#/manage/operators/:id` | JWT | `AdminLayoutComponent` | `OperatorsModule` | `AuthGuard` | `44-entity-detail-pages` | P2 |
| `/#/manage/config` | JWT | `AdminLayoutComponent` | `ConfigModule` | `AuthGuard` | `14-config-crud` | P1 |
| `/#/manage/config/hold-reasons` | JWT | `AdminLayoutComponent` | `ConfigModule` | `AuthGuard` | `14-config-crud` | P2 |
| `/#/manage/config/delay-reasons` | JWT | `AdminLayoutComponent` | `ConfigModule` | `AuthGuard` | `14-config-crud` | P2 |
| `/#/manage/config/process-params` | JWT | `AdminLayoutComponent` | `ConfigModule` | `AuthGuard` | `14-config-crud` | P2 |
| `/#/manage/config/batch-number` | JWT | `AdminLayoutComponent` | `ConfigModule` | `AuthGuard` | `14-config-crud` | P2 |
| `/#/manage/config/quantity-type` | JWT | `AdminLayoutComponent` | `ConfigModule` | `AuthGuard` | `14-config-crud` | P2 |
| `/#/manage/config/batch-size` | JWT | `AdminLayoutComponent` | `ConfigModule` | `AuthGuard` | `14-config-crud` | P2 |
| `/#/manage/audit` | JWT | `AdminLayoutComponent` | `AuditModule` | `AuthGuard` | `15-audit-history` | P1 |
| `/#/manage/users` | JWT | `AdminLayoutComponent` | `UsersModule` | `AuthGuard` | `20-users` | P1 |
| `/#/manage/users/:id` | JWT | `AdminLayoutComponent` | `UsersModule` | `AuthGuard` | `44-entity-detail-pages` | P2 |
| `/#/manage/processes` | JWT | `AdminLayoutComponent` | `ProcessesModule` | `AuthGuard` | `18-processes` | P1 |
| `/#/manage/processes/:id` | JWT | `AdminLayoutComponent` | `ProcessesModule` | `AuthGuard` | `44-entity-detail-pages` | P2 |
| `/#/manage/routing` | JWT | `AdminLayoutComponent` | `RoutingModule` | `AuthGuard` | `22-routing`, `36-routing-crud` | P1 |
| `/#/manage/routing/:id` | JWT | `AdminLayoutComponent` | `RoutingModule` | `AuthGuard` | `44-entity-detail-pages` | P2 |
| `/#/manage/operation-templates` | JWT | `AdminLayoutComponent` | `OperationTemplatesModule` | `AuthGuard` | `37-operation-templates` | P1 |
| `/#/manage/operation-templates/:id` | JWT | `AdminLayoutComponent` | `OperationTemplatesModule` | `AuthGuard` | `44-entity-detail-pages` | P2 |

### Wildcard Route

| Route | Auth | Layout | Module | Guards | E2E Test Files | Priority |
|-------|------|--------|--------|--------|----------------|----------|
| `**` (wildcard) | N/A | N/A | Redirect to `/#/dashboard` | N/A | `01-auth` | P0 |

---

## 2. Test ID Convention

All test cases, governance rules, and regression guards must use a structured identifier for traceability, CI filtering, and defect tracking.

### Format

```
{MODULE}-{TYPE}-{PRIORITY}-{SEQ}
```

### MODULE Codes

| Code | Domain | Example Routes |
|------|--------|----------------|
| `AUTH` | Authentication & Login | `/#/login` |
| `DASH` | Dashboard | `/#/dashboard` |
| `ORD` | Orders | `/#/orders`, `/#/orders/:id`, `/#/orders/new` |
| `PROD` | Production | `/#/production`, `/#/production/confirm` |
| `INV` | Inventory | `/#/inventory`, `/#/inventory/receive` |
| `BAT` | Batches | `/#/batches`, `/#/batches/:id` |
| `HLD` | Holds | `/#/holds` |
| `EQP` | Equipment | `/#/equipment` |
| `OPS` | Operations | `/#/operations` |
| `PROC` | Processes | `/#/manage/processes` |
| `RTG` | Routing | `/#/manage/routing` |
| `CFG` | Configuration | `/#/manage/config/*` |
| `ADM` | Admin Layout & Sidebar | `/#/manage` |
| `USR` | Users & Profiles | `/#/manage/users`, `/#/profile` |
| `RPT` | Reports | `/#/reports/*` |
| `MOB` | Mobile / Responsive | Cross-cutting responsive tests |
| `API` | API Error Handling | Cross-cutting API tests |
| `SEC` | Security | Cross-cutting security tests |
| `BOM` | Bill of Materials | `/#/manage/bom` |
| `MAT` | Materials | `/#/manage/materials` |
| `CUS` | Customers | `/#/manage/customers` |
| `PRD` | Products | `/#/manage/products` |
| `OPR` | Operators | `/#/manage/operators` |
| `OPT` | Operation Templates | `/#/manage/operation-templates` |
| `AUD` | Audit | `/#/manage/audit` |

### TYPE Codes

| Code | Category | Description |
|------|----------|-------------|
| `FUNC` | Functional | Core feature behavior, CRUD, workflows |
| `RESP` | Responsive | Breakpoint behavior, layout adaptation |
| `SEC` | Security | Auth guards, token handling, data exposure |
| `API` | API Integration | HTTP error handling, pagination metadata, timeouts |
| `A11Y` | Accessibility | ARIA labels, focus management, contrast |
| `PERF` | Performance | Load time, bundle size, lazy loading |
| `NAV` | Navigation | Route transitions, breadcrumbs, sidebar |
| `FORM` | Form Validation | Input validation, error display, submission |

### PRIORITY Codes

| Code | Level | When to Run | Description |
|------|-------|-------------|-------------|
| `P0` | Smoke / CI Gate | Every commit, PR merge | Must pass for deployment |
| `P1` | Regression | Nightly, pre-release | Full feature coverage at desktop width |
| `P2` | Comprehensive | Weekly, release candidate | All breakpoints, edge cases, security, API |
| `P3` | Edge / Exploratory | Manual trigger | Accessibility audits, performance baselines |

### Example Test IDs

| Test ID | Meaning |
|---------|---------|
| `AUTH-FUNC-P0-001` | Login with valid credentials (smoke) |
| `AUTH-SEC-P0-002` | Redirect to login when token missing |
| `DASH-FUNC-P0-001` | Dashboard loads with stats cards |
| `ORD-FORM-P1-001` | Order form required field validation |
| `INV-RESP-P2-001` | Inventory table horizontal scroll at 375px |
| `MOB-RESP-P2-001` | Header hamburger menu at 768px |
| `PROD-FUNC-P0-001` | Production confirmation end-to-end |
| `API-API-P2-001` | 401 response redirects to login |
| `RPT-RESP-P2-001` | Report tables grid collapse at 1024px |

---

## 3. CI Test Tier Classification

Tests are organized into tiers for progressive validation. Each tier includes all tests from the previous tier.

### Tier 0: Smoke (CI Gate)

**When:** Every commit, every PR merge check
**Target:** ~30 tests | Runtime: < 2 minutes
**Viewport:** 1440x900 (desktop only)

| Category | Tests | Test IDs |
|----------|-------|----------|
| Login/Logout | 2 | `AUTH-FUNC-P0-001`, `AUTH-FUNC-P0-002` |
| Dashboard loads | 2 | `DASH-FUNC-P0-001`, `DASH-FUNC-P0-002` |
| Navigation (all main routes render) | 8 | `NAV-FUNC-P0-001` through `NAV-FUNC-P0-008` |
| One CRUD cycle (Orders: create, read, update, delete) | 4 | `ORD-FUNC-P0-001` through `ORD-FUNC-P0-004` |
| One production confirmation | 3 | `PROD-FUNC-P0-001` through `PROD-FUNC-P0-003` |
| Inventory basic list + filter | 2 | `INV-FUNC-P0-001`, `INV-FUNC-P0-002` |
| Batch list loads | 2 | `BAT-FUNC-P0-001`, `BAT-FUNC-P0-002` |
| Admin sidebar navigation | 3 | `ADM-NAV-P0-001` through `ADM-NAV-P0-003` |
| Auth guard redirect | 2 | `AUTH-SEC-P0-001`, `AUTH-SEC-P0-002` |
| Wildcard redirect | 1 | `NAV-FUNC-P0-009` |

**Pass Criteria:** 100% pass rate required. Any failure blocks merge.

### Tier 1: Regression (Nightly)

**When:** Nightly build, pre-release validation
**Target:** ~200 tests | Runtime: < 10 minutes
**Viewport:** 1440x900 (desktop only)

| Category | Approx. Tests | Covering Files |
|----------|---------------|----------------|
| All Tier 0 tests | 30 | (inherited) |
| Full auth flows | 5 | `01-auth` |
| Dashboard features | 20 | `02-dashboard`, `38-dashboard-features` |
| Orders CRUD + detail | 19 | `03-orders`, `32-order-crud`, `23-order-selection` |
| Production confirm + history | 25 | `04-production`, `33-production-complete`, `21-production-history` |
| Inventory + receive material | 21 | `05-inventory`, `34-receive-material` |
| Batches + operations | 34 | `06-batches`, `35-batch-operations` |
| Holds management | 5 | `07-holds` |
| Equipment CRUD | 9 | `08-equipment` |
| Pagination (all endpoints) | 9 | `10-pagination` |
| Entity CRUD (customers, materials, products) | 37 | `11-crud`, `12-entity-crud` |
| BOM CRUD | 11 | `13-bom-crud` |
| Config CRUD | 34 | `14-config-crud` |
| Audit history | 29 | `15-audit-history` |
| Operators | 10 | `16-operators` |
| Operations | 13 | `17-operations` |
| Processes | 26 | `18-processes` |
| Users + profile | 25 | `19-user-profile`, `20-users` |
| Routing | 36 | `22-routing`, `36-routing-crud` |
| Operation templates | 19 | `37-operation-templates` |
| Reports | 24 | `48-reports` |

**Pass Criteria:** >= 95% pass rate. Failures generate JIRA tickets.

### Tier 2: Comprehensive (Weekly / Release Candidate)

**When:** Weekly scheduled run, release candidate validation
**Target:** All 620+ tests | Runtime: < 30 minutes
**Viewports:** 320px, 375px, 768px, 1024px, 1440px

| Category | Approx. Tests | Covering Files |
|----------|---------------|----------------|
| All Tier 1 tests | ~200 | (inherited) |
| Detail pages (all entities) | 51 | `25-detail-pages`, `42-new-detail-pages`, `44-entity-detail-pages` |
| Form validations | 20 | `39-form-validations` |
| CRUD submissions | 21 | `45-crud-submissions` |
| Process parameters | 10 | `26-process-parameters` |
| Partial confirmation | 10 | `24-partial-confirmation` |
| Material selection modal | standalone | `46-material-selection-modal` |
| Apply hold modal | standalone | `47-apply-hold-modal` |
| Admin sidebar | 11 | `27-admin-sidebar` |
| E2E workflows | 34 | `40-e2e-workflow-verification`, `41-production-flow-e2e` |
| Change password | 7 | `43-change-password` |
| Mobile responsive | 45 | `49-mobile-responsive` |
| Responsive breakpoints | ~29 | `50-responsive-breakpoints` (NEW) |
| Auth security | ~13 | `51-auth-security` (NEW) |
| API error handling | ~14 | `52-api-error-handling` (NEW) |
| Page-level validation | ~18 | `53-page-level-validation` (NEW) |

**Pass Criteria:** >= 90% pass rate. Responsive failures flagged as P2 bugs.

### Tier 3: Manual / Audit (On Demand)

**When:** Manually triggered, pre-major-release audit
**Target:** Qualitative metrics, not counted in pass rate

| Category | Tool | Target |
|----------|------|--------|
| Accessibility audit | `@axe-core/playwright` | 0 critical / 0 serious violations |
| Performance audit | Lighthouse CI | LCP < 2.5s, CLS < 0.1, bundle < 500KB |
| Visual regression | Percy / Playwright screenshots | No unintended visual changes |
| Security scan | OWASP ZAP (passive) | No high/critical findings |

---

## 4. Responsive Breakpoint Standard

### Standard Breakpoints

All components in the MES application MUST target these breakpoints:

| Token | Width | Device Class | Layout Behavior |
|-------|-------|-------------|-----------------|
| `xs` | 320px | Small phone (iPhone SE) | Single column, stacked everything, minimal padding |
| `sm` | 375px | Standard phone (iPhone 12/13) | Single column, compact cards, horizontal scroll for tables |
| `md` | 768px | Tablet portrait (iPad) | Two-column forms, sidebar collapses, table columns prioritized |
| `lg` | 1024px | Tablet landscape / small laptop | Full sidebar, reduced grid columns, tables begin full-width |
| `xl` | 1440px | Desktop (reference design width) | Full layout, all columns visible, max-width containers |

### Breakpoint Behavior Rules

#### xs (320px) - Small Phone
- All content is single-column
- Page headers stack vertically (title above actions)
- Tables use horizontal scroll via `.table-container`
- Filter controls stack vertically
- Navigation hidden behind hamburger menu
- Modals take full width (`max-width: 90vw`)
- Card grids collapse to 1 column
- Font sizes reduced by 2px from desktop
- Padding reduced to 12px

#### sm (375px) - Standard Phone
- Same as xs with slightly more breathing room
- Status badge rows may wrap to 2 columns
- Search inputs expand to full width
- Touch targets minimum 44x44px

#### md (768px) - Tablet
- Admin sidebar collapses to horizontal tabs at bottom
- Header navigation becomes hamburger menu (at 992px)
- Forms transition to single-column layout
- Dashboard metric cards: 2 columns
- Detail pages: info grid becomes single-column
- `.page-header` stacks vertically
- Filter bar wraps gracefully
- Modals max-width: 90vw

#### lg (1024px) - Small Laptop
- Report table grids collapse from 2-column to 1-column
- Order detail tabs may wrap
- BOM tree nodes reduce padding
- Production confirm layout shifts to stacked sections

#### xl (1440px) - Desktop
- Reference viewport for all designs
- Maximum content width: 1400px (header container)
- Full sidebar (240px) visible in admin layout
- All table columns displayed
- Multi-column form layouts (2-3 columns)
- Dashboard: 4-column metric cards

### Current Breakpoints Found in Codebase

| Breakpoint Value | Files Using It | Standard? |
|-----------------|----------------|-----------|
| `1200px` | `header.component.css`, `dashboard.component.css` | Non-standard (between lg and xl) |
| `1024px` | `order-detail`, `production-confirm`, `executive-dashboard`, `operations-report`, `inventory-balance`, `scrap-analysis` | lg - Standard |
| `992px` | `header.component.css`, `production-confirm.component.css` | Non-standard (Bootstrap legacy) |
| `900px` | `order-form.component.css` | Non-standard |
| `800px` | `material-form.component.css` | Non-standard |
| `768px` | 20+ files (most common) | md - Standard |
| `600px` | `batch-form`, `customer-form`, `inventory-form`, `receive-material`, `equipment-form`, `operator-form`, `material-form`, `product-form`, `order-form`, `operation-template-form`, `batch-size-form`, `quantity-type-form` | Non-standard (between sm and md) |
| `576px` | `header.component.css`, `breadcrumb.component.css`, `inventory-list.component.css` | Non-standard (Bootstrap legacy) |
| `480px` | `batch-detail.component.css` | Non-standard (between sm and md) |

**Action Required:** Normalize non-standard breakpoints to the five standard values over time. Prioritize `600px` -> `768px` for forms and `992px` -> `1024px` for layouts.

---

## 5. CSS Rules for New Components

Every new Angular component MUST comply with the following rules before PR approval. These rules are **non-negotiable** for all new CSS files.

### Rule 5.1: Minimum Responsive Breakpoint

Every component CSS file MUST include at least one `@media (max-width: 768px)` block. No exceptions.

```css
/* REQUIRED in every component CSS */
@media (max-width: 768px) {
  /* Mobile layout adjustments */
}
```

### Rule 5.2: Table Containers

All `<table>` elements MUST be wrapped in a `.table-container` with `overflow-x: auto`:

```css
/* CORRECT */
.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

/* INCORRECT - table without container */
.data-table {
  width: 100%;
  /* Missing overflow handling for mobile */
}
```

### Rule 5.3: Page Header Stacking

`.page-header` MUST stack vertically at `<= 768px`:

```css
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}
```

### Rule 5.4: Single-Column Forms

Forms MUST collapse to single-column at `<= 600px` (targeting standard `md` breakpoint when normalized):

```css
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
}
```

### Rule 5.5: Touch Target Size

All interactive elements MUST have a minimum touch target of 44x44px on mobile:

```css
/* CORRECT */
.btn {
  min-height: 44px;
  min-width: 44px;
  padding: 10px 20px;
}

/* INCORRECT */
.btn-tiny {
  padding: 2px 4px; /* Touch target too small */
  font-size: 10px;
}
```

### Rule 5.6: Button Base Class

All buttons MUST use the `.btn` base class from `styles.css`. Do not create standalone button styles:

```css
/* CORRECT - extends global .btn */
.action-btn {
  /* Component-specific overrides only */
  margin-left: auto;
}

/* INCORRECT - reinventing button styles */
.action-btn {
  display: inline-block;
  padding: 10px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  background: #1976d2;
  color: white;
}
```

### Rule 5.7: Modal Max-Width

Modals MUST use `max-width: 90vw` on mobile viewports:

```css
.modal-content {
  width: 90%;
  max-width: 500px;
}

@media (max-width: 768px) {
  .modal-content {
    max-width: 90vw;
    margin: 16px;
  }
}
```

### Rule 5.8: No Fixed Widths

Never use fixed pixel widths for content containers. Use `max-width` with percentage fallback:

```css
/* CORRECT */
.content {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
}

/* INCORRECT */
.content {
  width: 1200px; /* Breaks on smaller screens */
}
```

### Rule 5.9: Filter Layout

Filter bars MUST use flexbox with wrap. On mobile, filters stack vertically:

```css
.filters {
  display: flex;
  gap: 24px;
  flex-wrap: wrap;
  align-items: center;
}

@media (max-width: 768px) {
  .filters {
    flex-direction: column;
    gap: 12px;
  }
}
```

### Rule 5.10: Z-Index Compliance

All z-index values MUST follow the stacking order defined in [Section 8](#8-z-index-stacking-order). No arbitrary z-index values.

---

## 6. CSS Architecture Audit

### Summary

| Metric | Value |
|--------|-------|
| Total component CSS files | 84 |
| Files WITH `@media` queries | 40 (47.6%) |
| Files WITHOUT `@media` queries | 44 (52.4%) |
| Unique breakpoint values found | 9 (1200px, 1024px, 992px, 900px, 800px, 768px, 600px, 576px, 480px) |
| Standard breakpoints in use | 2 of 5 (768px, 1024px) |
| Non-standard breakpoints | 7 (1200px, 992px, 900px, 800px, 600px, 576px, 480px) |
| Global styles file | `frontend/src/styles.css` (647 lines) |

### Files WITH @media Responsive Breakpoints (40 files)

| # | Component CSS File | Breakpoints Used |
|---|-------------------|------------------|
| 1 | `admin-layout.component.css` | 768px |
| 2 | `header.component.css` | 1200px, 992px, 576px |
| 3 | `breadcrumb.component.css` | 576px |
| 4 | `manage-landing.component.css` | 768px |
| 5 | `pagination.component.css` | 768px |
| 6 | `dashboard.component.css` | 1200px, 768px |
| 7 | `hold-list.component.css` | 768px |
| 8 | `hold-detail.component.css` | 768px |
| 9 | `inventory-list.component.css` | 576px |
| 10 | `inventory-detail.component.css` | 768px |
| 11 | `inventory-form.component.css` | 600px |
| 12 | `receive-material.component.css` | 600px |
| 13 | `batch-detail.component.css` | 768px, 480px |
| 14 | `batch-form.component.css` | 600px |
| 15 | `production-confirm.component.css` | 992px, 768px |
| 16 | `production-landing.component.css` | 768px |
| 17 | `order-detail.component.css` | 1024px, 768px |
| 18 | `order-form.component.css` | 900px, 600px |
| 19 | `customer-detail.component.css` | 768px |
| 20 | `customer-form.component.css` | 600px |
| 21 | `material-detail.component.css` | 768px |
| 22 | `material-form.component.css` | 800px, 600px |
| 23 | `product-detail.component.css` | 768px |
| 24 | `product-form.component.css` | 600px |
| 25 | `equipment-detail.component.css` | 768px |
| 26 | `equipment-form.component.css` | 600px |
| 27 | `operator-detail.component.css` | 768px |
| 28 | `operator-form.component.css` | 600px |
| 29 | `operation-template-detail.component.css` | 768px |
| 30 | `operation-template-form.component.css` | 600px |
| 31 | `process-detail.component.css` | 768px |
| 32 | `routing-detail.component.css` | 768px |
| 33 | `operation-detail.component.css` | 768px |
| 34 | `user-detail.component.css` | 768px |
| 35 | `user-form.component.css` | 768px |
| 36 | `batch-size-form.component.css` | 600px |
| 37 | `executive-dashboard.component.css` | 1024px |
| 38 | `operations-report.component.css` | 1024px |
| 39 | `inventory-balance.component.css` | 1024px |
| 40 | `scrap-analysis.component.css` | 1024px |

### Files WITHOUT @media Responsive Breakpoints (44 files) -- ACTION REQUIRED

These files need responsive breakpoints added. They are sorted by priority (list/page components first, then forms, then utility components).

| # | Component CSS File | Type | Priority |
|---|-------------------|------|----------|
| 1 | `order-list.component.css` | List page | HIGH |
| 2 | `batch-list.component.css` | List page | HIGH |
| 3 | `equipment-list.component.css` | List page | HIGH |
| 4 | `customer-list.component.css` | List page | HIGH |
| 5 | `material-list.component.css` | List page | HIGH |
| 6 | `product-list.component.css` | List page | HIGH |
| 7 | `operator-list.component.css` | List page | HIGH |
| 8 | `operation-template-list.component.css` | List page | HIGH |
| 9 | `process-list.component.css` | List page | HIGH |
| 10 | `routing-list.component.css` | List page | HIGH |
| 11 | `user-list.component.css` | List page | HIGH |
| 12 | `audit-list.component.css` | List page | HIGH |
| 13 | `operation-list.component.css` | List page | HIGH |
| 14 | `bom-list.component.css` | List page | HIGH |
| 15 | `hold-reasons-list.component.css` | Config list | MEDIUM |
| 16 | `delay-reasons-list.component.css` | Config list | MEDIUM |
| 17 | `process-params-list.component.css` | Config list | MEDIUM |
| 18 | `quantity-type-list.component.css` | Config list | MEDIUM |
| 19 | `batch-number-list.component.css` | Config list | MEDIUM |
| 20 | `batch-size-list.component.css` | Config list | MEDIUM |
| 21 | `reports-landing.component.css` | Landing page | MEDIUM |
| 22 | `production-summary.component.css` | Report page | MEDIUM |
| 23 | `order-fulfillment.component.css` | Report page | MEDIUM |
| 24 | `production-history.component.css` | History page | MEDIUM |
| 25 | `login.component.css` | Auth page | MEDIUM |
| 26 | `profile.component.css` | Profile page | MEDIUM |
| 27 | `change-password.component.css` | Form page | MEDIUM |
| 28 | `process-form.component.css` | Form | MEDIUM |
| 29 | `routing-form.component.css` | Form | MEDIUM |
| 30 | `hold-form.component.css` | Form | MEDIUM |
| 31 | `bom-node-form.component.css` | Form | MEDIUM |
| 32 | `bom-tree.component.css` | Tree view | MEDIUM |
| 33 | `delay-reasons-form.component.css` | Config form | LOW |
| 34 | `hold-reasons-form.component.css` | Config form | LOW |
| 35 | `process-params-form.component.css` | Config form | LOW |
| 36 | `quantity-type-form.component.css` | Config form | LOW |
| 37 | `batch-number-form.component.css` | Config form | LOW |
| 38 | `quality-pending.component.css` | Sub-page | LOW |
| 39 | `main-layout.component.css` | Layout | LOW |
| 40 | `apply-hold-modal.component.css` | Modal | LOW |
| 41 | `material-selection-modal.component.css` | Modal | LOW |
| 42 | `app.component.css` | Root | LOW |
| 43 | `loading-spinner.component.css` | Utility | LOW |
| 44 | `status-badge.component.css` | Utility | LOW |

### Inconsistent Breakpoint Values

| Issue | Files | Recommended Fix |
|-------|-------|-----------------|
| `992px` instead of `1024px` | `header.component.css`, `production-confirm.component.css` | Change to `1024px` (lg standard) |
| `900px` one-off | `order-form.component.css` | Change to `1024px` (lg standard) |
| `800px` one-off | `material-form.component.css` | Change to `768px` (md standard) |
| `600px` used for forms | 12 form components | Normalize to `768px` (md standard) over time |
| `576px` (Bootstrap legacy) | `header`, `breadcrumb`, `inventory-list` | Change to `768px` or remove |
| `480px` one-off | `batch-detail.component.css` | Change to `375px` (sm standard) or remove |
| `1200px` non-standard | `header`, `dashboard` | Keep as supplementary; document as `xl-alt` |

---

## 7. Design Tokens (Proposed)

To eliminate magic numbers and ensure consistency, the following CSS custom properties should be added to `styles.css`:

### Colors

```css
:root {
  /* Primary */
  --color-primary: #1976d2;
  --color-primary-dark: #1565c0;
  --color-primary-light: #e3f2fd;
  --color-primary-hover: #1565c0;

  /* Success */
  --color-success: #4caf50;
  --color-success-dark: #388e3c;
  --color-success-darker: #2e7d32;
  --color-success-bg: #e8f5e9;
  --color-success-border: #a5d6a7;

  /* Warning */
  --color-warning: #ff9800;
  --color-warning-dark: #f57c00;
  --color-warning-darker: #e65100;
  --color-warning-bg: #fff3e0;
  --color-warning-alt-bg: #fff8e1;
  --color-warning-border: #ffe082;

  /* Danger / Error */
  --color-danger: #d32f2f;
  --color-danger-dark: #c62828;
  --color-danger-alt: #f44336;
  --color-danger-bg: #ffebee;
  --color-danger-light-bg: #fce4ec;
  --color-danger-border: #ef9a9a;

  /* Info */
  --color-info: #2196f3;
  --color-info-dark: #1565c0;
  --color-info-bg: #e3f2fd;
  --color-info-border: #90caf9;

  /* Neutral / Background */
  --color-bg-page: #f5f5f5;
  --color-bg-content: #fafafa;
  --color-bg-card: #ffffff;
  --color-bg-hover: #f5f5f5;
  --color-bg-active: #e3f2fd;
  --color-bg-admin: #f8fafc;
  --color-border: #e0e0e0;
  --color-border-light: #eee;
  --color-border-input: #ddd;
  --color-divider: #ccc;

  /* Text */
  --color-text-primary: #333;
  --color-text-secondary: #555;
  --color-text-muted: #666;
  --color-text-light: #888;
  --color-text-disabled: #999;

  /* Admin Sidebar */
  --color-sidebar-bg: #1e293b;
  --color-sidebar-hover: #334155;
  --color-sidebar-border: #334155;
  --color-sidebar-text: #cbd5e1;
  --color-sidebar-text-muted: #94a3b8;
  --color-sidebar-text-dim: #64748b;
  --color-sidebar-active-border: #3b82f6;
}
```

### Spacing

```css
:root {
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  --spacing-2xl: 48px;

  --padding-page: 24px;
  --padding-card: 20px;
  --padding-modal: 20px;
  --padding-page-mobile: 12px;
}
```

### Breakpoints

```css
:root {
  --breakpoint-xs: 320px;
  --breakpoint-sm: 375px;
  --breakpoint-md: 768px;
  --breakpoint-lg: 1024px;
  --breakpoint-xl: 1440px;
}
```

> **Note:** CSS custom properties cannot be used in `@media` queries directly. These tokens serve as documentation and can be used with CSS preprocessors (SCSS) or JavaScript-based solutions. For `@media` queries, use the literal pixel values from the breakpoint standard.

### Typography

```css
:root {
  --font-family: 'Roboto', sans-serif;
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-md: 16px;
  --font-size-lg: 18px;
  --font-size-xl: 20px;
  --font-size-2xl: 24px;
  --font-size-3xl: 28px;

  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;
}
```

### Shadows

```css
:root {
  --shadow-sm: 0 2px 4px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 4px 20px rgba(0, 0, 0, 0.15);
  --shadow-lg: 0 8px 30px rgba(0, 0, 0, 0.2);
  --shadow-card: 0 2px 8px rgba(0, 0, 0, 0.08);
}
```

### Border Radius

```css
:root {
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-pill: 16px;
  --radius-circle: 50%;
}
```

---

## 8. Z-Index Stacking Order

All z-index values must follow this defined hierarchy. Do not use arbitrary z-index values outside this table.

| Layer | Z-Index | Elements | Notes |
|-------|---------|----------|-------|
| Base content | `1` | Page content, cards, tables | Default stacking |
| Sticky elements | `10` | Sticky table headers, floating buttons | Above content scroll |
| Tooltips | `100` | Tooltip overlays | Above most content |
| Mobile nav overlay | `999` | `.nav-menu` (mobile slide-out) | Below header, above content |
| Header bar | `1000` | `.header`, `.modal-overlay` | Fixed top, modal backdrop |
| Dropdown menus | `1001` | `.dropdown-menu` (nav dropdowns) | Above header for visibility |
| Profile dropdown | `1002` | `.profile-menu` | Highest UI element in header |
| Toast notifications | `1100` | Toast/snackbar messages (future) | Above all UI |

### Z-Index Rules

1. **Never use z-index without `position`** (relative, absolute, fixed, or sticky).
2. **Never exceed 1100** without adding to this table and getting review approval.
3. **Modals and header share z-index 1000** because they are mutually exclusive (modal backdrop covers header).
4. **Mobile nav at 999** ensures it appears below the header bar but above page content.
5. **Test z-index conflicts** at 768px and 375px viewports where stacking issues are most common.

---

## 9. Color Palette Reference

### Primary Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary | `#1976d2` | Buttons, links, active states, header background |
| Primary Dark | `#1565c0` | Button hover, header gradient end |
| Primary Light BG | `#e3f2fd` | Active filter background, info alert background |
| Primary Deep | `#0d47a1` | Clear-filter hover text |

### Semantic Colors

| Category | Default | Dark | Darker | Background | Border |
|----------|---------|------|--------|------------|--------|
| Success | `#4caf50` | `#388e3c` | `#2e7d32` | `#e8f5e9` | `#a5d6a7` |
| Warning | `#ff9800` | `#f57c00` | `#e65100` | `#fff3e0` / `#fff8e1` | `#ffe082` |
| Danger | `#d32f2f` | `#c62828` | `#f44336` | `#ffebee` / `#fce4ec` | `#ef9a9a` |
| Info | `#2196f3` | `#1565c0` | -- | `#e3f2fd` | `#90caf9` |

### Neutral Colors

| Name | Hex | Usage |
|------|-----|-------|
| Page Background | `#f5f5f5` | `body` background, table header bg, hover state |
| Content Background | `#fafafa` | Table row hover |
| Admin Content BG | `#f8fafc` | Admin layout content area |
| White | `#ffffff` | Cards, modals, dropdown menus |
| Border Default | `#e0e0e0` | Modal borders, dividers |
| Border Light | `#eee` / `#eeeeee` | Table rows, mobile nav borders |
| Border Input | `#ddd` / `#dddddd` | Form input borders |
| Divider | `#ccc` | Secondary dividers |

### Text Colors

| Name | Hex | Usage |
|------|-----|-------|
| Primary Text | `#333` / `#333333` | Body text, headings |
| Secondary Text | `#555` | Labels, sub-headings, table headers |
| Muted Text | `#666` | Icons, dropdown menu icons |
| Light Text | `#888` | Timestamps, metadata, "last updated" |
| Disabled Text | `#999` | Disabled states, close button |
| Dark Heading | `#1a1a1a` | Dashboard page title |

### Status Badge Colors

| Badge | Text Color | Background |
|-------|-----------|------------|
| Pending | `#e65100` | `#fff3e0` |
| In Progress | `#1565c0` | `#e3f2fd` |
| Completed / Available | `#2e7d32` | `#e8f5e9` |
| Consumed | `#c62828` | `#fce4ec` |
| On Hold | `#f57f17` | `#fff8e1` |

---

## 10. API Testing Standards

All E2E tests that interact with API endpoints must follow these standards.

### 10.1: Paginated Endpoint Verification

Every paginated endpoint (`/paged`) test MUST verify metadata fields:

```javascript
// REQUIRED assertions for paginated responses
const response = await page.evaluate(() =>
  fetch('/api/orders/paged?page=0&size=10').then(r => r.json())
);

expect(response.content).toBeDefined();          // Data array
expect(response.totalElements).toBeGreaterThan(0); // Total count
expect(response.totalPages).toBeGreaterThan(0);    // Page count
expect(response.number).toBe(0);                   // Current page
expect(response.size).toBe(10);                    // Page size
```

### 10.2: Form Submission Error Display

Tests that submit forms MUST verify error messages are displayed to the user:

```javascript
// Submit with missing required field
await page.click('.btn-primary[type="submit"]');

// REQUIRED: verify error is visible
const errorMessage = page.locator('.error-message, .alert-error');
await expect(errorMessage).toBeVisible();
```

### 10.3: Auth Header Verification

All protected endpoint tests MUST verify the Authorization header is sent:

```javascript
// Intercept API call and verify auth header
const [request] = await Promise.all([
  page.waitForRequest(req => req.url().includes('/api/orders')),
  page.click('.refresh-btn')
]);

expect(request.headers()['authorization']).toMatch(/^Bearer .+/);
```

### 10.4: 401 Handling

Tests MUST verify that a 401 response redirects to the login page:

```javascript
// Mock 401 response
await page.route('**/api/**', route =>
  route.fulfill({ status: 401, body: '{}' })
);

// Trigger API call
await page.goto('/#/dashboard');

// REQUIRED: verify redirect to login
await expect(page).toHaveURL(/\/#\/login/);
```

### 10.5: Error Response Format

Backend error responses MUST follow this format, and tests MUST verify it:

```json
{
  "error": "Human-readable error message",
  "status": 400,
  "timestamp": "2026-02-11T10:00:00Z"
}
```

---

## 11. Security Testing Standards

### 11.1: Token Expiration

Tests MUST verify behavior when a JWT token expires:

- Expired token triggers 401 response
- 401 response clears local storage
- User is redirected to `/#/login`
- No stale data remains in the UI

### 11.2: Route Guard Coverage

Every route group MUST have guard coverage verified:

| Route Group | Guard | Test Verification |
|-------------|-------|-------------------|
| `/#/dashboard`, `/#/orders`, etc. | `AuthGuard` | Navigate without token -> redirect to login |
| `/#/manage/*` | `AuthGuard` | Navigate without token -> redirect to login |
| `/#/login` | None | Accessible without token |

### 11.3: Logout State Cleanup

Logout MUST clear all client-side state:

```javascript
// After logout, verify:
const token = await page.evaluate(() => localStorage.getItem('token'));
const user = await page.evaluate(() => localStorage.getItem('user'));

expect(token).toBeNull();
expect(user).toBeNull();

// Verify URL is login page
await expect(page).toHaveURL(/\/#\/login/);
```

### 11.4: Local Storage Data Policy

| Key | Allowed | Sensitive? | Notes |
|-----|---------|------------|-------|
| `token` | Yes | Yes (JWT) | Cleared on logout, expiration |
| `user` | Yes | Low | Display name, role only -- no passwords |
| `*password*` | **NO** | Critical | Never store passwords |
| `*secret*` | **NO** | Critical | Never store secrets |
| `*apiKey*` | **NO** | Critical | Never store API keys |

### 11.5: XSS Prevention

- All user inputs displayed in the UI MUST be sanitized by Angular's built-in XSS protection
- Tests should verify that `<script>` tags in input fields are not executed
- Do not use `[innerHTML]` binding with untrusted data

---

## 12. Accessibility Baseline

### Recommended Approach

**DO NOT** write manual E2E tests for accessibility. Instead, integrate `@axe-core/playwright` for automated auditing.

### Integration Plan

```javascript
// Install
// npm install @axe-core/playwright

// Usage in any test
const { injectAxe, checkA11y } = require('@axe-core/playwright');

test('Dashboard has no accessibility violations', async ({ page }) => {
  await page.goto('/#/dashboard');
  await injectAxe(page);
  await checkA11y(page, null, {
    detailedReport: true,
    detailedReportOptions: { html: true }
  });
});
```

### Minimum Thresholds

| Severity | Allowed Count | Action |
|----------|---------------|--------|
| Critical | 0 | Blocks release |
| Serious | 0 | Blocks release |
| Moderate | 5 max | Creates P2 tickets |
| Minor | 10 max | Creates P3 tickets |

### Key Areas to Audit

| Area | WCAG Rule | Example |
|------|-----------|---------|
| Color contrast | 1.4.3 AA | Text on colored backgrounds (status badges) |
| Form labels | 1.3.1 | All inputs have associated labels |
| Focus management | 2.4.3 | Tab order in modals, forms |
| ARIA roles | 4.1.2 | Interactive elements have appropriate roles |
| Alt text | 1.1.1 | Images have alt attributes |
| Keyboard navigation | 2.1.1 | All features accessible without mouse |

### Frequency

- Run axe-core audits in **Tier 3** (manual/on-demand)
- Consider promoting to **Tier 2** once all critical/serious violations are resolved

---

## 13. Performance Baseline

### Recommended Approach

Use **Lighthouse CI** for automated performance monitoring. Do not write custom E2E performance tests.

### Integration Plan

```bash
# Install
npm install -g @lhci/cli

# Run against local server
lhci autorun --config=lighthouserc.json
```

### Suggested `lighthouserc.json`

```json
{
  "ci": {
    "collect": {
      "url": ["http://localhost:4200/#/login", "http://localhost:4200/#/dashboard"],
      "numberOfRuns": 3
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", { "minScore": 0.7 }],
        "first-contentful-paint": ["warn", { "maxNumericValue": 2000 }],
        "largest-contentful-paint": ["error", { "maxNumericValue": 2500 }],
        "cumulative-layout-shift": ["error", { "maxNumericValue": 0.1 }],
        "total-byte-weight": ["warn", { "maxNumericValue": 512000 }]
      }
    }
  }
}
```

### Key Metrics

| Metric | Target | Action if Failed |
|--------|--------|------------------|
| LCP (Largest Contentful Paint) | < 2.5s | P1 bug |
| CLS (Cumulative Layout Shift) | < 0.1 | P1 bug |
| FCP (First Contentful Paint) | < 2.0s | P2 bug |
| Total Bundle Size | < 500KB (gzip) | P2 investigation |
| Lazy Loading | All feature modules | Verify in build output |

### Lazy Loading Verification

All feature modules MUST be lazy-loaded. Verify in the Angular build output:

```bash
ng build --stats-json
# Verify separate chunks for each module:
# dashboard-dashboard-module.js
# orders-orders-module.js
# production-production-module.js
# etc.
```

### Frequency

- Run Lighthouse CI in **Tier 3** (manual/on-demand)
- Track trends over time to catch regressions
- Consider promoting LCP/CLS checks to **Tier 2** once baselines are stable

---

## 14. Test File Naming Convention

### Numbering Ranges

| Range | Category | Description |
|-------|----------|-------------|
| `01-27` | Feature Functional | Core feature tests organized by module. One file per major feature area. |
| `30-45` | Workflow / CRUD / Integration | End-to-end workflows, CRUD submission tests, form validation, detail pages. |
| `46-47` | Standalone Modals | Shared modal components tested in isolation (material-selection, apply-hold). |
| `48` | Reports | All report page tests in a single file. |
| `49` | Mobile Responsive | Mobile viewport tests across all pages (existing). |
| `50-59` | Governance Tests (NEW) | Tests created to enforce governance rules defined in this document. |

### Governance Test Files (50-59)

| File Number | Name | Purpose | Approx. Tests |
|-------------|------|---------|---------------|
| `50` | `50-responsive-breakpoints.test.js` | Verify all 5 standard breakpoints render correctly on key pages | ~29 |
| `51` | `51-auth-security.test.js` | Token expiration, guard redirects, logout cleanup | ~13 |
| `52` | `52-api-error-handling.test.js` | 401 redirect, error display, timeout handling | ~14 |
| `53` | `53-page-level-validation.test.js` | Required fields, error messages, form submission guards | ~18 |

### Complete Test File Inventory (48 existing + 4 new = 52 files)

| # | File | Tests | Category |
|---|------|-------|----------|
| 01 | `01-auth.test.js` | 5 | Feature Functional |
| 02 | `02-dashboard.test.js` | 4 | Feature Functional |
| 03 | `03-orders.test.js` | 5 | Feature Functional |
| 04 | `04-production.test.js` | 7 | Feature Functional |
| 05 | `05-inventory.test.js` | 9 | Feature Functional |
| 06 | `06-batches.test.js` | 16 | Feature Functional |
| 07 | `07-holds.test.js` | 5 | Feature Functional |
| 08 | `08-equipment.test.js` | 9 | Feature Functional |
| 09 | `09-quality.test.js` | 6 | Feature Functional |
| 10 | `10-pagination.test.js` | 9 | Feature Functional |
| 11 | `11-crud.test.js` | 22 | Feature Functional |
| 12 | `12-entity-crud.test.js` | 15 | Feature Functional |
| 13 | `13-bom-crud.test.js` | 11 | Feature Functional |
| 14 | `14-config-crud.test.js` | 34 | Feature Functional |
| 15 | `15-audit-history.test.js` | 29 | Feature Functional |
| 16 | `16-operators.test.js` | 10 | Feature Functional |
| 17 | `17-operations.test.js` | 13 | Feature Functional |
| 18 | `18-processes.test.js` | 26 | Feature Functional |
| 19 | `19-user-profile.test.js` | 11 | Feature Functional |
| 20 | `20-users.test.js` | 14 | Feature Functional |
| 21 | `21-production-history.test.js` | 11 | Feature Functional |
| 22 | `22-routing.test.js` | 14 | Feature Functional |
| 23 | `23-order-selection.test.js` | 8 | Feature Functional |
| 24 | `24-partial-confirmation.test.js` | 10 | Feature Functional |
| 25 | `25-detail-pages.test.js` | 14 | Feature Functional |
| 26 | `26-process-parameters.test.js` | 10 | Feature Functional |
| 27 | `27-admin-sidebar.test.js` | 11 | Feature Functional |
| 30 | `30-full-workflow-setup.test.js` | -- | Workflow Setup |
| 31 | `31-big-demo-setup.test.js` | -- | Workflow Setup |
| 32 | `32-order-crud.test.js` | 14 | Workflow / CRUD |
| 33 | `33-production-complete.test.js` | 14 | Workflow / CRUD |
| 34 | `34-receive-material.test.js` | 12 | Workflow / CRUD |
| 35 | `35-batch-operations.test.js` | 18 | Workflow / CRUD |
| 36 | `36-routing-crud.test.js` | 22 | Workflow / CRUD |
| 37 | `37-operation-templates.test.js` | 19 | Workflow / CRUD |
| 38 | `38-dashboard-features.test.js` | 20 | Workflow / CRUD |
| 39 | `39-form-validations.test.js` | 20 | Workflow / CRUD |
| 40 | `40-e2e-workflow-verification.test.js` | 16 | Workflow / CRUD |
| 41 | `41-production-flow-e2e.test.js` | 18 | Workflow / CRUD |
| 42 | `42-new-detail-pages.test.js` | 8 | Workflow / CRUD |
| 43 | `43-change-password.test.js` | 7 | Workflow / CRUD |
| 44 | `44-entity-detail-pages.test.js` | 29 | Workflow / CRUD |
| 45 | `45-crud-submissions.test.js` | 21 | Workflow / CRUD |
| 46 | `46-material-selection-modal.test.js` | standalone | Standalone Modal |
| 47 | `47-apply-hold-modal.test.js` | standalone | Standalone Modal |
| 48 | `48-reports.test.js` | 24 | Reports |
| 49 | `49-mobile-responsive.test.js` | 45 | Mobile Responsive |
| 50 | `50-responsive-breakpoints.test.js` | ~29 | Governance (NEW) |
| 51 | `51-auth-security.test.js` | ~13 | Governance (NEW) |
| 52 | `52-api-error-handling.test.js` | ~14 | Governance (NEW) |
| 53 | `53-page-level-validation.test.js` | ~18 | Governance (NEW) |

**Estimated Total:** ~548 existing + ~74 new governance = ~622 tests

---

## 15. Component CSS Checklist

Before merging any PR that creates or modifies a component CSS file, the following checklist MUST be completed.

### Pre-Merge Checklist

| # | Check | Required? | Verified |
|---|-------|-----------|----------|
| 1 | File contains at least one `@media (max-width: 768px)` block | YES | [ ] |
| 2 | All `<table>` elements wrapped in `.table-container` with `overflow-x: auto` | YES | [ ] |
| 3 | `.page-header` stacks vertically at `<= 768px` | YES (if page has header) | [ ] |
| 4 | Forms are single-column at `<= 768px` | YES (if page has forms) | [ ] |
| 5 | Touch targets are `>= 44px` on interactive elements | YES | [ ] |
| 6 | Buttons use `.btn` base class from global styles | YES | [ ] |
| 7 | Modals use `max-width: 90vw` on mobile | YES (if component has modal) | [ ] |
| 8 | No fixed pixel widths on content containers | YES | [ ] |
| 9 | Z-index values follow stacking order (Section 8) | YES (if z-index used) | [ ] |
| 10 | Colors use values from the palette (Section 9) | YES | [ ] |
| 11 | No `!important` unless overriding third-party styles | YES | [ ] |
| 12 | Breakpoint values are from the standard set (320, 375, 768, 1024, 1440) | RECOMMENDED | [ ] |
| 13 | Filter bars use flexbox with `flex-wrap: wrap` | YES (if filters present) | [ ] |
| 14 | No inline styles in the component template | RECOMMENDED | [ ] |
| 15 | Component tested at 375px, 768px, and 1440px viewports | YES | [ ] |

### Reviewer Responsibilities

1. Open the component at 375px, 768px, and 1440px in browser dev tools
2. Verify no horizontal overflow on any viewport
3. Verify all text is readable (not truncated or overlapping)
4. Verify all buttons/links are tappable on mobile
5. Check that the component follows the same patterns as sibling components

---

## 16. Test-Fix Governance Rule

### Rule: Every responsive/layout fix MUST include documentation and regression protection.

When fixing any bug related to:
- Responsive layout breakage
- Element alignment
- Overflow/scrolling issues
- Mobile display problems
- Z-index conflicts

The developer MUST complete ALL of the following:

### Step 1: Document in Governance

Add an entry to the table below with:
- **Rule ID** (format: `GOV-RESP-{SEQ}`)
- **Description** of the fix
- **Example** (correct CSS)
- **Anti-pattern** (incorrect CSS that caused the bug)

### Step 2: Add Regression Test

Create a test in the appropriate test file (typically `49-mobile-responsive.test.js` or `50-responsive-breakpoints.test.js`) that:
- Reproduces the original bug condition
- Verifies the fix holds
- References the governance rule ID in comments

### Step 3: PR Description

The PR description MUST include:
- Governance rule ID created
- Test ID of the regression test
- Before/after screenshots at the affected viewport

### Governance Fix Registry

| Rule ID | Date | Description | File Fixed | Breakpoint | Example (Correct) | Anti-Pattern (Incorrect) | Test ID |
|---------|------|-------------|-----------|------------|-------------------|-------------------------|---------|
| `GOV-RESP-001` | 2026-02-11 | Hold list filters horizontal alignment | `hold-list.component.css` | 768px | `.filters { display: flex; gap: 24px; flex-wrap: wrap; }` | `.filters { display: block; }` (filters stacked vertically on desktop) | `HLD-RESP-P1-001` |
| | | | | | | | |

---

## 17. Regression Guard Rule

### Rule: Every layout bug fix MUST have a corresponding regression test that references the governance rule.

### Process

```
Bug reported -> Fix applied -> Governance entry created -> Regression test added -> PR merged
```

### Regression Test Structure

```javascript
/**
 * Regression guard for GOV-RESP-XXX
 * Bug: [Description of the original bug]
 * Fix: [What was changed]
 * File: [CSS file that was fixed]
 */
test('GOV-RESP-XXX: [description]', async ({ page }) => {
  // Set viewport to the breakpoint where the bug occurred
  await page.setViewportSize({ width: 768, height: 1024 });

  // Navigate to affected page
  await page.goto('/#/affected-page');

  // Verify the fix holds
  const element = page.locator('.affected-selector');
  const box = await element.boundingBox();

  // Assert the layout is correct
  expect(box.width).toBeLessThanOrEqual(768);
  // ... additional assertions
});
```

### Regression Test Naming

Regression tests MUST follow this naming pattern:

```
{MODULE}-RESP-{PRIORITY}-{SEQ}: {GOV-RESP-ID} - {short description}
```

Example:
```
HLD-RESP-P1-001: GOV-RESP-001 - Hold list filters horizontal on desktop
```

### Cross-Reference Requirements

| Artifact | Must Reference |
|----------|---------------|
| Governance entry (Section 16 table) | Test ID of regression guard |
| Regression test comment | Governance rule ID |
| PR description | Both governance rule ID and test ID |
| Git commit message | Governance rule ID |

### Example Commit Message

```
Fix hold list filter alignment at 768px breakpoint

Filters were stacking vertically on desktop due to missing flex
layout. Added display:flex with gap and flex-wrap to .filters class.

Governance: GOV-RESP-001
Regression: HLD-RESP-P1-001
```

---

## Appendix A: Quick Reference Card

### For Developers

1. New component? Apply all rules from [Section 5](#5-css-rules-for-new-components)
2. New test? Follow naming from [Section 14](#14-test-file-naming-convention) and ID format from [Section 2](#2-test-id-convention)
3. Layout bug fix? Follow [Section 16](#16-test-fix-governance-rule) and [Section 17](#17-regression-guard-rule)
4. New z-index? Check [Section 8](#8-z-index-stacking-order) first
5. New color? Check [Section 9](#9-color-palette-reference) first

### For Reviewers

1. CSS PR? Run through [Section 15 Checklist](#15-component-css-checklist)
2. Test PR? Verify test ID format and tier classification
3. Bug fix PR? Verify governance entry and regression test exist
4. New route? Verify it appears in [Section 1 Coverage Matrix](#1-route-coverage-matrix)

### For CI/DevOps

1. PR merge gate: Run Tier 0 (~30 tests, < 2 min)
2. Nightly: Run Tier 1 (~200 tests, < 10 min)
3. Weekly: Run Tier 2 (all ~620 tests, < 30 min)
4. Release: Run Tier 2 + Tier 3 (full audit)

---

## Appendix B: Document Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2026-02-11 | MES Development Team | Initial governance document |
