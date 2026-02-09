-- =====================================================
-- Patch 005: Missing Seed Data
-- Adds seed data for tables that exist in schema but
-- had no data in patches 002/003:
--   routing, routing_steps, bill_of_material,
--   production_confirmation, confirmation_equipment,
--   confirmation_operators, hold_records,
--   unit_of_measure, unit_conversion,
--   equipment_type_config, inventory_form_config,
--   operation_equipment_usage, inventory_movement
--
-- Also creates tables that exist in demo/schema.sql
-- but are missing from 001_schema.sql:
--   unit_of_measure, unit_conversion,
--   equipment_type_config, inventory_form_config
--
-- NOTE: Does NOT include audit_trail (generated at runtime)
-- =====================================================


-- =====================================================
-- PART A: Create missing tables (exist in demo but not in patches)
-- =====================================================

-- Equipment Type Configuration
CREATE TABLE IF NOT EXISTS equipment_type_config (
    config_id BIGSERIAL PRIMARY KEY,
    equipment_type VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    min_capacity DECIMAL(15,4),
    max_capacity DECIMAL(15,4),
    default_capacity_unit VARCHAR(20),
    min_temperature DECIMAL(10,2),
    max_temperature DECIMAL(10,2),
    min_pressure DECIMAL(10,2),
    max_pressure DECIMAL(10,2),
    maintenance_interval_hours INT,
    max_continuous_operation_hours INT,
    requires_operator BOOLEAN DEFAULT TRUE,
    requires_calibration BOOLEAN DEFAULT FALSE,
    allows_parallel_operation BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unit of Measure
CREATE TABLE IF NOT EXISTS unit_of_measure (
    unit_id BIGSERIAL PRIMARY KEY,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    unit_name VARCHAR(50) NOT NULL,
    unit_type VARCHAR(20) NOT NULL,
    decimal_precision INT DEFAULT 2,
    is_base_unit BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Unit Conversion
CREATE TABLE IF NOT EXISTS unit_conversion (
    conversion_id BIGSERIAL PRIMARY KEY,
    from_unit_code VARCHAR(20) NOT NULL,
    to_unit_code VARCHAR(20) NOT NULL,
    conversion_factor DECIMAL(20,10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_unit_code, to_unit_code)
);

-- Inventory Form Configuration
CREATE TABLE IF NOT EXISTS inventory_form_config (
    form_id BIGSERIAL PRIMARY KEY,
    form_code VARCHAR(20) NOT NULL UNIQUE,
    form_name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    tracks_temperature BOOLEAN DEFAULT FALSE,
    tracks_moisture BOOLEAN DEFAULT FALSE,
    tracks_density BOOLEAN DEFAULT FALSE,
    default_weight_unit VARCHAR(20) DEFAULT 'KG',
    default_volume_unit VARCHAR(20),
    requires_temperature_control BOOLEAN DEFAULT FALSE,
    min_storage_temp DECIMAL(10,2),
    max_storage_temp DECIMAL(10,2),
    requires_humidity_control BOOLEAN DEFAULT FALSE,
    max_humidity_percent INT,
    requires_special_handling BOOLEAN DEFAULT FALSE,
    handling_notes VARCHAR(500),
    shelf_life_days INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- =====================================================
-- PART B: ROUTING (4 routings for processes 1-4)
-- =====================================================

INSERT INTO routing (routing_id, process_id, routing_name, routing_type, status, created_by)
SELECT 1, 1, 'HR Coil Standard Route', 'SEQUENTIAL', 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM routing WHERE routing_id = 1);

INSERT INTO routing (routing_id, process_id, routing_name, routing_type, status, created_by)
SELECT 2, 2, 'CR Sheet Standard Route', 'SEQUENTIAL', 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM routing WHERE routing_id = 2);

INSERT INTO routing (routing_id, process_id, routing_name, routing_type, status, created_by)
SELECT 3, 3, 'Rebar Standard Route', 'SEQUENTIAL', 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM routing WHERE routing_id = 3);

INSERT INTO routing (routing_id, process_id, routing_name, routing_type, status, created_by)
SELECT 4, 4, 'Billet Standard Route', 'SEQUENTIAL', 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM routing WHERE routing_id = 4);

SELECT setval('routing_routing_id_seq', (SELECT COALESCE(MAX(routing_id), 1) FROM routing));


-- =====================================================
-- PART C: ROUTING STEPS (22 steps across 4 routes)
-- =====================================================

