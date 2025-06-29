import React, { useState } from 'react';
import { JewelryItem } from '../lib/supabase';
import { calculateJewelryPriceSync, formatCurrency, formatWeight, getPriceBreakdown } from '../lib/goldPrice';
import { useGoldPrice } from '../hooks/useGoldPrice';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface JewelryCardProps {
  item: JewelryItem;
}

export function JewelryCard({ item }: JewelryCardProps) {
  const { goldPrice } = useGoldPrice();
  const { gstRate } = useAdminSettings();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  const finalPrice = calculateJewelryPriceSync(
    item.base_price,
    item.gold_weight,
    item.gold_quality,
    item.diamond_weight,
    item.diamond_cost_per_carat,
    item.making_charges_per_gram,
    goldPrice,
    gstRate
  );

  const breakdown = getPriceBreakdown(
    item.base_price,
    item.gold_weight,
    item.gold_quality,
    item.diamond_weight,
    item.diamond_cost_per_carat,
    item.making_charges_per_gram,
    goldPrice,
    gstRate
  );

  const images = item.images.length > 0 
    ? item.images 
    : ['https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      <div className="relative h-64 overflow-hidden group">
        <img
          src={images[currentImageIndex]}
          alt={`${item.name} - Image ${currentImageIndex + 1}`}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
        />
        
        {/* Image Navigation */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            
            {/* Image Indicators */}
            <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentImageIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentImageIndex 
                      ? 'bg-white' 
                      : 'bg-white bg-opacity-50 hover:bg-opacity-75'
                  }`}
                />
              ))}
            </div>
          </>
        )}

        {/* Image Counter */}
        {images.length > 1 && (
          <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
            {currentImageIndex + 1}/{images.length}
          </div>
        )}
      </div>

      <div className="p-6">
        <h3 className="text-xl font-bold text-gray-900 mb-2">{item.name}</h3>
        <p className="text-gray-600 text-sm mb-4 line-clamp-2">{item.description}</p>

        <div className="space-y-2 mb-4">
          {item.gold_weight > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gold Weight:</span>
              <span className="font-medium">{formatWeight(item.gold_weight)}</span>
            </div>
          )}
          {item.diamond_weight > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Diamond:</span>
              <span className="font-medium">{item.diamond_weight}ct {item.diamond_quality}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Purity:</span>
            <span className="font-medium">{item.gold_quality} Gold</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Making Charges:</span>
            <span className="font-medium">{formatCurrency(item.making_charges_per_gram)}/gram</span>
          </div>
        </div>

        <div className="bg-gray-50 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Price Breakdown</span>
          </div>
          <div className="space-y-1 text-xs">
            {breakdown.goldValue > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Gold Cost:</span>
                <span>{formatCurrency(breakdown.goldValue)}</span>
              </div>
            )}
            {breakdown.diamondCost > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Diamond Cost:</span>
                <span>{formatCurrency(breakdown.diamondCost)}</span>
              </div>
            )}
            {breakdown.makingCharges > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Making Charges:</span>
                <span>{formatCurrency(breakdown.makingCharges)}</span>
              </div>
            )}
            {breakdown.basePrice > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600">Design & Others:</span>
                <span>{formatCurrency(breakdown.basePrice)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">GST ({Math.round(gstRate * 100)}%):</span>
              <span>{formatCurrency(breakdown.gst)}</span>
            </div>
          </div>
        </div>

        <div>
          <span className="text-2xl font-bold text-gray-900">
            {formatCurrency(finalPrice)}
          </span>
          <p className="text-xs text-gray-500 mt-1">*Live gold pricing included</p>
        </div>
      </div>
    </div>
  );
}