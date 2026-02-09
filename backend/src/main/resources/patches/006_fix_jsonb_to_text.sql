-- =====================================================
-- Patch 006: Change JSONB columns to TEXT
-- The JPA entity stores JSON as plain String, which
-- PostgreSQL rejects when the column is JSONB.
-- Changing to TEXT allows Hibernate to insert without
-- requiring a special type converter.
-- =====================================================

ALTER TABLE production_confirmation
    ALTER COLUMN process_parameters TYPE TEXT,
    ALTER COLUMN rm_consumed TYPE TEXT;
