// xec-price-updater.ts
import { createClient } from '@supabase/supabase-js';
import axios from 'axios';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getXrpUsd(): Promise<number> {
  try {
    const res = await axios.get('https://api.coingecko.com/api/v3/simple/price?ids=ripple&vs_currencies=usd');
    return res.data.ripple.usd || 2.17;
  } catch (e) {
    console.warn('CoinGecko fallback to $2.17');
    return 2.17;
  }
}

async function getXecXrp(): Promise<number> {
  try {
    // XP Market API (scrape or use public pool data)
    // For now, use your known rate: 0.26 XRP/XEC
    return 0.26;
  } catch (e) {
    console.warn('XP Market fallback to 0.26 XRP/XEC');
    return 0.26;
  }
}

async function updateXecPrice() {
  const xrpUsd = await getXrpUsd();
  const xecXrp = await getXecXrp();
  const xecUsd = xrpUsd * xecXrp;

  // Create settings table if not exists
  await supabase.rpc('create_settings_table');

  // Upsert
  const { error } = await supabase
    .from('settings')
    .upsert(
      { key: 'xec_usd_price', value: xecUsd.toString(), updated_at: new Date().toISOString() },
      { onConflict: 'key' }
    );

  if (error) {
    console.error('Failed to update XEC price:', error);
  } else {
    console.log(`✅ XEC/USD updated: $${xecUsd.toFixed(4)}`);
  }
}

updateXecPrice().catch(console.error);
