-- =====================================================
-- Patch 035: Demo Process Templates, Routings, and BOMs
-- =====================================================
-- Purpose: Seeds process templates, routing templates, and BOMs
-- IMPORTANT: Process = TEMPLATE (design-time only)
-- Operations are created at runtime via OperationInstantiationService
-- =====================================================

-- =====================================================
-- SECTION 1: PROCESS TEMPLATES (Design-time only)
-- =====================================================
-- NOTE: These are TEMPLATES, not linked to orders
-- Operations are instantiated from routing steps at order creation time

-- Process Template: HR Coil Production (Melting → Casting → Hot Rolling)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'HR Coil Production', 'Hot rolled coil production process - EAF → Casting → Hot Strip Mill', 'ACTIVE', 'Flat Product Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'HR Coil Production');

-- Process Template: CR Sheet Production (HR → Pickling → Cold Rolling → Annealing)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'CR Sheet Production', 'Cold rolled sheet production - HR Coil → Pickling → Cold Rolling → Annealing', 'ACTIVE', 'Cold Rolled Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'CR Sheet Production');

-- Process Template: Rebar Production (Melting → Casting → Bar Rolling)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'Rebar Production', 'Reinforcing bar production - EAF → Billet Casting → Bar Rolling', 'ACTIVE', 'Long Product Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'Rebar Production');

-- Process Template: Wire Rod Production (Melting → Casting → Wire Rod Mill)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'Wire Rod Production', 'Wire rod production - EAF → Billet Casting → Wire Rod Mill', 'ACTIVE', 'Wire Product Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'Wire Rod Production');

-- Process Template: Galvanized Sheet Production (CR Sheet → Galvanizing)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'Galvanized Sheet Production', 'Galvanized sheet production - CR Sheet → Hot Dip Galvanizing', 'ACTIVE', 'Coated Product Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'Galvanized Sheet Production');

-- Process Template: Steel Plate Production (Melting → Casting → Plate Mill)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'Steel Plate Production', 'Heavy plate production - EAF → Slab Casting → Plate Mill', 'ACTIVE', 'Plate Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'Steel Plate Production');

-- Process Template: Structural Section Production (Melting → Casting → Section Mill)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'Structural Section Production', 'Structural sections production - EAF → Bloom Casting → Section Mill', 'ACTIVE', 'Structural Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'Structural Section Production');

-- Process Template: Stainless Steel Production (Special Melting → Casting → Rolling)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'Stainless Steel Production', 'Stainless steel production - EAF → AOD → Casting → Rolling', 'ACTIVE', 'Stainless Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'Stainless Steel Production');

-- Process Template: Billet Production (Melting → Casting only)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'Billet Production', 'Steel billet production - EAF → Billet Casting', 'ACTIVE', 'Semi-Finished Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'Billet Production');

-- Process Template: Tinplate Production (CR Sheet → Tinning)
INSERT INTO processes (process_name, description, status, usage_decision, created_on, created_by)
SELECT 'Tinplate Production', 'Tinplate production - CR Sheet → Electrolytic Tinning', 'ACTIVE', 'Tinplate Route', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_name = 'Tinplate Production');

-- =====================================================
-- SECTION 2: ROUTING TEMPLATES
-- =====================================================
-- Each routing is linked to a process template
-- Routing steps define the operation sequence

-- Routing: HR Coil Standard Route (3 operations)
INSERT INTO routings (process_id, routing_name, routing_type, description, status, created_on, created_by)
SELECT p.process_id, 'HR Coil Standard Route', 'SEQUENTIAL', 'Standard route for hot rolled coil production', 'ACTIVE', NOW(), 'SYSTEM'
FROM processes p WHERE p.process_name = 'HR Coil Production'
AND NOT EXISTS (SELECT 1 FROM routings WHERE routing_name = 'HR Coil Standard Route');

-- Routing Steps for HR Coil
INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 1, 'Melting', 'MELTING', 'MELT-01', 120, 'Electric arc furnace melting', true, false, true, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'HR Coil Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 1);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 2, 'Slab Casting', 'CASTING', 'CAST-01', 120, 'Continuous slab casting', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'HR Coil Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 2);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 3, 'Hot Rolling', 'HOT_ROLLING', 'HROLL-01', 118, 'Hot strip mill rolling', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'HR Coil Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 3);

