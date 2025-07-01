import React, { useState } from 'react';
import { JewelryItem, Category } from '../../lib/supabase';
import { Save, X, Upload, FileImage, Loader, ChevronDown, ChevronRight, Folder } from 'lucide-react';
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
  
  const [formData, setFormData] = useState({
    name: editingItem?.name || '', 
    description: editingItem?.description || '', 
    category: editingItem?.category || '', 
    gold_weight: editingItem?.gold_weight || 0,
    gold_quality: editingItem?.gold_quality || '22K', 
    diamond_weight: editingItem?.diamond_weight || 0, 
    diamond_quality: editingItem?.diamond_quality || '',
    diamond_cost_per_carat: editingItem?.diamond_cost_per_carat || 25000, 
    making_charges_per_gram: editingItem?.making_charges_per_gram || 500, 
    base_price: editingItem?.base_price || 0,
  });

  const [selectedImages, setSelectedImages] = useState<File[]>([]);

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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setSelectedImages(fileArray);
    }
  };

  const removeImage = (index: number) => {
    setSelectedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    
    try {
      let imageUrls: string[] = [];

      // Upload images to Google Drive if any are selected
      if (selectedImages.length > 0) {
        try {
          // Get category hierarchy for folder structure
          const selectedCategory = categories.find(cat => cat.name === formData.category);
          const parentCategory = selectedCategory?.parent_id 
            ? categories.find(cat => cat.id === selectedCategory.parent_id)
            : null;

          imageUrls = await GoogleDriveUploadService.uploadJewelryImages(
            selectedImages,
            formData.name,
            formData.category,
            parentCategory?.name
          );
          console.log('Successfully uploaded jewelry images:', imageUrls);
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError);
          alert(`Image upload failed: ${uploadError.message}. The item will be saved without images.`);
        }
      }

           // Prepare description with metadataAdd commentMore actions
      let enhancedDescription = formData.description;
      if (selectedImages.length > 0) {
        const imageMetadata = selectedImages.map(file => `name: ${file.name.split('.')[0]};`).join(' ');
        enhancedDescription = formData.description + (formData.description ? ' ' : '') + imageMetadata;
      }

      const itemData = {
        ...formData,
        description: enhancedDescription,
      };

      await onSubmit(itemData, imageUrls);
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please check your permissions and try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </h2>
            <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
              <X className="h-6 w-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                rows={3}
                disabled={uploading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Jewelry Images
              </label>
              <div className="space-y-3">
                <div className="flex items-center justify-center w-full">
                  <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-2 text-gray-500" />
                      <p className="mb-2 text-sm text-gray-500">
                        <span className="font-semibold">Click to upload</span> jewelry images
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

                {/* Display selected images */}
                {selectedImages.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-700">Selected Images:</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedImages.map((file, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                          <div className="flex items-center space-x-2">
                            <FileImage className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-700 truncate">{file.name}</span>
                            <span className="text-xs text-gray-500">
                              ({(file.size / 1024 / 1024).toFixed(2)} MB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="text-red-500 hover:text-red-700"
                            disabled={uploading}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500">
                  Images will be uploaded to: <code>WebCatalog(DO NOT EDIT)/[category]/[subcategory]</code>
                  <br />
                  File names will be based on the jewelry item name.
                  <br />
                  Image metadata will be added to the description automatically.
                </p>
              </div>
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

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Weight (carats)</label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.diamond_weight}
                  onChange={(e) => setFormData({ ...formData, diamond_weight: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  disabled={uploading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Quality</label>
                <input
                  type="text"
                  value={formData.diamond_quality}
                  onChange={(e) => setFormData({ ...formData, diamond_quality: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  placeholder="e.g., VS1, VVS, SI1"
                  disabled={uploading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Diamond Cost per Carat (₹)</label>
                <input
                  type="number"
                  value={formData.diamond_cost_per_carat}
                  onChange={(e) => setFormData({ ...formData, diamond_cost_per_carat: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  placeholder="25000"
                  disabled={uploading}
                />
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

            {(formData.gold_weight > 0 || formData.base_price > 0) && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h4 className="text-sm font-medium text-green-800 mb-2">Live Price Preview</h4>
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(calculateJewelryPriceSync(
                    formData.base_price, formData.gold_weight, formData.gold_quality,
                    formData.diamond_weight, formData.diamond_cost_per_carat,
                    formData.making_charges_per_gram, goldPrice, gstRate
                  ))}
                </div>
                <p className="text-xs text-green-600 mt-1">
                  *Including live gold price ({formatCurrency(goldPrice)}/gram) + GST ({Math.round(gstRate * 100)}%)
                </p>
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
                    <span>Uploading...</span>
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