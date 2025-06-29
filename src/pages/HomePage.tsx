import React, { useEffect, useState } from 'react';
import { supabase, Category, isSupabaseConfigured } from '../lib/supabase';
import { CategoryCard } from '../components/CategoryCard';
import { GoldPriceDisplay } from '../components/GoldPriceDisplay';
import { Sparkles, Diamond, AlertCircle } from 'lucide-react';

// Fallback categories for when database is not available
const fallbackCategories: Category[] = [
  {
    id: '1',
    name: 'Rings',
    description: 'Elegant rings for every occasion',
    image_url: 'https://images.pexels.com/photos/265856/pexels-photo-265856.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Necklaces',
    description: 'Beautiful necklaces and pendants',
    image_url: 'https://images.pexels.com/photos/1191531/pexels-photo-1191531.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    name: 'Earrings',
    description: 'Stunning earrings collection',
    image_url: 'https://images.pexels.com/photos/1420708/pexels-photo-1420708.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: '4',
    name: 'Bracelets',
    description: 'Elegant bracelets and bangles',
    image_url: 'https://images.pexels.com/photos/1458885/pexels-photo-1458885.jpeg',
    created_at: new Date().toISOString()
  },
  {
    id: '5',
    name: 'Watches',
    description: 'Luxury timepieces',
    image_url: 'https://images.pexels.com/photos/125779/pexels-photo-125779.jpeg',
    created_at: new Date().toISOString()
  }
];

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (!isSupabaseConfigured()) {
          // Use fallback data when Supabase is not configured
          setCategories(fallbackCategories);
          const counts: Record<string, number> = {};
          fallbackCategories.forEach(cat => {
            counts[cat.name] = Math.floor(Math.random() * 20) + 5; // Random count for demo
          });
          setItemCounts(counts);
          setError('Database not configured - showing demo data');
          return;
        }

        const { data: categoriesData, error: categoriesError } = await supabase!
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesError) {
          throw categoriesError;
        }

        if (categoriesData && categoriesData.length > 0) {
          setCategories(categoriesData);

          const counts: Record<string, number> = {};
          for (const category of categoriesData) {
            const { count } = await supabase!
              .from('jewelry_items')
              .select('*', { count: 'exact', head: true })
              .eq('category', category.name);
            counts[category.name] = count || 0;
          }
          setItemCounts(counts);
        } else {
          // Use fallback if no categories in database
          setCategories(fallbackCategories);
          const counts: Record<string, number> = {};
          fallbackCategories.forEach(cat => {
            counts[cat.name] = 0;
          });
          setItemCounts(counts);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Failed to load data - showing demo categories');
        setCategories(fallbackCategories);
        const counts: Record<string, number> = {};
        fallbackCategories.forEach(cat => {
          counts[cat.name] = Math.floor(Math.random() * 15) + 3;
        });
        setItemCounts(counts);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Sparkles className="h-12 w-12 text-yellow-600 mx-auto animate-spin" />
          <p className="mt-4 text-gray-600">Loading jewelry collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      {error && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mx-4 sm:mx-6 lg:mx-8">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-yellow-600 mr-2" />
            <p className="text-yellow-800 text-sm">{error}</p>
          </div>
        </div>
      )}

      <section className="relative h-96 bg-gradient-to-r from-purple-900 via-pink-900 to-red-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-50"></div>
        <div className="relative text-center text-white z-10">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-white bg-opacity-20 backdrop-blur-sm p-4 rounded-2xl">
              <Diamond className="h-16 w-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold mb-4">Khushii With Diamond</h1>
          <p className="text-xl mb-8">Premium Indian Jewelry • Live Gold Pricing</p>
          <div className="max-w-md mx-auto">
            <GoldPriceDisplay />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-xl text-gray-600">Discover our curated collection of fine Indian jewelry</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              itemCount={itemCounts[category.name] || 0}
            />
          ))}
        </div>
      </section>
    </div>
  );
}