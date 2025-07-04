import React from 'react';
import { Diamond } from '../../../lib/supabase';
import { formatCurrency, calculateJewelleryPriceSync, getTotalDiamondWeight } from '../../../lib/goldPrice';

interface PricePreviewSectionProps {
  formData: {
    base_price: number;
    gold_weight: number;
    gold_quality: string;
    making_charges_per_gram: number;
  };
  diamonds: Diamond[];
  goldPrice: number;
  gstRate: number;
}

export function PricePreviewSection({ 
  formData, 
  diamonds, 
  goldPrice, 
  gstRate 
}: PricePreviewSectionProps) {
  const totalDiamondWeight = getTotalDiamondWeight(diamonds);
  
  const shouldShowPreview = formData.gold_weight > 0 || formData.base_price > 0 || totalDiamondWeight > 0;
  
  if (!shouldShowPreview) {
    return null;
  }

  const finalPrice = calculateJewelleryPriceSync(
    formData.base_price, 
    formData.gold_weight, 
    formData.gold_quality,
    diamonds, 
    formData.making_charges_per_gram, 
    goldPrice, 
    gstRate
  );

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="text-sm font-medium text-green-800 mb-2">Live Price Preview</h4>
      <div className="text-2xl font-bold text-green-600">
        {formatCurrency(finalPrice)}
      </div>
      <p className="text-xs text-green-600 mt-1">
        *Including live gold price ({formatCurrency(goldPrice)}/gram) + GST ({Math.round(gstRate * 100)}%)
      </p>
      {totalDiamondWeight > 0 && (
        <p className="text-xs text-green-600">
          *Including {diamonds.length} diamond{diamonds.length > 1 ? 's' : ''} ({totalDiamondWeight.toFixed(2)} total carats)
        </p>
      )}
    </div>
  );
}