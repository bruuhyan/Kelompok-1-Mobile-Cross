-- Complete fix using helper functions to avoid recursion
-- Run this in Supabase SQL Editor

-- Create helper functions that bypass RLS
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

-- Drop ALL policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and supervisors can view org profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update org profiles" ON profiles;

-- Recreate profiles policies using functions
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins and supervisors can view org profiles"
  ON profiles FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

CREATE POLICY "Admins can update org profiles"
  ON profiles FOR UPDATE
  USING (
    is_user_admin()
    AND get_user_organization_id() = organization_id
  );

-- Update other policies to use functions
DROP POLICY IF EXISTS "Users can view org settings" ON org_settings;
DROP POLICY IF EXISTS "Admins can update org settings" ON org_settings;

CREATE POLICY "Users can view org settings"
  ON org_settings FOR SELECT
  USING (get_user_organization_id() = organization_id);

CREATE POLICY "Admins can update org settings"
  ON org_settings FOR ALL
  USING (
    is_user_admin()
    AND get_user_organization_id() = organization_id
  );

DROP POLICY IF EXISTS "Admins and supervisors can view org attendance" ON attendance_logs;

CREATE POLICY "Admins and supervisors can view org attendance"
  ON attendance_logs FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

DROP POLICY IF EXISTS "Admins and supervisors can view org requests" ON requests;
DROP POLICY IF EXISTS "Admins and supervisors can review requests" ON requests;

CREATE POLICY "Admins and supervisors can view org requests"
  ON requests FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

CREATE POLICY "Admins and supervisors can review requests"
  ON requests FOR UPDATE
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

DROP POLICY IF EXISTS "Admins and supervisors can view org reports" ON reports;
DROP POLICY IF EXISTS "Admins and supervisors can review reports" ON reports;

CREATE POLICY "Admins and supervisors can view org reports"
  ON reports FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

CREATE POLICY "Admins and supervisors can review reports"
  ON reports FOR UPDATE
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );
