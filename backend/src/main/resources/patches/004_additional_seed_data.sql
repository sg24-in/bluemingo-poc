-- =====================================================
-- MES Production Confirmation - Additional Seed Data
-- Patch: 004
-- Description: Add more products, BOM, processes for Orders 2 & 3, and additional batches
-- =====================================================

-- =====================================================
-- PART 1: Additional Products - Steel Sheet (STEEL-SHEET-001)
-- =====================================================

-- Bill of Material for Steel Sheet
INSERT INTO bill_of_material (product_sku, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, status) VALUES
-- Level 1: Raw Materials
('STEEL-SHEET-001', 'RM-IRON-ORE', 'Iron Ore', 1.15, 'T', 1.15, 1, 'ACTIVE'),
('STEEL-SHEET-001', 'RM-SCRAP', 'Scrap Metal', 0.25, 'T', 1.10, 1, 'ACTIVE'),
('STEEL-SHEET-001', 'RM-ALLOY', 'Alloy Mix', 0.04, 'T', 1.05, 1, 'ACTIVE'),
-- Level 2: Molten Metal
('STEEL-SHEET-001', 'IM-MOLTEN', 'Molten Metal', 1.08, 'T', 1.08, 2, 'ACTIVE'),
-- Level 3: Steel Slab
('STEEL-SHEET-001', 'IM-SLAB', 'Steel Slab', 1.04, 'T', 1.04, 3, 'ACTIVE'),
-- Level 4: Rolled Sheet
('STEEL-SHEET-001', 'IM-SHEET-ROLLED', 'Steel Sheet (Rolled)', 1.02, 'T', 1.02, 4, 'ACTIVE'),
-- Level 5: Finished Sheet
('STEEL-SHEET-001', 'FG-SHEET', 'Finished Steel Sheet', 1.00, 'T', 1.00, 5, 'ACTIVE');

-- =====================================================
-- PART 2: Additional Products - Steel Bar (STEEL-BAR-001)
-- =====================================================

-- Bill of Material for Steel Bar
INSERT INTO bill_of_material (product_sku, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, status) VALUES
-- Level 1: Raw Materials
('STEEL-BAR-001', 'RM-IRON-ORE', 'Iron Ore', 1.18, 'T', 1.18, 1, 'ACTIVE'),
('STEEL-BAR-001', 'RM-SCRAP', 'Scrap Metal', 0.28, 'T', 1.12, 1, 'ACTIVE'),
('STEEL-BAR-001', 'RM-ALLOY', 'Alloy Mix', 0.06, 'T', 1.06, 1, 'ACTIVE'),
-- Level 2: Molten Metal
('STEEL-BAR-001', 'IM-MOLTEN', 'Molten Metal', 1.12, 'T', 1.12, 2, 'ACTIVE'),
-- Level 3: Steel Billet
('STEEL-BAR-001', 'IM-BILLET', 'Steel Billet', 1.06, 'T', 1.06, 3, 'ACTIVE'),
-- Level 4: Rolled Bar
('STEEL-BAR-001', 'IM-BAR-ROLLED', 'Steel Bar (Rolled)', 1.03, 'T', 1.03, 4, 'ACTIVE'),
-- Level 5: Finished Bar
('STEEL-BAR-001', 'FG-BAR', 'Finished Steel Bar', 1.00, 'T', 1.00, 5, 'ACTIVE');

-- =====================================================
-- PART 3: Update Order Line Items with new products
-- =====================================================

-- Update Order 2 to use Steel Sheet
UPDATE order_line_items
SET product_sku = 'STEEL-SHEET-001',
    product_name = 'Steel Sheet Grade A'
WHERE order_id = 2;

-- Update Order 3 to use Steel Bar
UPDATE order_line_items
SET product_sku = 'STEEL-BAR-001',
    product_name = 'Steel Bar Grade A'
WHERE order_id = 3;

-- =====================================================
-- PART 4: Processes for Order 2 (Steel Sheet)
-- =====================================================

