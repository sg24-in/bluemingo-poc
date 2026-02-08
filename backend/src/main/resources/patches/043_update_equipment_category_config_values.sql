-- =====================================================
-- Patch 033e: Update equipment_category_config values
-- =====================================================
-- Purpose: Updates category values to match the valid categories
-- defined in the equipment.equipment_category constraint
-- =====================================================

-- Delete entries that will become duplicates or already have target value
-- (ensures idempotency if patch is re-run)
DELETE FROM equipment_category_config WHERE equipment_category IN ('LADLE', 'CUTTING');
DELETE FROM equipment_category_config WHERE equipment_category = 'FURNACE' AND EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'MELTING');
DELETE FROM equipment_category_config WHERE equipment_category = 'CASTER' AND EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'CASTING');
DELETE FROM equipment_category_config WHERE equipment_category = 'ROLLING_MILL' AND EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'HOT_ROLLING');
DELETE FROM equipment_category_config WHERE equipment_category = 'CRANE' AND EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'GENERAL');

-- Update old type values to new category values (only if target doesn't exist)
UPDATE equipment_category_config SET equipment_category = 'MELTING' WHERE equipment_category = 'FURNACE' AND NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'MELTING');
UPDATE equipment_category_config SET equipment_category = 'CASTING' WHERE equipment_category = 'CASTER' AND NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'CASTING');
UPDATE equipment_category_config SET equipment_category = 'HOT_ROLLING' WHERE equipment_category = 'ROLLING_MILL' AND NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'HOT_ROLLING');
UPDATE equipment_category_config SET equipment_category = 'GENERAL' WHERE equipment_category = 'CRANE' AND NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'GENERAL');
-- HEAT_TREATMENT and INSPECTION already match

-- Update display names to be clearer
UPDATE equipment_category_config SET display_name = 'Melting Equipment (EAF/BOF)' WHERE equipment_category = 'MELTING';
UPDATE equipment_category_config SET display_name = 'Continuous Caster' WHERE equipment_category = 'CASTING';
UPDATE equipment_category_config SET display_name = 'Hot Rolling Mill' WHERE equipment_category = 'HOT_ROLLING';

-- Add missing categories
INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'REFINING', 'Ladle Furnace', 'Secondary refining equipment (AOD, LF)', 50, 300, 'TONS', 1450, 1650, 480, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'REFINING');

INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'COLD_ROLLING', 'Cold Rolling Mill', 'Cold reduction mill equipment', 1, 50, 'TONS', NULL, NULL, 360, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'COLD_ROLLING');

INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'ANNEALING', 'Annealing Furnace', 'Batch/continuous annealing equipment', 1, 100, 'TONS', 200, 800, 480, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'ANNEALING');

INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'PICKLING', 'Pickling Line', 'Acid pickling equipment', NULL, NULL, 'TONS', NULL, NULL, 240, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'PICKLING');

INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'BAR_ROLLING', 'Bar Rolling Mill', 'Bar/section rolling equipment', 1, 100, 'TONS', 900, 1200, 360, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'BAR_ROLLING');

INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'COATING', 'Coating Line', 'Galvanizing/coating equipment', NULL, NULL, 'TONS', 400, 500, 480, TRUE, TRUE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'COATING');

INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'WIRE_ROLLING', 'Wire Rod Mill', 'Wire rod rolling equipment', 1, 50, 'TONS', 900, 1100, 360, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'WIRE_ROLLING');

INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'FINISHING', 'Finishing Equipment', 'Slitting, leveling, cut-to-length', NULL, NULL, 'TONS', NULL, NULL, 168, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'FINISHING');

INSERT INTO equipment_category_config (equipment_category, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration)
SELECT 'PACKAGING', 'Packaging Equipment', 'Coil/bundle packaging equipment', NULL, NULL, 'PIECES', NULL, NULL, 168, TRUE, FALSE
WHERE NOT EXISTS (SELECT 1 FROM equipment_category_config WHERE equipment_category = 'PACKAGING');

-- Update the GENERAL entry
UPDATE equipment_category_config
SET display_name = 'General Purpose Equipment',
    description = 'General material handling and support equipment'
WHERE equipment_category = 'GENERAL';
