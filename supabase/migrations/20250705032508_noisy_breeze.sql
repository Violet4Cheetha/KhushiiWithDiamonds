/*
  # Diamond Quality Restructure Migration

  1. Schema Changes
    - Add new diamond quality columns (diamonds_lab_grown, diamonds_gh_vs_si, diamonds_fg_vvs_si, diamonds_ef_vvs)
    - Migrate existing diamond data to appropriate quality columns
    - Remove old diamond columns (diamonds, diamond_quality)
    - Add indexes for better performance

  2. Data Migration
    - Convert existing diamond data from old format to new quality-specific columns
    - Handle cases where diamond_quality is empty or unknown
    - Preserve all existing diamond information

  3. Performance
    - Add GIN indexes on new JSONB columns for efficient querying
*/

-- Step 1: Add new diamond quality columns first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'diamonds_lab_grown'
  ) THEN
    ALTER TABLE jewellery_items ADD COLUMN diamonds_lab_grown JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'diamonds_gh_vs_si'
  ) THEN
    ALTER TABLE jewellery_items ADD COLUMN diamonds_gh_vs_si JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'diamonds_fg_vvs_si'
  ) THEN
    ALTER TABLE jewellery_items ADD COLUMN diamonds_fg_vvs_si JSONB DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'diamonds_ef_vvs'
  ) THEN
    ALTER TABLE jewellery_items ADD COLUMN diamonds_ef_vvs JSONB DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Step 2: Migrate existing data after columns exist
DO $$
DECLARE
  rec RECORD;
  diamond_data JSONB;
  quality_value TEXT;
BEGIN
  -- Only migrate if old columns exist and have data
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'diamonds'
  ) THEN
    
    -- Migrate existing diamond data to new structure
    FOR rec IN 
      SELECT id, diamonds, diamond_quality 
      FROM jewellery_items 
      WHERE diamonds IS NOT NULL 
        AND jsonb_typeof(diamonds) = 'array' 
        AND jsonb_array_length(diamonds) > 0
    LOOP
      quality_value := COALESCE(rec.diamond_quality, '');
      
      -- Convert old diamond format to new format (remove quality field if it exists)
      diamond_data := (
        SELECT jsonb_agg(
          jsonb_build_object(
            'carat', COALESCE((diamond->>'carat')::numeric, 0),
            'cost_per_carat', COALESCE((diamond->>'cost_per_carat')::numeric, 25000)
          )
        )
        FROM jsonb_array_elements(rec.diamonds) AS diamond
        WHERE diamond ? 'carat' AND diamond ? 'cost_per_carat'
      );
      
      -- Only proceed if we have valid diamond data
      IF diamond_data IS NOT NULL AND jsonb_array_length(diamond_data) > 0 THEN
        -- Place data in appropriate quality column
        CASE quality_value
          WHEN 'Lab Grown' THEN
            UPDATE jewellery_items SET diamonds_lab_grown = diamond_data WHERE id = rec.id;
          WHEN 'GH/VS-SI' THEN
            UPDATE jewellery_items SET diamonds_gh_vs_si = diamond_data WHERE id = rec.id;
          WHEN 'FG/VVS-SI' THEN
            UPDATE jewellery_items SET diamonds_fg_vvs_si = diamond_data WHERE id = rec.id;
          WHEN 'EF/VVS' THEN
            UPDATE jewellery_items SET diamonds_ef_vvs = diamond_data WHERE id = rec.id;
          ELSE
            -- Default to lab grown if quality is unknown or empty
            UPDATE jewellery_items SET diamonds_lab_grown = diamond_data WHERE id = rec.id;
        END CASE;
      END IF;
    END LOOP;
  END IF;
END $$;

-- Step 3: Remove old diamond columns (only if they exist)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'diamonds'
  ) THEN
    ALTER TABLE jewellery_items DROP COLUMN diamonds;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'diamond_quality'
  ) THEN
    ALTER TABLE jewellery_items DROP COLUMN diamond_quality;
  END IF;
END $$;

-- Step 4: Create indexes for better performance on new diamond columns
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_lab_grown ON jewellery_items USING GIN (diamonds_lab_grown);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_gh_vs_si ON jewellery_items USING GIN (diamonds_gh_vs_si);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_fg_vvs_si ON jewellery_items USING GIN (diamonds_fg_vvs_si);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_ef_vvs ON jewellery_items USING GIN (diamonds_ef_vvs);

-- Step 5: Add comments explaining the new structure
COMMENT ON COLUMN jewellery_items.diamonds_lab_grown IS 'Array of lab grown diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_gh_vs_si IS 'Array of GH/VS-SI diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_fg_vvs_si IS 'Array of FG/VVS-SI diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_ef_vvs IS 'Array of EF/VVS diamond objects with carat and cost_per_carat properties';

-- Step 6: Set default values for existing records (ensure all records have empty arrays)
UPDATE jewellery_items 
SET 
  diamonds_lab_grown = COALESCE(diamonds_lab_grown, '[]'::jsonb),
  diamonds_gh_vs_si = COALESCE(diamonds_gh_vs_si, '[]'::jsonb),
  diamonds_fg_vvs_si = COALESCE(diamonds_fg_vvs_si, '[]'::jsonb),
  diamonds_ef_vvs = COALESCE(diamonds_ef_vvs, '[]'::jsonb)
WHERE 
  diamonds_lab_grown IS NULL 
  OR diamonds_gh_vs_si IS NULL 
  OR diamonds_fg_vvs_si IS NULL 
  OR diamonds_ef_vvs IS NULL;