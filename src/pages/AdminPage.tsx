import React, { useState, useEffect } from 'react';
import { supabase, JewelryItem, Category } from '../lib/supabase';
import { AdminLogin } from '../components/AdminLogin';
import { Plus, Edit, Trash2, Save, X, LogOut, Shield, Folder, Package, Settings, Image } from 'lucide-react';
import { formatCurrency, calculateJewelryPriceSync } from '../lib/goldPrice';
import { useGoldPrice } from '../hooks/useGoldPrice';
import { useAdminSettings } from '../hooks/useAdminSettings';

export function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeTab, setActiveTab] = useState<'items' | 'categories' | 'settings'>('items');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [showSettingsForm, setShowSettingsForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelryItem | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const { goldPrice } = useGoldPrice();
  const { fallbackGoldPrice, gstRate, updateSetting } = useAdminSettings();

  const [formData, setFormData] = useState({
    name: '', description: '', category: '', images: '', gold_weight: 0,
    gold_quality: '22K', diamond_weight: 0, diamond_quality: '',
    diamond_cost_per_carat: 25000, making_charges_per_gram: 500, base_price: 0,
  });

  const [categoryFormData, setCategoryFormData] = useState({
    name: '', description: '', image_url: '',
  });

  const [settingsFormData, setSettingsFormData] = useState({
    fallback_gold_price: fallbackGoldPrice.toString(),
    gst_rate: (gstRate * 100).toString(),
  });

  useEffect(() => {
    checkAuthStatus();
  }, []);

  useEffect(() => {
    if (isAuthenticated) loadData();
  }, [isAuthenticated]);

  useEffect(() => {
    setSettingsFormData({
      fallback_gold_price: fallbackGoldPrice.toString(),
      gst_rate: (gstRate * 100).toString(),
    });
  }, [fallbackGoldPrice, gstRate]);

  const checkAuthStatus = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      setIsAuthenticated(!!session);
    } catch (error) {
      console.error('Error checking auth status:', error);
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      setIsAuthenticated(false);
      setItems([]);
      setCategories([]);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const loadData = async () => {
    try {
      const [itemsResponse, categoriesResponse] = await Promise.all([
        supabase.from('jewelry_items').select('*').order('created_at', { ascending: false }),
        supabase.from('categories').select('*').order('name')
      ]);

      if (itemsResponse.data) setItems(itemsResponse.data);
      if (categoriesResponse.data) setCategories(categoriesResponse.data);
    } catch (error) {
      console.error('Error loading data:', error);
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
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', description: '', image_url: '' });
    setShowAddCategoryForm(false);
    setEditingCategory(null);
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

  const startEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryFormData({
      name: category.name,
      description: category.description || '',
      image_url: category.image_url || '',
    });
    setShowAddCategoryForm(true);
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
      
      await loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving item:', error);
      alert('Error saving item. Please check your permissions and try again.');
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('categories')
          .update(categoryFormData)
          .eq('id', editingCategory.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('categories').insert([categoryFormData]);
        if (error) throw error;
      }
      
      await loadData();
      resetCategoryForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please check your permissions and try again.');
    }
  };

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const fallbackPrice = parseFloat(settingsFormData.fallback_gold_price);
      const gstDecimal = parseFloat(settingsFormData.gst_rate) / 100;

      const success1 = await updateSetting('fallback_gold_price', fallbackPrice.toString());
      const success2 = await updateSetting('gst_rate', gstDecimal.toString());

      if (success1 && success2) {
        alert('Settings updated successfully!');
        setShowSettingsForm(false);
      } else {
        alert('Error updating settings. Please try again.');
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      alert('Error updating settings. Please check your input values.');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this item?')) {
      try {
        const { error } = await supabase.from('jewelry_items').delete().eq('id', id);
        if (error) throw error;
        await loadData();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Error deleting item. Please check your permissions and try again.');
      }
    }
  };

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    const { count } = await supabase
      .from('jewelry_items')
      .select('*', { count: 'exact', head: true })
      .eq('category', categoryName);

    if (count && count > 0) {
      alert(`Cannot delete category "${categoryName}" because it contains ${count} items. Please move or delete the items first.`);
      return;
    }

    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        await loadData();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please check your permissions and try again.');
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-yellow-600 mx-auto animate-pulse" />
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AdminLogin onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center space-x-4">
          <img 
            src="/logo white_1751105895813.jpg" 
            alt="Khushii With Diamond Logo" 
            className="h-12 w-auto object-contain bg-gradient-to-r from-gray-800 to-black rounded-lg p-2"
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Khushii With Diamond</h1>
            <p className="text-gray-600 mt-1">Admin Panel - Manage your jewelry catalog</p>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">
            Gold Price: <span className="font-semibold text-yellow-600">{formatCurrency(goldPrice)}/gram</span>
          </div>
          <div className="text-sm text-gray-600">
            GST: <span className="font-semibold text-green-600">{Math.round(gstRate * 100)}%</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 flex items-center space-x-2"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-8">
        {[
          { key: 'items', icon: Package, label: `Items (${items.length})` },
          { key: 'categories', icon: Folder, label: `Categories (${categories.length})` },
          { key: 'settings', icon: Settings, label: 'Settings' }
        ].map(({ key, icon: Icon, label }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key as any)}
            className={`px-4 py-2 rounded-lg flex items-center space-x-2 ${
              activeTab === key
                ? 'bg-yellow-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Icon className="h-5 w-5" />
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Items Tab */}
      {activeTab === 'items' && (
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
                          <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            {item.category}
                          </span>
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
        </>
      )}

      {/* Categories Tab */}
      {activeTab === 'categories' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Categories</h2>
            <button
              onClick={() => setShowAddCategoryForm(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
            >
              <Plus className="h-5 w-5" />
              <span>Add New Category</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const itemCount = items.filter(item => item.category === category.name).length;
              const imageCount = category.image_url 
                ? category.image_url.split(',').map(url => url.trim()).filter(url => url).length
                : 0;
              
              return (
                <div key={category.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                  <div className="relative h-32">
                    <img
                      src={category.image_url?.split(',')[0]?.trim() || 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg'}
                      alt={category.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button
                        onClick={() => startEditCategory(category)}
                        className="bg-white bg-opacity-90 p-1 rounded-full hover:bg-opacity-100"
                      >
                        <Edit className="h-4 w-4 text-yellow-600" />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(category.id, category.name)}
                        className="bg-white bg-opacity-90 p-1 rounded-full hover:bg-opacity-100"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </button>
                    </div>
                    {imageCount > 1 && (
                      <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1">
                        <Image className="h-3 w-3" />
                        <span>{imageCount}</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">{category.name}</h3>
                    <p className="text-sm text-gray-600 mb-2">{category.description}</p>
                    <p className="text-xs text-gray-500">{itemCount} items</p>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">System Settings</h2>
            <button
              onClick={() => setShowSettingsForm(true)}
              className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
            >
              <Edit className="h-5 w-5" />
              <span>Edit Settings</span>
            </button>
          </div>

          <div className="bg-white shadow-lg rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Fallback Gold Price</h3>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(fallbackGoldPrice)}/gram</p>
                <p className="text-sm text-yellow-700 mt-1">Used when live API fails</p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-green-800 mb-2">GST Rate</h3>
                <p className="text-2xl font-bold text-green-600">{Math.round(gstRate * 100)}%</p>
                <p className="text-sm text-green-700 mt-1">Applied to all jewelry items</p>
              </div>
            </div>

            <div className="mt-6 bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Current Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Live Gold Price:</span>
                  <span className="font-medium">{formatCurrency(goldPrice)}/gram</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Price Source:</span>
                  <span className="font-medium">{goldPrice === fallbackGoldPrice ? 'Fallback' : 'Live API'}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Forms */}
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
                <select
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
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

      {showAddCategoryForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
              </h2>
              <button onClick={resetCategoryForm} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              {[
                { label: 'Name', key: 'name', required: true, placeholder: 'e.g., Rings, Necklaces' },
                { label: 'Description', key: 'description', type: 'textarea', placeholder: 'Brief description of the category' },
              ].map(({ label, key, type = 'text', required, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  {type === 'textarea' ? (
                    <textarea
                      value={categoryFormData[key as keyof typeof categoryFormData]}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                      rows={3}
                      placeholder={placeholder}
                    />
                  ) : (
                    <input
                      type={type}
                      required={required}
                      value={categoryFormData[key as keyof typeof categoryFormData]}
                      onChange={(e) => setCategoryFormData({ ...categoryFormData, [key]: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                      placeholder={placeholder}
                    />
                  )}
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Image URLs (comma separated)
                </label>
                <textarea
                  value={categoryFormData.image_url}
                  onChange={(e) => setCategoryFormData({ ...categoryFormData, image_url: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  rows={3}
                  placeholder="https://example.com/image1.jpg, https://example.com/image2.jpg"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Add multiple image URLs separated by commas for category slideshow.
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>{editingCategory ? 'Update' : 'Add'} Category</span>
                </button>
                <button
                  type="button"
                  onClick={resetCategoryForm}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showSettingsForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Edit System Settings</h2>
              <button onClick={() => setShowSettingsForm(false)} className="text-gray-500 hover:text-gray-700">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSettingsSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fallback Gold Price (₹/gram)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settingsFormData.fallback_gold_price}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, fallback_gold_price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  placeholder="5450"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Used when live gold price API is unavailable
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Rate (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={settingsFormData.gst_rate}
                  onChange={(e) => setSettingsFormData({ ...settingsFormData, gst_rate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-yellow-500"
                  placeholder="18"
                />
                <p className="text-xs text-gray-500 mt-1">
                  GST percentage applied to all jewelry items
                </p>
              </div>

              <div className="flex space-x-4 pt-4">
                <button
                  type="submit"
                  className="bg-yellow-600 text-white px-4 py-2 rounded-md hover:bg-yellow-700 flex items-center space-x-2"
                >
                  <Save className="h-4 w-4" />
                  <span>Update Settings</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowSettingsForm(false)}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}