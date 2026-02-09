-- =====================================================
-- Patch 003: Additional Inventory & Batch Data
-- Fills gaps for materials that had no inventory records:
--   IM-BLOOM, IM-WIRE-ROD, additional IM-LIQUID, IM-SLAB, IM-HR-ROUGH
--   Additional RM stock (Scrap, Iron Ore, Limestone, Ferroalloys)
-- =====================================================

-- =====================================================
-- 1. Additional Intermediate Material Batches
-- =====================================================

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-IM-021', 'IM-BLOOM', 'Steel Bloom 200mm', 160, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-IM-021');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-IM-022', 'IM-BLOOM', 'Steel Bloom 200mm', 140, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-IM-022');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-IM-023', 'IM-WIRE-ROD', 'Wire Rod', 120, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-IM-023');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-IM-024', 'IM-WIRE-ROD', 'Wire Rod', 95, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-IM-024');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-IM-025', 'IM-LIQUID', 'Liquid Steel', 200, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-IM-025');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-IM-026', 'IM-LIQUID', 'Liquid Steel', 180, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-IM-026');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-IM-027', 'IM-SLAB', 'Steel Slab 200mm', 200, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-IM-027');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-IM-028', 'IM-HR-ROUGH', 'HR Coil Rough', 110, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-IM-028');

-- =====================================================
-- 2. Additional Raw Material Batches
-- =====================================================

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-RM-023', 'RM-SCRAP-A', 'Steel Scrap Grade A', 400, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-RM-023');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-RM-024', 'RM-SCRAP-B', 'Steel Scrap Grade B', 300, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-RM-024');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-RM-025', 'RM-IRON-ORE', 'Iron Ore Pellets', 250, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-RM-025');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-RM-026', 'RM-LIMESTONE', 'Limestone', 200, 'T', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-RM-026');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-RM-027', 'RM-FEMN', 'Ferroalloy FeMn', 2000, 'KG', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-RM-027');

INSERT INTO batches (batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT 'B-RM-028', 'RM-FESI', 'Ferroalloy FeSi', 1500, 'KG', 'AVAILABLE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_number = 'B-RM-028');

-- =====================================================
-- 3. Inventory Records for New Batches (Intermediate)
-- =====================================================

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-BLOOM', 'Steel Bloom 200mm', 'IM', 'AVAILABLE', 160, 'T', b.batch_id, 'Bloom Yard', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-IM-021'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-BLOOM', 'Steel Bloom 200mm', 'IM', 'AVAILABLE', 140, 'T', b.batch_id, 'Bloom Yard', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-IM-022'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-WIRE-ROD', 'Wire Rod', 'IM', 'AVAILABLE', 120, 'T', b.batch_id, 'Wire Rod Bay', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-IM-023'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-WIRE-ROD', 'Wire Rod', 'IM', 'AVAILABLE', 95, 'T', b.batch_id, 'Wire Rod Bay', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-IM-024'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-LIQUID', 'Liquid Steel', 'IM', 'AVAILABLE', 200, 'T', b.batch_id, 'Ladle #2', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-IM-025'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-LIQUID', 'Liquid Steel', 'IM', 'AVAILABLE', 180, 'T', b.batch_id, 'Ladle #3', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-IM-026'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-SLAB', 'Steel Slab 200mm', 'IM', 'AVAILABLE', 200, 'T', b.batch_id, 'Slab Yard B', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-IM-027'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'IM-HR-ROUGH', 'HR Coil Rough', 'IM', 'AVAILABLE', 110, 'T', b.batch_id, 'Hot Mill', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-IM-028'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

-- =====================================================
-- 4. Inventory Records for New Batches (Raw Materials)
-- =====================================================

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-SCRAP-A', 'Steel Scrap Grade A', 'RM', 'AVAILABLE', 400, 'T', b.batch_id, 'Scrap Yard D', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-RM-023'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-SCRAP-B', 'Steel Scrap Grade B', 'RM', 'AVAILABLE', 300, 'T', b.batch_id, 'Scrap Yard D', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-RM-024'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-IRON-ORE', 'Iron Ore Pellets', 'RM', 'AVAILABLE', 250, 'T', b.batch_id, 'Ore Storage B', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-RM-025'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-LIMESTONE', 'Limestone', 'RM', 'AVAILABLE', 200, 'T', b.batch_id, 'Flux Store B', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-RM-026'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-FEMN', 'Ferroalloy FeMn', 'RM', 'AVAILABLE', 2000, 'KG', b.batch_id, 'Alloy Store B', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-RM-027'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

INSERT INTO inventory (material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT 'RM-FESI', 'Ferroalloy FeSi', 'RM', 'AVAILABLE', 1500, 'KG', b.batch_id, 'Alloy Store B', 'SYSTEM'
FROM batches b WHERE b.batch_number = 'B-RM-028'
AND NOT EXISTS (SELECT 1 FROM inventory WHERE batch_id = b.batch_id);

-- =====================================================
-- 5. Audit Trail Entries
-- =====================================================

INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT 'BATCH', b.batch_id, 'CREATE', 'Created batch B-IM-021: Steel Bloom 200mm, 160T', 'SYSTEM', '2026-02-05 08:00:00'
FROM batches b WHERE b.batch_number = 'B-IM-021';

INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT 'BATCH', b.batch_id, 'CREATE', 'Created batch B-IM-022: Steel Bloom 200mm, 140T', 'SYSTEM', '2026-02-05 08:05:00'
FROM batches b WHERE b.batch_number = 'B-IM-022';

INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT 'BATCH', b.batch_id, 'CREATE', 'Created batch B-IM-023: Wire Rod, 120T', 'SYSTEM', '2026-02-05 08:10:00'
FROM batches b WHERE b.batch_number = 'B-IM-023';

INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT 'BATCH', b.batch_id, 'CREATE', 'Created batch B-IM-024: Wire Rod, 95T', 'SYSTEM', '2026-02-05 08:15:00'
FROM batches b WHERE b.batch_number = 'B-IM-024';

INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT 'BATCH', b.batch_id, 'CREATE', 'Created batch B-IM-025: Liquid Steel, 200T', 'SYSTEM', '2026-02-05 08:20:00'
FROM batches b WHERE b.batch_number = 'B-IM-025';

INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT 'BATCH', b.batch_id, 'CREATE', 'Created batch B-IM-026: Liquid Steel, 180T', 'SYSTEM', '2026-02-05 08:25:00'
FROM batches b WHERE b.batch_number = 'B-IM-026';

INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT 'BATCH', b.batch_id, 'CREATE', 'Created batch B-IM-027: Steel Slab 200mm, 200T', 'SYSTEM', '2026-02-05 08:30:00'
FROM batches b WHERE b.batch_number = 'B-IM-027';

INSERT INTO audit_trail (entity_type, entity_id, action, new_value, changed_by, timestamp)
SELECT 'BATCH', b.batch_id, 'CREATE', 'Created batch B-IM-028: HR Coil Rough, 110T', 'SYSTEM', '2026-02-05 08:35:00'
FROM batches b WHERE b.batch_number = 'B-IM-028';
