-- GAP-006: Quantity Type and Unit Conversion Configuration
-- Supports different quantity types with conversion factors

CREATE TABLE IF NOT EXISTS unit_of_measure (
    unit_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    unit_code VARCHAR(20) NOT NULL UNIQUE,
    unit_name VARCHAR(50) NOT NULL,
    unit_type VARCHAR(20) NOT NULL, -- WEIGHT, LENGTH, VOLUME, PIECES, AREA
    decimal_precision INT DEFAULT 2,
    is_base_unit BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS unit_conversion (
    conversion_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    from_unit_code VARCHAR(20) NOT NULL,
    to_unit_code VARCHAR(20) NOT NULL,
    conversion_factor DECIMAL(20,10) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(from_unit_code, to_unit_code)
);

-- Insert standard units of measure
INSERT INTO unit_of_measure (unit_code, unit_name, unit_type, decimal_precision, is_base_unit) VALUES
-- Weight units
('KG', 'Kilogram', 'WEIGHT', 2, TRUE),
('TONS', 'Metric Ton', 'WEIGHT', 3, FALSE),
('LB', 'Pound', 'WEIGHT', 2, FALSE),
('G', 'Gram', 'WEIGHT', 0, FALSE),
-- Length units
('M', 'Meter', 'LENGTH', 3, TRUE),
('MM', 'Millimeter', 'LENGTH', 1, FALSE),
('CM', 'Centimeter', 'LENGTH', 2, FALSE),
('FT', 'Foot', 'LENGTH', 3, FALSE),
('IN', 'Inch', 'LENGTH', 3, FALSE),
-- Volume units
('L', 'Liter', 'VOLUME', 2, TRUE),
('M3', 'Cubic Meter', 'VOLUME', 4, FALSE),
('GAL', 'Gallon', 'VOLUME', 2, FALSE),
-- Pieces
('PCS', 'Pieces', 'PIECES', 0, TRUE),
('EA', 'Each', 'PIECES', 0, FALSE),
-- Area units
('M2', 'Square Meter', 'AREA', 3, TRUE);

-- Insert conversion factors
INSERT INTO unit_conversion (from_unit_code, to_unit_code, conversion_factor) VALUES
-- Weight conversions (to KG)
('TONS', 'KG', 1000),
('KG', 'TONS', 0.001),
('LB', 'KG', 0.453592),
('KG', 'LB', 2.20462),
('G', 'KG', 0.001),
('KG', 'G', 1000),
-- Length conversions (to M)
('MM', 'M', 0.001),
('M', 'MM', 1000),
('CM', 'M', 0.01),
('M', 'CM', 100),
('FT', 'M', 0.3048),
('M', 'FT', 3.28084),
('IN', 'M', 0.0254),
('M', 'IN', 39.3701),
('IN', 'MM', 25.4),
('MM', 'IN', 0.0393701),
-- Volume conversions (to L)
('M3', 'L', 1000),
('L', 'M3', 0.001),
('GAL', 'L', 3.78541),
('L', 'GAL', 0.264172),
-- Pieces (no conversion needed, 1:1)
('PCS', 'EA', 1),
('EA', 'PCS', 1);
