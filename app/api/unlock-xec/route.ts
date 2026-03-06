// app/api/unlock-xec/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { blendSlug } = await req.json();
    
    // ✅ Validate blend slug AND get product in one step (type-safe)
    const products: Record<string, { xec: number }> = {
      'xe': { xec: 67 },
      'queen': { xec: 103 },
      'king': { xec: 103 },
      'menopause': { xec: 103 },
      'unbroken': { xec: 156 },
      'sciatic': { xec: 156 },
      'shoulder': { xec: 156 },
      'joint': { xec: 138 },
      'glucose': { xec: 138 },
      'headache': { xec: 138 },
      'opioid': { xec: 138 },
      'blood-type-a': { xec: 103 },
      'metabolism': { xec: 103 },
      'telomere': { xec: 297 }
    };
    
    // ✅ FIX: Check if product exists BEFORE accessing .xec
    const product = products[blendSlug];
    if (!product) {
      return NextResponse.json(
        { error: 'Invalid blend slug', validBlends: Object.keys(products) },
        { status: 400 }
      );
    }
    
    const requiredXec = product.xec; // ✅ Now TypeScript knows this is safe

    // Create Xaman payload
    const payload = {
      transaction: {
        TransactionType: "AccountSet",
        Account: "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh", // dummy account
      },
      options: {
        network: ["mainnet"],
        submit: true,
        expire: new Date(Date.now() + 10 * 60 * 1000).toISOString(), // 10 min expiry
      },
      custom_meta: {
        instruction: `Verify your wallet to unlock ${blendSlug}.`,
        blob: { blendSlug, requiredXec }
      }
    };

    // ✅ FIX: Removed trailing spaces in Xaman API URL
    const xamanRes = await fetch(
      `https://xaman.app/api/v1/business/${process.env.XAMAN_BUSINESS_ID}/payload`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': process.env.XAMAN_API_KEY!,
        },
        body: JSON.stringify(payload),
      }
    );

    const data = await xamanRes.json();
    
    if (!xamanRes.ok || data.error) {
      console.error('Xaman API error:', data);
      return NextResponse.json(
        { 
          error: 'Failed to create unlock request',
          details: data.error || 'Unknown Xaman error'
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      uuid: data.uuid,
      next_url: data.next_url
    });
  } catch (error) {
    console.error('Unlock API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
