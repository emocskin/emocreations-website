// app/page.js
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const router = useRouter();
  const [trendingBlends, setTrendingBlends] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const res = await fetch('/api/trending-blends');
        if (res.ok) {
          const data = await res.json();
          setTrendingBlends(data);
        }
      } catch (e) {
        console.error('Failed to fetch trending blends');
      } finally {
        setLoading(false);
      }
    };
    fetchTrending();
  }, []);

  const galleryItems = [
    { name: "The Unbroken Ointment", slug: "unbroken", image: "/gallery/unbroken.jpg" },
    { name: "Telomere Repair Serum", slug: "telomere", image: "/gallery/telomere.jpg" },
    { name: "Menopause Blend", slug: "menopause", image: "/gallery/menopause.jpg" },
    { name: "Deep Relief Sciatic Soother", slug: "sciatic", image: "/gallery/sciatic.jpg" },
    { name: "Shoulder Freedom Therapy", slug: "shoulder", image: "/gallery/shoulder.jpg" },
    { name: "Glucose Balance Therapy", slug: "glucose", image: "/gallery/glucose.jpg" },
    { name: "Queen’s Oil", slug: "queen", image: "/gallery/queen.jpg" },
    { name: "XE – Everybody’s Oil", slug: "xe", image: "/gallery/xe.jpg" },
  ];

  return (
    <div className="font-sans bg-black text-white min-h-screen relative">
      {/* Hero Banner */}
      <div 
        className="absolute inset-0 bg-black z-0"
        style={{
          backgroundImage: `url('/hero-image.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundRepeat: 'no-repeat'
        }}
      >
        <div className="absolute inset-0 bg-black/70"></div>
        
        {/* ✅ XEC Logo */}
        <div className="absolute top-6 left-6 z-20">
          <img src="/xec-logo.png" alt="XEC Token" className="h-10 w-auto" />
        </div>
      </div>

      {/* Hero Content */}
      <header className="relative z-10 py-20 md:py-28 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tight">
          Your skin deserves more than guesswork.
        </h1>
        <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10">
          At EmoCreations.skin, our AI doesn’t just blend oils—<br />
          <span className="text-turquoise">it studies the science of synergy</span> to create intelligent, evidence-informed elixirs that honor your skin’s innate intelligence.
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
      </header>

      {/* Problem → Solution */}
      <section className="relative z-10 py-16 px-6 bg-black">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-4">The Pain You Feel</h2>
            <p className="text-gray-400 mb-6">
              Chronic joint pain. Flare-ups that steal your sleep. Skin that feels like it’s betraying you. You’ve tried everything — and nothing lasts.
            </p>
            <p className="text-gray-400">
              You don’t need another quick fix. You need a system.
            </p>
          </div>
          <div>
            <h2 className="text-3xl font-bold mb-4">The Relief You Deserve</h2>
            <p className="text-gray-400 mb-6">
              Our AI-curated blends are designed for your body’s unique needs — whether it’s lupus, sciatica, menopause, or daily stress. We combine ancient resins, modern science, and token-powered access to deliver results that last.
            </p>
            <p className="text-gray-400">
              This isn’t aromatherapy. It’s precision medicine for your skin.
            </p>
          </div>
        </div>
      </section>

      {/* Free Sample CTA */}
      <section className="relative z-10 py-8 px-6 text-center">
        <Link 
          href="/blend/free" 
          className="inline-block bg-turquoise hover:bg-teal-400 text-black py-3 px-8 rounded-full font-bold"
        >
          ✨ Try a Free Sample Blend
        </Link>
        <p className="text-gray-500 text-sm mt-2">No purchase needed. Hold any XEC to unlock.</p>
      </section>

      {/* Core Paths — Cards with VISIBLE Buttons */}
      <section className="relative z-10 py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PathCard 
            title="AI Blending App" 
            description="Personalized, synergistic blends—crafted by AI, rooted in peer-reviewed science." 
            href="/blend" 
          />
          <PathCard 
            title="The Apothecary" 
            description="The Queen’s Oil, The King’s Oil, and XE—Everybody’s Oil. Bottled with intention." 
            href="/store" 
          />
          <PathCard 
            title="Get $XEC" 
            description="Swap XRP for XEC on XP Market. Rate: 0.26 XRP per XEC. No KYC." 
            external 
            href="https://xpmarket.com/amm/pool/XEC-rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX/XRP" 
          />
          <PathCard 
            title="About $XEC" 
            description="The utility token that unlocks science-backed wellness and exclusive access." 
            href="/about-xec" 
          />
        </div>
      </section>

      {/* Gallery */}
      <section className="relative z-10 py-16 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">The Apothecary Collection</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {galleryItems.map((item, i) => (
              <div 
                key={i} 
                className="group cursor-pointer"
                onClick={() => router.push(`/blend?blend=${item.slug}`)}
              >
                <div className="aspect-square bg-gray-900 rounded-2xl overflow-hidden border border-gray-800 group-hover:border-turquoise transition">
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </div>
                <p className="text-white text-sm mt-3 group-hover:text-turquoise transition font-medium text-center">
                  {item.name}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ✅ YouTube Section — Your Channel Only */}
      <section className="relative z-10 py-16 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">AI Wellness in Action</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col items-center justify-center p-8 text-center group hover:border-turquoise transition">
              <div className="w-16 h-16 rounded-full bg-turquoise/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-turquoise">
                  <path d="M19.5 3.75a3 3 0 0 1 3 3v10.5a3 3 0 0 1-3 3H4.5a3 3 0 0 1-3-3V6.75a3 3 0 0 1 3-3h15Zm-13.5 6a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Zm0 3a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5H6Z" />
                </svg>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Videos Coming Soon</h3>
              <p className="text-gray-400 text-sm mb-4">
                Real demos, blend tutorials, and science breakdowns — launching soon.
              </p>
              <a
                href="https://www.youtube.com/@emocskin-xec"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 text-turquoise hover:text-teal-300 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M19.5 3.75a3 3 0 0 1 3 3v10.5a3 3 0 0 1-3 3H4.5a3 3 0 0 1-3-3V6.75a3 3 0 0 1 3-3h15Zm-13.5 6a.75.75 0 0 0 0 1.5h9a.75.75 0 0 0 0-1.5h-9Zm0 3a.75.75 0 0 0 0 1.5h7.5a.75.75 0 0 0 0-1.5H6Z" />
                </svg>
                Subscribe on YouTube
              </a>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col items-center justify-center p-8 text-center group hover:border-turquoise transition">
              <div className="w-16 h-16 rounded-full bg-turquoise/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-turquoise">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Blend Tutorials</h3>
              <p className="text-gray-400 text-sm mb-4">
                Learn how to use your AI-blended oils for maximum effect.
              </p>
              <a
                href="https://www.youtube.com/@emocskin-xec"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 text-turquoise hover:text-teal-300 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                </svg>
                Watch on YouTube
              </a>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 flex flex-col items-center justify-center p-8 text-center group hover:border-turquoise transition">
              <div className="w-16 h-16 rounded-full bg-turquoise/10 flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-turquoise">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path fillRule="evenodd" d="M12.006 21.5a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm4.394-10.411a.75.75 0 0 1 .3-.944l1.75-1.19a.75.75 0 0 1 1.188.854l-.84 2.495a.75.75 0 0 1-.75.5.75.75 0 0 1-.5-.25L16.507 11a.75.75 0 0 1-.113-.589ZM5.037 13.5l1.057 3.125a.75.75 0 0 1-.5.943.75.75 0 0 1-.943-.501l-.84-2.495a.75.75 0 0 1 .501-.943l1.75-1.19a.75.75 0 0 1 .978.457Z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="font-bold text-white text-lg mb-2">Science Deep Dives</h3>
              <p className="text-gray-400 text-sm mb-4">
                The clinical research behind our AI formulation engine.
              </p>
              <a
                href="https://www.youtube.com/@emocskin-xec"
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-2 text-turquoise hover:text-teal-300 font-medium"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                  <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" />
                  <path fillRule="evenodd" d="M12.006 21.5a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm4.394-10.411a.75.75 0 0 1 .3-.944l1.75-1.19a.75.75 0 0 1 1.188.854l-.84 2.495a.75.75 0 0 1-.75.5.75.75 0 0 1-.5-.25L16.507 11a.75.75 0 0 1-.113-.589ZM5.037 13.5l1.057 3.125a.75.75 0 0 1-.5.943.75.75 0 0 1-.943-.501l-.84-2.495a.75.75 0 0 1 .501-.943l1.75-1.19a.75.75 0 0 1 .978.457Z" clipRule="evenodd" />
                </svg>
                Learn on YouTube
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Trending Blends (static for now) */}
      <section className="relative z-10 py-16 px-6 bg-black">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">Trending Blends</h2>
          <div className="text-center text-gray-500">Loading trending blends...</div>
        </div>
      </section>

      {/* XEC Gate */}
      <section className="relative z-10 py-16 px-6 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6 text-turquoise">
            Hold $25+ of XEC. Unlock intelligent wellness.
          </h2>
          <p className="text-gray-400">
            Premium blends, physical oils, and community access are gated by XEC—creating real utility, sustainable demand, and scientific integrity.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-10 px-6 text-center text-gray-500 text-sm border-t border-gray-800">
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

// ✅ PathCard with VISIBLE BUTTON (non-hover)
function PathCard({ title, description, href = "#", external = false }) {
  const Target = external ? 'a' : Link;
  const props = external 
    ? { href, target: "_blank", rel: "noopener" } 
    : { href };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-turquoise transition">
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      {/* ✅ Always visible: bg-emerald-500 */}
      <Target 
        {...props} 
        className="inline-block bg-emerald-500 hover:bg-emerald-400 text-black py-2 px-4 rounded font-medium text-sm transition"
      >
        {external ? 'Go to XP Market' : 'Explore'}
      </Target>
    </div>
  );
}
