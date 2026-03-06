// app/blend-delivery/page.js
'use client';

// ✅ CRITICAL: Force dynamic rendering to avoid caching sensitive blend data
export const dynamic = 'force-dynamic';

import { useEffect, useState, Suspense } from 'react'; // ✅ Added Suspense import
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

// ✅ Extract main logic into child component (safe to use useSearchParams inside)
function BlendDeliveryContent() {
  const searchParams = useSearchParams();
  const [blend, setBlend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ✅ Blend data (populated from URL params or API fetch)
  const blendSlug = searchParams.get('blend');
  const isVerified = searchParams.get('verified') === 'true';
  const isAiBlend = searchParams.get('ai') === 'true';
  const paymentMethod = searchParams.get('payment') || 'xec';
  const orderId = searchParams.get('order');

  useEffect(() => {
    // ✅ If verified, fetch blend details from backend (more secure than URL params)
    const fetchBlendDetails = async () => {
      if (!isVerified || !blendSlug) {
        setError('Invalid or expired link. Please complete verification first.');
        setLoading(false);
        return;
      }

      try {
        // Optional: Fetch from your API for server-validated data
        // const res = await fetch(`/api/get-unlocked-blend?slug=${blendSlug}`);
        // const data = await res.json();
        // setBlend(data);

        // ✅ Fallback: Reconstruct from predefined blends (for demo)
        const PREDEFINED_BLENDS = {
          'xe': { 
            name: 'XE – Everybody\'s Oil', 
            recipe: [
              { oil: 'Lavender', drops: 10, purpose: 'Calms nerves, reduces inflammation' },
              { oil: 'Roman Chamomile', drops: 8, purpose: 'Soothes tissue' },
              { oil: 'Bergamot FCF', drops: 6, purpose: 'Uplifts mood' }
            ],
            instructions: 'Mix in 30ml carrier oil. Apply to pulse points 2x daily.',
            price: 38
          },
          'queen': { 
            name: 'Queen\'s Oil', 
            recipe: [
              { oil: 'Rose', drops: 5, purpose: 'Promotes self-love, balances hormones' },
              { oil: 'Ylang Ylang', drops: 7, purpose: 'Enhances confidence, reduces stress' },
              { oil: 'Geranium', drops: 6, purpose: 'Supports emotional balance' }
            ],
            instructions: 'Dilute in jojoba oil. Apply to heart center and wrists.',
            price: 58
          },
          // Add more as needed...
        };

        if (PREDEFINED_BLENDS[blendSlug]) {
          setBlend({
            ...PREDEFINED_BLENDS[blendSlug],
            slug: blendSlug,
            isAi: false
          });
        } else if (isAiBlend) {
          // ✅ AI blends: In production, fetch from Supabase/unlocks table
          // For now, show placeholder (replace with real fetch)
          setBlend({
            name: 'Your Custom AI Blend',
            slug: blendSlug,
            isAi: true,
            description: 'Personalized for your wellness journey',
            recipe: [
              { oil: 'Loading...', drops: 0, purpose: 'Fetching your custom recipe...' }
            ],
            instructions: 'Your personalized instructions will appear once AI recipe is loaded.',
            price: 58
          });
          
          // 🔁 Optional: Fetch real AI recipe from backend
          // const res = await fetch(`/api/get-ai-recipe?slug=${blendSlug}`);
          // if (res.ok) {
          //   const data = await res.json();
          //   setBlend(data);
          // }
        } else {
          setError('Blend not found. Please select a valid blend.');
        }
      } catch (err) {
        console.error('Failed to load blend:', err);
        setError('Could not load blend details. Please contact support.');
      } finally {
        setLoading(false);
      }
    };

    fetchBlendDetails();
  }, [blendSlug, isVerified, isAiBlend]);

  // ✅ Loading State
  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-turquoise border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-gray-300">Preparing your blend...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
      </div>
    );
  }

  // ✅ Error State
  if (error || !isVerified) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="text-red-400 text-5xl mb-4">⚠️</div>
        <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
        <p className="text-gray-400 mb-6 max-w-md">{error || 'Please complete wallet verification to view your blend.'}</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            href="/blend"
            className="bg-turquoise hover:bg-teal-400 text-black py-3 px-6 rounded font-medium transition"
          >
            ← Back to Blends
          </Link>
          <Link
            href="/get-started"
            className="border border-turquoise text-turquoise hover:bg-turquoise/10 py-3 px-6 rounded font-medium transition"
          >
            Get XEC to Unlock
          </Link>
        </div>
      </div>
    );
  }

  if (!blend) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Blend data unavailable. Please try again.</p>
      </div>
    );
  }

  // ✅ Success: Display Unlocked Blend
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Success Header */}
      <div className="bg-gradient-to-r from-turquoise/20 to-teal-900/30 py-8 px-6 text-center border-b border-turquoise/30">
        <div className="text-4xl mb-2">✨</div>
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {blend.isAi ? 'Your AI-Curated Blend Is Ready!' : 'Blend Unlocked!'}
        </h1>
        <p className="text-lg text-gray-300">
          {blend.isAi 
            ? 'Personalized just for you. Thank you for supporting cellular wellness.' 
            : 'Thank you for your order. Your blend is being prepared.'}
        </p>
        
        {/* Order Summary */}
        <div className="mt-6 inline-block bg-black/50 px-6 py-3 rounded-full border border-turquoise/30">
          <p className="text-sm text-gray-400">
            {paymentMethod === 'xec' 
              ? `Paid with ${blend.price} XEC (≈$${blend.price * 0.37})` 
              : `Paid $${blend.price} USD via PayPal`}
            {orderId && <span className="block text-xs mt-1">Order: {orderId.slice(0, 8)}...</span>}
          </p>
        </div>
      </div>

      {/* Blend Recipe Card */}
      <div className="py-12 px-6 max-w-4xl mx-auto">
        <div className="bg-gray-900 p-6 md:p-8 rounded-2xl border border-gray-800 mb-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-turquoise">{blend.name}</h2>
              {blend.description && (
                <p className="text-gray-400 mt-1 italic">{blend.description}</p>
              )}
            </div>
            {blend.isAi && (
              <span className="bg-turquoise/20 text-turquoise text-xs px-3 py-1 rounded-full border border-turquoise/30">
                AI-Generated
              </span>
            )}
          </div>

          {/* Recipe List */}
          <h3 className="text-lg font-semibold mb-4">Your Personalized Recipe:</h3>
          <div className="space-y-3 mb-6">
            {blend.recipe?.map((item, idx) => (
              <div 
                key={idx} 
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-black/50 rounded-lg border border-gray-800"
              >
                <div>
                  <p className="font-medium text-white">{item.oil}</p>
                  <p className="text-sm text-gray-400">{item.purpose}</p>
                </div>
                <span className="text-turquoise font-bold mt-2 sm:mt-0">
                  {item.drops} drops
                </span>
              </div>
            ))}
          </div>

          {/* Instructions */}
          {blend.instructions && (
            <div className="bg-black p-4 rounded-lg border border-gray-800 mb-6">
              <p className="text-sm text-gray-300">
                <span className="font-semibold text-turquoise">How to use:</span> {blend.instructions}
              </p>
            </div>
          )}

          {/* Safety Disclaimer */}
          <div className="bg-yellow-900/20 border border-yellow-700/50 p-4 rounded-lg">
            <p className="text-xs text-yellow-200">
              ⚠️ <strong>For external use only.</strong> Dilute in carrier oil before skin application. 
              Patch test first. Discontinue if irritation occurs. Not a substitute for medical treatment. 
              Consult your healthcare provider before use, especially if pregnant, nursing, or on medication.
            </p>
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8">
          <h3 className="text-xl font-bold mb-4">What Happens Next?</h3>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start gap-3">
              <span className="text-turquoise font-bold">1.</span>
              <span>✅ <strong>Confirmation email</strong> sent to your registered address with this recipe</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-turquoise font-bold">2.</span>
              <span>🧪 <strong>Blend preparation</strong> begins within 24 hours (handcrafted in small batches)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-turquoise font-bold">3.</span>
              <span>📦 <strong>Ships in 3–5 business days</strong> with tracking via email</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-turquoise font-bold">4.</span>
              <span>💬 <strong>Wellness check-in</strong>: We'll email in 14 days to hear about your experience</span>
            </li>
          </ul>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/"
            className="flex-1 bg-turquoise hover:bg-teal-400 text-black py-4 px-6 rounded-xl font-semibold text-center transition shadow-lg shadow-turquoise/20"
          >
            🛍️ Continue Shopping
          </Link>
          <Link
            href="/account/orders"
            className="flex-1 border border-turquoise text-turquoise hover:bg-turquoise/10 py-4 px-6 rounded-xl font-semibold text-center transition"
          >
            📦 View Order History
          </Link>
        </div>

        {/* Save/Share Options */}
        <div className="mt-8 pt-6 border-t border-gray-800">
          <p className="text-sm text-gray-400 mb-3">Save or share your blend:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                // Simple copy-to-clipboard for recipe
                const text = `${blend.name}\n\n${blend.recipe?.map(i => `• ${i.oil}: ${i.drops} drops — ${i.purpose}`).join('\n')}\n\n${blend.instructions}`;
                navigator.clipboard.writeText(text);
                alert('Recipe copied to clipboard!');
              }}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded transition"
            >
              📋 Copy Recipe
            </button>
            <button
              onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: blend.name,
                    text: `Check out my custom blend from emocreations.skin: ${blend.name}`,
                    url: window.location.href
                  });
                } else {
                  alert('Sharing not supported on this device');
                }
              }}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded transition"
            >
              🔗 Share Link
            </button>
            <Link
              href={`/blend?blend=${blendSlug}`}
              className="text-sm bg-gray-800 hover:bg-gray-700 text-white py-2 px-4 rounded transition"
            >
              🔁 Create Another
            </Link>
          </div>
        </div>
      </div>

      {/* Trust & Compliance Footer */}
      <section className="py-8 px-6 text-center text-gray-500 text-sm border-t border-gray-800">
        <p className="mb-2">
          Formulated with cellular wellness in mind. Not a treatment. Complementary support only.
        </p>
        <p>
          © 2025 EmoCreations.skin • 
          <Link href="/privacy" className="text-turquoise hover:underline mx-1">Privacy</Link> • 
          <Link href="/terms" className="text-turquoise hover:underline mx-1">Terms</Link> • 
          <a href="mailto:emoc.xec@gmail.com" className="text-turquoise hover:underline mx-1">Support</a>
        </p>
      </section>
    </div>
  );
}

// ✅ FIX: Default export wraps content in Suspense boundary
export default function BlendDeliveryPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-12 h-12 border-4 border-turquoise border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-lg text-gray-300">Loading blend...</p>
        <p className="text-sm text-gray-500 mt-2">This may take a few seconds</p>
      </div>
    }>
      <BlendDeliveryContent />
    </Suspense>
  );
}
