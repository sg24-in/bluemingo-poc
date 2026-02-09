-- =====================================================
-- MES Production Confirmation - Consolidated Schema
-- Single schema file with all required tables
-- =====================================================

-- =====================================================
-- 1. SYSTEM TABLES
-- =====================================================

-- Database Patches Tracking
CREATE TABLE IF NOT EXISTS database_patches (
    patch_id BIGSERIAL PRIMARY KEY,
    patch_name VARCHAR(255) NOT NULL UNIQUE,
    applied_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    applied_by VARCHAR(100),
    checksum VARCHAR(64)
);

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id BIGSERIAL PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    employee_id VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- =====================================================
-- 2. MASTER DATA TABLES
-- =====================================================

-- Customers
CREATE TABLE IF NOT EXISTS customers (
    customer_id BIGSERIAL PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(100),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_customer_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- Materials
CREATE TABLE IF NOT EXISTS materials (
    material_id BIGSERIAL PRIMARY KEY,
    material_code VARCHAR(50) NOT NULL UNIQUE,
    material_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    material_type VARCHAR(20) NOT NULL,
    base_unit VARCHAR(20) NOT NULL DEFAULT 'T',
    material_group VARCHAR(50),
    sku VARCHAR(50),
    standard_cost NUMERIC(15,4),
    cost_currency VARCHAR(3) DEFAULT 'USD',
    min_stock_level NUMERIC(15,4),
    max_stock_level NUMERIC(15,4),
    reorder_point NUMERIC(15,4),
    lead_time_days INTEGER,
    shelf_life_days INTEGER,
    storage_conditions VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_material_type CHECK (material_type IN ('RM', 'IM', 'FG', 'WIP')),
    CONSTRAINT chk_material_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'OBSOLETE'))
);

-- Products
CREATE TABLE IF NOT EXISTS products (
    product_id BIGSERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    product_category VARCHAR(100),
    product_group VARCHAR(100),
    base_unit VARCHAR(20) NOT NULL DEFAULT 'T',
    weight_per_unit NUMERIC(15,4),
    weight_unit VARCHAR(10),
    standard_price NUMERIC(15,4),
    price_currency VARCHAR(3) DEFAULT 'USD',
    min_order_qty NUMERIC(15,4),
    lead_time_days INTEGER,
    material_id BIGINT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_product_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED'))
);

-- Equipment
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id BIGSERIAL PRIMARY KEY,
    equipment_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(30) NOT NULL DEFAULT 'BATCH',
    equipment_category VARCHAR(50),
    capacity DECIMAL(15,4),
    capacity_unit VARCHAR(20),
    location VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    maintenance_reason VARCHAR(500),
    maintenance_start TIMESTAMP,
    maintenance_by VARCHAR(100),
    expected_maintenance_end TIMESTAMP,
    hold_reason VARCHAR(500),
    hold_start TIMESTAMP,
    held_by VARCHAR(100),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_equipment_type CHECK (equipment_type IN ('BATCH', 'CONTINUOUS')),
    CONSTRAINT chk_equipment_status CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'ON_HOLD', 'UNAVAILABLE'))
);