-- HR Coil Route: Charging -> EAF -> LF -> Slab Cast -> Reheat -> Rough -> Finish -> Cool
INSERT INTO routing_steps (routing_step_id, routing_id, operation_template_id, sequence_number, mandatory_flag, produces_output_batch, status, created_by)
SELECT v.* FROM (VALUES
  (1::bigint,  1::bigint, 1::bigint,  1::int, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (2,  1, 2,  2, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (3,  1, 3,  3, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  (4,  1, 4,  4, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  (5,  1, 6,  5, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (6,  1, 7,  6, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (7,  1, 8,  7, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (8,  1, 9,  8, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  -- CR Sheet Route: Pickling -> Cold Rolling -> Annealing
  (9,  2, 10, 1, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  (10, 2, 11, 2, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  (11, 2, 12, 3, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  -- Rebar Route: Charging -> EAF -> LF -> Billet Cast -> Billet Reheat -> Bar Roll -> QT
  (12, 3, 1,  1, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (13, 3, 2,  2, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (14, 3, 3,  3, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  (15, 3, 5,  4, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  (16, 3, 13, 5, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (17, 3, 14, 6, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (18, 3, 15, 7, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  -- Billet Route: Charging -> EAF -> LF -> Billet Cast
  (19, 4, 1,  1, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (20, 4, 2,  2, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),
  (21, 4, 3,  3, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),
  (22, 4, 5,  4, TRUE, TRUE,  'ACTIVE', 'SYSTEM')
) AS v(routing_step_id, routing_id, operation_template_id, sequence_number, mandatory_flag, produces_output_batch, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM routing_steps WHERE routing_step_id = 1);

SELECT setval('routing_steps_routing_step_id_seq', (SELECT COALESCE(MAX(routing_step_id), 1) FROM routing_steps));


-- =====================================================
-- PART D: BILL OF MATERIALS (88 BOM nodes, 8 product trees)
-- Uses material_id codes matching batches/inventory in patch 002
-- Uses product_sku codes matching order_line_items in patch 002
-- =====================================================

-- BOM 1: HR-COIL-2MM -- 5-level tree
INSERT INTO bill_of_material (bom_id, product_sku, bom_version, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, parent_bom_id, status, created_by)
SELECT v.* FROM (VALUES
  (1::bigint,  'HR-COIL-2MM', 'V1', 'FG-HR-2MM',    'Finished HR Coil 2mm',     1.0000, 'T',  0.98,   1, NULL::bigint, 'ACTIVE', 'SYSTEM'),
  (2,  'HR-COIL-2MM', 'V1', 'IM-HR-ROUGH',  'Hot Rolled Strip',         1.0500, 'T',  0.95,   2, 1,    'ACTIVE', 'SYSTEM'),
  (3,  'HR-COIL-2MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0200, 'L',  1.00,   2, 1,    'ACTIVE', 'SYSTEM'),
  (4,  'HR-COIL-2MM', 'V1', 'IM-SLAB',      'Steel Slab 200mm',         1.1200, 'T',  0.93,   3, 2,    'ACTIVE', 'SYSTEM'),
  (5,  'HR-COIL-2MM', 'V1', 'RM-ROLL-LUB',  'Rolling Lubricant',        0.0100, 'L',  1.00,   3, 2,    'ACTIVE', 'SYSTEM'),
  (6,  'HR-COIL-2MM', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.1800, 'T',  0.88,   4, 4,    'ACTIVE', 'SYSTEM'),
  (7,  'HR-COIL-2MM', 'V1', 'RM-MOLD-PWD',  'Mold Powder',              0.0050, 'KG', 1.00,   4, 4,    'ACTIVE', 'SYSTEM'),
  (8,  'HR-COIL-2MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7000, 'T',  0.95,   5, 6,    'ACTIVE', 'SYSTEM'),
  (9,  'HR-COIL-2MM', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.2000, 'T',  0.92,   5, 6,    'ACTIVE', 'SYSTEM'),
  (10, 'HR-COIL-2MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1500, 'T',  0.97,   5, 6,    'ACTIVE', 'SYSTEM'),
  (11, 'HR-COIL-2MM', 'V1', 'RM-LIMESTONE', 'Limestone',                0.0800, 'T',  1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
  (12, 'HR-COIL-2MM', 'V1', 'RM-FESI',      'Ferroalloy FeSi',          0.0050, 'KG', 1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
  (13, 'HR-COIL-2MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.1000, 'T',  1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
  (14, 'HR-COIL-2MM', 'V1', 'RM-GRAPHITE',  'Graphite Electrodes',      0.0030, 'EA', 0.85,   5, 6,    'ACTIVE', 'SYSTEM'),

  -- BOM 2: CR-SHEET-1MM -- 6-level tree
  (15, 'CR-SHEET-1MM', 'V1', 'FG-CR-1MM',    'Finished CR Sheet 1mm',    1.0000, 'T',  0.97,   1, NULL, 'ACTIVE', 'SYSTEM'),
  (16, 'CR-SHEET-1MM', 'V1', 'IM-ANNEALED',  'Annealed CR Strip',        1.0300, 'T',  0.97,   2, 15,   'ACTIVE', 'SYSTEM'),
  (17, 'CR-SHEET-1MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0150, 'L',  1.00,   2, 15,   'ACTIVE', 'SYSTEM'),
  (18, 'CR-SHEET-1MM', 'V1', 'IM-CR-STRIP',  'Cold Rolled Strip',        1.0800, 'T',  0.94,   3, 16,   'ACTIVE', 'SYSTEM'),
  (19, 'CR-SHEET-1MM', 'V1', 'IM-PICKLED',   'Pickled HR Strip',         1.1200, 'T',  0.96,   4, 18,   'ACTIVE', 'SYSTEM'),
  (20, 'CR-SHEET-1MM', 'V1', 'RM-ROLL-LUB',  'CR Rolling Lubricant',     0.0200, 'L',  1.00,   4, 18,   'ACTIVE', 'SYSTEM'),
  (21, 'CR-SHEET-1MM', 'V1', 'IM-HR-ROUGH',  'HR Coil Base',             1.1500, 'T',  0.93,   5, 19,   'ACTIVE', 'SYSTEM'),
  (22, 'CR-SHEET-1MM', 'V1', 'RM-HCL',       'Hydrochloric Acid',        0.0500, 'L',  1.00,   5, 19,   'ACTIVE', 'SYSTEM'),
  (23, 'CR-SHEET-1MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7500, 'T',  0.95,   6, 21,   'ACTIVE', 'SYSTEM'),
  (24, 'CR-SHEET-1MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.2000, 'T',  0.97,   6, 21,   'ACTIVE', 'SYSTEM'),
  (25, 'CR-SHEET-1MM', 'V1', 'RM-FESI',      'Ferroalloy FeSi',          0.0050, 'KG', 1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
  (26, 'CR-SHEET-1MM', 'V1', 'RM-LIMESTONE', 'Limestone',                0.0600, 'T',  1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
  (27, 'CR-SHEET-1MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.0800, 'T',  1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
  (28, 'CR-SHEET-1MM', 'V1', 'RM-AL-WIRE',   'Aluminum Wire',            0.0030, 'KG', 1.00,   6, 21,   'ACTIVE', 'SYSTEM'),

  -- BOM 3: REBAR-10MM -- 5-level tree
  (29, 'REBAR-10MM', 'V1', 'FG-REBAR-10',    'Finished Rebar 10mm',      1.0000, 'T',  0.99,   1, NULL, 'ACTIVE', 'SYSTEM'),
  (30, 'REBAR-10MM', 'V1', 'IM-ROLLED-BAR',  'Rolled Bar',               1.0400, 'T',  0.96,   2, 29,   'ACTIVE', 'SYSTEM'),
  (31, 'REBAR-10MM', 'V1', 'IM-BILLET',      'Steel Billet 100mm',       1.1000, 'T',  0.93,   3, 30,   'ACTIVE', 'SYSTEM'),
  (32, 'REBAR-10MM', 'V1', 'RM-ROLL-LUB',    'Bar Rolling Lubricant',    0.0050, 'L',  1.00,   3, 30,   'ACTIVE', 'SYSTEM'),
  (33, 'REBAR-10MM', 'V1', 'IM-LIQUID',      'Liquid Steel',             1.1500, 'T',  0.90,   4, 31,   'ACTIVE', 'SYSTEM'),
  (34, 'REBAR-10MM', 'V1', 'RM-LIMESTONE',   'Limestone',                0.0400, 'T',  1.00,   4, 31,   'ACTIVE', 'SYSTEM'),
  (35, 'REBAR-10MM', 'V1', 'RM-SCRAP-A',     'Steel Scrap Grade A',      0.8000, 'T',  0.94,   5, 33,   'ACTIVE', 'SYSTEM'),
  (36, 'REBAR-10MM', 'V1', 'RM-SCRAP-B',     'Steel Scrap Grade B',      0.1800, 'T',  0.92,   5, 33,   'ACTIVE', 'SYSTEM'),
  (37, 'REBAR-10MM', 'V1', 'RM-FEMN',        'Ferroalloy FeMn',          0.0080, 'KG', 1.00,   5, 33,   'ACTIVE', 'SYSTEM'),
  (38, 'REBAR-10MM', 'V1', 'RM-COAL',        'Coal / Coke',              0.0900, 'T',  1.00,   5, 33,   'ACTIVE', 'SYSTEM'),

  -- BOM 4: HR-COIL-3MM -- 5-level tree
  (39, 'HR-COIL-3MM', 'V1', 'FG-HR-2MM',    'Finished HR Coil 3mm',     1.0000, 'T',  0.98,   1, NULL, 'ACTIVE', 'SYSTEM'),
  (40, 'HR-COIL-3MM', 'V1', 'IM-HR-ROUGH',  'Hot Rolled Strip',         1.0600, 'T',  0.94,   2, 39,   'ACTIVE', 'SYSTEM'),
  (41, 'HR-COIL-3MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0180, 'L',  1.00,   2, 39,   'ACTIVE', 'SYSTEM'),
  (42, 'HR-COIL-3MM', 'V1', 'IM-SLAB',      'Steel Slab 200mm',         1.1400, 'T',  0.92,   3, 40,   'ACTIVE', 'SYSTEM'),
  (43, 'HR-COIL-3MM', 'V1', 'RM-ROLL-LUB',  'Rolling Lubricant',        0.0120, 'L',  1.00,   3, 40,   'ACTIVE', 'SYSTEM'),
  (44, 'HR-COIL-3MM', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.2000, 'T',  0.87,   4, 42,   'ACTIVE', 'SYSTEM'),
  (45, 'HR-COIL-3MM', 'V1', 'RM-MOLD-PWD',  'Mold Powder',              0.0055, 'KG', 1.00,   4, 42,   'ACTIVE', 'SYSTEM'),
  (46, 'HR-COIL-3MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7200, 'T',  0.95,   5, 44,   'ACTIVE', 'SYSTEM'),
  (47, 'HR-COIL-3MM', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.1800, 'T',  0.92,   5, 44,   'ACTIVE', 'SYSTEM'),
  (48, 'HR-COIL-3MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1600, 'T',  0.97,   5, 44,   'ACTIVE', 'SYSTEM'),
  (49, 'HR-COIL-3MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.1100, 'T',  1.00,   5, 44,   'ACTIVE', 'SYSTEM'),

  -- BOM 5: HR-COIL-4MM -- 5-level tree
  (50, 'HR-COIL-4MM', 'V1', 'FG-HR-2MM',    'Finished HR Coil 4mm',     1.0000, 'T',  0.98,   1, NULL, 'ACTIVE', 'SYSTEM'),
  (51, 'HR-COIL-4MM', 'V1', 'IM-HR-ROUGH',  'Hot Rolled Strip',         1.0700, 'T',  0.93,   2, 50,   'ACTIVE', 'SYSTEM'),
  (52, 'HR-COIL-4MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0160, 'L',  1.00,   2, 50,   'ACTIVE', 'SYSTEM'),
  (53, 'HR-COIL-4MM', 'V1', 'IM-SLAB',      'Steel Slab 200mm',         1.1600, 'T',  0.91,   3, 51,   'ACTIVE', 'SYSTEM'),
  (54, 'HR-COIL-4MM', 'V1', 'RM-ROLL-LUB',  'Rolling Lubricant',        0.0140, 'L',  1.00,   3, 51,   'ACTIVE', 'SYSTEM'),
  (55, 'HR-COIL-4MM', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.2200, 'T',  0.86,   4, 53,   'ACTIVE', 'SYSTEM'),
  (56, 'HR-COIL-4MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7500, 'T',  0.94,   5, 55,   'ACTIVE', 'SYSTEM'),
  (57, 'HR-COIL-4MM', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.1500, 'T',  0.92,   5, 55,   'ACTIVE', 'SYSTEM'),
  (58, 'HR-COIL-4MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1700, 'T',  0.97,   5, 55,   'ACTIVE', 'SYSTEM'),
  (59, 'HR-COIL-4MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.1200, 'T',  1.00,   5, 55,   'ACTIVE', 'SYSTEM'),

  -- BOM 6: CR-SHEET-2MM -- 6-level tree
  (60, 'CR-SHEET-2MM', 'V1', 'FG-CR-1MM',    'Finished CR Sheet 2mm',    1.0000, 'T',  0.97,   1, NULL, 'ACTIVE', 'SYSTEM'),
  (61, 'CR-SHEET-2MM', 'V1', 'IM-ANNEALED',  'Annealed CR Strip',        1.0400, 'T',  0.96,   2, 60,   'ACTIVE', 'SYSTEM'),
  (62, 'CR-SHEET-2MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0140, 'L',  1.00,   2, 60,   'ACTIVE', 'SYSTEM'),
  (63, 'CR-SHEET-2MM', 'V1', 'IM-CR-STRIP',  'Cold Rolled Strip',        1.0900, 'T',  0.93,   3, 61,   'ACTIVE', 'SYSTEM'),
  (64, 'CR-SHEET-2MM', 'V1', 'IM-PICKLED',   'Pickled HR Strip',         1.1300, 'T',  0.95,   4, 63,   'ACTIVE', 'SYSTEM'),
  (65, 'CR-SHEET-2MM', 'V1', 'RM-ROLL-LUB',  'CR Rolling Lubricant',     0.0180, 'L',  1.00,   4, 63,   'ACTIVE', 'SYSTEM'),
  (66, 'CR-SHEET-2MM', 'V1', 'IM-HR-ROUGH',  'HR Coil Base',             1.1600, 'T',  0.92,   5, 64,   'ACTIVE', 'SYSTEM'),
  (67, 'CR-SHEET-2MM', 'V1', 'RM-HCL',       'Hydrochloric Acid',        0.0450, 'L',  1.00,   5, 64,   'ACTIVE', 'SYSTEM'),
  (68, 'CR-SHEET-2MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7800, 'T',  0.95,   6, 66,   'ACTIVE', 'SYSTEM'),
  (69, 'CR-SHEET-2MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1800, 'T',  0.97,   6, 66,   'ACTIVE', 'SYSTEM'),
  (70, 'CR-SHEET-2MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.0900, 'T',  1.00,   6, 66,   'ACTIVE', 'SYSTEM'),

  -- BOM 7: REBAR-12MM -- 5-level tree
  (71, 'REBAR-12MM', 'V1', 'FG-REBAR-10',    'Finished Rebar 12mm',      1.0000, 'T',  0.99,   1, NULL, 'ACTIVE', 'SYSTEM'),
  (72, 'REBAR-12MM', 'V1', 'IM-ROLLED-BAR',  'Rolled Bar',               1.0500, 'T',  0.95,   2, 71,   'ACTIVE', 'SYSTEM'),
  (73, 'REBAR-12MM', 'V1', 'IM-BILLET',      'Steel Billet 100mm',       1.1100, 'T',  0.92,   3, 72,   'ACTIVE', 'SYSTEM'),
  (74, 'REBAR-12MM', 'V1', 'RM-ROLL-LUB',    'Bar Rolling Lubricant',    0.0060, 'L',  1.00,   3, 72,   'ACTIVE', 'SYSTEM'),
  (75, 'REBAR-12MM', 'V1', 'IM-LIQUID',      'Liquid Steel',             1.1600, 'T',  0.89,   4, 73,   'ACTIVE', 'SYSTEM'),
  (76, 'REBAR-12MM', 'V1', 'RM-LIMESTONE',   'Limestone',                0.0450, 'T',  1.00,   4, 73,   'ACTIVE', 'SYSTEM'),
  (77, 'REBAR-12MM', 'V1', 'RM-SCRAP-A',     'Steel Scrap Grade A',      0.8200, 'T',  0.94,   5, 75,   'ACTIVE', 'SYSTEM'),
  (78, 'REBAR-12MM', 'V1', 'RM-SCRAP-B',     'Steel Scrap Grade B',      0.1600, 'T',  0.92,   5, 75,   'ACTIVE', 'SYSTEM'),
  (79, 'REBAR-12MM', 'V1', 'RM-FEMN',        'Ferroalloy FeMn',          0.0090, 'KG', 1.00,   5, 75,   'ACTIVE', 'SYSTEM'),
  (80, 'REBAR-12MM', 'V1', 'RM-COAL',        'Coal / Coke',              0.0950, 'T',  1.00,   5, 75,   'ACTIVE', 'SYSTEM'),

  -- BOM 8: STEEL-BILLET-100 -- 3-level tree
  (81, 'STEEL-BILLET-100', 'V1', 'IM-BILLET',    'Steel Billet 100mm',       1.0000, 'T',  0.98,   1, NULL, 'ACTIVE', 'SYSTEM'),
  (82, 'STEEL-BILLET-100', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.0800, 'T',  0.92,   2, 81,   'ACTIVE', 'SYSTEM'),
  (83, 'STEEL-BILLET-100', 'V1', 'RM-MOLD-PWD',  'Mold Powder',              0.0040, 'KG', 1.00,   2, 81,   'ACTIVE', 'SYSTEM'),
  (84, 'STEEL-BILLET-100', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7000, 'T',  0.95,   3, 82,   'ACTIVE', 'SYSTEM'),
  (85, 'STEEL-BILLET-100', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.2500, 'T',  0.93,   3, 82,   'ACTIVE', 'SYSTEM'),
  (86, 'STEEL-BILLET-100', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1200, 'T',  0.97,   3, 82,   'ACTIVE', 'SYSTEM'),
  (87, 'STEEL-BILLET-100', 'V1', 'RM-LIMESTONE', 'Limestone',                0.0500, 'T',  1.00,   3, 82,   'ACTIVE', 'SYSTEM'),
  (88, 'STEEL-BILLET-100', 'V1', 'RM-COAL',      'Coal / Coke',              0.0800, 'T',  1.00,   3, 82,   'ACTIVE', 'SYSTEM')
) AS v(bom_id, product_sku, bom_version, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, parent_bom_id, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM bill_of_material WHERE bom_id = 1);

SELECT setval('bill_of_material_bom_id_seq', (SELECT COALESCE(MAX(bom_id), 1) FROM bill_of_material));


-- =====================================================
-- PART E: PRODUCTION CONFIRMATIONS (35 records)
-- =====================================================

INSERT INTO production_confirmation (confirmation_id, operation_id, produced_qty, scrap_qty, start_time, end_time, delay_minutes, delay_reason, notes, status, created_by)
SELECT v.* FROM (VALUES
  -- Order 1: Melting + Casting + Reheating
  (1::bigint,  1::bigint,  160::numeric,  3::numeric,   '2026-01-15 06:00:00'::timestamp, '2026-01-15 10:00:00'::timestamp, 0::int,  NULL::varchar,     'Scrap charging complete, 160T loaded', 'CONFIRMED', 'OP-001'),
  (2,  2,  155,  5,   '2026-01-15 10:30:00', '2026-01-15 16:00:00', 20, 'MAINTENANCE',     'EAF tap-to-tap 5.5hrs, electrode change', 'CONFIRMED', 'OP-001'),
  (3,  3,  152,  3,   '2026-01-15 16:30:00', '2026-01-15 19:00:00', 0,  NULL,              'Ladle refining - chemistry adjusted',  'CONFIRMED', 'OP-001'),
  (4,  4,  148,  4,   '2026-01-16 06:00:00', '2026-01-16 12:00:00', 15, 'EQUIP_BREAKDOWN', 'Slab casting, minor mold issue',       'CONFIRMED', 'OP-003'),
  (5,  5,  148,  0,   '2026-01-17 06:00:00', '2026-01-17 09:00:00', 0,  NULL,              'Slabs reheated to 1250C',              'CONFIRMED', 'OP-004'),
  -- Order 3: Rebar production
  (6,  12, 210,  5,   '2026-01-19 06:00:00', '2026-01-19 10:00:00', 0,  NULL,              'Rebar order scrap charge',             'CONFIRMED', 'OP-001'),
  (7,  13, 205,  5,   '2026-01-19 10:30:00', '2026-01-19 17:00:00', 30, 'QUALITY_ISSUE',   'Melting for rebar, temp correction',   'CONFIRMED', 'OP-001'),
  (8,  14, 200,  5,   '2026-01-20 06:00:00', '2026-01-20 09:00:00', 0,  NULL,              'Ladle refining complete',              'CONFIRMED', 'OP-001'),
  (9,  15, 195,  5,   '2026-01-20 10:00:00', '2026-01-20 18:00:00', 0,  NULL,              'Billet casting 100mm square',          'CONFIRMED', 'OP-003'),
  -- Order 5: All operations (completed order)
  (10, 19, 82,   1,   '2026-01-08 06:00:00', '2026-01-08 09:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
  (11, 20, 80,   2,   '2026-01-08 09:30:00', '2026-01-08 14:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
  (12, 21, 79,   1,   '2026-01-08 14:30:00', '2026-01-08 17:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
  (13, 22, 77,   2,   '2026-01-09 06:00:00', '2026-01-09 12:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-003'),
  (14, 23, 77,   0,   '2026-01-10 06:00:00', '2026-01-10 09:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
  (15, 24, 76,   1,   '2026-01-10 09:30:00', '2026-01-10 13:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
  (16, 25, 75.5, 0.5, '2026-01-10 13:30:00', '2026-01-10 17:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
  (17, 26, 75,   0.5, '2026-01-11 06:00:00', '2026-01-11 10:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
  -- Order 12: Rebar 12mm (completed)
  (18, 32, 190,  5,   '2026-02-01 06:00:00', '2026-02-01 10:00:00', 0,  NULL,              'Scrap charging for rebar 12mm',        'CONFIRMED', 'OP-002'),
  (19, 33, 185,  5,   '2026-02-01 10:30:00', '2026-02-01 17:00:00', 0,  NULL,              'EAF melting completed',                'CONFIRMED', 'OP-002'),
  (20, 34, 182,  3,   '2026-02-02 06:00:00', '2026-02-02 09:00:00', 0,  NULL,              'Ladle refining',                       'CONFIRMED', 'OP-002'),
  (21, 35, 178,  4,   '2026-02-02 10:00:00', '2026-02-02 18:00:00', 0,  NULL,              'Billet casting',                       'CONFIRMED', 'OP-003'),
  (22, 36, 178,  0,   '2026-02-03 06:00:00', '2026-02-03 08:00:00', 0,  NULL,              'Billet reheating',                     'CONFIRMED', 'OP-004'),
  (23, 37, 175,  3,   '2026-02-03 08:30:00', '2026-02-03 12:00:00', 0,  NULL,              'Bar rolling',                          'CONFIRMED', 'OP-004'),
  (24, 38, 175,  0,   '2026-02-03 12:30:00', '2026-02-03 14:00:00', 0,  NULL,              'Quenching & tempering',                'CONFIRMED', 'OP-004'),
  -- Order 13: HR Coil 4mm (completed)
  (25, 39, 130,  2,   '2026-02-04 06:00:00', '2026-02-04 10:00:00', 0,  NULL,              'Scrap charging',                       'CONFIRMED', 'OP-001'),
  (26, 40, 127,  3,   '2026-02-04 10:30:00', '2026-02-04 17:00:00', 0,  NULL,              'EAF melting',                          'CONFIRMED', 'OP-001'),
  (27, 41, 125,  2,   '2026-02-05 06:00:00', '2026-02-05 09:00:00', 0,  NULL,              'Ladle refining',                       'CONFIRMED', 'OP-001'),
  (28, 42, 122,  3,   '2026-02-05 10:00:00', '2026-02-05 18:00:00', 0,  NULL,              'Slab casting',                         'CONFIRMED', 'OP-003'),
  (29, 43, 122,  0,   '2026-02-06 06:00:00', '2026-02-06 09:00:00', 0,  NULL,              'Slab reheating',                       'CONFIRMED', 'OP-004'),
  (30, 44, 120,  2,   '2026-02-06 09:30:00', '2026-02-06 12:00:00', 0,  NULL,              'Rough rolling',                        'CONFIRMED', 'OP-004'),
  (31, 45, 118,  2,   '2026-02-06 12:30:00', '2026-02-06 15:00:00', 0,  NULL,              'Finish rolling',                       'CONFIRMED', 'OP-004'),
  (32, 46, 118,  0,   '2026-02-06 15:30:00', '2026-02-06 17:00:00', 0,  NULL,              'Cooling & coiling',                    'CONFIRMED', 'OP-004'),
  -- Order 11: In-progress confirmations
  (33, 49, 85,   2,   '2026-02-07 06:00:00', '2026-02-07 10:00:00', 0,  NULL,              'Scrap charging for HR coil',           'CONFIRMED', 'OP-011'),
  -- Partial confirmation
  (34, 55, 125,  5,   '2026-02-07 10:00:00', '2026-02-07 14:00:00', 0,  NULL,              'First batch - 125T of 250T',           'CONFIRMED', 'OP-001'),
  -- Recent confirmation
  (35, 29, 90,   2,   '2026-02-08 06:00:00', '2026-02-08 09:00:00', 0,  NULL,              'Pickling operation in progress',       'CONFIRMED', 'OP-005')
) AS v(confirmation_id, operation_id, produced_qty, scrap_qty, start_time, end_time, delay_minutes, delay_reason, notes, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM production_confirmation WHERE confirmation_id = 1);

SELECT setval('production_confirmation_confirmation_id_seq', (SELECT COALESCE(MAX(confirmation_id), 1) FROM production_confirmation));


-- =====================================================
-- PART F: CONFIRMATION EQUIPMENT (35 links)
-- =====================================================

INSERT INTO confirmation_equipment (confirmation_id, equipment_id)
SELECT v.confirmation_id, v.equipment_id FROM (VALUES
  (1::bigint, 1::bigint), (2, 1), (3, 4), (4, 6), (5, 8),
  (6, 2), (7, 2), (8, 4), (9, 7),
  (10, 1), (11, 1), (12, 4), (13, 6), (14, 8), (15, 8), (16, 8), (17, 8),
  (18, 2), (19, 2), (20, 5), (21, 7), (22, 8), (23, 12), (24, 12),
  (25, 1), (26, 1), (27, 4), (28, 6), (29, 8), (30, 8), (31, 8), (32, 8),
  (33, 2), (34, 1), (35, 13)
) AS v(confirmation_id, equipment_id)
WHERE NOT EXISTS (SELECT 1 FROM confirmation_equipment WHERE confirmation_id = 1 AND equipment_id = 1);


-- =====================================================
-- PART G: CONFIRMATION OPERATORS (35 links)
-- =====================================================

INSERT INTO confirmation_operators (confirmation_id, operator_id)
SELECT v.confirmation_id, v.operator_id FROM (VALUES
  (1::bigint, 1::bigint), (2, 1), (3, 1), (4, 3), (5, 4),
  (6, 1), (7, 1), (8, 1), (9, 3),
  (10, 1), (11, 1), (12, 1), (13, 3), (14, 4), (15, 4), (16, 4), (17, 4),
  (18, 2), (19, 2), (20, 2), (21, 3), (22, 4), (23, 4), (24, 4),
  (25, 1), (26, 1), (27, 1), (28, 3), (29, 4), (30, 4), (31, 4), (32, 4),
  (33, 11), (34, 1), (35, 5)
) AS v(confirmation_id, operator_id)
WHERE NOT EXISTS (SELECT 1 FROM confirmation_operators WHERE confirmation_id = 1 AND operator_id = 1);


-- =====================================================
-- PART H: HOLD RECORDS (12 holds - 8 active, 4 released)
-- =====================================================

INSERT INTO hold_records (hold_id, entity_type, entity_id, reason, comments, applied_by, applied_on, released_by, released_on, release_comments, status)
SELECT v.* FROM (VALUES
  -- Active holds
  (1::bigint,  'BATCH',     10::bigint, 'QUALITY_INVESTIGATION', 'Suspected contamination in scrap shipment - pending lab report',   'OP-006', '2026-01-25 10:00:00'::timestamp, NULL::varchar, NULL::timestamp, NULL::text, 'ACTIVE'),
  (2,  'INVENTORY', 39, 'QUALITY_INVESTIGATION', 'Chemical analysis failed - high sulfur content detected',          'OP-006', '2026-01-26 09:00:00', NULL, NULL, NULL, 'ACTIVE'),
  (3,  'INVENTORY', 41, 'QUALITY_INVESTIGATION', 'Surface defects found during slab inspection',                     'OP-007', '2026-01-27 14:00:00', NULL, NULL, NULL, 'ACTIVE'),
  (4,  'OPERATION', 27, 'MATERIAL_SHORTAGE',     'Waiting for scrap availability',                                   'OP-004', '2026-01-28 08:00:00', NULL, NULL, NULL, 'ACTIVE'),
  (5,  'BATCH',     27, 'SAFETY_CONCERN',        'Slab surface cracks detected - requires ultrasonic testing',       'OP-006', '2026-01-29 11:00:00', NULL, NULL, NULL, 'ACTIVE'),
  (6,  'EQUIPMENT', 13, 'SAFETY_CONCERN',        'Acid leak detected in pickling line - safety inspection required', 'OP-008', '2026-01-28 10:00:00', NULL, NULL, NULL, 'ACTIVE'),
  (7,  'ORDER',     8,  'CUSTOMER_REQUEST',      'Customer requested hold pending design review',                    'admin',  '2026-01-29 08:00:00', NULL, NULL, NULL, 'ACTIVE'),
  (8,  'BATCH',     42, 'SPEC_DEVIATION',        'Slab thickness out of specification - requires disposition',       'OP-006', '2026-02-01 09:00:00', NULL, NULL, NULL, 'ACTIVE'),
  -- Released holds
  (9,  'BATCH',     3,  'QUALITY_INVESTIGATION', 'Initial inspection found anomaly',                                 'OP-006', '2026-01-20 10:00:00', 'OP-007', '2026-01-21 14:00:00', 'Lab results clear - release approved', 'RELEASED'),
  (10, 'INVENTORY', 5,  'CONTAMINATION',         'Suspected moisture contamination',                                 'OP-006', '2026-01-22 09:00:00', 'OP-006', '2026-01-23 11:00:00', 'Moisture test passed - OK to use',     'RELEASED'),
  (11, 'OPERATION', 16, 'EQUIP_BREAKDOWN',       'Equipment maintenance required',                                   'OP-008', '2026-01-24 08:00:00', 'OP-008', '2026-01-25 16:00:00', 'Maintenance completed - equipment OK', 'RELEASED'),
  (12, 'EQUIPMENT', 3,  'SAFETY_CONCERN',        'Safety inspection for arc furnace',                                'OP-008', '2026-01-25 08:00:00', 'OP-008', '2026-01-26 10:00:00', 'Inspection passed - cleared for use',  'RELEASED')
) AS v(hold_id, entity_type, entity_id, reason, comments, applied_by, applied_on, released_by, released_on, release_comments, status)
WHERE NOT EXISTS (SELECT 1 FROM hold_records WHERE hold_id = 1);

SELECT setval('hold_records_hold_id_seq', (SELECT COALESCE(MAX(hold_id), 1) FROM hold_records));


-- =====================================================
-- PART I: UNIT OF MEASURE (14 units)
-- =====================================================

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'T', 'Metric Ton', 'WEIGHT', 2, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'T');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'KG', 'Kilogram', 'WEIGHT', 2, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'KG');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'LB', 'Pound', 'WEIGHT', 2, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'LB');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'G', 'Gram', 'WEIGHT', 3, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'G');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'L', 'Liter', 'VOLUME', 2, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'L');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'ML', 'Milliliter', 'VOLUME', 0, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'ML');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'GAL', 'Gallon', 'VOLUME', 2, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'GAL');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'M', 'Meter', 'LENGTH', 2, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'M');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'MM', 'Millimeter', 'LENGTH', 0, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'MM');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'CM', 'Centimeter', 'LENGTH', 1, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'CM');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'EA', 'Each', 'COUNT', 0, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'EA');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'PC', 'Piece', 'COUNT', 0, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'PC');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'HR', 'Hour', 'TIME', 2, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'HR');

INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active)
SELECT 'MIN', 'Minute', 'TIME', 0, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_of_measure WHERE unit_code = 'MIN');


-- =====================================================
-- PART J: UNIT CONVERSION (16 conversions)
-- =====================================================

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'T', 'KG', 1000.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'T' AND to_unit_code = 'KG');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'KG', 'T', 0.001, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'KG' AND to_unit_code = 'T');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'KG', 'LB', 2.20462, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'KG' AND to_unit_code = 'LB');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'LB', 'KG', 0.453592, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'LB' AND to_unit_code = 'KG');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'KG', 'G', 1000.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'KG' AND to_unit_code = 'G');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'G', 'KG', 0.001, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'G' AND to_unit_code = 'KG');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'L', 'ML', 1000.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'L' AND to_unit_code = 'ML');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'ML', 'L', 0.001, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'ML' AND to_unit_code = 'L');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'L', 'GAL', 0.264172, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'L' AND to_unit_code = 'GAL');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'GAL', 'L', 3.78541, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'GAL' AND to_unit_code = 'L');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'M', 'MM', 1000.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'M' AND to_unit_code = 'MM');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'MM', 'M', 0.001, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'MM' AND to_unit_code = 'M');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'M', 'CM', 100.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'M' AND to_unit_code = 'CM');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'CM', 'M', 0.01, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'CM' AND to_unit_code = 'M');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'HR', 'MIN', 60.0, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'HR' AND to_unit_code = 'MIN');

INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active)
SELECT 'MIN', 'HR', 0.0166667, TRUE
WHERE NOT EXISTS (SELECT 1 FROM unit_conversion WHERE from_unit_code = 'MIN' AND to_unit_code = 'HR');


-- =====================================================
-- PART K: EQUIPMENT TYPE CONFIGURATION (13 types)
-- =====================================================

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'BATCH', 'Batch Equipment', 'Equipment that processes discrete batches', 1, 500, 'T', NULL, NULL, 500, 24, TRUE, FALSE, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'BATCH');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'CONTINUOUS', 'Continuous Equipment', 'Equipment with continuous flow processing', 1, 100, 'T/hr', NULL, NULL, 720, 168, TRUE, FALSE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'CONTINUOUS');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'MELTING', 'Melting Furnace', 'Electric arc or induction furnaces for melting', 50, 200, 'T', 1500, 1700, 200, 12, TRUE, TRUE, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'MELTING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'REFINING', 'Refining Equipment', 'Ladle furnaces for secondary metallurgy', 50, 150, 'T', 1550, 1650, 300, 8, TRUE, TRUE, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'REFINING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'CASTING', 'Casting Machine', 'Continuous casters for slab/billet production', 20, 80, 'T/hr', 1500, 1550, 500, 168, TRUE, TRUE, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'CASTING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'HOT_ROLLING', 'Hot Rolling Mill', 'Mills for hot rolling slabs to coils/strips', 10, 50, 'T/hr', 900, 1250, 400, 168, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'HOT_ROLLING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'COLD_ROLLING', 'Cold Rolling Mill', 'Mills for cold reduction of strips', 5, 30, 'T/hr', NULL, NULL, 600, 168, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'COLD_ROLLING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'HEAT_TREATMENT', 'Heat Treatment', 'Furnaces for annealing, normalizing, tempering', 20, 100, 'T', 600, 900, 400, 48, TRUE, TRUE, FALSE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'HEAT_TREATMENT');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'PICKLING', 'Pickling Line', 'Acid pickling for scale removal', 10, 40, 'T/hr', 60, 90, 300, 168, TRUE, FALSE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'PICKLING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'COATING', 'Coating Line', 'Hot-dip galvanizing or other coating', 10, 50, 'T/hr', 450, 480, 400, 168, TRUE, FALSE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'COATING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'BAR_ROLLING', 'Bar Rolling Mill', 'Mills for rolling billets to bars/rebars', 20, 60, 'T/hr', 1000, 1150, 400, 168, TRUE, TRUE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'BAR_ROLLING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'WIRE_DRAWING', 'Wire Drawing', 'Machines for drawing wire from rod', 2, 20, 'T/hr', NULL, NULL, 500, 168, TRUE, FALSE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'WIRE_DRAWING');

INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active)
SELECT 'PACKAGING', 'Packaging Line', 'Equipment for strapping, labeling, packaging', 10, 100, 'T', NULL, NULL, 1000, 168, TRUE, FALSE, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_type_config WHERE equipment_type = 'PACKAGING');


-- =====================================================
-- PART L: INVENTORY FORM CONFIGURATION (9 forms)
-- =====================================================

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'SOLID', 'Solid', 'Solid materials (steel, scrap, slabs)', FALSE, FALSE, TRUE, 'T', NULL, FALSE, NULL, NULL, FALSE, NULL, FALSE, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'SOLID');

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'LIQUID', 'Liquid/Molten', 'Molten metals and liquid materials', TRUE, FALSE, TRUE, 'T', NULL, TRUE, 1500, 1700, FALSE, NULL, TRUE, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'LIQUID');

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'POWDER', 'Powder/Granular', 'Powders, fluxes, and granular materials', FALSE, TRUE, TRUE, 'KG', NULL, FALSE, NULL, NULL, TRUE, 60, TRUE, 365, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'POWDER');

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'COIL', 'Coil/Strip', 'Coiled sheet or strip products', FALSE, FALSE, FALSE, 'T', NULL, FALSE, NULL, NULL, TRUE, 70, FALSE, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'COIL');

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'SHEET', 'Sheet/Plate', 'Flat sheet or plate products', FALSE, FALSE, FALSE, 'T', NULL, FALSE, NULL, NULL, TRUE, 70, FALSE, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'SHEET');

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'BAR', 'Bar/Rod', 'Long products - bars, rods, rebars', FALSE, FALSE, FALSE, 'T', NULL, FALSE, NULL, NULL, FALSE, NULL, FALSE, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'BAR');

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'BILLET', 'Billet/Bloom', 'Semi-finished steel billets or blooms', FALSE, FALSE, FALSE, 'T', NULL, FALSE, NULL, NULL, FALSE, NULL, FALSE, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'BILLET');

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'CHEMICAL', 'Chemical/Acid', 'Chemicals, acids, and process fluids', TRUE, FALSE, TRUE, 'KG', 'L', TRUE, 10, 35, FALSE, NULL, TRUE, 180, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'CHEMICAL');

INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active)
SELECT 'GAS', 'Gas', 'Industrial gases (argon, nitrogen, oxygen)', TRUE, FALSE, FALSE, 'KG', 'L', TRUE, -200, 50, FALSE, NULL, TRUE, NULL, TRUE
WHERE NOT EXISTS (SELECT 1 FROM inventory_form_config WHERE form_code = 'GAS');


-- =====================================================
-- PART M: OPERATION EQUIPMENT USAGE (10 records)
-- =====================================================

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 1, 1, '2026-01-15 06:00:00'::timestamp, '2026-01-15 10:00:00'::timestamp, 1, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 1 AND equipment_id = 1);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 2, 1, '2026-01-15 10:30:00', '2026-01-15 16:00:00', 1, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 2 AND equipment_id = 1);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 3, 4, '2026-01-15 16:30:00', '2026-01-15 19:00:00', 1, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 3 AND equipment_id = 4);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 4, 6, '2026-01-16 06:00:00', '2026-01-16 12:00:00', 3, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 4 AND equipment_id = 6);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 5, 8, '2026-01-17 06:00:00', '2026-01-17 09:00:00', 4, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 5 AND equipment_id = 8);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 12, 2, '2026-01-19 06:00:00', '2026-01-19 10:00:00', 1, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 12 AND equipment_id = 2);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 13, 2, '2026-01-19 10:30:00', '2026-01-19 17:00:00', 1, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 13 AND equipment_id = 2);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 14, 4, '2026-01-20 06:00:00', '2026-01-20 09:00:00', 1, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 14 AND equipment_id = 4);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 15, 7, '2026-01-20 10:00:00', '2026-01-20 18:00:00', 3, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 15 AND equipment_id = 7);

INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by)
SELECT 29, 13, '2026-02-08 06:00:00', NULL, 5, 'LOGGED', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operation_equipment_usage WHERE operation_id = 29 AND equipment_id = 13);


-- =====================================================
-- PART N: INVENTORY MOVEMENT (12 records)
-- =====================================================

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 2, 1, 'CONSUME', 105, '2026-01-15 10:30:00'::timestamp, 'Consumed for EAF melting', 'EXECUTED', 'OP-001'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 2 AND inventory_id = 1 AND movement_type = 'CONSUME');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 2, 3, 'CONSUME', 30, '2026-01-15 10:30:00', 'Consumed for EAF melting', 'EXECUTED', 'OP-001'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 2 AND inventory_id = 3 AND movement_type = 'CONSUME');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 2, 4, 'CONSUME', 22, '2026-01-15 10:30:00', 'Consumed for EAF melting', 'EXECUTED', 'OP-001'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 2 AND inventory_id = 4 AND movement_type = 'CONSUME');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 2, 8, 'CONSUME', 15, '2026-01-15 10:30:00', 'Consumed for EAF melting', 'EXECUTED', 'OP-001'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 2 AND inventory_id = 8 AND movement_type = 'CONSUME');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 2, 19, 'PRODUCE', 165, '2026-01-15 16:00:00', 'Produced liquid steel', 'EXECUTED', 'OP-001'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 2 AND inventory_id = 19 AND movement_type = 'PRODUCE');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 4, 19, 'CONSUME', 155, '2026-01-16 06:00:00', 'Consumed for slab casting', 'EXECUTED', 'OP-003'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 4 AND inventory_id = 19 AND movement_type = 'CONSUME');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 4, 20, 'PRODUCE', 148, '2026-01-16 12:00:00', 'Produced steel slab', 'EXECUTED', 'OP-003'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 4 AND inventory_id = 20 AND movement_type = 'PRODUCE');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 13, 2, 'CONSUME', 160, '2026-01-19 10:30:00', 'Consumed for rebar melt', 'EXECUTED', 'OP-001'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 13 AND inventory_id = 2 AND movement_type = 'CONSUME');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 13, 22, 'PRODUCE', 205, '2026-01-19 17:00:00', 'Produced liquid steel', 'EXECUTED', 'OP-001'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 13 AND inventory_id = 22 AND movement_type = 'PRODUCE');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 15, 22, 'CONSUME', 200, '2026-01-20 10:00:00', 'Consumed for billet cast', 'EXECUTED', 'OP-003'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 15 AND inventory_id = 22 AND movement_type = 'CONSUME');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 15, 23, 'PRODUCE', 195, '2026-01-20 18:00:00', 'Produced steel billet', 'EXECUTED', 'OP-003'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 15 AND inventory_id = 23 AND movement_type = 'PRODUCE');

INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by)
SELECT 29, 22, 'CONSUME', 85, '2026-02-08 06:00:00', 'Consumed for pickling', 'EXECUTED', 'OP-005'
WHERE NOT EXISTS (SELECT 1 FROM inventory_movement WHERE operation_id = 29 AND inventory_id = 22 AND movement_type = 'CONSUME');


-- =====================================================
-- Summary of data added in this patch:
--   Tables created:     4 (equipment_type_config, unit_of_measure, unit_conversion, inventory_form_config)
--   Routing:            4 records
--   Routing Steps:      22 records
--   Bill of Material:   88 records (8 product BOM trees)
--   Prod Confirmations: 35 records
--   Confirm Equipment:  35 records
--   Confirm Operators:  35 records
--   Hold Records:       12 records (8 active, 4 released)
--   Units of Measure:   14 records
--   Unit Conversions:   16 records
--   Equip Type Config:  13 records
--   Inventory Form:     9 records
--   Op Equip Usage:     10 records
--   Inventory Movement: 12 records
-- =====================================================
