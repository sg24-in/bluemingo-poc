-- =====================================================
-- Patch 036: Demo Transactional Data Seeding
-- =====================================================
-- Purpose: Seeds orders, batches, inventory for demo/testing
-- Run AFTER patches 034 and 035 (master data and templates)
-- Operations are NOT created here - they are generated via service
-- =====================================================

-- =====================================================
-- SECTION 1: RAW MATERIAL BATCHES (For production consumption)
-- =====================================================
-- These batches are AVAILABLE for use in production

-- Scrap A Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0001', m.material_id, 500, 'T', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '30 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-SCRAP-A'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0001');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0002', m.material_id, 450, 'T', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '28 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-SCRAP-A'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0002');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0003', m.material_id, 600, 'T', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '25 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-SCRAP-A'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0003');

-- Scrap B Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0004', m.material_id, 800, 'T', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '30 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-SCRAP-B'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0004');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0005', m.material_id, 700, 'T', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '27 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-SCRAP-B'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0005');

-- Ferroalloys Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0006', m.material_id, 25000, 'KG', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '20 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-FESI'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0006');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0007', m.material_id, 30000, 'KG', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '18 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-FEMN'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0007');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0008', m.material_id, 15000, 'KG', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '15 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-FECR'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0008');

-- Limestone Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0009', m.material_id, 1000, 'T', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '25 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-LIMESTONE'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0009');

-- Aluminum Wire Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0010', m.material_id, 10000, 'KG', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '22 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-ALWIRE'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0010');

-- Calcium Wire Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0011', m.material_id, 5000, 'KG', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '20 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-CAWIRE'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0011');

-- Mold Powder Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0012', m.material_id, 15000, 'KG', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '18 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-MOLD-POWDER'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0012');

-- Lubricant Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0013', m.material_id, 10000, 'L', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '15 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-LUBRICANT'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0013');

-- HCl Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0014', m.material_id, 25000, 'L', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '12 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-HCL'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0014');

-- Zinc Batches
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0015', m.material_id, 25000, 'KG', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '10 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-ZINC'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0015');

-- Graphite Electrodes
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0016', m.material_id, 50, 'PC', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '30 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-GRAPHITE'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0016');

-- Industrial Gases
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0017', m.material_id, 50000, 'M3', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '5 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-OXYGEN'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0017');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'RCV-260201-0018', m.material_id, 25000, 'M3', 'AVAILABLE', 'RECEIPT', NOW() - INTERVAL '5 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'RM-ARGON'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'RCV-260201-0018');

-- =====================================================
-- SECTION 2: INTERMEDIATE MATERIAL BATCHES
-- =====================================================
-- Some WIP inventory for demo

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'CST-260201-0001', m.material_id, 120, 'T', 'AVAILABLE', 'PRODUCTION', NOW() - INTERVAL '10 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-SLAB-CS'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'CST-260201-0001');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'CST-260201-0002', m.material_id, 100, 'T', 'AVAILABLE', 'PRODUCTION', NOW() - INTERVAL '8 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-BILLET'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'CST-260201-0002');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'HRL-260201-0001', m.material_id, 115, 'T', 'AVAILABLE', 'PRODUCTION', NOW() - INTERVAL '7 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-HR-COIL'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'HRL-260201-0001');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'PKL-260201-0001', m.material_id, 50, 'T', 'AVAILABLE', 'PRODUCTION', NOW() - INTERVAL '5 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-PICKLED'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'PKL-260201-0001');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'CRL-260201-0001', m.material_id, 48, 'T', 'AVAILABLE', 'PRODUCTION', NOW() - INTERVAL '4 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'IM-CR-STRIP'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'CRL-260201-0001');

-- =====================================================
-- SECTION 3: FINISHED GOODS BATCHES
-- =====================================================
-- Some FG inventory for demo

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'FG-BATCH-001', m.material_id, 50, 'T', 'AVAILABLE', 'PRODUCTION', NOW() - INTERVAL '3 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'FG-HR-COIL-2MM'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'FG-BATCH-001');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'FG-BATCH-002', m.material_id, 30, 'T', 'AVAILABLE', 'PRODUCTION', NOW() - INTERVAL '2 days', 'SYSTEM'
FROM materials m WHERE m.material_code = 'FG-CR-SHEET-1MM'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'FG-BATCH-002');

INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'FG-BATCH-003', m.material_id, 100, 'T', 'AVAILABLE', 'PRODUCTION', NOW() - INTERVAL '1 day', 'SYSTEM'
FROM materials m WHERE m.material_code = 'FG-REBAR-10'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'FG-BATCH-003');

