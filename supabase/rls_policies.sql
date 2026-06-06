-- Row Level Security (RLS) Policies for TrustEnd
-- Run this in Supabase SQL Editor after schema.sql

-- Create helper functions that bypass RLS to avoid recursion
CREATE OR REPLACE FUNCTION is_user_admin_or_supervisor()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role IN ('admin', 'supervisor')
  );
$$;

CREATE OR REPLACE FUNCTION is_user_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'disbanded'));

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS disbanded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS disbanded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS disband_reason TEXT;

DROP FUNCTION IF EXISTS create_organization_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_organization_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_organization_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT);

CREATE OR REPLACE FUNCTION create_organization_with_admin(
  p_name TEXT,
  p_address TEXT,
  p_code TEXT,
  p_admin_name TEXT,
  p_admin_email TEXT,
  p_latitude NUMERIC DEFAULT NULL,
  p_longitude NUMERIC DEFAULT NULL,
  p_wifi_ssid TEXT DEFAULT NULL,
  p_wifi_bssid TEXT DEFAULT NULL,
  p_ip_range TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id UUID;
  current_user_id UUID;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = current_user_id) THEN
    RAISE EXCEPTION 'Profile already exists for this user';
  END IF;

  INSERT INTO public.organizations (name, address, code)
  VALUES (p_name, p_address, p_code)
  RETURNING id INTO new_org_id;

  INSERT INTO public.org_settings (
    organization_id,
    workplace_lat,
    workplace_lng,
    wifi_ssid,
    wifi_bssid,
    ip_range
  )
  VALUES (
    new_org_id,
    p_latitude,
    p_longitude,
    NULLIF(TRIM(p_wifi_ssid), ''),
    NULLIF(UPPER(TRIM(p_wifi_bssid)), ''),
    NULLIF(TRIM(p_ip_range), '')
  )
  ON CONFLICT (organization_id) DO UPDATE
  SET
    workplace_lat = EXCLUDED.workplace_lat,
    workplace_lng = EXCLUDED.workplace_lng,
    wifi_ssid = EXCLUDED.wifi_ssid,
    wifi_bssid = EXCLUDED.wifi_bssid,
    ip_range = EXCLUDED.ip_range,
    updated_at = NOW();

  INSERT INTO public.profiles (
    id,
    name,
    email,
    organization_id,
    role,
    status
  )
  VALUES (
    current_user_id,
    p_admin_name,
    p_admin_email,
    new_org_id,
    'admin',
    'active'
  );

  RETURN new_org_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION create_organization_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION create_organization_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT, NUMERIC, NUMERIC, TEXT, TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS leave_organization(TEXT);
