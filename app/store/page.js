// app/store/page.js
'use client';

import Link from 'next/link';

// Static product data — based on your formulations and COGS
const PRODUCTS = [
  {
    name: "XE – Everybody’s Oil",
    slug: "xe",
    tier: "entry",
    sizes: [
      { size_label: "Roller", usd_price: 38, xec_amount: 67 },
      { size_label: "3 oz", usd_price: 38, xec_amount: 67 }
    ]
  },
  {
    name: "The Queen’s Oil",
    slug: "queen",
    tier: "signature",
    sizes: [
      { size_label: "Roller", usd_price: 38, xec_amount: 67 },
      { size_label: "3 oz", usd_price: 58, xec_amount: 103 },
      { size_label: "8 oz", usd_price: 98, xec_amount: 173 }
    ]
  },
  {
    name: "The King’s Oil",
    slug: "king",
    tier: "signature",
    sizes: [
      { size_label: "Roller", usd_price: 38, xec_amount: 67 },
      { size_label: "3 oz", usd_price: 58, xec_amount: 103 },
      { size_label: "8 oz", usd_price: 98, xec_amount: 173 }
    ]
  },
  {
    name: "Blood Type A Blend",
    slug: "blood-type-a",
    tier: "signature",
    sizes: [
      { size_label: "3 oz", usd_price: 58, xec_amount: 103 },
      { size_label: "8 oz", usd_price: 98, xec_amount: 173 }
    ]
  },
  {
    name: "Menopause Blend",
    slug: "menopause",
    tier: "signature",
    sizes: [
      { size_label: "3 oz", usd_price: 58, xec_amount: 103 },
      { size_label: "8 oz", usd_price: 98, xec_amount: 173 }
    ]
  },
  {
    name: "Metabolism Boost Elixir",
    slug: "metabolism",
    tier: "signature",
    sizes: [
      { size_label: "3 oz", usd_price: 58, xec_amount: 103 },
      { size_label: "8 oz", usd_price: 98, xec_amount: 173 }
    ]
  },
  {
    name: "Serene Relief Headache Therapy",
    slug: "headache",
    tier: "premium",
    sizes: [
      { size_label: "Roller", usd_price: 58, xec_amount: 103 },
      { size_label: "3 oz", usd_price: 78, xec_amount: 138 },
      { size_label: "8 oz", usd_price: 148, xec_amount: 262 }
    ]
  },
  {
    name: "Opioid Recovery Blend",
    slug: "opioid",
    tier: "premium",
    sizes: [
      { size_label: "Roller", usd_price: 58, xec_amount: 103 },
      { size_label: "3 oz", usd_price: 78, xec_amount: 138 },
      { size_label: "8 oz", usd_price: 148, xec_amount: 262 }
    ]
  },
  {
    name: "Joint Ease Relief Elixir",
    slug: "joint",
    tier: "premium",
    sizes: [
      { size_label: "3 oz", usd_price: 78, xec_amount: 138 },
      { size_label: "8 oz", usd_price: 148, xec_amount: 262 }
    ]
  },
  {
    name: "Glucose Balance Circulation Therapy",
    slug: "glucose",
    tier: "premium",
    sizes: [
      { size_label: "3 oz", usd_price: 78, xec_amount: 138 },
      { size_label: "8 oz", usd_price: 148, xec_amount: 262 }
    ]
  },
  {
    name: "The Unbroken Ointment",
    slug: "unbroken",
    tier: "premium",
    sizes: [
      { size_label: "Roller", usd_price: 58, xec_amount: 103 },
      { size_label: "3 oz", usd_price: 88, xec_amount: 156 },
      { size_label: "8 oz", usd_price: 168, xec_amount: 297 }
    ]
  },
  {
    name: "Deep Relief Sciatic Soother",
    slug: "sciatic",
    tier: "premium",
    sizes: [
      { size_label: "3 oz", usd_price: 88, xec_amount: 156 },
      { size_label: "8 oz", usd_price: 168, xec_amount: 297 }
    ]
  },
  {
    name: "Shoulder Freedom Floral Therapy",
    slug: "shoulder",
    tier: "premium",
    sizes: [
      { size_label: "3 oz", usd_price: 88, xec_amount: 156 },
      { size_label: "8 oz", usd_price: 168, xec_amount: 297 }
    ]
  },
  {
    name: "Telomere Repair Serum",
    slug: "telomere",
    tier: "ultra_premium",
    sizes: [
      { size_label: "Roller", usd_price: 88, xec_amount: 156 },
      { size_label: "3 oz", usd_price: 168, xec_amount: 297 }
    ]
  }
];

// Tier badge styling
const TIER_COLORS = {
  entry: 'bg-gray-700',
  signature: 'bg-slate-700',
  premium: 'bg-purple-900/50',
  ultra_premium: 'bg-emerald-900/30'
};

export default function StorePage() {
  return (
    <div className="min-h-screen bg-black text-white py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl md:text-4xl font-bold text-center mb-16">The Apothecary</h1>

        <div className="space-y-16">
          {PRODUCTS.map((blend, i) => (
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

        <div className="mt-20 text-center text-gray-500 text-sm">
          <p>All blends are formulated with cellular wellness in mind.</p>
          <p className="mt-1">Not a treatment. Complementary support only. Consult your healthcare provider.</p>
        </div>
      </div>
    </div>
  );
}
