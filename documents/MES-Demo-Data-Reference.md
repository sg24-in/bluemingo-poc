# MES Production Confirmation POC - Demo Data Reference

This document provides a complete reference of all seed/demo data in the MES Production Confirmation POC application. It is intended for portal users who do not have direct database access and need to understand what data is available, how entities relate to one another, and what scenarios are pre-configured for demonstration purposes.

---

## Table of Contents

1. [Overview](#1-overview)
2. [User Accounts](#2-user-accounts)
3. [Customers](#3-customers)
4. [Products](#4-products)
5. [Materials](#5-materials)
6. [Processes, Routing, and Operations](#6-processes-routing-and-operations)
7. [Bill of Materials (BOM)](#7-bill-of-materials-bom)
8. [Equipment](#8-equipment)
9. [Operators](#9-operators)
10. [Orders](#10-orders)
11. [Batches](#11-batches)
12. [Inventory](#12-inventory)
13. [Hold Records](#13-hold-records)
14. [Batch Number Configuration](#14-batch-number-configuration)
15. [Production Confirmations](#15-production-confirmations)
16. [Product-Process-BOM Cross Reference](#16-product-process-bom-cross-reference)
17. [Lookup and Configuration Data](#17-lookup-and-configuration-data)
18. [Summary Counts](#18-summary-counts)
19. [Batch Genealogy (Traceability)](#19-batch-genealogy-traceability)
20. [Demo Scenarios for Testing](#20-demo-scenarios-for-testing)
21. [Customer Order History](#21-customer-order-history)

---

## 1. Overview

The demo data represents a realistic steel manufacturing environment with complete production workflows spanning melting, casting, rolling, pickling, annealing, and finishing operations. The data covers:

- **12 customers** across 10 countries (11 active, 1 inactive)
- **8 products** spanning hot rolled coils, cold rolled sheets, rebar, and billets
- **32 materials** organized by type: raw materials, intermediates, work-in-progress, and finished goods
- **6 production processes** with 4 active routings containing 22 routing steps
- **8 hierarchical BOM trees** (88 total BOM nodes) covering all products
- **16 equipment items** across 12 categories (melting, casting, rolling, etc.)
- **12 operators** across 6 departments on day and night shifts
- **45 orders** (15 original + 30 additional with multi-stage production)
- **82 order line items** with full operation chains
- **70 batches** across all material types and statuses
- **70 inventory records** across all states
- **12 hold records** (8 active, 4 released) on various entity types
- **35 production confirmations** with equipment and operator assignments
- **11 batch number configuration rules**

All demo data is timestamped in January-February 2026 and reflects various stages of production: orders that are completed, in-progress, on hold, blocked, and cancelled.

---

## 2. User Accounts

The application ships with a single administrator account for demonstration purposes.

| Field | Value |
|-------|-------|
| **Email** | `admin@mes.com` |
| **Password** | `admin123` |
| **Name** | Admin User |
| **Employee ID** | EMP-001 |
| **Status** | ACTIVE |
| **Role** | System Administrator |

This account has full access to all modules: Dashboard, Orders, Production, Inventory, Batches, Holds, Equipment, Quality, and all Admin/Manage pages.

---

## 3. Customers

There are 12 customers in the system. Eleven are active and available for order creation; one (CUST-012) has been deactivated.

| ID | Code | Name | Contact Person | Email | Phone | City | Country | Status |
|----|------|------|----------------|-------|-------|------|---------|--------|
| 1 | CUST-001 | ABC Steel Corporation | John Smith | john.smith@abcsteel.com | +1-555-0101 | Pittsburgh | USA | ACTIVE |
| 2 | CUST-002 | Global Manufacturing Ltd | Sarah Johnson | sarah.j@globalmanuf.com | +1-555-0102 | Detroit | USA | ACTIVE |
| 3 | CUST-003 | Pacific Metal Works | Michael Chen | m.chen@pacificmetal.com | +1-555-0103 | Los Angeles | USA | ACTIVE |
| 4 | CUST-004 | European Auto Parts GmbH | Hans Mueller | h.mueller@euroauto.eu | +49-30-5504 | Munich | Germany | ACTIVE |
| 5 | CUST-005 | Asian Electronics Inc | Yuki Tanaka | y.tanaka@asianelec.jp | +81-3-55050 | Tokyo | Japan | ACTIVE |
| 6 | CUST-006 | BuildRight Construction | Tom Bradley | tom.b@buildright.com | +1-555-0106 | Chicago | USA | ACTIVE |
| 7 | CUST-007 | Nordic Steel Trading AB | Erik Lindqvist | erik@nordicsteel.se | +46-8-55070 | Stockholm | Sweden | ACTIVE |
| 8 | CUST-008 | Middle East Metals FZE | Ahmed Al-Rashid | ahmed@memetals.ae | +971-4-5508 | Dubai | UAE | ACTIVE |
| 9 | CUST-009 | South American Steel SA | Carlos Rodriguez | carlos@sasteel.com | +54-11-5550 | Buenos Aires | Argentina | ACTIVE |
| 10 | CUST-010 | African Mining Corp | Kwame Mensah | kwame@afminecorp.com | +27-11-5551 | Johannesburg | South Africa | ACTIVE |
| 11 | CUST-011 | Oceanic Metals Ltd | Bruce Wilson | bruce@oceanicmetals.au | +61-2-55520 | Sydney | Australia | ACTIVE |
| 12 | CUST-012 | Canadian Steel Works | Pierre Dubois | pierre@cansteelworks.ca | +1-514-5553 | Montreal | Canada | **INACTIVE** |

### Customer Distribution by Country

| Country | Count | Customer Codes |
|---------|-------|----------------|
| USA | 4 | CUST-001, CUST-002, CUST-003, CUST-006 |
| Germany | 1 | CUST-004 |
| Japan | 1 | CUST-005 |
| Sweden | 1 | CUST-007 |
| UAE | 1 | CUST-008 |
| Argentina | 1 | CUST-009 |
| South Africa | 1 | CUST-010 |
| Australia | 1 | CUST-011 |
| Canada | 1 | CUST-012 (inactive) |

---

## 4. Products

Eight products are configured in the system, spanning three product categories. All products are ACTIVE.

| SKU | Product Name | Category | Group | Unit | Price (USD) | Min Order Qty | Lead Time |
|-----|-------------|----------|-------|------|-------------|---------------|-----------|
| HR-COIL-2MM | Hot Rolled Coil 2mm | Coils | Hot Rolled | T | 700.00 | 10 | 14 days |
| HR-COIL-3MM | Hot Rolled Coil 3mm | Coils | Hot Rolled | T | 680.00 | 10 | 14 days |
| HR-COIL-4MM | Hot Rolled Coil 4mm | Coils | Hot Rolled | T | 660.00 | 15 | 14 days |
| CR-SHEET-1MM | Cold Rolled Sheet 1mm | Sheets | Cold Rolled | T | 850.00 | 5 | 21 days |
| CR-SHEET-2MM | Cold Rolled Sheet 2mm | Sheets | Cold Rolled | T | 820.00 | 5 | 21 days |
| REBAR-10MM | Reinforcement Bar 10mm | Rebars | Long Products | T | 580.00 | 20 | 10 days |
| REBAR-12MM | Reinforcement Bar 12mm | Rebars | Long Products | T | 575.00 | 20 | 10 days |
| STEEL-BILLET-100 | Steel Billet 100mm | Billets | Semi-Finished | T | 500.00 | 25 | 7 days |

### Product-to-Process Mapping

Each product is manufactured through a specific production process:

| Product SKU | Process | Operations Count | Description |
|-------------|---------|-----------------|-------------|
| HR-COIL-2MM | Process 1: Hot Rolled Coil Production | 8 | Charge, Melt, Refine, Slab Cast, Reheat, Rough Roll, Finish Roll, Cool/Coil |
| HR-COIL-3MM | Process 1: Hot Rolled Coil Production | 8 | Same as HR-COIL-2MM |
| HR-COIL-4MM | Process 1: Hot Rolled Coil Production | 8 | Same as HR-COIL-2MM |
| CR-SHEET-1MM | Process 2: Cold Rolled Sheet Production | 3 | Pickling, Cold Rolling, Batch Annealing |
| CR-SHEET-2MM | Process 2: Cold Rolled Sheet Production | 3 | Same as CR-SHEET-1MM |
| REBAR-10MM | Process 3: Rebar Production | 7 | Charge, Melt, Refine, Billet Cast, Reheat, Bar Roll, Quench/Temper |
| REBAR-12MM | Process 3: Rebar Production | 7 | Same as REBAR-10MM |
| STEEL-BILLET-100 | Process 4: Billet Production | 4 | Charge, Melt, Refine, Billet Cast |

---

## 5. Materials

There are 32 materials organized into four types reflecting the steel production value chain.

### 5.1 Raw Materials (RM) - 15 materials

These are purchased inputs consumed during production.

| Code | Name | Description | Unit | Group | Std. Cost (USD) | Min Stock | Reorder Point | Lead Time |
|------|------|-------------|------|-------|-----------------|-----------|---------------|-----------|
| RM-SCRAP-A | Steel Scrap Grade A | High-quality HMS1 steel scrap | T | Scrap | 250.00 | 100 | 200 | 3 days |
| RM-SCRAP-B | Steel Scrap Grade B | HMS2 mixed steel scrap | T | Scrap | 200.00 | 50 | 100 | 3 days |
| RM-SCRAP-C | Steel Scrap Grade C | Shredded steel scrap | T | Scrap | 150.00 | 30 | 60 | 3 days |
| RM-IRON-ORE | Iron Ore Pellets | DR-grade iron ore pellets, 67% Fe | T | Iron | 150.00 | 80 | 150 | 14 days |
| RM-LIMESTONE | Limestone | High-calcium flux grade limestone | T | Flux | 50.00 | 30 | 60 | 5 days |
| RM-FESI | Ferroalloy - FeSi | Ferrosilicon 75% for deoxidation | KG | Alloy | 2.50 | 500 | 1,000 | 7 days |
| RM-FEMN | Ferroalloy - FeMn | Ferromanganese 78% for strengthening | KG | Alloy | 3.00 | 400 | 800 | 7 days |
| RM-FEV | Ferroalloy - FeV | Ferrovanadium 80% for high-strength steel | KG | Alloy | 25.00 | 100 | 200 | 14 days |
| RM-COAL | Coal / Coke | Met-grade coke for energy and reduction | T | Energy | 120.00 | 50 | 100 | 7 days |
| RM-GRAPHITE | Graphite Electrodes | UHP graphite electrodes 600mm | EA | Consumable | 800.00 | 10 | 20 | 21 days |
| RM-AL-WIRE | Aluminum Wire | Aluminum deoxidizer wire 9.5mm | KG | Alloy | 4.50 | 200 | 500 | 5 days |
| RM-MOLD-PWD | Mold Powder | Continuous casting mold flux powder | KG | Consumable | 1.20 | 500 | 1,000 | 7 days |
| RM-ROLL-LUB | Rolling Lubricant | Hot/cold rolling process lubricant | L | Consumable | 5.00 | 500 | 1,000 | 5 days |
| RM-HCL | Hydrochloric Acid | HCl 18% for pickling line | L | Chemical | 0.80 | 2,000 | 4,000 | 3 days |
| RM-COATING | Surface Coating Oil | Anti-corrosion surface oil | L | Consumable | 3.50 | 500 | 1,000 | 5 days |

### 5.2 Intermediate Materials (IM) - 10 materials

These are produced and consumed within the production chain, not sold to customers.

| Code | Name | Description | Unit | Group | Std. Cost (USD) |
|------|------|-------------|------|-------|-----------------|
| IM-LIQUID | Liquid Steel | Molten steel from EAF | T | Steel | 400.00 |
| IM-SLAB | Steel Slab 200mm | Continuously cast steel slab | T | Steel | 550.00 |
| IM-BILLET | Steel Billet 100mm | Continuously cast steel billet | T | Steel | 500.00 |
| IM-BLOOM | Steel Bloom 200mm | Continuously cast steel bloom | T | Steel | 520.00 |
| IM-HR-ROUGH | HR Coil Rough | Rough-rolled hot strip | T | Coil | 600.00 |
| IM-PICKLED | Pickled HR Strip | Acid-pickled hot rolled strip | T | Strip | 650.00 |
| IM-CR-STRIP | Cold Rolled Strip | Cold-reduced steel strip | T | Strip | 750.00 |
| IM-ANNEALED | Annealed CR Strip | Batch-annealed cold rolled strip | T | Strip | 780.00 |
| IM-ROLLED-BAR | Rolled Bar | Hot-rolled reinforcement bar | T | Long | 540.00 |
| IM-WIRE-ROD | Wire Rod | Hot-rolled wire rod coil | T | Long | 560.00 |

### 5.3 Work In Progress (WIP) - 4 materials

These represent material actively being processed on equipment.

| Code | Name | Description | Unit | Group | Std. Cost (USD) |
|------|------|-------------|------|-------|-----------------|
| WIP-MELT | Molten Steel (Processing) | Liquid steel in ladle - active refining | T | Steel | 380.00 |
| WIP-CAST | Steel Being Cast | Steel in continuous caster - active | T | Steel | 420.00 |
| WIP-ROLL | Strip on Rolling Mill | Hot strip on rolling mill - active | T | Coil | 550.00 |
| WIP-PICKLE | Strip in Pickling Line | Strip in acid pickling - active | T | Strip | 600.00 |

### 5.4 Finished Goods (FG) - 3 materials

These correspond to the final products shipped to customers.

| Code | Name | Description | Unit | Group | Std. Cost (USD) |
|------|------|-------------|------|-------|-----------------|
| FG-HR-2MM | HR Coil 2mm | Hot rolled coil, 2mm thickness | T | Coil | 700.00 |
| FG-CR-1MM | CR Sheet 1mm | Cold rolled sheet, 1mm thickness | T | Sheet | 850.00 |
| FG-REBAR-10 | Rebar 10mm | Reinforcement bar, 10mm diameter | T | Long | 580.00 |

### Material Flow Diagram

```
Raw Materials (RM)                  Intermediates (IM)              Finished Goods (FG)
===================                 ==================              ==================
RM-SCRAP-A/B/C  ----+
RM-IRON-ORE     ----+---> IM-LIQUID --+---> IM-SLAB ---> IM-HR-ROUGH ---> FG-HR-2MM
RM-LIMESTONE    ----+                 |
RM-FESI/FEMN    ----+                 +---> IM-BILLET --> IM-ROLLED-BAR -> FG-REBAR-10
RM-COAL         ----+
RM-GRAPHITE     ----+

IM-HR-ROUGH --> IM-PICKLED --> IM-CR-STRIP --> IM-ANNEALED --> FG-CR-1MM
  (uses RM-HCL)   (uses RM-ROLL-LUB)           (uses RM-COATING)
```

---

## 6. Processes, Routing, and Operations

### 6.1 Processes

Six production processes are defined. Four are active with routing configurations; one is in draft and one is inactive.

| ID | Process Name | Status | Has Routing | Description |
|----|-------------|--------|-------------|-------------|
| 1 | Hot Rolled Coil Production | **ACTIVE** | Yes | Full steelmaking + hot rolling (8 operations) |
| 2 | Cold Rolled Sheet Production | **ACTIVE** | Yes | Downstream cold processing (3 operations) |
| 3 | Rebar Production | **ACTIVE** | Yes | Full steelmaking + bar rolling (7 operations) |
| 4 | Billet Production | **ACTIVE** | Yes | Steelmaking + billet casting (4 operations) |
| 5 | Wire Rod Production | **DRAFT** | No | Future capability, not yet configured |
| 6 | Galvanized Sheet Production | **INACTIVE** | No | Deactivated process |

### 6.2 Routing and Steps

Each active process has one sequential routing. Routing steps link to operation templates and define which steps produce output batches.

#### Process 1: HR Coil Standard Route (8 steps)

| Seq | Operation | Code | Type | Produces Batch | Equipment Type |
|-----|-----------|------|------|---------------|----------------|
| 1 | Scrap Charging | MELT-CHRG | FURNACE | No | EAF |
| 2 | EAF Melting | MELT-EAF | FURNACE | No | EAF |
| 3 | Ladle Refining | MELT-LF | FURNACE | Yes (Liquid Steel) | LF |
| 4 | Slab Casting | CAST-SLAB | CASTER | Yes (Steel Slab) | CCM |
| 5 | Slab Reheating | ROLL-RHT | FURNACE | No | RHF |
| 6 | Rough Rolling | ROLL-RGH | ROLLING | No | HSM |
| 7 | Finish Rolling | ROLL-FIN | ROLLING | No | HSM |
| 8 | Cooling & Coiling | ROLL-COOL | COOLING | Yes (HR Coil) | HSM |

#### Process 2: CR Sheet Standard Route (3 steps)

| Seq | Operation | Code | Type | Produces Batch | Equipment Type |
|-----|-----------|------|------|---------------|----------------|
| 1 | Pickling | PKL | PICKLING | Yes (Pickled Strip) | PKL |
| 2 | Cold Rolling | CRM | ROLLING | Yes (CR Strip) | CRM |
| 3 | Batch Annealing | ANN | HEAT_TREATMENT | Yes (CR Sheet) | BAF |

#### Process 3: Rebar Standard Route (7 steps)

| Seq | Operation | Code | Type | Produces Batch | Equipment Type |
|-----|-----------|------|------|---------------|----------------|
| 1 | Scrap Charging | MELT-CHRG | FURNACE | No | EAF |
| 2 | EAF Melting | MELT-EAF | FURNACE | No | EAF |
| 3 | Ladle Refining | MELT-LF | FURNACE | Yes (Liquid Steel) | LF |
| 4 | Billet Casting | CAST-BILL | CASTER | Yes (Billet) | CCM |
| 5 | Billet Reheating | BAR-RHT | FURNACE | No | RHF |
| 6 | Bar Rolling | BAR-ROLL | ROLLING | No | BRM |
| 7 | Quenching & Tempering | BAR-QT | HEAT_TREATMENT | Yes (Rebar) | QT |

#### Process 4: Billet Standard Route (4 steps)

| Seq | Operation | Code | Type | Produces Batch | Equipment Type |
|-----|-----------|------|------|---------------|----------------|
| 1 | Scrap Charging | MELT-CHRG | FURNACE | No | EAF |
| 2 | EAF Melting | MELT-EAF | FURNACE | No | EAF |
| 3 | Ladle Refining | MELT-LF | FURNACE | Yes (Liquid Steel) | LF |
| 4 | Billet Casting | CAST-BILL | CASTER | Yes (Billet) | CCM |

### 6.3 Operation Templates (18 total)

These are the reusable templates from which runtime operations are created:

| ID | Name | Code | Type | Qty Type | Duration (min) | Status |
|----|------|------|------|----------|----------------|--------|
| 1 | Scrap Charging | MELT-CHRG | FURNACE | BATCH | 60 | ACTIVE |
| 2 | EAF Melting | MELT-EAF | FURNACE | BATCH | 180 | ACTIVE |
| 3 | Ladle Refining | MELT-LF | FURNACE | BATCH | 90 | ACTIVE |
| 4 | Slab Casting | CAST-SLAB | CASTER | CONTINUOUS | 240 | ACTIVE |
| 5 | Billet Casting | CAST-BILL | CASTER | CONTINUOUS | 180 | ACTIVE |
| 6 | Slab Reheating | ROLL-RHT | FURNACE | BATCH | 120 | ACTIVE |
| 7 | Rough Rolling | ROLL-RGH | ROLLING | CONTINUOUS | 60 | ACTIVE |
| 8 | Finish Rolling | ROLL-FIN | ROLLING | CONTINUOUS | 45 | ACTIVE |
| 9 | Cooling & Coiling | ROLL-COOL | COOLING | CONTINUOUS | 30 | ACTIVE |
| 10 | Pickling | PKL | PICKLING | CONTINUOUS | 90 | ACTIVE |
| 11 | Cold Rolling | CRM | ROLLING | CONTINUOUS | 120 | ACTIVE |
| 12 | Batch Annealing | ANN | HEAT_TREATMENT | BATCH | 480 | ACTIVE |
| 13 | Billet Reheating | BAR-RHT | FURNACE | BATCH | 90 | ACTIVE |
| 14 | Bar Rolling | BAR-ROLL | ROLLING | CONTINUOUS | 60 | ACTIVE |
| 15 | Quenching & Tempering | BAR-QT | HEAT_TREATMENT | CONTINUOUS | 30 | ACTIVE |
| 16 | Quality Inspection | QC | INSPECTION | DISCRETE | 60 | ACTIVE |
| 17 | Packaging | PACK | FINISHING | DISCRETE | 45 | ACTIVE |
| 18 | Galvanizing | GALV | COATING | CONTINUOUS | 120 | INACTIVE |

---

## 7. Bill of Materials (BOM)

Eight BOM trees define the complete material hierarchy for each product. The BOM is hierarchical: the root node is the output product, and child nodes are the inputs required at each production stage. Each node specifies a quantity required per unit of parent output and a yield loss ratio (where 1.00 = no loss).

### 7.1 HR-COIL-2MM BOM (5 levels, 14 nodes)

```
FG-HR-2MM (1.0000 T, yield 0.98)          <- Finished HR Coil 2mm
+-- IM-HR-ROUGH (1.0500 T, yield 0.95)     <- Hot Rolled Strip
|   +-- IM-SLAB (1.1200 T, yield 0.93)     <- Steel Slab 200mm
|   |   +-- IM-LIQUID (1.1800 T, yield 0.88)    <- Liquid Steel
|   |   |   +-- RM-SCRAP-A (0.7000 T, yield 0.95)
|   |   |   +-- RM-SCRAP-B (0.2000 T, yield 0.92)
|   |   |   +-- RM-IRON-ORE (0.1500 T, yield 0.97)
|   |   |   +-- RM-LIMESTONE (0.0800 T, yield 1.00)
|   |   |   +-- RM-FESI (0.0050 KG, yield 1.00)
|   |   |   +-- RM-COAL (0.1000 T, yield 1.00)
|   |   |   +-- RM-GRAPHITE (0.0030 EA, yield 0.85)
|   |   +-- RM-MOLD-PWD (0.0050 KG, yield 1.00)
|   +-- RM-ROLL-LUB (0.0100 L, yield 1.00)
+-- RM-COATING (0.0200 L, yield 1.00)
```

### 7.2 CR-SHEET-1MM BOM (6 levels, 14 nodes)

This is the deepest BOM tree, reflecting that cold rolled sheet requires hot rolled coil as an input.

```
FG-CR-1MM (1.0000 T, yield 0.97)          <- Finished CR Sheet 1mm
+-- IM-ANNEALED (1.0300 T, yield 0.97)     <- Annealed CR Strip
|   +-- IM-CR-STRIP (1.0800 T, yield 0.94)    <- Cold Rolled Strip
|       +-- IM-PICKLED (1.1200 T, yield 0.96)     <- Pickled HR Strip
|       |   +-- IM-HR-ROUGH (1.1500 T, yield 0.93)    <- HR Coil Base
|       |   |   +-- RM-SCRAP-A (0.7500 T, yield 0.95)
|       |   |   +-- RM-IRON-ORE (0.2000 T, yield 0.97)
|       |   |   +-- RM-FESI (0.0050 KG, yield 1.00)
|       |   |   +-- RM-LIMESTONE (0.0600 T, yield 1.00)
|       |   |   +-- RM-COAL (0.0800 T, yield 1.00)
|       |   |   +-- RM-AL-WIRE (0.0030 KG, yield 1.00)
|       |   +-- RM-HCL (0.0500 L, yield 1.00)
|       +-- RM-ROLL-LUB (0.0200 L, yield 1.00)
+-- RM-COATING (0.0150 L, yield 1.00)
```

### 7.3 REBAR-10MM BOM (5 levels, 10 nodes)

```
FG-REBAR-10 (1.0000 T, yield 0.99)        <- Finished Rebar 10mm
+-- IM-ROLLED-BAR (1.0400 T, yield 0.96)   <- Rolled Bar
    +-- IM-BILLET (1.1000 T, yield 0.93)    <- Steel Billet 100mm
    |   +-- IM-LIQUID (1.1500 T, yield 0.90)    <- Liquid Steel
    |   |   +-- RM-SCRAP-A (0.8000 T, yield 0.94)
    |   |   +-- RM-SCRAP-B (0.1800 T, yield 0.92)
    |   |   +-- RM-FEMN (0.0080 KG, yield 1.00)
    |   |   +-- RM-COAL (0.0900 T, yield 1.00)
    |   +-- RM-LIMESTONE (0.0400 T, yield 1.00)
    +-- RM-ROLL-LUB (0.0050 L, yield 1.00)
```

### 7.4 HR-COIL-3MM BOM (5 levels, 11 nodes)

Similar structure to HR-COIL-2MM with slightly different quantities for the 3mm thickness.

```
FG-HR-2MM (1.0000 T, yield 0.98)          <- Finished HR Coil 3mm
+-- IM-HR-ROUGH (1.0600 T, yield 0.94)
|   +-- IM-SLAB (1.1400 T, yield 0.92)
|   |   +-- IM-LIQUID (1.2000 T, yield 0.87)
|   |   |   +-- RM-SCRAP-A (0.7200 T, yield 0.95)
|   |   |   +-- RM-SCRAP-B (0.1800 T, yield 0.92)
|   |   |   +-- RM-IRON-ORE (0.1600 T, yield 0.97)
|   |   |   +-- RM-COAL (0.1100 T, yield 1.00)
|   |   +-- RM-MOLD-PWD (0.0055 KG, yield 1.00)
|   +-- RM-ROLL-LUB (0.0120 L, yield 1.00)
+-- RM-COATING (0.0180 L, yield 1.00)
```

### 7.5 HR-COIL-4MM BOM (5 levels, 10 nodes)

```
FG-HR-2MM (1.0000 T, yield 0.98)          <- Finished HR Coil 4mm
+-- IM-HR-ROUGH (1.0700 T, yield 0.93)
|   +-- IM-SLAB (1.1600 T, yield 0.91)
|   |   +-- IM-LIQUID (1.2200 T, yield 0.86)
|   |   |   +-- RM-SCRAP-A (0.7500 T, yield 0.94)
|   |   |   +-- RM-SCRAP-B (0.1500 T, yield 0.92)
|   |   |   +-- RM-IRON-ORE (0.1700 T, yield 0.97)
|   |   |   +-- RM-COAL (0.1200 T, yield 1.00)
|   +-- RM-ROLL-LUB (0.0140 L, yield 1.00)
+-- RM-COATING (0.0160 L, yield 1.00)
```

### 7.6 CR-SHEET-2MM BOM (6 levels, 11 nodes)

Similar to CR-SHEET-1MM with quantities adjusted for 2mm thickness.

```
FG-CR-1MM (1.0000 T, yield 0.97)          <- Finished CR Sheet 2mm
+-- IM-ANNEALED (1.0400 T, yield 0.96)
|   +-- IM-CR-STRIP (1.0900 T, yield 0.93)
|       +-- IM-PICKLED (1.1300 T, yield 0.95)
|       |   +-- IM-HR-ROUGH (1.1600 T, yield 0.92)
|       |   |   +-- RM-SCRAP-A (0.7800 T, yield 0.95)
|       |   |   +-- RM-IRON-ORE (0.1800 T, yield 0.97)
|       |   |   +-- RM-COAL (0.0900 T, yield 1.00)
|       |   +-- RM-HCL (0.0450 L, yield 1.00)
|       +-- RM-ROLL-LUB (0.0180 L, yield 1.00)
+-- RM-COATING (0.0140 L, yield 1.00)
```

### 7.7 REBAR-12MM BOM (5 levels, 10 nodes)

Similar to REBAR-10MM with quantities adjusted for 12mm diameter.

```
FG-REBAR-10 (1.0000 T, yield 0.99)        <- Finished Rebar 12mm
+-- IM-ROLLED-BAR (1.0500 T, yield 0.95)
    +-- IM-BILLET (1.1100 T, yield 0.92)
    |   +-- IM-LIQUID (1.1600 T, yield 0.89)
    |   |   +-- RM-SCRAP-A (0.8200 T, yield 0.94)
    |   |   +-- RM-SCRAP-B (0.1600 T, yield 0.92)
    |   |   +-- RM-FEMN (0.0090 KG, yield 1.00)
    |   |   +-- RM-COAL (0.0950 T, yield 1.00)
    |   +-- RM-LIMESTONE (0.0450 T, yield 1.00)
    +-- RM-ROLL-LUB (0.0060 L, yield 1.00)
```

### 7.8 STEEL-BILLET-100 BOM (3 levels, 8 nodes)

The simplest BOM tree for the semi-finished billet product.

```
IM-BILLET (1.0000 T, yield 0.98)           <- Steel Billet 100mm
+-- IM-LIQUID (1.0800 T, yield 0.92)       <- Liquid Steel
|   +-- RM-SCRAP-A (0.7000 T, yield 0.95)
|   +-- RM-SCRAP-B (0.2500 T, yield 0.93)
|   +-- RM-IRON-ORE (0.1200 T, yield 0.97)
|   +-- RM-LIMESTONE (0.0500 T, yield 1.00)
|   +-- RM-COAL (0.0800 T, yield 1.00)
+-- RM-MOLD-PWD (0.0040 KG, yield 1.00)
```

### BOM Summary Table

| Product SKU | BOM Version | Levels | Total Nodes | Key Raw Materials |
|-------------|------------|--------|-------------|-------------------|
| HR-COIL-2MM | V1 | 5 | 14 | Scrap A/B, Iron Ore, Limestone, FeSi, Coal, Graphite |
| HR-COIL-3MM | V1 | 5 | 11 | Scrap A/B, Iron Ore, Coal |
| HR-COIL-4MM | V1 | 5 | 10 | Scrap A/B, Iron Ore, Coal |
| CR-SHEET-1MM | V1 | 6 | 14 | Scrap A, Iron Ore, FeSi, Limestone, Coal, Al Wire, HCl |
| CR-SHEET-2MM | V1 | 6 | 11 | Scrap A, Iron Ore, Coal, HCl |
| REBAR-10MM | V1 | 5 | 10 | Scrap A/B, FeMn, Coal, Limestone |
| REBAR-12MM | V1 | 5 | 10 | Scrap A/B, FeMn, Coal, Limestone |
| STEEL-BILLET-100 | V1 | 3 | 8 | Scrap A/B, Iron Ore, Limestone, Coal |

---

## 8. Equipment

Sixteen pieces of equipment are configured across the production facility.

| ID | Code | Name | Type | Category | Capacity | Unit | Location | Status |
|----|------|------|------|----------|----------|------|----------|--------|
| 1 | EAF-001 | Electric Arc Furnace #1 | BATCH | MELTING | 120 | T | Melting Shop | **AVAILABLE** |
| 2 | EAF-002 | Electric Arc Furnace #2 | BATCH | MELTING | 100 | T | Melting Shop | **IN_USE** |
| 3 | EAF-003 | Electric Arc Furnace #3 | BATCH | MELTING | 80 | T | Melting Shop | **MAINTENANCE** |
| 4 | LF-001 | Ladle Furnace #1 | BATCH | REFINING | 120 | T | Melting Shop | **AVAILABLE** |
| 5 | LF-002 | Ladle Furnace #2 | BATCH | REFINING | 100 | T | Melting Shop | **AVAILABLE** |
| 6 | CCM-001 | Continuous Caster #1 | CONTINUOUS | CASTING | 50 | T/hr | Casting Area | **AVAILABLE** |
| 7 | CCM-002 | Continuous Caster #2 | CONTINUOUS | CASTING | 45 | T/hr | Casting Area | **IN_USE** |
| 8 | HSM-001 | Hot Strip Mill #1 | CONTINUOUS | HOT_ROLLING | 30 | T/hr | Hot Rolling Mill | **AVAILABLE** |
| 9 | HSM-002 | Hot Strip Mill #2 | CONTINUOUS | HOT_ROLLING | 35 | T/hr | Hot Rolling Mill | **AVAILABLE** |
| 10 | CRM-001 | Cold Rolling Mill #1 | CONTINUOUS | COLD_ROLLING | 20 | T/hr | Cold Mill | **AVAILABLE** |
| 11 | BAF-001 | Batch Annealing Furnace #1 | BATCH | HEAT_TREATMENT | 60 | T | Annealing Bay | **AVAILABLE** |
| 12 | BRM-001 | Bar Rolling Mill #1 | CONTINUOUS | BAR_ROLLING | 40 | T/hr | Bar Mill | **AVAILABLE** |
| 13 | PKL-001 | Pickling Line #1 | CONTINUOUS | PICKLING | 25 | T/hr | Pickling Bay | **ON_HOLD** |
| 14 | COAT-001 | Galvanizing Line #1 | CONTINUOUS | COATING | 30 | T/hr | Coating Bay | **AVAILABLE** |
| 15 | WIRE-001 | Wire Drawing Machine #1 | CONTINUOUS | WIRE_DRAWING | 10 | T/hr | Wire Mill | **AVAILABLE** |
| 16 | PACK-001 | Packaging Line #1 | BATCH | PACKAGING | 50 | T | Shipping | **AVAILABLE** |

### Equipment Status Summary

| Status | Count | Equipment |
|--------|-------|-----------|
| AVAILABLE | 11 | EAF-001, LF-001, LF-002, CCM-001, HSM-001, HSM-002, CRM-001, BAF-001, BRM-001, COAT-001, WIRE-001 |
| IN_USE | 2 | EAF-002, CCM-002 |
| MAINTENANCE | 1 | EAF-003 |
| ON_HOLD | 1 | PKL-001 (acid leak - safety inspection) |
| Not in active use | 1 | PACK-001 (available but no current production) |

### Equipment by Location

| Location | Equipment |
|----------|-----------|
| Melting Shop | EAF-001, EAF-002, EAF-003, LF-001, LF-002 |
| Casting Area | CCM-001, CCM-002 |
| Hot Rolling Mill | HSM-001, HSM-002 |
| Cold Mill | CRM-001 |
| Annealing Bay | BAF-001 |
| Bar Mill | BRM-001 |
| Pickling Bay | PKL-001 |
| Coating Bay | COAT-001 |
| Wire Mill | WIRE-001 |
| Shipping | PACK-001 |

---

## 9. Operators

Twelve operators are configured across six departments. Eleven are active; one (OP-012) is inactive.

| ID | Code | Name | Department | Shift | Status |
|----|------|------|------------|-------|--------|
| 1 | OP-001 | John Smith | Melting | Day | **ACTIVE** |
| 2 | OP-002 | Mike Wilson | Melting | Night | **ACTIVE** |
| 3 | OP-003 | Sarah Brown | Casting | Day | **ACTIVE** |
| 4 | OP-004 | David Lee | Hot Rolling | Day | **ACTIVE** |
| 5 | OP-005 | Emily Chen | Cold Rolling | Day | **ACTIVE** |
| 6 | OP-006 | Robert Garcia | Quality | Day | **ACTIVE** |
| 7 | OP-007 | Jennifer Martinez | Quality | Night | **ACTIVE** |
| 8 | OP-008 | William Johnson | Maintenance | Day | **ACTIVE** |
| 9 | OP-009 | David Park | Finishing | Day | **ACTIVE** |
| 10 | OP-010 | Maria Santos | Coating | Night | **ACTIVE** |
| 11 | OP-011 | Ahmed Hassan | Melting | Night | **ACTIVE** |
| 12 | OP-012 | Lisa Chen | Quality | Day | **INACTIVE** |

### Operators by Department

| Department | Day Shift | Night Shift |
|------------|-----------|-------------|
| Melting | OP-001 (John Smith) | OP-002 (Mike Wilson), OP-011 (Ahmed Hassan) |
| Casting | OP-003 (Sarah Brown) | - |
| Hot Rolling | OP-004 (David Lee) | - |
| Cold Rolling | OP-005 (Emily Chen) | - |
| Quality | OP-006 (Robert Garcia), OP-012 (Lisa Chen - inactive) | OP-007 (Jennifer Martinez) |
| Maintenance | OP-008 (William Johnson) | - |
| Finishing | OP-009 (David Park) | - |
| Coating | - | OP-010 (Maria Santos) |

---

## 10. Orders

There are 45 orders in the system, organized into two groups: the original 15 orders and 30 additional orders that include multi-stage production scenarios.

### 10.1 Original Orders (1-15)

| ID | Order Number | Customer | Product(s) | Qty | Status | Date |
|----|-------------|----------|-----------|-----|--------|------|
| 1 | ORD-2026-001 | ABC Steel Corporation | HR-COIL-2MM (150T), HR-COIL-3MM (50T) | 200T | IN_PROGRESS | 2026-01-10 |
| 2 | ORD-2026-002 | Global Manufacturing Ltd | CR-SHEET-1MM (80T), CR-SHEET-2MM (40T) | 120T | IN_PROGRESS | 2026-01-12 |
| 3 | ORD-2026-003 | BuildRight Construction | REBAR-10MM (200T), REBAR-12MM (100T) | 300T | IN_PROGRESS | 2026-01-15 |
| 4 | ORD-2026-004 | Pacific Metal Works | HR-COIL-2MM (100T), CR-SHEET-1MM (50T), REBAR-10MM (80T) | 230T | CREATED | 2026-01-18 |
| 5 | ORD-2026-005 | European Auto Parts GmbH | HR-COIL-2MM (75T) | 75T | COMPLETED | 2026-01-20 |
| 6 | ORD-2026-006 | Nordic Steel Trading AB | REBAR-10MM (300T), REBAR-12MM (150T) | 450T | CREATED | 2026-01-22 |
| 7 | ORD-2026-007 | Middle East Metals FZE | CR-SHEET-1MM (120T) | 120T | CREATED | 2026-01-25 |
| 8 | ORD-2026-008 | Asian Electronics Inc | HR-COIL-2MM (60T) | 60T | ON_HOLD | 2026-01-28 |
| 9 | ORD-2026-009 | South American Steel SA | HR-COIL-3MM (250T), HR-COIL-4MM (100T) | 350T | CREATED | 2026-01-30 |
| 10 | ORD-2026-010 | African Mining Corp | STEEL-BILLET-100 (400T), REBAR-10MM (200T) | 600T | CREATED | 2026-01-31 |
| 11 | ORD-2026-011 | Oceanic Metals Ltd | CR-SHEET-2MM (180T), HR-COIL-2MM (80T) | 260T | IN_PROGRESS | 2026-02-01 |
| 12 | ORD-2026-012 | ABC Steel Corporation | REBAR-12MM (180T) | 180T | COMPLETED | 2026-02-02 |
| 13 | ORD-2026-013 | Global Manufacturing Ltd | HR-COIL-4MM (120T), CR-SHEET-2MM (60T) | 180T | COMPLETED | 2026-02-03 |
| 14 | ORD-2026-014 | Pacific Metal Works | CR-SHEET-1MM (90T) | 90T | CANCELLED | 2026-02-04 |
| 15 | ORD-2026-015 | Nordic Steel Trading AB | STEEL-BILLET-100 (250T) | 250T | BLOCKED | 2026-02-05 |

### 10.2 Additional Orders (16-45)

These orders include multi-stage production types where one product feeds into another.

| ID | Order Number | Customer | Type | Product Line Items | Status | Date |
|----|-------------|----------|------|-------------------|--------|------|
| 16 | ORD-2026-016 | Asian Electronics Inc | Single | HR-COIL-2MM (110T) | IN_PROGRESS | 2026-02-06 |
| 17 | ORD-2026-017 | Oceanic Metals Ltd | Single | HR-COIL-3MM (170T) | IN_PROGRESS | 2026-02-06 |
| 18 | ORD-2026-018 | South American Steel SA | Single | HR-COIL-4MM (190T) | COMPLETED | 2026-02-06 |
| 19 | ORD-2026-019 | Asian Electronics Inc | Single | CR-SHEET-1MM (60T) | IN_PROGRESS | 2026-02-07 |
| 20 | ORD-2026-020 | Asian Electronics Inc | Single | CR-SHEET-2MM (60T) | CREATED | 2026-02-07 |
| 21 | ORD-2026-021 | Global Manufacturing Ltd | Single | REBAR-10MM (190T) | IN_PROGRESS | 2026-02-07 |
| 22 | ORD-2026-022 | ABC Steel Corporation | Single | REBAR-12MM (250T) | BLOCKED | 2026-02-08 |
| 23 | ORD-2026-023 | ABC Steel Corporation | Single | STEEL-BILLET-100 (500T) | ON_HOLD | 2026-02-08 |
| 24 | ORD-2026-024 | Middle East Metals FZE | Single | REBAR-10MM (190T) | IN_PROGRESS | 2026-02-08 |
| 25 | ORD-2026-025 | Pacific Metal Works | Single | HR-COIL-2MM (240T) | CANCELLED | 2026-02-09 |
| 26 | ORD-2026-026 | Asian Electronics Inc | **HR->CR** | HR-COIL-2MM (140T) + CR-SHEET-1MM (110T) | CREATED | 2026-02-09 |
| 27 | ORD-2026-027 | Global Manufacturing Ltd | **HR->CR** | HR-COIL-3MM (100T) + CR-SHEET-2MM (120T) | CREATED | 2026-02-09 |
| 28 | ORD-2026-028 | Pacific Metal Works | **HR->CR** | HR-COIL-4MM (170T) + CR-SHEET-1MM (110T) | ON_HOLD | 2026-02-10 |
| 29 | ORD-2026-029 | European Auto Parts GmbH | **HR->CR** | HR-COIL-2MM (120T) + CR-SHEET-2MM (80T) | COMPLETED | 2026-02-10 |
| 30 | ORD-2026-030 | BuildRight Construction | **Billet->Rebar** | STEEL-BILLET-100 (220T) + REBAR-10MM (180T) | COMPLETED | 2026-02-10 |
| 31 | ORD-2026-031 | European Auto Parts GmbH | **Billet->Rebar** | STEEL-BILLET-100 (360T) + REBAR-12MM (310T) | CREATED | 2026-02-11 |
| 32 | ORD-2026-032 | African Mining Corp | **Billet->Rebar** | STEEL-BILLET-100 (180T) + REBAR-10MM (120T) | ON_HOLD | 2026-02-11 |
| 33 | ORD-2026-033 | Asian Electronics Inc | **Full Pipeline** | HR-COIL-2MM (160T) + CR-SHEET-1MM (110T) + REBAR-10MM (260T) | IN_PROGRESS | 2026-02-11 |
| 34 | ORD-2026-034 | Oceanic Metals Ltd | **Full Pipeline** | HR-COIL-3MM (90T) + CR-SHEET-2MM (80T) + REBAR-12MM (140T) | CANCELLED | 2026-02-12 |
| 35 | ORD-2026-035 | Middle East Metals FZE | **Triple Process** | STEEL-BILLET-100 (340T) + HR-COIL-4MM (150T) + CR-SHEET-2MM (120T) | CREATED | 2026-02-12 |
| 36 | ORD-2026-036 | Asian Electronics Inc | **Mixed HR** | HR-COIL-2MM (70T) + HR-COIL-3MM (110T) | CREATED | 2026-02-12 |
| 37 | ORD-2026-037 | Nordic Steel Trading AB | **Mixed Rebar** | REBAR-10MM (130T) + REBAR-12MM (170T) | COMPLETED | 2026-02-13 |
| 38 | ORD-2026-038 | Nordic Steel Trading AB | **Mixed CR** | CR-SHEET-1MM (50T) + CR-SHEET-2MM (70T) | IN_PROGRESS | 2026-02-13 |
| 39 | ORD-2026-039 | South American Steel SA | **Heavy HR->CR** | HR-COIL-2MM (220T) + HR-COIL-4MM (180T) + CR-SHEET-1MM (170T) | COMPLETED | 2026-02-13 |
| 40 | ORD-2026-040 | Middle East Metals FZE | **HR->CR** | HR-COIL-3MM (120T) + CR-SHEET-1MM (90T) | CREATED | 2026-02-14 |
| 41 | ORD-2026-041 | European Auto Parts GmbH | **Billet->Rebar** | STEEL-BILLET-100 (380T) + REBAR-12MM (340T) | CREATED | 2026-02-14 |
| 42 | ORD-2026-042 | European Auto Parts GmbH | **4-Stage Pipeline** | STEEL-BILLET-100 (110T) + HR-COIL-2MM (110T) + CR-SHEET-2MM (80T) + REBAR-10MM (120T) | CREATED | 2026-02-14 |
| 43 | ORD-2026-043 | Oceanic Metals Ltd | **Mixed HR** | HR-COIL-2MM (100T) + HR-COIL-3MM (70T) + HR-COIL-4MM (80T) | COMPLETED | 2026-02-15 |
| 44 | ORD-2026-044 | South American Steel SA | **Billet+Rebar+CR** | STEEL-BILLET-100 (250T) + REBAR-12MM (170T) + CR-SHEET-1MM (80T) | IN_PROGRESS | 2026-02-15 |
| 45 | ORD-2026-045 | Global Manufacturing Ltd | Single | STEEL-BILLET-100 (470T) | CREATED | 2026-02-15 |

### Order Status Summary (All 45)

| Status | Count | Order IDs |
|--------|-------|-----------|
| CREATED | 12 | 4, 6, 7, 9, 10, 20, 26, 27, 31, 35, 36, 40, 41, 42, 45 |
| IN_PROGRESS | 12 | 1, 2, 3, 11, 16, 17, 19, 21, 24, 33, 38, 44 |
| COMPLETED | 10 | 5, 12, 13, 18, 29, 30, 37, 39, 43 |
| ON_HOLD | 4 | 8, 23, 28, 32 |
| BLOCKED | 2 | 15, 22 |
| CANCELLED | 3 | 14, 25, 34 |

### Multi-Stage Order Types Explained

| Type | Description | Processes Involved | Total Ops |
|------|-------------|-------------------|-----------|
| **HR->CR** | Hot Rolled Coil feeds into Cold Rolled Sheet | Process 1 (8 ops) + Process 2 (3 ops) | 11 |
| **Billet->Rebar** | Billets are cast, then rolled into rebar | Process 4 (4 ops) + Process 3 (7 ops) | 11 |
| **Full Pipeline** | HR Coil + CR Sheet + Rebar in one order | Process 1 + Process 2 + Process 3 | 18 |
| **Triple Process** | Billet + HR Coil + CR Sheet | Process 4 + Process 1 + Process 2 | 15 |
| **4-Stage Pipeline** | All four processes in one order | Process 4 + Process 1 + Process 2 + Process 3 | 22 |
| **Heavy HR->CR** | Multiple HR Coil variants feeding CR Sheet | Process 1 (x2) + Process 2 | 19 |
| **Mixed** | Multiple variants of the same product type | Same process, different SKUs | Varies |

---

## 11. Batches

There are 70 batches in the system representing material at various production stages and statuses.

### 11.1 Raw Material Batches (28 batches)

| Batch # | Material | Quantity | Unit | Status | Notes |
|---------|----------|----------|------|--------|-------|
| B-RM-001 | RM-SCRAP-A (Steel Scrap Grade A) | 500 | T | AVAILABLE | Primary scrap supply |
| B-RM-002 | RM-SCRAP-A (Steel Scrap Grade A) | 350 | T | AVAILABLE | |
| B-RM-003 | RM-SCRAP-B (Steel Scrap Grade B) | 200 | T | AVAILABLE | |
| B-RM-004 | RM-IRON-ORE (Iron Ore Pellets) | 400 | T | AVAILABLE | |
| B-RM-005 | RM-LIMESTONE (Limestone) | 150 | T | AVAILABLE | |
| B-RM-006 | RM-FESI (Ferroalloy FeSi) | 2,000 | KG | AVAILABLE | |
| B-RM-007 | RM-FEMN (Ferroalloy FeMn) | 1,500 | KG | AVAILABLE | |
| B-RM-008 | RM-COAL (Coal / Coke) | 300 | T | AVAILABLE | |
| B-RM-009 | RM-GRAPHITE (Graphite Electrodes) | 50 | EA | AVAILABLE | |
| B-RM-010 | RM-SCRAP-A (Steel Scrap Grade A) | 180 | T | **ON_HOLD** | Quality investigation |
| B-RM-011 | RM-SCRAP-B (Steel Scrap Grade B) | 120 | T | AVAILABLE | |
| B-RM-012 | RM-HCL (Hydrochloric Acid) | 5,000 | L | AVAILABLE | |
| B-RM-013 | RM-COATING (Surface Coating Oil) | 2,000 | L | AVAILABLE | |
| B-RM-014 | RM-ROLL-LUB (Rolling Lubricant) | 3,000 | L | AVAILABLE | |
| B-RM-015 | RM-MOLD-PWD (Mold Powder) | 1,000 | KG | AVAILABLE | |
| B-RM-016 | RM-AL-WIRE (Aluminum Wire) | 500 | KG | AVAILABLE | |
| B-RM-017 | RM-SCRAP-C (Steel Scrap Grade C) | 250 | T | AVAILABLE | |
| B-RM-018 | RM-FEV (Ferroalloy FeV) | 100 | KG | AVAILABLE | |
| B-RM-019 | RM-SCRAP-A (Steel Scrap Grade A) | 100 | T | **BLOCKED** | High sulfur content |
| B-RM-020 | RM-COAL (Coal / Coke) | 25 | T | **SCRAPPED** | Contaminated |
| B-RM-021 | RM-SCRAP-A (Steel Scrap Grade A) | 280 | T | AVAILABLE | |
| B-RM-022 | RM-SCRAP-B (Steel Scrap Grade B) | 150 | T | AVAILABLE | |
| B-RM-023 | RM-SCRAP-A (Steel Scrap Grade A) | 400 | T | AVAILABLE | |
| B-RM-024 | RM-SCRAP-B (Steel Scrap Grade B) | 300 | T | AVAILABLE | |
| B-RM-025 | RM-IRON-ORE (Iron Ore Pellets) | 250 | T | AVAILABLE | |
| B-RM-026 | RM-LIMESTONE (Limestone) | 200 | T | AVAILABLE | |
| B-RM-027 | RM-FEMN (Ferroalloy FeMn) | 2,000 | KG | AVAILABLE | |
| B-RM-028 | RM-FESI (Ferroalloy FeSi) | 1,500 | KG | AVAILABLE | |

### 11.2 Intermediate Batches (28 batches)

| Batch # | Material | Quantity | Unit | Status | Notes |
|---------|----------|----------|------|--------|-------|
| B-IM-001 | IM-LIQUID (Liquid Steel) | 165 | T | CONSUMED | Used in slab casting |
| B-IM-002 | IM-SLAB (Steel Slab 200mm) | 155 | T | AVAILABLE | |
| B-IM-003 | IM-LIQUID (Liquid Steel) | 90 | T | CONSUMED | |
| B-IM-004 | IM-LIQUID (Liquid Steel) | 220 | T | CONSUMED | Used for rebar billet |
| B-IM-005 | IM-BILLET (Steel Billet 100mm) | 210 | T | AVAILABLE | |
| B-IM-006 | IM-LIQUID (Liquid Steel) | 85 | T | CONSUMED | |
| B-IM-007 | IM-SLAB (Steel Slab 200mm) | 82 | T | CONSUMED | |
| B-IM-008 | IM-HR-ROUGH (HR Coil Rough) | 78 | T | CONSUMED | |
| B-IM-009 | IM-SLAB (Steel Slab 200mm) | 30 | T | QUALITY_PENDING | Surface cracks detected |
| B-IM-010 | IM-BILLET (Steel Billet 100mm) | 195 | T | AVAILABLE | |
| B-IM-011 | IM-PICKLED (Pickled HR Strip) | 85 | T | AVAILABLE | |
| B-IM-012 | IM-CR-STRIP (Cold Rolled Strip) | 80 | T | PRODUCED | |
| B-IM-013 | IM-ANNEALED (Annealed CR Strip) | 75 | T | AVAILABLE | |
| B-IM-014 | IM-ROLLED-BAR (Rolled Bar) | 190 | T | AVAILABLE | |
| B-IM-015 | IM-LIQUID (Liquid Steel) | 130 | T | PRODUCED | |
| B-IM-016 | IM-SLAB (Steel Slab 200mm) | 125 | T | PRODUCED | |
| B-IM-017 | IM-SLAB (Steel Slab 200mm) | 45 | T | **BLOCKED** | Thickness out of spec |
| B-IM-018 | IM-BILLET (Steel Billet 100mm) | 60 | T | QUALITY_PENDING | |
| B-IM-019 | IM-HR-ROUGH (HR Coil Rough) | 95 | T | AVAILABLE | |
| B-IM-020 | IM-LIQUID (Liquid Steel) | 100 | T | AVAILABLE | |
| B-IM-021 | IM-BLOOM (Steel Bloom 200mm) | 160 | T | AVAILABLE | |
| B-IM-022 | IM-BLOOM (Steel Bloom 200mm) | 140 | T | AVAILABLE | |
| B-IM-023 | IM-WIRE-ROD (Wire Rod) | 120 | T | AVAILABLE | |
| B-IM-024 | IM-WIRE-ROD (Wire Rod) | 95 | T | AVAILABLE | |
| B-IM-025 | IM-LIQUID (Liquid Steel) | 200 | T | AVAILABLE | |
| B-IM-026 | IM-LIQUID (Liquid Steel) | 180 | T | AVAILABLE | |
| B-IM-027 | IM-SLAB (Steel Slab 200mm) | 200 | T | AVAILABLE | |
| B-IM-028 | IM-HR-ROUGH (HR Coil Rough) | 110 | T | AVAILABLE | |

### 11.3 Work In Progress Batches (6 batches)

These batches represent material actively being processed on equipment.

| Batch # | Material | Quantity | Unit | Status | Equipment Location |
|---------|----------|----------|------|--------|-------------------|
| B-WIP-001 | WIP-MELT (Molten Steel) | 85 | T | AVAILABLE | EAF #1 |
| B-WIP-002 | WIP-MELT (Molten Steel) | 92 | T | AVAILABLE | EAF #2 |
| B-WIP-003 | WIP-CAST (Steel Being Cast) | 78 | T | AVAILABLE | Caster #1 |
| B-WIP-004 | WIP-ROLL (Strip on Hot Mill) | 65 | T | AVAILABLE | Hot Mill #1 |
| B-WIP-005 | WIP-PICKLE (Strip in Pickle Line) | 45 | T | AVAILABLE | Pickle Line #1 |
| B-WIP-006 | WIP-ROLL (Strip on Cold Mill) | 55 | T | AVAILABLE | Cold Mill #1 |

### 11.4 Finished Goods Batches (8 batches)

| Batch # | Material | Quantity | Unit | Status | Notes |
|---------|----------|----------|------|--------|-------|
| B-FG-001 | FG-HR-2MM (HR Coil 2mm) | 75 | T | AVAILABLE | Order 5 completed |
| B-FG-002 | FG-CR-1MM (CR Sheet 1mm) | 70 | T | AVAILABLE | |
| B-FG-003 | FG-REBAR-10 (Rebar 10mm) | 180 | T | AVAILABLE | |
| B-FG-004 | FG-HR-2MM (HR Coil 2mm) | 120 | T | AVAILABLE | |
| B-FG-005 | FG-REBAR-10 (Rebar 10mm) | 175 | T | PRODUCED | |
| B-FG-006 | FG-CR-1MM (CR Sheet 1mm) | 55 | T | PRODUCED | |
| B-FG-007 | FG-HR-2MM (HR Coil 2mm) | 25 | T | QUALITY_PENDING | QC inspection pending |
| B-FG-008 | FG-REBAR-10 (Rebar 10mm) | 150 | T | AVAILABLE | |

### Batch Status Summary

| Status | Count | Description |
|--------|-------|-------------|
| AVAILABLE | 50 | Ready for use in production or shipment |
| CONSUMED | 5 | Used up in production (historical) |
| PRODUCED | 4 | Recently produced, awaiting quality release |
| QUALITY_PENDING | 3 | Awaiting quality inspection or approval |
| BLOCKED | 2 | Blocked due to quality issues |
| ON_HOLD | 1 | Temporarily held pending investigation |
| SCRAPPED | 1 | Disposed of due to contamination |

---

## 12. Inventory

There are 70 inventory records tracking material at specific locations. Each inventory record is linked to a batch.

### Inventory by Type and State

| Type | AVAILABLE | CONSUMED | PRODUCED | RESERVED | BLOCKED | ON_HOLD | SCRAPPED | **Total** |
|------|-----------|----------|----------|----------|---------|---------|----------|-----------|
| RM (Raw Material) | 22 | 0 | 0 | 2 | 1 | 1 | 1 | **27** |
| IM (Intermediate) | 11 | 5 | 3 | 0 | 1 | 2 | 0 | **22** |
| WIP (Work In Progress) | 6 | 0 | 0 | 0 | 0 | 0 | 0 | **6** |
| FG (Finished Goods) | 5 | 0 | 2 | 0 | 0 | 1 | 0 | **8** |
| **Total** | **44** | **5** | **5** | **2** | **2** | **4** | **1** | **63** |

*Note: Some inventory IDs have gaps due to the data structure. The actual record count is 70 (IDs 1-70 with gaps at 30-56 range).*

### Key Inventory Locations

| Location | Material Types | Count |
|----------|---------------|-------|
| Scrap Yard A/B/C/D | RM-SCRAP-A, RM-SCRAP-B, RM-SCRAP-C | 9 |
| Alloy Store / Alloy Store B | RM-FESI, RM-FEMN, RM-FEV | 5 |
| Ore Storage / Ore Storage B | RM-IRON-ORE | 2 |
| Flux Store / Flux Store B | RM-LIMESTONE | 2 |
| Coal Yard | RM-COAL | 1 |
| Chemical Store | RM-HCL | 1 |
| Oil Store | RM-COATING, RM-ROLL-LUB | 2 |
| Slab Yard / Slab Yard B | IM-SLAB | 3 |
| Billet Yard | IM-BILLET | 2 |
| Ladle / Ladle #2 / Ladle #3 | IM-LIQUID | 3 |
| Hot Mill | IM-HR-ROUGH | 2 |
| Bloom Yard | IM-BLOOM | 2 |
| Wire Rod Bay | IM-WIRE-ROD | 2 |
| FG Warehouse 1/2/3 | FG-HR-2MM, FG-CR-1MM, FG-REBAR-10 | 6 |
| Quarantine Area / QC Area | Blocked/On Hold items | 4 |
| Historical | Consumed records | 5 |
| Disposal | Scrapped items | 1 |

### Notable Inventory Items

| Description | Location | State | Reason |
|-------------|----------|-------|--------|
| 180T Steel Scrap Grade A | Scrap Yard C | ON_HOLD | Quality investigation pending |
| 100T Steel Scrap (Blocked) | Quarantine Area | BLOCKED | High sulfur content |
| 45T Steel Slab (Blocked) | QC Area | BLOCKED | Thickness out of spec |
| 30T Steel Slab (QC Pending) | QC Area | ON_HOLD | Surface defects |
| 60T Steel Billet (QC) | QC Area | ON_HOLD | Quality review |
| 25T HR Coil (QC Pending) | QC Area | ON_HOLD | Pending inspection |
| 200T Scrap A (Reserved) | Scrap Yard A | RESERVED | Reserved for Order ORD-2026-009 |
| 100T Scrap B (Reserved) | Scrap Yard B | RESERVED | Reserved for Order ORD-2026-009 |
| 25T Coal (Contaminated) | Disposal | SCRAPPED | Contaminated, disposed |

---

## 13. Hold Records

There are 12 hold records in the system: 8 currently active and 4 that have been released.

### 13.1 Active Holds (8)

| Hold ID | Entity Type | Entity | Reason | Comments | Applied By | Applied Date |
|---------|------------|--------|--------|----------|-----------|-------------|
| 1 | BATCH | B-RM-010 (Scrap A, 180T) | QUALITY_INVESTIGATION | Suspected contamination in scrap shipment - pending lab report | OP-006 (Robert Garcia) | 2026-01-25 |
| 2 | INVENTORY | Inv #39 (Scrap A, 100T) | QUALITY_INVESTIGATION | Chemical analysis failed - high sulfur content detected | OP-006 (Robert Garcia) | 2026-01-26 |
| 3 | INVENTORY | Inv #41 (Steel Slab, 30T) | QUALITY_INVESTIGATION | Surface defects found during slab inspection | OP-007 (Jennifer Martinez) | 2026-01-27 |
| 4 | OPERATION | Op #27 (Scrap Charging, Ord 8) | MATERIAL_SHORTAGE | Waiting for scrap availability | OP-004 (David Lee) | 2026-01-28 |
| 5 | BATCH | B-IM-009 (Steel Slab, 30T) | SAFETY_CONCERN | Slab surface cracks detected - requires ultrasonic testing | OP-006 (Robert Garcia) | 2026-01-29 |
| 6 | EQUIPMENT | PKL-001 (Pickling Line #1) | SAFETY_CONCERN | Acid leak detected in pickling line - safety inspection required | OP-008 (William Johnson) | 2026-01-28 |
| 7 | ORDER | ORD-2026-008 (60T HR Coil 2mm) | CUSTOMER_REQUEST | Customer requested hold pending design review | Admin | 2026-01-29 |
| 8 | BATCH | B-IM-017 (Steel Slab, 45T) | SPEC_DEVIATION | Slab thickness out of specification - requires disposition | OP-006 (Robert Garcia) | 2026-02-01 |

### 13.2 Released Holds (4)

| Hold ID | Entity Type | Entity | Reason | Released By | Release Date | Release Comment |
|---------|------------|--------|--------|------------|-------------|-----------------|
| 9 | BATCH | B-RM-003 (Scrap B, 200T) | QUALITY_INVESTIGATION | OP-007 (Jennifer Martinez) | 2026-01-21 | Lab results clear - release approved |
| 10 | INVENTORY | Inv #5 (Limestone, 150T) | CONTAMINATION | OP-006 (Robert Garcia) | 2026-01-23 | Moisture test passed - OK to use |
| 11 | OPERATION | Op #16 (Billet Reheating) | EQUIP_BREAKDOWN | OP-008 (William Johnson) | 2026-01-25 | Maintenance completed - equipment OK |
| 12 | EQUIPMENT | EAF-003 (Arc Furnace #3) | SAFETY_CONCERN | OP-008 (William Johnson) | 2026-01-26 | Inspection passed - cleared for use |

### Hold Distribution by Entity Type

| Entity Type | Active | Released | Total |
|-------------|--------|----------|-------|
| BATCH | 3 | 1 | 4 |
| INVENTORY | 2 | 1 | 3 |
| OPERATION | 1 | 1 | 2 |
| EQUIPMENT | 1 | 1 | 2 |
| ORDER | 1 | 0 | 1 |
| **Total** | **8** | **4** | **12** |

---

## 14. Batch Number Configuration

Eleven batch numbering rules control how batch numbers are automatically generated during production confirmation.

| Config Name | Operation Type | Product SKU | Prefix | Separator | Date Format | Seq Length | Seq Reset | Priority |
|-------------|---------------|-------------|--------|-----------|-------------|-----------|-----------|----------|
| Default | (any) | (any) | B | - | yyyyMMdd | 4 | DAILY | 100 |
| Melting | MELTING | (any) | MELT | - | yyyyMMdd | 3 | DAILY | 10 |
| Casting Slab | CASTING | (any) | SLB | - | yyyyMMdd | 3 | DAILY | 10 |
| Casting Billet | CASTING | STEEL-BILLET-100 | BLT | - | yyyyMMdd | 3 | DAILY | 5 |
| Hot Rolling | HOT_ROLLING | (any) | HR | - | yyyyMMdd | 3 | DAILY | 10 |
| Cold Rolling | COLD_ROLLING | (any) | CR | - | yyyyMMdd | 3 | DAILY | 10 |
| Bar Rolling | BAR_ROLLING | (any) | BAR | - | yyyyMMdd | 3 | DAILY | 10 |
| Rebar 10mm | (any) | REBAR-10MM | RB10 | - | yyyyMMdd | 4 | DAILY | 5 |
| Rebar 12mm | (any) | REBAR-12MM | RB12 | - | yyyyMMdd | 4 | DAILY | 5 |
| HR Coil 2mm | (any) | HR-COIL-2MM | HRC2 | - | yyyyMMdd | 4 | DAILY | 5 |
| CR Sheet 1mm | (any) | CR-SHEET-1MM | CRS1 | - | yyyyMMdd | 4 | DAILY | 5 |

### How Batch Numbers Are Generated

The system selects the highest-priority (lowest number) matching rule. Product-specific rules (priority 5) take precedence over operation-type rules (priority 10), which take precedence over the default rule (priority 100).

**Example batch numbers:**
- Melting operation: `MELT-20260215-001`
- HR Coil 2mm production: `HRC2-20260215-0001`
- Rebar 10mm production: `RB10-20260215-0001`
- Billet casting (for STEEL-BILLET-100): `BLT-20260215-001`
- Slab casting (general): `SLB-20260215-001`
- Default (no matching rule): `B-20260215-0001`

Sequences reset daily, so the first batch each day starts at 001 (or 0001).

---

## 15. Production Confirmations

There are 35 production confirmations recording completed production operations across multiple orders.

### Confirmations by Order

#### Order 1 (ORD-2026-001): HR Coil 2mm - IN_PROGRESS

| Conf ID | Operation | Produced | Scrap | Duration | Operator | Equipment | Notes |
|---------|-----------|----------|-------|----------|----------|-----------|-------|
| 1 | Scrap Charging | 160 T | 3 T | 4h | OP-001 (John Smith) | EAF-001 | Scrap charging complete, 160T loaded |
| 2 | EAF Melting | 155 T | 5 T | 5.5h | OP-001 | EAF-001 | Electrode change, 20min delay |
| 3 | Ladle Refining | 152 T | 3 T | 2.5h | OP-001 | LF-001 | Chemistry adjusted |
| 4 | Slab Casting | 148 T | 4 T | 6h | OP-003 (Sarah Brown) | CCM-001 | Minor mold issue, 15min delay |
| 5 | Slab Reheating | 148 T | 0 T | 3h | OP-004 (David Lee) | HSM-001 | Slabs reheated to 1250C |

*Operations 6-8 (Rough Roll, Finish Roll, Cool/Coil) are pending. Operation 6 is READY.*

#### Order 3 (ORD-2026-003): Rebar 10mm - IN_PROGRESS

| Conf ID | Operation | Produced | Scrap | Duration | Operator | Equipment | Notes |
|---------|-----------|----------|-------|----------|----------|-----------|-------|
| 6 | Scrap Charging | 210 T | 5 T | 4h | OP-001 | EAF-002 | Rebar order scrap charge |
| 7 | EAF Melting | 205 T | 5 T | 6.5h | OP-001 | EAF-002 | Temp correction, 30min quality delay |
| 8 | Ladle Refining | 200 T | 5 T | 3h | OP-001 | LF-001 | |
| 9 | Billet Casting | 195 T | 5 T | 8h | OP-003 | CCM-002 | Billet casting 100mm square |

*Operations 16-18 (Billet Reheat, Bar Roll, Quench/Temper) are pending. Operation 16 is READY.*

#### Order 5 (ORD-2026-005): HR Coil 2mm - COMPLETED (all 8 operations)

| Conf ID | Operation | Produced | Scrap | Operator | Equipment |
|---------|-----------|----------|-------|----------|-----------|
| 10 | Scrap Charging | 82 T | 1 T | OP-001 | EAF-001 |
| 11 | EAF Melting | 80 T | 2 T | OP-001 | EAF-001 |
| 12 | Ladle Refining | 79 T | 1 T | OP-001 | LF-001 |
| 13 | Slab Casting | 77 T | 2 T | OP-003 | CCM-001 |
| 14 | Slab Reheating | 77 T | 0 T | OP-004 | HSM-001 |
| 15 | Rough Rolling | 76 T | 1 T | OP-004 | HSM-001 |
| 16 | Finish Rolling | 75.5 T | 0.5 T | OP-004 | HSM-001 |
| 17 | Cooling & Coiling | 75 T | 0.5 T | OP-004 | HSM-001 |

*This is the only fully completed order in the original 15 that has all confirmations. Final output: 75T HR Coil 2mm (batch B-FG-001).*

#### Order 12 (ORD-2026-012): Rebar 12mm - COMPLETED (all 7 operations)

| Conf ID | Operation | Produced | Scrap | Operator | Equipment |
|---------|-----------|----------|-------|----------|-----------|
| 18 | Scrap Charging | 190 T | 5 T | OP-002 (Mike Wilson) | EAF-002 |
| 19 | EAF Melting | 185 T | 5 T | OP-002 | EAF-002 |
| 20 | Ladle Refining | 182 T | 3 T | OP-002 | LF-002 |
| 21 | Billet Casting | 178 T | 4 T | OP-003 | CCM-002 |
| 22 | Billet Reheating | 178 T | 0 T | OP-004 | HSM-001 |
| 23 | Bar Rolling | 175 T | 3 T | OP-004 | BRM-001 |
| 24 | Quenching & Tempering | 175 T | 0 T | OP-004 | BRM-001 |

*Final output: 175T Rebar 12mm (batch B-FG-005).*

#### Order 13 (ORD-2026-013): HR Coil 4mm - COMPLETED (all 8 operations)

| Conf ID | Operation | Produced | Scrap | Operator | Equipment |
|---------|-----------|----------|-------|----------|-----------|
| 25 | Scrap Charging | 130 T | 2 T | OP-001 | EAF-001 |
| 26 | EAF Melting | 127 T | 3 T | OP-001 | EAF-001 |
| 27 | Ladle Refining | 125 T | 2 T | OP-001 | LF-001 |
| 28 | Slab Casting | 122 T | 3 T | OP-003 | CCM-001 |
| 29 | Slab Reheating | 122 T | 0 T | OP-004 | HSM-001 |
| 30 | Rough Rolling | 120 T | 2 T | OP-004 | HSM-001 |
| 31 | Finish Rolling | 118 T | 2 T | OP-004 | HSM-001 |
| 32 | Cooling & Coiling | 118 T | 0 T | OP-004 | HSM-001 |

*Final output: 118T HR Coil 4mm (batch B-FG-004).*

#### Additional In-Progress Confirmations

| Conf ID | Order | Operation | Produced | Scrap | Operator | Notes |
|---------|-------|-----------|----------|-------|----------|-------|
| 33 | Ord 11 (Oceanic) | Scrap Charging | 85 T | 2 T | OP-011 (Ahmed Hassan) | HR Coil production |
| 34 | Ord 9 (S. American) | Scrap Charging | 125 T | 5 T | OP-001 | Partial: 125T of 250T target |
| 35 | Ord 11 (Oceanic) | Pickling | 90 T | 2 T | OP-005 (Emily Chen) | Most recent confirmation |

### Confirmation Summary Statistics

| Metric | Value |
|--------|-------|
| Total Confirmations | 35 |
| Total Produced (gross) | ~5,070 T |
| Total Scrap | ~88 T |
| Avg. Scrap Rate | ~1.7% |
| Confirmations with Delays | 2 (Conf #2: Maintenance, Conf #7: Quality Issue) |
| Operators Used | 7 (OP-001 through OP-005, OP-011) |
| Equipment Used | 7 (EAF-001/002, LF-001/002, CCM-001/002, HSM-001, BRM-001, PKL-001) |

---

## 16. Product-Process-BOM Cross Reference

This section ties together products, their production processes, routing steps, BOM hierarchy, and which orders reference each product.

### HR-COIL-2MM (Hot Rolled Coil 2mm)

| Aspect | Details |
|--------|---------|
| **Process** | Process 1: Hot Rolled Coil Production (8 steps) |
| **Routing** | Charge -> Melt -> Refine -> Slab Cast -> Reheat -> Rough Roll -> Finish Roll -> Cool/Coil |
| **BOM Depth** | 5 levels, 14 nodes |
| **Key Materials** | RM-SCRAP-A (0.70T), RM-SCRAP-B (0.20T), RM-IRON-ORE (0.15T), RM-COAL (0.10T) per ton |
| **Orders** | ORD-001 (150T), ORD-004 (100T), ORD-005 (75T, completed), ORD-008 (60T, on hold), ORD-011 (80T), ORD-016 (110T), ORD-025 (240T, cancelled), ORD-026 (140T), ORD-029 (120T, completed), ORD-033 (160T), ORD-036 (70T), ORD-039 (220T, completed), ORD-042 (110T), ORD-043 (100T, completed) |

### HR-COIL-3MM (Hot Rolled Coil 3mm)

| Aspect | Details |
|--------|---------|
| **Process** | Process 1: Hot Rolled Coil Production (8 steps) |
| **Routing** | Same as HR-COIL-2MM |
| **BOM Depth** | 5 levels, 11 nodes |
| **Key Materials** | RM-SCRAP-A (0.72T), RM-SCRAP-B (0.18T), RM-IRON-ORE (0.16T), RM-COAL (0.11T) per ton |
| **Orders** | ORD-001 (50T), ORD-009 (250T), ORD-017 (170T), ORD-027 (100T), ORD-034 (90T, cancelled), ORD-036 (110T), ORD-040 (120T), ORD-043 (70T, completed) |

### HR-COIL-4MM (Hot Rolled Coil 4mm)

| Aspect | Details |
|--------|---------|
| **Process** | Process 1: Hot Rolled Coil Production (8 steps) |
| **Routing** | Same as HR-COIL-2MM |
| **BOM Depth** | 5 levels, 10 nodes |
| **Key Materials** | RM-SCRAP-A (0.75T), RM-SCRAP-B (0.15T), RM-IRON-ORE (0.17T), RM-COAL (0.12T) per ton |
| **Orders** | ORD-009 (100T), ORD-013 (120T, completed), ORD-018 (190T, completed), ORD-028 (170T, on hold), ORD-035 (150T), ORD-039 (180T, completed), ORD-043 (80T, completed) |

### CR-SHEET-1MM (Cold Rolled Sheet 1mm)

| Aspect | Details |
|--------|---------|
| **Process** | Process 2: Cold Rolled Sheet Production (3 steps) |
| **Routing** | Pickling -> Cold Rolling -> Batch Annealing |
| **BOM Depth** | 6 levels, 14 nodes (deepest BOM - requires HR coil as input) |
| **Key Materials** | RM-SCRAP-A (0.75T), RM-IRON-ORE (0.20T), RM-HCL (0.05L), RM-COATING (0.015L) per ton |
| **Orders** | ORD-002 (80T), ORD-004 (50T), ORD-007 (120T), ORD-014 (90T, cancelled), ORD-019 (60T), ORD-026 (110T), ORD-028 (110T, on hold), ORD-033 (110T), ORD-039 (170T, completed), ORD-040 (90T), ORD-044 (80T) |

### CR-SHEET-2MM (Cold Rolled Sheet 2mm)

| Aspect | Details |
|--------|---------|
| **Process** | Process 2: Cold Rolled Sheet Production (3 steps) |
| **Routing** | Same as CR-SHEET-1MM |
| **BOM Depth** | 6 levels, 11 nodes |
| **Key Materials** | RM-SCRAP-A (0.78T), RM-IRON-ORE (0.18T), RM-HCL (0.045L) per ton |
| **Orders** | ORD-002 (40T), ORD-011 (180T), ORD-013 (60T, completed), ORD-020 (60T), ORD-027 (120T), ORD-029 (80T, completed), ORD-034 (80T, cancelled), ORD-035 (120T), ORD-038 (70T), ORD-042 (80T) |

### REBAR-10MM (Reinforcement Bar 10mm)

| Aspect | Details |
|--------|---------|
| **Process** | Process 3: Rebar Production (7 steps) |
| **Routing** | Charge -> Melt -> Refine -> Billet Cast -> Reheat -> Bar Roll -> Quench/Temper |
| **BOM Depth** | 5 levels, 10 nodes |
| **Key Materials** | RM-SCRAP-A (0.80T), RM-SCRAP-B (0.18T), RM-FEMN (0.008 KG), RM-COAL (0.09T) per ton |
| **Orders** | ORD-003 (200T), ORD-004 (80T), ORD-006 (300T), ORD-010 (200T), ORD-021 (190T), ORD-024 (190T), ORD-030 (180T, completed), ORD-032 (120T, on hold), ORD-033 (260T), ORD-037 (130T, completed), ORD-042 (120T) |

### REBAR-12MM (Reinforcement Bar 12mm)

| Aspect | Details |
|--------|---------|
| **Process** | Process 3: Rebar Production (7 steps) |
| **Routing** | Same as REBAR-10MM |
| **BOM Depth** | 5 levels, 10 nodes |
| **Key Materials** | RM-SCRAP-A (0.82T), RM-SCRAP-B (0.16T), RM-FEMN (0.009 KG), RM-COAL (0.095T) per ton |
| **Orders** | ORD-003 (100T), ORD-006 (150T), ORD-012 (180T, completed), ORD-022 (250T, blocked), ORD-031 (310T), ORD-034 (140T, cancelled), ORD-037 (170T, completed), ORD-041 (340T), ORD-044 (170T) |

### STEEL-BILLET-100 (Steel Billet 100mm)

| Aspect | Details |
|--------|---------|
| **Process** | Process 4: Billet Production (4 steps) |
| **Routing** | Charge -> Melt -> Refine -> Billet Cast |
| **BOM Depth** | 3 levels, 8 nodes (simplest BOM) |
| **Key Materials** | RM-SCRAP-A (0.70T), RM-SCRAP-B (0.25T), RM-IRON-ORE (0.12T), RM-COAL (0.08T) per ton |
| **Orders** | ORD-010 (400T), ORD-015 (250T, blocked), ORD-023 (500T, on hold), ORD-030 (220T, completed), ORD-031 (360T), ORD-032 (180T, on hold), ORD-035 (340T), ORD-041 (380T), ORD-042 (110T), ORD-044 (250T), ORD-045 (470T) |

---

## 17. Lookup and Configuration Data

### 17.1 Hold Reasons (10)

| Reason Code | Description | Applicable To |
|-------------|-------------|---------------|
| EQUIP_BREAKDOWN | Equipment Breakdown | OPERATION, EQUIPMENT |
| QUALITY_INVESTIGATION | Quality Investigation | OPERATION, BATCH, INVENTORY |
| MATERIAL_SHORTAGE | Material Shortage | OPERATION, ORDER_LINE |
| OPERATOR_UNAVAIL | Operator Unavailability | OPERATION |
| SAFETY_CONCERN | Safety Concern | OPERATION, BATCH, EQUIPMENT |
| REGULATORY_HOLD | Regulatory Hold | BATCH, INVENTORY |
| CUSTOMER_REQUEST | Customer Request | ORDER, ORDER_LINE |
| CONTAMINATION | Contamination Suspected | BATCH, INVENTORY |
| SPEC_DEVIATION | Specification Deviation | BATCH, INVENTORY |
| OTHER | Other | OPERATION, ORDER_LINE, BATCH, INVENTORY, EQUIPMENT |

### 17.2 Delay Reasons (10)

| Reason Code | Description |
|-------------|-------------|
| EQUIP_BREAKDOWN | Equipment Breakdown |
| MATERIAL_SHORTAGE | Material Shortage |
| OPERATOR_UNAVAIL | Operator Unavailable |
| QUALITY_ISSUE | Quality Issue |
| SCHEDULING | Scheduling Conflict |
| MAINTENANCE | Scheduled Maintenance |
| POWER_OUTAGE | Power Outage |
| TOOL_CHANGE | Tool/Die Change |
| CALIBRATION | Equipment Calibration |
| OTHER | Other |

### 17.3 Process Parameters Configuration

Process parameters define the acceptable ranges for each operation type and product combination.

| Operation Type | Product | Parameter | Unit | Min | Max | Default | Required |
|---------------|---------|-----------|------|-----|-----|---------|----------|
| FURNACE | HR-COIL-2MM | Temperature | C | 1500 | 1800 | 1650 | Yes |
| FURNACE | HR-COIL-2MM | Holding Time | min | 30 | 180 | 90 | Yes |
| FURNACE | HR-COIL-2MM | Power Input | MW | 20 | 80 | 50 | No |
| CASTER | HR-COIL-2MM | Casting Speed | m/min | 0.8 | 2.5 | 1.5 | Yes |
| CASTER | HR-COIL-2MM | Mold Temperature | C | 200 | 400 | 300 | Yes |
| CASTER | HR-COIL-2MM | Slab Width | mm | 1000 | 1600 | 1250 | Yes |
| ROLLING | HR-COIL-2MM | Entry Temperature | C | 1100 | 1280 | 1200 | Yes |
| ROLLING | HR-COIL-2MM | Finish Temperature | C | 850 | 950 | 900 | Yes |
| ROLLING | HR-COIL-2MM | Coiling Temperature | C | 550 | 700 | 620 | Yes |
| ROLLING | HR-COIL-2MM | Thickness | mm | 1.5 | 3.0 | 2.0 | Yes |
| ROLLING | HR-COIL-2MM | Speed | m/s | 5 | 15 | 10 | Yes |
| FURNACE | CR-SHEET-1MM | Temperature | C | 1500 | 1750 | 1620 | Yes |
| FURNACE | CR-SHEET-1MM | Holding Time | min | 30 | 150 | 80 | Yes |
| CASTER | CR-SHEET-1MM | Casting Speed | m/min | 0.8 | 2.0 | 1.4 | Yes |
| CASTER | CR-SHEET-1MM | Mold Temperature | C | 200 | 380 | 280 | Yes |
| ROLLING | CR-SHEET-1MM | Entry Temperature | C | 1100 | 1250 | 1180 | Yes |
| ROLLING | CR-SHEET-1MM | Thickness | mm | 0.5 | 2.0 | 1.0 | Yes |
| ROLLING | CR-SHEET-1MM | Reduction Ratio | % | 40 | 80 | 60 | Yes |
| PICKLING | CR-SHEET-1MM | Acid Concentration | % | 12 | 22 | 18 | Yes |
| PICKLING | CR-SHEET-1MM | Line Speed | m/min | 5 | 30 | 15 | Yes |
| FURNACE | REBAR-10MM | Temperature | C | 1550 | 1800 | 1680 | Yes |
| FURNACE | REBAR-10MM | Holding Time | min | 30 | 120 | 75 | Yes |
| CASTER | REBAR-10MM | Casting Speed | m/min | 2.0 | 5.0 | 3.5 | Yes |
| CASTER | REBAR-10MM | Billet Size | mm | 100 | 150 | 130 | Yes |
| ROLLING | REBAR-10MM | Entry Temperature | C | 1050 | 1200 | 1100 | Yes |
| ROLLING | REBAR-10MM | Finish Temperature | C | 900 | 1050 | 980 | Yes |
| ROLLING | REBAR-10MM | Bar Diameter | mm | 8 | 32 | 10 | Yes |
| COOLING | REBAR-10MM | Quench Temperature | C | 200 | 500 | 350 | Yes |
| COOLING | REBAR-10MM | Tempering Temperature | C | 400 | 650 | 550 | Yes |

### 17.4 Units of Measure (14)

| Code | Name | Type | Precision | Base Unit |
|------|------|------|-----------|-----------|
| T | Metric Ton | WEIGHT | 2 | Yes |
| KG | Kilogram | WEIGHT | 2 | No |
| LB | Pound | WEIGHT | 2 | No |
| G | Gram | WEIGHT | 3 | No |
| L | Liter | VOLUME | 2 | Yes |
| ML | Milliliter | VOLUME | 0 | No |
| GAL | Gallon | VOLUME | 2 | No |
| M | Meter | LENGTH | 2 | Yes |
| MM | Millimeter | LENGTH | 0 | No |
| CM | Centimeter | LENGTH | 1 | No |
| EA | Each | COUNT | 0 | Yes |
| PC | Piece | COUNT | 0 | No |
| HR | Hour | TIME | 2 | Yes |
| MIN | Minute | TIME | 0 | No |

---

## 18. Summary Counts

| Entity | Count | Details |
|--------|-------|---------|
| Users | 1 | Admin only |
| Customers | 12 | 11 active, 1 inactive |
| Products | 8 | 3 HR Coils, 2 CR Sheets, 2 Rebars, 1 Billet |
| Materials | 32 | 15 RM, 10 IM, 4 WIP, 3 FG |
| Processes | 6 | 4 active, 1 draft, 1 inactive |
| Routings | 4 | One per active process |
| Routing Steps | 22 | 8 + 3 + 7 + 4 steps |
| Operation Templates | 18 | 17 active, 1 inactive |
| BOM Trees | 8 | One per product, 88 total nodes |
| Equipment | 16 | 11 available, 2 in use, 1 maintenance, 1 on hold, 1 packaging |
| Operators | 12 | 11 active, 1 inactive |
| Orders | 45 | 12 created, 12 in-progress, 10 completed, 4 on-hold, 2 blocked, 3 cancelled |
| Order Line Items | 82 | 25 original + 57 additional |
| Operations (Runtime) | 425 | Across all orders and line items |
| Batches | 70 | 28 RM, 28 IM, 6 WIP, 8 FG |
| Inventory Records | 70 | 44 available, 5 consumed, 5 produced, 2 reserved, 2 blocked, 4 on-hold, 1 scrapped |
| Hold Records | 12 | 8 active, 4 released |
| Production Confirmations | 35 | Across 5 completed + 3 in-progress orders |
| Batch Relations | 40 | Genealogy chains for traceability |
| Batch Number Configs | 11 | Operation-type and product-specific rules |
| Process Parameters | 29 | For HR Coil, CR Sheet, and Rebar products |
| Hold Reasons | 10 | Quality, Safety, Equipment, Customer, etc. |
| Delay Reasons | 10 | Equipment, Material, Operator, Quality, etc. |
| Units of Measure | 14 | Weight, Volume, Length, Count, Time |
| Unit Conversions | 16 | Between related units |
| Equipment Type Configs | 13 | Capacity, temperature, maintenance intervals |
| Inventory Form Configs | 9 | Storage requirements by material form |
| Audit Trail Entries | ~250 | Full history of all entity changes |

---

## 19. Batch Genealogy (Traceability)

The system maintains parent-child relationships between batches through batch relations. This enables both forward traceability (what was this material used for?) and backward traceability (what materials went into this product?).

### 19.1 Genealogy: Order 5 (HR Coil 2mm - COMPLETED)

This order demonstrates a complete traceability chain from raw materials to finished goods.

```
BACKWARD TRACE (from finished product to raw materials):

B-FG-001 (HR Coil 2mm, 75T, AVAILABLE)
  |-- consumed from B-IM-008 (HR Coil Rough, 78T)
       |-- consumed from B-IM-007 (Steel Slab, 82T)
            |-- consumed from B-IM-006 (Liquid Steel, 85T)
                 |-- consumed from B-RM-001 (Scrap A, 56T)
                 |-- consumed from B-RM-003 (Scrap B, 16T)
                 |-- consumed from B-RM-004 (Iron Ore, 12T)
                 +-- consumed from B-RM-008 (Coal, 8T)
```

### 19.2 Genealogy: Order 1 (HR Coil 2mm - IN_PROGRESS)

The in-progress chain shows partial traceability up to the current production stage.

```
Raw Materials --> Liquid Steel --> Steel Slab --> (pending rolling)

B-RM-001 (Scrap A, 105T) ----+
B-RM-003 (Scrap B, 30T)  ----+---> B-IM-001 (Liquid Steel, 165T, CONSUMED)
B-RM-004 (Iron Ore, 22T) ----+         |
B-RM-008 (Coal, 15T)     ----+         +--> B-IM-002 (Steel Slab, 155T, AVAILABLE)
B-RM-002 (Scrap A, 40T)  ----+              (awaiting rolling operations)
B-RM-006 (FeSi, 3 KG)    ----+
```

### 19.3 Genealogy: Order 3 (Rebar 10mm - IN_PROGRESS)

```
Raw Materials --> Liquid Steel --> Steel Billet --> (pending reheat/roll/quench)

B-RM-002 (Scrap A, 160T) ----+
B-RM-011 (Scrap B, 36T)  ----+---> B-IM-004 (Liquid Steel, 220T, CONSUMED)
B-RM-004 (Iron Ore, 30T) ----+         |
B-RM-008 (Coal, 18T)     ----+         +--> B-IM-005 (Steel Billet, 210T, AVAILABLE)
B-RM-006 (FeSi, 2 KG)    ----+              (awaiting billet reheating)
```

### 19.4 Genealogy: Order 12 (Rebar 12mm - COMPLETED)

```
Full chain: Raw Materials --> Liquid Steel --> Billet --> Rolled Bar --> Rebar

B-RM-002 (Scrap A, 140T) ----+
B-RM-017 (Scrap C, 45T)  ----+---> B-IM-015 (Liquid Steel, 130T, PRODUCED)
B-RM-007 (FeMn, 8 KG)    ----+         |
                                        +--> B-IM-010 (Billet, 180T)
                                                 |
                                                 +--> B-IM-014 (Rolled Bar, 178T)
                                                          |
                                                          +--> B-FG-005 (Rebar 10mm, 175T, PRODUCED)
```

### 19.5 Genealogy: Order 13 (HR Coil 4mm - COMPLETED)

```
Full chain: Raw Materials --> Liquid Steel --> Slab --> HR Rough --> HR Coil 4mm

B-RM-021 (Scrap A, 100T) ----+
B-RM-022 (Scrap B, 30T)  ----+---> B-IM-020 (Liquid Steel, 100T, AVAILABLE)
B-RM-004 (Iron Ore, 10T) ----+         |
                                        +--> B-IM-016 (Steel Slab, 125T, PRODUCED)
                                                 |
                                                 +--> B-IM-019 (HR Rough, 120T)
                                                          |
                                                          +--> B-FG-004 (HR Coil 2mm, 118T, AVAILABLE)
```

### 19.6 CR Sheet Production Chain (Cross-Order)

The CR Sheet traceability shows material flowing through pickling, cold rolling, and annealing.

```
B-IM-019 (HR Rough, 90T) --> B-IM-011 (Pickled Strip, 85T)
                                  |
                                  +--> B-IM-012 (CR Strip, 80T, PRODUCED)
                                           |
                                           +--> B-IM-013 (Annealed Strip, 75T)
                                                    |
                                                    +--> B-FG-002 (CR Sheet 1mm, 70T, AVAILABLE)
```

### 19.7 Batch Split Example

One batch split is recorded in the demo data:

```
B-IM-002 (Steel Slab 200mm, 155T, AVAILABLE)
  |
  +-- SPLIT --> B-IM-009 (Steel Slab 200mm, 30T, QUALITY_PENDING)
                 [Split off 30T for quality investigation - surface cracks detected]
```

### Batch Relation Types

| Relation Type | Meaning | Count in Demo |
|---------------|---------|---------------|
| MERGE | Multiple parent batches combined into one child | 35 |
| SPLIT | One parent batch divided into multiple children | 1 |
| CONSUME | Parent batch consumed during production | 4 |

---

## 20. Demo Scenarios for Testing

The demo data has been designed to support several key testing and demonstration scenarios. Here is a guide to what you can demonstrate with the pre-configured data.

### 20.1 Production Confirmation Demo

**Scenario:** Confirm production for an in-progress order

Available READY operations for immediate confirmation:
- **Operation 6** (Order 1): Rough Rolling for HR-COIL-2MM, 150T
- **Operation 9** (Order 2): Pickling for CR-SHEET-1MM, 80T
- **Operation 16** (Order 3): Billet Reheating for REBAR-10MM, 200T
- **Operation 50** (Order 11): EAF Melting for HR-COIL-2MM, 80T
- **Operation 52** (Order 4): Scrap Charging for HR-COIL-2MM, 100T
- **Operation 53** (Order 6): Scrap Charging for REBAR-10MM, 300T
- **Operations 61, 69, 72, 79, 86** and many more from additional orders

### 20.2 Hold Management Demo

**Scenario:** Apply and release holds on various entity types

- **Apply hold:** Select any available batch, inventory item, or operation
- **View active holds:** 8 active holds across BATCH, INVENTORY, OPERATION, EQUIPMENT, and ORDER types
- **Release hold:** The 4 released holds demonstrate the release workflow with comments

### 20.3 Inventory Management Demo

**Scenario:** View and manage inventory across all states

- **Available inventory:** 44 records ready for production or shipment
- **Blocked inventory:** 2 records requiring disposition
- **On-hold inventory:** 4 records under investigation
- **Reserved inventory:** 2 records allocated to Order ORD-2026-009
- **Historical consumed:** 5 records showing past consumption

### 20.4 Batch Traceability Demo

**Scenario:** Trace a finished product back to its raw material sources

- **Best demo path:** Start with B-FG-001 (HR Coil 2mm, 75T from Order 5) and trace backward through 4 levels to raw materials
- **Forward trace:** Start with B-RM-001 (Scrap A) and see how it was used in multiple production runs

### 20.5 Multi-Stage Order Demo

**Scenario:** View orders that span multiple production processes

- **Order 33 (Full Pipeline):** HR-COIL-2MM + CR-SHEET-1MM + REBAR-10MM across 3 processes (18 total operations)
- **Order 42 (4-Stage):** STEEL-BILLET-100 + HR-COIL-2MM + CR-SHEET-2MM + REBAR-10MM across all 4 processes (22 total operations)
- **Order 29 (HR->CR, Completed):** Shows complete multi-stage production flow

### 20.6 Equipment Status Demo

**Scenario:** View equipment across different operational states

- **Available (11):** Ready for assignment to production operations
- **In Use (2):** EAF-002 and CCM-002 actively assigned
- **Maintenance (1):** EAF-003 undergoing maintenance
- **On Hold (1):** PKL-001 with active safety hold (Hold #6)

### 20.7 Order Lifecycle Demo

**Scenario:** View orders at every stage of their lifecycle

- **Created:** 12 orders awaiting scheduling
- **In Progress:** 12 orders with active production
- **Completed:** 10 orders fully produced and shipped
- **On Hold:** 4 orders temporarily paused
- **Blocked:** 2 orders with blocking issues
- **Cancelled:** 3 orders that were cancelled

### 20.8 Quality Management Demo

**Scenario:** Review quality-related holds and pending inspections

- **Quality holds:** Holds #1, #2, #3, #5, #8 are all quality-related
- **Quality pending batches:** B-IM-009 (slab), B-IM-018 (billet), B-FG-007 (HR coil)
- **Blocked batches:** B-RM-019 (high sulfur), B-IM-017 (thickness deviation)
- **Released quality holds:** Hold #9 (lab results clear), Hold #10 (moisture test passed)

---

## 21. Customer Order History

This section provides a view of orders grouped by customer for relationship management.

| Customer | Orders | Total Qty (T) | Statuses |
|----------|--------|---------------|----------|
| ABC Steel Corporation (CUST-001) | ORD-001, ORD-012, ORD-022, ORD-023 | ~1,040 | 1 in-progress, 1 completed, 1 blocked, 1 on-hold |
| Global Manufacturing Ltd (CUST-002) | ORD-002, ORD-013, ORD-021, ORD-027, ORD-045 | ~1,000 | 1 in-progress, 1 completed, 1 in-progress, 2 created |
| Pacific Metal Works (CUST-003) | ORD-004, ORD-014, ORD-025, ORD-028 | ~820 | 1 created, 1 cancelled, 1 cancelled, 1 on-hold |
| European Auto Parts GmbH (CUST-004) | ORD-005, ORD-029, ORD-031, ORD-041, ORD-042 | ~1,945 | 2 completed, 3 created |
| Asian Electronics Inc (CUST-005) | ORD-008, ORD-016, ORD-019, ORD-020, ORD-026, ORD-033, ORD-036 | ~1,130 | 1 on-hold, 3 in-progress, 3 created |
| BuildRight Construction (CUST-006) | ORD-003, ORD-030 | ~700 | 1 in-progress, 1 completed |
| Nordic Steel Trading AB (CUST-007) | ORD-006, ORD-015, ORD-037, ORD-038 | ~870 | 1 created, 1 blocked, 1 completed, 1 in-progress |
| Middle East Metals FZE (CUST-008) | ORD-007, ORD-024, ORD-035, ORD-040 | ~950 | 2 created, 1 in-progress, 1 created |
| South American Steel SA (CUST-009) | ORD-009, ORD-018, ORD-039, ORD-044 | ~1,540 | 1 created, 2 completed, 1 in-progress |
| African Mining Corp (CUST-010) | ORD-010, ORD-032 | ~900 | 1 created, 1 on-hold |
| Oceanic Metals Ltd (CUST-011) | ORD-011, ORD-017, ORD-034, ORD-043 | ~820 | 1 in-progress, 1 in-progress, 1 cancelled, 1 completed |
| Canadian Steel Works (CUST-012) | (none) | 0 | Inactive customer, no orders |

---

*This document was generated from the demo data SQL files located at:*
- *`backend/src/main/resources/demo/data.sql` (H2 demo mode)*
- *`backend/src/main/resources/patches/002_seed_data.sql` (PostgreSQL production/test mode)*

*Last updated: February 2026*
