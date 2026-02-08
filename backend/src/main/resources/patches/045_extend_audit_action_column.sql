-- Patch 045: Extend audit_trail action column
-- The action column needs to accommodate longer action types like 'BATCH_NUMBER_GENERATED' (22 chars)

-- Extend action column from VARCHAR(20) to VARCHAR(30)
ALTER TABLE audit_trail ALTER COLUMN action TYPE VARCHAR(30);
