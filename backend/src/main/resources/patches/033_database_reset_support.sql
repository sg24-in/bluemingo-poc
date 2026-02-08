-- =====================================================
-- Patch 033: Database Reset Support Functions
-- =====================================================
-- Purpose: Provides stored procedures for safe database reset
-- WARNING: These functions DELETE ALL DATA when executed
-- Only enabled in non-production environments
-- =====================================================

-- Create reset tracking table if not exists
CREATE TABLE IF NOT EXISTS database_reset_log (
    reset_id SERIAL PRIMARY KEY,
    reset_type VARCHAR(50) NOT NULL,
    reset_by VARCHAR(100) NOT NULL,
    reset_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    environment VARCHAR(50) NOT NULL,
    tables_affected TEXT,
    rows_deleted INTEGER DEFAULT 0
);

-- Function: Truncate all transactional data (preserves master data)
CREATE OR REPLACE FUNCTION reset_transactional_data(
    p_reset_by VARCHAR(100),
    p_environment VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
    v_rows_deleted INTEGER := 0;
    v_count INTEGER;
BEGIN
    -- Safety check: Block production execution
    IF p_environment = 'production' THEN
        RAISE EXCEPTION 'Database reset is BLOCKED in production environment';
    END IF;

    -- Disable triggers temporarily
    SET session_replication_role = 'replica';

    -- Delete transactional data in dependency order

    -- 1. Audit trail (depends on everything)
    DELETE FROM audit_trail;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 2. Hold records
    DELETE FROM hold_records;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 3. Batch relations (depends on batches)
    DELETE FROM batch_relations;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 4. Batch order allocations
    DELETE FROM batch_order_allocations WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 5. Inventory movements
    DELETE FROM inventory_movements WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 6. Production confirmation equipment/operator junction tables
    DELETE FROM production_confirmation_equipment WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    DELETE FROM production_confirmation_operators WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 7. Production confirmations
    DELETE FROM production_confirmations;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 8. Process parameter values
    DELETE FROM process_parameter_values WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 9. Operations (runtime, linked to order_line_items)
    DELETE FROM operations;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 10. Inventory (depends on batches)
    DELETE FROM inventory;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 11. Batches
    DELETE FROM batches;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 12. Order line items
    DELETE FROM order_line_items;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 13. Orders
    DELETE FROM orders;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- Re-enable triggers
    SET session_replication_role = 'origin';

    -- Log the reset
    INSERT INTO database_reset_log (reset_type, reset_by, environment, tables_affected, rows_deleted)
    VALUES ('TRANSACTIONAL', p_reset_by, p_environment,
            'audit_trail,hold_records,batch_relations,batch_order_allocations,inventory_movements,production_confirmations,operations,inventory,batches,order_line_items,orders',
            v_rows_deleted);

    RETURN v_rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function: Full database reset (deletes ALL data including master data)
CREATE OR REPLACE FUNCTION reset_all_data(
    p_reset_by VARCHAR(100),
    p_environment VARCHAR(50)
) RETURNS INTEGER AS $$
DECLARE
    v_rows_deleted INTEGER := 0;
    v_count INTEGER;
BEGIN
    -- Safety check: Block production execution
    IF p_environment = 'production' THEN
        RAISE EXCEPTION 'Database reset is BLOCKED in production environment';
    END IF;

    -- First reset transactional data
    v_rows_deleted := reset_transactional_data(p_reset_by, p_environment);

    -- Disable triggers temporarily
    SET session_replication_role = 'replica';

    -- Now delete master data

    -- 1. Routing steps
    DELETE FROM routing_steps;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 2. Routings
    DELETE FROM routing;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 3. Process parameters config
    DELETE FROM process_parameters_config WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 4. Processes
    DELETE FROM processes;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 5. Bill of materials
    DELETE FROM bill_of_material;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 6. Products
    DELETE FROM products;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 7. Materials
    DELETE FROM materials;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 8. Customers
    DELETE FROM customers;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 9. Equipment
    DELETE FROM equipment;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 10. Operators
    DELETE FROM operators;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 11. Configuration tables (optional - usually keep these)
    DELETE FROM batch_number_config WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    DELETE FROM batch_size_config WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    DELETE FROM quantity_type_config WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- 12. Hold reasons and delay reasons
    DELETE FROM hold_reasons WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    DELETE FROM delay_reasons WHERE 1=1;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    v_rows_deleted := v_rows_deleted + v_count;

    -- Re-enable triggers
    SET session_replication_role = 'origin';

    -- Reset sequences
    ALTER SEQUENCE IF EXISTS orders_order_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS order_line_items_order_line_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS operations_operation_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS batches_batch_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS inventory_inventory_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS production_confirmations_confirmation_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS hold_records_hold_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS audit_trail_audit_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS customers_customer_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS materials_material_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS products_product_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS processes_process_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS routing_routing_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS routing_steps_routing_step_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS equipment_equipment_id_seq RESTART WITH 1;
    ALTER SEQUENCE IF EXISTS operators_operator_id_seq RESTART WITH 1;

    -- Log the reset
    INSERT INTO database_reset_log (reset_type, reset_by, environment, tables_affected, rows_deleted)
    VALUES ('FULL', p_reset_by, p_environment,
            'ALL TABLES (master + transactional)',
            v_rows_deleted);

    RETURN v_rows_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function: Reset sequences only (without deleting data)
CREATE OR REPLACE FUNCTION reset_sequences_only() RETURNS void AS $$
BEGIN
    -- This is useful after manual data cleanup
    PERFORM setval('orders_order_id_seq', COALESCE((SELECT MAX(order_id) FROM orders), 0) + 1, false);
    PERFORM setval('order_line_items_order_line_id_seq', COALESCE((SELECT MAX(order_line_id) FROM order_line_items), 0) + 1, false);
    PERFORM setval('operations_operation_id_seq', COALESCE((SELECT MAX(operation_id) FROM operations), 0) + 1, false);
    PERFORM setval('batches_batch_id_seq', COALESCE((SELECT MAX(batch_id) FROM batches), 0) + 1, false);
    PERFORM setval('inventory_inventory_id_seq', COALESCE((SELECT MAX(inventory_id) FROM inventory), 0) + 1, false);
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions (adjust as needed for your database users)
-- GRANT EXECUTE ON FUNCTION reset_transactional_data TO mes_app_user;
-- GRANT EXECUTE ON FUNCTION reset_all_data TO mes_app_user;
