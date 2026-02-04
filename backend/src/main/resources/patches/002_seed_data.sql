-- =====================================================
-- MES Production Confirmation - Seed Data
-- Patch: 002
-- Description: Insert initial master data and sample data for POC
-- =====================================================

-- 1. Insert Admin User (password: admin123 - BCrypt hashed)
INSERT INTO users (email, password_hash, name, employee_id, status, created_by)
VALUES ('admin@mes.com', '$2a$10$QOowoTebIWE8lpcFwYRUkOfJlLXf4joSBXPzGrFETthgFr/i0I9OW', 'Admin User', 'EMP-001', 'ACTIVE', 'SYSTEM')
ON CONFLICT (email) DO NOTHING;

-- 2. Insert Delay Reasons
INSERT INTO delay_reasons (reason_code, reason_description) VALUES
('EQUIP_BREAKDOWN', 'Equipment Breakdown'),
('MATERIAL_SHORTAGE', 'Material Shortage'),
('OPERATOR_UNAVAIL', 'Operator Unavailable'),
('QUALITY_ISSUE', 'Quality Issue'),
('SCHEDULING', 'Scheduling Conflict'),
('MAINTENANCE', 'Scheduled Maintenance'),
('OTHER', 'Other')
ON CONFLICT (reason_code) DO NOTHING;

-- 3. Insert Hold Reasons
INSERT INTO hold_reasons (reason_code, reason_description, applicable_to) VALUES
('EQUIP_BREAKDOWN', 'Equipment Breakdown', 'OPERATION,PROCESS'),
('QUALITY_INVESTIGATION', 'Quality Investigation', 'OPERATION,PROCESS,BATCH,INVENTORY'),
('MATERIAL_SHORTAGE', 'Material Shortage', 'OPERATION,ORDER_LINE'),
('OPERATOR_UNAVAIL', 'Operator Unavailability', 'OPERATION'),
('SAFETY_CONCERN', 'Safety Concern', 'OPERATION,PROCESS,BATCH'),
('REGULATORY_HOLD', 'Regulatory Hold', 'BATCH,INVENTORY'),
('OTHER', 'Other', 'OPERATION,PROCESS,ORDER_LINE,BATCH,INVENTORY')
ON CONFLICT (reason_code) DO NOTHING;

-- 4. Insert Equipment
INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status) VALUES
('FUR-001', 'Furnace #1', 'BATCH', 100, 'T', 'Melting Shop', 'AVAILABLE'),
('FUR-002', 'Furnace #2', 'BATCH', 120, 'T', 'Melting Shop', 'AVAILABLE'),
('CAST-001', 'Continuous Caster #1', 'CONTINUOUS', 50, 'T/hr', 'Casting Area', 'AVAILABLE'),
('ROLL-001', 'Rolling Mill #1', 'CONTINUOUS', 30, 'T/hr', 'Rolling Mill', 'AVAILABLE'),
('ROLL-002', 'Rolling Mill #2', 'CONTINUOUS', 35, 'T/hr', 'Rolling Mill', 'AVAILABLE'),
('ROLL-003', 'Rolling Mill #3', 'CONTINUOUS', 25, 'T/hr', 'Rolling Mill', 'AVAILABLE'),
('TEMP-001', 'Tempering Furnace #1', 'BATCH', 50, 'T', 'Heat Treatment', 'AVAILABLE'),
('CUT-001', 'Slitting Line #1', 'CONTINUOUS', 20, 'T/hr', 'Finishing', 'AVAILABLE')
ON CONFLICT (equipment_code) DO NOTHING;

-- 5. Insert Operators
INSERT INTO operators (operator_code, name, department, shift, status) VALUES
('OP-001', 'John Smith', 'Production', 'Day', 'ACTIVE'),
('OP-002', 'Mike Wilson', 'Production', 'Day', 'ACTIVE'),
('OP-003', 'Sarah Brown', 'Production', 'Day', 'ACTIVE'),
('OP-004', 'David Lee', 'Production', 'Night', 'ACTIVE'),
('OP-005', 'Emily Chen', 'Production', 'Night', 'ACTIVE')
ON CONFLICT (operator_code) DO NOTHING;

-- 6. Insert Bill of Material for Steel Coil
-- BOM Structure: Raw Materials -> Molten Metal -> Steel Slab -> Steel Coil (Rolled) -> Steel Coil (Tempered) -> Finished Steel Coil

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

-- 7. Insert Sample Orders
INSERT INTO orders (order_number, customer_id, customer_name, order_date, status, created_by) VALUES
('ORD-000001', 'CUST-001', 'ABC Steel Corporation', '2026-01-15', 'IN_PROGRESS', 'SYSTEM'),
('ORD-000002', 'CUST-002', 'XYZ Manufacturing', '2026-01-18', 'CREATED', 'SYSTEM'),
('ORD-000003', 'CUST-003', 'Steel Works Inc', '2026-01-20', 'CREATED', 'SYSTEM');

