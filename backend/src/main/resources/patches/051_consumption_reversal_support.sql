-- Patch 051: Add consumption reversal support (R-13)
-- Adds REVERSED status for production confirmations, REVERSAL movement type,
-- reversal tracking columns, and confirmation_id FK on batches

-- 1. Add reversal tracking columns to production_confirmation
ALTER TABLE production_confirmation ADD COLUMN IF NOT EXISTS reversed_by VARCHAR(100);
ALTER TABLE production_confirmation ADD COLUMN IF NOT EXISTS reversed_on TIMESTAMP;
ALTER TABLE production_confirmation ADD COLUMN IF NOT EXISTS reversal_reason VARCHAR(500);

-- 2. Update production_confirmation status constraint to include REVERSED
ALTER TABLE production_confirmation DROP CONSTRAINT IF EXISTS chk_confirm_status;
ALTER TABLE production_confirmation ADD CONSTRAINT chk_confirm_status
    CHECK (status IN ('CONFIRMED', 'PARTIALLY_CONFIRMED', 'REJECTED', 'PENDING_REVIEW', 'REVERSED'));

-- 3. Update inventory_movement type constraint to include REVERSAL
ALTER TABLE inventory_movement DROP CONSTRAINT IF EXISTS chk_movement_type;
ALTER TABLE inventory_movement ADD CONSTRAINT chk_movement_type
    CHECK (movement_type IN ('CONSUME', 'PRODUCE', 'HOLD', 'RELEASE', 'SCRAP', 'RECEIVE', 'TRANSFER', 'ADJUST', 'REVERSAL'));

-- 4. Add confirmation_id FK to batches for direct traceability
ALTER TABLE batches ADD COLUMN IF NOT EXISTS confirmation_id BIGINT;
CREATE INDEX IF NOT EXISTS idx_batches_confirmation_id ON batches(confirmation_id);
