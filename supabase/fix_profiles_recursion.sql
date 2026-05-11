-- Fix: Add INSERT policy for profiles and fix recursion in all policies
-- Run this in Supabase SQL Editor

-- Drop problematic policies that cause recursion
DROP POLICY IF EXISTS "Admins can update org profiles" ON profiles;
DROP POLICY IF EXISTS "Admins and supervisors can view org profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update org settings" ON org_settings;
DROP POLICY IF EXISTS "Users can view org settings" ON org_settings;
DROP POLICY IF EXISTS "Admins and supervisors can view org attendance" ON attendance_logs;
DROP POLICY IF EXISTS "Admins and supervisors can view org requests" ON requests;
DROP POLICY IF EXISTS "Admins and supervisors can review requests" ON requests;
DROP POLICY IF EXISTS "Admins and supervisors can view org reports" ON reports;
DROP POLICY IF EXISTS "Admins and supervisors can review reports" ON reports;

-- Add INSERT policy for profiles (allows users to create their own profile)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Recreate admin/supervisor view policy with simpler logic
CREATE POLICY "Admins and supervisors can view org profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'supervisor')
      AND p.organization_id = profiles.organization_id
    )
  );

-- Recreate admin update policy with simpler logic
CREATE POLICY "Admins can update org profiles"
  ON profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.organization_id = profiles.organization_id
    )
  );

-- Recreate org settings policies
CREATE POLICY "Users can view org settings"
  ON org_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.organization_id = org_settings.organization_id
    )
  );

CREATE POLICY "Admins can update org settings"
  ON org_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.organization_id = org_settings.organization_id
    )
  );

-- Recreate attendance policies
CREATE POLICY "Admins and supervisors can view org attendance"
  ON attendance_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'supervisor')
      AND p.organization_id = attendance_logs.organization_id
    )
  );

-- Recreate requests policies
CREATE POLICY "Admins and supervisors can view org requests"
  ON requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'supervisor')
      AND p.organization_id = requests.organization_id
    )
  );

CREATE POLICY "Admins and supervisors can review requests"
  ON requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'supervisor')
      AND p.organization_id = requests.organization_id
    )
  );

-- Recreate reports policies
CREATE POLICY "Admins and supervisors can view org reports"
  ON reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'supervisor')
      AND p.organization_id = reports.organization_id
    )
  );

CREATE POLICY "Admins and supervisors can review reports"
  ON reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles AS p
      WHERE p.id = auth.uid()
      AND p.role IN ('admin', 'supervisor')
      AND p.organization_id = reports.organization_id
    )
  );
