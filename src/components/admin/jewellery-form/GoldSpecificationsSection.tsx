import React from 'react';

interface GoldSpecificationsSectionProps {
  formData: {
    gold_weight: number;
    gold_quality: string;
    making_charges_per_gram: number;
  };
  setFormData: (data: any) => void;
  uploading: boolean;
}

export function GoldSpecificationsSection({ 
  formData, 
  setFormData, 
  uploading 
}: GoldSpecificationsSectionProps) {
  return (
    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
      <h3 className="text-lg font-semibold text-yellow-800 mb-3 flex items-center">
        <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
        Gold Specifications
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gold Weight (grams)</label>
          <input
            type="number"
            step="0.1"
            value={formData.gold_weight}
            onChange={(e) => setFormData({ ...formData, gold_weight: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            disabled={uploading}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Gold Quality</label>
          <select
            value={formData.gold_quality}
            onChange={(e) => setFormData({ ...formData, gold_quality: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            disabled={uploading}
          >
            {['18K', '22K', '24K', '14K'].map(quality => (
              <option key={quality} value={quality}>{quality}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Making Charges per Gram (₹)</label>
          <input
            type="number"
            value={formData.making_charges_per_gram}
            onChange={(e) => setFormData({ ...formData, making_charges_per_gram: parseFloat(e.target.value) || 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
            placeholder="500"
            disabled={uploading}
          />
        </div>
      </div>
    </div>
  );
}