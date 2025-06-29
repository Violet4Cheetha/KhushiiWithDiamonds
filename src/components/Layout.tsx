import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, ChevronDown, Diamond, AlertCircle } from 'lucide-react';
import { supabase, Category, isSupabaseConfigured } from '../lib/supabase';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const loadCategories = async () => {
      try {
        if (!isSupabaseConfigured()) {
          setError('Database not configured');
          return;
        }

        const { data, error: fetchError } = await supabase!
          .from('categories')
          .select('*')
          .order('name');
        
        if (fetchError) {
          throw fetchError;
        }
        
        if (data) setCategories(data);
      } catch (error) {
        console.error('Error loading categories:', error);
        setError('Failed to load categories');
      }
    };

    loadCategories();
  }, []);

  const navigation = [
    { name: 'Home', path: '/' },
    { name: 'Admin', path: '/admin' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-lg border-b-2 border-yellow-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex items-center space-x-3">
              <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                <Diamond className="h-8 w-8 text-white" />
              </div>
              <div>
                <span className="text-2xl font-bold text-gray-900">Khushii With Diamond</span>
                <div className="text-xs text-gray-600">Premium Indian Jewelry</div>
              </div>
            </Link>

            <nav className="hidden md:flex items-center space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-700 hover:text-yellow-600 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="relative">
                <button
                  onClick={() => setIsCategoryDropdownOpen(!isCategoryDropdownOpen)}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:text-yellow-600 hover:bg-gray-100 transition-colors"
                >
                  <span>Categories</span>
                  <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCategoryDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 z-50">
                    <div className="py-1">
                      {error ? (
                        <div className="px-4 py-2 text-sm text-red-600 flex items-center">
                          <AlertCircle className="h-4 w-4 mr-2" />
                          Categories unavailable
                        </div>
                      ) : categories.length > 0 ? (
                        categories.map((category) => (
                          <Link
                            key={category.id}
                            to={`/category/${category.name}`}
                            onClick={() => setIsCategoryDropdownOpen(false)}
                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-yellow-50 hover:text-yellow-600 transition-colors"
                          >
                            {category.name}
                          </Link>
                        ))
                      ) : (
                        <div className="px-4 py-2 text-sm text-gray-500">
                          No categories available
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </nav>

            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-yellow-600 hover:bg-gray-100"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.path}
                  onClick={() => setIsMenuOpen(false)}
                  className={`block px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    location.pathname === item.path
                      ? 'text-yellow-600 bg-yellow-50'
                      : 'text-gray-700 hover:text-yellow-600 hover:bg-gray-100'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              <div className="px-3 py-2">
                <div className="text-base font-medium text-gray-900 mb-2">Categories</div>
                <div className="space-y-1 pl-4">
                  {error ? (
                    <div className="px-3 py-2 text-sm text-red-600 flex items-center">
                      <AlertCircle className="h-4 w-4 mr-2" />
                      Categories unavailable
                    </div>
                  ) : categories.length > 0 ? (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        to={`/category/${category.name}`}
                        onClick={() => setIsMenuOpen(false)}
                        className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:text-yellow-600 hover:bg-gray-100 transition-colors"
                      >
                        {category.name}
                      </Link>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No categories available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {isCategoryDropdownOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsCategoryDropdownOpen(false)}
        />
      )}

      <main className="flex-1">
        {children}
      </main>

      <footer className="bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-2 rounded-lg">
                  <Diamond className="h-6 w-6 text-white" />
                </div>
                <span className="text-lg font-semibold">Khushii With Diamond</span>
              </div>
              <p className="text-gray-400 mb-4">
                Premium Indian jewelry with live gold pricing and exquisite craftsmanship.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-4">Contact</h3>
              <ul className="space-y-2 text-gray-400">
                <li>support@khushiiwithdiamonds.com</li>
                <li>+91 98765 43210</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2025 Khushii With Diamond. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}