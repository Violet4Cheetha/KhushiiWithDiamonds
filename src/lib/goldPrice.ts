import { supabase } from './supabase';

const GOLD_API_KEY = import.meta.env.VITE_GOLD_API_KEY || '9886e90c5c52f1a75a3ca50daccd91d4';
const GOLD_API_URL = `https://api.metalpriceapi.com/v1/latest?api_key=${GOLD_API_KEY}&base=INR&currencies=XAU`;
const CACHE_DURATION = 24 * 60 * 60 * 1000;

let cachedPrice: { price: number; timestamp: Date } | null = null;

const getAdminSettings = async () => {
  try {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_key, setting_value')
      .in('setting_key', ['fallback_gold_price', 'gst_rate']);

    const settings = { fallbackPrice: 5450, gstRate: 0.18 };
    
    data?.forEach(setting => {
      if (setting.setting_key === 'fallback_gold_price') {
        settings.fallbackPrice = parseFloat(setting.setting_value) || 5450;
      } else if (setting.setting_key === 'gst_rate') {
        settings.gstRate = parseFloat(setting.setting_value) || 0.18;
      }
    });
    
    return settings;
  } catch (error) {
    console.warn('Failed to load admin settings:', error);
    return { fallbackPrice: 5450, gstRate: 0.18 };
  }
};

export const getCurrentGoldPrice = async (): Promise<number> => {
  if (cachedPrice && Date.now() - cachedPrice.timestamp.getTime() < CACHE_DURATION) {
    return cachedPrice.price;
  }

  const { fallbackPrice } = await getAdminSettings();

  try {
    const response = await fetch(GOLD_API_URL);
    if (response.ok) {
      const data = await response.json();
      
      if (data.rates?.XAU) {
        const pricePerGramINR = (1 / data.rates.XAU) / 31.1035;
        cachedPrice = { price: pricePerGramINR, timestamp: new Date() };
        return pricePerGramINR;
      }
    }
  } catch (error) {
    console.warn('Failed to fetch live gold price:', error);
  }

  cachedPrice = { price: fallbackPrice, timestamp: new Date() };
  return fallbackPrice;
};

const purityMultipliers = {
  '10K': 0.417, '14K': 0.583, '18K': 0.750, '22K': 0.917, '24K': 1.000
};

export const calculateJewelryPriceSync = (
  basePrice: number,
  goldWeight: number,
  goldQuality: string,
  diamondWeight: number,
  diamondCostPerCarat: number,
  makingChargesPerGram: number,
  goldPricePerGram: number,
  gstRate: number = 0.18
): number => {
  const purity = purityMultipliers[goldQuality as keyof typeof purityMultipliers] || 0.583;
  const goldValue = goldWeight * goldPricePerGram * purity;
  const diamondCost = diamondWeight * diamondCostPerCarat;
  const makingCharges = goldWeight * makingChargesPerGram;
  const subtotal = goldValue + diamondCost + makingCharges + basePrice;
  
  return subtotal * (1 + gstRate);
};

export const formatCurrency = (amount: number): string => 
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

export const formatWeight = (weight: number): string => `${weight.toFixed(2)} grams`;

export const getPriceBreakdown = (
  basePrice: number,
  goldWeight: number,
  goldQuality: string,
  diamondWeight: number,
  diamondCostPerCarat: number,
  makingChargesPerGram: number,
  goldPricePerGram: number,
  gstRate: number = 0.18
) => {
  const purity = purityMultipliers[goldQuality as keyof typeof purityMultipliers] || 0.583;
  const goldValue = goldWeight * goldPricePerGram * purity;
  const diamondCost = diamondWeight * diamondCostPerCarat;
  const makingCharges = goldWeight * makingChargesPerGram;
  const subtotal = goldValue + diamondCost + makingCharges + basePrice;
  const gst = subtotal * gstRate;

  return { goldValue, diamondCost, makingCharges, basePrice, subtotal, gst, total: subtotal + gst };
};