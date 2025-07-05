import React from 'react';
import { DiamondSlot, DiamondQuality } from '../../../lib/supabase';
import { Gem, Plus, Trash2 } from 'lucide-react';
import { formatCurrency } from '../../../lib/goldPrice';

interface DiamondSlotsSectionProps {
  diamondSlots: DiamondSlot[];
  setDiamondSlots: (slots: DiamondSlot[]) => void;
  uploading: boolean;
}

const DIAMOND_QUALITY_OPTIONS: DiamondQuality[] = ['Lab Grown', 'GH/VS-SI', 'FG/VVS-SI', 'EF/VVS'];

const DEFAULT_COSTS: Record<DiamondQuality, number> = {
  'Lab Grown': 15000,
  'GH/VS-SI': 25000,
  'FG/VVS-SI': 35000,
  'EF/VVS': 50000
};

export function DiamondSlotsSection({ 
  diamondSlots, 
  setDiamondSlots, 
  uploading 
}: DiamondSlotsSectionProps) {
  
  const addDiamondSlot = () => {
    const newSlot: DiamondSlot = {
      carat: 0,
      costs: { ...DEFAULT_COSTS }
    };
    setDiamondSlots([...diamondSlots, newSlot]);
  };

  const updateDiamondSlot = (index: number, field: keyof DiamondSlot, value: any) => {
    const updatedSlots = diamondSlots.map((slot, i) => 
      i === index ? { ...slot, [field]: value } : slot
    );
    setDiamondSlots(updatedSlots);
  };

  const updateDiamondCost = (index: number, quality: DiamondQuality, cost: number) => {
    const updatedSlots = diamondSlots.map((slot, i) => 
      i === index ? { 
        ...slot, 
        costs: { ...slot.costs, [quality]: cost }
      } : slot
    );
    setDiamondSlots(updatedSlots);
  };

  const removeDiamondSlot = (index: number) => {
    setDiamondSlots(diamondSlots.filter((_, i) => i !== index));
  };

  const getTotalCarats = () => {
    return diamondSlots.reduce((total, slot) => total + slot.carat, 0);
  };

  const getTotalCostForQuality = (quality: DiamondQuality) => {
    return diamondSlots.reduce((total, slot) => total + (slot.carat * slot.costs[quality]), 0);
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center">
          <Gem className="h-5 w-5 mr-2" />
          Diamond Configuration ({diamondSlots.length} diamonds)
        </h3>
        <button
          type="button"
          onClick={addDiamondSlot}
          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center space-x-1 text-sm"
          disabled={uploading}
        >
          <Plus className="h-4 w-4" />
          <span>Add Diamond</span>
        </button>
      </div>

      {diamondSlots.length === 0 ? (
        <div className="text-center py-6 text-gray-500">
          <Gem className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p className="mb-4">No diamonds configured. Click "Add Diamond" to include diamonds in this jewellery item.</p>
          <p className="text-xs text-gray-400">
            Each diamond will have the same carat weight but different costs based on quality.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {diamondSlots.map((slot, index) => (
            <div key={index} className="bg-white border border-blue-200 rounded-md p-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="font-medium text-blue-800">Diamond {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeDiamondSlot(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Carat Weight */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Carat Weight</label>
                <input
                  type="number"
                  step="0.01"
                  value={slot.carat}
                  onChange={(e) => updateDiamondSlot(index, 'carat', parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  placeholder="0.50"
                  disabled={uploading}
                />
              </div>

              {/* Cost per Carat for each Quality */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {DIAMOND_QUALITY_OPTIONS.map((quality) => (
                  <div key={quality}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {quality} Cost/Carat (₹)
                    </label>
                    <input
                      type="number"
                      value={slot.costs[quality]}
                      onChange={(e) => updateDiamondCost(index, quality, parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                      placeholder={DEFAULT_COSTS[quality].toString()}
                      disabled={uploading}
                    />
                    {slot.carat > 0 && (
                      <div className="text-xs text-blue-600 mt-1">
                        Total: {formatCurrency(slot.carat * slot.costs[quality])}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
          
          {/* Summary */}
          {getTotalCarats() > 0 && (
            <div className="bg-blue-100 border border-blue-300 rounded-md p-3">
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium text-blue-800">Total Diamond Weight:</span>
                <span className="text-blue-700">{getTotalCarats().toFixed(2)} carats</span>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-blue-800 mb-1">Total Cost by Quality:</div>
                {DIAMOND_QUALITY_OPTIONS.map((quality) => (
                  <div key={quality} className="flex justify-between text-xs">
                    <span className="text-blue-700">{quality}:</span>
                    <span className="text-blue-700">{formatCurrency(getTotalCostForQuality(quality))}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}