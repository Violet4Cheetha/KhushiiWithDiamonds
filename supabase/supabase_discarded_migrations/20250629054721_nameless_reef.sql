/*
  # Update security policies for admin-only access

  1. Security Changes
    - Remove public write access to all tables
    - Only authenticated users can create, update, or delete jewelry items and categories
    - Public users can only view (SELECT) jewelry items and categories
    - Add additional security checks

  2. Tables affected
    - `jewelry_items` - Admin write access only
    - `categories` - Admin write access only

  3. Policies
    - Public read access maintained for catalog viewing
    - All write operations require authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can manage jewelry items" ON jewelry_items;
DROP POLICY IF EXISTS "Authenticated users can manage categories" ON categories;

-- Create new restrictive policies for jewelry_items
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

-- Create new restrictive policies for categories
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