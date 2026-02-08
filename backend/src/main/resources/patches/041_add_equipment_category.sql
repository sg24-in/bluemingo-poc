-- =====================================================
-- Patch 033c: Add Equipment Category Field
-- =====================================================
-- Purpose: Separates equipment classification:
--   - equipment_type: Processing mode (BATCH/CONTINUOUS)
--   - equipment_category: Equipment function (MELTING, CASTING, ROLLING, etc.)
-- =====================================================

-- Add equipment_category column
ALTER TABLE equipment ADD COLUMN IF NOT EXISTS equipment_category VARCHAR(50);

-- Add check constraint for valid categories
ALTER TABLE equipment DROP CONSTRAINT IF EXISTS chk_equipment_category;
ALTER TABLE equipment ADD CONSTRAINT chk_equipment_category CHECK (
    equipment_category IS NULL OR equipment_category IN (
        'MELTING',       -- Electric Arc Furnaces
        'REFINING',      -- Ladle Furnaces
        'CASTING',       -- Continuous Casters
        'HOT_ROLLING',   -- Hot Strip Mills
        'COLD_ROLLING',  -- Cold Rolling Mills
        'ANNEALING',     -- Annealing Furnaces
        'PICKLING',      -- Pickling Lines
        'BAR_ROLLING',   -- Bar Rolling Mills
        'COATING',       -- Galvanizing, Coating Lines
        'WIRE_ROLLING',  -- Wire Rod Mills
        'FINISHING',     -- Finishing equipment
        'INSPECTION',    -- Inspection equipment
        'PACKAGING',     -- Packaging equipment
        'HEAT_TREATMENT', -- Heat treatment equipment
        'GENERAL'        -- General purpose
    )
);

-- Create index for filtering
CREATE INDEX IF NOT EXISTS idx_equipment_category ON equipment(equipment_category);

-- Add comment
COMMENT ON COLUMN equipment.equipment_category IS 'Equipment functional category: MELTING, CASTING, ROLLING, etc.';
COMMENT ON COLUMN equipment.equipment_type IS 'Processing mode: BATCH (discrete batches) or CONTINUOUS (continuous flow)';
