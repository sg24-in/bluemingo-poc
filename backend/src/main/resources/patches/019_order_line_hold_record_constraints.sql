-- Patch 019: Add READY status to order_line_items and EQUIPMENT to hold_records entity types
-- This aligns with the MES Consolidated Data Model specification

-- 1. Update order_line_items status constraint to include READY
ALTER TABLE order_line_items DROP CONSTRAINT IF EXISTS chk_line_status;
ALTER TABLE order_line_items ADD CONSTRAINT chk_line_status
    CHECK (status IN ('CREATED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD'));

-- 2. Update hold_records entity_type constraint to include EQUIPMENT
ALTER TABLE hold_records DROP CONSTRAINT IF EXISTS chk_hold_entity_type;
ALTER TABLE hold_records ADD CONSTRAINT chk_hold_entity_type
    CHECK (entity_type IN ('OPERATION', 'PROCESS', 'ORDER_LINE', 'INVENTORY', 'BATCH', 'EQUIPMENT'));
