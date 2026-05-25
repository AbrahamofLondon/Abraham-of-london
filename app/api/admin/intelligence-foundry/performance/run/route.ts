// POST /api/admin/intelligence-foundry/performance/run
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { requireAdminAppRoute } from "@/lib/access/require-admin-app";
import { ENGINE_REGISTRY } from "@/lib/research/engine-registry";
import { fastDiagnosticAdapter } from "@/lib/research/engines/fast-diagnostic-adapter";
import { patternRecurrenceAdapter } from "@/lib/research/engines/pattern-recurrence-adapter";
import type { Finding } from "@/lib/research/foundry-contract";

const ADAPTERS: Record<string, { run: Function }> = {
  "fast-diagnostic": fastDiagnosticAdapter,
  "pattern-recurrence": patternRecurrenceAdapter,
};

const DEFAULT_FIXTURES: Record<string, Record<string, unknown>> = {
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
};

export async function POST(request: NextRequest) {
  const auth = await requireAdminAppRoute();
  if (!auth.authorized) return auth.response;

  try {
    const body = await request.json();
    const engineId: string = body.engineId ?? "";
    const iterations: number = Math.min(Math.max(1, Number(body.iterations ?? 5)), 25);

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

    // Run iterations
    const timings: number[] = [];
    const allFindings: Finding[] = [];

    for (let i = 0; i < iterations; i++) {
      const iterStart = Date.now();
      const result = await adapter.run({ payload: fixture });
      const elapsed = Date.now() - iterStart;

      timings.push(elapsed);
      if (result.findings) {
        allFindings.push(
          ...result.findings.map((f: any) => ({ ...f, id: `${f.id}-iter-${i}` }))
        );
      }

      // Safety: max 10 seconds total
      if (timings.reduce((a, b) => a + b, 0) > 10000) {
        break;
      }
    }

    // Compute stats
    if (timings.length === 0) {
      return NextResponse.json(
        { ok: false, error: "No iterations completed — engine produced no timing data" },
        { status: 500 }
      );
    }

    const sorted = [...timings].sort((a, b) => a - b);
    const totalMs = timings.reduce((a, b) => a + b, 0);
    const minMs = sorted[0]!;
    const maxMs = sorted[sorted.length - 1]!;
    const avgMs = totalMs / sorted.length;
    const p95Index = Math.ceil(sorted.length * 0.95) - 1;
    const p95Ms = sorted[Math.max(0, p95Index)]!;
    const timeoutRisk = maxMs > 2000;

    const findings: Finding[] = [
      {
        id: `perf-p95-${Date.now()}`,
        title: `P95: ${p95Ms.toFixed(1)}ms (${sorted.length} iterations)`,
        description: `Engine ${engine.name} (${engineId}) over ${sorted.length} iterations.`,
        severity: p95Ms > 1000 ? "HIGH" : p95Ms > 500 ? "MEDIUM" : "INFO",
        source: "performance-range::run::p95-calculation",
        evidence: `Timings: ${timings.map((t) => `${t.toFixed(0)}ms`).join(", ")}`,
        remediation: p95Ms > 1000 ? "Investigate engine performance. Consider caching or optimisation." : undefined,
      },
      {
        id: `perf-timeout-${Date.now()}`,
        title: timeoutRisk ? "Timeout risk detected" : "No timeout risk",
        description: timeoutRisk
          ? `Max execution time ${maxMs.toFixed(0)}ms exceeds 2000ms threshold.`
          : `All iterations completed within safe limits (max ${maxMs.toFixed(0)}ms).`,
        severity: timeoutRisk ? "HIGH" : "INFO",
        source: "performance-range::run::timeout-detection",
        evidence: `Max: ${maxMs.toFixed(0)}ms, threshold: 2000ms`,
      },
    ];

    return NextResponse.json({
      ok: true,
      result: {
        engineId,
        engineName: engine.name,
        iterations: sorted.length,
        minMs: Math.round(minMs * 10) / 10,
        avgMs: Math.round(avgMs * 10) / 10,
        p95Ms: Math.round(p95Ms * 10) / 10,
        maxMs: Math.round(maxMs * 10) / 10,
        totalMs,
        timeoutRisk,
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
