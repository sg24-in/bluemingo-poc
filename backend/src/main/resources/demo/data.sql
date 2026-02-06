-- =====================================================
-- MES Production Confirmation - Comprehensive Demo Data
-- Clears all data EXCEPT users table, then inserts
-- rich multi-level BOM trees, diverse materials, orders,
-- batches with genealogy, inventory, holds, and audit trail.
-- =====================================================

-- =====================================================
-- STEP 0: Clear all existing data (preserve users & patches)
-- =====================================================
-- For PostgreSQL run:
--   TRUNCATE TABLE audit_trail, hold_records, inventory_movement, batch_order_allocation,
--     batch_relations, confirmation_equipment, confirmation_operators,
--     production_confirmation, operation_equipment_usage,
--     inventory, batches, operations, routing_steps, routing, processes,
--     order_line_items, orders, bill_of_material,
--     equipment, operators, delay_reasons, hold_reasons,
--     process_parameters_config, customers, materials, products
--   RESTART IDENTITY CASCADE;
-- H2-compatible version:
DELETE FROM audit_trail;
DELETE FROM hold_records;
DELETE FROM inventory_movement;
DELETE FROM batch_order_allocation;
DELETE FROM batch_relations;
DELETE FROM confirmation_equipment;
DELETE FROM confirmation_operators;
DELETE FROM production_confirmation;
DELETE FROM operation_equipment_usage;
DELETE FROM inventory;
DELETE FROM batches;
DELETE FROM operations;
DELETE FROM routing_steps;
DELETE FROM routing;
DELETE FROM processes;
DELETE FROM order_line_items;
DELETE FROM orders;
DELETE FROM bill_of_material;
DELETE FROM process_parameters_config;
DELETE FROM equipment;
DELETE FROM operators;
DELETE FROM delay_reasons;
DELETE FROM hold_reasons;
DELETE FROM customers;
DELETE FROM materials;
DELETE FROM products;

-- =====================================================
-- STEP 1: Admin User (idempotent)
-- =====================================================
MERGE INTO users (email, password_hash, name, employee_id, status, created_by)
KEY (email)
VALUES ('admin@mes.com', '$2a$10$QOowoTebIWE8lpcFwYRUkOfJlLXf4joSBXPzGrFETthgFr/i0I9OW', 'Admin User', 'EMP-001', 'ACTIVE', 'SYSTEM');

-- =====================================================
-- STEP 2: Lookup Tables
-- =====================================================

INSERT INTO delay_reasons (reason_code, reason_description) VALUES
('EQUIP_BREAKDOWN', 'Equipment Breakdown'),
('MATERIAL_SHORTAGE', 'Material Shortage'),
('OPERATOR_UNAVAIL', 'Operator Unavailable'),
('QUALITY_ISSUE', 'Quality Issue'),
('SCHEDULING', 'Scheduling Conflict'),
('MAINTENANCE', 'Scheduled Maintenance'),
('OTHER', 'Other');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to) VALUES
('EQUIP_BREAKDOWN', 'Equipment Breakdown', 'OPERATION,PROCESS'),
('QUALITY_INVESTIGATION', 'Quality Investigation', 'OPERATION,PROCESS,BATCH,INVENTORY'),
('MATERIAL_SHORTAGE', 'Material Shortage', 'OPERATION,ORDER_LINE'),
('OPERATOR_UNAVAIL', 'Operator Unavailability', 'OPERATION'),
('SAFETY_CONCERN', 'Safety Concern', 'OPERATION,PROCESS,BATCH'),
('REGULATORY_HOLD', 'Regulatory Hold', 'BATCH,INVENTORY'),
('OTHER', 'Other', 'OPERATION,PROCESS,ORDER_LINE,BATCH,INVENTORY');

-- =====================================================
-- STEP 3: Customers (8)
-- =====================================================
INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, status, created_by) VALUES
('CUST-001', 'ABC Steel Corporation',    'John Smith',     'john.smith@abcsteel.com',     '+1-555-0101', '123 Industrial Ave',      'Pittsburgh',  'USA',     'ACTIVE', 'SYSTEM'),
('CUST-002', 'Global Manufacturing Ltd', 'Sarah Johnson',  'sarah.j@globalmanuf.com',     '+1-555-0102', '456 Factory Road',        'Detroit',     'USA',     'ACTIVE', 'SYSTEM'),
('CUST-003', 'Pacific Metal Works',      'Michael Chen',   'm.chen@pacificmetal.com',     '+1-555-0103', '789 Harbor Blvd',         'Los Angeles', 'USA',     'ACTIVE', 'SYSTEM'),
('CUST-004', 'European Auto Parts GmbH', 'Hans Mueller',   'h.mueller@euroauto.eu',       '+49-30-5504', '10 Industriestrasse',     'Munich',      'Germany', 'ACTIVE', 'SYSTEM'),
('CUST-005', 'Asian Electronics Inc',    'Yuki Tanaka',    'y.tanaka@asianelec.jp',       '+81-3-55050', '5-1 Tech Park',           'Tokyo',       'Japan',   'ACTIVE', 'SYSTEM'),
('CUST-006', 'BuildRight Construction',  'Tom Bradley',    'tom.b@buildright.com',        '+1-555-0106', '900 Contractor Lane',     'Chicago',     'USA',     'ACTIVE', 'SYSTEM'),
('CUST-007', 'Nordic Steel Trading AB',  'Erik Lindqvist', 'erik@nordicsteel.se',         '+46-8-55070', '15 Hamngatan',            'Stockholm',   'Sweden',  'ACTIVE', 'SYSTEM'),
('CUST-008', 'Middle East Metals FZE',   'Ahmed Al-Rashid','ahmed@memetals.ae',           '+971-4-5508', 'JAFZA South, Block 12',   'Dubai',       'UAE',     'ACTIVE', 'SYSTEM');

