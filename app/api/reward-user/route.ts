// app/api/reward-user/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // ✅ Move env vars inside handler
  const XAMAN_API_KEY = process.env.XAMAN_API_KEY;
  const XAMAN_API_SECRET = process.env.XAMAN_API_SECRET;
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!XAMAN_API_KEY || !XAMAN_API_SECRET || !SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing environment variables in reward-user');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const { action_id } = await req.json();

    if (!action_id) {
      return NextResponse.json({ error: 'action_id is required' }, { status: 400 });
    }

    const {   action, error: fetchError } = await supabase
      .from('agent_actions')
      .select('*')
      .eq('id', action_id)
      .single();

    if (fetchError || !action) {
      return NextResponse.json({ error: 'Action not found' }, { status: 404 });
    }

    if (action.status !== 'pending') {
      return NextResponse.json({ error: 'Already processed' }, { status: 400 });
    }

    const xrplAddress = action.user_identifier;
    if (!xrplAddress || !xrplAddress.startsWith('r')) {
      await supabase
        .from('agent_actions')
        .update({ status: 'failed', meta: { ...action.meta, error: 'Invalid XRPL address' } })
        .eq('id', action.id);
      return NextResponse.json({ error: 'Invalid XRPL address' }, { status: 400 });
    }

    // === SEND XEC VIA XAMAN ===
    const payload = {
      user: { identifier: xrplAddress },
      transaction: {
        Destination: xrplAddress,
        Amount: {
          currency: 'XEC',
          issuer: 'rJzq9Xwg1ZNRmSk5uyPoHdLDffpctv26CX',
          value: action.xec_amount.toString(),
        },
      },
      options: { memo: `Reward for ${action.action_type} • EmoCreations.skin` },
    };

    const xamanRes = await fetch('https://xaman.app/api/v2/payload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': XAMAN_API_KEY,
        'X-API-Secret': XAMAN_API_SECRET,
      },
      body: JSON.stringify(payload),
    });

    const xamanData = await xamanRes.json();

    if (!xamanRes.ok || xamanData.error) {
      await supabase
        .from('agent_actions')
        .update({ status: 'failed', meta: { ...action.meta, xaman_error: xamanData } })
        .eq('id', action.id);
      return NextResponse.json({ error: 'Xaman send failed' }, { status: 500 });
    }

    // === LOG EXPENSE ===
    let xecUsd = 0.26 * 2.17;
    try {
      const cgRes = await fetch('https://api.coingecko.com/api/v3/simple/price?ids=xrp&vs_currencies=usd');
      if (cgRes.ok) {
        const prices = await cgRes.json();
        xecUsd = 0.26 * prices.xrp.usd;
      }
    } catch (e) {
      console.warn('Using fallback XEC price for expense logging');
    }

    const expenseAmount = action.xec_amount * xecUsd;
    await supabase.from('financial_transactions').insert({
      type: 'expense',
      category: 'marketing_reward',
      amount_usd: parseFloat(expenseAmount.toFixed(2)),
      description: `XEC reward: ${action.action_type}`,
      related_id: action.id
    });

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
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
