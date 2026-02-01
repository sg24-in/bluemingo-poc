-- =====================================================
-- MES Production Confirmation - Initial Database Schema
-- Patch: 001
-- Description: Create all base tables as per MES Consolidated document
-- =====================================================

-- 1. Users Table
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

-- 2. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    order_id BIGSERIAL PRIMARY KEY,
    customer_id VARCHAR(100),
    customer_name VARCHAR(255),
    order_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_order_status CHECK (status IN ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD'))
);

-- 3. Order Line Items Table
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

-- 4. Bill of Material Table (Unified BOM)
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
    CONSTRAINT chk_bom_status CHECK (status IN ('ACTIVE', 'OBSOLETE', 'ON_HOLD'))
);

-- 5. Processes Table
CREATE TABLE IF NOT EXISTS processes (
    process_id BIGSERIAL PRIMARY KEY,
    order_line_id BIGINT NOT NULL REFERENCES order_line_items(order_line_id),
    bom_id BIGINT REFERENCES bill_of_material(bom_id),
    stage_name VARCHAR(100) NOT NULL,
    stage_sequence INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'READY',
    usage_decision VARCHAR(20),
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_process_status CHECK (status IN ('READY', 'IN_PROGRESS', 'QUALITY_PENDING', 'COMPLETED', 'REJECTED', 'ON_HOLD'))
);

-- 6. Routing Table
CREATE TABLE IF NOT EXISTS routing (
    routing_id BIGSERIAL PRIMARY KEY,
    process_id BIGINT NOT NULL REFERENCES processes(process_id),
    routing_name VARCHAR(100) NOT NULL,
    routing_type VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_routing_type CHECK (routing_type IN ('SEQUENTIAL', 'PARALLEL'))
);

-- 7. Routing Steps Table
CREATE TABLE IF NOT EXISTS routing_steps (
    routing_step_id BIGSERIAL PRIMARY KEY,
    routing_id BIGINT NOT NULL REFERENCES routing(routing_id),
    operation_id BIGINT,
    sequence_number INTEGER NOT NULL,
    is_parallel BOOLEAN DEFAULT FALSE,
    mandatory_flag BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'READY',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- 8. Operations Table
CREATE TABLE IF NOT EXISTS operations (
    operation_id BIGSERIAL PRIMARY KEY,
    process_id BIGINT NOT NULL REFERENCES processes(process_id),
    routing_step_id BIGINT REFERENCES routing_steps(routing_step_id),
    operation_name VARCHAR(100) NOT NULL,
    operation_code VARCHAR(50),
    operation_type VARCHAR(50),
    sequence_number INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_operation_status CHECK (status IN ('NOT_STARTED', 'READY', 'IN_PROGRESS', 'PARTIALLY_CONFIRMED', 'CONFIRMED', 'BLOCKED', 'ON_HOLD'))
);

-- Update routing_steps foreign key
ALTER TABLE routing_steps ADD CONSTRAINT fk_routing_step_operation
    FOREIGN KEY (operation_id) REFERENCES operations(operation_id);

-- 9. Equipment Table
CREATE TABLE IF NOT EXISTS equipment (
    equipment_id BIGSERIAL PRIMARY KEY,
    equipment_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(30) NOT NULL DEFAULT 'BATCH',
    capacity DECIMAL(15,4),
    capacity_unit VARCHAR(20),
    location VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_equipment_type CHECK (equipment_type IN ('BATCH', 'CONTINUOUS')),
    CONSTRAINT chk_equipment_status CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'ON_HOLD'))
);

-- 10. Operators Table
CREATE TABLE IF NOT EXISTS operators (
    operator_id BIGSERIAL PRIMARY KEY,
    operator_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    shift VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- 11. Operation Equipment Usage Table
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

-- 12. Production Confirmation Table
CREATE TABLE IF NOT EXISTS production_confirmation (
    confirmation_id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT NOT NULL REFERENCES operations(operation_id),
    produced_qty DECIMAL(15,4) NOT NULL,
    scrap_qty DECIMAL(15,4) DEFAULT 0,
    start_time TIMESTAMP NOT NULL,
    end_time TIMESTAMP NOT NULL,
    delay_minutes INTEGER DEFAULT 0,
    delay_reason VARCHAR(100),
    process_parameters JSONB,
    rm_consumed JSONB,
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_confirm_status CHECK (status IN ('CONFIRMED', 'PARTIALLY_CONFIRMED', 'REJECTED'))
);

-- 13. Batches Table
CREATE TABLE IF NOT EXISTS batches (
    batch_id BIGSERIAL PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'T',
    generated_at_operation_id BIGINT REFERENCES operations(operation_id),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_batch_status CHECK (status IN ('AVAILABLE', 'CONSUMED', 'PRODUCED', 'ON_HOLD'))
);

-- 14. Inventory Table
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
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100),
    CONSTRAINT chk_inventory_type CHECK (inventory_type IN ('RM', 'IM', 'FG', 'WIP')),
    CONSTRAINT chk_inventory_state CHECK (state IN ('AVAILABLE', 'RESERVED', 'CONSUMED', 'PRODUCED', 'BLOCKED', 'SCRAPPED', 'ON_HOLD'))
);

-- 15. Inventory Movement Table
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
    CONSTRAINT chk_movement_type CHECK (movement_type IN ('CONSUME', 'PRODUCE', 'HOLD', 'RELEASE', 'SCRAP')),
    CONSTRAINT chk_movement_status CHECK (status IN ('EXECUTED', 'PENDING', 'ON_HOLD'))
);

-- 16. Batch Relations Table
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

-- 17. Batch Order Allocation Table
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

-- 18. Hold Records Table
CREATE TABLE IF NOT EXISTS hold_records (
    hold_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(30) NOT NULL,
    entity_id BIGINT NOT NULL,
    reason VARCHAR(100) NOT NULL,
    comments TEXT,
    applied_by VARCHAR(100) NOT NULL,
    applied_on TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_by VARCHAR(100),
    released_on TIMESTAMP,
    release_comments TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_hold_entity_type CHECK (entity_type IN ('OPERATION', 'PROCESS', 'ORDER_LINE', 'INVENTORY', 'BATCH')),
    CONSTRAINT chk_hold_status CHECK (status IN ('ACTIVE', 'RELEASED'))
);

-- 19. Audit Trail Table
CREATE TABLE IF NOT EXISTS audit_trail (
    audit_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    action VARCHAR(20) NOT NULL,
    changed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 20. Delay Reasons (Lookup Table)
CREATE TABLE IF NOT EXISTS delay_reasons (
    reason_id BIGSERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 21. Hold Reasons (Lookup Table)
CREATE TABLE IF NOT EXISTS hold_reasons (
    reason_id BIGSERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    applicable_to VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 22. Process Parameters Configuration Table
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
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_lines_order_id ON order_line_items(order_id);
CREATE INDEX idx_order_lines_status ON order_line_items(status);
CREATE INDEX idx_processes_order_line ON processes(order_line_id);
CREATE INDEX idx_processes_status ON processes(status);
CREATE INDEX idx_operations_process ON operations(process_id);
CREATE INDEX idx_operations_status ON operations(status);
CREATE INDEX idx_inventory_state ON inventory(state);
CREATE INDEX idx_inventory_type ON inventory(inventory_type);
CREATE INDEX idx_inventory_batch ON inventory(batch_id);
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_material ON batches(material_id);
CREATE INDEX idx_production_confirm_operation ON production_confirmation(operation_id);
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_hold_entity ON hold_records(entity_type, entity_id);
