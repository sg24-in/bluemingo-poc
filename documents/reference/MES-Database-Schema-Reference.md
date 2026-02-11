# MES Database Schema Reference

**Generated:** 2026-02-10
**Source:** SQL Patch Analysis (51 patches)
**Database:** PostgreSQL 14+
**Schema Management:** SQL Patch System (auto-applied on startup)

---

## Overview Statistics

| Metric | Count |
|--------|-------|
| Total Tables | 55 |
| Total SQL Patches | 51 |
| Total Indexes | 110+ |
| Total Foreign Keys | 35+ |
| Total Check Constraints | 30+ |
| Total Unique Constraints | 20+ |

### Table Counts by Domain

| Domain | Tables | Count |
|--------|--------|-------|
| Authentication | users | 1 |
| Order Management | orders, order_line_items | 2 |
| Bill of Materials | bill_of_material | 1 |
| Production | processes, operations, operation_templates, production_confirmation, consumed_materials, produced_outputs, process_parameter_values, operation_parameter_templates | 8 |
| Inventory & Batches | batches, inventory, inventory_movement, batch_relations, batch_order_allocation, batch_quantity_adjustments | 6 |
| Equipment | equipment, operation_equipment_usage, confirmation_equipment, confirmation_operators | 4 |
| Master Data | customers, materials, products, operators | 4 |
| Routing | routing, routing_steps | 2 |
| Lookup Tables | delay_reasons, hold_reasons, departments, shifts, locations, material_groups, product_categories, product_groups, operation_types | 9 |
| Attribute Tables | attribute_definitions, material_attributes, product_attributes, batch_attributes, equipment_attributes, inventory_attributes | 6 |
| Configuration | process_parameters_config, batch_number_config, batch_number_sequence, batch_size_config, equipment_category_config, unit_of_measure, unit_conversion, inventory_form_config, quantity_type_config | 9 |
| Holds & Audit | hold_records, audit_trail | 2 |
| System | database_patches, database_reset_log | 2 |
| **Total** | | **56** |

---

## 1. Authentication

### 1.1 users

Created by **Patch 001**. Stores application users for JWT authentication.

```sql
CREATE TABLE users (
    user_id           BIGSERIAL PRIMARY KEY,
    email             VARCHAR(255) NOT NULL UNIQUE,
    password_hash     VARCHAR(255) NOT NULL,
    name              VARCHAR(255) NOT NULL,
    employee_id       VARCHAR(50),
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_on        TIMESTAMP,
    updated_by        VARCHAR(100)
);
```

**Indexes:** (implicit unique index on `email`)

**Status Values:** `ACTIVE`

---

## 2. Order Management

### 2.1 orders

Created by **Patch 001**. Modified by **Patches 020, 048, 050**.

```sql
CREATE TABLE orders (
    order_id          BIGSERIAL PRIMARY KEY,
    order_number      VARCHAR(50) UNIQUE,
    customer_id       VARCHAR(100),                          -- Legacy varchar FK (patch 001)
    customer_name     VARCHAR(255),
    customer_ref_id   BIGINT REFERENCES customers(customer_id),  -- Proper FK (patch 020)
    order_date        DATE NOT NULL,
    delivery_date     DATE,                                  -- Added patch 048
    notes             VARCHAR(1000),                         -- Added patch 048
    priority          INTEGER DEFAULT 3,                     -- Added patch 050 (1=CRITICAL..5=BACKLOG)
    status            VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    created_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_on        TIMESTAMP,
    updated_by        VARCHAR(100),

    CONSTRAINT fk_orders_customer FOREIGN KEY (customer_ref_id) REFERENCES customers(customer_id),
    CONSTRAINT chk_order_status CHECK (status IN ('CREATED', 'IN_PROGRESS', 'COMPLETED', 'BLOCKED', 'ON_HOLD'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_orders_status` | `status` | 001 |
| `idx_orders_customer_ref` | `customer_ref_id` | 020 |
| `idx_orders_priority` | `priority` | 050 |

### 2.2 order_line_items

Created by **Patch 001**. Modified by **Patches 019, 037, 047**.

```sql
CREATE TABLE order_line_items (
    order_line_id     BIGSERIAL PRIMARY KEY,
    order_id          BIGINT NOT NULL REFERENCES orders(order_id),
    product_sku       VARCHAR(100) NOT NULL,
    product_name      VARCHAR(255),
    quantity          DECIMAL(15,4) NOT NULL,
    unit              VARCHAR(20) NOT NULL DEFAULT 'T',
    delivery_date     DATE,
    process_id        BIGINT REFERENCES processes(process_id),  -- Added patch 037
    status            VARCHAR(30) NOT NULL DEFAULT 'CREATED',
    created_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_on        TIMESTAMP,
    updated_by        VARCHAR(100),

    CONSTRAINT fk_order_line_items_process FOREIGN KEY (process_id) REFERENCES processes(process_id),
    CONSTRAINT chk_line_status CHECK (status IN ('CREATED', 'READY', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'BLOCKED', 'ON_HOLD'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_order_lines_order_id` | `order_id` | 001 |
| `idx_order_lines_status` | `status` | 001 |
| `idx_order_line_items_process` | `process_id` | 037 |

---

## 3. Bill of Materials

### 3.1 bill_of_material

Created by **Patch 001**. Modified by **Patch 016** (constraint fix).

```sql
CREATE TABLE bill_of_material (
    bom_id              BIGSERIAL PRIMARY KEY,
    product_sku         VARCHAR(100) NOT NULL,
    bom_version         VARCHAR(20) DEFAULT 'V1',
    material_id         VARCHAR(100) NOT NULL,
    material_name       VARCHAR(255),
    quantity_required   DECIMAL(15,4) NOT NULL,
    unit                VARCHAR(20) NOT NULL DEFAULT 'T',
    yield_loss_ratio    DECIMAL(10,4) DEFAULT 1.0,
    sequence_level      INTEGER NOT NULL DEFAULT 1,
    parent_bom_id       BIGINT REFERENCES bill_of_material(bom_id),
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_on          TIMESTAMP,
    updated_by          VARCHAR(100),

    CONSTRAINT chk_bom_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DRAFT', 'OBSOLETE', 'ON_HOLD'))
);
```

---

## 4. Production

### 4.1 processes

Originally created as `process_templates` in **Patch 025**, renamed to `processes` in **Patch 028**. Modified by **Patch 030** (dropped `order_line_id`), **Patch 031** (added `usage_decision`).

This is the **design-time** process definition. It was originally the runtime `processes` table (Patch 001) but was replaced through a rename chain in Patches 028/030.

```sql
CREATE TABLE processes (
    process_id        BIGSERIAL PRIMARY KEY,        -- Originally process_template_id
    process_name      VARCHAR(100) NOT NULL,         -- Originally template_name
    process_code      VARCHAR(50) UNIQUE,            -- Originally template_code
    description       VARCHAR(500),
    product_sku       VARCHAR(50),
    status            VARCHAR(20) DEFAULT 'DRAFT',
    version           VARCHAR(20) DEFAULT 'V1',
    effective_from    DATE,
    effective_to      DATE,
    usage_decision    VARCHAR(20),                   -- Added patch 031
    created_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_on        TIMESTAMP,
    updated_by        VARCHAR(100),

    CONSTRAINT chk_process_template_status CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'SUPERSEDED')),
    CONSTRAINT chk_process_usage_decision CHECK (usage_decision IS NULL OR usage_decision IN ('PENDING', 'ACCEPT', 'REJECT'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_process_template_product` | `product_sku` | 025 |
| `idx_process_template_status` | `status` | 025 |

### 4.2 operations

Created by **Patch 001**. Heavily modified by **Patches 011, 028, 030, 040, 044**.

```sql
CREATE TABLE operations (
    operation_id        BIGSERIAL PRIMARY KEY,
    process_id          BIGINT,                           -- FK to processes (design-time), nullable after patch 030
    order_line_id       BIGINT REFERENCES order_line_items(order_line_id),  -- Added patch 030
    routing_step_id     BIGINT REFERENCES routing_steps(routing_step_id),
    operation_template_id BIGINT REFERENCES operation_templates(operation_template_id),  -- Added patch 040
    operation_name      VARCHAR(100) NOT NULL,
    operation_code      VARCHAR(50),
    operation_type      VARCHAR(50),
    sequence_number     INTEGER NOT NULL DEFAULT 1,
    target_qty          DECIMAL(15,4),                    -- Added patch 011
    confirmed_qty       DECIMAL(15,4),                    -- Added patch 011
    status              VARCHAR(30) NOT NULL DEFAULT 'NOT_STARTED',
    start_time          TIMESTAMP,                        -- Added patch 044
    end_time            TIMESTAMP,                        -- Added patch 044
    block_reason        VARCHAR(500),                     -- Added patch 011
    blocked_by          VARCHAR(100),                     -- Added patch 011
    blocked_on          TIMESTAMP,                        -- Added patch 011
    created_on          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_on          TIMESTAMP,
    updated_by          VARCHAR(100),

    CONSTRAINT fk_operation_order_line FOREIGN KEY (order_line_id) REFERENCES order_line_items(order_line_id),
    CONSTRAINT fk_operation_op_template FOREIGN KEY (operation_template_id) REFERENCES operation_templates(operation_template_id),
    CONSTRAINT chk_operation_status CHECK (status IN ('NOT_STARTED', 'READY', 'IN_PROGRESS', 'PARTIALLY_CONFIRMED', 'CONFIRMED', 'BLOCKED', 'ON_HOLD'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_operations_process` | `process_id` | 030 |
| `idx_operations_status` | `status` | 001 |
| `idx_operations_order_line` | `order_line_id` | 030 |
| `idx_operations_op_template` | `operation_template_id` | 040 |
| `idx_operations_blocked` | `blocked_on` (partial: WHERE blocked_on IS NOT NULL) | 011 |
| `idx_operations_start_time` | `start_time` | 044 |
| `idx_operations_end_time` | `end_time` | 044 |

### 4.3 operation_templates

Created by **Patch 040**. Design-time operation definitions.

```sql
CREATE TABLE operation_templates (
    operation_template_id  BIGSERIAL PRIMARY KEY,
    operation_name         VARCHAR(100) NOT NULL,
    operation_code         VARCHAR(50),
    operation_type         VARCHAR(50) NOT NULL,
    quantity_type          VARCHAR(20) DEFAULT 'DISCRETE',
    default_equipment_type VARCHAR(50),
    description            VARCHAR(500),
    estimated_duration_minutes INTEGER,
    status                 VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by             VARCHAR(100),
    updated_on             TIMESTAMP,
    updated_by             VARCHAR(100),

    CONSTRAINT chk_operation_template_status CHECK (status IN ('ACTIVE', 'INACTIVE')),
    CONSTRAINT chk_operation_template_qty_type CHECK (quantity_type IN ('DISCRETE', 'BATCH', 'CONTINUOUS'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_op_template_status` | `status` | 040 |
| `idx_op_template_type` | `operation_type` | 040 |
| `idx_op_template_code` | `operation_code` | 040 |

### 4.4 production_confirmation

Created by **Patch 001**. Modified by **Patches 003, 005, 012, 046, 051**.

