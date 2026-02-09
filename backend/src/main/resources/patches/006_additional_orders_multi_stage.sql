-- Patch 006: Add 30 additional orders with multi-stage products (IDs 16-45)
-- Includes 15 multi-stage orders, 4 mixed orders, 11 single-stage orders
-- Multi-stage order types:
--   HR->CR: Hot Rolled Coil (Process 1, 8 ops) feeds into Cold Rolled Sheet (Process 2, 3 ops)
--   Billet->Rebar: Steel Billet (Process 4, 4 ops) feeds into Rebar (Process 3, 7 ops)
--   Full Pipeline: HR Coil + CR Sheet + Rebar across 3 processes
--   Triple Process: Billet + HR Coil + CR Sheet across 3 processes
--   Full Pipeline 4-Stage: All 4 processes
--   Mixed: Multiple products from same process
-- Idempotent: Uses INSERT...SELECT...WHERE NOT EXISTS guard per table section

-- =====================================================
-- ORDERS (30 new, IDs 16-45)
-- =====================================================
INSERT INTO orders (order_id, order_number, customer_id, customer_name, order_date, status, created_by)
SELECT v.* FROM (VALUES
  (16::bigint, 'ORD-2026-016', 'CUST-005', 'Asian Electronics Inc', '2026-02-06'::date, 'IN_PROGRESS', 'SYSTEM'),
  (17, 'ORD-2026-017', 'CUST-011', 'Oceanic Metals Ltd', '2026-02-06'::date, 'IN_PROGRESS', 'SYSTEM'),
  (18, 'ORD-2026-018', 'CUST-009', 'South American Steel SA', '2026-02-06'::date, 'COMPLETED', 'SYSTEM'),
  (19, 'ORD-2026-019', 'CUST-005', 'Asian Electronics Inc', '2026-02-07'::date, 'IN_PROGRESS', 'SYSTEM'),
  (20, 'ORD-2026-020', 'CUST-005', 'Asian Electronics Inc', '2026-02-07'::date, 'CREATED', 'SYSTEM'),
  (21, 'ORD-2026-021', 'CUST-002', 'Global Manufacturing Ltd', '2026-02-07'::date, 'IN_PROGRESS', 'SYSTEM'),
  (22, 'ORD-2026-022', 'CUST-001', 'ABC Steel Corporation', '2026-02-08'::date, 'BLOCKED', 'SYSTEM'),
  (23, 'ORD-2026-023', 'CUST-001', 'ABC Steel Corporation', '2026-02-08'::date, 'ON_HOLD', 'SYSTEM'),
  (24, 'ORD-2026-024', 'CUST-008', 'Middle East Metals FZE', '2026-02-08'::date, 'IN_PROGRESS', 'SYSTEM'),
  (25, 'ORD-2026-025', 'CUST-003', 'Pacific Metal Works', '2026-02-09'::date, 'CANCELLED', 'SYSTEM'),
  (26, 'ORD-2026-026', 'CUST-005', 'Asian Electronics Inc', '2026-02-09'::date, 'CREATED', 'SYSTEM'),
  (27, 'ORD-2026-027', 'CUST-002', 'Global Manufacturing Ltd', '2026-02-09'::date, 'CREATED', 'SYSTEM'),
  (28, 'ORD-2026-028', 'CUST-003', 'Pacific Metal Works', '2026-02-10'::date, 'ON_HOLD', 'SYSTEM'),
  (29, 'ORD-2026-029', 'CUST-004', 'European Auto Parts GmbH', '2026-02-10'::date, 'COMPLETED', 'SYSTEM'),
  (30, 'ORD-2026-030', 'CUST-006', 'BuildRight Construction', '2026-02-10'::date, 'COMPLETED', 'SYSTEM'),
  (31, 'ORD-2026-031', 'CUST-004', 'European Auto Parts GmbH', '2026-02-11'::date, 'CREATED', 'SYSTEM'),
  (32, 'ORD-2026-032', 'CUST-010', 'African Mining Corp', '2026-02-11'::date, 'ON_HOLD', 'SYSTEM'),
  (33, 'ORD-2026-033', 'CUST-005', 'Asian Electronics Inc', '2026-02-11'::date, 'IN_PROGRESS', 'SYSTEM'),
  (34, 'ORD-2026-034', 'CUST-011', 'Oceanic Metals Ltd', '2026-02-12'::date, 'CANCELLED', 'SYSTEM'),
  (35, 'ORD-2026-035', 'CUST-008', 'Middle East Metals FZE', '2026-02-12'::date, 'CREATED', 'SYSTEM'),
  (36, 'ORD-2026-036', 'CUST-005', 'Asian Electronics Inc', '2026-02-12'::date, 'CREATED', 'SYSTEM'),
  (37, 'ORD-2026-037', 'CUST-007', 'Nordic Steel Trading AB', '2026-02-13'::date, 'COMPLETED', 'SYSTEM'),
  (38, 'ORD-2026-038', 'CUST-007', 'Nordic Steel Trading AB', '2026-02-13'::date, 'IN_PROGRESS', 'SYSTEM'),
  (39, 'ORD-2026-039', 'CUST-009', 'South American Steel SA', '2026-02-13'::date, 'COMPLETED', 'SYSTEM'),
  (40, 'ORD-2026-040', 'CUST-008', 'Middle East Metals FZE', '2026-02-14'::date, 'CREATED', 'SYSTEM'),
  (41, 'ORD-2026-041', 'CUST-004', 'European Auto Parts GmbH', '2026-02-14'::date, 'CREATED', 'SYSTEM'),
  (42, 'ORD-2026-042', 'CUST-004', 'European Auto Parts GmbH', '2026-02-14'::date, 'CREATED', 'SYSTEM'),
  (43, 'ORD-2026-043', 'CUST-011', 'Oceanic Metals Ltd', '2026-02-15'::date, 'COMPLETED', 'SYSTEM'),
  (44, 'ORD-2026-044', 'CUST-009', 'South American Steel SA', '2026-02-15'::date, 'IN_PROGRESS', 'SYSTEM'),
  (45, 'ORD-2026-045', 'CUST-002', 'Global Manufacturing Ltd', '2026-02-15'::date, 'CREATED', 'SYSTEM')
) AS v(order_id, order_number, customer_id, customer_name, order_date, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_id = 16);

