-- =====================================================
-- Patch 035: Demo Process Parameter and Batch Number Configuration
-- =====================================================
-- Purpose: Seeds process parameter configs and batch number configs
-- Note: Process templates and routings are handled separately
-- =====================================================

-- =====================================================
-- SECTION 1: PROCESS PARAMETER CONFIGURATION
-- =====================================================
-- Min/max values for process parameters validation

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
-- SECTION 2: BATCH NUMBER CONFIGURATION
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
