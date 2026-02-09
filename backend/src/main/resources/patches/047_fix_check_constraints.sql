-- Patch 047: Fix CHECK constraints missing valid status values
-- 1. order_line_items: Add CANCELLED to chk_line_status (READY already added in patch 019)
-- 2. batch_relations: Add CONSUME to chk_relation_type

-- Fix chk_line_status: add CANCELLED
ALTER TABLE order_line_items DROP CONSTRAINT IF EXISTS chk_line_status;
ALTER TABLE order_line_items ADD CONSTRAINT chk_line_status
    CHECK (status IN ('CREATED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED', 'ON_HOLD'));

-- Fix chk_relation_type: add CONSUME
ALTER TABLE batch_relations DROP CONSTRAINT IF EXISTS chk_relation_type;
ALTER TABLE batch_relations ADD CONSTRAINT chk_relation_type
    CHECK (relation_type IN ('SPLIT', 'MERGE', 'CONSUME'));
