-- =====================================================
-- MES Production Confirmation - Comprehensive Seed Data
-- PostgreSQL-compatible seed data for demo and testing
-- =====================================================

-- =====================================================
-- 1. ADMIN USER
-- =====================================================
INSERT INTO users (email, password_hash, name, employee_id, status, created_by)
SELECT 'admin@mes.com', '$2a$10$QOowoTebIWE8lpcFwYRUkOfJlLXf4joSBXPzGrFETthgFr/i0I9OW', 'Admin User', 'EMP-001', 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@mes.com');

-- =====================================================
-- 2. HOLD REASONS
-- =====================================================
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

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'CONTAMINATION', 'Contamination suspected', 'BATCH,INVENTORY', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'CONTAMINATION');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'REGULATORY_HOLD', 'Regulatory hold', 'BATCH,INVENTORY', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'REGULATORY_HOLD');

INSERT INTO hold_reasons (reason_code, reason_description, applicable_to, status, created_on, created_by)
SELECT 'OTHER', 'Other', 'OPERATION,ORDER_LINE,BATCH,INVENTORY,EQUIPMENT', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM hold_reasons WHERE reason_code = 'OTHER');

-- =====================================================
-- 3. DELAY REASONS
-- =====================================================
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

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'QUALITY_ISSUE', 'Quality issue', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'QUALITY_ISSUE');

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'SCHEDULING', 'Scheduling conflict', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'SCHEDULING');

INSERT INTO delay_reasons (reason_code, reason_description, status, created_on, created_by)
SELECT 'OTHER', 'Other', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM delay_reasons WHERE reason_code = 'OTHER');

-- =====================================================
-- 4. CUSTOMERS (12)
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

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-011', 'Oceanic Metals Ltd', 'Bruce Wilson', 'bruce@oceanicmetals.au', '+61-2-55520', '45 Harbour View', 'Sydney', 'Australia', 'AU-TAX-011', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-011');

INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, tax_id, status, created_on, created_by)
SELECT 'CUST-012', 'Canadian Steel Works', 'Pierre Dubois', 'pierre@cansteelworks.ca', '+1-514-5553', '800 Rue de Acier', 'Montreal', 'Canada', 'CA-TAX-012', 'INACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM customers WHERE customer_code = 'CUST-012');

-- =====================================================
-- 5. MATERIALS (55 materials)
-- =====================================================

-- RAW MATERIALS (25)
INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-SCRAP-A', 'Steel Scrap Grade A', 'RM', 'T', 'High quality steel scrap for EAF', 350.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-SCRAP-A');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-SCRAP-B', 'Steel Scrap Grade B', 'RM', 'T', 'Standard steel scrap for EAF', 280.00, 150, 300, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-SCRAP-B');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-SCRAP-C', 'Steel Scrap Grade C', 'RM', 'T', 'Shredded steel scrap', 150.00, 30, 60, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-SCRAP-C');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-IRON-ORE', 'Iron Ore Pellets', 'RM', 'T', 'Iron ore pellets 65% Fe', 150.00, 500, 1000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-IRON-ORE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-LIMESTONE', 'Limestone', 'RM', 'T', 'Limestone for flux', 45.00, 200, 400, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-LIMESTONE');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-FESI', 'Ferrosilicon 75%', 'RM', 'KG', 'Ferrosilicon alloy 75%', 1.80, 5000, 10000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-FESI');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-FEMN', 'Ferromanganese HC', 'RM', 'KG', 'High carbon ferromanganese', 1.50, 5000, 10000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-FEMN');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-FEV', 'Ferrovanadium 80%', 'RM', 'KG', 'Ferrovanadium for high-strength steel', 25.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-FEV');

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
SELECT 'RM-MOLD-POWDER', 'Mold Powder', 'RM', 'KG', 'Casting mold powder', 1.20, 3000, 6000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-MOLD-POWDER');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-LUBRICANT', 'Rolling Lubricant', 'RM', 'L', 'Rolling mill lubricant', 3.50, 2000, 4000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-LUBRICANT');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-HCL', 'Hydrochloric Acid', 'RM', 'L', 'HCl for pickling', 0.50, 5000, 10000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-HCL');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'RM-COATING', 'Coating Oil', 'RM', 'L', 'Anti-rust coating oil', 4.00, 1000, 2000, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'RM-COATING');

-- INTERMEDIATE MATERIALS (15)
INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-LIQUID-STEEL', 'Liquid Steel', 'IM', 'T', 'Molten steel from EAF', 500.00, 0, 0, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-LIQUID-STEEL');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-SLAB-CS', 'Carbon Steel Slab', 'IM', 'T', 'Carbon steel slab 200mm', 550.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-SLAB-CS');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-BILLET', 'Steel Billet 100mm', 'IM', 'T', 'Steel billet 100x100mm', 520.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-BILLET');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'IM-HR-COIL', 'Hot Rolled Coil', 'IM', 'T', 'Hot rolled coil 3-6mm', 620.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'IM-HR-COIL');

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

-- FINISHED GOODS (15)
INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-HR-COIL-2MM', 'HR Coil 2.0mm', 'FG', 'T', 'Hot rolled coil 2.0mm finished', 680.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-HR-COIL-2MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-HR-COIL-3MM', 'HR Coil 3.0mm', 'FG', 'T', 'Hot rolled coil 3.0mm finished', 670.00, 50, 100, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-HR-COIL-3MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-CR-SHEET-1MM', 'CR Sheet 1.0mm', 'FG', 'T', 'Cold rolled sheet 1.0mm', 780.00, 30, 60, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-CR-SHEET-1MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-CR-SHEET-2MM', 'CR Sheet 2.0mm', 'FG', 'T', 'Cold rolled sheet 2.0mm', 760.00, 30, 60, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-CR-SHEET-2MM');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-REBAR-10', 'Rebar 10mm', 'FG', 'T', 'Reinforcing bar 10mm', 590.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-REBAR-10');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-REBAR-16', 'Rebar 16mm', 'FG', 'T', 'Reinforcing bar 16mm', 585.00, 100, 200, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-REBAR-16');

INSERT INTO materials (material_code, material_name, material_type, base_unit, description, standard_cost, min_stock_level, reorder_point, status, created_on, created_by)
SELECT 'FG-BILLET-100', 'Steel Billet 100mm', 'FG', 'T', 'Finished steel billet 100x100mm', 560.00, 80, 160, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM materials WHERE material_code = 'FG-BILLET-100');

-- =====================================================
-- 6. PRODUCTS (15)
-- =====================================================
INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-HR-COIL-2MM', 'Hot Rolled Coil 2.0mm', 'Flat Products', 'T', 'Hot rolled coil 2.0mm x 1250mm', 1.0, 750.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-HR-COIL-2MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-HR-COIL-3MM', 'Hot Rolled Coil 3.0mm', 'Flat Products', 'T', 'Hot rolled coil 3.0mm x 1250mm', 1.0, 740.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-HR-COIL-3MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-CR-SHEET-1MM', 'Cold Rolled Sheet 1.0mm', 'Flat Products', 'T', 'Cold rolled sheet 1.0mm x 1250mm', 1.0, 850.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-CR-SHEET-1MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-CR-SHEET-2MM', 'Cold Rolled Sheet 2.0mm', 'Flat Products', 'T', 'Cold rolled sheet 2.0mm x 1250mm', 1.0, 830.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-CR-SHEET-2MM');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-REBAR-10', 'Rebar 10mm Grade 60', 'Long Products', 'T', 'Reinforcing bar 10mm Fe 500', 1.0, 650.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-REBAR-10');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-REBAR-16', 'Rebar 16mm Grade 60', 'Long Products', 'T', 'Reinforcing bar 16mm Fe 500', 1.0, 640.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-REBAR-16');

