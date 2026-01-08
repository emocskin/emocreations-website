// app/api/unlock-xec/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { blendSlug } = await req.json();
    
    // Validate blend slug
    const validSlugs = [
      'xe', 'queen', 'king', 'unbroken', 'menopause', 'sciatic',
      'telomere', 'joint', 'glucose', 'shoulder', 'headache', 'opioid',
      'blood-type-a', 'metabolism'
    ];
    
    if (!validSlugs.includes(blendSlug)) {
      return NextResponse.json({ error: 'Invalid blend' }, { status: 400 });
    }

    // Get required XEC amount
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
    
    const requiredXec = products[blendSlug].xec;

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

    // Call Xaman API
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
      return NextResponse.json({ error: 'Failed to create unlock request' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      uuid: data.uuid,
      next_url: data.next_url
    });
  } catch (error) {
    console.error('Unlock API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