-- Quality Pending Batch (for testing quality workflow)
INSERT INTO batches (batch_number, material_id, quantity, unit, status, created_via, created_on, created_by)
SELECT 'FG-BATCH-004', m.material_id, 25, 'T', 'QUALITY_PENDING', 'PRODUCTION', NOW(), 'SYSTEM'
FROM materials m WHERE m.material_code = 'FG-HR-COIL-3MM'
AND NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'FG-BATCH-004');

-- =====================================================
-- SECTION 4: INVENTORY RECORDS
-- =====================================================
-- Link batches to inventory

-- Raw Material Inventory
INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'RM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Scrap Yard A', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'RM-SCRAP-A' AND b.batch_number = 'RCV-260201-0001'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'RM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Scrap Yard A', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'RM-SCRAP-A' AND b.batch_number = 'RCV-260201-0002'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'RM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Scrap Yard B', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'RM-SCRAP-A' AND b.batch_number = 'RCV-260201-0003'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'RM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Scrap Yard B', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'RM-SCRAP-B' AND b.batch_number = 'RCV-260201-0004'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'RM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Scrap Yard B', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'RM-SCRAP-B' AND b.batch_number = 'RCV-260201-0005'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'RM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Alloy Store', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'RM-FESI' AND b.batch_number = 'RCV-260201-0006'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'RM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Alloy Store', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'RM-FEMN' AND b.batch_number = 'RCV-260201-0007'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'RM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Flux Store', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'RM-LIMESTONE' AND b.batch_number = 'RCV-260201-0009'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

-- Intermediate Inventory
INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'IM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Slab Yard', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'IM-SLAB-CS' AND b.batch_number = 'CST-260201-0001'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'IM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Billet Yard', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'IM-BILLET' AND b.batch_number = 'CST-260201-0002'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'IM', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'Coil Yard A', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'IM-HR-COIL' AND b.batch_number = 'HRL-260201-0001'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

-- Finished Goods Inventory
INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'FG', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'FG Warehouse A', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'FG-HR-COIL-2MM' AND b.batch_number = 'FG-BATCH-001'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'FG', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'FG Warehouse A', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'FG-CR-SHEET-1MM' AND b.batch_number = 'FG-BATCH-002'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

INSERT INTO inventory (material_id, inventory_type, state, quantity, unit, batch_id, location, created_on, created_by)
SELECT m.material_id, 'FG', 'AVAILABLE', b.quantity, b.unit, b.batch_id, 'FG Warehouse B', NOW(), 'SYSTEM'
FROM materials m
JOIN batches b ON b.material_id = m.material_id
WHERE m.material_code = 'FG-REBAR-10' AND b.batch_number = 'FG-BATCH-003'
AND NOT EXISTS (SELECT 1 FROM inventory i WHERE i.batch_id = b.batch_id);

-- =====================================================
-- SECTION 5: ORDERS (45 orders)
-- =====================================================
-- Orders in CREATED state - ready for operation instantiation

-- Order 1-10: HR Coil orders
INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0001', c.customer_id, NOW() - INTERVAL '10 days', NOW() + INTERVAL '20 days', 'CREATED', 'Hot rolled coil order - standard delivery', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-001'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0001');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0002', c.customer_id, NOW() - INTERVAL '9 days', NOW() + INTERVAL '21 days', 'CREATED', 'HR coil urgent order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-002'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0002');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0003', c.customer_id, NOW() - INTERVAL '8 days', NOW() + INTERVAL '22 days', 'CREATED', 'Regular HR coil order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-003'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0003');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0004', c.customer_id, NOW() - INTERVAL '7 days', NOW() + INTERVAL '23 days', 'CREATED', 'Large HR coil order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-004'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0004');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0005', c.customer_id, NOW() - INTERVAL '6 days', NOW() + INTERVAL '24 days', 'CREATED', 'Mixed HR coil thickness order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-005'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0005');

-- Order 6-15: CR Sheet orders
INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0006', c.customer_id, NOW() - INTERVAL '5 days', NOW() + INTERVAL '25 days', 'CREATED', 'Cold rolled sheet order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-006'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0006');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0007', c.customer_id, NOW() - INTERVAL '4 days', NOW() + INTERVAL '26 days', 'CREATED', 'CR sheet urgent delivery', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-007'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0007');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0008', c.customer_id, NOW() - INTERVAL '3 days', NOW() + INTERVAL '27 days', 'CREATED', 'Standard CR sheet order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-008'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0008');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0009', c.customer_id, NOW() - INTERVAL '2 days', NOW() + INTERVAL '28 days', 'CREATED', 'Mixed CR thickness order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-009'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0009');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0010', c.customer_id, NOW() - INTERVAL '1 day', NOW() + INTERVAL '29 days', 'CREATED', 'CR sheet export order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-010'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0010');

