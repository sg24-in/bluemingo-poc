-- Patch 040: Template/Runtime Separation - OperationTemplate Entity
-- Per MES Consolidated Specification:
--   - Process = TEMPLATE (design-time only)
--   - Routing & RoutingStep = TEMPLATE
--   - OperationTemplate = TEMPLATE (NEW)
--   - Operation = RUNTIME execution instance
--
-- This patch:
-- 1. Creates operation_templates table (design-time)
-- 2. Adds operation_template_id FK to routing_steps
-- 3. Removes operation_id FK from routing_steps (breaks template→runtime reference)
-- 4. Fixes routing_steps status to template-appropriate values
-- 5. Adds operation_template_id FK to operations table

-- ============================================================
-- Step 1: Create operation_templates table (DESIGN-TIME)
-- ============================================================
CREATE TABLE IF NOT EXISTS operation_templates (
    operation_template_id BIGSERIAL PRIMARY KEY,
    operation_name VARCHAR(100) NOT NULL,
    operation_code VARCHAR(50),
    operation_type VARCHAR(50) NOT NULL,
    quantity_type VARCHAR(20) DEFAULT 'DISCRETE',
    default_equipment_type VARCHAR(50),
    description VARCHAR(500),
    estimated_duration_minutes INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_operation_template_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_operation_template_qty_type CHECK (quantity_type IN ('DISCRETE', 'BATCH', 'CONTINUOUS'))
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_op_template_status ON operation_templates(status);
CREATE INDEX IF NOT EXISTS idx_op_template_type ON operation_templates(operation_type);
CREATE INDEX IF NOT EXISTS idx_op_template_code ON operation_templates(operation_code);

-- ============================================================
-- Step 2: Migrate existing routing_step operation template data
-- ============================================================
-- Insert unique operation templates from existing routing_steps data
INSERT INTO operation_templates (operation_name, operation_code, operation_type, description, estimated_duration_minutes, status, created_by)
SELECT DISTINCT
    rs.operation_name,
    rs.operation_code,
    COALESCE(rs.operation_type, 'GENERAL'),
    rs.description,
    rs.estimated_duration_minutes,
    'ACTIVE',
    'SYSTEM'
FROM routing_steps rs
WHERE rs.operation_name IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM operation_templates ot
    WHERE ot.operation_name = rs.operation_name
      AND COALESCE(ot.operation_type, '') = COALESCE(rs.operation_type, '')
  );

-- ============================================================
-- Step 3: Add operation_template_id FK to routing_steps
-- ============================================================
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS operation_template_id BIGINT;

-- Create FK constraint
ALTER TABLE routing_steps DROP CONSTRAINT IF EXISTS fk_routing_step_op_template;
ALTER TABLE routing_steps ADD CONSTRAINT fk_routing_step_op_template
    FOREIGN KEY (operation_template_id) REFERENCES operation_templates(operation_template_id);

-- Link existing routing_steps to operation_templates
UPDATE routing_steps rs
SET operation_template_id = ot.operation_template_id
FROM operation_templates ot
WHERE rs.operation_name = ot.operation_name
  AND COALESCE(rs.operation_type, '') = COALESCE(ot.operation_type, '')
  AND rs.operation_template_id IS NULL;

-- ============================================================
-- Step 4: Remove operation_id FK from routing_steps
-- (Breaks template→runtime reference - this is the key fix)
-- ============================================================
-- Drop the FK constraint first
ALTER TABLE routing_steps DROP CONSTRAINT IF EXISTS fk_routing_step_operation;

