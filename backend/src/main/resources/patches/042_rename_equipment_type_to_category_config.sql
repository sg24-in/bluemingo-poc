-- =====================================================
-- Patch 033d: Rename equipment_type_config to equipment_category_config
-- =====================================================
-- Purpose: Separates equipment classification:
--   - equipment_type: Processing mode (BATCH/CONTINUOUS) - stays on equipment table
--   - equipment_category: Equipment function (MELTING, CASTING, etc.) - validated by this config
-- =====================================================

-- Rename the table
ALTER TABLE IF EXISTS equipment_type_config RENAME TO equipment_category_config;

-- Rename the column to match new naming
ALTER TABLE equipment_category_config RENAME COLUMN equipment_type TO equipment_category;

-- Update the unique constraint name
ALTER TABLE equipment_category_config DROP CONSTRAINT IF EXISTS equipment_type_config_equipment_type_key;
ALTER TABLE equipment_category_config ADD CONSTRAINT equipment_category_config_equipment_category_key UNIQUE (equipment_category);

-- Add comment
COMMENT ON TABLE equipment_category_config IS 'Configuration for equipment functional categories (MELTING, CASTING, etc.)';
COMMENT ON COLUMN equipment_category_config.equipment_category IS 'Equipment functional category: MELTING, CASTING, ROLLING, etc.';