-- Order 11-20: Rebar orders
INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0011', c.customer_id, NOW() - INTERVAL '10 days', NOW() + INTERVAL '15 days', 'CREATED', 'Rebar construction project order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-006'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0011');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0012', c.customer_id, NOW() - INTERVAL '9 days', NOW() + INTERVAL '16 days', 'CREATED', 'Rebar urgent infrastructure order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-001'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0012');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0013', c.customer_id, NOW() - INTERVAL '8 days', NOW() + INTERVAL '17 days', 'CREATED', 'Mixed rebar sizes order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-002'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0013');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0014', c.customer_id, NOW() - INTERVAL '7 days', NOW() + INTERVAL '18 days', 'CREATED', 'Large rebar order for building', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-003'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0014');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0015', c.customer_id, NOW() - INTERVAL '6 days', NOW() + INTERVAL '19 days', 'CREATED', 'Rebar for bridge project', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-004'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0015');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0016', c.customer_id, NOW() - INTERVAL '5 days', NOW() + INTERVAL '20 days', 'CREATED', 'Rebar export order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-008'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0016');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0017', c.customer_id, NOW() - INTERVAL '4 days', NOW() + INTERVAL '21 days', 'CREATED', 'Standard rebar order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-009'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0017');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0018', c.customer_id, NOW() - INTERVAL '3 days', NOW() + INTERVAL '22 days', 'CREATED', 'Rebar domestic order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-010'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0018');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0019', c.customer_id, NOW() - INTERVAL '2 days', NOW() + INTERVAL '23 days', 'CREATED', 'Quick rebar delivery', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-005'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0019');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0020', c.customer_id, NOW() - INTERVAL '1 day', NOW() + INTERVAL '24 days', 'CREATED', 'Rebar special grade order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-006'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0020');

-- Order 21-30: Mixed product orders
INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0021', c.customer_id, NOW(), NOW() + INTERVAL '25 days', 'CREATED', 'Galvanized sheet order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-001'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0021');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0022', c.customer_id, NOW(), NOW() + INTERVAL '26 days', 'CREATED', 'Wire rod order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-002'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0022');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0023', c.customer_id, NOW(), NOW() + INTERVAL '27 days', 'CREATED', 'Steel billet order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-003'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0023');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0024', c.customer_id, NOW(), NOW() + INTERVAL '28 days', 'CREATED', 'Steel plate order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-004'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0024');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0025', c.customer_id, NOW(), NOW() + INTERVAL '29 days', 'CREATED', 'Structural steel order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-005'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0025');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0026', c.customer_id, NOW(), NOW() + INTERVAL '30 days', 'CREATED', 'Mixed flat products order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-006'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0026');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0027', c.customer_id, NOW(), NOW() + INTERVAL '31 days', 'CREATED', 'Mixed long products order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-007'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0027');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0028', c.customer_id, NOW(), NOW() + INTERVAL '32 days', 'CREATED', 'Large bulk order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-008'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0028');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0029', c.customer_id, NOW(), NOW() + INTERVAL '33 days', 'CREATED', 'Export shipment order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-009'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0029');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0030', c.customer_id, NOW(), NOW() + INTERVAL '34 days', 'CREATED', 'Domestic distribution order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-010'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0030');

-- Order 31-45: Additional orders for volume
INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0031', c.customer_id, NOW(), NOW() + INTERVAL '35 days', 'CREATED', 'Repeat customer order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-001'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0031');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0032', c.customer_id, NOW(), NOW() + INTERVAL '36 days', 'CREATED', 'Standard production order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-002'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0032');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0033', c.customer_id, NOW(), NOW() + INTERVAL '37 days', 'CREATED', 'Express delivery order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-003'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0033');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0034', c.customer_id, NOW(), NOW() + INTERVAL '38 days', 'CREATED', 'Quarterly contract order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-004'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0034');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0035', c.customer_id, NOW(), NOW() + INTERVAL '39 days', 'CREATED', 'Annual supply order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-005'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0035');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0036', c.customer_id, NOW(), NOW() + INTERVAL '40 days', 'CREATED', 'Project supply order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-006'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0036');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0037', c.customer_id, NOW(), NOW() + INTERVAL '41 days', 'CREATED', 'Stock replenishment order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-007'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0037');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0038', c.customer_id, NOW(), NOW() + INTERVAL '42 days', 'CREATED', 'Emergency order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-008'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0038');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0039', c.customer_id, NOW(), NOW() + INTERVAL '43 days', 'CREATED', 'Spot market order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-009'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0039');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0040', c.customer_id, NOW(), NOW() + INTERVAL '44 days', 'CREATED', 'Sample production order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-010'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0040');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0041', c.customer_id, NOW(), NOW() + INTERVAL '45 days', 'CREATED', 'Trial order for new product', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-001'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0041');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0042', c.customer_id, NOW(), NOW() + INTERVAL '46 days', 'CREATED', 'Certification batch order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-002'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0042');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0043', c.customer_id, NOW(), NOW() + INTERVAL '47 days', 'CREATED', 'Quality test order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-003'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0043');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0044', c.customer_id, NOW(), NOW() + INTERVAL '48 days', 'CREATED', 'Endurance test order', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-004'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0044');

