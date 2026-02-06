-- Patch 017: Add audit columns to config/lookup tables for CRUD support
-- Adds updated_on, updated_by to hold_reasons, delay_reasons, process_parameters_config, batch_number_config

ALTER TABLE hold_reasons ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE hold_reasons ADD COLUMN IF NOT EXISTS updated_on TIMESTAMP;
ALTER TABLE hold_reasons ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

ALTER TABLE delay_reasons ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE delay_reasons ADD COLUMN IF NOT EXISTS updated_on TIMESTAMP;
ALTER TABLE delay_reasons ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

ALTER TABLE process_parameters_config ADD COLUMN IF NOT EXISTS created_by VARCHAR(100);
ALTER TABLE process_parameters_config ADD COLUMN IF NOT EXISTS updated_on TIMESTAMP;
ALTER TABLE process_parameters_config ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);

ALTER TABLE batch_number_config ADD COLUMN IF NOT EXISTS updated_on TIMESTAMP;
ALTER TABLE batch_number_config ADD COLUMN IF NOT EXISTS updated_by VARCHAR(100);
