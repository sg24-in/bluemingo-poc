-- GAP-002: Equipment Type Configuration
-- Defines validation rules and parameters for different equipment types

CREATE TABLE IF NOT EXISTS equipment_type_config (
    config_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    equipment_type VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(100) NOT NULL,
    description VARCHAR(500),
    -- Capacity limits
    min_capacity DECIMAL(15,4),
    max_capacity DECIMAL(15,4),
    default_capacity_unit VARCHAR(20),
    -- Operating parameters
    min_temperature DECIMAL(10,2),
    max_temperature DECIMAL(10,2),
    min_pressure DECIMAL(10,2),
    max_pressure DECIMAL(10,2),
    -- Maintenance rules
    maintenance_interval_hours INT,
    max_continuous_operation_hours INT,
    -- Validation flags
    requires_operator BOOLEAN DEFAULT TRUE,
    requires_calibration BOOLEAN DEFAULT FALSE,
    allows_parallel_operation BOOLEAN DEFAULT TRUE,
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard equipment types
INSERT INTO equipment_type_config (equipment_type, display_name, description, min_capacity, max_capacity, default_capacity_unit, min_temperature, max_temperature, maintenance_interval_hours, requires_operator, requires_calibration) VALUES
('FURNACE', 'Electric Arc Furnace', 'High-temperature melting equipment', 10, 500, 'TONS', 1500, 1800, 720, TRUE, TRUE),
('CASTER', 'Continuous Caster', 'Continuous casting equipment for steel billets', 1, 100, 'TONS', 1400, 1600, 480, TRUE, TRUE),
('ROLLING_MILL', 'Rolling Mill', 'Hot/cold rolling equipment', 1, 50, 'TONS', 800, 1200, 360, TRUE, FALSE),
('LADLE', 'Steel Ladle', 'Molten steel transport vessel', 50, 300, 'TONS', NULL, NULL, 168, FALSE, FALSE),
('CRANE', 'Overhead Crane', 'Material handling crane', 5, 100, 'TONS', NULL, NULL, 720, TRUE, FALSE),
('HEAT_TREATMENT', 'Heat Treatment Furnace', 'Controlled heating/cooling equipment', 1, 50, 'TONS', 200, 1100, 480, TRUE, TRUE),
('CUTTING', 'Cutting Machine', 'Steel cutting equipment', NULL, NULL, 'PIECES', NULL, NULL, 240, TRUE, FALSE),
('INSPECTION', 'Inspection Station', 'Quality inspection equipment', NULL, NULL, NULL, NULL, NULL, 168, TRUE, TRUE);
