// app/api/v2/health/route.ts
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: 'v2',
    router: 'app',
    timestamp: new Date().toISOString(),
  }, {
    headers: {
      'X-API-Version': 'v2',
      'X-API-Router': 'app',
    },
  });
}
