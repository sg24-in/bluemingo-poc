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
-- Summary:
--   Users:           1 (admin)
--   Customers:       12
--   Materials:       30+ (RM, IM, FG)
--   Products:        15
--   Equipment:       16
--   Operators:       12
--   Hold Reasons:    10
--   Delay Reasons:   10
--   Process Params:  9
--   Batch Configs:   4
-- =====================================================
