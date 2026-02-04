-- Patch 014: Create customers table
-- Supports customer management for orders

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
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
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_on TIMESTAMP,
    updated_by VARCHAR(100)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_code ON customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(customer_name);
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- Add constraint for status
ALTER TABLE customers DROP CONSTRAINT IF EXISTS chk_customer_status;
ALTER TABLE customers ADD CONSTRAINT chk_customer_status
    CHECK (status IN ('ACTIVE', 'INACTIVE'));

-- Insert sample customers
INSERT INTO customers (customer_code, customer_name, contact_person, email, phone, address, city, country, status, created_by)
VALUES
    ('CUST-001', 'ABC Steel Corporation', 'John Smith', 'john.smith@abcsteel.com', '+1-555-0101', '123 Industrial Ave', 'Pittsburgh', 'USA', 'ACTIVE', 'system'),
    ('CUST-002', 'Global Manufacturing Ltd', 'Sarah Johnson', 'sarah.j@globalmanuf.com', '+1-555-0102', '456 Factory Road', 'Detroit', 'USA', 'ACTIVE', 'system'),
    ('CUST-003', 'Pacific Metal Works', 'Michael Chen', 'm.chen@pacificmetal.com', '+1-555-0103', '789 Harbor Blvd', 'Los Angeles', 'USA', 'ACTIVE', 'system'),
    ('CUST-004', 'European Auto Parts', 'Hans Mueller', 'h.mueller@euroauto.eu', '+49-555-0104', '10 Industriestrasse', 'Munich', 'Germany', 'ACTIVE', 'system'),
    ('CUST-005', 'Asian Electronics Inc', 'Yuki Tanaka', 'y.tanaka@asianelec.jp', '+81-555-0105', '5-1 Tech Park', 'Tokyo', 'Japan', 'ACTIVE', 'system')
ON CONFLICT (customer_code) DO NOTHING;

-- Update orders table to reference customers (optional - add foreign key later if needed)
-- ALTER TABLE orders ADD CONSTRAINT fk_orders_customer FOREIGN KEY (customer_id) REFERENCES customers(customer_code);
