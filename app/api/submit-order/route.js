// app/api/submit-order/route.js
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ✅ Fallback prices for predefined blends (AI blends use dynamic pricing)
const PREDEFINED_PRICES = {
  xe: 38,
  queen: 58,
  king: 58,
  unbroken: 88,
  menopause: 58,
  sciatic: 88,
  telomere: 168,
  joint: 78,
  glucose: 78,
  shoulder: 88,
  headache: 78,
  opioid: 78,
  'blood-type-a': 58,
  metabolism: 58,
};

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      email,
      blend,          // slug: 'xe' or 'ai-generated-1735689234'
      orderId,        // PayPal order ID or XEC transaction hash
      blendRecipe,    // ✅ NEW: Array of {oil, drops, purpose} for AI blends
      paymentMethod,  // ✅ NEW: 'paypal' | 'xec'
      usdValue,       // ✅ NEW: USD equivalent (for XEC payments)
      xecAmount,      // ✅ NEW: XEC amount paid (for XEC payments)
      blendName,      // ✅ NEW: Human-readable name for AI blends
      blendDescription// ✅ NEW: Description for AI blends
    } = body;

    // ✅ Validation
    if (!email || !blend) {
      return NextResponse.json(
        { error: 'Email and blend slug are required' },
        { status: 400 }
      );
    }

    // ✅ Determine pricing: AI blends use provided price, predefined use lookup
    const isAiBlend = blend.startsWith('ai-generated-');
    const amountUsd = isAiBlend 
      ? (body.price || 58) // Fallback to $58 if AI blend doesn't provide price
      : (PREDEFINED_PRICES[blend] || 38);

    // ✅ Prepare order data
    const orderData = {
      email,
      blend_slug: blend,
      order_id: orderId,
      payment_method: paymentMethod || 'paypal', // Default to paypal for backwards compat
      // ✅ Store AI blend metadata as JSONB
      blend_name: blendName || null,
      blend_description: blendDescription || null,
      blend_recipe: blendRecipe || null, // JSONB array: [{oil, drops, purpose}, ...]
      // ✅ XEC-specific fields
      xec_amount: xecAmount || null,
      usd_value_at_payment: usdValue || amountUsd,
    };

    // ✅ Insert order
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .insert([orderData])
      .select()
      .single();

    if (orderError) {
      console.error('Supabase order insert error:', orderError);
      throw orderError;
    }

    // === 💰 LOG REVENUE (supports both PayPal USD and XEC) ===
    const transactionAmount = paymentMethod === 'xec' 
      ? (usdValue || amountUsd) // Use USD equivalent for XEC payments
      : amountUsd; // PayPal is already in USD

    const { error: financeError } = await supabase
      .from('financial_transactions')
      .insert({
        type: 'revenue',
        category: paymentMethod === 'xec' ? 'xec_sale' : 'paypal_sale',
        amount_usd: transactionAmount,
        amount_xec: paymentMethod === 'xec' ? xecAmount : null,
        description: `${paymentMethod === 'xec' ? 'XEC' : 'PayPal'} sale: ${blendName || blend}${isAiBlend ? ' (AI-generated)' : ''}`,
        related_id: orderId || order.id,
        metadata: {
          blend_slug: blend,
          is_ai_blend: isAiBlend,
          wallet_address: body.walletAddress || null, // Optional: log payer address
        }
      });

    if (financeError) {
      console.warn('Financial logging failed (non-critical):', financeError);
      // Don't fail the order if revenue logging fails
    }

    // ✅ Optional: Store AI recipe in separate table for analytics/reuse
    if (isAiBlend && blendRecipe?.length > 0) {
      const { error: recipeError } = await supabase
        .from('ai_blend_recipes')
        .insert({
          order_id: order.id,
          user_prompt: body.userPrompt || null, // The original user input
          recipe_data: blendRecipe,
          model_used: 'emocreations.skin_ai',
          generated_at: new Date().toISOString(),
        });
      
      if (recipeError) {
        console.warn('AI recipe storage failed (non-critical):', recipeError);
      }
    }

    return NextResponse.json(
      { 
        success: true, 
        orderId: order.id,
        blend: isAiBlend ? 'custom-ai' : blend,
        message: isAiBlend ? '✨ Your AI blend order confirmed!' : 'Order confirmed'
      }, 
      { status: 200 }
    );

  } catch (error) {
    console.error('Order submission error:', error);
    return NextResponse.json(
      { error: 'Failed to submit order', details: error.message },
      { status: 500 }
    );
  }
}
