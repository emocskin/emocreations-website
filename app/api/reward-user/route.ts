// app/api/reward-user/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  try {
    const { action_id } = await req.json();

    if (!action_id) {
      return NextResponse.json({ error: 'Missing action_id' }, { status: 400 });
    }

    // Fetch action from Supabase
    const { data: action, error } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('id', action_id)
      .single();

    if (error || !action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (action.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    }

    const xamanAddress = action.user_identifier;

    // Validate XRPL address
    if (!xamanAddress || !xamanAddress.startsWith('r')) {
      await supabase
        .from('agent_actions')
        .update({ 
          status: 'failed', 
          meta: { error: 'Invalid XRPL address' } 
        })
        .eq('id', action.id);
      return NextResponse.json({ error: 'Invalid XRPL address' }, { status: 400 });
    }

    // === SEND XEC VIA XAMAN WEBHOOK ===
    const payload = {
      transaction: {
        Destination: xamanAddress,
        Amount: {
          currency: 'XEC',
          issuer: 'rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX',
          value: action.xec_amount.toString(),
        },
      },
      options: {
        memo: 'Reward for social share • EmoCreations.skin',
      },
    };

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

    const xamanData = await xamanRes.json();

    if (!xamanRes.ok || xamanData.error) {
      await supabase
        .from('agent_actions')
        .update({ 
          status: 'failed', 
          meta: { xaman_error: xamanData } 
        })
        .eq('id', action.id);
      return NextResponse.json({ error: 'Xaman send failed' }, { status: 500 });
    }

    // Mark as sent
    await supabase
      .from('agent_actions')
      .update({ 
        status: 'sent', 
        tx_hash: xamanData.txid,
        meta: { ...action.meta, xaman_payload_uuid: xamanData.uuid }
      })
      .eq('id', action.id);

    return NextResponse.json({ success: true, txid: xamanData.txid });
  } catch (error) {
    console.error('Reward error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
