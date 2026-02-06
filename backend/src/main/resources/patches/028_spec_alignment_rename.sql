-- Patch 028: Align with MES Consolidated Specification
-- Renames entities to match spec:
--   process_templates -> processes (design-time)
--   processes -> process_instances (runtime)

-- Step 1: Rename current processes table to process_instances (runtime entity)
ALTER TABLE IF EXISTS processes RENAME TO process_instances;

-- Step 2: Rename process_id column to process_instance_id in process_instances
ALTER TABLE process_instances RENAME COLUMN process_id TO process_instance_id;

-- Step 3: Rename stage_name to process_name in process_instances (for clarity)
-- The runtime instance inherits its name from the design-time process
ALTER TABLE process_instances ADD COLUMN IF NOT EXISTS process_name VARCHAR(100);

-- Copy stage_name to process_name if it exists
UPDATE process_instances SET process_name = stage_name WHERE process_name IS NULL;

-- Step 4: Add process_id FK to process_instances (link to design-time process)
ALTER TABLE process_instances ADD COLUMN IF NOT EXISTS process_id BIGINT;

-- Step 5: Rename process_templates table to processes (design-time entity)
ALTER TABLE IF EXISTS process_templates RENAME TO processes;

-- Step 6: Rename columns in processes (design-time)
ALTER TABLE processes RENAME COLUMN process_template_id TO process_id;
ALTER TABLE processes RENAME COLUMN template_name TO process_name;
ALTER TABLE processes RENAME COLUMN template_code TO process_code;

-- Step 7: Update sequences
-- Note: Sequence names depend on original table state. Use safe pattern.
-- First rename old processes sequence (now process_instances), then templates sequence
ALTER SEQUENCE IF EXISTS processes_process_id_seq RENAME TO process_instances_process_instance_id_seq;
-- Only rename templates sequence if it exists (created in patch 025)
ALTER SEQUENCE IF EXISTS process_templates_process_template_id_seq RENAME TO processes_process_id_seq;

-- Step 8: Update FK in process_instances to reference processes
ALTER TABLE process_instances
    ADD CONSTRAINT fk_process_instance_process
    FOREIGN KEY (process_id) REFERENCES processes(process_id);

-- Step 9: Update operations table FK reference
-- operations.process_id should now point to process_instances.process_instance_id
ALTER TABLE operations RENAME COLUMN process_id TO process_instance_id;

-- Add FK constraint (drop old one first if exists)
ALTER TABLE operations DROP CONSTRAINT IF EXISTS operations_process_id_fkey;
ALTER TABLE operations DROP CONSTRAINT IF EXISTS fk_operation_process;

ALTER TABLE operations
    ADD CONSTRAINT fk_operation_process_instance
    FOREIGN KEY (process_instance_id) REFERENCES process_instances(process_instance_id);

-- Step 10: Update routing table
-- routing.process_id should point to design-time processes
-- routing.process_template_id is now redundant (same as process_id)
ALTER TABLE routing DROP COLUMN IF EXISTS process_template_id;

-- The existing process_id in routing should now point to design-time processes
-- But currently it points to the old runtime processes table
-- We need to add a new FK for design-time
ALTER TABLE routing ADD COLUMN IF NOT EXISTS process_id_design BIGINT;

-- Update routing to point to design-time processes (for new data)
-- Existing data may need manual migration or default assignment

-- Step 11: Create indexes
CREATE INDEX IF NOT EXISTS idx_process_instances_process ON process_instances(process_id);
CREATE INDEX IF NOT EXISTS idx_process_instances_order_line ON process_instances(order_line_id);
CREATE INDEX IF NOT EXISTS idx_operations_process_instance ON operations(process_instance_id);

-- Step 12: Update views if any exist (none currently)

-- Note: Patch completion is automatically logged by PatchService
