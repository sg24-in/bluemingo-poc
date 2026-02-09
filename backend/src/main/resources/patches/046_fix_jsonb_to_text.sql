-- Patch 046: Fix JSONB columns to TEXT on production_confirmation
-- Root cause: Entity had columnDefinition="CLOB" which sends VARCHAR.
-- PostgreSQL JSONB rejects plain VARCHAR inserts, causing production confirmation to fail.
-- Converting to TEXT allows both JSON strings and plain text to be stored.

ALTER TABLE production_confirmation
    ALTER COLUMN process_parameters TYPE TEXT;

ALTER TABLE production_confirmation
    ALTER COLUMN rm_consumed TYPE TEXT;
