# Big Demo Data Plan - Realistic Steel Manufacturing MES

## Overview

Create comprehensive, realistic demo data for a Steel Manufacturing MES system using:
- **Real steel company names** (major global steel producers)
- **Real steel products** (industry-standard specifications)
- **Real raw materials** (actual steelmaking inputs)
- **Realistic processes** (standard steel manufacturing routes)
- **Realistic quantities** (typical production volumes)

---

## Data Specifications

### 1. Customers (15 Companies)

Real steel customers representing various industries that buy steel products:

| # | Company Name | Industry | Location | Notes |
|---|--------------|----------|----------|-------|
| 1 | **General Motors** | Automotive OEM | Detroit, USA | Buys CR sheets, coated steel |
| 2 | **Ford Motor Company** | Automotive OEM | Dearborn, USA | HR/CR coils, AHSS |
| 3 | **Toyota Motor Corporation** | Automotive OEM | Toyota City, Japan | Cold rolled, galvanized |
| 4 | **Caterpillar Inc** | Heavy Equipment | Peoria, USA | Heavy plates, structural |
| 5 | **John Deere** | Agricultural Equipment | Moline, USA | Plates, HR sheets |
| 6 | **Turner Construction** | Construction | New York, USA | Rebar, structural sections |
| 7 | **Bechtel Corporation** | Infrastructure | Reston, USA | Large diameter pipe, plates |
| 8 | **Nucor Building Systems** | Construction | Waterloo, USA | Metal building components |
| 9 | **Tenaris** | Oil & Gas | Houston, USA | Seamless pipe, tubular |
| 10 | **Hyundai Steel** | Steel Trading | Seoul, Korea | Various steel products |
| 11 | **ThyssenKrupp Materials** | Steel Distribution | Essen, Germany | All product types |
| 12 | **Metal Supermarkets** | Steel Service Center | Hamilton, Canada | Cut-to-size products |
| 13 | **Olympic Steel** | Steel Distribution | Cleveland, USA | Flat rolled, plates |
| 14 | **Reliance Steel & Aluminum** | Steel Service | Los Angeles, USA | Various processed steel |
| 15 | **Ryerson Inc** | Steel Distribution | Chicago, USA | Value-added processing |

### 2. Materials (40 Items)

#### Raw Materials (18)
| Code | Name | Type | Unit | Description |
|------|------|------|------|-------------|
| RM-HMS1A | HMS1 Scrap Grade A | RM | T | Heavy Melting Steel #1 - Premium |
| RM-HMS1B | HMS1 Scrap Grade B | RM | T | Heavy Melting Steel #1 - Standard |
| RM-HMS2 | HMS2 Scrap | RM | T | Heavy Melting Steel #2 |
| RM-SHRED | Shredded Scrap | RM | T | Auto Body Shredded Steel |
| RM-BUSHEL | Busheling | RM | T | Factory New Clippings |
| RM-PIG-IRON | Pig Iron | RM | T | Blast Furnace Pig Iron |
| RM-HBI | Hot Briquetted Iron | RM | T | Direct Reduced Iron Briquettes |
| RM-FESI-75 | FeSi 75% | RM | KG | Ferro Silicon 75% Si |
| RM-SIMN-65 | SiMn 65/17 | RM | KG | Silico Manganese |
| RM-FEMN-HC | FeMn HC | RM | KG | High Carbon Ferro Manganese |
| RM-FECR-LC | FeCr LC | RM | KG | Low Carbon Ferro Chrome |
| RM-CALC-LIME | Calcined Lime | RM | T | CaO for Steelmaking |
| RM-DOLIME | Dolomite Lime | RM | T | MgO-CaO for Slag |
| RM-MET-COKE | Metallurgical Coke | RM | T | Carbon Additive |
| RM-AL-WIRE | Aluminum Wire | RM | KG | Deoxidizer |
| RM-NI-CATH | Nickel Cathode | RM | KG | 99.9% Ni for Alloying |
| RM-FeMo | Ferro Molybdenum | RM | KG | 60% Mo for HSLA |
| RM-FeV | Ferro Vanadium | RM | KG | 80% V for Micro-alloying |