```sql
CREATE TABLE production_confirmation (
    confirmation_id    BIGSERIAL PRIMARY KEY,
    operation_id       BIGINT NOT NULL REFERENCES operations(operation_id),
    produced_qty       DECIMAL(15,4) NOT NULL,
    scrap_qty          DECIMAL(15,4) DEFAULT 0,
    start_time         TIMESTAMP NOT NULL,
    end_time           TIMESTAMP NOT NULL,
    delay_minutes      INTEGER DEFAULT 0,
    delay_reason       VARCHAR(100),
    process_parameters TEXT,                              -- Originally JSONB, changed to TEXT (patch 046)
    rm_consumed        TEXT,                              -- Originally JSONB, changed to TEXT (patch 046)
    equipment_ids      BIGINT[],                          -- Added patch 003
    operator_ids       BIGINT[],                          -- Added patch 003
    notes              VARCHAR(1000),                     -- Added patch 005
    rejection_reason   VARCHAR(500),                      -- Added patch 012
    rejected_by        VARCHAR(100),                      -- Added patch 012
    rejected_on        TIMESTAMP,                         -- Added patch 012
    status             VARCHAR(30) NOT NULL DEFAULT 'CONFIRMED',
    created_on         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100),
    updated_on         TIMESTAMP,
    updated_by         VARCHAR(100),

    -- Reversal fields (patch 051)
    reversed_by        VARCHAR(100),
    reversed_on        TIMESTAMP,
    reversal_reason    VARCHAR(500),

    CONSTRAINT chk_confirm_status CHECK (status IN ('CONFIRMED', 'PARTIALLY_CONFIRMED', 'REJECTED', 'PENDING_REVIEW', 'REVERSED'))
);
```

**Indexes:**
| Index | Column(s) | Type | Patch |
|-------|-----------|------|-------|
| `idx_production_confirm_operation` | `operation_id` | B-tree | 001 |
| `idx_confirmation_equipment` | `equipment_ids` | GIN | 003 |
| `idx_confirmation_operators` | `operator_ids` | GIN | 003 |

### 4.5 consumed_materials

Created by **Patch 023**. Detailed material consumption records per confirmation.

```sql
CREATE TABLE consumed_materials (
    consumption_id     SERIAL PRIMARY KEY,
    confirmation_id    BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    inventory_id       BIGINT REFERENCES inventory(inventory_id),
    batch_id           BIGINT REFERENCES batches(batch_id),
    material_id        VARCHAR(100) NOT NULL,
    material_name      VARCHAR(255),
    quantity_consumed  DECIMAL(15,4) NOT NULL,
    unit               VARCHAR(20) NOT NULL,
    consumed_by        VARCHAR(100),
    consumed_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100)
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_consumed_mat_confirmation` | `confirmation_id` | 023 |
| `idx_consumed_mat_inventory` | `inventory_id` | 023 |
| `idx_consumed_mat_batch` | `batch_id` | 023 |
| `idx_consumed_mat_material` | `material_id` | 023 |

### 4.6 produced_outputs

Created by **Patch 023**. Detailed production output records per confirmation.

```sql
CREATE TABLE produced_outputs (
    output_id          SERIAL PRIMARY KEY,
    confirmation_id    BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    batch_id           BIGINT REFERENCES batches(batch_id),
    inventory_id       BIGINT REFERENCES inventory(inventory_id),
    material_id        VARCHAR(100) NOT NULL,
    material_name      VARCHAR(255),
    quantity_produced  DECIMAL(15,4) NOT NULL,
    unit               VARCHAR(20) NOT NULL,
    is_primary_output  BOOLEAN DEFAULT TRUE,
    output_type        VARCHAR(30) DEFAULT 'GOOD',
    produced_by        VARCHAR(100),
    produced_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100),

    CONSTRAINT chk_output_type CHECK (output_type IN ('GOOD', 'SCRAP', 'REWORK', 'BYPRODUCT'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_produced_confirmation` | `confirmation_id` | 023 |
| `idx_produced_batch` | `batch_id` | 023 |
| `idx_produced_inventory` | `inventory_id` | 023 |
| `idx_produced_type` | `output_type` | 023 |

### 4.7 process_parameter_values

Created by **Patch 023**. Actual parameter values captured during confirmation.

```sql
CREATE TABLE process_parameter_values (
    value_id           SERIAL PRIMARY KEY,
    confirmation_id    BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    config_id          BIGINT REFERENCES process_parameters_config(config_id),
    parameter_name     VARCHAR(100) NOT NULL,
    parameter_value    DECIMAL(15,4),
    string_value       VARCHAR(500),
    unit               VARCHAR(20),
    min_limit          DECIMAL(15,4),
    max_limit          DECIMAL(15,4),
    is_within_spec     BOOLEAN DEFAULT TRUE,
    deviation_reason   VARCHAR(500),
    recorded_by        VARCHAR(100),
    recorded_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100)
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_param_values_confirmation` | `confirmation_id` | 023 |
| `idx_param_values_config` | `config_id` | 023 |
| `idx_param_values_name` | `parameter_name` | 023 |
| `idx_param_values_within_spec` | `is_within_spec` | 023 |

### 4.8 operation_parameter_templates

Created by **Patch 023**. Links operation types to required parameter configs.

```sql
CREATE TABLE operation_parameter_templates (
    template_id        SERIAL PRIMARY KEY,
    operation_type     VARCHAR(50) NOT NULL,
    config_id          BIGINT NOT NULL REFERENCES process_parameters_config(config_id),
    is_mandatory       BOOLEAN DEFAULT FALSE,
    display_order      INTEGER DEFAULT 1,
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100),

    UNIQUE(operation_type, config_id),
    CONSTRAINT chk_op_param_template_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_op_param_template_type` | `operation_type` | 023 |
| `idx_op_param_template_config` | `config_id` | 023 |

---

## 5. Inventory & Batches

### 5.1 batches

Created by **Patch 001**. Modified by **Patches 010, 024, 027, 038, 049, 051**.

```sql
CREATE TABLE batches (
    batch_id                BIGSERIAL PRIMARY KEY,
    batch_number            VARCHAR(100) NOT NULL UNIQUE,
    material_id             VARCHAR(100) NOT NULL,
    material_name           VARCHAR(255),
    quantity                DECIMAL(15,4) NOT NULL,
    unit                    VARCHAR(20) NOT NULL DEFAULT 'T',
    generated_at_operation_id BIGINT REFERENCES operations(operation_id),
    status                  VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    -- Quality approval fields (patch 010)
    approved_by             VARCHAR(100),
    approved_on             TIMESTAMP,
    rejection_reason        VARCHAR(500),
    rejected_by             VARCHAR(100),
    rejected_on             TIMESTAMP,
    -- Creation tracking (patch 024)
    created_via             VARCHAR(50) DEFAULT 'MANUAL',
    -- Supplier fields (patch 027)
    supplier_batch_number   VARCHAR(100),
    supplier_id             VARCHAR(50),
    received_date           DATE,
    receipt_notes           VARCHAR(500),
    -- Expiry date (patch 049)
    expiry_date             DATE,
    -- Confirmation linkage (patch 051)
    confirmation_id         BIGINT REFERENCES production_confirmation(confirmation_id),
    -- Standard audit columns
    created_on              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by              VARCHAR(100),
    updated_on              TIMESTAMP,
    updated_by              VARCHAR(100),

    CONSTRAINT chk_batch_status CHECK (status IN ('AVAILABLE', 'CONSUMED', 'PRODUCED', 'ON_HOLD', 'BLOCKED', 'SCRAPPED', 'QUALITY_PENDING')),
    CONSTRAINT chk_batch_created_via CHECK (created_via IN ('PRODUCTION', 'SPLIT', 'MERGE', 'MANUAL', 'SYSTEM', 'RECEIPT'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_batches_status` | `status` | 001 |
| `idx_batches_material` | `material_id` | 001 |
| `idx_batches_quality_pending` | `status` (partial: WHERE status = 'QUALITY_PENDING') | 010 |
| `idx_batches_supplier_batch` | `supplier_batch_number` | 027 |
| `idx_batches_supplier_id` | `supplier_id` | 027 |
| `idx_batches_received_date` | `received_date` | 027 |
| `idx_batches_expiry_date` | `expiry_date` | 049 |
| `idx_batches_confirmation_id` | `confirmation_id` | 051 |

### 5.2 inventory

Created by **Patch 001**. Modified by **Patches 008, 011**.

```sql
CREATE TABLE inventory (
    inventory_id              BIGSERIAL PRIMARY KEY,
    material_id               VARCHAR(100) NOT NULL,
    material_name             VARCHAR(255),
    inventory_type            VARCHAR(20) NOT NULL,
    state                     VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    quantity                  DECIMAL(15,4) NOT NULL,
    unit                      VARCHAR(20) NOT NULL DEFAULT 'T',
    batch_id                  BIGINT REFERENCES batches(batch_id),
    location                  VARCHAR(100),
    -- Inventory form fields (patch 008)
    inventory_form            VARCHAR(20) DEFAULT 'SOLID',
    current_temperature       DECIMAL(10,2),
    moisture_content          DECIMAL(5,2),
    density                   DECIMAL(10,4),
    -- Block tracking (patch 011)
    block_reason              VARCHAR(500),
    blocked_by                VARCHAR(100),
    blocked_on                TIMESTAMP,
    -- Scrap tracking (patch 011)
    scrap_reason              VARCHAR(500),
    scrapped_by               VARCHAR(100),
    scrapped_on               TIMESTAMP,
    -- Reservation tracking (patch 011)
    reserved_for_order_id     BIGINT,
    reserved_for_operation_id BIGINT,
    reserved_by               VARCHAR(100),
    reserved_on               TIMESTAMP,
    reserved_qty              DECIMAL(15,4),
    -- Standard audit
    created_on                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by                VARCHAR(100),
    updated_on                TIMESTAMP,
    updated_by                VARCHAR(100),

    CONSTRAINT chk_inventory_type CHECK (inventory_type IN ('RM', 'IM', 'FG', 'WIP')),
    CONSTRAINT chk_inventory_state CHECK (state IN ('AVAILABLE', 'RESERVED', 'CONSUMED', 'PRODUCED', 'BLOCKED', 'SCRAPPED', 'ON_HOLD'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_inventory_state` | `state` | 001 |
| `idx_inventory_type` | `inventory_type` | 001 |
| `idx_inventory_batch` | `batch_id` | 001 |
| `idx_inventory_reserved_order` | `reserved_for_order_id` | 011 |
| `idx_inventory_reserved_operation` | `reserved_for_operation_id` | 011 |

### 5.3 inventory_movement

Created by **Patch 001**. Modified by **Patch 039** (constraint update).

```sql
CREATE TABLE inventory_movement (
    movement_id     BIGSERIAL PRIMARY KEY,
    operation_id    BIGINT REFERENCES operations(operation_id),
    inventory_id    BIGINT NOT NULL REFERENCES inventory(inventory_id),
    movement_type   VARCHAR(20) NOT NULL,
    quantity        DECIMAL(15,4) NOT NULL,
    timestamp       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    reason          VARCHAR(255),
    status          VARCHAR(20) NOT NULL DEFAULT 'EXECUTED',
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),

    CONSTRAINT chk_movement_type CHECK (movement_type IN ('CONSUME', 'PRODUCE', 'HOLD', 'RELEASE', 'SCRAP', 'RECEIVE', 'TRANSFER', 'ADJUST', 'REVERSAL')),
    CONSTRAINT chk_movement_status CHECK (status IN ('EXECUTED', 'PENDING', 'ON_HOLD'))
);
```

### 5.4 batch_relations

Created by **Patch 001**. Modified by **Patches 024, 047**.

```sql
CREATE TABLE batch_relations (
    relation_id          BIGSERIAL PRIMARY KEY,
    parent_batch_id      BIGINT NOT NULL REFERENCES batches(batch_id),
    child_batch_id       BIGINT NOT NULL REFERENCES batches(batch_id),
    operation_id         BIGINT REFERENCES operations(operation_id),
    relation_type        VARCHAR(20) NOT NULL DEFAULT 'MERGE',
    quantity_consumed    DECIMAL(15,4) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- Soft delete (patch 024)
    deleted_at           TIMESTAMP,
    deleted_by           VARCHAR(100),
    created_on           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),

    CONSTRAINT chk_relation_type CHECK (relation_type IN ('SPLIT', 'MERGE', 'CONSUME')),
    CONSTRAINT chk_relation_status CHECK (status IN ('ACTIVE', 'CLOSED', 'REVERSED'))
);
```

### 5.5 batch_order_allocation

Created by **Patch 001**.

