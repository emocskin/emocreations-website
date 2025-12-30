// app/about-xec/page.js
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function AboutXECPage() {
  const [poolData, setPoolData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch XP Market pool data
  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        const res = await fetch('/api/xpmarket-pool');
        if (res.ok) {
          const data = await res.json();
          setPoolData(data);
        }
      } catch (e) {
        console.error('Failed to fetch pool data');
      } finally {
        setLoading(false);
      }
    };
    fetchPoolData();
  }, []);

  return (
    <div className="font-sans bg-black text-white min-h-screen">
      {/* Hero Banner */}
      <div 
        className="relative h-96 md:h-[500px] flex items-center justify-center"
        style={{
          backgroundImage: `url('/about-xec-banner.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-5xl font-bold mb-6">About $XEC</h1>
          <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto">
            The utility token that powers EmoCreations.skin — unlocking AI blends, physical oils, and exclusive access.
          </p>
        </div>
      </div>

      {/* Token Utility */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">What Is $XEC?</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h3 className="text-xl font-bold mb-4">Your Key to Intelligent Wellness</h3>
            <p className="text-gray-400 mb-4">
              At EmoCreations.skin, $XEC isn’t just a token — it’s the economic spine of our AI-powered apothecary. Hold $XEC to unlock:
            </p>
            <ul className="text-gray-400 space-y-2 mb-6">
              <li>• Premium AI-blended essential oil recipes</li>
              <li>• Physical bottles of our clinical-grade elixirs</li>
              <li>• Exclusive community access and early product releases</li>
              <li>• Future experiences (like Lambo rides and jet trips)</li>
            </ul>
            <p className="text-gray-400">
              This isn’t speculation. It’s real utility — designed to create sustainable demand through science, intention, and exclusivity.
            </p>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Tokenomics</h3>
            <p className="text-gray-400 mb-4">
              $XEC is built for long-term value, not hype. No burns, no locks — just real-world usage driving organic demand.
            </p>
            <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
              <p className="text-sm text-gray-400 mb-2">Total Supply</p>
              <p className="text-white text-xl font-bold">1,030,888,876 XEC</p>
              <p className="text-sm text-gray-400 mt-4">Issued by: rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX</p>
            </div>
          </div>
        </div>
      </section>

      {/* XP Market Pool */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Live Liquidity Pool</h2>
          {loading ? (
            <div className="text-center text-gray-500">Loading pool data...</div>
          ) : poolData ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-black p-6 rounded-2xl border border-gray-800">
                <p className="text-gray-400 mb-2">Price</p>
                <p className="text-white text-xl font-bold">{poolData.price} XRP</p>
                <p className="text-turquoise text-sm mt-2">${poolData.usdPrice.toFixed(2)}</p>
              </div>
              <div className="bg-black p-6 rounded-2xl border border-gray-800">
                <p className="text-gray-400 mb-2">Volume</p>
                <p className="text-white text-xl font-bold">${poolData.volume}</p>
              </div>
              <div className="bg-black p-6 rounded-2xl border border-gray-800">
                <p className="text-gray-400 mb-2">Fee</p>
                <p className="text-white text-xl font-bold">{poolData.fee}%</p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              Could not load pool data. Please check back later.
            </div>
          )}
          <div className="mt-8 text-center">
            <Link
              href="https://xpmarket.com/amm/pool/XEC-rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX/XRP"
              target="_blank"
              className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-8 rounded-full font-medium transition"
            >
              Go to XP Market →
            </Link>
          </div>
        </div>
      </section>

      {/* How to Get XEC */}
      <section className="py-16 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold mb-8">How to Get $XEC</h2>
        <div className="space-y-8">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/3">
              <h3 className="text-xl font-bold mb-4">Step 1: Sign Up on Coinbase</h3>
              <p className="text-gray-400">
                If you don’t have an account, sign up at Coinbase using my referral link:
              </p>
              <Link
                href="https://coinbase.com/join/RKSS54G?src=referral-link"
                target="_blank"
                className="text-turquoise hover:underline"
              >
                Join Coinbase →
              </Link>
            </div>
            <div className="md:w-2/3">
              <h3 className="text-xl font-bold mb-4">Step 2: Buy XRP</h3>
              <p className="text-gray-400 mb-4">
                Once verified, buy XRP with your card or bank transfer. You’ll need XRP to swap for XEC.
              </p>
              <p className="text-gray-400">
                ⚠️ Note: Only card/bank buys qualify for the $10 bonus — trades on Coinbase Pro are not eligible.
              </p>
            </div>
          </div>
          <div>
            <h3 className="text-xl font-bold mb-4">Step 3: Swap XRP for XEC on XP Market</h3>
            <p className="text-gray-400 mb-4">
              Open the Xaman Wallet app, tap “Discover,” search for “XPMarket,” and go to the XEC/XRP pool. Swap your XRP for XEC.
            </p>
            <p className="text-gray-400">
              💡 Tip: Start with 100 XRP to test the process. You can always add more liquidity later.
            </p>
          </div>
        </div>
      </section>

      {/* Why XEC? */}
      <section className="py-16 px-6 bg-gray-900">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-8">Why $XEC?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-black p-6 rounded-2xl border border-gray-800">
              <h3 className="text-xl font-bold mb-4">Real Utility</h3>
              <p className="text-gray-400">
                Unlock premium AI blends, physical products, and community access — not just speculative tokens.
              </p>
            </div>
            <div className="bg-black p-6 rounded-2xl border border-gray-800">
              <h3 className="text-xl font-bold mb-4">Sustainable Demand</h3>
              <p className="text-gray-400">
                Our autonomous agents drive real demand — no artificial scarcity, no hype.
              </p>
            </div>
            <div className="bg-black p-6 rounded-2xl border border-gray-800">
              <h3 className="text-xl font-bold mb-4">Scientific Integrity</h3>
              <p className="text-gray-400">
                Every blend is AI-curated, evidence-informed, and clinically relevant.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6 text-turquoise">
            Ready to Unlock Intelligent Wellness?
          </h2>
          <p className="text-gray-400 mb-8">
            Hold $25+ of XEC to access our full apothecary — AI blends, physical oils, and exclusive experiences.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              href="/blend"
              className="bg-turquoise hover:bg-teal-400 text-black py-3 px-8 rounded-full font-medium transition font-bold"
            >
              Create Your Blend
            </Link>
            <Link
              href="/store"
              className="border border-turquoise text-turquoise hover:bg-turquoise/10 py-3 px-8 rounded-full font-medium transition"
            >
              Shop Oils
            </Link>
          </div>
        </div>
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
