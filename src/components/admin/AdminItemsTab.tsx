import React, { useState, useEffect } from 'react';
import { supabase, JewelryItem, Category } from '../../lib/supabase';
import { Plus, Edit, Trash2, Image, ChevronRight } from 'lucide-react';
import { formatCurrency, calculateJewelryPriceSync } from '../../lib/goldPrice';
import { JewelryForm } from './JewelryForm';

interface AdminItemsTabProps {
  categories: Category[];
  goldPrice: number;
  gstRate: number;
}

export function AdminItemsTab({ categories, goldPrice, gstRate }: AdminItemsTabProps) {
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<JewelryItem | null>(null);

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
    setShowAddForm(false);
    setEditingItem(null);
  };

  const startEdit = (item: JewelryItem) => {
    setEditingItem(item);
    setShowAddForm(true);
  };

  const handleSubmit = async (itemData: any, imageUrls: string[]) => {
    const finalItemData = {
      ...itemData,
      images: imageUrls, // Use actual Google Drive URLs
    };

    if (editingItem) {
      const { error } = await supabase
        .from('jewelry_items')
        .update({ ...finalItemData, updated_at: new Date().toISOString() })
        .eq('id', editingItem.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('jewelry_items').insert([finalItemData]);
      if (error) throw error;
    }
    
    await loadItems();
    resetForm();
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
        <JewelryForm
          categories={categories}
          editingItem={editingItem}
          goldPrice={goldPrice}
          gstRate={gstRate}
          onSubmit={handleSubmit}
          onCancel={resetForm}
        />
      )}
    </>
  );
}