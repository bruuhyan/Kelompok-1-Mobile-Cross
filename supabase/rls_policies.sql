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

CREATE OR REPLACE FUNCTION create_organization_with_admin(
  p_name TEXT,
  p_address TEXT,
  p_code TEXT,
  p_admin_name TEXT,
  p_admin_email TEXT
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

REVOKE EXECUTE ON FUNCTION create_organization_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION create_organization_with_admin(TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;

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
CREATE POLICY "Organizations are viewable by everyone"
  ON organizations FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can create organizations" ON organizations;
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Allow authenticated users to create organizations.
-- The app uses create_organization_with_admin() so the first admin profile is created atomically.
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Profiles policies
-- Users can read their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can create own profile" ON profiles;

-- Users can create their own profile (must come before admin policies to avoid recursion)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id
    AND role = 'employee'
    AND status = 'pending'
  );

-- Users can update their own profile
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

DROP POLICY IF EXISTS "Admins can update org profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and supervisors can update org profiles" ON profiles;

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
CREATE POLICY "Users can view org settings"
  ON org_settings FOR SELECT
  USING (get_user_organization_id() = organization_id);

-- Admins can update organization settings
CREATE POLICY "Admins can update org settings"
  ON org_settings FOR ALL
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Attendance Logs policies
-- Users can read their own attendance logs
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

-- Admins and supervisors can view all attendance in their organization
CREATE POLICY "Admins and supervisors can view org attendance"
  ON attendance_logs FOR SELECT
  USING (
    is_user_admin_or_supervisor()
    AND get_user_organization_id() = organization_id
  );

-- Requests policies
-- Users can read their own requests
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
