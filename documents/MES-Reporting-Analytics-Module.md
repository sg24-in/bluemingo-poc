# MES Reporting & Analytics Module - Design & Implementation Specification

**Version:** 1.0
**Date:** 2026-02-09
**Status:** DESIGN COMPLETE - Implementation In Progress

---

## 1. Overview

### 1.1 Purpose
Design and implement a complete **Reports & Dashboards** section for the MES system focused on production confirmation, batch genealogy, inventory movement, and execution traceability.

### 1.2 Guiding Principles
1. Provide **actionable production insights**, not raw data dumps
2. Support **drill-down and drill-through navigation**
3. Ensure **every metric is explainable** (formula + source)
4. Use **only the data already present** in the MES system
5. Be suitable for **operations, quality, and management users**

### 1.3 Out of Scope
- Scheduling & Planning
- Operator performance metrics
- OEE (unless explicitly requested)
- Forecasting & predictive analytics

---

## 2. Report Section Structure

### 2.1 Navigation Structure

```
Reports (MainLayout → /reports)
├── Production Reports
│   ├── Production Summary Dashboard
│   ├── Production by Operation
│   └── Production Trend
├── Quality & Scrap
│   ├── Scrap Analysis Dashboard
│   ├── Scrap by Product
│   └── Yield Trend
├── Inventory & Traceability
│   ├── Inventory Balance Report
│   ├── WIP Inventory Report
│   └── Batch Genealogy Viewer
├── Orders & Fulfillment
│   ├── Order Fulfillment Dashboard
│   ├── Order Completion Report
│   └── Partially Fulfilled Orders
├── Process & Operations
│   ├── Operation Cycle Times
│   ├── Long-Running Operations
│   └── Hold/Block Analysis
├── Audit & Compliance
│   ├── Status Change History
│   ├── Hold & Release Actions
│   └── Inventory Movement Log
└── Executive Dashboard
    └── One-Screen Overview
```

### 2.2 Report Categories

| # | Category | Target Audience | Primary Question |
|---|----------|-----------------|------------------|
| 1 | Production | Operations, Supervisors | What was produced, where, and how efficiently? |
| 2 | Quality & Scrap | Quality Engineers | Where are losses happening? |
| 3 | Inventory & Traceability | Warehouse, Quality | Where did material come from and where did it go? |
| 4 | Orders & Fulfillment | Planning, Management | Are we completing what we committed? |
| 5 | Process & Operations | Operations, Engineering | Which steps are slow or blocked? |
| 6 | Audit & Compliance | Compliance, Management | Who did what, when, and why? |
| 7 | Executive Dashboard | Plant Manager, Directors | One screen, full picture |

---

## 3. Report Design Principles (Non-Negotiable)

### 3.1 Purpose-First
Every report answers a specific business question. The question is displayed as a subtitle.

### 3.2 Metric Transparency
Every metric has an info icon (ℹ️) showing:
- **Formula**: Human-readable calculation
- **Data Origin**: Which entity/table the data comes from
- **Business Meaning**: What the number represents

### 3.3 Time-Awareness
Every report is filterable by:
- Date range (from/to)
- Granularity: Day / Week / Month

### 3.4 Context Preservation
Drill-down keeps parent filters active. Breadcrumb navigation shows the drill path.

### 3.5 No Orphan Visuals
Every chart links to its underlying data table. Click chart segment → see filtered table.

---

## 4. Core Reports - Detailed Design

### 4.1 Production Reports

#### 4.1.1 Production Summary Dashboard
**Question:** "How much did we produce today/this week/this month?"

**Metrics:**
| Metric | Formula | Data Source |
|--------|---------|-------------|
| Total Produced | SUM(produced_quantity) | production_confirmations |
| Total Scrap | SUM(scrap_quantity) | production_confirmations |
| Yield % | (Produced - Scrap) / Produced × 100 | production_confirmations |
| Avg Cycle Time | AVG(end_time - start_time) | production_confirmations |
| Confirmations Count | COUNT(*) | production_confirmations |

**Visuals:**
- Bar chart: Production by day/week
- Pie chart: Production by operation type
- Line chart: Yield % trend

**Drill-down:** Period → Product → Operation → Confirmation
**Drill-through:** Click operation → operation execution history

#### 4.1.2 Production by Operation
**Question:** "Which operations produced how much?"

**Columns:** Operation Type | Operation Name | Confirmations | Produced Qty | Scrap Qty | Yield % | Avg Cycle Time

**Drill-down:** Operation → individual confirmations
**Drill-through:** Operation → batch genealogy

