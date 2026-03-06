// app/api/verify-unlock/route.ts
import { Client } from 'xrpl';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// ✅ XEC Token Configuration
const XEC_CONFIG = {
  currency: 'XEC',
  issuer: 'rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX', // ✅ YOUR XEC ISSUER
  requiredUsdThreshold: 25,
};

// ✅ Fallback prices for predefined blends
const PREDEFINED_PRICES: Record<string, number> = {
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      uuid,
      blendSlug,
      // ✅ NEW: AI blend fields
      blendRecipe,
      blendName,
      blendDescription,
      blendInstructions,
      userPrompt,
      // ✅ NEW: Payment metadata
      paymentMethod = 'xec', // 'xec' | 'paypal'
      walletAddress, // XRPL address of payer
      xecPriceOverride, // Optional: override price fetch
    } = body;

    // ✅ Validation
    if (!blendSlug) {
      return NextResponse.json({ error: 'blendSlug is required' }, { status: 400 });
    }

    // ✅ Determine if AI blend
    const isAiBlend = blendSlug.startsWith('ai-generated-') || !!blendRecipe;
    
    // ✅ Determine pricing: AI blends use provided price, predefined use lookup
    const basePriceUsd = isAiBlend 
      ? (body.price || 58) // Fallback $58 for AI blends
      : (PREDEFINED_PRICES[blendSlug] || 38);
    
    const requiredXec = body.requiredXec || Math.ceil(basePriceUsd / 0.37); // Fallback calc

    // ✅ FIX: Declare xecUsdPrice at function scope so it's always defined
    let xrplAddress = walletAddress;
    let xecBalance = 0;
    let usdValue = 0;
    let xecUsdPrice: number | undefined; // ✅ Declared at top level
    let hasMinBalance = false;
    let hasRequiredXec = false;

    // ✅ STEP 1: If XEC payment, verify via Xaman payload OR direct balance check
    if (paymentMethod === 'xec') {
      // Option A: Verify via Xaman payload (if uuid provided)
      if (uuid) {
        const xamanRes = await fetch(
          `https://xaman.app/api/v1/payload/${uuid}`,
          { 
            headers: { 
              'X-API-Key': process.env.XAMAN_API_KEY!,
              'Accept': 'application/json'
            } 
          }
        );

        if (!xamanRes.ok) {
          console.error('Xaman API error:', await xamanRes.text());
          return NextResponse.json({ error: 'Failed to verify payload' }, { status: 500 });
        }

        const payload = await xamanRes.json();

        // Check if user signed
        if (payload.meta?.blob?.status !== 'signed') {
          return NextResponse.json({ 
            error: 'Wallet not verified', 
            status: payload.meta?.blob?.status 
          }, { status: 400 });
        }

        xrplAddress = payload.response.account;
      }

      // Option B: Direct balance check if address provided
      if (!xrplAddress) {
        return NextResponse.json({ error: 'walletAddress or uuid required for XEC verification' }, { status: 400 });
      }

      // ✅ STEP 2: Connect to XRPL and get XEC balance
      const client = new Client('wss://xrplcluster.com');
      await client.connect();

      try {
        const accountLines = await client.request({
          command: 'account_lines',
          account: xrplAddress,
          peer: XEC_CONFIG.issuer,
        });

        // Parse XEC balance
        const xecLine = accountLines.result.lines.find(
          (line: any) => line.currency === XEC_CONFIG.currency && line.account === XEC_CONFIG.issuer
        );
        
        xecBalance = xecLine ? Math.abs(parseFloat(xecLine.balance)) : 0;
      } finally {
        await client.disconnect();
      }

      // ✅ STEP 3: Get accurate XEC USD price
      xecUsdPrice = xecPriceOverride;
      
      if (!xecUsdPrice) {
        try {
          const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=ecash&vs_currencies=usd');
          if (cgRes.ok) {
            const prices = await cgRes.json();
            xecUsdPrice = prices.ecash?.usd || 0.00037; // Fallback
          }
        } catch (e) {
          console.warn('Using fallback XEC price:', e);
          xecUsdPrice = 0.00037; // Conservative fallback
        }
      }

      usdValue = xecBalance * xecUsdPrice;
      hasMinBalance = usdValue >= XEC_CONFIG.requiredUsdThreshold;
      hasRequiredXec = xecBalance >= requiredXec;
    } else {
      // ✅ PayPal payments skip balance check (handled client-side)
      hasMinBalance = true;
      hasRequiredXec = true;
      usdValue = basePriceUsd;
      xecUsdPrice = undefined; // ✅ Explicitly undefined for non-XEC payments
    }

    // ✅ STEP 4: Determine unlock status
    const unlocked = hasMinBalance && hasRequiredXec;

    // ✅ STEP 5: Log verification/unlock event
    if (unlocked) {
      const unlockRecord = {
        xrpl_address: xrplAddress || null,
        blend_slug: blendSlug,
        blend_name: blendName || null,
        blend_description: blendDescription || null,
        blend_recipe: blendRecipe || null,
        blend_instructions: blendInstructions || null,
        user_prompt: userPrompt || null,
        payment_method: paymentMethod,
        xec_amount: paymentMethod === 'xec' ? requiredXec : null,
        xec_balance_at_verify: paymentMethod === 'xec' ? xecBalance : null,
        usd_value_at_verify: usdValue,
        // ✅ FIX: Use optional chaining since xecUsdPrice may be undefined
        xec_usd_price: paymentMethod === 'xec' ? (xecUsdPrice ?? null) : null,
        is_ai_blend: isAiBlend,
        verified_at: new Date().toISOString(),
      };

      const { error: unlockError } = await supabase
        .from('unlocks')
        .insert([unlockRecord]);

      if (unlockError) {
        console.warn('Unlock logging failed (non-critical):', unlockError);
      }

      // ✅ Optional: Log revenue transaction for XEC payments
      if (paymentMethod === 'xec') {
        await supabase.from('financial_transactions').insert({
          type: 'revenue',
          category: 'xec_unlock',
          amount_usd: usdValue,
          amount_xec: requiredXec,
          description: `XEC unlock: ${blendName || blendSlug}${isAiBlend ? ' (AI)' : ''}`,
          metadata: {
            blend_slug: blendSlug,
            is_ai_blend: isAiBlend,
            xrpl_address: xrplAddress,
          }
        }).catch(err => console.warn('Revenue logging failed:', err));
      }
    }

    // ✅ STEP 6: Return response
    return NextResponse.json({ 
      success: true, 
      unlocked,
      xecBalance: paymentMethod === 'xec' ? xecBalance : undefined,
      usdValue,
      requiredXec: paymentMethod === 'xec' ? requiredXec : undefined,
      blend: {
        slug: blendSlug,
        name: blendName,
        isAi: isAiBlend,
        recipe: unlocked && isAiBlend ? blendRecipe : undefined,
      },
      message: unlocked 
        ? (isAiBlend ? '✨ AI blend unlocked!' : 'Blend unlocked!') 
        : (paymentMethod === 'xec' 
            ? `Insufficient balance. Need ${requiredXec} XEC (≈$${XEC_CONFIG.requiredUsdThreshold}). You have ${xecBalance.toFixed(2)} XEC (≈$${usdValue.toFixed(2)}).`
            : 'Payment verification pending')
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json(
      { 
        error: 'Verification failed', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    );
  }
}
