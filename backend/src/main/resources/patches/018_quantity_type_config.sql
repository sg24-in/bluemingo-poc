-- Patch 018: QuantityTypeConfig table for configuring quantity precision per context
-- Defines whether quantities should be INTEGER or DECIMAL, precision, and rounding rules

CREATE TABLE IF NOT EXISTS quantity_type_config (
    config_id BIGSERIAL PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL UNIQUE,
    material_code VARCHAR(50),               -- NULL means all materials
    operation_type VARCHAR(50),              -- NULL means all operation types
    equipment_type VARCHAR(50),              -- NULL means all equipment types
    quantity_type VARCHAR(20) NOT NULL DEFAULT 'DECIMAL',  -- INTEGER or DECIMAL
    decimal_precision INTEGER NOT NULL DEFAULT 4,           -- Number of decimal places
    rounding_rule VARCHAR(20) NOT NULL DEFAULT 'HALF_UP',   -- HALF_UP, HALF_DOWN, CEILING, FLOOR, NONE
    min_quantity DECIMAL(15,4) DEFAULT 0,
    max_quantity DECIMAL(15,4),
    unit VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_qty_config_material ON quantity_type_config(material_code);
CREATE INDEX IF NOT EXISTS idx_qty_config_operation ON quantity_type_config(operation_type);
CREATE INDEX IF NOT EXISTS idx_qty_config_status ON quantity_type_config(status);

-- Insert default configurations
INSERT INTO quantity_type_config (config_name, material_code, operation_type, equipment_type, quantity_type, decimal_precision, rounding_rule, unit, created_by) VALUES
('DEFAULT_DECIMAL', NULL, NULL, NULL, 'DECIMAL', 4, 'HALF_UP', 'KG', 'SYSTEM'),
('INTEGER_COUNT', NULL, NULL, NULL, 'INTEGER', 0, 'NONE', 'PCS', 'SYSTEM'),
('FURNACE_WEIGHT', NULL, 'FURNACE', NULL, 'DECIMAL', 2, 'HALF_UP', 'MT', 'SYSTEM'),
('ROLLING_LENGTH', NULL, 'ROLLING', NULL, 'DECIMAL', 3, 'HALF_UP', 'M', 'SYSTEM');
