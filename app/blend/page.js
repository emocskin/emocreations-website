// app/blend/page.js
'use client';

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';

function BlendPaywallContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    const blend = searchParams.get('blend');
    if (blend) {
      console.log('Requested blend:', blend);
      // You can set state or trigger UX here if needed
    }
  }, [searchParams]);

  return (
    <div className="font-sans bg-black text-white min-h-screen">
      <header className="py-20 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6">
          Unlock Your AI-Curated Blend
        </h1>
        <p className="text-gray-300 mb-10">
          Hold $25+ of XEC in your Xaman wallet to access premium blends.
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          <Link
            href="https://xumm.app/dapps/emocreations.skin  "
            target="_blank"
            className="bg-turquoise hover:bg-teal-400 text-black py-3 px-8 rounded-full font-medium transition font-bold"
          >
            Pay with XEC
          </Link>
          <Link
            href="/store"
            className="border border-turquoise text-turquoise hover:bg-turquoise/10 py-3 px-8 rounded-full font-medium transition"
          >
            Shop with PayPal
          </Link>
        </div>
      </header>

      <section className="py-16 px-6 max-w-4xl mx-auto text-center">
        <h2 className="text-2xl font-bold mb-6 text-turquoise">How It Works</h2>
        <p className="text-gray-400">
          1. Create your blend using our AI form.<br />
          2. Pay with XEC (or PayPal for entry oils).<br />
          3. Receive your custom recipe + physical bottle (optional).
        </p>
      </section>
    </div>
  );
}

export default function BlendPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <BlendPaywallContent />
    </Suspense>
  );
}
