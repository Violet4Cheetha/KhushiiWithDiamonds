/*
  # Restructure Diamond Quality System

  1. Schema Changes
    - Remove old `diamonds` and `diamond_quality` columns
    - Add new diamond quality specific columns:
      - `diamonds_lab_grown` (JSONB)
      - `diamonds_gh_vs_si` (JSONB)
      - `diamonds_fg_vvs_si` (JSONB)
      - `diamonds_ef_vvs` (JSONB)

  2. Data Migration
    - Migrate existing diamond data to appropriate quality columns
    - Each column stores array of objects: [{"carat": number, "cost_per_carat": number}]

  3. Performance
    - Add GIN indexes for each diamond quality column
*/

-- First, migrate existing data before dropping columns
DO $$
DECLARE
  rec RECORD;
  diamond_data JSONB;
  quality_value TEXT;
BEGIN
  -- Migrate existing diamond data to new structure
  FOR rec IN SELECT id, diamonds, diamond_quality FROM jewellery_items WHERE diamonds IS NOT NULL AND jsonb_array_length(diamonds) > 0
  LOOP
    quality_value := COALESCE(rec.diamond_quality, '');
    
    -- Convert old diamond format to new format (remove quality field)
    diamond_data := (
      SELECT jsonb_agg(
        jsonb_build_object(
          'carat', (diamond->>'carat')::numeric,
          'cost_per_carat', (diamond->>'cost_per_carat')::numeric
        )
      )
      FROM jsonb_array_elements(rec.diamonds) AS diamond
    );
    
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
        -- Default to lab grown if quality is unknown
        UPDATE jewellery_items SET diamonds_lab_grown = diamond_data WHERE id = rec.id;
    END CASE;
  END LOOP;
END $$;

-- Add new diamond quality columns if they don't exist
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

-- Remove old diamond columns
ALTER TABLE jewellery_items DROP COLUMN IF EXISTS diamonds;
ALTER TABLE jewellery_items DROP COLUMN IF EXISTS diamond_quality;

-- Create indexes for better performance on new diamond columns
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_lab_grown ON jewellery_items USING GIN (diamonds_lab_grown);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_gh_vs_si ON jewellery_items USING GIN (diamonds_gh_vs_si);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_fg_vvs_si ON jewellery_items USING GIN (diamonds_fg_vvs_si);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_ef_vvs ON jewellery_items USING GIN (diamonds_ef_vvs);

-- Add comments explaining the new structure
COMMENT ON COLUMN jewellery_items.diamonds_lab_grown IS 'Array of lab grown diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_gh_vs_si IS 'Array of GH/VS-SI diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_fg_vvs_si IS 'Array of FG/VVS-SI diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_ef_vvs IS 'Array of EF/VVS diamond objects with carat and cost_per_carat properties';