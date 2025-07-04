import { createClient } from '@supabase/supabase-js';

// Try both possible environment variable names
const supabaseUrl = import.meta.env.VITE_SUPABASE_DATABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Test the connection
supabase.from('categories').select('count', { count: 'exact', head: true })
  .then(({ error, count }) => {
    if (error) {
      console.error('Supabase connection test failed:', error);
    } else {
      console.log('Supabase connection successful. Categories count:', count);
    }
  })
  .catch(err => {
    console.error('Supabase connection error:', err);
  });

export type Diamond = {
  carat: number;
  cost_per_carat: number;
};

export type JewelleryItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  image_url: string[];
  gold_weight: number;
  gold_quality: string;
  diamonds: Diamond[];
  diamond_quality: string;
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
  parent_id: string | null;
  created_at: string;
};

type AdminSetting = {
  id: string;
  setting_key: string;
  setting_value: string;
  description: string;
  updated_at: string;
};