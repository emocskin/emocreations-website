import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// ✅ 1. Fail-Fast Environment Validation (Consistent with other routes)
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("❌ Missing Supabase environment variables. Please check your .env.local file.");
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ 2. ReDoS-immune UUID validation helper
const isValidUUID = (uuid: unknown): uuid is string => {
  return typeof uuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export async function GET(request: NextRequest) {
  // ✅ Next.js idiomatic way to get search params
  const { searchParams } = request.nextUrl;
  const orderId = searchParams.get('orderId');
  
  // ✅ 3. Early validation to prevent unnecessary DB hits
  if (!orderId) {
    return NextResponse.json({ error: 'orderId is required' }, { status: 400 });
  }
  
  if (!isValidUUID(orderId)) {
    return NextResponse.json({ error: 'Invalid orderId format' }, { status: 400 });
  }

  try {
    // ✅ Fetch from the 'orders' table (where our finalize-order route saves the recipe)
    const { data, error } = await supabase
      .from('orders')
      .select('blend_recipe, blend_preferences, status, email')
      .eq('id', orderId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // ✅ CRITICAL SECURITY CHECK: Ensure the order is actually paid before revealing the recipe
    if (data.status !== 'paid' && data.status !== 'processing' && data.status !== 'fulfilled') {
      return NextResponse.json({ error: 'Blend not yet unlocked. Payment required.' }, { status: 403 });
    }

    // ✅ Return the securely unlocked data
    return NextResponse.json({
      success: true,
      blend: data.blend_recipe,
      preferences: data.blend_preferences,
      email: data.email // Useful for the frontend to confirm which email it was sent to
    });

  } catch (err: unknown) {
    console.error('❌ Error fetching unlocked blend:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}