INSERT INTO products (sku, product_name, product_category, base_unit, description, weight_per_unit, standard_price, status, created_on, created_by)
SELECT 'PROD-BILLET-100', 'Steel Billet 100mm', 'Semi-Finished', 'T', 'Steel billet 100x100x6000mm', 1.0, 600.00, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM products WHERE sku = 'PROD-BILLET-100');

-- =====================================================
-- 7. EQUIPMENT (16)
-- =====================================================
INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'EAF-001', 'Electric Arc Furnace #1', 'BATCH', 'MELTING', 120, 'T', 'Melt Shop Bay 1', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'EAF-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'EAF-002', 'Electric Arc Furnace #2', 'BATCH', 'MELTING', 120, 'T', 'Melt Shop Bay 2', 'IN_USE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'EAF-002');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'EAF-003', 'Electric Arc Furnace #3', 'BATCH', 'MELTING', 150, 'T', 'Melt Shop Bay 3', 'MAINTENANCE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'EAF-003');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'LF-001', 'Ladle Furnace #1', 'BATCH', 'REFINING', 120, 'T', 'Secondary Metallurgy', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'LF-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'LF-002', 'Ladle Furnace #2', 'BATCH', 'REFINING', 150, 'T', 'Secondary Metallurgy', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'LF-002');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'CCM-001', 'Continuous Caster #1', 'CONTINUOUS', 'CASTING', 200, 'T/H', 'Casting Bay 1', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'CCM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'CCM-002', 'Continuous Caster #2', 'CONTINUOUS', 'CASTING', 100, 'T/H', 'Casting Bay 2', 'IN_USE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'CCM-002');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'HSM-001', 'Hot Strip Mill #1', 'CONTINUOUS', 'HOT_ROLLING', 400, 'T/H', 'Hot Rolling Bay 1', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'HSM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'HSM-002', 'Hot Strip Mill #2', 'CONTINUOUS', 'HOT_ROLLING', 350, 'T/H', 'Hot Rolling Bay 2', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'HSM-002');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'CRM-001', 'Cold Rolling Mill', 'CONTINUOUS', 'COLD_ROLLING', 150, 'T/H', 'Cold Rolling Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'CRM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'BAF-001', 'Batch Annealing Furnace', 'BATCH', 'HEAT_TREATMENT', 80, 'T', 'Annealing Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'BAF-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'PKL-001', 'Pickling Line', 'CONTINUOUS', 'PICKLING', 200, 'T/H', 'Finishing Bay', 'ON_HOLD', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'PKL-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'BRM-001', 'Bar Rolling Mill', 'CONTINUOUS', 'BAR_ROLLING', 100, 'T/H', 'Long Products Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'BRM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'GALV-001', 'Galvanizing Line', 'CONTINUOUS', 'COATING', 100, 'T/H', 'Coating Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'GALV-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'WRM-001', 'Wire Rod Mill', 'CONTINUOUS', 'WIRE_DRAWING', 80, 'T/H', 'Wire Products Bay', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'WRM-001');

INSERT INTO equipment (equipment_code, name, equipment_type, equipment_category, capacity, capacity_unit, location, status, created_on, created_by)
SELECT 'PACK-001', 'Packaging Line #1', 'BATCH', 'PACKAGING', 50, 'T', 'Shipping', 'AVAILABLE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM equipment WHERE equipment_code = 'PACK-001');

-- =====================================================
-- 8. OPERATORS (12)
-- =====================================================
INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-001', 'John Martinez', 'Melt Shop', 'A', 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-001');

INSERT INTO operators (operator_code, name, department, shift, status, created_on, created_by)
SELECT 'OP-002', 'Sarah Wilson', 'Melt Shop', 'B', 'ACTIVE', NOW(), 'SYSTEM'
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
SELECT 'OP-012', 'Amanda Harris', 'Quality', 'B', 'INACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM operators WHERE operator_code = 'OP-012');

-- =====================================================
-- 9. PROCESS PARAMETERS CONFIG
-- =====================================================
INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'MELTING', NULL, 'Temperature', 'DECIMAL', '°C', 1550, 1700, 1620, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'MELTING' AND parameter_name = 'Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'MELTING', NULL, 'Power', 'DECIMAL', 'MW', 30, 80, 55, true, 2, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'MELTING' AND parameter_name = 'Power');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'CASTING', NULL, 'Casting Speed', 'DECIMAL', 'm/min', 0.8, 2.5, 1.2, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'CASTING' AND parameter_name = 'Casting Speed');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'CASTING', NULL, 'Mold Temperature', 'DECIMAL', '°C', 200, 350, 280, true, 2, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'CASTING' AND parameter_name = 'Mold Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'HOT_ROLLING', NULL, 'Entry Temperature', 'DECIMAL', '°C', 1100, 1250, 1180, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'HOT_ROLLING' AND parameter_name = 'Entry Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'HOT_ROLLING', NULL, 'Finish Temperature', 'DECIMAL', '°C', 850, 950, 880, true, 2, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'HOT_ROLLING' AND parameter_name = 'Finish Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'COLD_ROLLING', NULL, 'Rolling Force', 'DECIMAL', 'kN', 5000, 25000, 15000, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'COLD_ROLLING' AND parameter_name = 'Rolling Force');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'ANNEALING', NULL, 'Soak Temperature', 'DECIMAL', '°C', 650, 750, 700, true, 1, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'ANNEALING' AND parameter_name = 'Soak Temperature');

INSERT INTO process_parameters_config (operation_type, product_sku, parameter_name, parameter_type, unit, min_value, max_value, default_value, is_required, display_order, status, created_on, created_by)
SELECT 'ANNEALING', NULL, 'Soak Time', 'DECIMAL', 'hours', 8, 24, 16, true, 2, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM process_parameters_config WHERE operation_type = 'ANNEALING' AND parameter_name = 'Soak Time');

-- =====================================================
-- 10. BATCH NUMBER CONFIGURATION
-- =====================================================
INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, separator, include_date, date_format, sequence_length, sequence_reset, priority, status, created_on, created_by)
SELECT 'Melting Batch', 'MELTING', NULL, 'MLT', '-', true, 'yyMMdd', 4, 'DAILY', 10, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_number_config WHERE config_name = 'Melting Batch');

INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, separator, include_date, date_format, sequence_length, sequence_reset, priority, status, created_on, created_by)
SELECT 'Casting Batch', 'CASTING', NULL, 'CST', '-', true, 'yyMMdd', 4, 'DAILY', 10, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_number_config WHERE config_name = 'Casting Batch');

INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, separator, include_date, date_format, sequence_length, sequence_reset, priority, status, created_on, created_by)
SELECT 'Rolling Batch', 'HOT_ROLLING', NULL, 'HRL', '-', true, 'yyMMdd', 4, 'DAILY', 10, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_number_config WHERE config_name = 'Rolling Batch');

INSERT INTO batch_number_config (config_name, operation_type, product_sku, prefix, separator, include_date, date_format, sequence_length, sequence_reset, priority, status, created_on, created_by)
SELECT 'Receipt Batch', 'RECEIPT', NULL, 'RCV', '-', true, 'yyMMdd', 4, 'DAILY', 5, 'ACTIVE', NOW(), 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_number_config WHERE config_name = 'Receipt Batch');

