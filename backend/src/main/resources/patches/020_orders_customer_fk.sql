-- Patch 020: Add proper foreign key from Orders to Customers
-- This aligns the Orders table with the MES Consolidated Data Model specification

-- Step 1: Add a new column for proper customer reference (integer FK)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS customer_ref_id BIGINT;

-- Step 2: Migrate existing data - match customer_id (varchar) to customers.customer_code
UPDATE orders o
SET customer_ref_id = c.customer_id
FROM customers c
WHERE o.customer_id = c.customer_code
  AND o.customer_ref_id IS NULL;

-- Step 3: Add foreign key constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS fk_orders_customer;
ALTER TABLE orders ADD CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_ref_id) REFERENCES customers(customer_id);

-- Step 4: Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_ref ON orders(customer_ref_id);

-- Note: The original customer_id (varchar) column is kept for backward compatibility
-- It can be removed in a future migration after all code is updated to use customer_ref_id
