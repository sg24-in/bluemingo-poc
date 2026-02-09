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
- **7 products** spanning hot rolled coils, cold rolled sheets, rebar, and billets
- **31 materials** organized by type: raw materials (15), intermediates (9), and finished goods (7)
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
- **4 batch number configuration rules**

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
| 2 | CUST-002 | Global Manufacturing Inc | Sarah Johnson | sarah@globalmfg.com | +1-555-0102 | Detroit | USA | ACTIVE |
| 3 | CUST-003 | Pacific Metal Works | Michael Chen | m.chen@pacificmetal.com | +1-555-0103 | Seattle | USA | ACTIVE |
| 4 | CUST-004 | European Auto Parts GmbH | Hans Mueller | h.mueller@euroauto.de | +49-555-0104 | Munich | Germany | ACTIVE |
| 5 | CUST-005 | Asian Electronics Ltd | Yuki Tanaka | y.tanaka@asianelec.jp | +81-555-0105 | Tokyo | Japan | ACTIVE |
| 6 | CUST-006 | BuildRight Construction | Robert Brown | r.brown@buildright.com | +1-555-0106 | Chicago | USA | ACTIVE |
| 7 | CUST-007 | Nordic Steel AS | Erik Larsson | e.larsson@nordicsteel.no | +47-555-0107 | Oslo | Norway | ACTIVE |
| 8 | CUST-008 | Middle East Metals LLC | Ahmed Hassan | a.hassan@memetals.ae | +971-555-0108 | Dubai | UAE | ACTIVE |
| 9 | CUST-009 | South American Mining Co | Carlos Rodriguez | c.rodriguez@samining.br | +55-555-0109 | São Paulo | Brazil | ACTIVE |
| 10 | CUST-010 | Indian Steel Works Pvt | Rajesh Sharma | r.sharma@indiansteel.in | +91-555-0110 | Mumbai | India | ACTIVE |
| 11 | CUST-011 | Oceanic Metals Ltd | Bruce Wilson | bruce@oceanicmetals.au | +61-2-55520 | Sydney | Australia | ACTIVE |
| 12 | CUST-012 | Canadian Steel Works | Pierre Dubois | pierre@cansteelworks.ca | +1-514-5553 | Montreal | Canada | **INACTIVE** |

### Customer Distribution by Country

| Country | Count | Customer Codes |
|---------|-------|----------------|
| USA | 4 | CUST-001, CUST-002, CUST-003, CUST-006 |
| Germany | 1 | CUST-004 |
| Japan | 1 | CUST-005 |
| Norway | 1 | CUST-007 |
| UAE | 1 | CUST-008 |
| Brazil | 1 | CUST-009 |
| India | 1 | CUST-010 |
| Australia | 1 | CUST-011 |
| Canada | 1 | CUST-012 (inactive) |

---

## 4. Products

Seven products are configured in the system, spanning three product categories. All products are ACTIVE.

| SKU | Product Name | Category | Unit | Price (USD) | Status |
|-----|-------------|----------|------|-------------|--------|
| PROD-HR-COIL-2MM | Hot Rolled Coil 2.0mm | Flat Products | T | 750.00 | ACTIVE |
| PROD-HR-COIL-3MM | Hot Rolled Coil 3.0mm | Flat Products | T | 740.00 | ACTIVE |
| PROD-CR-SHEET-1MM | Cold Rolled Sheet 1.0mm | Flat Products | T | 850.00 | ACTIVE |
| PROD-CR-SHEET-2MM | Cold Rolled Sheet 2.0mm | Flat Products | T | 830.00 | ACTIVE |
| PROD-REBAR-10 | Rebar 10mm Grade 60 | Long Products | T | 650.00 | ACTIVE |
| PROD-REBAR-16 | Rebar 16mm Grade 60 | Long Products | T | 640.00 | ACTIVE |
| PROD-BILLET-100 | Steel Billet 100mm | Semi-Finished | T | 600.00 | ACTIVE |