-- =====================================================
-- ORDER LINE ITEMS (57 new, IDs 26-82)
-- Note: Line items for CANCELLED orders use CREATED status (no CANCELLED in line item constraint)
-- =====================================================
INSERT INTO order_line_items (order_line_id, order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by)
SELECT v.* FROM (VALUES
  -- Single-stage orders (IDs 16-25)
  (26::bigint, 16::bigint, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 110::numeric, 'T', '2026-02-26'::date, 'IN_PROGRESS', 'SYSTEM'),
  (27, 17, 'HR-COIL-3MM', 'Hot Rolled Coil 3mm', 170::numeric, 'T', '2026-03-21'::date, 'IN_PROGRESS', 'SYSTEM'),
  (28, 18, 'HR-COIL-4MM', 'Hot Rolled Coil 4mm', 190::numeric, 'T', '2026-03-08'::date, 'COMPLETED', 'SYSTEM'),
  (29, 19, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 60::numeric, 'T', '2026-03-09'::date, 'IN_PROGRESS', 'SYSTEM'),
  (30, 20, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 60::numeric, 'T', '2026-03-14'::date, 'CREATED', 'SYSTEM'),
  (31, 21, 'REBAR-10MM', 'Reinforcement Bar 10mm', 190::numeric, 'T', '2026-03-08'::date, 'IN_PROGRESS', 'SYSTEM'),
  (32, 22, 'REBAR-12MM', 'Reinforcement Bar 12mm', 250::numeric, 'T', '2026-03-16'::date, 'BLOCKED', 'SYSTEM'),
  (33, 23, 'STEEL-BILLET-100', 'Steel Billet 100mm', 500::numeric, 'T', '2026-03-13'::date, 'ON_HOLD', 'SYSTEM'),
  (34, 24, 'REBAR-10MM', 'Reinforcement Bar 10mm', 190::numeric, 'T', '2026-03-16'::date, 'IN_PROGRESS', 'SYSTEM'),
  (35, 25, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 240::numeric, 'T', '2026-03-12'::date, 'CREATED', 'SYSTEM'),
  -- Multi-stage HR->CR orders (IDs 26-29)
  (36, 26, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 140::numeric, 'T', '2026-03-06'::date, 'CREATED', 'SYSTEM'),
  (37, 26, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 110::numeric, 'T', '2026-03-25'::date, 'CREATED', 'SYSTEM'),
  (38, 27, 'HR-COIL-3MM', 'Hot Rolled Coil 3mm', 100::numeric, 'T', '2026-03-05'::date, 'CREATED', 'SYSTEM'),
  (39, 27, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 120::numeric, 'T', '2026-03-12'::date, 'CREATED', 'SYSTEM'),
  (40, 28, 'HR-COIL-4MM', 'Hot Rolled Coil 4mm', 170::numeric, 'T', '2026-03-17'::date, 'ON_HOLD', 'SYSTEM'),
  (41, 28, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 110::numeric, 'T', '2026-03-28'::date, 'ON_HOLD', 'SYSTEM'),
  (42, 29, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 120::numeric, 'T', '2026-03-09'::date, 'COMPLETED', 'SYSTEM'),
  (43, 29, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 80::numeric, 'T', '2026-03-28'::date, 'COMPLETED', 'SYSTEM'),
  -- Multi-stage Billet->Rebar orders (IDs 30-32)
  (44, 30, 'STEEL-BILLET-100', 'Steel Billet 100mm', 220::numeric, 'T', '2026-03-28'::date, 'COMPLETED', 'SYSTEM'),
  (45, 30, 'REBAR-10MM', 'Reinforcement Bar 10mm', 180::numeric, 'T', '2026-03-28'::date, 'COMPLETED', 'SYSTEM'),
  (46, 31, 'STEEL-BILLET-100', 'Steel Billet 100mm', 360::numeric, 'T', '2026-03-28'::date, 'CREATED', 'SYSTEM'),
  (47, 31, 'REBAR-12MM', 'Reinforcement Bar 12mm', 310::numeric, 'T', '2026-03-19'::date, 'CREATED', 'SYSTEM'),
  (48, 32, 'STEEL-BILLET-100', 'Steel Billet 100mm', 180::numeric, 'T', '2026-03-12'::date, 'ON_HOLD', 'SYSTEM'),
  (49, 32, 'REBAR-10MM', 'Reinforcement Bar 10mm', 120::numeric, 'T', '2026-03-12'::date, 'ON_HOLD', 'SYSTEM'),
  -- Multi-stage Full Pipeline orders (IDs 33-34)
  (50, 33, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 160::numeric, 'T', '2026-03-22'::date, 'IN_PROGRESS', 'SYSTEM'),
  (51, 33, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 110::numeric, 'T', '2026-03-16'::date, 'IN_PROGRESS', 'SYSTEM'),
  (52, 33, 'REBAR-10MM', 'Reinforcement Bar 10mm', 260::numeric, 'T', '2026-03-14'::date, 'IN_PROGRESS', 'SYSTEM'),
  (53, 34, 'HR-COIL-3MM', 'Hot Rolled Coil 3mm', 90::numeric, 'T', '2026-03-16'::date, 'CREATED', 'SYSTEM'),
  (54, 34, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 80::numeric, 'T', '2026-03-16'::date, 'CREATED', 'SYSTEM'),
  (55, 34, 'REBAR-12MM', 'Reinforcement Bar 12mm', 140::numeric, 'T', '2026-03-14'::date, 'CREATED', 'SYSTEM'),
  -- Multi-stage Triple Process order (ID 35)
  (56, 35, 'STEEL-BILLET-100', 'Steel Billet 100mm', 340::numeric, 'T', '2026-03-04'::date, 'CREATED', 'SYSTEM'),
  (57, 35, 'HR-COIL-4MM', 'Hot Rolled Coil 4mm', 150::numeric, 'T', '2026-03-28'::date, 'CREATED', 'SYSTEM'),
  (58, 35, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 120::numeric, 'T', '2026-03-07'::date, 'CREATED', 'SYSTEM'),
  -- Mixed orders (IDs 36-38)
  (59, 36, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 70::numeric, 'T', '2026-03-28'::date, 'CREATED', 'SYSTEM'),
  (60, 36, 'HR-COIL-3MM', 'Hot Rolled Coil 3mm', 110::numeric, 'T', '2026-03-06'::date, 'CREATED', 'SYSTEM'),
  (61, 37, 'REBAR-10MM', 'Reinforcement Bar 10mm', 130::numeric, 'T', '2026-03-12'::date, 'COMPLETED', 'SYSTEM'),
  (62, 37, 'REBAR-12MM', 'Reinforcement Bar 12mm', 170::numeric, 'T', '2026-03-14'::date, 'COMPLETED', 'SYSTEM'),
  (63, 38, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 50::numeric, 'T', '2026-03-13'::date, 'IN_PROGRESS', 'SYSTEM'),
  (64, 38, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 70::numeric, 'T', '2026-03-24'::date, 'IN_PROGRESS', 'SYSTEM'),
  -- Multi-stage Heavy HR->CR order (ID 39)
  (65, 39, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 220::numeric, 'T', '2026-03-15'::date, 'COMPLETED', 'SYSTEM'),
  (66, 39, 'HR-COIL-4MM', 'Hot Rolled Coil 4mm', 180::numeric, 'T', '2026-03-13'::date, 'COMPLETED', 'SYSTEM'),
  (67, 39, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 170::numeric, 'T', '2026-03-28'::date, 'COMPLETED', 'SYSTEM'),
  -- Multi-stage HR->CR orders (IDs 40-41)
  (68, 40, 'HR-COIL-3MM', 'Hot Rolled Coil 3mm', 120::numeric, 'T', '2026-03-21'::date, 'CREATED', 'SYSTEM'),
  (69, 40, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 90::numeric, 'T', '2026-03-16'::date, 'CREATED', 'SYSTEM'),
  (70, 41, 'STEEL-BILLET-100', 'Steel Billet 100mm', 380::numeric, 'T', '2026-03-18'::date, 'CREATED', 'SYSTEM'),
  (71, 41, 'REBAR-12MM', 'Reinforcement Bar 12mm', 340::numeric, 'T', '2026-03-15'::date, 'CREATED', 'SYSTEM'),
  -- Multi-stage Full Pipeline 4-Stage order (ID 42)
  (72, 42, 'STEEL-BILLET-100', 'Steel Billet 100mm', 110::numeric, 'T', '2026-03-27'::date, 'CREATED', 'SYSTEM'),
  (73, 42, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 110::numeric, 'T', '2026-03-06'::date, 'CREATED', 'SYSTEM'),
  (74, 42, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 80::numeric, 'T', '2026-03-22'::date, 'CREATED', 'SYSTEM'),
  (75, 42, 'REBAR-10MM', 'Reinforcement Bar 10mm', 120::numeric, 'T', '2026-03-28'::date, 'CREATED', 'SYSTEM'),
  -- Mixed order (ID 43)
  (76, 43, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 100::numeric, 'T', '2026-03-28'::date, 'COMPLETED', 'SYSTEM'),
  (77, 43, 'HR-COIL-3MM', 'Hot Rolled Coil 3mm', 70::numeric, 'T', '2026-03-22'::date, 'COMPLETED', 'SYSTEM'),
  (78, 43, 'HR-COIL-4MM', 'Hot Rolled Coil 4mm', 80::numeric, 'T', '2026-03-28'::date, 'COMPLETED', 'SYSTEM'),
  -- Multi-stage Billet+Rebar+CR order (ID 44)
  (79, 44, 'STEEL-BILLET-100', 'Steel Billet 100mm', 250::numeric, 'T', '2026-03-17'::date, 'IN_PROGRESS', 'SYSTEM'),
  (80, 44, 'REBAR-12MM', 'Reinforcement Bar 12mm', 170::numeric, 'T', '2026-03-28'::date, 'IN_PROGRESS', 'SYSTEM'),
  (81, 44, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 80::numeric, 'T', '2026-03-28'::date, 'IN_PROGRESS', 'SYSTEM'),
  -- Single-stage order (ID 45)
  (82, 45, 'STEEL-BILLET-100', 'Steel Billet 100mm', 470::numeric, 'T', '2026-03-08'::date, 'CREATED', 'SYSTEM')
) AS v(order_line_id, order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM order_line_items WHERE order_line_id = 26);

