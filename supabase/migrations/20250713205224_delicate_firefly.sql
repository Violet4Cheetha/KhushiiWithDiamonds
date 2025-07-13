/*
  # Remove gold quality column from jewellery_items table

  1. Schema Changes
    - Remove `gold_quality` column from `jewellery_items` table
    - Gold quality selection is now handled on the frontend by customers

  2. Notes
    - This change removes the gold_quality column completely
    - Frontend will default to '14K' for all items
    - Customers can select their preferred gold quality (14K, 18K, 24K) in the UI
*/

-- Remove gold_quality column from jewellery_items table
DO $$
BEGIN
  -- Check if the column exists before trying to drop it
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'jewellery_items' AND column_name = 'gold_quality'
  ) THEN
    ALTER TABLE jewellery_items DROP COLUMN gold_quality;
  END IF;
END $$;