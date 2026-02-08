-- =====================================================
-- Patch 034: Demo Master Data Seeding
-- =====================================================
-- Purpose: Seeds comprehensive master data for demo/testing
-- Run AFTER patch 033 (reset support) when doing fresh setup
-- This patch is IDEMPOTENT - safe to run multiple times
-- =====================================================

-- =====================================================
-- SECTION 1: LOOKUP DATA
-- =====================================================

-- Hold Reasons
INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'QUALITY_HOLD', 'Quality inspection required', 'BATCH,INVENTORY,OPERATION', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'QUALITY_HOLD');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'MATERIAL_DEFECT', 'Material defect detected', 'BATCH,INVENTORY', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'MATERIAL_DEFECT');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'EQUIPMENT_ISSUE', 'Equipment malfunction', 'EQUIPMENT,OPERATION', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'EQUIPMENT_ISSUE');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'PENDING_APPROVAL', 'Pending management approval', 'ORDER,ORDER_LINE,OPERATION', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'PENDING_APPROVAL');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'SAFETY_CONCERN', 'Safety investigation required', 'BATCH,EQUIPMENT,OPERATION', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'SAFETY_CONCERN');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'CUSTOMER_REQUEST', 'Customer requested hold', 'ORDER,ORDER_LINE,BATCH', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'CUSTOMER_REQUEST');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'SPEC_DEVIATION', 'Specification deviation detected', 'BATCH,OPERATION', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'SPEC_DEVIATION');

-- Delay Reasons
INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'EQUIPMENT_BREAKDOWN', 'Equipment breakdown or failure', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'EQUIPMENT_BREAKDOWN');

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'MATERIAL_SHORTAGE', 'Raw material not available', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'MATERIAL_SHORTAGE');

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'OPERATOR_UNAVAILABLE', 'Operator not available', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'OPERATOR_UNAVAILABLE');

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'QUALITY_RETEST', 'Quality retest required', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'QUALITY_RETEST');

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'SCHEDULED_MAINTENANCE', 'Scheduled maintenance window', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'SCHEDULED_MAINTENANCE');

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'UTILITY_OUTAGE', 'Power or utility interruption', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'UTILITY_OUTAGE');

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'TOOLING_CHANGE', 'Tooling change or setup', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'TOOLING_CHANGE');

-- =====================================================
-- SECTION 2: CUSTOMERS (10 customers)
-- =====================================================

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-001', 'ABC Steel Corporation', 'John Smith', 'john.smith@abcsteel.com', '+1-555-0101', '100 Industrial Blvd', 'Pittsburgh', 'USA', 'US-TAX-001', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-001');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-002', 'Global Manufacturing Inc', 'Sarah Johnson', 'sarah@globalmfg.com', '+1-555-0102', '200 Factory Lane', 'Detroit', 'USA', 'US-TAX-002', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-002');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-003', 'Pacific Metal Works', 'Michael Chen', 'm.chen@pacificmetal.com', '+1-555-0103', '300 Harbor Drive', 'Seattle', 'USA', 'US-TAX-003', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-003');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-004', 'European Auto Parts GmbH', 'Hans Mueller', 'h.mueller@euroauto.de', '+49-555-0104', 'Industriestraße 50', 'Munich', 'Germany', 'DE-TAX-004', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-004');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-005', 'Asian Electronics Ltd', 'Yuki Tanaka', 'y.tanaka@asianelec.jp', '+81-555-0105', '1-2-3 Tech District', 'Tokyo', 'Japan', 'JP-TAX-005', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-005');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-006', 'BuildRight Construction', 'Robert Brown', 'r.brown@buildright.com', '+1-555-0106', '400 Builder Ave', 'Chicago', 'USA', 'US-TAX-006', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-006');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-007', 'Nordic Steel AS', 'Erik Larsson', 'e.larsson@nordicsteel.no', '+47-555-0107', 'Stålveien 10', 'Oslo', 'Norway', 'NO-TAX-007', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-007');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-008', 'Middle East Metals LLC', 'Ahmed Hassan', 'a.hassan@memetals.ae', '+971-555-0108', 'Industrial City', 'Dubai', 'UAE', 'AE-TAX-008', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-008');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-009', 'South American Mining Co', 'Carlos Rodriguez', 'c.rodriguez@samining.br', '+55-555-0109', 'Rua Industrial 500', 'São Paulo', 'Brazil', 'BR-TAX-009', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-009');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-010', 'Indian Steel Works Pvt', 'Rajesh Sharma', 'r.sharma@indiansteel.in', '+91-555-0110', 'Steel Nagar', 'Mumbai', 'India', 'IN-TAX-010', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-010');

-- =====================================================
-- SECTION 3: MATERIALS (50+ materials)
-- =====================================================

-- RAW MATERIALS (RM) - 25 items
INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-SCRAP-A', 'Steel Scrap Grade A', 'RM', 'T', 'High quality steel scrap for EAF', 350.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-SCRAP-A');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-SCRAP-B', 'Steel Scrap Grade B', 'RM', 'T', 'Standard steel scrap for EAF', 280.00, 150, 300, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-SCRAP-B');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-SCRAP-SS', 'Stainless Steel Scrap', 'RM', 'T', 'Stainless steel scrap 304/316', 800.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-SCRAP-SS');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-IRON-ORE', 'Iron Ore Pellets', 'RM', 'T', 'Iron ore pellets 65% Fe', 150.00, 500, 1000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-IRON-ORE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-LIMESTONE', 'Limestone', 'RM', 'T', 'Limestone for flux', 45.00, 200, 400, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-LIMESTONE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-DOLOMITE', 'Dolomite', 'RM', 'T', 'Dolomite for steelmaking', 55.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-DOLOMITE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-FESI', 'Ferrosilicon 75%', 'RM', 'KG', 'Ferrosilicon alloy 75%', 1.80, 5000, 10000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-FESI');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-FEMN', 'Ferromanganese HC', 'RM', 'KG', 'High carbon ferromanganese', 1.50, 5000, 10000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-FEMN');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-FECR', 'Ferrochrome LC', 'RM', 'KG', 'Low carbon ferrochrome', 2.20, 3000, 6000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-FECR');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-NICKEL', 'Nickel Cathode', 'RM', 'KG', 'Nickel cathode 99.9%', 18.00, 1000, 2000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-NICKEL');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-COAL', 'Anthracite Coal', 'RM', 'T', 'Anthracite coal for carburizing', 200.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-COAL');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-GRAPHITE', 'Graphite Electrodes', 'RM', 'PC', 'Graphite electrodes for EAF', 2500.00, 10, 20, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-GRAPHITE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-ALWIRE', 'Aluminum Wire', 'RM', 'KG', 'Aluminum wire for deoxidation', 2.50, 2000, 4000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-ALWIRE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-CAWIRE', 'Calcium Wire', 'RM', 'KG', 'Calcium wire for treatment', 4.00, 1000, 2000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-CAWIRE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-MOLD-POWDER', 'Mold Powder', 'RM', 'KG', 'Casting mold powder', 1.20, 3000, 6000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-MOLD-POWDER');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-REFRAC', 'Refractory Bricks', 'RM', 'PC', 'Refractory bricks for furnace', 25.00, 500, 1000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-REFRAC');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-OXYGEN', 'Industrial Oxygen', 'RM', 'M3', 'Industrial oxygen for EAF', 0.15, 10000, 20000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-OXYGEN');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-ARGON', 'Argon Gas', 'RM', 'M3', 'Argon gas for ladle treatment', 0.80, 5000, 10000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-ARGON');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-NITROGEN', 'Nitrogen Gas', 'RM', 'M3', 'Nitrogen gas for purging', 0.10, 15000, 30000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-NITROGEN');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-LUBRICANT', 'Rolling Lubricant', 'RM', 'L', 'Rolling mill lubricant', 3.50, 2000, 4000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-LUBRICANT');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-HCL', 'Hydrochloric Acid', 'RM', 'L', 'HCl for pickling', 0.50, 5000, 10000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-HCL');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-COATING', 'Coating Oil', 'RM', 'L', 'Anti-rust coating oil', 4.00, 1000, 2000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-COATING');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-ZINC', 'Zinc Ingots', 'RM', 'KG', 'Zinc ingots for galvanizing', 2.80, 5000, 10000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-ZINC');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-TIN', 'Tin Ingots', 'RM', 'KG', 'Tin ingots for tinning', 25.00, 1000, 2000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-TIN');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-PACKAGING', 'Steel Strapping', 'RM', 'KG', 'Steel strapping for packaging', 1.50, 2000, 4000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-PACKAGING');

