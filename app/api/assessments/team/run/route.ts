// app/api/assessments/team/run/route.ts
import { NextResponse } from "next/server";
import { persistDiagnosticStage } from "@/lib/diagnostics/journey-store";

type TeamRow = {
  teamName: string;
  respondents: number;
  authorityClarity: number;
  executionTrust: number;
  operatingFriction: number;
  strategicCoherence: number;
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
    const rows = Array.isArray(body?.rows) ? (body.rows as TeamRow[]) : [];

    if (!email) {
      return NextResponse.json({ ok: false, error: "Email is required." }, { status: 400 });
    }

    if (rows.length < 2) {
      return NextResponse.json(
        { ok: false, error: "At least two team rows are required." },
        { status: 400 },
      );
    }

    const trustValues = rows.map((r) => n(r.executionTrust));
    const clarityValues = rows.map((r) => n(r.authorityClarity));
    const frictionValues = rows.map((r) => n(r.operatingFriction));

    // ✅ Safe calculation with empty array fallbacks
    const maxClarity = clarityValues.length > 0 ? Math.max(...clarityValues) : 0;
    const minClarity = clarityValues.length > 0 ? Math.min(...clarityValues) : 0;
    const varianceIndex = Math.round(maxClarity - minClarity);

    const maxTrust = trustValues.length > 0 ? Math.max(...trustValues) : 0;
    const minTrust = trustValues.length > 0 ? Math.min(...trustValues) : 0;
    const trustGap = Math.round(maxTrust - minTrust);

    const avgFriction = frictionValues.length > 0
      ? Math.round(frictionValues.reduce((a, b) => a + b, 0) / frictionValues.length)
      : 0;

    const nextLayer =
      varianceIndex >= 20 || trustGap >= 20 || avgFriction >= 65
        ? "EXECUTIVE_REPORTING"
        : "CONSTITUTIONAL";

    const result = {
      ok: true,
      organisation,
      varianceIndex,
      trustGap,
      avgFriction,
      nextLayer,
      teams: rows.map((row) => ({
        teamName: row.teamName,
        respondents: row.respondents,
        authorityClarity: row.authorityClarity,
        executionTrust: row.executionTrust,
        operatingFriction: row.operatingFriction,
        strategicCoherence: row.strategicCoherence,
      })),
      methodology: {
        mode: "leader_estimate",
        confidence: rows.reduce((sum, row) => sum + n(row.respondents), 0) >= 3 ? 45 : 25,
        note: "Leader-estimate mode: lower confidence than tokenized multi-respondent campaign mode.",
      },
    };

    await persistDiagnosticStage({
      email,
      organisation,
      stage: "team",
      payload: result,
      tensions: [
        varianceIndex >= 20 ? "team variance" : "",
        trustGap >= 20 ? "trust gap" : "",
        avgFriction >= 65 ? "operating friction" : "",
      ].filter(Boolean),
      routeDecision: { nextLayer },
      snapshot: {
        timestamp: new Date().toISOString(),
        stage: "team",
        coreMetrics: { varianceIndex, trustGap, avgFriction },
        tensions: [varianceIndex >= 20 ? "team variance" : "", trustGap >= 20 ? "trust gap" : ""].filter(Boolean),
        escalationLevel: nextLayer === "EXECUTIVE_REPORTING" ? 2 : 1,
        directive: nextLayer,
      },
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("[TEAM_ASSESSMENT_RUN_ERROR]", error);
    return NextResponse.json(
      { ok: false, error: "Failed to run team assessment." },
      { status: 500 },
    );
  }
}
