import React, { useState } from 'react';
import { JewelleryItem, DiamondQuality } from '../lib/supabase';
import { calculateJewelleryPriceSync, formatCurrency, formatWeight, getPriceBreakdown, getTotalDiamondWeight, formatDiamondSummary, getAllDiamondsFromItem, getDiamondQualityDisplayName } from '../lib/goldPrice';
import { useGoldPrice } from '../hooks/useGoldPrice';
import { useAdminSettings } from '../hooks/useAdminSettings';
import { ChevronLeft, ChevronRight, Gem, X, ZoomIn, ChevronDown } from 'lucide-react';

interface JewelleryCardProps {
  item: JewelleryItem;
}

const GOLD_QUALITY_OPTIONS = [
  { value: '14K', label: '14K Gold', purity: 0.583 },
  { value: '18K', label: '18K Gold', purity: 0.750 },
  { value: '24K', label: '24K Gold', purity: 1.000 }
];

export function JewelleryCard({ item }: JewelleryCardProps) {
  const { goldPrice } = useGoldPrice();
  const { gstRate } = useAdminSettings();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [selectedDiamondQuality, setSelectedDiamondQuality] = useState<DiamondQuality | null>(null);
  const [selectedGoldQuality, setSelectedGoldQuality] = useState('14K'); // Default to 14K since it's no longer in database
  const [showDiamondDropdown, setShowDiamondDropdown] = useState(false);
  const [showGoldDropdown, setShowGoldDropdown] = useState(false);
  
  // Get all available diamond qualities for this item
  const availableQualities: DiamondQuality[] = [];
  if (item.diamonds_lab_grown && item.diamonds_lab_grown.length > 0) availableQualities.push('Lab Grown');
  if (item.diamonds_gh_vs_si && item.diamonds_gh_vs_si.length > 0) availableQualities.push('GH/VS-SI');
  if (item.diamonds_fg_vvs_si && item.diamonds_fg_vvs_si.length > 0) availableQualities.push('FG/VVS-SI');
  if (item.diamonds_ef_vvs && item.diamonds_ef_vvs.length > 0) availableQualities.push('EF/VVS');

  // Get diamonds based on selected quality or default to first available
  const getSelectedDiamonds = () => {
    const quality = selectedDiamondQuality || availableQualities[0];
    if (!quality) return { diamonds: [], quality: null };

    switch (quality) {
      case 'Lab Grown':
        return { diamonds: item.diamonds_lab_grown || [], quality };
      case 'GH/VS-SI':
        return { diamonds: item.diamonds_gh_vs_si || [], quality };
      case 'FG/VVS-SI':
        return { diamonds: item.diamonds_fg_vvs_si || [], quality };
      case 'EF/VVS':
        return { diamonds: item.diamonds_ef_vvs || [], quality };
      default:
        return { diamonds: [], quality: null };
    }
  };

  const diamondsData = getSelectedDiamonds();

  const finalPrice = calculateJewelleryPriceSync(
    item.base_price,
    item.gold_weight,
    selectedGoldQuality, // Use selected gold quality instead of item.gold_quality
    diamondsData,
    item.making_charges_per_gram,
    goldPrice,
    gstRate
  );

  const breakdown = getPriceBreakdown(
    item.base_price,
    item.gold_weight,
    selectedGoldQuality, // Use selected gold quality instead of item.gold_quality
    diamondsData,
    item.making_charges_per_gram,
    goldPrice,
    gstRate
  );

  const images = item.image_url.length > 0 
    ? item.image_url 
    : ['https://drive.google.com/thumbnail?id=1KRTxnA-gFSbg6R5EfBhu-y-tAxElt_AO&sz=w625-h340'];

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const openImageModal = (imageIndex: number) => {
    setModalImageIndex(imageIndex);
    setShowImageModal(true);
  };

  const nextModalImage = () => {
    setModalImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevModalImage = () => {
    setModalImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  const totalDiamondWeight = getTotalDiamondWeight(diamondsData.diamonds);

  const getGoldQualityDisplayName = (quality: string) => {
    const option = GOLD_QUALITY_OPTIONS.find(opt => opt.value === quality);
    return option ? option.label : quality;
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
        <div className="relative h-64 overflow-hidden group">
          <div 
            className="w-full h-full cursor-pointer"
            onClick={() => openImageModal(currentImageIndex)}
          >
            <img
              src={images[currentImageIndex]}
              alt={`${item.name} - Image ${currentImageIndex + 1}`}
              className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
            />
            
            {/* Zoom indicator */}
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-300 flex items-center justify-center">
              <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-white bg-opacity-90 rounded-full p-3">
                <ZoomIn className="h-6 w-6 text-gray-700" />
              </div>
            </div>
          </div>
          
          {/* Image Navigation */}
          {images.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  prevImage();
                }}
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70 z-10"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  nextImage();
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-opacity-70 z-10"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
              
              {/* Image Indicators */}
              <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-1">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentImageIndex(index);
                    }}
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
            
            {/* Gold Quality Selection */}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Gold Quality:</span>
              <div className="relative">
                <button
                  onClick={() => setShowGoldDropdown(!showGoldDropdown)}
                  className="flex items-center space-x-1 text-sm font-medium text-yellow-600 hover:text-yellow-800 bg-yellow-50 px-2 py-1 rounded"
                >
                  <span>{getGoldQualityDisplayName(selectedGoldQuality)}</span>
                  <ChevronDown className="h-3 w-3" />
                </button>
                
                {showGoldDropdown && (
                  <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-55 min-w-32">
                    {GOLD_QUALITY_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSelectedGoldQuality(option.value);
                          setShowGoldDropdown(false);
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                          selectedGoldQuality === option.value 
                            ? 'bg-yellow-50 text-yellow-600' 
                            : 'text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            
            {/* Diamond Quality Selection */}
            {availableQualities.length > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Diamond Quality:</span>
                  <div className="relative">
                    <button
                      onClick={() => setShowDiamondDropdown(!showDiamondDropdown)}
                      className="flex items-center space-x-1 text-sm font-medium text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                    >
                      <span>{getDiamondQualityDisplayName(diamondsData.quality || availableQualities[0])}</span>
                      <ChevronDown className="h-3 w-3" />
                    </button>
                    
                    {showDiamondDropdown && (
                      <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-30 min-w-32">
                        {availableQualities.map((quality) => (
                          <button
                            key={quality}
                            onClick={() => {
                              setSelectedDiamondQuality(quality);
                              setShowDiamondDropdown(false);
                            }}
                            className={`block w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${
                              (selectedDiamondQuality || availableQualities[0]) === quality 
                                ? 'bg-blue-50 text-blue-600' 
                                : 'text-gray-700'
                            }`}
                          >
                            {getDiamondQualityDisplayName(quality)}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {totalDiamondWeight > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Diamonds:</span>
                    <span className="font-medium">{formatDiamondSummary(diamondsData.diamonds, diamondsData.quality)}</span>
                  </div>
                )}
              </div>
            )}
            
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Making Charges:</span>
              <span className="font-medium">{formatCurrency(item.making_charges_per_gram)}/gram</span>
            </div>
          </div>

          {/* Detailed Diamond Information */}
          {diamondsData.diamonds.length > 0 && (
            <div className="bg-blue-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-800 flex items-center">
                  <Gem className="h-4 w-4 mr-1" />
                  Diamond Details ({getDiamondQualityDisplayName(diamondsData.quality!)})
                </span>
              </div>
              <div className="space-y-1 text-xs">
                {diamondsData.diamonds.map((diamond, index) => (
                  <div key={index} className="flex justify-between">
                    <span className="text-blue-600">
                      Diamond {index + 1}: {diamond.carat}ct
                    </span>
                    <span className="text-blue-700">
                      {formatCurrency(diamond.carat * diamond.cost_per_carat)}
                    </span>
                  </div>
                ))}
                {diamondsData.diamonds.length > 1 && (
                  <div className="flex justify-between border-t border-blue-200 pt-1 font-medium">
                    <span className="text-blue-700">Total:</span>
                    <span className="text-blue-700">{formatCurrency(breakdown.diamondCost)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Price Breakdown</span>
            </div>
            <div className="space-y-1 text-xs">
              {breakdown.goldValue > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Gold Cost ({selectedGoldQuality}):</span>
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

      {/* Dropdown Overlays - Fixed z-index */}
      {(showDiamondDropdown || showGoldDropdown) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowDiamondDropdown(false);
            setShowGoldDropdown(false);
          }}
        />
      )}
      
      {/* Image Modal */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-45 p-4">
          <div className="relative max-w-6xl max-h-full w-full">
            {/* Close Button */}
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-4 right-4 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 z-10"
            >
              <X className="h-6 w-6" />
            </button>

            {/* Image Navigation Buttons */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevModalImage}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 z-10"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={nextModalImage}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all duration-200 z-10"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Main Image */}
            <div className="flex items-center justify-center h-full">
              <img
                src={images[modalImageIndex]}
                alt={`${item.name} - Image ${modalImageIndex + 1}`}
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
              />
            </div>

            {/* Image Info Bar */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-6 py-3 rounded-full">
              <div className="flex items-center space-x-4">
                <span className="font-medium">{item.name}</span>
                {images.length > 1 && (
                  <>
                    <span className="text-gray-300">•</span>
                    <span className="text-sm">
                      {modalImageIndex + 1} of {images.length}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Thumbnail Navigation */}
            {images.length > 1 && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-50 p-3 rounded-lg">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setModalImageIndex(index)}
                    className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all duration-200 ${
                      index === modalImageIndex 
                        ? 'border-white' 
                        : 'border-transparent opacity-60 hover:opacity-80'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`Thumbnail ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}