-- 8. Insert Order Line Items
INSERT INTO order_line_items (order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by) VALUES
(1, 'STEEL-COIL-001', 'Steel Coil Grade A', 100, 'T', '2026-02-15', 'IN_PROGRESS', 'SYSTEM'),
(2, 'STEEL-COIL-001', 'Steel Coil Grade A', 50, 'T', '2026-02-20', 'CREATED', 'SYSTEM'),
(3, 'STEEL-COIL-001', 'Steel Coil Grade A', 200, 'T', '2026-02-25', 'CREATED', 'SYSTEM');

-- 9. Insert Processes for Order 1
INSERT INTO processes (order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(1, 'Melting', 1, 'COMPLETED', 'SYSTEM'),
(1, 'Casting', 2, 'COMPLETED', 'SYSTEM'),
(1, 'Rolling', 3, 'IN_PROGRESS', 'SYSTEM'),
(1, 'Tempering', 4, 'READY', 'SYSTEM'),
(1, 'Cutting', 5, 'READY', 'SYSTEM');

-- 10. Insert Operations for each Process
-- Melting Process Operations
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(1, 'Furnace Loading', 'MELT-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(1, 'Melting', 'MELT-20', 'FURNACE', 2, 'CONFIRMED', 'SYSTEM');

-- Casting Process Operations
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(2, 'Continuous Casting', 'CAST-10', 'CASTER', 1, 'CONFIRMED', 'SYSTEM');

-- Rolling Process Operations
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(3, 'Hot Rolling', 'ROLL-10', 'ROLLING', 1, 'READY', 'SYSTEM'),
(3, 'Cold Rolling', 'ROLL-20', 'ROLLING', 2, 'NOT_STARTED', 'SYSTEM');

-- Tempering Process Operations
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(4, 'Heat Treatment', 'TEMP-10', 'FURNACE', 1, 'NOT_STARTED', 'SYSTEM');

-- Cutting Process Operations
INSERT INTO operations (process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
(5, 'Slitting', 'CUT-10', 'SLITTING', 1, 'NOT_STARTED', 'SYSTEM');

-- 11. Insert Sample Batches (Raw Materials)
INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by) VALUES
('RM-BATCH-001', 'RM-IRON-ORE', 'Iron Ore', 500, 'T', 'AVAILABLE', 'SYSTEM'),
('RM-BATCH-002', 'RM-SCRAP', 'Scrap Metal', 200, 'T', 'AVAILABLE', 'SYSTEM'),
('RM-BATCH-003', 'RM-ALLOY', 'Alloy Mix', 50, 'T', 'AVAILABLE', 'SYSTEM'),
('RM-BATCH-004', 'RM-COAL', 'Coal', 100, 'T', 'AVAILABLE', 'SYSTEM'),
-- Intermediate batches from completed processes
('IM-BATCH-001', 'IM-MOLTEN', 'Molten Metal', 110, 'T', 'CONSUMED', 'SYSTEM'),
('IM-BATCH-002', 'IM-SLAB', 'Steel Slab', 105, 'T', 'AVAILABLE', 'SYSTEM'),
('IM-BATCH-003', 'IM-SLAB', 'Steel Slab', 60, 'T', 'AVAILABLE', 'SYSTEM');

-- 12. Insert Inventory Records
INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by) VALUES
('RM-IRON-ORE', 'Iron Ore', 'RM', 'AVAILABLE', 500, 'T', 1, 'Yard-A', 'SYSTEM'),
('RM-SCRAP', 'Scrap Metal', 'RM', 'AVAILABLE', 200, 'T', 2, 'Yard-B', 'SYSTEM'),
('RM-ALLOY', 'Alloy Mix', 'RM', 'AVAILABLE', 50, 'T', 3, 'Yard-A', 'SYSTEM'),
('RM-COAL', 'Coal', 'RM', 'AVAILABLE', 100, 'T', 4, 'Yard-C', 'SYSTEM'),
('IM-SLAB', 'Steel Slab', 'IM', 'AVAILABLE', 105, 'T', 6, 'Casting Area', 'SYSTEM'),
('IM-SLAB', 'Steel Slab', 'IM', 'AVAILABLE', 60, 'T', 7, 'Casting Area', 'SYSTEM');

-- 13. Insert Process Parameters Configuration
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
('CASTER', 'STEEL-COIL-001', 'Mold Temperature', 'DECIMAL', '°C', 200, 400, 300, true, 2);
