-- Patch 021: Add missing master/lookup tables
-- These tables provide proper data integrity for fields currently stored as VARCHAR

-- =====================================================
-- 1. DEPARTMENTS TABLE - For operator department management
-- =====================================================
CREATE TABLE IF NOT EXISTS departments (
    department_id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) NOT NULL UNIQUE,
    department_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    manager_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_department_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_departments_code ON departments(department_code);
CREATE INDEX IF NOT EXISTS idx_departments_status ON departments(status);

-- Insert default departments
INSERT INTO departments (department_code, department_name, description, status, created_by)
VALUES
    ('PROD', 'Production', 'Manufacturing and production operations', 'ACTIVE', 'system'),
    ('QC', 'Quality Control', 'Quality assurance and inspection', 'ACTIVE', 'system'),
    ('MAINT', 'Maintenance', 'Equipment maintenance and repair', 'ACTIVE', 'system'),
    ('WAREHOUSE', 'Warehouse', 'Inventory and warehouse management', 'ACTIVE', 'system'),
    ('LOGISTICS', 'Logistics', 'Material handling and transportation', 'ACTIVE', 'system')
ON CONFLICT (department_code) DO NOTHING;

-- =====================================================
-- 2. SHIFTS TABLE - For work shift management
-- =====================================================
CREATE TABLE IF NOT EXISTS shifts (
    shift_id SERIAL PRIMARY KEY,
    shift_code VARCHAR(50) NOT NULL UNIQUE,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME,
    end_time TIME,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_shift_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_shifts_code ON shifts(shift_code);
CREATE INDEX IF NOT EXISTS idx_shifts_status ON shifts(status);

-- Insert default shifts
INSERT INTO shifts (shift_code, shift_name, start_time, end_time, description, status, created_by)
VALUES
    ('MORNING', 'Morning Shift', '06:00:00', '14:00:00', 'Morning shift (6 AM - 2 PM)', 'ACTIVE', 'system'),
    ('AFTERNOON', 'Afternoon Shift', '14:00:00', '22:00:00', 'Afternoon shift (2 PM - 10 PM)', 'ACTIVE', 'system'),
    ('NIGHT', 'Night Shift', '22:00:00', '06:00:00', 'Night shift (10 PM - 6 AM)', 'ACTIVE', 'system'),
    ('GENERAL', 'General Shift', '09:00:00', '17:00:00', 'General day shift (9 AM - 5 PM)', 'ACTIVE', 'system')
ON CONFLICT (shift_code) DO NOTHING;

-- =====================================================
-- 3. LOCATIONS TABLE - For warehouse/storage locations
-- =====================================================
CREATE TABLE IF NOT EXISTS locations (
    location_id SERIAL PRIMARY KEY,
    location_code VARCHAR(50) NOT NULL UNIQUE,
    location_name VARCHAR(100) NOT NULL,
    location_type VARCHAR(30) NOT NULL DEFAULT 'WAREHOUSE',
    parent_location_id INTEGER REFERENCES locations(location_id),
    address VARCHAR(500),
    capacity DECIMAL(15,4),
    capacity_unit VARCHAR(20),
    is_temperature_controlled BOOLEAN DEFAULT FALSE,
    min_temperature DECIMAL(5,2),
    max_temperature DECIMAL(5,2),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_location_type CHECK (location_type IN ('WAREHOUSE', 'PLANT', 'ZONE', 'RACK', 'BIN', 'STAGING')),
    CONSTRAINT chk_location_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE'))
);

CREATE INDEX IF NOT EXISTS idx_locations_code ON locations(location_code);
CREATE INDEX IF NOT EXISTS idx_locations_type ON locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_parent ON locations(parent_location_id);
CREATE INDEX IF NOT EXISTS idx_locations_status ON locations(status);

-- Insert default locations
INSERT INTO locations (location_code, location_name, location_type, status, created_by)
VALUES
    ('PLANT-A', 'Plant A', 'PLANT', 'ACTIVE', 'system'),
    ('PLANT-B', 'Plant B', 'PLANT', 'ACTIVE', 'system'),
    ('WH-RM', 'Raw Material Warehouse', 'WAREHOUSE', 'ACTIVE', 'system'),
    ('WH-FG', 'Finished Goods Warehouse', 'WAREHOUSE', 'ACTIVE', 'system'),
    ('WH-WIP', 'Work In Progress Area', 'WAREHOUSE', 'ACTIVE', 'system'),
    ('STAGING-IN', 'Inbound Staging', 'STAGING', 'ACTIVE', 'system'),
    ('STAGING-OUT', 'Outbound Staging', 'STAGING', 'ACTIVE', 'system')
ON CONFLICT (location_code) DO NOTHING;

-- =====================================================
-- 4. MATERIAL GROUPS TABLE - For material categorization
-- =====================================================
CREATE TABLE IF NOT EXISTS material_groups (
    group_id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    parent_group_id INTEGER REFERENCES material_groups(group_id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_material_group_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_material_groups_code ON material_groups(group_code);
CREATE INDEX IF NOT EXISTS idx_material_groups_parent ON material_groups(parent_group_id);
CREATE INDEX IF NOT EXISTS idx_material_groups_status ON material_groups(status);

-- Insert default material groups
INSERT INTO material_groups (group_code, group_name, description, status, created_by)
VALUES
    ('METALS', 'Metals', 'Metal raw materials and alloys', 'ACTIVE', 'system'),
    ('STEEL', 'Steel Products', 'Steel and steel alloys', 'ACTIVE', 'system'),
    ('IRON', 'Iron Products', 'Iron and iron alloys', 'ACTIVE', 'system'),
    ('CHEMICALS', 'Chemicals', 'Chemical compounds and additives', 'ACTIVE', 'system'),
    ('CONSUMABLES', 'Consumables', 'Consumable materials', 'ACTIVE', 'system'),
    ('PACKAGING', 'Packaging', 'Packaging materials', 'ACTIVE', 'system')
ON CONFLICT (group_code) DO NOTHING;

-- =====================================================
-- 5. PRODUCT CATEGORIES TABLE - For product categorization
-- =====================================================
CREATE TABLE IF NOT EXISTS product_categories (
    category_id SERIAL PRIMARY KEY,
    category_code VARCHAR(50) NOT NULL UNIQUE,
    category_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    parent_category_id INTEGER REFERENCES product_categories(category_id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_product_category_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_product_categories_code ON product_categories(category_code);
CREATE INDEX IF NOT EXISTS idx_product_categories_parent ON product_categories(parent_category_id);
CREATE INDEX IF NOT EXISTS idx_product_categories_status ON product_categories(status);

-- Insert default product categories
INSERT INTO product_categories (category_code, category_name, description, status, created_by)
VALUES
    ('FINISHED', 'Finished Products', 'Completed finished goods', 'ACTIVE', 'system'),
    ('SEMI-FIN', 'Semi-Finished', 'Semi-finished products', 'ACTIVE', 'system'),
    ('STANDARD', 'Standard Products', 'Standard catalog products', 'ACTIVE', 'system'),
    ('CUSTOM', 'Custom Products', 'Custom manufactured products', 'ACTIVE', 'system'),
    ('SPARE', 'Spare Parts', 'Spare parts and components', 'ACTIVE', 'system')
ON CONFLICT (category_code) DO NOTHING;

-- =====================================================
-- 6. PRODUCT GROUPS TABLE - For product grouping
-- =====================================================
CREATE TABLE IF NOT EXISTS product_groups (
    group_id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    category_id INTEGER REFERENCES product_categories(category_id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_product_group_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_product_groups_code ON product_groups(group_code);
CREATE INDEX IF NOT EXISTS idx_product_groups_category ON product_groups(category_id);
CREATE INDEX IF NOT EXISTS idx_product_groups_status ON product_groups(status);

-- Insert default product groups
INSERT INTO product_groups (group_code, group_name, description, status, created_by)
VALUES
    ('STEEL-PLATES', 'Steel Plates', 'Flat steel plate products', 'ACTIVE', 'system'),
    ('STEEL-COILS', 'Steel Coils', 'Steel coil products', 'ACTIVE', 'system'),
    ('STEEL-BARS', 'Steel Bars', 'Steel bar and rod products', 'ACTIVE', 'system'),
    ('STEEL-PIPES', 'Steel Pipes', 'Steel pipe and tube products', 'ACTIVE', 'system'),
    ('CASTINGS', 'Castings', 'Cast metal products', 'ACTIVE', 'system')
ON CONFLICT (group_code) DO NOTHING;

-- =====================================================
-- 7. OPERATION TYPES TABLE - For operation type definitions
-- =====================================================
CREATE TABLE IF NOT EXISTS operation_types (
    type_id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) NOT NULL UNIQUE,
    type_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    default_duration_minutes INTEGER,
    requires_equipment BOOLEAN DEFAULT TRUE,
    requires_operator BOOLEAN DEFAULT TRUE,
    produces_output BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_operation_type_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_operation_types_code ON operation_types(type_code);
CREATE INDEX IF NOT EXISTS idx_operation_types_status ON operation_types(status);

-- Insert default operation types
INSERT INTO operation_types (type_code, type_name, description, requires_equipment, requires_operator, produces_output, status, created_by)
VALUES
    ('MELTING', 'Melting', 'Metal melting operation', TRUE, TRUE, TRUE, 'ACTIVE', 'system'),
    ('CASTING', 'Casting', 'Metal casting operation', TRUE, TRUE, TRUE, 'ACTIVE', 'system'),
    ('ROLLING', 'Rolling', 'Metal rolling operation', TRUE, TRUE, TRUE, 'ACTIVE', 'system'),
    ('CUTTING', 'Cutting', 'Material cutting operation', TRUE, TRUE, TRUE, 'ACTIVE', 'system'),
    ('HEAT-TREAT', 'Heat Treatment', 'Heat treatment operation', TRUE, TRUE, TRUE, 'ACTIVE', 'system'),
    ('COATING', 'Coating', 'Surface coating operation', TRUE, TRUE, TRUE, 'ACTIVE', 'system'),
    ('INSPECTION', 'Inspection', 'Quality inspection operation', TRUE, TRUE, FALSE, 'ACTIVE', 'system'),
    ('PACKAGING', 'Packaging', 'Product packaging operation', TRUE, TRUE, TRUE, 'ACTIVE', 'system'),
    ('ASSEMBLY', 'Assembly', 'Component assembly operation', TRUE, TRUE, TRUE, 'ACTIVE', 'system'),
    ('TESTING', 'Testing', 'Product testing operation', TRUE, TRUE, FALSE, 'ACTIVE', 'system')
ON CONFLICT (type_code) DO NOTHING;
