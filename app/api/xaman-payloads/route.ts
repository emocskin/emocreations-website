// app/api/xaman-payloads/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  const apiKey = process.env.XAMAN_API_KEY;
  const apiSecret = process.env.XAMAN_API_SECRET;

  // Validate environment variables
  if (!apiKey || !apiSecret) {
    console.error('Missing XAMAN_API_KEY or XAMAN_API_SECRET');
    return NextResponse.json(
      { error: 'Xaman credentials not configured' },
      { status: 500 }
    );
  }

  try {
    // Fetch payloads from Xaman Developer API
    const res = await fetch('https://xaman.app/api/v2/payload', {
      headers: {
        'X-API-Key': apiKey,
        'X-API-Secret': apiSecret,
        'Accept': 'application/json',
      },
      // Revalidate every 10 seconds for live updates
      next: { revalidate: 10 },
    });

    // Handle HTTP errors
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Xaman API error:', res.status, errorText);
      return NextResponse.json(
        { error: 'Failed to fetch payloads from Xaman' },
        { status: res.status }
      );
    }

    // Parse response
    const data = await res.json();

    // Return only the payloads array
    return NextResponse.json(data.payloads || []);
  } catch (error) {
    console.error('Unexpected error in xaman-payloads route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
