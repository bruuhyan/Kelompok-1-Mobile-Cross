-- Add ignore_checkin_time column to org_settings
-- Run this in Supabase SQL Editor

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS ignore_checkin_time BOOLEAN DEFAULT FALSE;
