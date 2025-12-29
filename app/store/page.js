// app/store/page.js
'use client';

import { useState } from 'react';
import Link from 'next/link';

// Mock data — replace with Supabase fetch in production
const products = [
  {
    name: "XE – Everybody’s Oil",
    tier: "entry",
    sizes: [
      { label: "Roller", usd: 38, xec: 67 },
      { label: "3 oz", usd: 38, xec: 67 }
    ],
    description: "Universal wellness elixir. Accessible to all."
  },
  {
    name: "The Queen’s Oil",
    tier: "signature",
    sizes: [
      { label: "Roller", usd: 38, xec: 67 },
      { label: "3 oz", usd: 58, xec: 103 },
      { label: "8 oz", usd: 98, xec: 173 }
    ],
    description: "Geranium-based. Anti-aging, hormone balance, vibrant skin."
  },
  {
    name: "The Unbroken Ointment",
    tier: "premium",
    sizes: [
      { label: "Roller", usd: 58, xec: 103 },
      { label: "3 oz", usd: 88, xec: 156 },
      { label: "8 oz", usd: 168, xec: 297 }
    ],
    description: "For bodies that carry invisible battles. Ceremonial oil for pain and remembrance."
  }
  // Add all 13 products in production
];

export default function StorePage() {
  const [selectedProduct, setSelectedProduct] = useState(null);

  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-12 text-center">The Apothecary</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map((product, i) => (
            <div key={i} className="border border-gray-800 rounded-xl p-6 hover:border-turquoise transition">
              <h2 className="text-xl font-bold mb-2">{product.name}</h2>
              <p className="text-gray-400 text-sm mb-4">{product.description}</p>
              
              <div className="space-y-3">
                {product.sizes.map((size, j) => (
                  <div key={j} className="flex justify-between items-center py-2 border-b border-gray-800">
                    <span className="text-sm">{size.label}</span>
                    <div>
                      <span className="text-gray-400">${size.usd} • </span>
                      <span className="text-turquoise">{size.xec} XEC</span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 flex gap-2">
                <Link
                  href={`/blend?blend=${product.name.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-turquoise hover:underline text-sm"
                >
                  View Details →
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-16 text-center text-gray-500 text-sm">
          <p>All blends are formulated with cellular wellness in mind.</p>
          <p className="mt-1">Not a treatment. Complementary support only. Consult your healthcare provider.</p>
        </div>
      </div>
    </div>
  );
}
