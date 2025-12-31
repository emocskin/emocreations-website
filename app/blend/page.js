// app/blend/page.js
// NO 'use client' here — this is a Server Component

import { Suspense } from 'react';
import ClientBlend from './ClientBlend';

export default function BlendPage({ searchParams }) {
  const { blend } = searchParams; // Server Components get searchParams automatically

  return (
    <Suspense fallback={<div className="min-h-screen bg-black text-white flex items-center justify-center">Loading...</div>}>
      <ClientBlend blendSlug={blend} />
    </Suspense>
  );
}
