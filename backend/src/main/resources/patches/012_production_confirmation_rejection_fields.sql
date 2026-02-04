-- Patch 012: Add rejection fields to production_confirmation table
-- Adds fields for tracking production confirmation rejection

-- Add rejection tracking columns to production_confirmation table
ALTER TABLE production_confirmation ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
ALTER TABLE production_confirmation ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(100);
ALTER TABLE production_confirmation ADD COLUMN IF NOT EXISTS rejected_on TIMESTAMP;

-- Update status constraint to include PENDING_REVIEW
ALTER TABLE production_confirmation DROP CONSTRAINT IF EXISTS chk_confirm_status;
ALTER TABLE production_confirmation ADD CONSTRAINT chk_confirm_status
    CHECK (status IN ('CONFIRMED', 'PARTIALLY_CONFIRMED', 'REJECTED', 'PENDING_REVIEW'));
