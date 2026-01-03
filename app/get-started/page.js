// app/get-started/page.js
'use client';

import Link from 'next/link';

export default function GetStartedPage() {
  return (
    <div className="font-sans bg-black text-white min-h-screen">
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
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Get Started with $XEC</h1>
          <p className="text-lg text-gray-300">
            A step-by-step guide for non-crypto-savvy users. No prior experience needed.
          </p>
        </div>
      </div>

      {/* Intro */}
      <section className="py-12 px-6 max-w-4xl mx-auto">
        <p className="text-gray-400 text-center mb-8">
          This guide will walk you through every step to buy $XEC — the token that powers EmoCreations.skin. 
          <br />
          <span className="text-turquoise">You’ll need ~$50 to start.</span>
        </p>
      </section>

      {/* Steps */}
      <section className="py-12 px-6 max-w-4xl mx-auto space-y-12">
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="bg-turquoise text-black w-8 h-8 rounded-full flex items-center justify-center mr-3">1</span>
            Create a Coinbase Account
          </h2>
          <p className="text-gray-400 mb-4">
            Coinbase is one of the easiest and safest places to buy cryptocurrency.
          </p>
          {/* ✅ Coinbase as BUTTON */}
          <Link
            href="https://coinbase.com/join/RKSS54G?src=referral-link"
            target="_blank"
            className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black py-2 px-4 rounded font-medium text-sm transition"
          >
            Join Coinbase →
          </Link>
          <p className="text-sm text-gray-500 mt-3">
            ⏳ Approval usually takes 5–30 minutes.
          </p>
        </div>

        {/* Remaining steps unchanged... */}
        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="bg-turquoise text-black w-8 h-8 rounded-full flex items-center justify-center mr-3">2</span>
            Buy XRP on Coinbase
          </h2>
          <ol className="text-gray-400 list-decimal list-inside space-y-2 mb-4">
            <li>Log in to Coinbase</li>
            <li>Click “Trade” → “Buy”</li>
            <li>Search for “XRP” and select it</li>
            <li>Enter amount (e.g., $100)</li>
            <li>Select payment method: Debit card (instant) or Bank account (1–3 days)</li>
            <li>Click “Preview Buy” → “Buy Now”</li>
          </ol>
          <p className="text-sm text-gray-500">
            💡 You now own XRP! It will appear in your Coinbase portfolio.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="bg-turquoise text-black w-8 h-8 rounded-full flex items-center justify-center mr-3">3</span>
            Set Up a Xaman Wallet
          </h2>
          <p className="text-gray-400 mb-4">
            Never keep crypto on Coinbase long-term. Move your XRP to Xaman — a safe, user-friendly XRPL wallet.
          </p>
          <ol className="text-gray-400 list-decimal list-inside space-y-2 mb-4">
            <li>On your phone, go to App Store (iOS) or Google Play (Android)</li>
            <li>Search for “Xaman Wallet” (blue icon by XRPL Labs)</li>
            <li>Download and open it → Tap “Create Wallet”</li>
            <li><span className="text-turquoise">WRITE DOWN YOUR 24-WORD RECOVERY PHRASE</span> — store it on paper, never share it</li>
            <li>Confirm your phrase and set a PIN</li>
          </ol>
          <p className="text-sm text-gray-500">
            ✅ Your wallet address (starts with “r…”) is on the home screen.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="bg-turquoise text-black w-8 h-8 rounded-full flex items-center justify-center mr-3">4</span>
            Send XRP from Coinbase to Xaman
          </h2>
          <ol className="text-gray-400 list-decimal list-inside space-y-2 mb-4">
            <li>In Xaman, tap “Receive” → copy your wallet address (starts with “r…”) </li>
            <li>Go to Coinbase → Click “Send” → “Send Crypto”</li>
            <li>Select XRP → Paste your Xaman address</li>
            <li>Enter amount (e.g., 45 XRP — leave ~5 XRP in Coinbase for fees)</li>
            <li>Click “Continue” → “Send Now”</li>
          </ol>
          <p className="text-sm text-gray-500">
            ⏳ Wait 3–10 minutes for XRP to arrive in Xaman.
          </p>
        </div>

        <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800">
          <h2 className="text-2xl font-bold mb-4 flex items-center">
            <span className="bg-turquoise text-black w-8 h-8 rounded-full flex items-center justify-center mr-3">5</span>
            Swap XRP for XEC on XP Market
          </h2>
          <ol className="text-gray-400 list-decimal list-inside space-y-2 mb-4">
            <li>Open your Xaman app</li>
            <li>Tap “Discover” → Search for “XPMarket”</li>
            <li>Go to: <a href="https://xpmarket.com/amm/pool/XEC-rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX/XRP" target="_blank" className="text-turquoise hover:underline">XEC/XRP Pool</a></li>
            <li>Tap “Swap” → Enter how much XRP to swap (e.g., 10 XRP ≈ 38 XEC)</li>
            <li>Review and confirm in Xaman</li>
          </ol>
          <p className="text-sm text-gray-500">
            ✅ You now own XEC! It will appear under “Assets” in Xaman.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-6 bg-gray-900">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6 text-turquoise">You Did It!</h2>
          <p className="text-gray-400 mb-8">
            You’ve just:
            <br />• Bought your first crypto (XRP)
            <br />• Set up a secure wallet
            <br />• Swapped for XEC
            <br />• Joined the future of AI-powered wellness
          </p>
          <Link
            href="/blend"
            className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-8 rounded-full font-medium transition font-bold"
          >
            Create Your First Blend →
          </Link>
        </div>
      </section>

      {/* Safety Reminders */}
      <section className="py-8 px-6 text-center text-gray-500 text-sm">
        <p>
          🔒 Never share your 24-word recovery phrase.<br />
          📧 Bookmark official sites (beware of fake links!).<br />
          💡 Start small — you can always buy more later.<br />
          🆘 Need help? Contact us at support@emocreations.skin
        </p>
      </section>

      {/* Footer */}
      <footer className="py-10 px-6 text-center text-gray-500 text-sm border-t border-gray-800">
        <p>© 2025 EmoCreations.skin — Crafted with cellular wellness in mind.</p>
      </footer>
    </div>
  );
}
