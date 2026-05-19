-- Align organization settings storage with the mobile app.
-- Run this in Supabase SQL Editor if Settings fails to load or save.

CREATE TABLE IF NOT EXISTS org_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  gps_radius INTEGER DEFAULT 100 CHECK (gps_radius >= 10 AND gps_radius <= 1000),
  workplace_lat NUMERIC,
  workplace_lng NUMERIC,
  wifi_ssid TEXT,
  wifi_bssid TEXT,
  ip_range TEXT,
  work_start_time TIME DEFAULT '09:00',
  work_end_time TIME DEFAULT '17:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE org_settings
  ADD COLUMN IF NOT EXISTS work_start_time TIME DEFAULT '09:00',
  ADD COLUMN IF NOT EXISTS work_end_time TIME DEFAULT '17:00';

ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org settings" ON org_settings;
DROP POLICY IF EXISTS "Admins can update org settings" ON org_settings;

CREATE POLICY "Users can view org settings"
  ON org_settings FOR SELECT
  USING (get_user_organization_id() = organization_id);

CREATE POLICY "Admins can update org settings"
  ON org_settings FOR ALL
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  )
  WITH CHECK (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );
