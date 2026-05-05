-- Create helper function to check user role without recursion
-- Run this in Supabase SQL Editor

-- Create a function that checks if user is admin/supervisor
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

-- Create a function to check if user is admin
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

-- Create a function to get user's organization_id
CREATE OR REPLACE FUNCTION get_user_organization_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- Now drop and recreate profiles policies using these functions
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and supervisors can view org profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update org profiles" ON profiles;

-- Recreate policies
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
