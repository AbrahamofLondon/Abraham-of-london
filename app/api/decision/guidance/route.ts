// app/api/decision/guidance/route.ts

import { NextResponse } from "next/server";
import { assembleConstitutionalGuidance } from "@/lib/decision/constitutional-guidance-assembler";
import { buildCanonicalReportContract } from "@/lib/admin/reporting/canonical-report-contract";
import {
  loadPurposeAlignmentEvidence,
  buildDecisionCentrePaMemory,
} from "@/lib/alignment/evidence-loader";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const intake = body?.intake;
    const options = body?.options || {};

    const assembled = await assembleConstitutionalGuidance({
      intake,
      assetLimit: options.assetLimit ?? 6,
      minAssetScore: options.minAssetScore ?? 18,
      source: options.source ?? "strategy-room",
    });

    const canonical = buildCanonicalReportContract({
      report: {
        state: assembled.constitution.orgState,
        narrative: {
          headline: "Constitutional decision posture issued.",
          summary:
            assembled.constitution.narrativeSummary ||
            assembled.guidance.summary,
          mandate:
            assembled.guidance.nextAction ||
            "Proceed according to governed recommendation sequence.",
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
        id: "strategy-room",
        title: "Strategy Room Constitutional Diagnosis",
        organisationName: intake?.organisation || "Prospective Organisation",
        generatedAt: new Date().toISOString(),
      },
      registry: {
        model: "OGR-IV",
        node: "Canary Wharf",
        protocol: "Sovereign Protocol v2.2",
      },
    });

    // ── PURPOSE ALIGNMENT CASE MEMORY ──
    const paEvidence = await loadPurposeAlignmentEvidence({
      email: intake?.email ?? undefined,
      subjectId: intake?.subjectId ?? undefined,
    });
    const paMemory = buildDecisionCentrePaMemory(paEvidence);

    return NextResponse.json({
      ok: true,
      canonical,
      sections: canonical.sections,
      purposeAlignmentMemory: paMemory,
    });
  } catch (error) {
    console.error("[DECISION_GUIDANCE_ROUTE_ERROR]", error);

    return NextResponse.json(
      { ok: false, error: "Failed to assemble canonical decision guidance." },
      { status: 500 }
    );
  }
}