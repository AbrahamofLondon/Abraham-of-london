// app/api/strategy-room/session/init/route.ts

import { NextResponse } from "next/server";
import { assembleConstitutionalGuidance } from "@/lib/decision/constitutional-guidance-assembler";
import { buildCanonicalReportContract } from "@/lib/admin/reporting/canonical-report-contract";
import { normalizeCanonicalSectionsSnapshot } from "@/lib/strategy-room/canonical-snapshot";
import { prisma } from "@/lib/prisma.server";

function makeSessionKey(): string {
  return `sr_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const intake = body?.intake;

    if (!intake || typeof intake !== "object") {
      return NextResponse.json(
        { success: false, error: "Invalid intake payload." },
        { status: 400 }
      );
    }

    const sessionKey = makeSessionKey();

    const assembled = await assembleConstitutionalGuidance({
      intake,
      assetLimit: 6,
      minAssetScore: 18,
      source: "strategy-room-session-init",
    });

    const canonical = buildCanonicalReportContract({
      report: {
        state: assembled.constitution.orgState,
        narrative: {
          headline: "Constitutional signal captured.",
          summary:
            assembled.constitution.narrativeSummary ||
            assembled.guidance.summary,
          mandate:
            assembled.guidance.nextAction ||
            "Proceed through governed decision path.",
        },
        resonance: {
          telemetry: {
            averageDissonance: assembled.constitution.severityScore ?? 0,
            domains: (assembled.constitution.dominantDomains || []).map(
              (label: string) => ({
                label,
                intent: 80,
                reality: 60,
                dissonance: 20,
              })
            ),
          },
        },
        hcdAggregate: {
          overallBurnoutIndex: assembled.constitution.severityScore ?? 0,
        },
        financialExposure: {
          replacementCost: 0,
          executionLoss: 0,
          totalExposure: 0,
        },
        failureModes: assembled.constitution.failureModes || [],
        priorityStack: assembled.constitution.requiredInterventions || [],
        ogr: {
          sovereignCertainty: assembled.constitution.clarityScore ?? 0,
          isAuthorizedToExecute:
            assembled.constitution.route === "STRATEGY",
        },
      },
      constitution: assembled.constitution,
      guidance: assembled.guidance,
      campaign: {
        id: sessionKey,
        title: "Strategy Room Session",
        organisationName: intake?.organisation || "Prospective Organisation",
        generatedAt: new Date().toISOString(),
      },
      registry: {
        model: "OGR-IV",
        node: "Canary Wharf",
        protocol: "Sovereign Protocol v2.2",
      },
    });

    const canonicalSnapshot = normalizeCanonicalSectionsSnapshot({
      envelope: canonical,
      source: "session-init",
      sessionKey,
    });

    await prisma.strategyRoomSession.create({
      data: {
        sessionKey,
        status: "active",
        source: "strategy-room",
        intake: intake as any,
        canonicalSnapshot: canonicalSnapshot as any,
        route: assembled.constitution.route,
        readinessTier: assembled.constitution.readinessTier,
        authorityType: assembled.constitution.authorityType,
      },
    });

    return NextResponse.json({
      success: true,
      sessionKey,
      constitution: {
        route: assembled.constitution.route,
        priority: assembled.constitution.priority,
        temperature: assembled.constitution.temperature,
        orgState: assembled.constitution.orgState,
        readinessTier: assembled.constitution.readinessTier,
        authorityType: assembled.constitution.authorityType,
        revenueBand: assembled.constitution.revenueBand,
        marketRiskBand: assembled.constitution.marketRiskBand,
      },
      canonical,
    });
  } catch (error) {
    console.error("[STRATEGY_ROOM_SESSION_INIT_ERROR]", error);

    return NextResponse.json(
      { success: false, error: "Failed to initialize governed session." },
      { status: 500 }
    );
  }
}