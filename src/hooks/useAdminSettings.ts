import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useAdminSettings() {
  const [fallbackGoldPrice, setFallbackGoldPrice] = useState(5450);
  const [gstRate, setGstRate] = useState(0.18);
  const [loading, setLoading] = useState(true);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('admin_settings')
        .select('setting_key, setting_value')
        .in('setting_key', ['fallback_gold_price', 'gst_rate']);

      data?.forEach(setting => {
        if (setting.setting_key === 'fallback_gold_price') {
          setFallbackGoldPrice(parseFloat(setting.setting_value) || 5450);
        } else if (setting.setting_key === 'gst_rate') {
          setGstRate(parseFloat(setting.setting_value) || 0.18);
        }
      });
    } catch (err) {
      console.error('Admin settings fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (key: string, value: string) => {
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({ setting_value: value })
        .eq('setting_key', key);

      if (error) throw error;

      if (key === 'fallback_gold_price') {
        setFallbackGoldPrice(parseFloat(value) || 5450);
      } else if (key === 'gst_rate') {
        setGstRate(parseFloat(value) || 0.18);
      }

      return true;
    } catch (err) {
      console.error('Error updating setting:', err);
      return false;
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  return { fallbackGoldPrice, gstRate, loading, updateSetting, refreshSettings: loadSettings };
}