#### 4.1.3 Production Trend
**Question:** "Is production increasing or decreasing over time?"

**Visuals:**
- Line chart: Daily production quantity
- Line chart: Daily yield %
- Area chart: Cumulative production

---

### 4.2 Quality & Scrap Reports

#### 4.2.1 Scrap Analysis Dashboard
**Question:** "Where are losses happening?"

**Metrics:**
| Metric | Formula | Data Source |
|--------|---------|-------------|
| Scrap % | SUM(scrap_qty) / SUM(produced_qty) × 100 | production_confirmations |
| Top Scrap Product | MAX scrap by product_sku | production_confirmations + orders |
| Top Scrap Operation | MAX scrap by operation_type | production_confirmations |

**Visuals:**
- Horizontal bar: Scrap by product (top 10)
- Horizontal bar: Scrap by operation type
- Line chart: Scrap % trend

**Drill-down:** Period → Product → Operation
**Drill-through:** Scrap metric → batch genealogy view

#### 4.2.2 Yield Trend
**Question:** "Is quality improving or degrading?"

**Visuals:**
- Line chart: Daily/weekly yield %
- Target line at acceptable yield threshold

---

### 4.3 Inventory & Traceability Reports

#### 4.3.1 Inventory Balance Report
**Question:** "What do we have on hand right now?"

**Columns:** Material | Type | Total Qty | Available | Blocked | On Hold | Unit | Locations

**Grouping:** By material type (RM → WIP → IM → FG)

**Drill-through:** Click material → inventory movements

#### 4.3.2 WIP Inventory Report
**Question:** "What's stuck in production?"

**Filters:** State = PRODUCED or WIP type only
**Columns:** Material | Batch | Qty | State | Last Operation | Age (days since created)

#### 4.3.3 Batch Genealogy Viewer
**Question:** "Where did this material come from / go to?"

**Visuals:**
- Tree view: Batch ancestry (parent-child)
- Sankey diagram: Batch split & merge flow

**Drill-through:** Batch → linked orders | Batch → inventory movements

---

### 4.4 Orders & Fulfillment Reports

#### 4.4.1 Order Fulfillment Dashboard
**Question:** "Are we completing what we committed?"

**Metrics:**
| Metric | Formula | Data Source |
|--------|---------|-------------|
| Completion % | SUM(produced) / SUM(ordered) × 100 | confirmations + order_line_items |
| Orders In Progress | COUNT(status=IN_PROGRESS) | orders |
| Overdue Orders | COUNT(delivery_date < today AND status != COMPLETED) | orders |

**Visuals:**
- Donut chart: Order status distribution
- Bar chart: Completion % by order

#### 4.4.2 Order Completion Report
**Columns:** Order # | Customer | Status | Lines | Completed Lines | Completion % | Due Date | Days Remaining

**Drill-down:** Order → Line items → Operations
**Drill-through:** Order line → production confirmations

#### 4.4.3 Partially Fulfilled Orders
**Question:** "Which orders are partially done?"

**Filter:** Only orders where 0 < completion % < 100
**Columns:** Order # | Customer | Completion % | Remaining Qty | Next Operation

---

### 4.5 Process & Operations Reports

#### 4.5.1 Operation Cycle Times
**Question:** "Which operations are taking longest?"

**Metrics:**
| Metric | Formula | Data Source |
|--------|---------|-------------|
| Avg Cycle Time | AVG(end_time - start_time) by operation_type | production_confirmations |
| Min/Max Cycle Time | MIN/MAX per operation type | production_confirmations |

**Visuals:**
- Box plot: Cycle time distribution by operation type
- Bar chart: Average cycle time comparison

#### 4.5.2 Long-Running Operations
**Question:** "Which operations are exceeding expected time?"

**Filter:** Cycle time > 2× average for that operation type
**Columns:** Confirmation ID | Order | Operation | Start | End | Duration | Expected Duration

#### 4.5.3 Hold/Block Analysis
**Question:** "What's being held and why?"

**Metrics:** Active holds by entity type, Top hold reasons, Average hold duration

**Visuals:**
- Pie chart: Holds by entity type
- Bar chart: Top 10 hold reasons
- Trend: Holds opened/resolved over time

---

### 4.6 Audit & Compliance Reports

#### 4.6.1 Status Change History
**Question:** "What status changes happened?"

**Columns:** Timestamp | Entity Type | Entity ID | Action | Old Value | New Value | User
**Properties:** Immutable views, exportable, chronological ordering

