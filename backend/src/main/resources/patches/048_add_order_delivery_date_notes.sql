-- Patch 048: Add delivery_date and notes columns to orders table
-- Gap R-03: Frontend sends these fields but backend was ignoring them

ALTER TABLE orders ADD COLUMN IF NOT EXISTS delivery_date DATE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);
