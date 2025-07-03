/*
  # Update jewelry table schema

  1. Table Changes
    - Rename `jewelry_items` table to `jewellery_items`
    - Remove legacy diamond columns: `diamond_weight`, `diamond_quality`, `diamond_cost_per_carat`
    - Rename `images` column to `image_url`

  2. Security
    - Maintain existing RLS policies on renamed table
    - Update policy references to new table name

  3. Indexes
    - Maintain existing indexes on renamed table
    - Update index references to new column names
*/

-- First, rename the table
ALTER TABLE jewelry_items RENAME TO jewellery_items;

-- Remove legacy diamond columns that are no longer needed
ALTER TABLE jewellery_items DROP COLUMN IF EXISTS diamond_weight;
ALTER TABLE jewellery_items DROP COLUMN IF EXISTS diamond_quality;
ALTER TABLE jewellery_items DROP COLUMN IF EXISTS diamond_cost_per_carat;

-- Rename images column to image_url
ALTER TABLE jewellery_items RENAME COLUMN images TO image_url;

-- Update RLS policies to reference the new table name
DROP POLICY IF EXISTS "Jewelry items are publicly readable" ON jewellery_items;
DROP POLICY IF EXISTS "Only authenticated users can delete jewelry items" ON jewellery_items;
DROP POLICY IF EXISTS "Only authenticated users can insert jewelry items" ON jewellery_items;
DROP POLICY IF EXISTS "Only authenticated users can update jewelry items" ON jewellery_items;

-- Recreate RLS policies with updated names
CREATE POLICY "Jewellery items are publicly readable"
  ON jewellery_items
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Only authenticated users can delete jewellery items"
  ON jewellery_items
  FOR DELETE
  TO authenticated
  USING (true);

CREATE POLICY "Only authenticated users can insert jewellery items"
  ON jewellery_items
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Only authenticated users can update jewellery items"
  ON jewellery_items
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Update index names to reflect new table name
DO $$
BEGIN
  -- Check if old index exists and rename it
  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'jewellery_items' 
    AND indexname = 'jewelry_items_pkey'
  ) THEN
    ALTER INDEX jewelry_items_pkey RENAME TO jewellery_items_pkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'jewellery_items' 
    AND indexname = 'idx_jewelry_items_diamonds'
  ) THEN
    ALTER INDEX idx_jewelry_items_diamonds RENAME TO idx_jewellery_items_diamonds;
  END IF;
END $$;