-- INTERMEDIATE MATERIALS (IM) - 15 items
INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-LIQUID-STEEL', 'Liquid Steel', 'IM', 'T', 'Molten steel from EAF', 500.00, 0, 0, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-LIQUID-STEEL');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-LIQUID-SS', 'Liquid Stainless Steel', 'IM', 'T', 'Molten stainless steel', 1200.00, 0, 0, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-LIQUID-SS');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-SLAB-CS', 'Carbon Steel Slab', 'IM', 'T', 'Carbon steel slab 200mm', 550.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-SLAB-CS');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-SLAB-SS', 'Stainless Steel Slab', 'IM', 'T', 'Stainless steel slab 200mm', 1350.00, 30, 60, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-SLAB-SS');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-BILLET', 'Steel Billet 100mm', 'IM', 'T', 'Steel billet 100x100mm', 520.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-BILLET');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-BLOOM', 'Steel Bloom', 'IM', 'T', 'Steel bloom 200x200mm', 540.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-BLOOM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-HR-COIL', 'Hot Rolled Coil', 'IM', 'T', 'Hot rolled coil 3-6mm', 620.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-HR-COIL');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-HR-STRIP', 'Hot Rolled Strip', 'IM', 'T', 'Hot rolled strip 2-3mm', 600.00, 80, 160, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-HR-STRIP');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-PICKLED', 'Pickled Strip', 'IM', 'T', 'Pickled and oiled strip', 650.00, 60, 120, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-PICKLED');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-CR-STRIP', 'Cold Rolled Strip', 'IM', 'T', 'Cold rolled strip 0.5-2mm', 700.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-CR-STRIP');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-ANNEALED', 'Annealed Strip', 'IM', 'T', 'Batch annealed strip', 720.00, 40, 80, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-ANNEALED');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-WIRE-ROD', 'Wire Rod', 'IM', 'T', 'Wire rod 5.5-12mm', 580.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-WIRE-ROD');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-BAR', 'Rolled Bar', 'IM', 'T', 'Rolled bar 10-40mm', 560.00, 80, 160, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-BAR');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-BEAM', 'Rolled Beam', 'IM', 'T', 'Structural beam profile', 650.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-BEAM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-PLATE', 'Hot Rolled Plate', 'IM', 'T', 'Hot rolled plate 6-50mm', 640.00, 60, 120, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-PLATE');

-- FINISHED GOODS (FG) - 15 items
INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-HR-COIL-2MM', 'HR Coil 2.0mm', 'FG', 'T', 'Hot rolled coil 2.0mm finished', 680.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-HR-COIL-2MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-HR-COIL-3MM', 'HR Coil 3.0mm', 'FG', 'T', 'Hot rolled coil 3.0mm finished', 670.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-HR-COIL-3MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-HR-COIL-5MM', 'HR Coil 5.0mm', 'FG', 'T', 'Hot rolled coil 5.0mm finished', 660.00, 40, 80, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-HR-COIL-5MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-CR-SHEET-1MM', 'CR Sheet 1.0mm', 'FG', 'T', 'Cold rolled sheet 1.0mm', 780.00, 30, 60, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-CR-SHEET-1MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-CR-SHEET-2MM', 'CR Sheet 2.0mm', 'FG', 'T', 'Cold rolled sheet 2.0mm', 760.00, 30, 60, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-CR-SHEET-2MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-GALV-SHEET', 'Galvanized Sheet', 'FG', 'T', 'Hot dip galvanized sheet', 850.00, 40, 80, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-GALV-SHEET');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-TINPLATE', 'Tinplate Sheet', 'FG', 'T', 'Electrolytic tinplate sheet', 920.00, 25, 50, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-TINPLATE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-REBAR-10', 'Rebar 10mm', 'FG', 'T', 'Reinforcing bar 10mm', 590.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-REBAR-10');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-REBAR-16', 'Rebar 16mm', 'FG', 'T', 'Reinforcing bar 16mm', 585.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-REBAR-16');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-REBAR-20', 'Rebar 20mm', 'FG', 'T', 'Reinforcing bar 20mm', 580.00, 80, 160, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-REBAR-20');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-WIRE', 'Steel Wire', 'FG', 'T', 'Drawn steel wire', 720.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-WIRE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-BILLET-100', 'Steel Billet 100mm', 'FG', 'T', 'Finished steel billet 100x100mm', 560.00, 80, 160, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-BILLET-100');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-PLATE-10MM', 'Steel Plate 10mm', 'FG', 'T', 'Finished steel plate 10mm', 700.00, 40, 80, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-PLATE-10MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-ANGLE', 'Steel Angle', 'FG', 'T', 'Structural steel angle', 620.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-ANGLE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-CHANNEL', 'Steel Channel', 'FG', 'T', 'Structural steel channel', 630.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-CHANNEL');