INSERT INTO processes (order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(2, 'Melting', 1, 'COMPLETED', 'SYSTEM'),
(2, 'Casting', 2, 'IN_PROGRESS', 'SYSTEM'),
(2, 'Rolling', 3, 'READY', 'SYSTEM'),
(2, 'Finishing', 4, 'READY', 'SYSTEM');

-- Operations for Order 2 Processes
-- Melting Process (process_id = 6)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(6, 'Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(6, 'Melting', 'MELT-20', 'FURNACE', 2, 'CONFIRMED', 'SYSTEM');

-- Casting Process (process_id = 7)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(7, 'Continuous Casting', 'CAST-10', 'CASTER', 1, 'READY', 'SYSTEM');

-- Rolling Process (process_id = 8)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(8, 'Hot Rolling', 'ROLL-10', 'ROLLING', 1, 'NOT_STARTED', 'SYSTEM'),
(8, 'Cold Rolling', 'ROLL-20', 'ROLLING', 2, 'NOT_STARTED', 'SYSTEM');

-- Finishing Process (process_id = 9)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(9, 'Leveling', 'FIN-10', 'FINISHING', 1, 'NOT_STARTED', 'SYSTEM'),
(9, 'Cutting', 'FIN-20', 'SLITTING', 2, 'NOT_STARTED', 'SYSTEM');

-- =====================================================
-- PART 5: Processes for Order 3 (Steel Bar)
-- =====================================================

INSERT INTO processes (order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(3, 'Melting', 1, 'IN_PROGRESS', 'SYSTEM'),
(3, 'Casting', 2, 'READY', 'SYSTEM'),
(3, 'Rolling', 3, 'READY', 'SYSTEM'),
(3, 'Finishing', 4, 'READY', 'SYSTEM');

-- Operations for Order 3 Processes
-- Melting Process (process_id = 10)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(10, 'Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(10, 'Melting', 'MELT-20', 'FURNACE', 2, 'READY', 'SYSTEM');

-- Casting Process (process_id = 11)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(11, 'Billet Casting', 'CAST-10', 'CASTER', 1, 'NOT_STARTED', 'SYSTEM');

-- Rolling Process (process_id = 12)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(12, 'Bar Rolling', 'ROLL-10', 'ROLLING', 1, 'NOT_STARTED', 'SYSTEM');

-- Finishing Process (process_id = 13)
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(13, 'Bar Cutting', 'FIN-10', 'SLITTING', 1, 'NOT_STARTED', 'SYSTEM'),
(13, 'Straightening', 'FIN-20', 'FINISHING', 2, 'NOT_STARTED', 'SYSTEM');

-- =====================================================
-- PART 6: Additional Batches and Inventory
-- =====================================================

-- More Raw Material Batches
INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by) VALUES
('RM-BATCH-005', 'RM-IRON-ORE', 'Iron Ore', 300, 'T', 'AVAILABLE', 'SYSTEM'),
('RM-BATCH-006', 'RM-SCRAP', 'Scrap Metal', 150, 'T', 'AVAILABLE', 'SYSTEM'),
('RM-BATCH-007', 'RM-ALLOY', 'Alloy Mix', 30, 'T', 'AVAILABLE', 'SYSTEM'),
-- Additional Intermediate batches
('IM-BATCH-004', 'IM-MOLTEN', 'Molten Metal', 55, 'T', 'AVAILABLE', 'SYSTEM'),
('IM-BATCH-005', 'IM-SLAB', 'Steel Slab', 52, 'T', 'AVAILABLE', 'SYSTEM'),
('IM-BATCH-006', 'IM-BILLET', 'Steel Billet', 80, 'T', 'AVAILABLE', 'SYSTEM'),
-- Finished Goods batches
('FG-BATCH-001', 'FG-COIL', 'Finished Steel Coil', 45, 'T', 'AVAILABLE', 'SYSTEM'),
('FG-BATCH-002', 'FG-SHEET', 'Finished Steel Sheet', 30, 'T', 'AVAILABLE', 'SYSTEM');

-- Additional Inventory Records
INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by) VALUES
('RM-IRON-ORE', 'Iron Ore', 'RM', 'AVAILABLE', 300, 'T', 8, 'Yard-A', 'SYSTEM'),
('RM-SCRAP', 'Scrap Metal', 'RM', 'AVAILABLE', 150, 'T', 9, 'Yard-B', 'SYSTEM'),
('RM-ALLOY', 'Alloy Mix', 'RM', 'AVAILABLE', 30, 'T', 10, 'Yard-A', 'SYSTEM'),
('IM-MOLTEN', 'Molten Metal', 'IM', 'AVAILABLE', 55, 'T', 11, 'Melting Shop', 'SYSTEM'),
('IM-SLAB', 'Steel Slab', 'IM', 'AVAILABLE', 52, 'T', 12, 'Casting Area', 'SYSTEM'),
('IM-BILLET', 'Steel Billet', 'IM', 'AVAILABLE', 80, 'T', 13, 'Casting Area', 'SYSTEM'),
('FG-COIL', 'Finished Steel Coil', 'FG', 'AVAILABLE', 45, 'T', 14, 'Warehouse-1', 'SYSTEM'),
('FG-SHEET', 'Finished Steel Sheet', 'FG', 'AVAILABLE', 30, 'T', 15, 'Warehouse-1', 'SYSTEM');

-- =====================================================
-- PART 7: Process Parameters for New Products
-- =====================================================

-- Steel Sheet Rolling Parameters
INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order) VALUES
('ROLLING', 'STEEL-SHEET-001', 'Temperature', 'DECIMAL', '°C', 650, 950, 800, true, 1),
('ROLLING', 'STEEL-SHEET-001', 'Pressure', 'DECIMAL', 'bar', 40, 180, 100, true, 2),
('ROLLING', 'STEEL-SHEET-001', 'Speed', 'DECIMAL', 'm/min', 15, 60, 35, true, 3),
('ROLLING', 'STEEL-SHEET-001', 'Thickness', 'DECIMAL', 'mm', 0.5, 6, 1.5, true, 4),
('FURNACE', 'STEEL-SHEET-001', 'Temperature', 'DECIMAL', '°C', 1000, 1700, 1450, true, 1),
('FURNACE', 'STEEL-SHEET-001', 'Holding Time', 'DECIMAL', 'min', 25, 150, 75, true, 2),
('CASTER', 'STEEL-SHEET-001', 'Casting Speed', 'DECIMAL', 'm/min', 0.6, 3.5, 1.8, true, 1),
('CASTER', 'STEEL-SHEET-001', 'Mold Temperature', 'DECIMAL', '°C', 180, 380, 280, true, 2);

-- Steel Bar Rolling Parameters
INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order) VALUES
('ROLLING', 'STEEL-BAR-001', 'Temperature', 'DECIMAL', '°C', 900, 1150, 1050, true, 1),
('ROLLING', 'STEEL-BAR-001', 'Pressure', 'DECIMAL', 'bar', 60, 220, 140, true, 2),
('ROLLING', 'STEEL-BAR-001', 'Speed', 'DECIMAL', 'm/min', 5, 30, 15, true, 3),
('ROLLING', 'STEEL-BAR-001', 'Diameter', 'DECIMAL', 'mm', 10, 100, 32, true, 4),
('FURNACE', 'STEEL-BAR-001', 'Temperature', 'DECIMAL', '°C', 1100, 1800, 1550, true, 1),
('FURNACE', 'STEEL-BAR-001', 'Holding Time', 'DECIMAL', 'min', 40, 200, 100, true, 2),
('CASTER', 'STEEL-BAR-001', 'Casting Speed', 'DECIMAL', 'm/min', 0.3, 2, 1.0, true, 1),
('CASTER', 'STEEL-BAR-001', 'Mold Temperature', 'DECIMAL', '°C', 220, 420, 320, true, 2);

