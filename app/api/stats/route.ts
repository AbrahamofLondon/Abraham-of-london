import { NextResponse } from 'next/server';
import { getRegistryStats } from '@/lib/pdf/registry'; // Server-side only
import { convertStats } from '@/utils/pdf-stats-converter';

/**
 * GET /api/stats
 * Systematic endpoint for institutional dashboard metrics.
 * * Flow: Registry (FS) -> Converter (Logic) -> Route (JSON)
 */
export async function GET() {
  try {
    // 1. Fetch raw data from the server-side registry (File System check)
    const rawStats = await getRegistryStats();
    
    // 2. Transform into UI-consumable DashboardStats (Type alignment)
    const formatted = convertStats(rawStats);
    
    // 3. Return sanitized JSON with short-term cache to optimize performance
    return NextResponse.json(formatted, {
      headers: {
        'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=59',
      },
    });
  } catch (error) {
    // Strategic logging for institutional audit
    console.error('[INSTITUTIONAL_STATS_ERROR]:', error instanceof Error ? error.message : error);
    
    return NextResponse.json(
      { error: 'Failed to fetch institutional stats' }, 
      { status: 500 }
    );
  }
}