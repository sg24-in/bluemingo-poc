-- Patch 023: Add process parameter values table
-- Stores actual parameter values captured during production confirmation

-- =====================================================
-- PROCESS PARAMETER VALUES TABLE - Captured parameter values
-- =====================================================
CREATE TABLE IF NOT EXISTS process_parameter_values (
    value_id SERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    config_id BIGINT REFERENCES process_parameters_config(config_id),
    parameter_name VARCHAR(100) NOT NULL,
    parameter_value DECIMAL(15,4),
    string_value VARCHAR(500),
    unit VARCHAR(20),
    min_limit DECIMAL(15,4),
    max_limit DECIMAL(15,4),
    is_within_spec BOOLEAN DEFAULT TRUE,
    deviation_reason VARCHAR(500),
    recorded_by VARCHAR(100),
    recorded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_param_values_confirmation ON process_parameter_values(confirmation_id);
CREATE INDEX IF NOT EXISTS idx_param_values_config ON process_parameter_values(config_id);
CREATE INDEX IF NOT EXISTS idx_param_values_name ON process_parameter_values(parameter_name);
CREATE INDEX IF NOT EXISTS idx_param_values_within_spec ON process_parameter_values(is_within_spec);

-- =====================================================
-- OPERATION PARAMETER TEMPLATES - Link operation types to required parameters
-- =====================================================
CREATE TABLE IF NOT EXISTS operation_parameter_templates (
    template_id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    config_id BIGINT NOT NULL REFERENCES process_parameters_config(config_id),
    is_mandatory BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    UNIQUE(operation_type, config_id),
    CONSTRAINT chk_op_param_template_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_op_param_template_type ON operation_parameter_templates(operation_type);
CREATE INDEX IF NOT EXISTS idx_op_param_template_config ON operation_parameter_templates(config_id);

-- =====================================================
-- CONSUMED MATERIALS TABLE - Detailed material consumption
-- (Alternative to JSONB rm_consumed in production_confirmation)
-- =====================================================
CREATE TABLE IF NOT EXISTS consumed_materials (
    consumption_id SERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    inventory_id BIGINT REFERENCES inventory(inventory_id),
    batch_id BIGINT REFERENCES batches(batch_id),
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    quantity_consumed DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    consumed_by VARCHAR(100),
    consumed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_consumed_mat_confirmation ON consumed_materials(confirmation_id);
CREATE INDEX IF NOT EXISTS idx_consumed_mat_inventory ON consumed_materials(inventory_id);
CREATE INDEX IF NOT EXISTS idx_consumed_mat_batch ON consumed_materials(batch_id);
CREATE INDEX IF NOT EXISTS idx_consumed_mat_material ON consumed_materials(material_id);

-- =====================================================
-- PRODUCED OUTPUTS TABLE - Detailed production output
-- =====================================================
CREATE TABLE IF NOT EXISTS produced_outputs (
    output_id SERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    batch_id BIGINT REFERENCES batches(batch_id),
    inventory_id BIGINT REFERENCES inventory(inventory_id),
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    quantity_produced DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    is_primary_output BOOLEAN DEFAULT TRUE,
    output_type VARCHAR(30) DEFAULT 'GOOD',
    produced_by VARCHAR(100),
    produced_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT chk_output_type CHECK (output_type IN ('GOOD', 'SCRAP', 'REWORK', 'BYPRODUCT'))
);

CREATE INDEX IF NOT EXISTS idx_produced_confirmation ON produced_outputs(confirmation_id);
CREATE INDEX IF NOT EXISTS idx_produced_batch ON produced_outputs(batch_id);
CREATE INDEX IF NOT EXISTS idx_produced_inventory ON produced_outputs(inventory_id);
CREATE INDEX IF NOT EXISTS idx_produced_type ON produced_outputs(output_type);