-- =====================================================
-- OPERATIONS (332 new, IDs 94-425)
-- Split into multiple INSERT blocks for readability
-- =====================================================

-- Operations for single-stage orders (line items 26-35)
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT v.* FROM (VALUES
  -- Order 16, Line 26: HR-COIL-2MM (Process 1, 8 ops)
  (94::bigint, 1::bigint, 26::bigint, 1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 110::numeric, 'SYSTEM'),
  (95, 1, 26, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (96, 1, 26, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (97, 1, 26, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (98, 1, 26, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (99, 1, 26, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (100, 1, 26, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (101, 1, 26, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  -- Order 17, Line 27: HR-COIL-3MM (Process 1, 8 ops)
  (102, 1, 27, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (103, 1, 27, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (104, 1, 27, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (105, 1, 27, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'READY', 170::numeric, 'SYSTEM'),
  (106, 1, 27, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (107, 1, 27, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (108, 1, 27, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (109, 1, 27, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  -- Order 18, Line 28: HR-COIL-4MM (Process 1, 8 ops) - COMPLETED
  (110, 1, 28, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (111, 1, 28, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (112, 1, 28, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (113, 1, 28, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (114, 1, 28, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (115, 1, 28, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (116, 1, 28, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (117, 1, 28, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  -- Order 19, Line 29: CR-SHEET-1MM (Process 2, 3 ops)
  (118, 2, 29, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'CONFIRMED', 60::numeric, 'SYSTEM'),
  (119, 2, 29, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'READY', 60::numeric, 'SYSTEM'),
  (120, 2, 29, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 60::numeric, 'SYSTEM'),
  -- Order 20, Line 30: CR-SHEET-2MM (Process 2, 3 ops)
  (121, 2, 30, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 60::numeric, 'SYSTEM'),
  (122, 2, 30, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 60::numeric, 'SYSTEM'),
  (123, 2, 30, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 60::numeric, 'SYSTEM'),
  -- Order 21, Line 31: REBAR-10MM (Process 3, 7 ops)
  (124, 3, 31, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (125, 3, 31, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'READY', 190::numeric, 'SYSTEM'),
  (126, 3, 31, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 190::numeric, 'SYSTEM'),
  (127, 3, 31, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 190::numeric, 'SYSTEM'),
  (128, 3, 31, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 190::numeric, 'SYSTEM'),
  (129, 3, 31, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 190::numeric, 'SYSTEM'),
  (130, 3, 31, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 190::numeric, 'SYSTEM'),
  -- Order 22, Line 32: REBAR-12MM (Process 3, 7 ops) - BLOCKED
  (131, 3, 32, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'BLOCKED', 250::numeric, 'SYSTEM'),
  (132, 3, 32, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 250::numeric, 'SYSTEM'),
  (133, 3, 32, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 250::numeric, 'SYSTEM'),
  (134, 3, 32, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 250::numeric, 'SYSTEM'),
  (135, 3, 32, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 250::numeric, 'SYSTEM'),
  (136, 3, 32, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 250::numeric, 'SYSTEM'),
  (137, 3, 32, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 250::numeric, 'SYSTEM'),
  -- Order 23, Line 33: STEEL-BILLET-100 (Process 4, 4 ops) - ON_HOLD
  (138, 4, 33, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'ON_HOLD', 500::numeric, 'SYSTEM'),
  (139, 4, 33, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 500::numeric, 'SYSTEM'),
  (140, 4, 33, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 500::numeric, 'SYSTEM'),
  (141, 4, 33, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 500::numeric, 'SYSTEM'),
  -- Order 24, Line 34: REBAR-10MM (Process 3, 7 ops)
  (142, 3, 34, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (143, 3, 34, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (144, 3, 34, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (145, 3, 34, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (146, 3, 34, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'CONFIRMED', 190::numeric, 'SYSTEM'),
  (147, 3, 34, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'READY', 190::numeric, 'SYSTEM'),
  (148, 3, 34, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 190::numeric, 'SYSTEM'),
  -- Order 25, Line 35: HR-COIL-2MM (Process 1, 8 ops) - CANCELLED order
  (149, 1, 35, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'NOT_STARTED', 240::numeric, 'SYSTEM'),
  (150, 1, 35, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 240::numeric, 'SYSTEM'),
  (151, 1, 35, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 240::numeric, 'SYSTEM'),
  (152, 1, 35, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 240::numeric, 'SYSTEM'),
  (153, 1, 35, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 240::numeric, 'SYSTEM'),
  (154, 1, 35, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 240::numeric, 'SYSTEM'),
  (155, 1, 35, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 240::numeric, 'SYSTEM'),
  (156, 1, 35, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 240::numeric, 'SYSTEM')
) AS v(operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE operation_id = 94);

-- Operations for multi-stage HR->CR orders (line items 36-43)
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT v.* FROM (VALUES
  -- Order 26, Line 36: HR-COIL-2MM (Process 1, 8 ops)
  (157::bigint, 1::bigint, 36::bigint, 1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 140::numeric, 'SYSTEM'),
  (158, 1, 36, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (159, 1, 36, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (160, 1, 36, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (161, 1, 36, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (162, 1, 36, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (163, 1, 36, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (164, 1, 36, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  -- Order 26, Line 37: CR-SHEET-1MM (Process 2, 3 ops)
  (165, 2, 37, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 110::numeric, 'SYSTEM'),
  (166, 2, 37, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (167, 2, 37, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  -- Order 27, Line 38: HR-COIL-3MM (Process 1, 8 ops)
  (168, 1, 38, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 100::numeric, 'SYSTEM'),
  (169, 1, 38, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 100::numeric, 'SYSTEM'),
  (170, 1, 38, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 100::numeric, 'SYSTEM'),
  (171, 1, 38, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 100::numeric, 'SYSTEM'),
  (172, 1, 38, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 100::numeric, 'SYSTEM'),
  (173, 1, 38, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 100::numeric, 'SYSTEM'),
  (174, 1, 38, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 100::numeric, 'SYSTEM'),
  (175, 1, 38, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 100::numeric, 'SYSTEM'),
  -- Order 27, Line 39: CR-SHEET-2MM (Process 2, 3 ops)
  (176, 2, 39, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 120::numeric, 'SYSTEM'),
  (177, 2, 39, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (178, 2, 39, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  -- Order 28, Line 40: HR-COIL-4MM (Process 1, 8 ops) - ON_HOLD
  (179, 1, 40, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'ON_HOLD', 170::numeric, 'SYSTEM'),
  (180, 1, 40, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (181, 1, 40, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (182, 1, 40, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (183, 1, 40, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (184, 1, 40, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (185, 1, 40, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (186, 1, 40, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  -- Order 28, Line 41: CR-SHEET-1MM (Process 2, 3 ops) - ON_HOLD
  (187, 2, 41, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'ON_HOLD', 110::numeric, 'SYSTEM'),
  (188, 2, 41, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (189, 2, 41, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  -- Order 29, Line 42: HR-COIL-2MM (Process 1, 8 ops) - COMPLETED
  (190, 1, 42, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 120::numeric, 'SYSTEM'),
  (191, 1, 42, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 120::numeric, 'SYSTEM'),
  (192, 1, 42, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 120::numeric, 'SYSTEM'),
  (193, 1, 42, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 120::numeric, 'SYSTEM'),
  (194, 1, 42, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 120::numeric, 'SYSTEM'),
  (195, 1, 42, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 120::numeric, 'SYSTEM'),
  (196, 1, 42, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 120::numeric, 'SYSTEM'),
  (197, 1, 42, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 120::numeric, 'SYSTEM'),
  -- Order 29, Line 43: CR-SHEET-2MM (Process 2, 3 ops) - COMPLETED
  (198, 2, 43, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (199, 2, 43, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (200, 2, 43, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'CONFIRMED', 80::numeric, 'SYSTEM')
) AS v(operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE operation_id = 157);

-- Operations for multi-stage Billet->Rebar orders (line items 44-49)
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT v.* FROM (VALUES
  -- Order 30, Line 44: STEEL-BILLET-100 (Process 4, 4 ops) - COMPLETED
  (201::bigint, 4::bigint, 44::bigint, 1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (202, 4, 44, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (203, 4, 44, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (204, 4, 44, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  -- Order 30, Line 45: REBAR-10MM (Process 3, 7 ops) - COMPLETED
  (205, 3, 45, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (206, 3, 45, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (207, 3, 45, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (208, 3, 45, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (209, 3, 45, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (210, 3, 45, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (211, 3, 45, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  -- Order 31, Line 46: STEEL-BILLET-100 (Process 4, 4 ops)
  (212, 4, 46, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 360::numeric, 'SYSTEM'),
  (213, 4, 46, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 360::numeric, 'SYSTEM'),
  (214, 4, 46, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 360::numeric, 'SYSTEM'),
  (215, 4, 46, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 360::numeric, 'SYSTEM'),
  -- Order 31, Line 47: REBAR-12MM (Process 3, 7 ops)
  (216, 3, 47, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 310::numeric, 'SYSTEM'),
  (217, 3, 47, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 310::numeric, 'SYSTEM'),
  (218, 3, 47, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 310::numeric, 'SYSTEM'),
  (219, 3, 47, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 310::numeric, 'SYSTEM'),
  (220, 3, 47, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 310::numeric, 'SYSTEM'),
  (221, 3, 47, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 310::numeric, 'SYSTEM'),
  (222, 3, 47, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 310::numeric, 'SYSTEM'),
  -- Order 32, Line 48: STEEL-BILLET-100 (Process 4, 4 ops) - ON_HOLD
  (223, 4, 48, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'ON_HOLD', 180::numeric, 'SYSTEM'),
  (224, 4, 48, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 180::numeric, 'SYSTEM'),
  (225, 4, 48, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 180::numeric, 'SYSTEM'),
  (226, 4, 48, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 180::numeric, 'SYSTEM'),
  -- Order 32, Line 49: REBAR-10MM (Process 3, 7 ops) - ON_HOLD
  (227, 3, 49, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'ON_HOLD', 120::numeric, 'SYSTEM'),
  (228, 3, 49, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (229, 3, 49, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (230, 3, 49, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (231, 3, 49, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (232, 3, 49, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (233, 3, 49, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 120::numeric, 'SYSTEM')
) AS v(operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE operation_id = 201);

-- Operations for multi-stage Full Pipeline orders (line items 50-55)
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT v.* FROM (VALUES
  -- Order 33, Line 50: HR-COIL-2MM (Process 1, 8 ops) - IN_PROGRESS
  (234::bigint, 1::bigint, 50::bigint, 1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 160::numeric, 'SYSTEM'),
  (235, 1, 50, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 160::numeric, 'SYSTEM'),
  (236, 1, 50, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 160::numeric, 'SYSTEM'),
  (237, 1, 50, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 160::numeric, 'SYSTEM'),
  (238, 1, 50, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 160::numeric, 'SYSTEM'),
  (239, 1, 50, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 160::numeric, 'SYSTEM'),
  (240, 1, 50, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 160::numeric, 'SYSTEM'),
  (241, 1, 50, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 160::numeric, 'SYSTEM'),
  -- Order 33, Line 51: CR-SHEET-1MM (Process 2, 3 ops) - IN_PROGRESS
  (242, 2, 51, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 110::numeric, 'SYSTEM'),
  (243, 2, 51, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (244, 2, 51, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  -- Order 33, Line 52: REBAR-10MM (Process 3, 7 ops) - IN_PROGRESS
  (245, 3, 52, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 260::numeric, 'SYSTEM'),
  (246, 3, 52, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 260::numeric, 'SYSTEM'),
  (247, 3, 52, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'READY', 260::numeric, 'SYSTEM'),
  (248, 3, 52, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 260::numeric, 'SYSTEM'),
  (249, 3, 52, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 260::numeric, 'SYSTEM'),
  (250, 3, 52, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 260::numeric, 'SYSTEM'),
  (251, 3, 52, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 260::numeric, 'SYSTEM'),
  -- Order 34, Line 53: HR-COIL-3MM (Process 1, 8 ops) - CANCELLED order
  (252, 1, 53, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  (253, 1, 53, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  (254, 1, 53, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  (255, 1, 53, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  (256, 1, 53, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  (257, 1, 53, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  (258, 1, 53, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  (259, 1, 53, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  -- Order 34, Line 54: CR-SHEET-2MM (Process 2, 3 ops) - CANCELLED order
  (260, 2, 54, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'NOT_STARTED', 80::numeric, 'SYSTEM'),
  (261, 2, 54, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 80::numeric, 'SYSTEM'),
  (262, 2, 54, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 80::numeric, 'SYSTEM'),
  -- Order 34, Line 55: REBAR-12MM (Process 3, 7 ops) - CANCELLED order
  (263, 3, 55, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (264, 3, 55, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (265, 3, 55, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (266, 3, 55, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (267, 3, 55, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (268, 3, 55, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 140::numeric, 'SYSTEM'),
  (269, 3, 55, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 140::numeric, 'SYSTEM')
) AS v(operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE operation_id = 234);

-- Operations for Triple Process and Mixed orders (line items 56-64)
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT v.* FROM (VALUES
  -- Order 35, Line 56: STEEL-BILLET-100 (Process 4, 4 ops) - Triple Process
  (270::bigint, 4::bigint, 56::bigint, 1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 340::numeric, 'SYSTEM'),
  (271, 4, 56, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 340::numeric, 'SYSTEM'),
  (272, 4, 56, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 340::numeric, 'SYSTEM'),
  (273, 4, 56, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 340::numeric, 'SYSTEM'),
  -- Order 35, Line 57: HR-COIL-4MM (Process 1, 8 ops) - Triple Process
  (274, 1, 57, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 150::numeric, 'SYSTEM'),
  (275, 1, 57, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 150::numeric, 'SYSTEM'),
  (276, 1, 57, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 150::numeric, 'SYSTEM'),
  (277, 1, 57, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 150::numeric, 'SYSTEM'),
  (278, 1, 57, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 150::numeric, 'SYSTEM'),
  (279, 1, 57, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 150::numeric, 'SYSTEM'),
  (280, 1, 57, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 150::numeric, 'SYSTEM'),
  (281, 1, 57, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 150::numeric, 'SYSTEM'),
  -- Order 35, Line 58: CR-SHEET-2MM (Process 2, 3 ops) - Triple Process
  (282, 2, 58, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 120::numeric, 'SYSTEM'),
  (283, 2, 58, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (284, 2, 58, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  -- Order 36, Line 59: HR-COIL-2MM (Process 1, 8 ops) - Mixed
  (285, 1, 59, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 70::numeric, 'SYSTEM'),
  (286, 1, 59, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 70::numeric, 'SYSTEM'),
  (287, 1, 59, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 70::numeric, 'SYSTEM'),
  (288, 1, 59, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 70::numeric, 'SYSTEM'),
  (289, 1, 59, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 70::numeric, 'SYSTEM'),
  (290, 1, 59, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 70::numeric, 'SYSTEM'),
  (291, 1, 59, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 70::numeric, 'SYSTEM'),
  (292, 1, 59, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 70::numeric, 'SYSTEM'),
  -- Order 36, Line 60: HR-COIL-3MM (Process 1, 8 ops) - Mixed
  (293, 1, 60, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 110::numeric, 'SYSTEM'),
  (294, 1, 60, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (295, 1, 60, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (296, 1, 60, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (297, 1, 60, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (298, 1, 60, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (299, 1, 60, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (300, 1, 60, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  -- Order 37, Line 61: REBAR-10MM (Process 3, 7 ops) - Mixed COMPLETED
  (301, 3, 61, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 130::numeric, 'SYSTEM'),
  (302, 3, 61, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 130::numeric, 'SYSTEM'),
  (303, 3, 61, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 130::numeric, 'SYSTEM'),
  (304, 3, 61, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'CONFIRMED', 130::numeric, 'SYSTEM'),
  (305, 3, 61, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'CONFIRMED', 130::numeric, 'SYSTEM'),
  (306, 3, 61, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'CONFIRMED', 130::numeric, 'SYSTEM'),
  (307, 3, 61, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'CONFIRMED', 130::numeric, 'SYSTEM'),
  -- Order 37, Line 62: REBAR-12MM (Process 3, 7 ops) - Mixed COMPLETED
  (308, 3, 62, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (309, 3, 62, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (310, 3, 62, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (311, 3, 62, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (312, 3, 62, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (313, 3, 62, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (314, 3, 62, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  -- Order 38, Line 63: CR-SHEET-1MM (Process 2, 3 ops) - Mixed IN_PROGRESS
  (315, 2, 63, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'CONFIRMED', 50::numeric, 'SYSTEM'),
  (316, 2, 63, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'READY', 50::numeric, 'SYSTEM'),
  (317, 2, 63, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 50::numeric, 'SYSTEM'),
  -- Order 38, Line 64: CR-SHEET-2MM (Process 2, 3 ops) - Mixed IN_PROGRESS
  (318, 2, 64, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  (319, 2, 64, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'READY', 70::numeric, 'SYSTEM'),
  (320, 2, 64, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 70::numeric, 'SYSTEM')
) AS v(operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE operation_id = 270);

-- Operations for Heavy HR->CR, additional HR->CR, and Billet->Rebar orders (line items 65-71)
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT v.* FROM (VALUES
  -- Order 39, Line 65: HR-COIL-2MM (Process 1, 8 ops) - Heavy HR->CR COMPLETED
  (321::bigint, 1::bigint, 65::bigint, 1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (322, 1, 65, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (323, 1, 65, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (324, 1, 65, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (325, 1, 65, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (326, 1, 65, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (327, 1, 65, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  (328, 1, 65, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 220::numeric, 'SYSTEM'),
  -- Order 39, Line 66: HR-COIL-4MM (Process 1, 8 ops) - Heavy HR->CR COMPLETED
  (329, 1, 66, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (330, 1, 66, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (331, 1, 66, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (332, 1, 66, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (333, 1, 66, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (334, 1, 66, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (335, 1, 66, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  (336, 1, 66, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 180::numeric, 'SYSTEM'),
  -- Order 39, Line 67: CR-SHEET-1MM (Process 2, 3 ops) - Heavy HR->CR COMPLETED
  (337, 2, 67, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (338, 2, 67, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  (339, 2, 67, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'CONFIRMED', 170::numeric, 'SYSTEM'),
  -- Order 40, Line 68: HR-COIL-3MM (Process 1, 8 ops)
  (340, 1, 68, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 120::numeric, 'SYSTEM'),
  (341, 1, 68, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (342, 1, 68, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (343, 1, 68, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (344, 1, 68, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (345, 1, 68, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (346, 1, 68, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (347, 1, 68, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  -- Order 40, Line 69: CR-SHEET-1MM (Process 2, 3 ops)
  (348, 2, 69, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 90::numeric, 'SYSTEM'),
  (349, 2, 69, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  (350, 2, 69, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 90::numeric, 'SYSTEM'),
  -- Order 41, Line 70: STEEL-BILLET-100 (Process 4, 4 ops)
  (351, 4, 70, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 380::numeric, 'SYSTEM'),
  (352, 4, 70, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 380::numeric, 'SYSTEM'),
  (353, 4, 70, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 380::numeric, 'SYSTEM'),
  (354, 4, 70, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 380::numeric, 'SYSTEM'),
  -- Order 41, Line 71: REBAR-12MM (Process 3, 7 ops)
  (355, 3, 71, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 340::numeric, 'SYSTEM'),
  (356, 3, 71, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 340::numeric, 'SYSTEM'),
  (357, 3, 71, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 340::numeric, 'SYSTEM'),
  (358, 3, 71, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 340::numeric, 'SYSTEM'),
  (359, 3, 71, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 340::numeric, 'SYSTEM'),
  (360, 3, 71, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 340::numeric, 'SYSTEM'),
  (361, 3, 71, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 340::numeric, 'SYSTEM')
) AS v(operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE operation_id = 321);

-- Operations for Full Pipeline 4-Stage, Mixed, and remaining orders (line items 72-82)
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT v.* FROM (VALUES
  -- Order 42, Line 72: STEEL-BILLET-100 (Process 4, 4 ops) - Full Pipeline 4-Stage
  (362::bigint, 4::bigint, 72::bigint, 1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 110::numeric, 'SYSTEM'),
  (363, 4, 72, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (364, 4, 72, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (365, 4, 72, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  -- Order 42, Line 73: HR-COIL-2MM (Process 1, 8 ops) - Full Pipeline 4-Stage
  (366, 1, 73, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 110::numeric, 'SYSTEM'),
  (367, 1, 73, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (368, 1, 73, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (369, 1, 73, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (370, 1, 73, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (371, 1, 73, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (372, 1, 73, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  (373, 1, 73, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 110::numeric, 'SYSTEM'),
  -- Order 42, Line 74: CR-SHEET-2MM (Process 2, 3 ops) - Full Pipeline 4-Stage
  (374, 2, 74, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 80::numeric, 'SYSTEM'),
  (375, 2, 74, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 80::numeric, 'SYSTEM'),
  (376, 2, 74, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 80::numeric, 'SYSTEM'),
  -- Order 42, Line 75: REBAR-10MM (Process 3, 7 ops) - Full Pipeline 4-Stage
  (377, 3, 75, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 120::numeric, 'SYSTEM'),
  (378, 3, 75, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (379, 3, 75, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (380, 3, 75, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (381, 3, 75, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (382, 3, 75, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  (383, 3, 75, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 120::numeric, 'SYSTEM'),
  -- Order 43, Line 76: HR-COIL-2MM (Process 1, 8 ops) - Mixed COMPLETED
  (384, 1, 76, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 100::numeric, 'SYSTEM'),
  (385, 1, 76, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 100::numeric, 'SYSTEM'),
  (386, 1, 76, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 100::numeric, 'SYSTEM'),
  (387, 1, 76, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 100::numeric, 'SYSTEM'),
  (388, 1, 76, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 100::numeric, 'SYSTEM'),
  (389, 1, 76, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 100::numeric, 'SYSTEM'),
  (390, 1, 76, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 100::numeric, 'SYSTEM'),
  (391, 1, 76, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 100::numeric, 'SYSTEM'),
  -- Order 43, Line 77: HR-COIL-3MM (Process 1, 8 ops) - Mixed COMPLETED
  (392, 1, 77, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  (393, 1, 77, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  (394, 1, 77, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  (395, 1, 77, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  (396, 1, 77, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  (397, 1, 77, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  (398, 1, 77, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  (399, 1, 77, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 70::numeric, 'SYSTEM'),
  -- Order 43, Line 78: HR-COIL-4MM (Process 1, 8 ops) - Mixed COMPLETED
  (400, 1, 78, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (401, 1, 78, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (402, 1, 78, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (403, 1, 78, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (404, 1, 78, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (405, 1, 78, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (406, 1, 78, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (407, 1, 78, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  -- Order 44, Line 79: STEEL-BILLET-100 (Process 4, 4 ops) - Billet+Rebar+CR IN_PROGRESS
  (408, 4, 79, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 250::numeric, 'SYSTEM'),
  (409, 4, 79, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'READY', 250::numeric, 'SYSTEM'),
  (410, 4, 79, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 250::numeric, 'SYSTEM'),
  (411, 4, 79, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 250::numeric, 'SYSTEM'),
  -- Order 44, Line 80: REBAR-12MM (Process 3, 7 ops) - Billet+Rebar+CR IN_PROGRESS
  (412, 3, 80, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 170::numeric, 'SYSTEM'),
  (413, 3, 80, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (414, 3, 80, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (415, 3, 80, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (416, 3, 80, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (417, 3, 80, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  (418, 3, 80, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 170::numeric, 'SYSTEM'),
  -- Order 44, Line 81: CR-SHEET-1MM (Process 2, 3 ops) - Billet+Rebar+CR IN_PROGRESS
  (419, 2, 81, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'CONFIRMED', 80::numeric, 'SYSTEM'),
  (420, 2, 81, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'READY', 80::numeric, 'SYSTEM'),
  (421, 2, 81, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 80::numeric, 'SYSTEM'),
  -- Order 45, Line 82: STEEL-BILLET-100 (Process 4, 4 ops)
  (422, 4, 82, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 470::numeric, 'SYSTEM'),
  (423, 4, 82, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 470::numeric, 'SYSTEM'),
  (424, 4, 82, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 470::numeric, 'SYSTEM'),
  (425, 4, 82, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 470::numeric, 'SYSTEM')
) AS v(operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE operation_id = 362);

-- =====================================================
-- AUDIT TRAIL for new orders
-- =====================================================
INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT v.* FROM (VALUES
  ('ORDER', 16::bigint, 'CREATE', 'Created order ORD-2026-016 for Asian Electronics Inc', 'admin', '2026-02-06 08:00:00'::timestamp),
  ('ORDER', 16, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS', 'admin', '2026-02-06 10:00:00'::timestamp),
  ('ORDER', 17, 'CREATE', 'Created order ORD-2026-017 for Oceanic Metals Ltd', 'admin', '2026-02-06 08:00:00'::timestamp),
  ('ORDER', 17, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS', 'admin', '2026-02-06 10:00:00'::timestamp),
  ('ORDER', 18, 'CREATE', 'Created order ORD-2026-018 for South American Steel SA', 'admin', '2026-02-06 08:00:00'::timestamp),
  ('ORDER', 18, 'STATUS_CHANGE', 'CREATED -> COMPLETED', 'admin', '2026-02-06 10:00:00'::timestamp),
  ('ORDER', 19, 'CREATE', 'Created order ORD-2026-019 for Asian Electronics Inc', 'admin', '2026-02-07 08:00:00'::timestamp),
  ('ORDER', 19, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS', 'admin', '2026-02-07 10:00:00'::timestamp),
  ('ORDER', 20, 'CREATE', 'Created order ORD-2026-020 for Asian Electronics Inc', 'admin', '2026-02-07 08:00:00'::timestamp),
  ('ORDER', 21, 'CREATE', 'Created order ORD-2026-021 for Global Manufacturing Ltd', 'admin', '2026-02-07 08:00:00'::timestamp),
  ('ORDER', 21, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS', 'admin', '2026-02-07 10:00:00'::timestamp),
  ('ORDER', 22, 'CREATE', 'Created order ORD-2026-022 for ABC Steel Corporation', 'admin', '2026-02-08 08:00:00'::timestamp),
  ('ORDER', 22, 'STATUS_CHANGE', 'CREATED -> BLOCKED', 'admin', '2026-02-08 10:00:00'::timestamp),
  ('ORDER', 23, 'CREATE', 'Created order ORD-2026-023 for ABC Steel Corporation', 'admin', '2026-02-08 08:00:00'::timestamp),
  ('ORDER', 23, 'STATUS_CHANGE', 'CREATED -> ON_HOLD', 'admin', '2026-02-08 10:00:00'::timestamp),
  ('ORDER', 24, 'CREATE', 'Created order ORD-2026-024 for Middle East Metals FZE', 'admin', '2026-02-08 08:00:00'::timestamp),
  ('ORDER', 24, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS', 'admin', '2026-02-08 10:00:00'::timestamp),
  ('ORDER', 25, 'CREATE', 'Created order ORD-2026-025 for Pacific Metal Works', 'admin', '2026-02-09 08:00:00'::timestamp),
  ('ORDER', 25, 'STATUS_CHANGE', 'CREATED -> CANCELLED', 'admin', '2026-02-09 10:00:00'::timestamp),
  ('ORDER', 26, 'CREATE', 'Created order ORD-2026-026 for Asian Electronics Inc [MULTI-STAGE: HR->CR]', 'admin', '2026-02-09 08:00:00'::timestamp),
  ('ORDER', 27, 'CREATE', 'Created order ORD-2026-027 for Global Manufacturing Ltd [MULTI-STAGE: HR->CR]', 'admin', '2026-02-09 08:00:00'::timestamp),
  ('ORDER', 28, 'CREATE', 'Created order ORD-2026-028 for Pacific Metal Works [MULTI-STAGE: HR->CR]', 'admin', '2026-02-10 08:00:00'::timestamp),
  ('ORDER', 28, 'STATUS_CHANGE', 'CREATED -> ON_HOLD', 'admin', '2026-02-10 10:00:00'::timestamp),
  ('ORDER', 29, 'CREATE', 'Created order ORD-2026-029 for European Auto Parts GmbH [MULTI-STAGE: HR->CR]', 'admin', '2026-02-10 08:00:00'::timestamp),
  ('ORDER', 29, 'STATUS_CHANGE', 'CREATED -> COMPLETED', 'admin', '2026-02-10 10:00:00'::timestamp),
  ('ORDER', 30, 'CREATE', 'Created order ORD-2026-030 for BuildRight Construction [MULTI-STAGE: Billet->Rebar]', 'admin', '2026-02-10 08:00:00'::timestamp),
  ('ORDER', 30, 'STATUS_CHANGE', 'CREATED -> COMPLETED', 'admin', '2026-02-10 10:00:00'::timestamp),
  ('ORDER', 31, 'CREATE', 'Created order ORD-2026-031 for European Auto Parts GmbH [MULTI-STAGE: Billet->Rebar]', 'admin', '2026-02-11 08:00:00'::timestamp),
  ('ORDER', 32, 'CREATE', 'Created order ORD-2026-032 for African Mining Corp [MULTI-STAGE: Billet->Rebar]', 'admin', '2026-02-11 08:00:00'::timestamp),
  ('ORDER', 32, 'STATUS_CHANGE', 'CREATED -> ON_HOLD', 'admin', '2026-02-11 10:00:00'::timestamp),
  ('ORDER', 33, 'CREATE', 'Created order ORD-2026-033 for Asian Electronics Inc [MULTI-STAGE: Full Pipeline]', 'admin', '2026-02-11 08:00:00'::timestamp),
  ('ORDER', 33, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS', 'admin', '2026-02-11 10:00:00'::timestamp),
  ('ORDER', 34, 'CREATE', 'Created order ORD-2026-034 for Oceanic Metals Ltd [MULTI-STAGE: Full Pipeline]', 'admin', '2026-02-12 08:00:00'::timestamp),
  ('ORDER', 34, 'STATUS_CHANGE', 'CREATED -> CANCELLED', 'admin', '2026-02-12 10:00:00'::timestamp),
  ('ORDER', 35, 'CREATE', 'Created order ORD-2026-035 for Middle East Metals FZE [MULTI-STAGE: Triple Process]', 'admin', '2026-02-12 08:00:00'::timestamp),
  ('ORDER', 36, 'CREATE', 'Created order ORD-2026-036 for Asian Electronics Inc [MIXED]', 'admin', '2026-02-12 08:00:00'::timestamp),
  ('ORDER', 37, 'CREATE', 'Created order ORD-2026-037 for Nordic Steel Trading AB [MIXED]', 'admin', '2026-02-13 08:00:00'::timestamp),
  ('ORDER', 37, 'STATUS_CHANGE', 'CREATED -> COMPLETED', 'admin', '2026-02-13 10:00:00'::timestamp),
  ('ORDER', 38, 'CREATE', 'Created order ORD-2026-038 for Nordic Steel Trading AB [MIXED]', 'admin', '2026-02-13 08:00:00'::timestamp),
  ('ORDER', 38, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS', 'admin', '2026-02-13 10:00:00'::timestamp),
  ('ORDER', 39, 'CREATE', 'Created order ORD-2026-039 for South American Steel SA [MULTI-STAGE: Heavy HR->CR]', 'admin', '2026-02-13 08:00:00'::timestamp),
  ('ORDER', 39, 'STATUS_CHANGE', 'CREATED -> COMPLETED', 'admin', '2026-02-13 10:00:00'::timestamp),
  ('ORDER', 40, 'CREATE', 'Created order ORD-2026-040 for Middle East Metals FZE [MULTI-STAGE: HR->CR]', 'admin', '2026-02-14 08:00:00'::timestamp),
  ('ORDER', 41, 'CREATE', 'Created order ORD-2026-041 for European Auto Parts GmbH [MULTI-STAGE: Billet->Rebar]', 'admin', '2026-02-14 08:00:00'::timestamp),
  ('ORDER', 42, 'CREATE', 'Created order ORD-2026-042 for European Auto Parts GmbH [MULTI-STAGE: Full Pipeline 4-Stage]', 'admin', '2026-02-14 08:00:00'::timestamp),
  ('ORDER', 43, 'CREATE', 'Created order ORD-2026-043 for Oceanic Metals Ltd [MIXED]', 'admin', '2026-02-15 08:00:00'::timestamp),
  ('ORDER', 43, 'STATUS_CHANGE', 'CREATED -> COMPLETED', 'admin', '2026-02-15 10:00:00'::timestamp),
  ('ORDER', 44, 'CREATE', 'Created order ORD-2026-044 for South American Steel SA [MULTI-STAGE: Billet+Rebar+CR]', 'admin', '2026-02-15 08:00:00'::timestamp),
  ('ORDER', 44, 'STATUS_CHANGE', 'CREATED -> IN_PROGRESS', 'admin', '2026-02-15 10:00:00'::timestamp),
  ('ORDER', 45, 'CREATE', 'Created order ORD-2026-045 for Global Manufacturing Ltd', 'admin', '2026-02-15 08:00:00'::timestamp)
) AS v(entity_type, entity_id, action, new_value, changed_by, timestamp)
WHERE NOT EXISTS (SELECT 1 FROM audit_trail WHERE entity_type = 'ORDER' AND entity_id = 16 AND action = 'CREATE');

-- =====================================================
-- Update sequences to reflect new max IDs
-- =====================================================
SELECT setval('orders_order_id_seq', (SELECT MAX(order_id) FROM orders));
SELECT setval('order_line_items_order_line_id_seq', (SELECT MAX(order_line_id) FROM order_line_items));
SELECT setval('operations_operation_id_seq', (SELECT MAX(operation_id) FROM operations));