*Note: Order line items reference products using simplified SKU codes (e.g., HR-COIL-2MM, CR-SHEET-1MM, REBAR-10MM, REBAR-12MM, HR-COIL-4MM, STEEL-BILLET-100) which may differ from the products table SKUs.*

### Product-to-Process Mapping

Each product is manufactured through a specific production process. The SKUs below are the simplified codes used in order line items:

| Product SKU (Order Ref) | Process | Operations Count | Description |
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

There are 31 materials organized into three types reflecting the steel production value chain.

### 5.1 Raw Materials (RM) - 15 materials

These are purchased inputs consumed during production.

| Code | Name | Description | Unit | Std. Cost (USD) | Min Stock | Reorder Point |
|------|------|-------------|------|-----------------|-----------|---------------|
| RM-SCRAP-A | Steel Scrap Grade A | High quality steel scrap for EAF | T | 350.00 | 100 | 200 |
| RM-SCRAP-B | Steel Scrap Grade B | Standard steel scrap for EAF | T | 280.00 | 150 | 300 |
| RM-SCRAP-C | Steel Scrap Grade C | Shredded steel scrap | T | 150.00 | 30 | 60 |
| RM-IRON-ORE | Iron Ore Pellets | Iron ore pellets 65% Fe | T | 150.00 | 500 | 1,000 |
| RM-LIMESTONE | Limestone | Limestone for flux | T | 45.00 | 200 | 400 |
| RM-FESI | Ferrosilicon 75% | Ferrosilicon alloy 75% | KG | 1.80 | 5,000 | 10,000 |
| RM-FEMN | Ferromanganese HC | High carbon ferromanganese | KG | 1.50 | 5,000 | 10,000 |
| RM-FEV | Ferrovanadium 80% | Ferrovanadium for high-strength steel | KG | 25.00 | 100 | 200 |
| RM-COAL | Anthracite Coal | Anthracite coal for carburizing | T | 200.00 | 100 | 200 |
| RM-GRAPHITE | Graphite Electrodes | Graphite electrodes for EAF | PC | 2,500.00 | 10 | 20 |
| RM-ALWIRE | Aluminum Wire | Aluminum wire for deoxidation | KG | 2.50 | 2,000 | 4,000 |
| RM-MOLD-POWDER | Mold Powder | Casting mold powder | KG | 1.20 | 3,000 | 6,000 |
| RM-LUBRICANT | Rolling Lubricant | Rolling mill lubricant | L | 3.50 | 2,000 | 4,000 |
| RM-HCL | Hydrochloric Acid | HCl for pickling | L | 0.50 | 5,000 | 10,000 |
| RM-COATING | Coating Oil | Anti-rust coating oil | L | 4.00 | 1,000 | 2,000 |

### 5.2 Intermediate Materials (IM) - 9 materials

These are produced and consumed within the production chain, not sold to customers.

| Code | Name | Description | Unit | Std. Cost (USD) |
|------|------|-------------|------|-----------------|
| IM-LIQUID-STEEL | Liquid Steel | Molten steel from EAF | T | 500.00 |
| IM-SLAB-CS | Carbon Steel Slab | Carbon steel slab 200mm | T | 550.00 |
| IM-BILLET | Steel Billet 100mm | Steel billet 100x100mm | T | 520.00 |
| IM-HR-COIL | Hot Rolled Coil | Hot rolled coil 3-6mm | T | 620.00 |
| IM-PICKLED | Pickled Strip | Pickled and oiled strip | T | 650.00 |
| IM-CR-STRIP | Cold Rolled Strip | Cold rolled strip 0.5-2mm | T | 700.00 |
| IM-ANNEALED | Annealed Strip | Batch annealed strip | T | 720.00 |
| IM-WIRE-ROD | Wire Rod | Wire rod 5.5-12mm | T | 580.00 |
| IM-BAR | Rolled Bar | Rolled bar 10-40mm | T | 560.00 |

### 5.3 Work In Progress (WIP) - Not in Materials Master

