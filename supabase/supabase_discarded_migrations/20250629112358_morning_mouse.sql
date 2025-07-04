/*
  # Fix Row Level Security for Public Access

  1. Security Changes
    - Ensure public users can read categories and jewelry items
    - Fix any policy conflicts that might block public access
    - Maintain admin-only write access

  2. Tables affected
    - `categories` - Fix public read access
    - `jewelry_items` - Fix public read access
    - `admin_settings` - Keep admin-only access

  3. Policy Updates
    - Drop and recreate public read policies with proper permissions
    - Ensure no conflicting policies exist
*/

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Categories are publicly readable" ON categories;
DROP POLICY IF EXISTS "Jewelry items are publicly readable" ON jewelry_items;
DROP POLICY IF EXISTS "Only authenticated users can insert categories" ON categories;
DROP POLICY IF EXISTS "Only authenticated users can update categories" ON categories;
DROP POLICY IF EXISTS "Only authenticated users can delete categories" ON categories;
DROP POLICY IF EXISTS "Only authenticated users can insert jewelry items" ON jewelry_items;
DROP POLICY IF EXISTS "Only authenticated users can update jewelry items" ON jewelry_items;
DROP POLICY IF EXISTS "Only authenticated users can delete jewelry items" ON jewelry_items;

-- Create new policies for categories
CREATE POLICY "Categories are publicly readable"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Create new policies for jewelry_items
CREATE POLICY "Jewelry items are publicly readable"
  ON jewelry_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can insert jewelry items"
  ON jewelry_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update jewelry items"
  ON jewelry_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can delete jewelry items"
  ON jewelry_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Verify RLS is enabled (should already be enabled)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;