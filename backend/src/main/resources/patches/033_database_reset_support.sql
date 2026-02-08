-- =====================================================
-- Patch 033: Database Reset Support Tables
-- =====================================================
-- Purpose: Creates tables for tracking database resets
-- NOTE: Reset functions are now handled via Spring application code
--       (not stored procedures) to avoid dollar-quote parsing issues
-- =====================================================

-- Create reset tracking table if not exists
CREATE TABLE IF NOT EXISTS database_reset_log (
    reset_id SERIAL PRIMARY KEY,
    reset_type VARCHAR(50) NOT NULL,
    reset_by VARCHAR(100) NOT NULL,
    reset_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    environment VARCHAR(50) NOT NULL,
    tables_affected TEXT,
    rows_deleted INTEGER DEFAULT 0
);

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_reset_log_timestamp ON database_reset_log(reset_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_reset_log_environment ON database_reset_log(environment);
