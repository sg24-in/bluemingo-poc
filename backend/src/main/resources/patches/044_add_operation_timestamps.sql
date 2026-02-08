-- Patch 044: Add start_time and end_time columns to operations table
-- These columns track when an operation execution started and ended
-- Part of the Template/Runtime separation work

-- Add start_time column
ALTER TABLE operations ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;

-- Add end_time column
ALTER TABLE operations ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;

-- Create index for time-based queries
CREATE INDEX IF NOT EXISTS idx_operations_start_time ON operations(start_time);
CREATE INDEX IF NOT EXISTS idx_operations_end_time ON operations(end_time);

-- Update existing operations that are COMPLETED to have end_time = updated_on
UPDATE operations
SET end_time = updated_on
WHERE status = 'COMPLETED'
  AND end_time IS NULL
  AND updated_on IS NOT NULL;

-- Update existing operations that are IN_PROGRESS to have start_time = created_on
UPDATE operations
SET start_time = created_on
WHERE status = 'IN_PROGRESS'
  AND start_time IS NULL
  AND created_on IS NOT NULL;