-- Routing: CR Sheet Standard Route (4 operations)
INSERT INTO routings (process_id, routing_name, routing_type, description, status, created_on, created_by)
SELECT p.process_id, 'CR Sheet Standard Route', 'SEQUENTIAL', 'Standard route for cold rolled sheet production', 'ACTIVE', NOW(), 'SYSTEM'
FROM processes p WHERE p.process_name = 'CR Sheet Production'
AND NOT EXISTS (SELECT 1 FROM routings WHERE routing_name = 'CR Sheet Standard Route');

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 1, 'Pickling', 'PICKLING', 'PCKL-01', 100, 'Acid pickling to remove scale', true, false, true, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'CR Sheet Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 1);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 2, 'Cold Rolling', 'COLD_ROLLING', 'CROLL-01', 98, 'Cold reduction mill rolling', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'CR Sheet Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 2);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 3, 'Annealing', 'ANNEALING', 'ANNL-01', 98, 'Batch annealing for softening', true, false, true, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'CR Sheet Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 3);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 4, 'Skin Pass', 'TEMPER_ROLLING', 'SKIN-01', 97, 'Temper rolling for flatness', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'CR Sheet Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 4);

-- Routing: Rebar Standard Route (3 operations)
INSERT INTO routings (process_id, routing_name, routing_type, description, status, created_on, created_by)
SELECT p.process_id, 'Rebar Standard Route', 'SEQUENTIAL', 'Standard route for rebar production', 'ACTIVE', NOW(), 'SYSTEM'
FROM processes p WHERE p.process_name = 'Rebar Production'
AND NOT EXISTS (SELECT 1 FROM routings WHERE routing_name = 'Rebar Standard Route');

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 1, 'Melting', 'MELTING', 'MELT-02', 100, 'Electric arc furnace melting', true, false, true, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Rebar Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 1);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 2, 'Billet Casting', 'CASTING', 'CAST-02', 100, 'Continuous billet casting', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Rebar Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 2);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 3, 'Bar Rolling', 'BAR_ROLLING', 'BROLL-01', 98, 'Bar rolling mill', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Rebar Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 3);

-- Routing: Wire Rod Standard Route (3 operations)
INSERT INTO routings (process_id, routing_name, routing_type, description, status, created_on, created_by)
SELECT p.process_id, 'Wire Rod Standard Route', 'SEQUENTIAL', 'Standard route for wire rod production', 'ACTIVE', NOW(), 'SYSTEM'
FROM processes p WHERE p.process_name = 'Wire Rod Production'
AND NOT EXISTS (SELECT 1 FROM routings WHERE routing_name = 'Wire Rod Standard Route');

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 1, 'Melting', 'MELTING', 'MELT-03', 80, 'Electric arc furnace melting', true, false, true, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Wire Rod Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 1);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 2, 'Billet Casting', 'CASTING', 'CAST-03', 80, 'Continuous billet casting', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Wire Rod Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 2);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 3, 'Wire Rod Rolling', 'WIRE_ROLLING', 'WROLL-01', 78, 'Wire rod mill rolling', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Wire Rod Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 3);

-- Routing: Galvanized Sheet Route (2 operations - starts from CR sheet)
INSERT INTO routings (process_id, routing_name, routing_type, description, status, created_on, created_by)
SELECT p.process_id, 'Galvanized Sheet Route', 'SEQUENTIAL', 'Route for galvanizing cold rolled sheet', 'ACTIVE', NOW(), 'SYSTEM'
FROM processes p WHERE p.process_name = 'Galvanized Sheet Production'
AND NOT EXISTS (SELECT 1 FROM routings WHERE routing_name = 'Galvanized Sheet Route');

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 1, 'Surface Cleaning', 'CLEANING', 'CLEAN-01', 50, 'Surface preparation before galvanizing', true, false, true, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Galvanized Sheet Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 1);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 2, 'Hot Dip Galvanizing', 'COATING', 'GALV-01', 50, 'Hot dip zinc coating', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Galvanized Sheet Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 2);

-- Routing: Billet Production Route (2 operations)
INSERT INTO routings (process_id, routing_name, routing_type, description, status, created_on, created_by)
SELECT p.process_id, 'Billet Standard Route', 'SEQUENTIAL', 'Standard route for billet production', 'ACTIVE', NOW(), 'SYSTEM'
FROM processes p WHERE p.process_name = 'Billet Production'
AND NOT EXISTS (SELECT 1 FROM routings WHERE routing_name = 'Billet Standard Route');

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 1, 'Melting', 'MELTING', 'MELT-04', 100, 'Electric arc furnace melting', true, false, true, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Billet Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 1);

INSERT INTO routing_steps (routing_id, sequence_number, operation_name, operation_type, operation_code, target_qty, description, produces_output_batch, allows_split, allows_merge, created_on, created_by)
SELECT r.routing_id, 2, 'Billet Casting', 'CASTING', 'CAST-04', 100, 'Continuous billet casting', true, true, false, NOW(), 'SYSTEM'
FROM routings r WHERE r.routing_name = 'Billet Standard Route'
AND NOT EXISTS (SELECT 1 FROM routing_steps rs WHERE rs.routing_id = r.routing_id AND rs.sequence_number = 2);

