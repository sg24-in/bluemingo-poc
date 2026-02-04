-- =====================================================
-- MES Production Confirmation - Demo Seed Data (H2 Compatible)
-- Rich data for screenshots and documentation
-- =====================================================

-- 1. Insert Admin User (password: admin123 - BCrypt hashed)
INSERT INTO users (email, password_hash, name, employee_id, status, created_by)
VALUES ('admin@mes.com', '$2a$10$QOowoTebIWE8lpcFwYRUkOfJlLXf4joSBXPzGrFETthgFr/i0I9OW', 'Admin User', 'EMP-001', 'ACTIVE', 'SYSTEM');

-- 2. Insert Delay Reasons
INSERT INTO delay_reasons (reason_code, reason_description) VALUES
('EQUIP_BREAKDOWN', 'Equipment Breakdown'),
('MATERIAL_SHORTAGE', 'Material Shortage'),
('OPERATOR_UNAVAIL', 'Operator Unavailable'),
('QUALITY_ISSUE', 'Quality Issue'),
('SCHEDULING', 'Scheduling Conflict'),
('MAINTENANCE', 'Scheduled Maintenance'),
('OTHER', 'Other');

-- 3. Insert Hold Reasons
INSERT INTO hold_reasons (reason_code, reason_description, applicable_to) VALUES
('EQUIP_BREAKDOWN', 'Equipment Breakdown', 'OPERATION,PROCESS'),
('QUALITY_INVESTIGATION', 'Quality Investigation', 'OPERATION,PROCESS,BATCH,INVENTORY'),
('MATERIAL_SHORTAGE', 'Material Shortage', 'OPERATION,ORDER_LINE'),
('OPERATOR_UNAVAIL', 'Operator Unavailability', 'OPERATION'),
('SAFETY_CONCERN', 'Safety Concern', 'OPERATION,PROCESS,BATCH'),
('REGULATORY_HOLD', 'Regulatory Hold', 'BATCH,INVENTORY'),
('OTHER', 'Other', 'OPERATION,PROCESS,ORDER_LINE,BATCH,INVENTORY');

-- 4. Insert Equipment
INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status) VALUES
('FUR-001', 'Furnace #1', 'BATCH', 100, 'T', 'Melting Shop', 'AVAILABLE'),
('FUR-002', 'Furnace #2', 'BATCH', 120, 'T', 'Melting Shop', 'AVAILABLE'),
('FUR-003', 'Furnace #3', 'BATCH', 80, 'T', 'Melting Shop', 'MAINTENANCE'),
('CAST-001', 'Continuous Caster #1', 'CONTINUOUS', 50, 'T/hr', 'Casting Area', 'AVAILABLE'),
('CAST-002', 'Continuous Caster #2', 'CONTINUOUS', 45, 'T/hr', 'Casting Area', 'IN_USE'),
('ROLL-001', 'Rolling Mill #1', 'CONTINUOUS', 30, 'T/hr', 'Rolling Mill', 'AVAILABLE'),
('ROLL-002', 'Rolling Mill #2', 'CONTINUOUS', 35, 'T/hr', 'Rolling Mill', 'AVAILABLE'),
('ROLL-003', 'Rolling Mill #3', 'CONTINUOUS', 25, 'T/hr', 'Rolling Mill', 'AVAILABLE'),
('TEMP-001', 'Tempering Furnace #1', 'BATCH', 50, 'T', 'Heat Treatment', 'AVAILABLE'),
('TEMP-002', 'Tempering Furnace #2', 'BATCH', 60, 'T', 'Heat Treatment', 'AVAILABLE'),
('CUT-001', 'Slitting Line #1', 'CONTINUOUS', 20, 'T/hr', 'Finishing', 'AVAILABLE'),
('CUT-002', 'Slitting Line #2', 'CONTINUOUS', 25, 'T/hr', 'Finishing', 'ON_HOLD');

