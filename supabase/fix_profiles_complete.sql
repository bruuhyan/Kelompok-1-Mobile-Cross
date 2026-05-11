-- Complete fix for profiles recursion
-- Run this in Supabase SQL Editor

-- Drop ALL policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can create own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins and supervisors can view org profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update org profiles" ON profiles;

-- Recreate all profiles policies in correct order
-- 1. INSERT policy (must be first and simplest)
CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 2. SELECT policies
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

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

-- 3. UPDATE policies
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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
