-- Patch 022: Add property and attribute tables for flexible configuration
-- These tables allow dynamic properties/attributes for materials, products, batches, etc.

-- =====================================================
-- 1. ATTRIBUTE DEFINITIONS TABLE - Define what attributes exist
-- =====================================================
CREATE TABLE IF NOT EXISTS attribute_definitions (
    attribute_id SERIAL PRIMARY KEY,
    attribute_code VARCHAR(50) NOT NULL UNIQUE,
    attribute_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    data_type VARCHAR(30) NOT NULL DEFAULT 'STRING',
    entity_type VARCHAR(50) NOT NULL,
    unit VARCHAR(20),
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    allowed_values TEXT,
    is_required BOOLEAN DEFAULT FALSE,
    is_searchable BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_attr_data_type CHECK (data_type IN ('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME', 'LIST')),
    CONSTRAINT chk_attr_entity_type CHECK (entity_type IN ('MATERIAL', 'PRODUCT', 'BATCH', 'EQUIPMENT', 'OPERATION', 'INVENTORY')),
    CONSTRAINT chk_attr_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_attr_def_code ON attribute_definitions(attribute_code);
CREATE INDEX IF NOT EXISTS idx_attr_def_entity ON attribute_definitions(entity_type);
CREATE INDEX IF NOT EXISTS idx_attr_def_status ON attribute_definitions(status);

-- =====================================================
-- 2. MATERIAL ATTRIBUTES TABLE - Attributes for materials
-- =====================================================
CREATE TABLE IF NOT EXISTS material_attributes (
    id SERIAL PRIMARY KEY,
    material_id BIGINT NOT NULL REFERENCES materials(material_id),
    attribute_id INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value VARCHAR(500),
    numeric_value DECIMAL(15,4),
    boolean_value BOOLEAN,
    date_value DATE,
    datetime_value TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    UNIQUE(material_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_mat_attr_material ON material_attributes(material_id);
CREATE INDEX IF NOT EXISTS idx_mat_attr_attribute ON material_attributes(attribute_id);

-- =====================================================
-- 3. PRODUCT ATTRIBUTES TABLE - Attributes for products
-- =====================================================
CREATE TABLE IF NOT EXISTS product_attributes (
    id SERIAL PRIMARY KEY,
    product_id BIGINT NOT NULL REFERENCES products(product_id),
    attribute_id INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value VARCHAR(500),
    numeric_value DECIMAL(15,4),
    boolean_value BOOLEAN,
    date_value DATE,
    datetime_value TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    UNIQUE(product_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_prod_attr_product ON product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_prod_attr_attribute ON product_attributes(attribute_id);

-- =====================================================
-- 4. BATCH ATTRIBUTES TABLE - Attributes for batches (quality data, etc.)
-- =====================================================
CREATE TABLE IF NOT EXISTS batch_attributes (
    id SERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    attribute_id INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value VARCHAR(500),
    numeric_value DECIMAL(15,4),
    boolean_value BOOLEAN,
    date_value DATE,
    datetime_value TIMESTAMP,
    recorded_by VARCHAR(100),
    recorded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    UNIQUE(batch_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_attr_batch ON batch_attributes(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_attr_attribute ON batch_attributes(attribute_id);

-- =====================================================
-- 5. EQUIPMENT ATTRIBUTES TABLE - Equipment specifications
-- =====================================================
CREATE TABLE IF NOT EXISTS equipment_attributes (
    id SERIAL PRIMARY KEY,
    equipment_id BIGINT NOT NULL REFERENCES equipment(equipment_id),
    attribute_id INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value VARCHAR(500),
    numeric_value DECIMAL(15,4),
    boolean_value BOOLEAN,
    date_value DATE,
    datetime_value TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    UNIQUE(equipment_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_equip_attr_equipment ON equipment_attributes(equipment_id);
CREATE INDEX IF NOT EXISTS idx_equip_attr_attribute ON equipment_attributes(attribute_id);

-- =====================================================
-- 6. INVENTORY ATTRIBUTES TABLE - Inventory-specific properties
-- =====================================================
CREATE TABLE IF NOT EXISTS inventory_attributes (
    id SERIAL PRIMARY KEY,
    inventory_id BIGINT NOT NULL REFERENCES inventory(inventory_id),
    attribute_id INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value VARCHAR(500),
    numeric_value DECIMAL(15,4),
    boolean_value BOOLEAN,
    date_value DATE,
    datetime_value TIMESTAMP,
    recorded_by VARCHAR(100),
    recorded_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    UNIQUE(inventory_id, attribute_id)
);

CREATE INDEX IF NOT EXISTS idx_inv_attr_inventory ON inventory_attributes(inventory_id);
CREATE INDEX IF NOT EXISTS idx_inv_attr_attribute ON inventory_attributes(attribute_id);

-- =====================================================
-- Insert default attribute definitions
-- =====================================================

-- Material attributes
INSERT INTO attribute_definitions (attribute_code, attribute_name, description, data_type, entity_type, unit, is_required, display_order, created_by)
VALUES
    ('MAT_GRADE', 'Grade', 'Material grade specification', 'STRING', 'MATERIAL', NULL, FALSE, 1, 'system'),
    ('MAT_TENSILE_STRENGTH', 'Tensile Strength', 'Tensile strength specification', 'DECIMAL', 'MATERIAL', 'MPa', FALSE, 2, 'system'),
    ('MAT_HARDNESS', 'Hardness', 'Material hardness', 'DECIMAL', 'MATERIAL', 'HRC', FALSE, 3, 'system'),
    ('MAT_DENSITY', 'Density', 'Material density', 'DECIMAL', 'MATERIAL', 'g/cm³', FALSE, 4, 'system'),
    ('MAT_MELTING_POINT', 'Melting Point', 'Melting point temperature', 'DECIMAL', 'MATERIAL', '°C', FALSE, 5, 'system')
ON CONFLICT (attribute_code) DO NOTHING;

-- Product attributes
INSERT INTO attribute_definitions (attribute_code, attribute_name, description, data_type, entity_type, unit, is_required, display_order, created_by)
VALUES
    ('PROD_WIDTH', 'Width', 'Product width dimension', 'DECIMAL', 'PRODUCT', 'mm', FALSE, 1, 'system'),
    ('PROD_LENGTH', 'Length', 'Product length dimension', 'DECIMAL', 'PRODUCT', 'mm', FALSE, 2, 'system'),
    ('PROD_THICKNESS', 'Thickness', 'Product thickness dimension', 'DECIMAL', 'PRODUCT', 'mm', FALSE, 3, 'system'),
    ('PROD_SURFACE_FINISH', 'Surface Finish', 'Surface finish specification', 'STRING', 'PRODUCT', NULL, FALSE, 4, 'system'),
    ('PROD_TOLERANCE', 'Tolerance', 'Dimensional tolerance', 'STRING', 'PRODUCT', NULL, FALSE, 5, 'system')
ON CONFLICT (attribute_code) DO NOTHING;

-- Batch attributes (quality parameters)
INSERT INTO attribute_definitions (attribute_code, attribute_name, description, data_type, entity_type, unit, is_required, display_order, created_by)
VALUES
    ('BATCH_CARBON', 'Carbon Content', 'Carbon percentage in composition', 'DECIMAL', 'BATCH', '%', FALSE, 1, 'system'),
    ('BATCH_MANGANESE', 'Manganese Content', 'Manganese percentage', 'DECIMAL', 'BATCH', '%', FALSE, 2, 'system'),
    ('BATCH_SILICON', 'Silicon Content', 'Silicon percentage', 'DECIMAL', 'BATCH', '%', FALSE, 3, 'system'),
    ('BATCH_SULFUR', 'Sulfur Content', 'Sulfur percentage', 'DECIMAL', 'BATCH', '%', FALSE, 4, 'system'),
    ('BATCH_PHOSPHORUS', 'Phosphorus Content', 'Phosphorus percentage', 'DECIMAL', 'BATCH', '%', FALSE, 5, 'system'),
    ('BATCH_TEMP', 'Temperature', 'Temperature at production', 'DECIMAL', 'BATCH', '°C', FALSE, 6, 'system')
ON CONFLICT (attribute_code) DO NOTHING;

-- Equipment attributes
INSERT INTO attribute_definitions (attribute_code, attribute_name, description, data_type, entity_type, unit, is_required, display_order, created_by)
VALUES
    ('EQUIP_MAX_TEMP', 'Max Temperature', 'Maximum operating temperature', 'DECIMAL', 'EQUIPMENT', '°C', FALSE, 1, 'system'),
    ('EQUIP_MIN_TEMP', 'Min Temperature', 'Minimum operating temperature', 'DECIMAL', 'EQUIPMENT', '°C', FALSE, 2, 'system'),
    ('EQUIP_POWER', 'Power Rating', 'Equipment power rating', 'DECIMAL', 'EQUIPMENT', 'kW', FALSE, 3, 'system'),
    ('EQUIP_VOLTAGE', 'Voltage', 'Operating voltage', 'DECIMAL', 'EQUIPMENT', 'V', FALSE, 4, 'system'),
    ('EQUIP_MANUFACTURER', 'Manufacturer', 'Equipment manufacturer', 'STRING', 'EQUIPMENT', NULL, FALSE, 5, 'system'),
    ('EQUIP_MODEL', 'Model', 'Equipment model number', 'STRING', 'EQUIPMENT', NULL, FALSE, 6, 'system'),
    ('EQUIP_SERIAL', 'Serial Number', 'Equipment serial number', 'STRING', 'EQUIPMENT', NULL, FALSE, 7, 'system')
ON CONFLICT (attribute_code) DO NOTHING;

-- Inventory attributes
INSERT INTO attribute_definitions (attribute_code, attribute_name, description, data_type, entity_type, unit, is_required, display_order, created_by)
VALUES
    ('INV_LOT_NUMBER', 'Lot Number', 'Supplier lot number', 'STRING', 'INVENTORY', NULL, FALSE, 1, 'system'),
    ('INV_EXPIRY_DATE', 'Expiry Date', 'Material expiry date', 'DATE', 'INVENTORY', NULL, FALSE, 2, 'system'),
    ('INV_CERTIFICATE', 'Certificate Number', 'Quality certificate number', 'STRING', 'INVENTORY', NULL, FALSE, 3, 'system'),
    ('INV_SUPPLIER', 'Supplier', 'Material supplier', 'STRING', 'INVENTORY', NULL, FALSE, 4, 'system'),
    ('INV_RECEIPT_DATE', 'Receipt Date', 'Date material was received', 'DATE', 'INVENTORY', NULL, FALSE, 5, 'system')
ON CONFLICT (attribute_code) DO NOTHING;
