// POST /api/admin/intelligence-foundry/performance/run
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ENGINE_REGISTRY } from "@/lib/research/engine-registry";
import { fastDiagnosticAdapter } from "@/lib/research/engines/fast-diagnostic-adapter";
import { patternRecurrenceAdapter } from "@/lib/research/engines/pattern-recurrence-adapter";
import { constitutionalDiagnosticAdapter } from "@/lib/research/engines/constitutional-diagnostic-adapter";
import { strategyRoomAdapter } from "@/lib/research/engines/strategy-room-adapter";
import { clampIterations, computeStats, MAX_TOTAL_MS } from "@/lib/research/performance-range-service";
import type { Finding } from "@/lib/research/foundry-contract";

const ADAPTERS: Record<string, { run: (input: { payload: Record<string, unknown> }) => Promise<unknown> }> = {
  "fast-diagnostic": fastDiagnosticAdapter,
  "pattern-recurrence": patternRecurrenceAdapter,
  "constitutional-diagnostic": constitutionalDiagnosticAdapter,
  "strategy-room": strategyRoomAdapter,
};

const DEFAULT_FIXTURES: Record<string, Record<string, unknown>> = {
  "constitutional-diagnostic": {
    answers: {
      q1: { resonance: 6, certainty: 7 },
      q2: { resonance: 4, certainty: 5 },
      q3: { resonance: 7, certainty: 6 },
      q4: { resonance: 5, certainty: 5 },
      q5: { resonance: 6, certainty: 8 },
      q6: { resonance: 4, certainty: 6 },
      q7: { resonance: 5, certainty: 7 },
      q8: { resonance: 8, certainty: 9 },
      q9: { resonance: 6, certainty: 5 },
      q10: { resonance: 7, certainty: 6 },
    },
  },
  "fast-diagnostic": {
    fixture: {
      answers: [
        { sectionId: "authority", questionId: "q1", prompt: "Decision clarity?", value: 4 },
        { sectionId: "authority", questionId: "q2", prompt: "Ownership clear?", value: 3 },
        { sectionId: "execution", questionId: "q3", prompt: "Prior attempt?", value: 2 },
        { sectionId: "execution", questionId: "q4", prompt: "Clear execution path?", value: 4 },
        { sectionId: "governance", questionId: "q5", prompt: "Governance controls?", value: 3 },
        { sectionId: "governance", questionId: "q6", prompt: "Escalation defined?", value: 4 },
      ],
    },
  },
  "pattern-recurrence": {
    baseline: {
      contradictions: ["Ownership ambiguity", "Resource conflict", "Timeline pressure"],
      decisionKeys: ["Hire decision", "Budget allocation", "Vendor selection"],
      authorityFailures: ["CEO override"],
    },
    current: {
      contradictions: ["Ownership ambiguity", "Timeline dispute"],
      decisionKeys: ["Hire decision", "Budget allocation"],
      authorityFailures: ["CEO override", "Board bypass"],
    },
  },
  "strategy-room": {
    useDefaultFixture: true,
  },
};

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const engineId: string = body.engineId ?? "";
    const iterations: number = clampIterations(body.iterations ?? 5);

    // Validate engine exists and is callable
    const engine = ENGINE_REGISTRY.find((e) => e.id === engineId);
    if (!engine) {
      return NextResponse.json({ ok: false, error: `Engine not found: ${engineId}` }, { status: 404 });
    }
    if (engine.status !== "PRODUCTION_CALLABLE") {
      return NextResponse.json(
        { ok: false, error: `Engine ${engineId} is ${engine.status} — not callable` },
        { status: 400 }
      );
    }

    // Get adapter or use generic self-test
    const adapter = ADAPTERS[engineId];
    const fixture = DEFAULT_FIXTURES[engineId];

    if (!adapter || !fixture) {
      return NextResponse.json(
        { ok: false, error: `No adapter or fixture available for ${engineId}. Performance Range requires a Foundry adapter.` },
        { status: 400 }
      );
    }

    // Run iterations — time-capped at MAX_TOTAL_MS (10s)
    const timings: number[] = [];
    let totalElapsed = 0;
    for (let i = 0; i < iterations; i++) {
      const iterStart = Date.now();
      await adapter.run({ payload: fixture });
      const iterMs = Date.now() - iterStart;
      timings.push(iterMs);
      totalElapsed += iterMs;
      if (totalElapsed >= MAX_TOTAL_MS) break;
    }

    if (timings.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No iterations completed — engine produced no timing data" },
        { status: 500 }
      );
    }

    const stats = computeStats(timings);

    const findings: Finding[] = [
      {
        id: `perf-p95-${Date.now()}`,
        title: `P95: ${stats.p95Ms.toFixed(1)}ms (${stats.completedIterations} iterations)`,
        description: `Engine ${engine.name} (${engineId}) over ${stats.completedIterations} iterations.`,
        severity: stats.p95Ms > 1000 ? "HIGH" : stats.p95Ms > 500 ? "MEDIUM" : "INFO",
        source: "performance-range::run::p95-calculation",
        evidence: `Timings: ${timings.map((t) => `${t.toFixed(0)}ms`).join(", ")}`,
        remediation: stats.p95Ms > 1000 ? "Investigate engine performance. Consider caching or optimisation." : undefined,
      },
      {
        id: `perf-timeout-${Date.now()}`,
        title: stats.timeoutRisk ? "Timeout risk detected" : "No timeout risk",
        description: stats.timeoutRisk
          ? `Max execution time ${stats.maxMs.toFixed(0)}ms exceeds 2000ms threshold.`
          : `All iterations completed within safe limits (max ${stats.maxMs.toFixed(0)}ms).`,
        severity: stats.timeoutRisk ? "HIGH" : "INFO",
        source: "performance-range::run::timeout-detection",
        evidence: `Max: ${stats.maxMs.toFixed(0)}ms, threshold: 2000ms`,
      },
    ];

    return NextResponse.json({
      ok: true,
      result: {
        engineId,
        engineName: engine.name,
        iterations: stats.completedIterations,
        minMs: stats.minMs,
        avgMs: stats.avgMs,
        p95Ms: stats.p95Ms,
        maxMs: stats.maxMs,
        totalMs: stats.totalMs,
        timeoutRisk: stats.timeoutRisk,
        findings,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Performance run failed" },
      { status: 500 }
    );
  }
}
