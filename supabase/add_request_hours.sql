-- Add overtime hours support to existing TrustEnd databases.
-- Run this once in Supabase SQL Editor if your requests table was created before
-- the hours column was added to schema.sql.

ALTER TABLE requests
ADD COLUMN IF NOT EXISTS hours NUMERIC CHECK (hours IS NULL OR hours > 0);