-- =====================================================
-- 11. PROCESSES (6)
-- =====================================================
INSERT INTO processes (process_id, process_name, status, created_by)
SELECT v.* FROM (VALUES
  (1::bigint, 'Hot Rolled Coil Production', 'ACTIVE', 'SYSTEM'),
  (2, 'Cold Rolled Sheet Production', 'ACTIVE', 'SYSTEM'),
  (3, 'Rebar Production', 'ACTIVE', 'SYSTEM'),
  (4, 'Billet Production', 'ACTIVE', 'SYSTEM'),
  (5, 'Wire Rod Production', 'DRAFT', 'SYSTEM'),
  (6, 'Galvanized Sheet Production', 'INACTIVE', 'SYSTEM')
) AS v(process_id, process_name, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM processes WHERE process_id = 1);

SELECT setval('processes_process_id_seq', (SELECT COALESCE(MAX(process_id), 1) FROM processes));

-- =====================================================
-- 12. OPERATION TEMPLATES (18)
-- =====================================================
INSERT INTO operation_templates (operation_template_id, operation_name, operation_code, operation_type, quantity_type, default_equipment_type, description, estimated_duration_minutes, status, created_by)
SELECT v.* FROM (VALUES
  (1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 'BATCH', 'EAF', 'Load scrap into electric arc furnace', 60::int, 'ACTIVE', 'SYSTEM'),
  (2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 'BATCH', 'EAF', 'Melt scrap in electric arc furnace', 180, 'ACTIVE', 'SYSTEM'),
  (3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 'BATCH', 'LF', 'Refine steel chemistry in ladle furnace', 90, 'ACTIVE', 'SYSTEM'),
  (4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 'CONTINUOUS', 'CCM', 'Continuous cast liquid steel into slabs', 240, 'ACTIVE', 'SYSTEM'),
  (5, 'Billet Casting', 'CAST-BILL', 'CASTER', 'CONTINUOUS', 'CCM', 'Continuous cast liquid steel into billets', 180, 'ACTIVE', 'SYSTEM'),
  (6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 'BATCH', 'RHF', 'Reheat slabs for hot rolling', 120, 'ACTIVE', 'SYSTEM'),
  (7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 'CONTINUOUS', 'HSM', 'Rough roll slabs to intermediate thickness', 60, 'ACTIVE', 'SYSTEM'),
  (8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 'CONTINUOUS', 'HSM', 'Finish roll to target thickness', 45, 'ACTIVE', 'SYSTEM'),
  (9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 'CONTINUOUS', 'HSM', 'Cool and coil hot rolled strip', 30, 'ACTIVE', 'SYSTEM'),
  (10, 'Pickling', 'PKL', 'PICKLING', 'CONTINUOUS', 'PKL', 'Remove scale via acid pickling', 90, 'ACTIVE', 'SYSTEM'),
  (11, 'Cold Rolling', 'CRM', 'ROLLING', 'CONTINUOUS', 'CRM', 'Cold reduce thickness', 120, 'ACTIVE', 'SYSTEM'),
  (12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 'BATCH', 'BAF', 'Anneal cold rolled coils', 480, 'ACTIVE', 'SYSTEM'),
  (13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 'BATCH', 'RHF', 'Reheat billets for bar rolling', 90, 'ACTIVE', 'SYSTEM'),
  (14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 'CONTINUOUS', 'BRM', 'Roll billets into bars/rebar', 60, 'ACTIVE', 'SYSTEM'),
  (15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 'CONTINUOUS', 'QT', 'Quench and temper rebar', 30, 'ACTIVE', 'SYSTEM'),
  (16, 'Quality Inspection', 'QC', 'INSPECTION', 'DISCRETE', 'LAB', 'Perform quality inspection', 60, 'ACTIVE', 'SYSTEM'),
  (17, 'Packaging', 'PACK', 'FINISHING', 'DISCRETE', 'PACK', 'Package finished products', 45, 'ACTIVE', 'SYSTEM'),
  (18, 'Galvanizing', 'GALV', 'COATING', 'CONTINUOUS', 'GALV', 'Hot-dip galvanize steel', 120, 'INACTIVE', 'SYSTEM')
) AS v(operation_template_id, operation_name, operation_code, operation_type, quantity_type, default_equipment_type, description, estimated_duration_minutes, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operation_templates WHERE operation_template_id = 1);

SELECT setval('operation_templates_operation_template_id_seq', (SELECT COALESCE(MAX(operation_template_id), 1) FROM operation_templates));

-- =====================================================
-- 13. ORDERS (15)
-- =====================================================
INSERT INTO orders (order_id, order_number, customer_id, customer_name, order_date, status, created_by)
SELECT v.* FROM (VALUES
  (1::bigint, 'ORD-2026-001', 'CUST-001', 'ABC Steel Corporation', '2026-01-10'::date, 'IN_PROGRESS', 'SYSTEM'),
  (2, 'ORD-2026-002', 'CUST-002', 'Global Manufacturing Ltd', '2026-01-12'::date, 'IN_PROGRESS', 'SYSTEM'),
  (3, 'ORD-2026-003', 'CUST-006', 'BuildRight Construction', '2026-01-15'::date, 'IN_PROGRESS', 'SYSTEM'),
  (4, 'ORD-2026-004', 'CUST-003', 'Pacific Metal Works', '2026-01-18'::date, 'CREATED', 'SYSTEM'),
  (5, 'ORD-2026-005', 'CUST-004', 'European Auto Parts GmbH', '2026-01-20'::date, 'COMPLETED', 'SYSTEM'),
  (6, 'ORD-2026-006', 'CUST-007', 'Nordic Steel Trading AB', '2026-01-22'::date, 'CREATED', 'SYSTEM'),
  (7, 'ORD-2026-007', 'CUST-008', 'Middle East Metals FZE', '2026-01-25'::date, 'CREATED', 'SYSTEM'),
  (8, 'ORD-2026-008', 'CUST-005', 'Asian Electronics Inc', '2026-01-28'::date, 'ON_HOLD', 'SYSTEM'),
  (9, 'ORD-2026-009', 'CUST-009', 'South American Steel SA', '2026-01-30'::date, 'CREATED', 'SYSTEM'),
  (10, 'ORD-2026-010', 'CUST-010', 'African Mining Corp', '2026-01-31'::date, 'CREATED', 'SYSTEM'),
  (11, 'ORD-2026-011', 'CUST-011', 'Oceanic Metals Ltd', '2026-02-01'::date, 'IN_PROGRESS', 'SYSTEM'),
  (12, 'ORD-2026-012', 'CUST-001', 'ABC Steel Corporation', '2026-02-02'::date, 'COMPLETED', 'SYSTEM'),
  (13, 'ORD-2026-013', 'CUST-002', 'Global Manufacturing Ltd', '2026-02-03'::date, 'COMPLETED', 'SYSTEM'),
  (14, 'ORD-2026-014', 'CUST-003', 'Pacific Metal Works', '2026-02-04'::date, 'CANCELLED', 'SYSTEM'),
  (15, 'ORD-2026-015', 'CUST-007', 'Nordic Steel Trading AB', '2026-02-05'::date, 'BLOCKED', 'SYSTEM')
) AS v(order_id, order_number, customer_id, customer_name, order_date, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM orders WHERE order_id = 1);

SELECT setval('orders_order_id_seq', (SELECT COALESCE(MAX(order_id), 1) FROM orders));

