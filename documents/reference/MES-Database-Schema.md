# MES Database Schema Reference

**Generated:** February 2026
**Source:** SQL Patch Analysis (50 patches)
**Database:** PostgreSQL 14+
**Schema Management:** Automatic SQL patch system (tracked in `database_patches` table)

---

## Table of Contents

1. [Patch History](#patch-history)
2. [Tables](#tables)
   - [System Tables](#system-tables)
   - [Authentication](#authentication)
   - [Master Data](#master-data)
   - [Order Management](#order-management)
   - [Production Design-Time (Templates)](#production-design-time-templates)
   - [Production Runtime](#production-runtime)
   - [Inventory & Batches](#inventory--batches)
   - [Hold Management](#hold-management)
   - [Audit & Tracking](#audit--tracking)
   - [Configuration Tables](#configuration-tables)
   - [Lookup Tables](#lookup-tables)
   - [Attribute System](#attribute-system)
3. [Relationships (Foreign Keys)](#relationships-foreign-keys)
4. [Sequences](#sequences)
5. [Indexes](#indexes)
6. [Key Constraints](#key-constraints)
7. [Demo Data Structure](#demo-data-structure)

---

## Patch History

| # | Filename | Description |
|---|----------|-------------|
| 001 | `001_initial_schema.sql` | Create all base tables: users, orders, order_line_items, bill_of_material, processes, routing, routing_steps, operations, equipment, operators, operation_equipment_usage, production_confirmation, batches, inventory, inventory_movement, batch_relations, batch_order_allocation, hold_records, audit_trail, delay_reasons, hold_reasons, process_parameters_config. Creates all initial indexes. |
| 002 | `002_seed_data.sql` | Insert initial seed data: admin user, delay reasons, hold reasons, equipment, operators, BOM for STEEL-COIL-001, sample orders, processes, operations, batches, inventory, process parameter configs. |
| 003 | `003_equipment_operator_fields.sql` | Add `equipment_ids` (BIGINT[]) and `operator_ids` (BIGINT[]) array columns to production_confirmation. GIN indexes for array lookups. |
| 004 | `004_additional_seed_data.sql` | Add BOM for STEEL-SHEET-001 and STEEL-BAR-001. Add processes/operations for orders 2 and 3. Additional batches, inventory, process parameter configs, batch relations for genealogy. |
| 005 | `005_add_notes_field.sql` | Add `notes` VARCHAR(1000) column to production_confirmation. |
| 006 | `006_equipment_type_config.sql` | Create `equipment_type_config` table (GAP-002) with capacity limits, temperature/pressure ranges, maintenance rules, validation flags. Seed 8 equipment types. |
| 007 | `007_unit_conversion_config.sql` | Create `unit_of_measure` and `unit_conversion` tables (GAP-006). Seed standard units (weight, length, volume, pieces, area) and conversion factors. |
| 008 | `008_inventory_form_config.sql` | Create `inventory_form_config` table (GAP-008) with physical property tracking and storage requirements. Add `inventory_form`, `current_temperature`, `moisture_content`, `density` columns to inventory. Seed 8 form types. |
| 009 | `009_batch_number_config.sql` | Create `batch_number_config` and `batch_number_sequence` tables (GAP-005). Configurable batch number generation with prefix, date format, sequence reset options. Seed default configurations. |
| 010 | `010_batch_quality_fields.sql` | Add quality approval columns to batches: `approved_by`, `approved_on`, `rejection_reason`, `rejected_by`, `rejected_on`. Update batch status constraint to include BLOCKED, SCRAPPED, QUALITY_PENDING. Partial index for QUALITY_PENDING. |
| 011 | `011_operations_inventory_fields.sql` | Add `target_qty`, `confirmed_qty`, block tracking fields to operations. Add block, scrap, reservation tracking fields to inventory. Create `confirmation_equipment` and `confirmation_operators` junction tables. |
| 012 | `012_production_confirmation_rejection_fields.sql` | Add `rejection_reason`, `rejected_by`, `rejected_on` to production_confirmation. Update status constraint to include PENDING_REVIEW. |
| 013 | `013_equipment_maintenance_hold_fields.sql` | Add maintenance tracking columns (`maintenance_reason`, `maintenance_start`, `maintenance_by`, `expected_maintenance_end`) and hold tracking columns (`hold_reason`, `hold_start`, `held_by`) to equipment. Update status constraint to include UNAVAILABLE. |
| 014 | `014_customers_table.sql` | Create `customers` table with contact info, address, tax_id. Seed 5 sample customers. |
| 015 | `015_materials_products_tables.sql` | Create `materials` table (material master with types RM/IM/FG/WIP) and `products` table (finished goods catalog with SKU). Seed 10 materials and 10 products. |
| 016 | `016_fix_bom_status_constraint.sql` | Update BOM status constraint to include INACTIVE and DRAFT. |
| 017 | `017_config_tables_audit_columns.sql` | Add `created_by`, `updated_on`, `updated_by` audit columns to hold_reasons, delay_reasons, process_parameters_config, batch_number_config. |
| 018 | `018_quantity_type_config.sql` | Create `quantity_type_config` table for configuring quantity precision (INTEGER vs DECIMAL), rounding rules per material/operation/equipment context. Seed 4 default configs. |
| 019 | `019_order_line_hold_record_constraints.sql` | Add READY to order_line_items status constraint. Add EQUIPMENT to hold_records entity_type constraint. |
| 020 | `020_orders_customer_fk.sql` | Add `customer_ref_id` (BIGINT FK) to orders referencing customers table. Migrate existing data from varchar customer_id to proper FK. |
| 021 | `021_master_lookup_tables.sql` | Create master lookup tables: `departments`, `shifts`, `locations`, `material_groups`, `product_categories`, `product_groups`, `operation_types`. Seed default values for all. |
| 022 | `022_property_attribute_tables.sql` | Create dynamic attribute system: `attribute_definitions`, `material_attributes`, `product_attributes`, `batch_attributes`, `equipment_attributes`, `inventory_attributes`. Seed attribute definitions for all entity types. |
| 023 | `023_process_parameter_values.sql` | Create `process_parameter_values`, `operation_parameter_templates`, `consumed_materials`, `produced_outputs` tables for detailed production tracking. |
| 024 | `024_batch_management_compliance.sql` | Create `batch_quantity_adjustments` table. Add soft delete to batch_relations. Add `created_via` column to batches with constraint (PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM). |
| 025 | `025_routing_process_template_schema.sql` | Create `process_templates` table. Add batch behavior flags and operation template fields to routing_steps. Add DRAFT to routing status. Link routing to process_templates. |
| 026 | `026_batch_size_config.sql` | Create `batch_size_config` table for configurable batch sizes per material/operation/equipment/product. Seed defaults for MELTING, CASTING, ROLLING, ANNEALING, FINISHING. |
| 027 | `027_batch_supplier_fields.sql` | Add `supplier_batch_number`, `supplier_id`, `received_date`, `receipt_notes` to batches for RM goods receipt tracking. |
| 028 | `028_spec_alignment_rename.sql` | Major rename: `processes` -> `process_instances` (runtime), `process_templates` -> `processes` (design-time). Rename columns accordingly. Update FK references in operations and routing. |
| 029 | `029_batch_number_material_id.sql` | Add `material_id` column to batch_number_config for material-level configuration. Add RM_RECEIPT batch number config. |
| 030 | `030_remove_process_instances.sql` | Remove process_instances concept. Add `order_line_id` to operations for runtime tracking. Migrate data from process_instances. Drop process_instances table. Operations now link to both processes (design-time) and order_line_items (runtime). |
| 031 | `031_process_usage_decision.sql` | Add `usage_decision` column to processes table (lost during rename in patch 028). Constraint: PENDING, ACCEPT, REJECT. |
| 032 | `032_cleanup_orphan_operations.sql` | Set process_id to NULL for operations referencing non-existent processes after migration. |
| 033 | `033_database_reset_support.sql` | Create `database_reset_log` table for tracking database resets. Reset functions handled in Spring application code. |
| 034 | `034_demo_seed_master_data.sql` | Comprehensive demo seeding: 10 customers, 55+ materials (25 RM, 15 IM, 15 FG), 25 products, 15 equipment, 12 operators, hold/delay reasons. |
| 035 | `035_demo_seed_templates.sql` | Seed process parameter configs for MELTING, CASTING, HOT_ROLLING, COLD_ROLLING, ANNEALING. Seed batch number configs. |
| 036 | `036_demo_seed_transactions.sql` | Placeholder patch for future demo transactional data. No operations. |
| 037 | `037_product_process_mapping.sql` | Add `default_process_id` FK to products table. Add `process_id` FK to order_line_items. Map existing products to processes. |
| 038 | `038_batch_created_via_receipt.sql` | Add RECEIPT to batch `created_via` constraint for goods receipt workflow. |
| 039 | `039_inventory_movement_receive.sql` | Add RECEIVE, TRANSFER, ADJUST to inventory_movement `movement_type` constraint. |
| 040 | `040_operation_template_separation.sql` | Create `operation_templates` table (design-time). Add `operation_template_id` FK to routing_steps and operations. Fix routing_steps status constraint to ACTIVE/INACTIVE. Seed 10 operation templates. |
| 041 | `041_add_equipment_category.sql` | Add `equipment_category` column to equipment (MELTING, CASTING, HOT_ROLLING, etc.). Separates processing mode (equipment_type) from functional category. |
| 042 | `042_rename_equipment_type_to_category_config.sql` | Rename `equipment_type_config` -> `equipment_category_config`. Rename column `equipment_type` -> `equipment_category`. |
| 043 | `043_update_equipment_category_config_values.sql` | Update equipment_category_config values to match new category names. Add missing categories: REFINING, COLD_ROLLING, ANNEALING, PICKLING, BAR_ROLLING, COATING, WIRE_ROLLING, FINISHING, PACKAGING. |
| 044 | `044_add_operation_timestamps.sql` | Add `start_time` and `end_time` TIMESTAMP columns to operations table. Backfill existing data. |
| 045 | `045_extend_audit_action_column.sql` | Extend audit_trail `action` column from VARCHAR(20) to VARCHAR(30). |
| 046 | `046_fix_jsonb_to_text.sql` | Convert `process_parameters` and `rm_consumed` from JSONB to TEXT on production_confirmation to fix insert issues. |
| 047 | `047_fix_check_constraints.sql` | Add CANCELLED to order_line_items status constraint. Add CONSUME to batch_relations relation_type constraint. |
| 048 | `048_add_order_delivery_date_notes.sql` | Add `delivery_date` (DATE) and `notes` (VARCHAR(1000)) columns to orders table. |
| 049 | `049_add_batch_expiry_date.sql` | Add `expiry_date` (DATE) column to batches table with index for expiry queries. |
| 050 | `050_add_order_priority.sql` | Add `priority` (INTEGER, default 3) column to orders table. Priority values: 1=CRITICAL, 2=HIGH, 3=MEDIUM, 4=LOW, 5=BACKLOG. |

---

## Tables

### System Tables

#### `database_patches`
Tracks applied SQL patches to prevent re-running. Created by JPA/Hibernate auto-DDL from `DatabasePatch` entity.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | BIGINT | PK, IDENTITY | Auto-generated ID |
| `patch_number` | INTEGER | NOT NULL, UNIQUE | Patch number (001-050) |
| `patch_name` | VARCHAR(255) | NOT NULL | Human-readable patch name |
| `file_name` | VARCHAR(255) | NOT NULL | SQL file name |
| `applied_on` | TIMESTAMP | NOT NULL | When patch was applied |
| `applied_by` | VARCHAR(100) | | Who applied the patch |
| `execution_time_ms` | BIGINT | | Execution time in milliseconds |
| `checksum` | VARCHAR(64) | | File checksum for change detection |
| `success` | BOOLEAN | NOT NULL | Whether patch succeeded |
| `error_message` | TEXT | | Error details if failed |

**Created by:** JPA auto-DDL (DatabasePatch entity)

#### `database_reset_log`
Tracks database reset operations for audit purposes.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `reset_id` | SERIAL | PK | Auto-generated ID |
| `reset_type` | VARCHAR(50) | NOT NULL | Type of reset performed |
| `reset_by` | VARCHAR(100) | NOT NULL | Who performed the reset |
| `reset_timestamp` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When reset occurred |
| `environment` | VARCHAR(50) | NOT NULL | Environment (test, demo, etc.) |
| `tables_affected` | TEXT | | List of affected tables |
| `rows_deleted` | INTEGER | DEFAULT 0 | Number of rows deleted |

**Created by:** Patch 033

---

### Authentication

#### `users`
User accounts for JWT authentication.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `user_id` | BIGSERIAL | PK | Auto-generated ID |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Login email address |
| `password_hash` | VARCHAR(255) | NOT NULL | BCrypt hashed password |
| `name` | VARCHAR(255) | NOT NULL | Display name |
| `employee_id` | VARCHAR(50) | | Employee identifier |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Account status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001

---

### Master Data

#### `customers`
Customer master data for orders.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `customer_id` | SERIAL | PK | Auto-generated ID |
| `customer_code` | VARCHAR(50) | NOT NULL, UNIQUE | Customer code (e.g., CUST-001) |
| `customer_name` | VARCHAR(200) | NOT NULL | Company name |
| `contact_person` | VARCHAR(100) | | Primary contact |
| `email` | VARCHAR(100) | | Contact email |
| `phone` | VARCHAR(50) | | Contact phone |
| `address` | VARCHAR(500) | | Street address |
| `city` | VARCHAR(100) | | City |
| `country` | VARCHAR(100) | | Country |
| `tax_id` | VARCHAR(50) | | Tax identification number |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Customer status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 014

#### `materials`
Material master data with types and stock levels.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `material_id` | SERIAL | PK | Auto-generated ID |
| `material_code` | VARCHAR(50) | NOT NULL, UNIQUE | Material code (e.g., MAT-RM-001) |
| `material_name` | VARCHAR(200) | NOT NULL | Material name |
| `description` | VARCHAR(500) | | Description |
| `material_type` | VARCHAR(20) | NOT NULL, CHECK (RM, IM, FG, WIP) | Material type |
| `base_unit` | VARCHAR(20) | NOT NULL, DEFAULT 'T' | Base unit of measure |
| `material_group` | VARCHAR(50) | | Material group |
| `sku` | VARCHAR(50) | | SKU reference |
| `standard_cost` | NUMERIC(15,4) | | Standard cost per unit |
| `cost_currency` | VARCHAR(3) | DEFAULT 'USD' | Cost currency |
| `min_stock_level` | NUMERIC(15,4) | | Minimum stock threshold |
| `max_stock_level` | NUMERIC(15,4) | | Maximum stock threshold |
| `reorder_point` | NUMERIC(15,4) | | Reorder trigger level |
| `lead_time_days` | INTEGER | | Procurement lead time |
| `shelf_life_days` | INTEGER | | Material shelf life |
| `storage_conditions` | VARCHAR(255) | | Storage requirements |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE, OBSOLETE) | Material status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 015

#### `products`
Finished goods product catalog with SKU and pricing.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `product_id` | SERIAL | PK | Auto-generated ID |
| `sku` | VARCHAR(50) | NOT NULL, UNIQUE | Stock keeping unit |
| `product_name` | VARCHAR(200) | NOT NULL | Product name |
| `description` | VARCHAR(500) | | Description |
| `product_category` | VARCHAR(100) | | Product category |
| `product_group` | VARCHAR(100) | | Product group |
| `base_unit` | VARCHAR(20) | NOT NULL, DEFAULT 'T' | Base unit of measure |
| `weight_per_unit` | NUMERIC(15,4) | | Weight per unit |
| `weight_unit` | VARCHAR(10) | | Weight unit |
| `standard_price` | NUMERIC(15,4) | | Standard selling price |
| `price_currency` | VARCHAR(3) | DEFAULT 'USD' | Price currency |
| `min_order_qty` | NUMERIC(15,4) | | Minimum order quantity |
| `lead_time_days` | INTEGER | | Production lead time |
| `material_id` | BIGINT | | Reference to material |
| `default_process_id` | BIGINT | FK -> processes(process_id) | Default production process |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE, DISCONTINUED) | Product status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 015, Modified by: Patch 037 (added default_process_id)

#### `equipment`
Equipment/machine master data.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `equipment_id` | BIGSERIAL | PK | Auto-generated ID |
| `equipment_code` | VARCHAR(50) | NOT NULL, UNIQUE | Equipment code (e.g., FUR-001) |
| `name` | VARCHAR(255) | NOT NULL | Equipment name |
| `equipment_type` | VARCHAR(30) | NOT NULL, DEFAULT 'BATCH', CHECK (BATCH, CONTINUOUS) | Processing mode |
| `equipment_category` | VARCHAR(50) | CHECK (MELTING, REFINING, CASTING, HOT_ROLLING, COLD_ROLLING, ANNEALING, PICKLING, BAR_ROLLING, COATING, WIRE_ROLLING, FINISHING, INSPECTION, PACKAGING, HEAT_TREATMENT, GENERAL) | Functional category |
| `capacity` | DECIMAL(15,4) | | Equipment capacity |
| `capacity_unit` | VARCHAR(20) | | Capacity unit (T, T/hr, etc.) |
| `location` | VARCHAR(100) | | Physical location |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'AVAILABLE', CHECK (AVAILABLE, IN_USE, MAINTENANCE, ON_HOLD, UNAVAILABLE) | Current status |
| `maintenance_reason` | VARCHAR(500) | | Reason for maintenance |
| `maintenance_start` | TIMESTAMP | | When maintenance began |
| `maintenance_by` | VARCHAR(100) | | Who initiated maintenance |
| `expected_maintenance_end` | TIMESTAMP | | Expected completion |
| `hold_reason` | VARCHAR(500) | | Reason for hold |
| `hold_start` | TIMESTAMP | | When hold was applied |
| `held_by` | VARCHAR(100) | | Who applied hold |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 013 (maintenance/hold fields), 041 (equipment_category)

#### `operators`
Production operator/personnel master data.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `operator_id` | BIGSERIAL | PK | Auto-generated ID |
| `operator_code` | VARCHAR(50) | NOT NULL, UNIQUE | Operator code (e.g., OP-001) |
| `name` | VARCHAR(255) | NOT NULL | Operator name |
| `department` | VARCHAR(100) | | Department |
| `shift` | VARCHAR(20) | | Shift assignment |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Operator status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001

---

### Order Management

#### `orders`
Customer orders.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `order_id` | BIGSERIAL | PK | Auto-generated ID |
| `order_number` | VARCHAR(50) | UNIQUE | Order number (e.g., ORD-000001) |
| `customer_id` | VARCHAR(100) | | Legacy customer ID (varchar) |
| `customer_name` | VARCHAR(255) | | Customer name (denormalized) |
| `customer_ref_id` | BIGINT | FK -> customers(customer_id) | Proper customer FK |
| `order_date` | DATE | NOT NULL | Order date |
| `delivery_date` | DATE | | Requested delivery date |
| `notes` | VARCHAR(1000) | | Order notes |
| `priority` | INTEGER | DEFAULT 3 | Priority (1=CRITICAL to 5=BACKLOG) |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'CREATED', CHECK (CREATED, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD) | Order status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 020 (customer_ref_id), 048 (delivery_date, notes), 050 (priority)

#### `order_line_items`
Products within orders.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `order_line_id` | BIGSERIAL | PK | Auto-generated ID |
| `order_id` | BIGINT | NOT NULL, FK -> orders(order_id) | Parent order |
| `product_sku` | VARCHAR(100) | NOT NULL | Product SKU |
| `product_name` | VARCHAR(255) | | Product name (denormalized) |
| `quantity` | DECIMAL(15,4) | NOT NULL | Ordered quantity |
| `unit` | VARCHAR(20) | NOT NULL, DEFAULT 'T' | Unit of measure |
| `delivery_date` | DATE | | Line item delivery date |
| `process_id` | BIGINT | FK -> processes(process_id) | Cached process reference |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'CREATED', CHECK (CREATED, READY, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED, ON_HOLD) | Line item status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 019 (READY status), 037 (process_id), 047 (CANCELLED status)

#### `bill_of_material`
Hierarchical Bill of Material with multi-level tree structure.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `bom_id` | BIGSERIAL | PK | Auto-generated ID |
| `product_sku` | VARCHAR(100) | NOT NULL | Product this BOM belongs to |
| `bom_version` | VARCHAR(20) | DEFAULT 'V1' | BOM version |
| `material_id` | VARCHAR(100) | NOT NULL | Material identifier |
| `material_name` | VARCHAR(255) | | Material name (denormalized) |
| `quantity_required` | DECIMAL(15,4) | NOT NULL | Required quantity |
| `unit` | VARCHAR(20) | NOT NULL, DEFAULT 'T' | Unit of measure |
| `yield_loss_ratio` | DECIMAL(10,4) | DEFAULT 1.0 | Yield loss factor (1.0 = no loss) |
| `sequence_level` | INTEGER | NOT NULL, DEFAULT 1 | BOM hierarchy level |
| `parent_bom_id` | BIGINT | FK -> bill_of_material(bom_id) | Parent node (self-referencing) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE, DRAFT, OBSOLETE, ON_HOLD) | BOM status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patch 016 (INACTIVE, DRAFT status)

---

### Production Design-Time (Templates)

#### `processes`
Design-time process definitions. Originally `process_templates`, renamed in patch 028.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `process_id` | BIGSERIAL | PK | Auto-generated ID (was process_template_id) |
| `process_name` | VARCHAR(100) | NOT NULL | Process name (was template_name) |
| `process_code` | VARCHAR(50) | UNIQUE | Process code (was template_code) |
| `description` | VARCHAR(500) | | Description |
| `product_sku` | VARCHAR(50) | | Associated product SKU |
| `status` | VARCHAR(20) | DEFAULT 'DRAFT', CHECK (DRAFT, ACTIVE, INACTIVE, SUPERSEDED) | Template status |
| `version` | VARCHAR(20) | DEFAULT 'V1' | Version |
| `effective_from` | DATE | | Effective start date |
| `effective_to` | DATE | | Effective end date |
| `usage_decision` | VARCHAR(20) | CHECK (PENDING, ACCEPT, REJECT) or NULL | Quality usage decision |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 025 (as process_templates), Renamed by: Patch 028, Modified by: Patch 031 (usage_decision)

#### `routing`
Routing definitions linking processes to ordered operation sequences.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `routing_id` | BIGSERIAL | PK | Auto-generated ID |
| `process_id` | BIGINT | NOT NULL, FK -> processes(process_id) | Parent process |
| `routing_name` | VARCHAR(100) | NOT NULL | Routing name |
| `routing_type` | VARCHAR(20) | NOT NULL, DEFAULT 'SEQUENTIAL', CHECK (SEQUENTIAL, PARALLEL) | Routing type |
| `process_id_design` | BIGINT | | Design-time process reference |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (DRAFT, ACTIVE, INACTIVE, ON_HOLD) | Routing status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 025 (DRAFT status, process_template_id), 028 (remove process_template_id, add process_id_design)

#### `routing_steps`
Steps within a routing, defining the sequence of operations.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `routing_step_id` | BIGSERIAL | PK | Auto-generated ID |
| `routing_id` | BIGINT | NOT NULL, FK -> routing(routing_id) | Parent routing |
| `operation_id` | BIGINT | | Legacy operation reference (set to NULL by patch 040) |
| `operation_template_id` | BIGINT | FK -> operation_templates(operation_template_id) | Design-time operation template |
| `sequence_number` | INTEGER | NOT NULL | Step sequence |
| `is_parallel` | BOOLEAN | DEFAULT FALSE | Whether step runs in parallel |
| `mandatory_flag` | BOOLEAN | DEFAULT TRUE | Whether step is mandatory |
| `produces_output_batch` | BOOLEAN | DEFAULT TRUE | Whether step produces output |
| `allows_split` | BOOLEAN | DEFAULT FALSE | Whether batch splitting allowed |
| `allows_merge` | BOOLEAN | DEFAULT FALSE | Whether batch merging allowed |
| `operation_name` | VARCHAR(100) | | Operation name template |
| `operation_type` | VARCHAR(50) | | Operation type |
| `operation_code` | VARCHAR(50) | | Operation code |
| `target_qty` | DECIMAL(15,4) | | Target quantity |
| `description` | VARCHAR(500) | | Step description |
| `estimated_duration_minutes` | INTEGER | | Estimated duration |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Step status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 025 (batch behavior, operation template fields), 040 (operation_template_id, status fix)

#### `operation_templates`
Design-time operation template definitions.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `operation_template_id` | BIGSERIAL | PK | Auto-generated ID |
| `operation_name` | VARCHAR(100) | NOT NULL | Template operation name |
| `operation_code` | VARCHAR(50) | | Template operation code |
| `operation_type` | VARCHAR(50) | NOT NULL | Operation type (FURNACE, CASTER, ROLLING, etc.) |
| `quantity_type` | VARCHAR(20) | DEFAULT 'DISCRETE', CHECK (DISCRETE, BATCH, CONTINUOUS) | Quantity handling type |
| `default_equipment_type` | VARCHAR(50) | | Default equipment type for this operation |
| `description` | VARCHAR(500) | | Description |
| `estimated_duration_minutes` | INTEGER | | Estimated duration |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Template status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 040

---

### Production Runtime

#### `operations`
Runtime operation instances. Links to both design-time processes and runtime order_line_items.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `operation_id` | BIGSERIAL | PK | Auto-generated ID |
| `process_id` | BIGINT | FK -> processes(process_id), NULLABLE | Design-time process reference |
| `order_line_id` | BIGINT | FK -> order_line_items(order_line_id) | Runtime order line reference |
| `routing_step_id` | BIGINT | FK -> routing_steps(routing_step_id) | Routing step source |
| `operation_template_id` | BIGINT | FK -> operation_templates(operation_template_id) | Source template |
| `operation_name` | VARCHAR(100) | NOT NULL | Operation name |
| `operation_code` | VARCHAR(50) | | Operation code |
| `operation_type` | VARCHAR(50) | | Operation type (FURNACE, CASTER, ROLLING, SLITTING, FINISHING) |
| `sequence_number` | INTEGER | NOT NULL, DEFAULT 1 | Sequence within process |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'NOT_STARTED', CHECK (NOT_STARTED, READY, IN_PROGRESS, PARTIALLY_CONFIRMED, CONFIRMED, BLOCKED, ON_HOLD) | Operation status |
| `target_qty` | DECIMAL(15,4) | | Target quantity |
| `confirmed_qty` | DECIMAL(15,4) | | Confirmed quantity so far |
| `start_time` | TIMESTAMP | | Execution start time |
| `end_time` | TIMESTAMP | | Execution end time |
| `block_reason` | VARCHAR(500) | | Block reason |
| `blocked_by` | VARCHAR(100) | | Who blocked |
| `blocked_on` | TIMESTAMP | | When blocked |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 011 (target_qty, confirmed_qty, block fields), 028/030 (process_id rename, order_line_id), 040 (operation_template_id), 044 (start_time, end_time)

#### `production_confirmation`
Records of production confirmations against operations.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `confirmation_id` | BIGSERIAL | PK | Auto-generated ID |
| `operation_id` | BIGINT | NOT NULL, FK -> operations(operation_id) | Confirmed operation |
| `produced_qty` | DECIMAL(15,4) | NOT NULL | Quantity produced |
| `scrap_qty` | DECIMAL(15,4) | DEFAULT 0 | Scrap quantity |
| `start_time` | TIMESTAMP | NOT NULL | Production start time |
| `end_time` | TIMESTAMP | NOT NULL | Production end time |
| `delay_minutes` | INTEGER | DEFAULT 0 | Delay in minutes |
| `delay_reason` | VARCHAR(100) | | Delay reason |
| `process_parameters` | TEXT | | Process parameters (JSON string, was JSONB) |
| `rm_consumed` | TEXT | | Raw materials consumed (JSON string, was JSONB) |
| `notes` | VARCHAR(1000) | | Free-form notes |
| `equipment_ids` | BIGINT[] | | Equipment used (PostgreSQL array) |
| `operator_ids` | BIGINT[] | | Operators involved (PostgreSQL array) |
| `rejection_reason` | VARCHAR(500) | | Rejection reason |
| `rejected_by` | VARCHAR(100) | | Who rejected |
| `rejected_on` | TIMESTAMP | | When rejected |
| `status` | VARCHAR(30) | NOT NULL, DEFAULT 'CONFIRMED', CHECK (CONFIRMED, PARTIALLY_CONFIRMED, REJECTED, PENDING_REVIEW) | Confirmation status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 003 (equipment_ids, operator_ids), 005 (notes), 012 (rejection fields, PENDING_REVIEW), 046 (JSONB -> TEXT)

#### `confirmation_equipment`
Junction table: production_confirmation <-> equipment (alternative to array column for H2 compatibility).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | BIGSERIAL | PK | Auto-generated ID |
| `confirmation_id` | BIGINT | NOT NULL, FK -> production_confirmation(confirmation_id) | Confirmation reference |
| `equipment_id` | BIGINT | NOT NULL, FK -> equipment(equipment_id) | Equipment reference |

**Created by:** Patch 011

#### `confirmation_operators`
Junction table: production_confirmation <-> operators (alternative to array column for H2 compatibility).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | BIGSERIAL | PK | Auto-generated ID |
| `confirmation_id` | BIGINT | NOT NULL, FK -> production_confirmation(confirmation_id) | Confirmation reference |
| `operator_id` | BIGINT | NOT NULL, FK -> operators(operator_id) | Operator reference |

**Created by:** Patch 011

#### `operation_equipment_usage`
Tracks equipment usage per operation with timestamps.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `usage_id` | BIGSERIAL | PK | Auto-generated ID |
| `operation_id` | BIGINT | NOT NULL, FK -> operations(operation_id) | Operation |
| `equipment_id` | BIGINT | NOT NULL, FK -> equipment(equipment_id) | Equipment used |
| `start_time` | TIMESTAMP | | Usage start time |
| `end_time` | TIMESTAMP | | Usage end time |
| `operator_id` | BIGINT | FK -> operators(operator_id) | Operator |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'LOGGED', CHECK (LOGGED, CONFIRMED) | Usage status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 001

#### `consumed_materials`
Detailed material consumption records per production confirmation.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `consumption_id` | SERIAL | PK | Auto-generated ID |
| `confirmation_id` | BIGINT | NOT NULL, FK -> production_confirmation(confirmation_id) | Production confirmation |
| `inventory_id` | BIGINT | FK -> inventory(inventory_id) | Source inventory |
| `batch_id` | BIGINT | FK -> batches(batch_id) | Source batch |
| `material_id` | VARCHAR(100) | NOT NULL | Material identifier |
| `material_name` | VARCHAR(255) | | Material name |
| `quantity_consumed` | DECIMAL(15,4) | NOT NULL | Quantity consumed |
| `unit` | VARCHAR(20) | NOT NULL | Unit of measure |
| `consumed_by` | VARCHAR(100) | | Who consumed |
| `consumed_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When consumed |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 023

#### `produced_outputs`
Detailed production output records per confirmation.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `output_id` | SERIAL | PK | Auto-generated ID |
| `confirmation_id` | BIGINT | NOT NULL, FK -> production_confirmation(confirmation_id) | Production confirmation |
| `batch_id` | BIGINT | FK -> batches(batch_id) | Output batch |
| `inventory_id` | BIGINT | FK -> inventory(inventory_id) | Output inventory |
| `material_id` | VARCHAR(100) | NOT NULL | Material identifier |
| `material_name` | VARCHAR(255) | | Material name |
| `quantity_produced` | DECIMAL(15,4) | NOT NULL | Quantity produced |
| `unit` | VARCHAR(20) | NOT NULL | Unit of measure |
| `is_primary_output` | BOOLEAN | DEFAULT TRUE | Whether primary or secondary |
| `output_type` | VARCHAR(30) | DEFAULT 'GOOD', CHECK (GOOD, SCRAP, REWORK, BYPRODUCT) | Output type |
| `produced_by` | VARCHAR(100) | | Who produced |
| `produced_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When produced |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 023

#### `process_parameter_values`
Actual parameter values captured during production confirmation.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `value_id` | SERIAL | PK | Auto-generated ID |
| `confirmation_id` | BIGINT | NOT NULL, FK -> production_confirmation(confirmation_id) | Production confirmation |
| `config_id` | BIGINT | FK -> process_parameters_config(config_id) | Parameter config reference |
| `parameter_name` | VARCHAR(100) | NOT NULL | Parameter name |
| `parameter_value` | DECIMAL(15,4) | | Numeric value |
| `string_value` | VARCHAR(500) | | String value |
| `unit` | VARCHAR(20) | | Unit of measure |
| `min_limit` | DECIMAL(15,4) | | Configured minimum |
| `max_limit` | DECIMAL(15,4) | | Configured maximum |
| `is_within_spec` | BOOLEAN | DEFAULT TRUE | Within specification |
| `deviation_reason` | VARCHAR(500) | | Reason if out of spec |
| `recorded_by` | VARCHAR(100) | | Recorder |
| `recorded_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Recording time |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 023

---

### Inventory & Batches

#### `batches`
Trackable material batch units.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `batch_id` | BIGSERIAL | PK | Auto-generated ID |
| `batch_number` | VARCHAR(100) | NOT NULL, UNIQUE | Unique batch number |
| `material_id` | VARCHAR(100) | NOT NULL | Material identifier |
| `material_name` | VARCHAR(255) | | Material name (denormalized) |
| `quantity` | DECIMAL(15,4) | NOT NULL | Current quantity |
| `unit` | VARCHAR(20) | NOT NULL, DEFAULT 'T' | Unit of measure |
| `generated_at_operation_id` | BIGINT | FK -> operations(operation_id) | Operation that produced this batch |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'AVAILABLE', CHECK (AVAILABLE, CONSUMED, PRODUCED, ON_HOLD, BLOCKED, SCRAPPED, QUALITY_PENDING) | Batch status |
| `approved_by` | VARCHAR(100) | | Quality approver |
| `approved_on` | TIMESTAMP | | Approval time |
| `rejection_reason` | VARCHAR(500) | | Rejection reason |
| `rejected_by` | VARCHAR(100) | | Who rejected |
| `rejected_on` | TIMESTAMP | | Rejection time |
| `created_via` | VARCHAR(50) | DEFAULT 'MANUAL', CHECK (PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT) | How batch was created |
| `supplier_batch_number` | VARCHAR(100) | | External supplier batch number |
| `supplier_id` | VARCHAR(50) | | Supplier identifier |
| `received_date` | DATE | | Material receipt date |
| `receipt_notes` | VARCHAR(500) | | Goods receipt notes |
| `expiry_date` | DATE | | Expiry date for perishable materials |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 010 (quality fields), 024 (created_via), 027 (supplier fields), 038 (RECEIPT), 049 (expiry_date)

#### `inventory`
Material inventory records with state tracking.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `inventory_id` | BIGSERIAL | PK | Auto-generated ID |
| `material_id` | VARCHAR(100) | NOT NULL | Material identifier |
| `material_name` | VARCHAR(255) | | Material name (denormalized) |
| `inventory_type` | VARCHAR(20) | NOT NULL, CHECK (RM, IM, FG, WIP) | Inventory type |
| `inventory_form` | VARCHAR(20) | DEFAULT 'SOLID' | Physical form (SOLID, MOLTEN, POWDER, etc.) |
| `state` | VARCHAR(20) | NOT NULL, DEFAULT 'AVAILABLE', CHECK (AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD) | Current state |
| `quantity` | DECIMAL(15,4) | NOT NULL | Current quantity |
| `unit` | VARCHAR(20) | NOT NULL, DEFAULT 'T' | Unit of measure |
| `batch_id` | BIGINT | FK -> batches(batch_id) | Associated batch |
| `location` | VARCHAR(100) | | Storage location |
| `current_temperature` | DECIMAL(10,2) | | Current temperature |
| `moisture_content` | DECIMAL(5,2) | | Moisture content |
| `density` | DECIMAL(10,4) | | Material density |
| `block_reason` | VARCHAR(500) | | Block reason |
| `blocked_by` | VARCHAR(100) | | Who blocked |
| `blocked_on` | TIMESTAMP | | When blocked |
| `scrap_reason` | VARCHAR(500) | | Scrap reason |
| `scrapped_by` | VARCHAR(100) | | Who scrapped |
| `scrapped_on` | TIMESTAMP | | When scrapped |
| `reserved_for_order_id` | BIGINT | | Reserved for order |
| `reserved_for_operation_id` | BIGINT | | Reserved for operation |
| `reserved_by` | VARCHAR(100) | | Who reserved |
| `reserved_on` | TIMESTAMP | | When reserved |
| `reserved_qty` | DECIMAL(15,4) | | Reserved quantity |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patches 008 (form, temperature, moisture, density), 011 (block, scrap, reservation fields)

#### `inventory_movement`
Tracks all inventory state changes.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `movement_id` | BIGSERIAL | PK | Auto-generated ID |
| `operation_id` | BIGINT | FK -> operations(operation_id) | Related operation |
| `inventory_id` | BIGINT | NOT NULL, FK -> inventory(inventory_id) | Affected inventory |
| `movement_type` | VARCHAR(20) | NOT NULL, CHECK (CONSUME, PRODUCE, HOLD, RELEASE, SCRAP, RECEIVE, TRANSFER, ADJUST) | Type of movement |
| `quantity` | DECIMAL(15,4) | NOT NULL | Movement quantity |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When movement occurred |
| `reason` | VARCHAR(255) | | Movement reason |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'EXECUTED', CHECK (EXECUTED, PENDING, ON_HOLD) | Movement status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 001, Modified by: Patch 039 (RECEIVE, TRANSFER, ADJUST movement types)

#### `batch_relations`
Parent-child batch relationships for genealogy/traceability.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `relation_id` | BIGSERIAL | PK | Auto-generated ID |
| `parent_batch_id` | BIGINT | NOT NULL, FK -> batches(batch_id) | Parent (input) batch |
| `child_batch_id` | BIGINT | NOT NULL, FK -> batches(batch_id) | Child (output) batch |
| `operation_id` | BIGINT | FK -> operations(operation_id) | Operation that created relation |
| `relation_type` | VARCHAR(20) | NOT NULL, DEFAULT 'MERGE', CHECK (SPLIT, MERGE, CONSUME) | Relation type |
| `quantity_consumed` | DECIMAL(15,4) | NOT NULL | Quantity used |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, CLOSED) | Relation status |
| `deleted_at` | TIMESTAMP | | Soft delete timestamp |
| `deleted_by` | VARCHAR(100) | | Who soft-deleted |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 001, Modified by: Patches 024 (soft delete), 047 (CONSUME relation type)

#### `batch_order_allocation`
Allocation of batches to order line items.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `allocation_id` | BIGSERIAL | PK | Auto-generated ID |
| `batch_id` | BIGINT | NOT NULL, FK -> batches(batch_id) | Allocated batch |
| `order_line_id` | BIGINT | NOT NULL, FK -> order_line_items(order_line_id) | Target order line |
| `allocated_qty` | DECIMAL(15,4) | NOT NULL | Allocated quantity |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | Allocation time |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ALLOCATED', CHECK (ALLOCATED, RELEASED) | Allocation status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 001

#### `batch_quantity_adjustments`
Tracks batch quantity corrections with full audit trail.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `adjustment_id` | SERIAL | PK | Auto-generated ID |
| `batch_id` | BIGINT | NOT NULL, FK -> batches(batch_id) | Adjusted batch |
| `old_quantity` | DECIMAL(15,4) | NOT NULL | Previous quantity |
| `new_quantity` | DECIMAL(15,4) | NOT NULL | New quantity |
| `adjustment_reason` | VARCHAR(500) | NOT NULL | Reason for adjustment |
| `adjustment_type` | VARCHAR(50) | NOT NULL, CHECK (CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY, SYSTEM) | Adjustment type |
| `adjusted_by` | VARCHAR(100) | NOT NULL | Who adjusted |
| `adjusted_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When adjusted |

**Created by:** Patch 024

---

### Hold Management

#### `hold_records`
Tracks holds applied to various entities.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `hold_id` | BIGSERIAL | PK | Auto-generated ID |
| `entity_type` | VARCHAR(30) | NOT NULL, CHECK (OPERATION, PROCESS, ORDER_LINE, INVENTORY, BATCH, EQUIPMENT) | Type of entity held |
| `entity_id` | BIGINT | NOT NULL | ID of held entity |
| `reason` | VARCHAR(100) | NOT NULL | Hold reason |
| `comments` | TEXT | | Additional comments |
| `applied_by` | VARCHAR(100) | NOT NULL | Who applied hold |
| `applied_on` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When applied |
| `released_by` | VARCHAR(100) | | Who released |
| `released_on` | TIMESTAMP | | When released |
| `release_comments` | TEXT | | Release comments |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, RELEASED) | Hold status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Created by:** Patch 001, Modified by: Patch 019 (EQUIPMENT entity type)

---

### Audit & Tracking

#### `audit_trail`
Comprehensive audit trail for all entity changes.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `audit_id` | BIGSERIAL | PK | Auto-generated ID |
| `entity_type` | VARCHAR(50) | NOT NULL | Entity type (ORDER, BATCH, INVENTORY, etc.) |
| `entity_id` | BIGINT | NOT NULL | Entity ID |
| `field_name` | VARCHAR(100) | | Changed field name |
| `old_value` | TEXT | | Previous value |
| `new_value` | TEXT | | New value |
| `action` | VARCHAR(30) | NOT NULL | Action (CREATE, UPDATE, DELETE, STATUS_CHANGE, etc.) |
| `changed_by` | VARCHAR(100) | NOT NULL | Who made the change |
| `timestamp` | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP | When changed |

**Created by:** Patch 001, Modified by: Patch 045 (action VARCHAR(20) -> VARCHAR(30))

---

### Configuration Tables

#### `equipment_category_config`
Configuration for equipment functional categories. Originally `equipment_type_config`, renamed in patch 042.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `config_id` | BIGSERIAL | PK | Auto-generated ID |
| `equipment_category` | VARCHAR(50) | NOT NULL, UNIQUE | Equipment functional category (was equipment_type) |
| `display_name` | VARCHAR(100) | NOT NULL | Display name |
| `description` | VARCHAR(500) | | Description |
| `min_capacity` | DECIMAL(15,4) | | Minimum capacity |
| `max_capacity` | DECIMAL(15,4) | | Maximum capacity |
| `default_capacity_unit` | VARCHAR(20) | | Default capacity unit |
| `min_temperature` | DECIMAL(10,2) | | Minimum operating temperature |
| `max_temperature` | DECIMAL(10,2) | | Maximum operating temperature |
| `min_pressure` | DECIMAL(10,2) | | Minimum operating pressure |
| `max_pressure` | DECIMAL(10,2) | | Maximum operating pressure |
| `maintenance_interval_hours` | INT | | Maintenance interval |
| `max_continuous_operation_hours` | INT | | Max continuous runtime |
| `requires_operator` | BOOLEAN | DEFAULT TRUE | Requires operator |
| `requires_calibration` | BOOLEAN | DEFAULT FALSE | Requires calibration |
| `allows_parallel_operation` | BOOLEAN | DEFAULT TRUE | Allows parallel operations |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `updated_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Created by:** Patch 006 (as equipment_type_config), Renamed by: Patch 042, Modified by: Patch 043 (category values)

#### `process_parameters_config`
Configuration for process parameter validation ranges.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `config_id` | BIGSERIAL | PK | Auto-generated ID |
| `operation_type` | VARCHAR(50) | NOT NULL | Operation type (ROLLING, FURNACE, CASTER, etc.) |
| `product_sku` | VARCHAR(100) | | Product-specific config (NULL = all products) |
| `parameter_name` | VARCHAR(100) | NOT NULL | Parameter name (Temperature, Pressure, etc.) |
| `parameter_type` | VARCHAR(30) | NOT NULL, DEFAULT 'DECIMAL' | Data type |
| `unit` | VARCHAR(20) | | Unit of measure |
| `min_value` | DECIMAL(15,4) | | Minimum allowed value |
| `max_value` | DECIMAL(15,4) | | Maximum allowed value |
| `default_value` | DECIMAL(15,4) | | Default value |
| `is_required` | BOOLEAN | DEFAULT FALSE | Whether required |
| `display_order` | INTEGER | DEFAULT 1 | Display ordering |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Config status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patch 017 (audit columns)

#### `operation_parameter_templates`
Links operation types to required process parameter configurations.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `template_id` | SERIAL | PK | Auto-generated ID |
| `operation_type` | VARCHAR(50) | NOT NULL | Operation type |
| `config_id` | BIGINT | NOT NULL, FK -> process_parameters_config(config_id) | Parameter config |
| `is_mandatory` | BOOLEAN | DEFAULT FALSE | Whether mandatory |
| `display_order` | INTEGER | DEFAULT 1 | Display order |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Unique constraint:** (operation_type, config_id)

**Created by:** Patch 023

#### `batch_number_config`
Configurable batch number generation patterns.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `config_id` | BIGSERIAL | PK | Auto-generated ID |
| `config_name` | VARCHAR(100) | NOT NULL, UNIQUE | Configuration name |
| `operation_type` | VARCHAR(50) | | Operation type (NULL = default) |
| `product_sku` | VARCHAR(100) | | Product SKU (NULL = all products) |
| `material_id` | VARCHAR(100) | | Material (NULL = all materials) |
| `prefix` | VARCHAR(50) | NOT NULL, DEFAULT 'BATCH' | Batch number prefix |
| `include_operation_code` | BOOLEAN | DEFAULT TRUE | Include operation code |
| `operation_code_length` | INTEGER | DEFAULT 2 | Operation code length |
| `separator` | VARCHAR(5) | NOT NULL, DEFAULT '-' | Separator character |
| `date_format` | VARCHAR(20) | DEFAULT 'yyyyMMdd' | Date format pattern |
| `include_date` | BOOLEAN | DEFAULT TRUE | Include date in number |
| `sequence_length` | INTEGER | NOT NULL, DEFAULT 3 | Sequence digit length |
| `sequence_reset` | VARCHAR(20) | DEFAULT 'DAILY' | Reset frequency (DAILY, MONTHLY, YEARLY, NEVER) |
| `priority` | INTEGER | DEFAULT 100 | Matching priority (lower = higher) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Config status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 009, Modified by: Patches 017 (audit columns), 029 (material_id)

#### `batch_number_sequence`
Tracks current sequence values for batch number generation.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `sequence_id` | BIGSERIAL | PK | Auto-generated ID |
| `config_id` | BIGINT | NOT NULL, FK -> batch_number_config(config_id) | Config reference |
| `sequence_key` | VARCHAR(200) | NOT NULL | Unique sequence key (prefix-date combo) |
| `current_value` | INTEGER | NOT NULL, DEFAULT 0 | Current sequence value |
| `last_reset_on` | TIMESTAMP | | Last sequence reset time |
| `updated_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Last update time |

**Unique constraint:** (config_id, sequence_key)

**Created by:** Patch 009

#### `batch_size_config`
Configures batch size limits for multi-batch production.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `config_id` | SERIAL | PK | Auto-generated ID |
| `material_id` | VARCHAR(50) | | Material-specific (NULL = generic) |
| `operation_type` | VARCHAR(50) | | Operation type-specific |
| `equipment_type` | VARCHAR(50) | | Equipment type-specific |
| `product_sku` | VARCHAR(50) | | Product-specific |
| `min_batch_size` | DECIMAL(15,4) | DEFAULT 0 | Minimum batch size |
| `max_batch_size` | DECIMAL(15,4) | NOT NULL | Maximum batch size (triggers multi-batch) |
| `preferred_batch_size` | DECIMAL(15,4) | | Preferred batch size |
| `unit` | VARCHAR(20) | DEFAULT 'T' | Unit of measure |
| `allow_partial_batch` | BOOLEAN | DEFAULT TRUE | Allow partial batches |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| `priority` | INTEGER | DEFAULT 0 | Matching priority |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Check constraints:** max_batch_size >= min_batch_size; preferred_batch_size within min/max range

**Created by:** Patch 026

#### `quantity_type_config`
Configures quantity precision and rounding per context.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `config_id` | BIGSERIAL | PK | Auto-generated ID |
| `config_name` | VARCHAR(100) | NOT NULL, UNIQUE | Configuration name |
| `material_code` | VARCHAR(50) | | Material-specific (NULL = all) |
| `operation_type` | VARCHAR(50) | | Operation type-specific (NULL = all) |
| `equipment_type` | VARCHAR(50) | | Equipment type-specific (NULL = all) |
| `quantity_type` | VARCHAR(20) | NOT NULL, DEFAULT 'DECIMAL' | INTEGER or DECIMAL |
| `decimal_precision` | INTEGER | NOT NULL, DEFAULT 4 | Decimal places |
| `rounding_rule` | VARCHAR(20) | NOT NULL, DEFAULT 'HALF_UP' | Rounding (HALF_UP, HALF_DOWN, CEILING, FLOOR, NONE) |
| `min_quantity` | DECIMAL(15,4) | DEFAULT 0 | Minimum quantity |
| `max_quantity` | DECIMAL(15,4) | | Maximum quantity |
| `unit` | VARCHAR(20) | | Unit of measure |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Config status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 018

#### `unit_of_measure`
Standard units of measure.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `unit_id` | BIGSERIAL | PK | Auto-generated ID |
| `unit_code` | VARCHAR(20) | NOT NULL, UNIQUE | Unit code (KG, TONS, M, etc.) |
| `unit_name` | VARCHAR(50) | NOT NULL | Unit name |
| `unit_type` | VARCHAR(20) | NOT NULL | Type (WEIGHT, LENGTH, VOLUME, PIECES, AREA) |
| `decimal_precision` | INT | DEFAULT 2 | Decimal precision |
| `is_base_unit` | BOOLEAN | DEFAULT FALSE | Whether base unit for type |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Created by:** Patch 007

#### `unit_conversion`
Unit conversion factors.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `conversion_id` | BIGSERIAL | PK | Auto-generated ID |
| `from_unit_code` | VARCHAR(20) | NOT NULL | Source unit code |
| `to_unit_code` | VARCHAR(20) | NOT NULL | Target unit code |
| `conversion_factor` | DECIMAL(20,10) | NOT NULL | Multiplication factor |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Unique constraint:** (from_unit_code, to_unit_code)

**Created by:** Patch 007

#### `inventory_form_config`
Physical form configuration for inventory tracking.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `form_id` | BIGSERIAL | PK | Auto-generated ID |
| `form_code` | VARCHAR(20) | NOT NULL, UNIQUE | Form code (SOLID, MOLTEN, POWDER, etc.) |
| `form_name` | VARCHAR(50) | NOT NULL | Form name |
| `description` | VARCHAR(200) | | Description |
| `tracks_temperature` | BOOLEAN | DEFAULT FALSE | Track temperature |
| `tracks_moisture` | BOOLEAN | DEFAULT FALSE | Track moisture |
| `tracks_density` | BOOLEAN | DEFAULT FALSE | Track density |
| `default_weight_unit` | VARCHAR(20) | DEFAULT 'KG' | Default weight unit |
| `default_volume_unit` | VARCHAR(20) | | Default volume unit |
| `requires_temperature_control` | BOOLEAN | DEFAULT FALSE | Requires temp control |
| `min_storage_temp` | DECIMAL(10,2) | | Minimum storage temp |
| `max_storage_temp` | DECIMAL(10,2) | | Maximum storage temp |
| `requires_humidity_control` | BOOLEAN | DEFAULT FALSE | Requires humidity control |
| `max_humidity_percent` | INT | | Maximum humidity |
| `requires_special_handling` | BOOLEAN | DEFAULT FALSE | Requires special handling |
| `handling_notes` | VARCHAR(500) | | Handling instructions |
| `shelf_life_days` | INT | | Shelf life |
| `is_active` | BOOLEAN | DEFAULT TRUE | Active flag |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |

**Created by:** Patch 008

---

### Lookup Tables

#### `delay_reasons`
Configurable delay reason codes.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `reason_id` | BIGSERIAL | PK | Auto-generated ID |
| `reason_code` | VARCHAR(50) | NOT NULL, UNIQUE | Reason code |
| `reason_description` | VARCHAR(255) | NOT NULL | Description |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patch 017 (audit columns)

#### `hold_reasons`
Configurable hold reason codes with entity type applicability.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `reason_id` | BIGSERIAL | PK | Auto-generated ID |
| `reason_code` | VARCHAR(50) | NOT NULL, UNIQUE | Reason code |
| `reason_description` | VARCHAR(255) | NOT NULL | Description |
| `applicable_to` | VARCHAR(100) | | Comma-separated entity types |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE' | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 001, Modified by: Patch 017 (audit columns)

#### `departments`
Department master data.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `department_id` | SERIAL | PK | Auto-generated ID |
| `department_code` | VARCHAR(50) | NOT NULL, UNIQUE | Department code |
| `department_name` | VARCHAR(100) | NOT NULL | Department name |
| `description` | VARCHAR(500) | | Description |
| `manager_name` | VARCHAR(100) | | Department manager |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 021

#### `shifts`
Work shift definitions.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `shift_id` | SERIAL | PK | Auto-generated ID |
| `shift_code` | VARCHAR(50) | NOT NULL, UNIQUE | Shift code |
| `shift_name` | VARCHAR(100) | NOT NULL | Shift name |
| `start_time` | TIME | | Shift start time |
| `end_time` | TIME | | Shift end time |
| `description` | VARCHAR(500) | | Description |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 021

#### `locations`
Warehouse and storage location hierarchy.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `location_id` | SERIAL | PK | Auto-generated ID |
| `location_code` | VARCHAR(50) | NOT NULL, UNIQUE | Location code |
| `location_name` | VARCHAR(100) | NOT NULL | Location name |
| `location_type` | VARCHAR(30) | NOT NULL, DEFAULT 'WAREHOUSE', CHECK (WAREHOUSE, PLANT, ZONE, RACK, BIN, STAGING) | Location type |
| `parent_location_id` | INTEGER | FK -> locations(location_id) | Parent location (self-referencing) |
| `address` | VARCHAR(500) | | Physical address |
| `capacity` | DECIMAL(15,4) | | Storage capacity |
| `capacity_unit` | VARCHAR(20) | | Capacity unit |
| `is_temperature_controlled` | BOOLEAN | DEFAULT FALSE | Temp controlled |
| `min_temperature` | DECIMAL(5,2) | | Minimum temperature |
| `max_temperature` | DECIMAL(5,2) | | Maximum temperature |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE, MAINTENANCE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 021

#### `material_groups`
Material categorization hierarchy.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `group_id` | SERIAL | PK | Auto-generated ID |
| `group_code` | VARCHAR(50) | NOT NULL, UNIQUE | Group code |
| `group_name` | VARCHAR(100) | NOT NULL | Group name |
| `description` | VARCHAR(500) | | Description |
| `parent_group_id` | INTEGER | FK -> material_groups(group_id) | Parent group (self-referencing) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 021

#### `product_categories`
Product categorization hierarchy.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `category_id` | SERIAL | PK | Auto-generated ID |
| `category_code` | VARCHAR(50) | NOT NULL, UNIQUE | Category code |
| `category_name` | VARCHAR(100) | NOT NULL | Category name |
| `description` | VARCHAR(500) | | Description |
| `parent_category_id` | INTEGER | FK -> product_categories(category_id) | Parent (self-referencing) |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 021

#### `product_groups`
Product grouping linked to categories.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `group_id` | SERIAL | PK | Auto-generated ID |
| `group_code` | VARCHAR(50) | NOT NULL, UNIQUE | Group code |
| `group_name` | VARCHAR(100) | NOT NULL | Group name |
| `description` | VARCHAR(500) | | Description |
| `category_id` | INTEGER | FK -> product_categories(category_id) | Parent category |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 021

#### `operation_types`
Operation type definitions.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `type_id` | SERIAL | PK | Auto-generated ID |
| `type_code` | VARCHAR(50) | NOT NULL, UNIQUE | Type code |
| `type_name` | VARCHAR(100) | NOT NULL | Type name |
| `description` | VARCHAR(500) | | Description |
| `default_duration_minutes` | INTEGER | | Default duration |
| `requires_equipment` | BOOLEAN | DEFAULT TRUE | Requires equipment |
| `requires_operator` | BOOLEAN | DEFAULT TRUE | Requires operator |
| `produces_output` | BOOLEAN | DEFAULT TRUE | Produces output material |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 021

---

### Attribute System

#### `attribute_definitions`
Defines available dynamic attributes for various entity types.

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `attribute_id` | SERIAL | PK | Auto-generated ID |
| `attribute_code` | VARCHAR(50) | NOT NULL, UNIQUE | Attribute code |
| `attribute_name` | VARCHAR(100) | NOT NULL | Display name |
| `description` | VARCHAR(500) | | Description |
| `data_type` | VARCHAR(30) | NOT NULL, DEFAULT 'STRING', CHECK (STRING, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME, LIST) | Value data type |
| `entity_type` | VARCHAR(50) | NOT NULL, CHECK (MATERIAL, PRODUCT, BATCH, EQUIPMENT, OPERATION, INVENTORY) | Which entity type |
| `unit` | VARCHAR(20) | | Unit of measure |
| `min_value` | DECIMAL(15,4) | | Minimum value for validation |
| `max_value` | DECIMAL(15,4) | | Maximum value for validation |
| `allowed_values` | TEXT | | Comma-separated allowed values (for LIST type) |
| `is_required` | BOOLEAN | DEFAULT FALSE | Whether required |
| `is_searchable` | BOOLEAN | DEFAULT TRUE | Whether searchable |
| `display_order` | INTEGER | DEFAULT 1 | Display ordering |
| `status` | VARCHAR(20) | NOT NULL, DEFAULT 'ACTIVE', CHECK (ACTIVE, INACTIVE) | Status |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 022

#### `material_attributes`
Dynamic attributes for materials. Unique per (material_id, attribute_id).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | SERIAL | PK | Auto-generated ID |
| `material_id` | BIGINT | NOT NULL, FK -> materials(material_id) | Material |
| `attribute_id` | INTEGER | NOT NULL, FK -> attribute_definitions(attribute_id) | Attribute definition |
| `string_value` | VARCHAR(500) | | String value |
| `numeric_value` | DECIMAL(15,4) | | Numeric value |
| `boolean_value` | BOOLEAN | | Boolean value |
| `date_value` | DATE | | Date value |
| `datetime_value` | TIMESTAMP | | Datetime value |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 022

#### `product_attributes`
Dynamic attributes for products. Unique per (product_id, attribute_id).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | SERIAL | PK | Auto-generated ID |
| `product_id` | BIGINT | NOT NULL, FK -> products(product_id) | Product |
| `attribute_id` | INTEGER | NOT NULL, FK -> attribute_definitions(attribute_id) | Attribute definition |
| `string_value` | VARCHAR(500) | | String value |
| `numeric_value` | DECIMAL(15,4) | | Numeric value |
| `boolean_value` | BOOLEAN | | Boolean value |
| `date_value` | DATE | | Date value |
| `datetime_value` | TIMESTAMP | | Datetime value |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 022

#### `batch_attributes`
Dynamic attributes for batches (quality data). Unique per (batch_id, attribute_id).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | SERIAL | PK | Auto-generated ID |
| `batch_id` | BIGINT | NOT NULL, FK -> batches(batch_id) | Batch |
| `attribute_id` | INTEGER | NOT NULL, FK -> attribute_definitions(attribute_id) | Attribute definition |
| `string_value` | VARCHAR(500) | | String value |
| `numeric_value` | DECIMAL(15,4) | | Numeric value |
| `boolean_value` | BOOLEAN | | Boolean value |
| `date_value` | DATE | | Date value |
| `datetime_value` | TIMESTAMP | | Datetime value |
| `recorded_by` | VARCHAR(100) | | Who recorded |
| `recorded_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When recorded |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 022

#### `equipment_attributes`
Dynamic attributes for equipment. Unique per (equipment_id, attribute_id).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | SERIAL | PK | Auto-generated ID |
| `equipment_id` | BIGINT | NOT NULL, FK -> equipment(equipment_id) | Equipment |
| `attribute_id` | INTEGER | NOT NULL, FK -> attribute_definitions(attribute_id) | Attribute definition |
| `string_value` | VARCHAR(500) | | String value |
| `numeric_value` | DECIMAL(15,4) | | Numeric value |
| `boolean_value` | BOOLEAN | | Boolean value |
| `date_value` | DATE | | Date value |
| `datetime_value` | TIMESTAMP | | Datetime value |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |
| `updated_on` | TIMESTAMP | | Last update time |
| `updated_by` | VARCHAR(100) | | Last updater |

**Created by:** Patch 022

#### `inventory_attributes`
Dynamic attributes for inventory. Unique per (inventory_id, attribute_id).

| Column | Type | Constraints | Description |
|--------|------|------------|-------------|
| `id` | SERIAL | PK | Auto-generated ID |
| `inventory_id` | BIGINT | NOT NULL, FK -> inventory(inventory_id) | Inventory |
| `attribute_id` | INTEGER | NOT NULL, FK -> attribute_definitions(attribute_id) | Attribute definition |
| `string_value` | VARCHAR(500) | | String value |
| `numeric_value` | DECIMAL(15,4) | | Numeric value |
| `boolean_value` | BOOLEAN | | Boolean value |
| `date_value` | DATE | | Date value |
| `datetime_value` | TIMESTAMP | | Datetime value |
| `recorded_by` | VARCHAR(100) | | Who recorded |
| `recorded_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | When recorded |
| `created_on` | TIMESTAMP | DEFAULT CURRENT_TIMESTAMP | Record creation time |
| `created_by` | VARCHAR(100) | | Creator |

**Created by:** Patch 022

---

## Relationships (Foreign Keys)

| From Table | Column | To Table | Column | Constraint Name |
|-----------|--------|----------|--------|----------------|
| `orders` | `customer_ref_id` | `customers` | `customer_id` | `fk_orders_customer` |
| `order_line_items` | `order_id` | `orders` | `order_id` | (inline FK) |
| `order_line_items` | `process_id` | `processes` | `process_id` | `fk_order_line_items_process` |
| `bill_of_material` | `parent_bom_id` | `bill_of_material` | `bom_id` | (self-referencing) |
| `routing` | `process_id` | `processes` | `process_id` | (inline FK) |
| `routing_steps` | `routing_id` | `routing` | `routing_id` | (inline FK) |
| `routing_steps` | `operation_template_id` | `operation_templates` | `operation_template_id` | `fk_routing_step_op_template` |
| `operations` | `process_id` | `processes` | `process_id` | (nullable) |
| `operations` | `order_line_id` | `order_line_items` | `order_line_id` | `fk_operation_order_line` |
| `operations` | `routing_step_id` | `routing_steps` | `routing_step_id` | (inline FK) |
| `operations` | `operation_template_id` | `operation_templates` | `operation_template_id` | `fk_operation_op_template` |
| `operation_equipment_usage` | `operation_id` | `operations` | `operation_id` | (inline FK) |
| `operation_equipment_usage` | `equipment_id` | `equipment` | `equipment_id` | (inline FK) |
| `operation_equipment_usage` | `operator_id` | `operators` | `operator_id` | (inline FK) |
| `production_confirmation` | `operation_id` | `operations` | `operation_id` | (inline FK) |
| `confirmation_equipment` | `confirmation_id` | `production_confirmation` | `confirmation_id` | (inline FK) |
| `confirmation_equipment` | `equipment_id` | `equipment` | `equipment_id` | (inline FK) |
| `confirmation_operators` | `confirmation_id` | `production_confirmation` | `confirmation_id` | (inline FK) |
| `confirmation_operators` | `operator_id` | `operators` | `operator_id` | (inline FK) |
| `consumed_materials` | `confirmation_id` | `production_confirmation` | `confirmation_id` | (inline FK) |
| `consumed_materials` | `inventory_id` | `inventory` | `inventory_id` | (inline FK) |
| `consumed_materials` | `batch_id` | `batches` | `batch_id` | (inline FK) |
| `produced_outputs` | `confirmation_id` | `production_confirmation` | `confirmation_id` | (inline FK) |
| `produced_outputs` | `batch_id` | `batches` | `batch_id` | (inline FK) |
| `produced_outputs` | `inventory_id` | `inventory` | `inventory_id` | (inline FK) |
| `process_parameter_values` | `confirmation_id` | `production_confirmation` | `confirmation_id` | (inline FK) |
| `process_parameter_values` | `config_id` | `process_parameters_config` | `config_id` | (inline FK) |
| `operation_parameter_templates` | `config_id` | `process_parameters_config` | `config_id` | (inline FK) |
| `batches` | `generated_at_operation_id` | `operations` | `operation_id` | (inline FK) |
| `inventory` | `batch_id` | `batches` | `batch_id` | (inline FK) |
| `inventory_movement` | `operation_id` | `operations` | `operation_id` | (inline FK) |
| `inventory_movement` | `inventory_id` | `inventory` | `inventory_id` | (inline FK) |
| `batch_relations` | `parent_batch_id` | `batches` | `batch_id` | (inline FK) |
| `batch_relations` | `child_batch_id` | `batches` | `batch_id` | (inline FK) |
| `batch_relations` | `operation_id` | `operations` | `operation_id` | (inline FK) |
| `batch_order_allocation` | `batch_id` | `batches` | `batch_id` | (inline FK) |
| `batch_order_allocation` | `order_line_id` | `order_line_items` | `order_line_id` | (inline FK) |
| `batch_quantity_adjustments` | `batch_id` | `batches` | `batch_id` | (inline FK) |
| `batch_number_sequence` | `config_id` | `batch_number_config` | `config_id` | (inline FK) |
| `products` | `default_process_id` | `processes` | `process_id` | `fk_products_default_process` |
| `material_attributes` | `material_id` | `materials` | `material_id` | (inline FK) |
| `material_attributes` | `attribute_id` | `attribute_definitions` | `attribute_id` | (inline FK) |
| `product_attributes` | `product_id` | `products` | `product_id` | (inline FK) |
| `product_attributes` | `attribute_id` | `attribute_definitions` | `attribute_id` | (inline FK) |
| `batch_attributes` | `batch_id` | `batches` | `batch_id` | (inline FK) |
| `batch_attributes` | `attribute_id` | `attribute_definitions` | `attribute_id` | (inline FK) |
| `equipment_attributes` | `equipment_id` | `equipment` | `equipment_id` | (inline FK) |
| `equipment_attributes` | `attribute_id` | `attribute_definitions` | `attribute_id` | (inline FK) |
| `inventory_attributes` | `inventory_id` | `inventory` | `inventory_id` | (inline FK) |
| `inventory_attributes` | `attribute_id` | `attribute_definitions` | `attribute_id` | (inline FK) |
| `locations` | `parent_location_id` | `locations` | `location_id` | (self-referencing) |
| `material_groups` | `parent_group_id` | `material_groups` | `group_id` | (self-referencing) |
| `product_categories` | `parent_category_id` | `product_categories` | `category_id` | (self-referencing) |
| `product_groups` | `category_id` | `product_categories` | `category_id` | (inline FK) |

---

## Sequences

PostgreSQL BIGSERIAL/SERIAL columns auto-create sequences. Key sequences:

| Sequence | Table | Column |
|----------|-------|--------|
| `users_user_id_seq` | users | user_id |
| `orders_order_id_seq` | orders | order_id |
| `order_line_items_order_line_id_seq` | order_line_items | order_line_id |
| `bill_of_material_bom_id_seq` | bill_of_material | bom_id |
| `processes_process_id_seq` | processes | process_id |
| `routing_routing_id_seq` | routing | routing_id |
| `routing_steps_routing_step_id_seq` | routing_steps | routing_step_id |
| `operation_templates_operation_template_id_seq` | operation_templates | operation_template_id |
| `operations_operation_id_seq` | operations | operation_id |
| `equipment_equipment_id_seq` | equipment | equipment_id |
| `operators_operator_id_seq` | operators | operator_id |
| `production_confirmation_confirmation_id_seq` | production_confirmation | confirmation_id |
| `batches_batch_id_seq` | batches | batch_id |
| `inventory_inventory_id_seq` | inventory | inventory_id |
| `inventory_movement_movement_id_seq` | inventory_movement | movement_id |
| `batch_relations_relation_id_seq` | batch_relations | relation_id |
| `hold_records_hold_id_seq` | hold_records | hold_id |
| `audit_trail_audit_id_seq` | audit_trail | audit_id |
| `batch_number_config_config_id_seq` | batch_number_config | config_id |
| `batch_number_sequence_sequence_id_seq` | batch_number_sequence | sequence_id |
| `customers_customer_id_seq` | customers | customer_id |
| `materials_material_id_seq` | materials | material_id |
| `products_product_id_seq` | products | product_id |

**Note:** The `processes_process_id_seq` was renamed from `process_templates_process_template_id_seq` in Patch 028. The original `processes_process_id_seq` was renamed to `process_instances_process_instance_id_seq` and later dropped in Patch 030.

---

## Indexes

### Primary Table Indexes (Patch 001)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_orders_status` | orders | status |
| `idx_order_lines_order_id` | order_line_items | order_id |
| `idx_order_lines_status` | order_line_items | status |
| `idx_processes_status` | processes | status |
| `idx_operations_process` | operations | process_id |
| `idx_operations_status` | operations | status |
| `idx_inventory_state` | inventory | state |
| `idx_inventory_type` | inventory | inventory_type |
| `idx_inventory_batch` | inventory | batch_id |
| `idx_batches_status` | batches | status |
| `idx_batches_material` | batches | material_id |
| `idx_production_confirm_operation` | production_confirmation | operation_id |
| `idx_audit_entity` | audit_trail | (entity_type, entity_id) |
| `idx_hold_entity` | hold_records | (entity_type, entity_id) |

### Array Indexes (Patch 003)

| Index Name | Table | Column(s) | Type |
|-----------|-------|-----------|------|
| `idx_confirmation_equipment` | production_confirmation | equipment_ids | GIN |
| `idx_confirmation_operators` | production_confirmation | operator_ids | GIN |

### Batch Number Indexes (Patch 009)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_batch_config_operation` | batch_number_config | operation_type |
| `idx_batch_config_product` | batch_number_config | product_sku |
| `idx_batch_config_priority` | batch_number_config | priority |
| `idx_batch_seq_key` | batch_number_sequence | sequence_key |
| `idx_batch_config_material` | batch_number_config | material_id |

### Partial Indexes (Patch 010)

| Index Name | Table | Column(s) | Condition |
|-----------|-------|-----------|-----------|
| `idx_batches_quality_pending` | batches | status | WHERE status = 'QUALITY_PENDING' |

### Junction Table Indexes (Patch 011)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_conf_equip_confirmation` | confirmation_equipment | confirmation_id |
| `idx_conf_equip_equipment` | confirmation_equipment | equipment_id |
| `idx_conf_ops_confirmation` | confirmation_operators | confirmation_id |
| `idx_conf_ops_operator` | confirmation_operators | operator_id |
| `idx_inventory_reserved_order` | inventory | reserved_for_order_id |
| `idx_inventory_reserved_operation` | inventory | reserved_for_operation_id |
| `idx_operations_blocked` | operations | blocked_on (WHERE NOT NULL) |

### Equipment Indexes (Patch 013)

| Index Name | Table | Column(s) | Condition |
|-----------|-------|-----------|-----------|
| `idx_equipment_maintenance` | equipment | maintenance_start | WHERE NOT NULL |
| `idx_equipment_hold` | equipment | hold_start | WHERE NOT NULL |
| `idx_equipment_category` | equipment | equipment_category | |

### Master Data Indexes (Patches 014-015)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_customers_code` | customers | customer_code |
| `idx_customers_name` | customers | customer_name |
| `idx_customers_status` | customers | status |
| `idx_materials_code` | materials | material_code |
| `idx_materials_name` | materials | material_name |
| `idx_materials_type` | materials | material_type |
| `idx_materials_status` | materials | status |
| `idx_products_sku` | products | sku |
| `idx_products_name` | products | product_name |
| `idx_products_category` | products | product_category |
| `idx_products_status` | products | status |

### Quantity Config Indexes (Patch 018)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_qty_config_material` | quantity_type_config | material_code |
| `idx_qty_config_operation` | quantity_type_config | operation_type |
| `idx_qty_config_status` | quantity_type_config | status |

### Customer FK Index (Patch 020)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_orders_customer_ref` | orders | customer_ref_id |

### Lookup Table Indexes (Patch 021)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_departments_code` | departments | department_code |
| `idx_departments_status` | departments | status |
| `idx_shifts_code` | shifts | shift_code |
| `idx_shifts_status` | shifts | status |
| `idx_locations_code` | locations | location_code |
| `idx_locations_type` | locations | location_type |
| `idx_locations_parent` | locations | parent_location_id |
| `idx_locations_status` | locations | status |
| `idx_material_groups_code` | material_groups | group_code |
| `idx_material_groups_parent` | material_groups | parent_group_id |
| `idx_material_groups_status` | material_groups | status |
| `idx_product_categories_code` | product_categories | category_code |
| `idx_product_categories_parent` | product_categories | parent_category_id |
| `idx_product_categories_status` | product_categories | status |
| `idx_product_groups_code` | product_groups | group_code |
| `idx_product_groups_category` | product_groups | category_id |
| `idx_product_groups_status` | product_groups | status |
| `idx_operation_types_code` | operation_types | type_code |
| `idx_operation_types_status` | operation_types | status |

### Attribute System Indexes (Patch 022)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_attr_def_code` | attribute_definitions | attribute_code |
| `idx_attr_def_entity` | attribute_definitions | entity_type |
| `idx_attr_def_status` | attribute_definitions | status |
| `idx_mat_attr_material` | material_attributes | material_id |
| `idx_mat_attr_attribute` | material_attributes | attribute_id |
| `idx_prod_attr_product` | product_attributes | product_id |
| `idx_prod_attr_attribute` | product_attributes | attribute_id |
| `idx_batch_attr_batch` | batch_attributes | batch_id |
| `idx_batch_attr_attribute` | batch_attributes | attribute_id |
| `idx_equip_attr_equipment` | equipment_attributes | equipment_id |
| `idx_equip_attr_attribute` | equipment_attributes | attribute_id |
| `idx_inv_attr_inventory` | inventory_attributes | inventory_id |
| `idx_inv_attr_attribute` | inventory_attributes | attribute_id |

### Production Detail Indexes (Patch 023)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_param_values_confirmation` | process_parameter_values | confirmation_id |
| `idx_param_values_config` | process_parameter_values | config_id |
| `idx_param_values_name` | process_parameter_values | parameter_name |
| `idx_param_values_within_spec` | process_parameter_values | is_within_spec |
| `idx_op_param_template_type` | operation_parameter_templates | operation_type |
| `idx_op_param_template_config` | operation_parameter_templates | config_id |
| `idx_consumed_mat_confirmation` | consumed_materials | confirmation_id |
| `idx_consumed_mat_inventory` | consumed_materials | inventory_id |
| `idx_consumed_mat_batch` | consumed_materials | batch_id |
| `idx_consumed_mat_material` | consumed_materials | material_id |
| `idx_produced_confirmation` | produced_outputs | confirmation_id |
| `idx_produced_batch` | produced_outputs | batch_id |
| `idx_produced_inventory` | produced_outputs | inventory_id |
| `idx_produced_type` | produced_outputs | output_type |

### Batch Management Indexes (Patches 024, 026, 027)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_batch_adjustments_batch_id` | batch_quantity_adjustments | batch_id |
| `idx_batch_adjustments_type` | batch_quantity_adjustments | adjustment_type |
| `idx_batch_adjustments_date` | batch_quantity_adjustments | adjusted_on |
| `idx_batch_size_config_material` | batch_size_config | material_id |
| `idx_batch_size_config_operation` | batch_size_config | operation_type |
| `idx_batch_size_config_product` | batch_size_config | product_sku |
| `idx_batch_size_config_active` | batch_size_config | is_active |
| `idx_batches_supplier_batch` | batches | supplier_batch_number |
| `idx_batches_supplier_id` | batches | supplier_id |
| `idx_batches_received_date` | batches | received_date |
| `idx_batches_expiry_date` | batches | expiry_date |

### Template/Routing Indexes (Patches 025, 040)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_process_template_product` | processes | product_sku |
| `idx_process_template_status` | processes | status |
| `idx_op_template_status` | operation_templates | status |
| `idx_op_template_type` | operation_templates | operation_type |
| `idx_op_template_code` | operation_templates | operation_code |
| `idx_routing_steps_op_template` | routing_steps | operation_template_id |
| `idx_operations_op_template` | operations | operation_template_id |

### Operation/Order Indexes (Patches 030, 037, 044)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_operations_order_line` | operations | order_line_id |
| `idx_products_default_process` | products | default_process_id |
| `idx_order_line_items_process` | order_line_items | process_id |
| `idx_operations_start_time` | operations | start_time |
| `idx_operations_end_time` | operations | end_time |
| `idx_orders_priority` | orders | priority |

### Reset Log Indexes (Patch 033)

| Index Name | Table | Column(s) |
|-----------|-------|-----------|
| `idx_reset_log_timestamp` | database_reset_log | reset_timestamp DESC |
| `idx_reset_log_environment` | database_reset_log | environment |

---

## Key Constraints

### CHECK Constraints Summary

| Table | Constraint Name | Allowed Values |
|-------|----------------|----------------|
| `orders` | `chk_order_status` | CREATED, IN_PROGRESS, COMPLETED, BLOCKED, ON_HOLD |
| `order_line_items` | `chk_line_status` | CREATED, READY, IN_PROGRESS, COMPLETED, CANCELLED, BLOCKED, ON_HOLD |
| `bill_of_material` | `chk_bom_status` | ACTIVE, INACTIVE, DRAFT, OBSOLETE, ON_HOLD |
| `routing` | `chk_routing_type` | SEQUENTIAL, PARALLEL |
| `routing` | `chk_routing_status` | DRAFT, ACTIVE, INACTIVE, ON_HOLD |
| `routing_steps` | `chk_routing_step_status` | ACTIVE, INACTIVE |
| `operations` | `chk_operation_status` | NOT_STARTED, READY, IN_PROGRESS, PARTIALLY_CONFIRMED, CONFIRMED, BLOCKED, ON_HOLD |
| `equipment` | `chk_equipment_type` | BATCH, CONTINUOUS |
| `equipment` | `chk_equipment_status` | AVAILABLE, IN_USE, MAINTENANCE, ON_HOLD, UNAVAILABLE |
| `equipment` | `chk_equipment_category` | MELTING, REFINING, CASTING, HOT_ROLLING, COLD_ROLLING, ANNEALING, PICKLING, BAR_ROLLING, COATING, WIRE_ROLLING, FINISHING, INSPECTION, PACKAGING, HEAT_TREATMENT, GENERAL |
| `operation_equipment_usage` | `chk_equip_usage_status` | LOGGED, CONFIRMED |
| `production_confirmation` | `chk_confirm_status` | CONFIRMED, PARTIALLY_CONFIRMED, REJECTED, PENDING_REVIEW |
| `batches` | `chk_batch_status` | AVAILABLE, CONSUMED, PRODUCED, ON_HOLD, BLOCKED, SCRAPPED, QUALITY_PENDING |
| `batches` | `chk_batch_created_via` | PRODUCTION, SPLIT, MERGE, MANUAL, SYSTEM, RECEIPT |
| `inventory` | `chk_inventory_type` | RM, IM, FG, WIP |
| `inventory` | `chk_inventory_state` | AVAILABLE, RESERVED, CONSUMED, PRODUCED, BLOCKED, SCRAPPED, ON_HOLD |
| `inventory_movement` | `chk_movement_type` | CONSUME, PRODUCE, HOLD, RELEASE, SCRAP, RECEIVE, TRANSFER, ADJUST |
| `inventory_movement` | `chk_movement_status` | EXECUTED, PENDING, ON_HOLD |
| `batch_relations` | `chk_relation_type` | SPLIT, MERGE, CONSUME |
| `batch_relations` | `chk_relation_status` | ACTIVE, CLOSED |
| `batch_order_allocation` | `chk_allocation_status` | ALLOCATED, RELEASED |
| `hold_records` | `chk_hold_entity_type` | OPERATION, PROCESS, ORDER_LINE, INVENTORY, BATCH, EQUIPMENT |
| `hold_records` | `chk_hold_status` | ACTIVE, RELEASED |
| `customers` | `chk_customer_status` | ACTIVE, INACTIVE |
| `materials` | `chk_material_type` | RM, IM, FG, WIP |
| `materials` | `chk_material_status` | ACTIVE, INACTIVE, OBSOLETE |
| `products` | `chk_product_status` | ACTIVE, INACTIVE, DISCONTINUED |
| `processes` | `chk_process_template_status` | DRAFT, ACTIVE, INACTIVE, SUPERSEDED |
| `processes` | `chk_process_usage_decision` | PENDING, ACCEPT, REJECT (or NULL) |
| `operation_templates` | `chk_operation_template_status` | ACTIVE, INACTIVE |
| `operation_templates` | `chk_operation_template_qty_type` | DISCRETE, BATCH, CONTINUOUS |
| `produced_outputs` | `chk_output_type` | GOOD, SCRAP, REWORK, BYPRODUCT |
| `batch_quantity_adjustments` | `chk_adjustment_type` | CORRECTION, INVENTORY_COUNT, DAMAGE, SCRAP_RECOVERY, SYSTEM |
| `batch_size_config` | `chk_batch_size_range` | max_batch_size >= min_batch_size |
| `batch_size_config` | `chk_preferred_in_range` | preferred within min/max or NULL |
| `attribute_definitions` | `chk_attr_data_type` | STRING, INTEGER, DECIMAL, BOOLEAN, DATE, DATETIME, LIST |
| `attribute_definitions` | `chk_attr_entity_type` | MATERIAL, PRODUCT, BATCH, EQUIPMENT, OPERATION, INVENTORY |
| `departments` | `chk_department_status` | ACTIVE, INACTIVE |
| `shifts` | `chk_shift_status` | ACTIVE, INACTIVE |
| `locations` | `chk_location_type` | WAREHOUSE, PLANT, ZONE, RACK, BIN, STAGING |
| `locations` | `chk_location_status` | ACTIVE, INACTIVE, MAINTENANCE |
| `material_groups` | `chk_material_group_status` | ACTIVE, INACTIVE |
| `product_categories` | `chk_product_category_status` | ACTIVE, INACTIVE |
| `product_groups` | `chk_product_group_status` | ACTIVE, INACTIVE |
| `operation_types` | `chk_operation_type_status` | ACTIVE, INACTIVE |
| `operation_parameter_templates` | `chk_op_param_template_status` | ACTIVE, INACTIVE |

### UNIQUE Constraints Summary

| Table | Column(s) |
|-------|-----------|
| `users` | email |
| `orders` | order_number |
| `batches` | batch_number |
| `equipment` | equipment_code |
| `operators` | operator_code |
| `customers` | customer_code |
| `materials` | material_code |
| `products` | sku |
| `delay_reasons` | reason_code |
| `hold_reasons` | reason_code |
| `batch_number_config` | config_name |
| `batch_number_sequence` | (config_id, sequence_key) |
| `unit_of_measure` | unit_code |
| `unit_conversion` | (from_unit_code, to_unit_code) |
| `inventory_form_config` | form_code |
| `equipment_category_config` | equipment_category |
| `quantity_type_config` | config_name |
| `departments` | department_code |
| `shifts` | shift_code |
| `locations` | location_code |
| `material_groups` | group_code |
| `product_categories` | category_code |
| `product_groups` | group_code |
| `operation_types` | type_code |
| `attribute_definitions` | attribute_code |
| `material_attributes` | (material_id, attribute_id) |
| `product_attributes` | (product_id, attribute_id) |
| `batch_attributes` | (batch_id, attribute_id) |
| `equipment_attributes` | (equipment_id, attribute_id) |
| `inventory_attributes` | (inventory_id, attribute_id) |
| `operation_parameter_templates` | (operation_type, config_id) |
| `processes` | process_code |

---

## Demo Data Structure

The demo mode uses H2 in-memory database with `demo/schema.sql` for DDL and `demo/data.sql` for sample data. The demo data is comprehensive and includes all entity types.

### Tables with Demo Seed Data

| Table | # Records | Source | Description |
|-------|-----------|--------|-------------|
| `users` | 1 | data.sql | admin@mes.com (password: admin123) |
| `delay_reasons` | 10 | data.sql | EQUIP_BREAKDOWN, MATERIAL_SHORTAGE, OPERATOR_UNAVAIL, etc. |
| `hold_reasons` | 10 | data.sql | EQUIP_BREAKDOWN, QUALITY_INVESTIGATION, SAFETY_CONCERN, etc. |
| `customers` | 12 | data.sql | CUST-001 through CUST-012 (1 inactive) |
| `materials` | 32 | data.sql | 15 RM, 10 IM, 4 WIP, 3 FG types |
| `products` | 8 | data.sql | HR Coils, CR Sheets, Rebars, Billets |
| `equipment` | 8+ | patches 002/034 | Furnaces, Casters, Rolling Mills, etc. |
| `operators` | 12 | patch 034 | Operators across departments (Melt Shop, Casting, Rolling, Quality) |
| `processes` | auto-seeded | patches 025/028 | Design-time process templates |
| `process_parameters_config` | ~30 | patches 002/004/035 | ROLLING, FURNACE, CASTER, MELTING, CASTING, HOT_ROLLING, COLD_ROLLING, ANNEALING parameters |
| `batch_number_config` | ~10 | patches 009/035 | DEFAULT, FURNACE, CASTER, ROLLING, SPLIT, MERGE, RM_RECEIPT configurations |
| `equipment_category_config` | ~15 | patches 006/043 | MELTING, CASTING, HOT_ROLLING, COLD_ROLLING, ANNEALING, PICKLING, etc. |
| `unit_of_measure` | 16 | patch 007 | KG, TONS, LB, G, M, MM, CM, FT, IN, L, M3, GAL, PCS, EA, M2 |
| `unit_conversion` | 19 | patch 007 | Weight, length, volume, pieces conversions |
| `inventory_form_config` | 8 | patch 008 | SOLID, MOLTEN, POWDER, LIQUID, COIL, SHEET, BAR, SCRAP |
| `batch_size_config` | 5 | patch 026 | MELTING(50T), CASTING(25T), ROLLING(15T), ANNEALING(30T), FINISHING(10T) |
| `departments` | 5 | patch 021 | PROD, QC, MAINT, WAREHOUSE, LOGISTICS |
| `shifts` | 4 | patch 021 | MORNING, AFTERNOON, NIGHT, GENERAL |
| `locations` | 7 | patch 021 | PLANT-A, PLANT-B, WH-RM, WH-FG, WH-WIP, STAGING-IN, STAGING-OUT |
| `material_groups` | 6 | patch 021 | METALS, STEEL, IRON, CHEMICALS, CONSUMABLES, PACKAGING |
| `product_categories` | 5 | patch 021 | FINISHED, SEMI-FIN, STANDARD, CUSTOM, SPARE |
| `product_groups` | 5 | patch 021 | STEEL-PLATES, STEEL-COILS, STEEL-BARS, STEEL-PIPES, CASTINGS |
| `operation_types` | 10 | patch 021 | MELTING, CASTING, ROLLING, CUTTING, HEAT-TREAT, COATING, INSPECTION, PACKAGING, ASSEMBLY, TESTING |
| `operation_templates` | 10 | patch 040 | Melting, Casting, Hot Rolling, Cold Rolling, Annealing, Galvanizing, Slitting, Cut to Length, QC, Packaging |
| `attribute_definitions` | ~25 | patch 022 | Material (grade, tensile, hardness), Product (width, length, thickness), Batch (chemistry), Equipment (power, model), Inventory (lot, expiry) |
| `quantity_type_config` | 4 | patch 018 | DEFAULT_DECIMAL, INTEGER_COUNT, FURNACE_WEIGHT, ROLLING_LENGTH |
| `audit_trail` | many | data.sql | CREATE entries for all master data entities |

### Key Reference Data Values

**Hold Reasons:**
- EQUIP_BREAKDOWN - Equipment Breakdown
- QUALITY_INVESTIGATION - Quality Investigation
- MATERIAL_SHORTAGE - Material Shortage
- SAFETY_CONCERN - Safety Concern
- REGULATORY_HOLD - Regulatory Hold
- CUSTOMER_REQUEST - Customer Request
- CONTAMINATION - Contamination Suspected
- SPEC_DEVIATION - Specification Deviation
- OTHER - Other

**Delay Reasons:**
- EQUIP_BREAKDOWN - Equipment Breakdown
- MATERIAL_SHORTAGE - Material Shortage
- OPERATOR_UNAVAIL - Operator Unavailable
- QUALITY_ISSUE - Quality Issue
- SCHEDULING - Scheduling Conflict
- MAINTENANCE - Scheduled Maintenance
- POWER_OUTAGE - Power Outage
- TOOL_CHANGE - Tool/Die Change
- CALIBRATION - Equipment Calibration

**Material Types:**
- RM = Raw Material
- IM = Intermediate Material
- FG = Finished Goods
- WIP = Work In Progress

**Inventory Forms:**
- SOLID - Solid materials (billets, bars, plates)
- MOLTEN - Molten metal (high temperature)
- POWDER - Powdered/granular materials
- LIQUID - Non-metallic liquids
- COIL - Coiled sheets or wire
- SHEET - Flat sheet or plate
- BAR - Bar or rod shaped
- SCRAP - Recyclable scrap

**Equipment Categories:**
- MELTING - Electric Arc Furnaces
- REFINING - Ladle Furnaces
- CASTING - Continuous Casters
- HOT_ROLLING - Hot Strip Mills
- COLD_ROLLING - Cold Rolling Mills
- ANNEALING - Annealing Furnaces
- PICKLING - Pickling Lines
- BAR_ROLLING - Bar Rolling Mills
- COATING - Galvanizing/Coating Lines
- WIRE_ROLLING - Wire Rod Mills
- FINISHING - Finishing Equipment
- INSPECTION - Inspection Stations
- PACKAGING - Packaging Equipment
- HEAT_TREATMENT - Heat Treatment Furnaces
- GENERAL - General Purpose
