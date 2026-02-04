-- =====================================================
-- MES Production Confirmation - Additional Seed Data
-- Patch: 004
-- Description: Add more products, BOM, processes for Orders 2 & 3, and additional batches
-- =====================================================

-- =====================================================
-- PART 1: Additional Products - Steel Sheet (STEEL-SHEET-001)
-- =====================================================

INSERT INTO bill_of_material (product_sku, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, status) VALUES
('STEEL-SHEET-001', 'RM-IRON-ORE', 'Iron Ore', 1.15, 'T', 1.15, 1, 'ACTIVE'),
('STEEL-SHEET-001', 'RM-SCRAP', 'Scrap Metal', 0.25, 'T', 1.10, 1, 'ACTIVE'),
('STEEL-SHEET-001', 'RM-ALLOY', 'Alloy Mix', 0.04, 'T', 1.05, 1, 'ACTIVE'),
('STEEL-SHEET-001', 'IM-MOLTEN', 'Molten Metal', 1.08, 'T', 1.08, 2, 'ACTIVE'),
('STEEL-SHEET-001', 'IM-SLAB', 'Steel Slab', 1.04, 'T', 1.04, 3, 'ACTIVE'),
('STEEL-SHEET-001', 'IM-SHEET-ROLLED', 'Steel Sheet (Rolled)', 1.02, 'T', 1.02, 4, 'ACTIVE'),
('STEEL-SHEET-001', 'FG-SHEET', 'Finished Steel Sheet', 1.00, 'T', 1.00, 5, 'ACTIVE');

-- =====================================================
-- PART 2: Additional Products - Steel Bar (STEEL-BAR-001)
-- =====================================================

INSERT INTO bill_of_material (product_sku, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, status) VALUES
('STEEL-BAR-001', 'RM-IRON-ORE', 'Iron Ore', 1.18, 'T', 1.18, 1, 'ACTIVE'),
('STEEL-BAR-001', 'RM-SCRAP', 'Scrap Metal', 0.28, 'T', 1.12, 1, 'ACTIVE'),
('STEEL-BAR-001', 'RM-ALLOY', 'Alloy Mix', 0.06, 'T', 1.06, 1, 'ACTIVE'),
('STEEL-BAR-001', 'IM-MOLTEN', 'Molten Metal', 1.12, 'T', 1.12, 2, 'ACTIVE'),
('STEEL-BAR-001', 'IM-BILLET', 'Steel Billet', 1.06, 'T', 1.06, 3, 'ACTIVE'),
('STEEL-BAR-001', 'IM-BAR-ROLLED', 'Steel Bar (Rolled)', 1.03, 'T', 1.03, 4, 'ACTIVE'),
('STEEL-BAR-001', 'FG-BAR', 'Finished Steel Bar', 1.00, 'T', 1.00, 5, 'ACTIVE');

-- =====================================================
-- PART 3: Update Order Line Items with new products
-- =====================================================

UPDATE order_line_items
SET product_sku = 'STEEL-SHEET-001', product_name = 'Steel Sheet Grade A'
WHERE order_line_id = 2;

UPDATE order_line_items
SET product_sku = 'STEEL-BAR-001', product_name = 'Steel Bar Grade A'
WHERE order_line_id = 3;

-- =====================================================
-- PART 4: Processes for Order 2 (Steel Sheet)
-- =====================================================

INSERT INTO processes (order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(2, 'Melting', 1, 'COMPLETED', 'SYSTEM'),
(2, 'Casting', 2, 'IN_PROGRESS', 'SYSTEM'),
(2, 'Rolling', 3, 'READY', 'SYSTEM'),
(2, 'Finishing', 4, 'READY', 'SYSTEM');

-- Operations for Order 2 using subqueries (not hardcoded IDs)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by)
SELECT p.process_id, v.operation_name, v.operation_code, v.operation_type, v.sequence_number, v.status, 'SYSTEM'
FROM processes p
CROSS JOIN (VALUES
    ('Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED'),
    ('Melting', 'MELT-20', 'FURNACE', 2, 'CONFIRMED')
) AS v(operation_name, operation_code, operation_type, sequence_number, status)
WHERE p.order_line_id = 2 AND p.stage_name = 'Melting';

INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by)
SELECT p.process_id, 'Continuous Casting', 'CAST-10', 'CASTER', 1, 'READY', 'SYSTEM'
FROM processes p WHERE p.order_line_id = 2 AND p.stage_name = 'Casting';

INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by)
SELECT p.process_id, v.operation_name, v.operation_code, v.operation_type, v.sequence_number, v.status, 'SYSTEM'
FROM processes p
CROSS JOIN (VALUES
    ('Hot Rolling', 'ROLL-10', 'ROLLING', 1, 'NOT_STARTED'),
    ('Cold Rolling', 'ROLL-20', 'ROLLING', 2, 'NOT_STARTED')
) AS v(operation_name, operation_code, operation_type, sequence_number, status)
WHERE p.order_line_id = 2 AND p.stage_name = 'Rolling';

INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by)
SELECT p.process_id, v.operation_name, v.operation_code, v.operation_type, v.sequence_number, v.status, 'SYSTEM'
FROM processes p
CROSS JOIN (VALUES
    ('Leveling', 'FIN-10', 'FINISHING', 1, 'NOT_STARTED'),
    ('Cutting', 'FIN-20', 'SLITTING', 2, 'NOT_STARTED')
) AS v(operation_name, operation_code, operation_type, sequence_number, status)
WHERE p.order_line_id = 2 AND p.stage_name = 'Finishing';

-- =====================================================
-- PART 5: Processes for Order 3 (Steel Bar)
-- =====================================================

INSERT INTO processes (order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(3, 'Melting', 1, 'IN_PROGRESS', 'SYSTEM'),
(3, 'Casting', 2, 'READY', 'SYSTEM'),
(3, 'Rolling', 3, 'READY', 'SYSTEM'),
(3, 'Finishing', 4, 'READY', 'SYSTEM');

-- Operations for Order 3 using subqueries
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by)
SELECT p.process_id, v.operation_name, v.operation_code, v.operation_type, v.sequence_number, v.status, 'SYSTEM'
FROM processes p
CROSS JOIN (VALUES
    ('Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED'),
    ('Melting', 'MELT-20', 'FURNACE', 2, 'READY')
) AS v(operation_name, operation_code, operation_type, sequence_number, status)
WHERE p.order_line_id = 3 AND p.stage_name = 'Melting';

INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by)
SELECT p.process_id, 'Billet Casting', 'CAST-10', 'CASTER', 1, 'NOT_STARTED', 'SYSTEM'
FROM processes p WHERE p.order_line_id = 3 AND p.stage_name = 'Casting';

INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by)
SELECT p.process_id, 'Bar Rolling', 'ROLL-10', 'ROLLING', 1, 'NOT_STARTED', 'SYSTEM'
FROM processes p WHERE p.order_line_id = 3 AND p.stage_name = 'Rolling';

INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by)
SELECT p.process_id, v.operation_name, v.operation_code, v.operation_type, v.sequence_number, v.status, 'SYSTEM'
FROM processes p
CROSS JOIN (VALUES
    ('Bar Cutting', 'FIN-10', 'SLITTING', 1, 'NOT_STARTED'),
    ('Straightening', 'FIN-20', 'FINISHING', 2, 'NOT_STARTED')
) AS v(operation_name, operation_code, operation_type, sequence_number, status)
WHERE p.order_line_id = 3 AND p.stage_name = 'Finishing';