-- =====================================================
-- 14. ORDER LINE ITEMS (25)
-- =====================================================
INSERT INTO order_line_items (order_line_id, order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by)
SELECT v.* FROM (VALUES
  (1::bigint, 1::bigint, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 150::numeric, 'T', '2026-02-15'::date, 'IN_PROGRESS', 'SYSTEM'),
  (2, 2, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 80::numeric, 'T', '2026-03-05'::date, 'IN_PROGRESS', 'SYSTEM'),
  (3, 3, 'REBAR-10MM', 'Reinforcement Bar 10mm', 200::numeric, 'T', '2026-02-20'::date, 'IN_PROGRESS', 'SYSTEM'),
  (4, 4, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 100::numeric, 'T', '2026-03-10'::date, 'CREATED', 'SYSTEM'),
  (5, 4, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 50::numeric, 'T', '2026-03-15'::date, 'CREATED', 'SYSTEM'),
  (6, 4, 'REBAR-10MM', 'Reinforcement Bar 10mm', 80::numeric, 'T', '2026-03-10'::date, 'CREATED', 'SYSTEM'),
  (7, 5, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 75::numeric, 'T', '2026-02-10'::date, 'COMPLETED', 'SYSTEM'),
  (8, 6, 'REBAR-10MM', 'Reinforcement Bar 10mm', 300::numeric, 'T', '2026-03-01'::date, 'CREATED', 'SYSTEM'),
  (9, 7, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 120::numeric, 'T', '2026-03-20'::date, 'CREATED', 'SYSTEM'),
  (10, 8, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 60::numeric, 'T', '2026-03-25'::date, 'ON_HOLD', 'SYSTEM'),
  (11, 9, 'HR-COIL-3MM', 'Hot Rolled Coil 3mm', 250::numeric, 'T', '2026-03-15'::date, 'CREATED', 'SYSTEM'),
  (12, 10, 'STEEL-BILLET-100', 'Steel Billet 100mm', 400::numeric, 'T', '2026-03-10'::date, 'CREATED', 'SYSTEM'),
  (13, 11, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 180::numeric, 'T', '2026-03-20'::date, 'IN_PROGRESS', 'SYSTEM'),
  (14, 12, 'REBAR-12MM', 'Reinforcement Bar 12mm', 180::numeric, 'T', '2026-02-28'::date, 'COMPLETED', 'SYSTEM'),
  (15, 13, 'HR-COIL-4MM', 'Hot Rolled Coil 4mm', 120::numeric, 'T', '2026-02-25'::date, 'COMPLETED', 'SYSTEM'),
  (16, 14, 'CR-SHEET-1MM', 'Cold Rolled Sheet 1mm', 90::numeric, 'T', '2026-03-30'::date, 'CANCELLED', 'SYSTEM'),
  (17, 15, 'STEEL-BILLET-100', 'Steel Billet 100mm', 250::numeric, 'T', '2026-03-25'::date, 'BLOCKED', 'SYSTEM'),
  (18, 1, 'HR-COIL-3MM', 'Hot Rolled Coil 3mm', 50::numeric, 'T', '2026-02-20'::date, 'CREATED', 'SYSTEM'),
  (19, 2, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 40::numeric, 'T', '2026-03-10'::date, 'CREATED', 'SYSTEM'),
  (20, 3, 'REBAR-12MM', 'Reinforcement Bar 12mm', 100::numeric, 'T', '2026-02-25'::date, 'CREATED', 'SYSTEM'),
  (21, 6, 'REBAR-12MM', 'Reinforcement Bar 12mm', 150::numeric, 'T', '2026-03-05'::date, 'CREATED', 'SYSTEM'),
  (22, 9, 'HR-COIL-4MM', 'Hot Rolled Coil 4mm', 100::numeric, 'T', '2026-03-20'::date, 'CREATED', 'SYSTEM'),
  (23, 10, 'REBAR-10MM', 'Reinforcement Bar 10mm', 200::numeric, 'T', '2026-03-15'::date, 'CREATED', 'SYSTEM'),
  (24, 11, 'HR-COIL-2MM', 'Hot Rolled Coil 2mm', 80::numeric, 'T', '2026-03-15'::date, 'IN_PROGRESS', 'SYSTEM'),
  (25, 13, 'CR-SHEET-2MM', 'Cold Rolled Sheet 2mm', 60::numeric, 'T', '2026-02-28'::date, 'COMPLETED', 'SYSTEM')
) AS v(order_line_id, order_id, product_sku, product_name, quantity, unit, delivery_date, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM order_line_items WHERE order_line_id = 1);

SELECT setval('order_line_items_order_line_id_seq', (SELECT COALESCE(MAX(order_line_id), 1) FROM order_line_items));

