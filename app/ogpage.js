'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="font-sans bg-black text-white min-h-screen">
      <header className="py-20 md:py-28 px-6 text-center max-w-4xl mx-auto">
        <h1 className="text-3xl md:text-5xl font-bold mb-6 tracking-tight">
          Crafted with cellular wellness in mind.
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

      <section className="py-16 px-6 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <PathCard title="AI Blending App" description="Personalized, synergistic blends—crafted by AI, rooted in peer-reviewed science." href="/blend" />
          <PathCard title="The Apothecary" description="The Queen’s Oil, The King’s Oil, and XE—Everybody’s Oil. Bottled with intention." href="/store" />
          <PathCard title="Get $XEC" description="Swap XRP for XEC on XP Market. Rate: 0.26 XRP per XEC. No KYC." external href="https://xpmarket.com/amm/pool/XEC-rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX/XRP" />
          <PathCard title="About $XEC" description="The utility token that unlocks science-backed wellness and exclusive access." href="/about-xec" />
        </div>
      </section>

      <section className="py-16 px-6 border-t border-gray-800">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl font-bold mb-6 text-turquoise">
            Hold $25+ of XEC. Unlock intelligent wellness.
          </h2>
          <p className="text-gray-400">
            Premium blends, physical oils, and community access are gated by XEC—creating real utility, sustainable demand, and scientific integrity.
          </p>
        </div>
      </section>

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

function PathCard({ title, description, href = "#", external = false }) {
  const Target = external ? 'a' : Link;
  const props = external 
    ? { href, target: "_blank", rel: "noopener" } 
    : { href };

  return (
    <div className="bg-gray-900 p-6 rounded-2xl border border-gray-800 hover:border-turquoise transition">
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-400 text-sm mb-4">{description}</p>
      <Target {...props} className="text-turquoise font-medium hover:underline text-sm">
        {external ? 'Go to XP Market →' : 'Explore →'}
      </Target>
    </div>
  );
}
