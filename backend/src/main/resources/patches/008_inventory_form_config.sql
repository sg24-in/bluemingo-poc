-- GAP-008: Inventory Form Tracking Configuration
-- Tracks inventory in different physical forms with form-specific handling

CREATE TABLE IF NOT EXISTS inventory_form_config (
    form_id BIGSERIAL PRIMARY KEY,
    form_code VARCHAR(20) NOT NULL UNIQUE,
    form_name VARCHAR(50) NOT NULL,
    description VARCHAR(200),
    -- Physical properties to track
    tracks_temperature BOOLEAN DEFAULT FALSE,
    tracks_moisture BOOLEAN DEFAULT FALSE,
    tracks_density BOOLEAN DEFAULT FALSE,
    -- Default units for this form
    default_weight_unit VARCHAR(20) DEFAULT 'KG',
    default_volume_unit VARCHAR(20),
    -- Storage requirements
    requires_temperature_control BOOLEAN DEFAULT FALSE,
    min_storage_temp DECIMAL(10,2),
    max_storage_temp DECIMAL(10,2),
    requires_humidity_control BOOLEAN DEFAULT FALSE,
    max_humidity_percent INT,
    -- Handling rules
    requires_special_handling BOOLEAN DEFAULT FALSE,
    handling_notes VARCHAR(500),
    shelf_life_days INT,
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    created_on TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard inventory forms
INSERT INTO inventory_form_config (form_code, form_name, description, tracks_temperature, tracks_density, default_weight_unit, requires_temperature_control, min_storage_temp, max_storage_temp, requires_special_handling, handling_notes) VALUES
('SOLID', 'Solid', 'Solid state materials (billets, bars, plates)', FALSE, TRUE, 'KG', FALSE, NULL, NULL, FALSE, NULL),
('MOLTEN', 'Molten Metal', 'Liquid metal at high temperature', TRUE, TRUE, 'TONS', TRUE, 1400, 1700, TRUE, 'Requires temperature monitoring. Handle with protective equipment.'),
('POWDER', 'Powder/Granular', 'Powdered or granular materials', FALSE, TRUE, 'KG', FALSE, NULL, NULL, TRUE, 'Avoid moisture exposure. Use dust extraction.'),
('LIQUID', 'Liquid', 'Non-metallic liquids (oils, chemicals)', TRUE, TRUE, 'L', TRUE, 5, 35, TRUE, 'Check MSDS for handling requirements.'),
('COIL', 'Coiled Material', 'Coiled sheets or wire', FALSE, FALSE, 'KG', FALSE, NULL, NULL, FALSE, 'Prevent edge damage. Store on proper cradles.'),
('SHEET', 'Sheet/Plate', 'Flat sheet or plate materials', FALSE, FALSE, 'KG', FALSE, NULL, NULL, FALSE, 'Stack with separators to prevent scratching.'),
('BAR', 'Bar/Rod', 'Bar or rod shaped materials', FALSE, FALSE, 'KG', FALSE, NULL, NULL, FALSE, 'Store in proper racks. Avoid bending.'),
('SCRAP', 'Scrap', 'Recyclable scrap materials', FALSE, FALSE, 'KG', FALSE, NULL, NULL, FALSE, 'Segregate by grade. Keep dry.');

-- Add inventory_form column to inventory table if not exists
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS inventory_form VARCHAR(20) DEFAULT 'SOLID';
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS current_temperature DECIMAL(10,2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS moisture_content DECIMAL(5,2);
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS density DECIMAL(10,4);