-- =====================================================
-- SECTION 4: PRODUCTS (25 products)
-- =====================================================

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-HR-COIL-2MM', 'Hot Rolled Coil 2.0mm', 'Flat Products', 'T', 'Hot rolled coil 2.0mm x 1250mm', 1.0, 750.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-HR-COIL-2MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-HR-COIL-3MM', 'Hot Rolled Coil 3.0mm', 'Flat Products', 'T', 'Hot rolled coil 3.0mm x 1250mm', 1.0, 740.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-HR-COIL-3MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-HR-COIL-5MM', 'Hot Rolled Coil 5.0mm', 'Flat Products', 'T', 'Hot rolled coil 5.0mm x 1500mm', 1.0, 720.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-HR-COIL-5MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-CR-SHEET-1MM', 'Cold Rolled Sheet 1.0mm', 'Flat Products', 'T', 'Cold rolled sheet 1.0mm x 1250mm', 1.0, 850.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-CR-SHEET-1MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-CR-SHEET-2MM', 'Cold Rolled Sheet 2.0mm', 'Flat Products', 'T', 'Cold rolled sheet 2.0mm x 1250mm', 1.0, 830.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-CR-SHEET-2MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-GALV-SHEET', 'Galvanized Sheet', 'Coated Products', 'T', 'Hot dip galvanized sheet 0.5-2.0mm', 1.0, 920.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-GALV-SHEET');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-TINPLATE', 'Tinplate Sheet', 'Coated Products', 'T', 'Electrolytic tinplate 0.15-0.5mm', 1.0, 1000.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-TINPLATE');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-REBAR-10', 'Rebar 10mm Grade 60', 'Long Products', 'T', 'Reinforcing bar 10mm Fe 500', 1.0, 650.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-REBAR-10');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-REBAR-16', 'Rebar 16mm Grade 60', 'Long Products', 'T', 'Reinforcing bar 16mm Fe 500', 1.0, 640.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-REBAR-16');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-REBAR-20', 'Rebar 20mm Grade 60', 'Long Products', 'T', 'Reinforcing bar 20mm Fe 500', 1.0, 635.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-REBAR-20');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-WIRE', 'Steel Wire', 'Wire Products', 'T', 'Drawn steel wire 2-6mm', 1.0, 800.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-WIRE');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-BILLET-100', 'Steel Billet 100mm', 'Semi-Finished', 'T', 'Steel billet 100x100x6000mm', 1.0, 600.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-BILLET-100');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-PLATE-10', 'Steel Plate 10mm', 'Flat Products', 'T', 'Hot rolled plate 10mm x 2000mm', 1.0, 770.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-PLATE-10');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-ANGLE-50', 'Steel Angle 50x50x5', 'Structural', 'T', 'Structural angle 50x50x5mm', 1.0, 690.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-ANGLE-50');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-CHANNEL-100', 'Steel Channel 100mm', 'Structural', 'T', 'Structural channel 100mm', 1.0, 710.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-CHANNEL-100');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-HR-PLATE-6', 'HR Plate 6mm', 'Flat Products', 'T', 'Hot rolled plate 6mm x 2000mm', 1.0, 720.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-HR-PLATE-6');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-HR-PLATE-20', 'HR Plate 20mm', 'Flat Products', 'T', 'Hot rolled plate 20mm x 2500mm', 1.0, 750.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-HR-PLATE-20');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-SS-SHEET', 'Stainless Steel Sheet', 'Stainless', 'T', 'SS304 sheet 1.0mm x 1250mm', 1.0, 2500.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-SS-SHEET');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-SS-COIL', 'Stainless Steel Coil', 'Stainless', 'T', 'SS304 coil 2.0mm x 1250mm', 1.0, 2400.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-SS-COIL');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-WIRE-ROD-6', 'Wire Rod 6mm', 'Wire Products', 'T', 'Wire rod 6.0mm for drawing', 1.0, 660.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-WIRE-ROD-6');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-WIRE-ROD-8', 'Wire Rod 8mm', 'Wire Products', 'T', 'Wire rod 8.0mm for drawing', 1.0, 650.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-WIRE-ROD-8');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-BEAM-IPE200', 'IPE Beam 200', 'Structural', 'T', 'IPE beam 200mm structural', 1.0, 780.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-BEAM-IPE200');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-BEAM-HEA200', 'HEA Beam 200', 'Structural', 'T', 'HEA beam 200mm structural', 1.0, 790.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-BEAM-HEA200');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-RAIL', 'Rail Track R65', 'Rail', 'T', 'Rail track R65 standard', 1.0, 850.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-RAIL');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-PIPE-100', 'Steel Pipe 100mm', 'Tubular', 'T', 'Seamless pipe 100mm OD', 1.0, 880.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-PIPE-100');

