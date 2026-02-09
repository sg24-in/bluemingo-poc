-- Patch 004: Add material_id column to batch_number_config
-- This column enables material-level batch number configuration
-- Used by BatchNumberService.findMatchingConfig() for RM receipt numbering

ALTER TABLE batch_number_config ADD COLUMN IF NOT EXISTS material_id VARCHAR(100);

CREATE INDEX IF NOT EXISTS idx_batch_config_material ON batch_number_config(material_id);