-- =====================================================
-- 15. OPERATIONS (93)
-- =====================================================
INSERT INTO operations (operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
SELECT v.* FROM (VALUES
  (1::bigint, 1::bigint, 1::bigint, 1::bigint, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1::int, 'CONFIRMED', 150::numeric, 'SYSTEM'),
  (2, 1, 1, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 150, 'SYSTEM'),
  (3, 1, 1, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 150, 'SYSTEM'),
  (4, 1, 1, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 150, 'SYSTEM'),
  (5, 1, 1, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 150, 'SYSTEM'),
  (6, 1, 1, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'READY', 150, 'SYSTEM'),
  (7, 1, 1, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 150, 'SYSTEM'),
  (8, 1, 1, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 150, 'SYSTEM'),
  (9, 2, 2, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 80, 'SYSTEM'),
  (10, 2, 2, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 80, 'SYSTEM'),
  (11, 2, 2, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 80, 'SYSTEM'),
  (12, 3, 3, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 200, 'SYSTEM'),
  (13, 3, 3, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 200, 'SYSTEM'),
  (14, 3, 3, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 200, 'SYSTEM'),
  (15, 3, 3, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'CONFIRMED', 200, 'SYSTEM'),
  (16, 3, 3, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'READY', 200, 'SYSTEM'),
  (17, 3, 3, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 200, 'SYSTEM'),
  (18, 3, 3, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 200, 'SYSTEM'),
  (19, 1, 7, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 75, 'SYSTEM'),
  (20, 1, 7, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 75, 'SYSTEM'),
  (21, 1, 7, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 75, 'SYSTEM'),
  (22, 1, 7, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 75, 'SYSTEM'),
  (23, 1, 7, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 75, 'SYSTEM'),
  (24, 1, 7, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 75, 'SYSTEM'),
  (25, 1, 7, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 75, 'SYSTEM'),
  (26, 1, 7, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 75, 'SYSTEM'),
  (27, 1, 10, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'ON_HOLD', 60, 'SYSTEM'),
  (28, 1, 10, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 60, 'SYSTEM'),
  (29, 2, 13, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'IN_PROGRESS', 180, 'SYSTEM'),
  (30, 2, 13, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 180, 'SYSTEM'),
  (31, 2, 13, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 180, 'SYSTEM'),
  (32, 3, 14, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 180, 'SYSTEM'),
  (33, 3, 14, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 180, 'SYSTEM'),
  (34, 3, 14, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 180, 'SYSTEM'),
  (35, 3, 14, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'CONFIRMED', 180, 'SYSTEM'),
  (36, 3, 14, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'CONFIRMED', 180, 'SYSTEM'),
  (37, 3, 14, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'CONFIRMED', 180, 'SYSTEM'),
  (38, 3, 14, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'CONFIRMED', 180, 'SYSTEM'),
  (39, 1, 15, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 120, 'SYSTEM'),
  (40, 1, 15, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'CONFIRMED', 120, 'SYSTEM'),
  (41, 1, 15, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'CONFIRMED', 120, 'SYSTEM'),
  (42, 1, 15, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'CONFIRMED', 120, 'SYSTEM'),
  (43, 1, 15, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'CONFIRMED', 120, 'SYSTEM'),
  (44, 1, 15, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'CONFIRMED', 120, 'SYSTEM'),
  (45, 1, 15, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'CONFIRMED', 120, 'SYSTEM'),
  (46, 1, 15, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'CONFIRMED', 120, 'SYSTEM'),
  (47, 4, 12, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'BLOCKED', 400, 'SYSTEM'),
  (48, 4, 12, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 400, 'SYSTEM'),
  (49, 1, 24, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'CONFIRMED', 80, 'SYSTEM'),
  (50, 1, 24, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'READY', 80, 'SYSTEM'),
  (51, 1, 24, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 80, 'SYSTEM'),
  (52, 1, 4, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 100, 'SYSTEM'),
  (53, 3, 8, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 300, 'SYSTEM'),
  (54, 2, 9, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 120, 'SYSTEM'),
  (55, 1, 11, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'PARTIALLY_CONFIRMED', 250, 'SYSTEM'),
  (56, 1, 11, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 250, 'SYSTEM'),
  (57, 3, 6, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'NOT_STARTED', 80, 'SYSTEM'),
  (58, 2, 5, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'NOT_STARTED', 50, 'SYSTEM'),
  (59, 4, 17, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'BLOCKED', 250, 'SYSTEM'),
  (60, 3, 23, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'NOT_STARTED', 200, 'SYSTEM'),
  (61, 1, 18, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 50, 'SYSTEM'),
  (62, 1, 18, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 50, 'SYSTEM'),
  (63, 1, 18, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 50, 'SYSTEM'),
  (64, 1, 18, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 50, 'SYSTEM'),
  (65, 1, 18, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 50, 'SYSTEM'),
  (66, 1, 18, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 50, 'SYSTEM'),
  (67, 1, 18, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 50, 'SYSTEM'),
  (68, 1, 18, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 50, 'SYSTEM'),
  (69, 2, 19, 10, 'Pickling', 'PKL', 'PICKLING', 1, 'READY', 40, 'SYSTEM'),
  (70, 2, 19, 11, 'Cold Rolling', 'CRM', 'ROLLING', 2, 'NOT_STARTED', 40, 'SYSTEM'),
  (71, 2, 19, 12, 'Batch Annealing', 'ANN', 'HEAT_TREATMENT', 3, 'NOT_STARTED', 40, 'SYSTEM'),
  (72, 3, 20, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 100, 'SYSTEM'),
  (73, 3, 20, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 100, 'SYSTEM'),
  (74, 3, 20, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 100, 'SYSTEM'),
  (75, 3, 20, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 100, 'SYSTEM'),
  (76, 3, 20, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 100, 'SYSTEM'),
  (77, 3, 20, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 100, 'SYSTEM'),
  (78, 3, 20, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 100, 'SYSTEM'),
  (79, 3, 21, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 150, 'SYSTEM'),
  (80, 3, 21, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 150, 'SYSTEM'),
  (81, 3, 21, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 150, 'SYSTEM'),
  (82, 3, 21, 5, 'Billet Casting', 'CAST-BILL', 'CASTER', 4, 'NOT_STARTED', 150, 'SYSTEM'),
  (83, 3, 21, 13, 'Billet Reheating', 'BAR-RHT', 'FURNACE', 5, 'NOT_STARTED', 150, 'SYSTEM'),
  (84, 3, 21, 14, 'Bar Rolling', 'BAR-ROLL', 'ROLLING', 6, 'NOT_STARTED', 150, 'SYSTEM'),
  (85, 3, 21, 15, 'Quenching & Tempering', 'BAR-QT', 'HEAT_TREATMENT', 7, 'NOT_STARTED', 150, 'SYSTEM'),
  (86, 1, 22, 1, 'Scrap Charging', 'MELT-CHRG', 'FURNACE', 1, 'READY', 100, 'SYSTEM'),
  (87, 1, 22, 2, 'EAF Melting', 'MELT-EAF', 'FURNACE', 2, 'NOT_STARTED', 100, 'SYSTEM'),
  (88, 1, 22, 3, 'Ladle Refining', 'MELT-LF', 'FURNACE', 3, 'NOT_STARTED', 100, 'SYSTEM'),
  (89, 1, 22, 4, 'Slab Casting', 'CAST-SLAB', 'CASTER', 4, 'NOT_STARTED', 100, 'SYSTEM'),
  (90, 1, 22, 6, 'Slab Reheating', 'ROLL-RHT', 'FURNACE', 5, 'NOT_STARTED', 100, 'SYSTEM'),
  (91, 1, 22, 7, 'Rough Rolling', 'ROLL-RGH', 'ROLLING', 6, 'NOT_STARTED', 100, 'SYSTEM'),
  (92, 1, 22, 8, 'Finish Rolling', 'ROLL-FIN', 'ROLLING', 7, 'NOT_STARTED', 100, 'SYSTEM'),
  (93, 1, 22, 9, 'Cooling & Coiling', 'ROLL-COOL', 'COOLING', 8, 'NOT_STARTED', 100, 'SYSTEM')
) AS v(operation_id, process_id, order_line_id, operation_template_id, operation_name, operation_code, operation_type, sequence_number, status, target_qty, created_by)
WHERE NOT EXISTS (SELECT 1 FROM operations WHERE operation_id = 1);

SELECT setval('operations_operation_id_seq', (SELECT COALESCE(MAX(operation_id), 1) FROM operations));

-- =====================================================
-- 16. BATCHES (56)
-- =====================================================
INSERT INTO batches (batch_id, batch_number, material_id, material_name, quantity, unit, status, created_by)
SELECT v.* FROM (VALUES
  (1::bigint, 'B-RM-001', 'RM-SCRAP-A', 'Steel Scrap Grade A', 500::numeric, 'T', 'AVAILABLE', 'SYSTEM'),
  (2, 'B-RM-002', 'RM-SCRAP-A', 'Steel Scrap Grade A', 350, 'T', 'AVAILABLE', 'SYSTEM'),
  (3, 'B-RM-003', 'RM-SCRAP-B', 'Steel Scrap Grade B', 200, 'T', 'AVAILABLE', 'SYSTEM'),
  (4, 'B-RM-004', 'RM-IRON-ORE', 'Iron Ore Pellets', 400, 'T', 'AVAILABLE', 'SYSTEM'),
  (5, 'B-RM-005', 'RM-LIMESTONE', 'Limestone', 150, 'T', 'AVAILABLE', 'SYSTEM'),
  (6, 'B-RM-006', 'RM-FESI', 'Ferroalloy FeSi', 2000, 'KG', 'AVAILABLE', 'SYSTEM'),
  (7, 'B-RM-007', 'RM-FEMN', 'Ferroalloy FeMn', 1500, 'KG', 'AVAILABLE', 'SYSTEM'),
  (8, 'B-RM-008', 'RM-COAL', 'Coal / Coke', 300, 'T', 'AVAILABLE', 'SYSTEM'),
  (9, 'B-RM-009', 'RM-GRAPHITE', 'Graphite Electrodes', 50, 'EA', 'AVAILABLE', 'SYSTEM'),
  (10, 'B-RM-010', 'RM-SCRAP-A', 'Steel Scrap Grade A', 180, 'T', 'ON_HOLD', 'SYSTEM'),
  (11, 'B-RM-011', 'RM-SCRAP-B', 'Steel Scrap Grade B', 120, 'T', 'AVAILABLE', 'SYSTEM'),
  (12, 'B-RM-012', 'RM-HCL', 'Hydrochloric Acid', 5000, 'L', 'AVAILABLE', 'SYSTEM'),
  (13, 'B-RM-013', 'RM-COATING', 'Surface Coating Oil', 2000, 'L', 'AVAILABLE', 'SYSTEM'),
  (14, 'B-RM-014', 'RM-ROLL-LUB', 'Rolling Lubricant', 3000, 'L', 'AVAILABLE', 'SYSTEM'),
  (15, 'B-RM-015', 'RM-MOLD-PWD', 'Mold Powder', 1000, 'KG', 'AVAILABLE', 'SYSTEM'),
  (16, 'B-RM-016', 'RM-AL-WIRE', 'Aluminum Wire', 500, 'KG', 'AVAILABLE', 'SYSTEM'),
  (17, 'B-RM-017', 'RM-SCRAP-C', 'Steel Scrap Grade C', 250, 'T', 'AVAILABLE', 'SYSTEM'),
  (18, 'B-RM-018', 'RM-FEV', 'Ferroalloy FeV', 100, 'KG', 'AVAILABLE', 'SYSTEM'),
  (19, 'B-IM-001', 'IM-LIQUID', 'Liquid Steel', 165, 'T', 'CONSUMED', 'SYSTEM'),
  (20, 'B-IM-002', 'IM-SLAB', 'Steel Slab 200mm', 155, 'T', 'AVAILABLE', 'SYSTEM'),
  (21, 'B-IM-003', 'IM-LIQUID', 'Liquid Steel', 90, 'T', 'CONSUMED', 'SYSTEM'),
  (22, 'B-IM-004', 'IM-LIQUID', 'Liquid Steel', 220, 'T', 'CONSUMED', 'SYSTEM'),
  (23, 'B-IM-005', 'IM-BILLET', 'Steel Billet 100mm', 210, 'T', 'AVAILABLE', 'SYSTEM'),
  (24, 'B-IM-006', 'IM-LIQUID', 'Liquid Steel', 85, 'T', 'CONSUMED', 'SYSTEM'),
  (25, 'B-IM-007', 'IM-SLAB', 'Steel Slab 200mm', 82, 'T', 'CONSUMED', 'SYSTEM'),
  (26, 'B-IM-008', 'IM-HR-ROUGH', 'HR Coil Rough', 78, 'T', 'CONSUMED', 'SYSTEM'),
  (27, 'B-IM-009', 'IM-SLAB', 'Steel Slab 200mm', 30, 'T', 'QUALITY_PENDING', 'SYSTEM'),
  (28, 'B-IM-010', 'IM-BILLET', 'Steel Billet 100mm', 195, 'T', 'AVAILABLE', 'SYSTEM'),
  (29, 'B-IM-011', 'IM-PICKLED', 'Pickled HR Strip', 85, 'T', 'AVAILABLE', 'SYSTEM'),
  (30, 'B-IM-012', 'IM-CR-STRIP', 'Cold Rolled Strip', 80, 'T', 'PRODUCED', 'SYSTEM'),
  (31, 'B-IM-013', 'IM-ANNEALED', 'Annealed CR Strip', 75, 'T', 'AVAILABLE', 'SYSTEM'),
  (32, 'B-IM-014', 'IM-ROLLED-BAR', 'Rolled Bar', 190, 'T', 'AVAILABLE', 'SYSTEM'),
  (33, 'B-IM-015', 'IM-LIQUID', 'Liquid Steel', 130, 'T', 'PRODUCED', 'SYSTEM'),
  (34, 'B-IM-016', 'IM-SLAB', 'Steel Slab 200mm', 125, 'T', 'PRODUCED', 'SYSTEM'),
  (35, 'B-FG-001', 'FG-HR-2MM', 'HR Coil 2mm', 75, 'T', 'AVAILABLE', 'SYSTEM'),
  (36, 'B-FG-002', 'FG-CR-1MM', 'CR Sheet 1mm', 70, 'T', 'AVAILABLE', 'SYSTEM'),
  (37, 'B-FG-003', 'FG-REBAR-10', 'Rebar 10mm', 180, 'T', 'AVAILABLE', 'SYSTEM'),
  (38, 'B-FG-004', 'FG-HR-2MM', 'HR Coil 2mm', 120, 'T', 'AVAILABLE', 'SYSTEM'),
  (39, 'B-FG-005', 'FG-REBAR-10', 'Rebar 10mm', 175, 'T', 'PRODUCED', 'SYSTEM'),
  (40, 'B-FG-006', 'FG-CR-1MM', 'CR Sheet 1mm', 55, 'T', 'PRODUCED', 'SYSTEM'),
  (41, 'B-RM-019', 'RM-SCRAP-A', 'Steel Scrap Grade A', 100, 'T', 'BLOCKED', 'SYSTEM'),
  (42, 'B-IM-017', 'IM-SLAB', 'Steel Slab 200mm', 45, 'T', 'BLOCKED', 'SYSTEM'),
  (43, 'B-IM-018', 'IM-BILLET', 'Steel Billet 100mm', 60, 'T', 'QUALITY_PENDING', 'SYSTEM'),
  (44, 'B-FG-007', 'FG-HR-2MM', 'HR Coil 2mm', 25, 'T', 'QUALITY_PENDING', 'SYSTEM'),
  (45, 'B-RM-020', 'RM-COAL', 'Coal (Contaminated)', 25, 'T', 'SCRAPPED', 'SYSTEM'),
  (46, 'B-RM-021', 'RM-SCRAP-A', 'Steel Scrap Grade A', 280, 'T', 'AVAILABLE', 'SYSTEM'),
  (47, 'B-RM-022', 'RM-SCRAP-B', 'Steel Scrap Grade B', 150, 'T', 'AVAILABLE', 'SYSTEM'),
  (48, 'B-IM-019', 'IM-HR-ROUGH', 'HR Coil Rough', 95, 'T', 'AVAILABLE', 'SYSTEM'),
  (49, 'B-IM-020', 'IM-LIQUID', 'Liquid Steel', 100, 'T', 'AVAILABLE', 'SYSTEM'),
  (50, 'B-FG-008', 'FG-REBAR-10', 'Rebar 10mm', 150, 'T', 'AVAILABLE', 'SYSTEM'),
  (51, 'B-WIP-001', 'WIP-MELT', 'Molten Steel EAF #1', 85, 'T', 'AVAILABLE', 'SYSTEM'),
  (52, 'B-WIP-002', 'WIP-MELT', 'Molten Steel EAF #2', 92, 'T', 'AVAILABLE', 'SYSTEM'),
  (53, 'B-WIP-003', 'WIP-CAST', 'Steel Being Cast', 78, 'T', 'AVAILABLE', 'SYSTEM'),
  (54, 'B-WIP-004', 'WIP-ROLL', 'Strip on Hot Mill', 65, 'T', 'AVAILABLE', 'SYSTEM'),
  (55, 'B-WIP-005', 'WIP-PICKLE', 'Strip in Pickle Line', 45, 'T', 'AVAILABLE', 'SYSTEM'),
  (56, 'B-WIP-006', 'WIP-ROLL', 'Strip on Cold Mill', 55, 'T', 'AVAILABLE', 'SYSTEM')
) AS v(batch_id, batch_number, material_id, material_name, quantity, unit, status, created_by)
WHERE NOT EXISTS (SELECT 1 FROM batches WHERE batch_id = 1);

SELECT setval('batches_batch_id_seq', (SELECT COALESCE(MAX(batch_id), 1) FROM batches));

-- =====================================================
-- 17. INVENTORY (56)
-- =====================================================
INSERT INTO inventory (inventory_id, material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
SELECT v.* FROM (VALUES
  (1::bigint, 'RM-SCRAP-A', 'Steel Scrap Grade A', 'RM', 'AVAILABLE', 500::numeric, 'T', 1::bigint, 'Scrap Yard A', 'SYSTEM'),
  (2, 'RM-SCRAP-A', 'Steel Scrap Grade A', 'RM', 'AVAILABLE', 350, 'T', 2, 'Scrap Yard A', 'SYSTEM'),
  (3, 'RM-SCRAP-B', 'Steel Scrap Grade B', 'RM', 'AVAILABLE', 200, 'T', 3, 'Scrap Yard B', 'SYSTEM'),
  (4, 'RM-IRON-ORE', 'Iron Ore Pellets', 'RM', 'AVAILABLE', 400, 'T', 4, 'Ore Storage', 'SYSTEM'),
  (5, 'RM-LIMESTONE', 'Limestone', 'RM', 'AVAILABLE', 150, 'T', 5, 'Flux Store', 'SYSTEM'),
  (6, 'RM-FESI', 'Ferroalloy FeSi', 'RM', 'AVAILABLE', 2000, 'KG', 6, 'Alloy Store', 'SYSTEM'),
  (7, 'RM-FEMN', 'Ferroalloy FeMn', 'RM', 'AVAILABLE', 1500, 'KG', 7, 'Alloy Store', 'SYSTEM'),
  (8, 'RM-COAL', 'Coal / Coke', 'RM', 'AVAILABLE', 300, 'T', 8, 'Coal Yard', 'SYSTEM'),
  (9, 'RM-GRAPHITE', 'Graphite Electrodes', 'RM', 'AVAILABLE', 50, 'EA', 9, 'Electrode Store', 'SYSTEM'),
  (10, 'RM-SCRAP-A', 'Steel Scrap (On Hold)', 'RM', 'ON_HOLD', 180, 'T', 10, 'Scrap Yard C', 'SYSTEM'),
  (11, 'RM-SCRAP-B', 'Steel Scrap Grade B', 'RM', 'AVAILABLE', 120, 'T', 11, 'Scrap Yard B', 'SYSTEM'),
  (12, 'RM-HCL', 'Hydrochloric Acid', 'RM', 'AVAILABLE', 5000, 'L', 12, 'Chemical Store', 'SYSTEM'),
  (13, 'RM-COATING', 'Surface Coating Oil', 'RM', 'AVAILABLE', 2000, 'L', 13, 'Oil Store', 'SYSTEM'),
  (14, 'RM-ROLL-LUB', 'Rolling Lubricant', 'RM', 'AVAILABLE', 3000, 'L', 14, 'Oil Store', 'SYSTEM'),
  (15, 'RM-MOLD-PWD', 'Mold Powder', 'RM', 'AVAILABLE', 1000, 'KG', 15, 'Casting Store', 'SYSTEM'),
  (16, 'RM-AL-WIRE', 'Aluminum Wire', 'RM', 'AVAILABLE', 500, 'KG', 16, 'Alloy Store', 'SYSTEM'),
  (17, 'RM-SCRAP-C', 'Steel Scrap Grade C', 'RM', 'AVAILABLE', 250, 'T', 17, 'Scrap Yard C', 'SYSTEM'),
  (18, 'RM-FEV', 'Ferroalloy FeV', 'RM', 'AVAILABLE', 100, 'KG', 18, 'Alloy Store', 'SYSTEM'),
  (19, 'IM-SLAB', 'Steel Slab 200mm', 'IM', 'AVAILABLE', 155, 'T', 20, 'Slab Yard', 'SYSTEM'),
  (20, 'IM-BILLET', 'Steel Billet 100mm', 'IM', 'AVAILABLE', 210, 'T', 23, 'Billet Yard', 'SYSTEM'),
  (21, 'IM-BILLET', 'Steel Billet 100mm', 'IM', 'AVAILABLE', 195, 'T', 28, 'Billet Yard', 'SYSTEM'),
  (22, 'IM-PICKLED', 'Pickled HR Strip', 'IM', 'AVAILABLE', 85, 'T', 29, 'Pickling Bay', 'SYSTEM'),
  (23, 'IM-CR-STRIP', 'Cold Rolled Strip', 'IM', 'PRODUCED', 80, 'T', 30, 'Cold Mill', 'SYSTEM'),
  (24, 'IM-ANNEALED', 'Annealed CR Strip', 'IM', 'AVAILABLE', 75, 'T', 31, 'Annealing Bay', 'SYSTEM'),
  (25, 'IM-ROLLED-BAR', 'Rolled Bar', 'IM', 'AVAILABLE', 190, 'T', 32, 'Bar Mill', 'SYSTEM'),
  (26, 'IM-LIQUID', 'Liquid Steel', 'IM', 'PRODUCED', 130, 'T', 33, 'Ladle', 'SYSTEM'),
  (27, 'IM-SLAB', 'Steel Slab 200mm', 'IM', 'PRODUCED', 125, 'T', 34, 'Slab Yard', 'SYSTEM'),
  (28, 'IM-HR-ROUGH', 'HR Coil Rough', 'IM', 'AVAILABLE', 95, 'T', 48, 'Hot Mill', 'SYSTEM'),
  (29, 'IM-LIQUID', 'Liquid Steel', 'IM', 'AVAILABLE', 100, 'T', 49, 'Ladle', 'SYSTEM'),
  (30, 'FG-HR-2MM', 'HR Coil 2mm', 'FG', 'AVAILABLE', 75, 'T', 35, 'FG Warehouse 1', 'SYSTEM'),
  (31, 'FG-CR-1MM', 'CR Sheet 1mm', 'FG', 'AVAILABLE', 70, 'T', 36, 'FG Warehouse 2', 'SYSTEM'),
  (32, 'FG-REBAR-10', 'Rebar 10mm', 'FG', 'AVAILABLE', 180, 'T', 37, 'FG Warehouse 3', 'SYSTEM'),
  (33, 'FG-HR-2MM', 'HR Coil 2mm', 'FG', 'AVAILABLE', 120, 'T', 38, 'FG Warehouse 1', 'SYSTEM'),
  (34, 'FG-REBAR-10', 'Rebar 10mm', 'FG', 'PRODUCED', 175, 'T', 39, 'FG Warehouse 3', 'SYSTEM'),
  (35, 'FG-CR-1MM', 'CR Sheet 1mm', 'FG', 'PRODUCED', 55, 'T', 40, 'FG Warehouse 2', 'SYSTEM'),
  (36, 'FG-REBAR-10', 'Rebar 10mm', 'FG', 'AVAILABLE', 150, 'T', 50, 'FG Warehouse 3', 'SYSTEM'),
  (37, 'RM-SCRAP-A', 'Steel Scrap Grade A', 'RM', 'RESERVED', 200, 'T', 46, 'Scrap Yard A', 'SYSTEM'),
  (38, 'RM-SCRAP-B', 'Steel Scrap Grade B', 'RM', 'RESERVED', 100, 'T', 47, 'Scrap Yard B', 'SYSTEM'),
  (39, 'RM-SCRAP-A', 'Steel Scrap (Blocked)', 'RM', 'BLOCKED', 100, 'T', 41, 'Quarantine Area', 'SYSTEM'),
  (40, 'IM-SLAB', 'Steel Slab (Blocked)', 'IM', 'BLOCKED', 45, 'T', 42, 'QC Area', 'SYSTEM'),
  (41, 'IM-SLAB', 'Steel Slab (QC Pend)', 'IM', 'ON_HOLD', 30, 'T', 27, 'QC Area', 'SYSTEM'),
  (42, 'IM-BILLET', 'Steel Billet (QC)', 'IM', 'ON_HOLD', 60, 'T', 43, 'QC Area', 'SYSTEM'),
  (43, 'FG-HR-2MM', 'HR Coil (QC Pending)', 'FG', 'ON_HOLD', 25, 'T', 44, 'QC Area', 'SYSTEM'),
  (44, 'IM-LIQUID', 'Liquid Steel (Used)', 'IM', 'CONSUMED', 165, 'T', 19, 'Historical', 'SYSTEM'),
  (45, 'IM-LIQUID', 'Liquid Steel (Used)', 'IM', 'CONSUMED', 90, 'T', 21, 'Historical', 'SYSTEM'),
  (46, 'IM-LIQUID', 'Liquid Steel (Used)', 'IM', 'CONSUMED', 220, 'T', 22, 'Historical', 'SYSTEM'),
  (47, 'IM-SLAB', 'Steel Slab (Used)', 'IM', 'CONSUMED', 82, 'T', 25, 'Historical', 'SYSTEM'),
  (48, 'IM-HR-ROUGH', 'HR Coil Rough (Used)', 'IM', 'CONSUMED', 78, 'T', 26, 'Historical', 'SYSTEM'),
  (49, 'RM-COAL', 'Coal (Contaminated)', 'RM', 'SCRAPPED', 25, 'T', 45, 'Disposal', 'SYSTEM'),
  (50, 'RM-SCRAP-A', 'Steel Scrap Grade A', 'RM', 'AVAILABLE', 280, 'T', 46, 'Scrap Yard A', 'SYSTEM'),
  (51, 'WIP-MELT', 'Molten Steel (Active)', 'WIP', 'AVAILABLE', 85, 'T', 51, 'EAF #1', 'SYSTEM'),
  (52, 'WIP-MELT', 'Molten Steel (Active)', 'WIP', 'AVAILABLE', 92, 'T', 52, 'EAF #2', 'SYSTEM'),
  (53, 'WIP-CAST', 'Steel Being Cast', 'WIP', 'AVAILABLE', 78, 'T', 53, 'Caster #1', 'SYSTEM'),
  (54, 'WIP-ROLL', 'Strip on Mill', 'WIP', 'AVAILABLE', 65, 'T', 54, 'Hot Mill #1', 'SYSTEM'),
  (55, 'WIP-PICKLE', 'Strip in Pickle Line', 'WIP', 'AVAILABLE', 45, 'T', 55, 'Pickle Line #1', 'SYSTEM'),
  (56, 'WIP-ROLL', 'Strip on Mill', 'WIP', 'AVAILABLE', 55, 'T', 56, 'Cold Mill #1', 'SYSTEM')
) AS v(inventory_id, material_id, material_name, inventory_type, state, quantity, unit, batch_id, location, created_by)
WHERE NOT EXISTS (SELECT 1 FROM inventory WHERE inventory_id = 1);

SELECT setval('inventory_inventory_id_seq', (SELECT COALESCE(MAX(inventory_id), 1) FROM inventory));

-- =====================================================
-- 18. BATCH RELATIONS (40)
-- =====================================================
INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 1, 19, 'MERGE', 105, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 1 AND child_batch_id = 19 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 3, 19, 'MERGE', 30, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 3 AND child_batch_id = 19 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 4, 19, 'MERGE', 22, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 4 AND child_batch_id = 19 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 8, 19, 'MERGE', 15, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 8 AND child_batch_id = 19 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 19, 20, 'MERGE', 155, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 19 AND child_batch_id = 20 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 2, 22, 'MERGE', 160, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 2 AND child_batch_id = 22 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 11, 22, 'MERGE', 36, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 11 AND child_batch_id = 22 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 4, 22, 'MERGE', 30, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 4 AND child_batch_id = 22 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 8, 22, 'MERGE', 18, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 8 AND child_batch_id = 22 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 22, 23, 'MERGE', 210, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 22 AND child_batch_id = 23 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 1, 24, 'MERGE', 56, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 1 AND child_batch_id = 24 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 3, 24, 'MERGE', 16, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 3 AND child_batch_id = 24 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 4, 24, 'MERGE', 12, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 4 AND child_batch_id = 24 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 8, 24, 'MERGE', 8, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 8 AND child_batch_id = 24 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 24, 25, 'MERGE', 82, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 24 AND child_batch_id = 25 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 25, 26, 'MERGE', 78, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 25 AND child_batch_id = 26 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 26, 35, 'MERGE', 75, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 26 AND child_batch_id = 35 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 2, 33, 'MERGE', 140, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 2 AND child_batch_id = 33 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 17, 33, 'MERGE', 45, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 17 AND child_batch_id = 33 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 7, 33, 'MERGE', 8, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 7 AND child_batch_id = 33 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 33, 28, 'MERGE', 180, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 33 AND child_batch_id = 28 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 28, 32, 'MERGE', 178, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 28 AND child_batch_id = 32 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 32, 39, 'MERGE', 175, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 32 AND child_batch_id = 39 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 46, 49, 'MERGE', 100, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 46 AND child_batch_id = 49 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 47, 49, 'MERGE', 30, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 47 AND child_batch_id = 49 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 4, 49, 'MERGE', 10, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 4 AND child_batch_id = 49 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 49, 34, 'MERGE', 125, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 49 AND child_batch_id = 34 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 34, 48, 'MERGE', 120, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 34 AND child_batch_id = 48 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 48, 38, 'MERGE', 118, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 48 AND child_batch_id = 38 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 48, 29, 'MERGE', 90, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 48 AND child_batch_id = 29 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 29, 30, 'MERGE', 85, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 29 AND child_batch_id = 30 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 30, 31, 'MERGE', 80, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 30 AND child_batch_id = 31 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 31, 36, 'MERGE', 70, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 31 AND child_batch_id = 36 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 20, 27, 'SPLIT', 30, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 20 AND child_batch_id = 27 AND relation_type = 'SPLIT');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 1, 21, 'CONSUME', 50, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 1 AND child_batch_id = 21 AND relation_type = 'CONSUME');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 3, 21, 'CONSUME', 25, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 3 AND child_batch_id = 21 AND relation_type = 'CONSUME');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 21, 40, 'MERGE', 55, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 21 AND child_batch_id = 40 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 2, 19, 'MERGE', 40, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 2 AND child_batch_id = 19 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 6, 19, 'MERGE', 3, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 6 AND child_batch_id = 19 AND relation_type = 'MERGE');

INSERT INTO batch_relations (parent_batch_id, child_batch_id, relation_type, quantity_consumed, status, created_by)
SELECT 6, 22, 'MERGE', 2, 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM batch_relations WHERE parent_batch_id = 6 AND child_batch_id = 22 AND relation_type = 'MERGE');

-- =====================================================
-- Summary:
--   Users:           1 (admin)
--   Customers:       12
--   Materials:       55 (RM, IM, FG)
--   Products:        15
--   Equipment:       16
--   Operators:       12
--   Hold Reasons:    10
--   Delay Reasons:   10
--   Process Params:  9
--   Batch Configs:   4
--   Processes:       6
--   Op Templates:    18
--   Orders:          15
--   Order Lines:     25
--   Operations:      93
--   Batches:         56
--   Inventory:       56
--   Batch Relations: 40
-- =====================================================
