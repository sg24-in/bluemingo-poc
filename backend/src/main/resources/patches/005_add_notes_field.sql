-- =====================================================
-- MES Production Confirmation - Add Notes Field
-- Patch: 005
-- Description: Add notes column to production_confirmation table
-- =====================================================

-- Add notes column to production_confirmation table
ALTER TABLE production_confirmation
ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);

-- Add comment for documentation
COMMENT ON COLUMN production_confirmation.notes IS 'Free-form notes/comments about the production confirmation';
