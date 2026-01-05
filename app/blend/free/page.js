// app/blend/free/page.js
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function FreeSamplePage() {
  const [hasXEC, setHasXEC] = useState(false);
  const [loading, setLoading] = = useState(true);

  useEffect(() => {
    // In production: integrate Xaman wallet check
    // For now: auto-grant access for demo
    const timer = setTimeout(() => {
      setHasXEC(true);
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-t-turquoise border-r-transparent border-b-turquoise/30 border-l-transparent rounded-full animate-spin mb-4"></div>
        <p>Checking XEC balance...</p>
      </div>
    );
  }

  if (!hasXEC) {
    return (
      <div className="min-h-screen bg-black text-white p-6 max-w-2xl mx-auto flex flex-col justify-center">
        <h1 className="text-3xl font-bold mb-6 text-center">Free Sample Unavailable</h1>
        <p className="text-gray-400 text-center mb-8">
          You need to hold a small amount of $XEC to unlock your free blend.
        </p>
        <div className="text-center">
          <Link
            href="/get-started"
            className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-8 rounded-full font-bold"
          >
            Get XEC Guide →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6 max-w-3xl mx-auto">
      {/* Hero */}
      <div 
        className="relative h-64 flex items-center justify-center mb-12"
        style={{
          backgroundImage: `url('/about-xec-banner.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-white">✨ Your Free Blend</h1>
          <p className="text-lg text-gray-300">XE – Everybody’s Oil</p>
        </div>
      </div>

      {/* Blend Preview */}
      <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 mb-8">
        <h2 className="text-2xl font-bold mb-4">What’s in Your Blend?</h2>
        <p className="text-gray-400 mb-4">
          A universal wellness elixir designed for daily balance, calm, and resilience.
        </p>
        <ul className="text-gray-300 space-y-2 mb-6">
          <li className="flex items-start">
            <span className="text-turquoise mr-2">•</span>
            <span><strong>10 drops Lavender</strong> — calms nerves, reduces inflammation</span>
          </li>
          <li className="flex items-start">
            <span className="text-turquoise mr-2">•</span>
            <span><strong>8 drops Roman Chamomile</strong> — antispasmodic, soothes tissue</span>
          </li>
          <li className="flex items-start">
            <span className="text-turquoise mr-2">•</span>
            <span><strong>6 drops Bergamot FCF</strong> — uplifting mood, zero phototoxicity</span>
          </li>
        </ul>
        <p className="text-gray-400 text-sm">
          💡 This is your digital recipe. To order a physical bottle, unlock the full version.
        </p>
      </div>

      {/* CTA */}
      <div className="text-center">
        <Link
          href="/blend?blend=xe"
          className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-8 rounded-full font-bold"
        >
          Unlock Full Version →
        </Link>
        <p className="text-gray-500 text-sm mt-4">
          Get the full recipe, JSON card, and physical oil ordering option.
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-8 border-t border-gray-800 text-center text-gray-500 text-sm">
        <p>© 2025 EmoCreations.skin — Crafted with cellular wellness in mind.</p>
      </footer>
    </div>
  );
}
