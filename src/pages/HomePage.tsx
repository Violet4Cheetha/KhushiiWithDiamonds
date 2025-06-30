import React, { useEffect, useState } from 'react';
import { supabase, Category } from '../lib/supabase';
import { CategoryCard } from '../components/CategoryCard';
import { GoldPriceDisplay } from '../components/GoldPriceDisplay';
import { Sparkles } from 'lucide-react';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Attempting to load categories...');
        
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        console.log('Categories response:', { data: categoriesData, error: categoriesError });

        if (categoriesError) {
          throw categoriesError;
        }

        if (categoriesData) {
          setCategories(categoriesData);

          const counts: Record<string, number> = {};
          for (const category of categoriesData) {
            const { count, error: countError } = await supabase
              .from('jewelry_items')
              .select('*', { count: 'exact', head: true })
              .eq('category', category.name);
            
            if (countError) {
              console.warn(`Error counting items for ${category.name}:`, countError);
              counts[category.name] = 0;
            } else {
              counts[category.name] = count || 0;
            }
          }
          setItemCounts(counts);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setError(error instanceof Error ? error.message : 'Unknown error occurred');
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center max-w-2xl">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Connection Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          
          <button
            onClick={() => setShowDebug(!showDebug)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 mb-4"
          >
            {showDebug ? 'Hide' : 'Show'} Debug Info
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 ml-2"
          >
            Retry
          </button>

          {showDebug && (
            <div className="mt-6">
              <DebugPanel />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <section className="relative h-96 bg-gradient-to-r from-orange-900 via-red-900 to-yellow-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative text-center text-white z-10">
          <h1 className="text-5xl font-bold mb-4">Premium Indian Jewellery</h1>
          <p className="text-xl mb-8">Live Gold Pricing</p>
          <div className="max-w-md mx-auto">
            <GoldPriceDisplay />
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">Shop by Category</h2>
          <p className="text-xl text-gray-600">Discover our curated collection of fine Indian jewellery</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">There might be a database connection issue.</p>
            <button
              onClick={() => setShowDebug(!showDebug)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Show Debug Info
            </button>
            {showDebug && (
              <div className="mt-6">
                <DebugPanel />
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {categories.map((category) => (
              <CategoryCard
                key={category.id}
                category={category}
                itemCount={itemCounts[category.name] || 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}