There are no WIP materials defined in the materials master data table. However, WIP material codes (WIP-MELT, WIP-CAST, WIP-ROLL, WIP-PICKLE) are used in batch and inventory records to represent material actively being processed on equipment. These codes exist only as references in operational data, not as entries in the materials table.

### 5.4 Finished Goods (FG) - 7 materials

These correspond to the final products shipped to customers.

| Code | Name | Description | Unit | Std. Cost (USD) |
|------|------|-------------|------|-----------------|
| FG-HR-COIL-2MM | HR Coil 2.0mm | Hot rolled coil 2.0mm finished | T | 680.00 |
| FG-HR-COIL-3MM | HR Coil 3.0mm | Hot rolled coil 3.0mm finished | T | 670.00 |
| FG-CR-SHEET-1MM | CR Sheet 1.0mm | Cold rolled sheet 1.0mm | T | 780.00 |
| FG-CR-SHEET-2MM | CR Sheet 2.0mm | Cold rolled sheet 2.0mm | T | 760.00 |
| FG-REBAR-10 | Rebar 10mm | Reinforcing bar 10mm | T | 590.00 |
| FG-REBAR-16 | Rebar 16mm | Reinforcing bar 16mm | T | 585.00 |
| FG-BILLET-100 | Steel Billet 100mm | Finished steel billet 100x100mm | T | 560.00 |

### Material Flow Diagram

```
Raw Materials (RM)                  Intermediates (IM)              Finished Goods (FG)
===================                 ==================              ==================
RM-SCRAP-A/B/C  ----+
RM-IRON-ORE     ----+---> IM-LIQUID-STEEL --+---> IM-SLAB-CS ---> IM-HR-COIL ---> FG-HR-COIL-2MM
RM-LIMESTONE    ----+                       |
RM-FESI/FEMN    ----+                       +---> IM-BILLET --> IM-BAR ---------> FG-REBAR-10
RM-COAL         ----+
RM-GRAPHITE     ----+

IM-HR-COIL --> IM-PICKLED --> IM-CR-STRIP --> IM-ANNEALED --> FG-CR-SHEET-1MM
  (uses RM-HCL)   (uses RM-LUBRICANT)           (uses RM-COATING)
```

> **Important: Material Code Discrepancy**
>
> The materials master data table uses the codes listed above (e.g., `RM-ALWIRE`, `RM-LUBRICANT`, `IM-LIQUID-STEEL`, `IM-SLAB-CS`, `IM-HR-COIL`, `IM-BAR`, `FG-HR-COIL-2MM`). However, the `material_id` field in **batch** and **inventory** records uses older/abbreviated codes (e.g., `RM-AL-WIRE`, `RM-ROLL-LUB`, `IM-LIQUID`, `IM-SLAB`, `IM-HR-ROUGH`, `IM-ROLLED-BAR`, `FG-HR-2MM`). This is because `material_id` in batches/inventory is a VARCHAR field (not a foreign key to the materials table), and the batch seed data predates the materials master data. The batch and inventory sections of this document reflect the actual codes stored in those records.

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

