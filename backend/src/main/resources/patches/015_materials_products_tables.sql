-- Patch 015: Create materials and products tables
-- Supports material master and product catalog management

-- Create materials table
CREATE TABLE IF NOT EXISTS materials (
    material_id SERIAL PRIMARY KEY,
    material_code VARCHAR(50) NOT NULL UNIQUE,
    material_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    material_type VARCHAR(20) NOT NULL,
    base_unit VARCHAR(20) NOT NULL DEFAULT 'T',
    material_group VARCHAR(50),
    sku VARCHAR(50),
    standard_cost NUMERIC(15,4),
    cost_currency VARCHAR(3) DEFAULT 'USD',
    min_stock_level NUMERIC(15,4),
    max_stock_level NUMERIC(15,4),
    reorder_point NUMERIC(15,4),
    lead_time_days INTEGER,
    shelf_life_days INTEGER,
    storage_conditions VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Create indexes for materials
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_name ON materials(material_name);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);
CREATE INDEX IF NOT EXISTS idx_materials_status ON materials(status);

-- Add constraint for material type
ALTER TABLE materials DROP CONSTRAINT IF EXISTS chk_material_type;
ALTER TABLE materials ADD CONSTRAINT chk_material_type
    CHECK (material_type IN ('RM', 'IM', 'FG', 'WIP'));

-- Add constraint for material status
ALTER TABLE materials DROP CONSTRAINT IF EXISTS chk_material_status;
ALTER TABLE materials ADD CONSTRAINT chk_material_status
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'OBSOLETE'));

-- Create products table (finished goods with SKUs)
CREATE TABLE IF NOT EXISTS products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    product_category VARCHAR(100),
    product_group VARCHAR(100),
    base_unit VARCHAR(20) NOT NULL DEFAULT 'T',
    weight_per_unit NUMERIC(15,4),
    weight_unit VARCHAR(10),
    standard_price NUMERIC(15,4),
    price_currency VARCHAR(3) DEFAULT 'USD',
    min_order_qty NUMERIC(15,4),
    lead_time_days INTEGER,
    material_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Create indexes for products
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(product_name);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(product_category);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Add constraint for product status
ALTER TABLE products DROP CONSTRAINT IF EXISTS chk_product_status;
ALTER TABLE products ADD CONSTRAINT chk_product_status
    CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED'));

-- Insert sample materials
INSERT INTO materials (material_code, material_name, material_type, base_unit, material_group, standard_cost, status, created_by)
VALUES
    ('MAT-RM-001', 'Steel Scrap Grade A', 'RM', 'T', 'Steel', 250.00, 'ACTIVE', 'system'),
    ('MAT-RM-002', 'Steel Scrap Grade B', 'RM', 'T', 'Steel', 200.00, 'ACTIVE', 'system'),
    ('MAT-RM-003', 'Iron Ore Pellets', 'RM', 'T', 'Iron', 150.00, 'ACTIVE', 'system'),
    ('MAT-RM-004', 'Limestone', 'RM', 'T', 'Flux', 50.00, 'ACTIVE', 'system'),
    ('MAT-RM-005', 'Ferroalloy - FeSi', 'RM', 'KG', 'Alloy', 2.50, 'ACTIVE', 'system'),
    ('MAT-IM-001', 'Liquid Steel', 'IM', 'T', 'Steel', 400.00, 'ACTIVE', 'system'),
    ('MAT-IM-002', 'Steel Billet', 'IM', 'T', 'Steel', 500.00, 'ACTIVE', 'system'),
    ('MAT-IM-003', 'Steel Slab', 'IM', 'T', 'Steel', 550.00, 'ACTIVE', 'system'),
    ('MAT-FG-001', 'HR Coil 2mm', 'FG', 'T', 'Coil', 700.00, 'ACTIVE', 'system'),
    ('MAT-FG-002', 'CR Sheet 1mm', 'FG', 'T', 'Sheet', 850.00, 'ACTIVE', 'system')
ON CONFLICT (material_code) DO NOTHING;

-- Insert sample products (finished goods for orders)
INSERT INTO products (sku, product_name, product_category, product_group, base_unit, standard_price, lead_time_days, status, created_by)
VALUES
    ('HR-COIL-2MM', 'Hot Rolled Coil 2mm', 'Coils', 'Hot Rolled', 'T', 700.00, 14, 'ACTIVE', 'system'),
    ('HR-COIL-3MM', 'Hot Rolled Coil 3mm', 'Coils', 'Hot Rolled', 'T', 680.00, 14, 'ACTIVE', 'system'),
    ('HR-COIL-4MM', 'Hot Rolled Coil 4mm', 'Coils', 'Hot Rolled', 'T', 660.00, 14, 'ACTIVE', 'system'),
    ('CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 'Sheets', 'Cold Rolled', 'T', 850.00, 21, 'ACTIVE', 'system'),
    ('CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 'Sheets', 'Cold Rolled', 'T', 820.00, 21, 'ACTIVE', 'system'),
    ('STEEL-BILLET-100', 'Steel Billet 100mm', 'Billets', 'Semi-Finished', 'T', 500.00, 7, 'ACTIVE', 'system'),
    ('STEEL-BILLET-150', 'Steel Billet 150mm', 'Billets', 'Semi-Finished', 'T', 520.00, 7, 'ACTIVE', 'system'),
    ('STEEL-SLAB-200', 'Steel Slab 200mm', 'Slabs', 'Semi-Finished', 'T', 550.00, 10, 'ACTIVE', 'system'),
    ('WIRE-ROD-5MM', 'Wire Rod 5.5mm', 'Wire Rods', 'Long Products', 'T', 620.00, 14, 'ACTIVE', 'system'),
    ('REBAR-10MM', 'Reinforcement Bar 10mm', 'Rebars', 'Long Products', 'T', 580.00, 14, 'ACTIVE', 'system')
ON CONFLICT (sku) DO NOTHING;