#### Intermediate Products (12)
| Code | Name | Type | Unit | Description |
|------|------|------|------|-------------|
| IM-SLAB-200 | CC Slab 200x1200 | IM | T | Continuously Cast Slab |
| IM-SLAB-250 | CC Slab 250x1500 | IM | T | Wide Slab for Plates |
| IM-BILLET-130 | CC Billet 130sq | IM | T | Square Billet for Long Products |
| IM-BILLET-150 | CC Billet 150sq | IM | T | Billet for Rebar/Wire Rod |
| IM-BLOOM-280 | CC Bloom 280sq | IM | T | Bloom for Beams/Rails |
| IM-HRC-6.0 | HR Coil 6.0mm | IM | T | Hot Band for Cold Rolling |
| IM-HRC-4.0 | HR Coil 4.0mm | IM | T | Pickled Band for CRFH |
| IM-WIREROD-55 | Wire Rod 5.5mm | IM | T | Low Carbon Wire Rod |
| IM-WIREROD-85 | Wire Rod 8.5mm | IM | T | High Carbon Wire Rod |
| IM-HP-25 | Hot Plate 25mm | IM | T | As-Rolled Plate |
| IM-PCKL-COIL | Pickled Coil | IM | T | Acid Cleaned HR Coil |
| IM-ANNEAL-CR | Annealed CR Coil | IM | T | Full Hard to Annealed |

#### Finished Products (10)
| Code | Name | Type | Unit | Description |
|------|------|------|------|-------------|
| FG-HRC-2.0 | HR Coil 2.0mm | FG | T | ASTM A1011 CS Type B |
| FG-HRC-3.0 | HR Coil 3.0mm | FG | T | ASTM A1011 CS Type B |
| FG-CRC-0.8 | CR Coil 0.8mm | FG | T | ASTM A1008 CS Type B |
| FG-CRC-1.0 | CR Coil 1.0mm | FG | T | ASTM A1008 CS Type B |
| FG-REBAR-10 | Rebar Grade 60 #10 | FG | T | ASTM A615 Grade 60 |
| FG-REBAR-16 | Rebar Grade 60 #16 | FG | T | ASTM A615 Grade 60 |
| FG-PLATE-12 | Plate 12mm A36 | FG | T | ASTM A36 Structural |
| FG-PLATE-25 | Plate 25mm A572-50 | FG | T | ASTM A572 Grade 50 |
| FG-WIRE-2.0 | Steel Wire 2.0mm | FG | T | SAE 1008 Low Carbon |
| FG-HDG-0.5 | HDG Coil 0.5mm | FG | T | Hot Dip Galvanized |

### 3. Products (25 SKUs)

Standard steel products with ASTM/SAE specifications:

| # | SKU | Name | Category | Spec |
|---|-----|------|----------|------|
| 1 | PROD-HRC-2.0x1200 | HR Coil 2.0mm x 1200mm | Flat - Hot Rolled | ASTM A1011 CS-B |
| 2 | PROD-HRC-2.5x1200 | HR Coil 2.5mm x 1200mm | Flat - Hot Rolled | ASTM A1011 CS-B |
| 3 | PROD-HRC-3.0x1500 | HR Coil 3.0mm x 1500mm | Flat - Hot Rolled | ASTM A1011 CS-B |
| 4 | PROD-HRC-4.0x1500 | HR Coil 4.0mm x 1500mm | Flat - Hot Rolled | ASTM A1011 CS-B |
| 5 | PROD-HRC-6.0x1500 | HR Coil 6.0mm x 1500mm | Flat - Hot Rolled | ASTM A1011 CS-B |
| 6 | PROD-CRC-0.6x1000 | CR Coil 0.6mm x 1000mm | Flat - Cold Rolled | ASTM A1008 CS-B |
| 7 | PROD-CRC-0.8x1200 | CR Coil 0.8mm x 1200mm | Flat - Cold Rolled | ASTM A1008 CS-B |
| 8 | PROD-CRC-1.0x1200 | CR Coil 1.0mm x 1200mm | Flat - Cold Rolled | ASTM A1008 CS-B |
| 9 | PROD-CRC-1.2x1200 | CR Coil 1.2mm x 1200mm | Flat - Cold Rolled | ASTM A1008 CS-B |
| 10 | PROD-HDG-0.5x1000 | HDG Coil 0.5mm x 1000mm | Flat - Coated | ASTM A653 CS-B |
| 11 | PROD-HDG-0.7x1200 | HDG Coil 0.7mm x 1200mm | Flat - Coated | ASTM A653 CS-B |
| 12 | PROD-REBAR-10x12M | Rebar 10mm x 12m | Long - Rebar | ASTM A615 Gr60 |
| 13 | PROD-REBAR-12x12M | Rebar 12mm x 12m | Long - Rebar | ASTM A615 Gr60 |
| 14 | PROD-REBAR-16x12M | Rebar 16mm x 12m | Long - Rebar | ASTM A615 Gr60 |
| 15 | PROD-REBAR-20x12M | Rebar 20mm x 12m | Long - Rebar | ASTM A615 Gr60 |
| 16 | PROD-REBAR-25x12M | Rebar 25mm x 12m | Long - Rebar | ASTM A615 Gr60 |
| 17 | PROD-WIRE-2.0-LC | Wire 2.0mm Low Carbon | Long - Wire | SAE 1008 |
| 18 | PROD-WIRE-3.0-HC | Wire 3.0mm High Carbon | Long - Wire | SAE 1070 |
| 19 | PROD-PLATE-10x2000 | Plate 10mm x 2000mm | Heavy Plate | ASTM A36 |
| 20 | PROD-PLATE-12x2000 | Plate 12mm x 2000mm | Heavy Plate | ASTM A36 |
| 21 | PROD-PLATE-16x2400 | Plate 16mm x 2400mm | Heavy Plate | ASTM A572-50 |
| 22 | PROD-PLATE-25x2400 | Plate 25mm x 2400mm | Heavy Plate | ASTM A572-50 |
| 23 | PROD-BILLET-130 | Billet 130mm sq | Semis | Internal Grade |
| 24 | PROD-SLAB-200x1200 | Slab 200x1200mm | Semis | Internal Grade |
| 25 | PROD-BLOOM-280 | Bloom 280mm sq | Semis | Internal Grade |

