-- =====================================================
-- MES Production System - Database Reset Script
-- =====================================================
-- This script resets the database to initial state:
-- - Drops ALL tables in public schema (including database_patches)
-- - Recreates schema structure
-- - Creates only admin user with empty tables
--
-- Usage: psql -U postgres -d mes_production -f reset_data.sql
--        psql -U postgres -d mes_test -f reset_data.sql
-- =====================================================

-- =====================================================
-- STEP 1: DROP ALL TABLES IN PUBLIC SCHEMA
-- =====================================================
-- This drops ALL tables including database_patches table
-- The patch system will start fresh after this

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Disable triggers temporarily
    SET session_replication_role = 'replica';

    -- Drop all tables in public schema
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS public.' || quote_ident(r.tablename) || ' CASCADE';
    END LOOP;

    -- Re-enable triggers
    SET session_replication_role = 'origin';
END $$;

-- =====================================================
-- STEP 2: RECREATE DATABASE_PATCHES TABLE
-- =====================================================
-- This table tracks applied patches - needed for patch system

CREATE TABLE IF NOT EXISTS database_patches (
    id SERIAL PRIMARY KEY,
    patch_name VARCHAR(255) NOT NULL UNIQUE,
    applied_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    checksum VARCHAR(64),
    execution_time_ms BIGINT
);

-- =====================================================
-- STEP 3: RECREATE CORE TABLES (SCHEMA)
-- =====================================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(50),
    last_name VARCHAR(50),
    role VARCHAR(20) NOT NULL DEFAULT 'OPERATOR',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    address TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Materials table
