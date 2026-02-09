-- =====================================================
-- Patch 004: Add missing columns to match JPA entities
-- Fixes schema-entity mismatches for orders, operations, batches,
-- inventory, batch_size_config, batch_quantity_adjustments,
-- production_confirmation, and order_line_items
-- =====================================================

-- Orders: Add customer_ref_id for Customer entity reference
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_ref_id BIGINT;

-- Operations: Add confirmed_qty for partial confirmation tracking
ALTER TABLE operations ADD COLUMN IF NOT EXISTS confirmed_qty DECIMAL(15,4);

-- Operations: Add start_time and end_time for execution tracking
ALTER TABLE operations ADD COLUMN IF NOT EXISTS start_time TIMESTAMP;
ALTER TABLE operations ADD COLUMN IF NOT EXISTS end_time TIMESTAMP;

-- Batches: Add created_via for tracking batch creation source (PRODUCTION, SPLIT, MERGE, MANUAL, RECEIPT)
ALTER TABLE batches ADD COLUMN IF NOT EXISTS created_via VARCHAR(50);

-- Batches: Add received_date for RM receipt tracking
ALTER TABLE batches ADD COLUMN IF NOT EXISTS received_date DATE;

-- Batches: Add receipt_notes for RM receipt comments
ALTER TABLE batches ADD COLUMN IF NOT EXISTS receipt_notes VARCHAR(500);

-- =====================================================
-- OrderLineItem: Add process_id column
-- Entity has @Column(name="process_id") Long processId
-- =====================================================
ALTER TABLE order_line_items ADD COLUMN IF NOT EXISTS process_id BIGINT;

-- OrderLineItem: Add READY to status CHECK constraint
-- (Drop and recreate - IF EXISTS is PostgreSQL 9.x+)
ALTER TABLE order_line_items DROP CONSTRAINT IF EXISTS chk_line_status;
ALTER TABLE order_line_items ADD CONSTRAINT chk_line_status CHECK (status IN ('CREATED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED', 'ON_HOLD'));

-- =====================================================
-- Inventory: Add missing physical property columns
-- Entity has inventory_form, temperature, moisture, density
-- =====================================================
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS inventory_form VARCHAR(20);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS current_temperature DECIMAL(10,2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS moisture_content DECIMAL(5,2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS density DECIMAL(10,4);

-- Inventory: Add scrap tracking columns
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS scrap_reason VARCHAR(500);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS scrapped_by VARCHAR(100);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS scrapped_on TIMESTAMP;

-- Inventory: Add reservation tracking columns
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_for_order_id BIGINT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_for_operation_id BIGINT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_by VARCHAR(100);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_on TIMESTAMP;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_qty DECIMAL(15,4);

-- =====================================================
-- BatchQuantityAdjustment: Add entity-mapped columns
-- Entity uses old_quantity, new_quantity, adjustment_reason
-- instead of schema's adjustment_qty, new_total_qty, reason
-- =====================================================
ALTER TABLE batch_quantity_adjustments ADD COLUMN IF NOT EXISTS old_quantity DECIMAL(15,4);
ALTER TABLE batch_quantity_adjustments ADD COLUMN IF NOT EXISTS new_quantity DECIMAL(15,4);
ALTER TABLE batch_quantity_adjustments ADD COLUMN IF NOT EXISTS adjustment_reason VARCHAR(500);

-- Backfill: copy existing data to new columns if old columns have data
UPDATE batch_quantity_adjustments SET adjustment_reason = reason WHERE adjustment_reason IS NULL AND reason IS NOT NULL;
UPDATE batch_quantity_adjustments SET new_quantity = new_total_qty WHERE new_quantity IS NULL AND new_total_qty IS NOT NULL;

-- =====================================================
-- BatchSizeConfig: Add missing entity-mapped columns
-- Entity has material_id, equipment_type, preferred_batch_size,
-- allow_partial_batch, is_active, priority
-- =====================================================
ALTER TABLE batch_size_config ADD COLUMN IF NOT EXISTS material_id VARCHAR(50);
ALTER TABLE batch_size_config ADD COLUMN IF NOT EXISTS equipment_type VARCHAR(50);
ALTER TABLE batch_size_config ADD COLUMN IF NOT EXISTS preferred_batch_size DECIMAL(15,4);
ALTER TABLE batch_size_config ADD COLUMN IF NOT EXISTS allow_partial_batch BOOLEAN DEFAULT TRUE;
ALTER TABLE batch_size_config ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE batch_size_config ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 0;

-- =====================================================
-- ProductionConfirmation: Add PENDING_REVIEW to status CHECK
-- Entity defines STATUS_PENDING_REVIEW = "PENDING_REVIEW"
-- =====================================================
ALTER TABLE production_confirmation DROP CONSTRAINT IF EXISTS chk_confirm_status;
ALTER TABLE production_confirmation ADD CONSTRAINT chk_confirm_status CHECK (status IN ('CONFIRMED', 'PARTIALLY_CONFIRMED', 'REJECTED', 'PENDING_REVIEW'));

-- =====================================================
-- ProductionConfirmation: Create ManyToMany join tables
-- Entity uses @ManyToMany for equipment and operators
-- =====================================================
CREATE TABLE IF NOT EXISTS confirmation_equipment (
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    equipment_id BIGINT NOT NULL REFERENCES equipment(equipment_id),
    PRIMARY KEY (confirmation_id, equipment_id)
);

CREATE TABLE IF NOT EXISTS confirmation_operators (
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    operator_id BIGINT NOT NULL REFERENCES operators(operator_id),
    PRIMARY KEY (confirmation_id, operator_id)
);