CREATE OR REPLACE FUNCTION leave_organization(p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_profile RECORD;
  active_admin_count INTEGER;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO current_profile
  FROM public.profiles
  WHERE id = current_user_id;

  IF current_profile.id IS NULL THEN
    RAISE EXCEPTION 'No organization profile found for this account';
  END IF;

  IF current_profile.role = 'admin' THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM public.profiles
    WHERE organization_id = current_profile.organization_id
      AND role = 'admin'
      AND status = 'active';

    IF active_admin_count <= 1 THEN
      RAISE EXCEPTION 'You are the last admin. Disband the organization or add another admin first.';
    END IF;
  END IF;

  UPDATE public.requests
  SET reviewed_by = NULL
  WHERE reviewed_by = current_user_id;

  UPDATE public.reports
  SET reviewed_by = NULL
  WHERE reviewed_by = current_user_id;

  UPDATE public.tasks
  SET reviewed_by = NULL
  WHERE reviewed_by = current_user_id;

  DELETE FROM public.tasks
  WHERE created_by = current_user_id;

  DELETE FROM public.profiles
  WHERE id = current_user_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION leave_organization(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION leave_organization(TEXT) TO authenticated;

DROP FUNCTION IF EXISTS disband_organization(TEXT);
CREATE OR REPLACE FUNCTION disband_organization(p_reason TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_profile RECORD;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO current_profile
  FROM public.profiles
  WHERE id = current_user_id;

  IF current_profile.id IS NULL THEN
    RAISE EXCEPTION 'No organization profile found for this account';
  END IF;

  IF current_profile.role <> 'admin' THEN
    RAISE EXCEPTION 'Only organization admins can disband an organization';
  END IF;

  UPDATE public.organizations
  SET
    status = 'disbanded',
    disbanded_at = NOW(),
    disbanded_by = current_user_id,
    disband_reason = NULLIF(TRIM(p_reason), ''),
    updated_at = NOW()
  WHERE id = current_profile.organization_id
    AND status = 'active';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Organization is already disbanded or unavailable';
  END IF;

  UPDATE public.requests
  SET reviewed_by = NULL
  WHERE organization_id = current_profile.organization_id;

  UPDATE public.reports
  SET reviewed_by = NULL
  WHERE organization_id = current_profile.organization_id;

  UPDATE public.tasks
  SET reviewed_by = NULL
  WHERE organization_id = current_profile.organization_id;

  DELETE FROM public.tasks
  WHERE organization_id = current_profile.organization_id;

  DELETE FROM public.profiles
  WHERE organization_id = current_profile.organization_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION disband_organization(TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION disband_organization(TEXT) TO authenticated;

DROP FUNCTION IF EXISTS update_org_member_role(UUID, TEXT);
CREATE OR REPLACE FUNCTION update_org_member_role(
  p_member_id UUID,
  p_role TEXT
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_user_id UUID;
  current_profile RECORD;
  target_profile public.profiles%ROWTYPE;
  active_admin_count INTEGER;
  updated_profile public.profiles%ROWTYPE;
BEGIN
  current_user_id := auth.uid();

  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_role NOT IN ('employee', 'supervisor', 'admin') THEN
    RAISE EXCEPTION 'Invalid role';
  END IF;

  SELECT * INTO current_profile
  FROM public.profiles
  WHERE id = current_user_id;

  IF current_profile.id IS NULL OR current_profile.role <> 'admin' THEN
    RAISE EXCEPTION 'Only organization admins can update member roles';
  END IF;

  IF p_member_id = current_user_id THEN
    RAISE EXCEPTION 'You cannot change your own role';
  END IF;

  SELECT * INTO target_profile
  FROM public.profiles
  WHERE id = p_member_id
    AND organization_id = current_profile.organization_id;

  IF target_profile.id IS NULL THEN
    RAISE EXCEPTION 'Member not found in your organization';
  END IF;

  IF target_profile.status <> 'active' THEN
    RAISE EXCEPTION 'Only active members can be promoted or demoted';
  END IF;

  IF target_profile.role = 'admin' AND p_role <> 'admin' THEN
    SELECT COUNT(*) INTO active_admin_count
    FROM public.profiles
    WHERE organization_id = current_profile.organization_id
      AND role = 'admin'
      AND status = 'active';

    IF active_admin_count <= 1 THEN
      RAISE EXCEPTION 'At least one active admin must remain in the organization';
    END IF;
  END IF;

  UPDATE public.profiles
  SET role = p_role
  WHERE id = p_member_id
  RETURNING * INTO updated_profile;

  RETURN updated_profile;
END;
$$;

REVOKE EXECUTE ON FUNCTION update_org_member_role(UUID, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION update_org_member_role(UUID, TEXT) TO authenticated;

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE org_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Organizations policies
-- Allow public read for organization lookup by code
DROP POLICY IF EXISTS "Organizations are viewable by everyone" ON organizations;
DROP POLICY IF EXISTS "Anyone can create organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

CREATE POLICY "Organizations are viewable by everyone"
  ON organizations FOR SELECT
  USING (status = 'active');

-- Allow authenticated users to create organizations.
-- The app uses create_organization_with_admin() so the first admin profile is created atomically.
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Profiles policies
-- Users can read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and supervisors can view org profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update org profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and supervisors can update org profiles" ON profiles;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can create their own profile (must come before admin policies to avoid recursion)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'employee'
    AND status = 'pending'
  );

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins and supervisors can view all profiles in their organization
CREATE POLICY "Admins and supervisors can view org profiles"
  ON profiles FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Admins and supervisors can update profiles in their organization
CREATE POLICY "Admins and supervisors can update org profiles"
  ON profiles FOR UPDATE
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  )
  WITH CHECK (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Org Settings policies
-- Users can read their organization's settings
DROP POLICY IF EXISTS "Users can view org settings" ON org_settings;
DROP POLICY IF EXISTS "Admins can update org settings" ON org_settings;

CREATE POLICY "Users can view org settings"
  ON org_settings FOR SELECT
  USING (get_user_organization_id() = organization_id);

-- Admins can update organization settings
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

-- Attendance Logs policies
-- Users can read their own attendance logs
DROP POLICY IF EXISTS "Users can view own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Users can create own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Users can update own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Users can delete own attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Admins and supervisors can view org attendance" ON attendance_logs;

CREATE POLICY "Users can view own attendance"
  ON attendance_logs FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own attendance logs
CREATE POLICY "Users can create own attendance"
  ON attendance_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own attendance logs (for check-out)
CREATE POLICY "Users can update own attendance"
  ON attendance_logs FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Users can delete their own attendance logs (debug/reset flow)
CREATE POLICY "Users can delete own attendance"
  ON attendance_logs FOR DELETE
  USING (user_id = auth.uid());

-- Admins and supervisors can view all attendance in their organization
CREATE POLICY "Admins and supervisors can view org attendance"
  ON attendance_logs FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Requests policies
-- Users can read their own requests
DROP POLICY IF EXISTS "Users can view own requests" ON requests;
DROP POLICY IF EXISTS "Users can create own requests" ON requests;
DROP POLICY IF EXISTS "Users can update own requests" ON requests;
DROP POLICY IF EXISTS "Admins and supervisors can view org requests" ON requests;
DROP POLICY IF EXISTS "Admins and supervisors can review requests" ON requests;

CREATE POLICY "Users can view own requests"
  ON requests FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own requests
CREATE POLICY "Users can create own requests"
  ON requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own requests (before review)
CREATE POLICY "Users can update own requests"
  ON requests FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

-- Admins and supervisors can view all requests in their organization
CREATE POLICY "Admins and supervisors can view org requests"
  ON requests FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Admins and supervisors can review requests in their organization
CREATE POLICY "Admins and supervisors can review requests"
  ON requests FOR UPDATE
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Reports policies
-- Users can read their own reports
DROP POLICY IF EXISTS "Users can view own reports" ON reports;
DROP POLICY IF EXISTS "Users can create own reports" ON reports;
DROP POLICY IF EXISTS "Users can update own reports" ON reports;
DROP POLICY IF EXISTS "Admins and supervisors can view org reports" ON reports;
DROP POLICY IF EXISTS "Admins and supervisors can review reports" ON reports;

CREATE POLICY "Users can view own reports"
  ON reports FOR SELECT
  USING (user_id = auth.uid());

-- Users can create their own reports
CREATE POLICY "Users can create own reports"
  ON reports FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can update their own reports (before review)
CREATE POLICY "Users can update own reports"
  ON reports FOR UPDATE
  USING (user_id = auth.uid() AND status = 'pending');

-- Admins and supervisors can view all reports in their organization
CREATE POLICY "Admins and supervisors can view org reports"
  ON reports FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Admins and supervisors can review reports in their organization
CREATE POLICY "Admins and supervisors can review reports"
  ON reports FOR UPDATE
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Tasks policies
-- Employees can view their assigned tasks
DROP POLICY IF EXISTS "Employees can view own tasks" ON tasks;
DROP POLICY IF EXISTS "Employees can submit own assigned tasks" ON tasks;
DROP POLICY IF EXISTS "Supervisors can view org tasks" ON tasks;
DROP POLICY IF EXISTS "Supervisors can create org tasks" ON tasks;
DROP POLICY IF EXISTS "Supervisors can review org tasks" ON tasks;

CREATE POLICY "Employees can view own tasks"
  ON tasks FOR SELECT
  USING (assigned_to = auth.uid());

-- Employees can update tasks they need to submit
CREATE POLICY "Employees can submit own assigned tasks"
  ON tasks FOR UPDATE
  USING (assigned_to = auth.uid() AND status IN ('assigned', 'rejected'))
  WITH CHECK (assigned_to = auth.uid());

-- Admins and supervisors can view all tasks in their organization
CREATE POLICY "Supervisors can view org tasks"
  ON tasks FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Admins and supervisors can assign tasks in their organization
CREATE POLICY "Supervisors can create org tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
    AND created_by = auth.uid()
  );

-- Admins and supervisors can review tasks in their organization
CREATE POLICY "Supervisors can review org tasks"
  ON tasks FOR UPDATE
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  )
  WITH CHECK (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Account deletion request support
CREATE TABLE IF NOT EXISTS account_deletion_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
  requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

ALTER TABLE account_deletion_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can create own deletion request" ON account_deletion_requests;
DROP POLICY IF EXISTS "Users can view own deletion requests" ON account_deletion_requests;
DROP POLICY IF EXISTS "Supervisors can view org deletion requests" ON account_deletion_requests;

CREATE POLICY "Users can create own deletion request"
  ON account_deletion_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Supervisors can view org deletion requests"
  ON account_deletion_requests FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );
