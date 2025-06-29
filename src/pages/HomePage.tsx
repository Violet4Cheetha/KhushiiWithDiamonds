import React, { useEffect, useState } from 'react';
import { supabase, Category } from '../lib/supabase';
import { CategoryCard } from '../components/CategoryCard';
import { GoldPriceDisplay } from '../components/GoldPriceDisplay';
import { Sparkles } from 'lucide-react';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('name');

        if (categoriesData) {
          setCategories(categoriesData);

          const counts: Record<string, number> = {};
          for (const category of categoriesData) {
            const { count } = await supabase
              .from('jewelry_items')
              .select('*', { count: 'exact', head: true })
              .eq('category', category.name);
            counts[category.name] = count || 0;
          }
          setItemCounts(counts);
        }
      } catch (error) {
        console.error('Error loading data:', error);
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
      <section className="relative h-96 bg-gradient-to-r from-orange-900 via-red-900 to-yellow-900 flex items-center justify-center">
        <div className="absolute inset-0 bg-black opacity-40"></div>
        <div className="relative text-center text-white z-10">
          <h1 className="text-5xl font-bold mb-4">Premium Indian Jewelry</h1>
          <p className="text-xl mb-8">Live Gold Pricing</p>
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