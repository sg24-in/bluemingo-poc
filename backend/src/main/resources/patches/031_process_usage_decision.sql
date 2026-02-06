-- Patch 031: Add usage_decision column to processes table
--
-- The Process entity requires a usage_decision column for quality decisions.
-- This was present in the original processes table but was lost when
-- process_templates was renamed to processes in patch 028.

-- Add usage_decision column to processes table
ALTER TABLE processes ADD COLUMN IF NOT EXISTS usage_decision VARCHAR(20);

-- Add check constraint for valid values
ALTER TABLE processes DROP CONSTRAINT IF EXISTS chk_process_usage_decision;
ALTER TABLE processes ADD CONSTRAINT chk_process_usage_decision
    CHECK (usage_decision IS NULL OR usage_decision IN ('PENDING', 'ACCEPT', 'REJECT'));

-- Set default value for existing rows
UPDATE processes SET usage_decision = 'PENDING' WHERE usage_decision IS NULL;
