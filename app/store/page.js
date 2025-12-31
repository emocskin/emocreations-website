// app/store/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

export default function StorePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Use public anon key — safe for frontend
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    );

    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('tier', { ascending: false })
          .order('usd_price', { ascending: true });

        if (error) {
          console.error('Supabase fetch error:', error);
          setLoading(false);
          return;
        }

        setProducts(data);
      } catch (err) {
        console.error('Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        Loading the apothecary...
      </div>
    );
  }

  // Group products by name for display
  const uniqueProducts = Array.from(
    new Map(products.map(item => [item.name, item])).values()
  );

  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-12 text-center">The Apothecary</h1>
        
        {uniqueProducts.length === 0 ? (
          <p className="text-center text-gray-500">No products available.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {uniqueProducts.map((product) => (
              <div 
                key={product.id} 
                className="border border-gray-800 rounded-xl p-6 hover:border-turquoise transition"
              >
                <h2 className="text-xl font-bold mb-2">{product.name}</h2>
                <p className="text-gray-400 text-sm mb-4">{product.description}</p>
                
                {/* Show all sizes */}
                <div className="space-y-2 mb-4">
                  {products
                    .filter(p => p.name === product.name)
                    .map((size) => (
                      <div key={size.id} className="flex justify-between text-sm">
                        <span>{size.size_label}</span>
                        <span>
                          <span className="text-gray-400">${size.usd_price} • </span>
                          <span className="text-turquoise">{size.xec_amount} XEC</span>
                        </span>
                      </div>
                    ))}
                </div>
                
                <Link
                  href={`/blend?blend=${product.slug}`}
                  className="text-turquoise hover:underline text-sm"
                >
                  Unlock Blend →
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>All blends are formulated with cellular wellness in mind.</p>
          <p className="mt-1">Not a treatment. Complementary support only. Consult your healthcare provider.</p>
        </div>
      </div>
    </div>
  );
}
