/*
  # Add diamond_quality column to jewellery_items table

  1. Schema Changes
    - Add `diamond_quality` (text) column to store single quality for all diamonds
    - Set default value to empty string for consistency

  2. Data Migration
    - For existing items with diamonds, extract quality from first diamond if available
    - Set diamond_quality field appropriately

  3. Notes
    - This supports the new single diamond quality feature
    - Individual diamonds no longer need quality field
    - All diamonds in an item share the same quality
*/

-- Add diamond_quality column to jewellery_items table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'diamond_quality'
  ) THEN
    ALTER TABLE jewellery_items ADD COLUMN diamond_quality text DEFAULT '';
  END IF;
END $$;

-- Migrate existing diamond quality data from diamonds JSONB array
UPDATE jewellery_items 
SET diamond_quality = CASE 
  WHEN diamonds IS NOT NULL AND jsonb_array_length(diamonds) > 0 THEN
    COALESCE(diamonds->0->>'quality', '')
  ELSE ''
END
WHERE diamond_quality = '' OR diamond_quality IS NULL;

-- Add comment explaining the new column
COMMENT ON COLUMN jewellery_items.diamond_quality IS 'Single quality that applies to all diamonds in this jewellery item';