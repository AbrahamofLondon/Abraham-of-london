// app/api/constitutional/audit/route.ts
// ─── AUDIT TRAIL ENDPOINT ─────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { validateAuthority } from '@/lib/constitution/constitutional-authority';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    const userId = request.headers.get('X-User-Id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', ok: false },
        { status: 401 }
      );
    }

    // Validate audit access authority
    const authority = await getConstitutionalAuthority(userId, campaignId || '');
    const validation = validateAuthority(
      { type: 'SUBMIT', payload: {}, authoritySignature: '', id: '', timestamp: '' } as any,
      authority,
      'AUTHORITY'
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason, ok: false },
        { status: 403 }
      );
    }

    // Build query
    const query: any = {};
    if (campaignId) query.campaignId = campaignId;
    if (from) query.timestamp = { ...query.timestamp, gte: from };
    if (to) query.timestamp = { ...query.timestamp, lte: to };

    const auditLogs = await db.auditEntry.findMany({
      where: query,
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    // Verify chain integrity
    const verifiedLogs = [];
    let previousHash = 'GENESIS';
    for (const log of auditLogs.reverse()) {
      const expectedHash = log.hash;
      const calculatedHash = generateHash(previousHash, log.actionId, log.timestamp, log.action);

      if (expectedHash !== calculatedHash) {
        console.warn(`Audit chain broken at ${log.id}`);
      }

      verifiedLogs.push({
        ...log,
        chainValid: expectedHash === calculatedHash,
      });
      previousHash = expectedHash;
    }

    return NextResponse.json({
      ok: true,
      logs: verifiedLogs.reverse(),
      integrity: verifiedLogs.every(l => l.chainValid),
      count: verifiedLogs.length,
    });
  } catch (error) {
    console.error('Audit fetch failed:', error);
    return NextResponse.json(
      { error: 'Audit fetch failed', ok: false },
      { status: 500 }
    );
  }
}