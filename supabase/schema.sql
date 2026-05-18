-- TrustEnd Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Organizations table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'supervisor', 'employee')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended')),
  trust_score INTEGER DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(email, organization_id)
);

-- Organization Settings table
CREATE TABLE IF NOT EXISTS org_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  gps_radius INTEGER DEFAULT 100 CHECK (gps_radius >= 10 AND gps_radius <= 1000),
  workplace_lat NUMERIC,
  workplace_lng NUMERIC,
  wifi_ssid TEXT,
  wifi_bssid TEXT,
  ip_range TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Logs table
CREATE TABLE IF NOT EXISTS attendance_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  check_out_time TIMESTAMP WITH TIME ZONE,
  check_in_lat NUMERIC,
  check_in_lng NUMERIC,
  check_out_lat NUMERIC,
  check_out_lng NUMERIC,
  check_in_wifi_ssid TEXT,
  check_in_wifi_bssid TEXT,
  check_out_wifi_ssid TEXT,
  check_out_wifi_bssid TEXT,
  check_in_ip TEXT,
  check_out_ip TEXT,
  validation_flags JSONB DEFAULT '{}'::jsonb,
  offense_count INTEGER DEFAULT 0,
  review_status TEXT DEFAULT 'okay' CHECK (review_status IN ('okay', 'needs_review', 'urgent_review')),
  duration_minutes INTEGER,
  offline_client_id TEXT UNIQUE,
  offline_sequence INTEGER,
  is_late BOOLEAN DEFAULT FALSE,
  trust_score_impact INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Backward-compatible Phase 5 migrations for existing databases
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_trust_score_check;
UPDATE profiles SET trust_score = LEAST(50, GREATEST(0, COALESCE(trust_score, 50)));
ALTER TABLE profiles ADD CONSTRAINT profiles_trust_score_check CHECK (trust_score >= 0 AND trust_score <= 50);
ALTER TABLE profiles ALTER COLUMN trust_score SET DEFAULT 50;

ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS validation_flags JSONB DEFAULT '{}'::jsonb;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS offense_count INTEGER DEFAULT 0;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'okay';
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS duration_minutes INTEGER;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS offline_client_id TEXT UNIQUE;
ALTER TABLE attendance_logs ADD COLUMN IF NOT EXISTS offline_sequence INTEGER;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attendance_logs_review_status_check'
  ) THEN
    ALTER TABLE attendance_logs
      ADD CONSTRAINT attendance_logs_review_status_check
      CHECK (review_status IN ('okay', 'needs_review', 'urgent_review'));
  END IF;
END;
$$;