### 4. Equipment (18 Units)

Typical mini-mill / integrated mill equipment:

| Code | Name | Type | Capacity | Location |
|------|------|------|----------|----------|
| EAF-101 | Electric Arc Furnace #1 | BATCH | 150T/heat | Melt Shop Bay 1 |
| EAF-102 | Electric Arc Furnace #2 | BATCH | 150T/heat | Melt Shop Bay 2 |
| LF-101 | Ladle Furnace #1 | BATCH | 150T/heat | Melt Shop LF Area |
| LF-102 | Ladle Furnace #2 | BATCH | 150T/heat | Melt Shop LF Area |
| VD-101 | Vacuum Degasser | BATCH | 150T/heat | Melt Shop VD Area |
| CCM-101 | Slab Caster #1 (2-Strand) | CONTINUOUS | 2.4M T/Y | Caster Bay |
| CCM-102 | Billet Caster (6-Strand) | CONTINUOUS | 1.2M T/Y | Caster Bay |
| RHF-101 | Slab Reheat Furnace | CONTINUOUS | 300T/hr | HSM Entry |
| HSM-101 | Hot Strip Mill | CONTINUOUS | 4M T/Y | Hot Mill |
| PM-101 | Plate Mill | CONTINUOUS | 1M T/Y | Plate Mill |
| PCKL-101 | Pickling Line #1 | CONTINUOUS | 1.5M T/Y | Cold Mill Entry |
| CRM-101 | Cold Rolling Mill #1 | CONTINUOUS | 1M T/Y | Cold Mill |
| CAL-101 | Continuous Annealing Line | CONTINUOUS | 600K T/Y | Cold Mill |
| CGL-101 | Continuous Galvanizing Line | CONTINUOUS | 500K T/Y | Coating Line |
| BRM-101 | Bar Rolling Mill | CONTINUOUS | 1M T/Y | Bar Mill |
| WRM-101 | Wire Rod Mill | CONTINUOUS | 500K T/Y | Wire Rod Mill |
| CTL-101 | Cut-to-Length Line | CONTINUOUS | 300K T/Y | Finishing |
| SLT-101 | Slitting Line | CONTINUOUS | 200K T/Y | Finishing |

### 5. Operators (15 People)

Realistic operator names and departments:

| Code | Name | Department | Shift | Certification |
|------|------|------------|-------|---------------|
| OP-MS-001 | Michael Chen | Melt Shop | A-Shift | EAF Senior Operator |
| OP-MS-002 | James Rodriguez | Melt Shop | A-Shift | LRF Operator |
| OP-MS-003 | Robert Williams | Melt Shop | B-Shift | EAF Operator |
| OP-MS-004 | David Martinez | Melt Shop | B-Shift | LRF Operator |
| OP-CC-001 | William Johnson | Caster | A-Shift | Caster Pulpit Operator |
| OP-CC-002 | Thomas Anderson | Caster | B-Shift | Caster Pulpit Operator |
| OP-HR-001 | Christopher Lee | Hot Rolling | A-Shift | HSM Pulpit Operator |
| OP-HR-002 | Daniel Garcia | Hot Rolling | B-Shift | HSM Pulpit Operator |
| OP-CR-001 | Matthew Taylor | Cold Rolling | A-Shift | CRM Operator |
| OP-CR-002 | Anthony Brown | Cold Rolling | B-Shift | CRM Operator |
| OP-BM-001 | Joseph Wilson | Bar Mill | A-Shift | Bar Mill Operator |
| OP-BM-002 | Kevin Thompson | Bar Mill | B-Shift | Bar Mill Operator |
| OP-FN-001 | Brian Davis | Finishing | A-Shift | CTL/SLT Operator |
| OP-QC-001 | Steven Clark | Quality | A-Shift | Quality Inspector |
| OP-QC-002 | Paul Robinson | Quality | B-Shift | Quality Inspector |

### 6. Processes and Routings (15)

Standard steel manufacturing process routes:

| # | Process Name | Route | Yield |
|---|--------------|-------|-------|
| 1 | EAF Melting | Charge→Melt→Refine→Tap | 95% |
| 2 | Ladle Refining | Heat→Alloy→Degas→Temp | 99% |
| 3 | Slab Casting | Setup→Cast→Cut | 97% |
| 4 | Billet Casting | Setup→Cast→Cut | 96% |
| 5 | HR Coil Production | Reheat→Rough→Finish→Cool→Coil | 97% |
| 6 | Plate Rolling | Reheat→Roll→Level→Cool | 95% |
| 7 | Pickling | Uncoil→Acid→Rinse→Dry→Recoil | 99% |
| 8 | Cold Rolling | Uncoil→Roll→Recoil | 96% |
| 9 | Annealing | Uncoil→Heat→Soak→Cool→Recoil | 99% |
| 10 | Hot Dip Galvanizing | Uncoil→Clean→Dip→Wipe→Cool→Recoil | 98% |
| 11 | Rebar Rolling | Reheat→Rough→Intermediate→Finish→Cool→Bundle | 97% |
| 12 | Wire Rod Rolling | Reheat→Roll→LayingHead→Stelmor→Coil | 96% |
| 13 | Wire Drawing | Descale→Draw→Coil | 98% |
| 14 | HR Coil Complete | Melt→Refine→Cast→Roll | 88% |
| 15 | CR Sheet Complete | Melt→Cast→HotRoll→Pickle→ColdRoll→Anneal | 82% |

### 7. Orders (30 Orders)

Realistic order volumes and product mix:

| Customer | Order Mix | Total Tons |
|----------|-----------|------------|
| General Motors | CR Sheets, HDG | 2,500 T |
| Ford Motor | CR, HDG, HR | 3,000 T |
| Toyota | CR Sheets, HDG | 2,000 T |
| Caterpillar | Plates 12-25mm | 1,500 T |
| John Deere | Plates, HR Sheets | 1,200 T |
| Turner Construction | Rebar 10-25mm | 5,000 T |
| Bechtel | Plates, Pipe | 3,500 T |
| Nucor Building | HR Coils | 2,000 T |
| Tenaris | Billets, Plates | 4,000 T |
| Hyundai Steel | Various | 3,000 T |
| ThyssenKrupp | Various | 2,500 T |
| Metal Supermarkets | Cut-to-size | 500 T |
| Olympic Steel | Plates, HR | 1,800 T |
| Reliance Steel | Various | 2,200 T |
| Ryerson | Value-add | 1,500 T |

### 8. Raw Material Receipts (60 Batches)

Typical monthly raw material receipts:

| Material | Quantity/Batch | # Batches | Total |
|----------|----------------|-----------|-------|
| HMS1 Scrap | 400-600 T | 10 | 5,000 T |
| HMS2 Scrap | 500-700 T | 10 | 6,000 T |
| Shredded Scrap | 300-500 T | 6 | 2,400 T |
| Pig Iron | 150-250 T | 4 | 800 T |
| HBI | 200-400 T | 4 | 1,200 T |
| FeSi 75% | 3,000-5,000 KG | 6 | 24,000 KG |
| SiMn | 4,000-6,000 KG | 5 | 25,000 KG |
| FeMn HC | 5,000-8,000 KG | 5 | 32,500 KG |
| Lime | 80-120 T | 6 | 600 T |
| Dolomite | 60-100 T | 4 | 320 T |

---

## Implementation Tasks

### Phase 1: Data Definitions
1. Create customer data with real company info
2. Create material data with ASTM specs
3. Create product catalog with specifications
4. Create equipment inventory
5. Create operator roster

### Phase 2: Process Configuration
6. Create process definitions
7. Create routing configurations
8. Map products to processes
9. Define process parameters

### Phase 3: Transactional Data
10. Create customer orders
11. Generate operations from routings
12. Create raw material receipts
13. Create initial inventory

### Phase 4: Verification
14. Verify all data counts
15. Test order workflow
16. Test production confirmation
17. Document final state

---

## File Locations

- **E2E Test Script:** `e2e/tests/31-big-demo-setup.test.js`
- **Plan Document:** `documents/BIG-DEMO-DATA-PLAN.md` (this file)
- **Task Tracking:** `.claude/TASKS.md`

---

## Success Criteria

- [ ] 15 customers with real company names
- [ ] 40 materials with proper specs
- [ ] 25 products with ASTM specifications
- [ ] 18 equipment items
- [ ] 15 operators
- [ ] 15 processes with routings
- [ ] 30 orders with line items
- [ ] 60+ raw material batches
- [ ] All operations generated
- [ ] System ready for demo