> **Note:** BOM data is configured through the application API, not via SQL patches. The material codes in BOM nodes use the batch-style abbreviated codes (e.g., `IM-LIQUID`, `IM-SLAB`, `RM-MOLD-PWD`) rather than the materials master codes (e.g., `IM-LIQUID-STEEL`, `IM-SLAB-CS`, `RM-MOLD-POWDER`).

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
| 1 | EAF-001 | Electric Arc Furnace #1 | BATCH | MELTING | 120 | T | Melt Shop Bay 1 | **AVAILABLE** |
| 2 | EAF-002 | Electric Arc Furnace #2 | BATCH | MELTING | 120 | T | Melt Shop Bay 2 | **IN_USE** |
| 3 | EAF-003 | Electric Arc Furnace #3 | BATCH | MELTING | 150 | T | Melt Shop Bay 3 | **MAINTENANCE** |
| 4 | LF-001 | Ladle Furnace #1 | BATCH | REFINING | 120 | T | Secondary Metallurgy | **AVAILABLE** |
| 5 | LF-002 | Ladle Furnace #2 | BATCH | REFINING | 150 | T | Secondary Metallurgy | **AVAILABLE** |
| 6 | CCM-001 | Continuous Caster #1 | CONTINUOUS | CASTING | 200 | T/H | Casting Bay 1 | **AVAILABLE** |
| 7 | CCM-002 | Continuous Caster #2 | CONTINUOUS | CASTING | 100 | T/H | Casting Bay 2 | **IN_USE** |
| 8 | HSM-001 | Hot Strip Mill #1 | CONTINUOUS | HOT_ROLLING | 400 | T/H | Hot Rolling Bay 1 | **AVAILABLE** |
| 9 | HSM-002 | Hot Strip Mill #2 | CONTINUOUS | HOT_ROLLING | 350 | T/H | Hot Rolling Bay 2 | **AVAILABLE** |
| 10 | CRM-001 | Cold Rolling Mill | CONTINUOUS | COLD_ROLLING | 150 | T/H | Cold Rolling Bay | **AVAILABLE** |
| 11 | BAF-001 | Batch Annealing Furnace | BATCH | HEAT_TREATMENT | 80 | T | Annealing Bay | **AVAILABLE** |
| 12 | PKL-001 | Pickling Line | CONTINUOUS | PICKLING | 200 | T/H | Finishing Bay | **ON_HOLD** |
| 13 | BRM-001 | Bar Rolling Mill | CONTINUOUS | BAR_ROLLING | 100 | T/H | Long Products Bay | **AVAILABLE** |
| 14 | GALV-001 | Galvanizing Line | CONTINUOUS | COATING | 100 | T/H | Coating Bay | **AVAILABLE** |
| 15 | WRM-001 | Wire Rod Mill | CONTINUOUS | WIRE_DRAWING | 80 | T/H | Wire Products Bay | **AVAILABLE** |
| 16 | PACK-001 | Packaging Line #1 | BATCH | PACKAGING | 50 | T | Shipping | **AVAILABLE** |

### Equipment Status Summary

| Status | Count | Equipment |
|--------|-------|-----------|
| AVAILABLE | 12 | EAF-001, LF-001, LF-002, CCM-001, HSM-001, HSM-002, CRM-001, BAF-001, BRM-001, GALV-001, WRM-001, PACK-001 |
| IN_USE | 2 | EAF-002, CCM-002 |
| MAINTENANCE | 1 | EAF-003 |
| ON_HOLD | 1 | PKL-001 |

### Equipment by Location

| Location | Equipment |
|----------|-----------|
| Melt Shop Bay 1/2/3 | EAF-001, EAF-002, EAF-003 |
| Secondary Metallurgy | LF-001, LF-002 |
| Casting Bay 1/2 | CCM-001, CCM-002 |
| Hot Rolling Bay 1/2 | HSM-001, HSM-002 |
| Cold Rolling Bay | CRM-001 |
| Annealing Bay | BAF-001 |
| Finishing Bay | PKL-001 |
| Long Products Bay | BRM-001 |
| Coating Bay | GALV-001 |
| Wire Products Bay | WRM-001 |
| Shipping | PACK-001 |

---

## 9. Operators

Twelve operators are configured across six departments. Eleven are active; one (OP-012) is inactive.