-- =====================================================
-- PART 6: Additional Batches and Inventory
-- =====================================================

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by) VALUES
('RM-BATCH-005', 'RM-IRON-ORE', 'Iron Ore', 300, 'T', 'AVAILABLE', 'SYSTEM'),
('RM-BATCH-006', 'RM-SCRAP', 'Scrap Metal', 150, 'T', 'AVAILABLE', 'SYSTEM'),
('RM-BATCH-007', 'RM-ALLOY', 'Alloy Mix', 30, 'T', 'AVAILABLE', 'SYSTEM'),
('IM-BATCH-004', 'IM-MOLTEN', 'Molten Metal', 55, 'T', 'AVAILABLE', 'SYSTEM'),
('IM-BATCH-005', 'IM-SLAB', 'Steel Slab', 52, 'T', 'AVAILABLE', 'SYSTEM'),
('IM-BATCH-006', 'IM-BILLET', 'Steel Billet', 80, 'T', 'AVAILABLE', 'SYSTEM'),
('FG-BATCH-001', 'FG-COIL', 'Finished Steel Coil', 45, 'T', 'AVAILABLE', 'SYSTEM'),
('FG-BATCH-002', 'FG-SHEET', 'Finished Steel Sheet', 30, 'T', 'AVAILABLE', 'SYSTEM');

-- Additional Inventory Records using subqueries for batch_id
INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-IRON-ORE', 'Iron Ore', 'RM', 'AVAILABLE', 300, 'T', b.batch_id, 'Yard-A', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'RM-BATCH-005';

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-SCRAP', 'Scrap Metal', 'RM', 'AVAILABLE', 150, 'T', b.batch_id, 'Yard-B', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'RM-BATCH-006';

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-ALLOY', 'Alloy Mix', 'RM', 'AVAILABLE', 30, 'T', b.batch_id, 'Yard-A', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'RM-BATCH-007';

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-MOLTEN', 'Molten Metal', 'IM', 'AVAILABLE', 55, 'T', b.batch_id, 'Melting Shop', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'IM-BATCH-004';

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-SLAB', 'Steel Slab', 'IM', 'AVAILABLE', 52, 'T', b.batch_id, 'Casting Area', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'IM-BATCH-005';

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-BILLET', 'Steel Billet', 'IM', 'AVAILABLE', 80, 'T', b.batch_id, 'Casting Area', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'IM-BATCH-006';

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'FG-COIL', 'Finished Steel Coil', 'FG', 'AVAILABLE', 45, 'T', b.batch_id, 'Warehouse-1', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'FG-BATCH-001';

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'FG-SHEET', 'Finished Steel Sheet', 'FG', 'AVAILABLE', 30, 'T', b.batch_id, 'Warehouse-2', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'FG-BATCH-002';

