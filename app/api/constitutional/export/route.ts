// app/api/constitutional/export/route.ts
// ─── CONSTITUTIONAL EXPORT ENDPOINT ───────────────────────────────────────────

import { NextResponse } from 'next/server';
import { exportConstitutionalData } from '@/lib/constitution/export-standards';
import { validateAuthority } from '@/lib/constitution/constitutional-authority';
import { db } from '@/lib/db';

// Helper to get campaign data - direct database query instead of missing service
async function getCampaignData(campaignId: string) {
  const campaign = await db.alignmentCampaign.findUnique({
    where: { id: campaignId },
    include: {
      organisation: true,
      participants: {
        where: { status: "completed" },
        select: { id: true, status: true },
      },
    },
  });
  
  if (!campaign) return null;
  
  // Get canonical data from report if exists
  const report = await db.executiveReport.findUnique({
    where: { campaignId },
    select: { canonicalData: true, constitutionalDecision: true },
  });
  
  return {
    ...campaign,
    canonicalData: report?.canonicalData || null,
    constitutionalDecision: report?.constitutionalDecision || null,
    participantCount: campaign.participants?.length || 0,
  };
}

async function getConstitutionalAuthority(userId: string, campaignId: string) {
  // Get the most recent authority for this user and campaign
  const authority = await db.constitutionalAuthority.findFirst({
    where: {
      userId,
      campaignId,
      expiresAt: { gt: new Date() },
    },
    orderBy: { grantedAt: 'desc' },
  });
  
  if (!authority) return null;
  
  return {
    userId: authority.userId,
    campaignId: authority.campaignId,
    authorityLevel: authority.authorityLevel,
    grantedAt: authority.grantedAt.toISOString(),
    grantedBy: authority.grantedBy,
    signature: authority.signature,
    scope: authority.scope,
    expiresAt: authority.expiresAt?.toISOString(),
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const format = searchParams.get('format') as any || 'CANONICAL_JSON';

    if (!campaignId) {
      return NextResponse.json(
        { error: 'Campaign ID required', ok: false },
        { status: 400 }
      );
    }

    // Get user session from cookie or header
    const userId = request.headers.get('X-User-Id') || 
                   request.headers.get('x-user-id') ||
                   request.cookies.get('user_id')?.value;
    
    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', ok: false },
        { status: 401 }
      );
    }

    // Fetch campaign data
    const campaign = await getCampaignData(campaignId);
    if (!campaign) {
      return NextResponse.json(
        { error: 'Campaign not found', ok: false },
        { status: 404 }
      );
    }

    // Validate export authority
    const authority = await getConstitutionalAuthority(userId, campaignId);
    
    if (!authority) {
      return NextResponse.json(
        { error: 'No constitutional authority found', ok: false },
        { status: 403 }
      );
    }

    // Validate authority level for export (minimum PARTICIPANT)
    const validation = validateAuthority(
      { type: 'EXPORT', payload: { campaignId }, authoritySignature: '', id: '', timestamp: '' } as any,
      authority,
      'PARTICIPANT'
    );

    if (!validation.valid) {
      return NextResponse.json(
        { error: validation.reason, ok: false, escalation: validation.escalation },
        { status: 403 }
      );
    }

    // Get canonical data
    let canonicalData = campaign.canonicalData;
    
    // If no canonical data exists, generate from report or create default
    if (!canonicalData && campaign.constitutionalDecision) {
      canonicalData = {
        ok: true,
        sections: {
          executiveSummary: {
            route: campaign.constitutionalDecision.route,
            state: 'ORDERED',
            narrative: 'Constitutional export of campaign data',
          },
          constitutionalPosture: {
            route: campaign.constitutionalDecision.route,
            orgState: 'ORDERED',
            readinessTier: 'EMERGING',
            authorityType: 'UNCLEAR',
            priority: 'MEDIUM',
            temperature: 'WARM',
            marketRiskBand: 'MODERATE',
            revenueBand: 'SMB',
            clarityScore: 50,
            authorityScore: 50,
            governanceScore: 50,
            severityScore: 50,
            revenueScore: 50,
            dominantDomains: [],
            failureModes: [],
            requiredInterventions: campaign.constitutionalDecision.recommendedInterventions,
            sponsorTypes: [],
            worldviewAnchors: [],
            narrativeSummary: 'Constitutional export',
            rationale: campaign.constitutionalDecision.rationale,
          },
          strategicDomainAnalysis: { temperature: 'WARM', domains: [] },
          financialExposure: { marketRiskBand: 'MODERATE', revenueBand: 'SMB', revenueScore: 50 },
          integritySnapshot: { clarityScore: 50, authorityScore: 50, governanceScore: 50 },
          governedRecommendations: {
            readinessTier: 'EMERGING',
            authorityType: 'UNCLEAR',
            summary: 'Constitutional export',
            nextAction: 'Review campaign data',
            recommendations: [],
          },
          priorityStack: [],
          failureModes: [],
          requiredInterventions: campaign.constitutionalDecision.recommendedInterventions,
          dominantDomains: [],
          worldviewAnchors: [],
          sponsorTypes: [],
          rationale: campaign.constitutionalDecision.rationale,
        },
      };
    }

    if (!canonicalData) {
      return NextResponse.json(
        { error: 'No canonical data available for export', ok: false },
        { status: 404 }
      );
    }

    const exportData = exportConstitutionalData(
      canonicalData,
      campaign.constitutionalDecision || {
        route: 'DIAGNOSTIC',
        confidence: 0.5,
        disqualifiersTriggered: [],
        recommendedInterventions: [],
        rationale: ['No constitutional decision recorded'],
      },
      campaignId,
      userId,
      format
    );

    // Log the export action
    await db.auditEntry.create({
      data: {
        id: crypto.randomUUID(),
        campaignId,
        userId,
        action: 'CONSTITUTIONAL_EXPORT',
        timestamp: new Date().toISOString(),
        metadata: { format, participantCount: campaign.participantCount },
      },
    });

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
      { error: 'Export failed', ok: false, details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}