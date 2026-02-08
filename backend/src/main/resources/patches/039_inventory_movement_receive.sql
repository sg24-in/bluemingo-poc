-- Patch 039: Add RECEIVE to inventory_movement type constraint
-- Fixes constraint violation when receiving raw materials

-- Drop and recreate constraint with RECEIVE and TRANSFER options
ALTER TABLE inventory_movement DROP CONSTRAINT IF EXISTS chk_movement_type;
ALTER TABLE inventory_movement ADD CONSTRAINT chk_movement_type
    CHECK (movement_type IN ('CONSUME', 'PRODUCE', 'HOLD', 'RELEASE', 'SCRAP', 'RECEIVE', 'TRANSFER', 'ADJUST'));
