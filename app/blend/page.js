// app/blend/page.js
export const dynamic = 'force-dynamic';

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function BlendAccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const blendSlug = searchParams.get('blend');
  const [hasAccess, setHasAccess] = useState(false);
  const [checking, setChecking] = useState(true);

  const products = {
    'unbroken': { name: 'The Unbroken Ointment', price: 88, xec: 156 },
    'xe': { name: 'XE – Everybody’s Oil', price: 38, xec: 67 }
    // add others as needed
  };

  const product = products[blendSlug] || products['xe'];

  useEffect(() => {
    const timer = setTimeout(() => {
      setHasAccess(false);
      setChecking(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [blendSlug]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <p>Checking your access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
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
        </div>
      </div>
      <section className="py-12 px-6 max-w-4xl mx-auto text-center">
        <Link
          href="/get-started"
          className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-6 rounded font-medium transition"
        >
          Get XEC Guide →
        </Link>
      </section>
    </div>
  );
}
