-- Patch 016: Fix BOM status constraint to include INACTIVE and DRAFT
-- The original constraint only allowed ACTIVE, OBSOLETE, ON_HOLD
-- but the application uses INACTIVE (soft delete) and DRAFT statuses

ALTER TABLE bill_of_material DROP CONSTRAINT IF EXISTS chk_bom_status;

ALTER TABLE bill_of_material ADD CONSTRAINT chk_bom_status
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'DRAFT', 'OBSOLETE', 'ON_HOLD'));