| ID | Code | Name | Department | Shift | Status |
|----|------|------|------------|-------|--------|
| 1 | OP-001 | John Martinez | Melt Shop | A | **ACTIVE** |
| 2 | OP-002 | Sarah Wilson | Melt Shop | B | **ACTIVE** |
| 3 | OP-003 | Michael Brown | Casting | A | **ACTIVE** |
| 4 | OP-004 | Emily Davis | Casting | B | **ACTIVE** |
| 5 | OP-005 | David Garcia | Hot Rolling | A | **ACTIVE** |
| 6 | OP-006 | Jennifer Lee | Hot Rolling | B | **ACTIVE** |
| 7 | OP-007 | Robert Taylor | Cold Rolling | A | **ACTIVE** |
| 8 | OP-008 | Lisa Anderson | Cold Rolling | B | **ACTIVE** |
| 9 | OP-009 | James Thomas | Finishing | A | **ACTIVE** |
| 10 | OP-010 | Patricia Jackson | Finishing | B | **ACTIVE** |
| 11 | OP-011 | Christopher White | Quality | A | **ACTIVE** |
| 12 | OP-012 | Amanda Harris | Quality | B | **INACTIVE** |

### Operators by Department

| Department | Shift A | Shift B |
|------------|---------|---------|
| Melt Shop | OP-001 (John Martinez) | OP-002 (Sarah Wilson) |
| Casting | OP-003 (Michael Brown) | OP-004 (Emily Davis) |
| Hot Rolling | OP-005 (David Garcia) | OP-006 (Jennifer Lee) |
| Cold Rolling | OP-007 (Robert Taylor) | OP-008 (Lisa Anderson) |
| Finishing | OP-009 (James Thomas) | OP-010 (Patricia Jackson) |
| Quality | OP-011 (Christopher White) | OP-012 (Amanda Harris - inactive) |

---

## 10. Orders

There are 45 orders in the system, organized into two groups: the original 15 orders and 30 additional orders that include multi-stage production scenarios.

> **Note: Denormalized Customer Names**
>
> The orders table stores a `customer_name` VARCHAR copy at creation time. Some order customer names differ from the current customer master data (e.g., orders may show "Global Manufacturing Ltd" while the customer master has "Global Manufacturing Inc", or "African Mining Corp" while customer CUST-010 is "Indian Steel Works Pvt"). The names shown below are the actual values stored in the orders table.

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
| CREATED | 15 | 4, 6, 7, 9, 10, 20, 26, 27, 31, 35, 36, 40, 41, 42, 45 |
| IN_PROGRESS | 12 | 1, 2, 3, 11, 16, 17, 19, 21, 24, 33, 38, 44 |
| COMPLETED | 9 | 5, 12, 13, 18, 29, 30, 37, 39, 43 |
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
| RM (Raw Material) | 24 | 0 | 0 | 2 | 1 | 1 | 1 | **29** |
| IM (Intermediate) | 16 | 5 | 3 | 0 | 1 | 2 | 0 | **27** |
| WIP (Work In Progress) | 6 | 0 | 0 | 0 | 0 | 0 | 0 | **6** |
| FG (Finished Goods) | 5 | 0 | 2 | 0 | 0 | 1 | 0 | **8** |
| **Total** | **51** | **5** | **5** | **2** | **2** | **4** | **1** | **70** |

*Note: 56 inventory records from patch 002 + 14 from patch 003 = 70 total. IDs are auto-generated.*

### Key Inventory Locations

| Location | Material Types | Count |
|----------|---------------|-------|
| Scrap Yard A/B/C/D | RM-SCRAP-A, RM-SCRAP-B, RM-SCRAP-C | 10 |
| Alloy Store / Alloy Store B | RM-FESI, RM-FEMN, RM-FEV | 5 |
| Ore Storage / Ore Storage B | RM-IRON-ORE | 2 |
| Flux Store / Flux Store B | RM-LIMESTONE | 2 |
| Coal Yard | RM-COAL | 1 |
| Chemical Store | RM-HCL | 1 |
| Electrode Store | RM-GRAPHITE | 1 |
| Casting Store | RM-MOLD-PWD | 1 |
| Oil Store | RM-COATING, RM-ROLL-LUB | 2 |
| Slab Yard / Slab Yard B | IM-SLAB | 4 |
| Billet Yard | IM-BILLET | 2 |
| Ladle / Ladle #2 / Ladle #3 | IM-LIQUID | 4 |
| Hot Mill | IM-HR-ROUGH | 2 |
| Pickling Bay | IM-PICKLED | 1 |
| Cold Mill | IM-CR-STRIP | 1 |
| Annealing Bay | IM-ANNEALED | 1 |
| Bar Mill | IM-ROLLED-BAR | 1 |
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

