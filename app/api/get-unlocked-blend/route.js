// app/api/get-unlocked-blend/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get('slug');
  
  if (!slug) {
    return NextResponse.json({ error: 'slug required' }, { status: 400 });
  }

  // Fetch from unlocks table (only return if verified)
  const { data, error } = await supabase
    .from('unlocks')
    .select('blend_name, blend_description, blend_recipe, blend_instructions, is_ai_blend')
    .eq('blend_slug', slug)
    .eq('unlocked', true) // Add this column if tracking unlock status
    .order('verified_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Blend not found or not verified' }, { status: 404 });
  }

  return NextResponse.json({
    name: data.blend_name,
    description: data.blend_description,
    recipe: data.blend_recipe,
    instructions: data.blend_instructions,
    isAi: data.is_ai_blend
  });
}
