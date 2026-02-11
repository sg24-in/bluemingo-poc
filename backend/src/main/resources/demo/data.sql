-- =====================================================
-- MES Production Confirmation - Comprehensive Demo Data
-- Clears all data EXCEPT users table, then inserts
-- rich multi-level BOM trees, diverse materials, orders,
-- batches with genealogy, inventory, holds, and audit trail.
-- =====================================================

-- =====================================================
-- STEP 0: Clear all existing data (preserve users & patches)
-- =====================================================
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
DELETE FROM operation_templates;
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
-- STEP 2: Lookup Tables (Configuration Data)
-- =====================================================

INSERT INTO delay_reasons (reason_code, reason_description, status) VALUES
('EQUIP_BREAKDOWN', 'Equipment Breakdown', 'ACTIVE'),
('MATERIAL_SHORTAGE', 'Material Shortage', 'ACTIVE'),
('OPERATOR_UNAVAIL', 'Operator Unavailable', 'ACTIVE'),
('QUALITY_ISSUE', 'Quality Issue', 'ACTIVE'),
('SCHEDULING', 'Scheduling Conflict', 'ACTIVE'),
('MAINTENANCE', 'Scheduled Maintenance', 'ACTIVE'),
('POWER_OUTAGE', 'Power Outage', 'ACTIVE'),
('TOOL_CHANGE', 'Tool/Die Change', 'ACTIVE'),
('CALIBRATION', 'Equipment Calibration', 'ACTIVE'),
('OTHER', 'Other', 'ACTIVE');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status) VALUES
('EQUIP_BREAKDOWN', 'Equipment Breakdown', 'OPERATION,EQUIPMENT', 'ACTIVE'),
('QUALITY_INVESTIGATION', 'Quality Investigation', 'OPERATION,BATCH,INVENTORY', 'ACTIVE'),
('MATERIAL_SHORTAGE', 'Material Shortage', 'OPERATION,ORDER_LINE', 'ACTIVE'),
('OPERATOR_UNAVAIL', 'Operator Unavailability', 'OPERATION', 'ACTIVE'),
('SAFETY_CONCERN', 'Safety Concern', 'OPERATION,BATCH,EQUIPMENT', 'ACTIVE'),
('REGULATORY_HOLD', 'Regulatory Hold', 'BATCH,INVENTORY', 'ACTIVE'),
('CUSTOMER_REQUEST', 'Customer Request', 'ORDER,ORDER_LINE', 'ACTIVE'),
('CONTAMINATION', 'Contamination Suspected', 'BATCH,INVENTORY', 'ACTIVE'),
('SPEC_DEVIATION', 'Specification Deviation', 'BATCH,INVENTORY', 'ACTIVE'),
('OTHER', 'Other', 'OPERATION,ORDER_LINE,BATCH,INVENTORY,EQUIPMENT', 'ACTIVE');

-- =====================================================
-- STEP 3: Customers (12 customers)
-- =====================================================
INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, status, created_by) VALUES
('CUST-001', 'ABC Steel Corporation',      'John Smith',       'john.smith@abcsteel.com',      '+1-555-0101', '123 Industrial Ave',      'Pittsburgh',   'USA',     'ACTIVE', 'SYSTEM'),
('CUST-002', 'Global Manufacturing Ltd',   'Sarah Johnson',    'sarah.j@globalmanuf.com',      '+1-555-0102', '456 Factory Road',        'Detroit',      'USA',     'ACTIVE', 'SYSTEM'),
('CUST-003', 'Pacific Metal Works',        'Michael Chen',     'm.chen@pacificmetal.com',      '+1-555-0103', '789 Harbor Blvd',         'Los Angeles',  'USA',     'ACTIVE', 'SYSTEM'),
('CUST-004', 'European Auto Parts GmbH',   'Hans Mueller',     'h.mueller@euroauto.eu',        '+49-30-5504', '10 Industriestrasse',     'Munich',       'Germany', 'ACTIVE', 'SYSTEM'),
('CUST-005', 'Asian Electronics Inc',      'Yuki Tanaka',      'y.tanaka@asianelec.jp',        '+81-3-55050', '5-1 Tech Park',           'Tokyo',        'Japan',   'ACTIVE', 'SYSTEM'),
('CUST-006', 'BuildRight Construction',    'Tom Bradley',      'tom.b@buildright.com',         '+1-555-0106', '900 Contractor Lane',     'Chicago',      'USA',     'ACTIVE', 'SYSTEM'),
('CUST-007', 'Nordic Steel Trading AB',    'Erik Lindqvist',   'erik@nordicsteel.se',          '+46-8-55070', '15 Hamngatan',            'Stockholm',    'Sweden',  'ACTIVE', 'SYSTEM'),
('CUST-008', 'Middle East Metals FZE',     'Ahmed Al-Rashid',  'ahmed@memetals.ae',            '+971-4-5508', 'JAFZA South, Block 12',   'Dubai',        'UAE',     'ACTIVE', 'SYSTEM'),
('CUST-009', 'South American Steel SA',    'Carlos Rodriguez', 'carlos@sasteel.com',           '+54-11-5550', '1500 Av. Industrial',     'Buenos Aires', 'Argentina','ACTIVE', 'SYSTEM'),
('CUST-010', 'African Mining Corp',        'Kwame Mensah',     'kwame@afminecorp.com',         '+27-11-5551', '200 Mining Drive',        'Johannesburg', 'South Africa','ACTIVE', 'SYSTEM'),
('CUST-011', 'Oceanic Metals Ltd',         'Bruce Wilson',     'bruce@oceanicmetals.au',       '+61-2-55520', '45 Harbour View',         'Sydney',       'Australia','ACTIVE', 'SYSTEM'),
('CUST-012', 'Canadian Steel Works',       'Pierre Dubois',    'pierre@cansteelworks.ca',      '+1-514-5553', '800 Rue de Acier',        'Montreal',     'Canada',  'INACTIVE', 'SYSTEM');

-- Audit trail for customers
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('CUSTOMER', 1,  'CREATE', 'Created customer CUST-001: ABC Steel Corporation',      'SYSTEM', '2026-01-01 08:00:00'),
('CUSTOMER', 2,  'CREATE', 'Created customer CUST-002: Global Manufacturing Ltd',   'SYSTEM', '2026-01-01 08:01:00'),
('CUSTOMER', 3,  'CREATE', 'Created customer CUST-003: Pacific Metal Works',        'SYSTEM', '2026-01-01 08:02:00'),
('CUSTOMER', 4,  'CREATE', 'Created customer CUST-004: European Auto Parts GmbH',   'SYSTEM', '2026-01-01 08:03:00'),
('CUSTOMER', 5,  'CREATE', 'Created customer CUST-005: Asian Electronics Inc',      'SYSTEM', '2026-01-01 08:04:00'),
('CUSTOMER', 6,  'CREATE', 'Created customer CUST-006: BuildRight Construction',    'SYSTEM', '2026-01-01 08:05:00'),
('CUSTOMER', 7,  'CREATE', 'Created customer CUST-007: Nordic Steel Trading AB',    'SYSTEM', '2026-01-01 08:06:00'),
('CUSTOMER', 8,  'CREATE', 'Created customer CUST-008: Middle East Metals FZE',     'SYSTEM', '2026-01-01 08:07:00'),
('CUSTOMER', 9,  'CREATE', 'Created customer CUST-009: South American Steel SA',    'SYSTEM', '2026-01-01 08:08:00'),
('CUSTOMER', 10, 'CREATE', 'Created customer CUST-010: African Mining Corp',        'SYSTEM', '2026-01-01 08:09:00'),
('CUSTOMER', 11, 'CREATE', 'Created customer CUST-011: Oceanic Metals Ltd',         'SYSTEM', '2026-01-01 08:10:00'),
('CUSTOMER', 12, 'CREATE', 'Created customer CUST-012: Canadian Steel Works',       'SYSTEM', '2026-01-01 08:11:00'),
('CUSTOMER', 12, 'STATUS_CHANGE', 'Status changed: ACTIVE -> INACTIVE',             'admin',  '2026-01-05 14:00:00');

