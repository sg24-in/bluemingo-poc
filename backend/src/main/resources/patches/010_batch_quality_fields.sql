-- Patch 010: Add quality approval fields to batches table
-- This patch adds columns for tracking batch quality approval/rejection

-- Add quality approval tracking columns to batches table
ALTER TABLE batches ADD COLUMN IF NOT EXISTS approved_by VARCHAR(100);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS approved_on TIMESTAMP;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS rejection_reason VARCHAR(500);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS rejected_by VARCHAR(100);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS rejected_on TIMESTAMP;

-- Update the status check constraint to include new statuses
ALTER TABLE batches DROP CONSTRAINT IF EXISTS chk_batch_status;
ALTER TABLE batches ADD CONSTRAINT chk_batch_status
    CHECK (status IN ('AVAILABLE', 'CONSUMED', 'PRODUCED', 'ON_HOLD', 'BLOCKED', 'SCRAPPED', 'QUALITY_PENDING'));

-- Create index for quality pending status queries
CREATE INDEX IF NOT EXISTS idx_batches_quality_pending ON batches(status) WHERE status = 'QUALITY_PENDING';
