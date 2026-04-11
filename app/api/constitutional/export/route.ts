export const dynamic = "force-dynamic";
// app/api/constitutional/export/route.ts
// --- CONSTITUTIONAL EXPORT ENDPOINT ---

import { NextResponse } from 'next/server';
import { exportConstitutionalData } from '@/lib/constitution/export-standards';
import { safePrismaQuery } from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const format = (searchParams.get('format') || 'CANONICAL_JSON') as any;

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required', ok: false },
        { status: 400 }
      );
    }

    const userId = request.headers.get('X-User-Id') ||
                   request.headers.get('x-user-id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', ok: false },
        { status: 401 }
      );
    }

    // Fetch campaign data — models may not be provisioned yet
    const campaign = await safePrismaQuery<any>((p: any) =>
      p.alignmentCampaign?.findUnique?.({
        where: { id: campaignId },
        include: { organisation: true },
      })
    );

    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found', ok: false },
        { status: 404 }
      );
    }

    const report = await safePrismaQuery<any>((p: any) =>
      p.executiveReport?.findUnique?.({
        where: { campaignId },
        select: { canonicalData: true, constitutionalDecision: true },
      })
    );

    const canonicalData = report?.canonicalData ?? null;
    const constitutionalDecision = report?.constitutionalDecision ?? {
      route: 'DIAGNOSTIC',
      confidence: 0.5,
      disqualifiersTriggered: [],
      recommendedInterventions: [],
      rationale: ['No constitutional decision recorded'],
    };

    if (!canonicalData) {
      return NextResponse.json(
        { error: 'No canonical data available for export', ok: false },
        { status: 404 }
      );
    }

    const exportData = exportConstitutionalData(
      canonicalData,
      constitutionalDecision,
      campaignId,
      userId,
      format
    );

    return NextResponse.json(exportData, {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="constitutional-export-${campaignId}.json"`,
        'X-Export-Version': '1.0.0',
        'X-Export-Format': format,
      },
    });
  } catch (error) {
    console.error('[Constitutional Export] Failed:', error);
    return NextResponse.json(
      { error: 'Export failed', ok: false },
      { status: 500 }
    );
  }
}
