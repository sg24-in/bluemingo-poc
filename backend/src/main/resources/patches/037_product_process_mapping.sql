-- =====================================================
-- Patch 037: Product-to-Process Default Mapping
-- =====================================================
-- Purpose: Links products to their default production process
-- This enables operation instantiation from order line items
-- =====================================================

-- Add default_process_id column to products if not exists
ALTER TABLE products ADD COLUMN IF NOT EXISTS default_process_id BIGINT;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_products_default_process'
        AND table_name = 'products'
    ) THEN
        ALTER TABLE products
        ADD CONSTRAINT fk_products_default_process
        FOREIGN KEY (default_process_id) REFERENCES processes(process_id);
    END IF;
END $$;

-- =====================================================
-- SECTION 1: Update existing products with default process
-- =====================================================
-- HR Coil products → HR Coil Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'HR Coil Production'
) WHERE sku LIKE 'PROD-HR-COIL%' AND default_process_id IS NULL;

-- CR Sheet products → CR Sheet Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'CR Sheet Production'
) WHERE sku LIKE 'PROD-CR-SHEET%' AND default_process_id IS NULL;

-- Rebar products → Rebar Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'Rebar Production'
) WHERE sku LIKE 'PROD-REBAR%' AND default_process_id IS NULL;

-- Wire Rod products → Wire Rod Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'Wire Rod Production'
) WHERE sku LIKE 'PROD-WIRE-ROD%' AND default_process_id IS NULL;

-- Galvanized products → Galvanized Sheet Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'Galvanized Sheet Production'
) WHERE sku LIKE 'PROD-GALV%' AND default_process_id IS NULL;

-- Steel Plate products → Steel Plate Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'Steel Plate Production'
) WHERE sku LIKE 'PROD-PLATE%' AND default_process_id IS NULL;

-- Structural products → Structural Section Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'Structural Section Production'
) WHERE sku LIKE 'PROD-STRUCT%' AND default_process_id IS NULL;

-- Stainless Steel products → Stainless Steel Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'Stainless Steel Production'
) WHERE sku LIKE 'PROD-SS%' AND default_process_id IS NULL;

-- Billet products → Billet Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'Billet Production'
) WHERE sku LIKE 'PROD-BILLET%' AND default_process_id IS NULL;

-- Tinplate products → Tinplate Production process
UPDATE products SET default_process_id = (
    SELECT process_id FROM processes WHERE process_name = 'Tinplate Production'
) WHERE sku LIKE 'PROD-TINPLATE%' AND default_process_id IS NULL;

-- Create index for process lookup
CREATE INDEX IF NOT EXISTS idx_products_default_process ON products(default_process_id);

-- =====================================================
-- SECTION 2: Add process_id to order_line_items (cache)
-- =====================================================
-- This caches the process_id at order creation time for performance
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS process_id BIGINT;

-- Add foreign key constraint
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_order_line_items_process'
        AND table_name = 'order_line_items'
    ) THEN
        ALTER TABLE order_line_items
        ADD CONSTRAINT fk_order_line_items_process
        FOREIGN KEY (process_id) REFERENCES processes(process_id);
    END IF;
END $$;

-- Populate process_id for existing order line items
UPDATE order_line_items oli SET process_id = (
    SELECT p.default_process_id
    FROM products p
    WHERE p.sku = oli.product_sku
    LIMIT 1
) WHERE oli.process_id IS NULL;

-- Create index for process lookup
CREATE INDEX IF NOT EXISTS idx_order_line_items_process ON order_line_items(process_id);

