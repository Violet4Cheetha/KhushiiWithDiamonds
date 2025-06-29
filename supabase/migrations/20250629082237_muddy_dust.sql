/*
  # Add admin settings table

  1. New Tables
    - `admin_settings`
      - `id` (uuid, primary key)
      - `setting_key` (text, unique)
      - `setting_value` (text)
      - `description` (text)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `admin_settings` table
    - Add policy for authenticated users to read/write settings

  3. Default Settings
    - Insert default fallback gold price and GST rate
*/

CREATE TABLE IF NOT EXISTS admin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value text NOT NULL,
  description text DEFAULT '',
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE admin_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read and modify admin settings
CREATE POLICY "Authenticated users can read admin settings"
  ON admin_settings
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can update admin settings"
  ON admin_settings
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert admin settings"
  ON admin_settings
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Insert default settings
INSERT INTO admin_settings (setting_key, setting_value, description) VALUES
  ('fallback_gold_price', '5450', 'Fallback gold price per gram in INR when API fails'),
  ('gst_rate', '0.18', 'GST rate for jewelry (18% = 0.18)')
ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update timestamp
CREATE OR REPLACE FUNCTION update_admin_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for timestamp update
DROP TRIGGER IF EXISTS update_admin_settings_timestamp ON admin_settings;
CREATE TRIGGER update_admin_settings_timestamp
  BEFORE UPDATE ON admin_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_settings_timestamp();