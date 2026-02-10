-- Patch 049: Add expiry_date to batches table
-- R-15: Track expiry dates for perishable materials

ALTER TABLE batches ADD COLUMN IF NOT EXISTS expiry_date DATE;

-- Index for querying batches by expiry date (find expiring soon)
CREATE INDEX IF NOT EXISTS idx_batches_expiry_date ON batches(expiry_date);

COMMENT ON COLUMN batches.expiry_date IS 'Expiry date for perishable materials (NULL if not applicable)';
