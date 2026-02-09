-- Patch 005: Add missing operations for line items that had no operations defined
-- Fixes 5 line items that were created without corresponding production operations

-- Line Item 18: HR-COIL-3MM (50T) in Order 1 - Hot Rolled Coil Production (process 1)
INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 18, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 50, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 18 AND sequence_number = 1);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 18, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 50, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 18 AND sequence_number = 2);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 18, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 50, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 18 AND sequence_number = 3);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 18, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 50, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 18 AND sequence_number = 4);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 18, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 50, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 18 AND sequence_number = 5);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 18, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 50, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 18 AND sequence_number = 6);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 18, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 50, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 18 AND sequence_number = 7);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 18, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 50, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 18 AND sequence_number = 8);

-- Line Item 19: CR-SHEET-2MM (40T) in Order 2 - Cold Rolled Sheet Production (process 2)
INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 2, 19, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 40, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 19 AND sequence_number = 1);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 2, 19, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 40, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 19 AND sequence_number = 2);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 2, 19, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 40, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 19 AND sequence_number = 3);

-- Line Item 20: REBAR-12MM (100T) in Order 3 - Rebar Production (process 3)
INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 20, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 20 AND sequence_number = 1);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 20, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 20 AND sequence_number = 2);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 20, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 20 AND sequence_number = 3);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 20, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 20 AND sequence_number = 4);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 20, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 20 AND sequence_number = 5);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 20, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 20 AND sequence_number = 6);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 20, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 20 AND sequence_number = 7);

-- Line Item 21: REBAR-12MM (150T) in Order 6 - Rebar Production (process 3)
INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 21, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 150, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 21 AND sequence_number = 1);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 21, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 150, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 21 AND sequence_number = 2);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 21, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 150, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 21 AND sequence_number = 3);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 21, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 150, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 21 AND sequence_number = 4);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 21, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 150, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 21 AND sequence_number = 5);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 21, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 150, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 21 AND sequence_number = 6);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 3, 21, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 150, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 21 AND sequence_number = 7);

-- Line Item 22: HR-COIL-4MM (100T) in Order 9 - Hot Rolled Coil Production (process 1)
INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 22, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 22 AND sequence_number = 1);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 22, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 22 AND sequence_number = 2);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 22, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 22 AND sequence_number = 3);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 22, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 22 AND sequence_number = 4);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 22, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 22 AND sequence_number = 5);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 22, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 22 AND sequence_number = 6);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 22, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 22 AND sequence_number = 7);

INSERT INTO operations (process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT 1, 22, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 100, 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE order_line_id = 22 AND sequence_number = 8);
