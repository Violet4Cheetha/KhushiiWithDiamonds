import React, { useState, useEffect } from 'react';
import { supabase, JewelryItem, Category } from '../../lib/supabase';
import { Plus, Edit, Trash2, Save, X, Image, ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react';
import { formatCurrency, calculateJewelryPriceSync } from '../../lib/goldPrice';

interface AdminItemsTabProps {
  categories: Category[];
  goldPrice: number;
  gstRate: number;
}

export function AdminItemsTab({ categories, goldPrice, gstRate }: AdminItemsTabProps) {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelryItem | null>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  
  const [formData, setFormData] = useState({
    name: '', description: '', category: '', images: '', gold_weight: 0,
    gold_quality: '22K', diamond_weight: 0, diamond_quality: '',
    diamond_cost_per_carat: 25000, making_charges_per_gram: 500, base_price: 0,
  });

  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const { data } = await supabase
        .from('jewelry_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) setItems(data);
    } catch (error) {
      console.error('Error loading items:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', description: '', category: '', images: '', gold_weight: 0,
      gold_quality: '22K', diamond_weight: 0, diamond_quality: '',
      diamond_cost_per_carat: 25000, making_charges_per_gram: 500, base_price: 0,
    });
    setShowAddForm(false);
    setEditingItem(null);
    setShowCategoryDropdown(false);
    setExpandedCategories(new Set());
  };

  const startEdit = (item: JewelryItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name, description: item.description, category: item.category,
      images: item.images.join(', '), gold_weight: item.gold_weight,
      gold_quality: item.gold_quality, diamond_weight: item.diamond_weight,
      diamond_quality: item.diamond_quality, diamond_cost_per_carat: item.diamond_cost_per_carat,
      making_charges_per_gram: item.making_charges_per_gram, base_price: item.base_price,
    });
    setShowAddForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const itemData = {
      ...formData,
      images: formData.images.split(',').map(img => img.trim()).filter(img => img),
    };

    try {
      if (editingItem) {
        const { error } = await supabase
          .from('jewelry_items')
          .update({ ...itemData, updated_at: new Date().toISOString() })
          .eq('id', editingItem.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('jewelry_items').insert([itemData]);
        if (error) throw error;
      }
      
      await loadItems();
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please check your permissions and try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const { error } = await supabase.from('jewelry_items').delete().eq('id', id);
        if (error) throw error;
        await loadItems();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please check your permissions and try again.');
      }
    }
  };

  const calculateTotalCost = (item: JewelryItem): number => {
    return calculateJewelryPriceSync(
      item.base_price, item.gold_weight, item.gold_quality,
      item.diamond_weight, item.diamond_cost_per_carat,
      item.making_charges_per_gram, goldPrice, gstRate
    );
  };

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

  return (
    <>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Jewelry Items</h2>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Add New Item</span>
        </button>
      </div>

      <div className="bg-white shadow-lg rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {['Item', 'Category', 'Images', 'Specifications', 'Cost Components (₹)', 'Total Cost (₹)', 'Actions'].map(header => (
                  <th key={header} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {items.map((item) => {
                const totalCost = calculateTotalCost(item);
                const categoryDisplay = getCategoryDisplayName(item.category);
                
                return (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-10 w-10 rounded-full object-cover"
                          src={item.images[0] || 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg'}
                          alt=""
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{item.name}</div>
                          <div className="text-sm text-gray-500">{item.description.substring(0, 50)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 mb-1">
                          {item.category}
                        </span>
                        {categoryDisplay.includes('→') && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <ChevronRight className="h-3 w-3 mr-1" />
                            {categoryDisplay}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-1">
                        <Image className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600">{item.images.length}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>Gold: {item.gold_weight}g ({item.gold_quality})</div>
                      {item.diamond_weight > 0 && (
                        <div>Diamond: {item.diamond_weight}ct {item.diamond_quality}</div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="space-y-1">
                        <div>Making: {formatCurrency(item.making_charges_per_gram)}/g</div>
                        {item.diamond_weight > 0 && (
                          <div>Diamond: {formatCurrency(item.diamond_cost_per_carat)}/ct</div>
                        )}
                        <div>Base: {formatCurrency(item.base_price)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-lg font-bold text-green-600">
                        {formatCurrency(totalCost)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Including GST & Live Gold
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => startEdit(item)}
                        className="text-yellow-600 hover:text-yellow-900 mr-4"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={resetForm} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {[
                { label: 'Name', key: 'name', type: 'text', required: true },
                { label: 'Description', key: 'description', type: 'textarea' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={formData[key as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                      rows={3}
                    />
                  ) : (
                    <input
                      type={type}
                      required={required}
                      value={formData[key as keyof typeof formData] as string}
                      onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Images (URLs, comma separated)
                </label>
                <textarea
                  value={formData.images}
                  onChange={(e) => setFormData({ ...formData, images: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg, https://example.com/image3.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add multiple image URLs separated by commas. Users can navigate through all images.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500 text-left flex items-center justify-between bg-white"
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
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gold Quality</label>
                  <select
                    value={formData.gold_quality}
                    onChange={(e) => setFormData({ ...formData, gold_quality: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  >
                    {['18K', '22K', '24K', '14K'].map(quality => (
                      <option key={quality} value={quality}>{quality}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Diamond Weight (carats)', key: 'diamond_weight', step: '0.01' },
                  { label: 'Diamond Quality', key: 'diamond_quality', type: 'text', placeholder: 'e.g., VS1, VVS, SI1' },
                  { label: 'Diamond Cost per Carat (₹)', key: 'diamond_cost_per_carat', placeholder: '25000' },
                  { label: 'Making Charges per Gram (₹)', key: 'making_charges_per_gram', placeholder: '500' },
                ].map(({ label, key, step, type = 'number', placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input
                      type={type}
                      step={step}
                      value={formData[key as keyof typeof formData]}
                      onChange={(e) => setFormData({ 
                        ...formData, 
                        [key]: type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value 
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                      placeholder={placeholder}
                    />
                  </div>
                ))}
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
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingItem ? 'Update' : 'Add'} Item</span>
                </button>
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
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