// app/api/verify-unlock/route.ts
import { Client } from 'xrpl';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client (for logging unlocks)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { uuid, blendSlug } = await req.json();

    if (!uuid || !blendSlug) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Step 1: Fetch payload result from Xaman
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
      return NextResponse.json({ error: 'Failed to fetch payload' }, { status: 500 });
    }

    const payload = await xamanRes.json();

    // Check if user signed
    if (payload.meta?.blob?.status !== 'signed') {
      return NextResponse.json({ error: 'Wallet not verified' }, { status: 400 });
    }

    const xrplAddress = payload.response.account;
    const requiredXec = payload.meta.blob.requiredXec;

    // Step 2: Connect to XRPL and get XEC balance
    const client = new Client('wss://xrplcluster.com');
    await client.connect();

    const accountLines = await client.request({
      command: 'account_lines',
      account: xrplAddress,
      peer: 'rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX' // XEC issuer
    });

    await client.disconnect();

    // Parse XEC balance
    const xecLine = accountLines.result.lines.find(
      (line: any) => line.currency === 'XEC' && line.account === 'rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX'
    );
    
    const xecBalance = xecLine ? Math.abs(parseFloat(xecLine.balance)) : 0;

    // Step 3: Get XEC USD value (using XRP price * your pool rate)
    let xecUsd = 0.26 * 2.17; // fallback: 0.26 XRP/XEC * $2.17/XRP
    try {
      const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=xrp&vs_currencies=usd');
      if (cgRes.ok) {
        const prices = await cgRes.json();
        xecUsd = 0.26 * prices.xrp.usd;
      }
    } catch (e) {
      console.warn('Using fallback XEC price');
    }

    const usdValue = xecBalance * xecUsd;
    const hasMinBalance = usdValue >= 25; // $25 minimum requirement
    const hasRequiredXec = xecBalance >= requiredXec;

    // Step 4: Unlock if qualified
    if (hasMinBalance && hasRequiredXec) {
      // Log unlock in Supabase (optional)
      await supabase.from('unlocks').insert({
        xrpl_address: xrplAddress,
        blend_slug: blendSlug,
        xec_amount: requiredXec
      });

      return NextResponse.json({ 
        success: true, 
        unlocked: true,
        xecBalance,
        usdValue
      });
    }

    // Not qualified
    return NextResponse.json({ 
      success: true, 
      unlocked: false,
      xecBalance,
      usdValue,
      requiredXec
    });

  } catch (error) {
    console.error('Verification error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}
