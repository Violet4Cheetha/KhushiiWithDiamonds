import React from 'react';
import { Diamond } from '../../../lib/supabase';
import { Gem, Plus, Trash2 } from 'lucide-react';
import { formatCurrency, getTotalDiamondWeight } from '../../../lib/goldPrice';

interface DiamondsSectionProps {
  diamonds: Diamond[];
  setDiamonds: (diamonds: Diamond[]) => void;
  uploading: boolean;
}

export function DiamondsSection({ diamonds, setDiamonds, uploading }: DiamondsSectionProps) {
  const addDiamond = () => {
    setDiamonds([...diamonds, { carat: 0, quality: '', cost_per_carat: 25000 }]);
  };

  const updateDiamond = (index: number, field: keyof Diamond, value: string | number) => {
    const updatedDiamonds = diamonds.map((diamond, i) => 
      i === index ? { ...diamond, [field]: value } : diamond
    );
    setDiamonds(updatedDiamonds);
  };

  const removeDiamond = (index: number) => {
    setDiamonds(diamonds.filter((_, i) => i !== index));
  };

  const totalDiamondWeight = getTotalDiamondWeight(diamonds);
  const totalDiamondCost = diamonds.reduce((sum, d) => sum + (d.carat * d.cost_per_carat), 0);

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-blue-800 flex items-center">
          <Gem className="h-5 w-5 mr-2" />
          Diamonds ({diamonds.length})
        </h3>
        <button
          type="button"
          onClick={addDiamond}
          className="bg-blue-600 text-white px-3 py-1 rounded-md hover:bg-blue-700 flex items-center space-x-1 text-sm"
          disabled={uploading}
        >
          <Plus className="h-4 w-4" />
          <span>Add Diamond</span>
        </button>
      </div>

      {diamonds.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          <Gem className="h-8 w-8 mx-auto mb-2 text-gray-400" />
          <p>No diamonds added. Click "Add Diamond" to include diamonds in this jewellery item.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {diamonds.map((diamond, index) => (
            <div key={index} className="bg-white border border-blue-200 rounded-md p-3">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-blue-800">Diamond {index + 1}</h4>
                <button
                  type="button"
                  onClick={() => removeDiamond(index)}
                  className="text-red-500 hover:text-red-700"
                  disabled={uploading}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Carat Weight</label>
                  <input
                    type="number"
                    step="0.01"
                    value={diamond.carat}
                    onChange={(e) => updateDiamond(index, 'carat', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    placeholder="0.50"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Quality</label>
                  <input
                    type="text"
                    value={diamond.quality}
                    onChange={(e) => updateDiamond(index, 'quality', e.target.value)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    placeholder="VS1, VVS, SI1"
                    disabled={uploading}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Cost per Carat (₹)</label>
                  <input
                    type="number"
                    value={diamond.cost_per_carat}
                    onChange={(e) => updateDiamond(index, 'cost_per_carat', parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500"
                    placeholder="25000"
                    disabled={uploading}
                  />
                </div>
              </div>
              {diamond.carat > 0 && (
                <div className="mt-2 text-xs text-blue-600">
                  Total cost: {formatCurrency(diamond.carat * diamond.cost_per_carat)}
                </div>
              )}
            </div>
          ))}
          
          {totalDiamondWeight > 0 && (
            <div className="bg-blue-100 border border-blue-300 rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-800">Total Diamond Weight:</span>
                <span className="text-blue-700">{totalDiamondWeight.toFixed(2)} carats</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium text-blue-800">Total Diamond Cost:</span>
                <span className="text-blue-700">{formatCurrency(totalDiamondCost)}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}