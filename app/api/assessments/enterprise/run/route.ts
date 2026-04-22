// app/api/assessments/enterprise/run/route.ts
import { NextResponse } from "next/server";
import { buildGenericAuthorityPacket } from "@/lib/diagnostics/evidence-graph";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";

type EnterpriseDomain = {
  label: string;
  authority: number;
  governance: number;
  clarity: number;
  execution: number;
  trust: number;
  exposure: number;
};

function n(value: unknown, fallback = 0) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
}

function s(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = s(body?.email).toLowerCase();
    const organisation = s(body?.organisation, "Unknown organisation");
    const domains = Array.isArray(body?.domains) ? (body.domains as EnterpriseDomain[]) : [];

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    if (domains.length < 3) {
      return NextResponse.json(
        { ok: false, error: "At least three enterprise domains are required." },
        { status: 400 },
      );
    }

    const disorderScores = domains.map((d) => {
      const averageHealth =
        (n(d.authority) + n(d.governance) + n(d.clarity) + n(d.execution) + n(d.trust)) / 5;
      return {
        label: d.label,
        disorder: Math.max(0, Math.round(n(d.exposure) - averageHealth / 2)),
      };
    });

    disorderScores.sort((a, b) => b.disorder - a.disorder);

    // ✅ FIX: Safely access the first element
    const highestDisorder = disorderScores[0]?.disorder ?? 0;

    const enterprisePosture =
      highestDisorder >= 45
        ? "DISORDERED"
        : highestDisorder >= 25
          ? "MISALIGNED"
          : "DRIFTING";

    const nextLayer = enterprisePosture === "DRIFTING" ? "WATCH" : "EXECUTIVE_REPORTING";
    const authorityPacket = buildGenericAuthorityPacket({
      stage: "enterprise",
      condition: `${enterprisePosture} enterprise condition`,
      contradiction: `Highest disorder domain is ${disorderScores[0]?.label ?? "unknown"} at ${highestDisorder}.`,
      decisionText: `Decide whether the enterprise condition requires governed executive reporting.`,
      constraintText: `${domains.length} enterprise domains submitted.`,
      costOfDelayText: highestDisorder >= 25 ? "Structural drag is already visible in at least one commercial domain." : "Delay risks letting drift normalize.",
      stakeholderText: organisation,
      affectedDomain: disorderScores[0]?.label ?? "enterprise",
      firstMove: highestDisorder >= 25
        ? `Stabilise ${disorderScores[0]?.label ?? "the hottest domain"} before launching new discretionary work.`
        : "Set a monitoring checkpoint before the next operating cycle.",
      skippedConsequence: "Enterprise drag remains abstract and unpriced.",
      escalationCondition: nextLayer === "EXECUTIVE_REPORTING"
        ? "Escalate because enterprise posture is no longer drifting."
        : "Escalate if another domain crosses the disorder threshold.",
      riskScore: Math.min(100, highestDisorder * 1.6),
      formula: "highest domain disorder x 1.6",
      reasoning: [
        `Highest disorder: ${highestDisorder}`,
        `Enterprise posture: ${enterprisePosture}`,
        `Heat domains: ${disorderScores.slice(0, 4).map((x) => x.label).join(", ")}`,
      ],
      confidence: domains.length >= 4 ? 0.68 : 0.54,
      payload: { domains: disorderScores, nextLayer },
    });
    const result = {
      ok: true,
      organisation,
      enterprisePosture,
      heatDomains: disorderScores.slice(0, 4).map((x) => x.label),
      nextLayer,
      domains: disorderScores,
    };

    await persistDiagnosticStage({
      email,
      organisation,
      stage: "enterprise",
      payload: result,
      tensions: result.heatDomains,
      routeDecision: { nextLayer, enterprisePosture },
      evidenceNodes: authorityPacket.nodes,
      decisionObject: authorityPacket.decisionObject,
      snapshot: {
        timestamp: new Date().toISOString(),
        stage: "enterprise",
        coreMetrics: { highestDisorder },
        tensions: result.heatDomains,
        escalationLevel: nextLayer === "EXECUTIVE_REPORTING" ? 3 : 1,
        directive: nextLayer,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[ENTERPRISE_ASSESSMENT_RUN_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run enterprise assessment." },
      { status: 500 },
    );
  }
}
