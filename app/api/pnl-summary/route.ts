// app/api/pnl-summary/route.ts
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  const [revenueRes, expenseRes] = await Promise.all([
    supabase
      .from('financial_transactions')
      .select('amount_usd')
      .eq('type', 'revenue')
      .gte('created_at', thirtyDaysAgo),
    supabase
      .from('financial_transactions')
      .select('amount_usd')
      .eq('type', 'expense')
      .gte('created_at', thirtyDaysAgo)
  ]);

  const revenue = revenueRes.data?.reduce((sum, t) => sum + t.amount_usd, 0) || 0;
  const expenses = expenseRes.data?.reduce((sum, t) => sum + t.amount_usd, 0) || 0;

  return NextResponse.json({ revenue, expenses, profit: revenue - expenses });
}
