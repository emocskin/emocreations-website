// app/api/submit-order/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  try {
    const { email, blend, orderId } = await request.json();

    if (!email || !blend) {
      return NextResponse.json({ error: 'Email and blend are required' }, { status: 400 });
    }

    const { error } = await supabase
      .from('orders')
      .insert([{ email, blend_slug: blend, order_id: orderId }]);

    if (error) throw error;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Order error:', error);
    return NextResponse.json({ error: 'Submission failed' }, { status: 500 });
  }
}
