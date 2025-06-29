import React from 'react';
import { TrendingUp, Clock, MapPin } from 'lucide-react';
import { useGoldPrice } from '../hooks/useGoldPrice';
import { formatCurrency } from '../lib/goldPrice';

export function GoldPriceDisplay() {
  const { goldPrice, loading, error } = useGoldPrice();

  if (loading) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-center space-x-2">
          <Clock className="h-5 w-5 text-yellow-600 animate-spin" />
          <span className="text-yellow-800 font-medium">Loading gold price...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <span className="text-red-800 text-sm">Using fallback pricing</span>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-black rounded-lg p-4 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5" />
          <span className="font-semibold">Live Gold Price</span>
          <MapPin className="h-4 w-4" />
          <span className="text-sm">India</span>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">{formatCurrency(goldPrice)}/gram</div>
          <div className="text-xs opacity-75">*Includes GST</div>
        </div>
      </div>
    </div>
  );
}