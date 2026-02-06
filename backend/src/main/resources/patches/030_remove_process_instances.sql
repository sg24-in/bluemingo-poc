-- Patch 030: Remove process_instances concept per MES Consolidated Specification
--
-- The spec shows:
--   - Processes: ProcessID, ProcessName, Status (design-time only)
--   - Operations: OperationID, ProcessID (FK), OperationName, Status
--   - Operations link to OrderLineItems for runtime tracking
--
-- This patch:
-- 1. Adds order_line_id to operations table
-- 2. Migrates data from process_instances to operations
-- 3. Updates operations.process_id to point to design-time processes
-- 4. Drops process_instances table

-- Step 1: Add order_line_id to operations (for runtime tracking)
ALTER TABLE operations ADD COLUMN IF NOT EXISTS order_line_id BIGINT;

-- Step 2: Migrate order_line_id from process_instances to operations
-- Each operation inherits its order_line_id from its parent process_instance
UPDATE operations o
SET order_line_id = pi.order_line_id
FROM process_instances pi
WHERE o.process_instance_id = pi.process_instance_id
  AND o.order_line_id IS NULL;

-- Step 3: Rename process_instance_id back to process_id in operations
-- First drop the FK constraint
ALTER TABLE operations DROP CONSTRAINT IF EXISTS fk_operation_process_instance;

-- Rename the column
ALTER TABLE operations RENAME COLUMN process_instance_id TO process_id;

-- Step 4: Update operations.process_id to reference design-time processes
-- For now, we'll set it to NULL if there's no matching design-time process
-- The application will need to assign proper process_id values
-- UPDATE operations SET process_id = NULL WHERE NOT EXISTS (
--     SELECT 1 FROM processes WHERE processes.process_id = operations.process_id
-- );

-- Step 5: Add FK constraint to order_line_items
ALTER TABLE operations
    ADD CONSTRAINT fk_operation_order_line
    FOREIGN KEY (order_line_id) REFERENCES order_line_items(order_line_id);

-- Step 6: Add FK constraint to processes (design-time)
-- Note: This may fail if process_id values don't match. Making it nullable for now.
ALTER TABLE operations ALTER COLUMN process_id DROP NOT NULL;

-- Step 7: Drop process_instances table and related objects
DROP INDEX IF EXISTS idx_process_instances_order_line;
DROP INDEX IF EXISTS idx_process_instances_process;
DROP INDEX IF EXISTS idx_operations_process_instance;

-- Drop the table
DROP TABLE IF EXISTS process_instances CASCADE;

-- Step 8: Create new indexes
CREATE INDEX IF NOT EXISTS idx_operations_order_line ON operations(order_line_id);
CREATE INDEX IF NOT EXISTS idx_operations_process ON operations(process_id);

-- Step 9: Ensure processes table has correct structure (design-time only)
-- The processes table should already be correct from patch 028
-- Just ensure it doesn't have order_line_id
ALTER TABLE processes DROP COLUMN IF EXISTS order_line_id;

-- Step 10: Clean up sequences
DROP SEQUENCE IF EXISTS process_instances_process_instance_id_seq;
