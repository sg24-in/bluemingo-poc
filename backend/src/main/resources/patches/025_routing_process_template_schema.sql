-- Patch 025: Routing & Process Template Schema Changes
-- Phase 9A: Design-time/runtime separation for routing and process management
-- Per MES Routing/Process/Operation Gap Analysis

-- R01: Create process_templates table (design-time process definitions)
CREATE TABLE IF NOT EXISTS process_templates (
    process_template_id SERIAL PRIMARY KEY,
    template_name VARCHAR(100) NOT NULL,
    template_code VARCHAR(50) UNIQUE,
    description VARCHAR(500),
    product_sku VARCHAR(50),
    status VARCHAR(20) DEFAULT 'DRAFT',
    version VARCHAR(20) DEFAULT 'V1',
    effective_from DATE,
    effective_to DATE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_process_template_status CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUPERSEDED'))
);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_process_template_product ON process_templates(product_sku);
CREATE INDEX IF NOT EXISTS idx_process_template_status ON process_templates(status);

-- R02: Add batch behavior columns to routing_steps
-- These flags declare what batch operations are allowed at each step
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS produces_output_batch BOOLEAN DEFAULT true;
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS allows_split BOOLEAN DEFAULT false;
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS allows_merge BOOLEAN DEFAULT false;

-- R03: Add operation template fields to routing_steps
-- These define the operation that will be created when routing is instantiated
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS operation_name VARCHAR(100);
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS operation_type VARCHAR(50);
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS operation_code VARCHAR(50);
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS target_qty DECIMAL(15,4);
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS description VARCHAR(500);
ALTER TABLE routing_steps ADD COLUMN IF NOT EXISTS estimated_duration_minutes INTEGER;

-- R04: Add routing_step_id FK to operations (already exists - verify)
-- The column routing_step_id already exists in operations table (see Operation.java line 38-39)

-- R05: Update routing status check constraint to include DRAFT
-- Drop existing constraint if it exists
ALTER TABLE routing DROP CONSTRAINT IF EXISTS chk_routing_status;

-- Add the new constraint with DRAFT status
ALTER TABLE routing ADD CONSTRAINT chk_routing_status
    CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ON_HOLD'));

-- Add process_template_id to routing for linking to templates
ALTER TABLE routing ADD COLUMN IF NOT EXISTS process_template_id BIGINT REFERENCES process_templates(process_template_id);

-- Create index for routing-template relationship
CREATE INDEX IF NOT EXISTS idx_routing_template ON routing(process_template_id);

-- Seed initial process template for existing products (optional)
INSERT INTO process_templates (template_name, template_code, description, status, version)
SELECT DISTINCT
    p.stage_name || ' Template' as template_name,
    UPPER(REPLACE(p.stage_name, ' ', '_')) || '_TEMPLATE' as template_code,
    'Auto-generated template for ' || p.stage_name as description,
    'ACTIVE' as status,
    'V1' as version
FROM processes p
WHERE NOT EXISTS (
    SELECT 1 FROM process_templates pt
    WHERE pt.template_code = UPPER(REPLACE(p.stage_name, ' ', '_')) || '_TEMPLATE'
)
ON CONFLICT DO NOTHING;

-- Log patch completion
INSERT INTO database_patches (patch_name, applied_on, description)
VALUES ('025_routing_process_template_schema', CURRENT_TIMESTAMP,
        'Added process_templates table, batch behavior columns to routing_steps, operation template fields, and DRAFT status for routing')
ON CONFLICT (patch_name) DO NOTHING;