-- =====================================================
-- PART 7: Process Parameters for New Products
-- =====================================================

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order) VALUES
('ROLLING', 'STEEL-SHEET-001', 'Temperature', 'DECIMAL', '°C', 650, 950, 800, true, 1),
('ROLLING', 'STEEL-SHEET-001', 'Pressure', 'DECIMAL', 'bar', 40, 180, 100, true, 2),
('ROLLING', 'STEEL-SHEET-001', 'Speed', 'DECIMAL', 'm/min', 15, 60, 35, true, 3),
('ROLLING', 'STEEL-SHEET-001', 'Thickness', 'DECIMAL', 'mm', 0.5, 6, 1.5, true, 4),
('FURNACE', 'STEEL-SHEET-001', 'Temperature', 'DECIMAL', '°C', 1000, 1700, 1450, true, 1),
('FURNACE', 'STEEL-SHEET-001', 'Holding Time', 'DECIMAL', 'min', 25, 150, 75, true, 2),
('CASTER', 'STEEL-SHEET-001', 'Casting Speed', 'DECIMAL', 'm/min', 0.6, 3.5, 1.8, true, 1),
('CASTER', 'STEEL-SHEET-001', 'Mold Temperature', 'DECIMAL', '°C', 180, 380, 280, true, 2);

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order) VALUES
('ROLLING', 'STEEL-BAR-001', 'Temperature', 'DECIMAL', '°C', 900, 1150, 1050, true, 1),
('ROLLING', 'STEEL-BAR-001', 'Pressure', 'DECIMAL', 'bar', 60, 220, 140, true, 2),
('ROLLING', 'STEEL-BAR-001', 'Speed', 'DECIMAL', 'm/min', 5, 30, 15, true, 3),
('ROLLING', 'STEEL-BAR-001', 'Diameter', 'DECIMAL', 'mm', 10, 100, 32, true, 4),
('FURNACE', 'STEEL-BAR-001', 'Temperature', 'DECIMAL', '°C', 1100, 1800, 1550, true, 1),
('FURNACE', 'STEEL-BAR-001', 'Holding Time', 'DECIMAL', 'min', 40, 200, 100, true, 2),
('CASTER', 'STEEL-BAR-001', 'Casting Speed', 'DECIMAL', 'm/min', 0.3, 2, 1.0, true, 1),
('CASTER', 'STEEL-BAR-001', 'Mold Temperature', 'DECIMAL', '°C', 220, 420, 320, true, 2);

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order) VALUES
('FINISHING', 'STEEL-SHEET-001', 'Surface Finish', 'TEXT', '', NULL, NULL, NULL, false, 1),
('FINISHING', 'STEEL-SHEET-001', 'Edge Trim', 'DECIMAL', 'mm', 0, 50, 10, false, 2),
('FINISHING', 'STEEL-BAR-001', 'Straightness', 'DECIMAL', 'mm/m', 0, 5, 2, false, 1),
('FINISHING', 'STEEL-BAR-001', 'Cut Length', 'DECIMAL', 'm', 1, 12, 6, true, 2),
('SLITTING', 'STEEL-SHEET-001', 'Slit Width', 'DECIMAL', 'mm', 50, 2000, 500, true, 1),
('SLITTING', 'STEEL-BAR-001', 'Cut Length', 'DECIMAL', 'm', 1, 12, 6, true, 1);

-- =====================================================
-- PART 8: Sample Batch Relations (for genealogy demo)
-- =====================================================

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, created_by)
SELECT p.batch_id, c.batch_id, 'MERGE', 120, 'SYSTEM'
FROM batches p, batches c
WHERE p.batch_number = 'RM-BATCH-001' AND c.batch_number = 'IM-BATCH-001';

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, created_by)
SELECT p.batch_id, c.batch_id, 'MERGE', 30, 'SYSTEM'
FROM batches p, batches c
WHERE p.batch_number = 'RM-BATCH-002' AND c.batch_number = 'IM-BATCH-001';

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, created_by)
SELECT p.batch_id, c.batch_id, 'MERGE', 5, 'SYSTEM'
FROM batches p, batches c
WHERE p.batch_number = 'RM-BATCH-003' AND c.batch_number = 'IM-BATCH-001';

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, created_by)
SELECT p.batch_id, c.batch_id, 'MERGE', 105, 'SYSTEM'
FROM batches p, batches c
WHERE p.batch_number = 'IM-BATCH-001' AND c.batch_number = 'IM-BATCH-002';

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, created_by)
SELECT p.batch_id, c.batch_id, 'MERGE', 55, 'SYSTEM'
FROM batches p, batches c
WHERE p.batch_number = 'IM-BATCH-001' AND c.batch_number = 'IM-BATCH-003';

-- =====================================================
-- PART 9: Update Order Statuses
-- =====================================================

UPDATE orders SET status = 'IN_PROGRESS' WHERE order_id = 2;
UPDATE orders SET status = 'IN_PROGRESS' WHERE order_id = 3;
UPDATE order_line_items SET status = 'IN_PROGRESS' WHERE order_line_id = 2;
UPDATE order_line_items SET status = 'IN_PROGRESS' WHERE order_line_id = 3;
