// app/api/trending-blends/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Map slugs to product data
const PRODUCT_DATA = {
  unbroken: { name: "The Unbroken Ointment", useCase: "For lupus & joint pain", xecAmount: 156 },
  menopause: { name: "Menopause Blend", useCase: "For hot flashes & mood", xecAmount: 103 },
  sciatic: { name: "Deep Relief Sciatic Soother", useCase: "For nerve pain & mobility", xecAmount: 156 },
  telomere: { name: "Telomere Repair Serum", useCase: "For cellular longevity", xecAmount: 297 },
  shoulder: { name: "Shoulder Freedom Therapy", useCase: "For frozen shoulder", xecAmount: 156 },
  glucose: { name: "Glucose Balance Therapy", useCase: "For diabetic circulation", xecAmount: 138 },
  queen: { name: "Queen’s Oil", useCase: "Anti-aging & hormone balance", xecAmount: 103 },
  xe: { name: "XE – Everybody’s Oil", useCase: "Universal wellness", xecAmount: 67 }
};

export async function GET() {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('unlocks')
      .select('blend_slug')
      .gte('unlocked_at', oneDayAgo);

    if (error) throw error;

    // Count unlocks per blend
    const counts = {};
    data.forEach(row => {
      counts[row.blend_slug] = (counts[row.blend_slug] || 0) + 1;
    });

    // Build trending list
    const trending = Object.entries(counts)
      .map(([slug, unlocksToday]) => ({
        ...PRODUCT_DATA[slug],
        slug,
        unlocksToday
      }))
      .filter(item => item.name) // only known blends
      .sort((a, b) => b.unlocksToday - a.unlocksToday)
      .slice(0, 4);

    return NextResponse.json(trending);
  } catch (error) {
    console.error('Trending blends error:', error);
    return NextResponse.json([]);
  }
}