import React, { useState } from 'react';
import { JewelryItem, Category, Diamond } from '../../lib/supabase';
import { Save, X, Upload, FileImage, Loader, ChevronDown, ChevronRight, Folder, Plus, Trash2, Gem, Eye, ExternalLink } from 'lucide-react';
import { formatCurrency, calculateJewelryPriceSync } from '../../lib/goldPrice';
import { GoogleDriveUploadService } from '../../lib/googleDriveUpload';

interface JewelryFormProps {
  categories: Category[];
  editingItem: JewelryItem | null;
  goldPrice: number;
  gstRate: number;
  onSubmit: (itemData: any, imageUrls: string[]) => Promise<void>;
  onCancel: () => void;
}

export function JewelryForm({ 
  categories, 
  editingItem, 
  goldPrice, 
  gstRate, 
  onSubmit, 
  onCancel 
}: JewelryFormProps) {
  const [uploading, setUploading] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Initialize diamonds from editing item or create empty array
  const initialDiamonds: Diamond[] = editingItem?.diamonds || [];

  const [formData, setFormData] = useState({
    name: editingItem?.name || '', 
    description: editingItem?.description || '', 
    category: editingItem?.category || '', 
    gold_weight: editingItem?.gold_weight || 0,
    gold_quality: editingItem?.gold_quality || '22K', 
    making_charges_per_gram: editingItem?.making_charges_per_gram || 500, 
    base_price: editingItem?.base_price || 0,
  });

  const [diamonds, setDiamonds] = useState<Diamond[]>(initialDiamonds);
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [currentImages, setCurrentImages] = useState<string[]>(editingItem?.image_url || []);
  const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);

  // Organize categories for expandable dropdown
  const topLevelCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(cat => cat.parent_id === parentId);

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const selectCategory = (categoryName: string) => {
    setFormData({ ...formData, category: categoryName });
    setShowCategoryDropdown(false);
    setExpandedCategories(new Set());
  };

  // Get category display name with hierarchy
  const getCategoryDisplayName = (categoryName: string) => {
    const category = categories.find(cat => cat.name === categoryName);
    if (!category) return categoryName;

    if (category.parent_id) {
      const parent = categories.find(cat => cat.id === category.parent_id);
      return parent ? `${parent.name} → ${categoryName}` : categoryName;
    }
    return categoryName;
  };

  const CategoryMenuItem = ({ category, level = 0 }: { category: Category; level?: number }) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const paddingLeft = level * 16;

    return (
      <div key={category.id}>
        <div className="flex items-center hover:bg-gray-50">
          <button
            onClick={() => selectCategory(category.name)}
            className="flex-1 text-left px-4 py-2 text-sm text-gray-700 hover:text-yellow-600 transition-colors"
            style={{ paddingLeft: `${16 + paddingLeft}px` }}
          >
            <div className="flex items-center space-x-2">
              {hasSubcategories ? (
                <Folder className="h-4 w-4 text-blue-500" />
              ) : (
                <div className="h-4 w-4" />
              )}
              <span>{category.name}</span>
            </div>
          </button>
          {hasSubcategories && (
            <button
              onClick={(e) => {
                e.preventDefault();
                toggleExpanded(category.id);
              }}
              className="p-2 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight 
                className={`h-4 w-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
              />
            </button>
          )}
        </div>
        
        {hasSubcategories && isExpanded && (
          <div className="bg-gray-50">
            {subcategories.map((subcategory) => (
              <CategoryMenuItem 
                key={subcategory.id} 
                category={subcategory} 
                level={level + 1} 
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  // Diamond management functions
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

  // Image management functions
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages(fileArray);
    }
  };

  const removeNewImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const removeCurrentImage = (imageUrl: string) => {
    setCurrentImages(prev => prev.filter(url => url !== imageUrl));
    setImagesToDelete(prev => [...prev, imageUrl]);
  };

  const restoreImage = (imageUrl: string) => {
    setImagesToDelete(prev => prev.filter(url => url !== imageUrl));
    setCurrentImages(prev => [...prev, imageUrl]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let newImageUrls: string[] = [];

      // Upload new images to Google Drive if any are selected
      if (selectedImages.length > 0) {
        try {
          // Get category hierarchy for folder structure
          const selectedCategory = categories.find(cat => cat.name === formData.category);
          const parentCategory = selectedCategory?.parent_id 
            ? categories.find(cat => cat.id === selectedCategory.parent_id)
            : null;

          newImageUrls = await GoogleDriveUploadService.uploadJewelryImages(
            selectedImages,
            formData.name,
            formData.category,
            parentCategory?.name
          );
          console.log('Successfully uploaded jewelry images:', newImageUrls);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert(`Image upload failed: ${uploadError.message}. The item will be saved without new images.`);
        }
      }

      // Delete images marked for deletion from Google Drive
      if (imagesToDelete.length > 0) {
        try {
          const deleteResult = await GoogleDriveUploadService.deleteFiles(imagesToDelete);
          console.log('Image deletion result:', deleteResult);
          
          if (!deleteResult.success) {
            console.warn('Some images failed to delete from Google Drive:', deleteResult.results);
            // Continue with form submission even if some deletions failed
          }
        } catch (deleteError) {
          console.error('Image deletion failed:', deleteError);
          // Continue with form submission even if deletion failed
        }
      }

      // Combine current images (not marked for deletion) with new uploaded images
      const finalImageUrls = [...currentImages, ...newImageUrls];

      const itemData = {
        ...formData,
        diamonds: diamonds.filter(d => d.carat > 0), // Only include diamonds with weight
        description: formData.description,
      };

      await onSubmit(itemData, finalImageUrls);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please check your permissions and try again.');
    } finally {
      setUploading(false);
    }
  };

  // Calculate total diamond weight and cost for preview
  const totalDiamondWeight = diamonds.reduce((sum, d) => sum + d.carat, 0);
  const totalDiamondCost = diamonds.reduce((sum, d) => sum + (d.carat * d.cost_per_carat), 0);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-5xl max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 text-left flex items-center justify-between bg-white"
                    disabled={uploading}
                  >
                    <span className={formData.category ? 'text-gray-900' : 'text-gray-500'}>
                      {formData.category || 'Select Category'}
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showCategoryDropdown ? 'rotate-180' : ''}`} />
                  </button>

                  {showCategoryDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                      <div className="py-1">
                        {topLevelCategories.map((category) => (
                          <CategoryMenuItem key={category.id} category={category} />
                        ))}
                        {topLevelCategories.length === 0 && (
                          <div className="px-4 py-2 text-sm text-gray-500">
                            No categories available
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Category Preview */}
                {formData.category && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                    <p className="text-sm text-blue-800">
                      <strong>Selected:</strong> {getCategoryDisplayName(formData.category)}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                rows={3}
                disabled={uploading}
              />
            </div>

            {/* Images Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Jewelry Images
              </label>
              
              {/* Current Images */}
              {(currentImages.length > 0 || imagesToDelete.length > 0) && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Current Images</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {/* Active current images */}
                    {currentImages.map((imageUrl, index) => (
                      <div key={`current-${index}`} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={imageUrl}
                            alt={`Current image ${index + 1}`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 rounded-lg flex items-center justify-center">
                          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                            <button
                              type="button"
                              onClick={() => window.open(imageUrl, '_blank')}
                              className="bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100"
                              title="Open in new tab"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeCurrentImage(imageUrl)}
                              className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                              title="Remove"
                              disabled={uploading}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {/* Images marked for deletion */}
                    {imagesToDelete.map((imageUrl, index) => (
                      <div key={`deleted-${index}`} className="relative group">
                        <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden opacity-50">
                          <img
                            src={imageUrl}
                            alt={`Deleted image ${index + 1}`}
                            className="w-full h-full object-cover grayscale"
                          />
                        </div>
                        <div className="absolute inset-0 bg-red-500 bg-opacity-30 rounded-lg flex items-center justify-center">
                          <div className="bg-red-500 text-white px-2 py-1 rounded text-xs font-medium">
                            Will be deleted
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => restoreImage(imageUrl)}
                          className="absolute top-2 right-2 bg-blue-500 text-white p-1 rounded-full hover:bg-blue-600 text-xs"
                          title="Restore"
                          disabled={uploading}
                        >
                          Restore
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Upload New Images */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-gray-700">Add New Images</h4>
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> new jewelry images
                      </p>
                      <p className="text-xs text-gray-500">PNG, JPG, JPEG (MAX. 10MB each)</p>
                    </div>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                      disabled={uploading}
                    />
                  </label>
                </div>

                {/* Display selected new images */}
                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">New Images to Upload:</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-green-200">
                            <img
                              src={URL.createObjectURL(file)}
                              alt={`New image ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="absolute top-2 right-2">
                            <button
                              type="button"
                              onClick={() => removeNewImage(index)}
                              className="bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                              disabled={uploading}
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="absolute bottom-2 left-2 bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                            New
                          </div>
                          <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white px-1 py-0.5 rounded text-xs">
                            {(file.size / 1024 / 1024).toFixed(1)}MB
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Gold Section */}
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

            {/* Diamonds Section */}
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
                  <p>No diamonds added. Click "Add Diamond" to include diamonds in this jewelry item.</p>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Price (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.base_price}
                onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                placeholder="Design complexity, additional stones, etc."
                disabled={uploading}
              />
              <p className="text-xs text-gray-500 mt-1">
                *Additional costs like design complexity, other stones, etc. (Gold, diamond, and making charges calculated separately)
              </p>
            </div>

            {(formData.gold_weight > 0 || formData.base_price > 0 || totalDiamondWeight > 0) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Live Price Preview</h4>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateJewelryPriceSync(
                    formData.base_price, formData.gold_weight, formData.gold_quality,
                    diamonds, formData.making_charges_per_gram, goldPrice, gstRate
                  ))}
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
            )}

            <div className="flex space-x-4 pt-4">
              <button
                type="submit"
                disabled={uploading}
                className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader className="h-4 w-4 animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    <span>{editingItem ? 'Update' : 'Add'} Item</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={onCancel}
                disabled={uploading}
                className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Image Preview Modal */}
      {previewImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-60 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-700 p-2 rounded-full hover:bg-gray-100 z-10"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={previewImage}
              alt="Preview"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
        </div>
      )}

      {/* Dropdown Overlay */}
      {showCategoryDropdown && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowCategoryDropdown(false)}
        />
      )}
    </>
  );
}