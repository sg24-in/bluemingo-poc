-- Patch 032: Cleanup orphan operations referencing non-existent processes
--
-- After the migration from process_instances to processes in patch 030,
-- some operations may reference process_id values that no longer exist.
-- This causes "Entity does not exist" errors when loading orders/operations.
--
-- This patch:
-- 1. Identifies orphan operations
-- 2. Creates placeholder processes for them OR sets process_id to NULL

-- Option A: Set process_id to NULL for orphan operations (safer)
UPDATE operations o
SET process_id = NULL
WHERE process_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM processes p WHERE p.process_id = o.process_id);

-- Option B: Create placeholder processes (if we want to keep process linkage)
-- Uncomment if needed:
-- INSERT INTO processes (process_id, process_name, status, created_by)
-- SELECT DISTINCT o.process_id, 'Migrated Process ' || o.process_id, 'READY', 'SYSTEM'
-- FROM operations o
-- WHERE o.process_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM processes p WHERE p.process_id = o.process_id)
-- ON CONFLICT (process_id) DO NOTHING;

-- Verify no orphans remain
-- SELECT COUNT(*) FROM operations o
-- WHERE o.process_id IS NOT NULL
--   AND NOT EXISTS (SELECT 1 FROM processes p WHERE p.process_id = o.process_id);
