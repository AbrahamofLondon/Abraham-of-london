// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit, RATE_LIMIT_CONFIGS } from '@/lib/server/rateLimit-unified';

export const GET = withRateLimit(
  async (req: NextRequest) => {
    // Your API logic here
    return NextResponse.json({ message: 'Success' });
  },
  RATE_LIMIT_CONFIGS.API_GENERAL
);