-- =====================================================
-- MES Production Confirmation - Equipment/Operator Fields
-- Patch: 003
-- Description: Add equipment_ids and operator_ids to production_confirmation
-- =====================================================

-- Add equipment_ids column (array of bigint)
ALTER TABLE production_confirmation
ADD COLUMN IF NOT EXISTS equipment_ids BIGINT[];

-- Add operator_ids column (array of bigint)
ALTER TABLE production_confirmation
ADD COLUMN IF NOT EXISTS operator_ids BIGINT[];

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_confirmation_equipment ON production_confirmation USING GIN (equipment_ids);
CREATE INDEX IF NOT EXISTS idx_confirmation_operators ON production_confirmation USING GIN (operator_ids);
