-- Patch 024: Batch Management Compliance
-- Implements batch quantity adjustment tracking per MES Batch Management Specification

-- 1. Batch quantity adjustments table (for corrections with audit trail)
CREATE TABLE IF NOT EXISTS batch_quantity_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    old_quantity DECIMAL(15,4) NOT NULL,
    new_quantity DECIMAL(15,4) NOT NULL,
    adjustment_reason VARCHAR(500) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL,
    adjusted_by VARCHAR(100) NOT NULL,
    adjusted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_adjustment_type CHECK (adjustment_type IN ('CORRECTION', 'INVENTORY_COUNT', 'DAMAGE', 'SCRAP_RECOVERY', 'SYSTEM'))
);

-- 2. Add soft delete columns to batch_relations for genealogy immutability
ALTER TABLE batch_relations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE batch_relations ADD COLUMN IF NOT EXISTS deleted_by VARCHAR(100);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_batch_adjustments_batch_id ON batch_quantity_adjustments(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_adjustments_type ON batch_quantity_adjustments(adjustment_type);
CREATE INDEX IF NOT EXISTS idx_batch_adjustments_date ON batch_quantity_adjustments(adjusted_on);

-- 4. Add batch_created_via column to track origin (PRODUCTION, SPLIT, MERGE, MANUAL)
ALTER TABLE batches ADD COLUMN IF NOT EXISTS created_via VARCHAR(50) DEFAULT 'MANUAL';

-- Update existing batches that were created via production
UPDATE batches
SET created_via = 'PRODUCTION'
WHERE generated_at_operation_id IS NOT NULL
  AND (created_via IS NULL OR created_via = 'MANUAL');

-- 5. Add constraint for batch creation tracking
ALTER TABLE batches DROP CONSTRAINT IF EXISTS chk_batch_created_via;
ALTER TABLE batches ADD CONSTRAINT chk_batch_created_via
    CHECK (created_via IN ('PRODUCTION', 'SPLIT', 'MERGE', 'MANUAL', 'SYSTEM'));