CREATE TABLE IF NOT EXISTS materials (
    id SERIAL PRIMARY KEY,
    material_code VARCHAR(50) NOT NULL UNIQUE,
    material_name VARCHAR(200) NOT NULL,
    material_type VARCHAR(20) NOT NULL,
    base_unit VARCHAR(10) NOT NULL DEFAULT 'KG',
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    description TEXT,
    product_category VARCHAR(100),
    base_unit VARCHAR(10) NOT NULL DEFAULT 'KG',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment table
CREATE TABLE IF NOT EXISTS equipment (
    id SERIAL PRIMARY KEY,
    equipment_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    equipment_type VARCHAR(50),
    equipment_category VARCHAR(50),
    capacity DECIMAL(15,3),
    capacity_unit VARCHAR(20),
    location VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Operators table
CREATE TABLE IF NOT EXISTS operators (
    id SERIAL PRIMARY KEY,
    operator_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    shift VARCHAR(20),
    certification TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hold reasons lookup
CREATE TABLE IF NOT EXISTS hold_reasons (
    id SERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    severity VARCHAR(20) DEFAULT 'MEDIUM',
    requires_approval BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Delay reasons lookup
CREATE TABLE IF NOT EXISTS delay_reasons (
    id SERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    category VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Process parameters configuration
CREATE TABLE IF NOT EXISTS process_params_config (
    id SERIAL PRIMARY KEY,
    operation_type VARCHAR(50) NOT NULL,
    param_name VARCHAR(100) NOT NULL,
    param_type VARCHAR(20) NOT NULL DEFAULT 'NUMBER',
    unit VARCHAR(20),
    min_value DECIMAL(15,3),
    max_value DECIMAL(15,3),
    default_value DECIMAL(15,3),
    is_required BOOLEAN DEFAULT TRUE,
    display_order INT DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_process_params UNIQUE (operation_type, param_name)
);

-- Batch number configuration
CREATE TABLE IF NOT EXISTS batch_number_config (
    id SERIAL PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL UNIQUE,
    prefix VARCHAR(20),
    date_format VARCHAR(20),
    separator VARCHAR(5) DEFAULT '-',
    sequence_length INT DEFAULT 4,
    sequence_reset VARCHAR(20) DEFAULT 'DAILY',
    operation_type VARCHAR(50),
    product_sku VARCHAR(50),
    is_default BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Batch sequence tracking
CREATE TABLE IF NOT EXISTS batch_sequence (
    id SERIAL PRIMARY KEY,
    config_id INT NOT NULL,
    reset_key VARCHAR(50) NOT NULL,
    current_value INT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_batch_sequence UNIQUE (config_id, reset_key),
    CONSTRAINT fk_batch_sequence_config FOREIGN KEY (config_id) REFERENCES batch_number_config(id)
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) NOT NULL UNIQUE,
    customer_id VARCHAR(50),
    customer_name VARCHAR(200),
    order_date DATE NOT NULL,
    due_date DATE,
    priority VARCHAR(20) DEFAULT 'NORMAL',
    status VARCHAR(20) NOT NULL DEFAULT 'CREATED',
    notes TEXT,
    created_by VARCHAR(50),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order line items
CREATE TABLE IF NOT EXISTS order_line_items (
    id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    line_number INT NOT NULL,
    product_sku VARCHAR(50) NOT NULL,
    product_name VARCHAR(200),
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(10) DEFAULT 'KG',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_line_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT uq_order_line UNIQUE (order_id, line_number)
);

-- Bill of material
CREATE TABLE IF NOT EXISTS bill_of_material (
    id SERIAL PRIMARY KEY,
    product_sku VARCHAR(50) NOT NULL,
    component_material_code VARCHAR(50) NOT NULL,
    quantity_per DECIMAL(15,6) NOT NULL,
    unit VARCHAR(10) DEFAULT 'KG',
    bom_level INT DEFAULT 1,
    parent_bom_id INT,
    yield_factor DECIMAL(5,4) DEFAULT 1.0000,
    scrap_factor DECIMAL(5,4) DEFAULT 0.0000,
    version INT DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    effective_from DATE,
    effective_to DATE,
    created_by VARCHAR(50),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bom_parent FOREIGN KEY (parent_bom_id) REFERENCES bill_of_material(id)
);

-- Processes table
CREATE TABLE IF NOT EXISTS processes (
    id SERIAL PRIMARY KEY,
    process_code VARCHAR(50) NOT NULL UNIQUE,
    process_name VARCHAR(200) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Operation templates (design-time)
CREATE TABLE IF NOT EXISTS operation_templates (
    id SERIAL PRIMARY KEY,
    template_code VARCHAR(50) NOT NULL UNIQUE,
    template_name VARCHAR(200) NOT NULL,
    operation_type VARCHAR(50) NOT NULL,
    description TEXT,
    standard_duration_minutes INT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Routing table
CREATE TABLE IF NOT EXISTS routing (
    id SERIAL PRIMARY KEY,
    routing_code VARCHAR(50) NOT NULL UNIQUE,
    routing_name VARCHAR(200) NOT NULL,
    process_id INT,
    routing_type VARCHAR(50) DEFAULT 'SEQUENTIAL',
    version INT DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_by VARCHAR(50),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_routing_process FOREIGN KEY (process_id) REFERENCES processes(id)
);

-- Routing steps
CREATE TABLE IF NOT EXISTS routing_steps (
    id SERIAL PRIMARY KEY,
    routing_id INT NOT NULL,
    step_number INT NOT NULL,
    operation_template_id INT NOT NULL,
    equipment_id INT,
    setup_time_minutes INT DEFAULT 0,
    run_time_minutes INT DEFAULT 0,
    is_optional BOOLEAN DEFAULT FALSE,
    predecessor_step_id INT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_step_routing FOREIGN KEY (routing_id) REFERENCES routing(id) ON DELETE CASCADE,
    CONSTRAINT fk_step_template FOREIGN KEY (operation_template_id) REFERENCES operation_templates(id),
    CONSTRAINT fk_step_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    CONSTRAINT fk_step_predecessor FOREIGN KEY (predecessor_step_id) REFERENCES routing_steps(id),
    CONSTRAINT uq_routing_step UNIQUE (routing_id, step_number)
);

-- Operations (runtime instances)
CREATE TABLE IF NOT EXISTS operations (
    id SERIAL PRIMARY KEY,
    operation_number VARCHAR(50) NOT NULL UNIQUE,
    order_line_id INT,
    process_id INT,
    routing_step_id INT,
    operation_type VARCHAR(50) NOT NULL,
    operation_name VARCHAR(200),
    sequence_number INT NOT NULL DEFAULT 1,
    planned_quantity DECIMAL(15,3),
    confirmed_quantity DECIMAL(15,3) DEFAULT 0,
    unit VARCHAR(10) DEFAULT 'KG',
    planned_start TIMESTAMP,
    planned_end TIMESTAMP,
    actual_start TIMESTAMP,
    actual_end TIMESTAMP,
    equipment_id INT,
    status VARCHAR(20) NOT NULL DEFAULT 'NOT_STARTED',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_op_line FOREIGN KEY (order_line_id) REFERENCES order_line_items(id),
    CONSTRAINT fk_op_process FOREIGN KEY (process_id) REFERENCES processes(id),
    CONSTRAINT fk_op_routing_step FOREIGN KEY (routing_step_id) REFERENCES routing_steps(id),
    CONSTRAINT fk_op_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id)
);

-- Batches table
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    batch_number VARCHAR(50) NOT NULL UNIQUE,
    material_code VARCHAR(50),
    material_name VARCHAR(200),
    material_type VARCHAR(20),
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(10) DEFAULT 'KG',
    production_date DATE,
    expiry_date DATE,
    supplier VARCHAR(200),
    source_operation_id INT,
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_by VARCHAR(50),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_batch_source_op FOREIGN KEY (source_operation_id) REFERENCES operations(id)
);

-- Batch relations (genealogy)
CREATE TABLE IF NOT EXISTS batch_relations (
    id SERIAL PRIMARY KEY,
    parent_batch_id INT NOT NULL,
    child_batch_id INT NOT NULL,
    relation_type VARCHAR(20) NOT NULL DEFAULT 'CONSUMPTION',
    quantity_used DECIMAL(15,3),
    operation_id INT,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rel_parent FOREIGN KEY (parent_batch_id) REFERENCES batches(id),
    CONSTRAINT fk_rel_child FOREIGN KEY (child_batch_id) REFERENCES batches(id),
    CONSTRAINT fk_rel_operation FOREIGN KEY (operation_id) REFERENCES operations(id)
);

-- Inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    batch_id INT,
    material_code VARCHAR(50) NOT NULL,
    material_name VARCHAR(200),
    material_type VARCHAR(20),
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(10) DEFAULT 'KG',
    location VARCHAR(100),
    state VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_inv_batch FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- Production confirmation
CREATE TABLE IF NOT EXISTS production_confirmation (
    id SERIAL PRIMARY KEY,
    confirmation_number VARCHAR(50) NOT NULL UNIQUE,
    operation_id INT NOT NULL,
    equipment_id INT,
    operator_id INT,
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    input_quantity DECIMAL(15,3),
    output_quantity DECIMAL(15,3),
    scrap_quantity DECIMAL(15,3) DEFAULT 0,
    unit VARCHAR(10) DEFAULT 'KG',
    output_batch_id INT,
    process_parameters TEXT,
    delay_reason VARCHAR(255),
    delay_duration_minutes INT,
    notes TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'CONFIRMED',
    confirmed_by VARCHAR(50),
    confirmed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_conf_operation FOREIGN KEY (operation_id) REFERENCES operations(id),
    CONSTRAINT fk_conf_equipment FOREIGN KEY (equipment_id) REFERENCES equipment(id),
    CONSTRAINT fk_conf_operator FOREIGN KEY (operator_id) REFERENCES operators(id),
    CONSTRAINT fk_conf_output_batch FOREIGN KEY (output_batch_id) REFERENCES batches(id)
);

-- Consumed materials in production
CREATE TABLE IF NOT EXISTS consumed_materials (
    id SERIAL PRIMARY KEY,
    confirmation_id INT NOT NULL,
    batch_id INT NOT NULL,
    quantity DECIMAL(15,3) NOT NULL,
    unit VARCHAR(10) DEFAULT 'KG',
    consumed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_consumed_conf FOREIGN KEY (confirmation_id) REFERENCES production_confirmation(id),
    CONSTRAINT fk_consumed_batch FOREIGN KEY (batch_id) REFERENCES batches(id)
);

-- Hold records
CREATE TABLE IF NOT EXISTS hold_records (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    entity_identifier VARCHAR(100),
    hold_reason VARCHAR(255) NOT NULL,
    hold_comments TEXT,
    held_by VARCHAR(50),
    held_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    release_reason VARCHAR(255),
    release_comments TEXT,
    released_by VARCHAR(50),
    released_on TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id SERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT,
    entity_identifier VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    action_description TEXT,
    performed_by VARCHAR(50),
    performed_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ip_address VARCHAR(50),
    user_agent VARCHAR(255)
);

-- =====================================================
-- STEP 4: CREATE INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_operations_status ON operations(status);
CREATE INDEX IF NOT EXISTS idx_operations_line ON operations(order_line_id);
CREATE INDEX IF NOT EXISTS idx_batches_status ON batches(status);
CREATE INDEX IF NOT EXISTS idx_batches_material ON batches(material_code);
CREATE INDEX IF NOT EXISTS idx_inventory_state ON inventory(state);
CREATE INDEX IF NOT EXISTS idx_inventory_material ON inventory(material_code);
CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_trail(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_performed ON audit_trail(performed_on);
CREATE INDEX IF NOT EXISTS idx_hold_entity ON hold_records(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_hold_status ON hold_records(status);

-- =====================================================
-- STEP 5: INSERT ADMIN USER ONLY
-- =====================================================
-- Password: admin123 (BCrypt encoded)

INSERT INTO users (username, email, password, first_name, last_name, role, status)
VALUES ('admin', 'admin@mes.com', '$2a$10$N9qo8uLOickgx2ZMRZoMye1k8rHEZxPb.rkJx9hvM0NZnf.Ht/WCK', 'System', 'Administrator', 'ADMIN', 'ACTIVE');

-- =====================================================
-- STEP 6: MARK RESET AS APPLIED PATCH
-- =====================================================
-- This prevents 001_schema.sql from running again if you restart the app

INSERT INTO database_patches (patch_name, checksum, execution_time_ms)
VALUES ('RESET_APPLIED', 'manual_reset', 0);

-- =====================================================
-- RESET COMPLETE
-- =====================================================
-- Database now has:
-- - Empty tables with proper schema
-- - One admin user (admin@mes.com / admin123)
-- - Patch tracking initialized
--
-- To add demo data, run:
-- psql -U postgres -d mes_production -f patches/002_seed_data.sql
-- =====================================================
