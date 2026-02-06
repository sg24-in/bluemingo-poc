-- Patch 027: Batch Supplier Fields for RM Entry
-- Supports tracking supplier batch numbers and goods receipt information

-- Add supplier tracking fields to batches
ALTER TABLE batches ADD COLUMN IF NOT EXISTS supplier_batch_number VARCHAR(100);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS supplier_id VARCHAR(50);
ALTER TABLE batches ADD COLUMN IF NOT EXISTS received_date DATE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS receipt_notes VARCHAR(500);

-- Index for supplier lookups
CREATE INDEX IF NOT EXISTS idx_batches_supplier_batch ON batches(supplier_batch_number);
CREATE INDEX IF NOT EXISTS idx_batches_supplier_id ON batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_batches_received_date ON batches(received_date);

-- Note: inventory_movements table constraint update removed
-- The RECEIVE movement type will be added when InventoryMovement entity is used

COMMENT ON COLUMN batches.supplier_batch_number IS 'External batch number from supplier (for traceability)';
COMMENT ON COLUMN batches.supplier_id IS 'Supplier identifier (FK to suppliers if exists)';
COMMENT ON COLUMN batches.received_date IS 'Date material was received';
COMMENT ON COLUMN batches.receipt_notes IS 'Notes from goods receipt (delivery reference, etc.)';