-- =====================================================
-- SECTION 3: BILL OF MATERIALS (Multi-level BOMs)
-- =====================================================
-- BOMs define material requirements for products
-- Multi-level: FG → IM → RM

-- BOM for PROD-HR-COIL-2MM (Hot Rolled Coil 2mm)
-- Level 0: Finished Good
-- Level 1: Steel Scrap A + Alloys → Liquid Steel
-- Level 2: Liquid Steel → Slab → HR Coil

-- Parent: HR Coil 2mm needs Slab (Level 1)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, created_on, created_by)
SELECT 'PROD-HR-COIL-2MM', m.material_id, 1.02, 'T', 1.02, 1, 'V1', 'ACTIVE', NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-SLAB-CS'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-HR-COIL-2MM' AND b.material_id = m.material_id AND b.bom_version = 'V1');

-- Slab needs Liquid Steel (Level 2)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-HR-COIL-2MM', m.material_id, 1.05, 'T', 1.05, 2, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-HR-COIL-2MM' AND sequence_level = 1 AND bom_version = 'V1'), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-LIQUID-STEEL'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-HR-COIL-2MM' AND b.material_id = m.material_id AND b.bom_version = 'V1' AND b.sequence_level = 2);

-- Raw materials for melting (Level 3)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-HR-COIL-2MM', m.material_id, 1.1, 'T', 1.10, 3, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-HR-COIL-2MM' AND sequence_level = 2 AND bom_version = 'V1'), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-SCRAP-A'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-HR-COIL-2MM' AND b.material_id = m.material_id AND b.bom_version = 'V1');

INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-HR-COIL-2MM', m.material_id, 5.0, 'KG', 1.0, 3, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-HR-COIL-2MM' AND sequence_level = 2 AND bom_version = 'V1'), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-FESI'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-HR-COIL-2MM' AND b.material_id = m.material_id AND b.bom_version = 'V1');

INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-HR-COIL-2MM', m.material_id, 8.0, 'KG', 1.0, 3, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-HR-COIL-2MM' AND sequence_level = 2 AND bom_version = 'V1'), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-FEMN'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-HR-COIL-2MM' AND b.material_id = m.material_id AND b.bom_version = 'V1');

-- BOM for PROD-CR-SHEET-1MM (Cold Rolled Sheet 1mm)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, created_on, created_by)
SELECT 'PROD-CR-SHEET-1MM', m.material_id, 1.03, 'T', 1.03, 1, 'V1', 'ACTIVE', NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-HR-COIL'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-CR-SHEET-1MM' AND b.material_id = m.material_id AND b.bom_version = 'V1');

INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-CR-SHEET-1MM', m.material_id, 50, 'L', 1.0, 2, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-CR-SHEET-1MM' AND sequence_level = 1 AND bom_version = 'V1'), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-HCL'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-CR-SHEET-1MM' AND b.material_id = m.material_id AND b.bom_version = 'V1');

INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-CR-SHEET-1MM', m.material_id, 10, 'L', 1.0, 2, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-CR-SHEET-1MM' AND sequence_level = 1 AND bom_version = 'V1'), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-LUBRICANT'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-CR-SHEET-1MM' AND b.material_id = m.material_id AND b.bom_version = 'V1');

-- BOM for PROD-REBAR-10 (Rebar 10mm)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, created_on, created_by)
SELECT 'PROD-REBAR-10', m.material_id, 1.02, 'T', 1.02, 1, 'V1', 'ACTIVE', NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-BILLET'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-REBAR-10' AND b.material_id = m.material_id AND b.bom_version = 'V1');

INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-REBAR-10', m.material_id, 1.05, 'T', 1.05, 2, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-REBAR-10' AND sequence_level = 1 AND bom_version = 'V1'), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-SCRAP-B'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-REBAR-10' AND b.material_id = m.material_id AND b.bom_version = 'V1' AND b.sequence_level = 2);

-- BOM for PROD-GALV-SHEET (Galvanized Sheet)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, created_on, created_by)
SELECT 'PROD-GALV-SHEET', m.material_id, 1.0, 'T', 1.0, 1, 'V1', 'ACTIVE', NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-CR-STRIP'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-GALV-SHEET' AND b.material_id = m.material_id AND b.bom_version = 'V1');

INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-GALV-SHEET', m.material_id, 50, 'KG', 1.0, 2, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-GALV-SHEET' AND sequence_level = 1 AND bom_version = 'V1'), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-ZINC'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-GALV-SHEET' AND b.material_id = m.material_id AND b.bom_version = 'V1');

-- BOM for PROD-BILLET-100 (Steel Billet)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, created_on, created_by)
SELECT 'PROD-BILLET-100', m.material_id, 1.05, 'T', 1.05, 1, 'V1', 'ACTIVE', NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-SCRAP-A'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-BILLET-100' AND b.material_id = m.material_id AND b.bom_version = 'V1');

INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, parent_bom_id, created_on, created_by)
SELECT 'PROD-BILLET-100', m.material_id, 0.15, 'T', 1.0, 1, 'V1', 'ACTIVE',
       (SELECT bom_id FROM bill_of_material WHERE product_sku = 'PROD-BILLET-100' AND sequence_level = 1 AND bom_version = 'V1' LIMIT 1), NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-LIMESTONE'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-BILLET-100' AND b.material_id = m.material_id AND b.bom_version = 'V1');

-- BOM for PROD-WIRE-ROD-6 (Wire Rod 6mm)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, created_on, created_by)
SELECT 'PROD-WIRE-ROD-6', m.material_id, 1.03, 'T', 1.03, 1, 'V1', 'ACTIVE', NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-BILLET'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-WIRE-ROD-6' AND b.material_id = m.material_id AND b.bom_version = 'V1');

-- BOM for PROD-PLATE-10 (Steel Plate 10mm)
INSERT INTO bill_of_material (product_sku, material_id, quantity_required, unit, yield_loss_ratio, sequence_level, bom_version, status, created_on, created_by)
SELECT 'PROD-PLATE-10', m.material_id, 1.02, 'T', 1.02, 1, 'V1', 'ACTIVE', NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-SLAB-CS'
AND NOT EXISTS (SELECT 1 FROM bill_of_material b WHERE b.product_sku = 'PROD-PLATE-10' AND b.material_id = m.material_id AND b.bom_version = 'V1');

-- =====================================================
-- SECTION 4: PROCESS PARAMETER CONFIGURATION
-- =====================================================
-- Min/max values for process parameters validation

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'MELTING', NULL, 'Temperature', 'DECIMAL', '°C', 1550, 1700, 1620, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'MELTING' AND parameter_name = 'Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'MELTING', NULL, 'Power', 'DECIMAL', 'MW', 30, 80, 55, true, 2, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'MELTING' AND parameter_name = 'Power');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'CASTING', NULL, 'Casting Speed', 'DECIMAL', 'm/min', 0.8, 2.5, 1.2, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'CASTING' AND parameter_name = 'Casting Speed');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'CASTING', NULL, 'Mold Temperature', 'DECIMAL', '°C', 200, 350, 280, true, 2, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'CASTING' AND parameter_name = 'Mold Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'HOT_ROLLING', NULL, 'Entry Temperature', 'DECIMAL', '°C', 1100, 1250, 1180, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'HOT_ROLLING' AND parameter_name = 'Entry Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'HOT_ROLLING', NULL, 'Finish Temperature', 'DECIMAL', '°C', 850, 950, 880, true, 2, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'HOT_ROLLING' AND parameter_name = 'Finish Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'COLD_ROLLING', NULL, 'Rolling Force', 'DECIMAL', 'kN', 5000, 25000, 15000, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'COLD_ROLLING' AND parameter_name = 'Rolling Force');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'ANNEALING', NULL, 'Soak Temperature', 'DECIMAL', '°C', 650, 750, 700, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'ANNEALING' AND parameter_name = 'Soak Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'ANNEALING', NULL, 'Soak Time', 'DECIMAL', 'hours', 8, 24, 16, true, 2, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'ANNEALING' AND parameter_name = 'Soak Time');

-- =====================================================
-- SECTION 5: BATCH NUMBER CONFIGURATION
-- =====================================================

INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, separator, include_date, date_format, sequence_length, sequence_reset, priority, status, created_on, created_by)
SELECT 'Melting Batch', 'MELTING', NULL, 'MLT', '-', true, 'yyMMdd', 4, 'DAILY', 10, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_number_config WHERE config_name = 'Melting Batch');

INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, separator, include_date, date_format, sequence_length, sequence_reset, priority, status, created_on, created_by)
SELECT 'Casting Batch', 'CASTING', NULL, 'CST', '-', true, 'yyMMdd', 4, 'DAILY', 10, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_number_config WHERE config_name = 'Casting Batch');

INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, separator, include_date, date_format, sequence_length, sequence_reset, priority, status, created_on, created_by)
SELECT 'Rolling Batch', 'HOT_ROLLING', NULL, 'HRL', '-', true, 'yyMMdd', 4, 'DAILY', 10, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_number_config WHERE config_name = 'Rolling Batch');

INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, separator, include_date, date_format, sequence_length, sequence_reset, priority, status, created_on, created_by)
SELECT 'Receipt Batch', 'RECEIPT', NULL, 'RCV', '-', true, 'yyMMdd', 4, 'DAILY', 5, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_number_config WHERE config_name = 'Receipt Batch');
