// app/api/submit-order/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// Hardcoded product prices (match your PayPal buttons)
const PRODUCT_PRICES = {
  xe: 38,
  queen: 58,
  unbroken: 88,
  // Add others as needed
};

export async function POST(request) {
  try {
    const { email, blend, orderId } = await request.json();

    if (!email || !blend) {
      return NextResponse.json({ error: 'Email and blend are required' }, { status: 400 });
    }

    // Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([{ email, blend_slug: blend, order_id: orderId }])
      .select()
      .single();

    if (orderError) throw orderError;

    // === LOG REVENUE ===
    const amountUsd = PRODUCT_PRICES[blend] || 38; // fallback
    await supabase.from('financial_transactions').insert({
      type: 'revenue',
      category: 'paypal_sale',
      amount_usd: amountUsd,
      description: `PayPal sale: ${blend}`,
      related_id: orderId || order.id
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Order submission error:', error);
    return NextResponse.json({ error: 'Failed to submit order' }, { status: 500 });
  }
}
