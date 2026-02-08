# MES Database Schema Reference

**Generated:** February 2026
**Source:** SQL Patch Analysis (40 patches)
**Last Updated:** 2026-02-07 (Patch 040 - Template/Runtime Separation)

---

## Overview

The MES PostgreSQL database consists of **55 tables** organized across the following domains:

| Category | Count |
|----------|-------|
| Core Entity Tables | 22 |
| Configuration Tables | 10 |
| Lookup/Master Tables | 9 |
| Attribute Tables | 7 |
| Production Tracking | 3 |
| Routing Tables | 4 |
| **Total** | **55** |

---

## Core Entity Tables

### users
```sql
CREATE TABLE users (
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
```

### customers
```sql
CREATE TABLE customers (
    customer_id SERIAL PRIMARY KEY,
    customer_code VARCHAR(50) NOT NULL UNIQUE,
    customer_name VARCHAR(200) NOT NULL,
    contact_person VARCHAR(100),
    email VARCHAR(100),
    phone VARCHAR(50),
    address VARCHAR(500),
    city VARCHAR(100),
    country VARCHAR(100),
    tax_id VARCHAR(50),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### orders
```sql
CREATE TABLE orders (
    order_id BIGSERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE,
    customer_id VARCHAR(100),
    customer_ref_id BIGINT REFERENCES customers(customer_id),
    customer_name VARCHAR(255),
    order_date DATE NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
);
-- Status: CREATED, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD
```

### order_line_items
```sql
CREATE TABLE order_line_items (
    order_line_id BIGSERIAL PRIMARY KEY,
    order_id BIGINT NOT NULL REFERENCES orders(order_id),
    product_sku VARCHAR(100) NOT NULL,
    product_name VARCHAR(255),
    quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'T',
    delivery_date DATE,
    status VARCHAR(30) NOT NULL DEFAULT 'CREATED'
);
```

### materials
```sql
CREATE TABLE materials (
    material_id SERIAL PRIMARY KEY,
    material_code VARCHAR(50) NOT NULL UNIQUE,
    material_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    material_type VARCHAR(20) NOT NULL,  -- RM, IM, FG, WIP
    base_unit VARCHAR(20) NOT NULL DEFAULT 'T',
    material_group VARCHAR(50),
    sku VARCHAR(50),
    standard_cost NUMERIC(15,4),
    min_stock_level NUMERIC(15,4),
    max_stock_level NUMERIC(15,4),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### products
```sql
CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    sku VARCHAR(50) NOT NULL UNIQUE,
    product_name VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    product_category VARCHAR(100),
    product_group VARCHAR(100),
    base_unit VARCHAR(20) NOT NULL DEFAULT 'T',
    standard_price NUMERIC(15,4),
    min_order_qty NUMERIC(15,4),
    lead_time_days INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### processes
```sql
CREATE TABLE processes (
    process_id SERIAL PRIMARY KEY,
    process_name VARCHAR(100) NOT NULL,
    process_code VARCHAR(50) UNIQUE,
    description VARCHAR(500),
    product_sku VARCHAR(50),
    status VARCHAR(20) DEFAULT 'DRAFT',  -- DRAFT, ACTIVE, INACTIVE
    version VARCHAR(20) DEFAULT 'V1'
);
```

### operations
```sql
CREATE TABLE operations (
    operation_id BIGSERIAL PRIMARY KEY,
    order_line_id BIGINT REFERENCES order_line_items(order_line_id),
    process_id BIGINT REFERENCES processes(process_id),
    routing_step_id BIGINT REFERENCES routing_steps(routing_step_id),
    operation_name VARCHAR(100) NOT NULL,
    operation_code VARCHAR(50),
    operation_type VARCHAR(50),
    sequence_number INTEGER NOT NULL DEFAULT 1,
    target_qty DECIMAL(15,4),
    confirmed_qty DECIMAL(15,4),
    status VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    block_reason VARCHAR(500),
    blocked_by VARCHAR(100),
    blocked_on TIMESTAMP
);
-- Status: NOT_STARTED, READY, IN_PROGRESS, PARTIALLY_CONFIRMED, CONFIRMED, BLOCKED, ON_HOLD
```

### production_confirmation
```sql
CREATE TABLE production_confirmation (
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
    notes VARCHAR(1000),
    equipment_ids BIGINT[],
    operator_ids BIGINT[],
    status VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    rejection_reason VARCHAR(500)
);
-- Status: CONFIRMED, PARTIALLY_CONFIRMED, REJECTED, PENDING_REVIEW
```

### equipment
```sql
CREATE TABLE equipment (
    equipment_id BIGSERIAL PRIMARY KEY,
    equipment_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    equipment_type VARCHAR(30) NOT NULL DEFAULT 'BATCH',
    capacity DECIMAL(15,4),
    capacity_unit VARCHAR(20),
    location VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    maintenance_reason VARCHAR(500),
    maintenance_start TIMESTAMP,
    maintenance_by VARCHAR(100),
    hold_reason VARCHAR(500),
    hold_start TIMESTAMP
);
-- Status: AVAILABLE, IN_USE, MAINTENANCE, ON_HOLD, UNAVAILABLE
```

### operators
```sql
CREATE TABLE operators (
    operator_id BIGSERIAL PRIMARY KEY,
    operator_code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    department VARCHAR(100),
    shift VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### batches
```sql
CREATE TABLE batches (
    batch_id BIGSERIAL PRIMARY KEY,
    batch_number VARCHAR(100) NOT NULL UNIQUE,
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'T',
    generated_at_operation_id BIGINT REFERENCES operations(operation_id),
    status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    approved_by VARCHAR(100),
    approved_on TIMESTAMP,
    rejection_reason VARCHAR(500),
    created_via VARCHAR(50) DEFAULT 'MANUAL',
    supplier_batch_number VARCHAR(100),
    supplier_id VARCHAR(50),
    received_date DATE
);
-- Status: QUALITY_PENDING, AVAILABLE, PRODUCED, CONSUMED, BLOCKED, SCRAPPED, ON_HOLD
-- Created Via: PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT
```

### batch_relations
```sql
CREATE TABLE batch_relations (
    relation_id BIGSERIAL PRIMARY KEY,
    parent_batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    child_batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    operation_id BIGINT REFERENCES operations(operation_id),
    relation_type VARCHAR(20) NOT NULL DEFAULT 'MERGE',  -- SPLIT, MERGE
    quantity_consumed DECIMAL(15,4) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### inventory
```sql
CREATE TABLE inventory (
    inventory_id BIGSERIAL PRIMARY KEY,
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    inventory_type VARCHAR(20) NOT NULL,  -- RM, IM, FG, WIP
    state VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    quantity DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL DEFAULT 'T',
    batch_id BIGINT REFERENCES batches(batch_id),
    location VARCHAR(100),
    inventory_form VARCHAR(20) DEFAULT 'SOLID',
    current_temperature DECIMAL(10,2),
    moisture_content DECIMAL(5,2),
    density DECIMAL(10,4),
    block_reason VARCHAR(500),
    scrap_reason VARCHAR(500),
    reserved_for_order_id BIGINT,
    reserved_for_operation_id BIGINT,
    reserved_qty DECIMAL(15,4)
);
-- State: AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD
```

### hold_records
```sql
CREATE TABLE hold_records (
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
-- Entity Types: OPERATION, PROCESS, ORDER_LINE, INVENTORY, BATCH, EQUIPMENT
-- Status: ACTIVE, RELEASED
```

### bill_of_material
```sql
CREATE TABLE bill_of_material (
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### audit_trail
```sql
CREATE TABLE audit_trail (
    audit_id BIGSERIAL PRIMARY KEY,
    entity_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    field_name VARCHAR(100),
    old_value TEXT,
    new_value TEXT,
    action VARCHAR(30) NOT NULL,  -- Extended from 20 to 30 for BATCH_NUMBER_GENERATED
    changed_by VARCHAR(100) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
-- Actions: CREATE, UPDATE, DELETE, STATUS_CHANGE, CONSUME, PRODUCE, HOLD, RELEASE, BATCH_NUMBER_GENERATED
```

**Note:** The `action` column was extended from VARCHAR(20) to VARCHAR(30) in patch 045 to accommodate the `BATCH_NUMBER_GENERATED` action type (22 characters).

---

## Configuration Tables

### process_parameters_config
```sql
CREATE TABLE process_parameters_config (
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### batch_number_config
```sql
CREATE TABLE batch_number_config (
    config_id BIGSERIAL PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL UNIQUE,
    operation_type VARCHAR(50),
    material_id VARCHAR(100),
    product_sku VARCHAR(100),
    prefix VARCHAR(50) NOT NULL DEFAULT 'BATCH',
    include_operation_code BOOLEAN DEFAULT TRUE,
    separator VARCHAR(5) NOT NULL DEFAULT '-',
    date_format VARCHAR(20) DEFAULT 'yyyyMMdd',
    include_date BOOLEAN DEFAULT TRUE,
    sequence_length INTEGER NOT NULL DEFAULT 3,
    sequence_reset VARCHAR(20) DEFAULT 'DAILY',
    priority INTEGER DEFAULT 100,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### batch_number_sequence
```sql
CREATE TABLE batch_number_sequence (
    sequence_id BIGSERIAL PRIMARY KEY,
    config_id BIGINT NOT NULL REFERENCES batch_number_config(config_id),
    sequence_key VARCHAR(200) NOT NULL,
    current_value INTEGER NOT NULL DEFAULT 0,
    last_reset_on TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(config_id, sequence_key)
);
```

### batch_size_config
```sql
CREATE TABLE batch_size_config (
    config_id SERIAL PRIMARY KEY,
    material_id VARCHAR(50),
    operation_type VARCHAR(50),
    equipment_type VARCHAR(50),
    product_sku VARCHAR(50),
    min_batch_size DECIMAL(15,4) DEFAULT 0,
    max_batch_size DECIMAL(15,4) NOT NULL,
    preferred_batch_size DECIMAL(15,4),
    unit VARCHAR(20) DEFAULT 'T',
    allow_partial_batch BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0
);
```

### quantity_type_config
```sql
CREATE TABLE quantity_type_config (
    config_id BIGSERIAL PRIMARY KEY,
    config_name VARCHAR(100) NOT NULL UNIQUE,
    material_code VARCHAR(50),
    operation_type VARCHAR(50),
    equipment_type VARCHAR(50),
    quantity_type VARCHAR(20) NOT NULL DEFAULT 'DECIMAL',
    decimal_precision INTEGER NOT NULL DEFAULT 4,
    rounding_rule VARCHAR(20) NOT NULL DEFAULT 'HALF_UP',
    min_quantity DECIMAL(15,4) DEFAULT 0,
    max_quantity DECIMAL(15,4),
    unit VARCHAR(20),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### equipment_type_config
```sql
CREATE TABLE equipment_type_config (
    config_id BIGSERIAL PRIMARY KEY,
    equipment_type VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    min_capacity DECIMAL(15,4),
    max_capacity DECIMAL(15,4),
    default_capacity_unit VARCHAR(20),
    min_temperature DECIMAL(10,2),
    max_temperature DECIMAL(10,2),
    maintenance_interval_hours INT,
    requires_operator BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);
```

### inventory_form_config
```sql
CREATE TABLE inventory_form_config (
    form_id BIGSERIAL PRIMARY KEY,
    form_code VARCHAR(20) NOT NULL UNIQUE,
    form_name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    tracks_temperature BOOLEAN DEFAULT FALSE,
    tracks_moisture BOOLEAN DEFAULT FALSE,
    tracks_density BOOLEAN DEFAULT FALSE,
    default_weight_unit VARCHAR(20) DEFAULT 'KG',
    requires_temperature_control BOOLEAN DEFAULT FALSE,
    min_storage_temp DECIMAL(10,2),
    max_storage_temp DECIMAL(10,2),
    shelf_life_days INT,
    is_active BOOLEAN DEFAULT TRUE
);
```

---

## Lookup/Master Tables

### delay_reasons
```sql
CREATE TABLE delay_reasons (
    reason_id BIGSERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### hold_reasons
```sql
CREATE TABLE hold_reasons (
    reason_id BIGSERIAL PRIMARY KEY,
    reason_code VARCHAR(50) NOT NULL UNIQUE,
    reason_description VARCHAR(255) NOT NULL,
    applicable_to VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### departments
```sql
CREATE TABLE departments (
    department_id SERIAL PRIMARY KEY,
    department_code VARCHAR(50) NOT NULL UNIQUE,
    department_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    manager_name VARCHAR(100),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### shifts
```sql
CREATE TABLE shifts (
    shift_id SERIAL PRIMARY KEY,
    shift_code VARCHAR(50) NOT NULL UNIQUE,
    shift_name VARCHAR(100) NOT NULL,
    start_time TIME,
    end_time TIME,
    description VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### locations
```sql
CREATE TABLE locations (
    location_id SERIAL PRIMARY KEY,
    location_code VARCHAR(50) NOT NULL UNIQUE,
    location_name VARCHAR(100) NOT NULL,
    location_type VARCHAR(30) NOT NULL DEFAULT 'WAREHOUSE',
    parent_location_id INTEGER REFERENCES locations(location_id),
    address VARCHAR(500),
    capacity DECIMAL(15,4),
    is_temperature_controlled BOOLEAN DEFAULT FALSE,
    min_temperature DECIMAL(5,2),
    max_temperature DECIMAL(5,2),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
-- Location Types: WAREHOUSE, PLANT, ZONE, RACK, BIN, STAGING
```

### material_groups
```sql
CREATE TABLE material_groups (
    group_id SERIAL PRIMARY KEY,
    group_code VARCHAR(50) NOT NULL UNIQUE,
    group_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    parent_group_id INTEGER REFERENCES material_groups(group_id),
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### operation_types
```sql
CREATE TABLE operation_types (
    type_id SERIAL PRIMARY KEY,
    type_code VARCHAR(50) NOT NULL UNIQUE,
    type_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    default_duration_minutes INTEGER,
    requires_equipment BOOLEAN DEFAULT TRUE,
    requires_operator BOOLEAN DEFAULT TRUE,
    produces_output BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
```

### unit_of_measure
```sql
CREATE TABLE unit_of_measure (
    unit_id BIGSERIAL PRIMARY KEY,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    unit_name VARCHAR(50) NOT NULL,
    unit_type VARCHAR(20) NOT NULL,  -- WEIGHT, LENGTH, VOLUME, COUNT, AREA
    decimal_precision INT DEFAULT 2,
    is_base_unit BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE
);
```

### unit_conversion
```sql
CREATE TABLE unit_conversion (
    conversion_id BIGSERIAL PRIMARY KEY,
    from_unit_code VARCHAR(20) NOT NULL,
    to_unit_code VARCHAR(20) NOT NULL,
    conversion_factor DECIMAL(20,10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(from_unit_code, to_unit_code)
);
```

---

## Routing Tables

### operation_templates (NEW - Design-Time)
```sql
-- Patch 040: Template/Runtime Separation
CREATE TABLE operation_templates (
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
    updated_by VARCHAR(100)
);
-- Status: ACTIVE, INACTIVE
-- Quantity Type: DISCRETE, BATCH, CONTINUOUS
-- Purpose: Reusable operation definitions used by RoutingSteps
```

### routing
```sql
CREATE TABLE routing (
    routing_id BIGSERIAL PRIMARY KEY,
    process_id BIGINT NOT NULL REFERENCES processes(process_id),
    routing_name VARCHAR(100) NOT NULL,
    routing_type VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'
);
-- Routing Type: SEQUENTIAL, PARALLEL
-- Status: DRAFT, ACTIVE, INACTIVE, ON_HOLD
```

### routing_steps (Updated in Patch 040)
```sql
CREATE TABLE routing_steps (
    routing_step_id BIGSERIAL PRIMARY KEY,
    routing_id BIGINT NOT NULL REFERENCES routing(routing_id),
    operation_template_id BIGINT REFERENCES operation_templates(operation_template_id), -- NEW FK
    sequence_number INTEGER NOT NULL,
    is_parallel BOOLEAN DEFAULT FALSE,
    mandatory_flag BOOLEAN DEFAULT TRUE,
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE', -- Changed from READY to ACTIVE
    produces_output_batch BOOLEAN DEFAULT true,
    allows_split BOOLEAN DEFAULT false,
    allows_merge BOOLEAN DEFAULT false,
    operation_name VARCHAR(100),  -- Legacy field
    operation_type VARCHAR(50),   -- Legacy field
    target_qty DECIMAL(15,4),
    estimated_duration_minutes INTEGER
);
-- Status: ACTIVE, INACTIVE (template lifecycle, NOT runtime execution)
-- NOTE: operation_id column removed (template should NOT reference runtime Operation)
```

---

## Junction Tables

### confirmation_equipment
```sql
CREATE TABLE confirmation_equipment (
    id BIGSERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    equipment_id BIGINT NOT NULL REFERENCES equipment(equipment_id)
);
```

### confirmation_operators
```sql
CREATE TABLE confirmation_operators (
    id BIGSERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    operator_id BIGINT NOT NULL REFERENCES operators(operator_id)
);
```

### batch_order_allocation
```sql
CREATE TABLE batch_order_allocation (
    allocation_id BIGSERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    order_line_id BIGINT NOT NULL REFERENCES order_line_items(order_line_id),
    allocated_qty DECIMAL(15,4) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'ALLOCATED'
);
-- Status: ALLOCATED, RELEASED
```

### inventory_movement
```sql
CREATE TABLE inventory_movement (
    movement_id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT REFERENCES operations(operation_id),
    inventory_id BIGINT NOT NULL REFERENCES inventory(inventory_id),
    movement_type VARCHAR(20) NOT NULL,
    quantity DECIMAL(15,4) NOT NULL,
    timestamp TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'EXECUTED'
);
-- Movement Type: CONSUME, PRODUCE, HOLD, RELEASE, SCRAP
-- Status: EXECUTED, PENDING, ON_HOLD
```

### operation_equipment_usage
```sql
CREATE TABLE operation_equipment_usage (
    usage_id BIGSERIAL PRIMARY KEY,
    operation_id BIGINT NOT NULL REFERENCES operations(operation_id),
    equipment_id BIGINT NOT NULL REFERENCES equipment(equipment_id),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    operator_id BIGINT REFERENCES operators(operator_id),
    status VARCHAR(20) NOT NULL DEFAULT 'LOGGED'
);
-- Status: LOGGED, CONFIRMED
```

---

## Production Output Tables

### consumed_materials
```sql
CREATE TABLE consumed_materials (
    consumption_id SERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    inventory_id BIGINT REFERENCES inventory(inventory_id),
    batch_id BIGINT REFERENCES batches(batch_id),
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    quantity_consumed DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL
);
```

### produced_outputs
```sql
CREATE TABLE produced_outputs (
    output_id SERIAL PRIMARY KEY,
    confirmation_id BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    batch_id BIGINT REFERENCES batches(batch_id),
    inventory_id BIGINT REFERENCES inventory(inventory_id),
    material_id VARCHAR(100) NOT NULL,
    material_name VARCHAR(255),
    quantity_produced DECIMAL(15,4) NOT NULL,
    unit VARCHAR(20) NOT NULL,
    is_primary_output BOOLEAN DEFAULT TRUE,
    output_type VARCHAR(30) DEFAULT 'GOOD'
);
-- Output Type: GOOD, SCRAP, REWORK, BYPRODUCT
```

### batch_quantity_adjustments
```sql
CREATE TABLE batch_quantity_adjustments (
    adjustment_id SERIAL PRIMARY KEY,
    batch_id BIGINT NOT NULL REFERENCES batches(batch_id),
    old_quantity DECIMAL(15,4) NOT NULL,
    new_quantity DECIMAL(15,4) NOT NULL,
    adjustment_reason VARCHAR(500) NOT NULL,
    adjustment_type VARCHAR(50) NOT NULL,
    adjusted_by VARCHAR(100) NOT NULL,
    adjusted_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Adjustment Type: CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY, SYSTEM
```

---

## Key Indexes

```sql
-- Orders
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer_ref ON orders(customer_ref_id);

-- Operations
CREATE INDEX idx_operations_status ON operations(status);
CREATE INDEX idx_operations_order_line ON operations(order_line_id);
CREATE INDEX idx_operations_process ON operations(process_id);

-- Batches
CREATE INDEX idx_batches_status ON batches(status);
CREATE INDEX idx_batches_material ON batches(material_id);
CREATE INDEX idx_batches_quality_pending ON batches(status) WHERE status = 'QUALITY_PENDING';

-- Inventory
CREATE INDEX idx_inventory_state ON inventory(state);
CREATE INDEX idx_inventory_type ON inventory(inventory_type);
CREATE INDEX idx_inventory_batch ON inventory(batch_id);

-- Audit Trail
CREATE INDEX idx_audit_entity ON audit_trail(entity_type, entity_id);

-- Holds
CREATE INDEX idx_hold_entity ON hold_records(entity_type, entity_id);
```

---

## SQL Patch Files

| Patch | Description |
|-------|-------------|
| 001 | Initial schema |
| 002-003 | Core entities |
| 004 | Batch number config |
| 005-010 | Configuration tables |
| 011-015 | Master data |
| 016-020 | Production tracking |
| 021-025 | Routing and steps |
| 026-030 | Attributes and extensions |
| 031-032 | Cleanup and fixes |

---

*End of Database Schema Reference*