-- Set operation_id to NULL (don't drop column yet for backward compat)
UPDATE routing_steps SET operation_id = NULL WHERE operation_id IS NOT NULL;

-- Comment: The operation_id column will be dropped in a future patch after
-- verifying all application code no longer references it

-- ============================================================
-- Step 5: Fix routing_steps status constraint
-- Template should use ACTIVE/INACTIVE, not runtime statuses
-- ============================================================
-- First, migrate existing runtime statuses to template-appropriate values
UPDATE routing_steps SET status = 'ACTIVE' WHERE status IN ('READY', 'IN_PROGRESS', 'COMPLETED');
UPDATE routing_steps SET status = 'INACTIVE' WHERE status = 'ON_HOLD';

-- Drop and recreate the constraint
ALTER TABLE routing_steps DROP CONSTRAINT IF EXISTS chk_routing_step_status;
ALTER TABLE routing_steps ADD CONSTRAINT chk_routing_step_status
    CHECK (status IN ('ACTIVE', 'INACTIVE'));

-- ============================================================
-- Step 6: Add operation_template_id FK to operations table
-- (Operations reference their source template for genealogy)
-- ============================================================
ALTER TABLE operations ADD COLUMN IF NOT EXISTS operation_template_id BIGINT;

-- Create FK constraint
ALTER TABLE operations DROP CONSTRAINT IF EXISTS fk_operation_op_template;
ALTER TABLE operations ADD CONSTRAINT fk_operation_op_template
    FOREIGN KEY (operation_template_id) REFERENCES operation_templates(operation_template_id);

-- Link existing operations to operation_templates via routing_steps
UPDATE operations o
SET operation_template_id = rs.operation_template_id
FROM routing_steps rs
WHERE o.routing_step_id = rs.routing_step_id
  AND rs.operation_template_id IS NOT NULL
  AND o.operation_template_id IS NULL;

-- Create index for FK
CREATE INDEX IF NOT EXISTS idx_operations_op_template ON operations(operation_template_id);

-- ============================================================
-- Step 7: Create index for routing_steps operation_template_id
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_routing_steps_op_template ON routing_steps(operation_template_id);

-- ============================================================
-- Step 8: Insert seed data for common operation templates
-- ============================================================
INSERT INTO operation_templates (operation_name, operation_code, operation_type, quantity_type, default_equipment_type, description, status, created_by)
VALUES
    ('Melting', 'MELT', 'FURNACE', 'BATCH', 'EAF', 'Steel melting in electric arc furnace', 'ACTIVE', 'SYSTEM'),
    ('Casting', 'CAST', 'CASTER', 'CONTINUOUS', 'CCM', 'Continuous casting of molten steel', 'ACTIVE', 'SYSTEM'),
    ('Hot Rolling', 'HROLL', 'ROLLING', 'BATCH', 'HSM', 'Hot strip mill rolling', 'ACTIVE', 'SYSTEM'),
    ('Cold Rolling', 'CROLL', 'ROLLING', 'BATCH', 'CRM', 'Cold rolling mill processing', 'ACTIVE', 'SYSTEM'),
    ('Annealing', 'ANNEAL', 'HEAT_TREATMENT', 'BATCH', 'ANNEAL', 'Heat treatment annealing process', 'ACTIVE', 'SYSTEM'),
    ('Galvanizing', 'GALV', 'COATING', 'CONTINUOUS', 'GAL', 'Hot-dip galvanizing line', 'ACTIVE', 'SYSTEM'),
    ('Slitting', 'SLIT', 'FINISHING', 'BATCH', 'SLITTER', 'Coil slitting operation', 'ACTIVE', 'SYSTEM'),
    ('Cut to Length', 'CTL', 'FINISHING', 'BATCH', 'CTL', 'Cut to length line', 'ACTIVE', 'SYSTEM'),
    ('Quality Inspection', 'QC', 'INSPECTION', 'DISCRETE', 'LAB', 'Quality control inspection', 'ACTIVE', 'SYSTEM'),
    ('Packaging', 'PACK', 'FINISHING', 'DISCRETE', 'PACK', 'Final packaging operation', 'ACTIVE', 'SYSTEM')
ON CONFLICT DO NOTHING;

-- Note: Patch completion is automatically logged by PatchService