#### 4.6.2 Hold & Release Actions
**Columns:** Hold ID | Entity | Reason | Applied By | Applied On | Released By | Released On | Duration

#### 4.6.3 Inventory Movement Log
**Columns:** Timestamp | Material | Batch | From State | To State | Quantity | User | Reason

---

### 4.7 Executive Dashboard

#### 4.7.1 One-Screen Overview
**Question:** "What's the plant status right now?"

**Metrics (KPI Cards):**
- Total Production (today)
- Overall Yield %
- Scrap %
- Orders In Progress
- Inventory On Hold
- Active Holds Count

**Visuals:**
- Production trend (last 7 days) - line chart
- Order status distribution - donut chart
- Inventory by type - stacked bar

**Rules:** Read-only, highly visual, zero operational actions

---

## 5. Drill-Down vs Drill-Through

### 5.1 Drill-Down (Same Entity, More Detail)
```
Monthly Production → Daily → Operation-wise → Individual confirmations
```
- Keeps parent filters active
- Shows breadcrumb: "Production > January 2026 > Week 3 > Melting"

### 5.2 Drill-Through (Different Entity, Related Context)
```
Scrap % → Open Batch Genealogy → Inventory Movements
Order Line → Production Confirmations → Batch Detail
```
- Opens in new view or side panel
- Source context shown as "Navigated from: Scrap Analysis > STEEL-COIL-001"

---

## 6. Standardized Filters & Interactions

### 6.1 Global Filter Bar
All reports support:
- **Date Range**: From/To date picker
- **Granularity**: Day / Week / Month toggle
- **Product / SKU**: Dropdown with search
- **Operation Type**: Multi-select
- **Status**: Contextual to report type

### 6.2 Cascading Filters
- Product filter → shows only relevant operations
- Order filter → shows only relevant line items and operations
- Filters preserved during drill navigation

---

## 7. Backend API Design

### 7.1 Report-Specific Endpoints

| Endpoint | Description | Response |
|----------|-------------|----------|
| `GET /api/reports/production/summary` | Production summary with metrics | JSON with metrics + chart data |
| `GET /api/reports/production/by-operation` | Production grouped by operation | Paginated table |
| `GET /api/reports/production/trend` | Production trend data points | Time series JSON |
| `GET /api/reports/quality/scrap-analysis` | Scrap breakdown | Metrics + chart data |
| `GET /api/reports/quality/yield-trend` | Yield trend data points | Time series JSON |
| `GET /api/reports/inventory/balance` | Current inventory balance | Grouped summary |
| `GET /api/reports/inventory/wip` | WIP inventory | Paginated table |
| `GET /api/reports/orders/fulfillment` | Order fulfillment metrics | JSON with metrics |
| `GET /api/reports/orders/completion` | Order completion details | Paginated table |
| `GET /api/reports/operations/cycle-times` | Operation cycle time stats | Grouped summary |
| `GET /api/reports/operations/long-running` | Exceeding-time operations | Paginated table |
| `GET /api/reports/operations/holds` | Hold analysis | Metrics + breakdown |
| `GET /api/reports/audit/status-changes` | Status change log | Paginated table |
| `GET /api/reports/audit/hold-actions` | Hold & release log | Paginated table |
| `GET /api/reports/audit/inventory-movements` | Inventory movement log | Paginated table |
| `GET /api/reports/executive/dashboard` | Executive KPIs | JSON with all metrics |

### 7.2 Common Query Parameters
```
?startDate=2026-01-01
&endDate=2026-01-31
&granularity=DAY|WEEK|MONTH
&productSku=STEEL-COIL-001
&operationType=MELTING
&page=0
&size=20
```

### 7.3 Report Response Format
```json
{
  "reportTitle": "Production Summary",
  "generatedAt": "2026-02-09T10:30:00",
  "filters": { "startDate": "2026-01-01", "endDate": "2026-01-31" },
  "metrics": [
    {
      "name": "totalProduced",
      "value": 15000,
      "unit": "KG",
      "formula": "SUM(produced_quantity)",
      "dataSource": "production_confirmations",
      "description": "Total quantity produced in the selected period"
    }
  ],
  "chartData": {
    "type": "bar",
    "labels": ["2026-01-01", "2026-01-02"],
    "datasets": [{ "label": "Produced", "data": [500, 600] }]
  },
  "tableData": {
    "content": [...],
    "totalElements": 50,
    "totalPages": 3
  }
}
```

---

## 8. Export Integration

