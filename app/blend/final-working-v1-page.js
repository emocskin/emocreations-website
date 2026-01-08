// app/blend/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BlendPage() {
  const [product, setProduct] = useState(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const blendSlug = urlParams.get('blend') || 'xe';

    // Full product catalog with pricing
    const products = {
      'unbroken': { name: 'The Unbroken Ointment', price: 88, xec: 156 },
      'xe': { name: 'XE – Everybody’s Oil', price: 38, xec: 67 },
      'queen': { name: 'Queen’s Oil', price: 58, xec: 103 },
      'king': { name: 'The King’s Oil', price: 58, xec: 103 },
      'menopause': { name: 'Menopause Blend', price: 58, xec: 103 },
      'sciatic': { name: 'Deep Relief Sciatic Soother', price: 88, xec: 156 },
      'telomere': { name: 'Telomere Repair Serum', price: 168, xec: 297 },
      'joint': { name: 'Joint Ease Relief Elixir', price: 78, xec: 138 },
      'glucose': { name: 'Glucose Balance Circulation Therapy', price: 78, xec: 138 },
      'shoulder': { name: 'Shoulder Freedom Floral Therapy', price: 88, xec: 156 },
      'headache': { name: 'Serene Relief Headache Therapy', price: 78, xec: 138 },
      'opioid': { name: 'Opioid Recovery Blend', price: 78, xec: 138 },
      'blood-type-a': { name: 'Blood Type A Blend', price: 58, xec: 103 },
      'metabolism': { name: 'Metabolism Boost Elixir', price: 58, xec: 103 }
    };

    setProduct(products[blendSlug] || products['xe']);
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading blend details...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Banner */}
      <div 
        className="relative h-80 flex items-center justify-center"
        style={{
          backgroundImage: `url('/about-xec-banner.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-lg text-gray-300">
            Unlock this AI-curated blend. Powered by $XEC.
          </p>
        </div>
      </div>

      {/* Value & Pricing */}
      <section className="py-12 px-6 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold mb-4">Why Unlock This Blend?</h2>
            <p className="text-gray-400 mb-4">
              This isn’t a generic oil mix. It’s an AI-formulated, evidence-informed elixir designed for your specific wellness needs.
            </p>
            <p className="text-gray-400">
              Hold $XEC to unlock:  
              <br />• Full blend recipe  
              <br />• Downloadable JSON card  
              <br />• Option to order physical bottle
            </p>
          </div>
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold mb-4">Pricing</h3>
            <p className="text-gray-400 mb-2">Digital Unlock</p>
            <p className="text-white text-2xl font-bold">${product.price} • {product.xec} XEC</p>
            <p className="text-gray-400 mt-4 text-sm">
              Physical bottles ship in 3–5 days.
            </p>
          </div>
        </div>
      </section>

      {/* Payment Options */}
      <section className="py-12 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Unlock With</h2>
          
          {/* XEC Option */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800 mb-8">
            <h3 className="text-xl font-bold mb-4 text-turquoise">Pay with $XEC (Recommended)</h3>
            <p className="text-gray-400 mb-4">
              Hold {product.xec} XEC in your Xaman wallet to unlock instantly.
            </p>
            <Link
              href="/get-started"
              className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-6 rounded font-medium transition"
            >
              Get XEC Guide →
            </Link>
          </div>

          {/* PayPal Option */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold mb-4">Or Pay with Card</h3>
            <p className="text-gray-400 mb-4">
              Use PayPal for secure checkout. Ships in 3–5 days.
            </p>
            <form 
              action="https://www.paypal.com/cgi-bin/webscr" 
              method="post" 
              target="_top"
              className="text-center"
            >
              <input type="hidden" name="cmd" value="_s-xclick" />
              <input type="hidden" name="hosted_button_id" value="UZDG2HL3BMSUW" />
              <input
                type="image"
                src="https://www.paypalobjects.com/en_US/i/btn/btn_buynow_LG.gif"
                name="submit"
                alt="PayPal"
                className="h-10"
              />
            </form>
          </div>
        </div>
      </section>

      {/* Trust & Compliance */}
      <section className="py-8 px-6 text-center text-gray-500 text-sm">
        <p>
          Formulated with cellular wellness in mind. Not a treatment. Complementary support only.  
          <br />
          Consult your healthcare provider before use.
        </p>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center text-gray-500 text-sm border-t border-gray-800">
        <p className="mb-4">
          Follow the science: 
          <a href="https://instagram.com/emocreations.skin" target="_blank" rel="noopener" className="text-turquoise hover:underline ml-2">@emocreations.skin</a> • 
          <a href="https://tiktok.com/@emocreations.skin" target="_blank" rel="noopener" className="text-turquoise hover:underline ml-2">@emocreations.skin</a>
        </p>
        <p>© 2025 EmoCreations.skin — Crafted with cellular wellness in mind.</p>
      </footer>
    </div>
  );
}
