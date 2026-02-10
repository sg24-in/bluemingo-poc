-- Patch 050: Add priority field to orders table
-- R-16: Order priority for production scheduling
-- Priority values: 1=CRITICAL, 2=HIGH, 3=MEDIUM (default), 4=LOW, 5=BACKLOG

ALTER TABLE orders ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3;

-- Set existing orders to MEDIUM priority
UPDATE orders SET priority = 3 WHERE priority IS NULL;

-- Index for sorting by priority
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