```sql
CREATE TABLE batch_order_allocation (
    allocation_id    BIGSERIAL PRIMARY KEY,
    batch_id         BIGINT NOT NULL REFERENCES batches(batch_id),
    order_line_id    BIGINT NOT NULL REFERENCES order_line_items(order_line_id),
    allocated_qty    DECIMAL(15,4) NOT NULL,
    timestamp        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status           VARCHAR(20) NOT NULL DEFAULT 'ALLOCATED',
    created_on       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),

    CONSTRAINT chk_allocation_status CHECK (status IN ('ALLOCATED', 'RELEASED'))
);
```

### 5.6 batch_quantity_adjustments

Created by **Patch 024**.

```sql
CREATE TABLE batch_quantity_adjustments (
    adjustment_id      SERIAL PRIMARY KEY,
    batch_id           BIGINT NOT NULL REFERENCES batches(batch_id),
    old_quantity       DECIMAL(15,4) NOT NULL,
    new_quantity       DECIMAL(15,4) NOT NULL,
    adjustment_reason  VARCHAR(500) NOT NULL,
    adjustment_type    VARCHAR(50) NOT NULL,
    adjusted_by        VARCHAR(100) NOT NULL,
    adjusted_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_adjustment_type CHECK (adjustment_type IN ('CORRECTION', 'INVENTORY_COUNT', 'DAMAGE', 'SCRAP_RECOVERY', 'SYSTEM'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_batch_adjustments_batch_id` | `batch_id` | 024 |
| `idx_batch_adjustments_type` | `adjustment_type` | 024 |
| `idx_batch_adjustments_date` | `adjusted_on` | 024 |

---

## 6. Equipment

### 6.1 equipment

Created by **Patch 001**. Modified by **Patches 013, 041**.

```sql
CREATE TABLE equipment (
    equipment_id           BIGSERIAL PRIMARY KEY,
    equipment_code         VARCHAR(50) NOT NULL UNIQUE,
    name                   VARCHAR(255) NOT NULL,
    equipment_type         VARCHAR(30) NOT NULL DEFAULT 'BATCH',
    equipment_category     VARCHAR(50),                        -- Added patch 041
    capacity               DECIMAL(15,4),
    capacity_unit          VARCHAR(20),
    location               VARCHAR(100),
    status                 VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
    -- Maintenance fields (patch 013)
    maintenance_reason     VARCHAR(500),
    maintenance_start      TIMESTAMP,
    maintenance_by         VARCHAR(100),
    expected_maintenance_end TIMESTAMP,
    -- Hold fields (patch 013)
    hold_reason            VARCHAR(500),
    hold_start             TIMESTAMP,
    held_by                VARCHAR(100),
    -- Standard audit
    created_on             TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by             VARCHAR(100),
    updated_on             TIMESTAMP,
    updated_by             VARCHAR(100),

    CONSTRAINT chk_equipment_type CHECK (equipment_type IN ('BATCH', 'CONTINUOUS')),
    CONSTRAINT chk_equipment_status CHECK (status IN ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'ON_HOLD', 'UNAVAILABLE')),
    CONSTRAINT chk_equipment_category CHECK (equipment_category IS NULL OR equipment_category IN (
        'MELTING', 'REFINING', 'CASTING', 'HOT_ROLLING', 'COLD_ROLLING',
        'ANNEALING', 'PICKLING', 'BAR_ROLLING', 'COATING', 'WIRE_ROLLING',
        'FINISHING', 'INSPECTION', 'PACKAGING', 'HEAT_TREATMENT', 'GENERAL'
    ))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_equipment_maintenance` | `maintenance_start` (partial: WHERE IS NOT NULL) | 013 |
| `idx_equipment_hold` | `hold_start` (partial: WHERE IS NOT NULL) | 013 |
| `idx_equipment_category` | `equipment_category` | 041 |

### 6.2 operation_equipment_usage

Created by **Patch 001**.

```sql
CREATE TABLE operation_equipment_usage (
    usage_id       BIGSERIAL PRIMARY KEY,
    operation_id   BIGINT NOT NULL REFERENCES operations(operation_id),
    equipment_id   BIGINT NOT NULL REFERENCES equipment(equipment_id),
    start_time     TIMESTAMP,
    end_time       TIMESTAMP,
    operator_id    BIGINT REFERENCES operators(operator_id),
    status         VARCHAR(20) NOT NULL DEFAULT 'LOGGED',
    created_on     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),

    CONSTRAINT chk_equip_usage_status CHECK (status IN ('LOGGED', 'CONFIRMED'))
);
```

### 6.3 confirmation_equipment

Created by **Patch 011**. Junction table for production confirmation to equipment (M:N).

```sql
CREATE TABLE confirmation_equipment (
    id                BIGSERIAL PRIMARY KEY,
    confirmation_id   BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    equipment_id      BIGINT NOT NULL REFERENCES equipment(equipment_id)
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_conf_equip_confirmation` | `confirmation_id` | 011 |
| `idx_conf_equip_equipment` | `equipment_id` | 011 |

### 6.4 confirmation_operators

Created by **Patch 011**. Junction table for production confirmation to operators (M:N).

```sql
CREATE TABLE confirmation_operators (
    id                BIGSERIAL PRIMARY KEY,
    confirmation_id   BIGINT NOT NULL REFERENCES production_confirmation(confirmation_id),
    operator_id       BIGINT NOT NULL REFERENCES operators(operator_id)
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_conf_ops_confirmation` | `confirmation_id` | 011 |
| `idx_conf_ops_operator` | `operator_id` | 011 |

---

## 7. Master Data

### 7.1 customers

Created by **Patch 014**.

```sql
CREATE TABLE customers (
    customer_id      SERIAL PRIMARY KEY,
    customer_code    VARCHAR(50) NOT NULL UNIQUE,
    customer_name    VARCHAR(200) NOT NULL,
    contact_person   VARCHAR(100),
    email            VARCHAR(100),
    phone            VARCHAR(50),
    address          VARCHAR(500),
    city             VARCHAR(100),
    country          VARCHAR(100),
    tax_id           VARCHAR(50),
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_on       TIMESTAMP,
    updated_by       VARCHAR(100),

    CONSTRAINT chk_customer_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_customers_code` | `customer_code` | 014 |
| `idx_customers_name` | `customer_name` | 014 |
| `idx_customers_status` | `status` | 014 |

### 7.2 materials

Created by **Patch 015**.

```sql
CREATE TABLE materials (
    material_id        SERIAL PRIMARY KEY,
    material_code      VARCHAR(50) NOT NULL UNIQUE,
    material_name      VARCHAR(200) NOT NULL,
    description        VARCHAR(500),
    material_type      VARCHAR(20) NOT NULL,
    base_unit          VARCHAR(20) NOT NULL DEFAULT 'T',
    material_group     VARCHAR(50),
    sku                VARCHAR(50),
    standard_cost      NUMERIC(15,4),
    cost_currency      VARCHAR(3) DEFAULT 'USD',
    min_stock_level    NUMERIC(15,4),
    max_stock_level    NUMERIC(15,4),
    reorder_point      NUMERIC(15,4),
    lead_time_days     INTEGER,
    shelf_life_days    INTEGER,
    storage_conditions VARCHAR(255),
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100),
    updated_on         TIMESTAMP,
    updated_by         VARCHAR(100),

    CONSTRAINT chk_material_type CHECK (material_type IN ('RM', 'IM', 'FG', 'WIP')),
    CONSTRAINT chk_material_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'OBSOLETE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_materials_code` | `material_code` | 015 |
| `idx_materials_name` | `material_name` | 015 |
| `idx_materials_type` | `material_type` | 015 |
| `idx_materials_status` | `status` | 015 |

### 7.3 products

Created by **Patch 015**. Modified by **Patch 037** (added `default_process_id`).

```sql
CREATE TABLE products (
    product_id         SERIAL PRIMARY KEY,
    sku                VARCHAR(50) NOT NULL UNIQUE,
    product_name       VARCHAR(200) NOT NULL,
    description        VARCHAR(500),
    product_category   VARCHAR(100),
    product_group      VARCHAR(100),
    base_unit          VARCHAR(20) NOT NULL DEFAULT 'T',
    weight_per_unit    NUMERIC(15,4),
    weight_unit        VARCHAR(10),
    standard_price     NUMERIC(15,4),
    price_currency     VARCHAR(3) DEFAULT 'USD',
    min_order_qty      NUMERIC(15,4),
    lead_time_days     INTEGER,
    material_id        BIGINT,
    default_process_id BIGINT REFERENCES processes(process_id),  -- Added patch 037
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100),
    updated_on         TIMESTAMP,
    updated_by         VARCHAR(100),

    CONSTRAINT fk_products_default_process FOREIGN KEY (default_process_id) REFERENCES processes(process_id),
    CONSTRAINT chk_product_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'DISCONTINUED'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_products_sku` | `sku` | 015 |
| `idx_products_name` | `product_name` | 015 |
| `idx_products_category` | `product_category` | 015 |
| `idx_products_status` | `status` | 015 |
| `idx_products_default_process` | `default_process_id` | 037 |

### 7.4 operators

Created by **Patch 001**.

```sql
CREATE TABLE operators (
    operator_id    BIGSERIAL PRIMARY KEY,
    operator_code  VARCHAR(50) NOT NULL UNIQUE,
    name           VARCHAR(255) NOT NULL,
    department     VARCHAR(100),
    shift          VARCHAR(20),
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),
    updated_on     TIMESTAMP,
    updated_by     VARCHAR(100)
);
```

---

## 8. Routing

### 8.1 routing

Created by **Patch 001**. Modified by **Patches 025, 028**.

```sql
CREATE TABLE routing (
    routing_id          BIGSERIAL PRIMARY KEY,
    process_id          BIGINT NOT NULL REFERENCES processes(process_id),  -- Originally pointed to old processes
    process_id_design   BIGINT,                                            -- Added patch 028 for design-time FK
    routing_name        VARCHAR(100) NOT NULL,
    routing_type        VARCHAR(20) NOT NULL DEFAULT 'SEQUENTIAL',
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_on          TIMESTAMP,
    updated_by          VARCHAR(100),

    CONSTRAINT chk_routing_type CHECK (routing_type IN ('SEQUENTIAL', 'PARALLEL')),
    CONSTRAINT chk_routing_status CHECK (status IN ('DRAFT', 'ACTIVE', 'INACTIVE', 'ON_HOLD'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_routing_template` | `process_template_id` (later dropped) | 025 |

### 8.2 routing_steps

Created by **Patch 001**. Modified by **Patches 025, 040**.

```sql
CREATE TABLE routing_steps (
    routing_step_id       BIGSERIAL PRIMARY KEY,
    routing_id            BIGINT NOT NULL REFERENCES routing(routing_id),
    operation_id          BIGINT,                                 -- Nullified in patch 040
    operation_template_id BIGINT REFERENCES operation_templates(operation_template_id),  -- Added patch 040
    sequence_number       INTEGER NOT NULL,
    is_parallel           BOOLEAN DEFAULT FALSE,
    mandatory_flag        BOOLEAN DEFAULT TRUE,
    status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    -- Batch behavior (patch 025)
    produces_output_batch BOOLEAN DEFAULT TRUE,
    allows_split          BOOLEAN DEFAULT FALSE,
    allows_merge          BOOLEAN DEFAULT FALSE,
    -- Operation template fields (patch 025)
    operation_name        VARCHAR(100),
    operation_type        VARCHAR(50),
    operation_code        VARCHAR(50),
    target_qty            DECIMAL(15,4),
    description           VARCHAR(500),
    estimated_duration_minutes INTEGER,
    -- Standard audit
    created_on            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_on            TIMESTAMP,
    updated_by            VARCHAR(100),

    CONSTRAINT fk_routing_step_op_template FOREIGN KEY (operation_template_id) REFERENCES operation_templates(operation_template_id),
    CONSTRAINT chk_routing_step_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_routing_steps_op_template` | `operation_template_id` | 040 |

