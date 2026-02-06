-- Patch 026: Add material_id to batch_number_config
-- Purpose: Per MES Batch Number Specification Section 6, support material-level configuration
-- Configuration precedence: operation_type > material_id > product_sku > default

-- Add material_id column for material-level configuration
ALTER TABLE batch_number_config
ADD COLUMN IF NOT EXISTS material_id VARCHAR(100);

-- Create index for material lookups
CREATE INDEX IF NOT EXISTS idx_batch_config_material ON batch_number_config(material_id);

-- Add RM_RECEIPT configuration for raw material batch numbers
INSERT INTO batch_number_config (config_name, operation_type, material_id, product_sku, prefix, include_operation_code, operation_code_length, separator, date_format, include_date, sequence_length, sequence_reset, priority, created_by) VALUES
('RM_RECEIPT_DEFAULT', 'RM_RECEIPT', NULL, NULL, 'RM', TRUE, 20, '-', 'yyyyMMdd', TRUE, 3, 'DAILY', 100, 'SYSTEM')
ON CONFLICT (config_name) DO NOTHING;

-- Add comment explaining configuration precedence
COMMENT ON TABLE batch_number_config IS 'Batch number generation configuration. Precedence: operation_type (highest) > material_id > product_sku > default (lowest). Use priority column to fine-tune matching order.';