-- =====================================================
-- STEP 4: Materials Master Data (23 materials)
-- =====================================================
INSERT INTO materials (material_code, material_name, description, material_type, base_unit, material_group, standard_cost, cost_currency, min_stock_level, reorder_point, lead_time_days, status, created_by) VALUES
-- Raw Materials (13)
('RM-SCRAP-A',    'Steel Scrap Grade A',     'High-quality HMS1 steel scrap',            'RM', 'T',  'Scrap',     250.00, 'USD', 100, 200,  3, 'ACTIVE', 'SYSTEM'),
('RM-SCRAP-B',    'Steel Scrap Grade B',     'HMS2 mixed steel scrap',                   'RM', 'T',  'Scrap',     200.00, 'USD',  50, 100,  3, 'ACTIVE', 'SYSTEM'),
('RM-IRON-ORE',   'Iron Ore Pellets',        'DR-grade iron ore pellets, 67% Fe',        'RM', 'T',  'Iron',      150.00, 'USD',  80, 150, 14, 'ACTIVE', 'SYSTEM'),
('RM-LIMESTONE',  'Limestone',               'High-calcium flux grade limestone',         'RM', 'T',  'Flux',       50.00, 'USD',  30,  60,  5, 'ACTIVE', 'SYSTEM'),
('RM-FESI',       'Ferroalloy - FeSi',       'Ferrosilicon 75% for deoxidation',         'RM', 'KG', 'Alloy',       2.50, 'USD', 500, 1000, 7, 'ACTIVE', 'SYSTEM'),
('RM-FEMN',       'Ferroalloy - FeMn',       'Ferromanganese 78% for strengthening',     'RM', 'KG', 'Alloy',       3.00, 'USD', 400,  800, 7, 'ACTIVE', 'SYSTEM'),
('RM-COAL',       'Coal / Coke',             'Met-grade coke for energy and reduction',  'RM', 'T',  'Energy',    120.00, 'USD',  50, 100,  7, 'ACTIVE', 'SYSTEM'),
('RM-GRAPHITE',   'Graphite Electrodes',     'UHP graphite electrodes 600mm',            'RM', 'EA', 'Consumable', 800.00, 'USD',  10,  20, 21, 'ACTIVE', 'SYSTEM'),
('RM-AL-WIRE',    'Aluminum Wire',           'Aluminum deoxidizer wire 9.5mm',           'RM', 'KG', 'Alloy',       4.50, 'USD', 200,  500, 5, 'ACTIVE', 'SYSTEM'),
('RM-MOLD-PWD',   'Mold Powder',             'Continuous casting mold flux powder',      'RM', 'KG', 'Consumable',  1.20, 'USD', 500, 1000, 7, 'ACTIVE', 'SYSTEM'),
('RM-ROLL-LUB',   'Rolling Lubricant',       'Hot/cold rolling process lubricant',       'RM', 'L',  'Consumable',  5.00, 'USD', 500, 1000, 5, 'ACTIVE', 'SYSTEM'),
('RM-HCL',        'Hydrochloric Acid',       'HCl 18% for pickling line',               'RM', 'L',  'Chemical',    0.80, 'USD', 2000, 4000, 3, 'ACTIVE', 'SYSTEM'),
('RM-COATING',    'Surface Coating Oil',     'Anti-corrosion surface oil',               'RM', 'L',  'Consumable',  3.50, 'USD', 500, 1000, 5, 'ACTIVE', 'SYSTEM'),
-- Intermediates (8)
('IM-LIQUID',     'Liquid Steel',            'Molten steel from EAF',                    'IM', 'T',  'Steel',     400.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-SLAB',       'Steel Slab 200mm',        'Continuously cast steel slab',             'IM', 'T',  'Steel',     550.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-BILLET',     'Steel Billet 100mm',      'Continuously cast steel billet',           'IM', 'T',  'Steel',     500.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-HR-ROUGH',   'HR Coil Rough',           'Rough-rolled hot strip',                   'IM', 'T',  'Coil',      600.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-PICKLED',    'Pickled HR Strip',        'Acid-pickled hot rolled strip',            'IM', 'T',  'Strip',     650.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-CR-STRIP',   'Cold Rolled Strip',       'Cold-reduced steel strip',                 'IM', 'T',  'Strip',     750.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-ANNEALED',   'Annealed CR Strip',       'Batch-annealed cold rolled strip',         'IM', 'T',  'Strip',     780.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-ROLLED-BAR', 'Rolled Bar',              'Hot-rolled reinforcement bar',             'IM', 'T',  'Long',      540.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
-- Finished Goods (3)
('FG-HR-2MM',     'HR Coil 2mm',             'Hot rolled coil, 2mm thickness',           'FG', 'T',  'Coil',      700.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('FG-CR-1MM',     'CR Sheet 1mm',            'Cold rolled sheet, 1mm thickness',         'FG', 'T',  'Sheet',     850.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('FG-REBAR-10',   'Rebar 10mm',              'Reinforcement bar, 10mm diameter',         'FG', 'T',  'Long',      580.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM');

-- =====================================================
-- STEP 5: Products (6)
-- =====================================================
INSERT INTO products (sku, product_name, description, product_category, product_group, base_unit, standard_price, price_currency, min_order_qty, lead_time_days, status, created_by) VALUES
('HR-COIL-2MM',     'Hot Rolled Coil 2mm',       'Hot rolled coil, 2mm x 1250mm width',   'Coils',     'Hot Rolled',    'T', 700.00, 'USD', 10, 14, 'ACTIVE', 'SYSTEM'),
('HR-COIL-3MM',     'Hot Rolled Coil 3mm',       'Hot rolled coil, 3mm x 1500mm width',   'Coils',     'Hot Rolled',    'T', 680.00, 'USD', 10, 14, 'ACTIVE', 'SYSTEM'),
('CR-SHEET-1MM',    'Cold Rolled Sheet 1mm',     'Cold rolled sheet, 1mm x 1250mm',       'Sheets',    'Cold Rolled',   'T', 850.00, 'USD',  5, 21, 'ACTIVE', 'SYSTEM'),
('CR-SHEET-2MM',    'Cold Rolled Sheet 2mm',     'Cold rolled sheet, 2mm x 1250mm',       'Sheets',    'Cold Rolled',   'T', 820.00, 'USD',  5, 21, 'ACTIVE', 'SYSTEM'),
('REBAR-10MM',      'Reinforcement Bar 10mm',    'TMT rebar, 10mm, Fe500D grade',         'Rebars',    'Long Products', 'T', 580.00, 'USD', 20, 10, 'ACTIVE', 'SYSTEM'),
('STEEL-BILLET-100','Steel Billet 100mm',        'Steel billet 100x100mm square',         'Billets',   'Semi-Finished', 'T', 500.00, 'USD', 25,  7, 'ACTIVE', 'SYSTEM');

-- =====================================================
-- STEP 6: Equipment (12)
-- =====================================================
INSERT INTO equipment (equipment_id, equipment_code, name, equipment_type, capacity, capacity_unit, location, status) VALUES
(1,  'EAF-001',  'Electric Arc Furnace #1', 'BATCH',      120, 'T',    'Melting Shop',    'AVAILABLE'),
(2,  'EAF-002',  'Electric Arc Furnace #2', 'BATCH',      100, 'T',    'Melting Shop',    'AVAILABLE'),
(3,  'EAF-003',  'Electric Arc Furnace #3', 'BATCH',       80, 'T',    'Melting Shop',    'MAINTENANCE'),
(4,  'LF-001',   'Ladle Furnace #1',        'BATCH',      120, 'T',    'Melting Shop',    'AVAILABLE'),
(5,  'CCM-001',  'Continuous Caster #1',     'CONTINUOUS',  50, 'T/hr', 'Casting Area',    'AVAILABLE'),
(6,  'CCM-002',  'Continuous Caster #2',     'CONTINUOUS',  45, 'T/hr', 'Casting Area',    'IN_USE'),
(7,  'HSM-001',  'Hot Strip Mill #1',        'CONTINUOUS',  30, 'T/hr', 'Hot Rolling Mill', 'AVAILABLE'),
(8,  'HSM-002',  'Hot Strip Mill #2',        'CONTINUOUS',  35, 'T/hr', 'Hot Rolling Mill', 'AVAILABLE'),
(9,  'CRM-001',  'Cold Rolling Mill #1',     'CONTINUOUS',  20, 'T/hr', 'Cold Mill',       'AVAILABLE'),
(10, 'BAF-001',  'Batch Annealing Furnace',  'BATCH',       60, 'T',    'Annealing Bay',   'AVAILABLE'),
(11, 'BRM-001',  'Bar Rolling Mill #1',      'CONTINUOUS',  40, 'T/hr', 'Bar Mill',        'AVAILABLE'),
(12, 'PKL-001',  'Pickling Line #1',         'CONTINUOUS',  25, 'T/hr', 'Pickling Bay',    'ON_HOLD');
ALTER TABLE equipment ALTER COLUMN equipment_id RESTART WITH 13;

-- =====================================================
-- STEP 7: Operators (8)
-- =====================================================
INSERT INTO operators (operator_code, name, department, shift, status) VALUES
('OP-001', 'John Smith',         'Melting',     'Day',   'ACTIVE'),
('OP-002', 'Mike Wilson',        'Melting',     'Night', 'ACTIVE'),
('OP-003', 'Sarah Brown',        'Casting',     'Day',   'ACTIVE'),
('OP-004', 'David Lee',          'Hot Rolling', 'Day',   'ACTIVE'),
('OP-005', 'Emily Chen',         'Cold Rolling','Day',   'ACTIVE'),
('OP-006', 'Robert Garcia',      'Quality',     'Day',   'ACTIVE'),
('OP-007', 'Jennifer Martinez',  'Quality',     'Night', 'ACTIVE'),
('OP-008', 'William Johnson',    'Maintenance', 'Day',   'ACTIVE');

-- =====================================================
-- STEP 8: Bill of Materials (3 multi-level trees)
-- =====================================================

-- -------------------------------------------------------
-- BOM 1: HR-COIL-2MM — 5-level tree, 14 nodes
-- -------------------------------------------------------
-- Tree structure:
--   1: Finished HR Coil 2mm
--   ├── 2: Hot Rolled Strip
--   │   ├── 4: Steel Slab 200mm
--   │   │   ├── 6: Liquid Steel
--   │   │   │   ├── 8:  Steel Scrap A   (yield 0.95)
--   │   │   │   ├── 9:  Steel Scrap B   (yield 0.92)
--   │   │   │   ├── 10: Iron Ore Pellets (yield 0.97)
--   │   │   │   ├── 11: Limestone
--   │   │   │   ├── 12: Ferroalloy FeSi
--   │   │   │   ├── 13: Coal/Coke
--   │   │   │   └── 14: Graphite Electrodes (yield 0.85)
--   │   │   └── 7: Mold Powder
--   │   └── 5: Rolling Lubricant
--   └── 3: Surface Coating Oil

INSERT INTO bill_of_material (bom_id, product_sku, bom_version, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, parent_bom_id, status, created_by) VALUES
-- Level 1: Finished product
(1,  'HR-COIL-2MM', 'V1', 'FG-HR-2MM',    'Finished HR Coil 2mm',     1.0000, 'T',  0.98,   1, NULL, 'ACTIVE', 'SYSTEM'),
-- Level 2: Sub-assemblies
(2,  'HR-COIL-2MM', 'V1', 'IM-HR-ROUGH',  'Hot Rolled Strip',         1.0500, 'T',  0.95,   2, 1,    'ACTIVE', 'SYSTEM'),
(3,  'HR-COIL-2MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0200, 'L',  1.00,   2, 1,    'ACTIVE', 'SYSTEM'),
-- Level 3: Slab + lubricant
(4,  'HR-COIL-2MM', 'V1', 'IM-SLAB',      'Steel Slab 200mm',         1.1200, 'T',  0.93,   3, 2,    'ACTIVE', 'SYSTEM'),
(5,  'HR-COIL-2MM', 'V1', 'RM-ROLL-LUB',  'Rolling Lubricant',        0.0100, 'L',  1.00,   3, 2,    'ACTIVE', 'SYSTEM'),
-- Level 4: Liquid steel + mold powder
(6,  'HR-COIL-2MM', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.1800, 'T',  0.88,   4, 4,    'ACTIVE', 'SYSTEM'),
(7,  'HR-COIL-2MM', 'V1', 'RM-MOLD-PWD',  'Mold Powder',              0.0050, 'KG', 1.00,   4, 4,    'ACTIVE', 'SYSTEM'),
-- Level 5: Raw materials (7 children of Liquid Steel)
(8,  'HR-COIL-2MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7000, 'T',  0.95,   5, 6,    'ACTIVE', 'SYSTEM'),
(9,  'HR-COIL-2MM', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.2000, 'T',  0.92,   5, 6,    'ACTIVE', 'SYSTEM'),
(10, 'HR-COIL-2MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1500, 'T',  0.97,   5, 6,    'ACTIVE', 'SYSTEM'),
(11, 'HR-COIL-2MM', 'V1', 'RM-LIMESTONE',  'Limestone',                0.0800, 'T',  1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
(12, 'HR-COIL-2MM', 'V1', 'RM-FESI',      'Ferroalloy FeSi',          0.0050, 'KG', 1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
(13, 'HR-COIL-2MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.1000, 'T',  1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
(14, 'HR-COIL-2MM', 'V1', 'RM-GRAPHITE',  'Graphite Electrodes',      0.0030, 'EA', 0.85,   5, 6,    'ACTIVE', 'SYSTEM');

-- -------------------------------------------------------
-- BOM 2: CR-SHEET-1MM — 6-level tree, 14 nodes
-- -------------------------------------------------------
-- Tree structure:
--   15: Finished CR Sheet 1mm
--   ├── 16: Annealed CR Strip
--   │   └── 18: Cold Rolled Strip
--   │       ├── 19: Pickled HR Strip
--   │       │   ├── 21: HR Coil Base
--   │       │   │   ├── 23: Steel Scrap A  (yield 0.95)
--   │       │   │   ├── 24: Iron Ore       (yield 0.97)
--   │       │   │   ├── 25: FeSi
--   │       │   │   ├── 26: Limestone
--   │       │   │   ├── 27: Coal/Coke
--   │       │   │   └── 28: Aluminum Wire
--   │       │   └── 22: Hydrochloric Acid
--   │       └── 20: CR Rolling Lubricant
--   └── 17: Surface Coating Oil

INSERT INTO bill_of_material (bom_id, product_sku, bom_version, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, parent_bom_id, status, created_by) VALUES
-- Level 1: Finished product
(15, 'CR-SHEET-1MM', 'V1', 'FG-CR-1MM',    'Finished CR Sheet 1mm',    1.0000, 'T',  0.97,   1, NULL, 'ACTIVE', 'SYSTEM'),
-- Level 2
(16, 'CR-SHEET-1MM', 'V1', 'IM-ANNEALED',  'Annealed CR Strip',        1.0300, 'T',  0.97,   2, 15,   'ACTIVE', 'SYSTEM'),
(17, 'CR-SHEET-1MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0150, 'L',  1.00,   2, 15,   'ACTIVE', 'SYSTEM'),
-- Level 3
(18, 'CR-SHEET-1MM', 'V1', 'IM-CR-STRIP',  'Cold Rolled Strip',        1.0800, 'T',  0.94,   3, 16,   'ACTIVE', 'SYSTEM'),
-- Level 4
(19, 'CR-SHEET-1MM', 'V1', 'IM-PICKLED',   'Pickled HR Strip',         1.1200, 'T',  0.96,   4, 18,   'ACTIVE', 'SYSTEM'),
(20, 'CR-SHEET-1MM', 'V1', 'RM-ROLL-LUB',  'CR Rolling Lubricant',     0.0200, 'L',  1.00,   4, 18,   'ACTIVE', 'SYSTEM'),
-- Level 5
(21, 'CR-SHEET-1MM', 'V1', 'IM-HR-ROUGH',  'HR Coil Base',             1.1500, 'T',  0.93,   5, 19,   'ACTIVE', 'SYSTEM'),
(22, 'CR-SHEET-1MM', 'V1', 'RM-HCL',       'Hydrochloric Acid',        0.0500, 'L',  1.00,   5, 19,   'ACTIVE', 'SYSTEM'),
-- Level 6: Raw materials (6 children)
(23, 'CR-SHEET-1MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7500, 'T',  0.95,   6, 21,   'ACTIVE', 'SYSTEM'),
(24, 'CR-SHEET-1MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.2000, 'T',  0.97,   6, 21,   'ACTIVE', 'SYSTEM'),
(25, 'CR-SHEET-1MM', 'V1', 'RM-FESI',      'Ferroalloy FeSi',          0.0050, 'KG', 1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
(26, 'CR-SHEET-1MM', 'V1', 'RM-LIMESTONE',  'Limestone',                0.0600, 'T',  1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
(27, 'CR-SHEET-1MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.0800, 'T',  1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
(28, 'CR-SHEET-1MM', 'V1', 'RM-AL-WIRE',   'Aluminum Wire',            0.0030, 'KG', 1.00,   6, 21,   'ACTIVE', 'SYSTEM');

-- -------------------------------------------------------
-- BOM 3: REBAR-10MM — 5-level tree, 10 nodes
-- -------------------------------------------------------
-- Tree structure:
--   29: Finished Rebar 10mm
--   └── 30: Rolled Bar
--       ├── 31: Steel Billet 100mm
--       │   ├── 33: Liquid Steel
--       │   │   ├── 35: Steel Scrap A   (yield 0.94)
--       │   │   ├── 36: Steel Scrap B   (yield 0.92)
--       │   │   ├── 37: FeMn
--       │   │   └── 38: Coal/Coke
--       │   └── 34: Limestone
--       └── 32: Bar Rolling Lubricant

INSERT INTO bill_of_material (bom_id, product_sku, bom_version, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, parent_bom_id, status, created_by) VALUES
-- Level 1: Finished product
(29, 'REBAR-10MM', 'V1', 'FG-REBAR-10',    'Finished Rebar 10mm',      1.0000, 'T',  0.99,   1, NULL, 'ACTIVE', 'SYSTEM'),
-- Level 2
(30, 'REBAR-10MM', 'V1', 'IM-ROLLED-BAR',  'Rolled Bar',               1.0400, 'T',  0.96,   2, 29,   'ACTIVE', 'SYSTEM'),
-- Level 3
(31, 'REBAR-10MM', 'V1', 'IM-BILLET',      'Steel Billet 100mm',       1.1000, 'T',  0.93,   3, 30,   'ACTIVE', 'SYSTEM'),
(32, 'REBAR-10MM', 'V1', 'RM-ROLL-LUB',   'Bar Rolling Lubricant',    0.0050, 'L',  1.00,   3, 30,   'ACTIVE', 'SYSTEM'),
-- Level 4
(33, 'REBAR-10MM', 'V1', 'IM-LIQUID',      'Liquid Steel',             1.1500, 'T',  0.90,   4, 31,   'ACTIVE', 'SYSTEM'),
(34, 'REBAR-10MM', 'V1', 'RM-LIMESTONE',    'Limestone',                0.0400, 'T',  1.00,   4, 31,   'ACTIVE', 'SYSTEM'),
-- Level 5: Raw materials (4 children)
(35, 'REBAR-10MM', 'V1', 'RM-SCRAP-A',     'Steel Scrap Grade A',      0.8000, 'T',  0.94,   5, 33,   'ACTIVE', 'SYSTEM'),
(36, 'REBAR-10MM', 'V1', 'RM-SCRAP-B',     'Steel Scrap Grade B',      0.1800, 'T',  0.92,   5, 33,   'ACTIVE', 'SYSTEM'),
(37, 'REBAR-10MM', 'V1', 'RM-FEMN',        'Ferroalloy FeMn',          0.0080, 'KG', 1.00,   5, 33,   'ACTIVE', 'SYSTEM'),
(38, 'REBAR-10MM', 'V1', 'RM-COAL',        'Coal / Coke',              0.0900, 'T',  1.00,   5, 33,   'ACTIVE', 'SYSTEM');

-- Reset BOM sequence
ALTER TABLE bill_of_material ALTER COLUMN bom_id RESTART WITH 39;

-- =====================================================
-- STEP 9: Orders (8 orders, 10 line items)
-- =====================================================
INSERT INTO orders (order_id, order_number, customer_id, customer_name, order_date, status, created_by) VALUES
(1, 'ORD-2026-001', 'CUST-001', 'ABC Steel Corporation',    '2026-01-10', 'IN_PROGRESS', 'SYSTEM'),
(2, 'ORD-2026-002', 'CUST-002', 'Global Manufacturing Ltd', '2026-01-12', 'IN_PROGRESS', 'SYSTEM'),
(3, 'ORD-2026-003', 'CUST-006', 'BuildRight Construction',  '2026-01-15', 'IN_PROGRESS', 'SYSTEM'),
(4, 'ORD-2026-004', 'CUST-003', 'Pacific Metal Works',      '2026-01-18', 'CREATED',     'SYSTEM'),
(5, 'ORD-2026-005', 'CUST-004', 'European Auto Parts GmbH', '2026-01-20', 'COMPLETED',   'SYSTEM'),
(6, 'ORD-2026-006', 'CUST-007', 'Nordic Steel Trading AB',  '2026-01-22', 'CREATED',     'SYSTEM'),
(7, 'ORD-2026-007', 'CUST-008', 'Middle East Metals FZE',   '2026-01-25', 'CREATED',     'SYSTEM'),
(8, 'ORD-2026-008', 'CUST-005', 'Asian Electronics Inc',    '2026-01-28', 'ON_HOLD',     'SYSTEM');
ALTER TABLE orders ALTER COLUMN order_id RESTART WITH 9;

INSERT INTO order_line_items (order_line_id, order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by) VALUES
-- Order 1: HR Coil
(1,  1, 'HR-COIL-2MM',  'Hot Rolled Coil 2mm',       150, 'T', '2026-02-15', 'IN_PROGRESS', 'SYSTEM'),
-- Order 2: CR Sheet
(2,  2, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm',      80, 'T', '2026-03-05', 'IN_PROGRESS', 'SYSTEM'),
-- Order 3: Rebar
(3,  3, 'REBAR-10MM',   'Reinforcement Bar 10mm',    200, 'T', '2026-02-20', 'IN_PROGRESS', 'SYSTEM'),
-- Order 4: Multi-line (HR + CR)
(4,  4, 'HR-COIL-2MM',  'Hot Rolled Coil 2mm',       100, 'T', '2026-03-10', 'CREATED', 'SYSTEM'),
(5,  4, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm',      50, 'T', '2026-03-15', 'CREATED', 'SYSTEM'),
-- Order 5: Completed
(6,  5, 'HR-COIL-2MM',  'Hot Rolled Coil 2mm',        75, 'T', '2026-02-10', 'COMPLETED', 'SYSTEM'),
-- Order 6: Rebar large
(7,  6, 'REBAR-10MM',   'Reinforcement Bar 10mm',    300, 'T', '2026-03-01', 'CREATED', 'SYSTEM'),
-- Order 7: CR Sheet
(8,  7, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm',     120, 'T', '2026-03-20', 'CREATED', 'SYSTEM'),
-- Order 8: On hold
(9,  8, 'HR-COIL-2MM',  'Hot Rolled Coil 2mm',        60, 'T', '2026-03-25', 'ON_HOLD', 'SYSTEM'),
-- Order 4 bonus: Rebar
(10, 4, 'REBAR-10MM',   'Reinforcement Bar 10mm',     80, 'T', '2026-03-10', 'CREATED', 'SYSTEM');
ALTER TABLE order_line_items ALTER COLUMN order_line_id RESTART WITH 11;

-- =====================================================
-- STEP 10: Processes and Operations
-- =====================================================

-- --- Order 1: HR-COIL-2MM, 150T, IN_PROGRESS ---
INSERT INTO processes (process_id, order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(1, 1, 'Melting',      1, 'COMPLETED',   'SYSTEM'),
(2, 1, 'Casting',      2, 'COMPLETED',   'SYSTEM'),
(3, 1, 'Hot Rolling',  3, 'IN_PROGRESS', 'SYSTEM'),
(4, 1, 'Finishing',    4, 'READY',       'SYSTEM');

INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
-- Melting (completed)
(1,  1, 'Scrap Charging',      'MELT-10', 'FURNACE', 1, 'CONFIRMED',   'SYSTEM'),
(2,  1, 'EAF Melting',         'MELT-20', 'FURNACE', 2, 'CONFIRMED',   'SYSTEM'),
(3,  1, 'Ladle Refining',      'MELT-30', 'FURNACE', 3, 'CONFIRMED',   'SYSTEM'),
-- Casting (completed)
(4,  2, 'Slab Casting',        'CAST-10', 'CASTER',  1, 'CONFIRMED',   'SYSTEM'),
-- Hot Rolling (in progress)
(5,  3, 'Slab Reheating',      'ROLL-10', 'FURNACE', 1, 'CONFIRMED',   'SYSTEM'),
(6,  3, 'Rough Rolling',       'ROLL-20', 'ROLLING', 2, 'READY',       'SYSTEM'),
(7,  3, 'Finish Rolling',      'ROLL-30', 'ROLLING', 3, 'NOT_STARTED', 'SYSTEM'),
-- Finishing
(8,  4, 'Cooling',             'FIN-10',  'COOLING', 1, 'NOT_STARTED', 'SYSTEM'),
(9,  4, 'Coiling & Inspection','FIN-20',  'FINISHING',2, 'NOT_STARTED', 'SYSTEM');

-- --- Order 2: CR-SHEET-1MM, 80T, IN_PROGRESS ---
INSERT INTO processes (process_id, order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(5,  2, 'Melting',       1, 'COMPLETED',   'SYSTEM'),
(6,  2, 'Casting',       2, 'IN_PROGRESS', 'SYSTEM'),
(7,  2, 'Hot Rolling',   3, 'READY',       'SYSTEM'),
(8,  2, 'Pickling',      4, 'READY',       'SYSTEM'),
(9,  2, 'Cold Rolling',  5, 'READY',       'SYSTEM'),
(10, 2, 'Annealing',     6, 'READY',       'SYSTEM');

INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
-- Melting (completed)
(10, 5, 'Scrap Charging',       'MELT-10', 'FURNACE', 1, 'CONFIRMED',   'SYSTEM'),
(11, 5, 'EAF Melting',          'MELT-20', 'FURNACE', 2, 'CONFIRMED',   'SYSTEM'),
-- Casting (in progress)
(12, 6, 'Slab Casting',         'CAST-10', 'CASTER',  1, 'READY',       'SYSTEM'),
-- Hot Rolling
(13, 7, 'Hot Rolling',          'ROLL-10', 'ROLLING', 1, 'NOT_STARTED', 'SYSTEM'),
-- Pickling
(14, 8, 'Acid Pickling',        'PKL-10',  'PICKLING',1, 'NOT_STARTED', 'SYSTEM'),
-- Cold Rolling
(15, 9, 'Cold Reduction',       'CRM-10',  'ROLLING', 1, 'NOT_STARTED', 'SYSTEM'),
-- Annealing
(16, 10, 'Batch Annealing',     'ANN-10',  'FURNACE', 1, 'NOT_STARTED', 'SYSTEM');

-- --- Order 3: REBAR-10MM, 200T, IN_PROGRESS ---
INSERT INTO processes (process_id, order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(11, 3, 'Melting',       1, 'COMPLETED',   'SYSTEM'),
(12, 3, 'Billet Casting',2, 'COMPLETED',   'SYSTEM'),
(13, 3, 'Bar Rolling',   3, 'IN_PROGRESS', 'SYSTEM');

INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
-- Melting (completed)
(17, 11, 'Scrap Charging',      'MELT-10', 'FURNACE', 1, 'CONFIRMED',   'SYSTEM'),
(18, 11, 'EAF Melting',         'MELT-20', 'FURNACE', 2, 'CONFIRMED',   'SYSTEM'),
-- Billet Casting (completed)
(19, 12, 'Billet Casting',      'CAST-10', 'CASTER',  1, 'CONFIRMED',   'SYSTEM'),
-- Bar Rolling (in progress)
(20, 13, 'Billet Reheating',    'ROLL-10', 'FURNACE', 1, 'READY',       'SYSTEM'),
(21, 13, 'Bar Rolling',         'ROLL-20', 'ROLLING', 2, 'NOT_STARTED', 'SYSTEM'),
(22, 13, 'Quenching & Tempering','ROLL-30','COOLING', 3, 'NOT_STARTED', 'SYSTEM');

-- --- Order 5: HR-COIL-2MM, 75T, COMPLETED ---
INSERT INTO processes (process_id, order_line_id, stage_name, stage_sequence, status, created_by) VALUES
(14, 6, 'Melting',      1, 'COMPLETED', 'SYSTEM'),
(15, 6, 'Casting',      2, 'COMPLETED', 'SYSTEM'),
(16, 6, 'Hot Rolling',  3, 'COMPLETED', 'SYSTEM'),
(17, 6, 'Finishing',    4, 'COMPLETED', 'SYSTEM');

INSERT INTO operations (operation_id, process_id, operation_name, operation_code, operation_type, sequence_number, status, created_by) VALUES
-- Melting
(23, 14, 'Scrap Charging',      'MELT-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(24, 14, 'EAF Melting',         'MELT-20', 'FURNACE', 2, 'CONFIRMED', 'SYSTEM'),
(25, 14, 'Ladle Refining',      'MELT-30', 'FURNACE', 3, 'CONFIRMED', 'SYSTEM'),
-- Casting
(26, 15, 'Slab Casting',        'CAST-10', 'CASTER',  1, 'CONFIRMED', 'SYSTEM'),
-- Hot Rolling
(27, 16, 'Slab Reheating',      'ROLL-10', 'FURNACE', 1, 'CONFIRMED', 'SYSTEM'),
(28, 16, 'Rough Rolling',       'ROLL-20', 'ROLLING', 2, 'CONFIRMED', 'SYSTEM'),
(29, 16, 'Finish Rolling',      'ROLL-30', 'ROLLING', 3, 'CONFIRMED', 'SYSTEM'),
-- Finishing
(30, 17, 'Cooling & Coiling',   'FIN-10',  'FINISHING',1, 'CONFIRMED', 'SYSTEM');

ALTER TABLE processes ALTER COLUMN process_id RESTART WITH 18;
ALTER TABLE operations ALTER COLUMN operation_id RESTART WITH 31;

-- =====================================================
-- STEP 11: Batches (27 batches)
-- =====================================================
INSERT INTO batches (batch_id, batch_number, material_id, material_name, quantity, unit, status, created_by) VALUES
-- Raw material batches (AVAILABLE)
(1,  'B-RM-001', 'RM-SCRAP-A',   'Steel Scrap Grade A',  500, 'T',  'AVAILABLE', 'SYSTEM'),
(2,  'B-RM-002', 'RM-SCRAP-A',   'Steel Scrap Grade A',  350, 'T',  'AVAILABLE', 'SYSTEM'),
(3,  'B-RM-003', 'RM-SCRAP-B',   'Steel Scrap Grade B',  200, 'T',  'AVAILABLE', 'SYSTEM'),
(4,  'B-RM-004', 'RM-IRON-ORE',  'Iron Ore Pellets',     400, 'T',  'AVAILABLE', 'SYSTEM'),
(5,  'B-RM-005', 'RM-LIMESTONE',  'Limestone',             150, 'T',  'AVAILABLE', 'SYSTEM'),
(6,  'B-RM-006', 'RM-FESI',      'Ferroalloy FeSi',      2000, 'KG', 'AVAILABLE', 'SYSTEM'),
(7,  'B-RM-007', 'RM-FEMN',      'Ferroalloy FeMn',      1500, 'KG', 'AVAILABLE', 'SYSTEM'),
(8,  'B-RM-008', 'RM-COAL',      'Coal / Coke',          300, 'T',  'AVAILABLE', 'SYSTEM'),
(9,  'B-RM-009', 'RM-GRAPHITE',  'Graphite Electrodes',   50, 'EA', 'AVAILABLE', 'SYSTEM'),
(10, 'B-RM-010', 'RM-SCRAP-A',   'Steel Scrap Grade A',  180, 'T',  'ON_HOLD',   'SYSTEM'),
(11, 'B-RM-011', 'RM-SCRAP-B',   'Steel Scrap Grade B',  120, 'T',  'AVAILABLE', 'SYSTEM'),
(12, 'B-RM-012', 'RM-HCL',       'Hydrochloric Acid',    5000, 'L',  'AVAILABLE', 'SYSTEM'),
(13, 'B-RM-013', 'RM-COATING',   'Surface Coating Oil',  2000, 'L',  'AVAILABLE', 'SYSTEM'),
(14, 'B-RM-014', 'RM-ROLL-LUB',  'Rolling Lubricant',    3000, 'L',  'AVAILABLE', 'SYSTEM'),
(15, 'B-RM-015', 'RM-MOLD-PWD',  'Mold Powder',          1000, 'KG', 'AVAILABLE', 'SYSTEM'),
(16, 'B-RM-016', 'RM-AL-WIRE',   'Aluminum Wire',         500, 'KG', 'AVAILABLE', 'SYSTEM'),
-- Intermediate batches from Order 1 (HR Coil)
(17, 'B-IM-001', 'IM-LIQUID',    'Liquid Steel',          165, 'T',  'CONSUMED',  'SYSTEM'),
(18, 'B-IM-002', 'IM-SLAB',      'Steel Slab 200mm',     155, 'T',  'AVAILABLE', 'SYSTEM'),
-- Intermediate batches from Order 2 (CR Sheet)
(19, 'B-IM-003', 'IM-LIQUID',    'Liquid Steel',           90, 'T',  'CONSUMED',  'SYSTEM'),
-- Intermediate batches from Order 3 (Rebar)
(20, 'B-IM-004', 'IM-LIQUID',    'Liquid Steel',          220, 'T',  'CONSUMED',  'SYSTEM'),
(21, 'B-IM-005', 'IM-BILLET',    'Steel Billet 100mm',    210, 'T',  'AVAILABLE', 'SYSTEM'),
-- Intermediate & FG batches from Order 5 (completed HR Coil)
(22, 'B-IM-006', 'IM-LIQUID',    'Liquid Steel',           85, 'T',  'CONSUMED',  'SYSTEM'),
(23, 'B-IM-007', 'IM-SLAB',      'Steel Slab 200mm',      82, 'T',  'CONSUMED',  'SYSTEM'),
(24, 'B-IM-008', 'IM-HR-ROUGH',  'HR Coil Rough',         78, 'T',  'CONSUMED',  'SYSTEM'),
(25, 'B-FG-001', 'FG-HR-2MM',    'HR Coil 2mm',           75, 'T',  'AVAILABLE', 'SYSTEM'),
-- Blocked / Quality batches
(26, 'B-RM-017', 'RM-SCRAP-A',   'Steel Scrap Grade A',  100, 'T',  'BLOCKED',   'SYSTEM'),
(27, 'B-IM-009', 'IM-SLAB',      'Steel Slab 200mm',      30, 'T',  'QUALITY_PENDING', 'SYSTEM');
ALTER TABLE batches ALTER COLUMN batch_id RESTART WITH 28;

-- =====================================================
-- STEP 12: Inventory (30 records)
-- =====================================================
INSERT INTO inventory (inventory_id, material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by) VALUES
-- Raw material inventory
(1,  'RM-SCRAP-A',   'Steel Scrap Grade A',  'RM', 'AVAILABLE', 500,  'T',  1,  'Scrap Yard A',  'SYSTEM'),
(2,  'RM-SCRAP-A',   'Steel Scrap Grade A',  'RM', 'AVAILABLE', 350,  'T',  2,  'Scrap Yard A',  'SYSTEM'),
(3,  'RM-SCRAP-B',   'Steel Scrap Grade B',  'RM', 'AVAILABLE', 200,  'T',  3,  'Scrap Yard B',  'SYSTEM'),
(4,  'RM-IRON-ORE',  'Iron Ore Pellets',     'RM', 'AVAILABLE', 400,  'T',  4,  'Ore Storage',   'SYSTEM'),
(5,  'RM-LIMESTONE',  'Limestone',             'RM', 'AVAILABLE', 150,  'T',  5,  'Flux Store',    'SYSTEM'),
(6,  'RM-FESI',      'Ferroalloy FeSi',      'RM', 'AVAILABLE', 2000, 'KG', 6,  'Alloy Store',   'SYSTEM'),
(7,  'RM-FEMN',      'Ferroalloy FeMn',      'RM', 'AVAILABLE', 1500, 'KG', 7,  'Alloy Store',   'SYSTEM'),
(8,  'RM-COAL',      'Coal / Coke',          'RM', 'AVAILABLE', 300,  'T',  8,  'Coal Yard',     'SYSTEM'),
(9,  'RM-GRAPHITE',  'Graphite Electrodes',  'RM', 'AVAILABLE', 50,   'EA', 9,  'Electrode Store','SYSTEM'),
(10, 'RM-SCRAP-A',   'Steel Scrap (On Hold)','RM', 'ON_HOLD',   180,  'T',  10, 'Scrap Yard C',  'SYSTEM'),
(11, 'RM-SCRAP-B',   'Steel Scrap Grade B',  'RM', 'AVAILABLE', 120,  'T',  11, 'Scrap Yard B',  'SYSTEM'),
(12, 'RM-HCL',       'Hydrochloric Acid',    'RM', 'AVAILABLE', 5000, 'L',  12, 'Chemical Store', 'SYSTEM'),
(13, 'RM-COATING',   'Surface Coating Oil',  'RM', 'AVAILABLE', 2000, 'L',  13, 'Oil Store',     'SYSTEM'),
(14, 'RM-ROLL-LUB',  'Rolling Lubricant',    'RM', 'AVAILABLE', 3000, 'L',  14, 'Oil Store',     'SYSTEM'),
(15, 'RM-MOLD-PWD',  'Mold Powder',          'RM', 'AVAILABLE', 1000, 'KG', 15, 'Casting Store', 'SYSTEM'),
(16, 'RM-AL-WIRE',   'Aluminum Wire',        'RM', 'AVAILABLE', 500,  'KG', 16, 'Alloy Store',   'SYSTEM'),
-- Intermediate inventory
(17, 'IM-SLAB',      'Steel Slab 200mm',     'IM', 'AVAILABLE', 155,  'T',  18, 'Slab Yard',     'SYSTEM'),
(18, 'IM-BILLET',    'Steel Billet 100mm',   'IM', 'AVAILABLE', 210,  'T',  21, 'Billet Yard',   'SYSTEM'),
-- Finished goods inventory
(19, 'FG-HR-2MM',    'HR Coil 2mm',          'FG', 'AVAILABLE', 75,   'T',  25, 'FG Warehouse 1','SYSTEM'),
-- Blocked inventory
(20, 'RM-SCRAP-A',   'Steel Scrap (Contaminated)', 'RM', 'BLOCKED', 100, 'T', 26, 'Quarantine Area', 'SYSTEM'),
-- Quality pending
(21, 'IM-SLAB',      'Steel Slab (QC Pending)',    'IM', 'ON_HOLD', 30,  'T', 27, 'QC Area',       'SYSTEM'),
-- Scrapped
(22, 'RM-COAL',      'Coal (Contaminated)',   'RM', 'SCRAPPED',  25,   'T',  NULL, 'Disposal',    'SYSTEM');
ALTER TABLE inventory ALTER COLUMN inventory_id RESTART WITH 23;

-- =====================================================
-- STEP 13: Production Confirmations (for completed ops)
-- =====================================================
INSERT INTO production_confirmation (confirmation_id, operation_id, produced_qty, scrap_qty, start_time, end_time, delay_minutes, delay_reason, notes, status, created_by) VALUES
-- Order 1: Melting
(1,  1,  160,  3,   '2026-01-15 06:00:00', '2026-01-15 10:00:00', 0,  NULL,              'Scrap charging complete, 160T loaded', 'CONFIRMED', 'OP-001'),
(2,  2,  155,  5,   '2026-01-15 10:30:00', '2026-01-15 16:00:00', 20, 'MAINTENANCE',     'EAF tap-to-tap 5.5hrs, electrode change', 'CONFIRMED', 'OP-001'),
(3,  3,  152,  3,   '2026-01-15 16:30:00', '2026-01-15 19:00:00', 0,  NULL,              'Ladle refining - chemistry adjusted',  'CONFIRMED', 'OP-001'),
-- Order 1: Casting
(4,  4,  148,  4,   '2026-01-16 06:00:00', '2026-01-16 12:00:00', 15, 'EQUIP_BREAKDOWN', 'Slab casting, minor mold issue resolved', 'CONFIRMED', 'OP-003'),
-- Order 1: Hot Rolling (partial - reheating done)
(5,  5,  148,  0,   '2026-01-17 06:00:00', '2026-01-17 09:00:00', 0,  NULL,              'Slabs reheated to 1250C',              'CONFIRMED', 'OP-004'),
-- Order 2: Melting
(6,  10, 88,   2,   '2026-01-18 06:00:00', '2026-01-18 10:00:00', 0,  NULL,              'Scrap charging for CR sheet order',    'CONFIRMED', 'OP-002'),
(7,  11, 85,   3,   '2026-01-18 10:30:00', '2026-01-18 16:00:00', 0,  NULL,              'EAF melting completed',                'CONFIRMED', 'OP-002'),
-- Order 3: Melting + Casting
(8,  17, 225,  5,   '2026-01-19 06:00:00', '2026-01-19 10:00:00', 0,  NULL,              'Rebar order scrap charge',             'CONFIRMED', 'OP-001'),
(9,  18, 218,  7,   '2026-01-19 10:30:00', '2026-01-19 17:00:00', 30, 'QUALITY_ISSUE',   'Melting for rebar, temp correction needed', 'CONFIRMED', 'OP-001'),
(10, 19, 210,  8,   '2026-01-20 06:00:00', '2026-01-20 14:00:00', 0,  NULL,              'Billet casting 100mm square',          'CONFIRMED', 'OP-003'),
-- Order 5: All operations (completed order)
(11, 23, 82,   1,   '2026-01-08 06:00:00', '2026-01-08 09:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
(12, 24, 80,   2,   '2026-01-08 09:30:00', '2026-01-08 14:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
(13, 25, 79,   1,   '2026-01-08 14:30:00', '2026-01-08 17:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
(14, 26, 77,   2,   '2026-01-09 06:00:00', '2026-01-09 12:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-003'),
(15, 27, 77,   0,   '2026-01-10 06:00:00', '2026-01-10 09:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
(16, 28, 76,   1,   '2026-01-10 09:30:00', '2026-01-10 13:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
(17, 29, 75.5, 0.5, '2026-01-10 13:30:00', '2026-01-10 17:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
(18, 30, 75,   0.5, '2026-01-11 06:00:00', '2026-01-11 10:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004');
ALTER TABLE production_confirmation ALTER COLUMN confirmation_id RESTART WITH 19;

-- Confirmation Equipment links
INSERT INTO confirmation_equipment (confirmation_id, equipment_id) VALUES
(1, 1), (2, 1), (3, 4),   -- Order 1 melting: EAF-001, LF-001
(4, 5),                     -- Order 1 casting: CCM-001
(5, 7),                     -- Order 1 hot rolling: HSM-001
(6, 2), (7, 2),            -- Order 2 melting: EAF-002
(8, 1), (9, 1),            -- Order 3 melting: EAF-001
(10, 6),                    -- Order 3 casting: CCM-002
(11, 2), (12, 2), (13, 4), -- Order 5 melting: EAF-002, LF-001
(14, 5),                    -- Order 5 casting: CCM-001
(15, 7), (16, 7), (17, 7), -- Order 5 rolling: HSM-001
(18, 7);                    -- Order 5 finishing

-- Confirmation Operator links
INSERT INTO confirmation_operators (confirmation_id, operator_id) VALUES
(1, 1), (2, 1), (3, 1),   -- OP-001
(4, 3),                     -- OP-003
(5, 4),                     -- OP-004
(6, 2), (7, 2),            -- OP-002
(8, 1), (9, 1),            -- OP-001
(10, 3),                    -- OP-003
(11, 1), (12, 1), (13, 1), -- OP-001
(14, 3),                    -- OP-003
(15, 4), (16, 4), (17, 4), -- OP-004
(18, 4);                    -- OP-004

-- =====================================================
-- STEP 14: Batch Relations (genealogy)
-- =====================================================

-- Order 1 genealogy: RM -> Liquid Steel -> Slab
INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by) VALUES
(1,  17, 'MERGE', 105, 'ACTIVE', 'SYSTEM'),   -- Scrap A -> Liquid Steel
(3,  17, 'MERGE', 30,  'ACTIVE', 'SYSTEM'),   -- Scrap B -> Liquid Steel
(4,  17, 'MERGE', 22,  'ACTIVE', 'SYSTEM'),   -- Iron Ore -> Liquid Steel
(8,  17, 'MERGE', 15,  'ACTIVE', 'SYSTEM'),   -- Coal -> Liquid Steel
(17, 18, 'MERGE', 155, 'ACTIVE', 'SYSTEM');   -- Liquid Steel -> Slab

-- Order 3 genealogy: RM -> Liquid Steel -> Billet
INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by) VALUES
(2,  20, 'MERGE', 160, 'ACTIVE', 'SYSTEM'),   -- Scrap A -> Liquid Steel
(11, 20, 'MERGE', 36,  'ACTIVE', 'SYSTEM'),   -- Scrap B -> Liquid Steel
(4,  20, 'MERGE', 30,  'ACTIVE', 'SYSTEM'),   -- Iron Ore -> Liquid Steel
(8,  20, 'MERGE', 18,  'ACTIVE', 'SYSTEM'),   -- Coal -> Liquid Steel
(20, 21, 'MERGE', 210, 'ACTIVE', 'SYSTEM');   -- Liquid Steel -> Billet

-- Order 5 genealogy: Full chain RM -> Liquid -> Slab -> HR Rough -> FG
INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by) VALUES
(1,  22, 'MERGE', 56,  'ACTIVE', 'SYSTEM'),   -- Scrap A -> Liquid Steel
(3,  22, 'MERGE', 16,  'ACTIVE', 'SYSTEM'),   -- Scrap B -> Liquid Steel
(4,  22, 'MERGE', 12,  'ACTIVE', 'SYSTEM'),   -- Iron Ore -> Liquid Steel
(8,  22, 'MERGE', 8,   'ACTIVE', 'SYSTEM'),   -- Coal -> Liquid Steel
(22, 23, 'MERGE', 82,  'ACTIVE', 'SYSTEM'),   -- Liquid Steel -> Slab
(23, 24, 'MERGE', 78,  'ACTIVE', 'SYSTEM'),   -- Slab -> HR Rough
(24, 25, 'MERGE', 75,  'ACTIVE', 'SYSTEM');   -- HR Rough -> FG HR Coil

-- =====================================================
-- STEP 15: Hold Records (5)
-- =====================================================
INSERT INTO hold_records (hold_id, entity_type, entity_id, reason, comments, applied_by, applied_on, status) VALUES
(1, 'BATCH',     10, 'QUALITY_INVESTIGATION', 'Suspected contamination in scrap shipment — pending lab report',             'OP-006', '2026-01-25 10:00:00', 'ACTIVE'),
(2, 'INVENTORY', 20, 'QUALITY_INVESTIGATION', 'Chemical analysis failed — high sulfur content detected',                     'OP-006', '2026-01-26 09:00:00', 'ACTIVE'),
(3, 'INVENTORY', 21, 'QUALITY_INVESTIGATION', 'Surface defects found during slab inspection',                                'OP-007', '2026-01-27 14:00:00', 'ACTIVE'),
(4, 'OPERATION', 22, 'MATERIAL_SHORTAGE',     'Waiting for billet reheating furnace availability',                           'OP-004', '2026-01-28 08:00:00', 'ACTIVE'),
(5, 'BATCH',     27, 'SAFETY_CONCERN',        'Slab surface cracks detected — requires ultrasonic testing before rolling',   'OP-006', '2026-01-29 11:00:00', 'ACTIVE');
ALTER TABLE hold_records ALTER COLUMN hold_id RESTART WITH 6;

-- =====================================================
-- STEP 16: Audit Trail (20 entries)
-- =====================================================
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('ORDER',     1,  'CREATE',        'Created order ORD-2026-001 for ABC Steel — HR-COIL-2MM 150T',       'admin',  '2026-01-10 08:00:00'),
('ORDER',     2,  'CREATE',        'Created order ORD-2026-002 for Global Manuf — CR-SHEET-1MM 80T',    'admin',  '2026-01-12 08:00:00'),
('ORDER',     3,  'CREATE',        'Created order ORD-2026-003 for BuildRight — REBAR-10MM 200T',       'admin',  '2026-01-15 08:00:00'),
('ORDER',     1,  'STATUS_CHANGE', 'CREATED -> IN_PROGRESS',                                             'admin',  '2026-01-15 05:45:00'),
('BATCH',     1,  'CREATE',        'Created batch B-RM-001: Steel Scrap A, 500T',                        'SYSTEM', '2026-01-14 08:00:00'),
('BATCH',     17, 'CREATE',        'Created batch B-IM-001: Liquid Steel, 165T from EAF melting',        'SYSTEM', '2026-01-15 16:00:00'),
('OPERATION', 1,  'CONFIRM',       'Scrap Charging confirmed — 160T loaded into EAF-001',                'OP-001', '2026-01-15 10:00:00'),
('OPERATION', 2,  'CONFIRM',       'EAF Melting confirmed — 155T produced, 5T scrap',                    'OP-001', '2026-01-15 16:00:00'),
('OPERATION', 3,  'CONFIRM',       'Ladle Refining confirmed — 152T refined',                             'OP-001', '2026-01-15 19:00:00'),
('BATCH',     17, 'CONSUME',       'Batch B-IM-001 consumed in slab casting',                             'OP-003', '2026-01-16 06:30:00'),
('BATCH',     18, 'CREATE',        'Created batch B-IM-002: Steel Slab 200mm, 155T',                     'SYSTEM', '2026-01-16 12:00:00'),
('OPERATION', 4,  'CONFIRM',       'Slab Casting confirmed — 148T cast, 4T scrap',                       'OP-003', '2026-01-16 12:00:00'),
('OPERATION', 5,  'CONFIRM',       'Slab Reheating confirmed — 148T reheated to 1250°C',                 'OP-004', '2026-01-17 09:00:00'),
('ORDER',     5,  'STATUS_CHANGE', 'IN_PROGRESS -> COMPLETED',                                           'admin',  '2026-01-11 16:00:00'),
('INVENTORY', 20, 'BLOCK',         'Inventory blocked — suspected contamination in steel scrap',          'OP-006', '2026-01-26 09:00:00'),
('BATCH',     10, 'HOLD',          'Batch B-RM-010 placed on hold — quality investigation',               'OP-006', '2026-01-25 10:00:00'),
('ORDER',     8,  'STATUS_CHANGE', 'CREATED -> ON_HOLD',                                                 'admin',  '2026-01-29 08:00:00'),
('BATCH',     20, 'CREATE',        'Created batch B-IM-004: Liquid Steel, 220T for rebar order',         'SYSTEM', '2026-01-19 17:00:00'),
('BATCH',     21, 'CREATE',        'Created batch B-IM-005: Steel Billet 100mm, 210T',                   'SYSTEM', '2026-01-20 14:00:00'),
('OPERATION', 19, 'CONFIRM',       'Billet Casting confirmed — 210T cast, 8T scrap',                     'OP-003', '2026-01-20 14:00:00');

-- =====================================================
-- STEP 17: Process Parameters Config
-- =====================================================
INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order) VALUES
-- HR-COIL-2MM
('FURNACE', 'HR-COIL-2MM', 'Temperature',        'DECIMAL', '°C',   1500, 1800, 1650, true,  1),
('FURNACE', 'HR-COIL-2MM', 'Holding Time',        'DECIMAL', 'min',    30,  180,   90, true,  2),
('FURNACE', 'HR-COIL-2MM', 'Power Input',         'DECIMAL', 'MW',     20,   80,   50, false, 3),
('CASTER',  'HR-COIL-2MM', 'Casting Speed',       'DECIMAL', 'm/min', 0.8,  2.5,  1.5, true,  1),
('CASTER',  'HR-COIL-2MM', 'Mold Temperature',    'DECIMAL', '°C',   200,  400,  300, true,  2),
('CASTER',  'HR-COIL-2MM', 'Slab Width',          'DECIMAL', 'mm',  1000, 1600, 1250, true,  3),
('ROLLING', 'HR-COIL-2MM', 'Entry Temperature',   'DECIMAL', '°C',  1100, 1280, 1200, true,  1),
('ROLLING', 'HR-COIL-2MM', 'Finish Temperature',  'DECIMAL', '°C',   850, 950,   900, true,  2),
('ROLLING', 'HR-COIL-2MM', 'Coiling Temperature', 'DECIMAL', '°C',   550, 700,   620, true,  3),
('ROLLING', 'HR-COIL-2MM', 'Thickness',           'DECIMAL', 'mm',   1.5, 3.0,   2.0, true,  4),
('ROLLING', 'HR-COIL-2MM', 'Speed',               'DECIMAL', 'm/s',    5,  15,    10, true,  5),
-- CR-SHEET-1MM
('FURNACE', 'CR-SHEET-1MM', 'Temperature',        'DECIMAL', '°C',  1500, 1750, 1620, true,  1),
('FURNACE', 'CR-SHEET-1MM', 'Holding Time',        'DECIMAL', 'min',   30,  150,   80, true,  2),
('CASTER',  'CR-SHEET-1MM', 'Casting Speed',       'DECIMAL', 'm/min', 0.8, 2.0, 1.4, true,  1),
('CASTER',  'CR-SHEET-1MM', 'Mold Temperature',    'DECIMAL', '°C',  200, 380, 280,   true,  2),
('ROLLING', 'CR-SHEET-1MM', 'Entry Temperature',   'DECIMAL', '°C',  1100, 1250, 1180, true,  1),
('ROLLING', 'CR-SHEET-1MM', 'Thickness',           'DECIMAL', 'mm',  0.5,  2.0,  1.0, true,  2),
('ROLLING', 'CR-SHEET-1MM', 'Reduction Ratio',     'DECIMAL', '%',    40,   80,   60, true,  3),
('PICKLING','CR-SHEET-1MM', 'Acid Concentration',  'DECIMAL', '%',    12,   22,   18, true,  1),
('PICKLING','CR-SHEET-1MM', 'Line Speed',          'DECIMAL', 'm/min',  5,  30,   15, true,  2),
-- REBAR-10MM
('FURNACE', 'REBAR-10MM', 'Temperature',          'DECIMAL', '°C',  1550, 1800, 1680, true,  1),
('FURNACE', 'REBAR-10MM', 'Holding Time',          'DECIMAL', 'min',   30,  120,   75, true,  2),
('CASTER',  'REBAR-10MM', 'Casting Speed',         'DECIMAL', 'm/min', 2.0, 5.0, 3.5, true,  1),
('CASTER',  'REBAR-10MM', 'Billet Size',           'DECIMAL', 'mm',   100,  150,  130, true,  2),
('ROLLING', 'REBAR-10MM', 'Entry Temperature',     'DECIMAL', '°C',  1050, 1200, 1100, true,  1),
('ROLLING', 'REBAR-10MM', 'Finish Temperature',    'DECIMAL', '°C',   900, 1050,  980, true,  2),
('ROLLING', 'REBAR-10MM', 'Bar Diameter',          'DECIMAL', 'mm',     8,   32,   10, true,  3),
('COOLING', 'REBAR-10MM', 'Quench Temperature',    'DECIMAL', '°C',   200,  500,  350, true,  1),
('COOLING', 'REBAR-10MM', 'Tempering Temperature', 'DECIMAL', '°C',   400,  650,  550, true,  2);

-- =====================================================
-- Done! Summary:
--   Customers:    8
--   Materials:   24 (13 RM, 8 IM, 3 FG)
--   Products:     6
--   BOM Nodes:   38 (3 trees: 14 + 14 + 10)
--   Equipment:   12
--   Operators:    8
--   Orders:       8  (10 line items)
--   Processes:   17
--   Operations:  30
--   Batches:     27
--   Inventory:   22
--   Confirmations: 18
--   Batch Relations: 12
--   Hold Records:    5
--   Audit Entries:  20
-- =====================================================