---

## 9. Lookup / Master Tables

### 9.1 delay_reasons

Created by **Patch 001**. Modified by **Patch 017** (audit columns).

```sql
CREATE TABLE delay_reasons (
    reason_id            BIGSERIAL PRIMARY KEY,
    reason_code          VARCHAR(50) NOT NULL UNIQUE,
    reason_description   VARCHAR(255) NOT NULL,
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),          -- Added patch 017
    updated_on           TIMESTAMP,             -- Added patch 017
    updated_by           VARCHAR(100)            -- Added patch 017
);
```

### 9.2 hold_reasons

Created by **Patch 001**. Modified by **Patch 017** (audit columns).

```sql
CREATE TABLE hold_reasons (
    reason_id            BIGSERIAL PRIMARY KEY,
    reason_code          VARCHAR(50) NOT NULL UNIQUE,
    reason_description   VARCHAR(255) NOT NULL,
    applicable_to        VARCHAR(100),
    status               VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),          -- Added patch 017
    updated_on           TIMESTAMP,             -- Added patch 017
    updated_by           VARCHAR(100)            -- Added patch 017
);
```

### 9.3 departments

Created by **Patch 021**.

```sql
CREATE TABLE departments (
    department_id    SERIAL PRIMARY KEY,
    department_code  VARCHAR(50) NOT NULL UNIQUE,
    department_name  VARCHAR(100) NOT NULL,
    description      VARCHAR(500),
    manager_name     VARCHAR(100),
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by       VARCHAR(100),
    updated_on       TIMESTAMP,
    updated_by       VARCHAR(100),

    CONSTRAINT chk_department_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_departments_code` | `department_code` | 021 |
| `idx_departments_status` | `status` | 021 |

### 9.4 shifts

Created by **Patch 021**.

```sql
CREATE TABLE shifts (
    shift_id       SERIAL PRIMARY KEY,
    shift_code     VARCHAR(50) NOT NULL UNIQUE,
    shift_name     VARCHAR(100) NOT NULL,
    start_time     TIME,
    end_time       TIME,
    description    VARCHAR(500),
    status         VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by     VARCHAR(100),
    updated_on     TIMESTAMP,
    updated_by     VARCHAR(100),

    CONSTRAINT chk_shift_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_shifts_code` | `shift_code` | 021 |
| `idx_shifts_status` | `status` | 021 |

### 9.5 locations

Created by **Patch 021**.

```sql
CREATE TABLE locations (
    location_id               SERIAL PRIMARY KEY,
    location_code             VARCHAR(50) NOT NULL UNIQUE,
    location_name             VARCHAR(100) NOT NULL,
    location_type             VARCHAR(30) NOT NULL DEFAULT 'WAREHOUSE',
    parent_location_id        INTEGER REFERENCES locations(location_id),
    address                   VARCHAR(500),
    capacity                  DECIMAL(15,4),
    capacity_unit             VARCHAR(20),
    is_temperature_controlled BOOLEAN DEFAULT FALSE,
    min_temperature           DECIMAL(5,2),
    max_temperature           DECIMAL(5,2),
    status                    VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on                TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by                VARCHAR(100),
    updated_on                TIMESTAMP,
    updated_by                VARCHAR(100),

    CONSTRAINT chk_location_type CHECK (location_type IN ('WAREHOUSE', 'PLANT', 'ZONE', 'RACK', 'BIN', 'STAGING')),
    CONSTRAINT chk_location_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'MAINTENANCE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_locations_code` | `location_code` | 021 |
| `idx_locations_type` | `location_type` | 021 |
| `idx_locations_parent` | `parent_location_id` | 021 |
| `idx_locations_status` | `status` | 021 |

### 9.6 material_groups

Created by **Patch 021**.

```sql
CREATE TABLE material_groups (
    group_id        SERIAL PRIMARY KEY,
    group_code      VARCHAR(50) NOT NULL UNIQUE,
    group_name      VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    parent_group_id INTEGER REFERENCES material_groups(group_id),
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_on      TIMESTAMP,
    updated_by      VARCHAR(100),

    CONSTRAINT chk_material_group_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_material_groups_code` | `group_code` | 021 |
| `idx_material_groups_parent` | `parent_group_id` | 021 |
| `idx_material_groups_status` | `status` | 021 |

### 9.7 product_categories

Created by **Patch 021**.

```sql
CREATE TABLE product_categories (
    category_id        SERIAL PRIMARY KEY,
    category_code      VARCHAR(50) NOT NULL UNIQUE,
    category_name      VARCHAR(100) NOT NULL,
    description        VARCHAR(500),
    parent_category_id INTEGER REFERENCES product_categories(category_id),
    status             VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on         TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by         VARCHAR(100),
    updated_on         TIMESTAMP,
    updated_by         VARCHAR(100),

    CONSTRAINT chk_product_category_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_product_categories_code` | `category_code` | 021 |
| `idx_product_categories_parent` | `parent_category_id` | 021 |
| `idx_product_categories_status` | `status` | 021 |

### 9.8 product_groups

Created by **Patch 021**.

```sql
CREATE TABLE product_groups (
    group_id      SERIAL PRIMARY KEY,
    group_code    VARCHAR(50) NOT NULL UNIQUE,
    group_name    VARCHAR(100) NOT NULL,
    description   VARCHAR(500),
    category_id   INTEGER REFERENCES product_categories(category_id),
    status        VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by    VARCHAR(100),
    updated_on    TIMESTAMP,
    updated_by    VARCHAR(100),

    CONSTRAINT chk_product_group_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_product_groups_code` | `group_code` | 021 |
| `idx_product_groups_category` | `category_id` | 021 |
| `idx_product_groups_status` | `status` | 021 |

### 9.9 operation_types

Created by **Patch 021**.

```sql
CREATE TABLE operation_types (
    type_id             SERIAL PRIMARY KEY,
    type_code           VARCHAR(50) NOT NULL UNIQUE,
    type_name           VARCHAR(100) NOT NULL,
    description         VARCHAR(500),
    default_duration_minutes INTEGER,
    requires_equipment  BOOLEAN DEFAULT TRUE,
    requires_operator   BOOLEAN DEFAULT TRUE,
    produces_output     BOOLEAN DEFAULT TRUE,
    status              VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by          VARCHAR(100),
    updated_on          TIMESTAMP,
    updated_by          VARCHAR(100),

    CONSTRAINT chk_operation_type_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_operation_types_code` | `type_code` | 021 |
| `idx_operation_types_status` | `status` | 021 |

---

## 10. Attribute Tables

### 10.1 attribute_definitions

Created by **Patch 022**. Defines available attributes per entity type.

```sql
CREATE TABLE attribute_definitions (
    attribute_id    SERIAL PRIMARY KEY,
    attribute_code  VARCHAR(50) NOT NULL UNIQUE,
    attribute_name  VARCHAR(100) NOT NULL,
    description     VARCHAR(500),
    data_type       VARCHAR(30) NOT NULL DEFAULT 'STRING',
    entity_type     VARCHAR(50) NOT NULL,
    unit            VARCHAR(20),
    min_value       DECIMAL(15,4),
    max_value       DECIMAL(15,4),
    allowed_values  TEXT,
    is_required     BOOLEAN DEFAULT FALSE,
    is_searchable   BOOLEAN DEFAULT TRUE,
    display_order   INTEGER DEFAULT 1,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_on      TIMESTAMP,
    updated_by      VARCHAR(100),

    CONSTRAINT chk_attr_data_type CHECK (data_type IN ('STRING', 'INTEGER', 'DECIMAL', 'BOOLEAN', 'DATE', 'DATETIME', 'LIST')),
    CONSTRAINT chk_attr_entity_type CHECK (entity_type IN ('MATERIAL', 'PRODUCT', 'BATCH', 'EQUIPMENT', 'OPERATION', 'INVENTORY')),
    CONSTRAINT chk_attr_status CHECK (status IN ('ACTIVE', 'INACTIVE'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_attr_def_code` | `attribute_code` | 022 |
| `idx_attr_def_entity` | `entity_type` | 022 |
| `idx_attr_def_status` | `status` | 022 |

### 10.2 material_attributes

Created by **Patch 022**.

```sql
CREATE TABLE material_attributes (
    id              SERIAL PRIMARY KEY,
    material_id     BIGINT NOT NULL REFERENCES materials(material_id),
    attribute_id    INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value    VARCHAR(500),
    numeric_value   DECIMAL(15,4),
    boolean_value   BOOLEAN,
    date_value      DATE,
    datetime_value  TIMESTAMP,
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_on      TIMESTAMP,
    updated_by      VARCHAR(100),

    UNIQUE(material_id, attribute_id)
);
```

**Indexes:** `idx_mat_attr_material(material_id)`, `idx_mat_attr_attribute(attribute_id)`

### 10.3 product_attributes

Created by **Patch 022**.

```sql
CREATE TABLE product_attributes (
    id              SERIAL PRIMARY KEY,
    product_id      BIGINT NOT NULL REFERENCES products(product_id),
    attribute_id    INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value    VARCHAR(500),
    numeric_value   DECIMAL(15,4),
    boolean_value   BOOLEAN,
    date_value      DATE,
    datetime_value  TIMESTAMP,
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_on      TIMESTAMP,
    updated_by      VARCHAR(100),

    UNIQUE(product_id, attribute_id)
);
```

**Indexes:** `idx_prod_attr_product(product_id)`, `idx_prod_attr_attribute(attribute_id)`

### 10.4 batch_attributes

Created by **Patch 022**.

```sql
CREATE TABLE batch_attributes (
    id              SERIAL PRIMARY KEY,
    batch_id        BIGINT NOT NULL REFERENCES batches(batch_id),
    attribute_id    INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value    VARCHAR(500),
    numeric_value   DECIMAL(15,4),
    boolean_value   BOOLEAN,
    date_value      DATE,
    datetime_value  TIMESTAMP,
    recorded_by     VARCHAR(100),
    recorded_on     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),

    UNIQUE(batch_id, attribute_id)
);
```

**Indexes:** `idx_batch_attr_batch(batch_id)`, `idx_batch_attr_attribute(attribute_id)`

### 10.5 equipment_attributes

Created by **Patch 022**.

```sql
CREATE TABLE equipment_attributes (
    id              SERIAL PRIMARY KEY,
    equipment_id    BIGINT NOT NULL REFERENCES equipment(equipment_id),
    attribute_id    INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value    VARCHAR(500),
    numeric_value   DECIMAL(15,4),
    boolean_value   BOOLEAN,
    date_value      DATE,
    datetime_value  TIMESTAMP,
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),
    updated_on      TIMESTAMP,
    updated_by      VARCHAR(100),

    UNIQUE(equipment_id, attribute_id)
);
```

**Indexes:** `idx_equip_attr_equipment(equipment_id)`, `idx_equip_attr_attribute(attribute_id)`

### 10.6 inventory_attributes

Created by **Patch 022**.

```sql
CREATE TABLE inventory_attributes (
    id              SERIAL PRIMARY KEY,
    inventory_id    BIGINT NOT NULL REFERENCES inventory(inventory_id),
    attribute_id    INTEGER NOT NULL REFERENCES attribute_definitions(attribute_id),
    string_value    VARCHAR(500),
    numeric_value   DECIMAL(15,4),
    boolean_value   BOOLEAN,
    date_value      DATE,
    datetime_value  TIMESTAMP,
    recorded_by     VARCHAR(100),
    recorded_on     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),

    UNIQUE(inventory_id, attribute_id)
);
```

**Indexes:** `idx_inv_attr_inventory(inventory_id)`, `idx_inv_attr_attribute(attribute_id)`

---

## 11. Configuration Tables

### 11.1 process_parameters_config

Created by **Patch 001**. Modified by **Patch 017** (audit columns).

