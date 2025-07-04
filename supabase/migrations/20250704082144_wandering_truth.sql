-- =======================
-- TABLE DEFINITIONS
-- =======================

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text DEFAULT '',
  image_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  parent_id uuid
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE categories
ADD CONSTRAINT IF NOT EXISTS categories_parent_id_fkey
FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);

-- Jewellery items table with new diamond quality structure
CREATE TABLE IF NOT EXISTS jewellery_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  category text NOT NULL,
  image_url text[] DEFAULT '{}',
  gold_weight decimal(10,3) DEFAULT 0,
  gold_quality text DEFAULT '14K',
  base_price decimal(10,2) DEFAULT 0,
  making_charges_per_gram numeric(10,2) DEFAULT 500,
  -- New diamond quality columns
  diamonds_lab_grown JSONB DEFAULT '[]'::jsonb,
  diamonds_gh_vs_si JSONB DEFAULT '[]'::jsonb,
  diamonds_fg_vvs_si JSONB DEFAULT '[]'::jsonb,
  diamonds_ef_vvs JSONB DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE jewellery_items ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance on diamond columns
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_lab_grown ON jewellery_items USING GIN (diamonds_lab_grown);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_gh_vs_si ON jewellery_items USING GIN (diamonds_gh_vs_si);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_fg_vvs_si ON jewellery_items USING GIN (diamonds_fg_vvs_si);
CREATE INDEX IF NOT EXISTS idx_jewellery_items_diamonds_ef_vvs ON jewellery_items USING GIN (diamonds_ef_vvs);

-- Admin settings table
CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- =======================
-- POLICIES
-- =======================

-- Categories
CREATE POLICY IF NOT EXISTS "Categories are publicly readable"
  ON categories FOR SELECT TO public USING (true);

CREATE POLICY IF NOT EXISTS "Only authenticated users can insert categories"
  ON categories FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Only authenticated users can update categories"
  ON categories FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Only authenticated users can delete categories"
  ON categories FOR DELETE TO authenticated USING (true);

-- Jewellery Items
CREATE POLICY IF NOT EXISTS "Jewellery items are publicly readable"
  ON jewellery_items FOR SELECT TO public USING (true);

CREATE POLICY IF NOT EXISTS "Only authenticated users can insert jewellery items"
  ON jewellery_items FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Only authenticated users can update jewellery items"
  ON jewellery_items FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Only authenticated users can delete jewellery items"
  ON jewellery_items FOR DELETE TO authenticated USING (true);

-- Admin Settings
CREATE POLICY IF NOT EXISTS "Authenticated users can read admin settings"
  ON admin_settings FOR SELECT TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can update admin settings"
  ON admin_settings FOR UPDATE TO authenticated USING (true);

CREATE POLICY IF NOT EXISTS "Authenticated users can insert admin settings"
  ON admin_settings FOR INSERT TO authenticated WITH CHECK (true);

-- =======================
-- TRIGGERS & FUNCTIONS
-- =======================

CREATE OR REPLACE FUNCTION update_admin_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_admin_settings_timestamp
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW EXECUTE FUNCTION update_admin_settings_timestamp();

-- =======================
-- DEFAULT DATA
-- =======================

INSERT INTO categories (name, description, image_url) VALUES
  ('Rings', 'Elegant rings for every occasion', 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg'),
  ('Necklaces', 'Beautiful necklaces and pendants', 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg'),
  ('Earrings', 'Stunning earrings collection', 'https://images.pexels.com/photos/1420708/pexels-photo-1420708.jpeg'),
  ('Bracelets', 'Elegant bracelets and bangles', 'https://images.pexels.com/photos/1458885/pexels-photo-1458885.jpeg'),
  ('Watches', 'Luxury timepieces', 'https://images.pexels.com/photos/125779/pexels-photo-125779.jpeg')
ON CONFLICT (name) DO NOTHING;

INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
  ('fallback_gold_price', '5450', 'Fallback gold price per gram in INR when API fails'),
  ('gst_rate', '0.18', 'GST rate for jewelry (18% = 0.18)')
ON CONFLICT (setting_key) DO NOTHING;

-- =======================
-- COMMENTS
-- =======================

COMMENT ON COLUMN jewellery_items.diamonds_lab_grown IS 'Array of lab grown diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_gh_vs_si IS 'Array of GH/VS-SI diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_fg_vvs_si IS 'Array of FG/VVS-SI diamond objects with carat and cost_per_carat properties';
COMMENT ON COLUMN jewellery_items.diamonds_ef_vvs IS 'Array of EF/VVS diamond objects with carat and cost_per_carat properties';