-- =====================================================
-- STEP 4: Materials Master Data (28 materials)
-- =====================================================
INSERT INTO materials (material_code, material_name, description, material_type, base_unit, material_group, standard_cost, cost_currency, min_stock_level, reorder_point, lead_time_days, status, created_by) VALUES
-- Raw Materials (15)
('RM-SCRAP-A',    'Steel Scrap Grade A',     'High-quality HMS1 steel scrap',              'RM', 'T',  'Scrap',     250.00, 'USD', 100, 200,  3, 'ACTIVE', 'SYSTEM'),
('RM-SCRAP-B',    'Steel Scrap Grade B',     'HMS2 mixed steel scrap',                     'RM', 'T',  'Scrap',     200.00, 'USD',  50, 100,  3, 'ACTIVE', 'SYSTEM'),
('RM-SCRAP-C',    'Steel Scrap Grade C',     'Shredded steel scrap',                       'RM', 'T',  'Scrap',     150.00, 'USD',  30,  60,  3, 'ACTIVE', 'SYSTEM'),
('RM-IRON-ORE',   'Iron Ore Pellets',        'DR-grade iron ore pellets, 67% Fe',          'RM', 'T',  'Iron',      150.00, 'USD',  80, 150, 14, 'ACTIVE', 'SYSTEM'),
('RM-LIMESTONE',  'Limestone',               'High-calcium flux grade limestone',          'RM', 'T',  'Flux',       50.00, 'USD',  30,  60,  5, 'ACTIVE', 'SYSTEM'),
('RM-FESI',       'Ferroalloy - FeSi',       'Ferrosilicon 75% for deoxidation',           'RM', 'KG', 'Alloy',       2.50, 'USD', 500, 1000, 7, 'ACTIVE', 'SYSTEM'),
('RM-FEMN',       'Ferroalloy - FeMn',       'Ferromanganese 78% for strengthening',       'RM', 'KG', 'Alloy',       3.00, 'USD', 400,  800, 7, 'ACTIVE', 'SYSTEM'),
('RM-FEV',        'Ferroalloy - FeV',        'Ferrovanadium 80% for high-strength steel',  'RM', 'KG', 'Alloy',      25.00, 'USD', 100,  200, 14,'ACTIVE', 'SYSTEM'),
('RM-COAL',       'Coal / Coke',             'Met-grade coke for energy and reduction',    'RM', 'T',  'Energy',    120.00, 'USD',  50, 100,  7, 'ACTIVE', 'SYSTEM'),
('RM-GRAPHITE',   'Graphite Electrodes',     'UHP graphite electrodes 600mm',              'RM', 'EA', 'Consumable', 800.00, 'USD',  10,  20, 21, 'ACTIVE', 'SYSTEM'),
('RM-AL-WIRE',    'Aluminum Wire',           'Aluminum deoxidizer wire 9.5mm',             'RM', 'KG', 'Alloy',       4.50, 'USD', 200,  500, 5, 'ACTIVE', 'SYSTEM'),
('RM-MOLD-PWD',   'Mold Powder',             'Continuous casting mold flux powder',        'RM', 'KG', 'Consumable',  1.20, 'USD', 500, 1000, 7, 'ACTIVE', 'SYSTEM'),
('RM-ROLL-LUB',   'Rolling Lubricant',       'Hot/cold rolling process lubricant',         'RM', 'L',  'Consumable',  5.00, 'USD', 500, 1000, 5, 'ACTIVE', 'SYSTEM'),
('RM-HCL',        'Hydrochloric Acid',       'HCl 18% for pickling line',                  'RM', 'L',  'Chemical',    0.80, 'USD', 2000, 4000, 3, 'ACTIVE', 'SYSTEM'),
('RM-COATING',    'Surface Coating Oil',     'Anti-corrosion surface oil',                 'RM', 'L',  'Consumable',  3.50, 'USD', 500, 1000, 5, 'ACTIVE', 'SYSTEM'),
-- Intermediates (10)
('IM-LIQUID',     'Liquid Steel',            'Molten steel from EAF',                      'IM', 'T',  'Steel',     400.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-SLAB',       'Steel Slab 200mm',        'Continuously cast steel slab',               'IM', 'T',  'Steel',     550.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-BILLET',     'Steel Billet 100mm',      'Continuously cast steel billet',             'IM', 'T',  'Steel',     500.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-BLOOM',      'Steel Bloom 200mm',       'Continuously cast steel bloom',              'IM', 'T',  'Steel',     520.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-HR-ROUGH',   'HR Coil Rough',           'Rough-rolled hot strip',                     'IM', 'T',  'Coil',      600.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-PICKLED',    'Pickled HR Strip',        'Acid-pickled hot rolled strip',              'IM', 'T',  'Strip',     650.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-CR-STRIP',   'Cold Rolled Strip',       'Cold-reduced steel strip',                   'IM', 'T',  'Strip',     750.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-ANNEALED',   'Annealed CR Strip',       'Batch-annealed cold rolled strip',           'IM', 'T',  'Strip',     780.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-ROLLED-BAR', 'Rolled Bar',              'Hot-rolled reinforcement bar',               'IM', 'T',  'Long',      540.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('IM-WIRE-ROD',   'Wire Rod',                'Hot-rolled wire rod coil',                   'IM', 'T',  'Long',      560.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
-- Work In Progress (4) - Material actively being processed
('WIP-MELT',      'Molten Steel (Processing)','Liquid steel in ladle - active refining',   'WIP', 'T',  'Steel',     380.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('WIP-CAST',      'Steel Being Cast',        'Steel in continuous caster - active',        'WIP', 'T',  'Steel',     420.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('WIP-ROLL',      'Strip on Rolling Mill',   'Hot strip on rolling mill - active',         'WIP', 'T',  'Coil',      550.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('WIP-PICKLE',    'Strip in Pickling Line',  'Strip in acid pickling - active',            'WIP', 'T',  'Strip',     600.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
-- Finished Goods (3)
('FG-HR-2MM',     'HR Coil 2mm',             'Hot rolled coil, 2mm thickness',             'FG', 'T',  'Coil',      700.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('FG-CR-1MM',     'CR Sheet 1mm',            'Cold rolled sheet, 1mm thickness',           'FG', 'T',  'Sheet',     850.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM'),
('FG-REBAR-10',   'Rebar 10mm',              'Reinforcement bar, 10mm diameter',           'FG', 'T',  'Long',      580.00, 'USD', NULL, NULL, NULL, 'ACTIVE', 'SYSTEM');

-- Audit trail for materials
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('MATERIAL', 1,  'CREATE', 'Created material RM-SCRAP-A: Steel Scrap Grade A',    'SYSTEM', '2026-01-01 09:00:00'),
('MATERIAL', 2,  'CREATE', 'Created material RM-SCRAP-B: Steel Scrap Grade B',    'SYSTEM', '2026-01-01 09:01:00'),
('MATERIAL', 3,  'CREATE', 'Created material RM-SCRAP-C: Steel Scrap Grade C',    'SYSTEM', '2026-01-01 09:02:00'),
('MATERIAL', 4,  'CREATE', 'Created material RM-IRON-ORE: Iron Ore Pellets',      'SYSTEM', '2026-01-01 09:03:00'),
('MATERIAL', 5,  'CREATE', 'Created material RM-LIMESTONE: Limestone',            'SYSTEM', '2026-01-01 09:04:00'),
('MATERIAL', 6,  'CREATE', 'Created material RM-FESI: Ferroalloy - FeSi',         'SYSTEM', '2026-01-01 09:05:00'),
('MATERIAL', 7,  'CREATE', 'Created material RM-FEMN: Ferroalloy - FeMn',         'SYSTEM', '2026-01-01 09:06:00'),
('MATERIAL', 8,  'CREATE', 'Created material RM-FEV: Ferroalloy - FeV',           'SYSTEM', '2026-01-01 09:07:00'),
('MATERIAL', 9,  'CREATE', 'Created material RM-COAL: Coal / Coke',               'SYSTEM', '2026-01-01 09:08:00'),
('MATERIAL', 10, 'CREATE', 'Created material RM-GRAPHITE: Graphite Electrodes',   'SYSTEM', '2026-01-01 09:09:00'),
('MATERIAL', 11, 'CREATE', 'Created material RM-AL-WIRE: Aluminum Wire',          'SYSTEM', '2026-01-01 09:10:00'),
('MATERIAL', 12, 'CREATE', 'Created material RM-MOLD-PWD: Mold Powder',           'SYSTEM', '2026-01-01 09:11:00'),
('MATERIAL', 13, 'CREATE', 'Created material RM-ROLL-LUB: Rolling Lubricant',     'SYSTEM', '2026-01-01 09:12:00'),
('MATERIAL', 14, 'CREATE', 'Created material RM-HCL: Hydrochloric Acid',          'SYSTEM', '2026-01-01 09:13:00'),
('MATERIAL', 15, 'CREATE', 'Created material RM-COATING: Surface Coating Oil',    'SYSTEM', '2026-01-01 09:14:00'),
('MATERIAL', 16, 'CREATE', 'Created material IM-LIQUID: Liquid Steel',            'SYSTEM', '2026-01-01 09:15:00'),
('MATERIAL', 17, 'CREATE', 'Created material IM-SLAB: Steel Slab 200mm',          'SYSTEM', '2026-01-01 09:16:00'),
('MATERIAL', 18, 'CREATE', 'Created material IM-BILLET: Steel Billet 100mm',      'SYSTEM', '2026-01-01 09:17:00'),
('MATERIAL', 19, 'CREATE', 'Created material IM-BLOOM: Steel Bloom 200mm',        'SYSTEM', '2026-01-01 09:18:00'),
('MATERIAL', 20, 'CREATE', 'Created material IM-HR-ROUGH: HR Coil Rough',         'SYSTEM', '2026-01-01 09:19:00'),
('MATERIAL', 21, 'CREATE', 'Created material IM-PICKLED: Pickled HR Strip',       'SYSTEM', '2026-01-01 09:20:00'),
('MATERIAL', 22, 'CREATE', 'Created material IM-CR-STRIP: Cold Rolled Strip',     'SYSTEM', '2026-01-01 09:21:00'),
('MATERIAL', 23, 'CREATE', 'Created material IM-ANNEALED: Annealed CR Strip',     'SYSTEM', '2026-01-01 09:22:00'),
('MATERIAL', 24, 'CREATE', 'Created material IM-ROLLED-BAR: Rolled Bar',          'SYSTEM', '2026-01-01 09:23:00'),
('MATERIAL', 25, 'CREATE', 'Created material IM-WIRE-ROD: Wire Rod',              'SYSTEM', '2026-01-01 09:24:00'),
('MATERIAL', 26, 'CREATE', 'Created material FG-HR-2MM: HR Coil 2mm',             'SYSTEM', '2026-01-01 09:25:00'),
('MATERIAL', 27, 'CREATE', 'Created material FG-CR-1MM: CR Sheet 1mm',            'SYSTEM', '2026-01-01 09:26:00'),
('MATERIAL', 28, 'CREATE', 'Created material FG-REBAR-10: Rebar 10mm',            'SYSTEM', '2026-01-01 09:27:00');

-- =====================================================
-- STEP 5: Products (8 products)
-- =====================================================
INSERT INTO products (sku, product_name, description, product_category, product_group, base_unit, standard_price, price_currency, min_order_qty, lead_time_days, status, created_by) VALUES
('HR-COIL-2MM',     'Hot Rolled Coil 2mm',       'Hot rolled coil, 2mm x 1250mm width',     'Coils',     'Hot Rolled',    'T', 700.00,  'USD', 10, 14, 'ACTIVE', 'SYSTEM'),
('HR-COIL-3MM',     'Hot Rolled Coil 3mm',       'Hot rolled coil, 3mm x 1500mm width',     'Coils',     'Hot Rolled',    'T', 680.00,  'USD', 10, 14, 'ACTIVE', 'SYSTEM'),
('HR-COIL-4MM',     'Hot Rolled Coil 4mm',       'Hot rolled coil, 4mm x 1500mm width',     'Coils',     'Hot Rolled',    'T', 660.00,  'USD', 15, 14, 'ACTIVE', 'SYSTEM'),
('CR-SHEET-1MM',    'Cold Rolled Sheet 1mm',     'Cold rolled sheet, 1mm x 1250mm',         'Sheets',    'Cold Rolled',   'T', 850.00,  'USD',  5, 21, 'ACTIVE', 'SYSTEM'),
('CR-SHEET-2MM',    'Cold Rolled Sheet 2mm',     'Cold rolled sheet, 2mm x 1250mm',         'Sheets',    'Cold Rolled',   'T', 820.00,  'USD',  5, 21, 'ACTIVE', 'SYSTEM'),
('REBAR-10MM',      'Reinforcement Bar 10mm',    'TMT rebar, 10mm, Fe500D grade',           'Rebars',    'Long Products', 'T', 580.00,  'USD', 20, 10, 'ACTIVE', 'SYSTEM'),
('REBAR-12MM',      'Reinforcement Bar 12mm',    'TMT rebar, 12mm, Fe500D grade',           'Rebars',    'Long Products', 'T', 575.00,  'USD', 20, 10, 'ACTIVE', 'SYSTEM'),
('STEEL-BILLET-100','Steel Billet 100mm',        'Steel billet 100x100mm square',           'Billets',   'Semi-Finished', 'T', 500.00,  'USD', 25,  7, 'ACTIVE', 'SYSTEM');

-- Audit trail for products
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('PRODUCT', 1, 'CREATE', 'Created product HR-COIL-2MM: Hot Rolled Coil 2mm',      'SYSTEM', '2026-01-01 10:00:00'),
('PRODUCT', 2, 'CREATE', 'Created product HR-COIL-3MM: Hot Rolled Coil 3mm',      'SYSTEM', '2026-01-01 10:01:00'),
('PRODUCT', 3, 'CREATE', 'Created product HR-COIL-4MM: Hot Rolled Coil 4mm',      'SYSTEM', '2026-01-01 10:02:00'),
('PRODUCT', 4, 'CREATE', 'Created product CR-SHEET-1MM: Cold Rolled Sheet 1mm',   'SYSTEM', '2026-01-01 10:03:00'),
('PRODUCT', 5, 'CREATE', 'Created product CR-SHEET-2MM: Cold Rolled Sheet 2mm',   'SYSTEM', '2026-01-01 10:04:00'),
('PRODUCT', 6, 'CREATE', 'Created product REBAR-10MM: Reinforcement Bar 10mm',    'SYSTEM', '2026-01-01 10:05:00'),
('PRODUCT', 7, 'CREATE', 'Created product REBAR-12MM: Reinforcement Bar 12mm',    'SYSTEM', '2026-01-01 10:06:00'),
('PRODUCT', 8, 'CREATE', 'Created product STEEL-BILLET-100: Steel Billet 100mm',  'SYSTEM', '2026-01-01 10:07:00');

-- =====================================================
-- STEP 6: Equipment (16 pieces with varied statuses)
-- =====================================================
INSERT INTO equipment (equipment_id, equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status) VALUES
(1,  'EAF-001',  'Electric Arc Furnace #1',    'BATCH',      'MELTING',      120, 'T',     'Melting Shop',     'AVAILABLE'),
(2,  'EAF-002',  'Electric Arc Furnace #2',    'BATCH',      'MELTING',      100, 'T',     'Melting Shop',     'IN_USE'),
(3,  'EAF-003',  'Electric Arc Furnace #3',    'BATCH',      'MELTING',       80, 'T',     'Melting Shop',     'MAINTENANCE'),
(4,  'LF-001',   'Ladle Furnace #1',           'BATCH',      'REFINING',     120, 'T',     'Melting Shop',     'AVAILABLE'),
(5,  'LF-002',   'Ladle Furnace #2',           'BATCH',      'REFINING',     100, 'T',     'Melting Shop',     'AVAILABLE'),
(6,  'CCM-001',  'Continuous Caster #1',       'CONTINUOUS', 'CASTING',       50, 'T/hr',  'Casting Area',     'AVAILABLE'),
(7,  'CCM-002',  'Continuous Caster #2',       'CONTINUOUS', 'CASTING',       45, 'T/hr',  'Casting Area',     'IN_USE'),
(8,  'HSM-001',  'Hot Strip Mill #1',          'CONTINUOUS', 'HOT_ROLLING',   30, 'T/hr',  'Hot Rolling Mill', 'AVAILABLE'),
(9,  'HSM-002',  'Hot Strip Mill #2',          'CONTINUOUS', 'HOT_ROLLING',   35, 'T/hr',  'Hot Rolling Mill', 'AVAILABLE'),
(10, 'CRM-001',  'Cold Rolling Mill #1',       'CONTINUOUS', 'COLD_ROLLING',  20, 'T/hr',  'Cold Mill',        'AVAILABLE'),
(11, 'BAF-001',  'Batch Annealing Furnace #1', 'BATCH',      'HEAT_TREATMENT',60, 'T',     'Annealing Bay',    'AVAILABLE'),
(12, 'BRM-001',  'Bar Rolling Mill #1',        'CONTINUOUS', 'BAR_ROLLING',   40, 'T/hr',  'Bar Mill',         'AVAILABLE'),
(13, 'PKL-001',  'Pickling Line #1',           'CONTINUOUS', 'PICKLING',      25, 'T/hr',  'Pickling Bay',     'ON_HOLD'),
(14, 'COAT-001', 'Galvanizing Line #1',        'CONTINUOUS', 'COATING',       30, 'T/hr',  'Coating Bay',      'AVAILABLE'),
(15, 'WIRE-001', 'Wire Drawing Machine #1',    'CONTINUOUS', 'WIRE_DRAWING',  10, 'T/hr',  'Wire Mill',        'AVAILABLE'),
(16, 'PACK-001', 'Packaging Line #1',          'BATCH',      'PACKAGING',     50, 'T',     'Shipping',         'AVAILABLE');
ALTER TABLE equipment ALTER COLUMN equipment_id RESTART WITH 17;

-- Audit trail for equipment
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('EQUIPMENT', 1,  'CREATE', 'Created equipment EAF-001: Electric Arc Furnace #1',    'SYSTEM', '2026-01-01 11:00:00'),
('EQUIPMENT', 2,  'CREATE', 'Created equipment EAF-002: Electric Arc Furnace #2',    'SYSTEM', '2026-01-01 11:01:00'),
('EQUIPMENT', 3,  'CREATE', 'Created equipment EAF-003: Electric Arc Furnace #3',    'SYSTEM', '2026-01-01 11:02:00'),
('EQUIPMENT', 4,  'CREATE', 'Created equipment LF-001: Ladle Furnace #1',            'SYSTEM', '2026-01-01 11:03:00'),
('EQUIPMENT', 5,  'CREATE', 'Created equipment LF-002: Ladle Furnace #2',            'SYSTEM', '2026-01-01 11:04:00'),
('EQUIPMENT', 6,  'CREATE', 'Created equipment CCM-001: Continuous Caster #1',       'SYSTEM', '2026-01-01 11:05:00'),
('EQUIPMENT', 7,  'CREATE', 'Created equipment CCM-002: Continuous Caster #2',       'SYSTEM', '2026-01-01 11:06:00'),
('EQUIPMENT', 8,  'CREATE', 'Created equipment HSM-001: Hot Strip Mill #1',          'SYSTEM', '2026-01-01 11:07:00'),
('EQUIPMENT', 9,  'CREATE', 'Created equipment HSM-002: Hot Strip Mill #2',          'SYSTEM', '2026-01-01 11:08:00'),
('EQUIPMENT', 10, 'CREATE', 'Created equipment CRM-001: Cold Rolling Mill #1',       'SYSTEM', '2026-01-01 11:09:00'),
('EQUIPMENT', 11, 'CREATE', 'Created equipment BAF-001: Batch Annealing Furnace #1', 'SYSTEM', '2026-01-01 11:10:00'),
('EQUIPMENT', 12, 'CREATE', 'Created equipment BRM-001: Bar Rolling Mill #1',        'SYSTEM', '2026-01-01 11:11:00'),
('EQUIPMENT', 13, 'CREATE', 'Created equipment PKL-001: Pickling Line #1',           'SYSTEM', '2026-01-01 11:12:00'),
('EQUIPMENT', 14, 'CREATE', 'Created equipment COAT-001: Galvanizing Line #1',       'SYSTEM', '2026-01-01 11:13:00'),
('EQUIPMENT', 15, 'CREATE', 'Created equipment WIRE-001: Wire Drawing Machine #1',   'SYSTEM', '2026-01-01 11:14:00'),
('EQUIPMENT', 16, 'CREATE', 'Created equipment PACK-001: Packaging Line #1',         'SYSTEM', '2026-01-01 11:15:00'),
('EQUIPMENT', 2,  'STATUS_CHANGE', 'Status: AVAILABLE -> IN_USE',                    'OP-001', '2026-01-20 06:30:00'),
('EQUIPMENT', 3,  'STATUS_CHANGE', 'Status: AVAILABLE -> MAINTENANCE',               'admin',  '2026-01-25 08:00:00'),
('EQUIPMENT', 7,  'STATUS_CHANGE', 'Status: AVAILABLE -> IN_USE',                    'OP-003', '2026-01-22 07:00:00'),
('EQUIPMENT', 13, 'STATUS_CHANGE', 'Status: AVAILABLE -> ON_HOLD',                   'OP-006', '2026-01-28 10:00:00');

-- =====================================================
-- STEP 7: Operators (12 operators)
-- =====================================================
INSERT INTO operators (operator_code, name, department, shift, status) VALUES
('OP-001', 'John Smith',        'Melting',      'Day',   'ACTIVE'),
('OP-002', 'Mike Wilson',       'Melting',      'Night', 'ACTIVE'),
('OP-003', 'Sarah Brown',       'Casting',      'Day',   'ACTIVE'),
('OP-004', 'David Lee',         'Hot Rolling',  'Day',   'ACTIVE'),
('OP-005', 'Emily Chen',        'Cold Rolling', 'Day',   'ACTIVE'),
('OP-006', 'Robert Garcia',     'Quality',      'Day',   'ACTIVE'),
('OP-007', 'Jennifer Martinez', 'Quality',      'Night', 'ACTIVE'),
('OP-008', 'William Johnson',   'Maintenance',  'Day',   'ACTIVE'),
('OP-009', 'David Park',        'Finishing',    'Day',   'ACTIVE'),
('OP-010', 'Maria Santos',      'Coating',      'Night', 'ACTIVE'),
('OP-011', 'Ahmed Hassan',      'Melting',      'Night', 'ACTIVE'),
('OP-012', 'Lisa Chen',         'Quality',      'Day',   'INACTIVE');

-- Audit trail for operators
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('OPERATOR', 1,  'CREATE', 'Created operator OP-001: John Smith (Melting)',        'SYSTEM', '2026-01-01 12:00:00'),
('OPERATOR', 2,  'CREATE', 'Created operator OP-002: Mike Wilson (Melting)',       'SYSTEM', '2026-01-01 12:01:00'),
('OPERATOR', 3,  'CREATE', 'Created operator OP-003: Sarah Brown (Casting)',       'SYSTEM', '2026-01-01 12:02:00'),
('OPERATOR', 4,  'CREATE', 'Created operator OP-004: David Lee (Hot Rolling)',     'SYSTEM', '2026-01-01 12:03:00'),
('OPERATOR', 5,  'CREATE', 'Created operator OP-005: Emily Chen (Cold Rolling)',   'SYSTEM', '2026-01-01 12:04:00'),
('OPERATOR', 6,  'CREATE', 'Created operator OP-006: Robert Garcia (Quality)',     'SYSTEM', '2026-01-01 12:05:00'),
('OPERATOR', 7,  'CREATE', 'Created operator OP-007: Jennifer Martinez (Quality)', 'SYSTEM', '2026-01-01 12:06:00'),
('OPERATOR', 8,  'CREATE', 'Created operator OP-008: William Johnson (Maint)',     'SYSTEM', '2026-01-01 12:07:00'),
('OPERATOR', 9,  'CREATE', 'Created operator OP-009: David Park (Finishing)',      'SYSTEM', '2026-01-01 12:08:00'),
('OPERATOR', 10, 'CREATE', 'Created operator OP-010: Maria Santos (Coating)',      'SYSTEM', '2026-01-01 12:09:00'),
('OPERATOR', 11, 'CREATE', 'Created operator OP-011: Ahmed Hassan (Melting)',      'SYSTEM', '2026-01-01 12:10:00'),
('OPERATOR', 12, 'CREATE', 'Created operator OP-012: Lisa Chen (Quality)',         'SYSTEM', '2026-01-01 12:11:00'),
('OPERATOR', 12, 'STATUS_CHANGE', 'Status: ACTIVE -> INACTIVE',                    'admin',  '2026-01-30 16:00:00');

-- =====================================================
-- STEP 8: Operation Templates (DESIGN-TIME)
-- =====================================================
INSERT INTO operation_templates (operation_template_id, operation_name, operation_code, operation_type, quantity_type, default_equipment_type, description, estimated_duration_minutes, status, created_by) VALUES
(1,  'Scrap Charging',        'MELT-CHRG', 'FURNACE',       'BATCH',      'EAF',     'Load scrap into electric arc furnace',          60,  'ACTIVE', 'SYSTEM'),
(2,  'EAF Melting',           'MELT-EAF',  'FURNACE',       'BATCH',      'EAF',     'Melt scrap in electric arc furnace',            180, 'ACTIVE', 'SYSTEM'),
(3,  'Ladle Refining',        'MELT-LF',   'FURNACE',       'BATCH',      'LF',      'Refine steel chemistry in ladle furnace',       90,  'ACTIVE', 'SYSTEM'),
(4,  'Slab Casting',          'CAST-SLAB', 'CASTER',        'CONTINUOUS', 'CCM',     'Continuous cast liquid steel into slabs',       240, 'ACTIVE', 'SYSTEM'),
(5,  'Billet Casting',        'CAST-BILL', 'CASTER',        'CONTINUOUS', 'CCM',     'Continuous cast liquid steel into billets',     180, 'ACTIVE', 'SYSTEM'),
(6,  'Slab Reheating',        'ROLL-RHT',  'FURNACE',       'BATCH',      'RHF',     'Reheat slabs for hot rolling',                  120, 'ACTIVE', 'SYSTEM'),
(7,  'Rough Rolling',         'ROLL-RGH',  'ROLLING',       'CONTINUOUS', 'HSM',     'Rough roll slabs to intermediate thickness',    60,  'ACTIVE', 'SYSTEM'),
(8,  'Finish Rolling',        'ROLL-FIN',  'ROLLING',       'CONTINUOUS', 'HSM',     'Finish roll to target thickness',               45,  'ACTIVE', 'SYSTEM'),
(9,  'Cooling & Coiling',     'ROLL-COOL', 'COOLING',       'CONTINUOUS', 'HSM',     'Cool and coil hot rolled strip',                30,  'ACTIVE', 'SYSTEM'),
(10, 'Pickling',              'PKL',       'PICKLING',      'CONTINUOUS', 'PKL',     'Remove scale via acid pickling',                90,  'ACTIVE', 'SYSTEM'),
(11, 'Cold Rolling',          'CRM',       'ROLLING',       'CONTINUOUS', 'CRM',     'Cold reduce thickness',                         120, 'ACTIVE', 'SYSTEM'),
(12, 'Batch Annealing',       'ANN',       'HEAT_TREATMENT','BATCH',      'BAF',     'Anneal cold rolled coils',                      480, 'ACTIVE', 'SYSTEM'),
(13, 'Billet Reheating',      'BAR-RHT',   'FURNACE',       'BATCH',      'RHF',     'Reheat billets for bar rolling',                90,  'ACTIVE', 'SYSTEM'),
(14, 'Bar Rolling',           'BAR-ROLL',  'ROLLING',       'CONTINUOUS', 'BRM',     'Roll billets into bars/rebar',                  60,  'ACTIVE', 'SYSTEM'),
(15, 'Quenching & Tempering', 'BAR-QT',    'HEAT_TREATMENT','CONTINUOUS', 'QT',      'Quench and temper rebar',                       30,  'ACTIVE', 'SYSTEM'),
(16, 'Quality Inspection',    'QC',        'INSPECTION',    'DISCRETE',   'LAB',     'Perform quality inspection',                    60,  'ACTIVE', 'SYSTEM'),
(17, 'Packaging',             'PACK',      'FINISHING',     'DISCRETE',   'PACK',    'Package finished products',                     45,  'ACTIVE', 'SYSTEM'),
(18, 'Galvanizing',           'GALV',      'COATING',       'CONTINUOUS', 'GALV',    'Hot-dip galvanize steel',                       120, 'INACTIVE', 'SYSTEM');
ALTER TABLE operation_templates ALTER COLUMN operation_template_id RESTART WITH 19;

-- Audit trail for operation templates
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('OPERATION_TEMPLATE', 1,  'CREATE', 'Created template: Scrap Charging (FURNACE)',        'SYSTEM', '2026-01-02 08:00:00'),
('OPERATION_TEMPLATE', 2,  'CREATE', 'Created template: EAF Melting (FURNACE)',           'SYSTEM', '2026-01-02 08:01:00'),
('OPERATION_TEMPLATE', 3,  'CREATE', 'Created template: Ladle Refining (FURNACE)',        'SYSTEM', '2026-01-02 08:02:00'),
('OPERATION_TEMPLATE', 4,  'CREATE', 'Created template: Slab Casting (CASTER)',           'SYSTEM', '2026-01-02 08:03:00'),
('OPERATION_TEMPLATE', 5,  'CREATE', 'Created template: Billet Casting (CASTER)',         'SYSTEM', '2026-01-02 08:04:00'),
('OPERATION_TEMPLATE', 6,  'CREATE', 'Created template: Slab Reheating (FURNACE)',        'SYSTEM', '2026-01-02 08:05:00'),
('OPERATION_TEMPLATE', 7,  'CREATE', 'Created template: Rough Rolling (ROLLING)',         'SYSTEM', '2026-01-02 08:06:00'),
('OPERATION_TEMPLATE', 8,  'CREATE', 'Created template: Finish Rolling (ROLLING)',        'SYSTEM', '2026-01-02 08:07:00'),
('OPERATION_TEMPLATE', 9,  'CREATE', 'Created template: Cooling & Coiling (COOLING)',     'SYSTEM', '2026-01-02 08:08:00'),
('OPERATION_TEMPLATE', 10, 'CREATE', 'Created template: Pickling (PICKLING)',             'SYSTEM', '2026-01-02 08:09:00'),
('OPERATION_TEMPLATE', 11, 'CREATE', 'Created template: Cold Rolling (ROLLING)',          'SYSTEM', '2026-01-02 08:10:00'),
('OPERATION_TEMPLATE', 12, 'CREATE', 'Created template: Batch Annealing (HEAT_TREATMENT)','SYSTEM', '2026-01-02 08:11:00'),
('OPERATION_TEMPLATE', 13, 'CREATE', 'Created template: Billet Reheating (FURNACE)',      'SYSTEM', '2026-01-02 08:12:00'),
('OPERATION_TEMPLATE', 14, 'CREATE', 'Created template: Bar Rolling (ROLLING)',           'SYSTEM', '2026-01-02 08:13:00'),
('OPERATION_TEMPLATE', 15, 'CREATE', 'Created template: Quenching & Tempering (QT)',      'SYSTEM', '2026-01-02 08:14:00'),
('OPERATION_TEMPLATE', 16, 'CREATE', 'Created template: Quality Inspection (INSPECTION)', 'SYSTEM', '2026-01-02 08:15:00'),
('OPERATION_TEMPLATE', 17, 'CREATE', 'Created template: Packaging (FINISHING)',           'SYSTEM', '2026-01-02 08:16:00'),
('OPERATION_TEMPLATE', 18, 'CREATE', 'Created template: Galvanizing (COATING)',           'SYSTEM', '2026-01-02 08:17:00'),
('OPERATION_TEMPLATE', 18, 'STATUS_CHANGE', 'Status: ACTIVE -> INACTIVE',                 'admin',  '2026-01-05 10:00:00');

-- =====================================================
-- STEP 9: Processes (Design-Time Templates)
-- =====================================================
INSERT INTO processes (process_id, process_name, status, created_by) VALUES
(1,  'Hot Rolled Coil Production',    'ACTIVE',   'SYSTEM'),
(2,  'Cold Rolled Sheet Production',  'ACTIVE',   'SYSTEM'),
(3,  'Rebar Production',              'ACTIVE',   'SYSTEM'),
(4,  'Billet Production',             'ACTIVE',   'SYSTEM'),
(5,  'Wire Rod Production',           'DRAFT',    'SYSTEM'),
(6,  'Galvanized Sheet Production',   'INACTIVE', 'SYSTEM');
ALTER TABLE processes ALTER COLUMN process_id RESTART WITH 7;

-- Audit trail for processes
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('PROCESS', 1, 'CREATE', 'Created process: Hot Rolled Coil Production',   'SYSTEM', '2026-01-02 09:00:00'),
('PROCESS', 2, 'CREATE', 'Created process: Cold Rolled Sheet Production', 'SYSTEM', '2026-01-02 09:01:00'),
('PROCESS', 3, 'CREATE', 'Created process: Rebar Production',             'SYSTEM', '2026-01-02 09:02:00'),
('PROCESS', 4, 'CREATE', 'Created process: Billet Production',            'SYSTEM', '2026-01-02 09:03:00'),
('PROCESS', 5, 'CREATE', 'Created process: Wire Rod Production',          'SYSTEM', '2026-01-02 09:04:00'),
('PROCESS', 6, 'CREATE', 'Created process: Galvanized Sheet Production',  'SYSTEM', '2026-01-02 09:05:00'),
('PROCESS', 6, 'STATUS_CHANGE', 'Status: DRAFT -> INACTIVE',              'admin',  '2026-01-10 14:00:00');

-- =====================================================
-- STEP 10: Routing (one per process)
-- =====================================================
INSERT INTO routing (routing_id, process_id, routing_name, routing_type, status, created_by) VALUES
(1, 1, 'HR Coil Standard Route',   'SEQUENTIAL', 'ACTIVE', 'SYSTEM'),
(2, 2, 'CR Sheet Standard Route',  'SEQUENTIAL', 'ACTIVE', 'SYSTEM'),
(3, 3, 'Rebar Standard Route',     'SEQUENTIAL', 'ACTIVE', 'SYSTEM'),
(4, 4, 'Billet Standard Route',    'SEQUENTIAL', 'ACTIVE', 'SYSTEM');
ALTER TABLE routing ALTER COLUMN routing_id RESTART WITH 5;

-- Audit trail for routing
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('ROUTING', 1, 'CREATE', 'Created routing: HR Coil Standard Route',  'SYSTEM', '2026-01-02 10:00:00'),
('ROUTING', 2, 'CREATE', 'Created routing: CR Sheet Standard Route', 'SYSTEM', '2026-01-02 10:01:00'),
('ROUTING', 3, 'CREATE', 'Created routing: Rebar Standard Route',    'SYSTEM', '2026-01-02 10:02:00'),
('ROUTING', 4, 'CREATE', 'Created routing: Billet Standard Route',   'SYSTEM', '2026-01-02 10:03:00');

-- =====================================================
-- STEP 11: Routing Steps (link to operation templates)
-- =====================================================
-- HR Coil Route: Charging -> EAF -> LF -> Slab Cast -> Reheat -> Rough -> Finish -> Cool
INSERT INTO routing_steps (routing_step_id, routing_id, operation_template_id, sequence_number, mandatory_flag, produces_output_batch, status, created_by) VALUES
(1,  1, 1,  1, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- Scrap Charging
(2,  1, 2,  2, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- EAF Melting
(3,  1, 3,  3, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Ladle Refining -> Liquid Steel
(4,  1, 4,  4, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Slab Casting -> Slab
(5,  1, 6,  5, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- Slab Reheating
(6,  1, 7,  6, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- Rough Rolling
(7,  1, 8,  7, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- Finish Rolling
(8,  1, 9,  8, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Cooling & Coiling -> HR Coil

-- CR Sheet Route: HR Coil -> Pickling -> Cold Rolling -> Annealing
(9,  2, 10, 1, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Pickling
(10, 2, 11, 2, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Cold Rolling
(11, 2, 12, 3, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Batch Annealing -> CR Sheet

-- Rebar Route: Charging -> EAF -> LF -> Billet Cast -> Billet Reheat -> Bar Roll -> QT
(12, 3, 1,  1, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- Scrap Charging
(13, 3, 2,  2, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- EAF Melting
(14, 3, 3,  3, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Ladle Refining -> Liquid Steel
(15, 3, 5,  4, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Billet Casting -> Billet
(16, 3, 13, 5, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- Billet Reheating
(17, 3, 14, 6, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- Bar Rolling
(18, 3, 15, 7, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Quenching & Tempering -> Rebar

-- Billet Route: Charging -> EAF -> LF -> Billet Cast
(19, 4, 1,  1, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- Scrap Charging
(20, 4, 2,  2, TRUE, FALSE, 'ACTIVE', 'SYSTEM'),  -- EAF Melting
(21, 4, 3,  3, TRUE, TRUE,  'ACTIVE', 'SYSTEM'),  -- Ladle Refining -> Liquid Steel
(22, 4, 5,  4, TRUE, TRUE,  'ACTIVE', 'SYSTEM');  -- Billet Casting -> Billet
ALTER TABLE routing_steps ALTER COLUMN routing_step_id RESTART WITH 23;

-- =====================================================
-- STEP 12: Bill of Materials (3 multi-level trees)
-- =====================================================

-- BOM 1: HR-COIL-2MM — 5-level tree
INSERT INTO bill_of_material (bom_id, product_sku, bom_version, material_id, material_name, quantity_required, unit, yield_loss_ratio, sequence_level, parent_bom_id, status, created_by) VALUES
(1,  'HR-COIL-2MM', 'V1', 'FG-HR-2MM',    'Finished HR Coil 2mm',     1.0000, 'T',  0.98,   1, NULL, 'ACTIVE', 'SYSTEM'),
(2,  'HR-COIL-2MM', 'V1', 'IM-HR-ROUGH',  'Hot Rolled Strip',         1.0500, 'T',  0.95,   2, 1,    'ACTIVE', 'SYSTEM'),
(3,  'HR-COIL-2MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0200, 'L',  1.00,   2, 1,    'ACTIVE', 'SYSTEM'),
(4,  'HR-COIL-2MM', 'V1', 'IM-SLAB',      'Steel Slab 200mm',         1.1200, 'T',  0.93,   3, 2,    'ACTIVE', 'SYSTEM'),
(5,  'HR-COIL-2MM', 'V1', 'RM-ROLL-LUB',  'Rolling Lubricant',        0.0100, 'L',  1.00,   3, 2,    'ACTIVE', 'SYSTEM'),
(6,  'HR-COIL-2MM', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.1800, 'T',  0.88,   4, 4,    'ACTIVE', 'SYSTEM'),
(7,  'HR-COIL-2MM', 'V1', 'RM-MOLD-PWD',  'Mold Powder',              0.0050, 'KG', 1.00,   4, 4,    'ACTIVE', 'SYSTEM'),
(8,  'HR-COIL-2MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7000, 'T',  0.95,   5, 6,    'ACTIVE', 'SYSTEM'),
(9,  'HR-COIL-2MM', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.2000, 'T',  0.92,   5, 6,    'ACTIVE', 'SYSTEM'),
(10, 'HR-COIL-2MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1500, 'T',  0.97,   5, 6,    'ACTIVE', 'SYSTEM'),
(11, 'HR-COIL-2MM', 'V1', 'RM-LIMESTONE', 'Limestone',                0.0800, 'T',  1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
(12, 'HR-COIL-2MM', 'V1', 'RM-FESI',      'Ferroalloy FeSi',          0.0050, 'KG', 1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
(13, 'HR-COIL-2MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.1000, 'T',  1.00,   5, 6,    'ACTIVE', 'SYSTEM'),
(14, 'HR-COIL-2MM', 'V1', 'RM-GRAPHITE',  'Graphite Electrodes',      0.0030, 'EA', 0.85,   5, 6,    'ACTIVE', 'SYSTEM'),

-- BOM 2: CR-SHEET-1MM — 6-level tree
(15, 'CR-SHEET-1MM', 'V1', 'FG-CR-1MM',    'Finished CR Sheet 1mm',    1.0000, 'T',  0.97,   1, NULL, 'ACTIVE', 'SYSTEM'),
(16, 'CR-SHEET-1MM', 'V1', 'IM-ANNEALED',  'Annealed CR Strip',        1.0300, 'T',  0.97,   2, 15,   'ACTIVE', 'SYSTEM'),
(17, 'CR-SHEET-1MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0150, 'L',  1.00,   2, 15,   'ACTIVE', 'SYSTEM'),
(18, 'CR-SHEET-1MM', 'V1', 'IM-CR-STRIP',  'Cold Rolled Strip',        1.0800, 'T',  0.94,   3, 16,   'ACTIVE', 'SYSTEM'),
(19, 'CR-SHEET-1MM', 'V1', 'IM-PICKLED',   'Pickled HR Strip',         1.1200, 'T',  0.96,   4, 18,   'ACTIVE', 'SYSTEM'),
(20, 'CR-SHEET-1MM', 'V1', 'RM-ROLL-LUB',  'CR Rolling Lubricant',     0.0200, 'L',  1.00,   4, 18,   'ACTIVE', 'SYSTEM'),
(21, 'CR-SHEET-1MM', 'V1', 'IM-HR-ROUGH',  'HR Coil Base',             1.1500, 'T',  0.93,   5, 19,   'ACTIVE', 'SYSTEM'),
(22, 'CR-SHEET-1MM', 'V1', 'RM-HCL',       'Hydrochloric Acid',        0.0500, 'L',  1.00,   5, 19,   'ACTIVE', 'SYSTEM'),
(23, 'CR-SHEET-1MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7500, 'T',  0.95,   6, 21,   'ACTIVE', 'SYSTEM'),
(24, 'CR-SHEET-1MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.2000, 'T',  0.97,   6, 21,   'ACTIVE', 'SYSTEM'),
(25, 'CR-SHEET-1MM', 'V1', 'RM-FESI',      'Ferroalloy FeSi',          0.0050, 'KG', 1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
(26, 'CR-SHEET-1MM', 'V1', 'RM-LIMESTONE', 'Limestone',                0.0600, 'T',  1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
(27, 'CR-SHEET-1MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.0800, 'T',  1.00,   6, 21,   'ACTIVE', 'SYSTEM'),
(28, 'CR-SHEET-1MM', 'V1', 'RM-AL-WIRE',   'Aluminum Wire',            0.0030, 'KG', 1.00,   6, 21,   'ACTIVE', 'SYSTEM'),

-- BOM 3: REBAR-10MM — 5-level tree
(29, 'REBAR-10MM', 'V1', 'FG-REBAR-10',    'Finished Rebar 10mm',      1.0000, 'T',  0.99,   1, NULL, 'ACTIVE', 'SYSTEM'),
(30, 'REBAR-10MM', 'V1', 'IM-ROLLED-BAR',  'Rolled Bar',               1.0400, 'T',  0.96,   2, 29,   'ACTIVE', 'SYSTEM'),
(31, 'REBAR-10MM', 'V1', 'IM-BILLET',      'Steel Billet 100mm',       1.1000, 'T',  0.93,   3, 30,   'ACTIVE', 'SYSTEM'),
(32, 'REBAR-10MM', 'V1', 'RM-ROLL-LUB',    'Bar Rolling Lubricant',    0.0050, 'L',  1.00,   3, 30,   'ACTIVE', 'SYSTEM'),
(33, 'REBAR-10MM', 'V1', 'IM-LIQUID',      'Liquid Steel',             1.1500, 'T',  0.90,   4, 31,   'ACTIVE', 'SYSTEM'),
(34, 'REBAR-10MM', 'V1', 'RM-LIMESTONE',   'Limestone',                0.0400, 'T',  1.00,   4, 31,   'ACTIVE', 'SYSTEM'),
(35, 'REBAR-10MM', 'V1', 'RM-SCRAP-A',     'Steel Scrap Grade A',      0.8000, 'T',  0.94,   5, 33,   'ACTIVE', 'SYSTEM'),
(36, 'REBAR-10MM', 'V1', 'RM-SCRAP-B',     'Steel Scrap Grade B',      0.1800, 'T',  0.92,   5, 33,   'ACTIVE', 'SYSTEM'),
(37, 'REBAR-10MM', 'V1', 'RM-FEMN',        'Ferroalloy FeMn',          0.0080, 'KG', 1.00,   5, 33,   'ACTIVE', 'SYSTEM'),
(38, 'REBAR-10MM', 'V1', 'RM-COAL',        'Coal / Coke',              0.0900, 'T',  1.00,   5, 33,   'ACTIVE', 'SYSTEM'),

-- BOM 4: HR-COIL-3MM — 5-level tree (similar to HR-COIL-2MM)
(39, 'HR-COIL-3MM', 'V1', 'FG-HR-2MM',    'Finished HR Coil 3mm',     1.0000, 'T',  0.98,   1, NULL, 'ACTIVE', 'SYSTEM'),
(40, 'HR-COIL-3MM', 'V1', 'IM-HR-ROUGH',  'Hot Rolled Strip',         1.0600, 'T',  0.94,   2, 39,   'ACTIVE', 'SYSTEM'),
(41, 'HR-COIL-3MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0180, 'L',  1.00,   2, 39,   'ACTIVE', 'SYSTEM'),
(42, 'HR-COIL-3MM', 'V1', 'IM-SLAB',      'Steel Slab 200mm',         1.1400, 'T',  0.92,   3, 40,   'ACTIVE', 'SYSTEM'),
(43, 'HR-COIL-3MM', 'V1', 'RM-ROLL-LUB',  'Rolling Lubricant',        0.0120, 'L',  1.00,   3, 40,   'ACTIVE', 'SYSTEM'),
(44, 'HR-COIL-3MM', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.2000, 'T',  0.87,   4, 42,   'ACTIVE', 'SYSTEM'),
(45, 'HR-COIL-3MM', 'V1', 'RM-MOLD-PWD',  'Mold Powder',              0.0055, 'KG', 1.00,   4, 42,   'ACTIVE', 'SYSTEM'),
(46, 'HR-COIL-3MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7200, 'T',  0.95,   5, 44,   'ACTIVE', 'SYSTEM'),
(47, 'HR-COIL-3MM', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.1800, 'T',  0.92,   5, 44,   'ACTIVE', 'SYSTEM'),
(48, 'HR-COIL-3MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1600, 'T',  0.97,   5, 44,   'ACTIVE', 'SYSTEM'),
(49, 'HR-COIL-3MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.1100, 'T',  1.00,   5, 44,   'ACTIVE', 'SYSTEM'),

-- BOM 5: HR-COIL-4MM — 5-level tree (similar to HR-COIL-2MM)
(50, 'HR-COIL-4MM', 'V1', 'FG-HR-2MM',    'Finished HR Coil 4mm',     1.0000, 'T',  0.98,   1, NULL, 'ACTIVE', 'SYSTEM'),
(51, 'HR-COIL-4MM', 'V1', 'IM-HR-ROUGH',  'Hot Rolled Strip',         1.0700, 'T',  0.93,   2, 50,   'ACTIVE', 'SYSTEM'),
(52, 'HR-COIL-4MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0160, 'L',  1.00,   2, 50,   'ACTIVE', 'SYSTEM'),
(53, 'HR-COIL-4MM', 'V1', 'IM-SLAB',      'Steel Slab 200mm',         1.1600, 'T',  0.91,   3, 51,   'ACTIVE', 'SYSTEM'),
(54, 'HR-COIL-4MM', 'V1', 'RM-ROLL-LUB',  'Rolling Lubricant',        0.0140, 'L',  1.00,   3, 51,   'ACTIVE', 'SYSTEM'),
(55, 'HR-COIL-4MM', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.2200, 'T',  0.86,   4, 53,   'ACTIVE', 'SYSTEM'),
(56, 'HR-COIL-4MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7500, 'T',  0.94,   5, 55,   'ACTIVE', 'SYSTEM'),
(57, 'HR-COIL-4MM', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.1500, 'T',  0.92,   5, 55,   'ACTIVE', 'SYSTEM'),
(58, 'HR-COIL-4MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1700, 'T',  0.97,   5, 55,   'ACTIVE', 'SYSTEM'),
(59, 'HR-COIL-4MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.1200, 'T',  1.00,   5, 55,   'ACTIVE', 'SYSTEM'),

-- BOM 6: CR-SHEET-2MM — 6-level tree (similar to CR-SHEET-1MM)
(60, 'CR-SHEET-2MM', 'V1', 'FG-CR-1MM',    'Finished CR Sheet 2mm',    1.0000, 'T',  0.97,   1, NULL, 'ACTIVE', 'SYSTEM'),
(61, 'CR-SHEET-2MM', 'V1', 'IM-ANNEALED',  'Annealed CR Strip',        1.0400, 'T',  0.96,   2, 60,   'ACTIVE', 'SYSTEM'),
(62, 'CR-SHEET-2MM', 'V1', 'RM-COATING',   'Surface Coating Oil',      0.0140, 'L',  1.00,   2, 60,   'ACTIVE', 'SYSTEM'),
(63, 'CR-SHEET-2MM', 'V1', 'IM-CR-STRIP',  'Cold Rolled Strip',        1.0900, 'T',  0.93,   3, 61,   'ACTIVE', 'SYSTEM'),
(64, 'CR-SHEET-2MM', 'V1', 'IM-PICKLED',   'Pickled HR Strip',         1.1300, 'T',  0.95,   4, 63,   'ACTIVE', 'SYSTEM'),
(65, 'CR-SHEET-2MM', 'V1', 'RM-ROLL-LUB',  'CR Rolling Lubricant',     0.0180, 'L',  1.00,   4, 63,   'ACTIVE', 'SYSTEM'),
(66, 'CR-SHEET-2MM', 'V1', 'IM-HR-ROUGH',  'HR Coil Base',             1.1600, 'T',  0.92,   5, 64,   'ACTIVE', 'SYSTEM'),
(67, 'CR-SHEET-2MM', 'V1', 'RM-HCL',       'Hydrochloric Acid',        0.0450, 'L',  1.00,   5, 64,   'ACTIVE', 'SYSTEM'),
(68, 'CR-SHEET-2MM', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7800, 'T',  0.95,   6, 66,   'ACTIVE', 'SYSTEM'),
(69, 'CR-SHEET-2MM', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1800, 'T',  0.97,   6, 66,   'ACTIVE', 'SYSTEM'),
(70, 'CR-SHEET-2MM', 'V1', 'RM-COAL',      'Coal / Coke',              0.0900, 'T',  1.00,   6, 66,   'ACTIVE', 'SYSTEM'),

-- BOM 7: REBAR-12MM — 5-level tree (similar to REBAR-10MM)
(71, 'REBAR-12MM', 'V1', 'FG-REBAR-10',    'Finished Rebar 12mm',      1.0000, 'T',  0.99,   1, NULL, 'ACTIVE', 'SYSTEM'),
(72, 'REBAR-12MM', 'V1', 'IM-ROLLED-BAR',  'Rolled Bar',               1.0500, 'T',  0.95,   2, 71,   'ACTIVE', 'SYSTEM'),
(73, 'REBAR-12MM', 'V1', 'IM-BILLET',      'Steel Billet 100mm',       1.1100, 'T',  0.92,   3, 72,   'ACTIVE', 'SYSTEM'),
(74, 'REBAR-12MM', 'V1', 'RM-ROLL-LUB',    'Bar Rolling Lubricant',    0.0060, 'L',  1.00,   3, 72,   'ACTIVE', 'SYSTEM'),
(75, 'REBAR-12MM', 'V1', 'IM-LIQUID',      'Liquid Steel',             1.1600, 'T',  0.89,   4, 73,   'ACTIVE', 'SYSTEM'),
(76, 'REBAR-12MM', 'V1', 'RM-LIMESTONE',   'Limestone',                0.0450, 'T',  1.00,   4, 73,   'ACTIVE', 'SYSTEM'),
(77, 'REBAR-12MM', 'V1', 'RM-SCRAP-A',     'Steel Scrap Grade A',      0.8200, 'T',  0.94,   5, 75,   'ACTIVE', 'SYSTEM'),
(78, 'REBAR-12MM', 'V1', 'RM-SCRAP-B',     'Steel Scrap Grade B',      0.1600, 'T',  0.92,   5, 75,   'ACTIVE', 'SYSTEM'),
(79, 'REBAR-12MM', 'V1', 'RM-FEMN',        'Ferroalloy FeMn',          0.0090, 'KG', 1.00,   5, 75,   'ACTIVE', 'SYSTEM'),
(80, 'REBAR-12MM', 'V1', 'RM-COAL',        'Coal / Coke',              0.0950, 'T',  1.00,   5, 75,   'ACTIVE', 'SYSTEM'),

-- BOM 8: STEEL-BILLET-100 — 3-level tree (simpler semi-finished product)
(81, 'STEEL-BILLET-100', 'V1', 'IM-BILLET',    'Steel Billet 100mm',       1.0000, 'T',  0.98,   1, NULL, 'ACTIVE', 'SYSTEM'),
(82, 'STEEL-BILLET-100', 'V1', 'IM-LIQUID',    'Liquid Steel',             1.0800, 'T',  0.92,   2, 81,   'ACTIVE', 'SYSTEM'),
(83, 'STEEL-BILLET-100', 'V1', 'RM-MOLD-PWD',  'Mold Powder',              0.0040, 'KG', 1.00,   2, 81,   'ACTIVE', 'SYSTEM'),
(84, 'STEEL-BILLET-100', 'V1', 'RM-SCRAP-A',   'Steel Scrap Grade A',      0.7000, 'T',  0.95,   3, 82,   'ACTIVE', 'SYSTEM'),
(85, 'STEEL-BILLET-100', 'V1', 'RM-SCRAP-B',   'Steel Scrap Grade B',      0.2500, 'T',  0.93,   3, 82,   'ACTIVE', 'SYSTEM'),
(86, 'STEEL-BILLET-100', 'V1', 'RM-IRON-ORE',  'Iron Ore Pellets',         0.1200, 'T',  0.97,   3, 82,   'ACTIVE', 'SYSTEM'),
(87, 'STEEL-BILLET-100', 'V1', 'RM-LIMESTONE', 'Limestone',                0.0500, 'T',  1.00,   3, 82,   'ACTIVE', 'SYSTEM'),
(88, 'STEEL-BILLET-100', 'V1', 'RM-COAL',      'Coal / Coke',              0.0800, 'T',  1.00,   3, 82,   'ACTIVE', 'SYSTEM');
ALTER TABLE bill_of_material ALTER COLUMN bom_id RESTART WITH 89;

-- =====================================================
-- STEP 13: Process Parameters Config
-- =====================================================
INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status) VALUES
-- HR-COIL-2MM
('FURNACE', 'HR-COIL-2MM', 'Temperature',        'DECIMAL', '°C',   1500, 1800, 1650, TRUE,  1, 'ACTIVE'),
('FURNACE', 'HR-COIL-2MM', 'Holding Time',       'DECIMAL', 'min',    30,  180,   90, TRUE,  2, 'ACTIVE'),
('FURNACE', 'HR-COIL-2MM', 'Power Input',        'DECIMAL', 'MW',     20,   80,   50, FALSE, 3, 'ACTIVE'),
('CASTER',  'HR-COIL-2MM', 'Casting Speed',      'DECIMAL', 'm/min', 0.8,  2.5,  1.5, TRUE,  1, 'ACTIVE'),
('CASTER',  'HR-COIL-2MM', 'Mold Temperature',   'DECIMAL', '°C',   200,  400,  300, TRUE,  2, 'ACTIVE'),
('CASTER',  'HR-COIL-2MM', 'Slab Width',         'DECIMAL', 'mm',  1000, 1600, 1250, TRUE,  3, 'ACTIVE'),
('ROLLING', 'HR-COIL-2MM', 'Entry Temperature',  'DECIMAL', '°C',  1100, 1280, 1200, TRUE,  1, 'ACTIVE'),
('ROLLING', 'HR-COIL-2MM', 'Finish Temperature', 'DECIMAL', '°C',   850, 950,   900, TRUE,  2, 'ACTIVE'),
('ROLLING', 'HR-COIL-2MM', 'Coiling Temperature','DECIMAL', '°C',   550, 700,   620, TRUE,  3, 'ACTIVE'),
('ROLLING', 'HR-COIL-2MM', 'Thickness',          'DECIMAL', 'mm',   1.5, 3.0,   2.0, TRUE,  4, 'ACTIVE'),
('ROLLING', 'HR-COIL-2MM', 'Speed',              'DECIMAL', 'm/s',    5,  15,    10, TRUE,  5, 'ACTIVE'),
-- CR-SHEET-1MM
('FURNACE', 'CR-SHEET-1MM', 'Temperature',       'DECIMAL', '°C',  1500, 1750, 1620, TRUE,  1, 'ACTIVE'),
('FURNACE', 'CR-SHEET-1MM', 'Holding Time',      'DECIMAL', 'min',   30,  150,   80, TRUE,  2, 'ACTIVE'),
('CASTER',  'CR-SHEET-1MM', 'Casting Speed',     'DECIMAL', 'm/min', 0.8, 2.0, 1.4, TRUE,  1, 'ACTIVE'),
('CASTER',  'CR-SHEET-1MM', 'Mold Temperature',  'DECIMAL', '°C',  200, 380, 280,   TRUE,  2, 'ACTIVE'),
('ROLLING', 'CR-SHEET-1MM', 'Entry Temperature', 'DECIMAL', '°C',  1100, 1250, 1180, TRUE,  1, 'ACTIVE'),
('ROLLING', 'CR-SHEET-1MM', 'Thickness',         'DECIMAL', 'mm',  0.5,  2.0,  1.0, TRUE,  2, 'ACTIVE'),
('ROLLING', 'CR-SHEET-1MM', 'Reduction Ratio',   'DECIMAL', '%',    40,   80,   60, TRUE,  3, 'ACTIVE'),
('PICKLING','CR-SHEET-1MM', 'Acid Concentration','DECIMAL', '%',    12,   22,   18, TRUE,  1, 'ACTIVE'),
('PICKLING','CR-SHEET-1MM', 'Line Speed',        'DECIMAL', 'm/min',  5,  30,   15, TRUE,  2, 'ACTIVE'),
-- REBAR-10MM
('FURNACE', 'REBAR-10MM', 'Temperature',         'DECIMAL', '°C',  1550, 1800, 1680, TRUE,  1, 'ACTIVE'),
('FURNACE', 'REBAR-10MM', 'Holding Time',        'DECIMAL', 'min',   30,  120,   75, TRUE,  2, 'ACTIVE'),
('CASTER',  'REBAR-10MM', 'Casting Speed',       'DECIMAL', 'm/min', 2.0, 5.0, 3.5, TRUE,  1, 'ACTIVE'),
('CASTER',  'REBAR-10MM', 'Billet Size',         'DECIMAL', 'mm',   100,  150,  130, TRUE,  2, 'ACTIVE'),
('ROLLING', 'REBAR-10MM', 'Entry Temperature',   'DECIMAL', '°C',  1050, 1200, 1100, TRUE,  1, 'ACTIVE'),
('ROLLING', 'REBAR-10MM', 'Finish Temperature',  'DECIMAL', '°C',   900, 1050,  980, TRUE,  2, 'ACTIVE'),
('ROLLING', 'REBAR-10MM', 'Bar Diameter',        'DECIMAL', 'mm',     8,   32,   10, TRUE,  3, 'ACTIVE'),
('COOLING', 'REBAR-10MM', 'Quench Temperature',  'DECIMAL', '°C',   200,  500,  350, TRUE,  1, 'ACTIVE'),
('COOLING', 'REBAR-10MM', 'Tempering Temperature','DECIMAL','°C',   400,  650,  550, TRUE,  2, 'ACTIVE');

-- =====================================================
-- PART 2: Runtime Data (Orders, Operations, Batches, etc.)
-- =====================================================

-- =====================================================
-- STEP 14: Orders (15 orders with all statuses)
-- =====================================================
INSERT INTO orders (order_id, order_number, customer_id, customer_name, order_date, priority, status, created_by) VALUES
(1,  'ORD-2026-001', 'CUST-001', 'ABC Steel Corporation',      '2026-01-10', 1, 'IN_PROGRESS', 'SYSTEM'),
(2,  'ORD-2026-002', 'CUST-002', 'Global Manufacturing Ltd',   '2026-01-12', 2, 'IN_PROGRESS', 'SYSTEM'),
(3,  'ORD-2026-003', 'CUST-006', 'BuildRight Construction',    '2026-01-15', 3, 'IN_PROGRESS', 'SYSTEM'),
(4,  'ORD-2026-004', 'CUST-003', 'Pacific Metal Works',        '2026-01-18', 3, 'CREATED',     'SYSTEM'),
(5,  'ORD-2026-005', 'CUST-004', 'European Auto Parts GmbH',   '2026-01-20', 2, 'COMPLETED',   'SYSTEM'),
(6,  'ORD-2026-006', 'CUST-007', 'Nordic Steel Trading AB',    '2026-01-22', 3, 'CREATED',     'SYSTEM'),
(7,  'ORD-2026-007', 'CUST-008', 'Middle East Metals FZE',     '2026-01-25', 3, 'CREATED',     'SYSTEM'),
(8,  'ORD-2026-008', 'CUST-005', 'Asian Electronics Inc',      '2026-01-28', 1, 'ON_HOLD',     'SYSTEM'),
(9,  'ORD-2026-009', 'CUST-009', 'South American Steel SA',    '2026-01-30', 3, 'CREATED',     'SYSTEM'),
(10, 'ORD-2026-010', 'CUST-010', 'African Mining Corp',        '2026-01-31', 3, 'CREATED',     'SYSTEM'),
(11, 'ORD-2026-011', 'CUST-011', 'Oceanic Metals Ltd',         '2026-02-01', 2, 'IN_PROGRESS', 'SYSTEM'),
(12, 'ORD-2026-012', 'CUST-001', 'ABC Steel Corporation',      '2026-02-02', 1, 'COMPLETED',   'SYSTEM'),
(13, 'ORD-2026-013', 'CUST-002', 'Global Manufacturing Ltd',   '2026-02-03', 2, 'COMPLETED',   'SYSTEM'),
(14, 'ORD-2026-014', 'CUST-003', 'Pacific Metal Works',        '2026-02-04', 3, 'CANCELLED',   'SYSTEM'),
(15, 'ORD-2026-015', 'CUST-007', 'Nordic Steel Trading AB',    '2026-02-05', 1, 'BLOCKED',     'SYSTEM');
ALTER TABLE orders ALTER COLUMN order_id RESTART WITH 16;

-- Audit trail for orders
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('ORDER', 1,  'CREATE', 'Created order ORD-2026-001 for ABC Steel - HR-COIL-2MM 150T',     'admin', '2026-01-10 08:00:00'),
('ORDER', 2,  'CREATE', 'Created order ORD-2026-002 for Global Manuf - CR-SHEET-1MM 80T',  'admin', '2026-01-12 08:00:00'),
('ORDER', 3,  'CREATE', 'Created order ORD-2026-003 for BuildRight - REBAR-10MM 200T',     'admin', '2026-01-15 08:00:00'),
('ORDER', 4,  'CREATE', 'Created order ORD-2026-004 for Pacific Metal - Multi-product',   'admin', '2026-01-18 08:00:00'),
('ORDER', 5,  'CREATE', 'Created order ORD-2026-005 for European Auto - HR-COIL-2MM 75T', 'admin', '2026-01-20 08:00:00'),
('ORDER', 6,  'CREATE', 'Created order ORD-2026-006 for Nordic Steel - REBAR-10MM 300T',  'admin', '2026-01-22 08:00:00'),
('ORDER', 7,  'CREATE', 'Created order ORD-2026-007 for Middle East - CR-SHEET-1MM 120T', 'admin', '2026-01-25 08:00:00'),
('ORDER', 8,  'CREATE', 'Created order ORD-2026-008 for Asian Elec - HR-COIL-2MM 60T',    'admin', '2026-01-28 08:00:00'),
('ORDER', 9,  'CREATE', 'Created order ORD-2026-009 for South American - HR-COIL-3MM',    'admin', '2026-01-30 08:00:00'),
('ORDER', 10, 'CREATE', 'Created order ORD-2026-010 for African Mining - BILLET 400T',    'admin', '2026-01-31 08:00:00'),
('ORDER', 11, 'CREATE', 'Created order ORD-2026-011 for Oceanic Metals - CR-SHEET-2MM',   'admin', '2026-02-01 08:00:00'),
('ORDER', 12, 'CREATE', 'Created order ORD-2026-012 for ABC Steel - REBAR-12MM 180T',     'admin', '2026-02-02 08:00:00'),
('ORDER', 13, 'CREATE', 'Created order ORD-2026-013 for Global Manuf - HR-COIL-4MM',      'admin', '2026-02-03 08:00:00'),
('ORDER', 14, 'CREATE', 'Created order ORD-2026-014 for Pacific Metal - CR-SHEET-1MM',    'admin', '2026-02-04 08:00:00'),
('ORDER', 15, 'CREATE', 'Created order ORD-2026-015 for Nordic Steel - BILLET 250T',      'admin', '2026-02-05 08:00:00'),
('ORDER', 1,  'STATUS_CHANGE', 'CREATED -> IN_PROGRESS',  'admin', '2026-01-15 05:45:00'),
('ORDER', 2,  'STATUS_CHANGE', 'CREATED -> IN_PROGRESS',  'admin', '2026-01-18 06:00:00'),
('ORDER', 3,  'STATUS_CHANGE', 'CREATED -> IN_PROGRESS',  'admin', '2026-01-20 06:00:00'),
('ORDER', 5,  'STATUS_CHANGE', 'IN_PROGRESS -> COMPLETED','admin', '2026-01-25 16:00:00'),
('ORDER', 8,  'STATUS_CHANGE', 'CREATED -> ON_HOLD',      'admin', '2026-01-29 08:00:00'),
('ORDER', 11, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS',  'admin', '2026-02-03 06:00:00'),
('ORDER', 12, 'STATUS_CHANGE', 'IN_PROGRESS -> COMPLETED','admin', '2026-02-06 16:00:00'),
('ORDER', 13, 'STATUS_CHANGE', 'IN_PROGRESS -> COMPLETED','admin', '2026-02-07 16:00:00'),
('ORDER', 14, 'STATUS_CHANGE', 'CREATED -> CANCELLED',    'admin', '2026-02-05 10:00:00'),
('ORDER', 15, 'STATUS_CHANGE', 'CREATED -> BLOCKED',      'admin', '2026-02-06 09:00:00');

-- =====================================================
-- STEP 15: Order Line Items (25 line items)
-- =====================================================
INSERT INTO order_line_items (order_line_id, order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by) VALUES
-- Order 1: HR Coil
(1,  1, 'HR-COIL-2MM',  'Hot Rolled Coil 2mm',       150, 'T', '2026-02-15', 'IN_PROGRESS', 'SYSTEM'),
-- Order 2: CR Sheet
(2,  2, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm',      80, 'T', '2026-03-05', 'IN_PROGRESS', 'SYSTEM'),
-- Order 3: Rebar
(3,  3, 'REBAR-10MM',   'Reinforcement Bar 10mm',    200, 'T', '2026-02-20', 'IN_PROGRESS', 'SYSTEM'),
-- Order 4: Multi-line (HR + CR + Rebar)
(4,  4, 'HR-COIL-2MM',  'Hot Rolled Coil 2mm',       100, 'T', '2026-03-10', 'CREATED', 'SYSTEM'),
(5,  4, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm',      50, 'T', '2026-03-15', 'CREATED', 'SYSTEM'),
(6,  4, 'REBAR-10MM',   'Reinforcement Bar 10mm',     80, 'T', '2026-03-10', 'CREATED', 'SYSTEM'),
-- Order 5: Completed
(7,  5, 'HR-COIL-2MM',  'Hot Rolled Coil 2mm',        75, 'T', '2026-02-10', 'COMPLETED', 'SYSTEM'),
-- Order 6: Rebar large
(8,  6, 'REBAR-10MM',   'Reinforcement Bar 10mm',    300, 'T', '2026-03-01', 'CREATED', 'SYSTEM'),
-- Order 7: CR Sheet
(9,  7, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm',     120, 'T', '2026-03-20', 'CREATED', 'SYSTEM'),
-- Order 8: On hold
(10, 8, 'HR-COIL-2MM',  'Hot Rolled Coil 2mm',        60, 'T', '2026-03-25', 'ON_HOLD', 'SYSTEM'),
-- Order 9: HR Coil 3mm
(11, 9, 'HR-COIL-3MM',  'Hot Rolled Coil 3mm',       250, 'T', '2026-03-15', 'CREATED', 'SYSTEM'),
-- Order 10: Billet
(12, 10,'STEEL-BILLET-100','Steel Billet 100mm',     400, 'T', '2026-03-10', 'CREATED', 'SYSTEM'),
-- Order 11: CR Sheet 2mm
(13, 11,'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm',     180, 'T', '2026-03-20', 'IN_PROGRESS', 'SYSTEM'),
-- Order 12: Completed Rebar
(14, 12,'REBAR-12MM',   'Reinforcement Bar 12mm',    180, 'T', '2026-02-28', 'COMPLETED', 'SYSTEM'),
-- Order 13: Completed HR Coil
(15, 13,'HR-COIL-4MM',  'Hot Rolled Coil 4mm',       120, 'T', '2026-02-25', 'COMPLETED', 'SYSTEM'),
-- Order 14: Cancelled
(16, 14,'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm',      90, 'T', '2026-03-30', 'CANCELLED', 'SYSTEM'),
-- Order 15: Blocked
(17, 15,'STEEL-BILLET-100','Steel Billet 100mm',     250, 'T', '2026-03-25', 'BLOCKED', 'SYSTEM'),
-- Additional line items for variety
(18, 1, 'HR-COIL-3MM',  'Hot Rolled Coil 3mm',        50, 'T', '2026-02-20', 'CREATED', 'SYSTEM'),
(19, 2, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm',      40, 'T', '2026-03-10', 'CREATED', 'SYSTEM'),
(20, 3, 'REBAR-12MM',   'Reinforcement Bar 12mm',    100, 'T', '2026-02-25', 'CREATED', 'SYSTEM'),
(21, 6, 'REBAR-12MM',   'Reinforcement Bar 12mm',    150, 'T', '2026-03-05', 'CREATED', 'SYSTEM'),
(22, 9, 'HR-COIL-4MM',  'Hot Rolled Coil 4mm',       100, 'T', '2026-03-20', 'CREATED', 'SYSTEM'),
(23, 10,'REBAR-10MM',   'Reinforcement Bar 10mm',    200, 'T', '2026-03-15', 'CREATED', 'SYSTEM'),
(24, 11,'HR-COIL-2MM',  'Hot Rolled Coil 2mm',        80, 'T', '2026-03-15', 'IN_PROGRESS', 'SYSTEM'),
(25, 13,'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm',      60, 'T', '2026-02-28', 'COMPLETED', 'SYSTEM');
ALTER TABLE order_line_items ALTER COLUMN order_line_id RESTART WITH 26;

-- =====================================================
-- STEP 16: Operations (Runtime - 60 operations with all statuses)
-- =====================================================
-- Operations for Order 1, Line Item 1 (HR Coil 2mm - IN_PROGRESS)
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by) VALUES
(1,  1, 1, 1,  'Scrap Charging',        'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED',   150, 'SYSTEM'),
(2,  1, 1, 2,  'EAF Melting',           'MELT-EAF',  'FURNACE', 2, 'CONFIRMED',   150, 'SYSTEM'),
(3,  1, 1, 3,  'Ladle Refining',        'MELT-LF',   'FURNACE', 3, 'CONFIRMED',   150, 'SYSTEM'),
(4,  1, 1, 4,  'Slab Casting',          'CAST-SLAB', 'CASTER',  4, 'CONFIRMED',   150, 'SYSTEM'),
(5,  1, 1, 6,  'Slab Reheating',        'ROLL-RHT',  'FURNACE', 5, 'CONFIRMED',   150, 'SYSTEM'),
(6,  1, 1, 7,  'Rough Rolling',         'ROLL-RGH',  'ROLLING', 6, 'READY',       150, 'SYSTEM'),
(7,  1, 1, 8,  'Finish Rolling',        'ROLL-FIN',  'ROLLING', 7, 'NOT_STARTED', 150, 'SYSTEM'),
(8,  1, 1, 9,  'Cooling & Coiling',     'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 150, 'SYSTEM'),

-- Operations for Order 2, Line Item 2 (CR Sheet 1mm - IN_PROGRESS)
(9,  2, 2, 10, 'Pickling',              'PKL',       'PICKLING',1, 'READY',       80, 'SYSTEM'),
(10, 2, 2, 11, 'Cold Rolling',          'CRM',       'ROLLING', 2, 'NOT_STARTED', 80, 'SYSTEM'),
(11, 2, 2, 12, 'Batch Annealing',       'ANN',       'HEAT_TREATMENT',3, 'NOT_STARTED', 80, 'SYSTEM'),

-- Operations for Order 3, Line Item 3 (Rebar 10mm - IN_PROGRESS)
(12, 3, 3, 1,  'Scrap Charging',        'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED',   200, 'SYSTEM'),
(13, 3, 3, 2,  'EAF Melting',           'MELT-EAF',  'FURNACE', 2, 'CONFIRMED',   200, 'SYSTEM'),
(14, 3, 3, 3,  'Ladle Refining',        'MELT-LF',   'FURNACE', 3, 'CONFIRMED',   200, 'SYSTEM'),
(15, 3, 3, 5,  'Billet Casting',        'CAST-BILL', 'CASTER',  4, 'CONFIRMED',   200, 'SYSTEM'),
(16, 3, 3, 13, 'Billet Reheating',      'BAR-RHT',   'FURNACE', 5, 'READY',       200, 'SYSTEM'),
(17, 3, 3, 14, 'Bar Rolling',           'BAR-ROLL',  'ROLLING', 6, 'NOT_STARTED', 200, 'SYSTEM'),
(18, 3, 3, 15, 'Quenching & Tempering', 'BAR-QT',    'HEAT_TREATMENT',7, 'NOT_STARTED', 200, 'SYSTEM'),

-- Operations for Order 5, Line Item 7 (COMPLETED - all CONFIRMED)
(19, 1, 7, 1,  'Scrap Charging',        'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED',   75, 'SYSTEM'),
(20, 1, 7, 2,  'EAF Melting',           'MELT-EAF',  'FURNACE', 2, 'CONFIRMED',   75, 'SYSTEM'),
(21, 1, 7, 3,  'Ladle Refining',        'MELT-LF',   'FURNACE', 3, 'CONFIRMED',   75, 'SYSTEM'),
(22, 1, 7, 4,  'Slab Casting',          'CAST-SLAB', 'CASTER',  4, 'CONFIRMED',   75, 'SYSTEM'),
(23, 1, 7, 6,  'Slab Reheating',        'ROLL-RHT',  'FURNACE', 5, 'CONFIRMED',   75, 'SYSTEM'),
(24, 1, 7, 7,  'Rough Rolling',         'ROLL-RGH',  'ROLLING', 6, 'CONFIRMED',   75, 'SYSTEM'),
(25, 1, 7, 8,  'Finish Rolling',        'ROLL-FIN',  'ROLLING', 7, 'CONFIRMED',   75, 'SYSTEM'),
(26, 1, 7, 9,  'Cooling & Coiling',     'ROLL-COOL', 'COOLING', 8, 'CONFIRMED',   75, 'SYSTEM'),

-- Operations for Order 8, Line Item 10 (ON_HOLD)
(27, 1, 10, 1, 'Scrap Charging',        'MELT-CHRG', 'FURNACE', 1, 'ON_HOLD',     60, 'SYSTEM'),
(28, 1, 10, 2, 'EAF Melting',           'MELT-EAF',  'FURNACE', 2, 'NOT_STARTED', 60, 'SYSTEM'),

-- Operations for Order 11, Line Item 13 (IN_PROGRESS)
(29, 2, 13, 10,'Pickling',              'PKL',       'PICKLING',1, 'IN_PROGRESS', 180, 'SYSTEM'),
(30, 2, 13, 11,'Cold Rolling',          'CRM',       'ROLLING', 2, 'NOT_STARTED', 180, 'SYSTEM'),
(31, 2, 13, 12,'Batch Annealing',       'ANN',       'HEAT_TREATMENT',3, 'NOT_STARTED', 180, 'SYSTEM'),

-- Operations for Order 12, Line Item 14 (COMPLETED - Rebar 12mm)
(32, 3, 14, 1,  'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED',   180, 'SYSTEM'),
(33, 3, 14, 2,  'EAF Melting',          'MELT-EAF',  'FURNACE', 2, 'CONFIRMED',   180, 'SYSTEM'),
(34, 3, 14, 3,  'Ladle Refining',       'MELT-LF',   'FURNACE', 3, 'CONFIRMED',   180, 'SYSTEM'),
(35, 3, 14, 5,  'Billet Casting',       'CAST-BILL', 'CASTER',  4, 'CONFIRMED',   180, 'SYSTEM'),
(36, 3, 14, 13, 'Billet Reheating',     'BAR-RHT',   'FURNACE', 5, 'CONFIRMED',   180, 'SYSTEM'),
(37, 3, 14, 14, 'Bar Rolling',          'BAR-ROLL',  'ROLLING', 6, 'CONFIRMED',   180, 'SYSTEM'),
(38, 3, 14, 15, 'Quenching & Tempering','BAR-QT',    'HEAT_TREATMENT',7, 'CONFIRMED',   180, 'SYSTEM'),

-- Operations for Order 13, Line Item 15 (COMPLETED - HR Coil 4mm)
(39, 1, 15, 1,  'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED',   120, 'SYSTEM'),
(40, 1, 15, 2,  'EAF Melting',          'MELT-EAF',  'FURNACE', 2, 'CONFIRMED',   120, 'SYSTEM'),
(41, 1, 15, 3,  'Ladle Refining',       'MELT-LF',   'FURNACE', 3, 'CONFIRMED',   120, 'SYSTEM'),
(42, 1, 15, 4,  'Slab Casting',         'CAST-SLAB', 'CASTER',  4, 'CONFIRMED',   120, 'SYSTEM'),
(43, 1, 15, 6,  'Slab Reheating',       'ROLL-RHT',  'FURNACE', 5, 'CONFIRMED',   120, 'SYSTEM'),
(44, 1, 15, 7,  'Rough Rolling',        'ROLL-RGH',  'ROLLING', 6, 'CONFIRMED',   120, 'SYSTEM'),
(45, 1, 15, 8,  'Finish Rolling',       'ROLL-FIN',  'ROLLING', 7, 'CONFIRMED',   120, 'SYSTEM'),
(46, 1, 15, 9,  'Cooling & Coiling',    'ROLL-COOL', 'COOLING', 8, 'CONFIRMED',   120, 'SYSTEM'),

-- Additional operations with BLOCKED status
(47, 4, 12, 1,  'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'BLOCKED',     400, 'SYSTEM'),
(48, 4, 12, 2,  'EAF Melting',          'MELT-EAF',  'FURNACE', 2, 'NOT_STARTED', 400, 'SYSTEM'),

-- Operations for Order 11, Line Item 24 (IN_PROGRESS - HR Coil 2mm)
(49, 1, 24, 1,  'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED',   80, 'SYSTEM'),
(50, 1, 24, 2,  'EAF Melting',          'MELT-EAF',  'FURNACE', 2, 'READY',       80, 'SYSTEM'),
(51, 1, 24, 3,  'Ladle Refining',       'MELT-LF',   'FURNACE', 3, 'NOT_STARTED', 80, 'SYSTEM'),

-- Additional READY operations for production confirmation demo
(52, 1, 4, 1,   'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'READY',       100, 'SYSTEM'),
(53, 3, 8, 1,   'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'READY',       300, 'SYSTEM'),
(54, 2, 9, 10,  'Pickling',             'PKL',       'PICKLING',1, 'READY',       120, 'SYSTEM'),

-- Operations with PARTIALLY_CONFIRMED status
(55, 1, 11, 1,  'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'PARTIALLY_CONFIRMED', 250, 'SYSTEM'),
(56, 1, 11, 2,  'EAF Melting',          'MELT-EAF',  'FURNACE', 2, 'NOT_STARTED', 250, 'SYSTEM'),

-- More NOT_STARTED operations
(57, 3, 6, 1,   'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'NOT_STARTED', 80, 'SYSTEM'),
(58, 2, 5, 10,  'Pickling',             'PKL',       'PICKLING',1, 'NOT_STARTED', 50, 'SYSTEM'),
(59, 4, 17, 1,  'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'BLOCKED',     250, 'SYSTEM'),
(60, 3, 23, 1,  'Scrap Charging',       'MELT-CHRG', 'FURNACE', 1, 'NOT_STARTED', 200, 'SYSTEM');
ALTER TABLE operations ALTER COLUMN operation_id RESTART WITH 61;

-- =====================================================
-- STEP 17: Batches (50 batches with varied statuses)
-- =====================================================
INSERT INTO batches (batch_id, batch_number, material_id, material_name, quantity, unit, status, created_by) VALUES
-- Raw material batches (AVAILABLE)
(1,  'B-RM-001', 'RM-SCRAP-A',   'Steel Scrap Grade A',  500, 'T',  'AVAILABLE', 'SYSTEM'),
(2,  'B-RM-002', 'RM-SCRAP-A',   'Steel Scrap Grade A',  350, 'T',  'AVAILABLE', 'SYSTEM'),
(3,  'B-RM-003', 'RM-SCRAP-B',   'Steel Scrap Grade B',  200, 'T',  'AVAILABLE', 'SYSTEM'),
(4,  'B-RM-004', 'RM-IRON-ORE',  'Iron Ore Pellets',     400, 'T',  'AVAILABLE', 'SYSTEM'),
(5,  'B-RM-005', 'RM-LIMESTONE', 'Limestone',            150, 'T',  'AVAILABLE', 'SYSTEM'),
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
(17, 'B-RM-017', 'RM-SCRAP-C',   'Steel Scrap Grade C',  250, 'T',  'AVAILABLE', 'SYSTEM'),
(18, 'B-RM-018', 'RM-FEV',       'Ferroalloy FeV',       100, 'KG', 'AVAILABLE', 'SYSTEM'),
-- Intermediate batches (various statuses)
(19, 'B-IM-001', 'IM-LIQUID',    'Liquid Steel',         165, 'T',  'CONSUMED',  'SYSTEM'),
(20, 'B-IM-002', 'IM-SLAB',      'Steel Slab 200mm',     155, 'T',  'AVAILABLE', 'SYSTEM'),
(21, 'B-IM-003', 'IM-LIQUID',    'Liquid Steel',          90, 'T',  'CONSUMED',  'SYSTEM'),
(22, 'B-IM-004', 'IM-LIQUID',    'Liquid Steel',         220, 'T',  'CONSUMED',  'SYSTEM'),
(23, 'B-IM-005', 'IM-BILLET',    'Steel Billet 100mm',   210, 'T',  'AVAILABLE', 'SYSTEM'),
(24, 'B-IM-006', 'IM-LIQUID',    'Liquid Steel',          85, 'T',  'CONSUMED',  'SYSTEM'),
(25, 'B-IM-007', 'IM-SLAB',      'Steel Slab 200mm',      82, 'T',  'CONSUMED',  'SYSTEM'),
(26, 'B-IM-008', 'IM-HR-ROUGH',  'HR Coil Rough',         78, 'T',  'CONSUMED',  'SYSTEM'),
(27, 'B-IM-009', 'IM-SLAB',      'Steel Slab 200mm',      30, 'T',  'QUALITY_PENDING', 'SYSTEM'),
(28, 'B-IM-010', 'IM-BILLET',    'Steel Billet 100mm',   195, 'T',  'AVAILABLE', 'SYSTEM'),
(29, 'B-IM-011', 'IM-PICKLED',   'Pickled HR Strip',      85, 'T',  'AVAILABLE', 'SYSTEM'),
(30, 'B-IM-012', 'IM-CR-STRIP',  'Cold Rolled Strip',     80, 'T',  'PRODUCED',  'SYSTEM'),
(31, 'B-IM-013', 'IM-ANNEALED',  'Annealed CR Strip',     75, 'T',  'AVAILABLE', 'SYSTEM'),
(32, 'B-IM-014', 'IM-ROLLED-BAR','Rolled Bar',           190, 'T',  'AVAILABLE', 'SYSTEM'),
(33, 'B-IM-015', 'IM-LIQUID',    'Liquid Steel',         130, 'T',  'PRODUCED',  'SYSTEM'),
(34, 'B-IM-016', 'IM-SLAB',      'Steel Slab 200mm',     125, 'T',  'PRODUCED',  'SYSTEM'),
-- Finished goods batches
(35, 'B-FG-001', 'FG-HR-2MM',    'HR Coil 2mm',           75, 'T',  'AVAILABLE', 'SYSTEM'),
(36, 'B-FG-002', 'FG-CR-1MM',    'CR Sheet 1mm',          70, 'T',  'AVAILABLE', 'SYSTEM'),
(37, 'B-FG-003', 'FG-REBAR-10',  'Rebar 10mm',           180, 'T',  'AVAILABLE', 'SYSTEM'),
(38, 'B-FG-004', 'FG-HR-2MM',    'HR Coil 2mm',          120, 'T',  'AVAILABLE', 'SYSTEM'),
(39, 'B-FG-005', 'FG-REBAR-10',  'Rebar 10mm',           175, 'T',  'PRODUCED',  'SYSTEM'),
(40, 'B-FG-006', 'FG-CR-1MM',    'CR Sheet 1mm',          55, 'T',  'PRODUCED',  'SYSTEM'),
-- Blocked / Quality batches
(41, 'B-RM-019', 'RM-SCRAP-A',   'Steel Scrap Grade A',  100, 'T',  'BLOCKED',   'SYSTEM'),
(42, 'B-IM-017', 'IM-SLAB',      'Steel Slab 200mm',      45, 'T',  'BLOCKED',   'SYSTEM'),
(43, 'B-IM-018', 'IM-BILLET',    'Steel Billet 100mm',    60, 'T',  'QUALITY_PENDING', 'SYSTEM'),
(44, 'B-FG-007', 'FG-HR-2MM',    'HR Coil 2mm',           25, 'T',  'QUALITY_PENDING', 'SYSTEM'),
-- Scrapped
(45, 'B-RM-020', 'RM-COAL',      'Coal (Contaminated)',   25, 'T',  'SCRAPPED',  'SYSTEM'),
-- Additional available batches
(46, 'B-RM-021', 'RM-SCRAP-A',   'Steel Scrap Grade A',  280, 'T',  'AVAILABLE', 'SYSTEM'),
(47, 'B-RM-022', 'RM-SCRAP-B',   'Steel Scrap Grade B',  150, 'T',  'AVAILABLE', 'SYSTEM'),
(48, 'B-IM-019', 'IM-HR-ROUGH',  'HR Coil Rough',         95, 'T',  'AVAILABLE', 'SYSTEM'),
(49, 'B-IM-020', 'IM-LIQUID',    'Liquid Steel',         100, 'T',  'AVAILABLE', 'SYSTEM'),
(50, 'B-FG-008', 'FG-REBAR-10',  'Rebar 10mm',           150, 'T',  'AVAILABLE', 'SYSTEM'),
-- Work In Progress batches (material actively being processed)
(51, 'B-WIP-001', 'WIP-MELT',    'Molten Steel EAF #1',   85, 'T',  'AVAILABLE', 'SYSTEM'),
(52, 'B-WIP-002', 'WIP-MELT',    'Molten Steel EAF #2',   92, 'T',  'AVAILABLE', 'SYSTEM'),
(53, 'B-WIP-003', 'WIP-CAST',    'Steel Being Cast',      78, 'T',  'AVAILABLE', 'SYSTEM'),
(54, 'B-WIP-004', 'WIP-ROLL',    'Strip on Hot Mill',     65, 'T',  'AVAILABLE', 'SYSTEM'),
(55, 'B-WIP-005', 'WIP-PICKLE',  'Strip in Pickle Line',  45, 'T',  'AVAILABLE', 'SYSTEM'),
(56, 'B-WIP-006', 'WIP-ROLL',    'Strip on Cold Mill',    55, 'T',  'AVAILABLE', 'SYSTEM');
ALTER TABLE batches ALTER COLUMN batch_id RESTART WITH 57;

-- Audit trail for batches
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('BATCH', 1,  'CREATE', 'Created batch B-RM-001: Steel Scrap A, 500T',         'SYSTEM', '2026-01-14 08:00:00'),
('BATCH', 2,  'CREATE', 'Created batch B-RM-002: Steel Scrap A, 350T',         'SYSTEM', '2026-01-14 08:30:00'),
('BATCH', 3,  'CREATE', 'Created batch B-RM-003: Steel Scrap B, 200T',         'SYSTEM', '2026-01-14 09:00:00'),
('BATCH', 19, 'CREATE', 'Created batch B-IM-001: Liquid Steel, 165T from EAF', 'SYSTEM', '2026-01-15 16:00:00'),
('BATCH', 19, 'CONSUME', 'Batch consumed in slab casting operation',           'OP-003', '2026-01-16 06:30:00'),
('BATCH', 20, 'CREATE', 'Created batch B-IM-002: Steel Slab 200mm, 155T',      'SYSTEM', '2026-01-16 12:00:00'),
('BATCH', 35, 'CREATE', 'Created batch B-FG-001: HR Coil 2mm, 75T',            'SYSTEM', '2026-01-20 14:00:00'),
('BATCH', 10, 'HOLD',   'Batch placed on hold - quality investigation',        'OP-006', '2026-01-25 10:00:00'),
('BATCH', 41, 'CREATE', 'Created batch B-RM-019: Steel Scrap A, 100T',         'SYSTEM', '2026-01-26 08:00:00'),
('BATCH', 41, 'STATUS_CHANGE', 'Status: AVAILABLE -> BLOCKED',                 'OP-006', '2026-01-26 14:00:00'),
('BATCH', 45, 'CREATE', 'Created batch B-RM-020: Coal, 25T',                   'SYSTEM', '2026-01-27 08:00:00'),
('BATCH', 45, 'STATUS_CHANGE', 'Status: AVAILABLE -> SCRAPPED',                'OP-006', '2026-01-27 16:00:00'),
('BATCH', 37, 'CREATE', 'Created batch B-FG-003: Rebar 10mm, 180T',            'SYSTEM', '2026-02-01 14:00:00'),
('BATCH', 38, 'CREATE', 'Created batch B-FG-004: HR Coil 2mm, 120T',           'SYSTEM', '2026-02-03 14:00:00'),
('BATCH', 27, 'CREATE', 'Created batch B-IM-009: Steel Slab 200mm, 30T',       'SYSTEM', '2026-02-04 10:00:00');

-- =====================================================
-- STEP 18: Inventory (50 records with all states)
-- =====================================================
INSERT INTO inventory (inventory_id, material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by) VALUES
-- Raw material inventory (AVAILABLE)
(1,  'RM-SCRAP-A',   'Steel Scrap Grade A',  'RM', 'AVAILABLE', 500,  'T',  1,  'Scrap Yard A',    'SYSTEM'),
(2,  'RM-SCRAP-A',   'Steel Scrap Grade A',  'RM', 'AVAILABLE', 350,  'T',  2,  'Scrap Yard A',    'SYSTEM'),
(3,  'RM-SCRAP-B',   'Steel Scrap Grade B',  'RM', 'AVAILABLE', 200,  'T',  3,  'Scrap Yard B',    'SYSTEM'),
(4,  'RM-IRON-ORE',  'Iron Ore Pellets',     'RM', 'AVAILABLE', 400,  'T',  4,  'Ore Storage',     'SYSTEM'),
(5,  'RM-LIMESTONE', 'Limestone',            'RM', 'AVAILABLE', 150,  'T',  5,  'Flux Store',      'SYSTEM'),
(6,  'RM-FESI',      'Ferroalloy FeSi',      'RM', 'AVAILABLE', 2000, 'KG', 6,  'Alloy Store',     'SYSTEM'),
(7,  'RM-FEMN',      'Ferroalloy FeMn',      'RM', 'AVAILABLE', 1500, 'KG', 7,  'Alloy Store',     'SYSTEM'),
(8,  'RM-COAL',      'Coal / Coke',          'RM', 'AVAILABLE', 300,  'T',  8,  'Coal Yard',       'SYSTEM'),
(9,  'RM-GRAPHITE',  'Graphite Electrodes',  'RM', 'AVAILABLE', 50,   'EA', 9,  'Electrode Store', 'SYSTEM'),
(10, 'RM-SCRAP-A',   'Steel Scrap (On Hold)','RM', 'ON_HOLD',   180,  'T',  10, 'Scrap Yard C',    'SYSTEM'),
(11, 'RM-SCRAP-B',   'Steel Scrap Grade B',  'RM', 'AVAILABLE', 120,  'T',  11, 'Scrap Yard B',    'SYSTEM'),
(12, 'RM-HCL',       'Hydrochloric Acid',    'RM', 'AVAILABLE', 5000, 'L',  12, 'Chemical Store',  'SYSTEM'),
(13, 'RM-COATING',   'Surface Coating Oil',  'RM', 'AVAILABLE', 2000, 'L',  13, 'Oil Store',       'SYSTEM'),
(14, 'RM-ROLL-LUB',  'Rolling Lubricant',    'RM', 'AVAILABLE', 3000, 'L',  14, 'Oil Store',       'SYSTEM'),
(15, 'RM-MOLD-PWD',  'Mold Powder',          'RM', 'AVAILABLE', 1000, 'KG', 15, 'Casting Store',   'SYSTEM'),
(16, 'RM-AL-WIRE',   'Aluminum Wire',        'RM', 'AVAILABLE', 500,  'KG', 16, 'Alloy Store',     'SYSTEM'),
(17, 'RM-SCRAP-C',   'Steel Scrap Grade C',  'RM', 'AVAILABLE', 250,  'T',  17, 'Scrap Yard C',    'SYSTEM'),
(18, 'RM-FEV',       'Ferroalloy FeV',       'RM', 'AVAILABLE', 100,  'KG', 18, 'Alloy Store',     'SYSTEM'),
-- Intermediate inventory
(19, 'IM-SLAB',      'Steel Slab 200mm',     'IM', 'AVAILABLE', 155,  'T',  20, 'Slab Yard',       'SYSTEM'),
(20, 'IM-BILLET',    'Steel Billet 100mm',   'IM', 'AVAILABLE', 210,  'T',  23, 'Billet Yard',     'SYSTEM'),
(21, 'IM-BILLET',    'Steel Billet 100mm',   'IM', 'AVAILABLE', 195,  'T',  28, 'Billet Yard',     'SYSTEM'),
(22, 'IM-PICKLED',   'Pickled HR Strip',     'IM', 'AVAILABLE', 85,   'T',  29, 'Pickling Bay',    'SYSTEM'),
(23, 'IM-CR-STRIP',  'Cold Rolled Strip',    'IM', 'PRODUCED',  80,   'T',  30, 'Cold Mill',       'SYSTEM'),
(24, 'IM-ANNEALED',  'Annealed CR Strip',    'IM', 'AVAILABLE', 75,   'T',  31, 'Annealing Bay',   'SYSTEM'),
(25, 'IM-ROLLED-BAR','Rolled Bar',           'IM', 'AVAILABLE', 190,  'T',  32, 'Bar Mill',        'SYSTEM'),
(26, 'IM-LIQUID',    'Liquid Steel',         'IM', 'PRODUCED',  130,  'T',  33, 'Ladle',           'SYSTEM'),
(27, 'IM-SLAB',      'Steel Slab 200mm',     'IM', 'PRODUCED',  125,  'T',  34, 'Slab Yard',       'SYSTEM'),
(28, 'IM-HR-ROUGH',  'HR Coil Rough',        'IM', 'AVAILABLE', 95,   'T',  48, 'Hot Mill',        'SYSTEM'),
(29, 'IM-LIQUID',    'Liquid Steel',         'IM', 'AVAILABLE', 100,  'T',  49, 'Ladle',           'SYSTEM'),
-- Work In Progress inventory (material actively being processed)
(51, 'WIP-MELT',     'Molten Steel (Active)', 'WIP', 'AVAILABLE', 85,  'T',  51, 'EAF #1',          'SYSTEM'),
(52, 'WIP-MELT',     'Molten Steel (Active)', 'WIP', 'AVAILABLE', 92,  'T',  52, 'EAF #2',          'SYSTEM'),
(53, 'WIP-CAST',     'Steel Being Cast',      'WIP', 'AVAILABLE', 78,  'T',  53, 'Caster #1',       'SYSTEM'),
(54, 'WIP-ROLL',     'Strip on Mill',         'WIP', 'AVAILABLE', 65,  'T',  54, 'Hot Mill #1',     'SYSTEM'),
(55, 'WIP-PICKLE',   'Strip in Pickle Line',  'WIP', 'AVAILABLE', 45,  'T',  55, 'Pickle Line #1',  'SYSTEM'),
(56, 'WIP-ROLL',     'Strip on Mill',         'WIP', 'AVAILABLE', 55,  'T',  56, 'Cold Mill #1',    'SYSTEM'),
-- Finished goods inventory
(30, 'FG-HR-2MM',    'HR Coil 2mm',          'FG', 'AVAILABLE', 75,   'T',  35, 'FG Warehouse 1',  'SYSTEM'),
(31, 'FG-CR-1MM',    'CR Sheet 1mm',         'FG', 'AVAILABLE', 70,   'T',  36, 'FG Warehouse 2',  'SYSTEM'),
(32, 'FG-REBAR-10',  'Rebar 10mm',           'FG', 'AVAILABLE', 180,  'T',  37, 'FG Warehouse 3',  'SYSTEM'),
(33, 'FG-HR-2MM',    'HR Coil 2mm',          'FG', 'AVAILABLE', 120,  'T',  38, 'FG Warehouse 1',  'SYSTEM'),
(34, 'FG-REBAR-10',  'Rebar 10mm',           'FG', 'PRODUCED',  175,  'T',  39, 'FG Warehouse 3',  'SYSTEM'),
(35, 'FG-CR-1MM',    'CR Sheet 1mm',         'FG', 'PRODUCED',  55,   'T',  40, 'FG Warehouse 2',  'SYSTEM'),
(36, 'FG-REBAR-10',  'Rebar 10mm',           'FG', 'AVAILABLE', 150,  'T',  50, 'FG Warehouse 3',  'SYSTEM'),
-- Reserved inventory
(37, 'RM-SCRAP-A',   'Steel Scrap Grade A',  'RM', 'RESERVED',  200,  'T',  46, 'Scrap Yard A',    'SYSTEM'),
(38, 'RM-SCRAP-B',   'Steel Scrap Grade B',  'RM', 'RESERVED',  100,  'T',  47, 'Scrap Yard B',    'SYSTEM'),
-- Blocked inventory
(39, 'RM-SCRAP-A',   'Steel Scrap (Blocked)','RM', 'BLOCKED',   100,  'T',  41, 'Quarantine Area', 'SYSTEM'),
(40, 'IM-SLAB',      'Steel Slab (Blocked)', 'IM', 'BLOCKED',   45,   'T',  42, 'QC Area',         'SYSTEM'),
-- On Hold inventory
(41, 'IM-SLAB',      'Steel Slab (QC Pend)', 'IM', 'ON_HOLD',   30,   'T',  27, 'QC Area',         'SYSTEM'),
(42, 'IM-BILLET',    'Steel Billet (QC)',    'IM', 'ON_HOLD',   60,   'T',  43, 'QC Area',         'SYSTEM'),
(43, 'FG-HR-2MM',    'HR Coil (QC Pending)', 'FG', 'ON_HOLD',   25,   'T',  44, 'QC Area',         'SYSTEM'),
-- Consumed inventory (historical)
(44, 'IM-LIQUID',    'Liquid Steel (Used)',  'IM', 'CONSUMED',  165,  'T',  19, 'Historical',      'SYSTEM'),
(45, 'IM-LIQUID',    'Liquid Steel (Used)',  'IM', 'CONSUMED',  90,   'T',  21, 'Historical',      'SYSTEM'),
(46, 'IM-LIQUID',    'Liquid Steel (Used)',  'IM', 'CONSUMED',  220,  'T',  22, 'Historical',      'SYSTEM'),
(47, 'IM-SLAB',      'Steel Slab (Used)',    'IM', 'CONSUMED',  82,   'T',  25, 'Historical',      'SYSTEM'),
(48, 'IM-HR-ROUGH',  'HR Coil Rough (Used)', 'IM', 'CONSUMED',  78,   'T',  26, 'Historical',      'SYSTEM'),
-- Scrapped
(49, 'RM-COAL',      'Coal (Contaminated)',  'RM', 'SCRAPPED',  25,   'T',  45, 'Disposal',        'SYSTEM'),
-- Additional available
(50, 'RM-SCRAP-A',   'Steel Scrap Grade A',  'RM', 'AVAILABLE', 280,  'T',  46, 'Scrap Yard A',    'SYSTEM');
ALTER TABLE inventory ALTER COLUMN inventory_id RESTART WITH 51;

-- Audit trail for inventory
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('INVENTORY', 1,  'CREATE', 'Created inventory: RM-SCRAP-A 500T at Scrap Yard A',       'SYSTEM', '2026-01-14 08:05:00'),
('INVENTORY', 19, 'CREATE', 'Created inventory: IM-SLAB 155T at Slab Yard',             'SYSTEM', '2026-01-16 12:05:00'),
('INVENTORY', 30, 'CREATE', 'Created inventory: FG-HR-2MM 75T at FG Warehouse 1',       'SYSTEM', '2026-01-20 14:05:00'),
('INVENTORY', 10, 'STATUS_CHANGE', 'State: AVAILABLE -> ON_HOLD',                       'OP-006', '2026-01-25 10:05:00'),
('INVENTORY', 39, 'STATUS_CHANGE', 'State: AVAILABLE -> BLOCKED',                       'OP-006', '2026-01-26 14:05:00'),
('INVENTORY', 49, 'STATUS_CHANGE', 'State: AVAILABLE -> SCRAPPED',                      'OP-006', '2026-01-27 16:05:00'),
('INVENTORY', 37, 'STATUS_CHANGE', 'State: AVAILABLE -> RESERVED for Order ORD-2026-009','admin', '2026-01-30 09:00:00'),
('INVENTORY', 38, 'STATUS_CHANGE', 'State: AVAILABLE -> RESERVED for Order ORD-2026-009','admin', '2026-01-30 09:05:00');

-- =====================================================
-- STEP 19: Production Confirmations (35 confirmations)
-- =====================================================
INSERT INTO production_confirmation (confirmation_id, operation_id, produced_qty, scrap_qty, start_time, end_time, delay_minutes, delay_reason, notes, status, created_by) VALUES
-- Order 1: Melting + Casting + Reheating
(1,  1,  160,  3,   '2026-01-15 06:00:00', '2026-01-15 10:00:00', 0,  NULL,              'Scrap charging complete, 160T loaded', 'CONFIRMED', 'OP-001'),
(2,  2,  155,  5,   '2026-01-15 10:30:00', '2026-01-15 16:00:00', 20, 'MAINTENANCE',     'EAF tap-to-tap 5.5hrs, electrode change', 'CONFIRMED', 'OP-001'),
(3,  3,  152,  3,   '2026-01-15 16:30:00', '2026-01-15 19:00:00', 0,  NULL,              'Ladle refining - chemistry adjusted',  'CONFIRMED', 'OP-001'),
(4,  4,  148,  4,   '2026-01-16 06:00:00', '2026-01-16 12:00:00', 15, 'EQUIP_BREAKDOWN', 'Slab casting, minor mold issue',       'CONFIRMED', 'OP-003'),
(5,  5,  148,  0,   '2026-01-17 06:00:00', '2026-01-17 09:00:00', 0,  NULL,              'Slabs reheated to 1250C',              'CONFIRMED', 'OP-004'),
-- Order 3: Rebar production
(6,  12, 210,  5,   '2026-01-19 06:00:00', '2026-01-19 10:00:00', 0,  NULL,              'Rebar order scrap charge',             'CONFIRMED', 'OP-001'),
(7,  13, 205,  5,   '2026-01-19 10:30:00', '2026-01-19 17:00:00', 30, 'QUALITY_ISSUE',   'Melting for rebar, temp correction',   'CONFIRMED', 'OP-001'),
(8,  14, 200,  5,   '2026-01-20 06:00:00', '2026-01-20 09:00:00', 0,  NULL,              'Ladle refining complete',              'CONFIRMED', 'OP-001'),
(9,  15, 195,  5,   '2026-01-20 10:00:00', '2026-01-20 18:00:00', 0,  NULL,              'Billet casting 100mm square',          'CONFIRMED', 'OP-003'),
-- Order 5: All operations (completed order)
(10, 19, 82,   1,   '2026-01-08 06:00:00', '2026-01-08 09:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
(11, 20, 80,   2,   '2026-01-08 09:30:00', '2026-01-08 14:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
(12, 21, 79,   1,   '2026-01-08 14:30:00', '2026-01-08 17:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-001'),
(13, 22, 77,   2,   '2026-01-09 06:00:00', '2026-01-09 12:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-003'),
(14, 23, 77,   0,   '2026-01-10 06:00:00', '2026-01-10 09:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
(15, 24, 76,   1,   '2026-01-10 09:30:00', '2026-01-10 13:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
(16, 25, 75.5, 0.5, '2026-01-10 13:30:00', '2026-01-10 17:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
(17, 26, 75,   0.5, '2026-01-11 06:00:00', '2026-01-11 10:00:00', 0,  NULL,              NULL, 'CONFIRMED', 'OP-004'),
-- Order 12: Rebar 12mm (completed)
(18, 32, 190,  5,   '2026-02-01 06:00:00', '2026-02-01 10:00:00', 0,  NULL,              'Scrap charging for rebar 12mm',        'CONFIRMED', 'OP-002'),
(19, 33, 185,  5,   '2026-02-01 10:30:00', '2026-02-01 17:00:00', 0,  NULL,              'EAF melting completed',                'CONFIRMED', 'OP-002'),
(20, 34, 182,  3,   '2026-02-02 06:00:00', '2026-02-02 09:00:00', 0,  NULL,              'Ladle refining',                       'CONFIRMED', 'OP-002'),
(21, 35, 178,  4,   '2026-02-02 10:00:00', '2026-02-02 18:00:00', 0,  NULL,              'Billet casting',                       'CONFIRMED', 'OP-003'),
(22, 36, 178,  0,   '2026-02-03 06:00:00', '2026-02-03 08:00:00', 0,  NULL,              'Billet reheating',                     'CONFIRMED', 'OP-004'),
(23, 37, 175,  3,   '2026-02-03 08:30:00', '2026-02-03 12:00:00', 0,  NULL,              'Bar rolling',                          'CONFIRMED', 'OP-004'),
(24, 38, 175,  0,   '2026-02-03 12:30:00', '2026-02-03 14:00:00', 0,  NULL,              'Quenching & tempering',                'CONFIRMED', 'OP-004'),
-- Order 13: HR Coil 4mm (completed)
(25, 39, 130,  2,   '2026-02-04 06:00:00', '2026-02-04 10:00:00', 0,  NULL,              'Scrap charging',                       'CONFIRMED', 'OP-001'),
(26, 40, 127,  3,   '2026-02-04 10:30:00', '2026-02-04 17:00:00', 0,  NULL,              'EAF melting',                          'CONFIRMED', 'OP-001'),
(27, 41, 125,  2,   '2026-02-05 06:00:00', '2026-02-05 09:00:00', 0,  NULL,              'Ladle refining',                       'CONFIRMED', 'OP-001'),
(28, 42, 122,  3,   '2026-02-05 10:00:00', '2026-02-05 18:00:00', 0,  NULL,              'Slab casting',                         'CONFIRMED', 'OP-003'),
(29, 43, 122,  0,   '2026-02-06 06:00:00', '2026-02-06 09:00:00', 0,  NULL,              'Slab reheating',                       'CONFIRMED', 'OP-004'),
(30, 44, 120,  2,   '2026-02-06 09:30:00', '2026-02-06 12:00:00', 0,  NULL,              'Rough rolling',                        'CONFIRMED', 'OP-004'),
(31, 45, 118,  2,   '2026-02-06 12:30:00', '2026-02-06 15:00:00', 0,  NULL,              'Finish rolling',                       'CONFIRMED', 'OP-004'),
(32, 46, 118,  0,   '2026-02-06 15:30:00', '2026-02-06 17:00:00', 0,  NULL,              'Cooling & coiling',                    'CONFIRMED', 'OP-004'),
-- Order 11: In-progress confirmations
(33, 49, 85,   2,   '2026-02-07 06:00:00', '2026-02-07 10:00:00', 0,  NULL,              'Scrap charging for HR coil',           'CONFIRMED', 'OP-011'),
-- Partial confirmation
(34, 55, 125,  5,   '2026-02-07 10:00:00', '2026-02-07 14:00:00', 0,  NULL,              'First batch - 125T of 250T',           'CONFIRMED', 'OP-001'),
-- Recent confirmation (today)
(35, 29, 90,   2,   '2026-02-08 06:00:00', '2026-02-08 09:00:00', 0,  NULL,              'Pickling operation in progress',       'CONFIRMED', 'OP-005');
ALTER TABLE production_confirmation ALTER COLUMN confirmation_id RESTART WITH 36;

-- Confirmation Equipment links
INSERT INTO confirmation_equipment (confirmation_id, equipment_id) VALUES
(1, 1), (2, 1), (3, 4), (4, 6), (5, 8),
(6, 2), (7, 2), (8, 4), (9, 7),
(10, 1), (11, 1), (12, 4), (13, 6), (14, 8), (15, 8), (16, 8), (17, 8),
(18, 2), (19, 2), (20, 5), (21, 7), (22, 8), (23, 12), (24, 12),
(25, 1), (26, 1), (27, 4), (28, 6), (29, 8), (30, 8), (31, 8), (32, 8),
(33, 2), (34, 1), (35, 13);

-- Confirmation Operator links
INSERT INTO confirmation_operators (confirmation_id, operator_id) VALUES
(1, 1), (2, 1), (3, 1), (4, 3), (5, 4),
(6, 1), (7, 1), (8, 1), (9, 3),
(10, 1), (11, 1), (12, 1), (13, 3), (14, 4), (15, 4), (16, 4), (17, 4),
(18, 2), (19, 2), (20, 2), (21, 3), (22, 4), (23, 4), (24, 4),
(25, 1), (26, 1), (27, 1), (28, 3), (29, 4), (30, 4), (31, 4), (32, 4),
(33, 11), (34, 1), (35, 5);

-- =====================================================
-- STEP 20: Batch Relations (40 genealogy records)
-- =====================================================
INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by) VALUES
-- Order 1 genealogy: RM -> Liquid Steel -> Slab
(1,  19, 'MERGE', 105, 'ACTIVE', 'SYSTEM'),
(3,  19, 'MERGE', 30,  'ACTIVE', 'SYSTEM'),
(4,  19, 'MERGE', 22,  'ACTIVE', 'SYSTEM'),
(8,  19, 'MERGE', 15,  'ACTIVE', 'SYSTEM'),
(19, 20, 'MERGE', 155, 'ACTIVE', 'SYSTEM'),
-- Order 3 genealogy: RM -> Liquid Steel -> Billet
(2,  22, 'MERGE', 160, 'ACTIVE', 'SYSTEM'),
(11, 22, 'MERGE', 36,  'ACTIVE', 'SYSTEM'),
(4,  22, 'MERGE', 30,  'ACTIVE', 'SYSTEM'),
(8,  22, 'MERGE', 18,  'ACTIVE', 'SYSTEM'),
(22, 23, 'MERGE', 210, 'ACTIVE', 'SYSTEM'),
-- Order 5 genealogy: Full chain RM -> Liquid -> Slab -> HR Rough -> FG
(1,  24, 'MERGE', 56,  'ACTIVE', 'SYSTEM'),
(3,  24, 'MERGE', 16,  'ACTIVE', 'SYSTEM'),
(4,  24, 'MERGE', 12,  'ACTIVE', 'SYSTEM'),
(8,  24, 'MERGE', 8,   'ACTIVE', 'SYSTEM'),
(24, 25, 'MERGE', 82,  'ACTIVE', 'SYSTEM'),
(25, 26, 'MERGE', 78,  'ACTIVE', 'SYSTEM'),
(26, 35, 'MERGE', 75,  'ACTIVE', 'SYSTEM'),
-- Order 12 genealogy: Rebar 12mm
(2,  33, 'MERGE', 140, 'ACTIVE', 'SYSTEM'),
(17, 33, 'MERGE', 45,  'ACTIVE', 'SYSTEM'),
(7,  33, 'MERGE', 8,   'ACTIVE', 'SYSTEM'),
(33, 28, 'MERGE', 180, 'ACTIVE', 'SYSTEM'),
(28, 32, 'MERGE', 178, 'ACTIVE', 'SYSTEM'),
(32, 39, 'MERGE', 175, 'ACTIVE', 'SYSTEM'),
-- Order 13 genealogy: HR Coil 4mm
(46, 49, 'MERGE', 100, 'ACTIVE', 'SYSTEM'),
(47, 49, 'MERGE', 30,  'ACTIVE', 'SYSTEM'),
(4,  49, 'MERGE', 10,  'ACTIVE', 'SYSTEM'),
(49, 34, 'MERGE', 125, 'ACTIVE', 'SYSTEM'),
(34, 48, 'MERGE', 120, 'ACTIVE', 'SYSTEM'),
(48, 38, 'MERGE', 118, 'ACTIVE', 'SYSTEM'),
-- Additional relations for CR Sheet production
(48, 29, 'MERGE', 90,  'ACTIVE', 'SYSTEM'),
(29, 30, 'MERGE', 85,  'ACTIVE', 'SYSTEM'),
(30, 31, 'MERGE', 80,  'ACTIVE', 'SYSTEM'),
(31, 36, 'MERGE', 70,  'ACTIVE', 'SYSTEM'),
-- Split operation example
(20, 27, 'SPLIT', 30,  'ACTIVE', 'SYSTEM'),
-- Consumed relations
(1,  21, 'CONSUME', 50,  'ACTIVE', 'SYSTEM'),
(3,  21, 'CONSUME', 25,  'ACTIVE', 'SYSTEM'),
(21, 40, 'MERGE', 55,   'ACTIVE', 'SYSTEM'),
-- More genealogy
(2,  19, 'MERGE', 40,   'ACTIVE', 'SYSTEM'),
(6,  19, 'MERGE', 3,    'ACTIVE', 'SYSTEM'),
(6,  22, 'MERGE', 2,    'ACTIVE', 'SYSTEM');

-- =====================================================
-- STEP 21: Hold Records (12 holds - 8 active, 4 released)
-- =====================================================
INSERT INTO hold_records (hold_id, entity_type, entity_id, reason, comments, applied_by, applied_on, released_by, released_on, release_comments, status) VALUES
-- Active holds
(1,  'BATCH',     10, 'QUALITY_INVESTIGATION', 'Suspected contamination in scrap shipment - pending lab report',   'OP-006', '2026-01-25 10:00:00', NULL, NULL, NULL, 'ACTIVE'),
(2,  'INVENTORY', 39, 'QUALITY_INVESTIGATION', 'Chemical analysis failed - high sulfur content detected',          'OP-006', '2026-01-26 09:00:00', NULL, NULL, NULL, 'ACTIVE'),
(3,  'INVENTORY', 41, 'QUALITY_INVESTIGATION', 'Surface defects found during slab inspection',                     'OP-007', '2026-01-27 14:00:00', NULL, NULL, NULL, 'ACTIVE'),
(4,  'OPERATION', 27, 'MATERIAL_SHORTAGE',     'Waiting for scrap availability',                                   'OP-004', '2026-01-28 08:00:00', NULL, NULL, NULL, 'ACTIVE'),
(5,  'BATCH',     27, 'SAFETY_CONCERN',        'Slab surface cracks detected - requires ultrasonic testing',       'OP-006', '2026-01-29 11:00:00', NULL, NULL, NULL, 'ACTIVE'),
(6,  'EQUIPMENT', 13, 'SAFETY_CONCERN',        'Acid leak detected in pickling line - safety inspection required', 'OP-008', '2026-01-28 10:00:00', NULL, NULL, NULL, 'ACTIVE'),
(7,  'ORDER',     8,  'CUSTOMER_REQUEST',      'Customer requested hold pending design review',                    'admin',  '2026-01-29 08:00:00', NULL, NULL, NULL, 'ACTIVE'),
(8,  'BATCH',     42, 'SPEC_DEVIATION',        'Slab thickness out of specification - requires disposition',       'OP-006', '2026-02-01 09:00:00', NULL, NULL, NULL, 'ACTIVE'),
-- Released holds
(9,  'BATCH',     3,  'QUALITY_INVESTIGATION', 'Initial inspection found anomaly',                                 'OP-006', '2026-01-20 10:00:00', 'OP-007', '2026-01-21 14:00:00', 'Lab results clear - release approved', 'RELEASED'),
(10, 'INVENTORY', 5,  'CONTAMINATION',         'Suspected moisture contamination',                                 'OP-006', '2026-01-22 09:00:00', 'OP-006', '2026-01-23 11:00:00', 'Moisture test passed - OK to use',     'RELEASED'),
(11, 'OPERATION', 16, 'EQUIP_BREAKDOWN',       'Equipment maintenance required',                                   'OP-008', '2026-01-24 08:00:00', 'OP-008', '2026-01-25 16:00:00', 'Maintenance completed - equipment OK', 'RELEASED'),
(12, 'EQUIPMENT', 3,  'SAFETY_CONCERN',        'Safety inspection for arc furnace',                                'OP-008', '2026-01-25 08:00:00', 'OP-008', '2026-01-26 10:00:00', 'Inspection passed - cleared for use',  'RELEASED');
ALTER TABLE hold_records ALTER COLUMN hold_id RESTART WITH 13;

-- Audit trail for holds
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('HOLD_RECORD', 1,  'HOLD',    'Hold applied to BATCH 10: Quality Investigation',        'OP-006', '2026-01-25 10:00:00'),
('HOLD_RECORD', 2,  'HOLD',    'Hold applied to INVENTORY 39: Quality Investigation',    'OP-006', '2026-01-26 09:00:00'),
('HOLD_RECORD', 3,  'HOLD',    'Hold applied to INVENTORY 41: Quality Investigation',    'OP-007', '2026-01-27 14:00:00'),
('HOLD_RECORD', 4,  'HOLD',    'Hold applied to OPERATION 27: Material Shortage',        'OP-004', '2026-01-28 08:00:00'),
('HOLD_RECORD', 5,  'HOLD',    'Hold applied to BATCH 27: Safety Concern',               'OP-006', '2026-01-29 11:00:00'),
('HOLD_RECORD', 6,  'HOLD',    'Hold applied to EQUIPMENT 13: Safety Concern',           'OP-008', '2026-01-28 10:00:00'),
('HOLD_RECORD', 7,  'HOLD',    'Hold applied to ORDER 8: Customer Request',              'admin',  '2026-01-29 08:00:00'),
('HOLD_RECORD', 8,  'HOLD',    'Hold applied to BATCH 42: Specification Deviation',      'OP-006', '2026-02-01 09:00:00'),
('HOLD_RECORD', 9,  'HOLD',    'Hold applied to BATCH 3: Quality Investigation',         'OP-006', '2026-01-20 10:00:00'),
('HOLD_RECORD', 9,  'RELEASE', 'Hold released from BATCH 3: Lab results clear',          'OP-007', '2026-01-21 14:00:00'),
('HOLD_RECORD', 10, 'HOLD',    'Hold applied to INVENTORY 5: Contamination Suspected',   'OP-006', '2026-01-22 09:00:00'),
('HOLD_RECORD', 10, 'RELEASE', 'Hold released from INVENTORY 5: Moisture test passed',   'OP-006', '2026-01-23 11:00:00'),
('HOLD_RECORD', 11, 'HOLD',    'Hold applied to OPERATION 16: Equipment Breakdown',      'OP-008', '2026-01-24 08:00:00'),
('HOLD_RECORD', 11, 'RELEASE', 'Hold released from OPERATION 16: Maintenance completed', 'OP-008', '2026-01-25 16:00:00'),
('HOLD_RECORD', 12, 'HOLD',    'Hold applied to EQUIPMENT 3: Safety Inspection',         'OP-008', '2026-01-25 08:00:00'),
('HOLD_RECORD', 12, 'RELEASE', 'Hold released from EQUIPMENT 3: Inspection passed',      'OP-008', '2026-01-26 10:00:00');

-- =====================================================
-- STEP 22: Additional Comprehensive Audit Trail (100+ more entries)
-- =====================================================
-- Production confirmation audit entries
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('PRODUCTION_CONFIRMATION', 1,  'PRODUCE', 'Confirmed: Scrap Charging 160T, Scrap 3T',          'OP-001', '2026-01-15 10:00:00'),
('PRODUCTION_CONFIRMATION', 2,  'PRODUCE', 'Confirmed: EAF Melting 155T, Scrap 5T',             'OP-001', '2026-01-15 16:00:00'),
('PRODUCTION_CONFIRMATION', 3,  'PRODUCE', 'Confirmed: Ladle Refining 152T, Scrap 3T',          'OP-001', '2026-01-15 19:00:00'),
('PRODUCTION_CONFIRMATION', 4,  'PRODUCE', 'Confirmed: Slab Casting 148T, Scrap 4T',            'OP-003', '2026-01-16 12:00:00'),
('PRODUCTION_CONFIRMATION', 5,  'PRODUCE', 'Confirmed: Slab Reheating 148T',                    'OP-004', '2026-01-17 09:00:00'),
('PRODUCTION_CONFIRMATION', 6,  'PRODUCE', 'Confirmed: Rebar Scrap Charging 210T',              'OP-001', '2026-01-19 10:00:00'),
('PRODUCTION_CONFIRMATION', 7,  'PRODUCE', 'Confirmed: EAF Melting 205T for rebar',             'OP-001', '2026-01-19 17:00:00'),
('PRODUCTION_CONFIRMATION', 8,  'PRODUCE', 'Confirmed: Ladle Refining 200T for rebar',          'OP-001', '2026-01-20 09:00:00'),
('PRODUCTION_CONFIRMATION', 9,  'PRODUCE', 'Confirmed: Billet Casting 195T',                    'OP-003', '2026-01-20 18:00:00'),
('PRODUCTION_CONFIRMATION', 10, 'PRODUCE', 'Confirmed: Order 5 Scrap Charging 82T',             'OP-001', '2026-01-08 09:00:00'),
('PRODUCTION_CONFIRMATION', 11, 'PRODUCE', 'Confirmed: Order 5 EAF Melting 80T',                'OP-001', '2026-01-08 14:00:00'),
('PRODUCTION_CONFIRMATION', 12, 'PRODUCE', 'Confirmed: Order 5 Ladle Refining 79T',             'OP-001', '2026-01-08 17:00:00'),
('PRODUCTION_CONFIRMATION', 13, 'PRODUCE', 'Confirmed: Order 5 Slab Casting 77T',               'OP-003', '2026-01-09 12:00:00'),
('PRODUCTION_CONFIRMATION', 14, 'PRODUCE', 'Confirmed: Order 5 Slab Reheating 77T',             'OP-004', '2026-01-10 09:00:00'),
('PRODUCTION_CONFIRMATION', 15, 'PRODUCE', 'Confirmed: Order 5 Rough Rolling 76T',              'OP-004', '2026-01-10 13:00:00'),
('PRODUCTION_CONFIRMATION', 16, 'PRODUCE', 'Confirmed: Order 5 Finish Rolling 75.5T',           'OP-004', '2026-01-10 17:00:00'),
('PRODUCTION_CONFIRMATION', 17, 'PRODUCE', 'Confirmed: Order 5 Cooling & Coiling 75T - COMPLETE','OP-004', '2026-01-11 10:00:00'),
('PRODUCTION_CONFIRMATION', 18, 'PRODUCE', 'Confirmed: Order 12 Scrap Charging 190T',           'OP-002', '2026-02-01 10:00:00'),
('PRODUCTION_CONFIRMATION', 19, 'PRODUCE', 'Confirmed: Order 12 EAF Melting 185T',              'OP-002', '2026-02-01 17:00:00'),
('PRODUCTION_CONFIRMATION', 20, 'PRODUCE', 'Confirmed: Order 12 Ladle Refining 182T',           'OP-002', '2026-02-02 09:00:00'),
('PRODUCTION_CONFIRMATION', 21, 'PRODUCE', 'Confirmed: Order 12 Billet Casting 178T',           'OP-003', '2026-02-02 18:00:00'),
('PRODUCTION_CONFIRMATION', 22, 'PRODUCE', 'Confirmed: Order 12 Billet Reheating 178T',         'OP-004', '2026-02-03 08:00:00'),
('PRODUCTION_CONFIRMATION', 23, 'PRODUCE', 'Confirmed: Order 12 Bar Rolling 175T',              'OP-004', '2026-02-03 12:00:00'),
('PRODUCTION_CONFIRMATION', 24, 'PRODUCE', 'Confirmed: Order 12 Quenching 175T - COMPLETE',     'OP-004', '2026-02-03 14:00:00'),
('PRODUCTION_CONFIRMATION', 25, 'PRODUCE', 'Confirmed: Order 13 Scrap Charging 130T',           'OP-001', '2026-02-04 10:00:00'),
('PRODUCTION_CONFIRMATION', 26, 'PRODUCE', 'Confirmed: Order 13 EAF Melting 127T',              'OP-001', '2026-02-04 17:00:00'),
('PRODUCTION_CONFIRMATION', 27, 'PRODUCE', 'Confirmed: Order 13 Ladle Refining 125T',           'OP-001', '2026-02-05 09:00:00'),
('PRODUCTION_CONFIRMATION', 28, 'PRODUCE', 'Confirmed: Order 13 Slab Casting 122T',             'OP-003', '2026-02-05 18:00:00'),
('PRODUCTION_CONFIRMATION', 29, 'PRODUCE', 'Confirmed: Order 13 Slab Reheating 122T',           'OP-004', '2026-02-06 09:00:00'),
('PRODUCTION_CONFIRMATION', 30, 'PRODUCE', 'Confirmed: Order 13 Rough Rolling 120T',            'OP-004', '2026-02-06 12:00:00'),
('PRODUCTION_CONFIRMATION', 31, 'PRODUCE', 'Confirmed: Order 13 Finish Rolling 118T',           'OP-004', '2026-02-06 15:00:00'),
('PRODUCTION_CONFIRMATION', 32, 'PRODUCE', 'Confirmed: Order 13 Cooling 118T - COMPLETE',       'OP-004', '2026-02-06 17:00:00'),
('PRODUCTION_CONFIRMATION', 33, 'PRODUCE', 'Confirmed: Order 11 Scrap Charging 85T',            'OP-011', '2026-02-07 10:00:00'),
('PRODUCTION_CONFIRMATION', 34, 'PRODUCE', 'Confirmed: Order 9 partial 125T of 250T',           'OP-001', '2026-02-07 14:00:00'),
('PRODUCTION_CONFIRMATION', 35, 'PRODUCE', 'Confirmed: Order 11 Pickling 90T',                  'OP-005', '2026-02-08 09:00:00');

-- Operation status change audit entries
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('OPERATION', 1,  'STATUS_CHANGE', 'NOT_STARTED -> CONFIRMED', 'OP-001', '2026-01-15 10:00:00'),
('OPERATION', 2,  'STATUS_CHANGE', 'READY -> CONFIRMED',       'OP-001', '2026-01-15 16:00:00'),
('OPERATION', 3,  'STATUS_CHANGE', 'NOT_STARTED -> CONFIRMED', 'OP-001', '2026-01-15 19:00:00'),
('OPERATION', 4,  'STATUS_CHANGE', 'NOT_STARTED -> CONFIRMED', 'OP-003', '2026-01-16 12:00:00'),
('OPERATION', 5,  'STATUS_CHANGE', 'NOT_STARTED -> CONFIRMED', 'OP-004', '2026-01-17 09:00:00'),
('OPERATION', 6,  'STATUS_CHANGE', 'NOT_STARTED -> READY',     'SYSTEM', '2026-01-17 09:05:00'),
('OPERATION', 12, 'STATUS_CHANGE', 'NOT_STARTED -> CONFIRMED', 'OP-001', '2026-01-19 10:00:00'),
('OPERATION', 13, 'STATUS_CHANGE', 'READY -> CONFIRMED',       'OP-001', '2026-01-19 17:00:00'),
('OPERATION', 14, 'STATUS_CHANGE', 'NOT_STARTED -> CONFIRMED', 'OP-001', '2026-01-20 09:00:00'),
('OPERATION', 15, 'STATUS_CHANGE', 'NOT_STARTED -> CONFIRMED', 'OP-003', '2026-01-20 18:00:00'),
('OPERATION', 16, 'STATUS_CHANGE', 'NOT_STARTED -> READY',     'SYSTEM', '2026-01-20 18:05:00'),
('OPERATION', 27, 'STATUS_CHANGE', 'NOT_STARTED -> ON_HOLD',   'OP-004', '2026-01-28 08:00:00'),
('OPERATION', 29, 'STATUS_CHANGE', 'READY -> IN_PROGRESS',     'OP-005', '2026-02-08 06:00:00'),
('OPERATION', 47, 'STATUS_CHANGE', 'NOT_STARTED -> BLOCKED',   'SYSTEM', '2026-02-06 09:05:00'),
('OPERATION', 55, 'STATUS_CHANGE', 'READY -> PARTIALLY_CONFIRMED', 'OP-001', '2026-02-07 14:00:00');

-- Batch consume/produce audit entries
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('BATCH', 1,  'CONSUME', 'Consumed 105T for liquid steel production',    'OP-001', '2026-01-15 16:00:00'),
('BATCH', 3,  'CONSUME', 'Consumed 30T for liquid steel production',     'OP-001', '2026-01-15 16:00:00'),
('BATCH', 4,  'CONSUME', 'Consumed 22T for liquid steel production',     'OP-001', '2026-01-15 16:00:00'),
('BATCH', 8,  'CONSUME', 'Consumed 15T for liquid steel production',     'OP-001', '2026-01-15 16:00:00'),
('BATCH', 19, 'PRODUCE', 'Produced 165T liquid steel from melting',      'OP-001', '2026-01-15 16:00:00'),
('BATCH', 20, 'PRODUCE', 'Produced 155T slab from casting',              'OP-003', '2026-01-16 12:00:00'),
('BATCH', 2,  'CONSUME', 'Consumed 160T for rebar liquid steel',         'OP-001', '2026-01-19 17:00:00'),
('BATCH', 22, 'PRODUCE', 'Produced 220T liquid steel for rebar',         'OP-001', '2026-01-19 17:00:00'),
('BATCH', 23, 'PRODUCE', 'Produced 210T billet from casting',            'OP-003', '2026-01-20 18:00:00'),
('BATCH', 35, 'PRODUCE', 'Produced 75T HR Coil 2mm - Order 5 complete',  'OP-004', '2026-01-11 10:00:00'),
('BATCH', 37, 'PRODUCE', 'Produced 180T Rebar 10mm',                     'OP-004', '2026-02-01 14:00:00'),
('BATCH', 38, 'PRODUCE', 'Produced 120T HR Coil 2mm',                    'OP-004', '2026-02-03 14:00:00'),
('BATCH', 39, 'PRODUCE', 'Produced 175T Rebar 10mm - Order 12 complete', 'OP-004', '2026-02-03 14:00:00');

-- User activity audit entries
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('USER', 1, 'LOGIN',  'Admin user logged in',                  'admin',  '2026-01-10 07:55:00'),
('USER', 1, 'LOGIN',  'Admin user logged in',                  'admin',  '2026-01-15 05:30:00'),
('USER', 1, 'LOGIN',  'Admin user logged in',                  'admin',  '2026-01-20 06:00:00'),
('USER', 1, 'LOGIN',  'Admin user logged in',                  'admin',  '2026-01-25 07:00:00'),
('USER', 1, 'LOGIN',  'Admin user logged in',                  'admin',  '2026-01-30 08:00:00'),
('USER', 1, 'LOGIN',  'Admin user logged in',                  'admin',  '2026-02-01 06:00:00'),
('USER', 1, 'LOGIN',  'Admin user logged in',                  'admin',  '2026-02-05 07:00:00'),
('USER', 1, 'LOGIN',  'Admin user logged in',                  'admin',  '2026-02-08 06:30:00');

-- Batch number generation audit
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('BATCH', 19, 'BATCH_NUMBER_GENERATED', 'Generated batch number B-IM-001 for liquid steel', 'SYSTEM', '2026-01-15 16:00:00'),
('BATCH', 20, 'BATCH_NUMBER_GENERATED', 'Generated batch number B-IM-002 for steel slab',   'SYSTEM', '2026-01-16 12:00:00'),
('BATCH', 22, 'BATCH_NUMBER_GENERATED', 'Generated batch number B-IM-004 for liquid steel', 'SYSTEM', '2026-01-19 17:00:00'),
('BATCH', 23, 'BATCH_NUMBER_GENERATED', 'Generated batch number B-IM-005 for steel billet', 'SYSTEM', '2026-01-20 18:00:00'),
('BATCH', 35, 'BATCH_NUMBER_GENERATED', 'Generated batch number B-FG-001 for HR Coil 2mm',  'SYSTEM', '2026-01-20 14:00:00'),
('BATCH', 37, 'BATCH_NUMBER_GENERATED', 'Generated batch number B-FG-003 for Rebar 10mm',   'SYSTEM', '2026-02-01 14:00:00'),
('BATCH', 38, 'BATCH_NUMBER_GENERATED', 'Generated batch number B-FG-004 for HR Coil 2mm',  'SYSTEM', '2026-02-03 14:00:00'),
('BATCH', 39, 'BATCH_NUMBER_GENERATED', 'Generated batch number B-FG-005 for Rebar 10mm',   'SYSTEM', '2026-02-03 14:00:00');

-- Recent activity for today (Feb 8)
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp) VALUES
('OPERATION', 29, 'STATUS_CHANGE', 'Started pickling operation',         'OP-005', '2026-02-08 06:00:00'),
('INVENTORY', 22, 'CONSUME', 'Consumed 85T pickled strip for cold rolling','OP-005', '2026-02-08 06:30:00'),
('PRODUCTION_CONFIRMATION', 35, 'CREATE', 'Created confirmation for pickling 90T', 'OP-005', '2026-02-08 09:00:00'),
('ORDER', 11, 'UPDATE', 'Updated expected completion date',              'admin',  '2026-02-08 08:00:00'),
('EQUIPMENT', 8, 'STATUS_CHANGE', 'HSM-001 status check - operational', 'OP-008', '2026-02-08 07:00:00');

-- =====================================================
-- STEP 23: Unit of Measure Configuration
-- =====================================================
INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit, is_active) VALUES
('T',    'Metric Ton',      'WEIGHT',  2, TRUE,  TRUE),
('KG',   'Kilogram',        'WEIGHT',  2, FALSE, TRUE),
('LB',   'Pound',           'WEIGHT',  2, FALSE, TRUE),
('G',    'Gram',            'WEIGHT',  3, FALSE, TRUE),
('L',    'Liter',           'VOLUME',  2, TRUE,  TRUE),
('ML',   'Milliliter',      'VOLUME',  0, FALSE, TRUE),
('GAL',  'Gallon',          'VOLUME',  2, FALSE, TRUE),
('M',    'Meter',           'LENGTH',  2, TRUE,  TRUE),
('MM',   'Millimeter',      'LENGTH',  0, FALSE, TRUE),
('CM',   'Centimeter',      'LENGTH',  1, FALSE, TRUE),
('EA',   'Each',            'COUNT',   0, TRUE,  TRUE),
('PC',   'Piece',           'COUNT',   0, FALSE, TRUE),
('HR',   'Hour',            'TIME',    2, TRUE,  TRUE),
('MIN',  'Minute',          'TIME',    0, FALSE, TRUE);

-- =====================================================
-- STEP 24: Unit Conversion Configuration
-- =====================================================
INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor, is_active) VALUES
('T',   'KG',  1000.0,         TRUE),
('KG',  'T',   0.001,          TRUE),
('KG',  'LB',  2.20462,        TRUE),
('LB',  'KG',  0.453592,       TRUE),
('KG',  'G',   1000.0,         TRUE),
('G',   'KG',  0.001,          TRUE),
('L',   'ML',  1000.0,         TRUE),
('ML',  'L',   0.001,          TRUE),
('L',   'GAL', 0.264172,       TRUE),
('GAL', 'L',   3.78541,        TRUE),
('M',   'MM',  1000.0,         TRUE),
('MM',  'M',   0.001,          TRUE),
('M',   'CM',  100.0,          TRUE),
('CM',  'M',   0.01,           TRUE),
('HR',  'MIN', 60.0,           TRUE),
('MIN', 'HR',  0.0166667,      TRUE);

-- =====================================================
-- STEP 25: Equipment Type Configuration
-- =====================================================
INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, max_continuous_operation_hours, requires_operator, requires_calibration, allows_parallel_operation, is_active) VALUES
('BATCH',      'Batch Equipment',      'Equipment that processes discrete batches',            1,    500,  'T',    NULL,   NULL,   500,  24,  TRUE,  FALSE, FALSE, TRUE),
('CONTINUOUS', 'Continuous Equipment', 'Equipment with continuous flow processing',            1,    100,  'T/hr', NULL,   NULL,   720,  168, TRUE,  FALSE, TRUE,  TRUE),
('MELTING',    'Melting Furnace',      'Electric arc or induction furnaces for melting',      50,   200,  'T',    1500,   1700,   200,  12,  TRUE,  TRUE,  FALSE, TRUE),
('REFINING',   'Refining Equipment',   'Ladle furnaces for secondary metallurgy',             50,   150,  'T',    1550,   1650,   300,  8,   TRUE,  TRUE,  FALSE, TRUE),
('CASTING',    'Casting Machine',      'Continuous casters for slab/billet production',       20,   80,   'T/hr', 1500,   1550,   500,  168, TRUE,  TRUE,  FALSE, TRUE),
('HOT_ROLLING','Hot Rolling Mill',     'Mills for hot rolling slabs to coils/strips',         10,   50,   'T/hr', 900,    1250,   400,  168, TRUE,  TRUE,  TRUE,  TRUE),
('COLD_ROLLING','Cold Rolling Mill',   'Mills for cold reduction of strips',                  5,    30,   'T/hr', NULL,   NULL,   600,  168, TRUE,  TRUE,  TRUE,  TRUE),
('HEAT_TREATMENT','Heat Treatment',    'Furnaces for annealing, normalizing, tempering',      20,   100,  'T',    600,    900,    400,  48,  TRUE,  TRUE,  FALSE, TRUE),
('PICKLING',   'Pickling Line',        'Acid pickling for scale removal',                     10,   40,   'T/hr', 60,     90,     300,  168, TRUE,  FALSE, TRUE,  TRUE),
('COATING',    'Coating Line',         'Hot-dip galvanizing or other coating',                10,   50,   'T/hr', 450,    480,    400,  168, TRUE,  FALSE, TRUE,  TRUE),
('BAR_ROLLING','Bar Rolling Mill',     'Mills for rolling billets to bars/rebars',            20,   60,   'T/hr', 1000,   1150,   400,  168, TRUE,  TRUE,  TRUE,  TRUE),
('WIRE_DRAWING','Wire Drawing',        'Machines for drawing wire from rod',                  2,    20,   'T/hr', NULL,   NULL,   500,  168, TRUE,  FALSE, TRUE,  TRUE),
('PACKAGING',  'Packaging Line',       'Equipment for strapping, labeling, packaging',        10,   100,  'T',    NULL,   NULL,   1000, 168, TRUE,  FALSE, TRUE,  TRUE);

-- =====================================================
-- STEP 26: Inventory Form Configuration
-- =====================================================
INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_moisture, tracks_density, default_weight_unit, default_volume_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_humidity_control, max_humidity_percent, requires_special_handling, shelf_life_days, is_active) VALUES
('SOLID',   'Solid',           'Solid materials (steel, scrap, slabs)',       FALSE, FALSE, TRUE,  'T',   NULL,  FALSE, NULL,  NULL,  FALSE, NULL, FALSE, NULL, TRUE),
('LIQUID',  'Liquid/Molten',   'Molten metals and liquid materials',          TRUE,  FALSE, TRUE,  'T',   NULL,  TRUE,  1500,  1700,  FALSE, NULL, TRUE,  NULL, TRUE),
('POWDER',  'Powder/Granular', 'Powders, fluxes, and granular materials',     FALSE, TRUE,  TRUE,  'KG',  NULL,  FALSE, NULL,  NULL,  TRUE,  60,   TRUE,  365,  TRUE),
('COIL',    'Coil/Strip',      'Coiled sheet or strip products',              FALSE, FALSE, FALSE, 'T',   NULL,  FALSE, NULL,  NULL,  TRUE,  70,   FALSE, NULL, TRUE),
('SHEET',   'Sheet/Plate',     'Flat sheet or plate products',                FALSE, FALSE, FALSE, 'T',   NULL,  FALSE, NULL,  NULL,  TRUE,  70,   FALSE, NULL, TRUE),
('BAR',     'Bar/Rod',         'Long products - bars, rods, rebars',          FALSE, FALSE, FALSE, 'T',   NULL,  FALSE, NULL,  NULL,  FALSE, NULL, FALSE, NULL, TRUE),
('BILLET',  'Billet/Bloom',    'Semi-finished steel billets or blooms',       FALSE, FALSE, FALSE, 'T',   NULL,  FALSE, NULL,  NULL,  FALSE, NULL, FALSE, NULL, TRUE),
('CHEMICAL','Chemical/Acid',   'Chemicals, acids, and process fluids',        TRUE,  FALSE, TRUE,  'KG',  'L',   TRUE,  10,    35,    FALSE, NULL, TRUE,  180,  TRUE),
('GAS',     'Gas',             'Industrial gases (argon, nitrogen, oxygen)',  TRUE,  FALSE, FALSE, 'KG',  'L',   TRUE,  -200,  50,    FALSE, NULL, TRUE,  NULL, TRUE);

-- =====================================================
-- STEP 27: Batch Number Configuration
-- =====================================================
INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, include_operation_code, operation_code_length, separator, date_format, include_date, sequence_length, sequence_reset, priority, status, created_by) VALUES
('Default',          NULL,        NULL,            'B',      TRUE,  2, '-', 'yyyyMMdd', TRUE,  4, 'DAILY',   100, 'ACTIVE', 'SYSTEM'),
('Melting',          'MELTING',   NULL,            'MELT',   TRUE,  2, '-', 'yyyyMMdd', TRUE,  3, 'DAILY',   10,  'ACTIVE', 'SYSTEM'),
('Casting Slab',     'CASTING',   NULL,            'SLB',    TRUE,  2, '-', 'yyyyMMdd', TRUE,  3, 'DAILY',   10,  'ACTIVE', 'SYSTEM'),
('Casting Billet',   'CASTING',   'STEEL-BILLET-100','BLT',  FALSE, 0, '-', 'yyyyMMdd', TRUE,  3, 'DAILY',   5,   'ACTIVE', 'SYSTEM'),
('Hot Rolling',      'HOT_ROLLING',NULL,           'HR',     TRUE,  2, '-', 'yyyyMMdd', TRUE,  3, 'DAILY',   10,  'ACTIVE', 'SYSTEM'),
('Cold Rolling',     'COLD_ROLLING',NULL,          'CR',     TRUE,  2, '-', 'yyyyMMdd', TRUE,  3, 'DAILY',   10,  'ACTIVE', 'SYSTEM'),
('Bar Rolling',      'BAR_ROLLING',NULL,           'BAR',    TRUE,  2, '-', 'yyyyMMdd', TRUE,  3, 'DAILY',   10,  'ACTIVE', 'SYSTEM'),
('Rebar 10mm',       NULL,        'REBAR-10MM',    'RB10',   FALSE, 0, '-', 'yyyyMMdd', TRUE,  4, 'DAILY',   5,   'ACTIVE', 'SYSTEM'),
('Rebar 12mm',       NULL,        'REBAR-12MM',    'RB12',   FALSE, 0, '-', 'yyyyMMdd', TRUE,  4, 'DAILY',   5,   'ACTIVE', 'SYSTEM'),
('HR Coil 2mm',      NULL,        'HR-COIL-2MM',   'HRC2',   FALSE, 0, '-', 'yyyyMMdd', TRUE,  4, 'DAILY',   5,   'ACTIVE', 'SYSTEM'),
('CR Sheet 1mm',     NULL,        'CR-SHEET-1MM',  'CRS1',   FALSE, 0, '-', 'yyyyMMdd', TRUE,  4, 'DAILY',   5,   'ACTIVE', 'SYSTEM');

-- =====================================================
-- STEP 28: Operation Equipment Usage (sample records)
-- =====================================================
INSERT INTO operation_equipment_usage (operation_id, equipment_id, start_time, end_time, operator_id, status, created_by) VALUES
(1,  1,  '2026-01-15 06:00:00', '2026-01-15 10:00:00', 1, 'LOGGED', 'SYSTEM'),
(2,  1,  '2026-01-15 10:30:00', '2026-01-15 16:00:00', 1, 'LOGGED', 'SYSTEM'),
(3,  4,  '2026-01-15 16:30:00', '2026-01-15 19:00:00', 1, 'LOGGED', 'SYSTEM'),
(4,  6,  '2026-01-16 06:00:00', '2026-01-16 12:00:00', 3, 'LOGGED', 'SYSTEM'),
(5,  8,  '2026-01-17 06:00:00', '2026-01-17 09:00:00', 4, 'LOGGED', 'SYSTEM'),
(12, 2,  '2026-01-19 06:00:00', '2026-01-19 10:00:00', 1, 'LOGGED', 'SYSTEM'),
(13, 2,  '2026-01-19 10:30:00', '2026-01-19 17:00:00', 1, 'LOGGED', 'SYSTEM'),
(14, 4,  '2026-01-20 06:00:00', '2026-01-20 09:00:00', 1, 'LOGGED', 'SYSTEM'),
(15, 7,  '2026-01-20 10:00:00', '2026-01-20 18:00:00', 3, 'LOGGED', 'SYSTEM'),
(29, 13, '2026-02-08 06:00:00', NULL,                  5, 'ACTIVE', 'SYSTEM');

-- =====================================================
-- STEP 29: Inventory Movement (sample records)
-- =====================================================
INSERT INTO inventory_movement (operation_id, inventory_id, movement_type, quantity, timestamp, reason, status, created_by) VALUES
(2,  1,  'CONSUME',  105, '2026-01-15 10:30:00', 'Consumed for EAF melting', 'EXECUTED', 'OP-001'),
(2,  3,  'CONSUME',  30,  '2026-01-15 10:30:00', 'Consumed for EAF melting', 'EXECUTED', 'OP-001'),
(2,  4,  'CONSUME',  22,  '2026-01-15 10:30:00', 'Consumed for EAF melting', 'EXECUTED', 'OP-001'),
(2,  8,  'CONSUME',  15,  '2026-01-15 10:30:00', 'Consumed for EAF melting', 'EXECUTED', 'OP-001'),
(2,  19, 'PRODUCE',  165, '2026-01-15 16:00:00', 'Produced liquid steel',    'EXECUTED', 'OP-001'),
(4,  19, 'CONSUME',  155, '2026-01-16 06:00:00', 'Consumed for slab casting','EXECUTED', 'OP-003'),
(4,  20, 'PRODUCE',  148, '2026-01-16 12:00:00', 'Produced steel slab',      'EXECUTED', 'OP-003'),
(13, 2,  'CONSUME',  160, '2026-01-19 10:30:00', 'Consumed for rebar melt',  'EXECUTED', 'OP-001'),
(13, 22, 'PRODUCE',  205, '2026-01-19 17:00:00', 'Produced liquid steel',    'EXECUTED', 'OP-001'),
(15, 22, 'CONSUME',  200, '2026-01-20 10:00:00', 'Consumed for billet cast', 'EXECUTED', 'OP-003'),
(15, 23, 'PRODUCE',  195, '2026-01-20 18:00:00', 'Produced steel billet',    'EXECUTED', 'OP-003'),
(29, 22, 'CONSUME',  85,  '2026-02-08 06:00:00', 'Consumed for pickling',    'EXECUTED', 'OP-005');

-- =====================================================
-- Summary:
--   Customers:              12
--   Materials:              32 (15 RM, 10 IM, 4 WIP, 3 FG)
--   Products:                8
--   Operation Templates:    18
--   Processes:               6 (4 ACTIVE, 1 DRAFT, 1 INACTIVE)
--   Routing:                 4
--   Routing Steps:          22
--   BOM Nodes:              88 (8 trees - all products covered)
--   Equipment:              16
--   Operators:              12
--   Orders:                 15 (all statuses represented)
--   Order Line Items:       25
--   Operations:             60 (all statuses represented)
--   Batches:                56 (all statuses + WIP represented)
--   Inventory:              56 (all states + WIP represented)
--   Production Confirmations: 35
--   Batch Relations:        40
--   Hold Records:           12 (8 active, 4 released)
--   Audit Trail:           ~200 entries
--   Process Params Config:  29
--   Unit of Measure:        14
--   Unit Conversion:        16
--   Equipment Type Config:  13
--   Inventory Form Config:   9
--   Batch Number Config:    11
--   Operation Equipment Usage: 10
--   Inventory Movement:     12
-- =====================================================