> **Not in SQL patches.** Hold records are NOT pre-loaded in the seed data. The `hold_records` table starts empty. The scenarios below are **examples** of holds that could be created during demo sessions to explain the entity statuses (ON_HOLD, BLOCKED) that ARE pre-loaded in batches, inventory, equipment, and operations.

The following 12 example hold records illustrate typical scenarios consistent with the pre-loaded entity statuses:

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

Four batch numbering rules control how batch numbers are automatically generated during production confirmation.

| Config Name | Operation Type | Product SKU | Prefix | Separator | Date Format | Seq Length | Seq Reset | Priority |
|-------------|---------------|-------------|--------|-----------|-------------|-----------|-----------|----------|
| Melting Batch | MELTING | (any) | MLT | - | yyMMdd | 4 | DAILY | 10 |
| Casting Batch | CASTING | (any) | CST | - | yyMMdd | 4 | DAILY | 10 |
| Rolling Batch | HOT_ROLLING | (any) | HRL | - | yyMMdd | 4 | DAILY | 10 |
| Receipt Batch | RECEIPT | (any) | RCV | - | yyMMdd | 4 | DAILY | 5 |

### How Batch Numbers Are Generated

The system selects the matching rule based on operation type. Each rule generates a batch number with the configured prefix, date in `yyMMdd` format, and a 4-digit daily sequence.

**Example batch numbers:**
- Melting operation: `MLT-260215-0001`
- Casting operation: `CST-260215-0001`
- Hot rolling operation: `HRL-260215-0001`
- Material receipt: `RCV-260215-0001`

Sequences reset daily, so the first batch each day starts at 0001.

---

## 15. Production Confirmations

> **Not in SQL patches.** The `production_confirmations` table starts empty. Operation statuses (CONFIRMED, IN_PROGRESS, etc.) are pre-loaded in the operations table, but individual confirmation records are created through the application's Production Confirmation workflow. The records below are **examples** consistent with the pre-loaded operation statuses.

The following 35 example confirmations illustrate what production data would look like for the pre-loaded operations:

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
| QUALITY_HOLD | Quality inspection required | BATCH, INVENTORY, OPERATION |
| MATERIAL_DEFECT | Material defect detected | BATCH, INVENTORY |
| EQUIPMENT_ISSUE | Equipment malfunction | EQUIPMENT, OPERATION |
| PENDING_APPROVAL | Pending management approval | ORDER, ORDER_LINE, OPERATION |
| SAFETY_CONCERN | Safety investigation required | BATCH, EQUIPMENT, OPERATION |
| CUSTOMER_REQUEST | Customer requested hold | ORDER, ORDER_LINE, BATCH |
| SPEC_DEVIATION | Specification deviation detected | BATCH, OPERATION |
| CONTAMINATION | Contamination suspected | BATCH, INVENTORY |
| REGULATORY_HOLD | Regulatory hold | BATCH, INVENTORY |
| OTHER | Other | OPERATION, ORDER_LINE, BATCH, INVENTORY, EQUIPMENT |

### 17.2 Delay Reasons (10)

| Reason Code | Description |
|-------------|-------------|
| EQUIPMENT_BREAKDOWN | Equipment breakdown or failure |
| MATERIAL_SHORTAGE | Raw material not available |
| OPERATOR_UNAVAILABLE | Operator not available |
| QUALITY_RETEST | Quality retest required |
| SCHEDULED_MAINTENANCE | Scheduled maintenance window |
| UTILITY_OUTAGE | Power or utility interruption |
| TOOLING_CHANGE | Tooling change or setup |
| QUALITY_ISSUE | Quality issue |
| SCHEDULING | Scheduling conflict |
| OTHER | Other |

### 17.3 Process Parameters Configuration

Process parameters define the acceptable ranges for each operation type. These are configured per operation type (not per product).