-- =====================================================
-- SECTION 5: EQUIPMENT (15 equipment items)
-- =====================================================

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'EAF-001', 'Electric Arc Furnace #1', 'MELTING', 120, 'T', 'Melt Shop Bay 1', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'EAF-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'EAF-002', 'Electric Arc Furnace #2', 'MELTING', 120, 'T', 'Melt Shop Bay 2', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'EAF-002');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'EAF-003', 'Electric Arc Furnace #3', 'MELTING', 150, 'T', 'Melt Shop Bay 3', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'EAF-003');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'LF-001', 'Ladle Furnace #1', 'REFINING', 120, 'T', 'Secondary Metallurgy', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'LF-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'LF-002', 'Ladle Furnace #2', 'REFINING', 150, 'T', 'Secondary Metallurgy', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'LF-002');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'CCM-001', 'Continuous Caster #1 (Slab)', 'CASTING', 200, 'T/H', 'Casting Bay 1', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'CCM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'CCM-002', 'Continuous Caster #2 (Billet)', 'CASTING', 100, 'T/H', 'Casting Bay 2', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'CCM-002');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'HSM-001', 'Hot Strip Mill #1', 'HOT_ROLLING', 400, 'T/H', 'Hot Rolling Bay 1', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'HSM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'HSM-002', 'Hot Strip Mill #2', 'HOT_ROLLING', 350, 'T/H', 'Hot Rolling Bay 2', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'HSM-002');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'CRM-001', 'Cold Rolling Mill', 'COLD_ROLLING', 150, 'T/H', 'Cold Rolling Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'CRM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'BAF-001', 'Batch Annealing Furnace', 'ANNEALING', 80, 'T', 'Annealing Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'BAF-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'PKL-001', 'Pickling Line', 'PICKLING', 200, 'T/H', 'Finishing Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'PKL-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'BRM-001', 'Bar Rolling Mill', 'BAR_ROLLING', 100, 'T/H', 'Long Products Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'BRM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'GALV-001', 'Galvanizing Line', 'COATING', 100, 'T/H', 'Coating Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'GALV-001');

INSERT INTO equipment (equipment_code, name, equipment_type, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'WRM-001', 'Wire Rod Mill', 'WIRE_ROLLING', 80, 'T/H', 'Wire Products Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'WRM-001');

-- =====================================================
-- SECTION 6: OPERATORS (12 operators)
-- =====================================================

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-001', 'John Martinez', 'Melt Shop', 'A', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-001');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-002', 'Sarah Wilson', 'Melt Shop', 'A', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-002');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-003', 'Michael Brown', 'Casting', 'A', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-003');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-004', 'Emily Davis', 'Casting', 'B', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-004');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-005', 'David Garcia', 'Hot Rolling', 'A', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-005');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-006', 'Jennifer Lee', 'Hot Rolling', 'B', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-006');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-007', 'Robert Taylor', 'Cold Rolling', 'A', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-007');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-008', 'Lisa Anderson', 'Cold Rolling', 'B', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-008');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-009', 'James Thomas', 'Finishing', 'A', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-009');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-010', 'Patricia Jackson', 'Finishing', 'B', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-010');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-011', 'Christopher White', 'Quality', 'A', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-011');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-012', 'Amanda Harris', 'Quality', 'B', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-012');
