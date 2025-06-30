import React, { useState, useEffect } from 'react';
import { supabase, Category, JewelryItem } from '../../lib/supabase';
import { Plus, Edit, Trash2, Save, X, Image } from 'lucide-react';

interface AdminCategoriesTabProps {
  items: JewelryItem[];
  onCategoriesChange: () => void;
}

export function AdminCategoriesTab({ items, onCategoriesChange }: AdminCategoriesTabProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showAddCategoryForm, setShowAddCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [categoryFormData, setCategoryFormData] = useState({
    name: '', description: '', image_url: '',
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await supabase
        .from('categories')
        .select('*')
        .order('name');
      
      if (data) {
        setCategories(data);
        onCategoriesChange();
      }
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const resetCategoryForm = () => {
    setCategoryFormData({ name: '', description: '', image_url: '' });
    setShowAddCategoryForm(false);
    setEditingCategory(null);
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
      
      await loadCategories();
      resetCategoryForm();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Error saving category. Please check your permissions and try again.');
    }
  };

  const handleDeleteCategory = async (id: string, categoryName: string) => {
    const itemCount = items.filter(item => item.category === categoryName).length;

    if (itemCount > 0) {
      alert(`Cannot delete category "${categoryName}" because it contains ${itemCount} items. Please move or delete the items first.`);
      return;
    }

    if (confirm(`Are you sure you want to delete the category "${categoryName}"?`)) {
      try {
        const { error } = await supabase.from('categories').delete().eq('id', id);
        if (error) throw error;
        await loadCategories();
      } catch (error) {
        console.error('Error deleting category:', error);
        alert('Error deleting category. Please check your permissions and try again.');
      }
    }
  };

  return (
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

      {/* Add/Edit Category Form Modal */}
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
    </>
  );
}