-- 5. Insert Operators
INSERT INTO operators (operator_code, name, department, shift, status) VALUES
('OP-001', 'John Smith', 'Production', 'Day', 'ACTIVE'),
('OP-002', 'Mike Wilson', 'Production', 'Day', 'ACTIVE'),
('OP-003', 'Sarah Brown', 'Production', 'Day', 'ACTIVE'),
('OP-004', 'David Lee', 'Production', 'Night', 'ACTIVE'),
('OP-005', 'Emily Chen', 'Production', 'Night', 'ACTIVE'),
('OP-006', 'Robert Garcia', 'Quality', 'Day', 'ACTIVE'),
('OP-007', 'Jennifer Martinez', 'Quality', 'Night', 'ACTIVE'),
('OP-008', 'William Johnson', 'Maintenance', 'Day', 'ACTIVE');

-- 6. Insert Bill of Material for Steel Coil
INSERT INTO bill_of_material (product_sku, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, status) VALUES
-- Level 1: Raw Materials for Molten Metal
('STEEL-COIL-001', 'RM-IRON-ORE', 'Iron Ore', 1.20, 'T', 1.20, 1, 'ACTIVE'),
('STEEL-COIL-001', 'RM-SCRAP', 'Scrap Metal', 0.30, 'T', 1.10, 1, 'ACTIVE'),
('STEEL-COIL-001', 'RM-ALLOY', 'Alloy Mix', 0.05, 'T', 1.05, 1, 'ACTIVE'),
('STEEL-COIL-001', 'RM-COAL', 'Coal', 0.15, 'T', 1.00, 1, 'ACTIVE'),
-- Level 2: Molten Metal
('STEEL-COIL-001', 'IM-MOLTEN', 'Molten Metal', 1.10, 'T', 1.10, 2, 'ACTIVE'),
-- Level 3: Steel Slab
('STEEL-COIL-001', 'IM-SLAB', 'Steel Slab', 1.05, 'T', 1.05, 3, 'ACTIVE'),
-- Level 4: Rolled Coil
('STEEL-COIL-001', 'IM-ROLLED', 'Steel Coil (Rolled)', 1.02, 'T', 1.02, 4, 'ACTIVE'),
-- Level 5: Tempered Coil
('STEEL-COIL-001', 'IM-TEMPERED', 'Steel Coil (Tempered)', 1.01, 'T', 1.01, 5, 'ACTIVE'),
-- Level 6: Finished Goods
('STEEL-COIL-001', 'FG-COIL', 'Finished Steel Coil', 1.00, 'T', 1.00, 6, 'ACTIVE');

-- 7. Insert Sample Orders (multiple orders for rich demo)
INSERT INTO orders (order_id, order_number, customer_id, customer_name, order_date, status, created_by) VALUES
(1, 'ORD-000001', 'CUST-001', 'ABC Steel Corporation', '2026-01-15', 'IN_PROGRESS', 'SYSTEM'),
(2, 'ORD-000002', 'CUST-002', 'XYZ Manufacturing', '2026-01-18', 'IN_PROGRESS', 'SYSTEM'),
(3, 'ORD-000003', 'CUST-003', 'Steel Works Inc', '2026-01-20', 'CREATED', 'SYSTEM'),
(4, 'ORD-000004', 'CUST-004', 'Metro Construction', '2026-01-22', 'COMPLETED', 'SYSTEM'),
(5, 'ORD-000005', 'CUST-001', 'ABC Steel Corporation', '2026-01-25', 'CREATED', 'SYSTEM');

-- 8. Insert Order Line Items
INSERT INTO order_line_items (order_line_id, order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by) VALUES
(1, 1, 'STEEL-COIL-001', 'Steel Coil Grade A', 100, 'T', '2026-02-15', 'IN_PROGRESS', 'SYSTEM'),
(2, 2, 'STEEL-COIL-001', 'Steel Coil Grade A', 50, 'T', '2026-02-20', 'IN_PROGRESS', 'SYSTEM'),
(3, 3, 'STEEL-COIL-001', 'Steel Coil Grade A', 200, 'T', '2026-02-25', 'CREATED', 'SYSTEM'),
(4, 4, 'STEEL-COIL-001', 'Steel Coil Grade A', 75, 'T', '2026-02-10', 'COMPLETED', 'SYSTEM'),
(5, 5, 'STEEL-COIL-001', 'Steel Coil Grade A', 150, 'T', '2026-03-01', 'CREATED', 'SYSTEM');

