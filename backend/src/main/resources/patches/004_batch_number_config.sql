-- Patch 004: Batch Number Configuration
-- Purpose: Add configurable batch number generation patterns
-- GAP-005 Implementation

-- Batch Number Configuration Table
CREATE TABLE IF NOT EXISTS batch_number_config (
    config_id BIGSERIAL PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL UNIQUE,
    operation_type VARCHAR(50),          -- NULL means default/fallback
    product_sku VARCHAR(100),            -- NULL means all products
    prefix VARCHAR(50) NOT NULL DEFAULT 'BATCH',
    include_operation_code BOOLEAN DEFAULT TRUE,
    operation_code_length INTEGER DEFAULT 2,
    separator VARCHAR(5) NOT NULL DEFAULT '-',
    date_format VARCHAR(20) DEFAULT 'yyyyMMdd',
    include_date BOOLEAN DEFAULT TRUE,
    sequence_length INTEGER NOT NULL DEFAULT 3,
    sequence_reset VARCHAR(20) DEFAULT 'DAILY',  -- DAILY, MONTHLY, YEARLY, NEVER
    priority INTEGER DEFAULT 100,        -- Lower = higher priority for matching
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100)
);

-- Batch Number Sequence Tracking Table
CREATE TABLE IF NOT EXISTS batch_number_sequence (
    sequence_id BIGSERIAL PRIMARY KEY,
    config_id BIGINT NOT NULL REFERENCES batch_number_config(config_id),
    sequence_key VARCHAR(200) NOT NULL,   -- Unique key for the sequence (e.g., prefix-date)
    current_value INTEGER NOT NULL DEFAULT 0,
    last_reset_on TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_id, sequence_key)
);

-- Create indexes
CREATE INDEX idx_batch_config_operation ON batch_number_config(operation_type);
CREATE INDEX idx_batch_config_product ON batch_number_config(product_sku);
CREATE INDEX idx_batch_config_priority ON batch_number_config(priority);
CREATE INDEX idx_batch_seq_key ON batch_number_sequence(sequence_key);

-- Insert default configurations
INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, include_operation_code, operation_code_length, separator, date_format, include_date, sequence_length, sequence_reset, priority, created_by) VALUES
-- Default configuration (lowest priority - fallback)
('DEFAULT', NULL, NULL, 'BATCH', TRUE, 2, '-', 'yyyyMMdd', TRUE, 3, 'DAILY', 999, 'SYSTEM'),

-- Operation-specific configurations
('FURNACE_OPERATION', 'FURNACE', NULL, 'FUR', TRUE, 2, '-', 'yyyyMMdd', TRUE, 3, 'DAILY', 100, 'SYSTEM'),
('CASTER_OPERATION', 'CASTER', NULL, 'CST', TRUE, 2, '-', 'yyyyMMdd', TRUE, 3, 'DAILY', 100, 'SYSTEM'),
('ROLLING_OPERATION', 'ROLLING', NULL, 'ROL', TRUE, 2, '-', 'yyyyMMdd', TRUE, 3, 'DAILY', 100, 'SYSTEM'),

-- Product-specific configuration (example for steel coil)
('STEEL_COIL_ROLLING', 'ROLLING', 'STEEL-COIL-001', 'SC', FALSE, 0, '-', 'yyMMdd', TRUE, 4, 'MONTHLY', 50, 'SYSTEM');

-- Split batch configuration
INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, include_operation_code, operation_code_length, separator, date_format, include_date, sequence_length, sequence_reset, priority, created_by) VALUES
('SPLIT_BATCH', 'SPLIT', NULL, 'SPL', FALSE, 0, '-', 'yyyyMMdd', TRUE, 3, 'DAILY', 100, 'SYSTEM');

-- Merge batch configuration
INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, include_operation_code, operation_code_length, separator, date_format, include_date, sequence_length, sequence_reset, priority, created_by) VALUES
('MERGE_BATCH', 'MERGE', NULL, 'MRG', FALSE, 0, '-', 'yyyyMMdd', TRUE, 3, 'DAILY', 100, 'SYSTEM');
