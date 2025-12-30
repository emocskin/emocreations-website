// app/store/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Map slugs to blend names for grouping
const BLEND_NAMES = {
  'xe': 'XE – Everybody’s Oil',
  'queen': 'The Queen’s Oil',
  'king': 'The King’s Oil',
  'blood-type-a': 'Blood Type A Blend',
  'menopause': 'Menopause Blend',
  'metabolism': 'Metabolism Boost Elixir',
  'headache': 'Serene Relief Headache Therapy',
  'opioid': 'Opioid Recovery Blend',
  'joint': 'Joint Ease Relief Elixir',
  'glucose': 'Glucose Balance Circulation Therapy',
  'unbroken': 'The Unbroken Ointment',
  'sciatic': 'Deep Relief Sciatic Soother',
  'shoulder': 'Shoulder Freedom Floral Therapy',
  'telomere': 'Telomere Repair Serum'
};

// Map tier to color
const TIER_COLORS = {
  entry: 'bg-gray-700',
  signature: 'bg-slate-700',
  premium: 'bg-purple-900/50',
  ultra_premium: 'bg-emerald-900/30'
};

// Get slug from name
const getSlug = (name) => {
  const entry = Object.entries(BLEND_NAMES).find(([, n]) => n === name);
  return entry ? entry[0] : name.toLowerCase().replace(/\s+/g, '-');
};

export default function StorePage() {
  const [productsByBlend, setProductsByBlend] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data, error } = await supabase
          .from('products')
          .select('*')
          .order('size_oz', { ascending: true });

        if (error) throw error;

        // Group by blend name
        const grouped = {};
        data.forEach(product => {
          const blendKey = product.slug.split('-')[0]; // e.g., 'unbroken' from 'unbroken-3oz'
          const blendName = Object.values(BLEND_NAMES).find(name => 
            name.toLowerCase().includes(blendKey.replace(/-/g, ' '))
          ) || BLEND_NAMES[blendKey] || product.name;

          if (!grouped[blendName]) {
            grouped[blendName] = {
              name: blendName,
              slug: getSlug(blendName),
              tier: product.tier,
              sizes: []
            };
          }
          grouped[blendName].sizes.push(product);
        });

        setProductsByBlend(grouped);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-16">The Apothecary</h1>

        {loading ? (
          <div className="text-center text-gray-500">Loading products...</div>
        ) : (
          <div className="space-y-16">
            {Object.values(productsByBlend).map((blend, i) => (
              <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                {/* Product Image */}
                <div className="flex justify-center">
                  <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 w-full max-w-md">
                    <img 
                      src={`/gallery/${blend.slug}.jpg`} 
                      alt={blend.name}
                      className="w-full h-96 object-cover rounded-xl"
                      onError={(e) => e.currentTarget.src = '/gallery/xe.jpg'}
                    />
                  </div>
                </div>

                {/* Product Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${TIER_COLORS[blend.tier]}`}>
                      {blend.tier.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold mb-4">{blend.name}</h2>
                  
                  <div className="space-y-3 mb-6">
                    {blend.sizes.map((size, idx) => (
                      <div key={idx} className="flex justify-between items-center py-2 border-b border-gray-800">
                        <span className="text-sm">{size.size_label}</span>
                        <div>
                          <span className="text-gray-400">${size.usd_price} • </span>
                          <span className="text-turquoise">{size.xec_amount} XEC</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <Link
                    href={`/blend?blend=${blend.slug}`}
                    className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-6 rounded-full font-medium transition"
                  >
                    Unlock Blend →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-20 text-center text-gray-500 text-sm">
          <p>All blends are formulated with cellular wellness in mind.</p>
          <p className="mt-1">Not a treatment. Complementary support only. Consult your healthcare provider.</p>
        </div>
      </div>
    </div>
  );
}
