import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase, JewelryItem, isSupabaseConfigured } from '../lib/supabase';
import { JewelryCard } from '../components/JewelryCard';
import { Search, Filter, Sparkles, AlertCircle } from 'lucide-react';

export function CategoryPage() {
  const { categoryName } = useParams<{ categoryName: string }>();
  const [items, setItems] = useState<JewelryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<JewelryItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadItems = async () => {
      if (!categoryName) return;

      try {
        if (!isSupabaseConfigured()) {
          setError('Database not configured - no items to display');
          setItems([]);
          setFilteredItems([]);
          return;
        }

        const { data, error: fetchError } = await supabase!
          .from('jewelry_items')
          .select('*')
          .eq('category', categoryName)
          .order('created_at', { ascending: false });

        if (fetchError) {
          throw fetchError;
        }

        if (data) {
          setItems(data);
          setFilteredItems(data);
        }
      } catch (error) {
        console.error('Error loading items:', error);
        setError('Failed to load jewelry items');
        setItems([]);
        setFilteredItems([]);
      } finally {
        setLoading(false);
      }
    };

    loadItems();
  }, [categoryName]);

  useEffect(() => {
    let filtered = items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'price_low': return a.base_price - b.base_price;
        case 'price_high': return b.base_price - a.base_price;
        case 'newest': return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default: return 0;
      }
    });

    setFilteredItems(filtered);
  }, [items, searchTerm, sortBy]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-yellow-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading {categoryName}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">{categoryName}</h1>
        <p className="text-xl text-gray-600">{filteredItems.length} items available</p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search jewelry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
          />
        </div>

        <div className="relative">
          <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent appearance-none bg-white"
          >
            <option value="name">Sort by Name</option>
            <option value="price_low">Price: Low to High</option>
            <option value="price_high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>
      </div>

      {filteredItems.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No items found</h3>
          <p className="text-gray-600">
            {error ? 'Please check back later or contact support.' : 'Try adjusting your search or filters.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredItems.map((item) => (
            <JewelryCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}