-- Finishing Operation Parameters
INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order) VALUES
('FINISHING', 'STEEL-SHEET-001', 'Surface Finish', 'TEXT', '', NULL, NULL, 'Standard', false, 1),
('FINISHING', 'STEEL-SHEET-001', 'Edge Trim', 'DECIMAL', 'mm', 0, 50, 10, false, 2),
('FINISHING', 'STEEL-BAR-001', 'Straightness', 'DECIMAL', 'mm/m', 0, 5, 2, false, 1),
('FINISHING', 'STEEL-BAR-001', 'Cut Length', 'DECIMAL', 'm', 1, 12, 6, true, 2),
('SLITTING', 'STEEL-SHEET-001', 'Slit Width', 'DECIMAL', 'mm', 50, 2000, 500, true, 1),
('SLITTING', 'STEEL-BAR-001', 'Cut Length', 'DECIMAL', 'm', 1, 12, 6, true, 1);

-- =====================================================
-- PART 8: Sample Batch Relations (for genealogy demo)
-- =====================================================

-- Create batch relations showing material flow from RM to IM
INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, created_by) VALUES
-- Raw materials merged into Molten Metal (IM-BATCH-001)
(1, 5, 'MERGE', 120, 'SYSTEM'),  -- RM-IRON-ORE -> IM-MOLTEN
(2, 5, 'MERGE', 30, 'SYSTEM'),   -- RM-SCRAP -> IM-MOLTEN
(3, 5, 'MERGE', 5, 'SYSTEM'),    -- RM-ALLOY -> IM-MOLTEN
-- Molten Metal cast into Steel Slabs
(5, 6, 'MERGE', 105, 'SYSTEM'),  -- IM-MOLTEN -> IM-SLAB (BATCH-002)
(5, 7, 'MERGE', 55, 'SYSTEM');   -- IM-MOLTEN -> IM-SLAB (BATCH-003) - from same molten batch

-- =====================================================
-- PART 9: Update Order Statuses
-- =====================================================

-- Update Order 2 to IN_PROGRESS since it has active processes
UPDATE orders SET status = 'IN_PROGRESS' WHERE order_id = 2;

-- Update Order Line 2 status
UPDATE order_line_items SET status = 'IN_PROGRESS' WHERE order_line_id = 2;

-- Update Order Line 3 status
UPDATE order_line_items SET status = 'IN_PROGRESS' WHERE order_line_id = 3;

-- Update Order 3 to IN_PROGRESS
UPDATE orders SET status = 'IN_PROGRESS' WHERE order_id = 3;