```sql
CREATE TABLE process_parameters_config (
    config_id       BIGSERIAL PRIMARY KEY,
    operation_type  VARCHAR(50) NOT NULL,
    product_sku     VARCHAR(100),
    parameter_name  VARCHAR(100) NOT NULL,
    parameter_type  VARCHAR(30) NOT NULL DEFAULT 'DECIMAL',
    unit            VARCHAR(20),
    min_value       DECIMAL(15,4),
    max_value       DECIMAL(15,4),
    default_value   DECIMAL(15,4),
    is_required     BOOLEAN DEFAULT FALSE,
    display_order   INTEGER DEFAULT 1,
    status          VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by      VARCHAR(100),        -- Added patch 017
    updated_on      TIMESTAMP,           -- Added patch 017
    updated_by      VARCHAR(100)          -- Added patch 017
);
```

### 11.2 batch_number_config

Created by **Patch 009**. Modified by **Patches 017, 029**.

```sql
CREATE TABLE batch_number_config (
    config_id             BIGSERIAL PRIMARY KEY,
    config_name           VARCHAR(100) NOT NULL UNIQUE,
    operation_type        VARCHAR(50),
    product_sku           VARCHAR(100),
    material_id           VARCHAR(100),           -- Added patch 029
    prefix                VARCHAR(50) NOT NULL DEFAULT 'BATCH',
    include_operation_code BOOLEAN DEFAULT TRUE,
    operation_code_length INTEGER DEFAULT 2,
    separator             VARCHAR(5) NOT NULL DEFAULT '-',
    date_format           VARCHAR(20) DEFAULT 'yyyyMMdd',
    include_date          BOOLEAN DEFAULT TRUE,
    sequence_length       INTEGER NOT NULL DEFAULT 3,
    sequence_reset        VARCHAR(20) DEFAULT 'DAILY',
    priority              INTEGER DEFAULT 100,
    status                VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by            VARCHAR(100),
    updated_on            TIMESTAMP,               -- Added patch 017
    updated_by            VARCHAR(100)              -- Added patch 017
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_batch_config_operation` | `operation_type` | 009 |
| `idx_batch_config_product` | `product_sku` | 009 |
| `idx_batch_config_priority` | `priority` | 009 |
| `idx_batch_config_material` | `material_id` | 029 |

### 11.3 batch_number_sequence

Created by **Patch 009**. Tracks current sequence values for batch number generation.

```sql
CREATE TABLE batch_number_sequence (
    sequence_id      BIGSERIAL PRIMARY KEY,
    config_id        BIGINT NOT NULL REFERENCES batch_number_config(config_id),
    sequence_key     VARCHAR(200) NOT NULL,
    current_value    INTEGER NOT NULL DEFAULT 0,
    last_reset_on    TIMESTAMP,
    updated_on       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(config_id, sequence_key)
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_batch_seq_key` | `sequence_key` | 009 |

### 11.4 batch_size_config

Created by **Patch 026**.

```sql
CREATE TABLE batch_size_config (
    config_id            SERIAL PRIMARY KEY,
    material_id          VARCHAR(50),
    operation_type       VARCHAR(50),
    equipment_type       VARCHAR(50),
    product_sku          VARCHAR(50),
    min_batch_size       DECIMAL(15,4) DEFAULT 0,
    max_batch_size       DECIMAL(15,4) NOT NULL,
    preferred_batch_size DECIMAL(15,4),
    unit                 VARCHAR(20) DEFAULT 'T',
    allow_partial_batch  BOOLEAN DEFAULT TRUE,
    is_active            BOOLEAN DEFAULT TRUE,
    priority             INTEGER DEFAULT 0,
    created_on           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by           VARCHAR(100),
    updated_on           TIMESTAMP,
    updated_by           VARCHAR(100),

    CONSTRAINT chk_batch_size_range CHECK (max_batch_size >= min_batch_size),
    CONSTRAINT chk_preferred_in_range CHECK (
        preferred_batch_size IS NULL OR
        (preferred_batch_size >= min_batch_size AND preferred_batch_size <= max_batch_size)
    )
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_batch_size_config_material` | `material_id` | 026 |
| `idx_batch_size_config_operation` | `operation_type` | 026 |
| `idx_batch_size_config_product` | `product_sku` | 026 |
| `idx_batch_size_config_active` | `is_active` | 026 |

### 11.5 equipment_category_config

Originally created as `equipment_type_config` in **Patch 006**. Renamed in **Patch 042**. Values updated in **Patch 043**.

