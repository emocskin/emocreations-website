// app/community/page.js
'use client';

import { useEffect, useState } from 'react';

export default function CommunityPage() {
  const [access, setAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Later: check Xaman wallet balance
    setTimeout(() => {
      const hasBalance = Math.random() > 0.5; // mock
      setAccess(hasBalance);
      setLoading(false);
    }, 1000);
  }, []);

  if (loading) return <div className="min-h-screen bg-black text-white flex items-center justify-center">Verifying XEC balance...</div>;

  if (!access) {
    return (
      <div className="min-h-screen bg-black text-white p-6 text-center">
        <h1 className="text-2xl font-bold mb-4">Exclusive Access</h1>
        <p>Hold 50+ XEC to join our private wellness community.</p>
        <a href="/get-started" className="text-turquoise hover:underline mt-4 inline-block">Get XEC →</a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <h1 className="text-3xl font-bold mb-6">Welcome to the Inner Circle</h1>
      <p>Private Discord, live Q&As, and early access to new blends.</p>
      <a href="https://discord.gg/your-invite" className="text-turquoise hover:underline">Join Discord →</a>
    </div>
  );
}
