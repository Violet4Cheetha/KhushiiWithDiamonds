/*
  # Add Multiple Diamonds Support

  1. Schema Changes
    - Add `diamonds` JSONB column to store array of diamond objects
    - Each diamond object contains: carat, quality, cost_per_carat
    - Keep existing diamond columns for backward compatibility
    - Add migration logic to convert existing single diamond data

  2. Data Structure
    - diamonds: [{ carat: number, quality: string, cost_per_carat: number }]
    - Allows unlimited number of diamonds per jewelry item

  3. Backward Compatibility
    - Existing single diamond fields remain functional
    - Migration converts existing data to new format
*/

-- Add new diamonds column to store multiple diamonds as JSONB array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewelry_items' AND column_name = 'diamonds'
  ) THEN
    ALTER TABLE jewelry_items ADD COLUMN diamonds JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Migrate existing single diamond data to new multiple diamonds format
UPDATE jewelry_items 
SET diamonds = CASE 
  WHEN diamond_weight > 0 THEN 
    jsonb_build_array(
      jsonb_build_object(
        'carat', diamond_weight,
        'quality', COALESCE(diamond_quality, ''),
        'cost_per_carat', COALESCE(diamond_cost_per_carat, 0)
      )
    )
  ELSE '[]'::jsonb
END
WHERE diamonds = '[]'::jsonb OR diamonds IS NULL;

-- Add index for better performance on diamonds column
CREATE INDEX IF NOT EXISTS idx_jewelry_items_diamonds ON jewelry_items USING GIN (diamonds);

-- Add comment explaining the new structure
COMMENT ON COLUMN jewelry_items.diamonds IS 'Array of diamond objects with carat, quality, and cost_per_carat properties';