### 8.1 Available Libraries
| Library | Purpose | Version |
|---------|---------|---------|
| OpenPDF | PDF report generation | 2.0.3 |
| Apache POI | Excel export (XLSX) | 5.2.5 |
| JFreeChart | Server-side chart images | 1.5.5 |
| OpenCV (Java) | Image processing for quality | 4.9.0 |

### 8.2 Export Endpoints
| Endpoint | Format | Description |
|----------|--------|-------------|
| `GET /api/reports/pdf/orders` | PDF | Order summary report |
| `GET /api/reports/pdf/inventory` | PDF | Inventory summary report |
| `GET /api/reports/excel/orders` | XLSX | Order data export |
| `GET /api/reports/excel/inventory` | XLSX | Inventory data export |
| `GET /api/reports/charts/order-status` | PNG | Order status pie chart |
| `GET /api/reports/charts/inventory-type` | PNG | Inventory type bar chart |
| `GET /api/reports/charts/inventory-state` | PNG | Inventory state pie chart |

### 8.3 Image Processing Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/reports/image/grayscale` | POST (multipart) | Convert image to grayscale |
| `POST /api/reports/image/resize` | POST (multipart) | Resize image |
| `POST /api/reports/image/thumbnail` | POST (multipart) | Generate thumbnail |
| `POST /api/reports/image/metadata` | POST (multipart) | Get image metadata |

---

## 9. Frontend Module Structure

```
frontend/src/app/features/reports/
├── reports.module.ts
├── reports-routing.module.ts
├── reports-landing/
│   ├── reports-landing.component.ts
│   ├── reports-landing.component.html
│   └── reports-landing.component.css
├── production/
│   ├── production-summary/
│   ├── production-by-operation/
│   └── production-trend/
├── quality/
│   ├── scrap-analysis/
│   ├── scrap-by-product/
│   └── yield-trend/
├── inventory/
│   ├── inventory-balance/
│   ├── wip-inventory/
│   └── batch-genealogy-viewer/
├── orders/
│   ├── order-fulfillment/
│   ├── order-completion/
│   └── partially-fulfilled/
├── operations/
│   ├── cycle-times/
│   ├── long-running/
│   └── hold-analysis/
├── audit/
│   ├── status-changes/
│   ├── hold-actions/
│   └── inventory-movements/
├── executive/
│   └── executive-dashboard/
└── shared/
    ├── report-filter-bar/
    ├── metric-card/
    ├── chart-wrapper/
    └── report-export-button/
```

---

## 10. Documentation per Report (Accessible via ℹ️ Icon)

Each report's help panel contains:
1. **Report Description**: What this report shows
2. **Key Metrics Explained**: Each metric with formula
3. **Drill Paths**: Available drill-down and drill-through paths
4. **Typical Business Questions**: 3-5 questions this report answers
5. **Data Freshness**: How recent the data is

---

## 11. Implementation Phases

### Phase 1: Foundation (Current)
- [x] Add OpenPDF, POI, JFreeChart, OpenCV to build.gradle
- [x] Create PdfReportService, ExcelExportService, ChartService, ImageProcessingService
- [x] Create ReportController with export endpoints
- [x] Create unit tests for all services and controller

### Phase 2: Report Backend APIs
- [ ] Create ReportService with production summary queries
- [ ] Create quality/scrap analysis queries
- [ ] Create inventory balance and WIP queries
- [ ] Create order fulfillment queries
- [ ] Create operation cycle time queries
- [ ] Create executive dashboard aggregation

### Phase 3: Frontend Reports Module
- [ ] Create reports.module.ts with routing
- [ ] Create report-filter-bar shared component
- [ ] Create metric-card shared component
- [ ] Create chart-wrapper component (using Chart.js)
- [ ] Implement Production Summary Dashboard
- [ ] Implement Executive Dashboard

### Phase 4: Drill-Down & Export
- [ ] Implement drill-down navigation with breadcrumbs
- [ ] Implement drill-through to related entities
- [ ] Add PDF/Excel export buttons to each report
- [ ] Add ℹ️ metric info tooltips

### Phase 5: Remaining Reports
- [ ] Quality & Scrap reports
- [ ] Inventory & Traceability reports
- [ ] Orders & Fulfillment reports
- [ ] Process & Operations reports
- [ ] Audit & Compliance reports

---

## 12. Validation Question

> "Would a plant manager or quality head immediately trust and understand these reports?"

**Answer:** Yes — every metric is explainable with formula and source, drill paths provide full context, and the executive dashboard gives a single-screen overview without requiring operational knowledge.