INSERT INTO orders (order_number, customer_id, order_date, due_date, status, notes, created_on, created_by)
SELECT 'ORD-2026-0045', c.customer_id, NOW(), NOW() + INTERVAL '49 days', 'CREATED', 'Final batch for demo', NOW(), 'SYSTEM'
FROM customers c WHERE c.customer_code = 'CUST-005'
AND NOT EXISTS (SELECT 1 FROM orders WHERE order_number = 'ORD-2026-0045');

-- =====================================================
-- SECTION 6: ORDER LINE ITEMS (1-3 per order)
-- =====================================================
-- NOTE: Operations will be created by OperationInstantiationService
-- when the order is processed, NOT by this SQL script

-- Order 1-5: HR Coil line items
INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-2MM', 100, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0001'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-3MM', 80, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0002'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-3MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-5MM', 120, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0003'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-5MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-2MM', 200, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0004'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-2MM');

-- Order 5 has multiple line items
INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-2MM', 50, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0005'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-3MM', 50, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0005'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-3MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-5MM', 50, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0005'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-5MM');

-- Order 6-10: CR Sheet line items
INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-1MM', 40, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0006'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-1MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-2MM', 60, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0007'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-1MM', 80, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0008'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-1MM');

-- Order 9 multiple line items
INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-1MM', 30, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0009'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-1MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-2MM', 40, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0009'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-1MM', 100, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0010'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-1MM');

-- Order 11-20: Rebar line items
INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-10', 150, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0011'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-16', 200, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0012'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-16');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-10', 100, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0013'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-16', 100, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0013'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-16');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-20', 300, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0014'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-20');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-10', 200, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0015'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-16', 150, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0016'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-16');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-20', 180, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0017'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-20');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-10', 120, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0018'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-10', 80, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0019'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-16', 80, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0019'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-16');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-20', 100, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0020'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-20');

-- Order 21-30: Mixed products
INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-GALV-SHEET', 60, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0021'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-GALV-SHEET');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-WIRE-ROD-6', 100, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0022'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-WIRE-ROD-6');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-BILLET-100', 200, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0023'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-BILLET-100');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-PLATE-10', 80, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0024'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-PLATE-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-ANGLE-50', 50, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0025'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-ANGLE-50');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-2MM', 50, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0026'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-1MM', 30, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0026'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-1MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-10', 100, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0027'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-WIRE-ROD-6', 60, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0027'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-WIRE-ROD-6');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-2MM', 150, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0028'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-16', 200, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0028'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-16');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-1MM', 100, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0029'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-1MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-3MM', 80, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0030'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-3MM');

-- Orders 31-45: Additional line items (1-2 per order)
INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-2MM', 75, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0031'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-2MM', 45, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0032'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-10', 90, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0033'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-GALV-SHEET', 55, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0034'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-GALV-SHEET');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-WIRE-ROD-8', 70, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0035'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-WIRE-ROD-8');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-BILLET-100', 120, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0036'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-BILLET-100');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-PLATE-6', 40, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0037'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-PLATE-6');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-5MM', 85, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0038'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-5MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-20', 110, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0039'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-20');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-1MM', 25, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0040'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-1MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-2MM', 30, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0041'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-2MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-GALV-SHEET', 35, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0042'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-GALV-SHEET');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-REBAR-10', 65, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0043'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-REBAR-10');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-WIRE-ROD-6', 55, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0044'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-WIRE-ROD-6');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-HR-COIL-3MM', 50, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0045'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-HR-COIL-3MM');

INSERT INTO order_line_items (order_id, product_sku, quantity, unit, status, created_on, created_by)
SELECT o.order_id, 'PROD-CR-SHEET-2MM', 40, 'T', 'CREATED', NOW(), 'SYSTEM'
FROM orders o WHERE o.order_number = 'ORD-2026-0045'
AND NOT EXISTS (SELECT 1 FROM order_line_items oli WHERE oli.order_id = o.order_id AND oli.product_sku = 'PROD-CR-SHEET-2MM');
