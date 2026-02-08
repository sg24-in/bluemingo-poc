-- Patch 038: Add RECEIPT to batch created_via constraint
-- Fixes constraint violation when receiving raw materials

-- Drop and recreate constraint with RECEIPT option
ALTER TABLE batches DROP CONSTRAINT IF EXISTS chk_batch_created_via;
ALTER TABLE batches ADD CONSTRAINT chk_batch_created_via
    CHECK (created_via IN ('PRODUCTION', 'SPLIT', 'MERGE', 'MANUAL', 'SYSTEM', 'RECEIPT'));

-- Update any existing batches that might have been manually fixed
UPDATE batches
SET created_via = 'RECEIPT'
WHERE created_via = 'MANUAL'
  AND supplier_id IS NOT NULL
  AND received_date IS NOT NULL;
