import { NextRequest, NextResponse } from 'next/server';

// Simple IP-to-country detection using a free API
export async function GET(req: NextRequest) {
  try {
    // Get the client's real IP from headers (behind proxy/gateway)
    const forwarded = req.headers.get('x-forwarded-for');
    const realIp = req.headers.get('x-real-ip');
    const ip = forwarded?.split(',')[0]?.trim() || realIp || '';

    if (!ip || ip === '127.0.0.1' || ip === '::1') {
      // Local development — default to Senegal (SN) since the app targets Hajj pilgrims from West Africa
      return NextResponse.json({ country: 'SN', ip: 'local' });
    }

    // Use ipapi.co (free, no API key needed, 1000 req/day)
    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3000), // 3s timeout
    });

    if (!res.ok) {
      return NextResponse.json({ country: 'SN', ip }); // fallback to Senegal
    }

    const data = await res.json();
    const country = data.country_code || 'SN';

    return NextResponse.json({ country, ip });
  } catch {
    return NextResponse.json({ country: 'SN', ip: 'unknown' }); // fallback to Senegal
  }
}
