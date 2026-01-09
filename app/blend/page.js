// app/blend/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BlendPage() {
  const [product, setProduct] = useState(null);
  const [verificationState, setVerificationState] = useState('idle'); // idle | verifying | unlocked | insufficient
  const [xecBalance, setXecBalance] = useState(0);
  const [usdValue, setUsdValue] = useState(0);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const blendSlug = urlParams.get('blend') || 'xe';

    const products = {
      'unbroken': { name: 'The Unbroken Ointment', price: 88, xec: 156, slug: 'unbroken' },
      'xe': { name: 'XE – Everybody’s Oil', price: 38, xec: 67, slug: 'xe' },
      'queen': { name: 'Queen’s Oil', price: 58, xec: 103, slug: 'queen' },
      'king': { name: 'The King’s Oil', price: 58, xec: 103, slug: 'king' },
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

    setProduct(products[blendSlug] || products['xe']);
  }, []);

  const handleVerifyWallet = async () => {
    if (!product) return;

    setVerificationState('verifying');

    try {
      // Step 1: Create Xaman payload
      const payloadRes = await fetch('https://xaman.app/api/v2/payload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user: { anonymous: true },
          meta: {
            blob: {
              requiredXec: product.xec,
              message: `Verify ${product.xec} XEC to unlock ${product.name}`
            }
          }
        })
      });

      const payloadData = await payloadRes.json();
      if (!payloadData.uuid) throw new Error('Failed to create payload');

      // Step 2: Open Xaman app
      window.open(`https://xaman.app/sign/${payloadData.uuid}`, '_blank');

      // Step 3: Poll for verification result
      const checkStatus = async () => {
        const verifyRes = await fetch('/api/verify-unlock', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ uuid: payloadData.uuid, blendSlug: product.slug })
        });

        const result = await verifyRes.json();

        if (result.success) {
          setXecBalance(result.xecBalance);
          setUsdValue(result.usdValue);
          setVerificationState(result.unlocked ? 'unlocked' : 'insufficient');
        } else {
          setVerificationState('idle');
          alert(result.error || 'Verification failed');
        }
      };

      // Poll every 3 seconds for up to 60 seconds
      let attempts = 0;
      const maxAttempts = 20;
      const pollInterval = setInterval(async () => {
        attempts++;
        try {
          await checkStatus();
          clearInterval(pollInterval);
        } catch (e) {
          if (attempts >= maxAttempts) {
            clearInterval(pollInterval);
            setVerificationState('idle');
            alert('Verification timed out');
          }
        }
      }, 3000);

    } catch (error) {
      console.error('Verification error:', error);
      setVerificationState('idle');
      alert('Failed to start verification');
    }
  };

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
        
        {/* XEC Logo */}
        <div className="absolute top-6 left-6 z-20">
          <img src="/xec-logo.png" alt="XEC Token" className="h-10 w-auto" />
        </div>

        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">{product.name}</h1>
          <p className="text-lg text-gray-300">
            Unlock this AI-curated blend. Powered by $XEC.
          </p>
        </div>
      </div>

      {/* Blend Preview */}
      <div className="py-12 px-6 max-w-4xl mx-auto">
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8">
          <h2 className="text-2xl font-bold mb-4">Your AI-Curated Blend Includes:</h2>
          <ul className="text-gray-300 space-y-2">
            {product.name === 'XE – Everybody’s Oil' && (
              <>
                <li>• 10 drops Lavender — calms nerves, reduces inflammation</li>
                <li>• 8 drops Roman Chamomile — soothes tissue</li>
                <li>• 6 drops Bergamot FCF — uplifts mood</li>
              </>
            )}
            {/* Add more blends as needed */}
          </ul>
        </div>
      </div>

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

            {verificationState === 'idle' && (
              <button
                onClick={handleVerifyWallet}
                className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-6 rounded font-medium transition"
              >
                Verify Wallet →
              </button>
            )}

            {verificationState === 'verifying' && (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                <span>Checking wallet...</span>
              </div>
            )}

            {verificationState === 'unlocked' && (
              <div className="text-green-400">
                ✅ Unlocked! You hold {xecBalance.toFixed(2)} XEC (${usdValue.toFixed(2)})
              </div>
            )}

            {verificationState === 'insufficient' && (
              <div className="text-red-400">
                ❌ Insufficient balance. You hold {xecBalance.toFixed(2)} XEC (${usdValue.toFixed(2)})
                <br />
                <Link href="/get-started" className="text-turquoise hover:underline mt-2 inline-block">
                  Get more XEC →
                </Link>
              </div>
            )}
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
