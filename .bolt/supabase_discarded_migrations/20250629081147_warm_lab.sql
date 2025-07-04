/*
  # Add diamond cost and making price fields

  1. Schema Changes
    - Add `diamond_cost_per_carat` (numeric) - Cost per carat for diamonds
    - Add `making_charges_per_gram` (numeric) - Making charges per gram of gold
    - Update existing `base_price` to be used for additional costs (stones, design complexity, etc.)

  2. Data Migration
    - Set default values for existing records
    - Ensure all new records have proper defaults

  3. Notes
    - Diamond cost will be calculated as: diamond_weight * diamond_cost_per_carat
    - Making charges will be calculated as: gold_weight * making_charges_per_gram
    - Final price = gold_cost + diamond_cost + making_charges + base_price + GST
*/

-- Add new columns to jewelry_items table
DO $$
BEGIN
  -- Add diamond_cost_per_carat column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewelry_items' AND column_name = 'diamond_cost_per_carat'
  ) THEN
    ALTER TABLE jewelry_items ADD COLUMN diamond_cost_per_carat numeric(10,2) DEFAULT 0;
  END IF;

  -- Add making_charges_per_gram column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewelry_items' AND column_name = 'making_charges_per_gram'
  ) THEN
    ALTER TABLE jewelry_items ADD COLUMN making_charges_per_gram numeric(10,2) DEFAULT 500;
  END IF;
END $$;

-- Update existing records with reasonable default values
UPDATE jewelry_items 
SET 
  diamond_cost_per_carat = CASE 
    WHEN diamond_weight > 0 THEN 25000 -- Default ₹25,000 per carat for diamonds
    ELSE 0
  END,
  making_charges_per_gram = 500 -- Default ₹500 per gram making charges
WHERE diamond_cost_per_carat IS NULL OR making_charges_per_gram IS NULL;