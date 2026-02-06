-- Patch 026: Batch Size Configuration
-- Per MES Batch Management Specification: configurable batch sizes for multi-batch creation

-- batch_size_config: Defines maximum batch size per material/operation type
-- When production quantity exceeds max_batch_size, multiple batches are created
CREATE TABLE IF NOT EXISTS batch_size_config (
    config_id SERIAL PRIMARY KEY,
    material_id VARCHAR(50),
    operation_type VARCHAR(50),
    equipment_type VARCHAR(50),
    product_sku VARCHAR(50),
    min_batch_size DECIMAL(15,4) DEFAULT 0,
    max_batch_size DECIMAL(15,4) NOT NULL,
    preferred_batch_size DECIMAL(15,4),
    unit VARCHAR(20) DEFAULT 'T',
    allow_partial_batch BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_batch_size_range CHECK (max_batch_size >= min_batch_size),
    CONSTRAINT chk_preferred_in_range CHECK (
        preferred_batch_size IS NULL OR
        (preferred_batch_size >= min_batch_size AND preferred_batch_size <= max_batch_size)
    )
);

-- Indexes for lookup performance
CREATE INDEX IF NOT EXISTS idx_batch_size_config_material ON batch_size_config(material_id);
CREATE INDEX IF NOT EXISTS idx_batch_size_config_operation ON batch_size_config(operation_type);
CREATE INDEX IF NOT EXISTS idx_batch_size_config_product ON batch_size_config(product_sku);
CREATE INDEX IF NOT EXISTS idx_batch_size_config_active ON batch_size_config(is_active);

-- Insert default configurations for common operation types
INSERT INTO batch_size_config (material_id, operation_type, max_batch_size, preferred_batch_size, unit, priority, created_by)
VALUES
    (NULL, 'MELTING', 50.0000, 45.0000, 'T', 10, 'SYSTEM'),
    (NULL, 'CASTING', 25.0000, 20.0000, 'T', 10, 'SYSTEM'),
    (NULL, 'ROLLING', 15.0000, 12.0000, 'T', 10, 'SYSTEM'),
    (NULL, 'ANNEALING', 30.0000, 25.0000, 'T', 10, 'SYSTEM'),
    (NULL, 'FINISHING', 10.0000, 8.0000, 'T', 10, 'SYSTEM')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE batch_size_config IS 'Configures batch size limits for multi-batch production confirmation';
COMMENT ON COLUMN batch_size_config.material_id IS 'Optional: Material-specific config (NULL for generic)';
COMMENT ON COLUMN batch_size_config.operation_type IS 'Optional: Operation type-specific config';
COMMENT ON COLUMN batch_size_config.equipment_type IS 'Optional: Equipment type-specific config';
COMMENT ON COLUMN batch_size_config.product_sku IS 'Optional: Product-specific config';
COMMENT ON COLUMN batch_size_config.min_batch_size IS 'Minimum batch size (prevents tiny batches)';
COMMENT ON COLUMN batch_size_config.max_batch_size IS 'Maximum batch size - triggers multi-batch when exceeded';
COMMENT ON COLUMN batch_size_config.preferred_batch_size IS 'Preferred batch size for optimization';
COMMENT ON COLUMN batch_size_config.allow_partial_batch IS 'Whether to allow partial batches (remainder)';
COMMENT ON COLUMN batch_size_config.priority IS 'Higher priority configs are applied first (most specific)';
