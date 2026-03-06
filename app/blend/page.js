// app/blend/page.js
'use client';

// ✅ CRITICAL: Force dynamic rendering to avoid build-time errors
export const dynamic = 'force-dynamic';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

// ✅ Install with: npm install xrpl
import { Client } from 'xrpl';
// ✅ REMOVED: OpenAI import no longer needed client-side (proxied via backend)

export default function BlendPage() {
  const [product, setProduct] = useState(null);
  const [verificationState, setVerificationState] = useState('idle'); // idle | verifying | unlocked | insufficient
  const [xecBalance, setXecBalance] = useState(0);
  const [usdValue, setUsdValue] = useState(0);
  
  // ✅ Poe AI State
  const [userInput, setUserInput] = useState('');
  const [generatedBlend, setGeneratedBlend] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  
  const xummRef = useRef(null);
  const xrplClientRef = useRef(null);
  // ✅ REMOVED: poeClientRef no longer needed (API calls proxied via backend)

  // ✅ XEC Token Configuration - CORRECT ISSUER
  const XEC_CONFIG = {
    currency: 'XEC',
    issuer: 'rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX', // ✅ YOUR XEC ISSUER
    requiredUsdThreshold: 25, // Minimum $25 USD worth of XEC
  };

  // ✅ Predefined blends (fallback if AI not used)
  const PREDEFINED_BLENDS = {
    'unbroken': { name: 'The Unbroken Ointment', price: 88, xec: 156, slug: 'unbroken' },
    'xe': { name: 'XE – Everybody\'s Oil', price: 38, xec: 67, slug: 'xe' },
    'queen': { name: 'Queen\'s Oil', price: 58, xec: 103, slug: 'queen' },
    'king': { name: 'The King\'s Oil', price: 58, xec: 103, slug: 'king' },
    'menopause': { name: 'Menopause Blend', price: 58, xec: 103, slug: 'menopause' },
    'sciatic': { name: 'Deep Relief Sciatic Soother', price: 88, xec: 156, slug: 'sciatic' },
    'telomere': { name: 'Telomere Repair Serum', price: 168, xec: 297, slug: 'telomere' },
    'joint': { name: 'Joint Ease Relief Elixir', price: 78, xec: 138, slug: 'joint' },
    'glucose': { name: 'Glucose Balance Circulation Therapy', price: 78, xec: 138, slug: 'glucose' },
    'shoulder': { name: 'Shoulder Freedom Floral Therapy', price: 88, xec: 156, slug: 'shoulder' },
    'headache': { name: 'Serene Relief Headache Therapy', price: 78, xec: 138, slug: 'headache' },
    'opioid': { name: 'Opioid Recovery Blend', price: 78, xec: 138, slug: 'opioid' },
    'blood-type-a': { name: 'Blood Type A Blend', price: 58, xec: 103, slug: 'blood-type-a' },
    'metabolism': { name: 'Metabolism Boost Elixir', price: 58, xec: 103, slug: 'metabolism' }
  };

  useEffect(() => {
    // ✅ Load product from URL or default
    const urlParams = new URLSearchParams(window.location.search);
    const blendSlug = urlParams.get('blend') || 'xe';
    setProduct(PREDEFINED_BLENDS[blendSlug] || PREDEFINED_BLENDS['xe']);

    // ✅ Initialize XRPL client
    const initXrplClient = async () => {
      try {
        const client = new Client('wss://s1.ripple.com:51233');
        await client.connect();
        xrplClientRef.current = client;
      } catch (err) {
        console.error('Failed to connect to XRPL:', err);
      }
    };
    initXrplClient();

    // ✅ REMOVED: Poe/OpenAI client initialization (now proxied via backend for security)
    // Client-side Poe API calls exposed API key - all AI generation now goes through /api/generate-blend

    return () => {
      if (xrplClientRef.current?.isConnected) {
        xrplClientRef.current.disconnect();
      }
    };
  }, []);

  // ✅ FIXED: PayPal SDK loading via useEffect
  useEffect(() => {
    if (typeof window === 'undefined' || !product) return;
    if (document.getElementById('paypal-sdk')) return;

    const script = document.createElement('script');
    script.id = 'paypal-sdk';
    // ✅ FIXED: Removed trailing spaces from URL
    script.src = 'https://www.paypal.com/sdk/js?client-id=ATmYVsWxvBzV6cJgPrC_AvCmCi9WfjP3u4Mv8uyME_mvlw0zBKQ06-BNylvCY_IOMoBuQFyPvdLM1xZ6&currency=USD';
    script.async = true;
    
    script.onload = () => {
      if (window.paypal) {
        window.paypal.Buttons({
          createOrder: (data, actions) => {
            const targetProduct = generatedBlend || product;
            return actions.order.create({
              purchase_units: [{
                amount: { value: targetProduct.price.toString(), currency_code: 'USD' },
                description: targetProduct.name
              }]
            });
          },
          onApprove: async (data, actions) => {
            try {
              const details = await actions.order.capture();
              const targetProduct = generatedBlend || product;
              
              // ✅ FIXED: Added complete payload with AI fields + accounting
              await fetch('/api/submit-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: details.payer.email_address,
                  blend: targetProduct.slug || 'custom-ai-blend',
                  
                  // ✅ AI blend metadata
                  blendRecipe: generatedBlend?.recipe,
                  blendName: generatedBlend?.name,
                  blendDescription: generatedBlend?.description,
                  
                  // ✅ Payment accounting fields
                  orderId: details.id,
                  paymentMethod: 'paypal',
                  usdValue: targetProduct.price,
                  price: targetProduct.price,
                })
              });
              window.location.href = `/thank-you?order=${details.id}`;
            } catch (err) {
              console.error('Order submission failed:', err);
              alert('Order confirmed but fulfillment failed. Please contact support.');
            }
          },
          onError: (err) => {
            console.error('PayPal error:', err);
            alert('Payment failed. Please try again.');
          }
        }).render('#paypal-button-container');
      }
    };
    
    document.body.appendChild(script);
    return () => {
      const el = document.getElementById('paypal-sdk');
      if (el) el.remove();
    };
  }, [product, generatedBlend]);

  // ✅ UPDATED: Poe AI: Generate Custom Blend (via backend proxy for security)
  const handleGenerateBlend = async () => {
    if (!userInput.trim()) {
      setGenerationError('Please describe your wellness needs first.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);
    setGeneratedBlend(null);

    try {
      // ✅ Call OUR backend endpoint (not Poe directly) - API key stays secure on server
      const response = await fetch('/api/generate-blend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          // ✅ Rule-based fields (for known conditions)
          condition: null, // Optional: 'stress', 'headache', etc.
          scentPreference: null, // Optional: 'citrus', 'floral', etc.
          skinType: null, // Optional: 'normal', 'dry', etc.
          
          // ✅ AI fields (for custom requests)
          userInput: userInput, // The user's free-text description
          useAI: userInput?.length > 30 // Force AI for detailed requests
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate blend');
      }

      // ✅ Use the blend data returned from our backend (same format whether rule-based or AI)
      const blendData = data.blend;
      
      // ✅ Validate required fields
      if (!blendData.name || !blendData.recipe || !Array.isArray(blendData.recipe)) {
        throw new Error('Blend response missing required fields');
      }

      setGeneratedBlend(blendData);
      setProduct(blendData); // Update product for payment flow
      
    } catch (error) {
      console.error('Blend generation error:', error);
      setGenerationError(error.message || 'Failed to generate blend. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // ✅ XEC Wallet Verification (with complete AI blend payload)
  const handleVerifyWallet = async () => {
    const targetProduct = generatedBlend || product;
    if (!targetProduct || !xrplClientRef.current) {
      alert('Blend not ready. Please generate or select a blend first.');
      return;
    }

    setVerificationState('verifying');

    try {
      // ✅ Load Xaman SDK dynamically
      if (!window.Xumm) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          // ✅ FIXED: Removed trailing spaces from URL
          script.src = 'https://xaman.app/assets/cdn/xumm.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.body.appendChild(script);
        });
      }

      const XUMM_API_KEY = process.env.NEXT_PUBLIC_XUMM_API_KEY || 'your-api-key-here';
      const xumm = new window.Xumm(XUMM_API_KEY);
      xummRef.current = xumm;

      await xumm.authorize();

      const accountAddress = await new Promise((resolve, reject) => {
        const onReady = () => {
          xumm.user.account.then(resolve).catch(reject);
          xumm.off('success', onReady);
        };
        xumm.on('success', onReady);
        setTimeout(() => {
          xumm.off('success', onReady);
          reject(new Error('Authorization timeout'));
        }, 60000);
      });

      // ✅ Check XEC balance with CORRECT issuer
      const response = await xrplClientRef.current.request({
        method: 'account_lines',
        account: accountAddress,
        peer: XEC_CONFIG.issuer,
      });

      let xecBalance = 0;
      const trustline = response.result.lines.find(
        line => line.currency === XEC_CONFIG.currency && line.account === XEC_CONFIG.issuer
      );
      
      if (trustline) {
        xecBalance = parseFloat(trustline.balance);
      }

      // ✅ FIXED: Fetch XEC price with improved fallback logic
      let xecPriceUsd = 0.0004; // More realistic conservative fallback
      try {
        // ✅ FIXED: Removed trailing spaces from URL
        const priceResponse = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ecash&vs_currencies=usd');
        if (priceResponse.ok) {
          const priceData = await priceResponse.json();
          // Try multiple possible keys (CoinGecko API variations)
          xecPriceUsd = priceData.ecash?.usd 
            || priceData['ecash']?.usd 
            || priceData.xec?.usd 
            || 0.0004;
        }
      } catch (e) {
        console.warn('Using fallback XEC price:', e);
      }
      
      const usdValue = xecBalance * xecPriceUsd;

      setXecBalance(xecBalance);
      setUsdValue(usdValue);

      // ✅ Verify threshold
      if (xecBalance >= targetProduct.xec && usdValue >= XEC_CONFIG.requiredUsdThreshold) {
        setVerificationState('unlocked');
        
        // ✅ FIXED: Complete payload with all AI blend fields + accounting metadata
        await fetch('/api/verify-unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            // Core identification
            address: accountAddress,
            blendSlug: targetProduct.slug,
            
            // ✅ AI blend metadata (sent if generatedBlend exists)
            blendRecipe: generatedBlend?.recipe,
            blendName: generatedBlend?.name,
            blendDescription: generatedBlend?.description,
            blendInstructions: generatedBlend?.instructions,
            userPrompt: userInput, // Original AI generation prompt
            
            // ✅ Payment accounting fields
            paymentMethod: 'xec',
            xecAmount: targetProduct.xec,
            usdValue: usdValue,
            price: targetProduct.price,
            requiredXec: targetProduct.xec,
          })
        });
        
        // ✅ FIXED: Redirect with payment parameter for blend-delivery page
        window.location.href = `/blend-delivery?blend=${targetProduct.slug}&verified=true&ai=${!!generatedBlend}&payment=xec`;
      } else {
        setVerificationState('insufficient');
        alert(`Insufficient XEC balance. Need ${targetProduct.xec} XEC (≈$${XEC_CONFIG.requiredUsdThreshold} USD). You have ${xecBalance.toFixed(2)} XEC (≈$${usdValue.toFixed(2)}).`);
      }

    } catch (error) {
      console.error('Verification error:', error);
      setVerificationState('idle');
      
      if (error.message?.includes('timeout')) {
        alert('Wallet connection timed out. Please try again.');
      } else if (error.message?.includes('popup') || error.message?.includes('blocked')) {
        alert('Please allow popups for emocreations.skin to connect your wallet.');
      } else {
        alert('Failed to verify wallet: ' + error.message);
      }
    }
  };

  // ✅ Use a predefined blend
  const handleSelectPredefined = (slug) => {
    setGeneratedBlend(null);
    setUserInput('');
    setProduct(PREDEFINED_BLENDS[slug]);
    setVerificationState('idle');
  };

  if (!product) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Loading blend details...</p>
      </div>
    );
  }

  const targetProduct = generatedBlend || product;

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
        <div className="absolute top-6 left-6 z-20">
          <img src="/xec-logo.png" alt="XEC Token" className="h-10 w-auto" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">
            {generatedBlend ? '✨ Your AI-Curated Blend' : targetProduct.name}
          </h1>
          <p className="text-lg text-gray-300">
            {generatedBlend 
              ? 'Personalized for your wellness journey. Powered by AI + $XEC.' 
              : 'Unlock this AI-curated blend. Powered by $XEC.'}
          </p>
        </div>
      </div>

      {/* AI Blend Generator */}
      {!generatedBlend && (
        <section className="py-12 px-6 max-w-4xl mx-auto">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-6 rounded-2xl border border-turquoise/30 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-turquoise">🤖 Create Your Custom Blend</h2>
            <p className="text-gray-300 mb-4">
              Describe your wellness goals, pain points, or desired effects. Our AI will craft a personalized essential oil recipe just for you.
            </p>
            
            <textarea
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g., I need relief from evening anxiety and trouble sleeping, with a calming floral scent..."
              className="w-full h-32 p-4 bg-black border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:ring-2 focus:ring-turquoise focus:border-transparent resize-none mb-4"
            />
            
            {generationError && (
              <p className="text-red-400 text-sm mb-3">{generationError}</p>
            )}
            
            <button
              onClick={handleGenerateBlend}
              disabled={isGenerating || !userInput.trim()}
              className="w-full bg-turquoise hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 px-4 rounded font-medium transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  Crafting your blend...
                </>
              ) : (
                '✨ Generate My AI Blend'
              )}
            </button>
            
            <p className="text-xs text-gray-500 mt-3 text-center">
              Powered by emocreations.skin_ai • Results vary • Not medical advice
            </p>
          </div>
        </section>
      )}

      {/* Blend Recipe Display */}
      {(generatedBlend || !generatedBlend) && (
        <div className="py-12 px-6 max-w-4xl mx-auto">
          <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8">
            <h2 className="text-2xl font-bold mb-4">
              {generatedBlend ? 'Your Personalized Recipe' : 'Blend Includes:'}
            </h2>
            
            {generatedBlend ? (
              <>
                <p className="text-gray-300 mb-4 italic">{generatedBlend.description}</p>
                <ul className="text-gray-300 space-y-3 mb-6">
                  {generatedBlend.recipe.map((item, idx) => (
                    <li key={idx} className="flex justify-between border-b border-gray-800 pb-2">
                      <span>• {item.oil} — {item.purpose}</span>
                      <span className="text-turquoise font-medium">{item.drops} drops</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-black p-4 rounded-lg mb-4">
                  <p className="text-sm text-gray-400"><strong>How to use:</strong> {generatedBlend.instructions}</p>
                </div>
                <button
                  onClick={() => {
                    setGeneratedBlend(null);
                    setUserInput('');
                    setProduct(PREDEFINED_BLENDS['xe']);
                  }}
                  className="text-sm text-gray-400 hover:text-turquoise underline"
                >
                  ← Try a predefined blend instead
                </button>
              </>
            ) : (
              <ul className="text-gray-300 space-y-2">
                {targetProduct.name === 'XE – Everybody\'s Oil' && (
                  <>
                    <li>• 10 drops Lavender — calms nerves, reduces inflammation</li>
                    <li>• 8 drops Roman Chamomile — soothes tissue</li>
                    <li>• 6 drops Bergamot FCF — uplifts mood</li>
                  </>
                )}
                {/* Add more predefined blend details as needed */}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Payment Options */}
      <section className="py-12 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">Unlock With</h2>
          
          {/* XEC Option */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800 mb-8">
            <h3 className="text-xl font-bold mb-4 text-turquoise">Unlock with $XEC</h3>
            <p className="text-gray-400 mb-4">
              Hold {targetProduct.xec} XEC (≈${XEC_CONFIG.requiredUsdThreshold} USD) to unlock instantly.
              {generatedBlend && <span className="block mt-2 text-sm text-turquoise">✨ AI-generated blends require the same XEC threshold</span>}
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleVerifyWallet}
                disabled={verificationState === 'verifying'}
                className="flex-1 bg-turquoise hover:bg-teal-400 disabled:opacity-50 disabled:cursor-not-allowed text-black py-3 px-4 rounded font-medium transition"
              >
                {verificationState === 'verifying' ? '⏳ Connecting...' : '✅ Pay with XEC'}
              </button>
              <Link
                href="/get-started"
                className="flex-1 text-center border border-turquoise text-turquoise hover:bg-turquoise/10 py-3 px-4 rounded font-medium transition"
              >
                🪙 Get XEC
              </Link>
            </div>

            {verificationState === 'unlocked' && (
              <div className="mt-4 text-green-400">
                ✅ Unlocked! You hold {xecBalance.toFixed(2)} XEC (${usdValue.toFixed(2)})
              </div>
            )}

            {verificationState === 'insufficient' && (
              <div className="mt-4 text-red-400">
                ❌ Insufficient balance. Need {targetProduct.xec} XEC.
                <br />
                <Link href="/get-started" className="text-turquoise hover:underline mt-1 inline-block">
                  Get more XEC →
                </Link>
              </div>
            )}
          </div>

          {/* PayPal Option */}
          <div className="bg-black p-6 rounded-2xl border border-gray-800">
            <h3 className="text-xl font-bold mb-4">Or Pay with Card</h3>
            <p className="text-gray-400 mb-4">
              Secure checkout via PayPal. Ships in 3–5 days.
              {generatedBlend && <span className="block mt-2 text-sm text-turquoise">✨ Your custom AI recipe will be included</span>}
            </p>
            <div id="paypal-button-container" className="text-center"></div>
          </div>
        </div>
      </section>

      {/* Predefined Blends Quick Select (only show if no AI blend generated) */}
      {!generatedBlend && (
        <section className="py-12 px-6 max-w-4xl mx-auto">
          <h3 className="text-xl font-bold mb-4 text-center">Or Choose a Predefined Blend</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(PREDEFINED_BLENDS).slice(0, 8).map(([slug, blend]) => (
              <button
                key={slug}
                onClick={() => handleSelectPredefined(slug)}
                className={`p-3 rounded-lg border text-sm transition ${
                  product.slug === slug 
                    ? 'border-turquoise bg-turquoise/10 text-turquoise' 
                    : 'border-gray-700 hover:border-turquoise hover:bg-gray-800'
                }`}
              >
                {blend.name}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Trust & Compliance */}
      <section className="py-8 px-6 text-center text-gray-500 text-sm">
        <p>
          Formulated with cellular wellness in mind. Not a treatment. Complementary support only.  
          <br />
          Consult your healthcare provider before use. AI suggestions are for entertainment and wellness exploration.
        </p>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center text-gray-500 text-sm border-t border-gray-800">
        <p className="mb-4">
          Follow the science: 
          {/* ✅ FIXED: Removed trailing spaces from social URLs */}
          <a href="https://instagram.com/emocreations.skin" target="_blank" rel="noopener" className="text-turquoise hover:underline ml-2">@emocreations.skin</a> • 
          <a href="https://tiktok.com/@emocreations.skin" target="_blank" rel="noopener" className="text-turquoise hover:underline ml-2">@emocreations.skin</a>
        </p>
        <p>© 2025 EmoCreations.skin — Crafted with cellular wellness in mind.</p>
      </footer>
    </div>
  );
}