-- 9. Insert Processes for Order 1 (Full workflow in progress)
INSERT INTO processes (process_id, order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(1, 1, 'Melting', 1, 'COMPLETED', 'SYSTEM'),
(2, 1, 'Casting', 2, 'COMPLETED', 'SYSTEM'),
(3, 1, 'Rolling', 3, 'IN_PROGRESS', 'SYSTEM'),
(4, 1, 'Tempering', 4, 'READY', 'SYSTEM'),
(5, 1, 'Cutting', 5, 'READY', 'SYSTEM');

-- Processes for Order 2 (Early stage)
INSERT INTO processes (process_id, order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(6, 2, 'Melting', 1, 'IN_PROGRESS', 'SYSTEM'),
(7, 2, 'Casting', 2, 'READY', 'SYSTEM'),
(8, 2, 'Rolling', 3, 'READY', 'SYSTEM'),
(9, 2, 'Tempering', 4, 'READY', 'SYSTEM'),
(10, 2, 'Cutting', 5, 'READY', 'SYSTEM');

-- Processes for Order 4 (Completed)
INSERT INTO processes (process_id, order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(11, 4, 'Melting', 1, 'COMPLETED', 'SYSTEM'),
(12, 4, 'Casting', 2, 'COMPLETED', 'SYSTEM'),
(13, 4, 'Rolling', 3, 'COMPLETED', 'SYSTEM'),
(14, 4, 'Tempering', 4, 'COMPLETED', 'SYSTEM'),
(15, 4, 'Cutting', 5, 'COMPLETED', 'SYSTEM');

-- Processes for Order 3 (QUALITY_PENDING and REJECTED for testing)
INSERT INTO processes (process_id, order_line_id, stage_name, stage_sequence, status, usage_decision, created_by) VALUES
(16, 3, 'Melting', 1, 'QUALITY_PENDING', NULL, 'SYSTEM'),
(17, 3, 'Casting', 2, 'REJECTED', 'REJECT', 'SYSTEM'),
(18, 3, 'Rolling', 3, 'READY', NULL, 'SYSTEM');

-- 10. Insert Operations
-- Order 1 - Melting Process Operations (Completed)
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(1, 1, 'Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(2, 1, 'Melting', 'MELT-20', 'FURNACE', 2, 'CONFIRMED', 'SYSTEM');

-- Order 1 - Casting Process Operations (Completed)
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(3, 2, 'Continuous Casting', 'CAST-10', 'CASTER', 1, 'CONFIRMED', 'SYSTEM');

-- Order 1 - Rolling Process Operations (In Progress - READY for demo)
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(4, 3, 'Hot Rolling', 'ROLL-10', 'ROLLING', 1, 'READY', 'SYSTEM'),
(5, 3, 'Cold Rolling', 'ROLL-20', 'ROLLING', 2, 'NOT_STARTED', 'SYSTEM');

-- Order 1 - Tempering Process Operations
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(6, 4, 'Heat Treatment', 'TEMP-10', 'FURNACE', 1, 'NOT_STARTED', 'SYSTEM');

-- Order 1 - Cutting Process Operations
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(7, 5, 'Slitting', 'CUT-10', 'SLITTING', 1, 'NOT_STARTED', 'SYSTEM');

-- Order 2 - Melting (In Progress)
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(8, 6, 'Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(9, 6, 'Melting', 'MELT-20', 'FURNACE', 2, 'READY', 'SYSTEM');

-- Order 2 - Other processes
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(10, 7, 'Continuous Casting', 'CAST-10', 'CASTER', 1, 'NOT_STARTED', 'SYSTEM'),
(11, 8, 'Hot Rolling', 'ROLL-10', 'ROLLING', 1, 'NOT_STARTED', 'SYSTEM'),
(12, 8, 'Cold Rolling', 'ROLL-20', 'ROLLING', 2, 'NOT_STARTED', 'SYSTEM'),
(13, 9, 'Heat Treatment', 'TEMP-10', 'FURNACE', 1, 'NOT_STARTED', 'SYSTEM'),
(14, 10, 'Slitting', 'CUT-10', 'SLITTING', 1, 'NOT_STARTED', 'SYSTEM');

-- Order 4 - All completed
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(15, 11, 'Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(16, 11, 'Melting', 'MELT-20', 'FURNACE', 2, 'CONFIRMED', 'SYSTEM'),
(17, 12, 'Continuous Casting', 'CAST-10', 'CASTER', 1, 'CONFIRMED', 'SYSTEM'),
(18, 13, 'Hot Rolling', 'ROLL-10', 'ROLLING', 1, 'CONFIRMED', 'SYSTEM'),
(19, 13, 'Cold Rolling', 'ROLL-20', 'ROLLING', 2, 'CONFIRMED', 'SYSTEM'),
(20, 14, 'Heat Treatment', 'TEMP-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(21, 15, 'Slitting', 'CUT-10', 'SLITTING', 1, 'CONFIRMED', 'SYSTEM');

-- Order 3 - Operations for quality pending processes
INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(22, 16, 'Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(23, 16, 'Melting', 'MELT-20', 'FURNACE', 2, 'CONFIRMED', 'SYSTEM'),
(24, 17, 'Continuous Casting', 'CAST-10', 'CASTER', 1, 'CONFIRMED', 'SYSTEM'),
(25, 18, 'Hot Rolling', 'ROLL-10', 'ROLLING', 1, 'NOT_STARTED', 'SYSTEM');

-- 11. Insert Sample Batches
INSERT INTO batches (batch_id, batch_number, material_id, material_name, quantity, unit, status, created_by) VALUES
-- Raw Materials (multiple AVAILABLE batches with same material for MERGE testing)
(1, 'RM-BATCH-001', 'RM-IRON-ORE', 'Iron Ore', 500, 'T', 'AVAILABLE', 'SYSTEM'),
(2, 'RM-BATCH-002', 'RM-SCRAP', 'Scrap Metal', 200, 'T', 'AVAILABLE', 'SYSTEM'),
(3, 'RM-BATCH-003', 'RM-ALLOY', 'Alloy Mix', 50, 'T', 'AVAILABLE', 'SYSTEM'),
(4, 'RM-BATCH-004', 'RM-COAL', 'Coal', 100, 'T', 'AVAILABLE', 'SYSTEM'),
(5, 'RM-BATCH-005', 'RM-IRON-ORE', 'Iron Ore', 300, 'T', 'AVAILABLE', 'SYSTEM'),
(6, 'RM-BATCH-006', 'RM-SCRAP', 'Scrap Metal', 150, 'T', 'AVAILABLE', 'SYSTEM'),
-- Additional Iron Ore batches for MERGE testing (same material_id)
(12, 'RM-BATCH-007', 'RM-IRON-ORE', 'Iron Ore', 250, 'T', 'AVAILABLE', 'SYSTEM'),
(13, 'RM-BATCH-008', 'RM-IRON-ORE', 'Iron Ore', 175, 'T', 'AVAILABLE', 'SYSTEM'),
-- Intermediate batches from Order 1
(7, 'IM-BATCH-001', 'IM-MOLTEN', 'Molten Metal', 110, 'T', 'CONSUMED', 'SYSTEM'),
(8, 'IM-BATCH-002', 'IM-SLAB', 'Steel Slab', 105, 'T', 'AVAILABLE', 'SYSTEM'),
(9, 'IM-BATCH-003', 'IM-SLAB', 'Steel Slab', 60, 'T', 'AVAILABLE', 'SYSTEM'),
-- From Order 2
(10, 'IM-BATCH-004', 'IM-MOLTEN', 'Molten Metal', 55, 'T', 'AVAILABLE', 'SYSTEM'),
-- Completed Order 4
(11, 'FG-BATCH-001', 'FG-COIL', 'Finished Steel Coil', 75, 'T', 'AVAILABLE', 'SYSTEM'),
-- Batch on hold for demo
(14, 'RM-BATCH-009', 'RM-SCRAP', 'Scrap Metal', 80, 'T', 'ON_HOLD', 'SYSTEM'),
-- Quarantined batch
(15, 'IM-BATCH-005', 'IM-SLAB', 'Steel Slab', 40, 'T', 'QUARANTINE', 'SYSTEM');

-- 12. Insert Inventory Records
INSERT INTO inventory (inventory_id, material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, block_reason, blocked_by, blocked_on, created_by) VALUES
-- Raw Materials
(1, 'RM-IRON-ORE', 'Iron Ore', 'RM', 'AVAILABLE', 500, 'T', 1, 'Yard-A', NULL, NULL, NULL, 'SYSTEM'),
(2, 'RM-SCRAP', 'Scrap Metal', 'RM', 'AVAILABLE', 200, 'T', 2, 'Yard-B', NULL, NULL, NULL, 'SYSTEM'),
(3, 'RM-ALLOY', 'Alloy Mix', 'RM', 'AVAILABLE', 50, 'T', 3, 'Yard-A', NULL, NULL, NULL, 'SYSTEM'),
(4, 'RM-COAL', 'Coal', 'RM', 'AVAILABLE', 100, 'T', 4, 'Yard-C', NULL, NULL, NULL, 'SYSTEM'),
(5, 'RM-IRON-ORE', 'Iron Ore', 'RM', 'AVAILABLE', 300, 'T', 5, 'Yard-A', NULL, NULL, NULL, 'SYSTEM'),
(6, 'RM-SCRAP', 'Scrap Metal', 'RM', 'AVAILABLE', 150, 'T', 6, 'Yard-B', NULL, NULL, NULL, 'SYSTEM'),
-- Intermediates
(7, 'IM-SLAB', 'Steel Slab', 'IM', 'AVAILABLE', 105, 'T', 8, 'Casting Area', NULL, NULL, NULL, 'SYSTEM'),
(8, 'IM-SLAB', 'Steel Slab', 'IM', 'AVAILABLE', 60, 'T', 9, 'Casting Area', NULL, NULL, NULL, 'SYSTEM'),
(9, 'IM-MOLTEN', 'Molten Metal', 'IM', 'AVAILABLE', 55, 'T', 10, 'Melting Shop', NULL, NULL, NULL, 'SYSTEM'),
-- BLOCKED items for demo (can be unblocked)
(10, 'RM-IRON-ORE', 'Iron Ore (Quality Hold)', 'RM', 'BLOCKED', 50, 'T', NULL, 'Yard-D', 'Suspected contamination - pending lab results', 'OP-006', '2026-01-28 10:00:00', 'SYSTEM'),
(13, 'RM-SCRAP', 'Scrap Metal (Moisture)', 'RM', 'BLOCKED', 75, 'T', NULL, 'Yard-E', 'High moisture content detected', 'OP-006', '2026-01-29 09:00:00', 'SYSTEM'),
-- ON_HOLD items
(11, 'IM-SLAB', 'Steel Slab (Inspection)', 'IM', 'ON_HOLD', 30, 'T', NULL, 'QC Area', NULL, NULL, NULL, 'SYSTEM'),
-- Finished Goods
(12, 'FG-COIL', 'Finished Steel Coil', 'FG', 'AVAILABLE', 75, 'T', 11, 'Warehouse', NULL, NULL, NULL, 'SYSTEM'),
-- Additional inventory for mergeable batches
(14, 'RM-IRON-ORE', 'Iron Ore', 'RM', 'AVAILABLE', 250, 'T', 12, 'Yard-A', NULL, NULL, NULL, 'SYSTEM'),
(15, 'RM-IRON-ORE', 'Iron Ore', 'RM', 'AVAILABLE', 175, 'T', 13, 'Yard-B', NULL, NULL, NULL, 'SYSTEM'),
-- Scrapped item for demo
(16, 'RM-COAL', 'Coal (Contaminated)', 'RM', 'SCRAPPED', 25, 'T', NULL, 'Disposal', NULL, NULL, NULL, 'SYSTEM');

-- 13. Insert Production Confirmations (for completed operations)
INSERT INTO production_confirmation (confirmation_id, operation_id, produced_qty, scrap_qty, start_time, end_time, delay_minutes, delay_reason, notes, status, created_by) VALUES
-- Order 1 Melting
(1, 1, 120, 2, '2026-01-20 08:00:00', '2026-01-20 12:00:00', 15, 'MAINTENANCE', 'Initial batch loading successful', 'CONFIRMED', 'OP-001'),
(2, 2, 110, 5, '2026-01-20 13:00:00', '2026-01-20 18:00:00', 0, NULL, 'Melting completed as expected', 'CONFIRMED', 'OP-001'),
-- Order 1 Casting
(3, 3, 105, 3, '2026-01-21 08:00:00', '2026-01-21 14:00:00', 30, 'EQUIP_BREAKDOWN', 'Minor caster adjustment needed', 'CONFIRMED', 'OP-002'),
-- Order 2 Melting (partial)
(4, 8, 55, 1, '2026-01-25 08:00:00', '2026-01-25 11:00:00', 0, NULL, 'First phase completed', 'CONFIRMED', 'OP-003'),
-- Order 4 (all completed)
(5, 15, 80, 1, '2026-01-10 08:00:00', '2026-01-10 12:00:00', 0, NULL, NULL, 'CONFIRMED', 'OP-001'),
(6, 16, 78, 2, '2026-01-10 13:00:00', '2026-01-10 17:00:00', 0, NULL, NULL, 'CONFIRMED', 'OP-001'),
(7, 17, 76, 1, '2026-01-11 08:00:00', '2026-01-11 14:00:00', 0, NULL, NULL, 'CONFIRMED', 'OP-002'),
(8, 18, 75, 0.5, '2026-01-12 08:00:00', '2026-01-12 12:00:00', 0, NULL, NULL, 'CONFIRMED', 'OP-003'),
(9, 19, 75, 0, '2026-01-12 13:00:00', '2026-01-12 17:00:00', 0, NULL, NULL, 'CONFIRMED', 'OP-003'),
(10, 20, 75, 0, '2026-01-13 08:00:00', '2026-01-13 14:00:00', 0, NULL, NULL, 'CONFIRMED', 'OP-004'),
(11, 21, 75, 0, '2026-01-14 08:00:00', '2026-01-14 12:00:00', 0, NULL, NULL, 'CONFIRMED', 'OP-004');

-- 14. Insert Confirmation Equipment Links
INSERT INTO confirmation_equipment (confirmation_id, equipment_id) VALUES
(1, 1), (2, 1), (3, 4), (4, 2),
(5, 1), (6, 1), (7, 4), (8, 6), (9, 6), (10, 9), (11, 11);

-- 15. Insert Confirmation Operator Links
INSERT INTO confirmation_operators (confirmation_id, operator_id) VALUES
(1, 1), (2, 1), (3, 2), (4, 3),
(5, 1), (6, 1), (7, 2), (8, 3), (9, 3), (10, 4), (11, 4);

-- 16. Insert Hold Records (active holds for demo)
INSERT INTO hold_records (hold_id, entity_type, entity_id, reason, comments, applied_by, applied_on, status) VALUES
(1, 'INVENTORY', 10, 'QUALITY_INVESTIGATION', 'Suspected contamination - pending lab results', 'OP-006', '2026-01-28 10:00:00', 'ACTIVE'),
(2, 'INVENTORY', 11, 'QUALITY_INVESTIGATION', 'Surface defects found during inspection', 'OP-006', '2026-01-29 14:00:00', 'ACTIVE'),
(3, 'EQUIPMENT', 12, 'EQUIP_BREAKDOWN', 'Motor failure - awaiting replacement parts', 'OP-008', '2026-01-27 09:00:00', 'ACTIVE'),
(4, 'BATCH', 14, 'QUALITY_INVESTIGATION', 'Scrap metal quality verification needed', 'OP-006', '2026-01-30 08:00:00', 'ACTIVE'),
(5, 'OPERATION', 25, 'MATERIAL_SHORTAGE', 'Waiting for upstream process completion', 'OP-001', '2026-01-31 10:00:00', 'ACTIVE');

-- 17. Insert Audit Trail entries for demo
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('BATCH', 1, 'CREATE', 'Created batch RM-BATCH-001', 'SYSTEM', '2026-01-15 08:00:00'),
('BATCH', 2, 'CREATE', 'Created batch RM-BATCH-002', 'SYSTEM', '2026-01-15 08:05:00'),
('ORDER', 1, 'STATUS_CHANGE', 'Order #1 status: CREATED -> IN_PROGRESS', 'admin', '2026-01-20 07:45:00'),
('OPERATION', 1, 'CONFIRM', 'Operation Furnace Loading confirmed - 120T produced', 'OP-001', '2026-01-20 12:00:00'),
('OPERATION', 2, 'CONFIRM', 'Operation Melting confirmed - 110T produced', 'OP-001', '2026-01-20 18:00:00'),
('BATCH', 7, 'CONSUME', 'Batch IM-BATCH-001 consumed in casting', 'OP-002', '2026-01-21 08:30:00'),
('BATCH', 8, 'PRODUCE', 'Batch IM-BATCH-002 produced from casting', 'OP-002', '2026-01-21 14:00:00'),
('OPERATION', 3, 'CONFIRM', 'Operation Continuous Casting confirmed - 105T produced', 'OP-002', '2026-01-21 14:00:00'),
('INVENTORY', 10, 'HOLD', 'Inventory blocked for quality investigation', 'OP-006', '2026-01-28 10:00:00'),
('ORDER', 4, 'STATUS_CHANGE', 'Order #4 status: IN_PROGRESS -> COMPLETED', 'admin', '2026-01-14 16:00:00');

-- 18. Insert Process Parameters Configuration
INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order) VALUES
('ROLLING', 'STEEL-COIL-001', 'Temperature', 'DECIMAL', '°C', 700, 1000, 850, true, 1),
('ROLLING', 'STEEL-COIL-001', 'Pressure', 'DECIMAL', 'bar', 50, 200, 120, true, 2),
('ROLLING', 'STEEL-COIL-001', 'Speed', 'DECIMAL', 'm/min', 10, 50, 25, true, 3),
('ROLLING', 'STEEL-COIL-001', 'Thickness', 'DECIMAL', 'mm', 1, 10, 2.5, true, 4),
('ROLLING', 'STEEL-COIL-001', 'Energy Consumption', 'DECIMAL', 'kWh', 0, 1000, 450, false, 5),
('ROLLING', 'STEEL-COIL-001', 'Coolant Usage', 'DECIMAL', 'L', 0, 500, 150, false, 6),
('FURNACE', 'STEEL-COIL-001', 'Temperature', 'DECIMAL', '°C', 1000, 1800, 1500, true, 1),
('FURNACE', 'STEEL-COIL-001', 'Holding Time', 'DECIMAL', 'min', 30, 180, 90, true, 2),
('CASTER', 'STEEL-COIL-001', 'Casting Speed', 'DECIMAL', 'm/min', 0.5, 3, 1.5, true, 1),
('CASTER', 'STEEL-COIL-001', 'Mold Temperature', 'DECIMAL', '°C', 200, 400, 300, true, 2),
('SLITTING', 'STEEL-COIL-001', 'Blade Speed', 'DECIMAL', 'RPM', 100, 500, 300, true, 1),
('SLITTING', 'STEEL-COIL-001', 'Cut Width', 'DECIMAL', 'mm', 100, 2000, 1000, true, 2);