-- Requests table (holiday/overtime)
CREATE TABLE IF NOT EXISTS requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('holiday', 'overtime')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Reports table
CREATE TABLE IF NOT EXISTS reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status ON profiles(status);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_org ON attendance_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance_logs(check_in_time);
CREATE INDEX IF NOT EXISTS idx_attendance_offline_client_id ON attendance_logs(offline_client_id);
CREATE INDEX IF NOT EXISTS idx_requests_user ON requests(user_id);
CREATE INDEX IF NOT EXISTS idx_requests_org ON requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_requests_status ON requests(status);
CREATE INDEX IF NOT EXISTS idx_reports_user ON reports(user_id);
CREATE INDEX IF NOT EXISTS idx_reports_org ON reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_org_settings_updated_at
  BEFORE UPDATE ON org_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_requests_updated_at
  BEFORE UPDATE ON requests
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reports_updated_at
  BEFORE UPDATE ON reports
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION trust_score_penalty_for_offense(offense_number INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF offense_number <= 1 THEN
    RETURN 3;
  ELSIF offense_number = 2 THEN
    RETURN 5;
  ELSIF offense_number = 3 THEN
    RETURN 7;
  ELSIF offense_number = 4 THEN
    RETURN 10;
  ELSE
    RETURN 15;
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION trust_review_status(score INTEGER)
RETURNS TEXT AS $$
BEGIN
  IF score >= 36 THEN
    RETURN 'okay';
  ELSIF score >= 20 THEN
    RETURN 'needs_review';
  ELSE
    RETURN 'urgent_review';
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE OR REPLACE FUNCTION attendance_log_has_offense(log_row attendance_logs)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN COALESCE(log_row.is_late, FALSE)
    OR COALESCE((log_row.validation_flags->>'gps_valid')::BOOLEAN, TRUE) = FALSE
    OR COALESCE((log_row.validation_flags->>'wifi_valid')::BOOLEAN, TRUE) = FALSE
    OR COALESCE((log_row.validation_flags->>'ip_suspicious')::BOOLEAN, FALSE) = TRUE
    OR COALESCE((log_row.validation_flags->>'spoofing_detected')::BOOLEAN, FALSE) = TRUE
    OR COALESCE((log_row.validation_flags->>'offline_submission')::BOOLEAN, FALSE) = TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION prepare_attendance_trust_impact()
RETURNS TRIGGER AS $$
DECLARE
  prior_offenses INTEGER;
  projected_score INTEGER;
BEGIN
  IF NEW.check_out_time IS NOT NULL AND NEW.check_in_time IS NOT NULL THEN
    NEW.duration_minutes := GREATEST(
      0,
      FLOOR(EXTRACT(EPOCH FROM (NEW.check_out_time - NEW.check_in_time)) / 60)
    );
  END IF;

  IF attendance_log_has_offense(NEW) THEN
    SELECT COUNT(*)
      INTO prior_offenses
      FROM attendance_logs
      WHERE user_id = NEW.user_id
        AND id IS DISTINCT FROM NEW.id
        AND check_in_time >= NOW() - INTERVAL '30 days'
        AND trust_score_impact < 0;

    NEW.offense_count := prior_offenses + 1;
    NEW.trust_score_impact := -trust_score_penalty_for_offense(NEW.offense_count);
  ELSE
    NEW.offense_count := 0;
    NEW.trust_score_impact := 0;
  END IF;

  SELECT GREATEST(0, LEAST(50, 50 + COALESCE(SUM(trust_score_impact), 0) + NEW.trust_score_impact))
    INTO projected_score
    FROM attendance_logs
    WHERE user_id = NEW.user_id
      AND id IS DISTINCT FROM NEW.id
      AND check_in_time >= NOW() - INTERVAL '30 days';

  NEW.review_status := trust_review_status(projected_score);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recalculate_user_trust_score(target_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  new_score INTEGER;
  new_status TEXT;
BEGIN
  SELECT GREATEST(0, LEAST(50, 50 + COALESCE(SUM(trust_score_impact), 0)))
    INTO new_score
    FROM attendance_logs
    WHERE user_id = target_user_id
      AND check_in_time >= NOW() - INTERVAL '30 days';

  new_score := COALESCE(new_score, 50);
  new_status := trust_review_status(new_score);

  UPDATE profiles
    SET trust_score = new_score
    WHERE id = target_user_id;

  RETURN jsonb_build_object(
    'score', new_score,
    'review_status', new_status
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION recalculate_user_trust_score_after_attendance()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM recalculate_user_trust_score(NEW.user_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS prepare_attendance_trust_impact_trigger ON attendance_logs;
CREATE TRIGGER prepare_attendance_trust_impact_trigger
  BEFORE INSERT OR UPDATE ON attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION prepare_attendance_trust_impact();

DROP TRIGGER IF EXISTS recalculate_user_trust_score_after_attendance_trigger ON attendance_logs;
CREATE TRIGGER recalculate_user_trust_score_after_attendance_trigger
  AFTER INSERT OR UPDATE ON attendance_logs
  FOR EACH ROW
  EXECUTE FUNCTION recalculate_user_trust_score_after_attendance();

CREATE OR REPLACE FUNCTION sync_offline_attendance(
  offline_log JSONB,
  client_hash TEXT
)
RETURNS JSONB AS $$
DECLARE
  inserted_log attendance_logs;
  age_hours NUMERIC;
  log_type TEXT;
  target_log_id UUID;
BEGIN
  IF client_hash IS NULL OR client_hash <> offline_log->>'integrity_hash' THEN
    RETURN jsonb_build_object('verified', FALSE, 'reason', 'integrity_hash_mismatch');
  END IF;

  age_hours := EXTRACT(EPOCH FROM (NOW() - to_timestamp((offline_log->>'timestamp')::BIGINT / 1000))) / 3600;
  IF age_hours > 24 THEN
    RETURN jsonb_build_object('verified', FALSE, 'reason', 'exceeded_24h_limit');
  END IF;

  log_type := offline_log->>'type';

  IF log_type = 'check_in' THEN
    INSERT INTO attendance_logs (
      user_id,
      organization_id,
      check_in_time,
      check_in_lat,
      check_in_lng,
      check_in_wifi_ssid,
      check_in_wifi_bssid,
      check_in_ip,
      validation_flags,
      offline_client_id,
      offline_sequence
    )
    VALUES (
      (offline_log->>'user_id')::UUID,
      (offline_log->>'organization_id')::UUID,
      to_timestamp((offline_log->>'timestamp')::BIGINT / 1000),
      NULLIF(offline_log#>>'{location,latitude}', '')::NUMERIC,
      NULLIF(offline_log#>>'{location,longitude}', '')::NUMERIC,
      offline_log#>>'{wifi,ssid}',
      offline_log#>>'{wifi,bssid}',
      offline_log->>'ip_address',
      jsonb_build_object(
        'gps_valid', COALESCE((offline_log#>>'{validation,gps,isValid}')::BOOLEAN, FALSE),
        'wifi_valid', COALESCE((offline_log#>>'{validation,wifi,isValid}')::BOOLEAN, FALSE),
        'ip_valid', COALESCE((offline_log#>>'{validation,ip,isValid}')::BOOLEAN, TRUE),
        'ip_suspicious', COALESCE((offline_log#>>'{validation,ip,isSuspicious}')::BOOLEAN, FALSE),
        'spoofing_detected', COALESCE((offline_log#>>'{validation,spoofing,isSuspicious}')::BOOLEAN, FALSE),
        'offline_submission', TRUE
      ),
      offline_log->>'id',
      (offline_log->>'sequence_number')::INTEGER
    )
    ON CONFLICT (offline_client_id) DO UPDATE
      SET offline_client_id = EXCLUDED.offline_client_id
    RETURNING * INTO inserted_log;

    RETURN jsonb_build_object('verified', TRUE, 'attendance_log', to_jsonb(inserted_log));
  ELSIF log_type = 'check_out' THEN
    target_log_id := NULLIF(offline_log->>'log_id', '')::UUID;

    UPDATE attendance_logs
      SET check_out_time = to_timestamp((offline_log->>'timestamp')::BIGINT / 1000),
          check_out_lat = NULLIF(offline_log#>>'{location,latitude}', '')::NUMERIC,
          check_out_lng = NULLIF(offline_log#>>'{location,longitude}', '')::NUMERIC,
          check_out_wifi_ssid = offline_log#>>'{wifi,ssid}',
          check_out_wifi_bssid = offline_log#>>'{wifi,bssid}',
          check_out_ip = offline_log->>'ip_address'
      WHERE id = target_log_id
        AND user_id = (offline_log->>'user_id')::UUID
      RETURNING * INTO inserted_log;

    IF inserted_log.id IS NULL THEN
      RETURN jsonb_build_object('verified', FALSE, 'reason', 'active_log_not_found');
    END IF;

    RETURN jsonb_build_object('verified', TRUE, 'attendance_log', to_jsonb(inserted_log));
  END IF;

  RETURN jsonb_build_object('verified', FALSE, 'reason', 'unknown_log_type');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
