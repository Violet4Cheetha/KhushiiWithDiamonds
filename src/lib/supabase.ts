import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type JewelryItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  images: string[];
  gold_weight: number;
  gold_quality: string;
  diamond_weight: number;
  diamond_quality: string;
  diamond_cost_per_carat: number;
  making_charges_per_gram: number;
  base_price: number;
  created_at: string;
  updated_at: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  image_url: string;
  created_at: string;
};

export type AdminSetting = {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
};