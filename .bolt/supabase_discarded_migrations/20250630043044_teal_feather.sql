/*
  # Add subcategories support to categories table

  1. Schema Changes
    - Add `parent_id` (uuid, nullable) - References categories.id for hierarchical structure
    - Add foreign key constraint for self-referencing relationship
    - Add index for better query performance

  2. Security
    - Maintain existing RLS policies
    - No changes to security model needed

  3. Notes
    - parent_id NULL = top-level category
    - parent_id with value = subcategory of that parent
    - Multiple subcategories can have the same parent
    - Subcategories can be empty (no items assigned)
*/

-- Add parent_id column to categories table
DO $$
BEGIN
  -- Add parent_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'categories' AND column_name = 'parent_id'
  ) THEN
    ALTER TABLE categories ADD COLUMN parent_id uuid;
  END IF;
END $$;

-- Add foreign key constraint for self-referencing relationship
DO $$
BEGIN
  -- Check if foreign key constraint doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'categories_parent_id_fkey'
    AND table_name = 'categories'
  ) THEN
    ALTER TABLE categories 
    ADD CONSTRAINT categories_parent_id_fkey 
    FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add index for better query performance on parent_id
DO $$
BEGIN
  -- Check if index doesn't already exist
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes
    WHERE indexname = 'idx_categories_parent_id'
    AND tablename = 'categories'
  ) THEN
    CREATE INDEX idx_categories_parent_id ON categories(parent_id);
  END IF;
END $$;

-- Insert some example subcategories for demonstration
-- First, let's get the IDs of existing categories
DO $$
DECLARE
  rings_id uuid;
  necklaces_id uuid;
  earrings_id uuid;
BEGIN
  -- Get existing category IDs
  SELECT id INTO rings_id FROM categories WHERE name = 'Rings' LIMIT 1;
  SELECT id INTO necklaces_id FROM categories WHERE name = 'Necklaces' LIMIT 1;
  SELECT id INTO earrings_id FROM categories WHERE name = 'Earrings' LIMIT 1;

  -- Insert subcategories for Rings if rings category exists
  IF rings_id IS NOT NULL THEN
    INSERT INTO categories (name, description, image_url, parent_id) VALUES
      ('Heavy Rings', 'Bold and substantial ring designs', 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg', rings_id),
      ('Light Rings', 'Delicate and elegant ring designs', 'https://images.pexels.com/photos/1454193/pexels-photo-1454193.jpeg', rings_id),
      ('Wedding Rings', 'Special rings for wedding ceremonies', 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg', rings_id)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- Insert subcategories for Necklaces if necklaces category exists
  IF necklaces_id IS NOT NULL THEN
    INSERT INTO categories (name, description, image_url, parent_id) VALUES
      ('Chain Necklaces', 'Classic chain-style necklaces', 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg', necklaces_id),
      ('Pendant Necklaces', 'Necklaces with decorative pendants', 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg', necklaces_id),
      ('Choker Necklaces', 'Short necklaces worn close to the neck', 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg', necklaces_id)
    ON CONFLICT (name) DO NOTHING;
  END IF;

  -- Insert subcategories for Earrings if earrings category exists
  IF earrings_id IS NOT NULL THEN
    INSERT INTO categories (name, description, image_url, parent_id) VALUES
      ('Stud Earrings', 'Simple and elegant stud-style earrings', 'https://images.pexels.com/photos/1420708/pexels-photo-1420708.jpeg', earrings_id),
      ('Drop Earrings', 'Earrings that hang below the earlobe', 'https://images.pexels.com/photos/1420708/pexels-photo-1420708.jpeg', earrings_id),
      ('Hoop Earrings', 'Circular or semi-circular earring designs', 'https://images.pexels.com/photos/1420708/pexels-photo-1420708.jpeg', earrings_id)
    ON CONFLICT (name) DO NOTHING;
  END IF;
END $$;