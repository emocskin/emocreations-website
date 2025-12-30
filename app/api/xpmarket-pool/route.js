// app/api/xpmarket-pool/route.js
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // In production: fetch live data from XP Market API
    // For now, return mock data based on your screenshot
    const poolData = {
      price: 0.26,
      usdPrice: 0.26 * 2.17, // XRP price
      volume: 0.35,
      fee: 1,
      contributors: 10,
      topStake: 78.81,
      traders: 3,
      listedOn: "2025-03-11",
      xecAmount: 473.1,
      xrpAmount: 124.9
    };

    return NextResponse.json(poolData);
  } catch (error) {
    console.error('XP Market pool error:', error);
    return NextResponse.json({ error: 'Failed to fetch pool data' }, { status: 500 });
  }
}