-- Operators
CREATE TABLE IF NOT EXISTS operators (
    operator_id BIGSERIAL PRIMARY KEY,
    operator_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    shift VARCHAR(20),
    certification VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- =====================================================
-- 3. ORDER MANAGEMENT TABLES
-- =====================================================

-- Orders
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE,
    customer_id VARCHAR(100),
    customer_name VARCHAR(255),
    order_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    notes TEXT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_order_status CHECK (status IN ('DRAFT', 'CREATED', 'PENDING', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED', 'ON_HOLD'))
);

-- Order Line Items
CREATE TABLE IF NOT EXISTS order_line_items (
    order_line_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    product_sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255),
    quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'T',
    delivery_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_line_status CHECK (status IN ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD'))
);

-- =====================================================
-- 4. BILL OF MATERIAL
-- =====================================================

CREATE TABLE IF NOT EXISTS bill_of_material (
    bom_id BIGSERIAL PRIMARY KEY,
    product_sku VARCHAR(100) NOT NULL,
    bom_version VARCHAR(20) DEFAULT 'V1',
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    quantity_required DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'T',
    yield_loss_ratio DECIMAL(10,4) DEFAULT 1.0,
    sequence_level INTEGER NOT NULL DEFAULT 1,
    parent_bom_id BIGINT REFERENCES bill_of_material(bom_id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_bom_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'OBSOLETE', 'ON_HOLD', 'DRAFT'))
);

-- =====================================================
-- 5. PROCESS & ROUTING TABLES
-- =====================================================

-- Processes (Design-time templates)
CREATE TABLE IF NOT EXISTS processes (
    process_id BIGSERIAL PRIMARY KEY,
    process_name VARCHAR(100) NOT NULL,
    stage_name VARCHAR(100),
    description VARCHAR(500),
    status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
    usage_decision VARCHAR(20),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_process_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DRAFT', 'ON_HOLD'))
);

-- Routing
CREATE TABLE IF NOT EXISTS routing (
    routing_id BIGSERIAL PRIMARY KEY,
    process_id BIGINT REFERENCES processes(process_id),
    routing_name VARCHAR(100) NOT NULL,
    routing_type VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_routing_type CHECK (routing_type IN ('SEQUENTIAL', 'PARALLEL')),
    CONSTRAINT chk_routing_status CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ON_HOLD'))
);

-- Operation Templates (Design-time)
CREATE TABLE IF NOT EXISTS operation_templates (
    operation_template_id BIGSERIAL PRIMARY KEY,
    operation_name VARCHAR(100) NOT NULL,
    operation_code VARCHAR(50),
    operation_type VARCHAR(50) NOT NULL,
    quantity_type VARCHAR(20) DEFAULT 'DISCRETE',
    default_equipment_type VARCHAR(50),
    description VARCHAR(500),
    estimated_duration_minutes INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_op_template_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_op_template_qty_type CHECK (quantity_type IN ('DISCRETE', 'BATCH', 'CONTINUOUS'))
);

-- Routing Steps
CREATE TABLE IF NOT EXISTS routing_steps (
    routing_step_id BIGSERIAL PRIMARY KEY,
    routing_id BIGINT NOT NULL REFERENCES routing(routing_id),
    operation_template_id BIGINT REFERENCES operation_templates(operation_template_id),
    sequence_number INTEGER NOT NULL,
    is_parallel BOOLEAN DEFAULT FALSE,
    mandatory_flag BOOLEAN DEFAULT TRUE,
    produces_output_batch BOOLEAN DEFAULT TRUE,
    allows_split BOOLEAN DEFAULT FALSE,
    allows_merge BOOLEAN DEFAULT FALSE,
    operation_name VARCHAR(100),
    operation_type VARCHAR(50),
    operation_code VARCHAR(50),
    target_qty DECIMAL(15,4),
    description VARCHAR(500),
    estimated_duration_minutes INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_routing_step_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);

-- Operations (Runtime instances)
CREATE TABLE IF NOT EXISTS operations (
    operation_id BIGSERIAL PRIMARY KEY,
    order_line_id BIGINT REFERENCES order_line_items(order_line_id),
    process_id BIGINT REFERENCES processes(process_id),
    routing_step_id BIGINT REFERENCES routing_steps(routing_step_id),
    operation_template_id BIGINT REFERENCES operation_templates(operation_template_id),
    operation_name VARCHAR(100) NOT NULL,
    operation_code VARCHAR(50),
    operation_type VARCHAR(50),
    sequence_number INTEGER NOT NULL DEFAULT 1,
    target_qty DECIMAL(15,4),
    planned_start TIMESTAMP,
    planned_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    block_reason VARCHAR(500),
    blocked_by VARCHAR(100),
    blocked_on TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_operation_status CHECK (status IN ('NOT_STARTED', 'READY', 'IN_PROGRESS', 'PARTIALLY_CONFIRMED', 'CONFIRMED', 'BLOCKED', 'ON_HOLD'))
);

-- Operation Equipment Usage
CREATE TABLE IF NOT EXISTS operation_equipment_usage (
    usage_id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT NOT NULL REFERENCES operations(operation_id),
    equipment_id BIGINT NOT NULL REFERENCES equipment(equipment_id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    operator_id BIGINT REFERENCES operators(operator_id),
    status VARCHAR(20) NOT NULL DEFAULT 'LOGGED',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT chk_equip_usage_status CHECK (status IN ('LOGGED', 'CONFIRMED'))
);

-- =====================================================
-- 6. PRODUCTION CONFIRMATION
-- =====================================================

CREATE TABLE IF NOT EXISTS production_confirmation (
    confirmation_id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT NOT NULL REFERENCES operations(operation_id),
    produced_qty DECIMAL(15,4) NOT NULL,
    scrap_qty DECIMAL(15,4) DEFAULT 0,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    delay_minutes INTEGER DEFAULT 0,
    delay_reason VARCHAR(100),
    equipment_id BIGINT REFERENCES equipment(equipment_id),
    operator_id BIGINT REFERENCES operators(operator_id),
    process_parameters JSONB,
    rm_consumed JSONB,
    is_partial BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    rejection_reason VARCHAR(500),
    rejected_by VARCHAR(100),
    rejected_on TIMESTAMP,
    notes TEXT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_confirm_status CHECK (status IN ('CONFIRMED', 'PARTIALLY_CONFIRMED', 'REJECTED'))
);

-- =====================================================
-- 7. BATCH MANAGEMENT
-- =====================================================

-- Batches
CREATE TABLE IF NOT EXISTS batches (
    batch_id BIGSERIAL PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'T',
    generated_at_operation_id BIGINT REFERENCES operations(operation_id),
    supplier_id VARCHAR(100),
    supplier_name VARCHAR(255),
    supplier_batch_number VARCHAR(100),
    created_via_receipt BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    approved_by VARCHAR(100),
    approved_on TIMESTAMP,
    rejection_reason VARCHAR(500),
    rejected_by VARCHAR(100),
    rejected_on TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_batch_status CHECK (status IN ('AVAILABLE', 'CONSUMED', 'PRODUCED', 'ON_HOLD', 'BLOCKED', 'SCRAPPED', 'QUALITY_PENDING'))
);

-- Batch Relations (Genealogy)
CREATE TABLE IF NOT EXISTS batch_relations (
    relation_id BIGSERIAL PRIMARY KEY,
    parent_batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    child_batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    operation_id BIGINT REFERENCES operations(operation_id),
    relation_type VARCHAR(20) NOT NULL DEFAULT 'MERGE',
    quantity_consumed DECIMAL(15,4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT chk_relation_type CHECK (relation_type IN ('SPLIT', 'MERGE')),
    CONSTRAINT chk_relation_status CHECK (status IN ('ACTIVE', 'CLOSED'))
);

-- Batch Order Allocation
CREATE TABLE IF NOT EXISTS batch_order_allocation (
    allocation_id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    order_line_id BIGINT NOT NULL REFERENCES order_line_items(order_line_id),
    allocated_qty DECIMAL(15,4) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ALLOCATED',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT chk_allocation_status CHECK (status IN ('ALLOCATED', 'RELEASED'))
);

-- Batch Quantity Adjustments
CREATE TABLE IF NOT EXISTS batch_quantity_adjustments (
    adjustment_id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    adjustment_qty DECIMAL(15,4) NOT NULL,
    new_total_qty DECIMAL(15,4) NOT NULL,
    reason VARCHAR(500) NOT NULL,
    adjustment_type VARCHAR(50),
    reference_document VARCHAR(100),
    adjusted_by VARCHAR(100) NOT NULL,
    adjusted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 8. INVENTORY MANAGEMENT
-- =====================================================

-- Inventory
CREATE TABLE IF NOT EXISTS inventory (
    inventory_id BIGSERIAL PRIMARY KEY,
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    inventory_type VARCHAR(20) NOT NULL,
    state VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'T',
    batch_id BIGINT REFERENCES batches(batch_id),
    location VARCHAR(100),
    block_reason VARCHAR(500),
    blocked_by VARCHAR(100),
    blocked_on TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_inventory_type CHECK (inventory_type IN ('RM', 'IM', 'FG', 'WIP')),
    CONSTRAINT chk_inventory_state CHECK (state IN ('AVAILABLE', 'RESERVED', 'CONSUMED', 'PRODUCED', 'BLOCKED', 'SCRAPPED', 'ON_HOLD'))
);

-- Inventory Movement
CREATE TABLE IF NOT EXISTS inventory_movement (
    movement_id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT REFERENCES operations(operation_id),
    inventory_id BIGINT NOT NULL REFERENCES inventory(inventory_id),
    movement_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'EXECUTED',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT chk_movement_type CHECK (movement_type IN ('CONSUME', 'PRODUCE', 'HOLD', 'RELEASE', 'SCRAP', 'RECEIVE')),
    CONSTRAINT chk_movement_status CHECK (status IN ('EXECUTED', 'PENDING', 'ON_HOLD'))
);

-- =====================================================
-- 9. HOLD MANAGEMENT
-- =====================================================

-- Hold Reasons (Lookup)
CREATE TABLE IF NOT EXISTS hold_reasons (
    reason_id BIGSERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    applicable_to VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Delay Reasons (Lookup)
CREATE TABLE IF NOT EXISTS delay_reasons (
    reason_id BIGSERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Hold Records
CREATE TABLE IF NOT EXISTS hold_records (
    hold_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL,
    entity_id BIGINT NOT NULL,
    entity_name VARCHAR(255),
    reason VARCHAR(100) NOT NULL,
    comments TEXT,
    applied_by VARCHAR(100) NOT NULL,
    applied_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_by VARCHAR(100),
    released_on TIMESTAMP,
    release_comments TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hold_entity_type CHECK (entity_type IN ('OPERATION', 'PROCESS', 'ORDER', 'ORDER_LINE', 'INVENTORY', 'BATCH', 'EQUIPMENT')),
    CONSTRAINT chk_hold_status CHECK (status IN ('ACTIVE', 'RELEASED'))
);

-- =====================================================
-- 10. AUDIT TRAIL
-- =====================================================

CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    action VARCHAR(50) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- 11. CONFIGURATION TABLES
-- =====================================================

-- Process Parameters Config
CREATE TABLE IF NOT EXISTS process_parameters_config (
    config_id BIGSERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    product_sku VARCHAR(100),
    parameter_name VARCHAR(100) NOT NULL,
    parameter_type VARCHAR(30) NOT NULL DEFAULT 'DECIMAL',
    unit VARCHAR(20),
    min_value DECIMAL(15,4),
    max_value DECIMAL(15,4),
    default_value DECIMAL(15,4),
    is_required BOOLEAN DEFAULT FALSE,
    display_order INTEGER DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Batch Number Config
CREATE TABLE IF NOT EXISTS batch_number_config (
    config_id BIGSERIAL PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL UNIQUE,
    operation_type VARCHAR(50),
    product_sku VARCHAR(100),
    prefix VARCHAR(50) NOT NULL DEFAULT 'BATCH',
    include_operation_code BOOLEAN DEFAULT TRUE,
    operation_code_length INTEGER DEFAULT 2,
    separator VARCHAR(5) NOT NULL DEFAULT '-',
    date_format VARCHAR(20) DEFAULT 'yyyyMMdd',
    include_date BOOLEAN DEFAULT TRUE,
    sequence_length INTEGER NOT NULL DEFAULT 3,
    sequence_reset VARCHAR(20) DEFAULT 'DAILY',
    priority INTEGER DEFAULT 100,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Batch Number Sequence Tracking
CREATE TABLE IF NOT EXISTS batch_number_sequence (
    sequence_id BIGSERIAL PRIMARY KEY,
    config_id BIGINT NOT NULL REFERENCES batch_number_config(config_id),
    sequence_key VARCHAR(200) NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    last_reset_on TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_id, sequence_key)
);

-- Batch Size Config
CREATE TABLE IF NOT EXISTS batch_size_config (
    config_id BIGSERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    product_sku VARCHAR(100),
    min_batch_size DECIMAL(15,4),
    max_batch_size DECIMAL(15,4),
    standard_batch_size DECIMAL(15,4),
    unit VARCHAR(20) DEFAULT 'T',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Quantity Type Config
CREATE TABLE IF NOT EXISTS quantity_type_config (
    config_id BIGSERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    product_sku VARCHAR(100),
    quantity_type VARCHAR(20) NOT NULL DEFAULT 'DISCRETE',
    min_qty DECIMAL(15,4),
    max_qty DECIMAL(15,4),
    default_qty DECIMAL(15,4),
    unit VARCHAR(20) DEFAULT 'T',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_qty_type CHECK (quantity_type IN ('DISCRETE', 'BATCH', 'CONTINUOUS'))
);

-- =====================================================
-- 12. INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_order_id ON order_line_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_status ON order_line_items(status);
CREATE INDEX IF NOT EXISTS idx_operations_process ON operations(process_id);
CREATE INDEX IF NOT EXISTS idx_operations_order_line ON operations(order_line_id);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_inventory_state ON inventory(state);
CREATE INDEX IF NOT EXISTS idx_inventory_type ON inventory(inventory_type);
CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory(batch_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_material ON batches(material_id);
CREATE INDEX IF NOT EXISTS idx_production_confirm_operation ON production_confirmation(operation_id);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hold_entity ON hold_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hold_status ON hold_records(status);
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);
CREATE INDEX IF NOT EXISTS idx_materials_code ON materials(material_code);
CREATE INDEX IF NOT EXISTS idx_materials_type ON materials(material_type);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_equipment_code ON equipment(equipment_code);
CREATE INDEX IF NOT EXISTS idx_equipment_status ON equipment(status);
CREATE INDEX IF NOT EXISTS idx_process_params_op_type ON process_parameters_config(operation_type);
CREATE INDEX IF NOT EXISTS idx_batch_config_priority ON batch_number_config(priority);

-- =====================================================
-- 13. DEFAULT ADMIN USER
-- =====================================================
-- Password: admin123 (BCrypt encoded)
-- This creates default admin user if not exists

INSERT INTO users (email, password_hash, name, employee_id, status, created_by)
SELECT 'admin@mes.com', '$2a$10$QOowoTebIWE8lpcFwYRUkOfJlLXf4joSBXPzGrFETthgFr/i0I9OW', 'Admin User', 'EMP-001', 'ACTIVE', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@mes.com');
