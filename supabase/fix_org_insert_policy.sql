-- Fix: Allow anyone to create organizations
-- Run this in Supabase SQL Editor

-- Drop the old policy
DROP POLICY IF EXISTS "Authenticated users can create organizations" ON organizations;

-- Create the new policy that allows anyone to create organizations
CREATE POLICY "Anyone can create organizations"
  ON organizations FOR INSERT
  WITH CHECK (true);
