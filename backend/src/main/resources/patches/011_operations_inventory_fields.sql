-- Patch 011: Add missing fields to operations and inventory tables
-- Aligns PostgreSQL schema with demo schema and entity definitions

-- =====================================================
-- OPERATIONS TABLE - Add missing columns
-- =====================================================

-- Target and confirmed quantities for partial confirmations
ALTER TABLE operations ADD COLUMN IF NOT EXISTS target_qty DECIMAL(15,4);
ALTER TABLE operations ADD COLUMN IF NOT EXISTS confirmed_qty DECIMAL(15,4);

-- Block tracking fields
ALTER TABLE operations ADD COLUMN IF NOT EXISTS block_reason VARCHAR(500);
ALTER TABLE operations ADD COLUMN IF NOT EXISTS blocked_by VARCHAR(100);
ALTER TABLE operations ADD COLUMN IF NOT EXISTS blocked_on TIMESTAMP;

-- =====================================================
-- INVENTORY TABLE - Add missing columns
-- =====================================================

-- Block tracking fields
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS block_reason VARCHAR(500);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS blocked_by VARCHAR(100);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS blocked_on TIMESTAMP;

-- Scrap tracking fields
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS scrap_reason VARCHAR(500);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS scrapped_by VARCHAR(100);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS scrapped_on TIMESTAMP;

-- Reservation tracking fields
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_for_order_id BIGINT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_for_operation_id BIGINT;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_by VARCHAR(100);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_on TIMESTAMP;
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS reserved_qty DECIMAL(15,4);

-- =====================================================
-- CONFIRMATION JUNCTION TABLES (alternative to arrays for H2 compatibility)
-- =====================================================

-- Junction table for confirmation-equipment relationship
CREATE TABLE IF NOT EXISTS confirmation_equipment (
    id BIGSERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    equipment_id BIGINT NOT NULL REFERENCES equipment(equipment_id)
);

-- Junction table for confirmation-operator relationship
CREATE TABLE IF NOT EXISTS confirmation_operators (
    id BIGSERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    operator_id BIGINT NOT NULL REFERENCES operators(operator_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_conf_equip_confirmation ON confirmation_equipment(confirmation_id);
CREATE INDEX IF NOT EXISTS idx_conf_equip_equipment ON confirmation_equipment(equipment_id);
CREATE INDEX IF NOT EXISTS idx_conf_ops_confirmation ON confirmation_operators(confirmation_id);
CREATE INDEX IF NOT EXISTS idx_conf_ops_operator ON confirmation_operators(operator_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reserved_order ON inventory(reserved_for_order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reserved_operation ON inventory(reserved_for_operation_id);
CREATE INDEX IF NOT EXISTS idx_operations_blocked ON operations(blocked_on) WHERE blocked_on IS NOT NULL;
