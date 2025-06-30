import React, { useEffect, useState } from 'react';
import { supabase, Category } from '../lib/supabase';
import { CategoryCard } from '../components/CategoryCard';
import { GoldPriceDisplay } from '../components/GoldPriceDisplay';
import { Sparkles, ChevronRight, Folder } from 'lucide-react';

export function HomePage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({});
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const toggleExpanded = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  // Organize categories into hierarchy
  const topLevelCategories = categories.filter(cat => !cat.parent_id);
  const getSubcategories = (parentId: string) => 
    categories.filter(cat => cat.parent_id === parentId);

  const CategorySection = ({ category }: { category: Category }) => {
    const subcategories = getSubcategories(category.id);
    const hasSubcategories = subcategories.length > 0;
    const isExpanded = expandedCategories.has(category.id);
    const totalItems = itemCounts[category.name] || 0;
    const subcategoryItems = subcategories.reduce((sum, sub) => sum + (itemCounts[sub.name] || 0), 0);

    return (
      <div key={category.id} className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <CategoryCard 
              category={category} 
              itemCount={totalItems + subcategoryItems}
            />
            {hasSubcategories && (
              <button
                onClick={() => toggleExpanded(category.id)}
                className="flex items-center space-x-2 px-4 py-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200"
              >
                <Folder className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  {subcategories.length} subcategories
                </span>
                <ChevronRight 
                  className={`h-4 w-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                />
              </button>
            )}
          </div>
        </div>

        {hasSubcategories && isExpanded && (
          <div className="ml-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 p-6 bg-gray-50 rounded-lg border-l-4 border-blue-200">
            <div className="col-span-full mb-4">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center space-x-2">
                <span>{category.name} Subcategories</span>
                <span className="text-sm text-gray-500">({subcategories.length})</span>
              </h3>
            </div>
            {subcategories.map((subcategory) => (
              <CategoryCard
                key={subcategory.id}
                category={subcategory}
                itemCount={itemCounts[subcategory.name] || 0}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

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
          <p className="text-sm text-gray-500 mt-2">Click on category folders to explore subcategories</p>
        </div>

        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories found</h3>
            <p className="text-gray-600 mb-4">There might be a database connection issue.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {topLevelCategories.map((category) => (
              <CategorySection key={category.id} category={category} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
