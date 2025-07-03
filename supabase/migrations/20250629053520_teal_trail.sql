/*
  # Jewelry Catalog Database Schema

  1. New Tables
    - `jewelry_items`
      - `id` (uuid, primary key)
      - `name` (text)
      - `description` (text)
      - `category` (text)
      - `images` (text array)
      - `gold_weight` (decimal)
      - `gold_quality` (text)
      - `diamond_weight` (decimal)
      - `diamond_quality` (text)
      - `base_price` (decimal)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

    - `categories`
      - `id` (uuid, primary key)
      - `name` (text, unique)
      - `description` (text)
      - `image_url` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for public read access
    - Add policies for admin operations
*/

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

-- Create jewelry_items table
CREATE TABLE IF NOT EXISTS jewelry_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  images text[] DEFAULT '{}',
  gold_weight decimal(10,3) DEFAULT 0,
  gold_quality text DEFAULT '14K',
  diamond_weight decimal(10,3) DEFAULT 0,
  diamond_quality text DEFAULT '',
  base_price decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE jewelry_items ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Categories are publicly readable"
  ON categories
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Jewelry items are publicly readable"
  ON jewelry_items
  FOR SELECT
  TO public
  USING (true);

-- Create policies for admin operations (authenticated users can manage)
CREATE POLICY "Authenticated users can manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage jewelry items"
  ON jewelry_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert default categories
INSERT INTO categories (name, description, image_url) VALUES
  ('Rings', 'Elegant rings for every occasion', 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg'),
  ('Necklaces', 'Beautiful necklaces and pendants', 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg'),
  ('Earrings', 'Stunning earrings collection', 'https://images.pexels.com/photos/1420708/pexels-photo-1420708.jpeg'),
  ('Bracelets', 'Elegant bracelets and bangles', 'https://images.pexels.com/photos/1458885/pexels-photo-1458885.jpeg'),
  ('Watches', 'Luxury timepieces', 'https://images.pexels.com/photos/125779/pexels-photo-125779.jpeg')
ON CONFLICT (name) DO NOTHING;

-- Insert sample jewelry items
INSERT INTO jewelry_items (name, description, category, images, gold_weight, gold_quality, diamond_weight, diamond_quality, base_price) VALUES
  (
    'Diamond Solitaire Ring',
    'Classic diamond solitaire engagement ring with brilliant cut diamond',
    'Rings',
    ARRAY['https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg', 'https://images.pexels.com/photos/1454193/pexels-photo-1454193.jpeg'],
    2.5,
    '18K',
    1.0,
    'VS1',
    1200.00
  ),
  (
    'Gold Chain Necklace',
    'Elegant 18K gold chain necklace, perfect for everyday wear',
    'Necklaces',
    ARRAY['https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg'],
    8.3,
    '18K',
    0.0,
    '',
    800.00
  ),
  (
    'Pearl Drop Earrings',
    'Sophisticated pearl drop earrings with gold accents',
    'Earrings',
    ARRAY['https://images.pexels.com/photos/1420708/pexels-photo-1420708.jpeg'],
    1.2,
    '14K',
    0.0,
    '',
    450.00
  ),
  (
    'Tennis Bracelet',
    'Stunning diamond tennis bracelet with premium diamonds',
    'Bracelets',
    ARRAY['https://images.pexels.com/photos/1458885/pexels-photo-1458885.jpeg'],
    6.8,
    '18K',
    2.5,
    'VVS',
    2800.00
  )
ON CONFLICT DO NOTHING;