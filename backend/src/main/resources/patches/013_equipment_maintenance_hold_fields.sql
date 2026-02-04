-- Patch 013: Add maintenance and hold tracking fields to equipment table
-- Supports equipment maintenance workflow and hold management

-- Add maintenance tracking columns
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_reason VARCHAR(500);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_start TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS maintenance_by VARCHAR(100);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS expected_maintenance_end TIMESTAMP;

-- Add hold tracking columns
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS hold_reason VARCHAR(500);
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS hold_start TIMESTAMP;
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS held_by VARCHAR(100);

-- Update status constraint to include UNAVAILABLE
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS chk_equipment_status;
ALTER TABLE equipment ADD CONSTRAINT chk_equipment_status
    CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'ON_HOLD', 'UNAVAILABLE'));

-- Create indexes for maintenance/hold queries
CREATE INDEX IF NOT EXISTS idx_equipment_maintenance ON equipment(maintenance_start) WHERE maintenance_start IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_equipment_hold ON equipment(hold_start) WHERE hold_start IS NOT NULL;
