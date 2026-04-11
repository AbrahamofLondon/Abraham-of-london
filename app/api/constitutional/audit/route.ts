// app/api/constitutional/audit/route.ts
// --- AUDIT TRAIL ENDPOINT ---

import { NextResponse } from 'next/server';
import { safePrismaQuery } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');

    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', ok: false },
        { status: 401 }
      );
    }

    // Fetch audit logs — auditEntry model may not be provisioned yet
    const query: Record<string, unknown> = {};
    if (campaignId) query.campaignId = campaignId;

    const auditLogs = await safePrismaQuery<any[]>((p: any) =>
      p.auditEntry?.findMany?.({
        where: query,
        orderBy: { timestamp: 'desc' },
        take: 1000,
      }) ?? []
    );

    return NextResponse.json({
      ok: true,
      logs: auditLogs ?? [],
      count: auditLogs?.length ?? 0,
    });
  } catch (error) {
    console.error('Audit fetch failed:', error);
    return NextResponse.json(
      { error: 'Audit fetch failed', ok: false },
      { status: 500 }
    );
  }
}