```sql
CREATE TABLE equipment_category_config (
    config_id                     BIGSERIAL PRIMARY KEY,
    equipment_category            VARCHAR(50) NOT NULL UNIQUE,   -- Originally equipment_type
    display_name                  VARCHAR(100) NOT NULL,
    description                   VARCHAR(500),
    min_capacity                  DECIMAL(15,4),
    max_capacity                  DECIMAL(15,4),
    default_capacity_unit         VARCHAR(20),
    min_temperature               DECIMAL(10,2),
    max_temperature               DECIMAL(10,2),
    min_pressure                  DECIMAL(10,2),
    max_pressure                  DECIMAL(10,2),
    maintenance_interval_hours    INT,
    max_continuous_operation_hours INT,
    requires_operator             BOOLEAN DEFAULT TRUE,
    requires_calibration          BOOLEAN DEFAULT FALSE,
    allows_parallel_operation     BOOLEAN DEFAULT TRUE,
    is_active                     BOOLEAN DEFAULT TRUE,
    created_on                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on                    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 11.6 unit_of_measure

Created by **Patch 007**.

```sql
CREATE TABLE unit_of_measure (
    unit_id           BIGSERIAL PRIMARY KEY,
    unit_code         VARCHAR(20) NOT NULL UNIQUE,
    unit_name         VARCHAR(50) NOT NULL,
    unit_type         VARCHAR(20) NOT NULL,
    decimal_precision INT DEFAULT 2,
    is_base_unit      BOOLEAN DEFAULT FALSE,
    is_active         BOOLEAN DEFAULT TRUE,
    created_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 11.7 unit_conversion

Created by **Patch 007**.

```sql
CREATE TABLE unit_conversion (
    conversion_id     BIGSERIAL PRIMARY KEY,
    from_unit_code    VARCHAR(20) NOT NULL,
    to_unit_code      VARCHAR(20) NOT NULL,
    conversion_factor DECIMAL(20,10) NOT NULL,
    is_active         BOOLEAN DEFAULT TRUE,
    created_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(from_unit_code, to_unit_code)
);
```

### 11.8 inventory_form_config

Created by **Patch 008**.

```sql
CREATE TABLE inventory_form_config (
    form_id                     BIGSERIAL PRIMARY KEY,
    form_code                   VARCHAR(20) NOT NULL UNIQUE,
    form_name                   VARCHAR(50) NOT NULL,
    description                 VARCHAR(200),
    tracks_temperature          BOOLEAN DEFAULT FALSE,
    tracks_moisture             BOOLEAN DEFAULT FALSE,
    tracks_density              BOOLEAN DEFAULT FALSE,
    default_weight_unit         VARCHAR(20) DEFAULT 'KG',
    default_volume_unit         VARCHAR(20),
    requires_temperature_control BOOLEAN DEFAULT FALSE,
    min_storage_temp            DECIMAL(10,2),
    max_storage_temp            DECIMAL(10,2),
    requires_humidity_control   BOOLEAN DEFAULT FALSE,
    max_humidity_percent        INT,
    requires_special_handling   BOOLEAN DEFAULT FALSE,
    handling_notes              VARCHAR(500),
    shelf_life_days             INT,
    is_active                   BOOLEAN DEFAULT TRUE,
    created_on                  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 11.9 quantity_type_config

Created by **Patch 018**.

```sql
CREATE TABLE quantity_type_config (
    config_id         BIGSERIAL PRIMARY KEY,
    config_name       VARCHAR(100) NOT NULL UNIQUE,
    material_code     VARCHAR(50),
    operation_type    VARCHAR(50),
    equipment_type    VARCHAR(50),
    quantity_type     VARCHAR(20) NOT NULL DEFAULT 'DECIMAL',
    decimal_precision INTEGER NOT NULL DEFAULT 4,
    rounding_rule     VARCHAR(20) NOT NULL DEFAULT 'HALF_UP',
    min_quantity      DECIMAL(15,4) DEFAULT 0,
    max_quantity      DECIMAL(15,4),
    unit              VARCHAR(20),
    status            VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by        VARCHAR(100),
    updated_on        TIMESTAMP,
    updated_by        VARCHAR(100)
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_qty_config_material` | `material_code` | 018 |
| `idx_qty_config_operation` | `operation_type` | 018 |
| `idx_qty_config_status` | `status` | 018 |

---

## 12. Holds & Audit

### 12.1 hold_records

Created by **Patch 001**. Modified by **Patch 019** (entity type constraint).

```sql
CREATE TABLE hold_records (
    hold_id          BIGSERIAL PRIMARY KEY,
    entity_type      VARCHAR(30) NOT NULL,
    entity_id        BIGINT NOT NULL,
    reason           VARCHAR(100) NOT NULL,
    comments         TEXT,
    applied_by       VARCHAR(100) NOT NULL,
    applied_on       TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    released_by      VARCHAR(100),
    released_on      TIMESTAMP,
    release_comments TEXT,
    status           VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_hold_entity_type CHECK (entity_type IN ('OPERATION', 'PROCESS', 'ORDER_LINE', 'INVENTORY', 'BATCH', 'EQUIPMENT')),
    CONSTRAINT chk_hold_status CHECK (status IN ('ACTIVE', 'RELEASED'))
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_hold_entity` | `entity_type, entity_id` | 001 |

### 12.2 audit_trail

Created by **Patch 001**. Modified by **Patch 045** (extended action column).

```sql
CREATE TABLE audit_trail (
    audit_id       BIGSERIAL PRIMARY KEY,
    entity_type    VARCHAR(50) NOT NULL,
    entity_id      BIGINT NOT NULL,
    field_name     VARCHAR(100),
    old_value      TEXT,
    new_value      TEXT,
    action         VARCHAR(30) NOT NULL,          -- Extended from 20 to 30 (patch 045)
    changed_by     VARCHAR(100) NOT NULL,
    timestamp      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_audit_entity` | `entity_type, entity_id` | 001 |

---

## 13. System Tables

### 13.1 database_patches

Created by **PatchService.java** (not a patch file). Tracks all applied SQL patches.

```sql
CREATE TABLE database_patches (
    id                BIGSERIAL PRIMARY KEY,
    patch_number      INTEGER NOT NULL UNIQUE,
    patch_name        VARCHAR(255) NOT NULL,
    file_name         VARCHAR(255) NOT NULL,
    applied_on        TIMESTAMP NOT NULL,
    applied_by        VARCHAR(100),
    execution_time_ms BIGINT,
    checksum          VARCHAR(64),
    success           BOOLEAN NOT NULL,
    error_message     TEXT
);
```

### 13.2 database_reset_log

Created by **Patch 033**.

```sql
CREATE TABLE database_reset_log (
    reset_id         SERIAL PRIMARY KEY,
    reset_type       VARCHAR(50) NOT NULL,
    reset_by         VARCHAR(100) NOT NULL,
    reset_timestamp  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    environment      VARCHAR(50) NOT NULL,
    tables_affected  TEXT,
    rows_deleted     INTEGER DEFAULT 0
);
```

**Indexes:**
| Index | Column(s) | Patch |
|-------|-----------|-------|
| `idx_reset_log_timestamp` | `reset_timestamp DESC` | 033 |
| `idx_reset_log_environment` | `environment` | 033 |

---

## 14. Foreign Key Relationships Diagram

```
                                    +------------------+
                                    |    customers     |
                                    +--------+---------+
                                             |
                                    customer_ref_id
                                             |
+------------+      order_id       +---------v--------+
|  products  |<--- product_sku --- | order_line_items |
+-----+------+                     +---------+--------+
      |                                      |
      | default_process_id          order_line_id
      |                                      |
      v                                      v
+-----+------+     process_id      +---------+---------+     operation_template_id
|  processes |<--------------------+    operations      +------------------------>+-------------------+
+-----+------+                     +------+---+---+-----+                         | operation_templates|
      |                                   |   |   |                               +-------------------+
      |                                   |   |   |
      | process_id                        |   |   +--- routing_step_id
      |                                   |   |           |
      v                                   |   |           v
+-----+------+    routing_id       +------+   |    +-----+----------+
|   routing  +-------------------->+ routing_steps  |               |
+------------+                     +------+---------+               |
                                          |                         |
                                 operation_template_id              |
                                          |                         |
                         +----------------+                         |
                         v                                          |
                 +-------+-------+                                  |
                 | operation_    |                                   |
                 | templates     |                                   |
                 +---------------+                                  |
                                                                    |
                                              operation_id          |
                                                   |                |
+----------------+   confirmation_id  +------------v---------+      |
| consumed_      +<-------------------+ production_          |      |
| materials      |                    | confirmation         |      |
+----------------+                    +---+----+---+---------+      |
                                          |    |   |                |
+----------------+   confirmation_id      |    |   |                |
| produced_      +<-----------------------+    |   |                |
| outputs        |                             |   |                |
+---+------------+                             |   |                |
    |                                          |   |                |
    | batch_id     +----------+                |   |                |
    +------------->+  batches +<---------------+   |                |
                   +----+-----+  (via consumed &   |                |
                        |         produced          |                |
                        |         batch_id)         |                |
              batch_id  |                           |                |
                        v                           |                |
                +-------+------+                    |                |
                |  inventory   |                    |                |
                +--------------+                    |                |
                                                    |                |
+-------------------+   confirmation_id             |                |
| confirmation_     +<------------------------------+                |
| equipment         |                                                |
+---+---------------+                                                |
    |                                                                |
    | equipment_id          +------------+                           |
    +---------------------->+ equipment  +<--------------------------+
                            +------------+        (operation_equipment_usage)
                                                                     |
+-------------------+   confirmation_id                              |
| confirmation_     +<-----------------------------------------------+
| operators         |        (from production_confirmation)
+---+---------------+
    |
    | operator_id
    +------------->+-----------+
                   | operators |
                   +-----------+

+------------------+    parent_batch_id    +----------+
| batch_relations  +----- ------------->   | batches  |
|                  +----- child_batch_id-->|          |
+------------------+                       +----------+

+---------------------+    batch_id        +----------+
| batch_order_        +------------------>  | batches  |
| allocation          +--- order_line_id -> | order_   |
+---------------------+                    | line_items|
                                           +----------+

+---------------------+    batch_id        +----------+
| batch_quantity_     +------------------>  | batches  |
| adjustments         |                    +----------+
+---------------------+

+------------------+    inventory_id       +----------+
| inventory_       +--------------------> | inventory |
| movement         +--- operation_id ---> | operations|
+------------------+                      +----------+

+------------------+                       +------------------+
| hold_records     | (polymorphic FK:      | Any entity with  |
|                  |  entity_type+id)      | a BIGSERIAL PK   |
+------------------+                       +------------------+

+------------------+                       +------------------+
| audit_trail      | (polymorphic FK:      | Any entity with  |
|                  |  entity_type+id)      | a BIGSERIAL PK   |
+------------------+                       +------------------+

Attribute Tables:
+---------------------+    material_id     +----------+
| material_attributes +------------------>  | materials|
|                     +--- attribute_id --> | attribute|
+---------------------+                    | _definitions|
                                           +----------+
(Same pattern for product_attributes, batch_attributes,
 equipment_attributes, inventory_attributes)
```

---

## 15. State Machines

### 15.1 Order Status (`orders.status`)
```
CREATED --> IN_PROGRESS --> COMPLETED
   |            |
   v            v
BLOCKED <--> ON_HOLD
```
Values: `CREATED`, `IN_PROGRESS`, `COMPLETED`, `BLOCKED`, `ON_HOLD`

### 15.2 Order Line Item Status (`order_line_items.status`)
```
CREATED --> READY --> IN_PROGRESS --> COMPLETED
   |          |           |
   v          v           v
BLOCKED <--> ON_HOLD   CANCELLED
```
Values: `CREATED`, `READY`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`, `BLOCKED`, `ON_HOLD`

### 15.3 Operation Status (`operations.status`)
```
NOT_STARTED --> READY --> IN_PROGRESS --> PARTIALLY_CONFIRMED --> CONFIRMED
                  |           |
                  v           v
               ON_HOLD     BLOCKED
```
Values: `NOT_STARTED`, `READY`, `IN_PROGRESS`, `PARTIALLY_CONFIRMED`, `CONFIRMED`, `BLOCKED`, `ON_HOLD`

### 15.4 Production Confirmation Status (`production_confirmation.status`)
```
PENDING_REVIEW --> CONFIRMED
       |
       v
   REJECTED
       |
       v
PARTIALLY_CONFIRMED
```
Values: `CONFIRMED`, `PARTIALLY_CONFIRMED`, `REJECTED`, `PENDING_REVIEW`

### 15.5 Batch Status (`batches.status`)
```
QUALITY_PENDING --> AVAILABLE --> CONSUMED
       |               |
       v               v
   (rejected)      PRODUCED
                       |
                       v
                   ON_HOLD <--> AVAILABLE
                       |
                       v
                    BLOCKED
                       |
                       v
                   SCRAPPED
```
Values: `AVAILABLE`, `CONSUMED`, `PRODUCED`, `ON_HOLD`, `BLOCKED`, `SCRAPPED`, `QUALITY_PENDING`

### 15.6 Inventory State (`inventory.state`)
```
AVAILABLE --> RESERVED --> CONSUMED
    |              |
    v              v
 PRODUCED      ON_HOLD
    |
    v
 BLOCKED --> SCRAPPED
```
Values: `AVAILABLE`, `RESERVED`, `CONSUMED`, `PRODUCED`, `BLOCKED`, `SCRAPPED`, `ON_HOLD`

### 15.7 Equipment Status (`equipment.status`)
```
AVAILABLE --> IN_USE --> AVAILABLE
    |                       |
    v                       v
MAINTENANCE            ON_HOLD
    |                       |
    v                       v
AVAILABLE              AVAILABLE
    |
    v
UNAVAILABLE
```
Values: `AVAILABLE`, `IN_USE`, `MAINTENANCE`, `ON_HOLD`, `UNAVAILABLE`

### 15.8 Process Status (`processes.status`) -- Design-time
Values: `DRAFT`, `ACTIVE`, `INACTIVE`, `SUPERSEDED`

### 15.9 Routing Status (`routing.status`)
Values: `DRAFT`, `ACTIVE`, `INACTIVE`, `ON_HOLD`

### 15.10 Hold Record Status (`hold_records.status`)
```
ACTIVE --> RELEASED
```
Values: `ACTIVE`, `RELEASED`

### 15.11 Batch Created Via (`batches.created_via`)
Values: `PRODUCTION`, `SPLIT`, `MERGE`, `MANUAL`, `SYSTEM`, `RECEIPT`

### 15.12 Inventory Movement Type (`inventory_movement.movement_type`)
Values: `CONSUME`, `PRODUCE`, `HOLD`, `RELEASE`, `SCRAP`, `RECEIVE`, `TRANSFER`, `ADJUST`

### 15.13 Batch Relation Type (`batch_relations.relation_type`)
Values: `SPLIT`, `MERGE`, `CONSUME`

### 15.14 Inventory Type (`inventory.inventory_type`)
Values: `RM` (Raw Material), `IM` (Intermediate), `FG` (Finished Goods), `WIP` (Work in Progress)

### 15.15 Equipment Type (`equipment.equipment_type`)
Values: `BATCH`, `CONTINUOUS`

### 15.16 Equipment Category (`equipment.equipment_category`)
Values: `MELTING`, `REFINING`, `CASTING`, `HOT_ROLLING`, `COLD_ROLLING`, `ANNEALING`, `PICKLING`, `BAR_ROLLING`, `COATING`, `WIRE_ROLLING`, `FINISHING`, `INSPECTION`, `PACKAGING`, `HEAT_TREATMENT`, `GENERAL`

### 15.17 Process Usage Decision (`processes.usage_decision`)
Values: `PENDING`, `ACCEPT`, `REJECT`

### 15.18 Produced Output Type (`produced_outputs.output_type`)
Values: `GOOD`, `SCRAP`, `REWORK`, `BYPRODUCT`

### 15.19 Batch Quantity Adjustment Type (`batch_quantity_adjustments.adjustment_type`)
Values: `CORRECTION`, `INVENTORY_COUNT`, `DAMAGE`, `SCRAP_RECOVERY`, `SYSTEM`

### 15.20 Hold Entity Type (`hold_records.entity_type`)
Values: `OPERATION`, `PROCESS`, `ORDER_LINE`, `INVENTORY`, `BATCH`, `EQUIPMENT`

---

## 16. Complete Indexes Summary

| Table | Index Name | Column(s) | Type | Patch |
|-------|-----------|-----------|------|-------|
| orders | `idx_orders_status` | status | B-tree | 001 |
| orders | `idx_orders_customer_ref` | customer_ref_id | B-tree | 020 |
| orders | `idx_orders_priority` | priority | B-tree | 050 |
| order_line_items | `idx_order_lines_order_id` | order_id | B-tree | 001 |
| order_line_items | `idx_order_lines_status` | status | B-tree | 001 |
| order_line_items | `idx_order_line_items_process` | process_id | B-tree | 037 |
| processes | `idx_process_template_product` | product_sku | B-tree | 025 |
| processes | `idx_process_template_status` | status | B-tree | 025 |
| operations | `idx_operations_process` | process_id | B-tree | 030 |
| operations | `idx_operations_status` | status | B-tree | 001 |
| operations | `idx_operations_order_line` | order_line_id | B-tree | 030 |
| operations | `idx_operations_op_template` | operation_template_id | B-tree | 040 |
| operations | `idx_operations_blocked` | blocked_on | Partial B-tree | 011 |
| operations | `idx_operations_start_time` | start_time | B-tree | 044 |
| operations | `idx_operations_end_time` | end_time | B-tree | 044 |
| operation_templates | `idx_op_template_status` | status | B-tree | 040 |
| operation_templates | `idx_op_template_type` | operation_type | B-tree | 040 |
| operation_templates | `idx_op_template_code` | operation_code | B-tree | 040 |
| production_confirmation | `idx_production_confirm_operation` | operation_id | B-tree | 001 |
| production_confirmation | `idx_confirmation_equipment` | equipment_ids | GIN | 003 |
| production_confirmation | `idx_confirmation_operators` | operator_ids | GIN | 003 |
| consumed_materials | `idx_consumed_mat_confirmation` | confirmation_id | B-tree | 023 |
| consumed_materials | `idx_consumed_mat_inventory` | inventory_id | B-tree | 023 |
| consumed_materials | `idx_consumed_mat_batch` | batch_id | B-tree | 023 |
| consumed_materials | `idx_consumed_mat_material` | material_id | B-tree | 023 |
| produced_outputs | `idx_produced_confirmation` | confirmation_id | B-tree | 023 |
| produced_outputs | `idx_produced_batch` | batch_id | B-tree | 023 |
| produced_outputs | `idx_produced_inventory` | inventory_id | B-tree | 023 |
| produced_outputs | `idx_produced_type` | output_type | B-tree | 023 |
| process_parameter_values | `idx_param_values_confirmation` | confirmation_id | B-tree | 023 |
| process_parameter_values | `idx_param_values_config` | config_id | B-tree | 023 |
| process_parameter_values | `idx_param_values_name` | parameter_name | B-tree | 023 |
| process_parameter_values | `idx_param_values_within_spec` | is_within_spec | B-tree | 023 |
| operation_parameter_templates | `idx_op_param_template_type` | operation_type | B-tree | 023 |
| operation_parameter_templates | `idx_op_param_template_config` | config_id | B-tree | 023 |
| batches | `idx_batches_status` | status | B-tree | 001 |
| batches | `idx_batches_material` | material_id | B-tree | 001 |
| batches | `idx_batches_quality_pending` | status (WHERE = 'QUALITY_PENDING') | Partial B-tree | 010 |
| batches | `idx_batches_supplier_batch` | supplier_batch_number | B-tree | 027 |
| batches | `idx_batches_supplier_id` | supplier_id | B-tree | 027 |
| batches | `idx_batches_received_date` | received_date | B-tree | 027 |
| batches | `idx_batches_expiry_date` | expiry_date | B-tree | 049 |
| inventory | `idx_inventory_state` | state | B-tree | 001 |
| inventory | `idx_inventory_type` | inventory_type | B-tree | 001 |
| inventory | `idx_inventory_batch` | batch_id | B-tree | 001 |
| inventory | `idx_inventory_reserved_order` | reserved_for_order_id | B-tree | 011 |
| inventory | `idx_inventory_reserved_operation` | reserved_for_operation_id | B-tree | 011 |
| batch_quantity_adjustments | `idx_batch_adjustments_batch_id` | batch_id | B-tree | 024 |
| batch_quantity_adjustments | `idx_batch_adjustments_type` | adjustment_type | B-tree | 024 |
| batch_quantity_adjustments | `idx_batch_adjustments_date` | adjusted_on | B-tree | 024 |
| equipment | `idx_equipment_maintenance` | maintenance_start (WHERE IS NOT NULL) | Partial B-tree | 013 |
| equipment | `idx_equipment_hold` | hold_start (WHERE IS NOT NULL) | Partial B-tree | 013 |
| equipment | `idx_equipment_category` | equipment_category | B-tree | 041 |
| confirmation_equipment | `idx_conf_equip_confirmation` | confirmation_id | B-tree | 011 |
| confirmation_equipment | `idx_conf_equip_equipment` | equipment_id | B-tree | 011 |
| confirmation_operators | `idx_conf_ops_confirmation` | confirmation_id | B-tree | 011 |
| confirmation_operators | `idx_conf_ops_operator` | operator_id | B-tree | 011 |
| customers | `idx_customers_code` | customer_code | B-tree | 014 |
| customers | `idx_customers_name` | customer_name | B-tree | 014 |
| customers | `idx_customers_status` | status | B-tree | 014 |
| materials | `idx_materials_code` | material_code | B-tree | 015 |
| materials | `idx_materials_name` | material_name | B-tree | 015 |
| materials | `idx_materials_type` | material_type | B-tree | 015 |
| materials | `idx_materials_status` | status | B-tree | 015 |
| products | `idx_products_sku` | sku | B-tree | 015 |
| products | `idx_products_name` | product_name | B-tree | 015 |
| products | `idx_products_category` | product_category | B-tree | 015 |
| products | `idx_products_status` | status | B-tree | 015 |
| products | `idx_products_default_process` | default_process_id | B-tree | 037 |
| routing_steps | `idx_routing_steps_op_template` | operation_template_id | B-tree | 040 |
| departments | `idx_departments_code` | department_code | B-tree | 021 |
| departments | `idx_departments_status` | status | B-tree | 021 |
| shifts | `idx_shifts_code` | shift_code | B-tree | 021 |
| shifts | `idx_shifts_status` | status | B-tree | 021 |
| locations | `idx_locations_code` | location_code | B-tree | 021 |
| locations | `idx_locations_type` | location_type | B-tree | 021 |
| locations | `idx_locations_parent` | parent_location_id | B-tree | 021 |
| locations | `idx_locations_status` | status | B-tree | 021 |
| material_groups | `idx_material_groups_code` | group_code | B-tree | 021 |
| material_groups | `idx_material_groups_parent` | parent_group_id | B-tree | 021 |
| material_groups | `idx_material_groups_status` | status | B-tree | 021 |
| product_categories | `idx_product_categories_code` | category_code | B-tree | 021 |
| product_categories | `idx_product_categories_parent` | parent_category_id | B-tree | 021 |
| product_categories | `idx_product_categories_status` | status | B-tree | 021 |
| product_groups | `idx_product_groups_code` | group_code | B-tree | 021 |
| product_groups | `idx_product_groups_category` | category_id | B-tree | 021 |
| product_groups | `idx_product_groups_status` | status | B-tree | 021 |
| operation_types | `idx_operation_types_code` | type_code | B-tree | 021 |
| operation_types | `idx_operation_types_status` | status | B-tree | 021 |
| attribute_definitions | `idx_attr_def_code` | attribute_code | B-tree | 022 |
| attribute_definitions | `idx_attr_def_entity` | entity_type | B-tree | 022 |
| attribute_definitions | `idx_attr_def_status` | status | B-tree | 022 |
| material_attributes | `idx_mat_attr_material` | material_id | B-tree | 022 |
| material_attributes | `idx_mat_attr_attribute` | attribute_id | B-tree | 022 |
| product_attributes | `idx_prod_attr_product` | product_id | B-tree | 022 |
| product_attributes | `idx_prod_attr_attribute` | attribute_id | B-tree | 022 |
| batch_attributes | `idx_batch_attr_batch` | batch_id | B-tree | 022 |
| batch_attributes | `idx_batch_attr_attribute` | attribute_id | B-tree | 022 |
| equipment_attributes | `idx_equip_attr_equipment` | equipment_id | B-tree | 022 |
| equipment_attributes | `idx_equip_attr_attribute` | attribute_id | B-tree | 022 |
| inventory_attributes | `idx_inv_attr_inventory` | inventory_id | B-tree | 022 |
| inventory_attributes | `idx_inv_attr_attribute` | attribute_id | B-tree | 022 |
| batch_number_config | `idx_batch_config_operation` | operation_type | B-tree | 009 |
| batch_number_config | `idx_batch_config_product` | product_sku | B-tree | 009 |
| batch_number_config | `idx_batch_config_priority` | priority | B-tree | 009 |
| batch_number_config | `idx_batch_config_material` | material_id | B-tree | 029 |
| batch_number_sequence | `idx_batch_seq_key` | sequence_key | B-tree | 009 |
| batch_size_config | `idx_batch_size_config_material` | material_id | B-tree | 026 |
| batch_size_config | `idx_batch_size_config_operation` | operation_type | B-tree | 026 |
| batch_size_config | `idx_batch_size_config_product` | product_sku | B-tree | 026 |
| batch_size_config | `idx_batch_size_config_active` | is_active | B-tree | 026 |
| quantity_type_config | `idx_qty_config_material` | material_code | B-tree | 018 |
| quantity_type_config | `idx_qty_config_operation` | operation_type | B-tree | 018 |
| quantity_type_config | `idx_qty_config_status` | status | B-tree | 018 |
| hold_records | `idx_hold_entity` | entity_type, entity_id | Composite B-tree | 001 |
| audit_trail | `idx_audit_entity` | entity_type, entity_id | Composite B-tree | 001 |
| database_reset_log | `idx_reset_log_timestamp` | reset_timestamp DESC | B-tree | 033 |
| database_reset_log | `idx_reset_log_environment` | environment | B-tree | 033 |

---

## 17. Unique Constraints Summary

| Table | Constraint/Column | Patch |
|-------|------------------|-------|
| users | `email` | 001 |
| orders | `order_number` | 001 |
| batches | `batch_number` | 001 |
| equipment | `equipment_code` | 001 |
| operators | `operator_code` | 001 |
| delay_reasons | `reason_code` | 001 |
| hold_reasons | `reason_code` | 001 |
| customers | `customer_code` | 014 |
| materials | `material_code` | 015 |
| products | `sku` | 015 |
| processes | `process_code` | 025 (originally template_code) |
| batch_number_config | `config_name` | 009 |
| batch_number_sequence | `(config_id, sequence_key)` | 009 |
| unit_of_measure | `unit_code` | 007 |
| unit_conversion | `(from_unit_code, to_unit_code)` | 007 |
| inventory_form_config | `form_code` | 008 |
| quantity_type_config | `config_name` | 018 |
| equipment_category_config | `equipment_category` | 006/042 |
| departments | `department_code` | 021 |
| shifts | `shift_code` | 021 |
| locations | `location_code` | 021 |
| material_groups | `group_code` | 021 |
| product_categories | `category_code` | 021 |
| product_groups | `group_code` | 021 |
| operation_types | `type_code` | 021 |
| attribute_definitions | `attribute_code` | 022 |
| material_attributes | `(material_id, attribute_id)` | 022 |
| product_attributes | `(product_id, attribute_id)` | 022 |
| batch_attributes | `(batch_id, attribute_id)` | 022 |
| equipment_attributes | `(equipment_id, attribute_id)` | 022 |
| inventory_attributes | `(inventory_id, attribute_id)` | 022 |
| operation_parameter_templates | `(operation_type, config_id)` | 023 |
| database_patches | `patch_number` | PatchService |

---

## 18. Check Constraints Summary

| Table | Constraint Name | Allowed Values | Patch |
|-------|----------------|----------------|-------|
| orders | `chk_order_status` | CREATED, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD | 001 |
| order_line_items | `chk_line_status` | CREATED, READY, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED, ON_HOLD | 047 |
| bill_of_material | `chk_bom_status` | ACTIVE, INACTIVE, DRAFT, OBSOLETE, ON_HOLD | 016 |
| processes | `chk_process_template_status` | DRAFT, ACTIVE, INACTIVE, SUPERSEDED | 025 |
| processes | `chk_process_usage_decision` | NULL, PENDING, ACCEPT, REJECT | 031 |
| operations | `chk_operation_status` | NOT_STARTED, READY, IN_PROGRESS, PARTIALLY_CONFIRMED, CONFIRMED, BLOCKED, ON_HOLD | 001 |
| operation_templates | `chk_operation_template_status` | ACTIVE, INACTIVE | 040 |
| operation_templates | `chk_operation_template_qty_type` | DISCRETE, BATCH, CONTINUOUS | 040 |
| production_confirmation | `chk_confirm_status` | CONFIRMED, PARTIALLY_CONFIRMED, REJECTED, PENDING_REVIEW | 012 |
| produced_outputs | `chk_output_type` | GOOD, SCRAP, REWORK, BYPRODUCT | 023 |
| operation_parameter_templates | `chk_op_param_template_status` | ACTIVE, INACTIVE | 023 |
| batches | `chk_batch_status` | AVAILABLE, CONSUMED, PRODUCED, ON_HOLD, BLOCKED, SCRAPPED, QUALITY_PENDING | 010 |
| batches | `chk_batch_created_via` | PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT | 038 |
| inventory | `chk_inventory_type` | RM, IM, FG, WIP | 001 |
| inventory | `chk_inventory_state` | AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD | 001 |
| inventory_movement | `chk_movement_type` | CONSUME, PRODUCE, HOLD, RELEASE, SCRAP, RECEIVE, TRANSFER, ADJUST | 039 |
| inventory_movement | `chk_movement_status` | EXECUTED, PENDING, ON_HOLD | 001 |
| batch_relations | `chk_relation_type` | SPLIT, MERGE, CONSUME | 047 |
| batch_relations | `chk_relation_status` | ACTIVE, CLOSED | 001 |
| batch_order_allocation | `chk_allocation_status` | ALLOCATED, RELEASED | 001 |
| batch_quantity_adjustments | `chk_adjustment_type` | CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY, SYSTEM | 024 |
| equipment | `chk_equipment_type` | BATCH, CONTINUOUS | 001 |
| equipment | `chk_equipment_status` | AVAILABLE, IN_USE, MAINTENANCE, ON_HOLD, UNAVAILABLE | 013 |
| equipment | `chk_equipment_category` | MELTING, REFINING, CASTING, HOT_ROLLING, COLD_ROLLING, ANNEALING, PICKLING, BAR_ROLLING, COATING, WIRE_ROLLING, FINISHING, INSPECTION, PACKAGING, HEAT_TREATMENT, GENERAL | 041 |
| operation_equipment_usage | `chk_equip_usage_status` | LOGGED, CONFIRMED | 001 |
| routing | `chk_routing_type` | SEQUENTIAL, PARALLEL | 001 |
| routing | `chk_routing_status` | DRAFT, ACTIVE, INACTIVE, ON_HOLD | 025 |
| routing_steps | `chk_routing_step_status` | ACTIVE, INACTIVE | 040 |
| hold_records | `chk_hold_entity_type` | OPERATION, PROCESS, ORDER_LINE, INVENTORY, BATCH, EQUIPMENT | 019 |
| hold_records | `chk_hold_status` | ACTIVE, RELEASED | 001 |
| customers | `chk_customer_status` | ACTIVE, INACTIVE | 014 |
| materials | `chk_material_type` | RM, IM, FG, WIP | 015 |
| materials | `chk_material_status` | ACTIVE, INACTIVE, OBSOLETE | 015 |
| products | `chk_product_status` | ACTIVE, INACTIVE, DISCONTINUED | 015 |
| departments | `chk_department_status` | ACTIVE, INACTIVE | 021 |
| shifts | `chk_shift_status` | ACTIVE, INACTIVE | 021 |
| locations | `chk_location_type` | WAREHOUSE, PLANT, ZONE, RACK, BIN, STAGING | 021 |
| locations | `chk_location_status` | ACTIVE, INACTIVE, MAINTENANCE | 021 |
| material_groups | `chk_material_group_status` | ACTIVE, INACTIVE | 021 |
| product_categories | `chk_product_category_status` | ACTIVE, INACTIVE | 021 |
| product_groups | `chk_product_group_status` | ACTIVE, INACTIVE | 021 |
| operation_types | `chk_operation_type_status` | ACTIVE, INACTIVE | 021 |
| attribute_definitions | `chk_attr_data_type` | STRING, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME, LIST | 022 |
| attribute_definitions | `chk_attr_entity_type` | MATERIAL, PRODUCT, BATCH, EQUIPMENT, OPERATION, INVENTORY | 022 |
| attribute_definitions | `chk_attr_status` | ACTIVE, INACTIVE | 022 |
| batch_size_config | `chk_batch_size_range` | max_batch_size >= min_batch_size | 026 |
| batch_size_config | `chk_preferred_in_range` | preferred between min and max | 026 |

---

## 19. Patch History

| Patch | File Name | Description | Type |
|-------|-----------|-------------|------|
| 001 | `001_initial_schema.sql` | Create all base tables (users, orders, order_line_items, bill_of_material, processes, routing, routing_steps, operations, equipment, operators, operation_equipment_usage, production_confirmation, batches, inventory, inventory_movement, batch_relations, batch_order_allocation, hold_records, audit_trail, delay_reasons, hold_reasons, process_parameters_config) + indexes | DDL |
| 002 | `002_seed_data.sql` | Insert admin user, delay/hold reasons, equipment, operators, BOM, orders, processes, operations, batches, inventory, process parameters, batch relations | DML |
| 003 | `003_equipment_operator_fields.sql` | Add equipment_ids (BIGINT[]) and operator_ids (BIGINT[]) to production_confirmation with GIN indexes | DDL |
| 004 | `004_additional_seed_data.sql` | Add Steel Sheet/Bar BOMs, processes/operations for Orders 2 and 3, additional batches and inventory, more process parameter configs, batch relations | DML |
| 005 | `005_add_notes_field.sql` | Add notes VARCHAR(1000) to production_confirmation | DDL |
| 006 | `006_equipment_type_config.sql` | Create equipment_type_config table with capacity limits, operating parameters, maintenance rules | DDL+DML |
| 007 | `007_unit_conversion_config.sql` | Create unit_of_measure and unit_conversion tables with standard units and conversion factors | DDL+DML |
| 008 | `008_inventory_form_config.sql` | Create inventory_form_config table, add inventory_form/temperature/moisture/density columns to inventory | DDL+DML |
| 009 | `009_batch_number_config.sql` | Create batch_number_config and batch_number_sequence tables for configurable batch number generation | DDL+DML |
| 010 | `010_batch_quality_fields.sql` | Add quality approval/rejection columns to batches, update batch status constraint to include QUALITY_PENDING, BLOCKED, SCRAPPED | DDL |
| 011 | `011_operations_inventory_fields.sql` | Add target_qty/confirmed_qty/block fields to operations, block/scrap/reservation fields to inventory, create confirmation_equipment and confirmation_operators junction tables | DDL |
| 012 | `012_production_confirmation_rejection_fields.sql` | Add rejection_reason/rejected_by/rejected_on to production_confirmation, add PENDING_REVIEW status | DDL |
| 013 | `013_equipment_maintenance_hold_fields.sql` | Add maintenance and hold tracking columns to equipment, add UNAVAILABLE status | DDL |
| 014 | `014_customers_table.sql` | Create customers table with indexes and sample data | DDL+DML |
| 015 | `015_materials_products_tables.sql` | Create materials and products tables with indexes, constraints, and sample data | DDL+DML |
| 016 | `016_fix_bom_status_constraint.sql` | Fix BOM status constraint to include INACTIVE and DRAFT | DDL |
| 017 | `017_config_tables_audit_columns.sql` | Add audit columns (created_by, updated_on, updated_by) to hold_reasons, delay_reasons, process_parameters_config, batch_number_config | DDL |
| 018 | `018_quantity_type_config.sql` | Create quantity_type_config table for configuring quantity precision per context | DDL+DML |
| 019 | `019_order_line_hold_record_constraints.sql` | Add READY status to order_line_items, add EQUIPMENT to hold_records entity types | DDL |
| 020 | `020_orders_customer_fk.sql` | Add customer_ref_id BIGINT FK to orders referencing customers, migrate data | DDL+DML |
| 021 | `021_master_lookup_tables.sql` | Create departments, shifts, locations, material_groups, product_categories, product_groups, operation_types with seed data | DDL+DML |
| 022 | `022_property_attribute_tables.sql` | Create attribute_definitions, material_attributes, product_attributes, batch_attributes, equipment_attributes, inventory_attributes tables with seed data | DDL+DML |
| 023 | `023_process_parameter_values.sql` | Create process_parameter_values, operation_parameter_templates, consumed_materials, produced_outputs tables | DDL |
| 024 | `024_batch_management_compliance.sql` | Create batch_quantity_adjustments table, add soft delete to batch_relations, add created_via to batches | DDL+DML |
| 025 | `025_routing_process_template_schema.sql` | Create process_templates table, add batch behavior and operation template fields to routing_steps, update routing status constraint | DDL+DML |
| 026 | `026_batch_size_config.sql` | Create batch_size_config table for multi-batch creation limits | DDL+DML |
| 027 | `027_batch_supplier_fields.sql` | Add supplier_batch_number, supplier_id, received_date, receipt_notes to batches | DDL |
| 028 | `028_spec_alignment_rename.sql` | Rename processes -> process_instances, process_templates -> processes; update FKs and sequences for spec alignment | DDL+DML |
| 029 | `029_batch_number_material_id.sql` | Add material_id column to batch_number_config for material-level configuration | DDL+DML |
| 030 | `030_remove_process_instances.sql` | Add order_line_id to operations, migrate data from process_instances, drop process_instances table | DDL+DML |
| 031 | `031_process_usage_decision.sql` | Add usage_decision column to processes table with check constraint | DDL+DML |
| 032 | `032_cleanup_orphan_operations.sql` | Set process_id to NULL for operations referencing non-existent processes | DML |
| 033 | `033_database_reset_support.sql` | Create database_reset_log table for tracking database resets | DDL |
| 034 | `034_demo_seed_master_data.sql` | Seed comprehensive master data: 10 customers, 55+ materials, 25 products, 15 equipment, 12 operators, hold/delay reasons | DML |
| 035 | `035_demo_seed_templates.sql` | Seed process parameter configs and batch number configs for demo | DML |
| 036 | `036_demo_seed_transactions.sql` | Placeholder patch for demo transactional data (no-op) | -- |
| 037 | `037_product_process_mapping.sql` | Add default_process_id to products, add process_id to order_line_items, link products to processes | DDL+DML |
| 038 | `038_batch_created_via_receipt.sql` | Add RECEIPT to batches created_via constraint | DDL+DML |
| 039 | `039_inventory_movement_receive.sql` | Add RECEIVE, TRANSFER, ADJUST to inventory_movement type constraint | DDL |
| 040 | `040_operation_template_separation.sql` | Create operation_templates table, add operation_template_id FK to routing_steps and operations, fix routing_steps status constraint | DDL+DML |
| 041 | `041_add_equipment_category.sql` | Add equipment_category column to equipment table with check constraint | DDL |
| 042 | `042_rename_equipment_type_to_category_config.sql` | Rename equipment_type_config to equipment_category_config, rename equipment_type column to equipment_category | DDL |
| 043 | `043_update_equipment_category_config_values.sql` | Update equipment_category_config values to match new category naming, add missing categories | DML |
| 044 | `044_add_operation_timestamps.sql` | Add start_time and end_time columns to operations table with indexes | DDL+DML |
| 045 | `045_extend_audit_action_column.sql` | Extend audit_trail.action from VARCHAR(20) to VARCHAR(30) | DDL |
| 046 | `046_fix_jsonb_to_text.sql` | Convert process_parameters and rm_consumed from JSONB to TEXT on production_confirmation | DDL |
| 047 | `047_fix_check_constraints.sql` | Add CANCELLED to order_line_items status, add CONSUME to batch_relations type | DDL |
| 048 | `048_add_order_delivery_date_notes.sql` | Add delivery_date and notes columns to orders table | DDL |
| 049 | `049_add_batch_expiry_date.sql` | Add expiry_date column to batches table with index | DDL |
| 050 | `050_add_order_priority.sql` | Add priority INTEGER column to orders table with index | DDL+DML |
| 051 | `051_consumption_reversal_support.sql` | Add reversed_by/reversed_on/reversal_reason to production_confirmation, add REVERSED to confirmation status constraint, add REVERSAL to inventory_movement type constraint, add confirmation_id to batches with index, add REVERSED to batch_relations status constraint | DDL |

---

## 20. Dropped / Superseded Tables

| Table | Created In | Dropped In | Reason |
|-------|-----------|------------|--------|
| `process_instances` | Patch 028 (renamed from `processes`) | Patch 030 | Spec alignment: operations now link directly to order_line_items and design-time processes. The runtime process_instances concept was removed. |

---

## 21. Notes

### Schema Management
- All schema changes are applied via SQL patches in `backend/src/main/resources/patches/`
- Patches are numbered 001-051 and executed sequentially on startup
- The `database_patches` table is created by `PatchService.java` (not a patch)
- In test mode, the schema is dropped and rebuilt (DROP SCHEMA public CASCADE; CREATE SCHEMA public)
- Patches use `IF NOT EXISTS` / `IF EXISTS` for idempotency

### Common Column Patterns
- **Audit columns**: Most tables have `created_on`, `created_by`, `updated_on`, `updated_by`
- **Soft delete**: Status-based (`INACTIVE`, `CANCELLED`, `OBSOLETE`) rather than physical deletion
- **Polymorphic FKs**: `hold_records` and `audit_trail` use `entity_type` + `entity_id` for flexible entity references

### Data Types
- **Primary keys**: `BIGSERIAL` (most tables) or `SERIAL` (newer tables from patches 014+)
- **Monetary/quantity values**: `DECIMAL(15,4)` or `NUMERIC(15,4)`
- **Status fields**: `VARCHAR(20)` or `VARCHAR(30)` with CHECK constraints
- **Timestamps**: `TIMESTAMP` (without time zone)
- **Arrays**: `BIGINT[]` (only on production_confirmation.equipment_ids/operator_ids)