| Operation Type | Parameter | Unit | Min | Max | Default | Required |
|---------------|-----------|------|-----|-----|---------|----------|
| MELTING | Temperature | °C | 1550 | 1700 | 1620 | Yes |
| MELTING | Power | MW | 30 | 80 | 55 | Yes |
| CASTING | Casting Speed | m/min | 0.8 | 2.5 | 1.2 | Yes |
| CASTING | Mold Temperature | °C | 200 | 350 | 280 | Yes |
| HOT_ROLLING | Entry Temperature | °C | 1100 | 1250 | 1180 | Yes |
| HOT_ROLLING | Finish Temperature | °C | 850 | 950 | 880 | Yes |
| COLD_ROLLING | Rolling Force | kN | 5000 | 25000 | 15000 | Yes |
| ANNEALING | Soak Temperature | °C | 650 | 750 | 700 | Yes |
| ANNEALING | Soak Time | hours | 8 | 24 | 16 | Yes |

### 17.4 Units of Measure Reference

*These are the unit codes used across materials, products, batches, and inventory records. There is no separate `units_of_measure` database table; units are stored as VARCHAR values on each entity.*

| Code | Name | Type |
|------|------|------|
| T | Metric Ton | WEIGHT |
| KG | Kilogram | WEIGHT |
| L | Liter | VOLUME |
| EA | Each | COUNT |
| PC | Piece | COUNT |

---

## 18. Summary Counts

| Entity | Count | Details |
|--------|-------|---------|
| Users | 1 | Admin only |
| Customers | 12 | 11 active, 1 inactive |
| Products | 7 | 2 HR Coils, 2 CR Sheets, 2 Rebars, 1 Billet |
| Materials | 31 | 15 RM, 9 IM, 7 FG |
| Processes | 6 | 4 active, 1 draft, 1 inactive |
| Routings | 4 | One per active process |
| Routing Steps | 22 | 8 + 3 + 7 + 4 steps |
| Operation Templates | 18 | 17 active, 1 inactive |
| BOM Trees | 8 | One per product (order SKU), 88 total nodes |
| Equipment | 16 | 12 available, 2 in use, 1 maintenance, 1 on hold |
| Operators | 12 | 11 active, 1 inactive |
| Orders | 45 | 15 created, 12 in-progress, 9 completed, 4 on-hold, 2 blocked, 3 cancelled |
| Order Line Items | 82 | 25 original + 57 additional |
| Operations (Runtime) | 425 | 93 from patch 002 + 332 from patch 003 |
| Batches | 70 | 56 from patch 002 + 14 from patch 003 |
| Inventory Records | 70 | 56 from patch 002 + 14 from patch 003 |
| Batch Relations | 40 | Genealogy chains for traceability |
| Batch Number Configs | 4 | Operation-type rules |
| Process Parameters | 9 | For MELTING, CASTING, HOT_ROLLING, COLD_ROLLING, ANNEALING |
| Hold Reasons | 10 | Quality, Safety, Equipment, Customer, etc. |
| Delay Reasons | 10 | Equipment, Material, Operator, Quality, etc. |

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

- **Available inventory:** 51 records ready for production or shipment
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

- **Available (12):** Ready for assignment to production operations
- **In Use (2):** EAF-002 and CCM-002 actively assigned
- **Maintenance (1):** EAF-003 undergoing maintenance
- **On Hold (1):** PKL-001 with active safety hold (Hold #6)

### 20.7 Order Lifecycle Demo

**Scenario:** View orders at every stage of their lifecycle

- **Created:** 15 orders awaiting scheduling
- **In Progress:** 12 orders with active production
- **Completed:** 9 orders fully produced and shipped
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

*This document was generated from the SQL patch files located at:*
- *`backend/src/main/resources/patches/002_seed_data.sql` (base seed data)*
- *`backend/src/main/resources/patches/003_additional_data.sql` (additional orders, operations, batches)*

*Last updated: February 2026*
